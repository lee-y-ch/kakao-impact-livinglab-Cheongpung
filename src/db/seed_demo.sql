-- ─────────────────────────────────────────────────────────────
-- Phase 2 데모 시드 — 로컬/프리뷰에서 "QR 찍어 카드 발급" 시나리오를
-- 최소한으로 굴리기 위한 한 건짜리 가게.
--
-- 사용법 (Supabase SQL Editor 또는 psql):
--   이 파일 전체를 실행. 재실행해도 ON CONFLICT 로 idempotent.
--
-- 접근 경로:
--   /entry/demo-shop  → 참여자 로그인 후 카드 작성 폼으로 진입
-- ─────────────────────────────────────────────────────────────

insert into public.shops (name, description, address, qr_token, is_public, slogan, frame_style)
values (
  '강화 데모 책방',
  '강화유니버스 테스트용 가상 가게. 실제 공간이 아닙니다.',
  '인천광역시 강화군 (데모 주소)',
  'demo-shop',
  true,
  '오늘의 한 페이지를 남겨주세요',
  'simple'
)
on conflict (qr_token) do update
  set name        = excluded.name,
      description = excluded.description,
      address     = excluded.address,
      slogan      = excluded.slogan,
      frame_style = excluded.frame_style,
      updated_at  = now();
