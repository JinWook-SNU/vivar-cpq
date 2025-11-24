# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vivar-cpq** is a Configure Price Quote (CPQ) system for sales demos. It enables non-technical teammates to compose product configurators by toggling capabilities in real-time while seeing live pricing and UX impact. The main interface is a split-pane builder: left pane shows customer-facing viewer, right pane contains configuration controls.

## Commands

```bash
npm run dev          # Start dev server on :3000
npm run build        # Build for production
npm test             # Run all tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run typecheck    # TypeScript check without emitting
```

## Architecture

### Tech Stack
- **Next.js 16** with App Router and React Compiler
- **React 19**, **TypeScript 5** (strict mode)
- **Tailwind CSS 4** with design tokens
- **shadcn/ui** for accessible components
- **@react-three/fiber & three.js** for 3D canvas
- **Zustand 5** for state management
- **Vitest** with jsdom for testing

### Key Routes
- `/cpq-builder` — Main split-pane interface (ConfiguratorShell + FeatureToggles + EstimatePanel)
- `/api/pricing` — POST endpoint for cost calculation
- `/api/catalog` — GET endpoint for product catalog

### State Management (Zustand Stores)
- **Builder Store** (`lib/store/builder.ts`): Feature toggles, params, environment settings
- **Pricing Store** (`lib/store/pricing.ts`): Cached cost estimates
- **Runtime Store** (`lib/store/runtime.ts`): FPS and latency metrics

### Core Domain Concepts
- **ConfiguratorBlueprint**: Saved configuration snapshot (toggles, params, environment)
- **FeatureToggle**: Capability with dependencies, conflicts, and cost impact
- **PricingTotals**: Cost breakdown with dev cost, maintenance, overhead, technology fee, VAT

### Critical Paths
| File | Purpose |
|------|---------|
| `src/app/cpq-builder/page.tsx` | Main builder entry point |
| `src/lib/store/builder.ts` | Core state machine |
| `src/lib/pricing/engine.ts` | Cost calculation logic |
| `src/lib/featureRules.ts` | Feature dependency & conflict rules |
| `src/lib/persist/blueprint.ts` | Save/load/encode blueprints |
| `src/components/cpq/ConfiguratorShell.tsx` | Viewer wrapper |
| `src/components/viewer/SceneCanvas.tsx` | Three.js canvas |

## Testing

- Tests are in `tests/` directory (ui/, api/, store/)
- Setup file at `tests/setup.vitest.ts` mocks @react-three/fiber, next/navigation, Canvas API
- Suppress r3f-related console warnings for lights and meshes in tests

## Development Guidelines

- Never commit secrets. Use `process.env` / `.env.local`
- Add tests for pricing engine changes
- UI uses shadcn components; avoid inline styles
- Create small, reviewable PRs with clear commit messages
- Performance targets: 60 FPS, ≤500ms pricing latency
