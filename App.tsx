
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GeneProvider, useGeneData } from './context/GeneContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppView } from './types';
import MatrixBackground from './components/MatrixBackground';
import PCBackgroundDecor from './components/PCBackgroundDecor';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import GeneEncoding from './views/GeneEncoding';
import DnaDatabase from './views/DnaDatabase';
import SpectralAnalysis from './views/SpectralAnalysis';
import GenesisSim from './views/GenesisSim';
import GenesisLenia from './views/GenesisLenia';
import NeuronMapping from './views/NeuronMapping';
import SlimeLab from './views/SlimeLab';
import BioQuantumField from './views/BioQuantumField';
import AiThinking from './views/AiThinking';
import ThoughtDatabase from './views/ThoughtDatabase';
import UserProfile from './views/UserProfile';
import GlobalForum from './views/GlobalForum';
import PersonalDatabase from './views/PersonalDatabase';
import DataMixer from './views/DataMixer'; // 新增
import WelcomeScreen from './components/WelcomeScreen';
import EmergenceIntro from './components/EmergenceIntro';
import CyberCat from './components/CyberCat';
import EmergenceVisualizer from './components/EmergenceVisualizer';
import ProjectGenesisManual from './components/ProjectGenesisManual';
import AuthModal from './components/AuthModal';
import { playHighTechButton } from './utils/audio';

enum IntroStage {
  WELCOME = 'WELCOME',
  EMERGENCE = 'EMERGENCE',
  COMPLETE = 'COMPLETE'
}

const SciFiCursor: React.FC = () => {
  return (
    <div className="inline-flex items-center ml-2 md:ml-4 space-x-2 opacity-80">
      <motion.div 
        animate={{ 
          opacity: [0.2, 1, 0.2],
          height: [16, 24, 16],
          backgroundColor: ['#a855f7', '#fff', '#a855f7']
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="w-[2px] h-6 shadow-[0_0_10px_#a855f7]"
      />
      <div className="flex flex-col -space-y-0.5 font-mono">
        <span className="text-[7px] text-white/40 tracking-tighter">DATA_STREAM</span>
        <motion.span 
          animate={{ color: ['#a855f7', '#fff', '#a855f7'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[8px] font-bold"
        >
          L_NODE_01
        </motion.span>
      </div>
    </div>
  );
};

const AnimatedTitle: React.FC = () => {
  const title = "CELLULAR AUTOMATA";
  const letters = title.split("");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.1 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 150,
      },
    },
    hidden: {
      opacity: 0,
      y: 0,
      filter: "blur(4px)",
    },
  };

  return (
    <div className="title-wrapper relative flex flex-col items-center md:items-start lg:items-center px-4">
      <div className="absolute -top-4 left-0 right-0 flex justify-between px-2 opacity-30 pointer-events-none">
        <div className="w-8 h-[1px] bg-purple-500" />
        <div className="w-2 h-[1px] bg-white animate-pulse" />
        <div className="w-8 h-[1px] bg-purple-500" />
      </div>

      <div className="flex items-center justify-center relative w-full">
        <motion.span 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 0.4 }}
          className="text-2xl md:text-5xl font-light text-purple-400 mr-2 md:mr-4 hidden sm:block"
        >
          「
        </motion.span>

        <div className="flex items-center justify-center">
            <motion.h1 
              variants={container}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex overflow-hidden py-1 md:py-3"
            >
              {letters.map((letter, index) => (
                <motion.span
                  key={index}
                  variants={child}
                  className={`animated-title-char text-xl xs:text-2xl sm:text-3xl md:text-6xl font-black tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.25em] inline-block
                    ${letter === " " ? "mx-1 md:mx-4" : ""}
                    bg-clip-text text-transparent bg-gradient-to-b from-white via-purple-100 to-purple-700
                    hover:text-glow transition-all duration-300 cursor-default
                  `}
                  style={{ 
                    textShadow: '0 0 15px rgba(168,85,247,0.5), 0 0 30px rgba(59, 130, 246, 0.3)',
                    WebkitTextStroke: '0.5px rgba(255,255,255,0.05)'
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.h1>

            <SciFiCursor />
        </div>

        <motion.span 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 0.4 }}
          className="text-2xl md:text-5xl font-light text-purple-400 ml-2 md:mr-4 hidden sm:block"
        >
          」
        </motion.span>
      </div>

      <div className="flex items-center space-x-4 mt-[-4px] md:mt-[-8px] opacity-60">
        <div className="h-[1px] w-8 md:w-24 bg-gradient-to-r from-transparent to-purple-500/50" />
        <span className="text-[6px] md:text-[9px] text-purple-400 font-mono tracking-[0.5em] uppercase">
          Neural_Computation_Core
        </span>
        <div className="h-[1px] w-8 md:w-24 bg-gradient-to-l from-transparent to-purple-500/50" />
      </div>

      <motion.div 
        animate={{ 
          top: ['-20%', '120%'],
          opacity: [0, 0.9, 0],
          scaleY: [1, 1.2, 1]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent z-20 pointer-events-none shadow-[0_0_20px_#a855f7] mix-blend-screen"
      />
    </div>
  );
};

const ViewContainer: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const { currentView, setIsGlobalPlaying } = useGeneData();
  const [showInfo, setShowInfo] = useState(false);
  const [infoIndex, setInfoIndex] = useState(0);
  const [showEmergenceImmersion, setShowEmergenceImmersion] = useState(false);

  const infoTexts = [
    "元胞自动机（CA）是一种时间和空间都离散的动力系统。散布在规则网格中的每一个元胞，仅依据简单的局部规则进行同步演化，却能展现出极度复杂的全局行为。",
    "简单规则孕育复杂现象。正如康威生命游戏所展示的，即使是最基础的逻辑，在无限迭代下也能涌现出类似生命的宏大秩序与自我复制能力。",
    "冯·诺依曼最初构想的自复制机器。它是可计算性理论与复杂系统科学的交汇点，揭示了复杂性如何从最微小的有序扰动中自发生成。",
    "它不只是数学模型，更是一种哲学。数字物理学派认为，宇宙本身或许就是一个巨大的元胞自动机，在时空的网格中运行着终极的普朗克级算法。"
  ];

  const handleTitleClick = () => {
    playHighTechButton();
    if (!showInfo) {
      setInfoIndex(Math.floor(Math.random() * infoTexts.length));
    }
    setShowInfo(!showInfo);
  };

  const triggerCelebration = () => {
    playHighTechButton();
    setIsGlobalPlaying(false);
    setShowEmergenceImmersion(true);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.ENCODING: return <GeneEncoding />;
      case AppView.DATABASE: return <DnaDatabase />;
      case AppView.THOUGHT_DB: return <ThoughtDatabase />;
      case AppView.SPECTRAL: return <SpectralAnalysis />;
      case AppView.MIXER: return <DataMixer />; // 新增
      case AppView.GENESIS: return <GenesisSim />;
      case AppView.GENESIS_LENIA: return <GenesisLenia />;
      case AppView.NEURON_MAPPING: return <NeuronMapping />;
      case AppView.SLIME_LAB: return <SlimeLab />;
      case AppView.BIO_QUANTUM: return <BioQuantumField />;
      case AppView.AI_THINKING: return <AiThinking />;
      case AppView.PROFILE: return <UserProfile />;
      case AppView.FORUM: return <GlobalForum />;
      case AppView.PERSONAL_DB: return <PersonalDatabase />;
      default: return <GeneEncoding />;
    }
  };

  // 此处将 AppView.PERSONAL_DB 移除，使其不再作为全屏视图渲染
  const isFullView = currentView === AppView.GENESIS_LENIA || currentView === AppView.AI_THINKING || currentView === AppView.PROFILE || currentView === AppView.FORUM;

  return (
    <main className={`relative z-10 w-full h-full flex flex-col overflow-hidden bg-transparent ${isFullView ? '' : 'md:pr-24'}`}>
      <AnimatePresence>
        {!isFullView && (
          <header className="fixed top-0 left-0 w-full h-24 md:h-32 px-4 md:px-12 flex justify-between items-center z-[110] pointer-events-none border-b border-purple-900/10">
            <div className="space-y-1 hidden lg:block">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                <span className="text-[8px] md:text-[10px] text-green-500 font-bold uppercase tracking-widest">SYNC: 100%</span>
              </div>
              <p className="text-[8px] md:text-[10px] text-purple-700 font-bold">NODE: CA_CENTRAL</p>
            </div>
            
            <div className="main-header-content flex-1 md:flex-none flex flex-col items-center md:items-start lg:items-center pointer-events-auto group relative md:translate-x-[-2%] lg:translate-x-[-6%] md:pt-20 transition-all duration-500 w-full md:w-auto">
              <AnimatedTitle />

              <div onClick={handleTitleClick} className="subtitle-container mt-2 md:mt-3 flex items-center justify-center md:justify-start space-x-3 cursor-pointer group/sub">
                <div className="w-1 md:w-2 h-[1px] bg-purple-500 group-hover/sub:w-4 transition-all" />
                
                <div className="relative">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-[10px] md:text-[13px] font-bold tracking-[0.8em] text-purple-300 group-hover/sub:text-white transition-all drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                  >
                    元胞自动机
                  </motion.span>

                  <AnimatePresence>
                    {showInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 8, x: "-50%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="popup-container absolute top-full mt-4 left-1/2 w-[280px] md:w-[420px] z-[200] cursor-default"
                        style={{ left: 'calc(50% - 0.4em)' }}
                      >
                        <div className="relative bg-black/40 backdrop-blur-sm border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.25)] rounded-sm overflow-hidden p-5 md:p-6">
                            <p className="text-xs md:text-sm text-purple-100 leading-relaxed font-sans text-justify">
                                {infoTexts[infoIndex]}
                            </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="w-1 md:w-2 h-[1px] bg-purple-500 group-hover/sub:w-4 transition-all" />
              </div>
            </div>

            <div className="header-time-container text-right space-y-1 hidden sm:block">
              <div className="text-[10px] text-purple-500 font-bold font-mono">{new Date().toLocaleTimeString([], { hour12: false })}</div>
            </div>
          </header>
        )}
      </AnimatePresence>
      
      <div className={`main-view-container flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden ${isFullView ? 'p-0' : 'px-4 pt-28 pb-32 md:pt-48 md:pb-32'}`}>
        {!isFullView && (
          <div onClick={onReset} className="mobile-portrait-back-btn hidden pointer-events-auto cursor-pointer group active:scale-95 transition-all mb-1.5 self-start ml-2 opacity-40 hover:opacity-60">
            <div className="flex items-center space-x-1 border border-purple-500/20 bg-transparent px-2 py-0.5 rounded-sm">
              <span className="text-purple-500 text-[8px]">↩</span>
              <span className="text-purple-500 text-[7px] tracking-[0.2em] uppercase font-mono">BACK</span>
            </div>
          </div>
        )}

        <div className={`main-content-box w-full h-full flex items-center justify-center transition-all duration-700 ${isFullView ? 'max-w-none' : 'max-w-7xl md:max-h-[60vh] lg:max-h-[580px]'}`}>
          {renderView()}
        </div>
      </div>

      <AnimatePresence>
        {showEmergenceImmersion && <EmergenceVisualizer onComplete={() => setShowEmergenceImmersion(false)} />}
      </AnimatePresence>

      <CyberCat />
      <Sidebar />
      {!isFullView && <Footer onReset={onReset} onCelebration={triggerCelebration} />}
      <AuthModal />
    </main>
  );
};

const App: React.FC = () => {
  const [stage, setStage] = useState<IntroStage>(IntroStage.WELCOME);
  const [showManual, setShowManual] = useState(false);

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <AuthProvider>
      <GeneProvider>
        <div className="app-root fixed inset-0 overflow-hidden bg-black selection:bg-purple-500/30">
          <MatrixBackground />
          <PCBackgroundDecor />
          
          <AnimatePresence mode="wait">
            {stage === IntroStage.WELCOME && (
              <WelcomeScreen 
                key="welcome" 
                onComplete={() => setStage(IntroStage.EMERGENCE)} 
                onShowManual={() => setShowManual(true)} 
              />
            )}
            {stage === IntroStage.EMERGENCE && (
              <EmergenceIntro 
                key="intro" 
                onComplete={() => setStage(IntroStage.COMPLETE)} 
                onShowManual={() => setShowManual(true)} 
              />
            )}
            {stage === IntroStage.COMPLETE && (
              <ViewContainer key="main" onReset={handleReset} />
            )}
          </AnimatePresence>

          {/* 移除了 AnimatePresence，确保关闭时立刻从 DOM 中移除 */}
{showManual && (
  <ProjectGenesisManual onClose={() => setShowManual(false)} />
)}
        </div>
      </GeneProvider>
    </AuthProvider>
  );
};

export default App;
