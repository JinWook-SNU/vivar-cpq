import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ShareLink from "@/components/cpq/ShareLink";
import FeatureToggles from "@/components/cpq/FeatureToggles";
import { useBuilderStore, type FeatureKey } from "@/lib/store/builder";
import { encodeBlueprint, decodeBlueprint, toBlueprint } from "@/lib/persist/blueprint";

const originalClipboard = navigator.clipboard;
let clipboardWriteMock: ReturnType<typeof vi.fn>;

describe("Builder save/load/share flows", () => {
  beforeEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: clipboardWriteMock = vi.fn().mockResolvedValue(undefined),
      },
    });
    globalThis.__TEST_SEARCH__ = undefined;
  });

  afterEach(() => {
    act(() => {
      useBuilderStore.getState().reset();
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    globalThis.__TEST_SEARCH__ = undefined;
  });

  it("generates a share link and copies it to the clipboard", async () => {
    act(() => {
      useBuilderStore.getState().setToggle("dimension", true);
      useBuilderStore.getState().setToggle("color", true);
      useBuilderStore.getState().setEnvironment({ backgroundColor: "#0ea5e9" });
      useBuilderStore.getState().setColorHex("#ff6b6b");
    });

    render(<ShareLink />);

    const copyButton = screen.getByTestId("copy-share-link");
    fireEvent.click(copyButton);

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("/cpq-builder?blueprint=")
      )
    );

    const copiedLink = clipboardWriteMock.mock.calls[0][0] as string;
    expect(screen.getByTestId("share-link-input")).toHaveValue(copiedLink);

    const url = new URL(copiedLink);
    const token = url.searchParams.get("blueprint");
    expect(token).toBeTruthy();

    const decoded = decodeBlueprint(token ?? "");
    expect(decoded).not.toBeNull();
    expect(decoded?.featureToggles.dimension).toBe(true);
    expect(decoded?.featureParams.color?.hex).toBe("#ff6b6b");
    expect(decoded?.environment?.backgroundColor).toBe("#0ea5e9");
  });

  it("loads a shared blueprint from the blueprint query parameter", async () => {
    const sharedToggles: Record<FeatureKey, boolean> = {
      dimension: true,
      fullscreen: false,
      screenshot: false,
      ar: false,
      color: false,
      option: false,
      preset: true,
      aiSuggestions: false,
      aiCatalog: true,
    };
    const blueprint = toBlueprint(sharedToggles, { color: { hex: "#1e90ff" } }, null, {
      backgroundColor: "#0f172a",
    });
    const token = encodeBlueprint(blueprint);
    globalThis.__TEST_SEARCH__ = `?blueprint=${token}`;

    render(<FeatureToggles />);

    await waitFor(() =>
      expect(screen.getByText(/Loaded shared configuration from link/i)).toBeInTheDocument()
    );

    const state = useBuilderStore.getState();
    expect(state.toggles.preset).toBe(true);
    expect(state.toggles.option).toBe(true);
    expect(state.toggles.aiCatalog).toBe(true);
    expect(state.toggles.aiSuggestions).toBe(true);
    expect(state.params.color?.hex).toBe("#1e90ff");
    expect(state.environment.backgroundColor).toBe("#0f172a");
  });
});
