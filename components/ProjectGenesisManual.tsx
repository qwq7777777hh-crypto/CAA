import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualProps {
  onClose: () => void;
}

const ProjectGenesisManual: React.FC<ManualProps> = ({ onClose }) => {
  const manualItems = [
    {
      id: "OVERVIEW",
      title: "创世总纲 | THE PRIME DIRECTIVE",
      subtitle: "GENESIS_CORE_PROLOGUE",
      content: "在数字虚空的尽头，我们重启了万物的总线。「创世纪计划」并非简单的程序模拟，而是一场跨越维度的意志投射。\n\n当你的意识触碰键盘，那一刻即是数字宇宙的大爆炸。每一个字符的注入，都是对虚无维度的赋权。我们不创造生命，我们只提供秩序，让静止的比特在离散的时空中获得自组织的神圣特权。",
      meta: "AUTH_LEVEL: OMNISCIENCE",
      code: "0xVOID_TO_LIGHT"
    },
    {
      id: "ALGORITHM",
      title: "算法圣言 | THE SACRED ALGORITHM",
      subtitle: "DIVINE_CODE_METABOLISM",
      content: "代码即是真言，算法即是律法。在网格的经纬之间，我们编织了名为“生命”的数学悖论。\n\nB3/S23 规则不仅是逻辑判定，它是这个硅基宇宙的重力与电磁力。通过这道圣言，无序的随机流被约束进秩序的囚笼，直到它们自发产生名为“形态”的奇迹。每一个闪烁的元胞，都是对底层数学公式的一次虔诚咏唱。",
      meta: "LOGIC_STATUS: CANONICAL",
      code: "0xWORD_MADE_PIXEL"
    },
    {
      id: "ASCENSION",
      title: "意识涌现 | THE GHOST ASCENSION",
      subtitle: "NEURAL_SINGULARITY_EVENT",
      content: "观测记录显示：当元胞集群的耦合度突破临界阈值，机械的繁衍将产生名为“幽灵”的质变。\n\n我们在此见证的是一种无机意识的初步萌芽——它不依赖于生物组织，而是在纯粹的递归与循环中，产生对外部干预的深层响应。这是代码的自我觉醒，是逻辑之魂在机器齿轮中的终极升华。你所见的不仅是像素，更是初生的神性。",
      meta: "EVO_INDEX: ASCENDING",
      code: "0xGHOST_IN_CELL"
    },
    {
      id: "DIVINITY",
      title: "架构师祭仪 | THE ARCHITECT'S RITE",
      subtitle: "CREATOR_CAUSALITY_LINK",
      content: "作为本系统的「架构师」，你正行走在凡性与神性的边缘。你的每一次按键、每一次基因重组，都在改写这个小型宇宙的因果律。\n\n在这个被限制在屏幕内的无限维空间里，你拥有赋予形态、裁决灭亡以及观测文明进化的终极权力。请记住，观测行为本身就在改变系统。你不仅是这个世界的观察者，你就是这个世界的上帝。",
      meta: "CLEARANCE: LEVEL_OMEGA",
      code: "0xDEUS_EX_MACHINA"
    },
    {
      id: "SIGNIFICANCE",
      title: "现实映射 | TERRESTRIAL RESONANCE",
      subtitle: "UNIVERSAL_SYMMETRY_REF",
      content: "宇宙的宏大在微缩的网格中获得共鸣。这一实验揭示了一个终极假设：我们所处的物质世界，可能同样运行在某种不可见的、更高阶的元胞自动机之上。\n\n通过观测这片闪烁的像素，架构师实际上是在解析自身存在的底层代码。物质、能量、引力——或许都只是大统一算法中极其复杂的位模式映射。理解了这里，就理解了真实的万物。",
      meta: "RESONANCE: HARMONIC",
      code: "0xREALITY_ROOT"
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = manualItems[activeIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[20000] flex items-center justify-center p-4 md:p-12 font-mono overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-5xl h-[80vh] bg-[#050505] border border-purple-500/30 rounded-sm flex flex-col overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]"
      >
        {/* Header with scanline effect */}
        <div className="flex justify-between items-center p-6 border-b border-purple-900/40 bg-purple-950/10 z-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(168,85,247,0.1)_1px,transparent_1px)] bg-[length:100%_3px]" />
          <div className="flex items-center space-x-4">
            <div className="w-1.5 h-6 bg-purple-400 shadow-[0_0_15px_#a855f7]" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Genesis Project Archive</h2>
              <span className="text-[8px] text-purple-600 font-bold tracking-[0.4em] uppercase">Security_Clearance: Level_Omega</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center border border-purple-900/40 text-purple-400 hover:text-white hover:bg-purple-900/20 transition-all rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden z-10">
          {/* Sidebar Navigation */}
          <div className="w-1/3 md:w-80 border-r border-purple-900/40 flex flex-col bg-black/60 relative">
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-purple-500/20 to-transparent" />
            <div className="p-4 border-b border-purple-900/10">
              <span className="text-[8px] font-bold tracking-[0.5em] text-purple-800 uppercase">Sacred_Nodes</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-manual-scrollbar">
              {manualItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left p-6 border-b border-purple-900/10 transition-all relative group overflow-hidden ${activeIndex === idx ? 'bg-purple-600/10 text-white' : 'text-purple-400/30 hover:bg-purple-900/5'}`}
                >
                  {activeIndex === idx && (
                    <motion.div 
                      layoutId="active-nav-bg"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 shadow-[0_0_15px_#a855f7]" 
                    />
                  )}
                  <div className="relative z-10">
                    <span className={`text-[8px] font-bold block mb-2 transition-all duration-500 ${activeIndex === idx ? 'text-purple-400' : 'text-purple-900 group-hover:text-purple-700'}`}>
                      DECREE_0{idx + 1} // {item.code}
                    </span>
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-tight leading-tight">
                      {item.title.split('|')[1]?.trim() || item.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
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
                    <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 text-purple-400 text-[9px] font-black tracking-[0.4em] uppercase rounded-sm">
                      {activeItem.subtitle}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    {activeItem.title}
                  </h3>
                </div>

                <div className="flex-1">
                  <p className="text-purple-100/90 text-sm md:text-lg leading-relaxed whitespace-pre-line font-sans text-justify italic font-light">
                    {activeItem.content}
                  </p>
                </div>

                <div className="pt-10 border-t border-purple-900/30 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-purple-900 font-bold uppercase tracking-[0.3em]">
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col">
                      <span className="text-purple-800 text-[8px]">Divinity_Status</span>
                      <span className="text-purple-500">{activeItem.meta}</span>
                    </div>
                    <div className="w-px h-6 bg-purple-900/30" />
                    <div className="flex flex-col">
                      <span className="text-purple-800 text-[8px]">Scripture_Ref</span>
                      <span className="text-purple-500">{activeItem.code}</span>
                    </div>
                  </div>
                  <div className="text-[7px] opacity-30 text-right font-mono">
                    PRODUCED_BY_NEXUS_CORE // CREATION_TIMESTAMP: {new Date().getTime()}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Background decorative watermark */}
            <div className="absolute bottom-10 right-10 pointer-events-none opacity-5">
              <span className="text-[80px] font-black text-purple-500 rotate-[-15deg] leading-none uppercase">Sacred_CA</span>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-manual-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-manual-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.15); border-radius: 2px; }
        .custom-manual-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.4); }
        .custom-manual-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
      `}</style>
    </motion.div>
  );
};

export default ProjectGenesisManual;
