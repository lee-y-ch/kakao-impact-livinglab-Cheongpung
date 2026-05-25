-- ─────────────────────────────────────────────────────────────
-- 강화유니버스 대시보드 — site_settings 테이블
--
-- 청풍 1차 피드백: "메인 배너 사진/문구를 제가 직접 수정할 수 있으면 좋겠어요"
-- → 홈페이지 hero (eyebrow / title / accent / subtitle / image) 를 DB-driven 으로
--   전환하고, /admin/site 에서 관리자가 직접 편집한다.
--
-- 설계 결정:
--   - key 컬럼으로 row 를 식별. 현재는 'hero' 하나만 존재. 추후 다른 섹션
--     (intro / faq 등) 도 같은 테이블에 row 단위로 확장 가능.
--   - 이미지는 site-assets Storage 버킷에 업로드 후 public URL 을
--     hero_image_url 에 저장.
--   - public read RLS — 홈페이지가 anon 으로 읽어야 하기 때문.
--   - write 는 RLS 차단 + 서버 route handler 에서 service role 로만 수정.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.site_settings (
  id               uuid primary key default uuid_generate_v4(),
  key              text unique not null,           -- 'hero' 등 식별자
  hero_eyebrow     text,                            -- 작은 라벨 (예: "Ganghwa Universe · 2026")
  hero_title       text,                            -- 본 제목, \n 로 줄바꿈 가능
  hero_accent      text,                            -- title 내부에서 강조할 단어 (선택)
  hero_subtitle    text,                            -- 짧은 부제, \n 로 줄바꿈 가능
  hero_image_url   text,                            -- 배경 이미지 public URL
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users(id) on delete set null
);

comment on table public.site_settings is '랜딩 페이지 등 site-wide 카피·이미지 설정. /admin/site 에서 관리자가 편집.';

-- 기본 hero 행 시드 — 현재 hardcoded 된 값과 동일하게 채워두기.
insert into public.site_settings
  (key, hero_eyebrow, hero_title, hero_accent, hero_subtitle, hero_image_url)
values
  ('hero',
   'Ganghwa Universe · 2026',
   E'환대로\n만들어가는 세계',
   '세계',
   E'우리가 살고 싶은 세계를\n강화에서 함께 실험해요.',
   '/v2/landing/hero-bg.png')
on conflict (key) do nothing;

-- RLS — public read, write 차단 (service role 로만 쓰기)
alter table public.site_settings enable row level security;

drop policy if exists "site_settings public read" on public.site_settings;
create policy "site_settings public read"
on public.site_settings for select
to anon, authenticated
using (true);

-- write 정책은 의도적으로 없음 — anon/authenticated 가 직접 update/insert 불가.
-- service role 은 RLS bypass 라 별도 정책 불필요.

-- updated_at 자동 갱신 트리거
create or replace function public.touch_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
before update on public.site_settings
for each row execute function public.touch_site_settings_updated_at();
