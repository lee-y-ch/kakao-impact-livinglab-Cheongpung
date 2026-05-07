-- ─────────────────────────────────────────────────────────────
-- Migration 003 — categories 분류 재정렬
-- 작성일: 2026-05-07
--
-- 배경:
--   초기 시드 (001_initial.sql) 의 4 카테고리 (환대의 공유지/네트워크/세계/정책) 가
--   청풍의 PDF "[2026] 강화유니버스 프로젝트 개요" 와 랜딩 페이지 PROJECT_CARDS 의
--   분류 (액티브 라이프 / 로컬 문화 공동 창작 / 글로벌 & 로컬 네트워크 / 테크 & 솔루션) 와
--   어휘가 어긋남.
--   랜딩과 운영 화면 (/impact, /projects 등) 의 카테고리 어휘 일관성을 위해 청풍 정의
--   (PDF) 를 권위 있는 출처로 채택, DB 카테고리를 그에 맞춰 재정렬.
--
-- 매핑:
--   commons → active_life     (액티브 라이프 / 클럽형)
--   world   → local_culture   (로컬 문화 공동 창작 / 아카이브형)
--   network → network         (글로벌 & 로컬 네트워크 / 관계형 — slug 유지)
--   policy  → tech            (테크 & 솔루션 / 인프라형)
--
-- 주의: projects.category_id FK 는 id 기준 (uuid) 이라 slug 변경에 영향 없음.
--       기존 활동/프로젝트 데이터가 있어도 유실 안 됨.
-- ─────────────────────────────────────────────────────────────

update public.categories
   set slug        = 'active_life',
       name        = '액티브 라이프',
       description = '몸으로 경험하고 즐기는 활동적 회복 프로젝트 (위캔드 요가, 강화 팜 라이프 등)',
       sort_order  = 10
 where slug = 'commons';

update public.categories
   set slug        = 'local_culture',
       name        = '로컬 문화 공동 창작',
       description = '지역의 색깔을 담은 결과물(IP)을 함께 만드는 프로젝트 (윤슬 앨범, 강화도 차 등)',
       sort_order  = 20
 where slug = 'world';

update public.categories
   set name        = '글로벌 & 로컬 네트워크',
       description = '강화의 환대를 세계와 연결하는 롱텀 프로젝트 (시부야대학·가미야마 교류 등)',
       sort_order  = 30
 where slug = 'network';

update public.categories
   set slug        = 'tech',
       name        = '테크 & 솔루션',
       description = '세계관을 지속 가능하게 만드는 기술적 시도 (로컬 유니버스 앱, 지역 문제 해결 AI 등)',
       sort_order  = 40
 where slug = 'policy';
