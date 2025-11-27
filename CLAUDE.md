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

## Design System

### Page Layout
- **Background**: `bg-gradient-to-br from-slate-50 to-slate-100` for pages
- **Container**: `container max-w-5xl mx-auto py-12 px-4`
- **Spacing**: Use `space-y-*` for vertical stacking, `gap-*` for grids

### Card Patterns
- **Emphasis cards**: `border-2` for important sections
- **Interactive cards**: Add `hover:border-primary/50 transition-colors`
- **Card headers with icons**:
  ```tsx
  <CardHeader className="bg-slate-50/50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </div>
    </div>
  </CardHeader>
  ```

### Form Controls
- **Toggle rows**: Clickable div wrapping Switch with label + description
  ```tsx
  <div
    className="flex items-center justify-between p-4 border rounded-lg bg-white cursor-pointer hover:bg-slate-50 transition-colors"
    onClick={() => toggle()}
  >
    <div className="space-y-0.5">
      <Label className="cursor-pointer">Label</Label>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
    <Switch checked={value} onCheckedChange={toggle} />
  </div>
  ```
- **Inputs/Selects**: Use `h-11` for consistent height

### Typography
- **Page title**: `text-3xl font-semibold` centered with Badge above
- **Descriptions**: `text-muted-foreground`
- **Required fields**: `<span className="text-destructive">*</span>`

### Interactive States
- All clickable elements must have `cursor-pointer`
- Hover effects on borders: `hover:border-primary/50`
- Hover effects on backgrounds: `hover:bg-slate-50`
- Disabled states: `disabled:cursor-not-allowed disabled:opacity-50`

### Color Usage
- **Primary actions**: Default button (dark background)
- **Secondary actions**: Outline or secondary variant
- **Success feedback**: `border-green-200 bg-green-50 text-green-800`
- **Info badges**: `bg-primary/10 text-primary`

## Development Guidelines

- Never commit secrets. Use `process.env` / `.env.local`
- Add tests for pricing engine changes
- UI uses shadcn components; avoid inline styles
- Create small, reviewable PRs with clear commit messages
- Performance targets: 60 FPS, ≤500ms pricing latency
