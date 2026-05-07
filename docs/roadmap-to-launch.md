# 강화유니버스 대시보드 — 완성·배포 로드맵

> 작성일 : 2026-05-07
> 기준 : `feat/v2-redesign` → `main` 머지 직후
> 마감 : **2026 년 6월 최종 발표**
>
> **이 문서의 목적** — v2 리디자인 후속 복구가 끝난 시점에서, "프로젝트 완성 (배포 + 청풍 운영 인계 + 6월 발표 시연 가능 상태)" 까지 남은 작업을 한 곳에 정리한다. 다른 세션에서 이 문서 + `CLAUDE.md` + `docs/v2-redesign-status.md` 만 읽고 이어 작업할 수 있도록 자기완결적으로 작성됨.

---

## 0. TL;DR (한 줄)

**페이지·인증·API 는 다 살아있다. 남은 건 (1) 사장님 편지 LLM 흐름 v2 마이그레이션, (2) `/impact` 노드맵 데이터 연결, (3) Vercel 프로덕션 배포 (Supabase 는 dev 프로젝트 승격 가능), (4) 시연 시드 데이터, (5) 청풍 운영 인계 자료.**

---

## 1. 현재 상태

### 1.1 코드 — 완료된 것 (PR #11 머지 시점)

- **DB 스키마 + RLS** — `001_initial.sql` + `002_phase1_extensions.sql` 모든 도메인 테이블 + 정책
- **인증 3종** — 카카오 OAuth (참여자), 가게 코드 (사장님), 공용 코드 (크루), Supabase Auth + app_metadata.role (관리자). 단일 `current-actor.ts` 로 통일
- **API 라우트 전부 라이브** — activities CRUD + moderate, reactions, episodes/status, admin/{projects,shops,activities,episodes,shop-owners}, auth/{owner,crew,logout}, dev/login
- **9개 v2 페이지 데이터 연결** — `/`, `/impact`, `/projects`, `/projects/[slug]`, `/shops`, `/shops/[id]`, `/feed`, `/collection`, `/collection/[id]`, `/entry/[qr_token]`, `/crew`, `/admin`
- **글로벌 chrome** — Navbar (actor 분기 + 로그아웃), Footer (legal 링크 + `/legal/terms`·`/legal/privacy` 페이지). `/admin*` 경로는 자체 sidebar 셸로 chrome 미노출
- **Legacy `(default)/*` 페이지** — 대부분 v2 톤으로 마이그레이션. **단, `/owner` + `/owner/letters/new` 는 아직 v1 톤** (Phase 4 작업 시 같이 손볼 것)

### 1.2 인프라 — 현재 상태

- **Supabase** — **dev 프로젝트 1개 존재** (로컬 `.env.local` 에 실제 키, 마이그레이션 적용된 상태로 추정). 카카오 OAuth Provider 도 dev 용으로 등록되어 있음
- **Vercel** — **미생성**. 로컬에 `.vercel/` 없음. 프로덕션 도메인 / push-to-deploy 설정 모두 안 됨
- **카카오 디벨로퍼스** — dev redirect 만 등록 (`http://localhost:3001/...` + `https://<supabase-ref>.supabase.co/auth/v1/callback`). prod 도메인 redirect 미등록

---

## 2. 우선순위별 남은 작업

### 🔴 P0 — 시연 가능 상태 (배포 + 데이터 + 노드맵)

#### 2.1 Vercel 프로덕션 배포 + Supabase 정리
- [Section 4 의 단계별 체크리스트](#4-배포-체크리스트) 따라 진행
- 산출물 : `https://<도메인>` 으로 외부 접근 가능 + 카카오 OAuth 정상 작동

#### 2.2 시연 시드 데이터
- `src/db/seed_demo.sql` 이 이미 존재 → 내용 검토 + 보강 + 프로덕션 적용
- 시연 시나리오에 필요한 최소 데이터:
  - 카테고리 4종 (이미 시드됨)
  - 프로젝트 6~8개 (카테고리별 1~2개)
  - 에피소드 12+ (status 다양 — planned·in_progress·completed)
  - 가게 5~6개 (`is_public=true`, `qr_token`, `theme_color` 설정)
  - 사장님 코드 발급 (실제 bcrypt 해시)
  - 참여자 dummy 5~10명
  - 활동 30~50건 (`is_public=true`, 카테고리·shop·episode 다양하게)
  - 사장님 편지 5+ 건 + 하이파이브 20+
- 산출물 : 프로덕션에 seed 적용 후 `/`, `/impact`, `/feed`, `/projects`, `/admin` 모두 의미있는 숫자로 보임

#### 2.3 데모 시나리오 검증 체크리스트
- `docs/test-scenarios.md` — **현재 부재**. 신규 작성 필요
- CLAUDE.md §16 의 18개 검증 항목을 마크다운 체크리스트로 옮기고, 시연 직전 한 번 손으로 통과시킴
- 산출물 : 모든 항목 ✅ 표시된 체크리스트

#### 2.4 사장님 편지 LLM 흐름 v2 마이그레이션 (Phase 4 핵심)
**대상**: `/owner`, `/owner/letters/new`, `/owner/settings`

**현재 상태**:
- `/owner` 와 `/owner/letters/new` 는 `src/app/owner/*.tsx` 에 있고 v1 톤 (`@/components/claude/primitives` 사용)
- `/owner/settings` 페이지는 미존재
- API `/api/llm/draft` 가 아직 미구현 (CLAUDE.md 의 핵심 파일 표에는 있지만 실제 파일은 없음 — 확인 필요)

**해야 할 것**:
1. `/owner` 대시보드 — 본인 가게 연결된 activities 그리드, v2 디자인 토큰
2. `/owner/letters/new?activity_id=...` — 카드 미리보기 + LLM 첫문장 제안 버튼 + 본문 textarea + visibility 선택 + 저장 → `POST /api/reactions` (kind=letter, author_role=owner)
3. `POST /api/llm/draft` (route handler 신규) — `src/lib/llm/` 의 Gemini 2.5 Flash-Lite 기본 호출. Anthropic 키 발급 시 provider 전환 가능. 고정 프롬프트 + activity 컨텍스트 + "수정해서 보내세요" 라벨 강제
4. `/owner/settings` — 가게 공개 ON/OFF 토글 (`shops.is_public` PATCH). 신규 라우트 핸들러. owner 본인 가게에만 권한
5. `/collection/[id]` 의 reactions 실시간 반영 검증 (이미 PR #2 에서 살아있음. 새 letter 가 표시되는지만 확인)

**산출물** : 사장님이 LLM 도움 받아 편지 보내는 핵심 시연 흐름 완성. 발표에서 "AI 가 첫 문장만 제안, 사장님이 수정해 보냄" 데모 가능.

#### 2.5 `/impact` 노드맵 실데이터 연결
**현재 상태**: 노드맵 SVG 가 정적 좌표 (시안 그대로).

**왜 P0 로 옮겼나**: 발표 임팩트가 큰 시각화. "관계의 모양" 을 한눈에 보여주는 핵심 화면. 정적 SVG 면 발표 메시지(`참여자·가게·프로젝트의 환대 그래프`)와 어긋남.

**해야 할 것**:
- `react-flow` 또는 D3 force-directed graph 도입
- 노드 타입 — project (큰 점) / shop (중간) / participant (작은 점, 닉네임만)
- 엣지 — activity 가 만든 (participant ↔ shop) + (shop ↔ project) + (project ↔ category)
- 공개 카드만 표시. 신고·비공개 제외
- 마우스 hover 시 카드 미리보기 (3~5건)
- 모바일에선 정적 폴백 또는 `pinch-zoom` 단순화

**시간 부족 시 fallback**: 정적 SVG 유지 + 우측 하단 캡션을 "시연용 정적 시각화 — 실시간 그래프는 정식 출시 시 도입" 으로 명시.

---

### 🟡 P1 — 운영 인계 (청풍이 직접 굴리려면 필요)

#### 2.6 청풍 관리자 온보딩 가이드
- `docs/admin-onboarding.md` 신규
- 내용:
  - 관리자 추가 절차 (`.env.local.example` 의 SQL 스니펫 + 스크린샷)
  - 새 프로젝트·에피소드 등록 흐름 (`/admin/projects`)
  - 새 가게 등록 + QR 발급 + 사장님 코드 발급 (`/admin/shops`)
  - 검수 큐·신고 큐 운영 가이드 (`/admin/review`, `/admin/reports`)
- **운영 거버넌스 표 결정** (CLAUDE.md §운영 거버넌스 — 현재 TBD): 카테고리 정의 / 에피소드 승인 / 데이터 정정 / 신고 대응 / 계정 분실 누가 책임? — 청풍과 합의 후 표 채우기

#### 2.7 사장님 / 크루 코드 운영 절차
- 사장님 코드 — 가게당 1개. 분실 시 `/admin/shops/[id]` 에서 재발급 (살아있음). **분실 신고 채널** 결정 (카카오 채널? 청풍 전화?)
- 크루 공용 코드 — `.env` 변수 1개. 노출 시 새 값으로 재배포. **로테이션 주기** 결정

#### 2.8 사진 / 메모 신고 대응 SOP
- 신고된 카드는 `/admin/reports` 큐에 자동 진입. 청풍이 24h 내 처리 약속? 정책 결정 필요
- 삭제 후에도 `removed_at` 만 set 되고 storage 사진은 남음 → Phase 7 배치 정리 (현재는 무한 누적, 6월 발표 후 처리)

---

### 🔵 P2 — 발표 후로 미뤄도 되는 것

#### 2.9 Phase 7 항목들 (관리자 고도화)
- 카드 디자인 풀 에디터 (theme_color/accent_color/slogan/frame_style)
- 크루 개인 계정으로 전환 (현재 공용 코드)
- audit_events 뷰어 (현재는 DB 에 기록만)

#### 2.10 PWA 실사용 판단 (Phase 8)
- `public/manifest.json` 존재. iOS 홈화면 추가 시 풀스크린 동작 확인
- 청풍이 PWA 가 진짜 필요한지 판단 (네이티브 카메라 capture 는 일반 브라우저 `<input capture>` 으로도 충분히 동작)

#### 2.11 자동화 테스트
- 현재 manual checklist 만 있음
- Playwright + Vitest 도입은 풀버전 작업

---

## 3. 작업 순서 권장

**시연 전** (D-7 일까지):
1. **2.4 사장님 편지 LLM** — 발표 내러티브의 핵심 기능. 가장 무거운 작업이라 먼저 (D-21 ~ D-14)
2. **2.5 노드맵 실데이터** — 발표 임팩트 영역 (D-14 ~ D-10). 시간 부족하면 정적 fallback
3. **2.1 Vercel 배포** + **2.2 시드 데이터** (D-10 ~ D-7)
4. **2.3 데모 시나리오 체크리스트** + **2.6~2.7 운영 인계 자료** (D-7 ~ D-3)

**시연 직전** (D-2):
5. 2.3 체크리스트 한 번 손으로 통과
6. 모바일 실기기 (iOS Safari + Android Chrome) UX 점검
7. 시연 PC 에서 Vercel 도메인 정상 표시 + 백업 인터넷 (테더링)

**시연 이후**:
- 2.8 (신고 대응 SOP 문서화)
- P2 항목 (Phase 7+8)

---

## 4. 배포 체크리스트

### 4.1 Supabase — 두 옵션 중 선택

#### 옵션 A : 현재 dev 프로젝트를 그대로 프로덕션으로 승격 (권장 · 단순)
**전제** : 현재 `.env.local` 의 Supabase 프로젝트에 들어있는 데이터가 더미·테스트라 날려도 OK 인 경우.

1. **데이터 정리 (선택)**: 현재 프로젝트의 의미 없는 더미 데이터 제거 — Supabase Dashboard → Table Editor 에서 `activities` / `reactions` / `users` 등 테스트 행 직접 삭제. (마이그레이션은 그대로 두고 행만 비우기)
2. **마이그레이션 검증**: SQL Editor 에서 다음 쿼리로 표 존재 확인:
   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public' order by table_name;
   ```
   `activities, artifacts, auth_events, categories, contribution_log, contribution_points, episode_archives, episodes, page_views, project_hosts, projects, reactions, shop_owners, shops, users` 가 다 보이면 OK
3. **Storage 버킷 확인**: Storage → `activity-photos` 버킷 존재 확인. 정책: **Public = ON**, 5MB 제한, `image/jpeg|png|webp` 만 허용. 없으면 `node --env-file=.env.local scripts/bootstrap-storage.mjs` 실행 (이 스크립트가 자동 생성·업데이트). 사진 보호는 RLS 가 `activities.is_public` / `removed_at` 으로 행 단위에서 처리하므로 버킷은 public read 로 둔다 — `<Image src={photo_url}>` 가 직접 렌더하는 구조
4. **카카오 OAuth Provider** 이미 활성화되어 있는지 확인 (Authentication → Providers → Kakao)
5. **첫 관리자 계정**: 청풍 담당자 이메일로 Authentication → Users → Add user. 이후:
   ```sql
   update auth.users
      set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
    where email = '<관리자 이메일>';
   ```
6. **API 키** 그대로 사용 → Section 4.2 Vercel 의 env 에 동일한 값 입력

#### 옵션 B : 별도의 prod 프로젝트 신규 생성 (안전 · 두 배 작업)
**전제** : 현재 dev 데이터를 보존하고 싶거나 dev/prod 격리가 필요한 경우.

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성 (강화유니버스 prod). 리전 = `Northeast Asia (Seoul)` 또는 `Tokyo`
2. **DB 마이그레이션 적용**:
   - SQL Editor → `src/db/migrations/001_initial.sql` 전체 → 실행
   - SQL Editor → `src/db/migrations/002_phase1_extensions.sql` 전체 → 실행
   - SQL Editor → `src/db/migrations/003_categories_realign.sql` 전체 → 실행
3. **Storage 버킷 생성**: `node --env-file=.env.local scripts/bootstrap-storage.mjs` 실행 (정책: Public = ON, 5MB 제한, `image/jpeg|png|webp`). 수동 생성 시 Storage → New bucket → name = `activity-photos`, **Public bucket = ON**. 사진 보호는 RLS 행 단위에서 처리
4. **카카오 OAuth Provider 연결**:
   - Authentication → Providers → Kakao → Enable
   - Kakao REST API Key + Client Secret 입력 (dev 와 동일한 키 사용 가능)
   - **카카오 디벨로퍼스 → Redirect URI** 에 `https://<prod-project-ref>.supabase.co/auth/v1/callback` 추가
5. **첫 관리자 계정 + role** : 옵션 A 의 5번과 동일
6. **dev 데이터 마이그레이션 (필요 시)** : Supabase CLI `pg_dump` → 새 프로젝트로 import. 또는 `seed_demo.sql` 만 새로 적용

### 4.2 Vercel 프로젝트 (처음부터)

1. [vercel.com](https://vercel.com) 에서 GitHub repo 연결 → 새 프로젝트
2. **Build settings**:
   - Framework: Next.js (자동 감지)
   - Root directory: `/`
   - Install command : `npm install`
   - Build command : `npm run build` (default)
3. **Environment Variables** (Production / Preview 모두):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← Production 만 권장 (Preview 는 별도 dev 키 또는 동일)
   - `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`
   - `LLM_PROVIDER` / `GEMINI_API_KEY` (Phase 4 LLM, 기본 provider)
   - `ANTHROPIC_API_KEY` (선택, 추후 Anthropic 전환 시)
   - `CREW_ACCESS_CODE` (8자 이상 랜덤. 청풍에 별도 전달)
   - `NEXT_PUBLIC_SITE_URL` ← 최종 도메인 (`https://<domain>`)
4. **Domain** : 우선 Vercel 기본 도메인(`<project>.vercel.app`)으로 배포 → 나중에 커스텀 도메인 연결
5. **첫 배포** : main push 시 자동 빌드. 빌드 실패 시 보통 env 누락 — 빌드 로그 확인

### 4.3 카카오 OAuth — 프로덕션 redirect 추가

배포 도메인 확정되면:
- 카카오 디벨로퍼스 → 내 애플리케이션 → 카카오 로그인 → **Redirect URI** 에 다음 추가:
  - `https://<supabase-project-ref>.supabase.co/auth/v1/callback` (Section 4.1 에서 등록되어 있을 가능성 높음)
- **앱 설정 → 플랫폼 → Web 사이트 도메인** 에 `https://<도메인>` 등록 (Origin 검증 통과)

### 4.4 첫 배포 후 smoke test

1. `https://<도메인>/` → Hero 사진 + Stats 0 또는 시드 값 + Manifesto Collage 정상
2. `/login` → 카카오 로그인 → callback → `/collection` 리다이렉트
3. `/admin/login` → 관리자 이메일/비번 → `/admin` 운영 홈 진입
4. `/admin/projects` 에서 새 프로젝트 1건 + 에피소드 1건 생성
5. `/admin/shops` 에서 새 가게 1건 + qr_token + 사장님 코드 발급
6. `/entry/<qr_token>` → 메모 입력 + 비공개 제출 → `/collection` 노출
7. `/owner/login` → 발급한 코드로 로그인 → `/owner` 진입 (현재 v1 톤이지만 동작 확인)
8. `/admin/review` 큐에 방금 만든 카드 노출
9. (Phase 4 완료 후) `/owner/letters/new?activity_id=...` 에서 LLM 초안 요청 → 응답 확인

스모크 테스트 통과 = 청풍에 도메인 공유 가능.

---

## 5. 시연 데이터 작업 (2.2 자세히)

### 5.1 seed_demo.sql 검토 + 보강

```bash
# 현재 내용 확인
cat src/db/seed_demo.sql

# 부족한 부분 보강 후, 프로덕션 SQL Editor 에 붙여넣어 적용
# 전제:
# - 기존 배포 DB라면 001/002 는 이미 적용된 상태일 가능성이 높음. 다시 실행하지 말고
#   categories.slug 가 active_life/local_culture/network/tech 인지만 확인.
# - 새 DB를 처음 만들 때만 001 → 002 → 003 순서로 적용.
# - 기존 DB의 categories 가 commons/network/world/policy 상태면 003_categories_realign.sql 만 먼저 적용.
# 단, 비밀번호 해시 (사장님 코드, 관리자 비번) 는 로컬에서 미리 생성 필요
```

**bcrypt 해시 생성 (사장님 코드 8자리)**:
```bash
node -e "import('bcryptjs').then(b => b.hash('<8자리코드>', 12).then(console.log))"
```

해시를 `seed_demo.sql` 의 `insert into shop_owners (..., owner_code_hash) values (..., '<해시>')` 자리에 채움.

### 5.2 시연용 사진

- 잠시섬·각 가게·각 활동마다 1~2장씩
- `public/v2/landing/` 패턴 따라 `/v2/seed/<shop-slug>/*.jpg`
- 활동 사진은 Supabase Storage `activity-photos` 버킷에 직접 업로드 후, `seed_demo.sql` 의 `activities.photo_url` 에 public URL 입력

---

## 6. 청풍 운영 인계 자료 (2.6 자세히)

### 6.1 신규 작성 필요 문서
- `docs/admin-onboarding.md` — 관리자 콘솔 사용 가이드
- `docs/operational-policies.md` — 운영 거버넌스 표 결정 사항
- `docs/owner-shop-handover.md` — 가게 등록 + 코드 발급 + 분실 대응

### 6.2 핸드오버 워크숍 (시연 1주 후 권장)
- 청풍 운영 담당자 2~3명에게 1시간 데모
- `/admin` 화면 위주로 라이브 시연 + Q&A
- 운영자가 직접 새 가게 1건 등록까지 손으로 해보게

---

## 7. 다음 세션이 이 파일을 읽고 시작할 때

### 7.1 먼저 봐야 할 것 (3개)
1. **`CLAUDE.md`** — 프로젝트 전체 그림, 데이터 모델, 게임 규칙, Phase 구조
2. **`docs/v2-redesign-status.md`** — v2 리디자인 후속 복구 회고 (이번 작업까지 다 들어있음)
3. **이 파일 (`docs/roadmap-to-launch.md`)** — 남은 일

### 7.2 작업 시작 전 환경 점검
```bash
git checkout main && git pull
npm install
# .env.local 이 없으면:
cp .env.local.example .env.local   # 값은 dev Supabase 키로 채우기
npm run dev   # → http://localhost:3001
```

### 7.3 어디부터 시작할지 모르면
- 데드라인 가까우면 → 2.4 (사장님 편지) 먼저, 그 다음 2.1 (배포)
- 데드라인 여유 있으면 → 2.4 → 2.5 (노드맵) → 2.1 순
- 둘 다 끝났으면 → 2.6 (운영 인계 문서) 또는 P2 항목

### 7.4 작업 단위 권장
- 한 PR = 한 sub-feature (sub-branch off main 또는 통합 브랜치)
- 커밋 메시지 footer 에 Co-Authored-By 푸터 금지 (이 레포 컨벤션)
- PR 머지 전에 `npx tsc --noEmit` + `npm run lint` + `npm run format:check` 통과 확인 (CI 가 동일 검사)

---

## 8. 리스크 핫스팟

| 리스크 | 발견 시점 | 대응 |
|---|---|---|
| 카카오 OAuth 검수 지연 | 4.3 단계에서 redirect 추가 후 첫 로그인 시 | dev redirect 그대로 두고 prod 만 추가. 검수 거부 시 비즈 앱 등록 |
| Supabase Free tier 용량 | 시드 데이터 + 사진 업로드 후 | 1024px 압축 적용 중. 발표 후 Pro 전환 검토 |
| LLM 비용 | Phase 4 라이브 후 | Gemini 무료 tier 우선 + 명시적 버튼 1회 호출만. Anthropic 전환 시 월 한도 monitor |
| 모바일 카메라 EXIF | `/entry/[qr_token]` 실기기 테스트 | `prepareImage` 가 처리. iOS 14+ Safari 동작 확인 필요 |
| 시연 시 라이브 호출 실패 | 4.4 smoke test 단계 | 시연 PC 의 인터넷 연결 백업 (테더링), 도메인 캐시 |
| 노드맵 도입 시간 부족 | 2.5 작업 중 | 정적 SVG fallback. 캡션만 변경 |

---

## 9. 마감 카운트다운 (예시 — 발표일 확정 후 역산)

| 단계 | D-day | 작업 |
|---|---|---|
| **D-21** | — | 2.4 (편지 LLM) 시작 |
| **D-14** | — | 2.5 (노드맵) 시작 |
| **D-10** | — | 2.1 + 2.2 (배포 + 시드) |
| **D-7** | — | 2.3 + 2.6 + 2.7 (체크리스트 + 운영 인계 문서) |
| **D-3** | — | 모바일 실기기 + smoke test |
| **D-2** | — | 시연 리허설 |
| **D-day (6월 발표)** | 🎤 | 시연 |

> 이 표는 추정. 실제 일정은 팀 회의에서 합의된 발표일에 맞춰 D-day 기준으로 역산해 조정.
