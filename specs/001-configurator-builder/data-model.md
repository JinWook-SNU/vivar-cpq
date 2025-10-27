# Data Model: Configurator Builder

## Overview

The builder persists demo configurations locally, drives pricing requests, and records instrumentation metrics. Core entities are modeled to match spec requirements and ensure future server sync compatibility.

## Entities

### ConfiguratorBlueprint (v1)
- **Fields**
  - `version` (number, default `1`)
  - `id` (UUID string, generated client-side)
  - `name` (string, <= 80 chars, optional label for saved blueprint)
  - `featureToggles` (Record<string, boolean>) — keyed by feature identifier (`dimension`, `arPlaceholder`, `fullscreen`, `screenshot`, `color`, `options`, `presets`, `aiSuggestions`, `aiCatalog`, `envControls`, `darkMode`, `mobileViewport`, etc.)
  - `featureParams` (object) — includes color palettes, option IDs, AI stub text, environment preset slug, lighting intensity values
  - `presetId` (string | null) — reference into `PresetCatalogEntry`
  - `environment` (`SceneSetting`) — background preset, lighting, theme, viewport mode
  - `customerAssetId` (string | null) — link to `CustomerAsset`
  - `createdAt` (ISO timestamp)
  - `updatedAt` (ISO timestamp)
- **Constraints**
  - Versioned; migrations must bump `version` and provide mapper.
  - `featureToggles` must satisfy dependency rules (e.g., `aiCatalog` implies `aiSuggestions`).
  - Must store at least one saved blueprint in localStorage; fallback blueprint generated on first run.

### SceneSetting
- **Fields**
  - `backgroundPreset` (enum: `light`, `dark`, `studio`, `gradient`, `custom`)
  - `backgroundColor` (hex | null when preset provides color)
  - `ambientIntensity` (0-2 float)
  - `directionalIntensity` (0-2 float)
  - `directionalHue` (0-360 number)
  - `theme` (enum: `light`, `dark`)
  - `viewportMode` (enum: `desktop`, `mobile`)
- **Constraints**
  - Clamp intensities to safe ranges to avoid visual flicker.
  - `viewportMode` change must trigger responsive layout updates.

### FeatureToggle Metadata (derived from configuration)
- **Fields**
  - `key` (string identifier)
  - `label` (string, localized)
  - `description` (string, localized)
  - `category` (enum: `utility`, `visual`, `ai`, `sales`)
  - `requires` (string[] of keys)
  - `conflicts` (string[] of keys)
  - `costImpact` (number representing dev hours delta)
  - `maintenanceImpact` (number representing monthly hours delta)
- **Constraints**
  - Maintained in `featureRules.ts`; consumed by Toggle UI and pricing engine.
  - Used to auto-enable prerequisites and block conflicting toggles with messaging.

### CustomerAsset
- **Fields**
  - `id` (UUID string)
  - `fileName` (string)
  - `fileSize` (number in bytes)
  - `mimeType` (string, validated subset: `model/gltf+json`, `model/gltf-binary`, `model/obj`)
  - `source` (enum: `upload`, `preset`, `generated`)
  - `status` (enum: `ready`, `processing`, `error`)
  - `error` (string | null)
  - `previewUrl` (string | null) — object URL for preview
  - `uploadedAt` (ISO timestamp)
- **Constraints**
  - File size limit <= 25 MB to protect WebGL performance.
  - `ready` status required before viewer swap; otherwise fallback to placeholder.

### CostEstimate
- **Fields**
  - `devHours` (number)
  - `maintHours` (number)
  - `devRate` (number, hourly)
  - `maintRate` (number, hourly)
  - `featureBreakdown` (array of `{featureKey, devDelta, maintDelta}`)
  - `kFactor` (number within configured range, e.g., 0.8 - 1.5)
  - `totalDevCost` (number)
  - `totalMaintCost` (number)
  - `traceId` (string UUID)
- **Constraints**
  - Returned by pricing API; persisted in store for optimistic UI.
  - P95 latency <= 500 ms; store caches last known `traceId`.

### PresetCatalogEntry
- **Fields**
  - `id` (string)
  - `name` (string)
  - `description` (string)
  - `colorSwatch` (string hex)
  - `optionIds` (string[])
  - `aiScript` (string stub for guided suggestions)
- **Constraints**
  - Mocked in admin route; accessible in builder for quick toggles.
  - Ties into `ConfiguratorBlueprint.presetId`.

## Relationships
- `ConfiguratorBlueprint` references `CustomerAsset`, `SceneSetting`, and optionally `PresetCatalogEntry`.
- `CostEstimate` is derived from `ConfiguratorBlueprint.featureToggles` and feature metadata within `featureRules.ts`.
- `FeatureToggle Metadata` feeds both builder UI and pricing rules; not persisted per blueprint but versioned for audit.

## Lifecycle Notes
- Blueprints saved to localStorage (`persist/blueprint.ts`). On load, validate schema, migrate if necessary, rebuild Zustand slices.
- Customer assets stored in-memory/object URLs; future server sync should upload to signed storage and keep metadata map.
- Cost estimates cached in Zustand; stale data flagged if older than 5 minutes or when toggles diverge from recorded `traceId`.

## Validation Rules
- All user inputs run through Zod schemas:
  - `pricingRequestSchema` validating toggles, params, role rates, `kFactor`.
  - `blueprintSchema` for persistence migrations.
  - `sceneSettingSchema` clamping intensity to safe bounds.
- UI forms enforce dependency hints before dispatching toggle actions.
