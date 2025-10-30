import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

vi.mock('@react-three/fiber', () => {
  return {
    Canvas: ({ onCreated, ...props }: { onCreated?: (state: { scene: { background: unknown } }) => void }) => {
      if (onCreated) {
        onCreated({ scene: { background: null } });
      }
      return React.createElement('div', { ...props, 'data-mock': 'r3f-canvas' });
    },
    useFrame: (cb?: () => void) => {
      cb?.();
    },
    extend: () => {},
    useThree: () => ({
      size: { width: 800, height: 600 },
      camera: { position: { set: () => {} } },
      scene: { background: null },
      gl: {
        domElement: {
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      },
    }),
  };
});

vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: class {
    enableDamping = false;
    dampingFactor = 0;
    target = { set: () => {} };
    constructor() {}
    update() {}
    dispose() {}
  },
}));

declare global {
  var __TEST_SEARCH__: string | undefined;
}

vi.mock('next/navigation', () => {
  return {
    useSearchParams: () => {
      const rawSearch =
        typeof window !== 'undefined' && window.location ? window.location.search : '';
      const override = globalThis.__TEST_SEARCH__;
      const searchValue = override ?? rawSearch;
      const formatted =
        !searchValue || searchValue.startsWith('?') ? searchValue : `?${searchValue}`;
      const params = new URLSearchParams(formatted);
      return {
        get: (key: string) => params.get(key),
      } as unknown as URLSearchParams;
    },
  };
});

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>, options?: { loading?: React.ComponentType }) => {
    return function DynamicComponent(props: React.ComponentPropsWithoutRef<'div'>) {
      const [Loaded, setLoaded] = React.useState<React.ComponentType | null>(null);

      React.useEffect(() => {
        let mounted = true;
        loader().then((module) => {
          if (mounted) {
            setLoaded(() => module.default ?? module);
          }
        });
        return () => {
          mounted = false;
        };
      }, []);

      if (Loaded) {
        return React.createElement(Loaded, props);
      }
      const Fallback = options?.loading ?? (() => null);
      return React.createElement(Fallback, props);
    };
  },
}));

if (typeof window !== 'undefined') {
  const mockCanvas = HTMLCanvasElement.prototype;
  if (!mockCanvas.getContext) {
    const getContext = ((contextId: string) => {
      if (contextId === '2d') {
        return {
          fillRect: () => {},
          clearRect: () => {},
          getImageData: () => ({ data: [] }),
          putImageData: () => {},
          createImageData: () => ({ data: [] }),
          setTransform: () => {},
          drawImage: () => {},
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          stroke: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          arc: () => {},
          fill: () => {},
          measureText: () => ({ width: 0 }),
          resetTransform: () => {},
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    }) as unknown as typeof mockCanvas.getContext;
    mockCanvas.getContext = getContext;
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  }
}

const suppressedPatterns = [
  /The tag <ambientLight>/i,
  /<ambientLight \/> is using incorrect casing/i,
  /The tag <directionalLight>/i,
  /<directionalLight \/> is using incorrect casing/i,
  /The tag <color>/i,
  /<color \/> is using incorrect casing/i,
  /The tag <boxGeometry>/i,
  /<boxGeometry \/> is using incorrect casing/i,
  /The tag <meshStandardMaterial>/i,
  /<meshStandardMaterial \/> is using incorrect casing/i,
  /The tag <mesh>/i,
];

const originalError = console.error;
console.error = (...args: unknown[]) => {
  const shouldSuppress = args.some(
    (arg) => typeof arg === 'string' && suppressedPatterns.some((pattern) => pattern.test(arg))
  );
  if (shouldSuppress) {
    return;
  }
  originalError(...args);
};

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const shouldSuppress = args.some(
    (arg) => typeof arg === 'string' && suppressedPatterns.some((pattern) => pattern.test(arg))
  );
  if (shouldSuppress) {
    return;
  }
  originalWarn(...args);
};
