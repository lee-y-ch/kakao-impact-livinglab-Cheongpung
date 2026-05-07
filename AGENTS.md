# 강화유니버스 대시보드 — Agent 작업 지침

이 레포는 카카오임팩트 × 협동조합 청풍 강화도 관계인구 프로젝트 웹앱이다. 2026년 6월 최종 발표와 이후 청풍 운영 인계를 목표로 같은 코드베이스를 계속 발전시킨다. 임시 throwaway 구현으로 갈아엎지 않는다.

## 기준 문서

작업 우선순위는 항상 `docs/roadmap-to-launch.md`를 1순위로 본다.

보조 맥락:

- `CLAUDE.md`: 제품 원칙, 도메인 모델, 역할별 플로우
- `docs/v2-redesign-status.md`: v2 전환 상태와 남은 화면별 리스크
- `[2026] 강화유니버스 프로젝트 개요.pdf`, `[2026] 강화유니버스 프로젝트 세부 - 1. 예시.pdf`: 청풍이 제시한 2026 프로젝트/카테고리 기준

문서가 충돌하면 `docs/roadmap-to-launch.md`를 우선하고, 도메인 정책은 `CLAUDE.md`의 최신 구조를 따른다. 오래된 디렉토리 예시보다 실제 `src/app` 현재 구조를 우선한다.

## 현재 진행 상태

- 배포는 완료된 상태로 보고 진행한다.
- `src/db/migrations/003_categories_realign.sql` 적용 완료.
- `src/db/seed_demo.sql` 프로덕션 적용 완료.
- 배포 URL 스모크 테스트 1차 완료.
- `docs/test-scenarios.md` 초안 작성 완료.
- 다음 작업은 `docs/roadmap-to-launch.md` 기준 `2.4 사장님 편지 LLM 흐름 v2 마이그레이션`이다.

## 제품 원칙

- 한 줄 정체성: “오늘도 강화도가 조금씩 더 강화됩니다.”
- 세 주인공:
  - 참여자: `/collection`에서 내가 쌓은 환대 행위를 본다.
  - 강화도 공개 뷰: `/impact`에서 누구나 강화도 진척을 본다.
  - 운영자/크루/사장님: `/admin`, `/crew`, `/owner`에서 운영과 응원을 처리한다.
- `/admin`은 운영 전담 화면이다. 노드맵/공개 서사는 `/impact`로 보낸다.
- 참여자 카드가 발표 내러티브의 핵심이다. 카드 생성 → 도감 → `/impact` 집계 흐름을 깨지 않는다.

## 카테고리 기준

DB와 운영 화면의 카테고리는 2026 PDF 기준 4종으로 통일한다.

- `active_life`: 액티브 라이프
- `local_culture`: 로컬 문화 공동 창작
- `network`: 글로벌 & 로컬 네트워크
- `tech`: 테크 & 솔루션

기존 `commons/world/policy` 어휘는 매니페스토나 랜딩 카피에 일부 남을 수 있지만, DB/운영 분류로 되살리지 않는다.

## 핵심 데이터 규칙

- `activities`는 참여자의 환대 행위 1건이자 카드 1장이다.
- 같은 episode/project/shop에 여러 activity가 생기는 것은 의도된 동작이다. unique 제약을 추가하지 않는다.
- 기술적 중복 방지는 `activities.idempotency_key`로만 처리한다.
- 공개는 opt-in이다. `activities.is_public` 기본값은 false 유지.
- 개인 점수/랭킹/좋아요/팔로우/공개 댓글은 만들지 않는다.
- 허용되는 공개 상호작용은 reactions, 공개 검수 큐, 카테고리/프로젝트/가게 필터 정도다.
- `face_consent`, `reported_at`, `removed_at` 흐름을 우회하지 않는다.
- `contribution_points`는 가게/프로젝트/카테고리/플랫폼 단위 집계용이다. 개인 점수 UI를 만들지 않는다.

## 인증과 권한

- 모든 서버 컴포넌트와 route handler는 가능하면 `src/lib/auth/current-actor.ts`의 `getCurrentActor()`를 통해 actor를 해석한다.
- 참여자: Supabase Auth + 카카오 OAuth
- 사장님: 가게 코드 + bcrypt + httpOnly cookie + 실패 잠금
- 크루: 공용 코드
- 관리자: Supabase Auth + `app_metadata.role = "admin"`
- `shop_owners`, `contribution_*`, `page_views`, `auth_events`는 클라이언트 직접 접근 금지. service role route handler에서 actor 권한을 확인한 뒤 처리한다.
- 상태 변경 route는 Origin/CSRF 검증을 유지한다.

## DB와 시드

- 기존 배포 DB에는 `001_initial.sql`, `002_phase1_extensions.sql`이 이미 적용된 상태로 본다. 임의로 다시 실행하지 않는다.
- 새 DB를 처음 만들 때만 `001 → 002 → 003 → seed_demo.sql` 순서로 적용한다.
- 기존 DB의 `categories.slug`가 `commons/network/world/policy`라면 `003_categories_realign.sql`만 먼저 적용한다.
- `seed_demo.sql`은 발표용 데이터다. 프로덕션에 적용한 뒤에도 repo 파일은 재실행 가능하도록 idempotent 성격을 유지한다.
- 사장님 코드 해시는 평문을 커밋하지 않고 bcrypt hash만 둔다. 시연용 코드 전달은 별도 채널로 한다.

## 남은 로드맵 우선순위

P0:

1. `docs/test-scenarios.md` 작성 및 시연 플로우 체크리스트화
2. `/owner`, `/owner/letters/new`, `/owner/settings` v2/LLM 흐름 완성
3. `POST /api/llm/draft` 구현
4. `/impact` 노드맵 실데이터 연결 또는 명시적 fallback 처리

P1:

1. `docs/admin-onboarding.md`
2. `docs/operational-policies.md`
3. `docs/owner-shop-handover.md`

P2:

- PWA 실사용 판단, 자동화 테스트, 관리자 고도화, 크루 개인 계정 전환

## 구현 기준

- Next.js 14 App Router + TypeScript + Tailwind CSS를 유지한다.
- 기존 컴포넌트/디자인 토큰을 우선 사용한다. 특히 v2 화면은 `@/components/claude/primitives` 중심 v1 톤으로 되돌리지 않는다.
- 화면 추가 시 모바일 우선으로 확인한다. 발표 시연은 모바일 플로우가 중요하다.
- 운영 UI는 비전공자 청풍 담당자가 직접 쓸 수 있게 명확하고 단순해야 한다.
- LLM 편지는 “AI 초안, 꼭 수정해서 보내세요” 맥락을 UI와 프롬프트에 강제한다.

## 검증

수동 체크리스트는 `docs/test-scenarios.md`에서 관리한다.

주요 검증 축:

- 카카오 로그인과 users upsert idempotency
- QR 진입 → activity 생성 → `/collection` 표시
- 같은 에피소드 반복 참여 허용
- 같은 폼 재전송은 `idempotency_key`로 1건만 저장
- 공개 토글/삭제/신고가 `/feed`, `/shops/[id]`, `/impact`, `/admin/review`, `/admin/reports`에 반영
- 사장님 편지가 `/collection/[id]` reactions에 표시
- 크루 episode status 변경이 `/projects/[slug]`에 반영
- 사장님 코드 실패 5회 잠금과 `auth_events`
- RLS와 service role route 미인증 차단
- iOS Safari와 Android Chrome 실기기 확인

## 작업 방식

- 변경 전 현재 파일과 실제 스키마를 먼저 확인한다.
- 사용자가 만든 변경을 되돌리지 않는다.
- 마이그레이션/시드/운영 문서는 특히 프로덕션 DB에 미치는 영향을 먼저 설명한다.
- 큰 작업은 작은 단위로 완료 가능한 상태를 만들고, 각 단계에서 빌드/타입체크 또는 수동 확인 방법을 남긴다.
