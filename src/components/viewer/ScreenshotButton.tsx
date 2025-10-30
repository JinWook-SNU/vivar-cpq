"use client";

import { useBuilderStore } from "@/lib/store/builder";

function notify(message: string) {
  if (typeof window !== "undefined") {
    console.info(message);
  }
}

export default function ScreenshotButton() {
  const visible = useBuilderStore((state) => state.toggles.screenshot);

  if (!visible) return null;

  function handleScreenshot() {
    const canvas = document.querySelector("canvas");
    if (!canvas || typeof (canvas as HTMLCanvasElement).toDataURL !== "function") {
      notify("No canvas available for screenshot");
      return;
    }

    const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `configurator-${Date.now()}.png`;
    link.click();
    notify("Screenshot captured");
  }

  return (
    <button
      type="button"
      data-testid="screenshot-button"
      onClick={handleScreenshot}
      className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
    >
      Screenshot
    </button>
  );
}
