
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { getCtx, playPianoSequence, playMechKey } from '../utils/audio';

interface WelcomeScreenProps {
  onComplete: () => void;
  onShowManual: () => void;
}

const FloatingDecor: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div 
        animate={{ y: [-20, 20], opacity: [0, 0.4, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 text-[8px] text-purple-500 font-mono"
      >
        INIT_GENOME_SEQ_0x{Math.random().toString(16).slice(2,6).toUpperCase()}
      </motion.div>
      <motion.div 
        animate={{ y: [20, -20], opacity: [0, 0.3, 0] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute bottom-1/3 right-1/4 text-[8px] text-blue-500 font-mono"
      >
        SYS_UPLINK_READY_STATE: TRUE
      </motion.div>
      
      <motion.div 
        animate={{ rotate: 360, scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-purple-500/5 rounded-sm"
      />
      <motion.div 
        animate={{ rotate: -360, scale: [1.1, 0.9, 1.1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] border border-blue-500/5 rounded-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.2 }} 
        className="absolute top-1/2 left-1/2 -translate-x-[300px] -translate-y-[150px] w-4 h-12 border-l border-t border-purple-400" 
      />
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 0.2 }} 
        className="absolute top-1/2 left-1/2 translate-x-[280px] translate-y-[100px] w-4 h-12 border-r border-b border-purple-400" 
      />
    </div>
  );
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete, onShowManual }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [hex, setHex] = useState('0XF1B3');
  const [randomData, setRandomData] = useState<string[]>([]);

  const phrases = [
    "Hi～",
    "欢迎接入「涌现之弦」",
    "每一个字符都是一段待剪接的核苷酸\n每一个像素都是渴望进化的元胞",
    "你种下的文字基因，将在此处突破意义的边界\n自发涌现为律动的音流图谱",
    "—— 请注入初始序列，见证逻辑的视觉相变"
  ];

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  
  const gridTranslateX = useTransform(springX, [-1000, 1000], [-30, 30]);
  const gridTranslateY = useTransform(springY, [-1000, 1000], [-30, 30]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    setRandomData(Array.from({ length: 4 }).map(() => 
      Math.random().toString(16).slice(2, 10).toUpperCase()
    ));

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => {
      setHex('0X' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'));
    }, 1500);

    if (index < phrases.length) {
      const durations = [2500, 4500, 4500, 4500, 4500];
      const duration = durations[index] || 4500;
      const timer = setTimeout(() => setIndex(prev => prev + 1), duration); 
      return () => { clearTimeout(timer); clearInterval(interval); };
    } else {
      const finalTimer = setTimeout(onComplete, 1500);
      return () => { clearTimeout(finalTimer); clearInterval(interval); };
    }
  }, [index, onComplete, isStarted]);

  const handleSkip = () => {
    playMechKey();
    onComplete();
  };

  const handleManualClick = () => {
    playMechKey();
    onShowManual();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020202] flex flex-col items-center justify-center p-8 overflow-hidden font-mono select-none">
      <div className="bg-ring-effect">
        <div className="ring-item ring-outer"></div>
        <div className="ring-item ring-inner"></div>
      </div>

      <style>{`
        .bg-ring-effect {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: -10;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .ring-item {
          position: absolute;
          border-radius: 50%;
          filter: blur(1px);
          box-shadow: 0 0 30px rgba(208, 0, 255, 0.4), inset 0 0 30px rgba(208, 0, 255, 0.2);
        }
        .ring-outer {
          width: 650px;
          height: 650px;
          border: 1px dashed #d000ff;
          animation: 
            ring-pulse 12s ease-in-out infinite, 
            ring-flicker 4s ease-in-out infinite, 
            ring-rotate-ccw 50s linear infinite;
        }
        .ring-inner {
          width: 420px;
          height: 420px;
          border: 2px solid #d000ff;
          animation: 
            ring-pulse 10s ease-in-out infinite reverse, 
            ring-flicker 6s ease-in-out infinite alternate, 
            ring-rotate-cw 30s linear infinite;
        }
        @keyframes ring-pulse {
          0%, 100% { scale: 0.9; }
          50% { scale: 1.1; }
        }
        @keyframes ring-flicker {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        @keyframes ring-rotate-cw {
          from { rotate: 0deg; }
          to { rotate: 360deg; }
        }
        @keyframes ring-rotate-ccw {
          from { rotate: 0deg; }
          to { rotate: -360deg; }
        }
        @keyframes manual-breathing {
          0%, 100% { opacity: 0.6; text-shadow: 0 0 5px rgba(168, 85, 247, 0); }
          50% { opacity: 1.0; text-shadow: 0 0 15px rgba(168, 85, 247, 0.8); }
        }
        .animate-manual-pulse {
          animation: manual-breathing 2.5s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .ring-outer { width: 85vw; height: 85vw; }
          .ring-inner { width: 55vw; height: 55vw; }
        }
      `}</style>

      <motion.button 
        onClick={handleSkip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-10 right-28 z-[300] group flex items-center space-x-2 px-3 py-1.5 bg-purple-950/20 border border-purple-500/30 hover:border-purple-400 transition-all hover:bg-purple-900/40 overflow-hidden"
      >
        <motion.div 
          animate={{ x: ['-100%', '200%'] }} 
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent skew-x-12" 
        />
        <span className="relative z-10 text-[10px] text-purple-400 group-hover:text-white transition-colors tracking-widest font-bold">SKIP</span>
        <motion.span 
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative z-10 text-sm group-hover:text-white group-hover:text-glow"
        >
          ⏭
        </motion.span>
      </motion.button>

      <div className="absolute inset-0 pointer-events-none p-6 md:p-12">
        <div className="absolute top-10 left-10 flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
            <span className="text-[10px] text-purple-400 font-bold tracking-[0.3em]">SYS.READY</span>
          </div>
          <div className="text-[8px] text-purple-900 font-bold tracking-[0.2em] border-l border-purple-500/20 pl-2">
            UPLINK: ACTIVE<br/>NODE: 0x24F_NEXUS
          </div>
        </div>

        <div className="absolute bottom-10 left-10 flex flex-col">
          <div className="text-[9px] text-purple-900 font-bold tracking-[0.5em] mb-2 uppercase">Protocol_Sync_v5.2</div>
          <div className="w-32 h-[1px] bg-gradient-to-r from-purple-500/40 to-transparent" />
        </div>

        <div className="absolute bottom-10 right-10 flex flex-col items-end">
          <div className="w-12 h-12 border border-purple-500/10 rounded-full flex items-center justify-center relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-2 border-purple-500/40 rounded-full" 
            />
            <span className="text-[8px] text-purple-600 font-bold">SCAN</span>
          </div>
        </div>

        <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-purple-500/30" />
        <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-purple-500/30" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-purple-500/30" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-purple-500/30" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.12)_0%,transparent_70%)]" />
        
        <motion.div 
          style={{ x: gridTranslateX, y: gridTranslateY }}
          className="absolute inset-[-100px] opacity-[0.1]"
        >
          <div className="absolute inset-0" 
               style={{ backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.2) 1px, transparent 1px)', backgroundSize: '80px 80px' }} 
          />
          <div className="absolute inset-0" 
               style={{ backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
          />
        </motion.div>

        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.95)]" />
      </div>

      <AnimatePresence mode="wait">
        {!isStarted ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                onClick={() => { getCtx(); playPianoSequence(); setIsStarted(true); }}
                className="group relative flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-[-80px] border border-purple-500/5 transition-all duration-1000 group-hover:border-purple-500/20 group-hover:scale-105" />
                <div className="absolute inset-[-40px] border border-dashed border-purple-500/10 group-hover:border-purple-400/30" />
                
                <div className="absolute inset-[-40px] pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500 opacity-40" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500 opacity-40" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500 opacity-40" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500 opacity-40" />
                </div>

                <div className="relative z-10 flex flex-col items-center bg-black/40 px-12 py-8 border border-purple-500/20 group-hover:border-purple-400/50 backdrop-blur-sm transition-all duration-500">
                  <span className="text-5xl md:text-7xl font-sans font-black tracking-[0.5em] text-white transition-all duration-700 group-hover:scale-105 group-hover:text-glow uppercase drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                    ENTER
                  </span>
                  <div className="mt-6 flex flex-col items-center space-y-2">
                    <div className="w-16 h-[1px] bg-purple-500 shadow-[0_0_8px_#a855f7] animate-pulse" />
                    <span className="text-[10px] text-purple-400 font-bold tracking-[0.6em] opacity-40 group-hover:opacity-100 transition-opacity uppercase">Initialize_Creation</span>
                  </div>
                </div>
              </motion.button>

              <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 0.3 }}
                 transition={{ delay: 1, duration: 2 }}
                 className="absolute top-full mt-24 flex flex-col items-center space-y-1 pointer-events-none"
              >
                 <span className="text-[7px] text-purple-700 tracking-[0.5em] font-bold uppercase whitespace-nowrap">Neural_Link_Optimized_Secure_Channel_Active</span>
                 <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-1 h-1 bg-purple-900 rounded-full" />)}
                 </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div 
            key="phrases"
            className="relative flex flex-col items-center w-full px-6"
          >
            <FloatingDecor active={true} />
            
            <AnimatePresence mode="wait">
              {index < phrases.length && (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, filter: 'blur(15px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(15px)' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="max-w-6xl w-full flex flex-col items-center z-20"
                >
                  <p 
                    className={`text-white text-center leading-[1.8] transition-all whitespace-pre-line ${
                      index === 0
                        ? 'text-8xl md:text-[10rem] font-sans font-black' 
                      : index === 1 
                        ? 'text-4xl md:text-6xl font-sans font-black uppercase tracking-tight' 
                      : index === 4
                        ? 'text-3xl md:text-5xl font-sans font-bold'
                        : 'text-2xl md:text-4xl font-serif italic'
                    } ${(index === 2 || index === 3) ? 'drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]' : ''}`}
                    style={{ 
                        textShadow: (index === 0 || index === 1 || index === 4) 
                          ? '0 0 20px rgba(168, 85, 247, 0.9), 0 0 40px rgba(59, 130, 246, 0.6)' 
                          : 'none',
                        color: (index === 0 || index === 1 || index === 4) ? '#f3e8ff' : '#fff',
                        letterSpacing: (index === 0 || index === 1 || index === 4) ? '0.05em' : 'normal'
                    }}
                  >
                    {phrases[index]}
                  </p>
                  
                  {index > 0 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100px" }}
                      className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-12 shadow-[0_0_10px_#a855f7]"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-40 flex flex-col items-center space-y-6"
            >
               <div className="flex items-center space-x-12">
                  <span className="text-[9px] text-purple-900 font-bold tracking-[0.4em]">FRAGMENT_IDX: 0{index + 1}</span>
                  <div className="flex items-center space-x-2">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-1.5 rounded-sm transition-all duration-500 ${i <= index ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : 'bg-purple-950'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-purple-900 font-bold tracking-[0.4em]">SYNC_READY: TRUE</span>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeScreen;
