import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface ManualItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  meta: string;
  code: string;
}

export type ManualTheme = 'purple' | 'cyan' | 'orange';

interface ViewManualProps {
  title: string;
  subtitle: string;
  items: ManualItem[];
  theme: ManualTheme;
  onClose: () => void;
}

const ViewManual: React.FC<ViewManualProps> = ({ title, subtitle, items, theme, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  // Theme config
  const colors = {
    purple: {
      text: 'text-purple-400',
      textDim: 'text-purple-900',
      border: 'border-purple-500/30',
      borderDim: 'border-purple-900/10',
      bgSelect: 'bg-purple-600/10',
      shadow: 'shadow-[0_0_100px_rgba(168,85,247,0.15)]',
      glow: 'shadow-[0_0_15px_#a855f7]',
      accent: 'bg-purple-400'
    },
    cyan: {
      text: 'text-cyan-400',
      textDim: 'text-cyan-900',
      border: 'border-cyan-500/30',
      borderDim: 'border-cyan-900/10',
      bgSelect: 'bg-cyan-600/10',
      shadow: 'shadow-[0_0_100px_rgba(34,211,238,0.15)]',
      glow: 'shadow-[0_0_15px_#22d3ee]',
      accent: 'bg-cyan-400'
    },
    orange: {
      text: 'text-orange-400',
      textDim: 'text-orange-900',
      border: 'border-orange-500/30',
      borderDim: 'border-orange-900/10',
      bgSelect: 'bg-orange-600/10',
      shadow: 'shadow-[0_0_100px_rgba(249,115,22,0.15)]',
      glow: 'shadow-[0_0_15px_#f97316]',
      accent: 'bg-orange-400'
    }
  }[theme];

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4 md:p-12 font-mono overflow-hidden pointer-events-auto"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        className={`relative w-full max-w-5xl h-[80vh] bg-[#050505] border ${colors.border} rounded-sm flex flex-col overflow-hidden ${colors.shadow}`}
      >
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${colors.border} bg-opacity-10 z-20 relative overflow-hidden`}>
          <div className={`absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(currentColor_1px,transparent_1px)] bg-[length:100%_3px] ${colors.text}`} />
          <div className="flex items-center space-x-4">
            <div className={`w-1.5 h-6 ${colors.accent} ${colors.glow}`} />
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{title}</h2>
              <span className={`text-[8px] font-bold tracking-[0.4em] uppercase ${colors.textDim}`}>{subtitle}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`w-10 h-10 flex items-center justify-center border ${colors.border} ${colors.text} hover:text-white hover:bg-white/10 transition-all rounded-full`}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden z-10">
          {/* Sidebar */}
          <div className={`w-1/3 md:w-80 border-r ${colors.border} flex flex-col bg-black/60 relative`}>
            <div className={`absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-current to-transparent opacity-20 ${colors.text}`} />
            <div className={`p-4 border-b ${colors.borderDim}`}>
              <span className={`text-[8px] font-bold tracking-[0.5em] uppercase ${colors.textDim}`}>System_Modules</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-manual-scrollbar">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-6 border-b ${colors.borderDim} transition-all relative group overflow-hidden ${activeIndex === idx ? colors.bgSelect + ' text-white' : colors.text + ' opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                >
                  {activeIndex === idx && (
                    <motion.div 
                      layoutId="active-nav-bg"
                      className={`absolute left-0 top-0 bottom-0 w-1 ${colors.accent} ${colors.glow}`} 
                    />
                  )}
                  <div className="relative z-10">
                    <span className={`text-[8px] font-bold block mb-2 transition-all duration-500 ${activeIndex === idx ? colors.text : colors.textDim}`}>
                      0{idx + 1} // {item.code}
                    </span>
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-tight leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-manual-scrollbar bg-black/40 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-10 h-full flex flex-col"
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 bg-white/5 border ${colors.border} ${colors.text} text-[9px] font-black tracking-[0.4em] uppercase rounded-sm`}>
                      {activeItem.subtitle}
                    </span>
                    <div className={`flex-1 h-px bg-gradient-to-r from-current to-transparent opacity-20 ${colors.text}`} />
                  </div>
                  <h3 className={`text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-lg`}>
                    {activeItem.title}
                  </h3>
                </div>

                <div className="flex-1">
                  <p className={`text-sm md:text-lg leading-relaxed whitespace-pre-line font-sans text-justify italic font-light ${theme === 'orange' ? 'text-orange-100/90' : theme === 'cyan' ? 'text-cyan-100/90' : 'text-purple-100/90'}`}>
                    {activeItem.content}
                  </p>
                </div>

                <div className={`pt-10 border-t ${colors.borderDim} flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] ${colors.textDim} font-bold uppercase tracking-[0.3em]`}>
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col">
                      <span className="opacity-60 text-[8px]">Ref_Type</span>
                      <span className={colors.text}>{activeItem.meta}</span>
                    </div>
                    <div className={`w-px h-6 bg-current opacity-20`} />
                    <div className="flex flex-col">
                      <span className="opacity-60 text-[8px]">Index_Code</span>
                      <span className={colors.text}>{activeItem.code}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      <style>{`
        .custom-manual-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-manual-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .custom-manual-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .custom-manual-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
      `}</style>
    </motion.div>,
    document.body
  );
};

export default ViewManual;