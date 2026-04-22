-- ─────────────────────────────────────────────────────────────
-- 강화유니버스 대시보드 — 초기 스키마 (Phase 1)
--
-- 계층:
--   강화유니버스 (플랫폼)
--     └─ categories (4종: 환대의 공유지 / 환대의 네트워크 / 환대의 세계 / 환대의 정책)
--           └─ projects (예: 강화유니버스×시부야대학 교류, 다년간 지속 가능)
--                 ├─ project_hosts (청풍, 외부 파트너 — 시부야대학 등)
--                 └─ episodes (회차 = session, 한 프로젝트 안의 n번째 만남)
--                       ├─ episode_archives (후기·사진·기록 링크)
--                       └─ activities (참여자의 행위 — 카드 1장 = 행위 1건)
--                             └─ artifacts (결과물: 사진/메모/워크숍 산출물)
--
--   shops (독립 엔티티, 프로젝트에 느슨하게 연결 가능)
--   reactions (크루·사장님·참여자가 서로의 행위에 남기는 응원)
--   users (카카오 로그인 참여자)
--   contribution_points / contribution_log (누적 지표)
--   page_views (익명 조회 로그)
--
-- 두 주인공 (two protagonists, one data):
--   - 참여자 뷰 = "내가 쌓은 행위" (collection/dashboard)
--   - 청풍 뷰   = "강화도가 얼마나 강화됐나" (admin dashboard, node map)
--   같은 activities 테이블을 서로 다른 쿼리·렌더링으로 조회할 뿐.
-- ─────────────────────────────────────────────────────────────

-- Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. users (참여자 — 카카오 로그인)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                 uuid primary key default uuid_generate_v4(),
  auth_user_id       uuid unique references auth.users(id) on delete cascade,
  kakao_id           text unique,
  nickname           text not null,
  profile_image_url  text,
  created_at         timestamptz not null default now()
);

comment on table public.users is '참여자 프로필. Supabase Auth 의 auth.users 와 1:1 매칭.';

-- ─────────────────────────────────────────────────────────────
-- 2. categories (4종 고정)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,        -- commons | network | world | policy
  name         text not null,               -- 환대의 공유지 등
  description  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. projects (장기 프로젝트 단위)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid not null references public.categories(id) on delete restrict,
  slug          text unique not null,
  title         text not null,
  summary       text,
  description   text,
  cover_url     text,
  started_at    date,                       -- 프로젝트 시작 (예: 2024-xx)
  ended_at      date,                       -- null 이면 진행중
  is_public     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_category_idx on public.projects(category_id);

-- ─────────────────────────────────────────────────────────────
-- 4. project_hosts (주관·파트너 — 청풍, 시부야대학 등)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.project_hosts (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,                -- "협동조합 청풍", "시부야대학" 등
  role        text not null default 'host', -- host | partner | guest
  website_url text,
  logo_url    text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists project_hosts_project_idx on public.project_hosts(project_id);

-- ─────────────────────────────────────────────────────────────
-- 5. episodes (회차/세션 — 프로젝트 안의 n번째 만남)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.episodes (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  seq           int,                        -- 1회차, 2회차 ... (nullable: 수시 이벤트)
  title         text not null,
  summary       text,
  session_date  date,                       -- 실제 진행일
  location      text,
  is_public     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists episodes_project_idx on public.episodes(project_id);
create index if not exists episodes_session_date_idx on public.episodes(session_date);

-- ─────────────────────────────────────────────────────────────
-- 6. episode_archives (후기/사진/기록 링크)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.episode_archives (
  id          uuid primary key default uuid_generate_v4(),
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  kind        text not null,                -- note | photo | link | doc
  title       text,
  body        text,
  url         text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists episode_archives_episode_idx on public.episode_archives(episode_id);

-- ─────────────────────────────────────────────────────────────
-- 7. shops (가게 — 독립 엔티티, 프로젝트와는 활동 단위로 연결)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.shops (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  description          text,
  address              text,
  lat                  double precision,
  lng                  double precision,
  qr_token             text unique,
  is_public            boolean not null default true,

  -- 카드/프로필 디자인 (가게별 고유)
  theme_color          text,
  accent_color         text,
  card_background_url  text,
  slogan               text,
  frame_style          text not null default 'simple',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 사장님 로그인 (가게 코드)
create table if not exists public.shop_owners (
  id               uuid primary key default uuid_generate_v4(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  name             text not null,
  owner_code_hash  text not null,           -- bcrypt
  last_login_at    timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists shop_owners_shop_idx on public.shop_owners(shop_id);

-- ─────────────────────────────────────────────────────────────
-- 8. activities (참여자 행위 = 카드 1장)
--   같은 episode 에서 여러 번 참여 → 여러 activity (의도된 설계, unique 없음)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,

  -- 맥락 (세 가지 중 최소 하나 — 앱 레이어에서 검증)
  episode_id      uuid references public.episodes(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  shop_id         uuid references public.shops(id) on delete set null,

  -- 행위 타입
  type            text not null,            -- memo | photo | check_in | workshop | hi_five | artifact | archive_link
  title           text,
  body            text,                     -- 한 줄 메모 / 간단 설명
  photo_url       text,                     -- 단일 대표 사진 (복수는 artifacts 로)
  meta            jsonb not null default '{}'::jsonb,

  -- 공개 설정 (게임 규칙 ③ 기본 비공개 + opt-in)
  is_public       boolean not null default false,

  created_at      timestamptz not null default now()
);

create index if not exists activities_user_idx        on public.activities(user_id);
create index if not exists activities_episode_idx     on public.activities(episode_id);
create index if not exists activities_project_idx     on public.activities(project_id);
create index if not exists activities_shop_idx        on public.activities(shop_id);
create index if not exists activities_type_idx        on public.activities(type);
create index if not exists activities_created_at_idx  on public.activities(created_at desc);
create index if not exists activities_public_idx      on public.activities(is_public) where is_public = true;

comment on table public.activities is '참여자의 행위 단위. 같은 에피소드에 여러 건 허용 (unique 없음).';

-- ─────────────────────────────────────────────────────────────
-- 9. artifacts (활동의 결과물 — 복수 파일/링크)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.artifacts (
  id            uuid primary key default uuid_generate_v4(),
  activity_id   uuid not null references public.activities(id) on delete cascade,
  kind          text not null,              -- image | audio | video | link | text
  url           text,
  caption       text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists artifacts_activity_idx on public.artifacts(activity_id);

-- ─────────────────────────────────────────────────────────────
-- 10. reactions (응원·편지 — 크루/사장님/참여자 상호)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id              uuid primary key default uuid_generate_v4(),
  activity_id     uuid not null references public.activities(id) on delete cascade,

  author_user_id  uuid references public.users(id) on delete set null,
  author_shop_id  uuid references public.shops(id) on delete set null,
  author_role     text not null,            -- participant | crew | owner | admin
  author_label    text,                     -- 표시명 (닉네임/가게명/크루명)

  kind            text not null,            -- hi_five | letter | note
  body            text,
  llm_draft       text,                     -- 사장님 편지 LLM 원본 (수정 추적)

  scheduled_at    timestamptz,              -- 시차 발송 (풀버전)
  sent_at         timestamptz not null default now(),
  read_at         timestamptz,

  created_at      timestamptz not null default now()
);

create index if not exists reactions_activity_idx on public.reactions(activity_id);
create index if not exists reactions_author_user_idx on public.reactions(author_user_id);
create index if not exists reactions_author_shop_idx on public.reactions(author_shop_id);
create index if not exists reactions_kind_idx on public.reactions(kind);

-- ─────────────────────────────────────────────────────────────
-- 11. contribution_points (누적 지표 — 참여자/가게/프로젝트별)
--   "오늘도 강화도가 조금씩 더 강화됩니다" 카운터의 백엔드
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contribution_points (
  id             uuid primary key default uuid_generate_v4(),
  subject_type   text not null,             -- user | shop | project | category | platform
  subject_id     uuid,                      -- subject_type='platform' 이면 null
  total_points   int not null default 0,
  total_actions  int not null default 0,
  updated_at     timestamptz not null default now(),
  unique (subject_type, subject_id)
);

create table if not exists public.contribution_log (
  id            bigserial primary key,
  activity_id   uuid references public.activities(id) on delete set null,
  reaction_id   uuid references public.reactions(id) on delete set null,
  subject_type  text not null,
  subject_id    uuid,
  delta_points  int not null,
  reason        text,
  created_at    timestamptz not null default now()
);

create index if not exists contribution_log_subject_idx on public.contribution_log(subject_type, subject_id);
create index if not exists contribution_log_activity_idx on public.contribution_log(activity_id);

-- ─────────────────────────────────────────────────────────────
-- 12. page_views (익명 조회 로그)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.page_views (
  id              bigserial primary key,
  path            text not null,
  project_id      uuid references public.projects(id) on delete set null,
  episode_id      uuid references public.episodes(id) on delete set null,
  shop_id         uuid references public.shops(id) on delete set null,
  viewer_session  text,                     -- 익명 세션 해시
  viewed_at       timestamptz not null default now()
);

create index if not exists page_views_shop_idx on public.page_views(shop_id);
create index if not exists page_views_project_idx on public.page_views(project_id);
create index if not exists page_views_episode_idx on public.page_views(episode_id);
create index if not exists page_views_viewed_at_idx on public.page_views(viewed_at desc);

-- ─────────────────────────────────────────────────────────────
-- updated_at 트리거
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists episodes_set_updated_at on public.episodes;
create trigger episodes_set_updated_at
  before update on public.episodes
  for each row execute function public.set_updated_at();

drop trigger if exists shops_set_updated_at on public.shops;
create trigger shops_set_updated_at
  before update on public.shops
  for each row execute function public.set_updated_at();

-- ═════════════════════════════════════════════════════════════
-- RLS 정책 (처음부터 적용)
--
-- 원칙:
--   - 공개 엔티티 (categories/projects/project_hosts/episodes/shops)
--     → 모두 select 허용, write 는 서비스 롤만
--   - activities / artifacts
--     → 본인은 전체 select, 공개본은 익명 select
--     → 본인만 insert/update/delete (본인 user_id = auth.uid() 매핑)
--   - reactions
--     → activity 를 볼 수 있는 사람은 reactions 도 볼 수 있음
--     → 작성은 인증 필요 + 작성자 author_* 본인 검증은 서버 코드에서
--   - users
--     → 본인 row 만 select/update, 익명은 공개 닉네임만 (뷰 필요 시 추가)
--   - shop_owners / contribution_* / page_views
--     → 클라이언트 직접 접근 막고 서비스 롤 또는 서버 라우트에서만
--
-- 서비스 롤 키는 RLS 를 우회하므로, 관리자 API/시드 스크립트는
-- SUPABASE_SERVICE_ROLE_KEY 를 사용하는 서버 클라이언트로 실행할 것.
-- ═════════════════════════════════════════════════════════════

-- 모든 도메인 테이블 RLS 활성화
alter table public.users               enable row level security;
alter table public.categories          enable row level security;
alter table public.projects            enable row level security;
alter table public.project_hosts       enable row level security;
alter table public.episodes            enable row level security;
alter table public.episode_archives    enable row level security;
alter table public.shops               enable row level security;
alter table public.shop_owners         enable row level security;
alter table public.activities          enable row level security;
alter table public.artifacts           enable row level security;
alter table public.reactions           enable row level security;
alter table public.contribution_points enable row level security;
alter table public.contribution_log    enable row level security;
alter table public.page_views          enable row level security;

-- ── users ──────────────────────────────────────────────────
drop policy if exists "users self select"   on public.users;
drop policy if exists "users self update"   on public.users;
drop policy if exists "users self insert"   on public.users;

create policy "users self select" on public.users
  for select using (auth.uid() = auth_user_id);

create policy "users self update" on public.users
  for update using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create policy "users self insert" on public.users
  for insert with check (auth.uid() = auth_user_id);

-- ── categories / projects / project_hosts / episodes ──────
-- 공개 read, write 는 서비스 롤만
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories
  for select using (true);

drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects
  for select using (is_public = true);

drop policy if exists "project_hosts public read" on public.project_hosts;
create policy "project_hosts public read" on public.project_hosts
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_hosts.project_id and p.is_public = true
    )
  );

drop policy if exists "episodes public read" on public.episodes;
create policy "episodes public read" on public.episodes
  for select using (
    is_public = true
    and exists (
      select 1 from public.projects p
      where p.id = episodes.project_id and p.is_public = true
    )
  );

drop policy if exists "episode_archives public read" on public.episode_archives;
create policy "episode_archives public read" on public.episode_archives
  for select using (
    exists (
      select 1 from public.episodes e
      where e.id = episode_archives.episode_id and e.is_public = true
    )
  );

-- ── shops ─────────────────────────────────────────────────
drop policy if exists "shops public read" on public.shops;
create policy "shops public read" on public.shops
  for select using (is_public = true);

-- shop_owners: 클라이언트 직접 접근 차단. (서비스 롤만)
-- 어떤 policy 도 만들지 않으면 RLS enabled 상태에서 anon/authenticated 는 접근 불가.

-- ── activities ────────────────────────────────────────────
-- 본인 전체 select
drop policy if exists "activities self select" on public.activities;
create policy "activities self select" on public.activities
  for select using (
    exists (
      select 1 from public.users u
      where u.id = activities.user_id and u.auth_user_id = auth.uid()
    )
  );

-- 공개본은 익명도 select
drop policy if exists "activities public read" on public.activities;
create policy "activities public read" on public.activities
  for select using (is_public = true);

-- 본인만 insert
drop policy if exists "activities self insert" on public.activities;
create policy "activities self insert" on public.activities
  for insert with check (
    exists (
      select 1 from public.users u
      where u.id = activities.user_id and u.auth_user_id = auth.uid()
    )
  );

-- 본인만 update
drop policy if exists "activities self update" on public.activities;
create policy "activities self update" on public.activities
  for update using (
    exists (
      select 1 from public.users u
      where u.id = activities.user_id and u.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = activities.user_id and u.auth_user_id = auth.uid()
    )
  );

-- 본인만 delete
drop policy if exists "activities self delete" on public.activities;
create policy "activities self delete" on public.activities
  for delete using (
    exists (
      select 1 from public.users u
      where u.id = activities.user_id and u.auth_user_id = auth.uid()
    )
  );

-- ── artifacts ─────────────────────────────────────────────
drop policy if exists "artifacts follow activity select" on public.artifacts;
create policy "artifacts follow activity select" on public.artifacts
  for select using (
    exists (
      select 1 from public.activities a
      left join public.users u on u.id = a.user_id
      where a.id = artifacts.activity_id
        and (a.is_public = true or u.auth_user_id = auth.uid())
    )
  );

drop policy if exists "artifacts self write" on public.artifacts;
create policy "artifacts self write" on public.artifacts
  for all using (
    exists (
      select 1 from public.activities a
      join public.users u on u.id = a.user_id
      where a.id = artifacts.activity_id and u.auth_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.activities a
      join public.users u on u.id = a.user_id
      where a.id = artifacts.activity_id and u.auth_user_id = auth.uid()
    )
  );

-- ── reactions ─────────────────────────────────────────────
-- 읽기: activity 를 볼 수 있는 사람 = reactions 도 볼 수 있음
drop policy if exists "reactions follow activity select" on public.reactions;
create policy "reactions follow activity select" on public.reactions
  for select using (
    exists (
      select 1 from public.activities a
      left join public.users u on u.id = a.user_id
      where a.id = reactions.activity_id
        and (a.is_public = true or u.auth_user_id = auth.uid())
    )
  );

-- 쓰기: 인증된 사용자 본인 명의만. 사장님/크루/관리자 발언은 서버 라우트(service role)에서 처리.
drop policy if exists "reactions self insert" on public.reactions;
create policy "reactions self insert" on public.reactions
  for insert with check (
    author_role = 'participant'
    and exists (
      select 1 from public.users u
      where u.id = reactions.author_user_id and u.auth_user_id = auth.uid()
    )
  );

-- ── contribution_* / page_views ──────────────────────────
-- 클라이언트 직접 접근 차단. 서비스 롤(서버 라우트)만 사용.
-- (policy 미정의 → RLS enabled 상태이므로 anon/authenticated 는 접근 불가)

-- ─────────────────────────────────────────────────────────────
-- 기본 데이터 — 4개 카테고리 시드
-- ─────────────────────────────────────────────────────────────
insert into public.categories (slug, name, description, sort_order) values
  ('commons',  '환대의 공유지',   '강화도 안의 공유 자원·공간·관계를 잇는 프로젝트들',                    10),
  ('network',  '환대의 네트워크', '강화 안팎의 사람과 조직을 연결하는 교류·협업 프로젝트들 (예: 시부야대학)', 20),
  ('world',    '환대의 세계',     '환대의 정신을 담은 콘텐츠·브랜드·작품을 만드는 프로젝트들',               30),
  ('policy',   '환대의 정책',     '환대 관점으로 지역 정책·제도·공론을 제안하는 프로젝트들',                 40)
on conflict (slug) do nothing;
