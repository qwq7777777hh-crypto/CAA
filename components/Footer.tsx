
import React, { useState, useEffect } from 'react';
import { playMechKey } from '../utils/audio';

interface FooterProps {
  onReset?: () => void;
  onCelebration?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onReset, onCelebration }) => {
  const [integrity, setIntegrity] = useState([80, 75, 90, 85, 95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIntegrity(prev => prev.map(v => Math.max(30, Math.min(100, v + (Math.random() - 0.5) * 10))));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetClick = () => {
    playMechKey();
    if (onReset) onReset();
  };

  const handleEmergenceClick = () => {
    if (onCelebration) onCelebration();
  };

  return (
    <div className="app-footer fixed bottom-0 left-0 w-[calc(100%-6rem)] h-12 bg-black/80 backdrop-blur-xl border-t border-purple-900/40 flex items-center justify-between px-8 text-[10px] text-purple-600 z-40 transition-all duration-300">
      
      {/* ================= DESKTOP LAYOUT (PC / Large Screens) - UNCHANGED ================= */}
      <div className="footer-desktop-only flex items-center space-x-8 overflow-hidden h-full flex-1">
        <div 
          onClick={handleResetClick}
          className="flex items-center space-x-2 shrink-0 cursor-pointer group hover:bg-purple-900/20 transition-all px-2 -ml-2 rounded"
        >
          <div className="w-1 h-3 bg-purple-500 shadow-[0_0_8px_#a855f7] group-hover:scale-y-125 transition-transform" />
          <div className="flex flex-col">
            <div className="border border-purple-500/30 px-2 py-0.5 font-bold text-purple-400 bg-purple-900/10 tracking-tighter flex items-center">
              TERMINAL_A1
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-purple-300">↩ BACK</span>
            </div>
          </div>
        </div>

        <div className="flex items-center h-full space-x-4">
          <div className="h-4 w-px bg-purple-900/40" />
          <div 
            onClick={handleEmergenceClick}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <span className="text-[7px] text-purple-700 font-bold tracking-widest border border-purple-900/30 px-1.5 py-0.5 rounded-sm">PHILOSOPHY_CORE</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-purple-400 font-bold tracking-[0.1em] transition-all group-hover:text-white group-hover:text-glow">
                涌现: 算法逻辑的无声觉醒。
              </span>
              <span className="text-[8px] text-purple-900 font-bold opacity-40 group-hover:opacity-100 transition-opacity">/ EMERGENCE: THE SILENT AWAKENING /</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-desktop-only flex items-center space-x-12 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-purple-800 font-bold tracking-widest text-[9px]">UPLINK_STABILITY</span>
          <div className="flex items-end space-x-0.5 h-3">
            {integrity.map((v, i) => (
              <div 
                key={i} 
                className="bg-purple-500/80 w-[2px] transition-all duration-500" 
                style={{ 
                  height: `${v}%`,
                  boxShadow: v > 70 ? '0 0 5px #a855f7' : 'none',
                  opacity: v / 100
                }} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 font-bold tracking-[0.3em] text-purple-500/60 border-l border-purple-900/30 pl-8">
          <span className="text-[8px] text-purple-900">NODE_ID:</span>
          <span className="text-purple-400">0x24F_NEXUS</span>
        </div>
      </div>


      {/* ================= MOBILE / TABLET / IPAD PORTRAIT LAYOUT ================= */}
      <div className="footer-mobile-group hidden w-full h-full relative">
         
         {/* --- [A] Mobile Portrait: Consistently hidden to allow centralized tagline in App.tsx --- */}
         <div 
            className="mobile-portrait-floating-text absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap cursor-pointer z-50 pointer-events-none hidden"
         >
            <span className="text-[9px] text-purple-400/90 font-mono tracking-widest animate-pulse hover:text-white hover:text-glow transition-colors bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded border border-purple-500/10">
               涌现：算法逻辑的无声觉醒
            </span>
         </div>

         {/* --- [B] The Bar Content (Shared Flex Container) --- */}
         <div className="w-full h-full flex items-center justify-between px-2">
            
            {/* LEFT: RESET (Simplified for Mobile) */}
            <div onClick={handleResetClick} className="flex-1 flex items-center justify-start cursor-pointer group active:opacity-60">
               <span className="text-[9px] font-bold text-purple-500 font-mono group-hover:text-white transition-colors">
                 [ RESET ]
               </span>
            </div>

            {/* CENTER: EMERGENCE TEXT (Visible ONLY on Landscape/iPad Portrait) */}
            <div 
               onClick={handleEmergenceClick}
               className="landscape-center-text flex-[2] items-center justify-center cursor-pointer group hidden"
            >
               <span className="text-[9px] text-purple-400 font-mono tracking-widest group-hover:text-glow group-hover:text-white transition-all opacity-80 group-hover:opacity-100">
                  涌现：算法逻辑的无声觉醒
               </span>
            </div>

            {/* RIGHT: DECOR STREAM (Visible ONLY on Landscape/iPad Portrait) */}
            <div className="landscape-right-decor flex-1 items-center justify-end space-x-3 hidden">
                <span className="text-[7px] text-purple-800 font-bold tracking-widest hidden xs:inline">UPLINK</span>
                <div className="flex space-x-0.5 items-end h-2">
                   {integrity.slice(0, 5).map((v, i) => (
                       <div key={i} className="w-0.5 bg-purple-600/60 transition-all duration-300" style={{ height: `${v}%` }} />
                   ))}
                </div>
                <span className="text-[7px] text-purple-500 font-mono">0x24F</span>
            </div>
         </div>

      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="w-full h-[1px] bg-purple-400 animate-[scan_4s_linear_infinite]" />
      </div>
      
      <style>{`
        @keyframes scan {
          from { transform: translateY(0); }
          to { transform: translateY(48px); }
        }

        /* --- MEDIA QUERY: MOBILE PORTRAIT (Phone Vertical) --- */
        @media (max-width: 767px) and (orientation: portrait) {
            .mobile-portrait-floating-text { display: none !important; }
            .landscape-center-text { display: none; }
            .landscape-right-decor { display: none; }
        }

        /* --- MEDIA QUERY: MOBILE LANDSCAPE & IPAD PORTRAIT --- */
        @media (max-height: 500px) and (orientation: landscape), 
               (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
            .mobile-portrait-floating-text { display: none; }
            .landscape-center-text { display: flex; } 
            .landscape-right-decor { display: flex; }
        }
      `}</style>
    </div>
  );
};

export default Footer;
