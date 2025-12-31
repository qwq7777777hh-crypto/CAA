
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import ViewManual, { ManualItem } from '../components/ViewManual';
import { Database, Cpu } from 'lucide-react';

const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const PARTICLE_COUNT = IS_MOBILE ? 15000 : 300000; 
const MAX_NEURAL_POINTS = IS_MOBILE ? 5000 : 100000;
const NEURAL_R_MIN = 32.0; 

const LENIA_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "LOGIC",
    title: "流体生命的创世纪 | GENESIS OF FLUID LIFE",
    subtitle: "OPERATIONAL_LOGIC",
    content: "在这片数字以太中，我们摒弃了传统元胞自动机僵硬的网格束缚。粒子不再是离散的开关，而是流淌在连续时空中的能量波包。\n\n每一个光点都是携带“生命值”的半自主灵体，它们感知周围的能量场，依据非线性法则在虚空中演绎着从混沌到有序的创世之舞。",
    meta: "KERNEL: CONTINUOUS",
    code: "0xLENIA_FLOW"
  },
  {
    id: "RULES",
    title: "动力学演化法则 | EVOLUTIONARY DYNAMICS",
    subtitle: "MOTION_PROTOCOLS",
    content: "粒子运动遵循着严苛的非线性动力学方程，这是涌现的基础：\n\n1. 势能牵引 (Attraction)：模拟引力势井，驱动孤立粒子向高密度核心聚合，形成内聚的生命体。\n2. 拓扑排斥 (Repulsion)：在极近距离产生斥力，维持物质的体积感，防止奇点坍缩。\n3. 热力学扰动 (Turbulence)：引入微观随机性，模拟布朗运动，为僵死的结构注入变异的可能。",
    meta: "RULESET: PHYSICS_SIM",
    code: "0xFORCE_VECTORS"
  },
  {
    id: "ARCH",
    title: "空间哈希架构 | SPATIAL HASH ARCH",
    subtitle: "SYSTEM_ARCHITECTURE",
    content: "为了在凡人的浏览器中实时演算数十万灵体的因果纠缠，我们铸造了空间哈希网格 (Spatial Hash Grid)。它将浩渺的三维虚空划分为稀疏的计算单元，配合 GPU 的并行算力，让每一次位置更新都如同神谕般精准与迅捷，赋予了数据以太般的流动质感。",
    meta: "COMPUTE: GPU_ACCEL",
    code: "0xHASH_GRID"
  },
  {
    id: "EMERGENCE",
    title: "形态的自发涌现 | SPONTANEOUS EMERGENCE",
    subtitle: "CHAOS_TO_ORDER",
    content: "这是对“涌现”现象最直观的诠释：没有任何一行代码预设了神经束或细胞的形状，宏大的结构完全源于微观粒子间的简单互动。\n\n你输入的枯燥二进制代码 (DNA) 作为初始扰动，经过数千次迭代，自发坍缩为高度有序的复杂形态。这证明了：至繁归于至简，生命的复杂性仅仅是简单规则在时间维度上的积分。",
    meta: "STATUS: MANIFESTED",
    code: "0xMORPHOGENESIS"
  }
];

class SpatialHash {
  grid: Map<string, number[]>;
  cellSize: number;
  constructor(cellSize: number) { this.grid = new Map(); this.cellSize = cellSize; }
  key(x: number, y: number, z: number) { return `${(x / this.cellSize) | 0},${(y / this.cellSize) | 0},${(z / this.cellSize) | 0}`; }
  add(x: number, y: number, z: number, idx: number) {
    const k = this.key(x, y, z);
    let cell = this.grid.get(k);
    if (!cell) { cell = []; this.grid.set(k, cell); }
    cell.push(idx);
  }
  isOccupied(x: number, y: number, z: number, r: number, positions: Float32Array) {
    const rSq = r * r, gxMin = ((x - r) / this.cellSize) | 0, gxMax = ((x + r) / this.cellSize) | 0, gyMin = ((y - r) / this.cellSize) | 0, gyMax = ((y + r) / this.cellSize) | 0, gzMin = ((z - r) / this.cellSize) | 0, gzMax = ((z + r) / this.cellSize) | 0;
    for (let ix = gxMin; ix <= gxMax; ix++) {
      for (let iy = gyMin; iy <= gyMax; iy++) {
        for (let iz = gzMin; iz <= gzMax; iz++) {
          const k = `${ix},${iy},${iz}`, cell = this.grid.get(k);
          if (cell) {
            for (let i = 0; i < cell.length; i++) {
              const idx = cell[i], dx = x - positions[idx * 3], dy = y - positions[idx * 3 + 1], dz = z - positions[idx * 3 + 2];
              if (dx * dx + dy * dy + dz * dz < rSq) return true;
            }
          }
        }
      }
    }
    return false;
  }
}

const GenesisLenia: React.FC = () => {
  const { entries, thoughtEntries, setView } = useGeneData();
  const { user, incrementEvolution } = useAuth(); // 获取增长函数
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true); 
  const [isLifeActive, setIsLifeActive] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showParticles, setShowParticles] = useState(true); 
  const [stats, setStats] = useState({ nodes: 0, stability: 99.1, neuralCount: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [dataSource, setDataSource] = useState<'DNA' | 'THOUGHT'>('DNA');
  
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; composer: EffectComposer; controls: OrbitControlsImpl; particles: THREE.Points; neuralPoints: THREE.Points; } | null>(null);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const combinedBinary = useMemo(() => {
    return selectedIds.map(id => {
          const gene = entries.find(e => e.id === id);
          if (gene) return gene.binaryStream;
          const thought = thoughtEntries.find(e => e.id === id);
          if (thought) return thought.responseBinary;
          return '';
      }).join('');
  }, [selectedIds, entries, thoughtEntries]);

  const activeList = useMemo(() => dataSource === 'DNA' ? entries : thoughtEntries, [dataSource, entries, thoughtEntries]);

  const growNeuralStructure = (binary: string) => {
    if (!binary || binary.length === 0 || IS_MOBILE) return { positions: new Float32Array(0), count: 0 };
    const positions = new Float32Array(MAX_NEURAL_POINTS * 3), hash = new SpatialHash(NEURAL_R_MIN * 2.2);
    let count = 0;
    const heads: { pos: THREE.Vector3, dir: THREE.Vector3, step: number }[] = [], stepSize = 45.0, helixRadius = 30.0, helixTwist = 0.75;    
    for (let i = 0; i < Math.min(binary.length, 128); i++) {
      if (binary[i] === '1' && heads.length < 80) { 
        heads.push({ pos: new THREE.Vector3((Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800, (Math.random() - 0.5) * 800), dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), step: 0 });
      }
    }
    const maxIters = Math.min(binary.length * 2, 5000); 
    for (let i = 0; i < maxIters; i++) {
      if (count >= MAX_NEURAL_POINTS - 4) break; 
      for (let h = heads.length - 1; h >= 0; h--) {
        const head = heads[h], dir = head.dir.clone().normalize(), tempUp = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), sideVec = new THREE.Vector3().crossVectors(dir, tempUp).normalize(), upVec = new THREE.Vector3().crossVectors(sideVec, dir).normalize(), angle = head.step * helixTwist, offsetA = sideVec.clone().multiplyScalar(Math.cos(angle) * helixRadius).add(upVec.clone().multiplyScalar(Math.sin(angle) * helixRadius)), offsetB = sideVec.clone().multiplyScalar(Math.cos(angle + Math.PI) * helixRadius).add(upVec.clone().multiplyScalar(Math.sin(angle + Math.PI) * helixRadius)), posA = head.pos.clone().add(offsetA), posB = head.pos.clone().add(offsetB);
        if (count < MAX_NEURAL_POINTS && !hash.isOccupied(posA.x, posA.y, posA.z, NEURAL_R_MIN, positions)) { positions[count * 3] = posA.x; positions[count * 3 + 1] = posA.y; positions[count * 3 + 2] = posA.z; hash.add(posA.x, posA.y, posA.z, count); count++; }
        if (count < MAX_NEURAL_POINTS && !hash.isOccupied(posB.x, posB.y, posB.z, NEURAL_R_MIN, positions)) { positions[count * 3] = posB.x; positions[count * 3 + 1] = posB.y; positions[count * 3 + 2] = posB.z; hash.add(posB.x, posB.y, posB.z, count); count++; }
        const nextCenter = head.pos.clone().add(dir.multiplyScalar(stepSize));
        if (!hash.isOccupied(nextCenter.x, nextCenter.y, nextCenter.z, NEURAL_R_MIN * 0.4, positions)) {
          head.pos.copy(nextCenter); head.step++;
          if (binary[i % binary.length] === '1' && Math.random() > 0.96 && heads.length < 150) {
            heads.push({ pos: head.pos.clone(), dir: head.dir.clone().applyAxisAngle(upVec, Math.PI / 4), step: 0 });
          }
        } else {
          head.dir.applyAxisAngle(new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), Math.PI / 3);
          if (Math.random() > 0.9) heads.splice(h, 1);
        }
      }
    }
    return { positions, count };
  };

  useEffect(() => {
    if (!mountRef.current) return;
    let width = mountRef.current.clientWidth, height = mountRef.current.clientHeight;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010105); scene.fog = new THREE.FogExp2(0x010105, 0.0003);
    const camera = new THREE.PerspectiveCamera(60, width / height, 5, 40000); camera.position.set(0, 1800, 4200);
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' }); renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); mountRef.current.appendChild(renderer.domElement);
    const pGeometry = new THREE.BufferGeometry(), pPosArray = new Float32Array(PARTICLE_COUNT * 3), pTargetPosArray = new Float32Array(PARTICLE_COUNT * 3), pSizes = new Float32Array(PARTICLE_COUNT), pRandoms = new Float32Array(PARTICLE_COUNT), pTypes = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const spread = IS_MOBILE ? 4000 : 12000;
      pPosArray[i * 3] = (Math.random() - 0.5) * spread; pPosArray[i * 3 + 1] = (Math.random() - 0.5) * spread; pPosArray[i * 3 + 2] = (Math.random() - 0.5) * spread; pTargetPosArray[i * 3] = pPosArray[i * 3]; pTargetPosArray[i * 3 + 1] = pPosArray[i * 3 + 1]; pTargetPosArray[i * 3 + 2] = pPosArray[i * 3 + 2]; pSizes[i] = 1.2 + Math.random() * 5.0; pRandoms[i] = Math.random(); pTypes[i] = Math.random() > 0.9 ? 1.0 : 0.0; 
    }
    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPosArray, 3)); pGeometry.setAttribute('targetPosition', new THREE.BufferAttribute(pTargetPosArray, 3)); pGeometry.setAttribute('size', new THREE.BufferAttribute(pSizes, 1)); pGeometry.setAttribute('pRandom', new THREE.BufferAttribute(pRandoms, 1)); pGeometry.setAttribute('pType', new THREE.BufferAttribute(pTypes, 1));
    const pMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xa855f7) }, uLife: { value: 0 } },
      vertexShader: `
        uniform float uTime; uniform float uLife; attribute vec3 targetPosition; attribute float size; attribute float pRandom; attribute float pType; varying float vAlpha; varying float vType;
        void main() {
          vec3 chaosPos = position; chaosPos.x += sin(uTime * 0.1 + pRandom * 15.0) * 150.0; chaosPos.y += cos(uTime * 0.08 + pRandom * 15.0) * 150.0;
          vec3 bioPos = targetPosition; float t = uTime * 0.6; float flowAmp = 800.0 * uLife;
          vec3 wave1; wave1.x = sin(t + targetPosition.y * 0.001) * flowAmp * 0.25; wave1.y = cos(t * 0.9 + targetPosition.z * 0.001) * flowAmp * 0.25; wave1.z = sin(t * 1.1 + targetPosition.x * 0.001) * flowAmp * 0.25;
          float fastT = uTime * 1.8, turbFreq = 0.004, turbAmp = 500.0 * uLife; 
          vec3 wave2; wave2.x = sin(fastT + targetPosition.z * turbFreq + pRandom * 6.28) * turbAmp; wave2.y = cos(fastT * 0.8 + targetPosition.x * turbFreq + pRandom * 6.28) * turbAmp; wave2.z = sin(fastT * 1.2 + targetPosition.y * turbFreq + pRandom * 6.28) * turbAmp;
          bioPos += wave1 + wave2; vec3 finalPos = mix(chaosPos, bioPos, uLife); vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
          float distScale = 2200.0 / -mvPosition.z, breath = 1.0 + 0.6 * sin(uTime * 4.0 + pRandom * 20.0), activeSizeBoost = 1.0 + uLife * 1.2; 
          gl_PointSize = clamp((1.8 + pRandom * 2.5) * distScale * breath * activeSizeBoost, 1.0, 70.0); gl_Position = projectionMatrix * mvPosition;
          float shimmer = 0.5 + 0.5 * sin(uTime * 3.0 + pRandom * 50.0); vAlpha = mix(0.4 * shimmer, 0.85 + 0.15 * shimmer, uLife); vType = pRandom;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor; varying float vAlpha; varying float vType;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5)); if (d > 0.5) discard;
          float core = pow(max(0.0, 1.0 - d * 2.0), 4.5), glow = pow(max(0.0, 1.0 - d * 2.0), 1.8);
          vec3 brightColor = mix(uColor, vec3(0.95, 0.8, 1.0), 0.6), finalColor = mix(uColor, brightColor, core);
          gl_FragColor = vec4(finalColor, glow * vAlpha);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const particles = new THREE.Points(pGeometry, pMaterial); scene.add(particles);
    const nGeometry = new THREE.BufferGeometry(), nMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x22d3ee) }, uLife: { value: 0 } },
      vertexShader: `
        uniform float uTime; uniform float uLife; varying float vAlpha;
        void main() {
          vec3 pos = position; float fSpeed = 0.5, fFreq = 0.0015, fAmp = 650.0 * uLife; 
          pos.x += sin(uTime * fSpeed + position.y * fFreq) * fAmp; pos.y += cos(uTime * (fSpeed * 0.8) + position.z * fFreq) * fAmp; pos.z += sin(uTime * (fSpeed * 1.2) + position.x * fFreq) * (fAmp * 0.5);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); gl_PointSize = 12.5 * (1800.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition;
          vAlpha = mix(0.85, 0.65 + 0.35 * sin(uTime * 2.5 + position.y * 0.012), uLife);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor; varying float vAlpha;
        void main() { float d = distance(gl_PointCoord, vec2(0.5)); if (d > 0.5) discard; float glow = pow(1.0 - d * 2.0, 2.0); gl_FragColor = vec4(uColor, glow * vAlpha); }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const neuralPoints = new THREE.Points(nGeometry, nMaterial); scene.add(neuralPoints);
    const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 2.5, 0.5, 0.85); composer.addPass(bloomPass);
    const controls = new OrbitControlsImpl(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.08; controls.minDistance = 500; controls.maxDistance = 10000;
    engineRef.current = { scene, camera, renderer, composer, controls, particles, neuralPoints };
    let rafId: number, lastT = performance.now(), accTime = 0;
    const animate = (t: number) => {
      rafId = requestAnimationFrame(animate);
      if (engineRef.current) {
        const { composer, controls, particles, neuralPoints } = engineRef.current, dt = (t - lastT) * 0.001; lastT = t;
        if (isPlayingRef.current) { accTime += dt; controls.autoRotate = true; } else { controls.autoRotate = false; }
        controls.update(); (particles.material as THREE.ShaderMaterial).uniforms.uTime.value = accTime; (neuralPoints.material as THREE.ShaderMaterial).uniforms.uTime.value = accTime; composer.render();
      }
    };
    animate(performance.now());
    const handleResize = () => {
      if (!mountRef.current || !engineRef.current) return;
      width = mountRef.current.clientWidth; height = mountRef.current.clientHeight;
      const { camera, renderer, composer } = engineRef.current;
      camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(rafId); renderer.dispose(); if (mountRef.current) mountRef.current.innerHTML = ''; };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    const { particles, neuralPoints } = engineRef.current;
    if (combinedBinary && !IS_MOBILE) {
      const { positions, count } = growNeuralStructure(combinedBinary);
      neuralPoints.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      neuralPoints.geometry.setDrawRange(0, count);
      const pTargetPos = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const sourceIdx = (i % Math.max(1, count)) * 3;
        pTargetPos[i * 3] = positions[sourceIdx]; pTargetPos[i * 3 + 1] = positions[sourceIdx + 1]; pTargetPos[i * 3 + 2] = positions[sourceIdx + 2];
      }
      particles.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(pTargetPos, 3));
      setStats(s => ({ ...s, neuralCount: count }));
    } else {
      neuralPoints.geometry.setDrawRange(0, 0);
      const pInitialPos = particles.geometry.getAttribute('position').array as Float32Array;
      particles.geometry.setAttribute('targetPosition', new THREE.BufferAttribute(new Float32Array(pInitialPos), 3));
      setStats(s => ({ ...s, neuralCount: 0 }));
    }
  }, [combinedBinary]);

  useEffect(() => {
    if (!engineRef.current) return;
    const { particles, neuralPoints } = engineRef.current;
    particles.visible = showParticles; neuralPoints.visible = !showParticles;
  }, [showParticles]);

  useEffect(() => {
    if (!engineRef.current) return;
    const { particles, neuralPoints } = engineRef.current, pMat = particles.material as THREE.ShaderMaterial, nMat = neuralPoints.material as THREE.ShaderMaterial;
    gsap.to(pMat.uniforms.uLife, { value: isLifeActive ? 1.0 : 0.0, duration: 5, ease: "sine.inOut" });
    gsap.to(nMat.uniforms.uLife, { value: isLifeActive ? 1.0 : 0.0, duration: 5, ease: "sine.inOut" });
  }, [isLifeActive]);

  const handleSelectionToggle = (id: string) => {
    playMechKey();
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter(i => i !== id) : [...prev, id];
      setStats(s => ({ ...s, nodes: next.length }));
      return next;
    });
  };

  const toggleLife = () => {
    playHighTechButton();
    if (!isLifeActive) {
      incrementEvolution(); // 增长演化指数
    }
    setIsLifeActive(!isLifeActive);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#010105] text-purple-400 font-mono select-none overflow-hidden cursor-crosshair">
      <div ref={mountRef} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-6 left-6 pointer-events-auto flex items-center space-x-4">
          <button onClick={() => { playHighTechButton(); setView(AppView.DATABASE); }} className="flex items-center space-x-3 px-6 py-3 border border-purple-500/30 bg-black/50 backdrop-blur-xl hover:bg-purple-500/20 hover:border-purple-400 transition-all shadow-[0_0_25px_rgba(168,85,247,0.2)] group">
            <span className="text-purple-300 text-xl group-hover:-translate-x-1.5 transition-transform">↩</span>
            <span className="text-[12px] font-black tracking-[0.4em] uppercase">TERMINAL_EXIT</span>
          </button>
          {IS_MOBILE && (<div className="bg-red-500/10 border border-red-500/30 px-3 py-2 text-[8px] text-red-400 font-bold uppercase tracking-widest animate-pulse">[ 移动端已降低渲染配置 ]</div>)}
        </div>
        <div className="absolute top-6 right-6 pointer-events-auto bg-black/50 backdrop-blur-xl border-l-4 border-purple-500 p-6 min-w-[280px] shadow-2xl z-20">
           <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-purple-800 font-bold uppercase tracking-[0.3em]">Void_Stability</span><span className="text-[12px] text-purple-400 font-black">{stats.stability}%</span></div>
           <div className="w-full h-1 bg-purple-900/20 relative mb-5 overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.5 }} className="absolute inset-0 bg-gradient-to-r from-purple-800 to-purple-400" /></div>
           <div className="grid grid-cols-2 gap-6"><div className="flex flex-col"><span className="text-[8px] text-purple-900 font-bold uppercase tracking-[0.3em]">Active_DNA</span><span className="text-[18px] text-white font-black leading-tight">{stats.nodes.toString().padStart(2, '0')}</span></div><div className="flex flex-col text-right"><span className="text-[8px] text-purple-900 font-bold uppercase tracking-[0.3em]">Neural_Nodes</span><span className="text-[18px] text-cyan-400 font-black leading-tight">{stats.neuralCount.toLocaleString()}</span></div></div>
        </div>
        <button onClick={() => { playMechKey(); setShowHelp(true); }} className="absolute top-48 right-6 pointer-events-auto w-10 h-10 rounded-full border border-purple-500/40 text-purple-400 flex items-center justify-center hover:bg-purple-500/20 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] z-30"><span className="text-lg font-bold">?</span></button>
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center"><span className="text-[9px] font-black tracking-[0.6em] text-purple-900 mb-3 uppercase opacity-60">Visual_Modality_Synchronization</span><div className="flex space-x-6 items-center"><button onClick={() => { playMechKey(); setShowParticles(!showParticles); }} className={`w-48 h-12 border-2 transition-all flex items-center px-1 group ${showParticles ? 'border-purple-500/40 bg-purple-900/10' : 'border-cyan-500/40 bg-cyan-900/10'}`}><div className={`h-8 w-1/2 flex items-center justify-center text-[11px] font-black transition-all ${showParticles ? 'bg-purple-500 text-black shadow-[0_0_20px_rgba(168,85,247,0.6)]' : 'text-purple-950'}`}>COSMIC</div><div className={`h-8 w-1/2 flex items-center justify-center text-[11px] font-black transition-all ${!showParticles ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'text-cyan-950'}`}>NEURAL</div></button><button onClick={toggleLife} className={`h-12 px-8 border-2 transition-all flex items-center justify-center text-[12px] font-black tracking-[0.4em] uppercase group ${isLifeActive ? 'border-green-400 bg-green-500/10 text-green-300 shadow-[0_0_30px_rgba(74,222,128,0.4)]' : 'border-white/10 bg-black/60 text-white/30 hover:border-green-500/30 hover:text-green-500/50'}`}><motion.span animate={isLifeActive ? { opacity: [0.6, 1, 0.6] } : {}} transition={{ duration: 2, repeat: Infinity }}>[ {isLifeActive ? 'LIFE_ACTIVE' : 'LIFE_INIT'} ]</motion.span></button></div></div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-auto"><button onClick={() => { playMechKey(); setIsPlaying(!isPlaying); }} className={`w-20 h-20 border-2 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-2xl transition-all ${isPlaying ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)]' : 'border-purple-900/40 opacity-40 hover:opacity-100'}`}>{isPlaying ? <div className="flex space-x-2"><div className="w-2 h-7 bg-purple-400 shadow-[0_0_10px_#a855f7]" /><div className="w-2 h-7 bg-purple-400 shadow-[0_0_10px_#a855f7]" /></div> : <div className="ml-2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[22px] border-l-purple-500 border-b-[12px] border-b-transparent" />}</button></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-auto"><button onClick={() => { playMechKey(); setIsDrawerOpen(true); }} className="h-64 w-12 bg-black/60 border border-l-0 border-purple-500/20 flex flex-col items-center justify-center hover:bg-purple-500/10 transition-all group shadow-2xl"><span className="rotate-90 text-[10px] font-black tracking-[0.6em] text-purple-900 uppercase group-hover:text-purple-400">ASSEMBLY_DECK</span></button></div>
      </div>
      <AnimatePresence>
        {isDrawerOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] pointer-events-auto" /><motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 w-[460px] bg-black/95 backdrop-blur-3xl border-r-2 border-purple-500/30 z-[160] flex flex-col pointer-events-auto shadow-[20px_0_100px_rgba(0,0,0,0.8)]"><div className="p-6 border-b border-purple-500/10 bg-purple-500/5"><div className="flex justify-between items-start mb-4"><div className="flex flex-col"><span className="text-[18px] font-black text-purple-400 tracking-[0.2em] uppercase">Assembly_Deck</span><span className="text-[9px] text-purple-800 font-bold uppercase mt-1 tracking-widest">Select Source to Initiate Growth Mapping</span></div><button onClick={() => setIsDrawerOpen(false)} className="text-purple-900 hover:text-white transition-colors text-2xl font-light">✕</button></div><div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-widest border border-purple-900/30 rounded-sm overflow-hidden"><button onClick={() => { playMechKey(); setDataSource('DNA'); }} className={`py-3 flex items-center justify-center space-x-2 transition-all ${dataSource === 'DNA' ? 'bg-purple-900/40 text-white' : 'bg-black/40 text-purple-700 hover:text-purple-400'}`}><Database size={12} /><span>DNA ARCHIVE</span></button><button onClick={() => { playMechKey(); setDataSource('THOUGHT'); }} className={`py-3 flex items-center justify-center space-x-2 transition-all ${dataSource === 'THOUGHT' ? 'bg-cyan-900/40 text-cyan-200' : 'bg-black/40 text-cyan-700 hover:text-cyan-400'}`}><Cpu size={12} /><span>THOUGHT CORE</span></button></div></div><div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scroll">{activeList.length === 0 ? (<div className="p-12 text-center text-purple-950 italic uppercase text-[11px] tracking-[0.5em] opacity-30">Awaiting Signal Input...</div>) : (activeList.map((entry, idx) => { const isSelected = selectedIds.includes(entry.id); const label = dataSource === 'DNA' ? (entry as any).originalText : (entry as any).question; const colorClass = dataSource === 'DNA' ? 'purple' : 'cyan'; return (<div key={entry.id || idx} onClick={() => handleSelectionToggle(entry.id)} className={`p-6 border-2 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? (dataSource === 'DNA' ? 'bg-purple-500/15 border-purple-400' : 'bg-cyan-900/15 border-cyan-400') + ' shadow-[0_0_20px_rgba(168,85,247,0.1)]' : `bg-black/40 border-${colorClass}-950/40 hover:border-${colorClass}-500/40`}`}>{isSelected && <motion.div layoutId="sel-bg" className={`absolute inset-0 bg-gradient-to-r from-${colorClass}-500/5 to-transparent pointer-events-none`} />}<div className="flex justify-between items-center mb-2 relative z-10"><span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${dataSource === 'DNA' ? 'text-purple-800' : 'text-cyan-800'}`}>{entry.timestamp}</span><div className={`w-5 h-5 border-2 border-${colorClass}-900/50 flex items-center justify-center transition-all ${isSelected ? `bg-${colorClass}-400 border-${colorClass}-400` : ''}`}>{isSelected && <span className="text-black font-black text-[10px]">✓</span>}</div></div><p className={`text-[12px] font-black tracking-tight uppercase relative z-10 transition-colors line-clamp-3 ${isSelected ? 'text-white text-glow' : `${dataSource === 'DNA' ? 'text-purple-700 group-hover:text-purple-400' : 'text-cyan-700 group-hover:text-cyan-400'}`}`}>{label}</p></div>); }))}</div><div className="p-10 border-t border-purple-500/20 bg-purple-950/10"><button onClick={() => { playHighTechButton(); setIsDrawerOpen(false); }} className="w-full py-5 border-2 border-purple-500/50 bg-purple-500/10 text-[13px] font-black tracking-[0.8em] uppercase hover:bg-purple-500 hover:text-black hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all">GENERATE_STRUCTURE</button></div></motion.div></>)}
      </AnimatePresence>
      <AnimatePresence>{showHelp && (<ViewManual title="GENESIS DYNAMICS [DNA动态]" subtitle="PROTOCOL_MANUAL_v1.0" items={LENIA_MANUAL_ITEMS} theme="purple" onClose={() => setShowHelp(false)} />)}</AnimatePresence>
      <style>{`.custom-scroll::-webkit-scrollbar { width: 5px; } .custom-scroll::-webkit-scrollbar-track { background: transparent; } .custom-scroll::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.15); border-radius: 2px; } .text-glow { text-shadow: 0 0 15px rgba(255,255,255,0.4); }`}</style>
    </div>
  );
};

export default GenesisLenia;
