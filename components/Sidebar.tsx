
import React, { useState } from 'react';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { playPianoNote, playMechKey, playAtomHover } from '../utils/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { User, MessageSquare, Database, Cpu, Activity, Dna, Box, Share2, Zap, Sliders } from 'lucide-react';

/**
 * 核心导航侧边栏
 * 包含基础功能导航、2D创世快捷入口以及 3D 复杂演化子菜单
 */
const Sidebar: React.FC = () => {
  const { currentView, setView } = useGeneData();
  const { user, openAuthModal } = useAuth();
  const [rippleActive, setRippleActive] = useState(false);
  const [showLeniaMenu, setShowLeniaMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 基础导航项（已移除论坛，论坛现在独立放置）
  // 新增 MIXER 在 SPECTRAL 之前
  const navItems = [
    { view: AppView.ENCODING, label: '输入', sub: '编码', freq: 329.63, id: '01', icon: Cpu },
    { view: AppView.DATABASE, label: '数据库', sub: '库', freq: 392.00, id: '02', icon: Database },
    { view: AppView.AI_THINKING, label: 'AI大脑', sub: '思考', freq: 440.00, id: '03', icon: Activity },
    { view: AppView.THOUGHT_DB, label: '思维库', sub: '记忆', freq: 466.16, id: '04', icon: Share2 },
    { view: AppView.MIXER, label: '混音器', sub: '融合', freq: 480.00, id: '05', icon: Sliders }, // 新增
    { view: AppView.SPECTRAL, label: '总音频', sub: '频谱', freq: 493.88, id: '06', icon: Activity },
  ];

  // 3D/Lenia 子菜单项
  const subMenuItems = [
    { view: AppView.GENESIS_LENIA, label: 'DNA DYNAMICS [DNA动态]', color: 'text-purple-400', border: 'border-purple-500', icon: Dna },
    { view: AppView.NEURON_MAPPING, label: 'NEURON MAPPING [神经元映射]', color: 'text-cyan-400', border: 'border-cyan-500', icon: Activity },
    { view: AppView.SLIME_LAB, label: '3D SLIME LAB [3D黏菌实验室]', color: 'text-orange-400', border: 'border-orange-500', icon: Box },
    { view: AppView.BIO_QUANTUM, label: 'BIO-QUANTUM FIELD [生物量子流场]', color: 'text-blue-400', border: 'border-blue-500', icon: Zap },
  ];

  const handleNavClick = (view: AppView, freq: number) => {
    if (view === currentView) return;
    playMechKey(); 
    playPianoNote(freq * 2);
    setView(view);
    setShowLeniaMenu(false);
  };

  const handleProfileClick = () => {
    playMechKey();
    if (!user) {
      openAuthModal();
    } else {
      setView(AppView.PROFILE);
    }
  };

  const handleLeniaMainClick = (freq: number) => {
    setRippleActive(true);
    playMechKey();
    playPianoNote(freq * 1.5);
    setTimeout(() => setRippleActive(false), 1000);
    setShowLeniaMenu(!showLeniaMenu);
  };

  const handleSubItemClick = (view: AppView) => {
    playMechKey();
    setView(view);
    setShowLeniaMenu(false);
  };

  return (
    <>
      {/* 桌面端悬浮触发区 */}
      <div 
        className="fixed top-0 right-0 w-4 h-full z-[89] hidden md:block bg-transparent"
        onMouseEnter={() => setIsExpanded(true)}
      />

      <div 
        className={`app-sidebar fixed bottom-0 md:top-0 md:bottom-auto md:right-0 
          w-full md:w-28 h-20 md:h-full 
          flex flex-row md:flex-col items-center justify-around md:justify-start md:pt-32 md:space-y-6
          z-[90] 
          bg-black/90 md:bg-black/80 backdrop-blur-xl
          border-t md:border-t-0 md:border-l border-purple-900/40 
          transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isExpanded ? 'md:translate-x-0' : 'md:translate-x-full md:hover:translate-x-0'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* --- 第一组：个人中心与论坛 --- */}
        <div className="flex flex-row md:flex-col items-center md:space-y-6">
          {/* 用户头像/登录 */}
          <button
            onClick={handleProfileClick}
            className="relative group w-12 h-12 flex items-center justify-center outline-none"
          >
            <div className={`w-10 h-10 border-2 rounded-full flex items-center justify-center transition-all ${user ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_#22d3ee]' : 'border-purple-900/40 hover:border-purple-500'}`}>
              <User size={20} className={user ? 'text-cyan-400' : 'text-purple-700'} />
            </div>
            <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/80 px-2 py-1 border border-cyan-500/20 text-[8px] text-cyan-400 uppercase font-black">
              {user ? user.displayName : 'Identity_Auth'}
            </div>
          </button>

          {/* 玩家论坛 (置于个人中心下方) */}
          <button
            onClick={() => handleNavClick(AppView.FORUM, 480.00)}
            onMouseEnter={() => playAtomHover()}
            className={`relative group w-12 h-12 flex items-center justify-center transition-all ${currentView === AppView.FORUM ? 'text-white' : 'text-purple-700 hover:text-purple-400'}`}
          >
            <MessageSquare size={20} className={currentView === AppView.FORUM ? 'drop-shadow-[0_0_8px_white]' : ''} />
            <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/80 px-2 py-1 border border-purple-500/20 text-[8px] uppercase font-black">
              PLAYER FORUM [玩家论坛]
            </div>
            {currentView === AppView.FORUM && (
              <motion.div layoutId="active-nav" className="absolute -right-0 md:right-[-2px] w-1 h-6 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            )}
          </button>
        </div>

        {/* 分割装饰线 */}
        <div className="hidden md:block w-8 h-[1px] bg-purple-900/20 my-2" />

        {/* --- 第二组：核心功能导航 --- */}
        <div className="flex flex-row md:flex-col md:space-y-6">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view, item.freq)}
              onMouseEnter={() => playAtomHover()}
              className={`relative group w-12 h-12 flex items-center justify-center transition-all ${currentView === item.view ? 'text-white' : 'text-purple-700 hover:text-purple-400'}`}
            >
              <item.icon size={20} className={currentView === item.view ? 'drop-shadow-[0_0_8px_white]' : ''} />
              <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/80 px-2 py-1 border border-purple-500/20 text-[8px] uppercase font-black">
                {item.label}
              </div>
              {currentView === item.view && (
                <motion.div layoutId="active-nav" className="absolute -right-0 md:right-[-2px] w-1 h-6 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
              )}
            </button>
          ))}
        </div>

        {/* --- 第三组：创世与演化 --- */}
        <div className="flex flex-row md:flex-col items-center md:space-y-6 md:mt-auto md:pb-8">
          {/* 2D 创世 */}
          <button
            onClick={() => handleNavClick(AppView.GENESIS, 523.25)}
            className={`relative group w-12 h-12 flex items-center justify-center border-t border-purple-900/20 md:pt-4 ${currentView === AppView.GENESIS ? 'text-purple-400' : 'text-purple-900 hover:text-purple-500'}`}
          >
            <div className={`w-8 h-8 border flex items-center justify-center rotate-45 transition-all ${currentView === AppView.GENESIS ? 'border-purple-400 bg-purple-400/20' : 'border-current'}`}>
              <Dna size={16} className="-rotate-45" />
            </div>
            <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/80 px-2 py-1 border border-purple-500/20 text-[8px] uppercase font-black">
              2D_Genesis [2D创世]
            </div>
          </button>

          {/* 3D 演化 / Lenia 菜单 */}
          <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
            <AnimatePresence>
              {showLeniaMenu && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute bottom-full mb-4 md:bottom-auto md:right-full md:mr-6 flex flex-col space-y-2 w-64 pointer-events-auto"
                >
                  {subMenuItems.map((sub, idx) => (
                    <motion.button
                      key={sub.view}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleSubItemClick(sub.view)}
                      className={`flex items-center justify-between p-3 bg-black/90 border-r-4 ${sub.border} border-l border-t border-b border-white/5 hover:bg-white/5 transition-all group/subitem`}
                    >
                      <sub.icon size={14} className={`${sub.color} opacity-60 group-hover/subitem:opacity-100`} />
                      <span className={`text-[9px] font-black tracking-widest uppercase ${sub.color}`}>{sub.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => handleLeniaMainClick(659.25)}
              className={`relative group w-12 h-12 rounded-full border-2 transition-all duration-700 flex items-center justify-center ${showLeniaMenu ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_20px_#22d3ee]' : 'border-purple-500/40 hover:border-purple-400 bg-black/40'}`}
            >
              <AnimatePresence>
                {rippleActive && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 1 }} 
                    animate={{ scale: 2.5, opacity: 0 }} 
                    className="absolute inset-0 border border-cyan-400 rounded-full" 
                  />
                )}
              </AnimatePresence>
              <div className={`w-3 h-3 rounded-full transition-all duration-700 ${showLeniaMenu ? 'bg-white scale-125' : 'bg-purple-500'}`} />
              <div className="absolute right-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-black/80 px-2 py-1 border border-cyan-400/20 text-[8px] text-cyan-400 uppercase font-black">
                3D_Evolution [3D演化]
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
