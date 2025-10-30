# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Command guidance will be published under `.specify/templates/commands/` once available.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript (Next.js 16 App Router, React 19 w/ React Compiler)  
**Primary Dependencies**: shadcn/ui, Tailwind CSS 4, @react-three/fiber, @react-three/drei, Prisma  
**Storage**: Prisma data models (PostgreSQL in staging/production)  
**Testing**: Jest (API + shared logic), React Testing Library (UI + R3F harness)  
**Target Platform**: Web (Chrome 120+, Edge 120+, Safari Tech Preview)  
**Project Type**: Single Next.js app with API routes  
**Performance Goals**: >=60 FPS in 3D viewport; <=500 ms P95 quote response  
**Constraints**: No inline styles outside documented canvas bridges; secrets via environment only  
**Scale/Scope**: Enterprise CPQ flows with independently deployable user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Link each deliverable to the spec acceptance criteria and confirm the planned PR stays <=400 changed lines or justify the exception in Complexity Tracking.
- Define how the feature will measure 3D FPS and quote latency (tools, dataset, expected targets) and record instrumentation plans below.
- Enumerate the tests and CI commands that will satisfy `lint`, `typecheck`, `test`, and `build` gates and list any secret-safety considerations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
|-- plan.md          # This file (/speckit.plan command output)
|-- research.md      # Phase 0 output (/speckit.plan command)
|-- data-model.md    # Phase 1 output (/speckit.plan command)
|-- quickstart.md    # Phase 1 output (/speckit.plan command)
|-- contracts/       # Phase 1 output (/speckit.plan command)
\-- tasks.md         # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
|-- app/          # Next.js App Router routes + APIs
|-- components/   # shadcn-based UI primitives and feature widgets
|-- lib/          # shared utilities (Zod schemas, helpers, hooks)
\-- 3d/           # reusable R3F scene graph utilities (create if missing)

tests/
|-- api/          # Jest contract + integration tests for API routes
|-- ui/           # React Testing Library suites for components
\-- 3d/           # R3F-focused interaction or visual regression harness
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
