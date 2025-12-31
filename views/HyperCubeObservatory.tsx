
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { useGeneData } from '../context/GeneContext';
import { AppView } from '../types';
import { playHighTechButton, playMechKey } from '../utils/audio';

// --- CONFIGURATION ---
const GRID_SIZE = 128;
const MAX_INSTANCES = 150000;
const SIM_SPEED_MS = 50;

// --- SHADERS ---
const VignetteShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "offset": { value: 1.0 },
    "darkness": { value: 1.2 } 
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform float offset;
    uniform float darkness;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D( tDiffuse, vUv );
      vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
      gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );
    }
  `
};

const generateFractalLattice = (size: number) => {
    const validIndices: number[] = [];
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            if ((y & z) !== 0) continue; 
            for (let x = 0; x < size; x++) {
                if ((x & y) === 0) {
                    const idx = x + y * size + z * size * size;
                    validIndices.push(idx);
                }
            }
        }
    }
    return new Int32Array(validIndices);
};

const getNeighborOffsets = (size: number) => {
    const offsets = [];
    for (let z = -1; z <= 1; z++) {
        for (let y = -1; y <= 1; y++) {
            for (let x = -1; x <= 1; x++) {
                if (x === 0 && y === 0 && z === 0) continue;
                offsets.push(x + y * size + z * size * size);
            }
        }
    }
    return new Int32Array(offsets);
};

const HyperCubeObservatory: React.FC = () => {
  const { entries, setView } = useGeneData();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stats, setStats] = useState({ count: 0, generation: 0, fps: 0 });

  const gridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE * GRID_SIZE));
  const nextGridRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE * GRID_SIZE));
  const ageRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE * GRID_SIZE));
  
  const latticeIndicesRef = useRef<Int32Array>(new Int32Array(0));
  const neighborOffsetsRef = useRef<Int32Array>(new Int32Array(0));
  
  const generationRef = useRef(0);
  const frameId = useRef(0);
  const lastSimTime = useRef(0);

  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
      latticeIndicesRef.current = generateFractalLattice(GRID_SIZE);
      neighborOffsetsRef.current = getNeighborOffsets(GRID_SIZE);
      gridRef.current.fill(0);
      ageRef.current.fill(0);
  }, []);

  useEffect(() => {
      if (latticeIndicesRef.current.length === 0) return;
      const lattice = latticeIndicesRef.current;
      const grid = gridRef.current;
      const age = ageRef.current;
      const binaryString = entries.map(e => e.binaryStream).join('');
      
      let ptr = 0;
      for (let i = 0; i < binaryString.length; i++) {
          if (ptr >= lattice.length) ptr = 0;
          const val = binaryString[i] === '1' ? 1 : 0;
          if (val === 1) {
              const idx = lattice[ptr];
              if (grid[idx] === 0) {
                  grid[idx] = 1;
                  age[idx] = 0;
              }
          }
          ptr++;
      }
      
      let active = 0;
      for(let i=0; i<lattice.length; i++) {
          if (grid[lattice[i]] === 1) active++;
      }
      setStats(prev => ({ ...prev, count: active }));
  }, [entries]);

  const evolve = () => {
      const lattice = latticeIndicesRef.current;
      const offsets = neighborOffsetsRef.current;
      const current = gridRef.current;
      const next = nextGridRef.current;
      const ages = ageRef.current;
      const size = GRID_SIZE;
      const totalSize = size * size * size;

      let activeCount = 0;
      for (let i = 0; i < lattice.length; i++) {
          const idx = lattice[i];
          let neighbors = 0;
          for (let j = 0; j < offsets.length; j++) {
              const nIdx = idx + offsets[j];
              if (nIdx >= 0 && nIdx < totalSize && current[nIdx] === 1) neighbors++;
          }

          const state = current[idx];
          let nextState = 0;
          if (state === 1) {
              if (neighbors === 4 || neighbors === 5) {
                  nextState = 1;
                  if (ages[idx] < 255) ages[idx]++;
              } else {
                  nextState = 0;
                  ages[idx] = 0; 
              }
          } else {
              if (neighbors === 4) {
                  nextState = 1;
                  ages[idx] = 0;
              }
          }
          next[idx] = nextState;
          if (nextState === 1) activeCount++;
      }

      const temp = gridRef.current;
      gridRef.current = nextGridRef.current;
      nextGridRef.current = temp;
      generationRef.current++;
      setStats(s => ({ ...s, count: activeCount, generation: generationRef.current }));
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.0025);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    camera.position.set(160, 160, 160); 

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x000000
    });

    const mesh = new THREE.InstancedMesh(geometry, material, MAX_INSTANCES);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3);
    scene.add(mesh);
    meshRef.current = mesh;

    scene.add(new THREE.AmbientLight(0x222222));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(100, 200, 50);
    scene.add(dirLight);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.5, 0.1);
    composer.addPass(bloomPass);
    composer.addPass(new ShaderPass(VignetteShader));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(64, 64, 64);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    // IMMERSIVE CONTROLS: No zoom, no pan to maintain infinite void illusion
    controls.enableZoom = false;
    controls.enablePan = false;

    const dummy = new THREE.Object3D();
    const _color = new THREE.Color();
    const clock = new THREE.Clock();

    const C_NEWBORN = new THREE.Color(0.0, 1.0, 1.0).multiplyScalar(5.0); 
    const C_STRUCTURE = new THREE.Color(0.1, 0.1, 0.12);

    const animate = () => {
        frameId.current = requestAnimationFrame(animate);
        const time = performance.now();
        if (isPlaying && time - lastSimTime.current > SIM_SPEED_MS) {
            evolve();
            lastSimTime.current = time;
        }

        if (meshRef.current) {
            let instanceIdx = 0;
            const lattice = latticeIndicesRef.current;
            const grid = gridRef.current;
            const ages = ageRef.current;
            const size = GRID_SIZE;
            for (let i = 0; i < lattice.length; i++) {
                const idx = lattice[i];
                if (grid[idx] === 1) {
                    if (instanceIdx >= MAX_INSTANCES) break;
                    const z = Math.floor(idx / (size * size));
                    const rem = idx % (size * size);
                    const y = Math.floor(rem / size);
                    const x = rem % size;
                    dummy.position.set(x, y, z);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(instanceIdx, dummy.matrix);
                    const age = ages[idx];
                    if (age <= 1) _color.copy(C_NEWBORN);
                    else _color.copy(C_STRUCTURE);
                    mesh.setColorAt(instanceIdx, _color);
                    instanceIdx++;
                }
            }
            mesh.count = instanceIdx;
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
        controls.update();
        composer.render();
    };
    animate();

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId.current);
        if (mountRef.current) mountRef.current.innerHTML = '';
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        composer.dispose();
    };
  }, [isPlaying]);

  const handleBack = () => {
     playMechKey();
     setView(AppView.DATABASE);
  };

  const handleReset = () => {
      playMechKey();
      setIsPlaying(false);
      gridRef.current.fill(0);
      ageRef.current.fill(0);
      setStats({ count: 0, generation: 0, fps: 0 });
      generationRef.current = 0;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden select-none font-mono">
       <div ref={mountRef} className="absolute inset-0 z-0" />
       <div className="absolute top-0 left-0 w-full p-6 flex justify-center z-20 pointer-events-none">
           <div className="relative bg-black/60 backdrop-blur-md border border-cyan-500/30 px-16 py-3 flex flex-col items-center clip-path-cyber">
               <h1 className="text-2xl font-black text-white tracking-[0.3em] uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] font-mono">FRACTAL_LATTICE</h1>
               <div className="flex space-x-3 mt-1 items-center">
                   <span className="w-8 h-[2px] bg-cyan-500/50" />
                   <span className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase">SIERPINSKI_CORE_V3</span>
                   <span className="w-8 h-[2px] bg-cyan-500/50" />
               </div>
           </div>
       </div>
       <button onClick={handleBack} className="absolute top-8 left-8 z-30 flex items-center space-x-3 text-cyan-500 hover:text-white transition-all group pointer-events-auto">
          <div className="w-10 h-10 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 group-hover:bg-cyan-500/20 bg-black/40 backdrop-blur-sm transition-all relative overflow-hidden">
             <div className="absolute inset-0 bg-cyan-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             <span className="text-xl relative z-10">↩</span>
          </div>
       </button>
       <div className="absolute bottom-32 left-0 w-full px-8 pointer-events-none z-10">
           <div className="flex justify-between items-end border-b border-cyan-500/20 pb-2">
               <div className="flex space-x-12">
                   <div className="flex flex-col">
                       <span className="text-cyan-700 text-[9px] font-bold tracking-widest mb-1">LATTICE_NODES</span>
                       <span className="text-cyan-300 text-2xl font-mono leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">{stats.count.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-cyan-700 text-[9px] font-bold tracking-widest mb-1">EVOLUTION_STEP</span>
                       <span className="text-white text-2xl font-mono leading-none">{stats.generation.toLocaleString()}</span>
                   </div>
               </div>
           </div>
       </div>
       <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center space-x-6 z-30 pointer-events-auto">
          <button onClick={() => { playHighTechButton(); setIsPlaying(true); }} className={`px-10 py-3 border border-cyan-500/50 ${isPlaying ? 'bg-cyan-500/20 text-white shadow-[0_0_25px_rgba(34,211,238,0.4)]' : 'text-cyan-400 hover:bg-cyan-500/10'} font-bold tracking-[0.2em] transition-all uppercase text-xs backdrop-blur-sm bg-black/80 font-mono clip-path-button`}>IGNITE_CORE</button>
          <button onClick={() => { playHighTechButton(); setIsPlaying(false); }} className={`px-10 py-3 border border-purple-500/50 ${!isPlaying ? 'bg-purple-500/20 text-white' : 'text-purple-400 hover:bg-purple-500/10'} font-bold tracking-[0.2em] transition-all uppercase text-xs backdrop-blur-sm bg-black/80 font-mono clip-path-button`}>STASIS</button>
          <button onClick={handleReset} className="px-8 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-white font-bold tracking-[0.2em] transition-all uppercase text-xs backdrop-blur-sm bg-black/80 font-mono">FLUSH</button>
       </div>
       <style>{`
         .clip-path-cyber { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
         .clip-path-button { clip-path: polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%); }
       `}</style>
    </div>
  );
};

export default HyperCubeObservatory;
