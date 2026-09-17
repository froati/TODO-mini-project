# 🚀 오늘 해야 할 일 — 실행 가이드라인
### (AGENTS.md 헌법 + 2.md 커리큘럼 기반, SDD로 mini-todo-sqlite 완성하기)

이 문서는 [AGENTS.md](AGENTS.md)(프로젝트 헌법/규칙)와 [2.md](2.md)(오늘 커리큘럼)를 근거로, **오늘 해야 할 일을 실행 순서대로** 정리한 것입니다. AGENTS.md에는 이미 오늘 과제(우선순위 필드)까지 반영된 데이터 모델이 정의되어 있으므로, **처음부터 이를 염두에 두고 SDD 6단계를 진행**하는 것이 핵심입니다.

---

## 0. 오늘의 목표 (2.md 0부 요약)

- Next.js + SQLite로 "할 일 API"를 **명세 → 계획 → 태스크 분해 → 구현**의 전 과정으로 완성한다.
- 데이터가 실제 파일(`dev.db`)에 저장되는 것을 눈으로 확인한다.
- Claude Code는 **Manual 모드**로 실행한다 (Auto 아님).

## 참고: 오늘 시간 배분 (조정 가능)

| 부 | 내용 | 시간 |
|---|---|---|
| 0부 | 들어가며 | 8분 |
| 1부 | 명세서 & SDD 이해 | 30분 |
| 2부 | 환경 준비 (SQLite + Spec Kit + Next.js) | 25분 |
| 3부 | Spec Kit 워크플로우로 기능 완성 | 50분 |
| 4부 | 검증 & 결과 공유 | 10분 |
| 5부 | 마무리 + 과제 | 3분 |

---

## Phase 1. 사전 환경 준비

> 📍 **모든 명령은 VS Code 하단 터미널 패널**(`Ctrl+\``로 열기)**에서 실행합니다.** 대부분의 명령은 어떤 셸(PowerShell/cmd)에서든 동일하게 동작하지만, 딱 하나(1-1)는 PowerShell 문법이라 **터미널 셸이 PowerShell로 되어 있어야** 합니다. 번거로움을 피하려면 처음부터 끝까지 VS Code 터미널을 PowerShell로 통일해서 쓰는 것을 권장합니다(우측 상단 드롭다운에서 확인/변경).

### 1-1. PowerShell 스크립트 실행 권한 허용 (Windows 필수, PowerShell 셸에서만)
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
> 💡 **설명**: 현재 사용자 계정에 한해 로컬 PowerShell 스크립트(.ps1) 실행을 허용하도록 레지스트리 설정을 바꿉니다. 이후 npm/npx가 내부적으로 실행하는 .ps1 스크립트가 차단되지 않습니다. VS Code 터미널의 셸이 **PowerShell**로 되어 있을 때만 인식되는 명령이라, cmd로 되어 있다면 우측 상단 드롭다운(∨)에서 PowerShell로 바꾼 뒤 실행하세요.
> ✏️ **직접 수정**: 없음. 그대로 붙여넣기만 하면 되고, 한 번 실행하면 이 계정에서는 VS Code를 껐다 켜도 계속 유지됩니다.

### 1-2. Specify CLI(Spec Kit) 설치
`uv`는 이미 설치되어 있다고 가정합니다. 안 되어 있다면 VS Code 터미널에 그대로 붙여넣습니다:
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```
> 💡 **설명**: `uv`(파이썬 도구 관리자) 공식 설치 스크립트를 인터넷에서 받아 즉시 실행합니다. 컴퓨터에 `uv` 실행 파일이 새로 설치됩니다. 이 명령은 앞에 `powershell`을 직접 붙여 호출하는 형태라, VS Code 터미널의 셸이 cmd여도 그대로 실행됩니다.
> ✏️ **직접 수정**: 없음. `uv --version`이 이미 나온다면 이 줄은 건너뜁니다.

Spec Kit CLI 설치 (VS Code 터미널, 셸 무관):
```powershell
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```
> 💡 **설명**: `uv`를 이용해 GitHub의 `spec-kit` 저장소에서 `specify` CLI 도구를 설치합니다. 이 도구가 나중에 프로젝트 폴더 안에 `.specify/`, `speckit-*` 슬래시 커맨드(Skill)를 생성해줍니다. PowerShell 전용 명령이 아니라 일반 CLI 명령이라 cmd에서도 동일하게 동작합니다.
> ✏️ **직접 수정**: 없음. URL은 공식 저장소 그대로 사용합니다.

확인:
```powershell
specify --version
```
*(인식 못 하면 VS Code 터미널을 완전히 닫았다가 새로 열기)*
> 💡 **설명**: 설치가 잘 됐는지 버전 번호로 확인만 하는 명령입니다. 아무것도 변경하지 않으며, 셸 종류와 무관하게 동작합니다.

---

## Phase 2. Next.js 프로젝트 생성 + Spec Kit 초기화 + AGENTS.md 배치

> 📍 이하 `bash`로 표시된 명령들도 전부 **VS Code 터미널**에 그대로 입력하면 됩니다(실제 Bash 셸이 필요한 것은 아니고, PowerShell/cmd 어디서든 동일하게 동작하는 범용 명령이라 편의상 `bash`로 표기된 것입니다).

1. 프로젝트 생성:
   ```bash
   npx create-next-app@latest mini-todo-sqlite --typescript --app --eslint
   ```
   > 💡 **설명**: Next.js 공식 스캐폴딩 도구로 `mini-todo-sqlite`라는 새 폴더를 만들고 그 안에 TypeScript + App Router + ESLint가 세팅된 기본 프로젝트 파일들을 생성합니다. 실행 중 Tailwind CSS, `src/` 폴더 사용 여부 등 몇 가지 질문(Y/n)이 뜹니다.
   > ✏️ **직접 수정**: `mini-todo-sqlite`는 폴더/프로젝트 이름입니다. 원하는 이름으로 바꿔도 되지만, 바꾸면 이후 모든 안내에서 이 이름을 그 이름으로 바꿔 읽어야 합니다. 설치 중 질문에는 기본값(Enter) 또는 취향대로 응답하면 됩니다.

2. 폴더 이동 후 Spec Kit 초기화 (현재 폴더에 설치):
   ```bash
   cd mini-todo-sqlite
   specify init --here --integration claude
   ```
   > 💡 **설명**: 첫 줄은 방금 만든 프로젝트 폴더로 이동합니다. 둘째 줄은 Spec Kit을 "새 폴더를 만들지 않고 지금 폴더(`--here`)"에, "Claude Code용 슬래시 커맨드(`--integration claude`)"로 초기화합니다. 이 명령이 끝나면 `.specify/`, `.claude/skills/speckit-*/` 폴더들이 생깁니다. (최신 Spec Kit은 예전의 `.claude/commands/speckit.*.md` 방식 대신 Claude Code의 **Skill** 기능으로 설치됩니다 — 폴더 이름도 점(`.`)이 아니라 하이픈(`-`)을 씁니다: `speckit-specify`, `speckit-plan` 등.)
   > ✏️ **직접 수정**: 1번에서 폴더 이름을 바꿨다면 `cd` 뒤 이름도 그에 맞게 바꿔야 합니다. `--integration claude`는 Claude Code를 쓰는 경우 고정값이라 바꿀 필요 없습니다.

3. **중요**: 지금 이 폴더(3주차)에 있는 [AGENTS.md](AGENTS.md)를 `mini-todo-sqlite/` 프로젝트 루트로 복사합니다. 이 파일이 이미 프로젝트의 헌법·데이터 모델·디렉터리 구조·명령어를 정의하고 있으므로, Claude Code가 세션 시작 시 자동으로 읽고 작업 전제로 삼습니다.
   > ✏️ **직접 수정**: 이건 명령어가 아니라 **사람이 직접 해야 하는 파일 복사 작업**입니다. 탐색기에서 `AGENTS.md`를 복사(Ctrl+C) → `mini-todo-sqlite` 폴더에 붙여넣기(Ctrl+V)만 하면 됩니다. 내용 자체는 수정하지 않아도 됩니다(이미 오늘 과제까지 반영되어 있음).

4. **VS Code 워크스페이스를 `mini-todo-sqlite`로 전환**: 상단 메뉴 **File → Open Folder** → `mini-todo-sqlite` 폴더 선택.
   > ⚠️ **왜 필요한가**: 지금까지 VS Code가 `3주차` 폴더를 워크스페이스 루트로 열고 있었다면, `.claude/skills/`가 `mini-todo-sqlite/` 안에 생겨도 Claude Code가 인식하지 못합니다. Claude Code는 **현재 열려있는 워크스페이스 루트** 기준으로 `.claude/skills/`를 찾기 때문입니다. VS Code 앱을 완전히 껐다 켤 필요는 없고, Open Folder로 루트만 바꿔주면 됩니다.
   > ✏️ **직접 수정**: 이 단계는 명령이 아니라 **직접 폴더를 다시 여는 조작**입니다.

5. 결과 확인: 탐색기에 `.specify/`, `.claude/skills/speckit-*/` 폴더(예: `speckit-specify`, `speckit-plan` 등) 생성 확인 → Claude Code **채팅 패널**(터미널 아님)에 `/`를 입력해 `speckit-`(하이픈, 점 아님)으로 시작하는 커맨드가 뜨는지 확인.
   > 💡 **설명**: 명령이 아니라 육안 확인 단계입니다. 아무것도 실행하지 않습니다.
   > ⚠️ 안 뜬다면: `speckit.`(점)으로 검색하지 말고 `speckit-`(하이픈)으로 검색해보세요. 그래도 안 뜨면 VS Code를 완전히 재시작(또는 창 다시 로드)해서 Claude Code가 `.claude/skills/`를 다시 읽게 합니다.

---

## Phase 3. Spec Kit SDD 6단계 워크플로우

> AGENTS.md에 이미 헌법 원칙이 문서로 정의되어 있으므로, Step 1 프롬프트는 그 내용을 그대로 근거로 입력합니다.

### Step 1. `/speckit-constitution` — 프로젝트 원칙
AGENTS.md의 "핵심 헌법 원칙" 4가지를 그대로 반영:
```text
/speckit-constitution 이 프로젝트는 Next.js(App Router) + TypeScript(Strict Mode)로 작성하며 any 타입은 사용하지 않는다.
모든 API Route는 성공/실패 응답을 일관된 JSON 포맷으로 반환한다 (성공: {success, data}, 실패: {error}).
데이터는 메모리 배열이 아닌 Prisma Client를 통해 SQLite 파일(dev.db)에 영구 저장한다.
Prisma Client는 lib/prisma.ts의 싱글톤 인스턴스를 재사용한다.
```
> 💡 **설명**: 이 텍스트를 Claude Code 채팅창에 그대로 입력하는 **프롬프트**입니다(터미널 명령이 아님). `/speckit-constitution` 슬래시 커맨드가 뒤따르는 문장을 근거로 `.specify/memory/constitution.md` 파일을 새로 생성/갱신합니다.
> ✏️ **직접 수정**: `/speckit-constitution` 뒤의 문장은 AGENTS.md의 4대 원칙을 그대로 옮긴 것이라 수정할 필요는 없지만, 만약 팀만의 규칙(예: 특정 라이브러리 금지)이 더 있다면 이 자리에 문장을 추가해서 입력하면 됩니다.
- 확인: `.specify/memory/constitution.md`가 AGENTS.md 내용과 일치하는지 대조.

### Step 2. `/speckit-specify` — 무엇을 만들지 정의 (PRD, 기술 스택 언급 금지)
```text
/speckit-specify 사용자가 할 일을 추가하고, 목록을 확인하고,
완료 여부를 토글하고, 삭제할 수 있는 기능이 필요하다.
할 일에는 제목(필수), 완료 여부, 우선순위(High/Medium/Low)가 있다.
```
> 💡 **설명**: 이것도 채팅창 프롬프트입니다. `/speckit-specify`가 이 문장을 바탕으로 `spec.md`(PRD 성격의 "무엇을 만들지" 문서)를 새로 생성합니다.
> ✏️ **직접 수정**: 기능 요구사항 문장은 원하는 대로 바꿀 수 있습니다. 단, **기술 스택 단어(Next.js, SQLite, Prisma 등)는 절대 넣지 마세요** — SDD 원칙상 이 단계는 "무엇을"만 다룹니다. 우선순위 문구는 과제와 직결되므로 지우지 않는 것을 권장합니다.
- ⚠️ 우선순위를 여기서 미리 넣는 이유: AGENTS.md 데이터 모델에 이미 `priority` 필드가 정의돼 있고, 이것이 오늘 과제 1과 동일하기 때문에 지금 단계부터 포함시켜야 나중에 재작업이 없습니다.
- 확인: `spec.md`에 기술 언급 없이 "무엇을/왜"만 담겼는지 점검.

### Step 3. `/speckit-clarify` — 모호한 점 제거
```text
/speckit-clarify
```
> 💡 **설명**: 인자 없이 그냥 이 커맨드만 입력합니다. Claude가 방금 만든 `spec.md`를 다시 읽고, 스스로 애매하다고 판단한 부분을 역질문으로 던집니다. 답변 내용은 `spec.md`에 반영되어 업데이트됩니다.
> ✏️ **직접 수정**: 명령어 자체는 고정이라 바꿀 게 없습니다. 뒤이어 AI가 던지는 질문에 **본인 판단으로 직접 답변**하는 것이 이 단계에서 여러분이 해야 할 일입니다(예: "제목 최대 100자로 해줘").
- AI의 역질문(예: "완료 항목도 삭제 가능한가?", "제목 글자 수 제한은?", "우선순위 기본값은?")에 답변.

### Step 4. `/speckit-plan` — 기술 스택 & 아키텍처 (TRD, 여기서부터 기술 언급)
```text
/speckit-plan Next.js App Router의 API Routes(app/api/tasks/route.ts 등)로 REST 엔드포인트를 만든다.
ORM은 Prisma를 쓰고, 데이터베이스는 로컬 SQLite 파일(dev.db)을 사용한다.
Prisma Client는 lib/prisma.ts에서 싱글톤으로 export해 재사용한다.
별도 외부 DB 서버 설정은 필요 없다.
```
> 💡 **설명**: `/speckit-plan`이 이 문장을 근거로 `plan.md`(TRD), `research.md`, `data-model.md`, `contracts/tasks-api.md`, `quickstart.md`를 생성합니다. 여기서부터는 기술 스택을 명시하는 단계입니다.
> ✏️ **직접 수정**: 이번 실습 구성 그대로면 수정할 필요 없습니다. 다만 다른 기술(예: Postgres, tRPC 등)을 쓰고 싶다면 이 문장에서 해당 부분을 바꿔 입력하면 됩니다.
- 확인: `plan.md`(Constitution Check PASS 여부), `data-model.md`(Task 엔티티에 priority 포함 여부), `contracts/tasks-api.md`.

### Step 5. `/speckit-tasks` — 구현 단위 쪼개기
```text
/speckit-tasks
```
> 💡 **설명**: 인자 없이 입력. `plan.md`를 바탕으로 실행 가능한 작은 작업 목록인 `tasks.md`를 생성합니다. 아직 코드는 작성되지 않고, "할 일 목록"만 만들어지는 단계입니다.
> ✏️ **직접 수정**: 없음. 생성된 `tasks.md`를 읽고 순서가 합리적인지 검토만 하면 됩니다.
- 확인: Prisma 설치 → 스키마 정의(priority 포함) → 마이그레이션 → GET/POST/PATCH/DELETE 구현 → 프론트 연결 순으로 세분화됐는지 확인.
- 여유 있으면 `/speckit-checklist`로 누락 여부 재점검.

### Step 6. `/speckit-implement` — 실제 구현
```text
/speckit-implement
```
> 💡 **설명**: `tasks.md`의 작업들을 Claude Code가 순서대로 **실제로 실행**합니다(파일 생성/수정, `npm install`, `npx prisma migrate dev` 등 터미널 명령까지 대신 실행). 이 단계가 끝나면 실제 동작하는 코드와 `dev.db` 파일이 생깁니다.
> ✏️ **직접 수정**: 명령어는 그대로 입력하되, 진행 중 뜨는 **권한 요청 팝업에 Allow를 눌러주는 것**이 여러분이 직접 해야 할 일입니다(자동 승인 아님 = Manual 모드). 중간에 에러가 나면 에러 메시지를 그대로 Claude Code에게 붙여넣어 다음 지시를 내리면 됩니다.
- 중간 권한 요청(`npm install`, `npx prisma migrate dev` 등) **Allow**.
- 생성 확인 대상: `prisma/schema.prisma`, `.env`(`DATABASE_URL="file:./dev.db"`), `lib/prisma.ts`, `app/api/tasks/route.ts`.

---

## Phase 4. 검증 & 결과 공유

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```
   > 💡 **설명**: Next.js 로컬 개발 서버를 켭니다. 아무것도 파일에 변경을 가하지 않고, `http://localhost:3000`으로 접속 가능한 상태를 유지합니다(터미널을 계속 켜둬야 함, Ctrl+C로 종료).
   > ✏️ **직접 수정**: 없음.

2. `http://localhost:3000`에서 추가/완료 토글/삭제/우선순위 동작 확인.
3. **SQLite 영구 저장 확인** (오늘의 하이라이트):
   ```bash
   npx prisma studio
   ```
   > 💡 **설명**: `dev.db` 파일 안의 실제 데이터를 표(스프레드시트 형태)로 보여주는 웹 GUI를 새 포트(`localhost:5555`)로 띄웁니다. 1번 서버와 별개로 **새 터미널 탭**에서 실행해야 합니다(기존 `npm run dev` 터미널을 막지 않도록).
   > ✏️ **직접 수정**: 없음.

   `http://localhost:5555`에서 실제 데이터가 `dev.db`에 저장됐는지 표로 확인.
4. 0부의 "애매한 지시" 결과와 비교해 SDD의 효과 체감.

---

## Phase 5. 과제(Homework) 완수 & 제출 (2.md #23)

### 과제 1. 우선순위(Priority) 3단계 필드
- Phase 3에서 이미 specify/plan/tasks 단계에 포함시켰다면 `/speckit-implement`에서 대부분 자동 구현됩니다. 누락됐다면:
  1. `prisma/schema.prisma`에 `priority String @default("Medium")` 확인
     > ✏️ **직접 수정**: 이건 명령이 아니라 **직접 파일을 열어 눈으로 확인/추가**하는 작업입니다. 없으면 `Task` 모델 안에 이 줄을 직접 추가합니다.
  2. ```bash
     npx prisma migrate dev --name add_priority
     ```
     > 💡 **설명**: 스키마를 바꾼 뒤 실제 `dev.db`의 테이블 구조에도 반영(마이그레이션)하는 명령입니다. 실행하면 `prisma/migrations/` 폴더에 새 마이그레이션 기록이 추가되고 `dev.db`가 갱신됩니다.
     > ✏️ **직접 수정**: `add_priority`는 마이그레이션 이름(기록용 라벨)입니다. 원하는 이름으로 바꿔도 동작에는 지장 없습니다.
  3. 할 일 생성 폼/카드 UI에 `High`/`Medium`/`Low` 선택 및 표시 반영
     > ✏️ **직접 수정**: 이 부분은 명령이 아니라 **Claude Code에게 UI 수정을 요청해서 코드가 바뀌는 부분**입니다. 아래 지시사항대로 Plan 모드로 먼저 물어보고 진행하세요.
- **2.md 지시사항**: 이 기능을 어떻게 추가할지 **Plan 모드에서 Claude Code에게 먼저 물어본 뒤** 구현할 것 (구현 전 계획 확인 절차를 생략하지 말 것).

### 과제 2. GitHub Repository 제출
```bash
git init
git add .
git commit -m "feat: complete mini-todo-sqlite with SDD and priority"
git branch -M main
git remote add origin <본인의-깃허브-저장소-URL>
git push -u origin main
```
> 💡 **설명**: 한 줄씩 순서대로 — ①이 폴더를 git 저장소로 초기화 ②모든 파일을 스테이징 ③커밋 생성 ④기본 브랜치명을 `main`으로 지정 ⑤GitHub 원격 저장소 주소 연결 ⑥실제로 GitHub에 업로드(push).
> ✏️ **직접 수정 필요 (반드시!)**:
> - `<본인의-깃허브-저장소-URL>` — 이 자리는 **그대로 두면 실행이 실패**합니다. GitHub에서 먼저 빈 저장소를 하나 만든 뒤(github.com → New repository), 그 저장소의 HTTPS 주소(예: `https://github.com/아이디/mini-todo-sqlite.git`)로 반드시 바꿔야 합니다.
> - 커밋 메시지(`-m` 뒤 문구)는 자유롭게 바꿔도 됩니다.
> - 만약 `dev.db`나 `.env`처럼 민감하거나 불필요한 파일이 있다면, `git add .` 전에 `.gitignore`에 추가하는 것을 권장합니다(Next.js 기본 템플릿에는 `.env*`가 이미 포함되어 있는지 확인).
- 제출 폼에 GitHub 저장소 URL 제출.

---

## ✅ 최종 체크리스트

- [ ] AGENTS.md를 mini-todo-sqlite 프로젝트 루트에 복사했다
- [ ] constitution.md가 AGENTS.md의 4대 원칙을 반영한다
- [ ] spec.md에 기술 스택 언급이 없다 (What만 존재)
- [ ] clarify 질문에 모두 답했다
- [ ] plan.md의 Constitution Check가 PASS다
- [ ] data-model.md / schema.prisma에 priority 필드가 있다
- [ ] `npm run dev`로 추가/토글/삭제/우선순위가 정상 동작한다
- [ ] `npx prisma studio`에서 dev.db에 실제 데이터가 저장된 것을 확인했다
- [ ] 과제 1: 우선순위 기능을 Plan 모드로 먼저 물어보고 구현했다
- [ ] 과제 2: GitHub에 push하고 URL을 제출했다
