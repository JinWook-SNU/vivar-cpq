import { describe, it, expect } from "vitest";
import { toBlueprint, loadBlueprint, saveBlueprint } from "@/lib/persist/blueprint";
import { composeVisible, getTestIds } from "@/lib/runtime/composer";
import { DEFAULT_ENVIRONMENT, type ConfiguratorBlueprint } from "@/lib/store/builder";

describe("Blueprint restoration", () => {
  const build = (toggles: Partial<ConfiguratorBlueprint["featureToggles"]>) =>
    toBlueprint(
      toggles as ConfiguratorBlueprint["featureToggles"],
      {},
      null,
      DEFAULT_ENVIRONMENT
    );

  it("preserves enabled modules after save/load", () => {
    const blueprint = build({
      dimension: true,
      color: true,
      option: true,
      preset: true,
      aiCatalog: true,
    });

    expect(blueprint.featureToggles.dimension).toBe(true);
    expect(blueprint.featureToggles.option).toBe(true);
    expect(blueprint.featureToggles.aiCatalog).toBe(true);
    expect(blueprint.featureToggles.aiSuggestions).toBe(true);

    const visibility = composeVisible(blueprint.featureToggles);
    const ids = getTestIds(visibility);

    expect(ids).toEqual(
      expect.arrayContaining([
        "dimension-hud",
        "panel-product-color",
        "option-panel",
        "preset-bar",
        "ai-suggestions-chips",
        "ai-catalog-card",
      ])
    );
  });

  it("auto-enables dependencies when toggles omitted", () => {
    const blueprint = build({
      preset: true,
      aiCatalog: true,
    });

    expect(blueprint.featureToggles.option).toBe(true);
    expect(blueprint.featureToggles.aiSuggestions).toBe(true);

    const ids = getTestIds(composeVisible(blueprint.featureToggles));
    expect(ids).toEqual(
      expect.arrayContaining([
        "option-panel",
        "preset-bar",
        "ai-suggestions-chips",
        "ai-catalog-card",
      ])
    );
  });

  it("defaults environment background color when missing and persists overrides", () => {
    const toggles = {} as ConfiguratorBlueprint["featureToggles"];
    const blueprint = toBlueprint(toggles, {}, null, { backgroundColor: "#0f172a" });
    expect(blueprint.environment?.backgroundColor).toBe("#0f172a");

    localStorage.clear();
    const legacy = {
      version: 1,
      createdAt: new Date().toISOString(),
      featureToggles: {},
      featureParams: {},
    } as ConfiguratorBlueprint;
    saveBlueprint(legacy);
    const migrated = loadBlueprint();
    expect(migrated?.environment?.backgroundColor).toBe(DEFAULT_ENVIRONMENT.backgroundColor);
    localStorage.clear();
  });
});
