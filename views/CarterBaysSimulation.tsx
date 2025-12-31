
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useGeneData } from '../context/GeneContext';
import { AppView } from '../types';
import { playHighTechButton, playMechKey } from '../utils/audio';
import { 
  Play, Pause, RotateCcw, Trash2, ArrowLeft, 
  Activity, Database, CheckSquare, Square, X, Zap, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DUMMY = new THREE.Object3D();
const GRID_SIZE = 96; 
const MAX_VISIBLE = 100000;
const SIM_TICK_RATE = 80;

const MOCK_STRAINS = [
  { id: 'ALPHA', title: 'Alpha Helix', code: '101100101010011110001010110110100101011001111101010110101010111' },
  { id: 'BETA', title: 'Beta Cluster', code: '111110111101111101111011111011110111110111111011111111101111111' },
  { id: 'GAMMA', title: 'Gamma Void', code: '100000100000010000000100000000100000100000001000000001000000100' },
  { id: 'DELTA', title: 'Delta Mesh', code: '110011001100110011001100110011001100110011001100110011001100110' }
];

const CarterBaysSimulation: React.FC = () => {
  const { entries, setView } = useGeneData();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStrains, setSelectedStrains] = useState<string[]>(['ALPHA']);
  const [stats, setStats] = useState({ pop: 0, gen: 0 });
  const [activeDNA, setActiveDNA] = useState('');

  const activeCells = useRef<Set<number>>(new Set());
  const genCount = useRef(0);
  const lastTickTime = useRef(0);
  const isPlayingRef = useRef(true);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const getCoords = (idx: number) => {
    const z = Math.floor(idx / (GRID_SIZE * GRID_SIZE));
    const rem = idx % (GRID_SIZE * GRID_SIZE);
    const y = Math.floor(rem / GRID_SIZE);
    const x = rem % GRID_SIZE;
    return { x, y, z };
  };

  const wrap = (v: number) => (v + GRID_SIZE) % GRID_SIZE;

  const mapDataToGrid = useCallback((dna: string) => {
    activeCells.current.clear();
    genCount.current = 0;
    let cx = Math.floor(GRID_SIZE / 2);
    let cy = Math.floor(GRID_SIZE / 2);
    let cz = Math.floor(GRID_SIZE / 2);
    for (let i = 0; i < dna.length; i++) {
      if (dna[i] === '1') {
        const idx = cx + cy * GRID_SIZE + cz * GRID_SIZE * GRID_SIZE;
        activeCells.current.add(idx);
      }
      const stepValue = parseInt(dna.slice(i, i + 5), 2) || i;
      cx = wrap(cx + ((stepValue % 3) - 1));
      cy = wrap(cy + ((Math.floor(stepValue / 3) % 3) - 1));
      cz = wrap(cz + ((Math.floor(stepValue / 9) % 3) - 1));
    }
    setStats({ pop: activeCells.current.size, gen: 0 });
    setActiveDNA(dna);
    playHighTechButton();
  }, []);

  const runSimulationStep = useCallback(() => {
    const current = activeCells.current;
    if (current.size === 0) return;
    const next = new Set<number>();
    const neighbors = new Map<number, number>();
    for (const idx of current) {
      const { x, y, z } = getCoords(idx);
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0 && dz === 0) continue;
            const nIdx = wrap(x + dx) + wrap(y + dy) * GRID_SIZE + wrap(z + dz) * GRID_SIZE * GRID_SIZE;
            neighbors.set(nIdx, (neighbors.get(nIdx) || 0) + 1);
          }
        }
      }
    }
    for (const [idx, count] of neighbors.entries()) {
      const isAlive = current.has(idx);
      if (!isAlive && (count === 4 || count === 5)) next.add(idx);
      else if (isAlive && count === 5) next.add(idx);
    }
    activeCells.current = next;
    genCount.current++;
    if (genCount.current % 2 === 0) setStats({ pop: next.size, gen: genCount.current });
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.025);

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    camera.position.set(100, 100, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
    mountRef.current.appendChild(renderer.domElement);

    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x0066ff, emissiveIntensity: 3, metalness: 0.9, roughness: 0.1 }),
      MAX_VISIBLE
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    meshRef.current = mesh;

    scene.add(new THREE.AmbientLight(0xffffff, 0.05));
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 2.0, 0.4, 0.85));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    // IMMERSIVE SETTINGS: No zoom or pan to prevent seeing outside simulated "universe"
    controls.enableZoom = false;
    controls.enablePan = false;

    mapDataToGrid(MOCK_STRAINS[0].code);

    let raf: number;
    const animate = (time: number) => {
      raf = requestAnimationFrame(animate);
      if (isPlayingRef.current && time - lastTickTime.current > SIM_TICK_RATE) {
        runSimulationStep();
        lastTickTime.current = time;
      }
      if (meshRef.current) {
        let count = 0;
        const offset = GRID_SIZE / 2;
        for (const idx of activeCells.current) {
          if (count >= MAX_VISIBLE) break;
          const { x, y, z } = getCoords(idx);
          DUMMY.position.set(x - offset, y - offset, z - offset);
          DUMMY.updateMatrix();
          meshRef.current.setMatrixAt(count, DUMMY.matrix);
          count++;
        }
        meshRef.current.count = count;
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      controls.update();
      composer.render();
    };
    animate(0);

    const resize = () => {
      const nw = mountRef.current?.clientWidth || 0, nh = mountRef.current?.clientHeight || 0;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      composer.setSize(nw, nh);
    };
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (mountRef.current) mountRef.current.innerHTML = '';
    };
  }, [mapDataToGrid, runSimulationStep]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-[100] bg-black font-mono overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 pointer-events-none space-y-1">
        <div className="bg-black/10 backdrop-blur-sm border-l-2 border-cyan-500 p-1.5 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <Cpu size={10} className="text-cyan-500 animate-pulse" />
            <span className="text-[10px] font-black text-white tracking-widest uppercase opacity-80">Nexus_Core</span>
          </div>
          <div className="mt-1 flex space-x-4">
            <div className="flex flex-col"><span className="text-[7px] text-cyan-900 font-bold uppercase tracking-tighter">Gen</span><span className="text-[10px] text-white font-black tabular-nums">{stats.gen}</span></div>
            <div className="flex flex-col"><span className="text-[7px] text-cyan-900 font-bold uppercase tracking-tighter">Vox</span><span className="text-[10px] text-cyan-400 font-black tabular-nums">{stats.pop}</span></div>
          </div>
        </div>
        <button onClick={() => { playMechKey(); setIsDrawerOpen(true); }} className="bg-black/20 backdrop-blur-sm border border-white/5 p-1 text-[8px] font-bold text-white/40 uppercase tracking-widest hover:bg-cyan-500/10 hover:text-cyan-400 transition-all pointer-events-auto">[ Open_Assembly ]</button>
      </div>
      <div className="absolute top-2 right-2 z-10"><button onClick={() => setView(AppView.DATABASE)} className="p-1.5 text-white/20 hover:text-white transition-colors"><ArrowLeft size={16} /></button></div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center space-x-4 pointer-events-auto shadow-2xl">
          <button onClick={() => setIsPlaying(!isPlaying)} className={`p-1 transition-colors ${isPlaying ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
          <div className="w-px h-4 bg-white/10" /><button onClick={() => mapDataToGrid(activeDNA)} className="p-1 text-white/40 hover:text-cyan-400 transition-all"><RotateCcw size={16} /></button>
          <button onClick={() => { activeCells.current.clear(); setStats({pop:0, gen:0}); playMechKey(); }} className="p-1 text-white/40 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-black/40 backdrop-blur-md h-4 pointer-events-none overflow-hidden border-t border-cyan-500/5"><div className="animate-marquee whitespace-nowrap opacity-20 flex space-x-8 h-full items-center">{[...Array(4)].map((_, i) => (<span key={i} className="text-[8px] text-cyan-500 tracking-[0.4em] font-mono">STREAM_ID::{activeDNA} :: THREAD_STATE_ACTIVE :: VOID_SYNC_0x99 :: B45_S5 :: </span>))}</div></div>
      <AnimatePresence>{isDrawerOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" /><motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-72 bg-black/60 backdrop-blur-2xl border-l border-white/5 z-50 flex flex-col shadow-2xl overflow-hidden"><div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5"><span className="text-[10px] font-black text-white tracking-[0.2em] uppercase">Assembly_Deck</span><X size={16} className="text-white/30 cursor-pointer hover:text-white" onClick={() => setIsDrawerOpen(false)} /></div><div className="flex-1 overflow-y-auto p-4 space-y-4">{MOCK_STRAINS.map((s) => (<div key={s.id} onClick={() => { playMechKey(); setSelectedStrains(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]); }} className={`p-3 border transition-all cursor-pointer ${selectedStrains.includes(s.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}><div className="flex justify-between items-center"><span className="text-[10px] font-bold text-white/80">{s.title}</span>{selectedStrains.includes(s.id) ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} className="text-white/20" />}</div><p className="text-[8px] text-white/30 mt-1 italic leading-tight">SEQUENCE_ID::{s.code.slice(0, 12)}...</p></div>))}</div><div className="p-4 bg-white/5 border-t border-white/10"><button onClick={() => { const combined = MOCK_STRAINS.filter(s => selectedStrains.includes(s.id)).map(s => s.code).join(''); mapDataToGrid(combined); setIsDrawerOpen(false); }} className="w-full bg-cyan-500/20 border border-cyan-500/50 py-3 text-[10px] font-black text-cyan-400 tracking-[0.4em] uppercase hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center space-x-2"><Zap size={14} /><span>Execute_Burn</span></button></div></motion.div></>)}</AnimatePresence>
      <style>{`.animate-marquee { animation: marquee 60s linear infinite; display: inline-block; } @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
};

export default CarterBaysSimulation;
