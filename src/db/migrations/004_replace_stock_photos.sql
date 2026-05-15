-- 004_replace_stock_photos.sql
--
-- 데모 시드의 unsplash stock 사진을 로컬 정적 자산(/local/...) 으로 교체.
-- public/local/ganghwa/, public/local/shibuya/ 에 실제 사진이 배포되어 있어야 함.
--
-- idempotent: idempotency_key 로 매칭하므로 재실행 안전.
-- seed_demo.sql 을 새로 돌렸으면 별도로 이 마이그레이션 실행 불필요.

-- ───────── activities.photo_url ─────────

update public.activities set photo_url = '/local/ganghwa/ganghwa-01.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-1');
update public.activities set photo_url = '/local/ganghwa/ganghwa-02.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-4');
update public.activities set photo_url = '/local/ganghwa/ganghwa-03.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-6');
update public.activities set photo_url = '/local/ganghwa/ganghwa-04.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-8');
update public.activities set photo_url = '/local/ganghwa/ganghwa-06.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-11');
update public.activities set photo_url = '/local/ganghwa/ganghwa-07.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-14');
update public.activities set photo_url = '/local/shibuya/shibuya-01.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-17');
update public.activities set photo_url = '/local/shibuya/shibuya-08.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-18');
update public.activities set photo_url = '/local/shibuya/shibuya-10.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-20');
update public.activities set photo_url = '/local/ganghwa/ganghwa-08.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-23');
update public.activities set photo_url = '/local/ganghwa/ganghwa-09.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-25');
update public.activities set photo_url = '/local/ganghwa/ganghwa-10.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-28');
update public.activities set photo_url = '/local/ganghwa/ganghwa-11.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-30');
update public.activities set photo_url = '/local/ganghwa/ganghwa-12.jpg'
 where idempotency_key = uuid_generate_v5('00000000-0000-0000-0000-000000000000', 'demo-act-32');

-- ───────── projects.cover_url ─────────
-- 시부야대학 교류 hero 만 교체. 나머지 cover_url 은 의도적으로 보존.

update public.projects set cover_url = '/local/shibuya/shibuya-04.jpg'
 where slug = 'demo-shibuya-exchange';
