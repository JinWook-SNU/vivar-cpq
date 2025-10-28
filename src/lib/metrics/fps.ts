import { useSyncExternalStore } from "react";

let isRunning = false;
let lastTime = performance.now();
let frames = 0;
let fpsValue = 60;
const subscribers = new Set<() => void>();

function tick(now: number) {
  frames += 1;
  const delta = now - lastTime;
  if (delta >= 1000) {
    fpsValue = Math.round((frames * 1000) / delta);
    frames = 0;
    lastTime = now;
    subscribers.forEach((cb) => cb());
  }
  requestAnimationFrame(tick);
}

export function ensureFpsSampler() {
  if (!isRunning) {
    isRunning = true;
    lastTime = performance.now();
    frames = 0;
    requestAnimationFrame(tick);
  }
}

function subscribe(callback: () => void) {
  ensureFpsSampler();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

const getSnapshot = () => fpsValue;

export function useFps(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function isFpsWarning(): boolean {
  return fpsValue < 60;
}
