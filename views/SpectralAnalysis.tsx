
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
    title: "音域平衡算法 | FREQUENCY EQUILIBRIUM",
    subtitle: "PITCH_PROTOCOL_V5.1",
    content: "系统已完成听觉工效学优化：\n\n1. 低音重构 (SADNESS)：音程平移至人耳敏感的 C3-B4 频段，并强化了能量增益，确保在移动设备上依然清晰可察。\n2. 中音恒定 (RATIONAL)：标准的 440Hz 逻辑基准，代表绝对的理性。\n3. 高音平滑 (JOY/ANGER)：严格限制频率上限至 1kHz 以下，滤除了刺耳的高频谐波，将激越的情绪转化为清脆的打击乐感。",
    meta: "ALGO: HARMONIC_SMOOTHING",
    code: "0xDB_LIMITER"
  },
  {
    id: "EMERGENCE",
    title: "涌现：从无序到乐章 | EMERGENCE: CHAOS TO SYMPHONY",
    subtitle: "MACRO_PHENOMENON",
    content: "什么是涌现？它是整体大于部分之和。单个比特是静默的，但当数万个比特在时间轴上展开，它们复杂的交互便涌现出了宏观的“旋律”。",
    meta: "CONCEPT: EMERGENCE",
    code: "0xMACRO_PATTERN"
  }
];

// --- REFINED SCALES: 3 OCTAVES (Focusing on the comfortable hearing range) ---
const SCALE_FULL = [
  // C3 - B3 (Low-Mid: Warm & Audible Bass)
  130.81, 146.83, 164.81, 196.00, 220.00, 246.94,
  // C4 - B4 (Mid: Rational Standard)
  261.63, 293.66, 329.63, 392.00, 440.00, 493.88,
  // C5 - B5 (High-Mid: Bright but Smooth)
  523.25, 587.33, 659.25, 783.99, 880.00, 987.77
];

const getMoodFreq = (intensity: number, mood: string = 'RATIONAL') => {
    if (intensity < 15) return 0;
    const normalized = Math.pow(intensity / 255, 1.2);
    
    let baseIdx = 6; // Default to Mid (C4)
    let range = 6;

    if (mood === 'SADNESS') {
        baseIdx = 0; // C3 - B3 (Much more audible than C2)
        range = 10; 
    } else if (mood === 'RATIONAL') {
        baseIdx = 6; // C4 - B4
        range = 6;
    } else if (mood === 'JOY' || mood === 'ANGER') {
        baseIdx = 12; // C5 - B5 (Max ~987Hz, no more piercing 2kHz+)
        range = 6;
    }

    const idx = baseIdx + Math.floor(normalized * (range - 1));
    return SCALE_FULL[Math.min(idx, SCALE_FULL.length - 1)];
};

const generateResonantWaveform = (binaryString: string): number[] => {
  if (!binaryString) return [];
  const output: number[] = [];
  const WINDOW_SIZE = 16;
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
  let energy = 0;
  const attack = 0.15, release = 0.08;
  for (let i = 0; i < densities.length; i++) {
    const target = densities[i];
    if (target > energy) energy += (target - energy) * attack;
    else energy += (target - energy) * release;
    output.push(Math.floor(energy * 255));
  }
  return output;
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
  
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioCleanupTimerRef = useRef<any>(null);
  
  const currentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const jumperRef = useRef({ x: 0, y: 0, targetY: 0 });

  const masterDataObj = useMemo(() => {
    let fullBinary = '';
    const moodSegments: { start: number, len: number, mood: string }[] = [];
    const sourceList = sourceMode === 'DNA' ? [...entries].reverse() : [...thoughtEntries].reverse();
    let currentPos = 0;
    sourceList.forEach(e => {
        const bin = sourceMode === 'DNA' ? (e as any).binaryStream : (e as any).responseBinary;
        if (!bin) return;
        fullBinary += bin;
        moodSegments.push({ start: currentPos, len: bin.length, mood: (e as any).mood || 'RATIONAL' });
        currentPos += bin.length;
    });
    const waveform = generateResonantWaveform(fullBinary);
    return { waveform, moodSegments };
  }, [entries, thoughtEntries, sourceMode]);

  const masterData = masterDataObj.waveform;

  const getCurrentMood = (idx: number) => {
      const seg = masterDataObj.moodSegments.find(s => idx >= s.start && idx < s.start + s.len);
      return seg ? seg.mood : 'RATIONAL';
  };

  const theme = useMemo(() => {
    return sourceMode === 'DNA' 
      ? { main: '#a855f7', text: 'text-purple-600', textLight: 'text-purple-300', border: 'border-purple-500/30', bg: 'bg-purple-900/40', hueBase: 260 }
      : { main: '#22d3ee', text: 'text-cyan-600', textLight: 'text-cyan-300', border: 'border-cyan-500/30', bg: 'bg-cyan-900/40', hueBase: 180 };
  }, [sourceMode]);

  useEffect(() => {
    currentIdxRef.current = 0; setScrollOffset(0); stopAudio();
  }, [sourceMode]);

  useEffect(() => { return () => stopAudio(); }, []);
  useEffect(() => { if (!isGlobalPlaying && isPlaying) stopAudio(); }, [isGlobalPlaying, isPlaying]);

  const stopAudio = () => {
      isPlayingRef.current = false; setIsPlaying(false); setIsGlobalPlaying(false);
      if (audioCleanupTimerRef.current) { clearTimeout(audioCleanupTimerRef.current); audioCleanupTimerRef.current = null; }
      if (droneGainRef.current && audioContextRef.current) {
          try {
            const now = audioContextRef.current.currentTime;
            droneGainRef.current.gain.cancelScheduledValues(now);
            droneGainRef.current.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          } catch(e) {}
      }
      audioCleanupTimerRef.current = setTimeout(() => {
          if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
          audioCleanupTimerRef.current = null;
      }, 1000);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    if (width === 0 || height === 0) return;
    const barWidth = width < 768 ? 4 : 5, totalStep = barWidth + 1, centerX = width / 2;
    ctx.fillStyle = 'rgba(2, 6, 23, 1)'; ctx.fillRect(0, 0, width, height);
    const targetOffset = currentIdxRef.current;
    setScrollOffset(targetOffset);
    if (isPlaying) {
      const activeValue = masterData[Math.floor(targetOffset)] || 0;
      jumperRef.current.targetY = height - (20 + (activeValue / 255) * (height * 0.6));
      jumperRef.current.x = centerX;
      jumperRef.current.y += (jumperRef.current.targetY - jumperRef.current.y) * 0.15;
    } else { jumperRef.current.y = height - 10; }
    const maxVisibleBars = Math.ceil(width / totalStep) + 4;
    const startIdx = Math.max(0, Math.floor(targetOffset - maxVisibleBars / 2));
    const endIdx = Math.min(masterData.length, Math.ceil(targetOffset + maxVisibleBars / 2));
    for (let i = startIdx; i < endIdx; i++) {
      const val = masterData[i];
      const x = centerX + (i - targetOffset) * totalStep - (barWidth / 2);
      const isActive = Math.abs(x + barWidth/2 - centerX) < totalStep / 2;
      const barHeight = 4 + (val / 255) * (height * 0.8);
      if (isActive) {
        ctx.fillStyle = val > 180 ? '#fff' : theme.main;
        ctx.shadowBlur = val > 180 ? 30 : 15;
        ctx.shadowColor = theme.main;
      } else {
        const mood = getCurrentMood(i);
        let color = `hsla(${theme.hueBase + (val/255)*30}, 70%, 60%, ${0.2 + (val/255)*0.6})`;
        if (mood === 'ANGER') color = `hsla(0, 100%, 50%, ${0.4 + (val/255)*0.6})`;
        if (mood === 'SADNESS') color = `hsla(220, 100%, 30%, ${0.3 + (val/255)*0.4})`;
        ctx.fillStyle = color; ctx.shadowBlur = 0;
      }
      ctx.beginPath(); ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]); ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (isPlaying) {
      const grd = ctx.createRadialGradient(jumperRef.current.x, jumperRef.current.y, 0, jumperRef.current.x, jumperRef.current.y, 25);
      grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); grd.addColorStop(0.3, theme.main + '88'); grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(jumperRef.current.x, jumperRef.current.y, 25, 0, Math.PI * 2); ctx.fill();
    }
    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const updateSize = () => { if (canvasRef.current && containerRef.current) { canvasRef.current.width = containerRef.current.clientWidth; canvasRef.current.height = containerRef.current.clientHeight; } };
    window.addEventListener('resize', updateSize); updateSize();
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', updateSize); if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [masterData, isPlaying, theme]);

  const handleTogglePlay = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (masterData.length === 0) return;
    if (audioCleanupTimerRef.current) { clearTimeout(audioCleanupTimerRef.current); audioCleanupTimerRef.current = null; }
    if (audioContextRef.current) { try { await audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    setIsPlaying(true); setIsGlobalPlaying(true); isPlayingRef.current = true;
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    const masterGain = ctx.createGain(); masterGain.gain.value = 0.4; masterGainRef.current = masterGain;
    const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -20; masterGain.connect(compressor); compressor.connect(ctx.destination);
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.35; 
    const feedback = ctx.createGain(); feedback.gain.value = 0.4;
    delay.connect(feedback); feedback.connect(delay); delay.connect(masterGain);
    const droneOsc = ctx.createOscillator(); droneOsc.type = 'triangle'; droneOsc.frequency.value = 65.41;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.05; 
    droneOsc.connect(droneGain); droneGain.connect(masterGain); droneOsc.start();
    droneOscRef.current = droneOsc; droneGainRef.current = droneGain;

    const sequence = async () => {
      let lastVal = 0;
      while (isPlayingRef.current && currentIdxRef.current < masterData.length) {
        const i = Math.floor(currentIdxRef.current);
        const value = masterData[i];
        const mood = getCurrentMood(i);
        const triggerThreshold = 40;
        const playChance = Math.max(0, (value - triggerThreshold) / (255 - triggerThreshold));
        const isTransient = (value - lastVal) > 30;
        
        if (value > triggerThreshold && (Math.random() < playChance * 0.4 || isTransient)) {
            const freq = getMoodFreq(value, mood);
            if (freq > 0) {
                const osc = ctx.createOscillator(); const gain = ctx.createGain(); const pan = ctx.createStereoPanner();
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = mood === 'ANGER' ? 800 : 2000; // Tame the aggression

                // WAVEFORM SELECT: Square for Anger (filtered), Sine/Tri for others
                osc.type = mood === 'ANGER' ? 'square' : (mood === 'JOY' ? 'sine' : 'triangle'); 
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                pan.pan.value = (Math.random() - 0.5);
                
                // DYNAMIC GAIN: Boost sadness (bass), damp joy/anger (highs)
                let vol = 0.15;
                if (mood === 'SADNESS') vol = 0.25; // Gain boost for low-end
                if (mood === 'JOY' || mood === 'ANGER') vol = 0.10; // Dampen high-end spikes

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (mood === 'SADNESS' ? 0.6 : 0.3));
                
                osc.connect(filter); filter.connect(gain); gain.connect(pan); pan.connect(masterGain); pan.connect(delay);
                osc.start(); osc.stop(ctx.currentTime + 0.65);
            }
        }
        lastVal = value; currentIdxRef.current += 1;
        await new Promise(r => setTimeout(r, value > 150 ? 50 : 30));
      }
      if (currentIdxRef.current >= masterData.length) { stopAudio(); currentIdxRef.current = 0; }
    };
    sequence();
  };

  return (
    <HUDFrame title="EMERGENCE: STRING [涌现之弦]" subtitle={sourceMode === 'DNA' ? "MOOD_BALANCED_ACOUSTIC_ENGINE" : "COGNITIVE_OCTAVE_SYNC"} className="md:translate-x-6" onHelp={() => setShowHelp(true)}>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 md:mb-5 shrink-0 px-1">
          <div className="flex space-x-4 md:space-x-12 items-center">
            <button onClick={() => { stopAudio(); setSourceMode(prev => prev === 'DNA' ? 'THOUGHT' : 'DNA'); }} className={`flex items-center space-x-2 px-3 py-1.5 border transition-all ${sourceMode === 'DNA' ? 'border-purple-500 bg-purple-900/20' : 'border-cyan-500 bg-cyan-900/20'}`}>
               <span className={`text-[9px] font-bold tracking-widest uppercase ${sourceMode === 'DNA' ? 'text-purple-300' : 'text-cyan-300'}`}>{sourceMode === 'DNA' ? 'DNA_DB' : 'THOUGHT_DB'}</span>
            </button>
            <div className={`text-[8px] md:text-[11px] ${theme.text} font-mono uppercase`}>
              <p className={`${theme.textLight} font-bold`}>CURRENT_MOOD: {getCurrentMood(Math.floor(scrollOffset))}</p>
              <p className="opacity-50">SYNC_POS: {Math.floor(scrollOffset)}/{masterData.length}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={handleTogglePlay} className={`flex items-center space-x-2 border-2 px-8 py-2 font-bold transition-all ${isPlaying ? 'border-white text-white bg-white/10' : theme.border + ' ' + theme.text}`}>
              {isPlaying ? 'SUSPEND' : 'RESONATE'}
             </button>
          </div>
        </div>
        <div ref={containerRef} className={`flex-1 relative border ${theme.border} bg-[#020617] rounded-sm overflow-hidden min-h-[180px]`}>
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
        <div className="mt-4 flex flex-col space-y-2 shrink-0">
          <input type="range" min="0" max={Math.max(0, masterData.length - 1)} value={Math.floor(scrollOffset)} onChange={(e) => currentIdxRef.current = parseInt(e.target.value)} className="w-full h-[4px] bg-gray-800 rounded-full appearance-none cursor-pointer accent-white" />
          <div className={`flex justify-between text-[7px] md:text-[9px] ${theme.text} font-bold uppercase tracking-widest`}>
            <span>[ ENHANCED_BASS_ZONE ]</span>
            <span>HUMAN_ERGONOMIC_OCTAVE_LIMITER</span>
            <span>[ SMOOTH_RESONANCE_PEAK ]</span>
          </div>
        </div>
      </div>
      <AnimatePresence>{showHelp && <ViewManual title="EMERGENCE STRING [涌现之弦]" subtitle="OCTAVE_SHIFT_v5.1" items={SPECTRAL_MANUAL_ITEMS} theme={sourceMode === 'DNA' ? "purple" : "cyan"} onClose={() => setShowHelp(false)} />}</AnimatePresence>
    </HUDFrame>
  );
};

export default SpectralAnalysis;
