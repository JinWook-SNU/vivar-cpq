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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
  const syncRuntimeOptions = useRuntimeStore((state) => state.setOptions);

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

  useEffect(() => {
    syncRuntimeOptions(optionsMap);
  }, [optionsMap, syncRuntimeOptions]);

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
  useEffect(() => {
    setRuntimeProduct(color);
  }, [color, setRuntimeProduct]);
  const spoilerEnabled = Boolean(options.spoiler);
  const roofRackEnabled = Boolean(options.roofRack);

  return (
    <div
      {...rest}
      data-testid={
        ((rest as Record<string, unknown>)["data-testid"] as string | undefined) ?? "scene-canvas"
      }
      data-fps={fps}
      data-option-spoiler={spoilerEnabled}
      data-option-roof-rack={roofRackEnabled}
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
        <SceneBackground color={backgroundColor} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 2]} intensity={0.6} />
        <mesh position={[0, 0, 0]} data-testid="vehicle-body">
          <boxGeometry args={[1, 0.6, 2]} />
          <meshStandardMaterial color={productColor} metalness={0.2} roughness={0.6} />
        </mesh>
        {spoilerEnabled && <SpoilerAttachment />}
        {roofRackEnabled && <RoofRackAttachment />}
        <ViewerOrbitControls />
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

function ViewerOrbitControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controlsRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

function SceneBackground({ color }: { color: string }) {
  return <color attach="background" args={[color]} />;
}

function SpoilerAttachment() {
  return (
    <mesh position={[0, 0.45, -0.9]} data-testid="spoiler-attachment">
      <boxGeometry args={[0.9, 0.05, 0.4]} />
      <meshStandardMaterial color="#1f2937" metalness={0.15} roughness={0.4} />
    </mesh>
  );
}

function RoofRackAttachment() {
  return (
    <group data-testid="roofrack-attachment">
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.1, 0.08, 1.4]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.3, 0.05, 1.45]} />
        <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.35} />
      </mesh>
    </group>
  );
}
