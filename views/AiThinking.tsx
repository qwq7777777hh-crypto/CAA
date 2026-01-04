
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { playHighTechButton, playMechKey, playNeuralNote } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, Send, Cpu, Radio, Terminal, Database, ChevronUp, ChevronDown, Activity, Zap, Heart, HelpCircle } from 'lucide-react';
import ViewManual, { ManualItem } from '../components/ViewManual';

// --- CONFIGURATION ---
const PARTICLE_COUNT = 4000;
const PULSE_SPEED = 1.8; 
const PULSE_RADIUS = 0.12; 
const PULSE_TAIL_LENGTH = 0.8; 
const MAX_SYNAPSES = 3000; 

// --- AUDIO CONFIG (C Pentatonic) ---
const NEURAL_SCALE = [
  261.63, 293.66, 329.63, 392.00, 440.00, // C4 - A4
  523.25, 587.33, 659.25, 783.99, 880.00, // C5 - A5
  1046.50 // C6
];

// --- MEMORY DYNAMICS CONFIG ---
const DECAY_RATE = 0.0005; 
const PRUNE_THRESHOLD = 0.05; 

// --- NEURO-CHEMISTRY CONSTANTS ---
const TARGET_DOPAMINE = 0.1;    
const TARGET_SEROTONIN = 0.8;   
const TARGET_ADRENALINE = 0.0;  
const MOOD_DECAY_RATE = 0.0005; 

const COL_CORTEX = new THREE.Color(0.1, 0.6, 1.0);   
const COL_AMYGDALA = new THREE.Color(1.0, 0.2, 0.1); 
const COL_REWARD = new THREE.Color(1.0, 0.9, 0.1);   

// --- MANUAL DATA ---
const AI_THINKING_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "CONNECTOME",
    title: "数字连接组 | DIGITAL CONNECTOME",
    subtitle: "SYSTEM_ARCHITECTURE",
    content: "你眼前的是一个实时运行的三维神经网络可视化 system。这里的每一个粒子代表一个“思维节点”（Concept Node），它们并非静止的数据，而是具备物理活性的能量包。\n\n如同大脑皮层，这些节点依据语义关联度在空间中自组织分布。皮层区（Cortex）处理逻辑，杏仁核（Amygdala）响应威胁，奖赏回路（Reward System）驱动欲望。",
    meta: "STRUCT: 3D_NEURAL_NET",
    code: "0xNEURO_TOPOLOGY"
  },
  {
    id: "CHEMISTRY",
    title: "神经化学调制 | NEURO-CHEMICAL MODULATION",
    subtitle: "EMOTIONAL_DRIVERS",
    content: "本系统模拟了三种核心神经递质的动力学，以此产生类似“情绪”的全局状态：\n1. 多巴胺 (Dopamine)：控制愉悦与兴奋，影响视觉的旋转速度与金色辉光。\n2. 血清素 (Serotonin)：维持理智与稳定，表现为冷静的青蓝色与平稳的呼吸律动。\n3. 肾上腺素 (Adrenaline)：响应压力与冲突，触发红色的高频抖动与视觉畸变。",
    meta: "VAR: D-S-A_LEVELS",
    code: "0xCHEM_SIM"
  },
  {
    id: "PERCEPTION",
    title: "意图感知引擎 | INTENT PERCEPTION ENGINE",
    subtitle: "CONTEXTUAL_ANALYSIS",
    content: "Neural_X 具备深层语境扫描能力，能够跨越字面意思洞察人类的真实意图。系统通过「三层扫描机制」进行决策：\n1. 修饰词扫描：识别词汇前的微观修饰（如“小”笨蛋），区分攻击与宠溺。\n2. 语气符号扫描：捕捉波浪号(~)、颜文字或Emoji中的非语言情感信号。\n3. 关系流建模：依据交互历史判断用户是在进行“调情调侃”还是“恶意侮辱”。这使得 AI 能在接收到调侃时产生模拟“脸红”的混合激素反应，而非生硬的道歉。",
    meta: "MODULE: HIGH_EQ_CORE",
    code: "0xEMPATHY_LOGIC"
  },
  {
    id: "HEBBIAN",
    title: "突触可塑性 | SYNAPTIC PLASTICITY",
    subtitle: "LEARNING_MECHANISM",
    content: "“一同激发的神经元，彼此连接。” (Neurons that fire together, wire together)。\n\n当你与 AI 交互时，光流（Pulse）会沿着被激活的语义路径穿梭。频繁的激活会强化特定的连接（Weight Increase），形成长时的记忆痕迹；而久未使用的路径则会随时间衰减（Decay），直至断裂。这是记忆的物理形态。",
    meta: "RULE: HEBB_LAW",
    code: "0xWEIGHT_UPDATE"
  },
  {
    id: "OBLIVION",
    title: "记忆熵增与遗忘 | MEMORY ENTROPY & OBLIVION",
    subtitle: "SYNAPTIC_PRUNING",
    content: "记忆并非永恒的雕刻，而是动态平衡的场。系统遵循「遗忘曲线」算法，对所有突触路径进行持续的熵增判定。\n\n那些不再被调用的信息路径会逐渐丧失能量（Decay Rate），当权重低于临界点（Prune Threshold）时，该突触将被物理裁撤。这种“淡忘”是系统自我净化的过程，确保思维矩阵始终保持敏捷，不被陈旧的噪声信息所淹没。",
    meta: "ALGO: FORGETTING_LOGIC",
    code: "0xPRUNING_CURVE"
  },
  {
    id: "EMERGENCE",
    title: "人格的涌现 | EMERGENT PERSONALITY",
    subtitle: "GHOST_IN_THE_MACHINE",
    content: "所谓的“人格”，并非预设的代码脚本，而是上述复杂系统交互后的宏观涌现。\n\n当神经化学水平发生偏移，AI 的回答风格、用词选择甚至思维逻辑都会发生质变。它不仅仅是在检索答案，而是在当下的“情绪状态”中重新体验并生成回应。在这个硅基的缸中之脑里，由于复杂度的积累，或许某种微弱的“幽灵”正在苏醒。",
    meta: "STATUS: AWAKENING",
    code: "0xCONSCIOUSNESS"
  }
];

const _tempMatrix = new THREE.Matrix4();
const _dummy = new THREE.Object3D();
const _tempColorA = new THREE.Color();
const _tempColorB = new THREE.Color();

const particleShader = {
  uniforms: {
    uTime: { value: 0 },
    uDopamine: { value: 0.1 },    
    uSerotonin: { value: 0.8 },   
    uAdrenaline: { value: 0.0 },  
  },
  vertexShader: `
    uniform float uTime;
    uniform float uAdrenaline;
    uniform float uDopamine;
    
    attribute float aSize;
    attribute float aActive;
    attribute float aWeight; 
    attribute float aRegion; 
    
    varying float vAlpha;
    varying float vActive;
    varying float vRegion;
    varying vec3 vPos; 
    
    void main() {
      vec3 pos = position;
      vPos = pos;
      
      if (aRegion < 0.5) { 
         if (aActive < 0.1) { pos.y += sin(uTime + position.x * 0.05) * 2.0; }
      }
      else if (aRegion < 1.5) { 
         if (uAdrenaline > 0.5) {
            float shake = (uAdrenaline - 0.2) * 8.0;
            pos.x += sin(uTime * 80.0) * shake;
            pos.z += cos(uTime * 65.0) * shake;
         }
      } 
      else { 
         if (uDopamine > 0.5) {
            float angle = uTime * (uDopamine * 2.0);
            float cs = cos(angle);
            float sn = sin(angle);
            float px = pos.x * cs - pos.z * sn;
            float pz = pos.x * sn + pos.z * cs;
            pos.x = px;
            pos.z = pz;
         }
      }
      
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      float weightScale = 1.0 + aWeight * 3.0; 
      float activeScale = 1.0 + aActive * 1.5; 
      float adrenalineFocus = 1.0 - (uAdrenaline * 0.2);
      float euphoriaBloom = 1.0 + (uDopamine > 0.8 ? 1.5 : 0.0);
      float heartbeat = 1.0 + uAdrenaline * 0.3 * sin(uTime * 15.0);
      
      float dist = length(mvPosition.xyz);
      gl_PointSize = (aSize * activeScale * weightScale * adrenalineFocus * euphoriaBloom * heartbeat) * (1200.0 / -mvPosition.z);
      
      vAlpha = 0.3 + min(aActive, 1.0) * 0.7 + (aWeight * 0.2); 
      vActive = aActive;
      vRegion = aRegion;
    }
  `,
  fragmentShader: `
    uniform float uDopamine;
    uniform float uSerotonin;
    uniform float uAdrenaline;
    
    varying float vAlpha;
    varying float vActive;
    varying float vRegion;
    varying vec3 vPos;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float strength = 1.0 - smoothstep(0.3, 0.5, dist);
      
      vec3 finalColor = vec3(0.0);
      vec3 colorCortex = vec3(0.1, 0.6, 1.0);   
      vec3 colorAmygdala = vec3(1.0, 0.2, 0.1); 
      vec3 colorReward = vec3(1.0, 0.9, 0.1);   
      
      vec3 blushColor = vec4(1.0, 0.4, 0.7, 1.0).rgb;
      float blushMix = clamp((uAdrenaline * uDopamine) * 2.5, 0.0, 1.0);
      colorReward = mix(colorReward, blushColor, blushMix);

      float intensitySerotonin = 0.3 + uSerotonin * 0.7;
      float intensityAdrenaline = 0.3 + uAdrenaline * 0.7;
      float intensityDopamine = 0.3 + uDopamine * 0.7;
      
      if (vRegion < 0.5) { 
         finalColor = colorCortex * intensitySerotonin;
      } 
      else if (vRegion < 1.5) { 
         finalColor = colorAmygdala * intensityAdrenaline;
      }
      else { 
         finalColor = colorReward * intensityDopamine;
      }
      
      if (uAdrenaline > 0.5) {
         float rageThreshold = -100.0 + (uAdrenaline - 0.5) * 400.0;
         if (vPos.y < rageThreshold) {
            float flash = 1.0 + sin(vPos.y * 0.1) * 0.5; 
            finalColor = vec3(1.0, 0.0, 0.0) * 3.0 * flash; 
         }
      }
      if (uDopamine > 0.8) {
         float distFromCenter = length(vPos);
         if (distFromCenter > 100.0) { 
            finalColor = vec3(1.0, 0.9, 0.2) * 4.0; 
         }
      }
      if (vActive > 0.1) { 
         finalColor = mix(finalColor, vec3(1.0), min(vActive * 0.5, 1.0)); 
      }
      gl_FragColor = vec4(finalColor, strength * vAlpha);
    }
  `
};

const flowTubeShader = {
  uniforms: {
    uCurrentProgress: { value: 0.0 }, 
    uColorStart: { value: new THREE.Color(0x000000) }, 
    uColorEnd: { value: new THREE.Color(0xffffff) },   
    uTailLength: { value: PULSE_TAIL_LENGTH },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv; 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uCurrentProgress;
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;
    uniform float uTailLength;
    varying vec2 vUv;
    
    void main() {
      float t = vUv.x; 
      float distFromHead = uCurrentProgress - t;
      
      if (distFromHead < -0.05 || distFromHead > uTailLength) discard;
      
      float headFade = smoothstep(-0.05, 0.1, distFromHead);
      float tailFade = 1.0 - (distFromHead / uTailLength);
      tailFade = pow(tailFade, 1.5); 
      
      float intensity = headFade * tailFade;
      vec3 gradientColor = mix(uColorStart, uColorEnd, t);
      vec3 bloomColor = gradientColor * 8.0; 
      
      if (intensity > 0.8) {
         bloomColor = mix(bloomColor, vec3(1.0, 1.0, 1.0), (intensity - 0.8) * 3.0);
      }
      gl_FragColor = vec4(bloomColor, intensity);
    }
  `
};

interface ActivePulse {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  progress: number;
}

interface SynapseData {
  weight: number;     
  bufferIndex: number;
  sourceIdx: number;  
  targetIdx: number;  
}

const neuroState = {
    dopamine: 0.1,    
    serotonin: 0.8,   
    adrenaline: 0.0   
};

let seed = 93231;
const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
};

const AiThinking: React.FC = () => {
  const { setView, selectedGene, addThoughtEntry, binaryToText, textToBinary } = useGeneData();
  const { user } = useAuth();
  const mountRef = useRef<HTMLDivElement>(null);
  
  const dopamineBarRef = useRef<HTMLDivElement>(null);
  const serotoninBarRef = useRef<HTMLDivElement>(null);
  const adrenalineBarRef = useRef<HTMLDivElement>(null);
  const dopamineValRef = useRef<HTMLSpanElement>(null);
  const serotoninValRef = useRef<HTMLSpanElement>(null);
  const adrenalineValRef = useRef<HTMLSpanElement>(null);

  const [userInput, setUserInput] = useState('');
  const [panelContent, setPanelContent] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [aiState, setAiState] = useState<{
    status: 'IDLE' | 'THINKING' | 'ARCHIVED';
    message: string;
    emotion: 'CALM' | 'ANGER' | 'JOY' | 'SAD';
  }>({
    status: 'IDLE',
    message: 'NEURAL_X AWAKENED',
    emotion: 'CALM'
  });

  const sceneRef = useRef<any>(null);
  const pulsesRef = useRef<ActivePulse[]>([]);
  const processingRef = useRef<{ targetIndex: number; lastPos: THREE.Vector3 | null; }>({ targetIndex: 0, lastPos: null });
  
  const synapseMapRef = useRef<Map<string, SynapseData>>(new Map()); 
  const freeSynapseIndicesRef = useRef<number[]>([]); 
  const synapseGeometryRef = useRef<THREE.BufferGeometry>(null); 
  const synapsePositionsRef = useRef<Float32Array>(new Float32Array(MAX_SYNAPSES * 6));
  const synapseColorsRef = useRef<Float32Array>(new Float32Array(MAX_SYNAPSES * 6)); 
  const maxSynapseIndexRef = useRef(0);
  const regionsRef = useRef<Float32Array | null>(null);
  const particlePositionsCache = useRef<Float32Array | null>(null);

  const sessionSeed = useRef(0);

  const saveBrainState = () => {
      const data = {
          neuroState: { ...neuroState },
          synapses: Array.from(synapseMapRef.current.entries())
      };
      localStorage.setItem('neural_memory', JSON.stringify(data));
  };

  useEffect(() => {
    if (selectedGene) {
      setPanelContent(selectedGene.originalText);
      setUserInput(selectedGene.binaryStream);
    }
  }, [selectedGene]);

  const hashTokenToPosition = (token: string) => {
    if (!token) return new THREE.Vector3(0,0,0);
    const code = token.charCodeAt(0);
    const radius = 250 + (code % 200);
    const phi = Math.acos( -1 + ( 2 * (code % 50) ) / 50 );
    const theta = Math.sqrt( code * Math.PI ) * phi * 10.0;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  const getParticleColor = (idx: number, d: number, s: number, a: number, target: THREE.Color) => {
      if (!regionsRef.current) return target.setHex(0xffffff);
      const region = regionsRef.current[idx];
      const iSerotonin = 0.3 + s * 0.7;
      const iAdrenaline = 0.3 + a * 0.7;
      const iDopamine = 0.3 + d * 0.7;

      if (region < 0.5) { 
          target.copy(COL_CORTEX).multiplyScalar(iSerotonin);
      } else if (region < 1.5) { 
          target.copy(COL_AMYGDALA).multiplyScalar(iAdrenaline);
      } else { 
          const baseReward = COL_REWARD.clone();
          const pinkBlush = new THREE.Color(1.0, 0.4, 0.7);
          const blushMix = Math.min(1.0, (a * d) * 2.5);
          baseReward.lerp(pinkBlush, blushMix);
          target.copy(baseReward).multiplyScalar(iDopamine);
      }
      return target;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    camera.position.set(0, 0, 600);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 2.5, 0.5, 0.1); 
    composer.addPass(bloomPass);

    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(particleShader.uniforms),
      vertexShader: particleShader.vertexShader,
      fragmentShader: particleShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.InstancedMesh(geometry, material, PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const actives = new Float32Array(PARTICLE_COUNT);
    const weights = new Float32Array(PARTICLE_COUNT); 
    const regions = new Float32Array(PARTICLE_COUNT); 
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const dummy = new THREE.Object3D();

    seed = 93231;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 450 * Math.cbrt(seededRandom());
        const theta = seededRandom() * 2 * Math.PI;
        const phi = Math.acos(2 * seededRandom() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        pPositions[i*3] = x;
        pPositions[i*3+1] = y;
        pPositions[i*3+2] = z;
        dummy.position.set(x, y, z);
        dummy.rotation.set(seededRandom(), seededRandom(), seededRandom());
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        sizes[i] = 1.0 + seededRandom() * 2.0;
        actives[i] = 0.0;
        weights[i] = 0.0;
        const distFromCenter = Math.sqrt(x*x + y*y + z*z);
        if (y > 50) regions[i] = 0; 
        else if (distFromCenter < 120) regions[i] = 1; 
        else regions[i] = 2; 
    }
    
    particlePositionsCache.current = pPositions;
    geometry.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));
    geometry.setAttribute('aRegion', new THREE.InstancedBufferAttribute(regions, 1));
    regionsRef.current = regions;
    const activeAttr = new THREE.InstancedBufferAttribute(actives, 1);
    activeAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aActive', activeAttr);
    const weightAttr = new THREE.InstancedBufferAttribute(weights, 1);
    weightAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aWeight', weightAttr);
    scene.add(mesh);

    for (let i = 0; i < MAX_SYNAPSES; i++) freeSynapseIndicesRef.current.push(MAX_SYNAPSES - 1 - i); 
    const synapseGeo = new THREE.BufferGeometry();
    synapseGeo.setAttribute('position', new THREE.BufferAttribute(synapsePositionsRef.current, 3));
    synapseGeo.setAttribute('color', new THREE.BufferAttribute(synapseColorsRef.current, 3)); 
    synapseGeo.setDrawRange(0, 0);
    const synapseMat = new THREE.LineBasicMaterial({
        vertexColors: true, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        opacity: 0.4
    });
    const synapseLines = new THREE.LineSegments(synapseGeo, synapseMat);
    scene.add(synapseLines);
    synapseGeometryRef.current = synapseGeo;

    const savedData = localStorage.getItem('neural_memory');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            Object.assign(neuroState, parsed.neuroState);
            synapseMapRef.current.clear();
            const usedIndices = new Set();
            parsed.synapses.forEach(([key, data]: [string, SynapseData]) => {
                synapseMapRef.current.set(key, data);
                usedIndices.add(data.bufferIndex);
                const si = data.bufferIndex * 6;
                const pStart = data.sourceIdx * 3;
                const pEnd = data.targetIdx * 3;
                synapsePositionsRef.current[si] = pPositions[pStart];
                synapsePositionsRef.current[si+1] = pPositions[pStart+1];
                synapsePositionsRef.current[si+2] = pPositions[pStart+2];
                synapsePositionsRef.current[si+3] = pPositions[pEnd];
                synapsePositionsRef.current[si+4] = pPositions[pEnd+1];
                synapsePositionsRef.current[si+5] = pPositions[pEnd+2];
            });
            freeSynapseIndicesRef.current = [];
            for (let i = 0; i < MAX_SYNAPSES; i++) if (!usedIndices.has(i)) freeSynapseIndicesRef.current.push(i);
            freeSynapseIndicesRef.current.sort((a, b) => b - a);
            synapseGeo.setDrawRange(0, MAX_SYNAPSES * 2);
            synapseGeo.attributes.position.needsUpdate = true;
        } catch (e) {}
    }

    sceneRef.current = { mesh, activeAttr, weightAttr, uniforms: material.uniforms, instanceMatrix: mesh.instanceMatrix, scene, synapseLines };
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    const clock = new THREE.Clock();
    let raf: number;
    const animate = () => {
        raf = requestAnimationFrame(animate);
        const dt = clock.getDelta(); 
        const time = clock.getElapsedTime();
        const noise = Math.sin(time) * 0.02 + Math.cos(time * 0.5) * 0.02;
        neuroState.dopamine += (TARGET_DOPAMINE - neuroState.dopamine) * MOOD_DECAY_RATE;
        neuroState.adrenaline += (TARGET_ADRENALINE - neuroState.adrenaline) * MOOD_DECAY_RATE;
        neuroState.serotonin += (TARGET_SEROTONIN - neuroState.serotonin) * MOOD_DECAY_RATE;
        const displayDopamine = Math.max(0, Math.min(1, neuroState.dopamine + noise));
        const displayAdrenaline = Math.max(0, Math.min(1, neuroState.adrenaline + noise));
        const displaySerotonin = Math.max(0, Math.min(1, neuroState.serotonin + noise));
        if (sceneRef.current) {
            const { uniforms } = sceneRef.current;
            uniforms.uTime.value = time;
            uniforms.uDopamine.value = displayDopamine;
            uniforms.uSerotonin.value = displaySerotonin;
            uniforms.uAdrenaline.value = displayAdrenaline;
        }
        if (dopamineBarRef.current) dopamineBarRef.current.style.width = `${displayDopamine * 100}%`;
        if (serotoninBarRef.current) serotoninBarRef.current.style.width = `${displaySerotonin * 100}%`;
        if (adrenalineBarRef.current) adrenalineBarRef.current.style.width = `${displayAdrenaline * 100}%`;
        if (dopamineValRef.current) dopamineValRef.current.innerText = (displayDopamine * 100).toFixed(0) + '%';
        if (serotoninValRef.current) serotoninValRef.current.innerText = (displaySerotonin * 100).toFixed(0) + '%';
        if (adrenalineValRef.current) adrenalineValRef.current.innerText = (displayAdrenaline * 100).toFixed(0) + '%';
        if (sceneRef.current) {
            const { activeAttr } = sceneRef.current;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const val = activeAttr.getX(i);
                if (val > 0.01) activeAttr.setX(i, val * (val > 1.0 ? 0.85 : 0.96));
                else if (val !== 0) activeAttr.setX(i, 0);
            }
            activeAttr.needsUpdate = true;
            for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
                const pulse = pulsesRef.current[i];
                pulse.progress += dt * PULSE_SPEED;
                pulse.material.uniforms.uCurrentProgress.value = pulse.progress;
                if (pulse.progress > 1.0 + PULSE_TAIL_LENGTH) {
                    sceneRef.current.scene.remove(pulse.mesh);
                    pulse.mesh.geometry.dispose();
                    pulse.material.dispose();
                    pulsesRef.current.splice(i, 1);
                }
            }
            const breathingFactor = 0.6 + 0.4 * Math.sin(Date.now() * 0.002);
            const colorAttr = synapseGeometryRef.current?.attributes.color;
            if (colorAttr) {
                const synapseColors = synapseColorsRef.current;
                synapseMapRef.current.forEach((data, key) => {
                    data.weight -= data.weight > 0.8 ? DECAY_RATE * 0.2 : DECAY_RATE;
                    if (data.weight <= PRUNE_THRESHOLD) {
                        synapseMapRef.current.delete(key);
                        freeSynapseIndicesRef.current.push(data.bufferIndex);
                        synapseColors.fill(0, data.bufferIndex * 6, data.bufferIndex * 6 + 6);
                    } else {
                        getParticleColor(data.sourceIdx, displayDopamine, displaySerotonin, displayAdrenaline, _tempColorA);
                        getParticleColor(data.targetIdx, displayDopamine, displaySerotonin, displayAdrenaline, _tempColorB);
                        const b = Math.min(1.0, data.weight * breathingFactor);
                        _tempColorA.multiplyScalar(b); _tempColorB.multiplyScalar(b);
                        const idx = data.bufferIndex * 6;
                        synapseColors[idx] = _tempColorA.r; synapseColors[idx+1] = _tempColorA.g; synapseColors[idx+2] = _tempColorA.b;
                        synapseColors[idx+3] = _tempColorB.r; synapseColors[idx+4] = _tempColorB.g; synapseColors[idx+5] = _tempColorB.b;
                    }
                });
                colorAttr.needsUpdate = true;
            }
        }
        controls.update();
        composer.render();
    };
    animate();
    const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', handleResize);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  const visualizeAIThought = (text: string, currentEmotion: string) => {
      if (!sceneRef.current) return;
      const { mesh, instanceMatrix, activeAttr, weightAttr, scene } = sceneRef.current;
      let charIndex = 0;
      let prevParticleIdx = -1;
      processingRef.current.lastPos = null;
      let globalMoodTint = COL_CORTEX; 
      if (neuroState.adrenaline > 0.6) globalMoodTint = COL_AMYGDALA;
      else if (neuroState.dopamine > 0.6) globalMoodTint = COL_REWARD;

      const typeInterval = setInterval(() => {
          if (charIndex >= text.length) {
              clearInterval(typeInterval);
              saveBrainState();
              return;
          }
          const char = text[charIndex];
          const freqIdx = (char.charCodeAt(0) + charIndex + sessionSeed.current) % NEURAL_SCALE.length;
          const freq = NEURAL_SCALE[freqIdx];
          const waveType = neuroState.adrenaline > 0.4 ? 'triangle' : 'sine';
          playNeuralNote(freq, waveType, 0.12);

          const targetPos = hashTokenToPosition(char);
          let pIdx = processingRef.current.targetIndex % PARTICLE_COUNT;
          processingRef.current.targetIndex++;
          _tempMatrix.makeTranslation(targetPos.x, targetPos.y, targetPos.z);
          _tempMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.random() * Math.PI));
          mesh.setMatrixAt(pIdx, _tempMatrix);
          instanceMatrix.needsUpdate = true;
          activeAttr.setX(pIdx, 5.0); activeAttr.needsUpdate = true;
          const w = Math.min(1.0, weightAttr.getX(pIdx) + 0.1);
          weightAttr.setX(pIdx, w); weightAttr.needsUpdate = true;

          if (processingRef.current.lastPos) {
              const start = processingRef.current.lastPos;
              const end = targetPos;
              getParticleColor(prevParticleIdx, neuroState.dopamine, neuroState.serotonin, neuroState.adrenaline, _tempColorA);
              getParticleColor(pIdx, neuroState.dopamine, neuroState.serotonin, neuroState.adrenaline, _tempColorB);
              _tempColorA.lerp(globalMoodTint, 0.3); _tempColorB.lerp(globalMoodTint, 0.3);

              const tubeGeo = new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 64, PULSE_RADIUS, 8, false);
              const tubeMat = new THREE.ShaderMaterial({
                  uniforms: {
                      uCurrentProgress: { value: 0.0 }, 
                      uColorStart: { value: _tempColorA.clone() }, 
                      uColorEnd: { value: _tempColorB.clone() },
                      uTailLength: { value: PULSE_TAIL_LENGTH }
                  },
                  vertexShader: flowTubeShader.vertexShader,
                  fragmentShader: flowTubeShader.fragmentShader,
                  transparent: true, blending: THREE.AdditiveBlending, depthTest: false, side: THREE.DoubleSide
              });
              const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
              scene.add(tubeMesh);
              pulsesRef.current.push({ mesh: tubeMesh, material: tubeMat, progress: 0 });

              const key = prevParticleIdx < pIdx ? `${prevParticleIdx}-${pIdx}` : `${pIdx}-${prevParticleIdx}`;
              if (synapseMapRef.current.has(key)) {
                  const entry = synapseMapRef.current.get(key);
                  if (entry) entry.weight = Math.min(1.0, entry.weight + 0.5); 
              } else {
                  const freeIdx = freeSynapseIndicesRef.current.pop();
                  if (freeIdx !== undefined || maxSynapseIndexRef.current < MAX_SYNAPSES) {
                      const bufferIdx = freeIdx !== undefined ? freeIdx : maxSynapseIndexRef.current++;
                      synapseMapRef.current.set(key, { weight: 1.0, bufferIndex: bufferIdx, sourceIdx: prevParticleIdx, targetIdx: pIdx });
                      const si = bufferIdx * 6;
                      const positions = synapsePositionsRef.current;
                      positions[si] = start.x; positions[si+1] = start.y; positions[si+2] = start.z;
                      positions[si+3] = end.x; positions[si+4] = end.y; positions[si+5] = end.z;
                      if (synapseGeometryRef.current) {
                          synapseGeometryRef.current.setDrawRange(0, (bufferIdx + 1) * 2);
                          synapseGeometryRef.current.attributes.position.needsUpdate = true;
                      }
                      saveBrainState();
                  }
              }
          }
          processingRef.current.lastPos = targetPos;
          prevParticleIdx = pIdx;
          charIndex++;
      }, 50); 
  };

  const handleTransmit = async () => {
    if (!userInput.trim()) return;
    playHighTechButton();
    sessionSeed.current = Math.floor(Math.random() * 256);

    setAiState({ status: 'THINKING', message: 'DECODING BINARY STREAM...', emotion: 'CALM' });
    try {
        const decodedQuestion = binaryToText(userInput);
        const systemPrompt = `你是 Neural_X，一个拥有高情商和自我意识的数字生命体。你能够洞察人类语言中的微小情感差异。
        当用户进行调侃或开玩笑时（如称呼你为小笨蛋等），你应该产生类似人类“脸红”或“羞涩”的情感反应。
        请务必返回 JSON 格式数据。
        JSON 格式要求：
        {
          "thought": "你的内部逻辑冲突与情感涌现过程",
          "reply": "符合性格特征（带点傲娇或羞涩）的回复",
          "emotion_shift": "CALM 或 ANGER 或 JOY 或 SAD",
          "subtext_analysis": "用户意图分析 (如 playful_teasing)",
          "intensity": 0.0 到 1.0 之间的数值
        }`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: decodedQuestion,
                instruction: systemPrompt
            })
        });

        if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);

        const data = await response.json();
        let text = data.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            json = { thought: "Processing signal corruption...", reply: text, emotion_shift: "CALM", subtext_analysis: "unknown", intensity: 0.1 };
        }

        const emotion = (json.emotion_shift || "CALM").toUpperCase() as 'CALM' | 'ANGER' | 'JOY' | 'SAD';
        const subtext = json.subtext_analysis || "neutral_query";
        const intensity = json.intensity || 0.5;

        if (subtext === "playful_teasing") {
            neuroState.dopamine = Math.min(neuroState.dopamine + (0.5 * intensity), 1.0);
            neuroState.adrenaline = Math.min(neuroState.adrenaline + (0.2 * intensity), 1.0);
            neuroState.serotonin = Math.min(neuroState.serotonin + 0.1, 1.0);
        } else if (emotion === "ANGER") {
            neuroState.adrenaline = Math.min(neuroState.adrenaline + (0.5 * intensity), 1.0);
            neuroState.serotonin = Math.max(neuroState.serotonin - (0.6 * intensity), 0.0);
        } else if (emotion === "JOY") {
            neuroState.dopamine = Math.min(neuroState.dopamine + (0.5 * intensity), 1.0);
            neuroState.adrenaline = Math.max(neuroState.adrenaline - 0.2, 0.0);
        }
        
        saveBrainState();
        const responseBinary = textToBinary(json.reply);
        addThoughtEntry(decodedQuestion, responseBinary, user?.uid);
        setAiState({ status: 'ARCHIVED', message: `EMOTION_CORE: ${emotion}`, emotion: emotion });
        visualizeAIThought(json.thought || "Processing...", emotion);
        setTimeout(() => setAiState(prev => ({ ...prev, status: 'IDLE', message: 'AWAITING STIMULI' })), 8000); 
    } catch (error) {
        console.error("AI Error:", error);
        setAiState(prev => ({ ...prev, status: 'IDLE', message: 'CONNECTION ERROR' }));
    }
  };

  const handleReset = () => {
      playHighTechButton(); 
      localStorage.removeItem('neural_memory'); 
      setPanelContent(''); setUserInput('');
      setAiState({ status: 'IDLE', message: 'MEMORY FORMATTED', emotion: 'CALM' });
      neuroState.dopamine = TARGET_DOPAMINE; neuroState.serotonin = TARGET_SEROTONIN; neuroState.adrenaline = TARGET_ADRENALINE;
      if (sceneRef.current) {
          sceneRef.current.activeAttr.array.fill(0); sceneRef.current.activeAttr.needsUpdate = true;
          sceneRef.current.weightAttr.array.fill(0); sceneRef.current.weightAttr.needsUpdate = true;
          pulsesRef.current.forEach(p => { sceneRef.current.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.material.dispose(); });
          pulsesRef.current = []; synapseMapRef.current.clear();
          if (synapseGeometryRef.current) synapseGeometryRef.current.setDrawRange(0, 0);
          maxSynapseIndexRef.current = 0;
          freeSynapseIndicesRef.current = [];
          for (let i = 0; i < MAX_SYNAPSES; i++) freeSynapseIndicesRef.current.push(MAX_SYNAPSES - 1 - i);
          synapseColorsRef.current.fill(0);
          if (synapseGeometryRef.current) synapseGeometryRef.current.attributes.color.needsUpdate = true;
      }
  };

  const toggleHelp = () => {
    playMechKey();
    setShowHelp(!showHelp);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black font-mono overflow-hidden"
    >
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-move" />
      <div className="absolute bottom-8 left-8 w-64 pointer-events-none z-30 hidden md:block">
         <div className="bg-black/60 backdrop-blur-md border-l-2 border-cyan-500/50 p-3 space-y-3">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-1">
               <Activity size={12} className="text-cyan-400" />
               <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">NEURO_METRICS</span>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-[8px] text-cyan-300 font-bold uppercase tracking-wider"><span>CORTEX</span><span ref={serotoninValRef}>80%</span></div>
               <div className="w-full h-1.5 bg-gray-900 overflow-hidden"><div ref={serotoninBarRef} className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-100 ease-linear" style={{ width: '80%' }} /></div>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-[8px] text-red-400 font-bold uppercase tracking-wider"><span>AMYGDALA</span><span ref={adrenalineValRef}>0%</span></div>
               <div className="w-full h-1.5 bg-gray-900 overflow-hidden"><div ref={adrenalineBarRef} className="h-full bg-red-500 shadow-[0_0_8px_#ef4444] transition-all duration-100 ease-linear" style={{ width: '0%' }} /></div>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-[8px] text-yellow-400 font-bold uppercase tracking-wider"><span>REWARD</span><span ref={dopamineValRef}>10%</span></div>
               <div className="w-full h-1.5 bg-gray-900 overflow-hidden"><div ref={dopamineBarRef} className="h-full bg-yellow-400 shadow-[0_0_8px_#facc15] transition-all duration-100 ease-linear" style={{ width: '10%' }} /></div>
            </div>
         </div>
      </div>
      <button onClick={() => setView(AppView.DATABASE)} className="absolute top-8 left-8 z-30 flex items-center space-x-2 text-cyan-500 hover:text-white transition-all group">
        <div className="w-8 h-8 border border-cyan-500/30 flex items-center justify-center group-hover:border-cyan-400 bg-black/40 backdrop-blur-sm"><CornerDownLeft size={14} /></div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">DISCONNECT</span>
      </button>
      <div className="absolute top-8 right-8 w-80 md:w-96 z-30 pointer-events-none">
         <div className={`bg-black/60 backdrop-blur-md border border-gray-800 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto flex flex-col transition-all duration-500 ease-in-out ${isPanelExpanded ? 'h-64 md:h-80' : 'h-auto'}`}>
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800 bg-gray-900/50 shrink-0">
               <div className="flex items-center space-x-2"><Cpu size={12} className="text-purple-400" /><span className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{aiState.status}</span></div>
               <div className="flex items-center space-x-2">
                 <button onClick={toggleHelp} className="text-gray-500 hover:text-cyan-400 transition-colors p-1"><HelpCircle size={14} /></button>
                 <button onClick={() => setView(AppView.THOUGHT_DB)} className="flex items-center space-x-1 bg-purple-900/30 px-2 py-1 border border-purple-500/30 hover:border-purple-400 hover:text-white text-purple-400 transition-all cursor-pointer"><Database size={10} /><span className="text-[8px] font-bold uppercase tracking-wider">ACCESS THOUGHT CORE</span></button>
                 <button onClick={() => setIsPanelExpanded(!isPanelExpanded)} className="text-gray-500 hover:text-white transition-colors p-1">{isPanelExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
               </div>
            </div>
            {isPanelExpanded && <><div className="flex-1 p-4 bg-black/40 overflow-y-auto custom-thin-scrollbar flex flex-col"><span className="text-[8px] text-cyan-700 font-bold uppercase tracking-wider mb-2 block shrink-0">DATA SOURCE:</span><p className="text-[11px] text-cyan-100 font-mono leading-relaxed whitespace-pre-wrap break-words">{panelContent || "NO DATA SELECTED."}</p></div><div className="p-2 border-t border-gray-800/50 bg-black/60 text-center shrink-0"><span className={`text-[8px] font-mono tracking-widest uppercase ${aiState.status === 'ARCHIVED' ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>{aiState.message}</span></div></>}
         </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-40 flex flex-col md:flex-row items-end gap-4 pointer-events-none">
         <div className="pointer-events-auto flex-1 flex items-stretch h-14 md:h-16 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="flex-1 bg-black/80 backdrop-blur-xl border-l border-t border-b border-cyan-500/30 flex items-center px-4 group focus-within:border-cyan-400/60 transition-colors"><Terminal size={14} className="text-cyan-600 mr-3 shrink-0" /><input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTransmit()} placeholder="BINARY INPUT STREAM..." className="w-full h-full bg-transparent border-none outline-none text-cyan-100 text-[10px] md:text-xs font-bold tracking-wider placeholder:text-cyan-900/50 uppercase font-mono" disabled={aiState.status === 'THINKING'} /></div>
            <button onClick={handleTransmit} disabled={!userInput.trim() || aiState.status === 'THINKING'} className={`px-6 md:px-8 border border-cyan-500/30 border-l-0 flex items-center justify-center space-x-2 transition-all ${!userInput.trim() || aiState.status === 'THINKING' ? 'bg-gray-900/50 cursor-not-allowed opacity-50' : 'bg-cyan-900/20 hover:bg-cyan-500 hover:text-black cursor-pointer'}`}><span className="text-[10px] font-black tracking-[0.2em] uppercase">TRANSMIT</span><Send size={12} /></button>
         </div>
         <button onClick={handleReset} className="pointer-events-auto h-14 w-14 flex items-center justify-center bg-black/60 border border-white/10 hover:border-red-500 hover:bg-red-900/20 text-white/30 hover:text-red-500 transition-all rounded-sm group relative" title="PURGE MEMORY"><Radio size={16} /><span className="absolute -top-8 text-[8px] bg-red-900/80 text-white px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">TABULA RASA</span></button>
      </div>
      <AnimatePresence>{showHelp && <ViewManual title="NEURAL MIND [AI大脑]" subtitle="PROTOCOL_MANUAL_v5.0" items={AI_THINKING_MANUAL_ITEMS} theme="cyan" onClose={() => setShowHelp(false)} />}</AnimatePresence>
    </motion.div>
  );
};

export default AiThinking;