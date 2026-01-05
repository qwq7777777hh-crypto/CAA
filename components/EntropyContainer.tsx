import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { X } from 'lucide-react';

const COLS = 10;
const ROWS = 20;

const COMMON_PATTERNS = [
  { name: 'BLOCK', shape: [[1, 1], [1, 1]], color: '#22d3ee' },
  { name: 'BLINKER_H', shape: [[1, 1, 1]], color: '#3b82f6' },
  { name: 'BLINKER_V', shape: [[1], [1], [1]], color: '#3b82f6' },
];

const RARE_PATTERNS = [
  { name: 'GLIDER', shape: [[0, 1, 0], [0, 0, 1], [1, 1, 1]], color: '#a855f7' },
  { name: 'BEEHIVE', shape: [[0, 1, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0]], color: '#6366f1' },
  { name: 'BOAT', shape: [[1, 1, 0], [1, 0, 1], [0, 1, 0]], color: '#6366f1' },
  { name: 'LOAF', shape: [[0, 1, 1, 0], [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 0]], color: '#c084fc' }
];

interface Props {
  onClose: () => void;
}

interface Evaluation {
  grade: string;
  title: string;
  color: string;
  glow: string;
  message: string;
}

const getEvaluation = (score: number): Evaluation => {
  if (score <= 800) {
    return {
      grade: "F",
      title: "CRITICAL_NOISE",
      color: "text-[#d14b4b]",
      glow: "shadow-[0_0_40px_rgba(209,75,75,0.2)]",
      message: "SYSTEM SATURATION REACHED CRITICAL LEVELS IMMEDIATELY. THE ENTROPY LEAK WAS UNCONTAINABLE. THE DATA HAS RETURNED TO RAW STATIC. (系统饱和度瞬间达到临界值。熵泄漏无法遏制。数据已回归为原始噪点。)"
    };
  } else if (score <= 2000) {
    return {
      grade: "D",
      title: "TRANSIENT_ECHO",
      color: "text-red-500",
      glow: "shadow-[0_0_40px_rgba(239,68,68,0.2)]",
      message: "A FLEETING ATTEMPT AT STRUCTURE. YOU DELAYED THE HEAT DEATH, BUT ONLY FOR A MICROSECOND. THE CHAOS WAS SIMPLY TOO AGGRESSIVE. (一次对结构的短暂尝试。你推迟了热寂，但仅维持了微秒。混沌实在过于猛烈。)"
    };
  } else if (score <= 4500) {
    return {
      grade: "C",
      title: "OBSERVER",
      color: "text-orange-500",
      glow: "shadow-[0_0_40px_rgba(249,115,22,0.2)]",
      message: "STANDARD VARIANCE OBSERVED. YOU MAINTAINED A LOCAL EQUILIBRIUM, BALANCING CREATION AND DESTRUCTION. THE OUTCOME IS NEUTRAL. (观测到标准方差。你维持了局部的平衡，抵消了创造与毁灭。结果为中性。)"
    };
  } else if (score <= 8000) {
    return {
      grade: "B",
      title: "STABILIZER",
      color: "text-cyan-400",
      glow: "shadow-[0_0_40px_rgba(34,211,238,0.2)]",
      message: "LOCAL ENTROPY SUCCESSFULLY REVERSED. YOU HAVE WOVEN SIGNIFICANT ORDER FROM THE RANDOM STREAM. THE SIMULATION ACKNOWLEDGES YOUR CONTRIBUTION. (局部熵值成功逆转。你从随机流中编织出了显著的秩序。模拟系统认可你的贡献。)"
    };
  } else if (score <= 15000) {
    return {
      grade: "A",
      title: "ARCHITECT",
      color: "text-purple-400",
      glow: "shadow-[0_0_40px_rgba(168,85,247,0.2)]",
      message: "HIGH-EFFICIENCY CRYSTALLIZATION. YOU HAVE IMPOSED COMPLEX GEOMETRY UPON THE VOID. THE RESULTING STRUCTURES ARE SELF-SUSTAINING. (高效的结晶化。你将复杂的几何结构强加于虚空之上。生成的结构已实现自维持。)"
    };
  } else {
    return {
      grade: "S",
      title: "MAXWELL'S_DEMON",
      color: "text-yellow-400",
      glow: "shadow-[0_0_50px_rgba(250,204,21,0.4)]",
      message: "THEORETICAL LIMIT EXCEEDED. YOU HAVE DEFIED THE SECOND LAW. PURE NEGENTROPY ACHIEVED. YOU ARE THE GHOST IN THE MACHINE. (超越理论极限。你违背了热力学第二定律。达成了纯粹的负熵。你是机器中的幽灵。)"
    };
  }
};

const EntropyContainer: React.FC<Props> = ({ onClose }) => {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ shape: number[][], x: number, y: number, color: string } | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCascading, setIsCascading] = useState(false);

  // Touch Gesture Refs
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);

  const evaluation = useMemo(() => getEvaluation(score), [score]);

  const checkCollision = useCallback((shape: number[][], x: number, y: number, currentGrid: string[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const spawnPiece = useCallback(() => {
    if (isGameOver) return;
    const isRare = Math.random() < 0.4;
    const pool = isRare ? RARE_PATTERNS : COMMON_PATTERNS;
    const p = pool[Math.floor(Math.random() * pool.length)];
    const newPiece = {
      shape: p.shape,
      x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2),
      y: 0,
      color: p.color
    };
    if (checkCollision(newPiece.shape, newPiece.x, newPiece.y, grid)) {
      setIsGameOver(true);
      return;
    }
    setActivePiece(newPiece);
  }, [grid, checkCollision, isGameOver]);

  const lockPiece = useCallback(() => {
    if (!activePiece || isGameOver) return;
    const tempGrid = [...grid.map(r => [...r])];
    activePiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          const gy = activePiece.y + r;
          const gx = activePiece.x + c;
          if (gy >= 0 && gy < ROWS) tempGrid[gy][gx] = activePiece.color;
        }
      });
    });

    const linesToClear: number[] = [];
    tempGrid.forEach((row, r) => {
      if (row.every(cell => cell !== '')) linesToClear.push(r);
    });

    if (linesToClear.length > 0) {
      playHighTechButton();
      setIsCascading(true);
      const clearedGrid = tempGrid.map((row, r) => linesToClear.includes(r) ? Array(COLS).fill('') : row);
      const finalGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
      for (let x = 0; x < COLS; x++) {
        const columnContent: string[] = [];
        for (let y = 0; y < ROWS; y++) if (clearedGrid[y][x] !== '') columnContent.push(clearedGrid[y][x]);
        for (let y = ROWS - 1; y >= 0; y--) if (columnContent.length > 0) finalGrid[y][x] = columnContent.pop()!;
      }
      setScore(s => s + (linesToClear.length * 100 * linesToClear.length));
      setGrid(clearedGrid);
      setTimeout(() => {
        setGrid(finalGrid);
        setIsCascading(false);
        setActivePiece(null);
        spawnPiece();
      }, 150);
    } else {
      setGrid(tempGrid);
      setActivePiece(null);
      spawnPiece();
    }
  }, [activePiece, grid, spawnPiece, isGameOver]);

  const moveDown = useCallback(() => {
    if (!activePiece || isGameOver || isCascading) return;
    if (!checkCollision(activePiece.shape, activePiece.x, activePiece.y + 1, grid)) {
      setActivePiece(prev => prev ? { ...prev, y: prev.y + 1 } : null);
    } else {
      lockPiece();
    }
  }, [activePiece, grid, isGameOver, isCascading, lockPiece, checkCollision]);

  const hardDrop = useCallback(() => {
    if (!activePiece || isGameOver || isCascading) return;
    let finalY = activePiece.y;
    while (!checkCollision(activePiece.shape, activePiece.x, finalY + 1, grid)) {
      finalY++;
    }
    playMechKey();
    setActivePiece(prev => prev ? { ...prev, y: finalY } : null);
    // Use a small delay for locking to provide visual feedback of teleporting
    setTimeout(lockPiece, 20);
  }, [activePiece, grid, isGameOver, isCascading, checkCollision, lockPiece]);

  const rotatePiece = useCallback(() => {
    if (!activePiece || isGameOver || isCascading) return;
    const shape = activePiece.shape;
    const newShape = shape[0].map((_, index) => shape.map(col => col[index]).reverse());
    let newX = activePiece.x;
    const offset = [0, -1, 1, -2, 2];
    for (const off of offset) {
      if (!checkCollision(newShape, newX + off, activePiece.y, grid)) {
        playMechKey();
        setActivePiece(prev => prev ? { ...prev, shape: newShape, x: newX + off } : null);
        return;
      }
    }
  }, [activePiece, grid, isGameOver, isCascading, checkCollision]);

  // Handle Touch Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isGameOver || isCascading || !activePiece) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    const duration = Date.now() - touchStartTime.current;

    // Thresholds
    const swipeThreshold = 30;
    const tapThreshold = 10;

    if (Math.abs(deltaX) < tapThreshold && Math.abs(deltaY) < tapThreshold && duration < 250) {
      // Tap detected -> Rotate
      rotatePiece();
    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > swipeThreshold) {
        // Swipe Right
        if (!checkCollision(activePiece.shape, activePiece.x + 1, activePiece.y, grid)) {
          playMechKey();
          setActivePiece(p => p ? { ...p, x: p.x + 1 } : null);
        }
      } else if (deltaX < -swipeThreshold) {
        // Swipe Left
        if (!checkCollision(activePiece.shape, activePiece.x - 1, activePiece.y, grid)) {
          playMechKey();
          setActivePiece(p => p ? { ...p, x: p.x - 1 } : null);
        }
      }
    } else {
      // Vertical swipe
      if (deltaY > swipeThreshold) {
        // Swipe Down -> Soft Drop
        moveDown();
      } else if (deltaY < -swipeThreshold) {
        // Swipe Up -> Hard Drop
        hardDrop();
      }
    }
  };

  useEffect(() => {
    if (!activePiece && !isGameOver && !isCascading) spawnPiece();
    const interval = setInterval(moveDown, 800);
    return () => clearInterval(interval);
  }, [activePiece, isGameOver, isCascading, moveDown, spawnPiece]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (isGameOver || !activePiece || isCascading) return;
    switch (e.key) {
      case 'ArrowLeft':
        if (!checkCollision(activePiece.shape, activePiece.x - 1, activePiece.y, grid)) {
          setActivePiece(p => p ? { ...p, x: p.x - 1 } : null);
        }
        break;
      case 'ArrowRight':
        if (!checkCollision(activePiece.shape, activePiece.x + 1, activePiece.y, grid)) {
          setActivePiece(p => p ? { ...p, x: p.x + 1 } : null);
        }
        break;
      case 'ArrowDown': moveDown(); break;
      case 'ArrowUp': hardDrop(); break;
      case ' ': e.preventDefault(); rotatePiece(); break;
      default: break;
    }
  }, [activePiece, grid, isGameOver, isCascading, checkCollision, moveDown, rotatePiece, hardDrop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[15000] bg-[#020617] w-screen h-screen flex items-center justify-center p-0 md:p-4 font-mono overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
         <div className="w-full h-full opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* --- EXIT BUTTON --- */}
      {!isGameOver && (
        <button 
          onClick={() => { playMechKey(); onClose(); }}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-[200] flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 border border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:text-white hover:border-red-500 transition-all group shadow-[0_0_15px_rgba(239,68,68,0.1)] pointer-events-auto"
        >
          <X size={14} className="md:w-4 md:h-4" />
          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]">Exit_Recycle</span>
        </button>
      )}

      {/* Floating HUD - Visible on Mobile AND iPad Portrait */}
      {!isGameOver && (
        <div className="ipad-portrait-hud md:hidden absolute top-0 left-0 w-full z-[100] px-4 pt-6 flex justify-between items-start pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 px-3 py-2 rounded-sm ml-auto">
             <span className="text-[7px] text-cyan-500/60 block font-bold uppercase tracking-widest mb-1">Recycled_Entropy</span>
             <div className="text-lg font-black text-cyan-400 tabular-nums leading-none">
                {score.toString().padStart(6, '0')}
             </div>
          </div>
        </div>
      )}

      {/* Gesture Hint - Visible on Mobile AND iPad Portrait */}
      {!isGameOver && (
        <div className="ipad-portrait-hint md:hidden absolute bottom-4 left-0 w-full z-[100] px-6 text-center pointer-events-none opacity-40">
           <motion.p 
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-[9px] text-cyan-400 font-bold tracking-[0.2em] uppercase"
           >
              点击旋转 / 左右滑动移动 / 下滑加速 / 上滑置底
           </motion.p>
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl h-full flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        
        {!isGameOver && (
          <>
            {/* Desktop Side Panels - Hidden on iPad Portrait via CSS Media Query below */}
            <div className="tetris-side-panel hidden md:flex flex-col w-64 space-y-8">
              <div className="border-l-4 border-cyan-500 pl-6 py-2">
                <h2 className="text-white font-black uppercase text-2xl tracking-tighter">Entropy Recycled</h2>
                <p className="text-[10px] text-cyan-400 font-bold tracking-[0.4em] mt-1">NEXUS_STABILIZATION</p>
              </div>
              <div className="bg-blue-950/10 border border-cyan-500/20 p-8 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500" />
                <span className="text-[10px] text-blue-800 block mb-2 font-black uppercase tracking-widest">Recycled_Units</span>
                <div className="text-4xl font-black text-cyan-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  {score.toString().padStart(6, '0')}
                </div>
              </div>
              <div className="space-y-4 pt-10 border-t border-blue-900/20">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-blue-800 font-bold uppercase tracking-widest">Gravity_Mode</span>
                    <span className="text-[9px] text-cyan-500 font-mono">SAND_CASCADE</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-blue-800 font-bold uppercase tracking-widest">Stability</span>
                    <span className="text-[9px] text-cyan-500 font-mono">ADAPTIVE</span>
                </div>
              </div>
            </div>

            <div className="relative group transition-all duration-700">
              <div className="absolute -top-10 -left-10 w-20 h-20 border-t-2 border-cyan-500/30 pointer-events-none hidden md:block" />
              <div className="absolute -bottom-10 -right-10 w-20 h-20 border-b-2 border-cyan-500/30 pointer-events-none hidden md:block" />
              
              <div className="relative md:border-[6px] md:border-blue-950/30 bg-black/80 md:shadow-[0_0_80px_rgba(59,130,246,0.1)] p-0 md:p-1 overflow-hidden">
                <div 
                  className="grid gap-[1px]" 
                  style={{ gridTemplateColumns: `repeat(${COLS}, min(9vw, 4.2vh))` }}
                >
                  {grid.map((row, r) => row.map((cell, c) => {
                    let color = cell;
                    if (activePiece) {
                      const pr = r - activePiece.y;
                      const pc = c - activePiece.x;
                      if (pr >= 0 && pr < activePiece.shape.length && pc >= 0 && pc < activePiece.shape[0].length) {
                        if (activePiece.shape[pr][pc]) color = activePiece.color;
                      }
                    }
                    return (
                      <div 
                        key={`${r}-${c}`} 
                        className="aspect-square transition-all duration-300"
                        style={{ 
                          backgroundColor: color || 'rgba(59, 130, 246, 0.04)',
                          boxShadow: color ? `inset 0 0 10px ${color}, 0 0 15px ${color}44` : 'none',
                          border: color ? `1px solid ${color}88` : '1px solid rgba(59, 130, 246, 0.05)',
                        }}
                      />
                    );
                  }))}
                </div>
              </div>
            </div>

            {/* Desktop Side Panels - Hidden on iPad Portrait */}
            <div className="tetris-side-panel hidden md:flex flex-col w-64 space-y-12">
              <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.3em]">Neural_Interface_HUD</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-blue-950/10 border border-blue-800/20 p-4 flex justify-between items-center">
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Move</span>
                        <span className="text-[11px] text-white font-black">[← / →]</span>
                    </div>
                    <div className="bg-blue-950/10 border border-blue-800/20 p-4 flex justify-between items-center">
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Hard Drop</span>
                        <span className="text-[11px] text-white font-black">[↑]</span>
                    </div>
                    <div className="bg-blue-950/20 border border-cyan-500/40 p-4 flex justify-between items-center">
                        <span className="text-[9px] text-white font-bold uppercase tracking-widest">Rotate</span>
                        <span className="text-[11px] text-white font-black">[SPACE]</span>
                    </div>
                  </div>
              </div>
            </div>
          </>
        )}

        {/* Game Over Settlement Screen */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center p-4 md:p-8 z-[200]"
            >
              <div className={`w-full max-w-2xl border border-white/5 bg-[#050505] p-6 md:p-16 relative flex flex-col items-center ${evaluation.glow}`}>
                <div className="absolute top-0 left-0 w-2 h-2 bg-red-500/10" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500/10" />
                <div className="flex items-center justify-center space-x-4 md:space-x-12 mb-8 md:mb-16 w-full">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#d14b4b] shadow-[0_0_10px_#d14b4b]" />
                  <span className={`font-bold text-lg sm:text-2xl md:text-3xl tracking-[0.1em] md:tracking-[0.2em] uppercase ${evaluation.color}`}>
                    {evaluation.grade} - [ {evaluation.title} ]
                  </span>
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#d14b4b] shadow-[0_0_10px_#d14b4b]" />
                </div>
                <div className="text-center mb-2 md:mb-4">
                  <span className="text-[8px] md:text-xs text-[#526071] font-bold tracking-[0.2em] md:tracking-[0.4em] block mb-4 md:mb-6 uppercase">
                    FINAL ENTROPY RECYCLED
                  </span>
                  <div className={`text-[80px] sm:text-[120px] md:text-[160px] font-black leading-none tracking-tighter tabular-nums ${evaluation.color} drop-shadow-[0_0_30px_rgba(209,75,75,0.3)]`}>
                    {score}
                  </div>
                </div>
                <div className="w-full max-w-lg h-px bg-white/5 my-6 md:my-10" />
                <div className="max-w-xl text-center mb-8 md:mb-16">
                  <p className="text-[10px] md:text-[13px] text-white/90 font-bold leading-[1.6] md:leading-[1.8] uppercase tracking-[0.1em] md:tracking-[0.15em] text-center">
                    {evaluation.message.split(' (')[0]}
                  </p>
                  <p className="text-[10px] md:text-[13px] text-white/60 font-bold leading-[1.6] md:leading-[1.8] tracking-[0.05em] md:tracking-[0.1em] text-center mt-2">
                    ({evaluation.message.split(' (')[1]}
                  </p>
                </div>
                <button 
                  onClick={() => { playHighTechButton(); onClose(); }} 
                  className="relative group px-8 md:px-12 py-3 md:py-5 border border-cyan-400/80 hover:bg-cyan-400/10 transition-all duration-300 shadow-[0_0_25px_rgba(34,211,238,0.15)] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                >
                  <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-cyan-400/5 pointer-events-none" />
                  <span className="relative z-10 text-cyan-300 font-bold text-xs md:text-base tracking-[0.3em] md:tracking-[0.5em] uppercase">[ RETURN_TO_GENESIS ]</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 left-10 flex space-x-20 pointer-events-none opacity-20 hidden md:flex">
         <div className="flex flex-col">
            <span className="text-[8px] text-blue-900 font-bold uppercase mb-2 tracking-[0.2em]">Flux_Stability</span>
            <div className="flex space-x-1 items-end h-8">
               {[20, 65, 30, 90, 55, 40, 75, 20].map((h, i) => (
                 <motion.div key={i} animate={{ height: [`${h}%`, `${Math.max(10, h - 20)}%`, `${h}%`] }} transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }} className="w-[3px] bg-blue-600/50" />
               ))}
            </div>
         </div>
      </div>

      <style>{`
        /* iPad Portrait Specific Adjustments */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
            .tetris-side-panel {
                display: none !important;
            }
            .ipad-portrait-hud {
                display: flex !important;
            }
            .ipad-portrait-hint {
                display: block !important;
            }
        }
      `}</style>
    </motion.div>
  );
};

export default EntropyContainer;