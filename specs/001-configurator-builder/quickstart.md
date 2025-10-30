# Quickstart: Configurator Builder Demo

## Prerequisites
- Node.js 20 LTS
- npm 10+ (or pnpm/bun if project standard)
- Vercel CLI (optional for deployment previews)
- macOS Sonoma or Windows 11 machine with Chrome 120+; iPad Pro Safari 17+ for tablet validation

## Environment Setup
1. Copy `.env.example` to `.env.local` and set:
   - `PRICING_API_SECRET=demo-secret` (placeholder, rotate before production)
   - `CATALOG_BASE_URL=https://mock-catalog.vivar.local`
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the App
```bash
npm run dev
```
- Visit `http://localhost:3000/cpq-builder`
- Use the viewport toggle in the builder sidebar to switch between desktop and mobile frames.
- Upload a sample GLB under “Scene & Assets” controls to replace the placeholder box.

## Testing & Quality Gates
- Lint & types: `npm run lint && npm run typecheck`
- Unit/component tests: `npm run test`
- Smoke (optional): `npx playwright test tests/smoke/builder.spec.ts`
- Trace mapping: `npm run trace:verify`
- Build check: `npm run build`

## Performance Verification
- FPS overlay: enable “Performance HUD” toggle; ensure average stays ≥60 FPS.
- Pricing latency: toggle features and confirm Estimate Panel updates within 500 ms (see console timings).

## Deployment
```bash
npm run build
npm run start   # local preview
```
Push to `main` with Vercel Git integration or run `vercel --prod`.

## Troubleshooting
- **FPS <60**: simplify scene (disable shadows), reduce asset size, ensure React Compiler annotations intact.
- **Pricing timeout**: check mock `/api/pricing` logs; debugger prints include trace IDs.
- **Unsupported 3D file**: verify format (GLB/glTF/OBJ) and size (<25 MB).

## Checkpoint
- **Branch**: `001-configurator-builder`
- **Status**: M1 complete (toggles, dependency guard with toast, Save/Load, savedAt). Tests on Vitest.
- **Next**: M2 (Viewer + Pricing loop) covering pricing engine, API, EstimatePanel optimistic updates, retry/backoff/cache, and latency/FPS warnings.
- M3 consolidated: single ConfiguratorShell renders viewer/panels; duplicate previews removed; left viewer/right panels layout now live.
- Viewer utilities + Color/Option binding + Presets complete
- Next: M4 (Quote packaging & share, Admin mock, Playwright smoke)

## Implementation Notes
- 2025-10-30
  - Impl checkpoint
  - Builder: Feature toggles, Environment (bg color), Estimate panel stub
  - Preview: single viewer shell, 3D box, product color panel
  - R3F: client-only SceneCanvas, dynamic import, background via useThree
  - Persist: blueprint with environment + color
  - TODO (later): option→mesh binding, export, admin mock
