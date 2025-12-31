
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass';
import { useGeneData } from '../context/GeneContext';
import { AppView } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import ViewManual, { ManualItem } from '../components/ViewManual';
import { Database, Cpu } from 'lucide-react';

// --- CONFIGURATION ---
const GRID_SIZE = 60;
const WORLD_SCALE = 120; // Total size of the bounding box (-60 to 60)
const DATA_BOUNDS = 40;  // Data mapped within -40 to 40
const CELL_SIZE = WORLD_SCALE / GRID_SIZE; // ~2.0
const AGENT_COUNT = 3000;
const DEPOSITION_THRESHOLD = 25; // Updated to 25
const CRYSTAL_SIZE = 1.2; 
const MAX_CRYSTALS = 20000;

const SLIME_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "LOGIC",
    title: "群体智能网络 | SWARM INTELLIGENCE GRID",
    subtitle: "OPERATIONAL_LOGIC",
    content: "本实验模拟了多头绒泡菌 (Physarum polycephalum) 的生物行为。这里没有中央指挥官，只有成千上万个盲目的探索者 (Agents)。它们构成了某种原始的分布式超级智能，在三维矩阵中不仅追逐着数据（食物），更在彼此留下的化学信标中交换着生存的智慧。",
    meta: "TYPE: AGENT_BASED",
    code: "0xSLIME_MOLD"
  },
  {
    id: "RULES",
    title: "觅食与沉积机制 | FORAGING & DEPOSITION",
    subtitle: "CORE_REGULATIONS",
    content: "这是一个残酷而高效的反馈循环：\n1. 传感 (Sense)：探测前方信息素浓度。\n2. 移动 (Move)：向浓度最高处进发。\n3. 沉积 (Deposit)：留下痕迹，强化成功路径。\n4. 固化 (Solidify)：当某条路径被足够多的探索者践行，它便会相变为永久的晶体结构，象征着真理的确立。",
    meta: "CYCLE: SENSE-ACT",
    code: "0xFEEDBACK_LOOP"
  },
  {
    id: "ARCH",
    title: "标量场与实例化 | SCALAR FIELDS",
    subtitle: "SYSTEM_ARCHITECTURE",
    content: "系统在不可见的维度维护着一个三维标量场，记录着每一寸空间的“气味”浓度。已固化的真理之路通过 GPU 实例化网格 (Instanced Mesh) 技术显化，配合后处理的光流拖尾，将抽象的算法逻辑具象化为璀璨的晶体脉络。",
    meta: "RENDER: INSTANCING",
    code: "0xSCALAR_FIELD"
  },
  {
    id: "EMERGENCE",
    title: "传输网络涌现 | NETWORK EMERGENCE",
    subtitle: "GLOBAL_OPTIMIZATION",
    content: "起初是杂乱无章的随机游走，最终却坍缩为连接所有关键节点的完美网络。这种从无序到极致有序的过程，完美复现了自然界（如叶脉、星系纤维）的构建法则。\n\n它证明了：即使是最卑微的个体，通过简单的协作，也能解开连超级计算机都畏惧的全局优化谜题。",
    meta: "RESULT: OPTIMAL_PATH",
    code: "0xNETWORK_GROWTH"
  },
  {
    id: "COMPUTE",
    title: "涌现计算：无脑之智 | EMERGENT COMPUTATION",
    subtitle: "NON_SILICON_INTELLIGENCE",
    content: "黏菌展示了涌现的终极奥义：智能并非源于复杂的单一核心，而是源于简单个体的海量堆叠。\n\n每一个 Agent 都在执行盲目的局部规则（趋吉避凶），但宏观层面却涌现出了能够解决 NP-Hard 问题（如旅行商问题）的全局智慧。这揭示了涌现与 AI 的深层关联：真正的智能，或许就是‘量变’引发‘质变’的物理必然。",
    meta: "ALGO: BIO_SOLVER",
    code: "0xDISTRIBUTED_MIND"
  }
];

// Helper to wrap coordinates
const wrap = (val: number, max: number) => (val + max) % max;

type SimState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

const SlimeLab: React.FC = () => {
  const { entries, thoughtEntries, setView } = useGeneData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentMappedId, setCurrentMappedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ crystals: 0, agents: AGENT_COUNT });
  const [simState, setSimState] = useState<SimState>('IDLE');
  const [orthoViews, setOrthoViews] = useState<string[] | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [dataSource, setDataSource] = useState<'DNA' | 'THOUGHT'>('DNA');

  // Ref to track simState inside the animation loop without triggering re-renders of the effect
  const simStateRef = useRef<SimState>('IDLE');

  const mountRef = useRef<HTMLDivElement>(null);
  
  // Normalized entry access
  const activeList = useMemo(() => dataSource === 'DNA' ? entries : thoughtEntries, [dataSource, entries, thoughtEntries]);
  
  const selectedEntryRaw = useMemo(() => 
    entries.find(e => e.id === selectedId) || thoughtEntries.find(e => e.id === selectedId),
  [selectedId, entries, thoughtEntries]);

  const currentMappedEntry = useMemo(() => 
    entries.find(e => e.id === currentMappedId) || thoughtEntries.find(e => e.id === currentMappedId),
  [currentMappedId, entries, thoughtEntries]);

  const getEntryLabel = (entry: any) => dataSource === 'DNA' ? entry.originalText : entry.question;
  const getEntryBinary = (entry: any) => dataSource === 'DNA' ? entry.binaryStream : entry.responseBinary;

  // --- SIMULATION REFS ---
  const simRef = useRef({
    // Physics Data
    targets: new Float32Array(0), // x,y,z flat array of active data points
    targetCount: 0,
    
    // Grid for Deposition
    visitGrid: new Uint16Array(GRID_SIZE * GRID_SIZE * GRID_SIZE), // Visit count
    solidGrid: new Uint8Array(GRID_SIZE * GRID_SIZE * GRID_SIZE), // 1 if solidified
    
    // Agents
    positions: new Float32Array(AGENT_COUNT * 3),
    velocities: new Float32Array(AGENT_COUNT * 3),
    assignedTargets: new Int32Array(AGENT_COUNT), // Index of target for each agent
    colors: new Float32Array(AGENT_COUNT * 3), // For red flash effect
    flashTimers: new Float32Array(AGENT_COUNT), // Countdown for red flash
    
    // Logic
    noGrowthFrames: 0,

    // Rendering
    agentGeo: null as THREE.BufferGeometry | null,
    agentMesh: null as THREE.Points | null, // Added ref to toggle visibility
    crystalMesh: null as THREE.InstancedMesh | null,
    dummy: new THREE.Object3D(),
    activeCrystalCount: 0
  });

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    controls: OrbitControls;
  } | null>(null);

  // Sync ref with state
  useEffect(() => {
    simStateRef.current = simState;
  }, [simState]);

  // --- INITIALIZATION ---
  const initSimulation = useCallback((binaryStream: string) => {
    const sim = simRef.current;
    
    // 1. Reset Grids & Logic
    sim.visitGrid.fill(0);
    sim.solidGrid.fill(0);
    sim.activeCrystalCount = 0;
    sim.noGrowthFrames = 0;

    if (sim.crystalMesh) {
      sim.crystalMesh.count = 0;
      sim.crystalMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Coordinate Normalization (Data Mapping)
    // Map binary '1's to (-40, -40, -40) -> (40, 40, 40)
    const tempTargets: number[] = [];
    const len = binaryStream.length;
    
    // Determine grid dimensions for input data (approx cubic root)
    const side = Math.ceil(Math.pow(len, 1/3));
    const step = (DATA_BOUNDS * 2) / Math.max(1, side - 1);
    
    for (let i = 0; i < len; i++) {
        if (binaryStream[i] === '1') {
            // Map index to 3D grid index
            const z = Math.floor(i / (side * side));
            const rem = i % (side * side);
            const y = Math.floor(rem / side);
            const x = rem % side;

            // Map to world coordinates
            const wx = (x * step) - DATA_BOUNDS;
            const wy = (y * step) - DATA_BOUNDS;
            const wz = (z * step) - DATA_BOUNDS;

            // Add slight jitter to avoid perfect grid artifacts
            tempTargets.push(
                wx + (Math.random() - 0.5) * 2,
                wy + (Math.random() - 0.5) * 2,
                wz + (Math.random() - 0.5) * 2
            );
        }
    }

    // If no data, add center point fallback
    if (tempTargets.length === 0) tempTargets.push(0,0,0);

    sim.targets = new Float32Array(tempTargets);
    sim.targetCount = tempTargets.length / 3;

    // 3. Initialize Agents with Gravity Well Logic
    for (let i = 0; i < AGENT_COUNT; i++) {
        resetAgent(i, true);
    }

    if (sim.agentGeo) {
        sim.agentGeo.attributes.position.needsUpdate = true;
        sim.agentGeo.attributes.color.needsUpdate = true;
    }
    
    setStats({ crystals: 0, agents: AGENT_COUNT });
    setOrthoViews(null); // Reset views
    setSimState('IDLE'); // Ready to start
  }, []);

  // Helper to reset a single agent
  const resetAgent = (i: number, randomStart: boolean = false) => {
      const sim = simRef.current;
      const idx = i * 3;
      
      // Assign a random target from the available data points
      const targetIdx = Math.floor(Math.random() * sim.targetCount);
      sim.assignedTargets[i] = targetIdx;

      // Start Position
      if (randomStart) {
          // Totally random in box
          sim.positions[idx] = (Math.random() - 0.5) * WORLD_SCALE;
          sim.positions[idx + 1] = (Math.random() - 0.5) * WORLD_SCALE;
          sim.positions[idx + 2] = (Math.random() - 0.5) * WORLD_SCALE;
      } else {
          // Respawn at edges (Launch)
          const angle = Math.random() * Math.PI * 2;
          const height = (Math.random() - 0.5) * WORLD_SCALE;
          const radius = WORLD_SCALE * 0.6; // Slightly outside
          sim.positions[idx] = Math.cos(angle) * radius;
          sim.positions[idx + 1] = height;
          sim.positions[idx + 2] = Math.sin(angle) * radius;
      }

      // Initial Velocity (Zero, let gravity take over)
      sim.velocities[idx] = 0;
      sim.velocities[idx + 1] = 0;
      sim.velocities[idx + 2] = 0;

      // Reset Visuals
      // Orange/Amber default state (R=1, G=~0.5, B=0) instead of Cyan (R=0, G=1, B=1)
      sim.colors[idx] = 1.0;     // R
      sim.colors[idx + 1] = 0.5; // G
      sim.colors[idx + 2] = 0.0; // B
      sim.flashTimers[i] = 0;
  };

  // --- THREE.JS SETUP ---
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(WORLD_SCALE * 0.8, WORLD_SCALE * 0.5, WORLD_SCALE * 0.8);

    // FIX: preserveDrawingBuffer to ensure snapshots can be taken reliably
    const renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        powerPreference: "high-performance",
        preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- AGENTS (Particles) ---
    const agentGeo = new THREE.BufferGeometry();
    agentGeo.setAttribute('position', new THREE.BufferAttribute(simRef.current.positions, 3));
    agentGeo.setAttribute('color', new THREE.BufferAttribute(simRef.current.colors, 3));
    
    const agentMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const agentMesh = new THREE.Points(agentGeo, agentMat);
    scene.add(agentMesh);
    simRef.current.agentGeo = agentGeo;
    simRef.current.agentMesh = agentMesh;

    // --- DEPOSITION (Instanced Cubes - HOLOGRAPHIC MODE) ---
    const cubeGeo = new THREE.BoxGeometry(CRYSTAL_SIZE, CRYSTAL_SIZE, CRYSTAL_SIZE);
    
    // VISUAL UPDATE: Holographic Material (ORANGE)
    const cubeMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00, // High-light Amber / Orange
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending, // Glow stacking
        depthWrite: false // See-through X-Ray effect
    });
    
    const crystalMesh = new THREE.InstancedMesh(cubeGeo, cubeMat, MAX_CRYSTALS);
    crystalMesh.count = 0;
    crystalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // CRITICAL FIX: Disable frustum culling to prevent mesh disappearing when camera moves/switches
    crystalMesh.frustumCulled = false;
    scene.add(crystalMesh);
    simRef.current.crystalMesh = crystalMesh;

    // --- LIGHTING ---
    const ambient = new THREE.AmbientLight(0x664400); // Warm ambient
    scene.add(ambient);
    const pointLight = new THREE.PointLight(0xffaa00, 1, WORLD_SCALE * 2); // Orange Point Light
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // --- POST PROCESSING (Visual FX) ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // VISUAL UPDATE: Strong Light Trails
    const afterimagePass = new AfterimagePass(0.96); 
    composer.addPass(afterimagePass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    sceneRef.current = { scene, camera, renderer, composer, controls };

    // --- ANIMATION LOOP ---
    let frameId: number;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        // Physics update loop managed by REF to prevent re-mounts
        if (simStateRef.current === 'RUNNING') {
            updatePhysics();
        }

        controls.update();
        composer.render();
    };
    animate();

    const handleResize = () => {
        if (!mountRef.current) return;
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
        cancelAnimationFrame(frameId);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []); // Empty dependency array to ensure scene persists across state changes

  // --- PHYSICS ENGINE (GRAVITY WELL + DEPOSITION) ---
  const updatePhysics = () => {
      const sim = simRef.current;
      const { positions, velocities, colors, flashTimers, visitGrid, solidGrid, targets, activeCrystalCount } = sim;
      
      const halfSize = WORLD_SCALE / 2;
      const gridSize = GRID_SIZE;
      let newCrystals = 0;

      for (let i = 0; i < AGENT_COUNT; i++) {
          const idx = i * 3;
          let px = positions[idx];
          let py = positions[idx + 1];
          let pz = positions[idx + 2];

          // 1. Gravity Well Logic (Missile Guidance)
          const targetIndex = sim.assignedTargets[i] * 3;
          const tx = targets[targetIndex];
          const ty = targets[targetIndex + 1];
          const tz = targets[targetIndex + 2];

          // Calculate vector to target
          const dx = tx - px;
          const dy = ty - py;
          const dz = tz - pz;
          
          // Force calculation: Hooke's Law / Attraction
          // force = (target - current) * factor
          const forceX = dx * 0.05;
          const forceY = dy * 0.05;
          const forceZ = dz * 0.05;

          // Apply Noise
          const noiseX = (Math.random() - 0.5) * 0.02;
          const noiseY = (Math.random() - 0.5) * 0.02;
          const noiseZ = (Math.random() - 0.5) * 0.02;

          // Update Velocity
          velocities[idx] += forceX + noiseX;
          velocities[idx + 1] += forceY + noiseY;
          velocities[idx + 2] += forceZ + noiseZ;

          // Damping (Friction) to prevent orbital chaos
          velocities[idx] *= 0.92;
          velocities[idx + 1] *= 0.92;
          velocities[idx + 2] *= 0.92;

          // Update Position
          px += velocities[idx];
          py += velocities[idx + 1];
          pz += velocities[idx + 2];

          // 2. Deposition Check
          // Map current position to grid coordinates
          const gx = Math.floor((px + halfSize) / CELL_SIZE);
          const gy = Math.floor((py + halfSize) / CELL_SIZE);
          const gz = Math.floor((pz + halfSize) / CELL_SIZE);

          // Boundary Check
          if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && gz >= 0 && gz < gridSize) {
              const gIdx = gx + gy * gridSize + gz * gridSize * gridSize;
              
              visitGrid[gIdx]++;

              // Check Threshold
              if (visitGrid[gIdx] > DEPOSITION_THRESHOLD && solidGrid[gIdx] === 0) {
                  solidGrid[gIdx] = 1; // Mark solidified
                  
                  // Spawn Crystal
                  if (sim.crystalMesh && sim.activeCrystalCount < MAX_CRYSTALS) {
                      sim.dummy.position.set(
                          (gx * CELL_SIZE) - halfSize + CELL_SIZE/2,
                          (gy * CELL_SIZE) - halfSize + CELL_SIZE/2,
                          (gz * CELL_SIZE) - halfSize + CELL_SIZE/2
                      );
                      sim.dummy.scale.setScalar(1.0); 
                      sim.dummy.updateMatrix();
                      sim.crystalMesh.setMatrixAt(sim.activeCrystalCount, sim.dummy.matrix);
                      sim.activeCrystalCount++;
                      newCrystals++;
                  }

                  // 3. INTERACTION FEEDBACK: RESPONE & FLASH
                  resetAgent(i, false); // Respawn at edge
                  
                  continue; 
              }
          }

          // Write back position
          positions[idx] = px;
          positions[idx + 1] = py;
          positions[idx + 2] = pz;

          // 4. Update Color (Flash logic)
          if (flashTimers[i] > 0) {
              flashTimers[i] -= 0.05;
              // Flash White/Yellow
              colors[idx] = 1.0; 
              colors[idx+1] = 1.0; 
              colors[idx+2] = 1.0 - flashTimers[i]; 
          } else {
              // Default Orange/Amber
              colors[idx] = 1.0;
              colors[idx+1] = 0.5;
              colors[idx+2] = 0.0;
          }
      }

      // Detect Stability (No growth)
      if (newCrystals === 0) {
          sim.noGrowthFrames++;
          if (sim.noGrowthFrames > 240) { // ~4 seconds of silence
              setSimState('FINISHED');
          }
      } else {
          sim.noGrowthFrames = 0;
      }

      // Batch Updates
      if (sim.agentGeo) {
          sim.agentGeo.attributes.position.needsUpdate = true;
          sim.agentGeo.attributes.color.needsUpdate = true;
      }
      if (sim.crystalMesh && newCrystals > 0) {
          sim.crystalMesh.count = sim.activeCrystalCount;
          sim.crystalMesh.instanceMatrix.needsUpdate = true;
      }
      
      if (sim.activeCrystalCount !== stats.crystals) {
          setStats(s => ({ ...s, crystals: sim.activeCrystalCount }));
      }
  };

  // --- SNAPSHOT SYSTEM (3-VIEW) ---
  const captureSnapshots = () => {
      const { scene, renderer } = sceneRef.current!;
      const sim = simRef.current;
      
      // 1. Hide Agents (Noise)
      if (sim.agentMesh) sim.agentMesh.visible = false;
      
      // 2. Setup Render Dimensions
      const currentSize = new THREE.Vector2();
      renderer.getSize(currentSize);
      const thumbSize = 300; // Resolution for small windows
      renderer.setSize(thumbSize, thumbSize);
      
      // Backup Background & Fog
      const originalBackground = scene.background;
      const originalFog = scene.fog;
      
      // Set to dark color for blueprints and REMOVE FOG
      // Fog was obscuring the orthogonal view due to long distance
      scene.background = new THREE.Color(0x050505);
      scene.fog = null;

      // 3. Setup Ortho Camera
      const frustumSize = WORLD_SCALE * 1.5; // Slightly larger frustum to ensure full coverage
      const aspect = 1;
      const orthoCam = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        1, 1000
      );
      
      const views: string[] = [];
      // Angles: Top (Y+), Front (Z+), Side (X+)
      const angles = [
          [0, 200, 0], 
          [0, 0, 200], 
          [200, 0, 0]  
      ];
      
      // Force autoClear to true for these manual renders to ensure no artifacts
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = true;

      // 4. Capture Loop
      angles.forEach(pos => {
          orthoCam.position.set(pos[0], pos[1], pos[2]);
          orthoCam.lookAt(0, 0, 0);
          renderer.render(scene, orthoCam);
          views.push(renderer.domElement.toDataURL('image/png'));
      });

      // 5. Restore State
      renderer.setSize(currentSize.x, currentSize.y);
      renderer.autoClear = prevAutoClear;
      scene.background = originalBackground; 
      scene.fog = originalFog; // Restore fog
      
      if (sim.agentMesh) sim.agentMesh.visible = true;
      
      setOrthoViews(views);
  };

  // Watch Sim State to Trigger Snapshots
  useEffect(() => {
      if (simState === 'FINISHED' && !orthoViews) {
          // Delay slightly to ensure physics loop exit and final render frame
          setTimeout(() => {
             requestAnimationFrame(captureSnapshots);
          }, 100);
      } else if (simState === 'IDLE' || simState === 'RUNNING') {
          setOrthoViews(null);
      }
  }, [simState]);

  const handleMainAction = () => {
      playHighTechButton();
      if (simState === 'IDLE') {
          setSimState('RUNNING');
      } else if (simState === 'RUNNING') {
          setSimState('PAUSED');
      } else if (simState === 'PAUSED') {
          setSimState('RUNNING');
      } else if (simState === 'FINISHED') {
          // Restart Logic
          const entry = entries.find(e => e.id === currentMappedId) || thoughtEntries.find(e => e.id === currentMappedId);
          if (entry) {
              const label = getEntryLabel(entry);
              const binary = getEntryBinary(entry);
              initSimulation(binary || label);
              setSimState('RUNNING');
          } else {
              // Fallback reset if data missing
              initSimulation("");
              setSimState('RUNNING');
          }
      }
  };

  const getButtonText = () => {
      switch (simState) {
          case 'IDLE': return '[ START_EVOLUTION / 开始演化 ]';
          case 'RUNNING': return '[ PAUSE_EVOLUTION / 暂停演化 ]';
          case 'PAUSED': return '[ RESUME_EVOLUTION / 继续演化 ]';
          case 'FINISHED': return '[ RESTART_EVOLUTION / 重新演化 ]';
          default: return 'ERROR';
      }
  };

  const handleSelect = (entry: any) => {
    playMechKey();
    if (selectedId === entry.id) {
        return; 
    }
    setSelectedId(entry.id);
  };

  const handleMapAndClose = (entry: any) => {
    playHighTechButton();
    const label = getEntryLabel(entry);
    const binary = getEntryBinary(entry);
    
    // 1. Initialize simulation with new data (puts particles in IDLE state)
    initSimulation(binary || label);
    // 2. Set this ID as the currently mapped/visualized one
    setCurrentMappedId(entry.id);
    // 3. Close sidebar and clear selection
    setIsSidebarOpen(false);
    setSelectedId(null);
    // State remains IDLE, waiting for user to click Start
  };

  const toggleSidebar = () => {
    playHighTechButton();
    // Do NOT auto-select on open, just toggle state
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking the backdrop
  const handleBackdropClick = () => {
    if (isSidebarOpen) {
      playMechKey();
      setIsSidebarOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#000000] text-orange-500 font-mono overflow-hidden select-none">
      
      {/* --- 3D Scene Container --- */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* --- 3-View Blueprint Windows (Shows on Finished) --- */}
      <AnimatePresence>
        {orthoViews && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               transition={{ duration: 0.5, staggerChildren: 0.1 }}
               className="absolute top-24 right-8 z-40 flex flex-col space-y-3 pointer-events-none"
            >
               {['TOP_VIEW', 'FRONT_VIEW', 'SIDE_VIEW'].map((label, idx) => (
                   <motion.div 
                     key={label}
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }} 
                     className="bg-[#050505]/90 border border-orange-500/30 p-1 shadow-[0_0_20px_rgba(249,115,22,0.15)] backdrop-blur-md w-24 h-28 md:w-32 md:h-36 flex flex-col"
                   >
                       <div className="flex justify-between items-center bg-orange-900/20 px-2 py-1 mb-1 shrink-0">
                           <span className="text-[6px] md:text-[7px] text-orange-400 font-bold tracking-widest">{label}</span>
                           <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
                       </div>
                       <div className="flex-1 border border-white/5 relative overflow-hidden bg-black">
                          <img src={orthoViews[idx]} alt={label} className="absolute inset-0 w-full h-full object-contain opacity-90" />
                          {/* Crosshair Overlay */}
                          <div className="absolute inset-0 opacity-20 pointer-events-none">
                             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-orange-500" />
                             <div className="absolute top-0 left-1/2 h-full w-[1px] bg-orange-500" />
                          </div>
                       </div>
                   </motion.div>
               ))}
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Overlay UI: Return Button --- */}
      <button 
        onClick={() => { playMechKey(); setView(AppView.DATABASE); }}
        className="absolute top-8 right-8 z-50 text-[10px] font-bold tracking-[0.2em] border border-orange-900/40 px-6 py-3 hover:bg-orange-900/20 hover:text-orange-300 transition-all uppercase group backdrop-blur-sm bg-black/30"
      >
        <span className="group-hover:opacity-100 opacity-60 transition-opacity">[ RETURN_ROOT ]</span>
      </button>

      {/* --- Help Button --- */}
      <button 
        onClick={() => { playMechKey(); setShowHelp(true); }}
        className="absolute top-8 right-64 z-50 w-10 h-10 rounded-full border border-orange-500/40 text-orange-400 flex items-center justify-center hover:bg-orange-500/20 hover:text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] bg-black/30 backdrop-blur-sm"
      >
        <span className="text-lg font-bold">?</span>
      </button>

      {/* --- Overlay UI: Stats & Action --- */}
      <div className="absolute bottom-20 right-8 z-40 text-right pointer-events-none flex flex-col items-end">
         <div className="text-[32px] font-black text-orange-500 leading-none drop-shadow-[0_0_10px_#f97316]">
            {stats.crystals.toLocaleString()}
         </div>
         <div className="text-[9px] text-orange-800 font-bold uppercase tracking-[0.3em] mb-4">Deposited_Matter</div>
         
         <button 
            onClick={handleMainAction}
            className="pointer-events-auto bg-orange-900/20 border border-orange-500/50 hover:bg-orange-500/20 hover:border-orange-400 text-orange-300 px-8 py-3 text-[10px] font-black tracking-[0.3em] uppercase transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] min-w-[240px]"
         >
            {getButtonText()}
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
        className="absolute top-0 left-0 bottom-10 z-40 bg-[#050505]/90 backdrop-blur-md border-r border-orange-900/20 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
        initial={{ width: 60 }}
        animate={{ width: isSidebarOpen ? 320 : 60 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        {/* Toggle Trigger */}
        <button 
          onClick={toggleSidebar}
          className="h-16 w-full flex flex-col items-center justify-center border-b border-orange-900/20 hover:bg-orange-900/10 transition-colors shrink-0 group"
        >
          <div className="w-5 flex flex-col space-y-1.5 items-center">
            <span className={`w-full h-[1px] bg-orange-600 transition-all duration-300 ${isSidebarOpen ? 'rotate-45 translate-y-2' : 'group-hover:w-3'}`} />
            <span className={`w-full h-[1px] bg-orange-600 transition-all duration-300 ${isSidebarOpen ? 'opacity-0' : ''}`} />
            <span className={`w-full h-[1px] bg-orange-600 transition-all duration-300 ${isSidebarOpen ? '-rotate-45 -translate-y-2' : 'group-hover:w-3'}`} />
          </div>
        </button>

        {/* Source Switcher Header (Visible when Open) */}
        {isSidebarOpen && (
            <div className="grid grid-cols-2 text-[8px] font-bold uppercase tracking-widest border-b border-orange-900/30 shrink-0">
                <button 
                    onClick={() => { playMechKey(); setDataSource('DNA'); }}
                    className={`py-3 flex items-center justify-center space-x-1 transition-all ${dataSource === 'DNA' ? 'bg-orange-900/40 text-white' : 'bg-black/40 text-orange-700 hover:text-orange-400'}`}
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
             <div className="h-full flex items-center justify-center text-[8px] text-orange-900 vertical-text opacity-50">
                {isSidebarOpen ? 'NO_DATA_STREAM' : 'EMPTY'}
             </div>
          ) : (
            activeList.map((entry) => {
              const isSelected = selectedId === entry.id;
              const isMapped = currentMappedId === entry.id;
              const label = getEntryLabel(entry);
              const colorClass = dataSource === 'DNA' ? 'orange' : 'purple';
              
              return (
                <div 
                  key={entry.id}
                  onClick={() => { if (isSidebarOpen) handleSelect(entry); }}
                  className={`
                    relative transition-all border-l-[3px] py-4
                    ${isSidebarOpen ? 'cursor-pointer' : 'cursor-default'}
                    ${isSelected 
                      ? `bg-${colorClass}-900/10 border-${colorClass}-400` 
                      : (isMapped ? `bg-${colorClass}-900/5 border-${colorClass}-700` : `hover:bg-${colorClass}-900/5 border-transparent hover:border-${colorClass}-900/30`)
                    }
                    ${isSidebarOpen ? 'px-6' : 'px-0 flex justify-center'}
                  `}
                >
                  {isSidebarOpen ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                      <div className="flex justify-between items-center mb-1">
                         <span className={`text-[9px] font-bold font-mono ${isMapped ? `text-${colorClass}-300` : `text-${colorClass}-700`}`}>{entry.timestamp}</span>
                         {(isSelected || isMapped) && <div className={`w-1.5 h-1.5 bg-${colorClass}-400 rounded-full animate-pulse shadow-[0_0_5px_currentColor]`} />}
                      </div>
                      <div className={`text-[11px] truncate font-mono tracking-tight uppercase ${isMapped ? `text-${colorClass}-300` : `text-${colorClass}-300/90`}`}>
                        {label}
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected || isMapped ? `bg-${colorClass}-400 shadow-[0_0_8px_currentColor]` : `bg-${colorClass}-900`}`} />
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
             <div className="pointer-events-auto h-full bg-[#080808]/95 border border-orange-900/40 p-8 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-600 to-transparent" />
                
                <div className="flex justify-between items-start mb-8 shrink-0">
                   <div>
                      <h2 className="text-lg font-black uppercase tracking-[0.2em] text-orange-100">Slime_Mold_Substrate</h2>
                      <span className="text-[9px] text-orange-700 font-bold tracking-[0.1em]">ID: {selectedEntryRaw.id}</span>
                   </div>
                   <button onClick={() => setSelectedId(null)} className="text-orange-800 hover:text-orange-400 transition-colors text-xl">×</button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-thin-scrollbar pr-4 space-y-8">
                   <div>
                      <div className="flex items-center space-x-2 mb-3 opacity-70">
                         <div className="w-1 h-1 bg-orange-500" />
                         <span className="text-[8px] text-orange-500 uppercase tracking-[0.2em] font-bold">Nutrient_Source_Data</span>
                      </div>
                      <p className="text-sm text-orange-50 leading-relaxed font-light whitespace-pre-wrap border-l-2 border-orange-900/30 pl-4 py-1">
                        {getEntryLabel(selectedEntryRaw)}
                      </p>
                   </div>

                   <div>
                      <div className="flex items-center space-x-2 mb-3 opacity-70">
                         <div className="w-1 h-1 bg-orange-500" />
                         <span className="text-[8px] text-orange-500 uppercase tracking-[0.2em] font-bold">Pheromone_Map</span>
                      </div>
                      <div className="bg-black border border-orange-900/20 p-4 text-[10px] text-orange-600/80 font-mono break-all leading-loose shadow-inner relative">
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_3px] opacity-50" />
                        {getEntryBinary(selectedEntryRaw)}
                      </div>
                   </div>
                </div>

                {/* --- MAPPING BUTTON (Action) --- */}
                <div className="mt-8 pt-6 border-t border-orange-900/30 shrink-0">
                   <button 
                     onClick={() => handleMapAndClose(selectedEntryRaw)}
                     className="w-full group relative px-6 py-4 bg-orange-900/20 border border-orange-500/50 hover:bg-orange-500/20 hover:border-orange-400 transition-all overflow-hidden"
                   >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent translate-x-[-100%] group-hover:animate-[scan_1s_ease-in-out]" />
                      <span className="relative z-10 text-[11px] font-black text-orange-300 tracking-[0.3em] uppercase group-hover:text-white group-hover:text-glow transition-colors">
                        [ START_EXPERIMENT / 开始实验 ]
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
            title="3D SLIME LAB [3D黏菌实验室]"
            subtitle="PROTOCOL_MANUAL_v3.0"
            items={SLIME_MANUAL_ITEMS}
            theme="orange"
            onClose={() => setShowHelp(false)}
          />
        )}
      </AnimatePresence>

      {/* --- Rolling Data Ticker --- */}
      {currentMappedEntry && (
        <div className="absolute bottom-0 left-0 w-full h-10 bg-[#020202] border-t border-orange-900/20 flex items-center overflow-hidden z-50">
           <div className="w-full flex items-center overflow-hidden">
              <div className="animate-ticker-infinite flex whitespace-nowrap space-x-12 opacity-80 hover:opacity-100 transition-opacity">
                 {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                       <span className="text-[8px] text-orange-800 font-bold uppercase tracking-widest">{currentMappedEntry.timestamp}</span>
                       <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">[{getEntryLabel(currentMappedEntry)}]</span>
                       <span className="text-[9px] text-orange-600/70 font-mono tracking-wider">
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
        .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.2); border-radius: 2px; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.5); }
        
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-infinite {
          animation: ticker-scroll 60s linear infinite;
          display: flex;
        }
        .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SlimeLab;
