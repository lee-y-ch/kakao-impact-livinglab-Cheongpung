# 🏛️ 카카오 임팩트 리빙랩 - 청풍

> 카카오 임팩트 리빙랩 깃헙입니다.

---

## 👥 팀원 소개

| 이름   | 역할        |
| :----- | :---------- |
| 이용찬 | 개발        |
| 김민경 | 디자인      |
| 정채연 | 기획/데이터 |
| 전현승 | 데이터      |

---

## 📂 폴더 안내

- **docs/**: 회의록, 시장조사 등 모든 문서 자료
- **assets/**: 발표 자료, 사진, 로고 등 이미지 파일
- **prototyping/**: 서비스 설계 및 피그마 링크
- **src/**: 웹앱 개발 소스 코드 (Next.js 14 App Router)
- **public/**: PWA 매니페스트, 앱 아이콘 등 정적 자원

---

## 🔗 주요 링크

---

# 강화유니버스 대시보드

> **오늘도 강화도가 조금씩 더 강화됩니다.**
>
> 카카오임팩트 × 협동조합 청풍 강화도 관계인구 프로젝트의 웹앱.
> 참여자·크루·사장님의 환대 행위가 누적되어 강화도의 서사가 되는 **관계 대시보드**.

## 이 프로젝트에 대해

- **두 주인공, 하나의 데이터**
  - 참여자 뷰 : 내가 강화에 쌓은 행위의 기록 (도감 + 누적)
  - 청풍 뷰 : 강화도가 얼마나 강화됐는가의 지도 (관리자 대시보드, 노드맵)
  - 같은 `activities` 데이터를 서로 다른 쿼리·렌더링으로 조회한다.
- **4개 카테고리** (청풍 정의) : 환대의 공유지 / 네트워크 / 세계 / 정책
- **장기 프로젝트 단위** : 시부야대학 교류처럼 다년간 여러 회차(에피소드)로 이어지는 프로젝트를 1급 시민으로 모델링.
- **PWA, 네이티브 아님** : 이을랩 로컬유니버스 앱과의 역할 분리.

더 자세한 기획은 `docs/` 와 `CLAUDE.md` 를 참고.

## 기술 스택

| 영역            | 선택                                  |
| --------------- | ------------------------------------- |
| 프레임워크      | Next.js 14 (App Router) + TypeScript  |
| 스타일          | Tailwind CSS + shadcn/ui              |
| DB/Storage/Auth | Supabase (Postgres + Storage + Auth)  |
| 참여자 로그인   | Supabase Auth + 카카오 OAuth Provider |
| 사장님 로그인   | 가게 코드 (bcrypt) + httpOnly 쿠키    |
| 관리자 로그인   | 환경변수 `ADMIN_PASSWORD`             |
| LLM             | Anthropic Claude (Haiku 4.5)          |
| 호스팅          | Vercel                                |
| PWA             | `public/manifest.json`                |

## 디렉토리 (`src/`)

```
/src
  /app              App Router (route groups: traveler / public / crew / owner / admin)
  /components
    /ui             shadcn/ui 컴포넌트 (직접 소유)
  /lib
    /supabase       client / server / middleware / types
  /db
    /migrations     SQL 마이그레이션
/public
  manifest.json     PWA manifest
  /icons            앱 아이콘 (192, 512)
```

## 환경 변수

`.env.local.example` 을 `.env.local` 로 복사해서 채운다.

```
cp .env.local.example .env.local
```

필요한 키:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 프로젝트
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용 (RLS 우회, 관리자 API/시드)
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` — Supabase Auth Provider 등록용
- `ANTHROPIC_API_KEY` — LLM 편지 보조 (Phase 4~)
- `ADMIN_PASSWORD` — 청풍 관리자 로그인
- `NEXT_PUBLIC_SITE_URL` — 로컬 `http://localhost:3001`, 배포 시 실제 도메인

## 로컬 개발

```
npm install
npm run dev           # http://localhost:3001
npm run typecheck
npm run lint
npm run build
```

## Supabase 셋업

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **Settings → API** 에서 URL, anon, service role 키를 `.env.local` 에 복사
3. **SQL Editor** 에서 `src/db/migrations/001_initial.sql` 전체 실행
4. **Authentication → Providers → Kakao** 활성화, 아래 카카오 셋업의 REST API 키/시크릿 등록
5. (Phase 1 말미) 다음 명령으로 실제 스키마 타입 생성해서 `src/lib/supabase/types.ts` 를 덮어씀

```
npx supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/supabase/types.ts
```

## 카카오 OAuth 셋업

1. [developers.kakao.com](https://developers.kakao.com) 에서 내 애플리케이션 생성
2. **앱 키 → REST API 키** → `KAKAO_CLIENT_ID`
3. **보안 → Client Secret** 생성 → `KAKAO_CLIENT_SECRET`
4. **카카오 로그인 → 활성화 ON**, **Redirect URI** 에 다음 등록
   ```
   https://<SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback
   ```
5. **동의 항목** : 닉네임, 프로필 사진 (필수 최소 범위)
6. Supabase 대시보드 → **Authentication → Providers → Kakao** 에 `Client ID`, `Client Secret` 입력하고 활성화

## Vercel 배포

1. GitHub 레포 연결
2. **Environment Variables** 에 `.env.local` 과 동일한 키를 프로덕션 환경에 등록
3. 빌드 커맨드 기본값(`next build`), 루트 디렉토리 `/`
4. `NEXT_PUBLIC_SITE_URL` 을 배포 도메인으로 교체
5. 배포 후 카카오 디벨로퍼스 / Supabase Auth 의 Redirect URI 를 프로덕션 도메인용으로 추가 등록

## 데이터 모델 요약

```
categories (4종)
  └─ projects (장기, 여러 해에 걸침)
        ├─ project_hosts (청풍, 외부 파트너)
        └─ episodes (회차/세션)
              ├─ episode_archives (후기·사진·기록)
              └─ activities (참여자 행위 = 카드 1장)
                    └─ artifacts (결과물)

shops                 (독립 엔티티, activities 로 프로젝트에 느슨 연결)
reactions             (응원/편지/하이파이브)
users                 (카카오 로그인)
contribution_points   (누적 지표 — "오늘도 강화도가..." 카운터 백엔드)
contribution_log      (누적 원장)
page_views            (익명 조회 로그)
```

중요한 설계 결정:

- `activities` 에 **unique 제약 없음** — 같은 에피소드를 여러 번 참여하면 카드가 여러 장 쌓인다.
- `activities.is_public` **기본값 false** — opt-in 공개 원칙.
- 모든 도메인 테이블 **RLS 활성화** — 보안은 처음부터.

## 개발 단계 (Phase 0~8)

Phase 별 상세는 `CLAUDE.md` 참고. 각 Phase 끝마다 배포 가능한 상태를 유지한다.

- **Phase 0** — 셋업 (Next.js, Tailwind, Supabase, 카카오, Vercel) ← 현재
- **Phase 1** — DB 스키마 + 기본 인증
- **Phase 2** — 행위 기록 (카드 발급)
- **Phase 3** — 도감 (참여자 뷰)
- **Phase 4** — 사장님/크루 응원·편지
- **Phase 5** — 노드맵 대시보드 (청풍 뷰)
- **Phase 6** — 공개 둘러보기
- **Phase 7** — 관리자 (프로젝트/에피소드/QR/가게)
- **Phase 8** — 폴리시 + 데모 준비
