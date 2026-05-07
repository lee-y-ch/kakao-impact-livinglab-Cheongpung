# v2 리디자인 — 적용 현황 & 후속 작업

> 작성일 : 2026-05-06
> 기준 커밋 : `f2ec895 feat: v2 redesign — 팀원 시안 적용 (Navbar/Footer 글로벌화 + 9개 페이지 포팅)`
> 브랜치 : `feat/v2-redesign`
>
> **이 문서의 목적** — v2 시안 적용 직후, "기능적으로 무엇이 살아있고 무엇이 끊겼는지"를 한 곳에 기록한다. 다른 세션에서 이 문서만 읽고 복구 작업을 이어갈 수 있도록 자기완결적으로 작성됨.

---

## 0. TL;DR (한 줄)

**UI 만 v2 시안으로 교체됐다. 백엔드(Supabase, RLS, API routes, lib/auth, lib/schemas, DB migrations)는 모두 살아있지만, 9개 공개/역할 페이지가 시안의 하드코딩 데이터로 대체되어 Supabase 페치가 끊긴 상태다.** 복구는 페이지별로 가능 (단순한 SELECT 쿼리 + RLS 의존).

---

## 1. 살아있는 것 (그대로 사용 가능)

### 1.1 백엔드 / 인프라
- `src/db/migrations/001_initial.sql` 전체 스키마 + RLS 정책 + 카테고리 시드
- `src/db/seed_demo.sql` (있다면) 시연용 데이터
- `src/lib/supabase/{client,server,admin,middleware,types}.ts` — Supabase 클라이언트 3종 (브라우저 / SSR / service role)
- `src/lib/auth/current-actor.ts` — 단일 actor 해석 레이어 (`participant | crew | owner | admin | anonymous`)
- `src/lib/auth/{owner,crew,admin}.ts` — 역할별 require 헬퍼 (`requireParticipantUser`, `requireCrewSession`, `requireAdminUser` 등)
- `src/lib/schemas/{activity,reaction,shop,project,episode}.ts` — Zod 스키마
- `src/lib/progress/calculator.ts` — `progress_type` 별 진척 계산
- `src/lib/utils/{csrf,image,qr,cn}.ts`
- `src/lib/llm/{index,gemini,anthropic,prompt}.ts` — Gemini 2.5 Flash-Lite 기본, Anthropic 전환 가능 클라이언트

### 1.2 API 라우트 (전부 라이브)
```
src/app/api/
├── activities/route.ts                    POST 카드 생성 (idempotency_key)
├── activities/[id]/route.ts               PATCH/DELETE 카드 수정·삭제
├── reactions/route.ts                     POST hi_five / letter
├── episodes/[id]/status/route.ts          PATCH 크루 status 업데이트
├── auth/owner/route.ts                    사장님 코드 로그인
├── auth/crew/route.ts                     크루 공용 코드 로그인
├── auth/logout/route.ts                   세션 종료
├── dev/login/route.ts                     dev 환경 빠른 로그인
├── admin/projects/route.ts                관리자 프로젝트 CRUD
├── admin/projects/[id]/route.ts
├── admin/projects/[id]/episodes/route.ts
├── admin/episodes/[id]/route.ts
├── admin/shops/route.ts                   관리자 가게 CRUD + QR
├── admin/shops/[id]/route.ts
├── admin/shops/[id]/owners/route.ts       사장님 코드 발급
├── admin/shop-owners/[id]/route.ts
└── admin/activities/[id]/moderate/route.ts 검수 승인·반려
```

### 1.3 인증 플로우 (UI 만 legacy 톤, 기능 OK)
- `src/app/auth/callback/route.ts` — 카카오 OAuth 콜백 (idempotent users upsert)
- `src/app/(default)/login/page.tsx` — 카카오 로그인
- `src/app/(default)/owner/login/page.tsx` — 가게 코드 8자리
- `src/app/(default)/crew/login/page.tsx` — 크루 공용 코드
- `src/app/(default)/admin/login/page.tsx` — Supabase Auth 이메일/비밀번호

### 1.4 Legacy UI 가 살아있는 페이지들 (기능 정상, 디자인은 v1 톤)
이들은 v2 적용 범위에서 제외돼서 옛 디자인 그대로다. 나중에 v2 시안이 추가로 나오면 같은 패턴으로 교체.

```
src/app/(default)/
├── me/page.tsx                           프로필
├── shops/page.tsx                        가게 리스트
├── shops/[id]/page.tsx                   가게 상세
├── login/page.tsx                        ↑ (1.3 참조)
├── owner/login/page.tsx
├── crew/login/page.tsx
├── admin/login/page.tsx
├── admin/projects/page.tsx               관리자 프로젝트 CRUD
├── admin/projects/[id]/page.tsx
├── admin/shops/page.tsx                  관리자 가게 CRUD
├── admin/shops/[id]/page.tsx
├── admin/review/page.tsx                 공개 검수 큐 (실제 동작)
└── admin/reports/page.tsx                신고 대응

src/app/owner/
├── page.tsx                              사장님 대시보드
└── letters/new/page.tsx                  편지 작성 (LLM)
```

⚠️ root layout 이 글로벌 Navbar/Footer 를 적용하므로, **이 페이지들도 머리 위에 v2 Navbar 가 노출된다.** 본문은 legacy 톤이라 시각적으로 어색할 수 있음.

---

## 2. 끊긴 것 (v2 시안의 하드코딩으로 교체됨)

### 2.1 페이지 9 종 — 정적 시안

각 페이지는 시안 그대로의 markup + 하드코딩된 카피. **Supabase 페치 0건, RLS·인증 체크 0건.**

| 라우트 | 시안 출처 | 끊긴 데이터 | 끊긴 인증 |
|---|---|---|---|
| `/` | `index.html` | Stats 3 cell (2022/1240/284) | — |
| `/impact` | `강화유니버스_임팩트.html` | Stats 6 cell, 노드맵, 카테고리 진척 4행, 최근 카드 4장 | — |
| `/projects` | `강화유니버스_프로젝트.html` | 프로젝트 리스트 | — |
| `/projects/[slug]` | (시안 없음, 가짜 정적) | 프로젝트 상세, 에피소드, 진척바 | — |
| `/feed` | `강화유니버스_피드.html` | 공개 카드 시간순 | — |
| `/collection` | `강화유니버스_도감.html` | 본인 카드 그리드 | ❌ 참여자 인증 |
| `/collection/[id]` | `강화유니버스_카드상세.html` | 카드 + reactions | ❌ 본인 RLS |
| `/entry/[qr_token]` | `강화유니버스_카드작성.html` | QR token 검증, 폼 제출 | ❌ 참여자 인증 |
| `/crew` | `강화유니버스_크루.html` | 진행 중 에피소드, status 업데이트 | ❌ 크루 세션 |
| `/admin` | `강화유니버스_관리자.html` | 검수 큐 카운트, 신고 카운트, 에피소드, 운영 지표 | ❌ 관리자 인증 |

> **인증이 끊긴 페이지** (`/collection`, `/collection/[id]`, `/entry/[qr_token]`, `/crew`, `/admin`) **는 현재 누구나 열어볼 수 있다 — 보안 이슈.** 우선순위 P0.

### 2.2 Navbar 한계
`src/components/layout/Navbar.tsx` — fixed top 정적 nav.
- 현재 actor 상태 표시 안 함 (로그인 여부 / 역할 미반영)
- 로그아웃 버튼 없음
- "참여하기 →" 가 `#cta` 앵커. 비로그인이면 `/login` 이 정답.
- "내 도감" 링크가 비로그인 상태에서도 `/collection` 으로 직접 — 로그인 유도 필요.
- 모바일에서 `nav-links` 가 `hidden lg:flex` 라 햄버거 메뉴 부재.

### 2.3 Footer 한계
`src/components/layout/Footer.tsx` — 다크 멀티컬럼.
- 모든 링크가 정적 텍스트 (실제 링크 없음). `<li>` 가 `cursor-pointer` 인데 클릭해도 아무 일 X.
- 이용약관 / 개인정보처리방침 페이지 미존재.

### 2.4 폐기되었으나 남아있는 컴포넌트 (orphan)
import 0건. 다음 정리 커밋에서 삭제 권장.

```
src/components/claude/PublicTopNav.tsx
src/components/claude/primitives.tsx
src/components/layout/Header.tsx          (이전 (default) chrome)
src/components/layout/HeaderNav.tsx
src/components/layout/LogoutButton.tsx
src/components/landing/                   (있다면)
src/components/impact/node-map/           (있다면)
src/components/activities/                (있다면)
src/components/projects/                  (있다면)
```

확인 명령:
```bash
grep -rEl "components/(claude|landing|layout/Header|layout/HeaderNav|layout/LogoutButton|impact/node-map|activities|projects)" src/
```

---

## 3. 페이지별 복구 To-Do (우선순위 순)

### 🔴 P0 — 보안·인증 (먼저)

#### 3.1 `/collection` — 참여자 인증 + 본인 카드
**현재** : v2 시안의 하드코딩 카드 그리드.
**해야 할 것** :
1. 페이지 상단에 `await requireParticipantUser()` 호출 → 비로그인이면 `/login?next=/collection` 으로 redirect.
2. `createServerClient()` 로 본인 `user_id` 의 `activities` SELECT (`removed_at IS NULL`, 시간순 desc).
3. 각 카드의 `reactions` 카운트 조인 (편지/하이파이브 별로) — 시안의 카드 footer strip 에 표시.
4. 시안의 하드코딩 카드 데이터를 fetch 결과로 교체.
5. 카드 클릭 → `/collection/[id]` Link.

**참고** : `src/lib/auth/current-actor.ts`, `src/db/migrations/001_initial.sql` 의 `activities` / `reactions` 테이블, RLS 정책 매트릭스 (CLAUDE.md).

#### 3.2 `/collection/[id]` — 본인 카드 상세
**해야 할 것** :
1. `params.id` 로 `activities` SELECT. RLS 가 본인 + 공개분만 통과시켜줌.
2. 해당 activity 의 `reactions` 모두 fetch (visibility 무관 — 본인이니까).
3. 시안 그대로 앞면(메모/사진/장소) + 뒷면(reactions) 렌더.
4. 공개 토글 / 신고 / 삭제 요청 버튼 → `/api/activities/[id]` PATCH/DELETE 연결.

#### 3.3 `/entry/[qr_token]` — QR 진입 + 카드 발급
**해야 할 것** :
1. `params.qr_token` 으로 `shops` 또는 `episodes` SELECT (DB 스키마 따라 다름 — `qr_token` 필드 확인). 미존재 시 404.
2. `await getCurrentActor()` → 비로그인이면 `/login?next=/entry/[qr_token]` redirect.
3. 카드 작성 폼 :
   - 사진 1장 (`capture="environment"`, EXIF 회전, 1024px 압축 — `src/lib/utils/image.ts` 사용)
   - 한 줄 메모
   - `face_consent` 체크박스
   - `is_public` 토글 (기본 false)
4. 폼 제출 → `POST /api/activities` (Zod + idempotency_key 자동 생성). API 라우트는 살아있음.
5. 성공 → `/collection` redirect.

**참고** : `src/lib/schemas/activity.ts`, `src/app/api/activities/route.ts`.

#### 3.4 `/crew` — 크루 인증 + 에피소드 관리
**해야 할 것** :
1. `await requireCrewSession()` 호출 → 비로그인이면 `/crew/login` redirect.
2. `episodes` SELECT (`status IN ('planned','in_progress')` + 최근 진행).
3. 에피소드 status 변경 버튼 → `PATCH /api/episodes/[id]/status` 연결.
4. 최근 `activities` 리스트 → 하이파이브/노트 reaction 생성 → `POST /api/reactions`.
5. 아카이브 링크·결과물 등록 (`type='archive_link'`, `type='artifact'`).

#### 3.5 `/admin` — 관리자 인증 + 운영 지표
**해야 할 것** :
1. `await requireAdminUser()` 호출 → 비로그인이면 `/admin/login` redirect.
2. `createAdminClient()` 로 SELECT :
   - 검수 대기 카드 수 (`is_public=true AND moderation_status='pending'` 또는 비슷한 컬럼)
   - 신고 대기 카드 수 (`reported_at IS NOT NULL AND removed_at IS NULL`)
   - 가게 등록 대기, 사장님 코드 재발급 대기
   - 진행 중 에피소드 (오른쪽 패널)
   - 운영 지표 5종 (검수 처리율, 평균 응답, 신고 건수, 새 가게, 크루 활동)
3. 검수 큐 카드의 승인/반려 버튼 → `POST /api/admin/activities/[id]/moderate` 연결 (이 라우트 살아있음).
4. **Sidebar 와 글로벌 Navbar 가 동시에 보이는 문제** — admin 페이지에서 Navbar 숨김 처리 필요. 권장 패턴: `src/app/admin/` 를 route group `(no-chrome)/admin/` 으로 이동하고 `(no-chrome)/layout.tsx` 에서 자체 `<html><body>` 셸을 그리거나, root layout 에서 pathname 검사 (Next.js 14 server component 에서는 `headers()` + middleware injected `x-pathname` 패턴).

### 🟡 P1 — 공개 데이터 (그 다음)

#### 3.6 `/impact` — 강화도 진척 공개 대시보드
**해야 할 것** :
1. SELECT 6 stat (시안의 하드코딩 6 카운터를 실제 카운트로) :
   - 누적 환대 카드 (`activities` count where `is_public=true AND removed_at IS NULL`)
   - 연결된 가게 (`shops` count where `is_public=true`)
   - 참여자 (`users` count)
   - 에피소드 (`episodes` count where `status='completed'` 또는 전체)
   - 사장님 편지 (`reactions` count where `kind='letter' AND author_role='owner'`)
   - 하이파이브 (`reactions` count where `kind='hi_five'`)
2. 카테고리별 진척 4행 — `categories` × `activities` 집계 (각 카테고리 목표 대비 현재 카드 수). `src/lib/progress/calculator.ts` 확장.
3. 최근 공개 카드 4장 — `activities` order by `created_at desc limit 4 where is_public=true`.
4. 노드맵 SVG — 현재 정적 좌표. **이대로 둬도 됨** (시연용). 추후 D3/React Flow 로 데이터 연결.

#### 3.7 `/projects` 와 `/projects/[slug]`
**해야 할 것** :
1. `/projects` — `categories` + `projects` SELECT (`is_public=true`), 4 카테고리별 그룹.
2. `/projects/[slug]` — `slug` 로 단건 fetch + `episodes` 시간순 + `progress_type` 진척바 계산.

#### 3.8 `/feed`
**해야 할 것** :
1. `activities` SELECT (`is_public=true AND removed_at IS NULL`) order by `created_at desc`, limit 50.
2. 카테고리·프로젝트·가게 필터 query param (`?category=network` 등) 지원.
3. 좋아요/팔로우/댓글/랭킹 **금지** (CLAUDE.md 게임 규칙).

### 🟢 P2 — 메인 + chrome 보강

#### 3.9 `/` — 메인 Stats 만 실데이터
- `2022` 는 그대로 (시작 연도, format=false).
- `1240` 누적 방문자 → `page_views` 테이블 count 또는 `activities` 시간순 누적.
- `284` 강화유니버스 주민 → `users` count.

#### 3.10 Navbar — actor 상태 + 로그인/로그아웃
1. `Navbar` 를 server component 로 변환하고 `await getCurrentActor()` 결과를 prop 으로 받거나, root layout 에서 actor 를 fetch 해 `<Navbar actor={...} />` 형태로 주입.
   - 현재 `Navbar` 는 `"use client"` (scroll detect 위해). 하이브리드 패턴 — server wrapper `NavbarServer.tsx` 가 actor fetch → client `NavbarClient.tsx` 에 prop 전달.
2. actor 별 분기 :
   - anonymous → "참여하기 →" 가 `/login` 가리킴
   - participant → "참여하기 →" 자리에 "마이 페이지" 또는 actor.userName + 로그아웃 버튼
   - crew/owner/admin → 자기 홈으로 가는 링크
3. "내 도감" 링크 — 비로그인이면 `/login?next=/collection`.
4. 모바일 햄버거 메뉴 (현재 `lg:flex` 로 숨김 상태) — drawer 패턴.

#### 3.11 Footer — 실제 링크
- 카테고리/소개/FAQ → 메인 페이지 앵커 (`/#projects`, `/#faq`).
- 이용약관·개인정보처리방침 페이지 신규 (`/legal/terms`, `/legal/privacy`).

### 🔵 P3 — 정리

#### 3.12 Orphan components 삭제
2.4 에 나열된 파일들 import 0건 확인 후 삭제. `git rm`.

#### 3.13 (default) legacy 페이지 v2 톤으로 마이그레이션
- `/me`, `/shops`, `/shops/[id]` (공개 페이지)
- `/login`, `/owner/login`, `/crew/login`, `/admin/login` (인증 페이지 — Navbar/Footer 노출 여부 결정)
- `/admin/projects`, `/admin/shops`, `/admin/review`, `/admin/reports` (관리자 sub) — `/admin` 의 sidebar 와 통일된 디자인 시스템
- `/owner`, `/owner/letters/new` (사장님)

이들은 시안이 별도로 없으므로 **기존 v2 디자인 토큰 + 패턴을 활용해 직접 디자인**해야 함. `tailwind.config.ts` 의 `v2.*` 색을 그대로 사용.

#### 3.14 `잠시섬 메인 사진.png` 정식 자산 교체
현재 `/v2/guniverse_images/guniverse_01.jpg` 로 placeholder. 팀에 정식 사진 요청.

---

## 4. 디자인 시스템 (이미 자리잡힌 것)

새 페이지 만들 때 이 토큰·컴포넌트만 사용한다.

### 4.1 Tailwind v2 토큰 (`tailwind.config.ts`)
```
v2.paper        #F9FAFB    가장 밝은 배경
v2.paper2       #F4F5F7
v2.paper3       #EDEEF0
v2.ink          #1A1A1A    본문
v2.ink2         #5A5A5A
v2.ink3         #6E6E73
v2.ink4         #999999
v2.rule         #E6E5E0    구분선
v2.brand        #2ECC8E    primary
v2.brandDeep    #1DB87A    primary hover
v2.cardActive   #FDF4EC    액티브 라이프 (4 카테고리 카드)
v2.cardLocal    #EAF5EE    로컬 문화 공동 창작
v2.cardGlobal   #EEF3FF    글로벌 네트워크
v2.cardTech     #E8F0F5    테크 & 솔루션
v2.activeAccent #9B6020    카드 텍스트
v2.localAccent  #3A7A55
v2.globalAccent #2060C8
v2.techAccent   #2060A0
v2.footer       #0F0F0F
```

폰트 : `'Noto Sans KR'` 우선, Pretendard fallback.

### 4.2 재사용 컴포넌트
- `@/components/v2/AnimateOnScroll` — IntersectionObserver + reduced-motion 가드. props: `delay` (초), `variant` `"up" | "fade"`, `className`, `as`.
- `@/components/v2/CountUp` — easeOutQuart 카운터. props: `target` (number), `format` (boolean, true=ko-KR 콤마), `duration`, `className`.
- `@/components/v2/FaqAccordion` — single-open. props: `items: { q: string; a: string }[]`.
- `@/components/layout/Navbar` — root layout 에서 자동 렌더. **페이지 안에서 다시 그리지 말 것.**
- `@/components/layout/Footer` — 동상.

### 4.3 시안 패턴 참고용 페이지
새 페이지 디자인할 때 이 두 파일을 참고 :
- `src/app/page.tsx` — Hero / IntroStrip / 이미지+텍스트 / 4 카드 그리드 / Manifesto / Stats / FAQ / CTA
- `src/app/impact/page.tsx` — Page header (그라디언트) / Stats strip / SVG 시각화 / Progress bar / Card grid / Notice strip

### 4.4 시안 원본
`design-v2-reference/` 9 HTML 파일 (git 추적). 이미지는 `public/v2/`.

---

## 5. 환경·실행

### 5.1 dev 서버
```bash
npm run dev   # 기본 포트 3001 (이전 commit 79164e0 참조)
```

### 5.2 검증 명령
```bash
npm run lint              # ESLint
npx tsc --noEmit          # TypeScript
```

### 5.3 Supabase 로컬
- `.env.local` 에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 설정.
- Migration 적용 : Supabase 대시보드 SQL editor 또는 `supabase migration up`.

---

## 6. 작업 순서 권장

가장 가성비 좋은 순서.

1. **`/collection` + `/collection/[id]` + auth 가드** (P0) — 참여자 핵심 플로우. 도감이 보안상 가장 중요.
2. **`/entry/[qr_token]`** (P0) — 카드 발급 (api/activities 살아있음, 폼만 연결).
3. **Navbar actor 상태 + 로그인 분기** (P2) — UX 기본. 로그인 → 도감 으로 자연스럽게.
4. **`/admin` + sidebar/Navbar 충돌 해결 + 검수 큐 연결** (P0/P1) — 운영 가능 상태.
5. **`/crew`** (P0) — 에피소드 status 업데이트.
6. **`/impact` 실데이터** (P1) — 시연 효과 큰 공개 대시보드.
7. **`/feed`, `/projects`** (P1) — 공개 페이지.
8. **`/` 메인 Stats** (P2) — 가장 가벼운 작업.
9. **(default) legacy 페이지 v2 톤 마이그레이션** (P3) — 시각 통일.
10. **Orphan 컴포넌트 정리** (P3) — 코드베이스 청결.

---

## 7. 메모

- 개인 점수·랭킹 UI 절대 금지 (CLAUDE.md 게임 규칙 ④).
- 모든 도메인 테이블 RLS 활성화돼 있음. **service role 사용은 route handler 안에서만**, 페이지 server component 는 `createServerClient()` 사용.
- 카드 사진 업로드는 Supabase Storage. 1024px 압축 + EXIF 회전 — `src/lib/utils/image.ts`.
- 카드 작성 시 `idempotency_key` 클라이언트에서 UUID 생성 (재전송·새로고침 중복 차단).
- `current-actor.ts` 만 호출하라. 직접 `getServerSession()` 등 호출 금지 — 혼합 인증 복잡도가 한 곳에서 흡수됨.
