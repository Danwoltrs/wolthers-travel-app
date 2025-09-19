# Repository Guidelines

## Project Structure & Module Organization
Next.js routes and API handlers live in `src/app`. UI building blocks sit in `src/components`, with tokens and primitives in `src/design-system`. Share stateful logic through `src/hooks`, `src/contexts`, and `src/services`, while cross-cutting helpers belong in `src/lib` and `src/types`. Tests stay in `src/__tests__`, static assets in `public`, and Supabase migrations plus import utilities inside `supabase/` and `scripts/`. Keep schema edits mirrored in those folders before opening a pull request.

## Build, Test, and Development Commands
Use `npm run dev` for the local Next.js server and hot reload. Production bundles come from `npm run build`, then `npm run start` for verification. Manage the local database with `npm run db:start`, `npm run db:stop`, and `npm run db:reset` when migrations change. Run all tests through `npm test`, or focus on suites via `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`, and `npm run test:email-workflow`. Append `:watch` or `:coverage` variants during debugging.

## Coding Style & Naming Conventions
Write TypeScript with functional React components and hooks-first state management. Match the repository’s two-space indentation, camelCase variables, PascalCase components, and UPPER_SNAKE_CASE constants. Prefer named exports from shared modules such as `@/lib/utils`, group Tailwind classes from layout → spacing → color, and colocate component-specific tests or styles near their sources.

## Testing Guidelines
Name test files `*.test.ts` and place them under `src/__tests__/`, using the shared setup utilities provided there. Aim for coverage on new branches and edge cases, especially when touching Supabase services or email workflows. Run `npm run test:coverage` before review and document any failing scenarios with reproduction steps.

## Commit & Pull Request Guidelines
Follow the existing history: short, imperative commit subjects (for example, “Improve itinerary email layout”) with optional detail in the body. Reference issues or tasks when possible. Each pull request should include a concise summary, Supabase or deployment considerations, UI screenshots for visible changes, and the exact test commands executed. List modified migrations or seed files so reviewers can replay them.

## Supabase & Environment
Secrets belong in `.env.local`; never commit credentials. After syncing branches, rerun `npm run db:reset` so your local instance matches `supabase/migrations`. When updating scripts under `scripts/`, add a sample invocation in the pull request, such as `python scripts/batch_import.py --batch 3`, to help reviewers validate the flow.
