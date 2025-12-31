
import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface HUDFrameProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  compact?: boolean;
  className?: string; // 支持外部透传定位
  onHelp?: () => void; // Optional help callback
}

const HUDFrame: React.FC<HUDFrameProps> = ({ children, title, subtitle, compact = false, className = "", onHelp }) => {
  return (
    <div className={`relative w-full h-full flex flex-col transition-all duration-700 mx-auto overflow-visible 
      ${compact ? 'max-w-2xl hud-frame-compact' : 'max-w-7xl hud-frame-wide'} 
      ${className.includes('md:') ? className : `md:${className}`}`}>
      
      {/* --- 周边科幻装饰 (Desktop only) --- */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {/* 左侧遥测点 */}
        <div className="absolute -left-12 top-1/4 flex flex-col items-center space-y-4 opacity-40">
           <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
           <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
           <span className="text-[6px] text-purple-700 font-mono rotate-90 origin-left">SYNC_TLM</span>
        </div>
        
        {/* 右侧扫描弧形 */}
        <div className="absolute -right-8 top-10 w-16 h-16 opacity-10">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="w-full h-full border-t-2 border-r-2 border-purple-500 rounded-full"
           />
        </div>

        {/* 底部坐标标签 */}
        <div className="absolute -bottom-8 right-0 flex items-center space-x-2 opacity-30">
           <span className="text-[7px] text-purple-500 font-mono uppercase tracking-widest">Target_Locked: [34.2, -118.4]</span>
           <div className="w-8 h-[1px] bg-purple-500" />
        </div>
      </div>

      {/* HUD Header: 优化移动端标题和子标题的重叠 */}
      <div className={`flex justify-between items-end ${compact ? 'mb-1 md:mb-3' : 'mb-2 md:mb-4'} border-b border-purple-900/50 pb-1 md:pb-3 shrink-0 px-1`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <div className={`w-1 ${compact ? 'h-3 md:h-5' : 'h-4 md:h-6'} bg-purple-500 shadow-[0_0_8px_#a855f7] shrink-0 mr-2 md:mr-3`} />
            <h1 className={`${compact ? 'text-xs sm:text-base md:text-lg' : 'text-sm sm:text-lg md:text-xl'} font-bold tracking-tighter text-glow truncate uppercase`}>{title}</h1>
            
            {/* Help Button - Moved next to Title for visibility */}
            {onHelp && (
              <button 
                onClick={onHelp} 
                className="ml-3 text-purple-500 hover:text-cyan-400 transition-colors cursor-pointer group flex items-center justify-center"
                title="OPEN_MANUAL"
              >
                <HelpCircle size={16} className="md:w-5 md:h-5 group-hover:drop-shadow-[0_0_8px_#22d3ee]" />
              </button>
            )}
          </div>
          
          {/* 副标题 */}
          {subtitle && (
            <div className="flex items-center mt-1">
              <p className="text-xs md:text-base text-purple-700 font-bold tracking-widest truncate opacity-90">{subtitle}</p>
            </div>
          )}
        </div>
        <div className="text-right text-[6px] md:text-[8px] text-purple-800 space-y-0.5 opacity-70 hidden sm:block font-mono shrink-0 ml-4">
          <p>DNA_BIN_v5.0</p>
          <p>STATUS: ACTIVE</p>
        </div>
      </div>

      {/* Wrapper for Content + Glowing Cubes */}
      <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Glowing Corner Cubes */}
          <div className="absolute -top-1 -left-1 w-2 h-2 md:w-3 md:h-3 bg-purple-500 shadow-[0_0_15px_#a855f7] z-30 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-purple-500 shadow-[0_0_15px_#a855f7] z-30 animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 md:w-3 md:h-3 bg-purple-500 shadow-[0_0_15px_#a855f7] z-30 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-purple-500 shadow-[0_0_15px_#a855f7] z-30 animate-pulse" />

          {/* Main Content Area: 紧凑化内边距 */}
          <motion.div 
            className={`relative w-full h-full bg-black/90 md:bg-black/60 border-2 rounded-sm flex-1 min-h-0 backdrop-blur-md overflow-hidden flex flex-col ${compact ? 'p-2 md:p-4' : 'p-2 md:p-6'}`}
            animate={{
              borderColor: [
                "rgba(168, 85, 247, 0.3)",
                "rgba(217, 70, 239, 0.7)",
                "rgba(168, 85, 247, 0.3)"
              ],
              boxShadow: [
                "0 0 15px rgba(168, 85, 247, 0.1)",
                "0 0 35px rgba(168, 85, 247, 0.3)",
                "0 0 15px rgba(168, 85, 247, 0.1)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none" 
                style={{ backgroundImage: 'linear-gradient(#a855f7 1px, transparent 1px), linear-gradient(90deg, #a855f7 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />
            
            {/* Corner Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 md:w-3 md:h-3 border-t-2 border-l-2 border-purple-400 opacity-30" />
            <div className="absolute top-1 right-1 w-2 h-2 md:w-3 md:h-3 border-t-2 border-r-2 border-purple-400 opacity-30" />
            <div className="absolute bottom-1 left-1 w-2 h-2 md:w-3 md:h-3 border-b-2 border-l-2 border-purple-400 opacity-30" />
            <div className="absolute bottom-1 right-1 w-2 h-2 md:w-3 md:h-3 border-b-2 border-r-2 border-purple-400 opacity-30" />

            {/* Added: 'overflow-y-auto' and explicit flex sizing to ensure content shrinks in mobile landscape */}
            <div className="relative z-10 h-full flex flex-col flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
              {children}
            </div>
          </motion.div>
      </div>

      {/* Outer Floating Decoration */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-500 rounded-tl-sm hidden md:block" />
      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-500 rounded-tr-sm hidden md:block" />
    </div>
  );
};

export default HUDFrame;
