# Feature Toggle Rules

| Feature Key          | Requires                              | Conflicts                  | Policy |
|----------------------|---------------------------------------|----------------------------|--------|
| `dimensionOverlay`   | –                                     | –                          | Free toggle |
| `arPlaceholder`      | –                                     | –                          | Free toggle |
| `fullscreen`         | –                                     | –                          | Free toggle |
| `screenshot`         | –                                     | –                          | Free toggle |
| `color`              | –                                     | –                          | Free toggle |
| `options`            | –                                     | –                          | Free toggle |
| `presets`            | `options` (for preset option bundles) | –                          | Auto-enable `options` when turning on; disable with toast if user attempts to turn off `options` while `presets` active |
| `aiSuggestions`      | –                                     | –                          | Independent UI-only toggle |
| `aiCatalog`          | `aiSuggestions`                      | –                          | Auto-enable `aiSuggestions` when turning on; block disable with toast reason message |
| `envControls`        | –                                     | –                          | Free toggle |
| `darkMode`           | –                                     | –                          | Free toggle |
| `mobileViewport`     | –                                     | –                          | Free toggle |

## Handling Policies

- **Auto-enable**: When a user enables `presets`, automatically turn on `options` (and surface inline helper text explaining the relationship). When enabling `aiCatalog`, automatically enable `aiSuggestions` and show toast “AI Catalog requires AI Suggestions; both toggled on.”
- **Prevent Disable**: If `options` is toggled off while `presets` remains active, block the action and display a toast message: “Presets require Options. Disable presets first or keep options enabled.” If `aiSuggestions` is toggled off while `aiCatalog` is on, block and toast “AI Catalog depends on AI Suggestions. Please disable AI Catalog first.”
- **Independent AI Toggles**: `aiCatalog` and `aiSuggestions` do not enforce prerequisites on each other. Both simply expose or hide their respective placeholder experiences without invoking backend AI services.
- **Notification Style**: Use shadcn toast components for all blocking messages; success/auto-enable messages should be non-blocking to keep the flow fast during demos.*** End Patch
