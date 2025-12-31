
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { AppView, GeneEntry } from '../types';
import { playHighTechButton, playMechKey } from '../utils/audio';

const DnaDatabase: React.FC = () => {
  const { entries, setView, selectedGene, setSelectedGene } = useGeneData();

  const handleInitiateThinking = () => {
    if (selectedGene) {
      playHighTechButton();
      setView(AppView.AI_THINKING);
    }
  };

  const handleRowClick = (entry: GeneEntry) => {
    playMechKey();
    if (selectedGene?.id === entry.id) {
      setSelectedGene(null);
    } else {
      setSelectedGene(entry);
    }
  };

  return (
    <HUDFrame 
      title="DNA DATABASE [DNA数据库]" 
      subtitle="GENOME_ARCHIVE_V9.0"
      className="md:translate-x-12"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* --- Top Controls --- */}
        <div className="flex justify-between items-center mb-2 md:mb-4 px-1 shrink-0">
          <div className="flex items-center space-x-2 md:space-x-4">
             <div className="relative group">
                <input 
                  type="text" 
                  placeholder="SEARCH_NODES..." 
                  className="bg-purple-900/10 border border-purple-500/30 text-purple-300 text-[8px] md:text-[10px] px-3 py-1.5 md:py-2 w-32 md:w-48 focus:outline-none focus:border-purple-400 font-mono placeholder:text-purple-700/50 pl-8 transition-all"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
             </div>
          </div>
        </div>

        {/* --- Thinking Button (Absolute Positioned for Dramatic Effect) --- */}
        <div className="absolute top-0 right-0 z-20 pointer-events-none md:pointer-events-auto">
           <AnimatePresence>
             {selectedGene && (
               <motion.button
                 initial={{ opacity: 0, x: 50, scale: 0.9 }}
                 animate={{ opacity: 1, x: 0, scale: 1 }}
                 exit={{ opacity: 0, x: 50, scale: 0.9 }}
                 transition={{ type: "spring", stiffness: 300, damping: 20 }}
                 onClick={handleInitiateThinking}
                 className="pointer-events-auto flex items-center space-x-3 bg-black/90 backdrop-blur-md border border-cyan-400 text-cyan-400 px-6 py-2.5 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-950/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:text-white transition-all group overflow-hidden relative"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[scan_1s_ease-in-out_infinite]" />
                 <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
                 <span className="text-[10px] font-black tracking-[0.2em] uppercase relative z-10">THINKING | 思考</span>
                 <div className="absolute right-0 top-0 w-2 h-2 border-t border-r border-cyan-400" />
                 <div className="absolute left-0 bottom-0 w-2 h-2 border-b border-l border-cyan-400" />
               </motion.button>
             )}
           </AnimatePresence>
        </div>

        {/* --- Table Header --- */}
        <div className="flex text-[8px] md:text-[9px] text-purple-500 font-bold uppercase tracking-widest border-b border-purple-900/50 pb-2 mb-2 px-2 shrink-0">
           <div className="w-16 md:w-24 shrink-0 border-l-2 border-purple-500/50 pl-2">Time</div>
           {/* Source now displays Text, so we make it wider and visible */}
           <div className="w-24 md:w-48 shrink-0 pl-2">Source [文字]</div>
           <div className="flex-1 pl-4">Data Content [代码]</div>
        </div>

        {/* --- Table Content --- */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-thin-scrollbar relative">
           {entries.length === 0 ? (
              <div className="text-center text-purple-900/50 mt-12 text-[10px] uppercase tracking-widest font-mono">
                 [ NO_DATA_STREAM_DETECTED ]
              </div>
           ) : (
              <div className="space-y-1">
                 {entries.map((entry) => {
                   const isSelected = selectedGene?.id === entry.id;
                   return (
                     <motion.div 
                        key={entry.id}
                        layoutId={entry.id}
                        onClick={() => handleRowClick(entry)}
                        className={`
                          group relative flex items-start py-3 px-2 border-l-2 transition-all cursor-pointer font-mono text-[9px] md:text-[10px] leading-relaxed
                          ${isSelected 
                            ? 'bg-purple-600/20 border-purple-400 text-white shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]' 
                            : 'bg-transparent border-transparent text-purple-400/80 hover:bg-purple-900/10 hover:border-purple-500/30 hover:text-purple-300'
                          }
                        `}
                     >
                        {/* Glow Bar for Selected */}
                        {isSelected && (
                          <motion.div 
                            layoutId="selection-glow"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee]" 
                          />
                        )}

                        {/* Time */}
                        <div className="w-16 md:w-24 shrink-0 opacity-70 group-hover:opacity-100 pl-2">{entry.timestamp}</div>
                        
                        {/* Source (Original Text) - Displayed prominently with wrap */}
                        <div className="w-24 md:w-48 shrink-0 pl-2 font-bold text-white/90 whitespace-normal break-words pr-2">
                           {entry.originalText}
                        </div>
                        
                        {/* Data Content (Binary Stream) - Matrix style */}
                        <div className={`flex-1 break-all tracking-tight opacity-70 group-hover:opacity-100 ${isSelected ? 'text-cyan-200 text-glow' : 'text-purple-500/60'}`}>
                           {entry.binaryStream}
                        </div>
                     </motion.div>
                   );
                 })}
              </div>
           )}
        </div>

        {/* --- Footer Status --- */}
        <div className="mt-2 pt-2 border-t border-purple-900/30 flex justify-between items-center text-[8px] text-purple-800 font-mono uppercase tracking-wider shrink-0">
           <span>NODES: {entries.length}</span>
           <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${entries.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>LIVE</span>
           </div>
        </div>
      </div>
      
      <style>{`
        .custom-thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-thin-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 2px; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.4); }
        @keyframes scan {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </HUDFrame>
  );
};

export default DnaDatabase;
