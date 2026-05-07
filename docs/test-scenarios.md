# 강화유니버스 시연 검증 체크리스트

> 기준 문서: `docs/roadmap-to-launch.md`
> 목적: 2026년 6월 최종 발표 전, 배포된 서비스가 핵심 시연 흐름을 안정적으로 수행하는지 손으로 확인한다.

## 사용 방법

- 검증 대상 URL: `https://ganghwa-universe.vercel.app`
- 최근 확인된 Vercel URL: `https://ganghwa-universe-hv9iuqnjv-lychs-projects.vercel.app`
- 테스트 DB 상태: `003_categories_realign.sql` + `src/db/seed_demo.sql` 적용 완료
- 최근 smoke test: 2026-05-08, P0 공개/사장님 LLM/`/impact` 흐름 1차 통과
- 체크 방식:
  - `[ ]`: 미검증
  - `[x]`: 통과
  - `[~]`: 부분 통과 또는 known issue
  - `[!]`: 발표 전 수정 필요
- 실패한 항목은 바로 아래에 날짜, 계정/역할, 재현 경로, 기대 결과, 실제 결과를 적는다.

## 0. 배포/시드 스모크

- 기록: 2026-05-08 기준 배포 URL에서 1차 smoke test 완료.

- [x] `/` 공개 랜딩이 열린다.
- [x] `/impact`에 seed 숫자가 의미 있게 표시된다.
- [x] `/projects`에 2026 PDF 기준 4개 카테고리와 demo 프로젝트가 보인다.
- [x] `/feed`에 공개 카드가 시간순으로 표시된다.
- [x] `/shops`에 seed 가게 5개가 표시된다.
- [x] `/admin` 진입과 기본 운영 홈 표시를 확인했다.
- [x] `/admin/review`에 공개 검수 대상 카드가 표시된다.
- [x] `/admin/reports`에 신고 대기/처리 완료 카드가 표시된다.
- [x] `/owner/login`이 열린다.
- [x] `/owner`에서 seed 가게 코드로 로그인 후 본인 가게 카드 목록이 보인다.
- [x] `/owner/letters/new`에서 AI 초안 버튼과 수동 작성 fallback을 확인했다.
- [x] `/impact` 노드 hover/focus 미리보기가 동작한다.

## 1. 공개 방문자 플로우

- [ ] 비로그인 상태에서 `/` 진입 시 공개 랜딩이 보인다.
- [ ] 랜딩 CTA에서 `/impact`로 이동한다.
- [ ] `/impact`에서 누적 카드, 연결된 가게, 참여자, 에피소드, 사장님 편지 숫자가 seed 데이터와 어긋나지 않는다.
- [ ] `/impact`의 카테고리 4종이 `액티브 라이프`, `로컬 문화 공동 창작`, `글로벌 & 로컬 네트워크`, `테크 & 솔루션`으로 표시된다.
- [ ] `/projects`에서 카테고리별 프로젝트 목록을 확인할 수 있다.
- [ ] `/projects/demo-shibuya-exchange`에서 시부야대학 에피소드 타임라인과 공개 카드가 보인다.
- [ ] `/shops`에서 가게 목록을 확인할 수 있다.
- [ ] `/feed`에서 공개 카드만 보이고 비공개/removed 카드는 보이지 않는다.

## 2. 참여자 로그인/카드 발급

- [ ] `/login`에서 카카오 로그인 버튼이 작동한다.
- [ ] 카카오 OAuth callback 후 `/collection`으로 이동한다.
- [ ] 첫 로그인 시 `public.users` row가 생성된다.
- [ ] 같은 카카오 계정으로 재로그인해도 `users` row가 중복 생성되지 않는다.
- [ ] `/entry/demo-gyodong-bookshop` 진입 시 교동 책방 카드 작성 화면이 열린다.
- [ ] 사진과 메모가 모두 비어 있으면 저장할 수 없다.
- [ ] 메모만 입력하고 비공개로 저장하면 `/collection`에 표시된다.
- [ ] 사진을 첨부하면 미리보기와 저장이 정상 동작한다.
- [ ] 같은 에피소드/가게에서 두 번 저장하면 카드가 2장 생긴다.
- [ ] 같은 폼을 재전송해도 `idempotency_key` 기준으로 1건만 저장된다.

## 3. 참여자 도감/공개 제어

- [ ] 로그인한 참여자는 `/collection`에서 본인 카드 그리드를 본다.
- [ ] `/collection/[id]`에서 카드 상세와 reactions 뒷면을 볼 수 있다.
- [ ] 비공개 카드는 `/feed`, `/shops/[id]`, `/impact` 최근 카드에 노출되지 않는다.
- [ ] 공개 토글을 켜면 `/feed`, `/shops/[id]`, `/impact`에 반영된다.
- [ ] 공개 철회 시 공개 영역에서 즉시 사라진다.
- [ ] 삭제 요청 또는 삭제 처리 시 `removed_at`이 설정되고 공개 영역에서 사라진다.
- [ ] 다른 참여자 계정으로 `/collection/[id]` 직접 접근 시 차단된다.

## 4. 관리자 운영 플로우

- [ ] `/admin/login`에서 관리자 이메일/비밀번호 로그인에 성공한다.
- [ ] `/admin` 운영 홈에 검수/신고/진행 중 에피소드 요약이 표시된다.
- [ ] `/admin/projects`에서 새 프로젝트를 생성할 수 있다.
- [ ] 프로젝트 상세에서 새 에피소드를 생성할 수 있다.
- [ ] `progress_type`과 `progress_target` 저장 후 `/projects/[slug]` 진척 표시가 깨지지 않는다.
- [ ] `/admin/shops`에서 새 가게를 생성할 수 있다.
- [ ] 가게 상세에서 QR token과 사장님 코드를 발급/재발급할 수 있다.
- [ ] `/admin/review`에서 공개 카드 검수 큐를 볼 수 있다.
- [ ] 검수 큐에서 공개 해제 또는 가림 처리 후 공개 영역 반영을 확인한다.
- [ ] `/admin/reports`에서 신고 대기 카드를 볼 수 있다.
- [ ] 신고 해제 시 `reported_at`이 null이 되고 목록에서 빠진다.
- [ ] 가림 처리 시 `removed_at`이 설정되고 공개 영역에서 제거된다.

## 5. 크루 플로우

- [ ] `/crew/login`에서 공용 코드로 로그인한다.
- [ ] 로그인 후 `/crew` 대시보드로 이동한다.
- [ ] 진행 중/예정/완료 에피소드 목록이 보인다.
- [ ] 에피소드 status를 `planned → in_progress → completed`로 변경할 수 있다.
- [ ] status 변경이 `/projects/[slug]` 타임라인에 반영된다.
- [ ] 최근 activities에 하이파이브 reaction을 남길 수 있다.
- [ ] 크루 note reaction이 카드 상세에 표시된다.
- [ ] 로그아웃 후 `/crew` 직접 접근 시 로그인으로 유도된다.

## 6. 사장님 플로우

- [ ] `/owner/login`에서 별도 채널로 전달받은 seed 가게 코드로 로그인한다.
- [ ] 로그인 후 `/owner`에서 본인 가게 연결 activities가 보인다.
- [ ] 다른 가게 activity는 보이지 않는다.
- [ ] 잘못된 코드 5회 입력 시 1시간 잠금이 걸린다.
- [ ] 실패/잠금 이벤트가 `auth_events`에 기록된다.
- [ ] `/owner/letters/new?activity_id=<본인 가게 카드>`에서 카드 미리보기가 보인다.
- [ ] 편지 본문 작성 후 visibility를 선택해 저장할 수 있다.
- [ ] 저장된 편지가 참여자 `/collection/[id]` reactions에 표시된다.
- [ ] 비공개 편지는 공개 영역에 노출되지 않는다.

## 7. LLM 편지 초안

> `docs/roadmap-to-launch.md` 2.4 완료. 2026-05-08 smoke test 통과, 회의 전 대표 카드 1건으로 재검증한다.

- [x] `/api/llm/draft`가 구현되어 있다.
- [x] 사장님 편지 작성 화면에 “AI 초안, 꼭 수정해서 보내세요” 맥락이 명확히 표시된다.
- [x] 명시적 버튼 클릭 시에만 LLM 요청이 발생한다.
- [x] activity/가게/참여자 맥락이 프롬프트에 반영된다.
- [x] 초안은 첫 문장 또는 짧은 도입 제안 수준으로 반환된다.
- [x] 사장님이 수정한 본문만 최종 letter body로 저장된다.
- [x] `llm_draft`에는 원본 초안이 기록된다.
- [x] API key가 없거나 LLM 실패 시 수동 작성 플로우가 막히지 않는다.

## 8. `/impact` 노드맵

> `docs/roadmap-to-launch.md` 2.5 완료. 2026-05-08 smoke test 통과, 회의 전 모바일에서 한 번 더 확인한다.

- [x] 공개 카드만 노드맵 데이터에 포함된다.
- [x] 비공개, 신고 처리 removed 카드는 제외된다.
- [x] project/shop/participant/category 관계가 activity 기준으로 연결된다.
- [x] hover 또는 tap 시 관련 카드 3~5건을 미리 볼 수 있다.
- [ ] 모바일에서 화면이 깨지지 않는다.
- [x] 실데이터 연결 완료 상태이며 정적 fallback 문구가 필요하지 않다.

## 9. 보안/RLS/권한

- [ ] 익명 사용자는 `/collection`, `/crew`, `/owner`, `/admin` 보호 영역에 접근할 수 없다.
- [ ] 참여자는 본인 activity만 수정/삭제할 수 있다.
- [ ] 사장님은 본인 가게 연결 activity에만 reaction을 남길 수 있다.
- [ ] 크루/관리자 route는 미인증 호출 시 401 또는 403을 반환한다.
- [ ] service role route는 진입부에서 actor 권한을 확인한다.
- [ ] 외부 Origin의 상태 변경 POST가 차단된다.
- [ ] `shop_owners`, `contribution_*`, `page_views`, `auth_events`가 클라이언트에서 직접 조회되지 않는다.

## 10. 모바일/발표 환경

- 회의 전 우선 확인 경로: `/`, `/impact`, `/entry/demo-gyodong-bookshop`, `/collection`, `/owner/login`, `/owner/letters/new?activity_id=<대표 카드>`

- [ ] iOS Safari에서 `/entry/[qr_token]` 카드 작성과 사진 첨부가 동작한다.
- [ ] Android Chrome에서 `/entry/[qr_token]` 카드 작성과 사진 첨부가 동작한다.
- [ ] 모바일에서 Navbar, 카드, 폼 버튼 텍스트가 겹치지 않는다.
- [ ] 발표 PC에서 배포 도메인이 정상 표시된다.
- [ ] 발표용 관리자/사장님/크루 계정과 코드를 별도 메모로 준비했다.
- [ ] 테더링 등 백업 네트워크를 준비했다.

## 11. 회의 전 환경 점검

로컬 점검 기록:

- 2026-05-08 `.env.local` key 이름 확인 완료: Supabase URL/anon/service role, `NEXT_PUBLIC_SITE_URL`, `CREW_ACCESS_CODE`, `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
- 2026-05-08 로컬 `.vercel/` 디렉토리는 없음. 배포는 Vercel 대시보드/GitHub 연동 기준으로 확인한다.
- 카카오 REST API key/secret은 앱 env가 아니라 Supabase Auth Provider Kakao 설정에서 확인한다.

- [ ] Vercel Production env에 `NEXT_PUBLIC_SUPABASE_URL`이 있다.
- [ ] Vercel Production env에 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 있다.
- [ ] Vercel Production env에 `SUPABASE_SERVICE_ROLE_KEY`가 있다.
- [ ] Vercel Production env에 `LLM_PROVIDER=gemini` 또는 의도한 provider가 있다.
- [ ] Vercel Production env에 `GEMINI_API_KEY`가 있다.
- [ ] Vercel Production env에 `CREW_ACCESS_CODE`가 있다.
- [ ] Vercel Production env에 `NEXT_PUBLIC_SITE_URL`이 최종 배포 도메인으로 설정되어 있다.
- [ ] Supabase Auth Provider Kakao에 카카오 REST API key/secret이 등록되어 있다.
- [ ] 카카오 디벨로퍼스 Web 사이트 도메인에 최종 배포 도메인이 등록되어 있다.
- [ ] 카카오 OAuth redirect에 Supabase callback URL이 등록되어 있다.

## 실패 기록

| 날짜 | 항목 | 역할/계정 | 재현 경로 | 실제 결과 | 처리 |
| ---- | ---- | --------- | --------- | --------- | ---- |
|      |      |           |           |           |      |
