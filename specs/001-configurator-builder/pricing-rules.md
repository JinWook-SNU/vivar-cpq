# Pricing Rules

**Created**: 2025-10-27

## Role Baselines

| Role  | Default Days (Base) | Daily Rate (KRW) |
|-------|----------------------|------------------|
| planner | 2.0                | 300,000          |
| designer | 2.0               | 300,000          |
| fe | 2.0                    | 300,000          |
| three | 2.0                 | 300,000          |
| be | 2.0                    | 300,000          |
| ai | 0.0                    | 300,000          |

Base workload applies once per project before feature-level increments.

## Feature Effort Matrix

| Feature Key         | planner | designer | fe | three | be | ai |
|---------------------|--------------|---------------|------------------|------------------|------------------|
| dimensionOverlay    | 0.1 | 0.2 | 0.3 | 0.2 | 0.4 | 0.0 |
| arPlaceholder       | 0.1 | 0.2 | 0.2 | 0.4 | 0.3 | 0.0 |
| fullscreen          | 0.0 | 0.1 | 0.3 | 0.0 | 0.2 | 0.0 |
| screenshot          | 0.0 | 0.2 | 0.4 | 0.0 | 0.2 | 0.0 |
| color               | 0.1 | 0.2 | 0.4 | 0.0 | 0.3 | 0.0 |
| options             | 0.2 | 0.3 | 0.5 | 0.0 | 0.4 | 0.0 |
| presets             | 0.2 | 0.4 | 0.6 | 0.0 | 0.5 | 0.0 |
| aiSuggestions       | 0.1 | 0.2 | 0.3 | 0.0 | 0.3 | 0.3 |
| aiCatalog           | 0.1 | 0.3 | 0.3 | 0.2 | 0.3 | 0.4 |
| envControls         | 0.1 | 0.3 | 0.4 | 0.0 | 0.3 | 0.0 |
| darkMode            | 0.0 | 0.2 | 0.2 | 0.0 | 0.2 | 0.0 |
| mobileViewport      | 0.1 | 0.3 | 0.5 | 0.0 | 0.4 | 0.0 |

Admins can adjust these values via `/cpq/admin/modules` to reflect bespoke effort distribution.

## Example Calculation Trace

Example: base project with `options`, `presets`, `aiCatalog`, and `aiSuggestions` toggled on.

1. **Base Effort**: Planner 2d, Designer 2d, Service Dev 2d, XR 2d, AI 0d => 8 days × 300,000 = 2,400,000 KRW labour cost.
2. **Feature Increments**:
   - `options`: +0.2 planner, +0.3 designer, +0.5 dev → 1.0 days
   - `presets`: +0.2 planner, +0.4 designer, +0.6 dev → 1.2 days
   - `aiCatalog`: +0.1 planner, +0.3 designer, +0.3 dev, +0.2 XR, +0.4 AI → 1.3 days
   - `aiSuggestions`: +0.1 planner, +0.2 designer, +0.3 dev, +0.3 AI → 0.9 days
   - Total incremental days: Planner +0.6, Designer +1.2, Service Dev +1.7, XR +0.2, AI +0.7
3. **Labour Cost**: (Planner 2.6 + Designer 3.2 + Service Dev 3.7 + XR 2.2 + AI 0.7) days × 300,000 = 3,840,000 KRW.
4. **Overhead (110%)**: 3,840,000 × 0.10 = 384,000 (overhead surcharge).
5. **Technology Fee (20%)**: (3,840,000 + 384,000) × 0.20 = 844,800.
6. **VAT (10%)**: (3,840,000 + 384,000 + 844,800) × 0.10 = 506,880.
7. **Total Quote**: 3,840,000 + 384,000 + 844,800 + 506,880 = 5,575,680 KRW.

Totals and intermediate values must surface under the Estimate Panel “View breakdown” interaction, referencing AC-UI-BLD-002 and AC-PRC-001.
