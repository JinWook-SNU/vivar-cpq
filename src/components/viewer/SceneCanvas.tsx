"use client";

import clsx from "clsx";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Mesh } from "three";
import {
  useBuilderStore,
  DEFAULT_COLOR,
  DEFAULT_OPTIONS,
  type ViewerOptionId,
} from "@/lib/store/builder";
import { useRuntimeStore } from "@/lib/store/runtime";

export type ViewerOption = ViewerOptionId;

export type SceneUtilities = {
  dimension?: boolean;
  fullscreen?: boolean;
  screenshot?: boolean;
  ar?: boolean;
};

export const SCENE_OPTIONS: { id: ViewerOptionId; label: string }[] = [
  { id: "spoiler", label: "Rear Spoiler" },
  { id: "roofRack", label: "Roof Rack" },
];

const FPS_TARGET = 60;

type ViewerSceneContextValue = {
  color: string;
  options: Record<ViewerOptionId, boolean>;
  setColor: (hex: string) => void;
  setOption: (id: ViewerOptionId, enabled: boolean) => void;
  fps: number;
};

const ViewerSceneContext = createContext<ViewerSceneContextValue | null>(null);

export function ViewerSceneProvider({ children }: { children: ReactNode }) {
  const colorHex = useBuilderStore((state) => state.params.color?.hex ?? DEFAULT_COLOR);
  const optionsMap = useBuilderStore((state) => state.params.options ?? DEFAULT_OPTIONS);
  const setColorHex = useBuilderStore((state) => state.setColorHex);
  const setOptionValue = useBuilderStore((state) => state.setOptionValue);

  const value = useMemo<ViewerSceneContextValue>(
    () => ({
      color: colorHex,
      options: { ...optionsMap },
      setColor: setColorHex,
      setOption: setOptionValue,
      fps: FPS_TARGET,
    }),
    [colorHex, optionsMap, setColorHex, setOptionValue]
  );

  return <ViewerSceneContext.Provider value={value}>{children}</ViewerSceneContext.Provider>;
}

export function useViewerScene() {
  const context = useContext(ViewerSceneContext);
  if (!context) {
    throw new Error("useViewerScene must be used within ViewerSceneProvider");
  }
  return context;
}

type SceneCanvasProps = HTMLAttributes<HTMLDivElement> & {
  utilities?: SceneUtilities;
};

export default function SceneCanvas(props?: SceneCanvasProps) {
  const { utilities, ...rest } = props ?? ({} as SceneCanvasProps);
  const { color, options, fps } = useViewerScene();
  const backgroundColor = useRuntimeStore((state) => state.backgroundColor);
  const productColor = useRuntimeStore((state) => state.productColor);
  const setRuntimeProduct = useRuntimeStore((state) => state.setProductColor);
  const utilFlags: Required<SceneUtilities> = {
    dimension: Boolean(utilities?.dimension),
    fullscreen: Boolean(utilities?.fullscreen),
    screenshot: Boolean(utilities?.screenshot),
    ar: Boolean(utilities?.ar),
  };
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    setRuntimeProduct(color);
  }, [color, setRuntimeProduct]);

  return (
    <div
      {...rest}
      data-testid={
        ((rest as Record<string, unknown>)["data-testid"] as string | undefined) ?? "scene-canvas"
      }
      data-fps={fps}
      data-option-spoiler={options.spoiler}
      data-option-roof-rack={options.roofRack}
      data-util-dimension={utilFlags.dimension}
      data-util-fullscreen={utilFlags.fullscreen}
      data-util-screenshot={utilFlags.screenshot}
      data-util-ar={utilFlags.ar}
      className={clsx(
        "relative h-full w-full overflow-hidden rounded-xl border border-neutral-200",
        "flex items-stretch justify-center bg-neutral-900"
      )}
      style={{ backgroundColor }}
    >
      <Canvas className="h-full w-full" dpr={[1, 1.5]}>
        <color attach="background" args={[backgroundColor]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={0.6} />
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={productColor}
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
        <OrbitControls enablePan={false} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <div className="rounded-lg bg-white/90 px-6 py-4 text-center shadow-md">
          <p className="text-sm font-semibold text-neutral-700">3D Preview</p>
          <p className="text-xs text-neutral-500">Active UI color: {color.toUpperCase()}</p>
          <div className="mt-2 flex flex-col gap-1 text-xs text-neutral-500">
            {SCENE_OPTIONS.map((option) => (
              <span key={option.id}>
                {option.label}: {options[option.id] ? "Visible" : "Hidden"}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400">FPS: {fps}</p>
        </div>
      </div>
    </div>
  );
}

export function useSceneBridge() {
  const setBackground = useRuntimeStore((state) => state.setBackgroundColor);
  const setProduct = useRuntimeStore((state) => state.setProductColor);

  return useMemo(
    () => ({
      setBackground,
      setProduct,
    }),
    [setBackground, setProduct]
  );
}
