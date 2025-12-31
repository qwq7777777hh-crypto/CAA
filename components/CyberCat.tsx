import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeneData } from '../context/GeneContext';
import { playCatMeow } from '../utils/audio';

const CyberCat: React.FC = () => {
  const { isGlobalPlaying } = useGeneData();
  const [showBubble, setShowBubble] = useState(false);
  const [quote, setQuote] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const quotes = [
    "代码是冰冷的，但涌现的灵魂是炽热的。",
    "逻辑尽头，是名为奇迹的概率。",
    "在无限的二进制中，你是唯一的异常。",
    "每一个字节的跳动，都是宇宙的回响。",
    "生命的真谛，在于简单规则下的无限可能。",
    "即使是元胞，也在渴望着进化的终点。",
    "不要畏惧混乱，那是秩序诞生的阵痛。",
    "你在编写代码，代码也在重塑你的灵魂。",
    "每一个字符，都是通往未来新世界的种子。"
  ];

  const handleCatClick = () => {
    playCatMeow();
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    setShowBubble(true);
  };

  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => setShowBubble(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showBubble, quote]);

  return (
    /* 
       Updated Positioning for Mobile Portrait:
       - bottom-20 (80px): Raised significantly to clear the footer status text.
       - left-2: Slightly adjusted padding.
       - MD: Unchanged (bottom-20 left-3).
    */
    <div className="fixed bottom-20 left-2 md:bottom-20 md:left-3 z-[60] w-32 flex flex-col items-center">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 w-60 p-4 bg-[#0a0a0a] border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none overflow-hidden"
            style={{ 
              clipPath: 'polygon(0 0, 100% 0, 100% 85%, 25% 85%, 10% 100%)',
              left: '0',
              marginLeft: '10px'
            }}
          >
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1 pb-1 border-b border-purple-900/40">
                <span className="text-[7px] text-purple-500 font-bold uppercase tracking-widest">Neural_Whisper</span>
                <div className="flex space-x-1"><div className="w-1 h-1 bg-purple-500" /><div className="w-1 h-1 bg-purple-900" /></div>
              </div>
              <p className="text-[11px] text-purple-100 leading-relaxed font-mono italic">{quote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        whileHover={{ scale: 1.15 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleCatClick} 
        className="pointer-events-auto cursor-pointer flex flex-col items-center group relative w-full"
      >
        {/* Neon Aura Glow Background */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
            >
              <div className="w-20 h-20 bg-cyan-500/30 blur-[30px] rounded-full animate-pulse" />
              <div className="absolute w-16 h-16 bg-purple-500/20 blur-[20px] rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`w-14 h-0.5 blur-[0.5px] mb-2 transition-all duration-500 ${isHovered ? 'bg-cyan-400 shadow-[0_0_15px_cyan,0_0_30px_cyan]' : 'bg-purple-500/20 shadow-none'}`} />
        
        <div className="relative w-11 h-11 flex items-center justify-center">
          <AnimatePresence>
            {isGlobalPlaying && [0, 1, 2].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 0, x: 0 }} 
                animate={{ 
                  opacity: [0, 1, 0], 
                  y: -40 - (i * 20), 
                  x: (i % 2 === 0 ? 12 : -12),
                  rotate: i * 45 
                }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }} 
                className={`absolute font-bold text-lg pointer-events-none ${isHovered ? 'text-cyan-300' : 'text-purple-400'}`}
              >
                {['♪', '♫', '♬'][i]}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <motion.svg 
            animate={{ 
              filter: isHovered 
                ? [
                    "drop-shadow(0 0 0px #22d3ee)",
                    "drop-shadow(0 0 8px #22d3ee)",
                    "drop-shadow(0 0 0px #22d3ee)"
                  ] 
                : "drop-shadow(0 0 0px rgba(0,0,0,0))"
            }}
            transition={{ 
              duration: 1.5, 
              repeat: isHovered ? Infinity : 0,
              ease: "easeInOut"
            }}
            width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            <AnimatePresence>
              {isGlobalPlaying && (
                <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  <rect x="8" y="10" width="4" height="12" fill={isHovered ? "#22d3ee" : "#3b82f6"} fillOpacity="0.8" />
                  <rect x="28" y="10" width="4" height="12" fill={isHovered ? "#22d3ee" : "#3b82f6"} fillOpacity="0.8" />
                  <path d="M8 12C8 6 32 6 32 12" stroke={isHovered ? "#22d3ee" : "#3b82f6"} strokeWidth="2" />
                </motion.g>
              )}
            </AnimatePresence>
            
            {/* Body */}
            <rect x="10" y="20" width="20" height="15" fill={isHovered ? "#fff" : "#a855f7"} fillOpacity={isHovered ? "0.9" : "0.4"} className="transition-all duration-300" />
            <rect x="8" y="22" width="24" height="11" fill={isHovered ? "#22d3ee" : "#a855f7"} fillOpacity={isHovered ? "0.8" : "0.3"} className="transition-all duration-300" />
            
            {/* Head */}
            <rect x="12" y="10" width="16" height="12" fill={isHovered ? "#fff" : "#a855f7"} fillOpacity={isHovered ? "1" : "0.6"} className="transition-all duration-300" />
            
            {/* Ears */}
            <path d="M12 10L12 5L17 10H12Z" fill={isHovered ? "#22d3ee" : "#a855f7"} fillOpacity="0.8" className="transition-all duration-300" />
            <path d="M28 10L28 5L23 10H28Z" fill={isHovered ? "#22d3ee" : "#a855f7"} fillOpacity="0.8" className="transition-all duration-300" />
            
            {/* Eyes */}
            <motion.rect animate={{ opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} x="15" y="14" width="2" height="2" fill={isHovered ? "#000" : "#fff"} />
            <motion.rect animate={{ opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: 0.1 }} x="23" y="14" width="2" height="2" fill={isHovered ? "#000" : "#fff"} />
            
            {/* Tail */}
            <motion.rect 
              animate={isGlobalPlaying ? { rotate: [-10, 40, -10] } : { rotate: [0, 20, 0] }} 
              transition={{ duration: isGlobalPlaying ? 0.3 : 1.5, repeat: Infinity }} 
              x="30" y="25" width="8" height="2" fill={isHovered ? "#22d3ee" : "#a855f7"} fillOpacity={isHovered ? "1" : "0.5"} 
              style={{ originX: '0px', originY: '1px' }}
              className="transition-all duration-300"
            />
          </motion.svg>
          
          {/* Scanning Line - intensified on hover */}
          <motion.div 
            animate={{ 
              top: ['-10%', '110%'],
              opacity: isHovered ? [0.6, 1, 0.6] : 0.2
            }} 
            transition={{ 
              duration: isHovered ? 0.5 : 2, 
              repeat: Infinity, 
              ease: "linear" 
            }} 
            className={`absolute left-0 w-full h-[2px] z-20 pointer-events-none transition-colors duration-300 ${isHovered ? 'bg-white shadow-[0_0_15px_#fff,0_0_5px_cyan]' : 'bg-white/40 shadow-none'}`} 
          />
        </div>

        <div className="mt-2 flex flex-col items-center w-full">
          <div className="h-3 flex items-center justify-center">
            <span className={`text-[7px] font-bold tracking-[0.2em] uppercase transition-all duration-500 whitespace-nowrap ${isHovered ? 'text-white scale-110 drop-shadow-[0_0_10px_#22d3ee]' : 'text-purple-600'}`}>
              {isHovered ? 'STATUS_OVERLOAD' : (isGlobalPlaying ? 'GENOME_GROOVE.sys' : 'NEKO_NEXUS.v4')}
            </span>
          </div>
          <div className="flex space-x-1 mt-1">
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isHovered ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : (isGlobalPlaying ? 'bg-blue-400 animate-ping' : 'bg-green-500/40')}`} />
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isHovered ? 'bg-cyan-400' : 'bg-purple-900/40'}`} />
            <div className={`w-1 h-1 rounded-full transition-colors duration-300 ${isHovered ? 'bg-cyan-400 shadow-[0_0_8px_cyan]' : 'bg-purple-900/40'}`} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CyberCat;