import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onStart: () => void;
  onCancel: () => void;
}

const EntropyNarrative: React.FC<Props> = ({ onStart, onCancel }) => {
  const [text, setText] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const fullText = "警告：检测到稳定的演化残留物。\n这些是「创世模拟」中幸存的秩序碎片。当熵值达到临界点时，系统会自动提取这些“化石”。\n\n你的任务：通过逻辑重组，将这些稳定的元胞结构进行回收。如果碎片堆叠至顶端，本地节点将发生坍缩。\n\n从无序中提取有序，这是架构师最后的职责。";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[11000] bg-[#020617]/95 flex items-center justify-center p-4 md:p-6 font-mono pointer-events-auto"
    >
      <div className="w-full max-w-2xl border border-cyan-500/40 bg-black/80 backdrop-blur-md p-5 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] mx-2">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50" />
        <div className="absolute top-0 left-0 w-full h-[40px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center space-x-3 md:space-x-4 mb-6 md:mb-10">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse shrink-0" />
          <h2 className="text-cyan-400 font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-xs sm:text-base md:text-xl">
            RECOVERY_PROTOCOL: ENTROPY_CONTAINMENT
          </h2>
        </div>

        <div className="min-h-[180px] md:min-h-[220px] text-blue-50 leading-relaxed whitespace-pre-line text-[13px] sm:text-base md:text-lg font-medium tracking-wide">
          <span className="text-cyan-400 font-black mr-2">NOTICE:</span>
          {text}
          {!isTypingDone && <span className="inline-block w-2 h-4 md:h-5 bg-cyan-400 ml-1 animate-pulse shadow-[0_0_8px_#22d3ee]" />}
        </div>

        <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between border-t border-blue-900/30 pt-6 md:pt-8 gap-4 md:gap-0">
          <button 
            onClick={onCancel} 
            className="w-full md:w-auto text-[10px] md:text-[11px] text-blue-900 hover:text-cyan-400 transition-colors uppercase tracking-[0.3em] font-black py-2 md:px-4 border border-transparent hover:border-blue-900/30"
          >
            [ ABORT_DATA_RECOVERY ]
          </button>

          <AnimatePresence>
            {isTypingDone && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onStart}
                className="w-full md:w-auto px-6 md:px-10 py-3 md:py-4 font-black text-[11px] md:text-sm tracking-[0.3em] md:tracking-[0.5em] uppercase transition-all border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-black cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                INITIATE_RECYCLE
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t border-r border-cyan-500/20" />
        <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b border-l border-cyan-500/20" />
      </div>
    </motion.div>
  );
};

export default EntropyNarrative;