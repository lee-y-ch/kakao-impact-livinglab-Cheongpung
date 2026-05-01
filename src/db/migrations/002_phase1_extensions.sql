-- ─────────────────────────────────────────────────────────────
-- 강화유니버스 대시보드 — Phase 1 스키마 확장
--
-- 001_initial.sql 이후 CLAUDE.md 개정(4월 23일)으로 추가된 필드/테이블을
-- 분리해서 적용한다. 001 은 Supabase 에 이미 적용됐으므로 멱등(idempotent)하게 작성.
--
-- 추가 사항:
--   1. auth_events 테이블 (모든 로그인/로그아웃/권한 변경 감사 로그)
--   2. shop_owners.failed_attempts / locked_until (실패 잠금)
--   3. activities.idempotency_key / reported_at / removed_at / face_consent
--   4. episodes.status (planned | in_progress | completed)
--   5. projects.progress_type / progress_target (진척도 계산 기준)
--   6. reactions.visibility (public | private) + reactions.author_role 정책화
--   7. contribution_* 는 'user' subject_type 허용하되 UI 비노출 원칙은 애플리케이션 레벨
--   8. 역할 체크용 보조 함수 — is_admin() (app_metadata 기반)
--   9. RLS 추가: 관리자 권한으로 전체 read/write 통과
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 1. auth_events — 감사 로그
-- ─────────────────────────────────────────────────────────────
create table if not exists public.auth_events (
  id              bigserial primary key,
  event_type      text not null,            -- login_success | login_failure | logout | lockout | role_change
  actor_role      text not null,            -- participant | crew | owner | admin | anonymous
  subject_key     text,                     -- auth.users.id (uuid) / shop_owner_id / crew_session_id 식별자
  shop_id         uuid references public.shops(id) on delete set null,
  ip_address      text,
  user_agent      text,
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists auth_events_subject_idx  on public.auth_events(subject_key);
create index if not exists auth_events_type_idx     on public.auth_events(event_type);
create index if not exists auth_events_created_idx  on public.auth_events(created_at desc);

comment on table public.auth_events is '인증/권한 감사 로그. 클라이언트 직접 접근 금지.';

alter table public.auth_events enable row level security;
-- policy 미정의 → anon/authenticated 접근 차단. service role 만 쓰기 가능.

-- ─────────────────────────────────────────────────────────────
-- 2. shop_owners: 실패 잠금 컬럼
-- ─────────────────────────────────────────────────────────────
alter table public.shop_owners
  add column if not exists failed_attempts int not null default 0,
  add column if not exists locked_until    timestamptz;

-- ─────────────────────────────────────────────────────────────
-- 3. activities: 중복 방지 + 모더레이션 + 초상권
-- ─────────────────────────────────────────────────────────────
alter table public.activities
  add column if not exists idempotency_key uuid,
  add column if not exists reported_at     timestamptz,
  add column if not exists removed_at      timestamptz,
  add column if not exists face_consent    boolean not null default false;

-- 클라이언트 재전송 중복만 차단 (NULL 허용 + partial unique)
create unique index if not exists activities_idempotency_unique
  on public.activities(user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists activities_reported_idx
  on public.activities(reported_at)
  where reported_at is not null and removed_at is null;

-- 공개 인덱스 조건 갱신 — removed_at 이 set 되면 공개 영역에서 제외
-- (기존 activities_public_idx 는 is_public=true 만 봄. 쿼리 쪽에서 removed_at is null 조건 추가)

-- ─────────────────────────────────────────────────────────────
-- 4. episodes.status
-- ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'episode_status') then
    create type public.episode_status as enum ('planned', 'in_progress', 'completed');
  end if;
end $$;

alter table public.episodes
  add column if not exists status public.episode_status not null default 'planned';

create index if not exists episodes_status_idx on public.episodes(status);

-- ─────────────────────────────────────────────────────────────
-- 5. projects.progress_type / progress_target
-- ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'progress_type') then
    create type public.progress_type as enum ('time', 'event', 'goal', 'mixed');
  end if;
end $$;

alter table public.projects
  add column if not exists progress_type   public.progress_type not null default 'time',
  add column if not exists progress_target jsonb not null default '{}'::jsonb;

comment on column public.projects.progress_target is
  'progress_type 별 구조: time={start_date,end_date}, event={total_episodes}, goal={target_cards|target_participants}, mixed=복합';

-- ─────────────────────────────────────────────────────────────
-- 6. reactions.visibility
-- ─────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'reaction_visibility') then
    create type public.reaction_visibility as enum ('public', 'private');
  end if;
end $$;

alter table public.reactions
  add column if not exists visibility public.reaction_visibility not null default 'private';

create index if not exists reactions_visibility_idx on public.reactions(visibility);

-- 기존 "reactions follow activity select" 정책은 activity 접근권만 보지만,
-- 공개 reaction 은 activity 공개 여부와 별개로 외부에 노출될 수 있음.
-- 정책 보강: activity 가 public 이면 public reaction 은 누구나 읽기.
drop policy if exists "reactions public read" on public.reactions;
create policy "reactions public read" on public.reactions
  for select using (
    visibility = 'public'
    and exists (
      select 1 from public.activities a
      where a.id = reactions.activity_id and a.is_public = true and a.removed_at is null
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7. is_admin() 보조 함수 + 관리자 RLS 바이패스 정책
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

comment on function public.is_admin() is
  '요청자의 JWT app_metadata.role = admin 여부. Supabase Auth 발급 JWT 기준.';

-- 관리자는 모든 도메인 테이블 read/write 허용
-- (service role 은 RLS 우회하므로 정책과 무관하지만, 관리자 Supabase Auth 세션은 여기에 의존)

drop policy if exists "admin full access users" on public.users;
create policy "admin full access users" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access projects" on public.projects;
create policy "admin full access projects" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access project_hosts" on public.project_hosts;
create policy "admin full access project_hosts" on public.project_hosts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access episodes" on public.episodes;
create policy "admin full access episodes" on public.episodes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access episode_archives" on public.episode_archives;
create policy "admin full access episode_archives" on public.episode_archives
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access shops" on public.shops;
create policy "admin full access shops" on public.shops
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access shop_owners" on public.shop_owners;
create policy "admin full access shop_owners" on public.shop_owners
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access activities" on public.activities;
create policy "admin full access activities" on public.activities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access artifacts" on public.artifacts;
create policy "admin full access artifacts" on public.artifacts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access reactions" on public.reactions;
create policy "admin full access reactions" on public.reactions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access contribution_points" on public.contribution_points;
create policy "admin full access contribution_points" on public.contribution_points
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access contribution_log" on public.contribution_log;
create policy "admin full access contribution_log" on public.contribution_log
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access page_views" on public.page_views;
create policy "admin full access page_views" on public.page_views
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin full access auth_events" on public.auth_events;
create policy "admin full access auth_events" on public.auth_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 8. activities: removed_at 이 set 이면 공개 영역에서 제외되도록 public select 재작성
-- ─────────────────────────────────────────────────────────────
drop policy if exists "activities public read" on public.activities;
create policy "activities public read" on public.activities
  for select using (is_public = true and removed_at is null);

-- artifacts 도 동일 효과 유지 (activity public + removed_at is null 통한 join)
drop policy if exists "artifacts follow activity select" on public.artifacts;
create policy "artifacts follow activity select" on public.artifacts
  for select using (
    exists (
      select 1 from public.activities a
      left join public.users u on u.id = a.user_id
      where a.id = artifacts.activity_id
        and (
          (a.is_public = true and a.removed_at is null)
          or u.auth_user_id = auth.uid()
        )
    )
  );

drop policy if exists "reactions follow activity select" on public.reactions;
create policy "reactions follow activity select" on public.reactions
  for select using (
    exists (
      select 1 from public.activities a
      left join public.users u on u.id = a.user_id
      where a.id = reactions.activity_id
        and (
          (a.is_public = true and a.removed_at is null)
          or u.auth_user_id = auth.uid()
        )
    )
  );
