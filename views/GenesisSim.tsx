
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView, GeneEntry } from '../types';
import { playHighTechButton, playMechKey, SpectralScannerAudio } from '../utils/audio';
import EntropyNarrative from '../components/EntropyNarrative';
import EntropyContainer from '../components/EntropyContainer';
import ViewManual, { ManualItem } from '../components/ViewManual';
import { Database, Cpu } from 'lucide-react';

const MOCK_DB_SEQUENCES = [
  "0x7F2A-DNA-ORIGIN-ALPHA",
  "NEURAL-NET-SYMMETRY-0101",
  "CYBER-ORGANIC-GENE-X99",
  "VOID-EVOLUTION-PROTOCOL-VOID",
  "QUANTUM-LEAP-0xFF-SEQUENCE",
  "EMERGENCE-STRING-VIBRATION",
  "BIO-LOGIC-CLUSTERS-77",
  "GHOST-IN-THE-SHELL-CODE",
  "FRACTAL-GROWTH-VECTOR",
  "SYNTHETIC-SOUL-DNA-404"
];

const GENESIS_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "CORE_LOGIC",
    title: "离散时空的织机 | LOOM OF DISCRETE SPACETIME",
    subtitle: "OPERATIONAL_LOGIC",
    content: "这是逻辑宇宙的底层织机。在二维的普朗克网格中，每一个元胞（Cell）不仅是数据的载体，更是存在本身的量子态（0/1）。\n\n系统在绝对同步的时钟脉冲下，推演着从虚无到存在的离散神话。在这里，时间是量化的，空间是像素化的，而你是这一切的观察者。",
    meta: "KERNEL: DISCRETE",
    code: "0xCONWAY_GOL"
  },
  {
    id: "RULES",
    title: "公理化生存协议 | AXIOMATIC SURVIVAL PROTOCOL",
    subtitle: "CORE_REGULATIONS",
    content: "B3/S23 —— 这是刻在宇宙底层的不可变公理。它裁决着生死的边界：\n1. 孤寂 (Isolation)：熵减不足，归于虚无。\n2. 拥挤 (Overpopulation)：熵增过载，结构坍缩。\n3. 繁衍 (Genesis)：恰如其分的和谐，生命由此涌现。\n4. 存续 (Stasis)：在动态平衡中，维持存在的惯性。",
    meta: "RULESET: B3/S23",
    code: "0xEVOLUTION_LAW"
  },
  {
    id: "INTERACTION",
    title: "高维干涉 | HIGHER DIMENSION INTERFERENCE",
    subtitle: "USER_OVERRIDE",
    content: "作为高维度的观察者，你的点击即是因果律的强制注入。你可以瞬间翻转元胞的量子自旋，向封闭系统内注入高能‘变异’因子。\n\n这些由意志引发的扰动，将如涟漪般扩散，打破死寂的循环，在确定性的深渊中撕开可能性的裂缝。",
    meta: "INPUT: ACTIVE",
    code: "0xMUTATION_INJECT"
  },
  {
    id: "ENTROPY",
    title: "涌现与熵流 | EMERGENCE & ENTROPY FLOW",
    subtitle: "SYSTEM_STATE_ANALYSIS",
    content: "熵监测仪表盘注视着系统的热力学演化。\n\n当混乱的噪点在迭代中自发组装成滑翔机（Glider）或构筑物时，你所见证的正是‘涌现’的神迹——那是从简单的局部规则中，升华出的宏观智能与秩序。从 CHAOS（混沌）到 ORDERED（秩序），这是逻辑在硅基土壤中开出的生命之花。",
    meta: "STATUS: MANIFESTED",
    code: "0xENTROPY_MEASURE"
  }
];

const textToBinaryFull = (text: string) => {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(16, '0');
  }).join(' ');
};

const GenesisSim: React.FC = () => {
  const { entries, thoughtEntries, setView } = useGeneData();
  const { user, incrementEvolution } = useAuth(); // 获取增长函数
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHyperSyncing, setIsHyperSyncing] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [entropy, setEntropy] = useState('CHAOTIC [混沌]');
  const [speed, setSpeed] = useState(60); 
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  
  const [showNarrative, setShowNarrative] = useState(false);
  const [showMetaGame, setShowMetaGame] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const [dataSource, setDataSource] = useState<'DNA' | 'THOUGHT'>('DNA');
  
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null); 
  
  const gridRef = useRef<number[][]>([]);
  const ageRef = useRef<number[][]>([]); 
  const mutationRef = useRef<number[][]>([]);
  
  const scannedGridRef = useRef<number[][]>([]);
  const timerRef = useRef<any>(null);
  const deltaHistoryRef = useRef<number[]>([]);
  const [dims, setDims] = useState({ rows: 80, cols: 120 });
  
  const scanXRef = useRef(0);
  const lastScanColRef = useRef(-1);
  const lastAudioTriggerTimeRef = useRef(0); 
  const isMobileRef = useRef(false); 
  const audioScannerRef = useRef<SpectralScannerAudio | null>(null);

  const findEntry = useCallback((id: string) => {
      const dna = entries.find(e => e.id === id);
      if (dna) return { ...dna, type: 'DNA', code: dna.originalText };
      const thought = thoughtEntries.find(e => e.id === id);
      if (thought) return { ...thought, type: 'THOUGHT', originalText: thought.question, binaryStream: thought.responseBinary, code: thought.responseBinary };
      if (id.startsWith('mock-')) {
         const idx = parseInt(id.split('-')[1]);
         const mock = MOCK_DB_SEQUENCES[idx];
         return { id, originalText: mock, binaryStream: textToBinaryFull(mock), code: mock, type: 'MOCK' };
      }
      return null;
  }, [entries, thoughtEntries]);

  const selectedEntriesData = useMemo(() => {
      return selectedEntryIds.map(id => findEntry(id)).filter(Boolean);
  }, [selectedEntryIds, findEntry]);

  const currentCode = useMemo(() => {
    if (selectedEntriesData.length === 0) {
        const source = entries.length > 0 ? entries.map(e => e.originalText) : MOCK_DB_SEQUENCES;
        return source[currentIdx % source.length];
    }
    if (selectedEntriesData.length > 1) return `[${selectedEntriesData.length} MIXED SOURCES]`;
    return selectedEntriesData[0]?.originalText || "UNKNOWN";
  }, [entries, currentIdx, selectedEntriesData]);

  const currentBinaryStream = useMemo(() => {
      if (selectedEntriesData.length === 0) return textToBinaryFull(currentCode);
      return selectedEntriesData[0]?.binaryStream || "000000";
  }, [selectedEntriesData, currentCode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isListOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isListOpen]);

  const filteredList = useMemo(() => {
    if (dataSource === 'DNA') {
        const source = entries.length > 0 ? entries : MOCK_DB_SEQUENCES.map((s, i) => ({ 
            id: `mock-${i}`, 
            originalText: s, 
            timestamp: new Date().toLocaleTimeString(),
            binaryStream: textToBinaryFull(s)
        } as GeneEntry));
        if (!searchTerm) return source;
        return source.filter(e => e.originalText.toUpperCase().includes(searchTerm.toUpperCase()));
    } else {
        if (!searchTerm) return thoughtEntries;
        return thoughtEntries.filter(e => e.question.toUpperCase().includes(searchTerm.toUpperCase()));
    }
  }, [entries, thoughtEntries, searchTerm, dataSource]);

  const theme = useMemo(() => {
      return dataSource === 'DNA' ? {
          border: 'border-purple-500',
          borderDim: 'border-purple-900/30',
          text: 'text-purple-500',
          textDim: 'text-purple-900',
          textLight: 'text-purple-300',
          textHeader: 'text-purple-700',
          bgSelected: 'bg-purple-900/30',
          bgHeader: 'bg-purple-900/40',
          bgHover: 'hover:bg-purple-900/10',
          accent: 'text-purple-400',
          glow: 'shadow-[0_0_15px_#a855f7]',
          scrollThumb: 'rgba(168, 85, 247, 0.2)',
          button: 'border-purple-500/30 bg-purple-900/10 hover:border-purple-400',
          buttonText: 'text-purple-400',
          buttonHoverText: 'hover:text-purple-300',
          iconColor: 'text-purple-600',
          iconHover: 'group-hover:text-purple-400',
          borderL: 'border-l-purple-400',
          placeholder: 'placeholder:text-purple-800/50'
      } : {
          border: 'border-cyan-500',
          borderDim: 'border-cyan-900/30',
          text: 'text-cyan-500',
          textDim: 'text-cyan-900',
          textLight: 'text-cyan-300',
          textHeader: 'text-cyan-700',
          bgSelected: 'bg-cyan-900/30',
          bgHeader: 'bg-cyan-900/40',
          bgHover: 'hover:bg-cyan-900/10',
          accent: 'text-cyan-400',
          glow: 'shadow-[0_0_15px_#22d3ee]',
          scrollThumb: 'rgba(34, 211, 238, 0.2)',
          button: 'border-cyan-500/30 bg-cyan-900/10 hover:border-cyan-400',
          buttonText: 'text-cyan-400',
          buttonHoverText: 'hover:text-cyan-300',
          iconColor: 'text-cyan-600',
          iconHover: 'group-hover:text-cyan-400',
          borderL: 'border-l-cyan-400',
          placeholder: 'placeholder:text-cyan-800/50'
      };
  }, [dataSource]);

  const calculateStandardDeviation = useCallback((data: number[]) => {
    if (data.length < 2) return 0;
    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }, []);

  const initGrid = useCallback((codes: string[]) => {
    const { rows, cols } = dims;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    const ages = Array.from({ length: rows }, () => Array(cols).fill(0));
    const mutation = Array.from({ length: rows }, () => Array(cols).fill(0)); 
    const scanned = Array.from({ length: rows }, () => Array(cols).fill(0));
    
    codes.forEach((code, codeIdx) => {
        let seed = 0;
        for (let i = 0; i < code.length; i++) {
            seed = ((seed << 5) - seed) + code.charCodeAt(i);
            seed |= 0;
        }
        const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
        const chunks = code.split('').map(c => c.charCodeAt(0));
        const clusterCount = Math.min(chunks.length, 8); 
        for (let i = 0; i < clusterCount; i++) {
          const hash = chunks[i] * (i + 1);
          const offsetMult = (codeIdx + 1);
          const anchorX = Math.floor((hash % 60 + 20) * cols / 100);
          const anchorY = Math.floor(((hash * 7 * offsetMult) % 60 + 20) * rows / 100);
          const size = 5;
          for (let dy = -size; dy <= size; dy++) {
            for (let dx = -size; dx <= size; dx++) {
              if (seededRandom() > 0.6) {
                const ny = (anchorY + dy + rows) % rows;
                const nx = (anchorX + dx + cols) % cols;
                grid[ny][nx] = 1;
              }
            }
          }
        }
    });
    gridRef.current = grid;
    ageRef.current = ages;
    mutationRef.current = mutation;
    scannedGridRef.current = scanned;
    deltaHistoryRef.current = [];
  }, [dims]);

  const handleNext = () => {
    playHighTechButton();
    setGeneration(0);
    const nextIdx = (currentIdx + 1) % (entries.length || MOCK_DB_SEQUENCES.length);
    setCurrentIdx(nextIdx);
    const source = entries.length > 0 ? entries : MOCK_DB_SEQUENCES.map((s, i) => ({ id: `mock-${i}`, originalText: s } as GeneEntry));
    const nextEntry = source[nextIdx];
    setSelectedEntryIds([nextEntry.id]);
    initGrid([nextEntry.originalText]);
  };

  const handleRefresh = () => {
    playHighTechButton();
    setGeneration(0);
    const codes = selectedEntryIds.map(id => {
        const e = findEntry(id);
        return e ? e.code : '';
    }).filter(c => c !== '');
    if (codes.length === 0) initGrid([currentCode]);
    else initGrid(codes);
    setIsPlaying(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.trim() !== '') setIsListOpen(true);
  };

  const handleToggleEntry = (entry: any) => {
    playMechKey();
    setSelectedEntryIds(prev => {
        if (prev.includes(entry.id)) return prev.filter(id => id !== entry.id);
        return [...prev, entry.id];
    });
  };

  const handleInjectSelected = () => handleRefresh();

  const toggleScanner = async () => {
    playMechKey();
    if (!isScannerActive) {
      scanXRef.current = 0; 
      if (!audioScannerRef.current) audioScannerRef.current = new SpectralScannerAudio();
      await audioScannerRef.current.resume();
    }
    setIsScannerActive(!isScannerActive);
  };

  const jumpToStasis = () => {
    if (isHyperSyncing) return;
    playHighTechButton();
    setIsHyperSyncing(true);
    setTimeout(() => {
      const { rows, cols } = dims;
      let tempGrid = gridRef.current.map(row => [...row]);
      let tempMutation = mutationRef.current.map(row => [...row]);
      let tempHistory = [...deltaHistoryRef.current];
      let tempGen = generation;
      let count = 0;
      const MAX_BATCH = 1000;
      let reached = false;
      while (!reached && count < MAX_BATCH) {
        count++;
        tempGen++;
        let delta = 0;
        const nextGrid = tempGrid.map((row, y) => 
          row.map((cell, x) => {
            let neighbors = 0;
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const ny = (y + i + rows) % rows;
                const nx = (x + j + cols) % cols;
                neighbors += tempGrid[ny][nx];
              }
            }
            let nextCell = 0;
            if (cell === 1) {
              if (neighbors === 2 || neighbors === 3) nextCell = 1;
            } else {
              if (neighbors === 3) nextCell = 1;
            }
            if (nextCell !== cell) delta++;
            return nextCell;
          })
        );
        tempGrid = nextGrid;
        tempMutation = tempMutation.map(row => row.map(m => m * 0.9)); 
        tempHistory.push(delta);
        if (tempHistory.length > 15) tempHistory.shift();
        const stdDev = calculateStandardDeviation(tempHistory);
        if (delta === 0 || stdDev < 2.0) reached = true;
      }
      gridRef.current = tempGrid;
      ageRef.current = tempGrid.map(row => row.map(cell => cell === 1 ? 10 : 0));
      mutationRef.current = tempMutation;
      setGeneration(tempGen);
      deltaHistoryRef.current = tempHistory;
      setPopulation(tempGrid.flat().filter(x => x === 1).length);
      const finalStdDev = calculateStandardDeviation(tempHistory);
      const finalDelta = tempHistory[tempHistory.length - 1];
      if (finalDelta === 0) setEntropy('STABLE [寂静]');
      else if (finalStdDev < 2.0) setEntropy('ORDERED [秩序]');
      else setEntropy('CHAOTIC [混沌]');
      setIsHyperSyncing(false);
      playHighTechButton();
    }, 50);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { rows, cols } = dims;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;
    const gridX = Math.floor(x / cellW);
    const gridY = Math.floor(y / cellH);
    if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
      playMechKey();
      const currentVal = gridRef.current[gridY][gridX];
      const newVal = currentVal === 1 ? 0 : 1;
      gridRef.current[gridY][gridX] = newVal;
      if (newVal === 1) {
          ageRef.current[gridY][gridX] = 0;
          mutationRef.current[gridY][gridX] = 1.0; 
      } else {
          mutationRef.current[gridY][gridX] = 0;
      }
    }
  };

  const evolve = () => {
    const { rows, cols } = dims;
    let newPop = 0;
    let delta = 0;
    const nextGrid = gridRef.current.map(arr => [...arr]);
    const nextMutation = mutationRef.current.map(arr => [...arr]);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = gridRef.current[y][x];
            let neighbors = 0;
            let maxNeighborMutation = 0;
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const ny = (y + i + rows) % rows;
                const nx = (x + j + cols) % cols;
                if (gridRef.current[ny][nx] === 1) {
                    neighbors++;
                    maxNeighborMutation = Math.max(maxNeighborMutation, mutationRef.current[ny][nx]);
                }
              }
            }
            let nextCell = 0;
            if (cell === 1) {
              if (neighbors === 2 || neighbors === 3) nextCell = 1;
            } else {
              if (neighbors === 3) nextCell = 1;
            }
            if (nextCell !== cell) delta++;
            nextGrid[y][x] = nextCell;
            if (nextCell === 1) {
              newPop++;
              ageRef.current[y][x]++;
              const currentMut = mutationRef.current[y][x];
              let newMut = currentMut * 0.95; 
              if (maxNeighborMutation > 0.1) newMut = Math.max(newMut, maxNeighborMutation * 0.9);
              nextMutation[y][x] = Math.min(1.0, newMut);
            } else {
              ageRef.current[y][x] = 0;
              nextMutation[y][x] = 0; 
            }
        }
    }
    gridRef.current = nextGrid;
    mutationRef.current = nextMutation;
    setPopulation(newPop);
    setGeneration(g => g + 1);
    deltaHistoryRef.current.push(delta);
    if (deltaHistoryRef.current.length > 15) deltaHistoryRef.current.shift();
    const stdDev = calculateStandardDeviation(deltaHistoryRef.current);
    if (delta === 0) {
      setEntropy('STABLE [寂静]');
      if (generation > 100 && generation % 60 === 0) handleNext();
    } else if (stdDev < 2.0) {
      setEntropy('ORDERED [秩序]');
      if (generation > 1500 && generation % 120 === 0) handleNext();
    } else {
      setEntropy('CHAOTIC [混沌]');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = window.innerWidth, h = window.innerHeight;
      isMobileRef.current = w < 768;
      canvasRef.current.width = w; canvasRef.current.height = h;
      const cols = Math.floor(w / 8), rows = Math.floor(h / 8);
      setDims({ rows, cols });
      scannedGridRef.current = Array.from({ length: rows }, () => Array(cols).fill(0));
      mutationRef.current = Array.from({ length: rows }, () => Array(cols).fill(0));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const source = entries.length > 0 ? entries : MOCK_DB_SEQUENCES.map((s, i) => ({ id: `mock-${i}`, originalText: s } as GeneEntry));
    const initialId = source[0].id;
    setSelectedEntryIds([initialId]);
    initGrid([source[0].originalText]);
    setIsPlaying(true);
  }, [entries, dims, initGrid]);

  useEffect(() => {
    if (isPlaying && !isHyperSyncing) timerRef.current = setInterval(evolve, speed);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isPlaying, isHyperSyncing, speed, dims]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    const render = () => {
      const { rows, cols } = dims;
      const width = canvas.width, height = canvas.height;
      const cellW = width / cols, cellH = height / rows;
      const isMobile = isMobileRef.current;
      if (isScannerActive) {
        const scanSpeed = isMobile ? (width / 250) : (width / 400); 
        scanXRef.current += scanSpeed;
        if (scanXRef.current > width) scanXRef.current = 0;
        const currentScanCol = Math.floor(scanXRef.current / cellW);
        const now = Date.now();
        const throttleLimit = isMobile ? 60 : 0; 
        if (currentScanCol !== lastScanColRef.current && currentScanCol < cols) {
          lastScanColRef.current = currentScanCol;
          if (now - lastAudioTriggerTimeRef.current > throttleLimit) {
            const activeRows: number[] = [];
            for (let y = 0; y < rows; y++) {
               if (gridRef.current[y] && gridRef.current[y][currentScanCol] === 1) {
                  activeRows.push(y);
                  if (scannedGridRef.current[y]) scannedGridRef.current[y][currentScanCol] = now;
               }
            }
            if (activeRows.length > 0 && audioScannerRef.current) {
               audioScannerRef.current.playColumn(activeRows, rows, isMobile);
               lastAudioTriggerTimeRef.current = now;
            }
          } else {
             for (let y = 0; y < rows; y++) {
                if (gridRef.current[y] && gridRef.current[y][currentScanCol] === 1) {
                    scannedGridRef.current[y][currentScanCol] = now;
                }
             }
          }
        }
      }
      ctx.fillStyle = 'rgba(5, 5, 5, 0.2)'; 
      ctx.fillRect(0, 0, width, height);
      const now = Date.now();
      gridRef.current.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell === 0) return;
          const scannedTime = scannedGridRef.current[y] ? scannedGridRef.current[y][x] : 0;
          const timeSinceScan = now - scannedTime;
          const isScannedFlash = timeSinceScan < 400;
          const age = ageRef.current[y][x];
          const mutation = mutationRef.current[y][x]; 
          let fillStyle;
          if (isScannedFlash) {
              const alpha = 1 - (timeSinceScan / 400);
              fillStyle = `rgba(220, 255, 255, ${alpha})`;
              if (!isMobile) { ctx.shadowBlur = 15; ctx.shadowColor = '#22d3ee'; }
          } else {
              if (mutation > 0.1) {
                  const hue = mutation * 50; 
                  const lightness = 50 + mutation * 30; 
                  fillStyle = `hsla(${hue}, 100%, ${lightness}%, 0.9)`;
                  if (!isMobile && mutation > 0.5) { ctx.shadowBlur = 10 * mutation; ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`; }
                  else { ctx.shadowBlur = 0; }
              } else {
                  const hue = Math.max(260, 280 - age * 0.5), lightness = Math.max(30, 60 - age * 0.3);
                  fillStyle = `hsla(${hue}, 80%, ${lightness}%, 0.8)`;
                  ctx.shadowBlur = 0;
              }
          }
          ctx.fillStyle = fillStyle;
          ctx.fillRect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW - 0.5), Math.ceil(cellH - 0.5));
          ctx.shadowBlur = 0; 
          if (age < 3 && !isScannedFlash && !isMobile && mutation < 0.1) { 
            ctx.shadowBlur = 10; ctx.shadowColor = '#a855f7'; ctx.fillStyle = '#fff';
            ctx.fillRect(x * cellW + cellW*0.25, y * cellH + cellH*0.25, cellW*0.5, cellH*0.5);
            ctx.shadowBlur = 0;
          }
        });
      });
      if (isScannerActive) {
         if (!isMobile) { ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(200, 100, 255, 1)'; }
         ctx.strokeStyle = 'rgba(200, 100, 255, 0.6)'; ctx.lineWidth = 2; ctx.beginPath();
         ctx.moveTo(scanXRef.current, 0); ctx.lineTo(scanXRef.current, height); ctx.stroke();
         ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [dims, isScannerActive]);

  const handlePlayClick = () => {
    playMechKey();
    incrementEvolution(); // 增长演化指数
    setShowNarrative(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] w-screen h-screen overflow-hidden select-none font-mono cursor-crosshair">
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full block" />
      <AnimatePresence>
        {isHyperSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-t-2 border-orange-500 rounded-full animate-spin shadow-[0_0_20px_#f97316]" />
              <div className="flex flex-col items-center">
                <span className="text-orange-500 font-black tracking-[0.5em] animate-pulse text-lg uppercase">Hyper_Syncing...</span>
                <span className="text-orange-900 text-[10px] font-bold mt-2 uppercase tracking-widest">Warping_Entropy_Stream_V1.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none z-20">
        <div className="bg-black/60 backdrop-blur-xl border border-purple-500/20 p-2 md:p-3 rounded-sm relative overflow-hidden cursor-default flex flex-col">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-500" />
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-400 to-purple-800 shadow-[0_0_15px_#a855f7]" />
            <div>
              <h1 className="text-base md:text-xl lg:text-2xl font-black text-white tracking-tighter uppercase">Genesis Sim</h1>
              <div className="flex items-center space-x-1 md:space-x-2 mt-0.5 md:mt-1">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
                <span className="text-[7px] md:text-[9px] text-purple-400 font-bold tracking-[0.2em]">NEURAL_ENGINE_ACTIVE</span>
              </div>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, borderColor: '#ef4444', color: '#fff' }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => { playMechKey(); setView(AppView.DATABASE); }} 
            className="pointer-events-auto mt-1 md:mt-2 px-3 md:px-4 py-1 md:py-1.5 border border-dashed border-red-500/40 bg-red-500/5 text-red-400 text-[8px] md:text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:bg-red-500/10"
          >
            [ EXIT_SIM ]
          </motion.button>
        </div>
      </div>
      <div ref={sidebarRef} className={`absolute top-28 left-4 md:top-36 md:left-6 w-[220px] md:w-[280px] pointer-events-none z-30 flex flex-col transition-all duration-500 ease-in-out`} style={{ maxHeight: isListOpen ? 'calc(100vh - 160px)' : 'auto' }}>
        <div className={`pointer-events-auto bg-black/80 backdrop-blur-2xl border-l-2 ${theme.border} px-2 py-2 shadow-2xl relative shrink-0 cursor-default flex flex-col space-y-2 z-30 transition-colors duration-300`}>
           <div className={`absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(transparent_0%,currentColor_50%,transparent_100%)] bg-[length:100%_4px] ${theme.text}`} />
           <button onClick={handleRefresh} className="absolute top-1 right-1 z-40 group" title="RE-EVOLVE SELECTED">
              <div className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center ${theme.bgHeader} border ${theme.borderDim} ${theme.bgHover} transition-all rounded-sm`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 md:w-3.5 md:h-3.5 ${theme.text} transition-all duration-700 ease-in-out group-hover:rotate-180`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
           </button>
           <div className={`w-full overflow-hidden border-b ${theme.borderDim} pb-1`}>
               <span className={`block text-[6px] md:text-[8px] ${theme.textHeader} font-bold tracking-[0.3em] uppercase mb-1`}>Input Source</span>
               <div className="overflow-hidden relative h-3 md:h-4 flex items-center"><div className="whitespace-nowrap animate-marquee-mobile flex items-center"><p className="text-[9px] md:text-[10px] text-white font-mono italic opacity-95 mr-4 shrink-0">{currentCode}</p></div></div>
           </div>
           <div className="w-full overflow-hidden">
               <span className={`block text-[6px] md:text-[7px] ${theme.textDim} font-bold uppercase tracking-[0.4em] mb-1`}>Neural Binary</span>
               <div className="bg-black/80 h-3 md:h-5 overflow-hidden relative rounded-sm whitespace-nowrap flex items-center"><div className="animate-marquee inline-block"><span className={`text-[7px] md:text-[9px] ${theme.text}/80 font-mono tracking-tight mr-8`}>{currentBinaryStream}</span><span className={`text-[7px] md:text-[9px] ${theme.text}/80 font-mono tracking-tight`}>{currentBinaryStream}</span></div></div>
           </div>
           <div className={`w-full border-t ${theme.borderDim} pt-1 mt-1 flex items-center justify-between`}>
              <div className="flex items-center flex-1 min-w-0"><span className={`text-[8px] ${theme.text} font-bold tracking-widest mr-2 uppercase shrink-0`}>Find:</span><input type="text" value={searchTerm} onChange={handleSearch} placeholder="ENTER_SEQ_ID..." className={`w-full bg-transparent text-[8px] md:text-[9px] ${theme.textLight} ${theme.placeholder} focus:outline-none font-mono tracking-tight uppercase`} /></div>
              <button onClick={() => { playMechKey(); setIsListOpen(!isListOpen); }} className={`ml-2 text-[10px] ${theme.text} hover:text-white transition-colors`}>{isListOpen ? '▲' : '▼'}</button>
           </div>
        </div>
        <AnimatePresence>
            {isListOpen && (
                <div className="relative w-full flex-1 min-h-0 z-20 flex"><motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="pointer-events-auto w-full flex flex-col"><div className={`bg-black/90 backdrop-blur-xl border ${theme.borderDim} border-t-0 flex flex-col h-full overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}><div className={`grid grid-cols-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border-b ${theme.borderDim}`}><button onClick={() => setDataSource('DNA')} className={`py-2 transition-colors flex items-center justify-center space-x-1 ${dataSource === 'DNA' ? 'bg-purple-900/40 text-white' : 'bg-black/40 text-purple-500 hover:text-purple-300'}`}><Database size={10} /><span>DNA ARCHIVE</span></button><button onClick={() => setDataSource('THOUGHT')} className={`py-2 transition-colors flex items-center justify-center space-x-1 ${dataSource === 'THOUGHT' ? 'bg-cyan-900/40 text-cyan-200' : 'bg-black/40 text-cyan-600 hover:text-cyan-400'}`}><Cpu size={10} /><span>THOUGHT CORE</span></button></div><div className="flex-1 overflow-y-auto custom-help-scrollbar">{filteredList.length === 0 ? (<div className="p-4 text-center"><span className={`text-[9px] ${theme.textDim} font-mono uppercase`}>NO_DATA_FOUND</span></div>) : (filteredList.map((entry, idx) => {
                                       const isSelected = selectedEntryIds.includes(entry.id);
                                       const label = dataSource === 'DNA' ? (entry as any).originalText : (entry as any).question;
                                       return (<div key={entry.id || idx} onClick={() => handleToggleEntry(entry)} className={`relative p-2 border-b ${theme.borderDim} cursor-pointer transition-all group flex flex-col overflow-hidden ${isSelected ? theme.bgSelected : theme.bgHover} border-l-[3px] ${isSelected ? theme.borderL : 'border-l-transparent'}`}><div className="flex justify-between items-center mb-0.5 relative z-10"><span className={`text-[8px] font-bold font-mono ${isSelected ? 'text-white' : `${theme.iconColor} ${theme.iconHover}`}`}>{entry.timestamp?.split(' ')[0] || 'SYNC'}</span><div className={`w-3 h-3 border ${theme.text} flex items-center justify-center ${isSelected ? 'bg-white/10 border-white' : ''}`}>{isSelected && <div className={`w-1.5 h-1.5 rounded-[1px] ${dataSource === 'DNA' ? 'bg-purple-400' : 'bg-cyan-400'}`} />}</div></div><div className={`text-[9px] font-mono truncate tracking-tight transition-colors uppercase relative z-10 ${isSelected ? 'text-white text-glow' : `${theme.textLight} group-hover:text-white`}`}>{label}</div></div>);
                                   }))}</div><div className={`p-2 border-t ${theme.borderDim} bg-black/50`}><button onClick={handleInjectSelected} className={`w-full ${theme.button} ${theme.buttonText} ${theme.buttonHoverText} text-[9px] font-bold py-2 uppercase tracking-widest transition-all ${theme.glow} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>INJECT SELECTED ({selectedEntryIds.length})</button></div></div></motion.div></div>
            )}
        </AnimatePresence>
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-start space-x-2 md:space-x-4 pointer-events-none z-20"><div className="pointer-events-auto flex flex-row items-center space-x-4 md:space-x-8 bg-black/60 backdrop-blur-xl border border-purple-500/20 px-4 md:px-8 py-2 md:py-3 rounded-sm md:rounded-full shadow-2xl relative cursor-default"><div className="flex flex-col items-center"><span className="text-[7px] md:text-[8px] text-purple-600 font-black uppercase tracking-[0.2em]">Gen</span><span className="text-sm md:text-lg font-black text-white leading-none mt-0.5 md:mt-1">{generation.toLocaleString()}</span></div><div className="w-px h-4 md:h-6 bg-purple-500/10" /><div className="flex flex-col items-center"><span className="text-[7px] md:text-[8px] text-purple-600 font-black uppercase tracking-[0.2em]">Pop</span><span className="text-sm md:text-lg font-black text-purple-400 leading-none mt-0.5 md:mt-1">{population.toLocaleString()}</span></div><div className="w-px h-4 md:h-6 bg-purple-500/10 hidden md:block" /><div className="flex-col items-center hidden md:flex"><span className="text-[7px] md:text-[8px] text-purple-600 font-black uppercase tracking-[0.2em]">Entropy</span><span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 border rounded-sm mt-1 leading-none transition-all duration-500 ${entropy.includes('CHAOTIC') ? 'border-purple-500/40 text-purple-400 animate-pulse' : entropy.includes('ORDERED') ? 'border-cyan-500/40 text-cyan-400' : 'border-blue-500/40 text-blue-500'}`}>{entropy}</span></div></div><button onClick={() => { playMechKey(); setShowHelp(true); }} className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full border border-purple-500/20 bg-black/60 backdrop-blur-md flex items-center justify-center text-purple-400 font-black hover:border-purple-400 transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)] group cursor-pointer"><span className="group-hover:scale-125 transition-transform text-lg md:text-xl">?</span></button></div>
      <AnimatePresence>{showNarrative && (<EntropyNarrative onStart={() => { setShowNarrative(false); setShowMetaGame(true); }} onCancel={() => setShowNarrative(false)} />)}</AnimatePresence>
      <AnimatePresence>{showMetaGame && (<EntropyContainer onClose={() => setShowMetaGame(false)} />)}</AnimatePresence>
      <AnimatePresence>{showHelp && (<ViewManual title="GENESIS SIM [创世模拟]" subtitle="PROTOCOL_MANUAL_v1.0" items={GENESIS_MANUAL_ITEMS} theme="purple" onClose={() => setShowHelp(false)} />)}</AnimatePresence>
      <div className="absolute bottom-4 left-4 right-4 md:bottom-10 md:right-10 md:left-auto pointer-events-none z-20"><div className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-purple-500/10 p-2 px-3 md:px-6 rounded-sm flex flex-col md:flex-row items-center md:space-x-4 space-y-2 md:space-y-0 shadow-2xl cursor-default"><div className="grid grid-cols-2 gap-2 w-full md:flex md:space-x-4"><button onClick={() => setIsPlaying(!isPlaying)} className={`cyber-btn py-2 md:py-2.5 px-2 md:px-8 md:min-w-[140px] font-black text-[9px] md:text-[11px] tracking-[0.3em] transition-all uppercase border-l-2 ${isPlaying ? 'border-indigo-500 text-indigo-400 hover:bg-indigo-500/10' : 'border-purple-500 text-purple-400 hover:bg-purple-500/10'}`}>{isPlaying ? 'Suspend [暂停]' : 'Resume [继续]'}</button><button onClick={jumpToStasis} disabled={isHyperSyncing} className={`cyber-btn py-2 md:py-2.5 px-2 md:px-10 border border-orange-500/40 font-black text-[9px] md:text-[11px] tracking-[0.3em] uppercase transition-all bg-gradient-to-r from-orange-500/10 to-red-600/10 text-orange-400 hover:from-orange-500 hover:to-red-600 hover:text-white disabled:opacity-50`}>HYPER SYNC [超同步]</button><button onClick={toggleScanner} className={`cyber-btn col-span-2 md:col-span-auto py-2 md:py-2.5 px-2 md:px-8 border ${isScannerActive ? 'border-cyan-400 text-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'border-purple-500/40 text-purple-500'} font-black text-[9px] md:text-[11px] tracking-[0.3em] uppercase transition-all hover:bg-cyan-500/10`}>Audio Scan [音频扫描]</button></div><div className="hidden md:block w-px h-6 bg-purple-500/10 mx-2" /><button onClick={handlePlayClick} className="cyber-btn w-full md:w-auto py-2 md:py-2.5 px-8 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white transition-all font-black text-[9px] md:text-[11px] tracking-[0.3em] uppercase">PLAY</button></div></div>
      <style>{`.custom-help-scrollbar::-webkit-scrollbar { width: 4px; } .custom-help-scrollbar::-webkit-scrollbar-thumb { background: ${theme.scrollThumb}; } .cyber-btn:active { transform: scale(0.96); } @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 20s linear infinite; } @keyframes marquee-mobile { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee-mobile { animation: marquee-mobile 8s linear infinite; }`}</style>
    </div>
  );
};

export default GenesisSim;
