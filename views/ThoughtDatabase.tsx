import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { AppView, ThoughtEntry } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { ArrowLeft, Eye, FileText, Headphones, X, Lock, Play, Pause, Activity, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import ViewManual, { ManualItem } from '../components/ViewManual';

// --- MANUAL DATA ---
const DECODER_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "READ",
    title: "文本重构 | TEXT RESTORATION",
    subtitle: "LOGICAL_DECRYPTION",
    content: "这是最基础的解码层。系统通过 UTF-8 协议将原始的二进制流逆向还原为人类可读的语义文本。\n\n它代表了左脑的逻辑功能：从混乱的神经信号中提取确切的定义与概念。这是‘理解’的第一步，将抽象的电信号坍缩为具体的语言符号。",
    meta: "MODE: SEMANTIC",
    code: "0xUTF8_DECODE"
  },
  {
    id: "LOOK",
    title: "神经可视化 | NEURO VISUALIZATION",
    subtitle: "VISUAL_CORTEX_MAPPING",
    content: "这一模式将二进制数据映射为二维的干涉波纹与粒子热力图。\n\n每一个比特决定了粒子的坐标偏移与光强。这不是随意的艺术，而是思维数据的拓扑投影。红色代表愤怒的尖锐波形，金色代表喜悦的扩散结构。它模拟了视觉皮层对抽象信号的具象化解析，让你‘看见’思维的形状。",
    meta: "MODE: SPATIAL",
    code: "0xGEN_ART"
  },
  {
    id: "LISTEN",
    title: "频谱可听化 | SPECTRAL SONIFICATION",
    subtitle: "AUDITORY_SYNTHESIS",
    content: "数据不仅可见，亦可听。LISTEN 模式将比特流转化为五声音阶的频率波动。\n\n高频振荡对应二进制的‘1’，低频基底对应‘0’。通过包络生成器与混响处理，冰冷的机器码被转化为具有情感色彩的声景。这是对思维‘韵律’的捕捉，模拟听觉皮层的共鸣。",
    meta: "MODE: HARMONIC",
    code: "0xAUDIO_FREQ"
  }
];

// --- HELPER: MOCK EMOTION DETECTION ---
const detectEmotion = (id: string): 'ANGER' | 'JOY' | 'CALM' => {
    const hash = id.charCodeAt(id.length - 1);
    if (hash % 3 === 0) return 'JOY';
    if (hash % 3 === 1) return 'ANGER';
    return 'CALM';
};

const NeuroVisualizer: React.FC<{ binary: string; emotion: 'ANGER' | 'JOY' | 'CALM' }> = ({ binary, emotion }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        let mainColor = '255, 255, 255'; 
        if (emotion === 'ANGER') mainColor = '239, 68, 68'; 
        if (emotion === 'JOY') mainColor = '234, 179, 8'; 
        if (emotion === 'CALM') mainColor = '34, 211, 238'; 

        const bytes: number[] = [];
        for (let i = 0; i < binary.length; i += 8) {
            bytes.push(parseInt(binary.slice(i, i + 8), 2) || 0);
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        ctx.lineWidth = 1;
        ctx.globalCompositeOperation = 'screen';

        bytes.forEach((byte, i) => {
            const normalized = byte / 255;
            const angle = (i / bytes.length) * Math.PI * 2 * 3; 
            const radius = normalized * (h * 0.4) + (i % 20);
            
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.strokeStyle = `rgba(${mainColor}, ${0.1 + normalized * 0.2})`;
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();

            ctx.beginPath();
            const particleSize = normalized * 4;
            ctx.fillStyle = `rgba(${mainColor}, ${normalized})`;
            ctx.arc(x, y, particleSize, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = `rgba(${mainColor}, 0.05)`;
        for(let i=0; i<h; i+=4) {
            ctx.fillRect(0, i, w, 1);
        }

    }, [binary, emotion]);

    return <canvas ref={canvasRef} className="w-full h-64 md:h-80 bg-black border border-white/10 rounded-sm" />;
};

const SpectralSonifier: React.FC<{ binary: string }> = ({ binary }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const isPlayingRef = useRef(false);

    // --- ENHANCED AUDIO LOGIC (SOFTENED FOR SONIC COMFORT) ---
    const SCALES = {
        MAJOR_PENTATONIC: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66],
        MINOR_PENTATONIC: [130.81, 155.56, 174.61, 196.00, 233.08, 261.63, 311.13],
        PHRYGIAN: [130.81, 138.59, 155.56, 174.61, 196.00, 207.65, 233.08],
        MYSTICAL: [130.81, 164.81, 174.61, 196.00, 233.08, 246.94, 261.63]
    };

    const stopAudio = () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        setIsPlaying(false);
        isPlayingRef.current = false;
    };

    const startAudio = async () => {
        if (isPlaying) { stopAudio(); return; }
        
        setIsPlaying(true);
        isPlayingRef.current = true;
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        // 1. DATA ANALYTICS
        let binarySum = 0;
        for (let char of binary) binarySum += char === '1' ? 1 : 0;
        const hash = binarySum % 4;
        const selectedScale = Object.values(SCALES)[hash];
        const baseFreqMultiplier = 1 + (binary.length % 12) / 12;

        // 2. MASTER CHAIN: Optimized for low noise
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.4; // Slightly lower master

        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(40, ctx.currentTime);
        compressor.ratio.setValueAtTime(12, ctx.currentTime);
        compressor.attack.setValueAtTime(0, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);
        
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.3;
        const delayFeedback = ctx.createGain();
        delayFeedback.gain.value = 0.3;
        
        const mainFilter = ctx.createBiquadFilter();
        mainFilter.type = 'lowpass';
        mainFilter.frequency.value = 1200; // Lower default cutoff to tame harshness
        mainFilter.Q.value = 1.0;

        masterGain.connect(mainFilter);
        mainFilter.connect(compressor);
        compressor.connect(ctx.destination);

        mainFilter.connect(delay);
        delay.connect(delayFeedback);
        delayFeedback.connect(delay);
        delay.connect(compressor);

        // 3. VISUALIZER SETUP
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        compressor.connect(analyser);

        // 4. SEQUENCER
        let index = 0;
        const bits = binary.split('');
        
        const playNext = () => {
            if (!isPlayingRef.current || !audioCtxRef.current) return;
            if (index >= bits.length) index = 0; 

            const nibble = bits.slice(index, index + 4).join('');
            const nibbleVal = parseInt(nibble, 2) || 0;
            const bit = bits[index];

            // FM SYNTHESIS - Reconfigured for sonic comfort
            const carrier = ctx.createOscillator();
            const modulator = ctx.createOscillator();
            const modGain = ctx.createGain();
            const noteGain = ctx.createGain();
            
            const noteIdx = (index + (bit === '1' ? 3 : 0) + (nibbleVal % 3)) % selectedScale.length;
            const freq = selectedScale[noteIdx] * baseFreqMultiplier;
            
            // Soften oscillator types: 'square' and 'sawtooth' are often too harsh for raw FM.
            // Using 'triangle' for high energy and 'sine' for low energy.
            carrier.type = nibbleVal > 10 ? 'triangle' : 'sine';
            carrier.frequency.setValueAtTime(freq, ctx.currentTime);
            
            modulator.type = 'sine'; // Use sine for modulation sidebands (purer tones)
            modulator.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
            // Reduced modulation index: nibbleVal * 10 -> nibbleVal * 4 to prevent harmonic distortion noise
            modGain.gain.setValueAtTime(nibbleVal * 4, ctx.currentTime);

            modulator.connect(modGain);
            modGain.connect(carrier.frequency);
            
            const now = ctx.currentTime;
            const duration = bit === '1' ? 0.25 : 0.6;
            const attackTime = 0.02 + (nibbleVal / 300); // Tiny attack to prevent DC clicks
            
            // Smoother filter transition using setTargetAtTime (exponential-like but more stable)
            const targetFreq = 400 + (nibbleVal * 120);
            mainFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);

            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(0.25, now + attackTime);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            carrier.connect(noteGain);
            noteGain.connect(masterGain);

            carrier.start(now);
            modulator.start(now);
            carrier.stop(now + duration + 0.1);
            modulator.stop(now + duration + 0.1);

            index++;
            const tempo = 120 + (bit === '1' ? 40 : 100); // Slower tempo for better clarity
            setTimeout(playNext, tempo); 
        };

        playNext();

        // 5. DRAW LOOP
        const draw = () => {
            if (!canvasRef.current || !isPlayingRef.current) return;
            const cvs = canvasRef.current;
            const c = cvs.getContext('2d');
            if (!c) return;

            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            c.fillStyle = 'rgba(0, 0, 0, 0.2)';
            c.fillRect(0, 0, cvs.width, cvs.height);

            const barWidth = (cvs.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                const r = 100 + (hash * 30);
                const g = 50 + (barHeight / 2);
                const b = 255 - (hash * 20);
                c.fillStyle = `rgb(${r}, ${g}, ${b})`;
                c.fillRect(x, cvs.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    useEffect(() => {
        return () => stopAudio();
    }, []);

    return (
        <div className="flex flex-col items-center space-y-4 w-full">
            <canvas ref={canvasRef} width={300} height={100} className="w-full bg-black/50 border border-purple-500/30 rounded-sm" />
            <button 
                onClick={startAudio}
                className={`flex items-center space-x-2 px-6 py-2 border-2 transition-all font-bold tracking-widest ${isPlaying ? 'border-red-500 text-red-400 animate-pulse' : 'border-cyan-500 text-cyan-400 hover:bg-cyan-900/20'}`}
            >
                {isPlaying ? <><Pause size={14} /> <span>CEASE_TRANSMISSION</span></> : <><Play size={14} /> <span>INITIATE_PLAYBACK</span></>}
            </button>
        </div>
    );
};

const ThoughtDatabase: React.FC = () => {
  const { thoughtEntries, setView, binaryToText } = useGeneData();
  const [selectedEntry, setSelectedEntry] = useState<ThoughtEntry | null>(null);
  const [isDecoderOpen, setIsDecoderOpen] = useState(false);
  const [decoderMode, setDecoderMode] = useState<'MENU' | 'READ' | 'LOOK' | 'LISTEN'>('MENU');
  const [showDecoderHelp, setShowDecoderHelp] = useState(false);

  const handleRowClick = (entry: ThoughtEntry) => {
    playMechKey();
    if (selectedEntry?.id === entry.id) {
      setSelectedEntry(null);
    } else {
      setSelectedEntry(entry);
    }
  };

  const handleBack = () => {
      playHighTechButton();
      setView(AppView.AI_THINKING);
  };

  const openDecoder = () => {
      if (!selectedEntry) return;
      playHighTechButton();
      setDecoderMode('MENU');
      setIsDecoderOpen(true);
  };

  const closeDecoder = () => {
      playHighTechButton();
      setIsDecoderOpen(false);
  };

  const switchMode = (mode: 'READ' | 'LOOK' | 'LISTEN') => {
      playMechKey();
      setDecoderMode(mode);
  };

  return (
    <HUDFrame 
      title="THOUGHT DATABASE [思维库]" 
      subtitle="AI_COGNITIVE_ARCHIVE_V1.0"
      className="md:translate-x-12"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex justify-between items-center mb-2 md:mb-4 px-1 shrink-0 bg-black/20 p-2 border-b border-purple-900/30">
          <div className="flex items-center space-x-4">
             <button 
                onClick={handleBack}
                className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-400 transition-colors"
             >
                <ArrowLeft size={14} />
                <span className="text-[10px] font-bold tracking-widest uppercase">BACK TO CORE</span>
             </button>
             <div className="h-4 w-[1px] bg-purple-900/50" />
             <div className="text-[8px] text-purple-400 font-mono tracking-widest">
                TOTAL_NODES: {thoughtEntries.length}
             </div>
          </div>

          <div className="flex items-center space-x-2">
            {selectedEntry && (
              <motion.button 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => { playMechKey(); setShowDecoderHelp(true); }}
                className="w-7 h-7 flex items-center justify-center border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all rounded-sm bg-black/40"
                title="DECODER_MANUAL"
              >
                <HelpCircle size={14} />
              </motion.button>
            )}
            <button 
                onClick={openDecoder}
                disabled={!selectedEntry}
                className={`
                    flex items-center space-x-2 px-6 py-1.5 border-2 transition-all duration-300 font-mono text-[10px] font-bold tracking-[0.2em] uppercase hidden md:flex
                    ${selectedEntry 
                        ? 'border-cyan-400 bg-cyan-900/20 text-cyan-300 shadow-[0_0_15px_#22d3ee] cursor-pointer hover:bg-cyan-400 hover:text-black' 
                        : 'border-purple-900/30 bg-black/40 text-purple-900/50 cursor-not-allowed opacity-50'
                    }
                `}
            >
                {selectedEntry ? <Lock size={12} className="animate-pulse" /> : <Lock size={12} />}
                <span>{selectedEntry ? 'INITIALIZE DECODER' : 'DECODER LOCKED'}</span>
            </button>
          </div>
        </div>

        <div className="flex text-[8px] md:text-[9px] text-cyan-600 font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-2 mb-2 px-2 shrink-0">
           <div className="w-20 md:w-32 shrink-0 border-l-2 border-cyan-500/50 pl-2">Time</div>
           <div className="flex-1 pl-4">Cognitive Output [Binary Stream]</div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-thin-scrollbar relative">
           {thoughtEntries.length === 0 ? (
              <div className="text-center text-cyan-900/50 mt-12 text-[10px] uppercase tracking-widest font-mono">
                 [ NO_THOUGHT_DATA_FOUND ]
              </div>
           ) : (
              <div className="space-y-1">
                 {thoughtEntries.map((entry) => {
                   const isSelected = selectedEntry?.id === entry.id;
                   return (
                     <div key={entry.id} className="flex flex-col">
                         <motion.div 
                            layoutId={`row-${entry.id}`}
                            onClick={() => handleRowClick(entry)}
                            className={`
                              group relative flex items-center py-3 px-2 border-l-4 transition-all cursor-pointer font-mono text-[9px] md:text-[10px] leading-relaxed
                              ${isSelected 
                                ? 'bg-purple-900/40 border-cyan-400 text-white shadow-[inset_0_0_30px_rgba(168,85,247,0.3)] z-10' 
                                : 'bg-transparent border-transparent text-cyan-600/80 hover:bg-purple-900/10 hover:border-purple-500/30 hover:text-cyan-300'
                              }
                            `}
                         >
                            <div className="w-20 md:w-32 shrink-0 opacity-70 group-hover:opacity-100 pl-2">{entry.timestamp}</div>
                            <div className={`flex-1 break-all truncate tracking-tight font-mono opacity-70 group-hover:opacity-100 pl-4 ${isSelected ? 'text-cyan-300 text-glow' : ''}`}>
                               {entry.responseBinary}
                            </div>
                            <div className="ml-2 w-6 text-center">
                               {isSelected ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="opacity-30" />}
                            </div>
                         </motion.div>

                         <AnimatePresence>
                           {isSelected && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="overflow-hidden border-b border-purple-500/30 bg-black/40 shadow-inner"
                             >
                                <div className="p-3 md:p-4 space-y-3 relative">
                                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-600" />
                                   <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                         <div className="w-1 h-1 bg-purple-500 rounded-full" />
                                         <span className="text-[8px] text-purple-400 font-bold tracking-widest uppercase">ORIGINAL_INPUT_SIGNAL</span>
                                      </div>
                                      <div className="text-[10px] text-purple-200 font-mono leading-relaxed border-l-2 border-purple-500/20 pl-3 py-1 ml-1.5 opacity-90">
                                         "{entry.question}"
                                      </div>
                                   </div>
                                   <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                         <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                                         <span className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">ENCRYPTED_NEURAL_RESPONSE</span>
                                      </div>
                                      <div className="text-[9px] text-cyan-700 font-mono break-all leading-tight ml-4 opacity-70 line-clamp-2">
                                         {entry.responseBinary}
                                      </div>
                                   </div>
                                   <div className="pt-2 flex items-center space-x-4">
                                      <button 
                                         onClick={(e) => { e.stopPropagation(); openDecoder(); }}
                                         className="w-full md:w-auto px-6 py-2 border border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-white text-[9px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                      >
                                         <Activity size={12} className="animate-pulse" />
                                         <span>ENGAGE_MULTIMODAL_DECODER</span>
                                      </button>
                                   </div>
                                </div>
                             </motion.div>
                           )}
                         </AnimatePresence>
                     </div>
                   );
                 })}
              </div>
           )}
        </div>

        <div className="mt-2 pt-2 border-t border-cyan-900/30 flex justify-between items-center text-[8px] text-cyan-800 font-mono uppercase tracking-wider shrink-0">
           <span>ARCHIVED_THOUGHTS: {thoughtEntries.length}</span>
           <div className="flex items-center space-x-2">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedEntry ? 'bg-cyan-400 animate-ping' : 'bg-cyan-900'}`} />
              <span>{selectedEntry ? `TARGET_LOCKED: [${selectedEntry.id.substring(0,8)}]` : 'IDLE'}</span>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showDecoderHelp && (
          <ViewManual 
            title="DECODER PROTOCOLS [解码协议]"
            subtitle="MULTIMODAL_TRANSLATION_LAYER"
            items={DECODER_MANUAL_ITEMS}
            theme="cyan"
            onClose={() => setShowDecoderHelp(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDecoderOpen && selectedEntry && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-3xl h-[50vh] md:h-[55vh] bg-[#050505] border border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-hidden flex flex-col"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0" />
                    
                    <div className="relative z-10 flex justify-between items-center p-4 border-b border-purple-500/30 bg-purple-900/10 shrink-0">
                        <div className="flex items-center space-x-3">
                            <Activity size={16} className="text-purple-400" />
                            <span className="text-sm font-black text-white tracking-[0.3em] uppercase">Multimodal Decoder</span>
                        </div>
                        <button onClick={closeDecoder} className="text-purple-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative z-10 flex-1 p-8 flex flex-col items-center justify-center overflow-hidden">
                        {decoderMode === 'MENU' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                <button 
                                    onClick={() => switchMode('READ')}
                                    className="group flex flex-col items-center justify-center p-8 border border-purple-500/30 hover:border-cyan-400 hover:bg-cyan-900/10 transition-all bg-black/40"
                                >
                                    <FileText size={40} className="text-purple-500 group-hover:text-cyan-400 mb-4 transition-colors" />
                                    <span className="text-lg font-black text-white tracking-widest uppercase mb-1">READ</span>
                                    <span className="text-[9px] text-purple-400 group-hover:text-cyan-300 font-mono">TEXT_RESTORATION</span>
                                </button>
                                <button 
                                    onClick={() => switchMode('LOOK')}
                                    className="group flex flex-col items-center justify-center p-8 border border-purple-500/30 hover:border-yellow-400 hover:bg-yellow-900/10 transition-all bg-black/40"
                                >
                                    <Eye size={40} className="text-purple-500 group-hover:text-yellow-400 mb-4 transition-colors" />
                                    <span className="text-lg font-black text-white tracking-widest uppercase mb-1">LOOK</span>
                                    <span className="text-[9px] text-purple-400 group-hover:text-yellow-300 font-mono">NEURO_VISUALIZATION</span>
                                </button>
                                <button 
                                    onClick={() => switchMode('LISTEN')}
                                    className="group flex flex-col items-center justify-center p-8 border border-purple-500/30 hover:border-red-400 hover:bg-red-900/10 transition-all bg-black/40"
                                >
                                    <Headphones size={40} className="text-purple-500 group-hover:text-red-400 mb-4 transition-colors" />
                                    <span className="text-lg font-black text-white tracking-widest uppercase mb-1">LISTEN</span>
                                    <span className="text-[9px] text-purple-400 group-hover:text-red-300 font-mono">SPECTRAL_SONIFICATION</span>
                                </button>
                            </div>
                        )}

                        {decoderMode === 'READ' && (
                            <div className="w-full h-full flex flex-col min-h-0">
                                <div className="flex-1 bg-black border border-cyan-500/20 p-6 font-mono text-sm leading-relaxed overflow-y-auto shadow-inner relative custom-thin-scrollbar">
                                    <div className="mb-6 border-b border-purple-900/30 pb-2">
                                        <span className="text-[9px] text-purple-500 font-bold uppercase tracking-widest block mb-1">
                                            ORIGINAL_QUERY_SOURCE [原始信号源]:
                                        </span>
                                        <span className="text-purple-300/60 text-xs italic">"{selectedEntry.question}"</span>
                                    </div>
                                    <div className="mb-4 text-[10px] text-cyan-700 font-bold uppercase tracking-widest pb-2">
                                        DECRYPTED_NEURAL_RESPONSE [神经解码响应]:
                                    </div>
                                    <div className="text-cyan-100 whitespace-pre-wrap leading-7">
                                        {binaryToText(selectedEntry.responseBinary)}
                                    </div>
                                </div>
                                <button onClick={() => setDecoderMode('MENU')} className="mt-4 self-center text-xs text-purple-500 hover:text-white tracking-widest uppercase shrink-0"> [ RETURN_TO_MENU / 返回菜单 ] </button>
                            </div>
                        )}

                        {decoderMode === 'LOOK' && (
                            <div className="w-full h-full flex flex-col items-center min-h-0">
                                <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
                                    <NeuroVisualizer binary={selectedEntry.responseBinary} emotion={detectEmotion(selectedEntry.id)} />
                                    <div className="mt-2 text-[9px] text-yellow-600 font-bold uppercase tracking-[0.3em] shrink-0"> EMOTION_TAG: {detectEmotion(selectedEntry.id)} </div>
                                </div>
                                <button onClick={() => setDecoderMode('MENU')} className="mt-4 text-xs text-purple-500 hover:text-white tracking-widest uppercase shrink-0">[ RETURN_TO_MENU ]</button>
                            </div>
                        )}

                        {decoderMode === 'LISTEN' && (
                            <div className="w-full h-full flex flex-col items-center justify-center min-h-0">
                                <div className="w-full max-w-md bg-black/60 border border-red-500/20 p-8 rounded-sm flex flex-col items-center">
                                    <SpectralSonifier binary={selectedEntry.responseBinary} />
                                </div>
                                <button onClick={() => setDecoderMode('MENU')} className="mt-8 text-xs text-purple-500 hover:text-white tracking-widest uppercase shrink-0">[ RETURN_TO_MENU ]</button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-thin-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 2px; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
        .text-glow { text-shadow: 0 0 8px rgba(34, 211, 238, 0.6); }
      `}</style>
    </HUDFrame>
  );
};

export default ThoughtDatabase;