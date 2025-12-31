
import React, { useState } from 'react';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { playHighTechButton } from '../utils/audio';

const GeneEncoding: React.FC = () => {
  const [text, setText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
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
    // 修改：显式传递用户 UID 以便统计
    addEntry(text, user.uid);
    setIsSuccess(true);
    setTimeout(() => {
      setView(AppView.DATABASE);
    }, 1500);
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
          
          <textarea
            value={text}
            readOnly={!user}
            onChange={(e) => setText(e.target.value)}
            onFocus={handleInteraction}
            className={`w-full h-full bg-transparent border-none text-purple-400 placeholder:text-purple-900 focus:outline-none resize-none font-mono text-xs sm:text-sm md:text-base leading-relaxed overflow-y-auto ${!user ? 'cursor-pointer' : ''}`}
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
            <p className="text-purple-700 font-bold mb-0.5 truncate uppercase">AUTH_USER:</p>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className={`w-1 h-1 rounded-full shrink-0 ${user ? 'bg-cyan-500 shadow-[0_0_5px_#22d3ee]' : 'bg-purple-900'}`} />
              <p className={`truncate font-bold ${user ? 'text-cyan-400' : 'text-purple-900'}`}>{user ? user.displayName : 'GUEST_NODE'}</p>
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
