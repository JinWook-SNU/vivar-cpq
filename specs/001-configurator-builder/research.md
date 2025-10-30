# Research Log: Configurator Builder

## Decision 1: Device & Browser Targets
- **Decision**: Support Chrome 120+ (macOS/Windows 11), Edge 120+ (Windows 11/macOS), Safari 17+ (iPad Pro), and mobile Safari/Chrome (iPhone/Android simulators). Enforce min width 1280 px for desktop mode; provide mobile viewport shell.
- **Rationale**: Matches clarification Option B with mobile extension, covers primary sales hardware (MacBook Air M1, iPad Pro) and ensures mobile demos remain credible.
- **Alternatives Considered**:
  - Desktop-only preview: rejected; mobile demos required for on-the-go pitches.
  - Add Firefox for tablet: not supported on iPad; unnecessary.

## Decision 2: State Management Strategy
- **Decision**: Organize Zustand into `builder`, `runtime`, and `pricing` slices with selectors for toggles, environment settings, and quote outputs.
- **Rationale**: Keeps builder authoring state isolated from runtime interactions, simplifies persistence using mergeable slice snapshots.
- **Alternatives Considered**:
  - Redux Toolkit: heavier setup, less ergonomic with React Server Components.
  - Recoil: less adoption in current stack; Zustand already standard.

## Decision 3: Pricing Engine Implementation
- **Decision**: Implement pricing rules in `lib/pricing/rules.ts` (feature coefficients, role rate table, `k` multiplier range) and compose total cost in `lib/pricing/engine.ts`. `/api/pricing` validates input via Zod and returns `{devHours, maintHours, totals, trace}`.
- **Rationale**: Separates rule authoring from execution, allows unit tests on pure functions, keeps API side effect free.
- **Alternatives Considered**:
  - Client-only pricing: rejected; server/API ensures consistent audit trace.
  - Prisma-backed persistence now: deferred; M1 scope is local-first.

## Decision 4: 3D Asset Handling
- **Decision**: Provide placeholder box asset (`src/3d/assets/placeholderBox.ts`) and accept uploads of GLB/glTF/OBJ via client-side file input, with size/format validation before sending to viewer scene.
- **Rationale**: Meets clarified requirement for instant substitution; placeholder ensures safe fallback when uploads fail.
- **Alternatives Considered**:
  - Server-side asset conversion pipeline: complex, out of scope.
  - Using Three.js loaders directly: kept via drei helpers but wrapped in R3F components.

## Decision 5: Performance Instrumentation
- **Decision**: Build `lib/metrics/fps.ts` with requestAnimationFrame averaging over 1s window, surfacing warnings in builder UI; build `lib/metrics/latency.ts` to capture toggle-to-render timings and price API latency with exponential backoff (1s, 2s, 4s).
- **Rationale**: Satisfies constitution performance gates and user success criteria; keeps instrumentation reusable per feature.
- **Alternatives Considered**:
  - Browser extension profiling only: lacks automated gating.
  - External monitoring SaaS: overkill for demo builder.

## Decision 6: Persistence Model
- **Decision**: Persist `ConfiguratorBlueprint v1` to `localStorage` using schema defined in `lib/persist/blueprint.ts`, with version field for future migrations and optional server sync stub.
- **Rationale**: Immediate offline readiness for sales demos, simple rollback. Schema handles toggles, params, environment, viewport mode.
- **Alternatives Considered**:
  - IndexedDB: more complex, unnecessary for initial blueprint size.
  - Server-first: blocked by authentication scope exclusion.

## Decision 7: UI Shell & Theming
- **Decision**: Embed viewer inside Chrome-like frame component with toggleable dark/light themes and desktop/mobile viewport presets. Use Tailwind tokens and shadcn primitives for controls.
- **Rationale**: Aligns spec clarification; gives consistent demo frame while reusing design system tokens.
- **Alternatives Considered**:
  - Separate routes per device: increases maintenance; toggle is simpler.

## Open Questions
None—clarifications resolved during `/speckit.clarify`.
