# v0-questfly — Claude Guide

Next.js 15 frontend for the questfly gamified habit platform. TypeScript, Radix UI + Tailwind (shadcn/ui), Vitest, custom API client.

## Architecture

```
app/                    ← Next.js App Router entry (layout, globals, single page.tsx)
components/
  screens/              ← page-level screen components (one per Screen type)
  ui/                   ← shadcn/ui primitives (never add business logic here)
  *.tsx                 ← shared layout components (screen-router, providers, etc.)
lib/
  api/                  ← API client layer (one file per domain: campaigns, routines, quests…)
  mappers/              ← API response → domain type transformations
  store.ts              ← global app state (React Context + AppState/AppActions)
  types.ts              ← all shared TypeScript types (Screen, Quest, Task, Habit…)
  utils.ts, *.ts        ← pure helpers
hooks/                  ← custom React hooks
```

## Key conventions

### Screens
- Each `Screen` type in `lib/types.ts` maps to exactly one file in `components/screens/`.
- Screen routing happens in `components/screen-router.tsx` — don't add `useRouter` navigation inside screens.
- New screen checklist: add to `Screen` union in `types.ts` → create `components/screens/<name>.tsx` → add case in `screen-router.tsx`.

### API layer (`lib/api/`)
- All network calls go through `lib/api/client.ts` (handles auth, token refresh, envelope unwrap).
- One file per backend domain (`campaigns.ts`, `routines.ts`, etc.) — never fetch directly in components or screens.
- API functions return unwrapped domain types (after mapper), not raw `ApiEnvelope`.

### Mappers (`lib/mappers/`)
- Transform API response shapes → local domain types from `lib/types.ts`.
- No side effects, no API calls — pure functions only.
- Never put mapping logic in components or API files.

### State (`lib/store.ts`)
- Single `AppState` + `AppActions` context — all global state lives here.
- Screens read state via context; they don't fetch independently unless specifically needed.
- `bootstrapComplete` gates the initial screen selection after first campaign fetch.

### UI components (`components/ui/`)
- shadcn/ui primitives only — no business logic, no API calls, no state.
- Don't modify generated shadcn files — extend by wrapping, not editing.

## Development

```bash
npm run dev          # Next.js dev server (Turbo)
npm run build        # production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest watch mode
```

TypeScript errors are currently ignored in build (`ignoreBuildErrors: true` in next.config.mjs). Fix type errors in changed files — don't introduce new ones.

## Adding a new screen (vertical slice)

1. Add the screen name to `Screen` union in `lib/types.ts`
2. Create `components/screens/<screen-name>.tsx`
3. Add `case "<screen-name>": return <ScreenComponent />` in `screen-router.tsx`
4. Add any new API calls to the relevant `lib/api/*.ts` file
5. Add any response mappers to `lib/mappers/`
6. If new state is needed, extend `AppState` + `AppActions` in `store.ts`

## Adding a new API endpoint

1. Add the function to the appropriate `lib/api/<domain>.ts`
2. Add/update mapper in `lib/mappers/` if the response shape needs transformation
3. Update types in `lib/types.ts` if new domain types are introduced
4. The backend spec lives at `../questfly-platform/docs/openapi.yaml` — check it for exact request/response shapes

## Testing

- Tests live next to the files they test (`*.test.ts` / `*.test.tsx`) or in `lib/test/`.
- `npm run test` — Vitest, no DOM tests currently (pure logic only).
- Don't mock the API client in unit tests for mappers — mappers are pure functions, test them directly.

## Things to avoid

- Don't call `fetch` directly in components — always go through `lib/api/`.
- Don't put domain logic in `components/ui/` files.
- Don't add a new `Screen` type without wiring it in `screen-router.tsx`.
- Don't duplicate types — if something is in `lib/types.ts`, use it; don't redefine locally.
- Don't introduce new `any` types — use proper types or `unknown`.
- Don't add state to `store.ts` that could be local component state.
- The backend API base URL comes from `lib/api/config.ts` — never hardcode URLs.
