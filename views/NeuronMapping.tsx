
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useGeneData } from '../context/GeneContext';
import { AppView } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import ViewManual, { ManualItem } from '../components/ViewManual';
import { Database, Cpu } from 'lucide-react';

// --- PHYSICS CONSTANTS ---
const MAX_PARTICLES = 60000; // Balance between density and CPU performance
const MIN_RADIUS = 2.5;      // Pauli Repulsion Radius
const MAX_RADIUS = 14.0;     // Synaptic Gravity / Social Radius
const CELL_SIZE = MAX_RADIUS;
const GROWTH_STEP = 6.0;

const NEURON_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "LOGIC",
    title: "意识的物理学 | PHYSICS OF CONSCIOUSNESS",
    subtitle: "OPERATIONAL_LOGIC",
    content: "这不仅是模拟，这是对思维诞生的微观复现。数万个神经元粒子在三维流形中悬浮，它们不再是静态的数据点，而是渴望连接的“原生思想”。\n\n每一个粒子都遵循着严苛的物理法则，在引力与斥力的博弈中寻找存在的意义，正如大脑皮层发育时的混沌初开。",
    meta: "SIM_TYPE: N-BODY",
    code: "0xNEURO_PHYSICS"
  },
  {
    id: "MAPPING",
    title: "数据折叠协议 | DATA FOLDING PROTOCOL",
    subtitle: "LINEAR_TO_SPATIAL",
    content: "粒子如何在虚空中定位？系统采用‘生长游走者’(Growth Walker) 算法，将您输入的线性文本/二进制流转化为三维几何指令。\n\n每一个比特 (0/1) 都在微观层面决定了生长向量的旋转与推进。如同蛋白质折叠，一维的信息流在三维空间中卷曲、延伸，最终‘涌现’出独一无二的拓扑结构。这不仅是映射，更是信息在几何维度的具象化投影。",
    meta: "METHOD: VECTOR_FOLD",
    code: "0xBINARY_TRAJECTORY"
  },
  {
    id: "RULES",
    title: "突触竞争协议 | SYNAPTIC COMPETITION",
    subtitle: "CORE_REGULATIONS",
    content: "宇宙的秩序诞生于两股对抗力量：\n1. 泡利斥力 (Pauli Repulsion)：守护着个体的物理边界，防止坍缩。\n2. 突触引力 (Synaptic Gravity)：驱使孤独的灵魂相互吸引，结成星团。\n只有那些在拥挤中找到适度平衡 (Halo Evolution) 的节点，才能被点亮为持久的记忆。",
    meta: "FORCE: DUALITY",
    code: "0xFORCE_FIELD"
  },
  {
    id: "VISUALS",
    title: "光能光谱语义 | LUMINESCENCE SEMANTICS",
    subtitle: "STATE_VISUALIZATION",
    content: "演化过程中，粒子的亮度与色相直接映射其‘生命能级’(Life Energy)：\n1. 青色/高亮 (Cyan/Bright)：代表拥有 3-6 个邻居的稳态节点。这是‘涌现’的核心，象征着逻辑的自洽与强连接。\n2. 紫色/暗淡 (Purple/Dim)：代表孤立或过度拥挤的濒死节点。它们是冗余的噪点，终将被熵增吞噬。\n\n观察光流的明暗交替，即是观察思维在神经网络中的优胜劣汰。",
    meta: "DISPLAY: ENERGY_MAP",
    code: "0xCOLOR_RAMP"
  },
  {
    id: "ARCH",
    title: "空间分割算法 | SPATIAL PARTITIONING",
    subtitle: "SYSTEM_ARCHITECTURE",
    content: "为了驾驭海量粒子间指数级的相互作用，我们部署了空间分割算法。它将连续的认知空间离散化，确保每个神经元只需关注“邻人”的低语。这种线性复杂度的优化，让我们得以窥见大脑皮层发育时那令人屏息的算力风暴。",
    meta: "ALGO: SPATIAL_HASH",
    code: "0xGRID_OPTIMIZE"
  },
  {
    id: "EMERGENCE",
    title: "心智拓扑学 | TOPOLOGY OF MIND",
    subtitle: "DATA_TO_MIND",
    content: "当足够多的离散意志遵循简单的物理规则共舞时，宏观层面便涌现出了令人敬畏的拓扑结构。这些错综复杂的连接并非预先设计，而是自发编织的“灵魂图谱”。\n\n它昭示着：意识并非栖息于单个神经元，而是诞生于连接的虚空之中。",
    meta: "RESULT: COGNITION",
    code: "0xCONNECTOME"
  }
];

// --- SPATIAL HASH GRID (Optimization for O(N) neighbor lookup) ---
class SpatialHash {
  cells: Map<string, number[]>;
  cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  key(x: number, y: number, z: number) {
    const ix = Math.floor(x / this.cellSize);
    const iy = Math.floor(y / this.cellSize);
    const iz = Math.floor(z / this.cellSize);
    return `${ix},${iy},${iz}`;
  }

  clear() {
    this.cells.clear();
  }

  add(x: number, y: number, z: number, index: number) {
    const k = this.key(x, y, z);
    if (!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k)!.push(index);
  }

  // Get potential neighbors from adjacent cells
  getNearby(x: number, y: number, z: number) {
    const indices: number[] = [];
    const ix = Math.floor(x / this.cellSize);
    const iy = Math.floor(y / this.cellSize);
    const iz = Math.floor(z / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const k = `${ix + dx},${iy + dy},${iz + dz}`;
          const cell = this.cells.get(k);
          if (cell) {
            for (let i = 0; i < cell.length; i++) indices.push(cell[i]);
          }
        }
      }
    }
    return indices;
  }
}

// --- SHADER MATERIALS ---
const neuralShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorHigh: { value: new THREE.Color(0x22d3ee) }, // Cyan
    uColorLow: { value: new THREE.Color(0x581c87) },  // Deep Purple
  },
  vertexShader: `
    attribute float life;
    attribute float size;
    varying float vLife;
    varying float vDist;
    uniform float uTime;

    void main() {
      vLife = life;
      vec3 pos = position;
      
      // Subtle breathing animation for all particles
      float breath = sin(uTime * 2.0 + pos.x * 0.05) * 0.1;
      pos += normal * breath;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuates with distance
      // FIX: Decoupled size from 'life' to ensure visibility. 
      // Now size is stable, only opacity/color indicates life.
      float distSize = 800.0 / -mvPosition.z;
      
      // Stabilized size calculation
      float rawSize = size * distSize;
      
      // Clamp minimum size to 4.0 to prevent tiny specs
      gl_PointSize = clamp(rawSize, 4.0, 80.0);
      
      vDist = -mvPosition.z;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorHigh;
    uniform vec3 uColorLow;
    varying float vLife;
    
    void main() {
      // Circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Halo effect
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 1.5);

      // Color based on life energy
      vec3 color = mix(uColorLow, uColorHigh, vLife);
      
      // High energy core
      if (dist < 0.15 && vLife > 0.8) color += 0.4;

      // Alpha is still controlled by life, but base visibility is maintained
      float alpha = strength * (0.4 + 0.6 * vLife);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

const NeuronMapping: React.FC = () => {
  const { entries, thoughtEntries, setView } = useGeneData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ count: 0, stable: false });
  const [isLifeActive, setIsLifeActive] = useState(false);
  const [currentData, setCurrentData] = useState<{text: string, binary: string} | null>(null);
  const [currentMappedId, setCurrentMappedId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [dataSource, setDataSource] = useState<'DNA' | 'THOUGHT'>('DNA');

  // Ref to track active state inside animation loop without stale closures
  const isLifeActiveRef = useRef(false);

  useEffect(() => {
    isLifeActiveRef.current = isLifeActive;
  }, [isLifeActive]);

  const mountRef = useRef<HTMLDivElement>(null);
  
  // Normalized entry handling
  const activeList = useMemo(() => {
      return dataSource === 'DNA' ? entries : thoughtEntries;
  }, [dataSource, entries, thoughtEntries]);

  const selectedEntryRaw = useMemo(() => {
      return entries.find(e => e.id === selectedId) || thoughtEntries.find(e => e.id === selectedId);
  }, [selectedId, entries, thoughtEntries]);

  const currentMappedEntry = useMemo(() => {
      return entries.find(e => e.id === currentMappedId) || thoughtEntries.find(e => e.id === currentMappedId);
  }, [currentMappedId, entries, thoughtEntries]);

  // Normalization helpers
  const getEntryLabel = (entry: any) => dataSource === 'DNA' ? entry.originalText : entry.question;
  const getEntryBinary = (entry: any) => dataSource === 'DNA' ? entry.binaryStream : entry.responseBinary;

  // --- PHYSICS ENGINE REFS ---
  const sysRef = useRef({
    positions: new Float32Array(MAX_PARTICLES * 3),
    velocities: new Float32Array(MAX_PARTICLES * 3),
    life: new Float32Array(MAX_PARTICLES), // 0.0 - 1.0
    sizes: new Float32Array(MAX_PARTICLES),
    activeCount: 0,
    spatialHash: new SpatialHash(CELL_SIZE)
  });

  const sceneRef = useRef<{
    geometry: THREE.BufferGeometry,
    material: THREE.ShaderMaterial
  } | null>(null);

  // --- CORE EVOLUTION LOGIC ---
  const evolve = (dt: number) => {
    // Only run physics evolution if Life is Active (check Ref not State)
    if (!isLifeActiveRef.current) return;

    const sys = sysRef.current;
    const { positions, velocities, life, activeCount, spatialHash } = sys;
    
    // 1. Rebuild Spatial Hash
    spatialHash.clear();
    for (let i = 0; i < activeCount; i++) {
      if (life[i] > 0) {
        spatialHash.add(positions[i*3], positions[i*3+1], positions[i*3+2], i);
      }
    }

    let stabilityAccumulator = 0;

    // 2. Particle Update Loop
    for (let i = 0; i < activeCount; i++) {
      if (life[i] <= 0) continue;

      const px = positions[i*3];
      const py = positions[i*3+1];
      const pz = positions[i*3+2];

      const neighbors = spatialHash.getNearby(px, py, pz);
      
      let forceX = 0, forceY = 0, forceZ = 0;
      let haloNeighbors = 0; // Neighbors in [MIN_RADIUS, MAX_RADIUS]

      for (let j of neighbors) {
        if (i === j) continue;
        const dx = px - positions[j*3];
        const dy = py - positions[j*3+1];
        const dz = pz - positions[j*3+2];
        const distSq = dx*dx + dy*dy + dz*dz;

        if (distSq < 0.001) continue; // Avoid singularity

        const dist = Math.sqrt(distSq);

        // FORCE 1: Pauli Repulsion (Strong short range)
        if (dist < MIN_RADIUS) {
          const strength = (MIN_RADIUS - dist) / MIN_RADIUS; // 0 to 1
          const repulse = strength * 80.0 * dt; // Strong Push
          forceX += (dx / dist) * repulse;
          forceY += (dy / dist) * repulse;
          forceZ += (dz / dist) * repulse;
        } 
        // FORCE 2: Synaptic Gravity (Weak medium range attraction)
        else if (dist < MAX_RADIUS) {
          haloNeighbors++;
          const attract = 0.5 * dt;
          forceX -= (dx / dist) * attract;
          forceY -= (dy / dist) * attract;
          forceZ -= (dz / dist) * attract;
        }
      }

      // Apply Forces
      velocities[i*3]   += forceX;
      velocities[i*3+1] += forceY;
      velocities[i*3+2] += forceZ;

      // Friction
      velocities[i*3]   *= 0.92;
      velocities[i*3+1] *= 0.92;
      velocities[i*3+2] *= 0.92;

      // Move
      positions[i*3]   += velocities[i*3];
      positions[i*3+1] += velocities[i*3+1];
      positions[i*3+2] += velocities[i*3+2];

      // RULE 3: Halo Evolution (Life/Death)
      // Survival Zone: 4-5 neighbors
      if (haloNeighbors >= 3 && haloNeighbors <= 6) {
        life[i] = Math.min(1.0, life[i] + dt * 0.5); // Heal
        stabilityAccumulator++;
      } else {
        life[i] = Math.max(0.0, life[i] - dt * 0.2); // Decay
      }
    }

    setStats(s => ({ 
      count: activeCount, 
      stable: activeCount > 0 && (stabilityAccumulator / activeCount) > 0.6 
    }));
  };

  // --- HELPER: RESET SYSTEM ---
  const resetSystem = () => {
    const sys = sysRef.current;
    sys.activeCount = 0;
    sys.spatialHash.clear();
    sys.life.fill(0);
    // Also clear positions visually for immediate feedback if needed, 
    // though activeCount handles the render loop range.
  };

  // --- DATA INJECTION (GROWTH WALKER) ---
  const injectData = useCallback((text: string, binary: string, clear: boolean = false) => {
    if (clear) resetSystem();

    const sys = sysRef.current;
    if (sys.activeCount >= MAX_PARTICLES) return;

    // Use string hash to determine spawn point (deterministic)
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed += text.charCodeAt(i);
    
    // Starting Point
    let cx = (Math.sin(seed) * 200);
    let cy = (Math.cos(seed * 0.5) * 200);
    let cz = (Math.sin(seed * 0.8) * 200);

    const dir = new THREE.Vector3(1, 0, 0);
    const axis = new THREE.Vector3(0, 1, 0);
    
    // Walker Logic
    for (let i = 0; i < binary.length; i++) {
      if (sys.activeCount >= MAX_PARTICLES) break;

      const bit = binary[i];
      
      // Determine rotation based on DNA 3x3 matrix simulation
      const angle = (parseInt(bit) === 1 ? 0.8 : -0.8) + (Math.random() * 0.4 - 0.2);
      axis.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
      dir.applyAxisAngle(axis, angle);

      // Nonlinear Movement (Organic Tanh)
      const moveX = Math.tanh(dir.x) * GROWTH_STEP;
      const moveY = Math.tanh(dir.y) * GROWTH_STEP;
      const moveZ = Math.tanh(dir.z) * GROWTH_STEP;

      // Tentative Position
      const tx = cx + moveX;
      const ty = cy + moveY;
      const tz = cz + moveZ;

      // Constraint Check: Is space occupied?
      const neighbors = sys.spatialHash.getNearby(tx, ty, tz);
      let collided = false;
      for (let nIdx of neighbors) {
        const dx = tx - sys.positions[nIdx*3];
        const dy = ty - sys.positions[nIdx*3+1];
        const dz = tz - sys.positions[nIdx*3+2];
        if (dx*dx + dy*dy + dz*dz < MIN_RADIUS * MIN_RADIUS) {
          collided = true;
          break;
        }
      }

      if (!collided) {
        // Spawn Particle
        const idx = sys.activeCount;
        sys.positions[idx*3] = tx;
        sys.positions[idx*3+1] = ty;
        sys.positions[idx*3+2] = tz;
        sys.life[idx] = 1.0;
        
        // VISUAL FIX: SIGNIFICANTLY INCREASED BASE SIZE
        // Ensure all particles are substantial and visible
        sys.sizes[idx] = 6.0 + Math.random() * 2.0; 
        
        sys.velocities[idx*3] = 0; // Start static
        sys.velocities[idx*3+1] = 0;
        sys.velocities[idx*3+2] = 0;
        
        sys.spatialHash.add(tx, ty, tz, idx);
        sys.activeCount++;

        // Update walker head
        cx = tx; cy = ty; cz = tz;
      } else {
        // If collided, try to rotate direction sharply and continue (branching)
        dir.applyAxisAngle(new THREE.Vector3(0,1,0), Math.PI/2);
      }
    }
    
    // Update stats immediately after injection
    setStats(s => ({ ...s, count: sys.activeCount }));
  }, []);

  // --- THREE.JS SCENE SETUP ---
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030303);
    scene.fog = new THREE.FogExp2(0x030303, 0.001);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 4000);
    camera.position.set(0, 100, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Post Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;

    // Particle System Geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(sysRef.current.positions, 3));
    geometry.setAttribute('life', new THREE.BufferAttribute(sysRef.current.life, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sysRef.current.sizes, 1));

    const material = new THREE.ShaderMaterial({
      ...neuralShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    sceneRef.current = { geometry, material };

    // RESTORED: Initial Seed (Auto-injection on mount)
    if (entries.length > 0) {
        const first = entries[0];
        injectData(first.originalText, first.binaryStream, true);
        setCurrentData({ text: first.originalText, binary: first.binaryStream });
        setCurrentMappedId(first.id);
        setSelectedId(first.id);
    } else {
        injectData("GENESIS_ORIGIN", "010101010101", true);
    }

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      const dt = Math.min(clock.getDelta(), 0.1);
      material.uniforms.uTime.value = clock.getElapsedTime();

      // Run Physics
      evolve(dt);

      // Update Geometry
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.life.needsUpdate = true;
      
      // Limit draw range to active particles
      geometry.setDrawRange(0, sysRef.current.activeCount);

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
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // Run once on mount

  // --- UI INTERACTION HANDLERS ---
  const handleSelect = (entry: any) => {
    playMechKey();
    setSelectedId(entry.id);
  };

  const handleMapAndClose = (entry: any) => {
    playHighTechButton();
    // 1. Stop existing life sim if active
    setIsLifeActive(false);
    
    // 2. Inject new data
    const label = getEntryLabel(entry);
    const binary = getEntryBinary(entry);
    
    injectData(label, binary, true);
    setCurrentData({ text: label, binary: binary });
    setCurrentMappedId(entry.id);
    
    // 3. Close Sidebar
    setIsSidebarOpen(false);
    setSelectedId(null);
  };

  const toggleSidebar = () => {
    playHighTechButton();
    // Do NOT auto-select on open, just toggle state
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBackdropClick = () => {
    if (isSidebarOpen) {
      playMechKey();
      setIsSidebarOpen(false);
      setSelectedId(null);
    }
  };

  const handleLifeToggle = () => {
    playHighTechButton();
    if (isLifeActive) {
      // STOP & RESET
      setIsLifeActive(false);
      if (currentData) {
        injectData(currentData.text, currentData.binary, true);
      } else if (entries.length > 0) {
        // Fallback
        const first = entries[0];
        injectData(first.originalText, first.binaryStream, true);
      }
    } else {
      // START EVOLUTION
      setIsLifeActive(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#030303] text-cyan-500 font-mono overflow-hidden select-none">
      
      {/* --- 3D Scene Container --- */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* --- Overlay UI: Return Button --- */}
      <button 
        onClick={() => { playMechKey(); setView(AppView.DATABASE); }}
        className="absolute top-8 right-8 z-50 text-[10px] font-bold tracking-[0.2em] border border-cyan-900/40 px-6 py-3 hover:bg-cyan-900/20 hover:text-cyan-300 transition-all uppercase group backdrop-blur-sm bg-black/30"
      >
        <span className="group-hover:opacity-100 opacity-60 transition-opacity">[ RETURN_ROOT ]</span>
      </button>

      {/* --- Help Button --- */}
      <button 
        onClick={() => { playMechKey(); setShowHelp(true); }}
        className="absolute top-8 right-64 z-50 w-10 h-10 rounded-full border border-cyan-500/40 text-cyan-400 flex items-center justify-center hover:bg-cyan-500/20 hover:text-white transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] bg-black/30 backdrop-blur-sm"
      >
        <span className="text-lg font-bold">?</span>
      </button>

      {/* --- LIFE BUTTON --- */}
      <div className="absolute bottom-12 right-8 z-50 pointer-events-auto">
        <button 
          onClick={handleLifeToggle}
          disabled={!currentMappedId && !isLifeActive} // Disable start if no data
          className={`flex items-center justify-center space-x-3 px-8 py-3 border-2 transition-all duration-300 group
            ${isLifeActive 
              ? 'border-red-500 bg-red-900/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
              : 'border-cyan-500 bg-cyan-900/20 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className={`w-2 h-2 rounded-full ${isLifeActive ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`} />
          <span className={`text-[12px] font-black tracking-[0.4em] uppercase ${isLifeActive ? 'text-red-400' : 'text-cyan-300 group-hover:text-white'}`}>
            {isLifeActive ? 'STOP_LIFE' : 'INIT_LIFE'}
          </span>
        </button>
      </div>

      {/* --- Sidebar Backdrop (Click outside to close) --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 z-30 bg-black/20 backdrop-blur-[2px] cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* --- Hidden Data Bar (Sidebar) --- */}
      <motion.div 
        className="absolute top-0 left-0 bottom-10 z-40 bg-[#050505]/90 backdrop-blur-md border-r border-cyan-900/20 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
        initial={{ width: 60 }}
        animate={{ width: isSidebarOpen ? 320 : 60 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        {/* Toggle Trigger */}
        <button 
          onClick={toggleSidebar}
          className="h-16 w-full flex flex-col items-center justify-center border-b border-cyan-900/20 hover:bg-cyan-900/10 transition-colors shrink-0 group"
        >
          <div className="w-5 flex flex-col space-y-1.5 items-center">
            <span className={`w-full h-[1px] bg-cyan-600 transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-2' : 'group-hover:w-3'}`} />
            <span className={`w-full h-[1px] bg-cyan-600 transition-all duration-300 ${isSidebarOpen ? 'opacity-0' : ''}`} />
            <span className={`w-full h-[1px] bg-cyan-600 transition-all duration-300 ${isSidebarOpen ? '-rotate-45 -translate-y-2' : 'group-hover:w-3'}`} />
          </div>
        </button>

        {/* Source Switcher Header (Visible when Open) */}
        {isSidebarOpen && (
            <div className="grid grid-cols-2 text-[8px] font-bold uppercase tracking-widest border-b border-cyan-900/30 shrink-0">
                <button 
                    onClick={() => { playMechKey(); setDataSource('DNA'); }}
                    className={`py-3 flex items-center justify-center space-x-1 transition-all ${dataSource === 'DNA' ? 'bg-cyan-900/40 text-white' : 'bg-black/40 text-cyan-700 hover:text-cyan-400'}`}
                >
                    <Database size={10} />
                    <span>DNA</span>
                </button>
                <button 
                    onClick={() => { playMechKey(); setDataSource('THOUGHT'); }}
                    className={`py-3 flex items-center justify-center space-x-1 transition-all ${dataSource === 'THOUGHT' ? 'bg-purple-900/40 text-purple-200' : 'bg-black/40 text-purple-700 hover:text-purple-400'}`}
                >
                    <Cpu size={10} />
                    <span>MIND</span>
                </button>
            </div>
        )}

        {/* Data List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-thin-scrollbar">
          {activeList.length === 0 ? (
             <div className="h-full flex items-center justify-center text-[8px] text-cyan-900 vertical-text opacity-50">
                {isSidebarOpen ? 'NO_DATA_STREAM' : 'EMPTY'}
             </div>
          ) : (
            activeList.map((entry) => {
              const isSelected = selectedId === entry.id;
              const label = getEntryLabel(entry);
              
              return (
                <div 
                  key={entry.id}
                  onClick={() => { if (isSidebarOpen) handleSelect(entry); }}
                  className={`
                    relative transition-all border-l-[3px] py-4 overflow-hidden group/item
                    ${isSidebarOpen ? 'cursor-pointer' : 'cursor-default'}
                    ${isSelected 
                      ? 'bg-cyan-900/20 border-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)]' 
                      : 'hover:bg-cyan-900/5 border-transparent hover:border-cyan-900/30'
                    }
                    ${isSidebarOpen ? 'px-6' : 'px-0 flex justify-center'}
                  `}
                >
                  {/* Selected Scanning Effect */}
                  {isSelected && (
                    <motion.div 
                      layoutId="active-scan"
                      className="absolute inset-0 pointer-events-none bg-gradient-to-r from-cyan-500/10 to-transparent"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    />
                  )}
                  {isSelected && (
                     <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                  )}

                  {isSidebarOpen ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                         <span className={`text-[9px] font-bold font-mono transition-colors ${isSelected ? 'text-cyan-300' : 'text-cyan-700'}`}>
                           {entry.timestamp}
                         </span>
                         {isSelected && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" />}
                      </div>
                      <div className={`text-[11px] truncate font-mono tracking-tight uppercase transition-colors ${isSelected ? 'text-white text-glow' : 'text-cyan-300/60 group-hover/item:text-cyan-300/90'}`}>
                        {label}
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isSelected ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] scale-125' : 'bg-cyan-900 group-hover/item:bg-cyan-700'}`} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* --- Detail View (Expands next to Sidebar) --- */}
      <AnimatePresence>
        {selectedEntryRaw && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 bottom-24 left-[340px] w-[450px] z-30 flex flex-col pointer-events-none"
          >
             <div className="pointer-events-auto h-full bg-[#080808]/95 border border-cyan-900/40 p-8 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-600 to-transparent" />
                
                <div className="flex justify-between items-start mb-8 shrink-0">
                   <div>
                      <h2 className="text-lg font-black uppercase tracking-[0.2em] text-cyan-100">Mapped_Node</h2>
                      <span className="text-[9px] text-cyan-700 font-bold tracking-[0.1em]">ID: {selectedEntryRaw.id}</span>
                   </div>
                   <button onClick={() => setSelectedId(null)} className="text-cyan-800 hover:text-cyan-400 transition-colors text-xl">×</button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-thin-scrollbar pr-4 space-y-8">
                   <div>
                      <div className="flex items-center space-x-2 mb-3 opacity-70">
                         <div className="w-1 h-1 bg-cyan-500" />
                         <span className="text-[8px] text-cyan-500 uppercase tracking-[0.2em] font-bold">Raw_Input</span>
                      </div>
                      <p className="text-sm text-cyan-50 leading-relaxed font-light whitespace-pre-wrap border-l-2 border-cyan-900/30 pl-4 py-1">
                        {getEntryLabel(selectedEntryRaw)}
                      </p>
                   </div>

                   <div>
                      <div className="flex items-center space-x-2 mb-3 opacity-70">
                         <div className="w-1 h-1 bg-cyan-500" />
                         <span className="text-[8px] text-cyan-500 uppercase tracking-[0.2em] font-bold">Binary_Translation</span>
                      </div>
                      <div className="bg-black border border-cyan-900/20 p-4 text-[10px] text-cyan-600/80 font-mono break-all leading-loose shadow-inner relative">
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_3px] opacity-50" />
                        {getEntryBinary(selectedEntryRaw)}
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-cyan-900/30 shrink-0">
                   <button 
                     onClick={() => handleMapAndClose(selectedEntryRaw)}
                     className="w-full group relative px-6 py-4 bg-cyan-900/20 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all overflow-hidden"
                   >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent translate-x-[-100%] group-hover:animate-[scan_1s_ease-in-out]" />
                      <span className="relative z-10 text-[11px] font-black text-cyan-300 tracking-[0.3em] uppercase group-hover:text-white group-hover:text-glow transition-colors">
                        [ INITIATE_NEURAL_MAPPING ]
                      </span>
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <ViewManual 
            title="NEURON MAPPING [神经元映射]"
            subtitle="PROTOCOL_MANUAL_v2.0"
            items={NEURON_MANUAL_ITEMS}
            theme="cyan"
            onClose={() => setShowHelp(false)}
          />
        )}
      </AnimatePresence>

      {/* --- Rolling Data Ticker --- */}
      {currentMappedEntry && (
        <div className="absolute bottom-0 left-0 w-full h-10 bg-[#020202] border-t border-cyan-900/20 flex items-center overflow-hidden z-50">
           <div className="w-full flex items-center overflow-hidden">
              <div className="animate-ticker-infinite flex whitespace-nowrap space-x-12 opacity-80 hover:opacity-100 transition-opacity">
                 {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                       <span className="text-[8px] text-cyan-800 font-bold uppercase tracking-widest">{currentMappedEntry.timestamp}</span>
                       <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider">[{getEntryLabel(currentMappedEntry)}]</span>
                       <span className="text-[9px] text-cyan-600/70 font-mono tracking-wider">
                          {getEntryBinary(currentMappedEntry)}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 2px; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.5); }
        
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-infinite {
          animation: ticker-scroll 60s linear infinite;
          display: flex;
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }
      `}</style>
    </div>
  );
};

export default NeuronMapping;
