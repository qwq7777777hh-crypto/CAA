
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { Sliders, Lock, Unlock, Check, User, Users, ChevronDown, RefreshCw } from 'lucide-react';

// --- ENHANCED FREQUENCY LADDER ---
const SCALES = {
  BASS: [65.41, 73.42, 82.41, 98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 196.00], // C2 - G3
  MID:  [261.63, 293.66, 329.63, 392.00, 440.00, 493.88, 523.25], // C4 - C5
  HIGH: [587.33, 659.25, 783.99, 880.00, 987.77, 1046.50, 1174.66] // D5 - D6
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

// --- MOOD-AWARE FREQUENCY SELECTOR ---
const getMoodAwareFreq = (intensity: number, mood: string) => {
    if (intensity < 20) return 0;
    const normalized = Math.pow(intensity / 255, 1.2);
    
    let pool = SCALES.MID;
    if (mood === 'SADNESS') pool = SCALES.BASS;
    else if (mood === 'JOY' || mood === 'ANGER') pool = SCALES.HIGH;
    
    const idx = Math.floor(normalized * (pool.length - 1));
    return pool[idx];
};

interface DbSource {
    uid: string;
    name: string;
    hasPermission: boolean;
    isSelf: boolean;
}

const MOOD_COLORS: Record<string, string> = {
    'RATIONAL': '#f59e0b', // Amber
    'JOY': '#22d3ee',      // Cyan
    'SADNESS': '#3b82f6',   // Blue
    'ANGER': '#ef4444',     // Red
};

const DataMixer: React.FC = () => {
  const { entries, setIsGlobalPlaying, isGlobalPlaying } = useGeneData();
  const { user, searchUserByUid, checkDbPermission } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [availableSources, setAvailableSources] = useState<DbSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioCleanupTimerRef = useRef<any>(null);
  
  const currentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const jumperRef = useRef({ x: 0, y: 0, targetY: 0 });

  useEffect(() => {
      const fetchSources = async () => {
          if (!user) return;
          setIsLoadingSources(true);
          const sources: DbSource[] = [];
          sources.push({ uid: user.uid, name: `${user.displayName} (SELF)`, hasPermission: true, isSelf: true });
          if (user.friends && user.friends.length > 0) {
              for (const fuid of user.friends) {
                  const friendUser = await searchUserByUid(fuid);
                  if (friendUser) {
                      const hasPerm = await checkDbPermission(fuid, user.customUid);
                      sources.push({ uid: friendUser.uid, name: friendUser.displayName, hasPermission: hasPerm, isSelf: false });
                  }
              }
          }
          setAvailableSources(sources);
          if (selectedSourceIds.length === 0) setSelectedSourceIds([user.uid]);
          setIsLoadingSources(false);
      };
      fetchSources();
  }, [user]);

  const masterDataObj = useMemo(() => {
    const filteredEntries = entries.filter(e => {
        if (!e.userId || e.userId === 'anonymous') return selectedSourceIds.includes(user?.uid || '');
        return selectedSourceIds.includes(e.userId);
    });

    let fullBinary = '';
    const moodSegments: { start: number, len: number, mood: string }[] = [];
    let currentPos = 0;

    filteredEntries.forEach(e => {
        fullBinary += e.binaryStream;
        moodSegments.push({ start: currentPos, len: e.binaryStream.length, mood: e.mood || 'RATIONAL' });
        currentPos += e.binaryStream.length;
    });
    
    if (!fullBinary) return { waveform: [], segments: [] };
    return { 
        waveform: generateResonantWaveform(fullBinary),
        segments: moodSegments
    };
  }, [entries, selectedSourceIds, user]);

  const masterData = masterDataObj.waveform;

  const getMoodAtIdx = (idx: number) => {
      const seg = masterDataObj.segments.find(s => idx >= s.start && idx < s.start + s.len);
      return seg ? seg.mood : 'RATIONAL';
  };

  useEffect(() => {
    currentIdxRef.current = 0; setScrollOffset(0); stopAudio();
  }, [selectedSourceIds]);

  useEffect(() => { return () => stopAudio(); }, []);

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
      const val = masterData[i], mood = getMoodAtIdx(i), moodColor = MOOD_COLORS[mood];
      const x = centerX + (i - targetOffset) * totalStep - (barWidth / 2);
      const isActive = Math.abs(x + barWidth/2 - centerX) < totalStep / 2;
      const barHeight = 4 + (val / 255) * (height * 0.8);
      
      if (isActive) {
        ctx.fillStyle = val > 180 ? '#fff' : moodColor;
        ctx.shadowBlur = val > 180 ? 30 : 15;
        ctx.shadowColor = moodColor;
      } else {
        ctx.fillStyle = `${moodColor}${Math.floor((0.2 + (val/255)*0.6)*255).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = 0;
      }
      ctx.beginPath(); ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]); ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (isPlaying) {
      const activeMood = getMoodAtIdx(Math.floor(targetOffset));
      const activeColor = MOOD_COLORS[activeMood];
      const grd = ctx.createRadialGradient(jumperRef.current.x, jumperRef.current.y, 0, jumperRef.current.x, jumperRef.current.y, 25);
      grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); grd.addColorStop(0.3, `${activeColor}88`); grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(jumperRef.current.x, jumperRef.current.y, 25, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = isPlaying ? 'rgba(255, 255, 255, 0.15)' : 'rgba(245, 158, 11, 0.1)';
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke();
    animationFrameRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const updateSize = () => { if (canvasRef.current && containerRef.current) { canvasRef.current.width = containerRef.current.clientWidth; canvasRef.current.height = containerRef.current.clientHeight; } };
    window.addEventListener('resize', updateSize); updateSize();
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', updateSize); if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [masterData, isPlaying]);

  const handleTogglePlay = async () => {
    if (isPlaying) { stopAudio(); return; }
    if (masterData.length === 0) return;
    if (audioCleanupTimerRef.current) { clearTimeout(audioCleanupTimerRef.current); audioCleanupTimerRef.current = null; }
    if (audioContextRef.current) { try { await audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    
    setIsPlaying(true); setIsGlobalPlaying(true); isPlayingRef.current = true;
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current; if (ctx.state === 'suspended') await ctx.resume();
    
    // MASTER CHAIN WITH LPF TO REDUCE NOISE
    const masterGain = ctx.createGain(); masterGain.gain.value = 0.4; masterGainRef.current = masterGain;
    const finalFilter = ctx.createBiquadFilter(); finalFilter.type = 'lowpass'; finalFilter.frequency.value = 2500;
    const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -15; 
    masterGain.connect(finalFilter); finalFilter.connect(compressor); compressor.connect(ctx.destination);
    
    const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.45; const feedback = ctx.createGain(); feedback.gain.value = 0.35;
    const delayFilter = ctx.createBiquadFilter(); delayFilter.type = 'lowpass'; delayFilter.frequency.value = 1200; 
    delay.connect(delayFilter); delayFilter.connect(feedback); feedback.connect(delay); delayFilter.connect(masterGain);
    
    const droneOsc = ctx.createOscillator(); droneOsc.type = 'sine'; droneOsc.frequency.value = 32.70; // Low C1
    const droneFilter = ctx.createBiquadFilter(); droneFilter.type = 'lowpass'; droneFilter.frequency.value = 60;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.08; 
    droneOsc.connect(droneFilter); droneFilter.connect(droneGain); droneGain.connect(masterGain); droneOsc.start();
    droneOscRef.current = droneOsc; droneGainRef.current = droneGain; droneFilterRef.current = droneFilter;

    const sequence = async () => {
      let lastVal = 0;
      while (isPlayingRef.current && currentIdxRef.current < masterData.length) {
        const i = Math.floor(currentIdxRef.current);
        const value = masterData[i], mood = getMoodAtIdx(i);
        
        // Smooth drone modulation
        const droneTargetVol = 0.08 + (value / 255) * 0.15, droneTargetFreq = 60 + (value / 255) * 200;
        droneGain.gain.setTargetAtTime(droneTargetVol, ctx.currentTime, 0.1);
        droneFilter.frequency.setTargetAtTime(droneTargetFreq, ctx.currentTime, 0.1);
        
        const triggerThreshold = 40, playChance = Math.max(0, (value - triggerThreshold) / (255 - triggerThreshold)), isTransient = (value - lastVal) > 30;
        
        if (value > triggerThreshold && (Math.random() < playChance * 0.4 || isTransient)) {
            const freq = getMoodAwareFreq(value, mood);
            if (freq > 0) {
                const osc = ctx.createOscillator(), gain = ctx.createGain(), pan = ctx.createStereoPanner(), filter = ctx.createBiquadFilter(); 
                
                // WAVESHAPE BY MOOD: Triangle for Bass, Sine for Rational, Square (Filtered) for Joy/Anger
                if (mood === 'SADNESS') {
                    osc.type = 'triangle';
                    filter.frequency.value = 400;
                } else if (mood === 'RATIONAL') {
                    osc.type = 'sine';
                    filter.frequency.value = 1000;
                } else {
                    osc.type = 'square';
                    filter.frequency.value = 800;
                }
                
                osc.detune.value = (Math.random() - 0.5) * 10; osc.frequency.setValueAtTime(freq, ctx.currentTime);
                pan.pan.value = (Math.random() - 0.5) * 0.7;
                
                // ANTI-CLICK ENVELOPE
                const now = ctx.currentTime; 
                gain.gain.setValueAtTime(0, now);
                // Linear rise to prevent clicks
                gain.gain.linearRampToValueAtTime(mood === 'SADNESS' ? 0.3 : 0.12, now + 0.02);
                // Exponential decay for organic feel
                gain.gain.exponentialRampToValueAtTime(0.001, now + (mood === 'SADNESS' ? 0.7 : 0.4));
                
                osc.connect(filter); filter.connect(gain); gain.connect(pan); pan.connect(masterGain); pan.connect(delay); 
                osc.start(); osc.stop(now + 0.8);
            }
        }
        lastVal = value; currentIdxRef.current += 1;
        // Interval speed depends on data intensity
        await new Promise(r => setTimeout(r, value > 180 ? 40 : 25));
      }
      if (currentIdxRef.current >= masterData.length) { stopAudio(); currentIdxRef.current = 0; }
    };
    sequence();
  };

  const toggleSourceSelection = (uid: string) => {
      playMechKey();
      setSelectedSourceIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  return (
    <HUDFrame 
      title="DATA MIXER [数据混音器]" 
      subtitle="CROSS_DB_HARMONIC_FUSION" 
      className="md:translate-x-6"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 md:mb-5 shrink-0 px-1 relative z-30">
          <div className="flex space-x-4 md:space-x-8 items-center relative">
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => { playMechKey(); setIsDropdownOpen(!isDropdownOpen); }}
                    className={`flex items-center space-x-3 px-4 py-2 border transition-all hover:bg-amber-900/20 group ${isDropdownOpen ? 'border-amber-400 bg-amber-900/20 text-amber-300' : 'border-amber-500/50 text-amber-500'}`}
                >
                    <Sliders size={14} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">DATABASE LINKER</span>
                    <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-black">{selectedSourceIds.length}</span>
                    <ChevronDown size={12} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-2 w-72 bg-black/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col max-h-[60vh] overflow-hidden">
                            <div className="p-3 border-b border-amber-900/30 bg-amber-900/10 flex justify-between items-center"><span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Available Nodes</span>{isLoadingSources && <RefreshCw size={10} className="animate-spin text-amber-500" />}</div>
                            <div className="flex-1 overflow-y-auto custom-thin-scrollbar p-2 space-y-1">
                                {availableSources.map(src => (
                                    <div key={src.uid} onClick={() => src.hasPermission && toggleSourceSelection(src.uid)} className={`flex items-center justify-between p-2 rounded-sm border transition-all ${!src.hasPermission ? 'opacity-50 cursor-not-allowed border-transparent' : 'cursor-pointer hover:bg-amber-500/10 ' + (selectedSourceIds.includes(src.uid) ? 'border-amber-500 bg-amber-900/20' : 'border-transparent')}`}>
                                        <div className="flex items-center space-x-3 min-w-0">{src.isSelf ? <User size={12} className="text-amber-400 shrink-0" /> : <Users size={12} className="text-amber-600 shrink-0" />}<span className={`text-[10px] font-bold uppercase truncate ${selectedSourceIds.includes(src.uid) ? 'text-amber-100' : 'text-amber-700'}`}>{src.name}</span></div>
                                        <div className="shrink-0">{!src.hasPermission ? <Lock size={12} className="text-red-500" /> : (selectedSourceIds.includes(src.uid) ? <Check size={12} className="text-amber-400" /> : <div className="w-3 h-3 border border-amber-800 rounded-sm" />)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 border-t border-amber-900/30 text-center"><span className="text-[8px] text-amber-800 font-mono">MULTI-SOURCE FUSION ACTIVE</span></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className={`text-[8px] md:text-[11px] text-amber-500 font-mono uppercase tracking-tight hidden sm:block`}>
              <p className="text-amber-300 font-bold opacity-95 uppercase">Current_Mood: {getMoodAtIdx(Math.floor(scrollOffset))}</p>
              <p className="opacity-50">{Math.floor(scrollOffset)}/{masterData.length}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={handleTogglePlay} className={`flex items-center space-x-2 md:space-x-6 border-2 px-5 md:px-12 py-2 md:py-3 font-bold transition-all bg-transparent ${isPlaying ? `border-white text-white bg-amber-900/40` : `border-amber-500/30 text-amber-500 hover:border-current`}`}>
              {isPlaying ? <div className="flex space-x-1"><div className="w-1.5 h-3 bg-white" /><div className="w-1.5 h-3 bg-white" /></div> : <span className="text-white text-[10px] md:text-sm">▶</span>}<span className="tracking-[0.2em] md:tracking-[0.6em] uppercase text-[9px] md:text-[11px]">{isPlaying ? 'SUSPEND' : 'FUSE_PLAY'}</span>
             </button>
            <button onClick={() => { currentIdxRef.current = 0; stopAudio(); }} className={`px-3 md:px-8 py-2 md:py-3 border border-amber-500/30 text-[9px] md:text-[11px] text-amber-500 hover:text-white uppercase font-bold tracking-widest transition-all`}>RST</button>
          </div>
        </div>
        <div ref={containerRef} className={`flex-1 relative border border-amber-500/30 bg-[#020617] rounded-sm overflow-hidden min-h-[180px] md:min-h-0 shadow-[inset_0_0_30px_rgba(245,158,11,0.2)]`}>
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-3 left-3 text-[7px] md:text-[9px] text-amber-900 font-bold space-y-1 pointer-events-none uppercase tracking-widest bg-black/50 p-1.5 rounded-sm">
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-0.5 bg-amber-400 shadow-[0_0_5px_orange]" /> <span className="text-amber-100/70">ANTI-CLICK_FILTER_ACTIVE</span></div>
            <div className="flex items-center space-x-1.5"><div className={`w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/50`} /> <span className="text-amber-500">DEEP_BASS_WELL</span></div>
          </div>
        </div>
        <div className="mt-2 md:mt-8 flex flex-col space-y-2 shrink-0 pb-2 px-1">
          <input type="range" min="0" max={Math.max(0, masterData.length - 1)} value={Math.floor(scrollOffset)} onChange={(e) => currentIdxRef.current = parseInt(e.target.value)} className={`w-full h-[4px] bg-gray-800 rounded-full appearance-none cursor-pointer accent-amber-500`} />
          <div className={`flex justify-between text-[7px] md:text-[9px] text-amber-500 font-bold uppercase tracking-[0.2em] md:tracking-[0.8em] opacity-50`}><span>[ BASS_RESONANCE ]</span><span>HIGH_FIDELITY_DYNAMIC_RENDER</span><span>[ SIGNAL_OUT ]</span></div>
        </div>
      </div>
      <style>{`.custom-thin-scrollbar::-webkit-scrollbar { width: 3px; } .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.3); }`}</style>
    </HUDFrame>
  );
};

export default DataMixer;
