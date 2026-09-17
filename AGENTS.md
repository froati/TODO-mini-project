<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Project Rules: mini-todo-sqlite

## 1. 프로젝트 개요 & 기술 스택 (Overview & Tech Stack)
* **목적**: Next.js App Router와 SQLite를 연동한 할 일(Todo) 관리 웹 애플리케이션
* **Framework**: Next.js (App Router 구조 준수, `pages/` 사용 금지)
* **Language**: TypeScript (Strict Mode, `any` 타입 사용 절대 금지)
* **ORM**: Prisma ORM
* **Database**: SQLite (로컬 파일 `dev.db`, 별도 DB 서버 설치 불필요)
* **Styling**: Tailwind CSS 또는 CSS Modules

---

## 2. 핵심 헌법 원칙 (Core Constitution)
1. **엄격한 타입 정의**: 모든 변수, 함수 인자, 반환값, API 페이로드에 명시적인 인터페이스/타입을 부여하며 `any`는 사용하지 않는다.
2. **JSON 응답 표준화**: 모든 API Route는 성공(`200`, `201`) 및 실패(`400`, `404`, `500`) 응답을 항상 일관된 JSON 객체 포맷으로 반환한다.
   - 성공 예시: `{ "success": true, "data": ... }` 또는 데이터 객체
   - 에러 예시: `{ "error": "에러 메시지" }`
3. **영구 저장 보장**: 메모리 상의 임시 배열 변수에 데이터를 저장하지 않고, 반드시 Prisma Client를 통해 로컬 SQLite 파일(`dev.db`)에 영구 저장한다.
4. **Prisma 싱글톤 패턴**: Next.js 개발 환경에서의 다중 인스턴스 생성을 방지하기 위해 항상 `lib/prisma.ts`에서 export된 Prisma Client 인스턴스를 재사용한다.

---

## 3. 디렉터리 및 아키텍처 구조 (Directory Structure)
```text
mini-todo-sqlite/
├── prisma/
│   ├── schema.prisma       # Prisma 데이터 모델 및 SQLite 연결 정의
│   └── dev.db              # SQLite 로컬 데이터베이스 파일 (마이그레이션 시 자동 생성)
├── lib/
│   └── prisma.ts           # PrismaClient 싱글톤 인스턴스
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts    # GET (목록 조회 - 최신순), POST (새 할 일 생성)
│   │       └── [id]/
│   │           └── route.ts# PATCH (완료 토글 및 수정), DELETE (삭제)
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 메인 Todo UI 클라이언트 컴포넌트
├── .env                    # DATABASE_URL="file:./dev.db"
└── AGENTS.md               # 에이전트 개발 지침
```

---

## 4. 데이터 모델 규격 (Data Model & Schema)
`prisma/schema.prisma`의 기본 Task 모델:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Task {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  priority  String   @default("Medium") // "High" | "Medium" | "Low" (과제 확장용)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 5. 자주 사용하는 명령어 (Key Commands)
* **개발 서버 실행**: `npm run dev`
* **마이그레이션 생성 및 적용**: `npx prisma migrate dev --name <migration_name>`
* **Prisma Client 생성/동기화**: `npx prisma generate`
* **데이터베이스 GUI 확인**: `npx prisma studio`
