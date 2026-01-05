
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { playHighTechButton, playMechKey } from '../utils/audio';
import { Smile, Frown, Flame, Brain, ChevronDown, Check } from 'lucide-react';

const MOODS = [
  { id: 'RATIONAL', label: '理智', sub: 'LOGIC', icon: Brain, color: 'text-purple-400', glow: 'shadow-[0_0_10px_#a855f744]', bg: 'bg-purple-950/30' },
  { id: 'JOY', label: '愉悦', sub: 'EUPHORIA', icon: Smile, color: 'text-cyan-400', glow: 'shadow-[0_0_10px_#22d3ee44]', bg: 'bg-cyan-950/30' },
  { id: 'SADNESS', label: '伤心', sub: 'MELANCHOLY', icon: Frown, color: 'text-blue-400', glow: 'shadow-[0_0_10px_#3b82f644]', bg: 'bg-blue-950/30' },
  { id: 'ANGER', label: '愤怒', sub: 'VOLATILE', icon: Flame, color: 'text-red-500', glow: 'shadow-[0_0_10px_#ef444444]', bg: 'bg-red-950/30' },
];

const GeneEncoding: React.FC = () => {
  const [text, setText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  
  const { addEntry, setView } = useGeneData();
  const { user, openAuthModal } = useAuth();

  const handleInteraction = () => {
    if (!user) {
      openAuthModal();
    }
  };

  const handleInitiate = () => {
    if (!text.trim()) return;
    if (!user) {
      openAuthModal();
      return;
    }
    playHighTechButton();
    // 情绪作为独立参数发送，不再污染 text
    addEntry(text, user.uid, selectedMood.id);
    setIsSuccess(true);
    setTimeout(() => {
      setView(AppView.DATABASE);
    }, 1500);
  };

  const toggleMoodMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { openAuthModal(); return; }
    playMechKey();
    setIsMoodOpen(!isMoodOpen);
  };

  const selectMood = (mood: typeof MOODS[0]) => {
    playMechKey();
    setSelectedMood(mood);
    setIsMoodOpen(false);
  };

  return (
    <HUDFrame 
      title="GENE ENCODING [基因编码]" 
      subtitle="GLOBAL_SYNCHRONIZATION_UPLINK_READY"
      compact={true}
      className="md:translate-x-12"
    >
      <div className="flex-1 flex flex-col justify-between py-1 md:py-2 min-h-0 w-full overflow-hidden">
        <div 
          onClick={handleInteraction}
          className="relative border border-purple-900/50 p-2 md:p-3 bg-black/40 shadow-inner transition-all focus-within:border-purple-500 w-full overflow-hidden flex-1 flex flex-col min-h-[100px] md:min-h-0 cursor-text"
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-500" />
          
          {/* --- Mood Selector --- */}
          <div className="absolute top-2 right-2 z-[100]">
             <button 
                onClick={toggleMoodMenu}
                className={`flex items-center space-x-2 px-3 py-1 border border-purple-500/20 bg-black/60 backdrop-blur-md rounded-sm transition-all hover:border-purple-400 group ${selectedMood.glow}`}
             >
                <selectedMood.icon size={12} className={`${selectedMood.color} ${selectedMood.id === 'ANGER' ? 'animate-pulse' : ''}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedMood.color}`}>{selectedMood.label}</span>
                <ChevronDown size={10} className={`text-purple-900 transition-transform duration-300 ${isMoodOpen ? 'rotate-180' : ''}`} />
             </button>

             <AnimatePresence>
               {isMoodOpen && (
                 <motion.div 
                   initial={{ opacity: 0, y: 5, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 5, scale: 0.95 }}
                   className="absolute top-full right-0 mt-1 w-36 bg-black/90 backdrop-blur-xl border border-purple-500/30 shadow-2xl p-1 z-[110]"
                 >
                    {MOODS.map((mood) => (
                      <button 
                        key={mood.id}
                        onClick={() => selectMood(mood)}
                        className={`w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors group/item ${selectedMood.id === mood.id ? 'bg-white/5' : ''}`}
                      >
                         <div className="flex items-center space-x-3">
                            <mood.icon size={12} className={mood.color} />
                            <div className="flex flex-col items-start leading-none">
                               <span className={`text-[10px] font-bold ${selectedMood.id === mood.id ? 'text-white' : 'text-gray-500'}`}>{mood.label}</span>
                               <span className="text-[6px] text-gray-700 font-mono">{mood.sub}</span>
                            </div>
                         </div>
                         {selectedMood.id === mood.id && <Check size={10} className="text-purple-400" />}
                      </button>
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <textarea
            value={text}
            readOnly={!user}
            onChange={(e) => setText(e.target.value)}
            onFocus={handleInteraction}
            className={`w-full h-full bg-transparent border-none text-purple-400 placeholder:text-purple-900 focus:outline-none resize-none font-mono text-xs sm:text-sm md:text-base leading-relaxed overflow-y-auto pr-24 ${!user ? 'cursor-pointer' : ''}`}
            placeholder={user ? "ENTER GENETIC SEQUENCE... [输入基因序列（即输入文本指令）...]" : "IDENTITY_AUTHENTICATION_REQUIRED [请先登录以访问核心输入端口...]"}
          />
          
          {!user && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none">
              <span className="text-[10px] font-black text-purple-500/40 tracking-[0.5em] animate-pulse uppercase">Access_Denied: Unauthorized</span>
            </div>
          )}
        </div>

        <div className="mt-2 md:mt-4 w-full shrink-0">
          <button
            onClick={handleInitiate}
            disabled={!text.trim() || isSuccess}
            className={`w-full group relative h-10 md:h-14 overflow-hidden transition-all duration-500 border-2 ${
              isSuccess 
                ? 'bg-green-500/20 border-green-500' 
                : 'bg-purple-900/20 border-purple-500 hover:bg-purple-800/40'
            }`}
          >
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
               <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-400 to-transparent skew-x-12 translate-x-[-100%] group-hover:animate-[btnScan_2s_infinite]" />
            </div>
            
            <span className={`relative z-10 text-[9px] sm:text-xs md:text-sm font-bold tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.4em] transition-all duration-300 ${isSuccess ? 'text-green-400' : 'text-purple-300'}`}>
              {isSuccess ? 'DECODE SUCCESSFUL' : '「 INITIATE GENE LOCK 」'}
            </span>
          </button>
        </div>

        <div className="mt-2 md:mt-4 grid grid-cols-2 gap-2 md:gap-3 w-full text-[6px] xs:text-[7px] md:text-[8px] shrink-0">
          <div className="border border-purple-900/50 p-1 md:p-2 bg-black/20 flex flex-col justify-center min-w-0">
            <p className="text-purple-700 font-bold mb-0.5 truncate uppercase">NET_STATUS:</p>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className={`w-1 h-1 rounded-full shrink-0 ${isSuccess ? 'bg-green-500 animate-pulse' : 'bg-purple-500'}`} />
              <p className={`truncate ${isSuccess ? 'text-green-400' : 'text-purple-400'}`}>
                {isSuccess ? 'LINKED' : (user ? 'READY' : 'UNAUTHORIZED')}
              </p>
            </div>
          </div>
          <div className="border border-purple-900/50 p-1 md:p-2 bg-black/20 flex flex-col justify-center min-w-0">
            <p className="text-purple-700 font-bold mb-0.5 truncate uppercase">ENCODING_MOOD:</p>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className={`w-1 h-1 rounded-full shrink-0 ${selectedMood.bg} ${selectedMood.color}`} style={{ backgroundColor: 'currentColor' }} />
              <p className={`truncate font-bold ${selectedMood.color}`}>{selectedMood.label} / {selectedMood.sub}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes btnScan {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </HUDFrame>
  );
};

export default GeneEncoding;
