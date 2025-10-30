import { useSyncExternalStore } from "react";

let isRunning = false;
let frames = 0;
let fpsValue = 60;
const subscribers = new Set<() => void>();

const getNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const hasRAF =
  typeof window !== "undefined" && typeof window.requestAnimationFrame === "function";

let rafId: number | null = null;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let lastTime = getNow();

function scheduleTick() {
  if (hasRAF) {
    rafId = window.requestAnimationFrame(tick);
  } else {
    timeoutId = setTimeout(() => tick(getNow()), 1000 / 60);
  }
}

function tick(now: number) {
  frames += 1;
  const delta = now - lastTime;
  if (delta >= 1000) {
    fpsValue = Math.round((frames * 1000) / Math.max(delta, 1));
    frames = 0;
    lastTime = now;
    subscribers.forEach((cb) => cb());
  }
  scheduleTick();
}

export function ensureFpsSampler() {
  if (isRunning) return;
  if (!hasRAF && typeof setTimeout !== "function") {
    return;
  }
  isRunning = true;
  frames = 0;
  lastTime = getNow();
  scheduleTick();
}

export function stopFpsSampler() {
  if (!isRunning) return;
  if (rafId !== null && hasRAF) {
    window.cancelAnimationFrame(rafId);
  }
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }
  rafId = null;
  timeoutId = null;
  isRunning = false;
}

function subscribe(callback: () => void) {
  ensureFpsSampler();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stopFpsSampler();
    }
  };
}

const getSnapshot = () => fpsValue;

export function useFps(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function isFpsWarning(): boolean {
  return fpsValue < 60;
}

export function useFpsStatus(threshold = 60): { fps: number; warning: boolean } {
  const fps = useFps();
  return { fps, warning: fps < threshold };
}
