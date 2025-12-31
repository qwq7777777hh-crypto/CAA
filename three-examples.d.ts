
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
    clearColor: Color;
    renderTargetsHorizontal: any[];
    renderTargetsVertical: any[];
    nMips: number;
    renderTargetBright: any;
    highPassUniforms: object;
    materialHighPassFilter: any;
    compositeMaterial: any;
    bloomTintColors: Vector2[];
    copyUniforms: object;
    materialCopy: any;
    oldClearColor: Color;
    oldClearAlpha: number;
    basic: any;
    dispose(): void;
    enabled: boolean;
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
