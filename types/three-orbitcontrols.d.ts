declare module "three/examples/jsm/controls/OrbitControls" {
  import type { Camera, EventDispatcher, Vector3 } from "three";

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | undefined;
    enableDamping: boolean;
    dampingFactor: number;
    target: Vector3;
    update(): void;
    dispose(): void;
  }
}
