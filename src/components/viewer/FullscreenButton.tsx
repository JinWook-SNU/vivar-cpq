"use client";

import { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";

function notify(message: string) {
  if (typeof window !== "undefined") {
    console.info(message);
  }
}

export default function FullscreenButton() {
  const visible = useBuilderStore((state) => state.toggles.fullscreen);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    handleChange();
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (!visible) return null;

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        notify("Exited fullscreen");
      } else {
        const target = document.documentElement;
        await target.requestFullscreen();
        notify("Entered fullscreen");
      }
    } catch (error) {
      notify(`Fullscreen not available: ${String((error as Error)?.message || error)}`);
    }
  }

  return (
    <button
      type="button"
      data-testid="fullscreen-button"
      onClick={toggleFullscreen}
      className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
    >
      {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    </button>
  );
}
