<!--
Sync Impact Report
Version: 0.0.0 -> 1.0.0
Modified Principles:
- N/A -> Spec-Linked Delivery Cadence
- N/A -> Shadcn-First Interface System
- N/A -> Realtime 3D Performance & Accuracy
- N/A -> Quality Gate Ownership
- N/A -> Secret Hygiene & Auditability
Added Sections:
- Technical Stack Commitments
- Workflow & Quality Gates
Removed Sections:
- None
Templates requiring updates:
- [updated] .specify/templates/plan-template.md
- [updated] .specify/templates/spec-template.md
- [updated] .specify/templates/tasks-template.md
- [pending] .specify/templates/commands (directory absent; create guidance once commands exist)
Follow-up TODOs:
- TODO(COMMAND_GUIDANCE): Provide command-specific guidance when command templates are introduced.
-->
# VIVAR CPQ Constitution

## Core Principles

### Spec-Linked Delivery Cadence
- Work MUST originate from an approved feature specification in `specs/` or a documented emergency runbook; every PR description MUST link the relevant acceptance criteria.
- Each PR MUST stay within 400 changed lines (generated assets excluded) and focus on a single acceptance criterion or bugfix; larger changes require a Complexity Tracking entry in `plan.md`.
- Plans and task breakdowns MUST preserve user-story independence so any single story can be shipped, tested, and demoed without waiting on later scope.

Rationale: Tight traceability keeps the quoting experience releasable and aligned with customer value.

### Shadcn-First Interface System
- UI components MUST extend shadcn/ui primitives or shared wrappers; Tailwind classes MUST rely on approved design tokens, and inline `style` props are prohibited except for documented `/* canvas bridge */` hooks into the 3D viewport.
- React Compiler annotations MUST remain enabled on performance-critical components; disabling it requires a spec note plus a follow-up task to restore annotations.
- 3D experiences MUST be built on `@react-three/fiber` (R3F) and `@react-three/drei`; direct Three.js usage requires justification in `plan.md` and wrapping abstractions for reuse.

Rationale: Consistent UI primitives and compiler hints keep the web + 3D canvas coherent and maintainable.

### Realtime 3D Performance & Accuracy
- Customer-facing 3D scenes MUST sustain >=60 FPS on a MacBook Air M1 (Chrome 120+) measured with the React Profiler or WebGL stats prior to merge, with metrics captured in the feature plan.
- Quoting API routes MUST achieve <=500 ms P95 response on staging datasets, and Jest contract tests MUST assert deterministic pricing for representative configurations.
- Data exchanged between the 3D client and pricing engine MUST be schema-validated (e.g., Zod) to prevent drift and ensure calculations stay consistent.

Rationale: The product promise depends on rapid visualization plus trustworthy pricing every time.

### Quality Gate Ownership
- Feature branches MUST provide and run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`; merges are blocked until all succeed locally and in CI.
- New work MUST ship Jest coverage for API logic and component/integration tests for UI or 3D interactions that satisfy the linked acceptance criteria.
- Engineers MUST fix flakiness or failures before sign-off; temporary skips demand a dated TODO with owner and follow-up task.

Rationale: Automated gates uphold reliability and keep regressions from reaching customers.

### Secret Hygiene & Auditability
- Secrets MUST flow through environment variables only; never commit real credentials to code, specs, fixtures, screenshots, or PR discussions.
- `.env.example` MUST list required keys with dummy values, and reviewers MUST block merges when accidental exposure occurs until rotation and documentation are complete.
- Logs, analytics, and debugging snapshots MUST redact secrets before persistence; introduce redaction utilities when gaps are discovered.

Rationale: Protects customer data while preserving an auditable trail for compliance.

## Technical Stack Commitments
- Frontend delivers through Next.js 16 App Router with React 19 Compiler annotations enabled; server components stay default unless a spec-approved exception is documented.
- Tailwind CSS 4 operates in JIT mode with shared tokens; shadcn/ui is the default component library for all form and layout work.
- 3D configurators rely on `@react-three/fiber` and `@react-three/drei`, with reusable scene utilities maintained under `src/3d/`.
- Backend logic resides in Next.js API routes; Prisma manages persistence when data storage is required, and API contracts live in `specs/[feature]/contracts/`.
- Testing stack centers on Jest (API + shared logic) and React Testing Library (UI + R3F harness), with test files colocated alongside implementation.

## Workflow & Quality Gates
- Every feature follows the `/speckit.plan`, `/speckit.spec`, and `/speckit.tasks` flow unless governance approves an emergency shortcut; artifacts MUST be committed before user-story implementation begins.
- PR titles follow Conventional Commits and MUST include the spec ID plus acceptance criterion reference (e.g., `feat: us123 quote summary (AC2)`).
- Feature branches use the pattern `###-short-slug`; merging into `main` requires at least one reviewer verifying principle compliance via the Constitution Check section in `plan.md`.
- Performance metrics (FPS + latency) gathered per feature MUST be stored in `specs/[feature]/research.md` or `plan.md` for traceability.
- Deployment readiness checks include verifying `.env.example` updates, documentation touchpoints, and any security considerations noted in the spec.

## Governance
- This constitution supersedes conflicting guidance; deviations require a written exception logged in `specs/_governance/exceptions.md` with an expiry date.
- Amendments require a proposal PR referencing impact areas, approval from Product + Engineering leads, and updated templates or runbooks before merging.
- Versioning follows semantic rules: MAJOR for breaking governance changes, MINOR for new principles or sections, PATCH for clarifications. Record the rationale in the amendment PR.
- Compliance reviews occur at least once per quarter during release retros; findings and remediation owners are tracked in `specs/_governance/compliance.md`.
- Persistent non-compliance (two consecutive reviews) triggers an incident review to restore adherence before new feature work proceeds.

**Version**: 1.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-27
