# AI Coding Rules – Brighten Ops App

These rules guide AI code-generation tools (GitHub Copilot, etc.) working in this repository.

---

## General Principles

1. **Follow existing conventions.** Before generating new code, inspect existing files in the same package to understand naming, import style, and structure.
2. **TypeScript everywhere.** All source files must be TypeScript (`.ts` or `.tsx`). Avoid plain `.js` files in `apps/` and `packages/`.
3. **Strict mode.** All TypeScript must compile with `strict: true`. Never use `any` unless unavoidable, and always add a comment explaining why.
4. **No secrets in source code.** API keys, database URLs, and credentials must come from environment variables, never be hardcoded.
5. **Small, focused changes.** Make the smallest change that satisfies the requirement. Avoid refactoring unrelated code in the same commit.

---

## Project Structure

- **`packages/shared`** – shared TypeScript types and pure utility functions. No framework dependencies.
- **`packages/database`** – Prisma schema, generated client, and seed script. No business logic.
- **`apps/api`** – Hono REST API. Thin handlers that delegate to service functions. Service functions live in `src/services/`.
- **`apps/web`** – Next.js App Router. Pages in `app/`, reusable components in `components/`, server actions in `app/actions/`.

---

## API Conventions

- All API routes are prefixed `/api/`.
- Use Hono's `zValidator` middleware for request validation (Zod schemas).
- Return consistent JSON envelopes:
  - Success: `{ data: T }`
  - Error: `{ error: { message: string, code?: string } }`
- HTTP status codes must follow REST semantics (200, 201, 400, 404, 409, 422, 500).
- Never return stack traces to the client in production.

---

## Database Conventions

- Use Prisma for all database access. Never write raw SQL unless Prisma cannot express the query.
- All model IDs use `@default(cuid())`.
- All models have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` where appropriate.
- Never call `prisma.$disconnect()` inside request handlers; manage the client lifecycle at the application level.

---

## Testing

- Use **Vitest** for all unit and integration tests.
- Test files live alongside source files as `*.test.ts`.
- Mock Prisma with `vitest-mock-extended` or `@prisma/client` manual mocks; never hit a real database in unit tests.
- Calculator and labour-computation functions must have unit tests covering edge cases (boundary system sizes, overtime thresholds, missing rates).

---

## Imports

- Use path aliases defined in `tsconfig.json` (`@brighten/shared`, `@brighten/database`).
- Do not use relative `../../` imports that cross package boundaries.
- Sort imports: built-ins → external packages → internal packages → relative files.

---

## Commit Messages

Follow Conventional Commits:

```
feat(api): add install-calculator endpoint
fix(labour): correct daily overtime threshold
chore(db): regenerate Prisma client
docs: update data-model for CalculatorRun
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`.

---

## Security

- Sanitize all user inputs before passing to Prisma queries (Zod validation handles this).
- Never expose internal error messages or database errors directly to API consumers.
- Use `httpOnly` cookies for session tokens; never store sensitive tokens in `localStorage`.
- Validate and sanitize CSV data during the import process before upserting to the database.
