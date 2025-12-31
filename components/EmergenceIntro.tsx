
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SacredMelody, playSacredInitiation, playMechKey } from '../utils/audio';
import { useGeneData } from '../context/GeneContext';
import { AppView } from '../types';

interface EmergenceIntroProps {
  onComplete: () => void;
  onShowManual: () => void;
}

const EmergenceIntro: React.FC<EmergenceIntroProps> = ({ onComplete, onShowManual }) => {
  const [stage, setStage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const melodyRef = useRef<SacredMelody | null>(null);
  const { setView } = useGeneData();

  const sections = [
    {
      title: "什么是「涌现」？",
      subtitle: "WHAT IS EMERGENCE?",
      content: "从简单的规则中，诞生出不可预测的宏大秩序。一个字节也许微小，但当它们在算法中发生相变，便成为了「秩序」本身。"
    },
    {
      title: "从混沌到秩序",
      subtitle: "FROM CHAOS TO ORDER",
      content: "在这里，你的每一个按键都在模拟元胞的繁衍与寂灭。这是逻辑的生物学，是代码的进化论。"
    }
  ];

  useEffect(() => {
    melodyRef.current = new SacredMelody();
    melodyRef.current.start();
    const timer = setInterval(() => {
      setStage(prev => {
        if (prev >= sections.length - 1) {
          clearInterval(timer);
          setTimeout(() => setIsFinished(true), 3500);
          return prev;
        }
        return prev + 1;
      });
    }, 4500);
    return () => {
      clearInterval(timer);
      if (melodyRef.current) melodyRef.current.stop();
    };
  }, []);

  // FIXED: Removed any potential await blocking and added try-catch for audio to ensure navigation always fires.
  const handleFinalAction = () => {
    try {
      // Fire-and-forget audio logic
      playSacredInitiation();
      if (melodyRef.current) melodyRef.current.stop();
    } catch (e) {
      console.warn("Audio initiation failed or was blocked, proceeding to app...", e);
    }
    
    // Critical path: State updates must execute immediately
    setView(AppView.ENCODING);
    onComplete();
  };

  const handleSkip = () => {
    try {
      playMechKey();
      if (melodyRef.current) melodyRef.current.stop();
    } catch (e) {
       console.warn("Audio failed", e);
    }
    setView(AppView.ENCODING);
    onComplete();
  };

  const handleManualClick = () => {
    playMechKey();
    onShowManual();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center p-8 overflow-hidden font-mono select-none">
      
      <motion.button 
        onClick={handleSkip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-10 right-10 z-[300] group flex items-center space-x-2 px-3 py-1.5 bg-purple-900/20 border border-purple-500/30 hover:border-purple-400 transition-all hover:bg-purple-800/40 cursor-pointer"
      >
        <span className="relative z-10 text-[10px] text-purple-400 group-hover:text-white transition-colors tracking-widest font-bold">SKIP</span>
        <span className="relative z-10 text-sm">⏭</span>
      </motion.button>

      <AnimatePresence mode="wait">
        {!isFinished && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none z-[250]"
          >
            <div className="max-w-4xl w-full flex flex-col items-center space-y-8">
              <div className="flex flex-col items-center space-y-2">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  {sections[stage].title}
                </h2>
                <span className="text-xs md:text-sm text-purple-500 font-bold tracking-[0.5em] opacity-60 uppercase">
                  {sections[stage].subtitle}
                </span>
              </div>

              <p className="text-lg md:text-2xl text-purple-200 leading-relaxed font-serif italic max-w-2xl">
                {sections[stage].content}
              </p>

              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_8px_#a855f7]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transform-gpu z-[500]"
          >
            {/* Added pointer-events-none to container to prevent blocking clicks */}
            <div className="intro-atomic-container mb-12 relative flex items-center justify-center pointer-events-none z-0">
              <div className="intro-atomic-scene">
                <div className="intro-orbit intro-orbit-x" />
                <div className="intro-orbit intro-orbit-y" />
                <div className="intro-orbit intro-orbit-z" />
                <div className="intro-nucleus" />
              </div>
            </div>

            {/* FIXED: Added z-[1000] and relative positioning to force button on top of everything */}
            <button
              onClick={handleFinalAction}
              className="relative z-[1000] cursor-pointer group px-16 py-5 bg-purple-600/10 border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-500 mb-6 overflow-hidden"
            >
              {/* 背景呼吸光晕 */}
              <motion.div 
                animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-purple-500/30 blur-2xl -z-10 pointer-events-none" 
              />
              
              {/* 扫光特效 */}
              <motion.div 
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent skew-x-12 z-0 pointer-events-none" 
              />

              {/* 边角闪烁点 */}
              <div className="absolute top-0 left-0 w-2 h-2 bg-purple-400 shadow-[0_0_10px_#a855f7] animate-pulse pointer-events-none" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-purple-400 shadow-[0_0_10px_#a855f7] animate-pulse delay-75 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-400 shadow-[0_0_10px_#a855f7] animate-pulse delay-150 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-400 shadow-[0_0_10px_#a855f7] animate-pulse delay-300 pointer-events-none" />

              <span className="relative z-10 text-2xl font-black text-white tracking-[0.5em] uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none">
                开始创世
              </span>
              
              {/* 激活时的额外外溢边框 */}
              <div className="absolute inset-[-4px] border border-purple-400/0 group-hover:border-purple-400/40 group-hover:scale-105 transition-all duration-700 pointer-events-none" />
            </button>

            <button
              onClick={handleManualClick}
              className="group relative z-[1000] flex flex-col items-center transition-all px-8 py-2 mb-8 cursor-pointer"
            >
              <span className="text-sm font-bold text-purple-300 tracking-[0.3em] group-hover:text-white transition-colors">
                创世纪计划说明
              </span>
              <div className="flex items-center space-x-2 mt-1 opacity-50 pointer-events-none">
                <div className="w-3 h-[1px] bg-purple-500" />
                <span className="text-[8px] text-purple-400 font-mono tracking-[0.1em] uppercase">Genesis_v0.1</span>
                <div className="w-3 h-[1px] bg-purple-500" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-full h-[1px] bg-purple-500/30 transition-all duration-500 pointer-events-none" />
            </button>

            <span className="text-[9px] text-purple-900 font-bold tracking-[0.6em] animate-pulse uppercase pointer-events-none">
              [ INITIATE EVOLUTIONARY SEQUENCE ]
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .intro-atomic-container {
          width: 240px;
          height: 240px;
          perspective: 1200px;
          will-change: transform;
          transform: translateZ(0); 
        }
        .intro-atomic-scene {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
        }
        .intro-nucleus {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 28px;
          height: 28px;
          background: #fff;
          border-radius: 50%;
          transform: translate(-50%, -50%) translateZ(10px);
          box-shadow: 
            0 0 20px #a855f7,
            0 0 40px rgba(168, 85, 247, 0.4);
          z-index: 10;
        }
        .intro-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          border: 1.5px solid rgba(168, 85, 247, 0.4);
          border-radius: 50%;
          transform-style: preserve-3d;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          backface-visibility: hidden;
          will-change: transform;
        }
        .intro-orbit-x {
          animation: intro-rotate-x 10s linear infinite;
        }
        .intro-orbit-y {
          width: 85%;
          height: 85%;
          border-color: rgba(59, 130, 246, 0.3);
          animation: intro-rotate-y 15s linear infinite;
        }
        .intro-orbit-z {
          width: 115%;
          height: 115%;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          animation: intro-rotate-z 25s linear infinite;
        }
        @keyframes intro-rotate-x {
          from { transform: translate(-50%, -50%) rotateX(0deg) rotateY(45deg); }
          to { transform: translate(-50%, -50%) rotateX(360deg) rotateY(45deg); }
        }
        @keyframes intro-rotate-y {
          from { transform: translate(-50%, -50%) rotateX(45deg) rotateY(0deg); }
          to { transform: translate(-50%, -50%) rotateX(45deg) rotateY(360deg); }
        }
        @keyframes intro-rotate-z {
          from { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) rotateX(60deg) rotateZ(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EmergenceIntro;
