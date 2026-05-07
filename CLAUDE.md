# 강화유니버스 대시보드 — 개발 계획

> 이 파일은 카카오임팩트 × 협동조합 청풍 강화도 관계인구 프로젝트 웹앱의 개발 계획서이다.
> Claude Code가 이 디렉토리에서 작업할 때 자동으로 로드된다.
> 참고 문서 : `docs/`, 레포 루트의 `[2026] 강화유니버스 프로젝트 개요.pdf` / `[2026] 강화유니버스 프로젝트 세부 - 1. 예시.pdf`, `대표님미팅_정리.pdf`, `단풍_중간발표자료.pdf`
>
> **⚠️ 팀 회의 확정 대상** 마크가 붙은 섹션은 잠정 결정이며, 팀 회의 이후 바뀔 수 있다.

## Context

카카오임팩트 × 협동조합 청풍 강화도 관계인구 프로젝트의 결과물. 2026년 4월 중간 발표를 이미 진행했고, **6월 최종 발표**를 향해 같은 코드베이스를 이어서 발전시킨다 (throwaway 금지).

핵심 제약:

- 개발자 1인 + 비전공자 팀
- 청풍이 6월 이후 **직접 운영 가능**해야 함
- 이을랩 로컬유니버스 앱과 **역할 분리** → 네이티브 X, **PWA** 고정 (진짜 필요성은 Phase 8에서 재판단)
- 로컬유니버스 앱 = 참여자 개인의 게임형 리워드 앱
  강화유니버스 대시보드 = 다중 역할(참여자·크루·사장님)의 환대 서사 대시보드

## 한 줄 정체성

> **오늘도 강화도가 조금씩 더 강화됩니다.**
>
> 참여자·크루·사장님의 환대 행위가 누적되어 강화도의 서사가 되는 관계 대시보드.

### 가치 제안 (발표 1문장) **⚠️ 팀 회의 확정 대상**

> _(TBD — 팀이 합의할 한 문장)_

이 문장에 직접 기여하지 않는 기능/테이블은 Phase 2 리뷰에서 cut 후보.

## 운영 거버넌스 **⚠️ 팀 회의 확정 대상**

| 영역                                    | 결정권자 |
| --------------------------------------- | -------- |
| 카테고리 정의, 프로젝트 → 카테고리 매핑 | TBD      |
| 에피소드 생성 기준, 공개/비공개 승인    | TBD      |
| 중복/오입력 데이터 정정                 | TBD      |
| 사진·메모 신고 대응, 삭제 요청 처리     | TBD      |
| 계정 분실/재발급 (사장님 코드, 관리자)  | TBD      |

## 세 주인공의 뷰 (재정의)

중간 발표 피드백("주인공이 모호하다")에 대한 구조적 응답 + **"강화도 진척"을 청풍 내부에서 공개로 끌어올림**.

| 뷰                   | 주인공             | 메인 페이지                      | 핵심 질문                    |
| -------------------- | ------------------ | -------------------------------- | ---------------------------- |
| **참여자 뷰**        | 나 (카카오 로그인) | `/collection` (내 도감)          | "내가 강화에 무엇을 쌓았나?" |
| **강화도 뷰 (공개)** | 강화도 자체        | **`/impact` — 누구나 접근 가능** | "강화도가 얼마나 강화됐나?"  |
| **운영 뷰**          | 청풍 + 크루        | `/admin`, `/crew`                | "미션 올리고 진행 업데이트"  |

**핵심 설계 결정** :

1. "강화도가 얼마나 강화됐나" 는 **청풍 내부 지표가 아니라 공개 서사**. 대표님의 "보이지 않는 성과" 문제는 외부에 직접 보여주는 쪽이 더 강하게 해결된다.
2. `/admin` 은 이제 **운영 전담** — 프로젝트·에피소드 CRUD, 가게 등록, 검수, 신고 대응. 노드맵 시각화는 `/impact` 로 이관.
3. 크루 로그인을 Phase 4 → **Phase 3** 로 당김 — 에피소드 진척 업데이트가 MVP 핵심 기능이 되기 때문.

### 참여자 카드 강조 원칙

3뷰 구조는 유지하되, 발표 핵심 임팩트는 참여자 카드에서 나온다.

- **공개 랜딩 히어로** : 참여자 카드 갤러리 중심
- **발표 내러티브** : 참여자 카드 생성 → 도감 → 같은 데이터가 `/impact` 로 집계되는 흐름
- **시각 공들이는 우선순위** : `ActivityCard` 가 먼저, 그 다음 `/impact` 노드맵, `/admin` 운영 UI 는 기능 위주

## 랜딩 라우팅 (역할별 분기) **⚠️ 팀 회의 확정 대상**

`/` 접근 시 `current-actor` 해석 결과에 따라 분기.

| 현재 actor    | `/` 접근 시 기본 화면                        |
| ------------- | -------------------------------------------- |
| 비로그인      | 공개 랜딩 (임팩트 요약 + 참여자 카드 갤러리) |
| 참여자        | `/collection` (본인 도감)                    |
| 크루          | `/crew`                                      |
| 사장님        | `/owner`                                     |
| 관리자 (청풍) | `/admin` (운영 홈)                           |

개별 `/collection` 은 본인만 접근 (RLS). 크루·관리자는 `/impact`, `/feed`, `/projects` 공개 페이지에서 activities 를 열람. 관리자가 필요 시 (신고 대응 등) 개별 카드는 운영 권한으로 열람 가능.

## 4개 카테고리 (청풍 정의)

`[2026] 강화유니버스 프로젝트 개요.pdf` 기준 + 랜딩 페이지 PROJECT_CARDS 와 일관.
초기 시드 (001_initial) 의 어휘 (공유지/네트워크/세계/정책) 는 003 마이그레이션에서 PDF 분류로 재정렬됨.

1. **액티브 라이프 (active_life · 클럽형)** — 몸으로 경험하고 즐기는 활동적 회복 프로젝트 (위캔드 요가, 강화 팜 라이프 등)
2. **로컬 문화 공동 창작 (local_culture · 아카이브형)** — 지역의 색깔을 담은 결과물(IP)을 함께 만드는 프로젝트 (윤슬 앨범, 강화도 차 등)
3. **글로벌 & 로컬 네트워크 (network · 관계형)** — 강화의 환대를 세계와 연결하는 롱텀 프로젝트 (시부야대학·가미야마 교류 등)
4. **테크 & 솔루션 (tech · 인프라형)** — 세계관을 지속 가능하게 만드는 기술적 시도 (로컬 유니버스 앱, 지역 문제 해결 AI 등)

각 카테고리 안에 **장기 프로젝트**, 프로젝트는 여러 해에 걸쳐 **여러 회차(에피소드)** 로 이어진다.

> "환대의 공유지/네트워크/세계/정책" 어휘는 매니페스토 / 랜딩 카피용으로 일부 살아 있으나 (예: layout.tsx 의 "환대로 만들어가는 세계"), DB / 운영 화면의 카테고리 분류는 위 4종으로 통일.

## 핵심 컨셉 — 행위(activity)가 쌓여 서사가 된다

**activities = 참여자의 환대 행위 한 건 = 카드 한 장.** 에피소드 한 번에 여러 activity 가능 — 의도적으로 unique 제약 없음.

행위 타입 (`activities.type`) :

| type           | 의미                             | 주로 누가   |
| -------------- | -------------------------------- | ----------- |
| `memo`         | 한 줄 메모                       | 참여자      |
| `photo`        | 사진 + 캡션                      | 참여자      |
| `check_in`     | QR/위치 체크인                   | 참여자      |
| `workshop`     | 워크숍 참여/산출물               | 참여자      |
| `hi_five`      | 하이파이브 (응원 카운터)         | 누구나      |
| `artifact`     | 결과물 제출 (에세이, 작품, 기록) | 참여자/크루 |
| `archive_link` | 기존 아카이브 링크 등록          | 크루        |

행위가 쌓이면 :

- 참여자 도감 (`/collection`) 에 카드로 박힘 (앞면)
- 크루·사장님이 `reactions` (편지/하이파이브/노트) 을 달면 뒷면 완성
- `contribution_points` 가 가게·프로젝트·카테고리·플랫폼 단위로 누적 (개인 점수는 UI 노출 X)
- `/impact` 공개 페이지의 카운터·카테고리 진척·노드맵에 반영
- `/projects/[slug]` 에피소드 타임라인에 카드 수로 집계

### 중복 방지

`activities.idempotency_key` (클라이언트 UUID) + unique 부분 인덱스 — 재전송·새로고침 중복 차단.

## 게임 규칙

- ① 거래·양도 불가 (카드/포인트는 계정에 귀속)
- ② 행위는 복수 허용, **공개는 opt-in** — 기본값 `is_public = false`
- ③ 사진·메모 모두 비면 저장 불가 (Zod 검증)
- ④ **경쟁/중독 메커니즘 금지** **⚠️ 팀 회의 확정 대상**
  - 금지 : 좋아요, 팔로우, 공개 댓글, 공개 랭킹, 개인 점수 노출
  - 허용 : 카테고리·프로젝트·가게 필터, 관리자 검색, reactions, 공개 검수 큐
- ⑤ 개인정보·초상권 : `face_consent` 자가 체크, `reported_at`/`removed_at` 컬럼 선반영, 신고 플로우

## 목표

1. 5개 플로우(참여자 행위 기록 / 도감 / 공개 임팩트+둘러보기 / 크루·사장님 응원 / 청풍 운영) 시연 가능
2. 게임 규칙 코드로 강제
3. **데이터 모델은 한 번에 풀버전 스키마** — 발표 안 쓰는 테이블은 Phase 5+ 까지 비활성 유지
4. **세 주인공 뷰를 같은 데이터에서 분리 렌더링**
5. 배포 가능한 상태 유지 (push-to-deploy)
6. 단순 운영 UX (관리자 기본 CRUD 를 Phase 3 까지 완성)
7. **`/impact` 공개 페이지로 "강화도 진척" 서사 확보** (Phase 5)

## 기술 스택

| 영역                | 선택                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| 프레임워크          | Next.js 14 (App Router) + TypeScript                                                          |
| 스타일링            | Tailwind CSS + shadcn/ui                                                                      |
| DB / Storage / Auth | Supabase (Postgres + Storage + Auth + RLS)                                                    |
| 참여자 인증         | Supabase Auth + 카카오 OAuth                                                                  |
| 사장님 인증         | 가게 코드 (bcrypt) + httpOnly 쿠키 + 실패 잠금                                                |
| 크루 인증           | 공용 코드 (Phase 3) → 개인 계정 (Phase 7)                                                     |
| 관리자 인증         | Supabase Auth + `role=admin`                                                                  |
| LLM                 | Gemini 2.5 Flash-Lite (`gemini-2.5-flash-lite`) 기본, Anthropic 전환 가능 (편지 첫 문장 제안) |
| 호스팅              | Vercel                                                                                        |
| PWA                 | `public/manifest.json` (Phase 8 재판단)                                                       |
| QR 생성             | `qrcode` npm 패키지                                                                           |
| 폼/검증             | Zod + react-hook-form                                                                         |
| 시각화 (노드맵)     | D3 또는 React Flow (Phase 5 선정)                                                             |

## 데이터 모델

실제 DDL 은 `src/db/migrations/001_initial.sql`. 여기서는 요약만.

```
categories (4종)
  └─ projects (장기, progress_type·progress_target 컬럼 보유)
        ├─ project_hosts (청풍 + 외부 파트너)
        └─ episodes (회차/세션, session_date, status: 예정|진행|완료)
              ├─ episode_archives
              └─ activities        ← 카드 1장 (idempotency_key, face_consent, reported_at, removed_at)
                    └─ artifacts   ← 결과물 복수

shops                 (독립, activities 로 느슨 연결)
shop_owners           (가게 코드 로그인 + 실패 잠금)
reactions             (visibility enum, author_role)
users                 (카카오 로그인, id = auth.uid(), kakao_id UNIQUE)
contribution_points   (subject_type: shop | project | category | platform — user 제외)
contribution_log      (원장)
page_views            (익명 조회 로그)
auth_events           (로그인/로그아웃/권한 변경 감사 로그)
```

### 진척도 관련 필드 **⚠️ 팀 회의 확정 대상**

`projects` 에 진척도 계산 기준을 저장. 관리자가 `/admin/projects` 에서 프로젝트마다 선택.

```
projects.progress_type   enum('time' | 'event' | 'goal' | 'mixed')
projects.progress_target jsonb  -- 기준별 구조
  time:  { start_date, end_date }
  event: { total_episodes: 5 }
  goal:  { target_cards: 200 } 또는 { target_participants: 100 }
  mixed: 복합
```

`/impact` 와 `/projects/[slug]` 는 이 필드를 읽어 진척 바를 그린다. 팀 회의에서 4개 중 기본값 결정.

### 핵심 결정

- `activities` **unique 제약 없음** — 반복 참여 허용. `idempotency_key` 로 기술적 중복만 차단.
- `activities.is_public` 기본 false.
- `activities.reported_at`, `removed_at`, `face_consent` 처음부터 포함.
- `reactions.visibility` = `public | private` (편지 공개/비공개 구분).
- `reactions.author_role` = `participant | crew | owner | admin` — 크루/사장님/관리자 발언은 서버 라우트에서만 insert.
- `episodes.status` = `planned | in_progress | completed` — 크루가 업데이트.
- `users.id = auth.uid()` 1:1, `kakao_id` UNIQUE, upsert 는 idempotent.
- 모든 도메인 테이블 **RLS 활성화** + 정책 매트릭스 정의.
- `contribution_*`, `shop_owners`, `page_views`, `auth_events` 는 client 직접 접근 차단, 쓰기는 전용 route handler 에서 service role + `current-actor` 권한 검증.

## RLS 정책 매트릭스

| 테이블             | 비로그인 read          | 참여자 read             | 참여자 write                          | 크루 read         | 사장님 read                 |
| ------------------ | ---------------------- | ----------------------- | ------------------------------------- | ----------------- | --------------------------- |
| `categories`       | ✅                     | ✅                      | —                                     | ✅                | ✅                          |
| `projects`         | ✅ `is_public=true`    | ✅                      | —                                     | ✅                | ✅                          |
| `project_hosts`    | ✅ (project 공개)      | ✅                      | —                                     | ✅                | ✅                          |
| `episodes`         | ✅ (project 공개)      | ✅                      | —                                     | ✅                | ✅                          |
| `episode_archives` | ✅ (episode 공개)      | ✅                      | —                                     | ✅                | ✅                          |
| `activities`       | ✅ `is_public=true`    | ✅ 본인 + 공개분        | ✅ 본인 only (`user_id = auth.uid()`) | ✅ 전체 (service) | ✅ 본인 가게 연결만         |
| `artifacts`        | ✅ (activity 공개)     | ✅ 본인 + 공개          | ✅ 본인 activity                      | ✅ 전체           | ✅ 본인 가게 연결만         |
| `reactions`        | ✅ `visibility=public` | ✅ 본인 activity + 공개 | ✅ 본인 작성 (제한적)                 | ✅ 전체 (service) | ✅ 본인 가게 연결 (service) |
| `shops`            | ✅ 공개분              | ✅                      | —                                     | ✅                | ✅ 본인 가게                |
| `users`            | —                      | ✅ 본인 only            | ✅ 본인 only                          | —                 | —                           |
| `shop_owners`      | —                      | —                       | —                                     | —                 | —                           |
| `contribution_*`   | —                      | —                       | —                                     | —                 | —                           |
| `page_views`       | —                      | —                       | —                                     | —                 | —                           |
| `auth_events`      | —                      | —                       | —                                     | —                 | —                           |

관리자는 `role=admin` 체크로 모든 테이블 read/write.
크루는 `episodes.status` update 권한을 route handler 에서 별도 부여 (RLS 아님).

## 인증 전략

- **참여자** : Supabase Auth + 카카오 OAuth. 첫 로그인 시 `users` upsert (idempotent).
- **사장님** : 가게 코드 8자리 + bcrypt + httpOnly 쿠키. 실패 5회 시 1시간 잠금, `auth_events` 기록.
- **크루** (Phase 3) : 공용 코드 1개 (관리자가 발급·교체). Phase 7 에 개인 계정으로 전환.
- **관리자(청풍)** : Supabase Auth + `app_metadata.role = 'admin'`. 감사 로그 자동.

### `current-actor` 단일 해석 레이어

```ts
type CurrentActor =
  | { role: "participant"; userId: string; supabaseUserId: string }
  | { role: "crew"; crewSessionId: string }
  | { role: "owner"; shopOwnerId: string; shopId: string }
  | { role: "admin"; supabaseUserId: string }
  | { role: "anonymous" };
```

모든 서버 컴포넌트·route handler 는 `getCurrentActor()` 만 호출. 혼합 인증 복잡도를 한 곳에서 흡수.

### 쿠키 / CSRF

- 모든 쿠키 `httpOnly`, `secure` (prod), `SameSite=Lax`
- 상태 변경 POST route : Origin 검증 + 필요 시 CSRF 토큰

## 페이지 · 역할 매트릭스

전체 페이지가 어느 역할에 접근 가능한지.

| 경로                 |     비로그인     | 참여자  | 크루 | 사장님 |     관리자     |
| -------------------- | :--------------: | :-----: | :--: | :----: | :------------: |
| `/`                  |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/impact`            |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/projects`          |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/projects/[slug]`   |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/shops`             |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/shops/[id]`        |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/feed`              |        ✅        |   ✅    |  ✅  |   ✅   |       ✅       |
| `/login`             |        ✅        |    —    |  —   |   —    |       —        |
| `/auth/callback`     |        ✅        |   ✅    |  —   |   —    |       —        |
| `/entry/[qr_token]`  | ✅ → 로그인 유도 |   ✅    |  —   |   —    |       —        |
| `/collection`        |        —         | ✅ 본인 |  —   |   —    |       —        |
| `/collection/[id]`   |        —         | ✅ 본인 |  —   |   —    | ✅ (신고 맥락) |
| `/me`                |        —         |   ✅    |  —   |   —    |       —        |
| `/owner/login`       |        ✅        |    —    |  —   |   ✅   |       —        |
| `/owner`             |        —         |    —    |  —   |   ✅   |       —        |
| `/owner/letters/new` |        —         |    —    |  —   |   ✅   |       —        |
| `/owner/settings`    |        —         |    —    |  —   |   ✅   |       —        |
| `/crew/login`        |        ✅        |    —    |  ✅  |   —    |       —        |
| `/crew`              |        —         |    —    |  ✅  |   —    |       ✅       |
| `/admin/login`       |        ✅        |    —    |  —   |   —    |       ✅       |
| `/admin`             |        —         |    —    |  —   |   —    |       ✅       |
| `/admin/projects`    |        —         |    —    |  —   |   —    |       ✅       |
| `/admin/shops`       |        —         |    —    |  —   |   —    |       ✅       |
| `/admin/review`      |        —         |    —    |  —   |   —    |       ✅       |
| `/admin/reports`     |        —         |    —    |  —   |   —    |       ✅       |

## 세 주인공별 경험 과정 (페이지 흐름)

### ① 단순 방문자 (비로그인)

```
1. 링크·SNS 공유 → / (공개 랜딩)
   • 강화도 임팩트 요약 카드 (카운터)
   • 참여자 카드 갤러리 히어로
   • 카테고리별 진척 바 요약
   • CTA : "자세히 보기" → /impact
2. /impact — 강화도 진척 대시보드
   • 실시간 카운터
   • 카테고리별 진척 (4개 카테고리)
   • 진행 중 프로젝트 타임라인
   • 노드맵 시각화 (공개 카드만)
   • 최근 공개 카드 → /feed
3. /projects → /projects/[slug]
   • 프로젝트 진척도 (progress_type 기준)
   • 에피소드 타임라인 (예정·진행·완료)
   • 공개 카드 모음
4. /shops → /shops/[id]
5. /feed (공개 카드 시간순, 필터 허용)
6. 참여 결심 → /login → 카카오 OAuth → /auth/callback → /entry/[qr] 또는 /collection
```

### ② 참여자 (카카오 로그인)

**A. 첫 카드 발급 (현장)**

```
1. QR 스캔 → /entry/[qr_token]
2. 비로그인이면 /login → 카카오 OAuth → callback → /entry/[qr_token] 복귀
3. 카드 작성 폼 (Zod 검증)
   • 사진 1장 (카메라 capture, EXIF 회전 보정, 1024px 압축)
   • 한 줄 메모
   • face_consent 체크
   • is_public 토글 (기본 false)
4. POST /api/activities (idempotency_key)
   → Supabase Storage 업로드 → activities insert
5. 성공 → /collection 으로 이동
```

**B. 평소 앱 여는 흐름**

```
1. / 접근 → current-actor = participant → /collection 으로 분기
2. /collection
   • 카드 그리드 (시간순)
   • 받은 reaction 여부 시각 구분
   • 누적 카운터 (카드·가게·에피소드·카테고리별, 개인 점수 없음)
3. /collection/[id]
   • 앞면(본인) + 뒷면(reactions)
   • 공개 토글 / 신고 / 삭제 요청
4. /me 프로필
5. 공개 페이지 자유 탐색 (/impact, /projects, /feed, /shops)
```

### ③ 크루 (Phase 3 부터)

```
1. / 접근 → 비로그인 상태면 공개 랜딩
2. /crew/login → 공용 코드 입력 → 쿠키 세션
3. / 접근 → current-actor = crew → /crew 분기
4. /crew 크루 대시보드
   • 진행 중 에피소드 리스트
     - status 업데이트 (planned → in_progress → completed)
     - 참여자 수·현장 메모 입력
   • 최근 activities → hi_five / note reaction 생성
   • 아카이브 링크 등록 (type='archive_link')
   • 결과물 업로드 (type='artifact')
5. 강화도 전체 진척은 /impact 에서 (운영자도 공개 페이지 사용)
```

### ④ 사장님

```
1. / 접근 → 공개 랜딩
2. /owner/login → 가게 코드 8자리 → bcrypt 검증 → 쿠키
   (실패 5회 시 1시간 잠금, auth_events 기록)
3. / 접근 → current-actor = owner → /owner 분기
4. /owner 우리 가게
   • 본인 가게 연결된 activities (공개·비공개 모두)
   • 카드 선택 → /owner/letters/new
5. /owner/letters/new?activity_id=...
   • 카드 미리보기 (단서)
   • POST /api/llm/draft → Gemini 2.5 Flash-Lite 기본 / Anthropic 전환 가능 (고정 프롬프트)
   • "AI 초안, 꼭 수정해서 보내세요" 라벨 필수
   • visibility 선택 → reactions insert (kind=letter, author_role=owner)
6. /owner/settings
   • 가게 소개·영업시간
   • 가게 공개 ON/OFF (OFF 시 해당 shop 의 공개 카드도 외부 비노출)
```

### ⑤ 청풍 관리자

```
1. /admin/login → Supabase Auth 이메일/비밀번호
2. / 접근 → current-actor = admin → /admin 분기
3. /admin 운영 홈
   • 검수 대기 카드 수
   • 신고 대기 건수
   • 가게 등록·코드 재발급 대기
   • 진행 중 에피소드 요약 (크루 업데이트 상태)
   • "강화도 진척" 은 여기 없음 — /impact 로 가서 봄
4. /admin/projects
   • 프로젝트 CRUD + progress_type·progress_target 설정
   • 에피소드 CRUD (session_date, 목표 참여자)
5. /admin/shops
   • 가게 등록 → QR 생성·다운로드
   • shop_owners 코드 발급 / 재발급
6. /admin/review 공개 검수 큐
   • is_public=true 요청 카드 → 승인·반려
7. /admin/reports 신고 대응
   • reported_at 설정된 카드 리스트 → removed_at 처리
```

## 디렉토리 구조

```
/src
  /app
    /(public)
      /page.tsx                       # / 공개 랜딩 (역할별 분기는 layout에서)
      /impact/page.tsx                # 강화도 진척 대시보드 (NEW)
      /projects/page.tsx
      /projects/[slug]/page.tsx       # 진척도 + 에피소드 타임라인
      /projects/[slug]/[episodeId]/page.tsx
      /shops/page.tsx
      /shops/[id]/page.tsx
      /feed/page.tsx
    /(traveler)
      /entry/[qr_token]/page.tsx
      /collection/page.tsx
      /collection/[id]/page.tsx
      /me/page.tsx
    /(crew)
      /crew/login/page.tsx
      /crew/page.tsx                  # Phase 3 에 구현
    /(owner)
      /owner/login/page.tsx
      /owner/page.tsx
      /owner/letters/new/page.tsx
      /owner/settings/page.tsx
    /(admin)
      /admin/login/page.tsx
      /admin/page.tsx                 # 운영 홈 (노드맵 X, 운영 지표만)
      /admin/projects/page.tsx
      /admin/shops/page.tsx
      /admin/review/page.tsx
      /admin/reports/page.tsx
    /api
      /activities/route.ts            # POST + idempotency_key
      /reactions/route.ts
      /episodes/[id]/status/route.ts  # 크루 전용 PATCH (NEW)
      /llm/draft/route.ts
      /shops/route.ts                 # 관리자 전용
    /auth/callback/route.ts
    /login/page.tsx
    /layout.tsx                       # 역할별 / 분기 여기서
    /globals.css

  /components
    /ui                               # shadcn/ui
    /activities                       # ActivityCard, ActivityForm, ActivityGrid
    /reactions                        # ReactionComposer, ReactionList
    /impact                           # ImpactCounter, CategoryProgress, ProjectTimeline, NodeMap (NEW)
    /projects                         # ProjectCard, EpisodeTimeline, ProgressBar
    /shops                            # ShopCard, ShopGallery
    /admin                            # ReviewQueueItem, ReportItem, ShopForm

  /lib
    /supabase/{client,server,middleware,types}.ts
    /llm/anthropic.ts
    /auth/{current-actor,owner,crew,admin}.ts
    /schemas/{activity,reaction,shop,project,episode}.ts
    /progress/{calculator.ts}         # progress_type 별 계산기
    /utils/{qr,image,cn,csrf}.ts

  /db
    /migrations/001_initial.sql
    /seed.sql

/public
  manifest.json
  /icons
/docs
  test-scenarios.md
  서비스_설계_팀공유용.md
/prototyping
/assets
```

## 단계별 구현 (Phase 0~8)

### Phase 0 — 셋업 ✅ 완료

### Phase 1 — DB + 인증 3종 + 공통 레이아웃

- `001_initial.sql` 적용 확인 (스키마·RLS·카테고리 시드)
- `npx supabase gen types typescript` → `src/lib/supabase/types.ts`
- **`current-actor.ts` 먼저** 작성
- Zod 도메인 스키마 기반
- 참여자 카카오 로그인 + idempotent upsert
- 사장님 코드 로그인 + 실패 잠금 + `auth_events`
- 관리자 Supabase Auth (role=admin)
- CSRF/Origin 검증 유틸
- 공통 Header (역할별 메뉴) + Footer
- `/` 역할별 분기 라우팅

### Phase 2 — 행위 기록 (카드 발급) **[참여자 뷰]**

- `ActivityCard`, `ActivityForm` (디자인 최우선)
- `/entry/[qr_token]` + 로그인 유도·복귀
- 사진 캡처 + 1024px 압축 + EXIF 회전
- 실시간 미리보기, `face_consent`, `is_public` 토글
- `/api/activities` POST (Zod + idempotency)
- 저장 → `/collection`

### Phase 3 — 도감 + 관리자 기본 운영 + **크루 로그인**

**[참여자 뷰]**

- `/collection` 그리드
- `/collection/[id]` 상세 + 공개 토글 + 삭제 요청 + 신고
- 누적 카운터 (개인 점수 X)
- `/me`

**[관리자 기본 운영]**

- `/admin/projects` 프로젝트·에피소드 CRUD (**progress_type·target 설정 포함**)
- `/admin/shops` 가게 등록 + QR + 사장님 코드 발급
- `/admin/review` 공개 검수 큐
- `/admin/reports` 신고 대응

**[크루 로그인 — Phase 4 에서 당김]**

- `/crew/login` 공용 코드
- `/crew` 대시보드 : 에피소드 status 업데이트 + hi_five/note reaction 생성

### Phase 4 — 크루·사장님 응원·편지 **[reaction 계층]**

- `/owner` 대시보드 — 가게 연결 activities
- `/owner/letters/new` 편지 작성
  - LLM 고정 프롬프트 (`/api/llm/draft`)
  - "AI 초안, 꼭 수정해서 보내세요" 라벨 강제
  - visibility 선택 → reactions insert
- `/owner/settings` 가게 공개 ON/OFF
- 크루 기능 확장 (artifact, archive_link 등록)
- `reactions` 참여자 `/collection/[id]` 실시간 반영

### Phase 5 — **공개 임팩트 페이지 `/impact`** (재정의됨)

기존 "청풍 뷰 노드맵" 을 공개로 끌어올린 핵심 Phase.

- `/impact` 구성
  - 실시간 카운터 (카드·가게·참여자·에피소드·응원)
  - 카테고리별 진척 바 (4개)
  - 진행 중 프로젝트 타임라인 (`progress_type` 기반)
  - 노드맵 시각화 (카테고리→프로젝트→에피소드→가게, 공개분만)
  - 최근 공개 카드 미리보기
- `/projects/[slug]` 진척도 바 + 에피소드 타임라인 + 공개 카드
- 발표 내러티브 : 참여자 카드 → 이 페이지에서 집계로 보임

### Phase 6 — 공개 둘러보기 (나머지 공개 뷰)

- `/` 공개 랜딩 (임팩트 요약 + 참여자 카드 히어로)
- `/projects` 카테고리별 리스트
- `/shops`, `/shops/[id]`
- `/feed` 공개 카드 시간순
- 허용 필터 : 카테고리·프로젝트·가게
- 금지 : 좋아요·팔로우·공개 댓글·공개 랭킹

### Phase 7 — 관리자 고도화 + 운영 디테일

- 카드 디자인 설정 (theme_color, accent_color, slogan, frame_style)
- 크루 계정 개인화 (공용 코드 → 개별 계정)
- 관리자 UX 개선 (청풍 비전공자 기준)
- 추가 감사 로그 뷰

### Phase 8 — 정책 최종 점검 + 데모 준비

정책은 Phase 2 부터 선반영되므로 여기선 확인만.

- PWA 실사용 필요성 재판단
- `src/db/seed.sql` 시연 데이터
- 데모 시나리오 스크립트
- 모바일 실기기 UX 점검
- 버그 수정 + 디자인 다듬기

## 테스트 전략

- `docs/test-scenarios.md` 수동 체크리스트
- 인증 유닛 테스트만 (current-actor, bcrypt, CSRF, OAuth callback idempotency)
- 각 Phase 종료 시점에 수동 체크리스트 전 항목 수행
- 풀버전에서 Playwright/Vitest 도입

## 확장성 보장 결정

1. 스키마 풀버전 한 번에 (발표 안 쓰는 테이블은 비활성 유지)
2. 단일 `activities` + reactions 분리
3. `activities` unique 제약 없음 + `idempotency_key`
4. TypeScript + Zod — Supabase 생성 타입과 Zod 도메인 스키마 분리
5. shadcn/ui 코드 직접 소유
6. RLS 정책 매트릭스 처음부터
7. 단일 `current-actor` 레이어
8. 정책(공개/삭제/신고/초상권) 선반영
9. **`/impact` 공개화로 "강화도 진척" 서사 확보** — 운영 대시보드와 공개 서사 분리
10. 환경 분리 (dev / preview / prod)
11. Phase 단위 배포

## 리스크와 대응

| 리스크                 | 대응                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| 카카오 OAuth 검수      | Phase 0 완료                                                           |
| 모바일 카메라·EXIF     | `capture="environment"` + EXIF 회전 보정                               |
| Supabase Free tier     | 1024px 압축                                                            |
| LLM API 비용           | Gemini 무료 tier 우선, 명시적 버튼에서만. Anthropic 은 키 발급 후 전환 |
| 솔로 dev 번아웃        | Phase 단위 배포                                                        |
| "주인공 모호" 피드백   | 세 주인공 + 참여자 카드 강조 + `/impact` 공개로 "강화도 진척" 가시화   |
| 로컬유니버스 앱과 중복 | 다중 역할 환대 서사 대시보드 포지셔닝                                  |
| 청풍 운영 인계 어려움  | 관리자 CRUD Phase 3, `/admin` 평문 폼                                  |
| 혼합 인증 복잡도       | `current-actor` 단일 레이어 + 관리자 Supabase Auth 통일                |
| CSRF                   | SameSite + Origin + 상태 변경 토큰                                     |
| service role 남용      | 전용 route handler, 진입부 권한 검증                                   |
| 중복 저장              | `idempotency_key`                                                      |
| 초상권/개인정보        | `face_consent` + `reported_at` + 신고·삭제 절차                        |
| 공개 콘텐츠 빈곤       | 공개 전환 UX + 검수 큐에서 공개 추천                                   |
| 포인트 왜곡            | 개인 점수 UI X, 집계 단위만                                            |
| 진척도 기준 혼란       | `progress_type` 컬럼으로 프로젝트마다 선택 (팀 결정)                   |

## 검증 (수동, 시연 직전)

`docs/test-scenarios.md` 로 관리. 주요 항목:

1. 카카오 로그인 → `users` upsert, 재로그인 시 중복 없음
2. QR 진입 → activity 생성 → `/collection` 표시
3. 같은 에피소드 두 번 → 카드 2장
4. 같은 폼 두 번 제출 → `idempotency_key` 1건만
5. 공개 토글 → `/feed`, `/shops/[id]`, `/impact` 최근 카드에 반영
6. 공개 철회·삭제 요청 → 공개 영역 즉시 제거
7. 사장님 편지 → `/collection/[id]` 실시간 반영
8. 하이파이브 → `contribution_points` (가게·프로젝트) 증가, `/impact` 노드맵·카운터 반영
9. 크루가 에피소드 status 업데이트 → `/projects/[slug]` 타임라인 반영
10. `/impact` 카테고리별 진척 정확성
11. `/projects/[slug]` progress_type 별 진척 바 계산 정확성
12. 관리자 검수 승인 → 공개 영역 노출
13. RLS : 다른 계정 카드 접근 차단, 가게 OFF 시 외부 차단
14. 사장님 코드 5회 실패 → 잠금 + `auth_events`
15. CSRF : 외부 도메인 POST 차단
16. service role route : 미인증 호출 시 403
17. 모바일 iOS Safari + Android Chrome
18. (Phase 8) PWA 홈화면 추가 → 풀스크린

## 핵심 파일

| 경로                                             | 역할                                                            |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `src/db/migrations/001_initial.sql`              | 스키마·RLS·카테고리 시드                                        |
| `src/lib/supabase/{server,middleware}.ts`        | SSR 클라이언트·세션 갱신                                        |
| `src/lib/auth/current-actor.ts`                  | **단일 actor 해석**                                             |
| `src/lib/auth/{owner,crew,admin}.ts`             | 역할별 인증                                                     |
| `src/lib/schemas/activity.ts`                    | Zod activity 스키마                                             |
| `src/lib/progress/calculator.ts`                 | progress_type 별 진척 계산                                      |
| `src/lib/utils/csrf.ts`                          | CSRF·Origin 검증                                                |
| `src/lib/llm/{index,gemini,anthropic,prompt}.ts` | Gemini 기본 / Anthropic 전환 가능한 편지 첫 문장 LLM 클라이언트 |
| `src/components/activities/ActivityCard.tsx`     | 카드 (참여자/공개 뷰 공용)                                      |
| `src/components/activities/ActivityForm.tsx`     | 카드 작성 폼                                                    |
| `src/components/impact/NodeMap.tsx`              | `/impact` 노드맵                                                |
| `src/components/impact/CategoryProgress.tsx`     | 카테고리 진척 바                                                |
| `src/components/projects/ProgressBar.tsx`        | 프로젝트 진척 바                                                |
| `src/components/reactions/ReactionComposer.tsx`  | 편지·응원                                                       |
| `src/app/auth/callback/route.ts`                 | 카카오 OAuth 콜백 (idempotent)                                  |
| `src/app/(traveler)/entry/[qr_token]/page.tsx`   | QR 진입                                                         |
| `src/app/(traveler)/collection/page.tsx`         | 참여자 도감                                                     |
| `src/app/(public)/impact/page.tsx`               | **공개 임팩트 대시보드** (Phase 5)                              |
| `src/app/(public)/projects/[slug]/page.tsx`      | 프로젝트 진척·타임라인                                          |
| `src/app/(admin)/admin/review/page.tsx`          | 공개 검수 큐                                                    |
| `src/app/(admin)/admin/reports/page.tsx`         | 신고 대응                                                       |
| `src/app/(crew)/crew/page.tsx`                   | 크루 대시보드 (Phase 3)                                         |
| `src/app/api/activities/route.ts`                | 카드 생성                                                       |
| `src/app/api/episodes/[id]/status/route.ts`      | 크루 status 업데이트                                            |
| `docs/test-scenarios.md`                         | 수동 체크리스트                                                 |

## MVP 에서 빼고 풀버전에서 추가할 것

| 항목                   | MVP                                 | 풀버전                      |
| ---------------------- | ----------------------------------- | --------------------------- |
| 시차 발송              | `scheduled_at` 컬럼만, 즉시 발송    | Vercel Cron + Edge Function |
| 카카오 알림톡          | 인앱 표시만                         | Supabase Edge + 알림톡 API  |
| 답장 (참여자 → 사장님) | 자리만                              | 정식 답장 + LLM 보조        |
| NFC 트리거             | QR 만                               | NFC 태그                    |
| 모더레이션 자동화      | 관리자 수동 (검수·신고 큐)          | 자동 필터 + 신고 점수화     |
| LLM 톤 가이드          | 고정 프롬프트 + "수정해서 보내세요" | 청풍 톤·매너 가이드         |
| 동행자 매칭            | X                                   | 자동 매칭                   |
| 카드 디자인 풀 에디터  | color/slogan/frame 프리셋           | 풀 에디터                   |
| 크루 계정              | Phase 3 공용 코드 → Phase 7 개별    | 크루 역할·권한 분리         |
| 테스트 자동화          | 수동 체크리스트 + 인증 유닛         | Playwright E2E + Vitest     |
| 관리자 감사 로그 뷰    | `auth_events` 테이블                | 전체 행위 타임라인 UI       |
| 진척도 고급 분석       | progress_type 4종                   | 커스텀 지표 대시보드        |
