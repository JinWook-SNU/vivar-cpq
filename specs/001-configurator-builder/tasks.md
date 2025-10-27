---

description: "Task list for Configurator Builder implementation"
---

# Tasks: Configurator Builder for Sales Demos

**Input**: Design documents from `/specs/001-configurator-builder/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED. Every user story MUST include the Jest + UI/R3F coverage that satisfies the acceptance criteria and quality gates.

**Organization**: Tasks are grouped by user story to enable independent implementation, testing, and release of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow the structure captured in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

No additional setup tasks required; existing Next.js workspace and tooling already satisfy project preconditions.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T001 Implement pricing coefficients and aggregation logic in `src/lib/pricing/{rules.ts,engine.ts}` with unit coverage in `tests/api/pricing.test.ts` (AC-PRC-001)
- [ ] T002 Create `POST /api/pricing` handler in `src/app/api/pricing/route.ts` with Zod validation and error responses (AC-PRC-001, AC-API-001)

**Checkpoint**: Pricing pipeline ready – builder UI can rely on deterministic cost outputs

---

## Phase 3: User Story 1 - Configure Demo Capabilities (Priority: P1) [MVP]

**Goal**: Sales teammate can toggle demo capabilities and see the builder UI update instantly.

**Independent Test**: Toggle each feature in the builder sidebar and verify UI visibility changes plus saved blueprint persistence without touching other stories.

### Implementation for User Story 1

- [ ] T003 [US1] Build feature toggle controls (including independent AI Catalog / AI Suggestions switches) in `src/components/cpq/FeatureToggles.tsx` wired to `src/lib/store/builder.ts` state/actions (AC-UI-BLD-001)
- [ ] T004 [US1] Define toggle rule guards in `src/lib/featureRules.ts` and cover independence scenarios in `tests/ui/dependency.guard.test.ts` (AC-VALID-001)
- [ ] T005 [US1] Persist and restore `ConfiguratorBlueprint` v1 via `src/lib/persist/blueprint.ts` + `src/lib/store/builder.ts` hydration (AC-PERSIST-001)
- [ ] T006 [US1] Assemble builder footer shell in `src/app/cpq-builder/page.tsx` and `src/components/cpq/EstimatePanel.tsx` to host estimate + mode toggles (AC-UI-BLD-001)

**Checkpoint**: Builder sidebar delivers toggle UX, guards invalid combos, and saves configurations locally.

---

## Phase 4: User Story 2 - Prospect Explores Configured Demo (Priority: P2)

**Goal**: Prospects interact with the live configurator inside browser-frame shell across desktop/mobile modes while meeting performance targets.

**Independent Test**: Load saved blueprint, switch between desktop/mobile frames, interact with color/options/presets, and confirm FPS sampler stays ≥60 FPS without relying on pricing outputs.

### Implementation for User Story 2

- [ ] T007 [US2] Implement `SceneCanvas` with placeholder asset swap and FPS sampler hook in `src/components/viewer/SceneCanvas.tsx` + `src/lib/metrics/fps.ts` (AC-UI-VWR-001)
- [ ] T008 [US2] Wire viewer utility controls (`DimensionHUD`, `FullscreenButton`, `ScreenshotButton`) in `src/components/viewer/` to respect builder toggles (AC-UI-BLD-001)
- [ ] T009 [US2] Deliver color/option panels and purchase placeholder in `src/components/panels/{ColorPanel,OptionPanel,PurchaseBar}.tsx` with mobile-responsive layout (AC-UI-BLD-001..003)
- [ ] T010 [US2] Stub AR button, preset bar, and AI catalog/suggestion UI placeholders in `src/components/{viewer/ARButton,cpq/PresetBar,cpq/AIStubs}.tsx` honoring on/off flags without backend calls (AC-AR-001)

**Checkpoint**: Viewer reflects builder configuration across devices with working panels and placeholder experiences.

---

## Phase 5: User Story 3 - Quantify Cost Tradeoffs (Priority: P3)

**Goal**: Builder displays accurate, resilient cost estimates with latency safeguards and NFR warnings.

**Independent Test**: Toggle features, observe Estimate Panel updates, simulate pricing delay to check fallback cache, and confirm performance warning badges render when thresholds exceeded.

### Implementation for User Story 3

- [ ] T011 [US3] Bind Estimate Panel to pricing store in `src/components/cpq/EstimatePanel.tsx` and `src/lib/store/pricing.ts` for optimistic totals and expose breakdown modal/trace per `pricing-rules.md` (AC-UI-BLD-002, AC-PRC-001)
- [ ] T012 [US3] Implement latency tracking + retry/backoff in `src/lib/metrics/latency.ts` and surface fallback UI in `src/components/cpq/EstimatePanel.tsx` (AC-UI-BLD-002, AC-PRC-002)
- [ ] T013 [US3] Render NFR warning badges in `src/components/cpq/EstimatePanel.tsx` using metrics from `src/lib/metrics/*` to flag FPS/latency breaches (AC-UI-VWR-001, AC-UI-BLD-002)

**Checkpoint**: Cost insights remain reliable under jitter, with clear feedback when performance targets are at risk.

---

## Dependencies & Execution Order

### Phase Dependencies

- Foundational (Phase 2) must complete before user story work begins.
- User Story 1 unlocks User Story 2 (viewer relies on toggle state) and User Story 3 (Estimate Panel shell established).
- Polish tasks can run after desired stories or alongside hardening passes.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational pricing pipeline to ensure Estimate Panel scaffolding compiles (even if totals mocked).
- **User Story 2 (P2)**: Depends on User Story 1 for toggle signals and persisted blueprint data.
- **User Story 3 (P3)**: Depends on User Story 1 for Estimate Panel shell and on Foundational pricing API for live totals.

### Within Each User Story

- Toggle validations before persistence (US1).
- Scene canvas before utility buttons and panels (US2).
- Pricing store wiring before latency fallback and warning indicators (US3).

### Parallel Opportunities

- T003 and T004 can proceed in parallel once store scaffolding exists.
- T007 and T009 can run concurrently after SceneCanvas skeleton is in place (shared layout tokens).
- T011 and T012 can be developed in tandem, coordinating shared pricing store contracts.

---

## Parallel Example: User Story 2

```bash
# Run viewer component and panel tasks in parallel (separate files, minimal overlap):
Task: "T007 [US2] Implement SceneCanvas + FPS sampling"
Task: "T009 [US2] Deliver color/option panels and purchase placeholder"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete pricing foundations (T001-T002) to unblock Estimate Panel integration.
2. Deliver builder toggle UX and persistence (T003-T006).
3. Validate toggles and local save/load flows independently.

### Incremental Delivery
1. US1 → ship builder configuration experience.
2. US2 → layer in viewer responsiveness and device framing.
3. US3 → finalize pricing accuracy, latency safeguards, and warnings.

### Parallel Team Strategy
- Developer A: Foundational pricing tasks (T001-T002) then US3 metrics.
- Developer B: US1 builder UX tasks (T003-T006).
- Developer C: US2 viewer & panel tasks (T007-T010).
- Shared: Cross-validate trace manifest updates alongside feature merges.
