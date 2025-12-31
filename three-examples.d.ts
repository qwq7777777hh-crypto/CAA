
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | Document;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableKeys: boolean;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
    touches: { ONE: TOUCH; TWO: TOUCH };
    update(): boolean;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
  }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer' {
  import { WebGLRenderer, WebGLRenderTarget } from 'three';
  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
    renderer: WebGLRenderer;
    renderTarget1: WebGLRenderTarget;
    renderTarget2: WebGLRenderTarget;
    writeBuffer: WebGLRenderTarget;
    readBuffer: WebGLRenderTarget;
    renderToScreen: boolean;
    passes: any[];
    addPass(pass: any): void;
    insertPass(pass: any, index: number): void;
    removePass(pass: any): void;
    render(deltaTime?: number): void;
    reset(renderTarget?: WebGLRenderTarget): void;
    setSize(width: number, height: number): void;
    setPixelRatio(pixelRatio: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
  import { Scene, Camera, Material, Color } from 'three';
  export class RenderPass {
    constructor(scene: Scene, camera: Camera, overrideMaterial?: Material, clearColor?: Color, clearAlpha?: number);
    scene: Scene;
    camera: Camera;
    overrideMaterial: Material | undefined;
    clearColor: Color | undefined;
    clearAlpha: number | undefined;
    clear: boolean;
    clearDepth: boolean;
    enabled: boolean;
    setSize(width: number, height: number): void;
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any): void;
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
  import { Vector2, Color } from 'three';
  export class UnrealBloomPass {
    constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
    resolution: Vector2;
    strength: number;
    radius: number;
    threshold: number;
    enabled: boolean;
    setSize(width: number, height: number): void;
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any): void;
  }
}

declare module 'three/examples/jsm/postprocessing/ShaderPass' {
  import { ShaderMaterial } from 'three';
  export class ShaderPass {
    constructor(shader: any, textureID?: string);
    uniforms: { [key: string]: { value: any } };
    material: ShaderMaterial;
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;
    renderToScreen: boolean;
    setSize(width: number, height: number): void;
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any): void;
  }
}

declare module 'three/examples/jsm/postprocessing/AfterimagePass' {
  export class AfterimagePass {
    constructor(damp?: number);
    uniforms: {
      damp: { value: number };
      textureOld: { value: any };
    };
    enabled: boolean;
    setSize(width: number, height: number): void;
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any): void;
  }
}
