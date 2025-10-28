# Implementation Plan: Configurator Builder

**Branch**: `001-configurator-builder` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-configurator-builder/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Command guidance will be published under `.specify/templates/commands/` once available.

## Summary

Deliver a two-pane CPQ demo workspace where sales/PM teammates configure which product features appear in a live 3D configurator, preview device form factors inside a browser-style shell, and see cost impacts instantly. Implementation centers on Next.js App Router, React 19 with the Compiler, shadcn/Tailwind UI, and React Three Fiber for the viewer, backed by Zustand state slices, a pricing engine API, and instrumentation for FPS and pricing latency. AI Catalog and AI Suggestions remain independent, UI-only toggles—the builder exposes enable/disable controls without invoking real AI pipelines.

### Status Update (2025-10-27)
- Unit tests now run under Vitest + jsdom; toggle, save/load, and dependency guard suites pass.
- CI pipeline updated to execute `vitest run --coverage`.
- Remaining M1 scope: polish UI toasts and saved timestamp UX, then mark milestone ready for review.

## Technical Context

**Cost Modeling**: Pricing engine references role-based effort table (see `pricing-rules.md`) summing base labour and feature increments, then applies 110% overhead, 20% technology fee, and 10% VAT; admin routes allow editing role rates and per-feature days.
**Language/Version**: TypeScript (Next.js 16 App Router, React 19 w/ React Compiler, Node 20 LTS)  
**Primary Dependencies**: shadcn/ui, Tailwind CSS tokens, @react-three/fiber, @react-three/drei, Zustand, Zod, Jest, React Testing Library, Playwright (smoke), Vercel tooling  
**Storage**: Local-first blueprint persistence via localStorage (versioned schema with future server sync hook)  
**Testing**: Vitest (unit/contract) with React Testing Library + jsdom, Playwright smoke for builder/viewer toggles, custom perf probes (FPS & latency); CI executes `vitest run --coverage`  
**Target Platform**: Chrome 120+ (macOS), Edge 120+ (macOS/Windows 11), Safari 17+ (iPad Pro), Mobile Safari/Chrome (iPhone/Android emulator)  
**Project Type**: Single Next.js application with API routes and shared component library  
**Performance Goals**: Viewer >=60 FPS; pricing P95 <=500 ms; viewport toggle <300 ms; responsive without horizontal scroll at >=1280 px  
**Constraints**: shadcn-first theming, no inline styles outside canvas bridge, env secrets via `.env` only, builder/editor <=400 LOC per PR, respect declared toggle rules (AI Catalog and AI Suggestions stay independent UI stubs)  
**Scale/Scope**: Sales demo scenarios with configurable feature bundles, local persistence of multiple blueprints, tablet support (M1-M4 milestones)

## Constitution Check

- **Traceability**: Map plan deliverables to ACs in `trace/` manifest (create alongside milestones). Limit PRs to <=400 LOC, otherwise record justification in Complexity Tracking.  
- **Performance Measurement**: Instrument FPS via `lib/metrics/fps.ts` with rAF sampler (1s moving average, warning badge <60). Pricing latency via request timestamp + response hook, writing metrics to `lib/metrics/latency.ts` and logging to devtools console + toast if >500 ms.  
- **Quality Gates**: Enforce `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` in CI; add `npm run trace:verify` wrapping `scripts/trace-verify.mjs`. No secrets committed; update `.env.example` with pricing endpoint placeholder.  
- **Status**: Pass (all gates planned, no violations). Re-check post Phase 1 once data model and contracts finalized.

## Project Structure

### Documentation (this feature)

```text
specs/001-configurator-builder/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
\-- tasks.md             # created during /speckit.tasks
```

### Source Code (repository root)

```text
src/
|-- app/
|   |-- cpq-builder/page.tsx
|   |-- cpq/admin/products/page.tsx           # mock admin surface
|   |-- cpq/admin/presets/page.tsx            # mock admin surface
|   |-- cpq/admin/orders/page.tsx             # mock admin surface
|   |-- cpq/admin/modules/page.tsx            # mock admin surface
|   \-- api/
|       |-- pricing/route.ts                  # pricing engine API
|       \-- catalog/route.ts                  # mock catalog feed
|-- components/
|   |-- cpq/FeatureToggles.tsx
|   |-- cpq/FeatureParams.tsx
|   |-- cpq/EstimatePanel.tsx
|   |-- cpq/PresetBar.tsx
|   |-- viewer/SceneCanvas.tsx
|   |-- viewer/DimensionHUD.tsx
|   |-- viewer/ARButton.tsx
|   |-- viewer/FullscreenButton.tsx
|   |-- viewer/ScreenshotButton.tsx
|   |-- panels/ColorPanel.tsx
|   |-- panels/OptionPanel.tsx
|   \-- panels/PurchaseBar.tsx
|-- lib/
|   |-- store/builder.ts
|   |-- store/runtime.ts
|   |-- store/pricing.ts
|   |-- featureRules.ts
|   |-- pricing/rules.ts
|   |-- pricing/engine.ts
|   |-- metrics/fps.ts
|   |-- metrics/latency.ts
|   \-- persist/blueprint.ts
|-- 3d/
|   |-- assets/placeholderBox.ts
|   \-- utils/environmentPresets.ts

tests/
|-- api/pricing.test.ts
|-- ui/builder.test.tsx
|-- ui/viewer.test.tsx
\-- smoke/builder.spec.ts                     # Playwright (optional smoke)

trace/
|-- manifest.json
\-- scripts/trace-verify.mjs
```

**Structure Decision**: Aligns with architecture brief—App Router routes for builder/admin/API, dedicated component namespaces for CPQ and viewer controls, Zustand slices in `lib/store`, metrics utilities, and 3D helpers under `src/3d`. Testing split by layer, with optional Playwright smoke in `tests/smoke`.

## Complexity Tracking

No anticipated constitution violations. Track scene-complexity optimizations in research notes for M3 if FPS risk increases.
