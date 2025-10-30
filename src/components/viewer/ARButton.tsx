"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useBuilderStore } from "@/lib/store/builder";

export default function ARButton() {
  const visible = useBuilderStore((state) => state.toggles.ar);
  const [open, setOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        data-testid="ar-button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium hover:bg-neutral-50"
      >
        View AR Preview
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          >
            <div className="rounded-lg bg-white p-4 text-sm text-neutral-700 shadow-lg">
              <p className="font-medium">AR preview (placeholder)</p>
              <p className="mt-2 text-xs text-neutral-500">
                Upload your real asset to see a full augmented reality experience in the final release.
              </p>
              <button
                type="button"
                className="mt-3 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium hover:bg-neutral-50"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
