-- ─────────────────────────────────────────────────────────────
-- 강화유니버스 시연용 시드 (Phase 5/6 발표 데모)
--
-- 채워지는 페이지:
--   /, /impact, /projects, /projects/[slug], /shops, /shops/[id],
--   /feed, /collection (참여자별), /admin/{review,reports}, /owner
--
-- 출처:
--   - [2026] 강화유니버스 프로젝트 개요.pdf (4 카테고리 + 9 프로젝트)
--   - [2026] 강화유니버스 프로젝트 세부 - 1. 예시.pdf (시부야대학 회차/참가자/아카이브 링크)
--
-- 사용법 (Supabase SQL Editor):
--   001_initial.sql + 002_phase1_extensions.sql + 003_categories_realign.sql 적용 후 실행.
--   재실행해도 idempotent (DELETE … WHERE 표식 → INSERT 패턴).
--
-- 사장님 로그인 정보:
--   평문 코드는 repo 에 남기지 않는다.
--   시연 직전 청풍/팀원에게 별도 안전한 채널로 전달한다.
--   이 파일에는 bcrypt hash 만 유지한다.
--
-- 참고:
--   사진 URL 은 Unsplash 자유이용 이미지로 placeholder. 실제 시연 직전
--   Supabase Storage `activity-photos` 버킷에 업로드 후 URL 교체 권장.
-- ─────────────────────────────────────────────────────────────

begin;

-- ───────────────────────── 0. cleanup ─────────────────────────
-- demo 데이터 식별: 우리가 정한 slug / qr_token / kakao_id 패턴.
-- 자식 → 부모 순으로 삭제 (FK cascade 가 일부 처리하지만 명시적으로).

delete from public.reactions
 where activity_id in (
   select id from public.activities
    where idempotency_key in (
      select uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-' || g)
      from generate_series(1, 60) g
    )
 );

delete from public.activities
 where idempotency_key in (
   select uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-' || g)
   from generate_series(1, 60) g
 );

delete from public.episode_archives
 where episode_id in (
   select id from public.episodes
    where project_id in (
      select id from public.projects where slug like 'demo-%'
    )
 );

delete from public.episodes
 where project_id in (select id from public.projects where slug like 'demo-%');

delete from public.project_hosts
 where project_id in (select id from public.projects where slug like 'demo-%');

delete from public.projects where slug like 'demo-%';

delete from public.shop_owners
 where shop_id in (select id from public.shops where qr_token like 'demo-%');

delete from public.shops where qr_token like 'demo-%';

delete from public.users where kakao_id like 'demo-kakao-%';

-- ───────────────────────── 1. 참여자 (dummy users) ─────────────────────────
-- auth_user_id 는 null (실제 카카오 로그인 없이도 카드 author 표시용).
-- 닉네임은 PDF / 강화 톤.

insert into public.users (id, auth_user_id, kakao_id, nickname, profile_image_url) values
  ('aaaaaaaa-0000-4000-8000-000000000001', null, 'demo-kakao-1', '파도',   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000002', null, 'demo-kakao-2', '롯희',   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000003', null, 'demo-kakao-3', '단풍',   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000004', null, 'demo-kakao-4', '윤슬',   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000005', null, 'demo-kakao-5', '차완',   'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000006', null, 'demo-kakao-6', '잠수함', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop&crop=faces'),
  ('aaaaaaaa-0000-4000-8000-000000000007', null, 'demo-kakao-7', '하루',   'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces');

-- ───────────────────────── 2. 프로젝트 (8개) ─────────────────────────
-- 카테고리별 2개씩. progress_type 다양하게 (time / event / goal).

insert into public.projects (id, category_id, slug, title, summary, description, started_at, ended_at, is_public, progress_type, progress_target, cover_url) values
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    (select id from public.categories where slug = 'active_life'),
    'demo-weekend-yoga',
    '위캔드 요가 클럽',
    '강화의 자연 속에서 관계를 회복하는 주말 요가 세션',
    '도시의 압박을 잠시 내려놓고, 강화의 자연 속에서 호흡과 몸의 감각을 회복하는 시간. 기수제 운영, 매 회차 8명 내외.',
    '2025-04-01', null, true, 'event', '{"total_episodes": 6}',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000002',
    (select id from public.categories where slug = 'active_life'),
    'demo-ganghwa-farm-life',
    '강화 팜 라이프 클럽',
    '텃밭을 매개로 일상을 즐거운 놀이로 바꾸는 라이프스타일 실험',
    '강화의 작은 텃밭에서 직접 씨를 뿌리고 거두며, 자급의 즐거움을 함께 발견하는 클럽. 시즌별 4회 운영.',
    '2025-03-01', null, true, 'time', '{"start_date": "2025-03-01", "end_date": "2026-12-31"}',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000003',
    (select id from public.categories where slug = 'local_culture'),
    'demo-yunseul-album',
    '윤슬 앨범 같이 만들기',
    '강화의 소리를 채집하여 음원으로 기록하는 프로젝트',
    '바다 윤슬, 갯벌의 새, 시장의 소리. 강화의 일상에서 만나는 소리를 채집하고, 함께 곡으로 엮는 공동 창작.',
    '2025-06-01', null, true, 'goal', '{"target_cards": 80}',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000004',
    (select id from public.categories where slug = 'local_culture'),
    'demo-chawan-tea',
    '차완과 강화도 차 만들기',
    '강화의 식재료를 탐구하고 블렌딩하여 강화도만의 차를 창작',
    '강화의 약쑥, 깻잎, 인삼을 베이스로 시즌별 블렌딩을 실험하고 작은 패키지로 제작. 워크숍 + 시음회 형태.',
    '2025-09-01', null, true, 'event', '{"total_episodes": 4}',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000005',
    (select id from public.categories where slug = 'network'),
    'demo-shibuya-exchange',
    '시부야대학 교류',
    '도쿄와 강화의 로컬 커뮤니티가 서로를 탐방하고 교류하는 롱텀 프로젝트',
    '강화유니버스 × 시부야대학. 두 로컬 커뮤니티가 ''환대''를 매개로 서로의 삶과 배움을 주고받는 5년 롱텀 교류. 첫 만남은 2024년 11월, 서로의 동네를 오가며 관계를 천천히 쌓아간다.',
    '2024-11-01', null, true, 'time', '{"start_date": "2024-11-01", "end_date": "2028-12-31"}',
    '/local/shibuya/shibuya-04.jpg'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000006',
    (select id from public.categories where slug = 'network'),
    'demo-kamiyama-exchange',
    '가미야마 교류',
    '일본의 선진 로컬 사례인 가미야마와 협력하는 파트너십',
    '도쿠시마현 가미야마초의 사토미라이 재단과 협력하여, 작은 마을이 어떻게 ''환대''로 살아가는지 함께 탐구.',
    '2025-10-01', null, true, 'event', '{"total_episodes": 3}',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000007',
    (select id from public.categories where slug = 'tech'),
    'demo-local-universe-app',
    '로컬 유니버스 앱',
    '강화유니버스의 모든 활동이 연결되는 디지털 도구',
    '잠시섬 참여자가 게임형 리워드로 강화도를 탐험하는 모바일 앱. 강화유니버스 대시보드 (이 사이트) 와 데이터 연계.',
    '2026-01-01', null, true, 'goal', '{"target_participants": 200}',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=800&fit=crop'
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000008',
    (select id from public.categories where slug = 'tech'),
    'demo-ai-top-100',
    '지역 문제 해결 AI Top 100',
    '기술로 지역의 과제를 정의하고 해결책을 모색하는 실험',
    '강화 지역에서 만난 작은 문제 100개를 카드로 정리하고, AI 협업으로 빠른 프로토타입을 만드는 챌린지.',
    '2026-02-01', null, true, 'goal', '{"target_cards": 100}',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop'
  );

-- ───────────────────────── 3. project_hosts ─────────────────────────

insert into public.project_hosts (project_id, name, role, website_url) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000004', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000005', '협동조합 청풍',   'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000005', '시부야대학',     'partner',   'https://www.shibuya-univ.net/'),
  ('bbbbbbbb-0000-4000-8000-000000000006', '협동조합 청풍',   'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000006', '사토미라이 재단', 'partner',   null),
  ('bbbbbbbb-0000-4000-8000-000000000007', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/'),
  ('bbbbbbbb-0000-4000-8000-000000000008', '협동조합 청풍', 'organizer', 'https://www.instagram.com/ganghwauniverse/');

-- ───────────────────────── 4. episodes (15개) ─────────────────────────
-- 각 프로젝트 1~4 회차. 시부야대학은 PDF 기반 4 회차. status 다양.

insert into public.episodes (id, project_id, seq, title, summary, session_date, location, is_public, status) values
  -- 위캔드 요가
  ('cccccccc-0000-4000-8000-000000000101', 'bbbbbbbb-0000-4000-8000-000000000001', 1, '봄 시즌 1회차 — 갯벌 옆 모닝 요가', '강화 동막해변 일출 요가 (8명)', '2026-04-12', '동막해변', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000102', 'bbbbbbbb-0000-4000-8000-000000000001', 2, '봄 시즌 2회차 — 산뜻 하이킹 요가', '마니산 등반 후 정상 요가 (10명)', '2026-04-26', '마니산', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000103', 'bbbbbbbb-0000-4000-8000-000000000001', 3, '여름 시즌 1회차 — 풍물장터 그라운딩', '풍물장 옆 잔디밭 (예정)', '2026-06-14', '강화풍물시장', true, 'planned'),

  -- 강화 팜 라이프
  ('cccccccc-0000-4000-8000-000000000201', 'bbbbbbbb-0000-4000-8000-000000000002', 1, '씨앗 워크숍', '제철 씨앗 고르기 + 텃밭 분배', '2026-03-22', '장흥리 텃밭', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000202', 'bbbbbbbb-0000-4000-8000-000000000002', 2, '여름 김매기 모임', '땀 흘리고 점심 같이 먹기', '2026-05-30', '장흥리 텃밭', true, 'in_progress'),

  -- 윤슬 앨범
  ('cccccccc-0000-4000-8000-000000000301', 'bbbbbbbb-0000-4000-8000-000000000003', 1, '소리 채집 — 갯벌의 아침', '동막 갯벌 새소리 / 발자국 / 바람', '2026-04-19', '동막갯벌', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000302', 'bbbbbbbb-0000-4000-8000-000000000003', 2, '소리 채집 — 시장의 오후', '풍물장 호객 / 손님 / 흥정', '2026-05-17', '강화풍물시장', true, 'in_progress'),

  -- 차완 차 만들기
  ('cccccccc-0000-4000-8000-000000000401', 'bbbbbbbb-0000-4000-8000-000000000004', 1, '약쑥 블렌딩 시음회', '봄 약쑥 + 깻잎 베이스', '2026-04-05', '교동 책방 두번째 지구', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000402', 'bbbbbbbb-0000-4000-8000-000000000004', 2, '여름 차 시음회', '인삼 + 박하 블렌딩', '2026-07-12', '잠시섬 카페', true, 'planned'),

  -- 시부야대학 교류 (PDF 기반)
  ('cccccccc-0000-4000-8000-000000000501', 'bbbbbbbb-0000-4000-8000-000000000005', 1, '유키 학장의 첫 강화 방문',          '시부야대학 학장 유키, 청풍 멤버 3인 미팅',                       '2024-11-15', '잠시섬', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000502', 'bbbbbbbb-0000-4000-8000-000000000005', 2, '강화유니버스 × 시부야 첫 방문',     '청풍 → 시부야대학 캠퍼스 라이프 견학',                            '2025-02-22', '시부야대학 (도쿄)', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000503', 'bbbbbbbb-0000-4000-8000-000000000005', 3, '시부야대학 in 잠시섬 1회차',         '시부야 참가자 6명 + 잠시섬 크루 6명 + 일반 참여자 10명 (총 22명)', '2025-11-08', '잠시섬', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000504', 'bbbbbbbb-0000-4000-8000-000000000005', 4, '잠시섬 in 시부야대학 1회차',         '잠시섬 → 시부야대학 수업 참여 (총 29명)',                         '2026-03-15', '시부야대학 (도쿄)', true, 'completed'),
  ('cccccccc-0000-4000-8000-000000000505', 'bbbbbbbb-0000-4000-8000-000000000005', 5, '시부야대학 in 잠시섬 2회차 (예정)',  '2027년 가을 예정',                                                '2027-10-01', '잠시섬', true, 'planned'),

  -- 가미야마
  ('cccccccc-0000-4000-8000-000000000601', 'bbbbbbbb-0000-4000-8000-000000000006', 1, '가미야마 사전 답사', '청풍 멤버 2명 가미야마 5박 답사', '2025-11-20', '도쿠시마현 가미야마초', true, 'completed');

-- ───────────────────────── 5. episode_archives (PDF 시부야 링크) ─────────────────────────

insert into public.episode_archives (episode_id, kind, title, url) values
  ('cccccccc-0000-4000-8000-000000000502', 'newsletter', '강화유니버스 쿠키레터: 2월 시부야대학 방문 후기', 'https://stibee.com/api/v1.0/emails/share/nvaaV5u98IIsmO8-wFo3JfX3fEC1rmI'),
  ('cccccccc-0000-4000-8000-000000000502', 'instagram',  '잠시섬 인스타: 2월 교류 사진',                    'https://www.instagram.com/p/DJL7oIfy3QL/?img_index=1'),
  ('cccccccc-0000-4000-8000-000000000502', 'web',        '시부야대학 공식 캠퍼스 라이프 (2월 기록)',         'https://www.shibuya-univ.net/campuslife/post-51.php'),
  ('cccccccc-0000-4000-8000-000000000503', 'instagram',  '잠시섬 인스타: 11월 교류 모집글',                  'https://www.instagram.com/p/DP5bXQLkpMr/?img_index=1'),
  ('cccccccc-0000-4000-8000-000000000503', 'newsletter', '강화유니버스 쿠키레터: 11월 시부야대학 교류 회고', 'https://stibee.com/api/v1.0/emails/share/7oHYtE-Fhd7L1CHix9AqJC92hLhbu68'),
  ('cccccccc-0000-4000-8000-000000000503', 'web',        '시부야대학 공식: 11월 교류 기록',                  'https://note.com/shibuya_univ/n/n76f7aa03d9e7'),
  ('cccccccc-0000-4000-8000-000000000504', 'instagram',  '잠시섬 인스타: 시부야식탁 워크숍',                  'https://www.instagram.com/p/DWyyZt4kqsX/?img_index=1'),
  ('cccccccc-0000-4000-8000-000000000504', 'instagram',  '잠시섬 인스타: 자체 결과공유회',                   'https://www.instagram.com/p/DW51wdiEvL9/?img_index=1');

-- ───────────────────────── 6. shops (5개) + shop_owners ─────────────────────────

insert into public.shops (id, name, description, address, qr_token, is_public, slogan, frame_style, theme_color) values
  (
    'dddddddd-0000-4000-8000-000000000001',
    '교동 책방 두번째 지구',
    '교동도의 폐교 옆 작은 책방. 차 한 잔과 시 한 줄.',
    '인천광역시 강화군 교동면 교동남로 12',
    'demo-gyodong-bookshop',
    true,
    '천천히 머무는 한 페이지',
    'simple',
    '#9B6020'
  ),
  (
    'dddddddd-0000-4000-8000-000000000002',
    '잠시섬 카페',
    '강화유니버스의 베이스캠프. 참여자와 크루, 외부 파트너가 가장 먼저 서로를 만나는 자리.',
    '인천광역시 강화군 강화읍 갑곶리 1015',
    'demo-jamsi-cafe',
    true,
    '여기 잠시 머무세요',
    'simple',
    '#3A7A55'
  ),
  (
    'dddddddd-0000-4000-8000-000000000003',
    '장흥리 사랑방',
    '동네 어른들과 텃밭 모임이 함께 모이는 마루 있는 집.',
    '인천광역시 강화군 양도면 장흥리 222',
    'demo-jangheungri-living',
    true,
    '오늘 누구를 만났나요',
    'simple',
    '#7A8B5E'
  ),
  (
    'dddddddd-0000-4000-8000-000000000004',
    '초지진 손님방',
    '바다 보이는 게스트하우스. 여행자가 잠시 머무는 자리.',
    '인천광역시 강화군 길상면 초지리 624',
    'demo-chojijin-guestroom',
    true,
    '바다와 가까이 잠들기',
    'simple',
    '#2060C8'
  ),
  (
    'dddddddd-0000-4000-8000-000000000005',
    '강화 풍물시장',
    '오일장이 서는 강화의 중심 시장. 시즌별 제철 식재료.',
    '인천광역시 강화군 강화읍 중앙시장길 11',
    'demo-ganghwa-market',
    true,
    '제철의 맛을 모으는 자리',
    'simple',
    '#9B6020'
  );

insert into public.shop_owners (shop_id, name, owner_code_hash) values
  ('dddddddd-0000-4000-8000-000000000001', '교동 책방 사장님', '$2b$12$a0hMpWm6mEUJrIWtwrq/buK23kQhkRaFtILGAtuD0muKmWTljWlHe'),
  ('dddddddd-0000-4000-8000-000000000002', '잠시섬 카페 사장님', '$2b$12$ZsS8rVCEg6UdotijBP2/VuTTJzAIYa52uQ6Wz/o81G7M4idU0N9BK'),
  ('dddddddd-0000-4000-8000-000000000003', '장흥리 사랑방 사장님', '$2b$12$nqY3QvMdWYzFCP/qY9miFOI59WtOKcxFNiZsJqZIe.xDOjwv.PV5a'),
  ('dddddddd-0000-4000-8000-000000000004', '초지진 손님방 사장님', '$2b$12$kTc.Y3LPPN7p0cAExlu67eLZbnKuc40knfDX1VrTqoz6zIG2Z3ETe'),
  ('dddddddd-0000-4000-8000-000000000005', '강화 풍물시장 상인회', '$2b$12$qXGtSVI9VlKlXmlZ92jZg.nNgFPcUmYXLEZoz7xb6S8ENdTC9WSUm');

-- ───────────────────────── 7. activities (35개) ─────────────────────────
-- 다양한 type / shop / project / episode / 공개 여부.
-- idempotency_key 는 deterministic UUID v5 (re-run 시 충돌 → DELETE 후 재삽입).

insert into public.activities (
  user_id, project_id, episode_id, shop_id,
  type, title, body, photo_url, is_public, face_consent,
  idempotency_key, created_at
) values
  -- 위캔드 요가 1회차
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000101', 'dddddddd-0000-4000-8000-000000000004',
   'photo', null, '동막 일출이 손에 닿을 거리. 처음으로 ''아 출근 안 하고 싶다''는 말 입 밖으로 안 나온 아침.',
   '/local/ganghwa/ganghwa-01.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1'), '2026-04-12 07:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000101', 'dddddddd-0000-4000-8000-000000000004',
   'memo', null, '바다 근처에서 호흡 다섯 번. 도시에서 못 했던 일.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-2'), '2026-04-12 08:15:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000101', null,
   'check_in', null, null, null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-3'), '2026-04-12 07:45:00+09'),

  -- 위캔드 요가 2회차 (마니산)
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000102', null,
   'photo', null, '마니산 정상에서 본 강화 풍경. 저 멀리 교동까지 보였어요.',
   '/local/ganghwa/ganghwa-02.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4'), '2026-04-26 11:20:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000102', null,
   'memo', null, '내려오면서 무릎이 후들거렸지만 마음은 가벼움.', null,
   false, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-5'), '2026-04-26 13:40:00+09'),

  -- 강화 팜 라이프 1회차 (씨앗 워크숍)
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000201', 'dddddddd-0000-4000-8000-000000000003',
   'photo', null, '제철 씨앗 13종을 손에 들고. 토마토부터 들깨까지.',
   '/local/ganghwa/ganghwa-03.jpg',
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-6'), '2026-03-22 10:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000201', 'dddddddd-0000-4000-8000-000000000003',
   'workshop', '씨앗 분배', '내년에 뭘 키울지 결정하는 데 30분이 걸렸다.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-7'), '2026-03-22 11:50:00+09'),

  -- 강화 팜 라이프 2회차 (김매기)
  ('aaaaaaaa-0000-4000-8000-000000000007', 'bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000202', 'dddddddd-0000-4000-8000-000000000003',
   'photo', null, '점심에 텃밭 옆에서 먹은 비빔국수. 이게 제일 큰 보상.',
   '/local/ganghwa/ganghwa-04.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-8'), '2026-05-30 12:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000202', null,
   'memo', null, '잡초 뽑다 옆 어른과 한 시간 동안 동네 이야기. 이게 또 진짜 김매기지.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-9'), '2026-05-30 14:00:00+09'),

  -- 윤슬 앨범 1회차 (갯벌 소리)
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000301', null,
   'artifact', '동막 갯벌의 새소리 (3min)', '도요새 / 검은머리갈매기 / 발걸음. 셋 다 다른 박자.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-10'), '2026-04-19 06:40:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000301', null,
   'photo', null, '아침 갯벌. 발이 푹 빠지는 순간을 녹음으로 남기고 싶었다.',
   '/local/ganghwa/ganghwa-06.jpg',
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-11'), '2026-04-19 07:00:00+09'),

  -- 윤슬 앨범 2회차 (시장 소리)
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000302', 'dddddddd-0000-4000-8000-000000000005',
   'artifact', '풍물장 호객 (5min)', '오이 1500원 / 1300원 / 두 단에 2000원. 흥정의 박자가 곡이 될 수 있을지.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-12'), '2026-05-17 11:20:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000003', 'cccccccc-0000-4000-8000-000000000302', 'dddddddd-0000-4000-8000-000000000005',
   'memo', null, '시장에서 마주친 할머니가 ''뭐 녹음하노''라고 하셔서 사정 설명. 결국 같이 노래하셨다.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-13'), '2026-05-17 12:10:00+09'),

  -- 차완 차 만들기 1회차 (약쑥 시음)
  ('aaaaaaaa-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000401', 'dddddddd-0000-4000-8000-000000000001',
   'photo', null, '약쑥 + 깻잎 베이스 첫 시음. 약쑥이 강했지만, 깻잎이 잘 받쳐주더라.',
   '/local/ganghwa/ganghwa-07.jpg',
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-14'), '2026-04-05 15:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000401', 'dddddddd-0000-4000-8000-000000000001',
   'workshop', '봄 블렌딩 워크숍', '5명이 각자 비율 다르게 우려서 비교. 내 취향은 약쑥 1 : 깻잎 2.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-15'), '2026-04-05 16:50:00+09'),

  -- 시부야대학 회차들
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000501', null,
   'memo', null, '유키 학장이 ''잠시섬은 시부야의 작은 거울 같다''고 한 게 며칠째 머리에 남아 있다.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-16'), '2024-11-15 19:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000502', null,
   'photo', null, '시부야대학 캠퍼스 라이프. 일본의 ''로컬 학교''라는 개념이 여기서 쌓여 가는구나.',
   '/local/shibuya/shibuya-01.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-17'), '2025-02-22 14:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000503', 'dddddddd-0000-4000-8000-000000000002',
   'photo', null, '시부야 친구들이 잠시섬 마루에 둘러앉아 강화의 차를 마셨다. 서로 말은 조금 느렸지만, 웃음은 금방 같은 속도가 됐다.',
   '/local/shibuya/shibuya-08.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18'), '2025-11-08 16:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000503', null,
   'memo', null, '같이 만든 한일 식탁. 잡채와 오니기리가 한 접시에 올라가 있는 게 정답인지 모르겠지만 맛있었다.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-19'), '2025-11-08 19:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000504', null,
   'photo', null, '오랜만에 유유기지에서 시부야대학 이야기를 나눴어요!!',
   '/local/shibuya/shibuya-10.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-20'), '2026-04-12 14:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000504', null,
   'memo', null, '시부야대학에서 받은 영감으로 제철 요리 워크숍을 진행했어요!', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-21'), '2026-04-12 18:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'bbbbbbbb-0000-4000-8000-000000000005', 'cccccccc-0000-4000-8000-000000000504', null,
   'artifact', '시부야 식탁 워크숍 레시피 (PDF)', '잠시섬 → 시부야 1회차 결과공유회에서 만든 4가지 한일 퓨전 레시피.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-22'), '2026-04-15 11:00:00+09'),

  -- 가미야마
  ('aaaaaaaa-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000006', 'cccccccc-0000-4000-8000-000000000601', null,
   'photo', null, '가미야마. 시골 한복판에 IT 회사가 있는 풍경. 강화에서도 가능할까.',
   '/local/ganghwa/ganghwa-08.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-23'), '2025-11-22 16:30:00+09'),

  -- 가게 단순 체크인 / 메모 (프로젝트 / 에피소드 없는 자유 카드)
  ('aaaaaaaa-0000-4000-8000-000000000007', null, null, 'dddddddd-0000-4000-8000-000000000001',
   'memo', null, '교동 책방. 사장님이 따라준 보리차 한 잔이 오래 기억날 듯.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-24'), '2026-04-22 15:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000003', null, null, 'dddddddd-0000-4000-8000-000000000001',
   'photo', null, '책방 구석 자리. 시집 한 권 끼고 두 시간 동안 안 일어났다.',
   '/local/ganghwa/ganghwa-09.jpg',
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-25'), '2026-04-30 16:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', null, null, 'dddddddd-0000-4000-8000-000000000002',
   'check_in', null, null, null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-26'), '2026-05-02 11:00:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', null, null, 'dddddddd-0000-4000-8000-000000000002',
   'memo', null, '잠시섬 카페에서 일하고 있는 사람들 다 표정이 단단하다. 도시에선 못 보던 표정.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-27'), '2026-05-02 11:20:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000004', null, null, 'dddddddd-0000-4000-8000-000000000004',
   'photo', null, '초지진 손님방 마당. 바다와 살구나무가 같은 액자에.',
   '/local/ganghwa/ganghwa-10.jpg',
   true, true, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-28'), '2026-05-08 17:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000001', null, null, 'dddddddd-0000-4000-8000-000000000005',
   'check_in', null, null, null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-29'), '2026-05-15 09:30:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000001', null, null, 'dddddddd-0000-4000-8000-000000000005',
   'photo', null, '풍물장 5일장. 봄 미나리가 한 단에 천원이라니.',
   '/local/ganghwa/ganghwa-11.jpg',
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-30'), '2026-05-15 09:50:00+09'),

  -- 비공개 카드 (일부)
  ('aaaaaaaa-0000-4000-8000-000000000006', 'bbbbbbbb-0000-4000-8000-000000000002', null, 'dddddddd-0000-4000-8000-000000000003',
   'memo', null, '오늘은 그냥 텃밭에 다녀온 기록. 공개로 안 올림.', null,
   false, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-31'), '2026-05-23 14:20:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000007', null, null, 'dddddddd-0000-4000-8000-000000000004',
   'photo', null, '바다 보면서 우는 데 사진 한 장. 비공개.',
   '/local/ganghwa/ganghwa-12.jpg',
   false, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-32'), '2026-05-25 19:00:00+09'),

  -- 공개 검수 큐 카드 (/admin/review 는 is_public=true AND removed_at IS NULL 전체를 보여줌)
  ('aaaaaaaa-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000004', 'cccccccc-0000-4000-8000-000000000401', 'dddddddd-0000-4000-8000-000000000001',
   'memo', null, '강화도 차 시음회 가서 처음으로 약쑥 차에 빠졌다. 집에서 직접 우려보고 싶음.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-33'), '2026-04-08 22:15:00+09'),
  ('aaaaaaaa-0000-4000-8000-000000000005', null, null, 'dddddddd-0000-4000-8000-000000000002',
   'memo', null, '잠시섬에서 처음으로 한 사람과 두 시간 동안 그냥 앉아 있었다. 도시에선 어색해서 못 했을 일.', null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-34'), '2026-05-04 22:00:00+09'),

  -- 하이파이브 / artifact 추가
  ('aaaaaaaa-0000-4000-8000-000000000004', 'bbbbbbbb-0000-4000-8000-000000000003', null, null,
   'archive_link', '윤슬 앨범 채집 노트 (Notion)', null, null,
   true, false, uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-35'), '2026-05-19 10:00:00+09');

-- /admin/reports 데모용 신고/가림 상태.
-- pending: reported_at IS NOT NULL AND removed_at IS NULL
-- removed: removed_at IS NOT NULL
update public.activities
   set reported_at = '2026-05-06 10:20:00+09'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-33');

update public.activities
   set reported_at = '2026-05-06 12:10:00+09',
       removed_at = '2026-05-06 14:30:00+09',
       is_public = false
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-32');

-- ───────────────────────── 8. reactions ─────────────────────────
-- 사장님 편지 5+ / 하이파이브 20+ / 크루 노트 일부.

-- 사장님 편지 (kind=letter, author_role=owner)
insert into public.reactions (activity_id, author_user_id, author_shop_id, author_role, author_label, kind, body, llm_draft, visibility) values
  -- 교동 책방 → 차완 워크숍 카드 (act-14)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-14')),
    null, 'dddddddd-0000-4000-8000-000000000001', 'owner', '교동 책방 사장님',
    'letter',
    '약쑥 차 한 잔에 봄이 다 들어왔네요. 다음에 오시면 책방 가장 안쪽 자리, 따뜻한 자리 비워두겠습니다.',
    '약쑥 차의 향이 책방까지 흘러왔던 그날을 기억합니다. 다시 들러주시면 좋겠어요.',
    'public'
  ),
  -- 잠시섬 카페 → 시부야 회차 카드 (act-18)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')),
    null, 'dddddddd-0000-4000-8000-000000000002', 'owner', '잠시섬 카페 사장님',
    'letter',
    '시부야 친구들과 마루에 앉아 있던 그 풍경을 카페에서도 자주 떠올려요. 서로 다른 동네가 잠시섬에서 한 상에 앉았던 날, 강화가 조금 더 넓어진 것 같았습니다.',
    '시부야 친구들과 함께한 그 자리가 잊히지 않습니다. 서로 다른 동네가 잠시섬에서 한 상에 앉았던 날이었어요.',
    'public'
  ),
  -- 장흥리 사랑방 → 텃밭 카드 (act-9)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-9')),
    null, 'dddddddd-0000-4000-8000-000000000003', 'owner', '장흥리 사랑방 사장님',
    'letter',
    '잡초 뽑으며 한 시간 이야기 나누신 어른은 우리 동네 큰 어머니예요. 다음 주에는 콩잎 따러 같이 나가요.',
    '동네 어른과 한 시간 이야기를 나누셨다니 반가운 일이네요. 다음 주에는 함께 콩잎 따러 가요.',
    'public'
  ),
  -- 초지진 손님방 → 마당 카드 (act-28)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-28')),
    null, 'dddddddd-0000-4000-8000-000000000004', 'owner', '초지진 손님방 사장님',
    'letter',
    '살구나무 다음으로 작약이 핍니다. 그때 또 와주시면 그 사진 찍을 수 있게 자리 안내해드릴게요.',
    '살구나무가 보이는 마당에 다녀가셨군요. 다음에는 작약이 필 때 다시 오세요.',
    'public'
  ),
  -- 강화 풍물시장 → 미나리 사진 (act-30)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-30')),
    null, 'dddddddd-0000-4000-8000-000000000005', 'owner', '강화 풍물시장 상인회',
    'letter',
    '봄 미나리는 이번 주가 마지막이에요. 다음 장날에는 곤드레가 나옵니다. 강화는 매주 다른 봄이에요.',
    '봄 미나리를 좋게 봐주셨네요. 다음 장에는 곤드레가 나올 예정입니다.',
    'public'
  ),
  -- 교동 책방 → 책방 구석 자리 카드 (act-25, 비공개 편지로)
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-25')),
    null, 'dddddddd-0000-4000-8000-000000000001', 'owner', '교동 책방 사장님',
    'letter',
    '두 시간 동안 안 일어나신 분, 다 봤어요. 그 자리는 누가 자주 앉으면 ''그 자리'' 가 됩니다. 또 오세요.',
    '오래 머무신 자리가 사장님께도 인상적이었네요. 또 오시면 그 자리 비워두겠습니다.',
    'private'
  );

-- 하이파이브 (kind=hi_five) — author_role 다양 (참여자 / 크루)
-- author_label 은 표시명. 참여자 본인이 다른 사람 카드에 응원, 크루가 응원 등.

insert into public.reactions (activity_id, author_user_id, author_shop_id, author_role, author_label, kind, visibility) values
  -- 동막 일출 카드 (act-1) 에 5명이 응원
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1')), 'aaaaaaaa-0000-4000-8000-000000000002', null, 'participant', '롯희',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1')), 'aaaaaaaa-0000-4000-8000-000000000003', null, 'participant', '단풍',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1')), 'aaaaaaaa-0000-4000-8000-000000000004', null, 'participant', '윤슬',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1')), null, null, 'crew', '잠시섬 크루', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1')), 'aaaaaaaa-0000-4000-8000-000000000007', null, 'participant', '하루',   'hi_five', 'public'),

  -- 시부야 사진 카드 (act-18) 7명
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000001', null, 'participant', '파도',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000002', null, 'participant', '롯희',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000004', null, 'participant', '윤슬',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000005', null, 'participant', '차완',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000006', null, 'participant', '잠수함', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), 'aaaaaaaa-0000-4000-8000-000000000007', null, 'participant', '하루',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18')), null, null, 'crew', '잠시섬 크루', 'hi_five', 'public'),

  -- 마니산 사진 (act-4) 4명
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4')), 'aaaaaaaa-0000-4000-8000-000000000001', null, 'participant', '파도',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4')), 'aaaaaaaa-0000-4000-8000-000000000003', null, 'participant', '단풍',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4')), 'aaaaaaaa-0000-4000-8000-000000000005', null, 'participant', '차완',   'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4')), null, null, 'crew', '잠시섬 크루', 'hi_five', 'public'),

  -- 갯벌 소리 artifact (act-10) 3명
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-10')), 'aaaaaaaa-0000-4000-8000-000000000001', null, 'participant', '파도', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-10')), 'aaaaaaaa-0000-4000-8000-000000000005', null, 'participant', '차완', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-10')), null, null, 'crew', '잠시섬 크루', 'hi_five', 'public'),

  -- 텃밭 비빔국수 (act-8) 3명
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-8')), 'aaaaaaaa-0000-4000-8000-000000000003', null, 'participant', '단풍', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-8')), 'aaaaaaaa-0000-4000-8000-000000000006', null, 'participant', '잠수함', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-8')), 'aaaaaaaa-0000-4000-8000-000000000004', null, 'participant', '윤슬', 'hi_five', 'public'),

  -- 약쑥 사진 (act-14) 2명
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-14')), 'aaaaaaaa-0000-4000-8000-000000000003', null, 'participant', '단풍', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-14')), 'aaaaaaaa-0000-4000-8000-000000000007', null, 'participant', '하루', 'hi_five', 'public'),

  -- 풍물장 미나리 (act-30) 2명 + 크루 노트
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-30')), 'aaaaaaaa-0000-4000-8000-000000000005', null, 'participant', '차완', 'hi_five', 'public'),
  ((select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-30')), 'aaaaaaaa-0000-4000-8000-000000000003', null, 'participant', '단풍', 'hi_five', 'public');

-- 크루 노트 (kind=note) — 운영자가 카드에 코멘트
insert into public.reactions (activity_id, author_user_id, author_shop_id, author_role, author_label, kind, body, visibility) values
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-22')),
    null, null, 'crew', '잠시섬 크루',
    'note',
    '시부야 식탁 워크숍 결과 PDF, 강화유니버스 아카이브에 정식 등록 진행 중입니다. 7월 공유 예정.',
    'public'
  ),
  (
    (select id from public.activities where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-12')),
    null, null, 'crew', '잠시섬 크루',
    'note',
    '풍물장 호객 녹음, 강화 사투리 지도 제작에 참고하고 있어요.',
    'public'
  );

commit;
