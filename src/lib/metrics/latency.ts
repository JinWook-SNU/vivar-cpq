import { useSyncExternalStore } from "react";

const samples: number[] = [];
const MAX_SAMPLES = 50;

const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

export function recordLatency(milliseconds: number) {
  if (Number.isFinite(milliseconds)) {
    samples.push(milliseconds);
    if (samples.length > MAX_SAMPLES) {
      samples.splice(0, samples.length - MAX_SAMPLES);
    }
    notify();
  }
}

export function resetLatencyMetrics() {
  samples.length = 0;
  notify();
}

export function subscribeLatency(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function useLatencyP95() {
  return useSyncExternalStore(subscribeLatency, getLatencyP95, getLatencyP95);
}

export function getLatencyP95(): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[index];
}

export function isLatencyWarning(): boolean {
  return getLatencyP95() > 500;
}
