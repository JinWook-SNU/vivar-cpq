# Feature Specification: Configurator Builder for Sales Demos

**Feature Branch**: `001-configurator-builder`  
**Created**: 2025-10-27  
**Status**: Draft  
**Input**: User description: "Create a 'Configurator Builder' that helps non-technical teammates compose a product configurator for sales demos. WHAT - Left pane: a live configurator UI where end users would interact. It shows: (a) utility buttons (dimension overlay, AR, fullscreen, screenshot), (b) a 3D product view, (c) a small panel to change product color and attach options, and (d) a price box with a purchase button. - Right pane: a builder tab for sales/PMs to choose which features the left pane exposes. The builder can enable/disable features (dimension, AR, fullscreen, screenshot, color, options, presets, AI suggestions, AI catalog). Each change immediately updates the left pane's visible controls and behavior. - The builder tab also shows a live estimate of development cost and monthly maintenance cost that updates whenever features change. WHY - In sales meetings, we need instant demo + instant quote. Toggling features must reflect in the live UX and in the budget, so prospects understand scope-versus-cost tradeoffs immediately. SCOPE - Include: feature toggles, live updates to the left UI, simple AR/screenshot placeholders, and real-time cost estimation. - Exclude (for now): full e-commerce flows, real AR asset pipelines, authentication, and analytics. SUCCESS - A user can toggle a feature and see (1) the left UI change and (2) the estimate change within a moment."

## Overview

Enable sales and product marketing teammates to assemble a demo-ready product configurator by toggling capabilities. The left pane presents the live customer-facing experience; the right pane lets internal users choose which controls, presets, and AI aids appear while exposing the cost impact of each choice.

## Goals

- Deliver an interactive builder that reflects feature toggles in the demo pane instantly.
- Provide transparent cost estimates that help sales explain scope-versus-budget tradeoffs on the spot.
- Maintain the performance, pricing accuracy, and design system conventions mandated by the constitution while enabling rapid experimentation.

## Assumptions

- Baseline pricing logic for individual features and maintenance loads exists and can be expressed as additive cost coefficients.
- Demo sessions run on managed sales devices with reliable network access so cost and pricing calculations can complete within the target response time.
- Builder access is limited to authenticated internal teammates through existing workspace controls; handling authentication flows is outside this feature.

## Out of Scope

- Real augmented-reality asset streaming, complex screenshot workflows, or integrations with downstream e-commerce checkout.
- Payment processing, user-specific pricing agreements, or quote approvals.
- Analytics capture, experimentation frameworks, or external sharing of builder configurations.

## Dependencies

- Product metadata describing available colors, options, presets, and AI experiences.
- Pricing service or rules engine capable of producing a base price and cost deltas per feature toggle.
- Existing design system components and 3D scene utilities to maintain visual and performance consistency.
- Asset processing service or validation tooling able to accept three.js-compatible uploads (GLB, glTF, OBJ) and surface safe previews within the sales runtime environment.
- Theme and styling infrastructure capable of switching between dark and light modes without violating design system constraints.
- Responsive layout system and device preview components that can emulate browser chrome and viewport breakpoints for desktop and mobile modes.

## Clarifications

### Session 2025-10-27

- Q: What devices and browsers must the demo support? → A: Chrome/Edge/Firefox 최신(Windows 11·macOS) & 모바일 Safari/Chrome(iPhone·Android).
- Q: What default 3D asset should appear when no customer product is supplied? → A: 사용자가 자산을 제공하기 전까지는 3D 공간에 기본 박스 플레이스홀더를 배치하고, 향후 고객 상품 사진 기반 3D 생성은 후속 항목으로 관리한다.
- Q: How should customer-supplied 3D assets behave? → A: 고객이 three.js 호환 파일(GLB, glTF, OBJ 등)을 업로드하면 즉시 미리 보기로 반영하고, 자산이 없거나 업로드 실패 시에는 기본 박스 플레이스홀더를 유지한다.
- Q: What scene and interface customization controls does the builder require? → A: 우측 빌더에서 3D 배경·조명 등의 간단한 환경 설정과 인터페이스 다크/라이트 모드 전환을 즉시 적용할 수 있어야 한다.
- Q: How should the demo represent device form factors? → A: 데모는 브라우저 프레임 형태 안에서 동작하고, 데스크탑·모바일 모드를 토글해 각각 최적화된 UI를 즉시 보여줘야 한다.

## User Scenarios & Testing *(mandatory)*

Each user story MUST cite the acceptance criteria ID(s) from the plan and describe how we will verify 3D responsiveness (>=60 FPS) and quote latency (<=500 ms P95) during validation.

### User Story 1 - Configure Demo Capabilities (Priority: P1)

A sales teammate picks which capabilities (utility buttons, color controls, AI aids) the customer demo should expose and watches the live preview update.

**Why this priority**: This is the core value proposition—non-technical teammates must tailor the demo mid-conversation to highlight relevant capabilities.

**Independent Test**: Toggle each feature flag in the builder while observing the live pane and instrumentation logs to confirm visible controls and pricing respond within the target budget and performance thresholds.

**Acceptance Scenarios**:

1. **Given** the default 3D configuration with all features disabled, **When** the sales teammate enables the dimension overlay and screenshot utilities in the builder, **Then** the left pane immediately shows the two utility buttons, the pricing response occurs within 500 ms, and the canvas stays at or above 60 FPS (AC1).
2. **Given** a configuration with color and options controls enabled, **When** the teammate disables options in the builder, **Then** the options panel disappears from the left pane, related pricing adjustments are removed in under 500 ms, and the monitoring hook logs the change against AC2 tests.
3. **Given** the builder environment controls are visible, **When** the teammate switches the background preset and enables dark mode, **Then** the left pane reflects the new lighting and theme instantly while remaining within performance targets (AC7).

---

### User Story 2 - Prospect Explores Configured Demo (Priority: P2)

**Control Behaviors**:

- **Dimension Overlay**: Toggles measurement HUD overlay; displays toast “Dimensions overlay enabled/disabled” on change.
- **Fullscreen Button**: Invokes browser fullscreen API with fallback toast if blocked.
- **Screenshot Button**: Captures WebGL canvas and renders preview modal with download CTA.
- **Color Panel**: Applies selected swatch instantly to model material; displays hex code preview.
- **Option Panel**: Lists configurable attachments/options with check state; disabling options removes dependent presets with helper toast.
- **Purchase Bar**: Static CTA placeholder showing current quote summary text; no checkout wiring.
- **Preset Bar**: Shows preset pills; applying preset updates color/options together and logs action.
- **AI Catalog UI**: Shows placeholder gallery card with “Powered by AI” ribbon when enabled; no backend request.
- **AI Suggestions UI**: Presents suggestion chip(s) that inject recommended configs into panels; uses toast to confirm injection, no AI call.
- **AR Button**: Opens modal with static AR preview image and explanatory copy.

A prospect uses only the controls exposed by the builder to explore the product (change colors, toggle AR placeholder, inspect pricing) during a live meeting.

**Why this priority**: Ensures the resulting demo gives prospects a smooth, performant experience that matches what the sales teammate promised.

**Independent Test**: Start a demo session with a saved configuration, simulate user actions on the left pane, and verify FPS and price metrics meet thresholds without relying on the builder tab.

**Acceptance Scenarios**:

1. **Given** a saved configuration with AR placeholder disabled, **When** the prospect opens the utility menu, **Then** AR is absent, the remaining buttons respond instantly, and pricing recalculations stay within 500 ms (AC3).
2. **Given** a configuration that exposes color and preset controls, **When** the prospect applies a preset, **Then** the 3D view updates while maintaining 60 FPS and the quote reflects the preset’s cost impact in under 500 ms (AC4).
3. **Given** the demo is switched to mobile mode, **When** the prospect interacts with the mobile-optimized UI inside the browser-frame shell, **Then** all exposed controls remain accessible without horizontal scrolling and pricing updates stay within the 500 ms budget (AC8).

**Viewer Control Matrix**:

| State                            | Visible Controls                                                                                                       | Hidden/Disabled Controls                                              |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| Desktop + All Toggles Enabled    | DimensionHUD, FullscreenButton, ScreenshotButton, ColorPanel, OptionPanel, PurchaseBar, PresetBar, AI Catalog UI, AI Suggestions UI | AR placeholder button (if disabled), catalog/suggestion UI obeys toggles |
| Desktop + AI Catalog Off         | Same as above minus AI Catalog placeholder; AI Suggestions UI remains visible if enabled                              | AI Catalog UI (placeholder removed), AR per toggle                     |
| Mobile Viewport                  | Mobile-optimized versions of active controls (stacked panels, persistent purchase CTA, touch-safe utility tray)      | Hover-only affordances, desktop-only layout artifacts                  |
| Presets Disabled                 | All other toggles honored; PresetBar hidden, preset quick actions absent                                             | PresetBar                                                              |
| AR Placeholder Disabled          | All other controls visible; AR button hidden                                                                          | ARButton                                                               |
| Options Disabled                 | OptionPanel hidden; PresetBar blocked with toast until options re-enabled                                            | OptionPanel, PresetBar                                                 |

---

### User Story 3 - Quantify Cost Tradeoffs (Priority: P3)

A sales or product marketing teammate reviews how selected features influence development and maintenance cost to shape scope discussions.

**Why this priority**: Demonstrating budget implications alongside UX changes builds trust with prospects and internal stakeholders.

**Independent Test**: Toggle feature combinations, capture the cost summary, and compare outputs against expected baseline cost tables to verify accuracy and latency without performing other user stories.

**Acceptance Scenarios**:

1. **Given** baseline cost coefficients, **When** the teammate enables presets and AI suggestions, **Then** the development and maintenance totals update within 500 ms and appear alongside the live pane with audit logs for AC5.
2. **Given** the teammate disables all premium features, **When** only basic utilities remain, **Then** the cost estimate resets to the baseline amount, the UI reflects the reduced scope, and FPS remains at or above 60 during the update (AC6).

---

### Edge Cases

- Builder selects mutually dependent features (e.g., AI catalog requires AI suggestions) without enabling prerequisites—system must auto-resolve or prompt to maintain a valid configuration.
- All optional features are disabled—left pane should gracefully display a minimal demo with utility buttons hidden and price still available.
- Cost estimation service is briefly unavailable—builder should surface a warning banner while keeping the last known breakdown and attempt a silent retry.
- Prospect triggers rapid toggle sequences (e.g., switching colors repeatedly)—performance monitoring must ensure FPS stays above 60 and cost updates remain stable.
- Customer uploads an oversized or unsupported 3D file—the builder must reject the asset, explain the accepted formats, and keep the placeholder without breaking the demo.
- Builder switches the scene to an environment preset that conflicts with current lighting—system must clamp values to safe ranges and preview the fallback state to avoid blinding or dark scenes.
- Builder toggles from desktop to mobile mode mid-demo—the UI must reflow safely without losing state or generating overlapping controls within the browser-frame shell.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The builder pane MUST list all configurable capabilities (dimension overlay, AR placeholder, fullscreen, screenshot, color, options, presets, AI suggestions, AI catalog) with on/off controls.
- **FR-002**: Toggling any capability MUST update the left pane’s available controls and behaviors in under 500 ms, including showing or hiding related UI modules.
- **FR-003**: The configurator MUST maintain accurate pricing, adjusting totals when features add or remove cost drivers (using `ROLE_RATES` {planner, designer, fe, three, be, ai} and `k` factor range 0.8–1.5), while keeping P95 response at or below 500 ms.
- **FR-004**: The cost summary MUST present both estimated development effort and monthly maintenance cost, citing which toggles influence each number, and expose a breakdown (base labour, overhead 110%, technology fee 20%, VAT 10%) in the Estimate Panel detail view per AC-PRC-001; it MUST list included features and trace identifiers.
- **FR-005**: The system MUST log toggle actions with timestamps and resulting cost totals to support audit and follow-up conversations.
- **FR-006**: The builder MUST prevent invalid combinations (e.g., enabling AI catalog without AI suggestions) by auto-enabling prerequisites or displaying actionable messaging.
- **FR-007**: The left pane MUST retain a baseline demo experience (3D view, price box, purchase call-to-action placeholder) even when all optional toggles are off.
- **FR-008**: The solution MUST allow saving and loading a configuration state so that the demo can be reused across meetings without re-toggling everything.
- **FR-009**: Performance monitoring MUST capture 3D frame rate and pricing latency for each session and expose the readings for compliance with the constitution targets.
- **FR-010**: Screenshot and AR experiences MUST use placeholders that communicate the conceptual feature without requiring full production asset flows.
- **FR-011**: The configurator MUST allow sales teammates to upload customer-provided 3D assets in three.js-compatible formats (e.g., GLB, glTF, OBJ) and display the uploaded model immediately in the viewport; if no asset is supplied or the upload fails, the branded box placeholder MUST remain visible.
- **FR-012**: The system MUST validate uploaded 3D assets for size and format, surface user-friendly errors when unsupported files are provided, and offer the ability to revert to the placeholder asset.
- **FR-013**: The builder MUST provide environment controls (preset list: `light`, `dark`, `studio`, `gradient`, `custom`; ambient/directional intensity clamped 0–2) and each change MUST reflect in the 3D scene within 500 ms, satisfying AC-UI-BLD-001 measurement hooks.
- **FR-014**: The interface MUST include a dark/light theme toggle that immediately updates both builder and viewer panes, persists in `ConfiguratorBlueprint`, and defaults to light mode on first load, as mandated by AC-UI-BLD-001.
- **FR-015**: The demo MUST render inside a browser-style frame with a viewport toggle (`desktop` ≥1280 px width, `mobile` 414 px reference width) that switches in ≤300 ms while preserving layout accessibility (tab order, focus states), aligned to AC-UI-BLD-001.
- **FR-016**: Mobile mode MUST present a touch-optimized interface (larger hit targets, vertical stacking, no horizontal scrolling) while preserving all enabled features and adherence to latency and FPS budgets.

### Non-Functional Requirements

- **NFR-001**: The live configurator viewport MUST sustain at least 60 FPS on the baseline sales hardware during feature toggles and demo interactions.
- **NFR-002**: Pricing and cost recalculations MUST return within 500 ms for 95% of requests during builder and demo usage.
- **NFR-003**: UI elements MUST follow the established VIVAR design system tokens and avoid inline styling except where the 3D canvas bridge necessitates it.
- **NFR-004**: The builder MUST remain usable on sales tablets and laptops with screen widths down to 1280 px without horizontal scrolling.
- **NFR-005**: The delivered experience MUST meet all functional and performance targets on Chrome, Edge, and Firefox 최신 버전(Windows 11·macOS)과 모바일 Safari 및 Chrome(iPhone·Android).
- **NFR-006**: Desktop/mobile viewport toggles MUST switch in under 300 ms and maintain accessibility standards (WCAG 2.1 AA) for focus order, contrast, and touch target sizing.

### Key Entities *(include if feature involves data)*

- **ConfiguratorBlueprint**: Stores the chosen toggle states, default presets, and timestamp of the last update for a sales demo session.
- **FeatureToggle**: Represents an individual capability with display name, description, prerequisite relationships, and cost coefficients.
- **CostEstimate**: Captures development effort, maintenance cost, and the calculation trace tying totals to enabled toggles and pricing adjustments.
- **PresetCatalogEntry**: Describes a saved combination of color, options, and AI suggestions that can be applied by the left pane.
- **CustomerAsset**: Stores metadata for uploaded 3D models (format, size, validation status) and references to the active demo asset or fallback placeholder.
- **SceneSetting**: Captures environment presets, background parameters, lighting values, theme selections, and the active viewport mode (desktop or mobile) tied to a saved configurator blueprint.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of feature toggles update both the live demo controls and the cost summary within 500 ms during usability testing.
- **SC-002**: Demo sessions maintain an observed frame rate of at least 60 FPS while prospects interact with color changes and presets.
- **SC-003**: Sales teams report that scope-versus-budget conversations conclude in under 5 minutes in 90% of pilot demos (measured via post-demo survey).
- **SC-004**: At least 80% of saved configurations load successfully without reconfiguration and reflect the exact previously enabled features.

## Assumptions & Dependencies Validation

- All toggles map to product capabilities already defined in the product metadata service.
- Pricing engine can surface both development and maintenance cost estimates when provided with a set of enabled features.
- Sales enablement will provide baseline narratives for AI placeholder messaging to align expectations during demos.
