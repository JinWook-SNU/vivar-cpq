"use client";

import { useMemo } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { useViewerScene, SCENE_OPTIONS } from "@/components/viewer/SceneCanvas";

export default function OptionPanel() {
  const visible = useBuilderStore((state) => state.toggles.option || state.toggles.preset);
  const { options, setOption } = useViewerScene();
  const optionList = useMemo(() => SCENE_OPTIONS, []);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="option-panel">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Options</p>
      <div className="space-y-1 text-sm text-neutral-700">
        {optionList.map((option) => (
          <label key={option.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!options[option.id]}
              onChange={(event) => setOption(option.id, event.currentTarget.checked)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
