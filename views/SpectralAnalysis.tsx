
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { playMechKey } from '../utils/audio';
import ViewManual, { ManualItem } from '../components/ViewManual';
import { Activity, Dna } from 'lucide-react';

// --- MANUAL DATA ---
const SPECTRAL_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "LOGIC",
    title: "微观秩序的相变 | PHASE TRANSITION OF MICRO-ORDER",
    subtitle: "BINARY_SMOOTHING",
    content: "涌现始于微观积累。原始的二进制流 (0/1) 如同离散的原子，在「密度卷积」算法的力场下发生相变。\n\n我们不直接演奏数据，而是模拟其物理质量与惯性。通过「能量共振」，冰冷的比特流被赋予了类似琴弦的物理张力。这是涌现的第一步：从离散的数字尘埃中，自发构筑出连续的能量波形。",
    meta: "ALGO: CONVOLUTION",
    code: "0xSIGNAL_SMOOTH"
  },
  {
    id: "EMERGENCE",
    title: "涌现：从无序到乐章 | EMERGENCE: CHAOS TO SYMPHONY",
    subtitle: "MACRO_PHENOMENON",
    content: "什么是涌现？它是整体大于部分之和。\n\n单个比特是静默的，但当数万个比特在时间轴上展开，它们复杂的交互便涌现出了宏观的“旋律”。这并非预设的乐谱，而是数据内在逻辑的听觉表达。你所听到的起伏，是信息熵在数学规则约束下，自发组织成的生命律动。这是无意识的代码，向有意识的听者发出的第一次共鸣。",
    meta: "CONCEPT: EMERGENCE",
    code: "0xMACRO_PATTERN"
  },
  {
    id: "MAPPING",
    title: "谐波约束与意义诞生 | HARMONIC CONSTRAINTS",
    subtitle: "MEANING_GENERATION",
    content: "涌现需要边界。我们将狂乱的数据能量映射至 C小调五声音阶 (C Minor Pentatonic) 的数学框架中。\n\n这种约束正如物理定律之于宇宙，让混乱得以结晶为秩序。低能量涌现为深沉的基底 (Drone)，高能量爆发为灵感的火花 (Pluck)。在这里，涌现体现为——你竟然能从随机的噪声中听出悲伤、喜悦或神圣。这便是“意义”从虚无中诞生的瞬间。",
    meta: "AUDIO: PENTATONIC",
    code: "0xSCALE_MAP"
  }
];

// --- ALGORITHM V3: DENSITY CONVOLUTION & RESONANCE ---
// 将原本嘈杂的二进制流转化为平滑的能量波形
const generateResonantWaveform = (binaryString: string): number[] => {
  if (!binaryString) return [];

  const output: number[] = [];
  const WINDOW_SIZE = 16; // 稍微增大窗口，使波形更连贯
  
  // 1. 密度卷积 (Density Convolution)
  const densities: number[] = [];
  for (let i = 0; i < binaryString.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < WINDOW_SIZE; j++) {
        if (i + j < binaryString.length) {
            sum += binaryString[i + j] === '1' ? 1 : 0;
            count++;
        }
    }
    densities.push(count > 0 ? sum / count : 0);
  }

  // 2. 能量共振 (Energy Resonance)
  let energy = 0;
  const attack = 0.15;
  const release = 0.08; // 稍微延长释放时间，让波形更平滑

  for (let i = 0; i < densities.length; i++) {
    const target = densities[i];
    if (target > energy) {
        energy += (target - energy) * attack;
    } else {
        energy += (target - energy) * release;
    }
    output.push(Math.floor(energy * 255));
  }

  return output;
};

// --- AUDIO SCALES: C Minor Pentatonic Extended ---
// 跨越3个八度，提供更丰富的旋律范围
const SCALE_FREQS = [
  130.81, 155.56, 174.61, 196.00, 233.08, // C3 - Bb3 (Base)
  261.63, 311.13, 349.23, 392.00, 466.16, // C4 - Bb4 (Mid)
  523.25, 622.25, 698.46, 783.99, 932.33  // C5 - Bb5 (High)
];

// 根据强度映射到音阶索引
const getHarmonicFreq = (intensity: number) => {
    // 允许更低的值触发声音，增加丰富度
    if (intensity < 15) return 0; 
    
    // 使用非线性映射，倾向于中频，极高能量才触发高频
    const normalized = Math.pow(intensity / 255, 1.2); 
    const idx = Math.floor(normalized * (SCALE_FREQS.length - 1));
    return SCALE_FREQS[idx];
};

type SourceMode = 'DNA' | 'THOUGHT';

const SpectralAnalysis: React.FC = () => {
  const { entries, thoughtEntries, setIsGlobalPlaying, isGlobalPlaying } = useGeneData();
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0); 
  const [currentBitChunk, setCurrentBitChunk] = useState('00000000');
  const [showHelp, setShowHelp] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>('DNA');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Audio Nodes Refs
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const audioCleanupTimerRef = useRef<any>(null); // Timer ref to prevent race conditions
  
  const currentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  
  const jumperRef = useRef({ x: 0, y: 0, targetY: 0 });

  // 动态主题配置
  const theme = useMemo(() => {
    return sourceMode === 'DNA' 
      ? { 
          main: '#a855f7', // Purple
          glow: '#d8b4fe',
          text: 'text-purple-600',
          textLight: 'text-purple-300',
          border: 'border-purple-500/30',
          bg: 'bg-purple-900/40',
          hueBase: 260
        }
      : { 
          main: '#22d3ee', // Cyan
          glow: '#a5f3fc',
          text: 'text-cyan-600',
          textLight: 'text-cyan-300',
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-900/40',
          hueBase: 180
        };
  }, [sourceMode]);

  const masterData = useMemo(() => {
    let fullBinary = '';
    if (sourceMode === 'DNA') {
        fullBinary = entries.map(e => e.binaryStream).join('');
    } else {
        fullBinary = thoughtEntries.map(e => e.responseBinary).join('');
    }
    
    if (!fullBinary) return [];
    return generateResonantWaveform(fullBinary);
  }, [entries, thoughtEntries, sourceMode]);

  useEffect(() => {
    // Reset playhead when source changes
    currentIdxRef.current = 0;
    setScrollOffset(0);
    stopAudio();
  }, [sourceMode]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [setIsGlobalPlaying]);

  useEffect(() => {
    if (!isGlobalPlaying && isPlaying) {
       stopAudio();
    }
  }, [isGlobalPlaying, isPlaying]);

  const stopAudio = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsGlobalPlaying(false);
      
      // FIX: Clear any pending cleanup timer immediately
      if (audioCleanupTimerRef.current) {
          clearTimeout(audioCleanupTimerRef.current);
          audioCleanupTimerRef.current = null;
      }

      // Stop Drone smoothly
      if (droneGainRef.current && audioContextRef.current) {
          try {
            const now = audioContextRef.current.currentTime;
            droneGainRef.current.gain.cancelScheduledValues(now);
            droneGainRef.current.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          } catch(e) {
            // Ignore error if audio context is already closed or invalid
          }
      }

      // Set a new cleanup timer
      audioCleanupTimerRef.current = setTimeout(() => {
          if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch(e) {}
            audioContextRef.current = null;
          }
          audioCleanupTimerRef.current = null;
      }, 1000);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    // Config
    const barWidth = width < 768 ? 4 : 5;
    const barGap = width < 768 ? 1 : 1;
    const totalStep = barWidth + barGap;
    const centerX = width / 2;

    // Clear
    ctx.fillStyle = 'rgba(2, 6, 23, 1)'; 
    ctx.fillRect(0, 0, width, height);

    // Grid (Themed)
    ctx.strokeStyle = sourceMode === 'DNA' ? 'rgba(168, 85, 247, 0.05)' : 'rgba(34, 211, 238, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = height; y > 0; y -= 40) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    const targetOffset = currentIdxRef.current;
    setScrollOffset(targetOffset);

    // Jumper Physics
    if (isPlaying) {
      const activeValue = masterData[Math.floor(targetOffset)] || 0;
      const targetHeight = 20 + (activeValue / 255) * (height * 0.6);
      jumperRef.current.targetY = height - targetHeight;
      jumperRef.current.x = centerX;
      jumperRef.current.y += (jumperRef.current.targetY - jumperRef.current.y) * 0.15;
    } else {
      jumperRef.current.y = height - 10;
    }

    // Render Waveform
    const maxVisibleBars = Math.ceil(width / totalStep) + 4;
    const startIdx = Math.max(0, Math.floor(targetOffset - maxVisibleBars / 2));
    const endIdx = Math.min(masterData.length, Math.ceil(targetOffset + maxVisibleBars / 2));

    for (let i = startIdx; i < endIdx; i++) {
      const val = masterData[i];
      const x = centerX + (i - targetOffset) * totalStep - (barWidth / 2);
      const isActive = Math.abs(x + barWidth/2 - centerX) < totalStep / 2;
      
      if (isActive) {
        const displayVal = val > 128 ? 1 : 0;
        const dummyByte = displayVal.toString().repeat(8);
        if (dummyByte !== currentBitChunk) setCurrentBitChunk(dummyByte);
      }

      const barHeight = 4 + (val / 255) * (height * 0.8);
      
      if (isActive) {
        if (val > 180) {
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = theme.main;
        } else {
            ctx.fillStyle = theme.main;
            ctx.shadowBlur = 15;
            ctx.shadowColor = theme.main;
        }
      } else {
        const hue = theme.hueBase + (val / 255) * 30; 
        const opacity = 0.2 + (val / 255) * 0.6;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
      
      if (val > 50) {
          ctx.fillStyle = sourceMode === 'DNA' ? `rgba(168, 85, 247, 0.08)` : `rgba(34, 211, 238, 0.08)`;
          ctx.fillRect(x, height, barWidth, barHeight * 0.3);
      }
    }
    ctx.shadowBlur = 0;

    // Render Playhead
    if (isPlaying) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
      const jumpRadius = (width < 768 ? 15 : 25) * pulse;
      const grd = ctx.createRadialGradient(
          jumperRef.current.x, jumperRef.current.y, 0, 
          jumperRef.current.x, jumperRef.current.y, jumpRadius
      );
      grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grd.addColorStop(0.3, sourceMode === 'DNA' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(34, 211, 238, 0.5)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grd;
      ctx.beginPath(); 
      ctx.arc(jumperRef.current.x, jumperRef.current.y, jumpRadius, 0, Math.PI * 2); 
      ctx.fill();
    }

    ctx.strokeStyle = isPlaying ? 'rgba(255, 255, 255, 0.15)' : (sourceMode === 'DNA' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 211, 238, 0.1)');
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [masterData, isPlaying, theme]); // Added theme dep

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    if (masterData.length === 0) return;
    
    // FIX: Clear pending cleanup timer to prevent killing the new session
    if (audioCleanupTimerRef.current) {
        clearTimeout(audioCleanupTimerRef.current);
        audioCleanupTimerRef.current = null;
    }

    // Explicitly close any old context that might still be lingering (e.g. paused fade out)
    if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
    }

    setIsPlaying(true);
    setIsGlobalPlaying(true);
    isPlayingRef.current = true;
    
    // --- INIT AUDIO ENGINE V4 ---
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // 1. Master Chain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4; 
    masterGainRef.current = masterGain;
    
    // Compressor for glue
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // 2. Space Echo FX (Delay + Reverb Simulation)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.35; // 350ms (dotted 8th feel)
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1200; // Dark echoes

    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(masterGain);
    delayNodeRef.current = delay;

    // 3. Ambient Drone Layer (Atmosphere)
    // Continuous bass pad that swells with intensity
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'triangle';
    droneOsc.frequency.value = 65.41; // Low C2
    
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 100; // Start dark
    
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05; // Start quiet
    
    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
    
    droneOscRef.current = droneOsc;
    droneGainRef.current = droneGain;
    droneFilterRef.current = droneFilter;

    // 4. Playback Loop
    const sequence = async () => {
      let lastVal = 0;
      
      while (isPlayingRef.current && currentIdxRef.current < masterData.length) {
        const i = Math.floor(currentIdxRef.current);
        const value = masterData[i];
        
        // --- Layer 1: Drone Modulation ---
        // Modulate drone volume and filter cutoff based on data energy
        // Smooth changes using linearRamp
        const droneTargetVol = 0.05 + (value / 255) * 0.15;
        const droneTargetFreq = 100 + (value / 255) * 400;
        
        droneGain.gain.linearRampToValueAtTime(droneTargetVol, ctx.currentTime + 0.1);
        droneFilter.frequency.linearRampToValueAtTime(droneTargetFreq, ctx.currentTime + 0.1);

        // --- Layer 2: Melodic Arpeggiator ---
        // Trigger notes more frequently, not just on peaks.
        // Probability based on intensity: Higher intensity = Higher chance to play
        // This creates "flurries" of notes in active areas.
        
        const triggerThreshold = 40;
        // Chance to play: 0% at threshold, 100% at max
        const playChance = Math.max(0, (value - triggerThreshold) / (255 - triggerThreshold));
        
        // Always trigger if it's a significant jump (Transient)
        const isTransient = (value - lastVal) > 30;
        
        if (value > triggerThreshold && (Math.random() < playChance * 0.4 || isTransient)) {
            const freq = getHarmonicFreq(value);
            
            if (freq > 0) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const pan = ctx.createStereoPanner(); // Add stereo width
                
                // Sound Design: Pluck sound
                osc.type = value > 200 ? 'sawtooth' : 'sine'; 
                
                // Slight random detune for chorus effect
                const detune = (Math.random() - 0.5) * 10;
                osc.detune.value = detune;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                
                // Random Pan (-0.5 to 0.5)
                pan.pan.value = (Math.random() - 0.5);

                // Envelope: Short pluck
                const now = ctx.currentTime;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                
                osc.connect(gain);
                gain.connect(pan);
                pan.connect(masterGain); // Dry signal
                pan.connect(delay);      // Wet signal (Echo)
                
                osc.start();
                osc.stop(now + 0.35);
            }
        }
        
        // --- Layer 3: Glitch Textures (High Frequency Details) ---
        // Trigger tiny clicks on very fast changes
        if (Math.abs(value - lastVal) > 50) {
             const noiseOsc = ctx.createOscillator();
             const noiseGain = ctx.createGain();
             noiseOsc.type = 'square';
             noiseOsc.frequency.value = 2000 + Math.random() * 2000;
             
             noiseGain.gain.setValueAtTime(0.02, ctx.currentTime);
             noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
             
             noiseOsc.connect(noiseGain);
             noiseGain.connect(masterGain);
             noiseOsc.start();
             noiseOsc.stop(ctx.currentTime + 0.05);
        }

        lastVal = value;
        
        // Variable Speed
        const stepDelay = value > 150 ? 50 : 30; // Fast stream, slow down slightly for dense info
        
        currentIdxRef.current += 1;
        await new Promise(r => setTimeout(r, stepDelay));
      }
      
      if (currentIdxRef.current >= masterData.length) {
        stopAudio();
        currentIdxRef.current = 0;
      }
    };
    sequence();
  };

  const handleHelp = () => {
    playMechKey();
    setShowHelp(true);
  };

  const toggleSource = () => {
    playMechKey();
    // Stop playback if running to prevent index mismatch
    stopAudio();
    setSourceMode(prev => prev === 'DNA' ? 'THOUGHT' : 'DNA');
  };

  return (
    <HUDFrame 
      title="EMERGENCE: STRING [涌现之弦]" 
      subtitle={sourceMode === 'DNA' ? "HARMONIC_RESONANCE_ENGINE" : "COGNITIVE_ECHO_ANALYSIS"} 
      className="md:translate-x-6"
      onHelp={handleHelp}
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 md:mb-5 shrink-0 px-1">
          <div className="flex space-x-4 md:space-x-12 items-center">
            {/* TOGGLE SWITCH */}
            <button 
              onClick={toggleSource}
              className={`flex items-center space-x-2 px-3 py-1.5 border transition-all ${sourceMode === 'DNA' ? 'border-purple-500 bg-purple-900/20' : 'border-cyan-500 bg-cyan-900/20'}`}
            >
               {sourceMode === 'DNA' ? (
                 <Dna size={14} className="text-purple-400" />
               ) : (
                 <Activity size={14} className="text-cyan-400" />
               )}
               <span className={`text-[9px] font-bold tracking-widest uppercase ${sourceMode === 'DNA' ? 'text-purple-300' : 'text-cyan-300'}`}>
                 {sourceMode === 'DNA' ? 'SOURCE: DNA_DB' : 'SOURCE: THOUGHT_DB'}
               </span>
            </button>

            <div className={`text-[8px] md:text-[11px] ${theme.text} font-mono uppercase tracking-tight`}>
              <p className={`${theme.textLight} font-bold opacity-95`}>RESONANCE_BUFFER</p>
              <p className="opacity-50">{Math.floor(scrollOffset)}/{masterData.length}</p>
            </div>
            <div className={`text-[8px] md:text-[11px] ${theme.text} font-mono border-l ${theme.border} pl-4 md:pl-8 uppercase tracking-tight hidden xs:block`}>
              <p className={`${theme.textLight} font-bold opacity-95`}>ENERGY: {masterData[Math.floor(scrollOffset)] || 0}</p>
              <p className="opacity-50">LAYER: { (masterData[Math.floor(scrollOffset)] || 0) > 180 ? 'MELODIC_PEAK' : 'AMBIENT_DRONE' }</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={handleTogglePlay} className={`flex items-center space-x-2 md:space-x-6 border-2 px-5 md:px-12 py-2 md:py-3 font-bold transition-all bg-transparent ${isPlaying ? `border-white text-white ${theme.bg}` : `${theme.border} ${theme.text} hover:border-current`}`}>
              {isPlaying ? <div className="flex space-x-1"><div className="w-1.5 h-3 bg-white" /><div className="w-1.5 h-3 bg-white" /></div> : <span className="text-white text-[10px] md:text-sm">▶</span>}
              <span className="tracking-[0.2em] md:tracking-[0.6em] uppercase text-[9px] md:text-[11px]">{isPlaying ? 'SUSPEND' : 'RESONATE'}</span>
             </button>
            <button onClick={() => { currentIdxRef.current = 0; stopAudio(); }} className={`px-3 md:px-8 py-2 md:py-3 border ${theme.border} text-[9px] md:text-[11px] ${theme.text} hover:text-white uppercase font-bold tracking-widest transition-all`}>RST</button>
          </div>
        </div>

        <div className={`mb-2 md:mb-4 px-1 border-l ${theme.border} pl-3`}>
          <p className={`text-[8px] md:text-[10px] ${theme.text} opacity-70 font-mono italic leading-relaxed tracking-tight`}>
            <span className={`${theme.textLight} font-bold not-italic mr-1.5`}>AUDIO_ENGINE_V4:</span>
            Multi-layer synthesis (Drone/Melody/Glitch) with stereo widening and dynamic probability triggering.
          </p>
        </div>

        <div ref={containerRef} className={`flex-1 relative border ${theme.border} bg-[#020617] rounded-sm overflow-hidden min-h-[180px] md:min-h-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]`}>
          <canvas ref={canvasRef} className="w-full h-full block" />
          
          <div className="absolute top-3 left-3 text-[7px] md:text-[9px] text-purple-900 font-bold space-y-1 pointer-events-none uppercase tracking-widest bg-black/50 p-1.5 rounded-sm">
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-0.5 bg-white shadow-[0_0_5px_white]" /> <span className="text-white/70">SCANNER</span></div>
            <div className="flex items-center space-x-1.5"><div className={`w-2.5 h-2.5 ${theme.bg} border ${theme.border}`} /> <span className={theme.text}>ECHO_CHAMBER</span></div>
          </div>
        </div>

        <div className="mt-2 md:mt-8 flex flex-col space-y-2 shrink-0 pb-2 px-1">
          <input 
            type="range" 
            min="0" 
            max={Math.max(0, masterData.length - 1)} 
            value={Math.floor(scrollOffset)} 
            onChange={(e) => currentIdxRef.current = parseInt(e.target.value)} 
            className={`w-full h-[4px] bg-gray-800 rounded-full appearance-none cursor-pointer accent-white`}
            style={{ accentColor: theme.main }}
          />
          <div className={`flex justify-between text-[7px] md:text-[9px] ${theme.text} font-bold uppercase tracking-[0.2em] md:tracking-[0.8em] opacity-50`}>
            <span>[ RAW_DATA ]</span>
            <span>HARMONIC_TRANSFORM</span>
            <span>[ AUDITORY_OUTPUT ]</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <ViewManual 
            title="EMERGENCE STRING [涌现之弦]"
            subtitle="PROTOCOL_MANUAL_v4.0"
            items={SPECTRAL_MANUAL_ITEMS}
            theme={sourceMode === 'DNA' ? "purple" : "cyan"}
            onClose={() => setShowHelp(false)}
          />
        )}
      </AnimatePresence>
    </HUDFrame>
  );
};

export default SpectralAnalysis;
