
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { useAuth } from '../context/AuthContext';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { Sliders, Lock, Unlock, Check, User, Users, ChevronDown, RefreshCw } from 'lucide-react';

// --- AUDIO SCALES: E Minor Pentatonic (Slightly darker than C Minor) ---
const SCALE_FREQS = [
  164.81, 196.00, 220.00, 246.94, 293.66, // E3 - D4 (Base)
  329.63, 392.00, 440.00, 493.88, 587.33, // E4 - D5 (Mid)
  659.25, 783.99, 880.00, 987.77, 1174.66 // E5 - D6 (High)
];

// --- ALGORITHM: DENSITY CONVOLUTION & RESONANCE ---
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
  const attack = 0.15;
  const release = 0.08;
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

const getHarmonicFreq = (intensity: number) => {
    if (intensity < 15) return 0; 
    const normalized = Math.pow(intensity / 255, 1.2); 
    const idx = Math.floor(normalized * (SCALE_FREQS.length - 1));
    return SCALE_FREQS[idx];
};

interface DbSource {
    uid: string;
    name: string;
    hasPermission: boolean;
    isSelf: boolean;
}

const DataMixer: React.FC = () => {
  const { entries, setIsGlobalPlaying, isGlobalPlaying } = useGeneData();
  const { user, searchUserByUid, checkDbPermission } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0); 
  const [currentBitChunk, setCurrentBitChunk] = useState('00000000');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Database Selection State
  const [availableSources, setAvailableSources] = useState<DbSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Audio Nodes Refs
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioCleanupTimerRef = useRef<any>(null);
  
  const currentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const jumperRef = useRef({ x: 0, y: 0, targetY: 0 });

  // 1. Initialize Sources
  useEffect(() => {
      const fetchSources = async () => {
          if (!user) return;
          setIsLoadingSources(true);
          
          const sources: DbSource[] = [];
          
          // Add Self
          sources.push({
              uid: user.uid, // Use internal firebase UID for logic, display customUID if needed
              name: `${user.displayName} (SELF)`,
              hasPermission: true,
              isSelf: true
          });

          // Add Friends
          if (user.friends && user.friends.length > 0) {
              for (const fuid of user.friends) {
                  const friendUser = await searchUserByUid(fuid);
                  if (friendUser) {
                      const hasPerm = await checkDbPermission(fuid, user.customUid);
                      sources.push({
                          uid: friendUser.uid, // We need the internal UID to match GeneEntry.userId
                          name: friendUser.displayName,
                          hasPermission: hasPerm,
                          isSelf: false
                      });
                  }
              }
          }
          
          setAvailableSources(sources);
          // Default select self
          if (selectedSourceIds.length === 0) {
              setSelectedSourceIds([user.uid]);
          }
          setIsLoadingSources(false);
      };
      
      fetchSources();
  }, [user]);

  // 2. Computed Master Data
  const masterData = useMemo(() => {
    // Filter entries based on selected Source UIDs
    const filteredEntries = entries.filter(e => {
        // If entry has no userId, assume it belongs to no one or legacy (skip or include based on policy, here we exclude legacy unless self selected and entry.userId is missing/anonymous)
        if (!e.userId || e.userId === 'anonymous') return selectedSourceIds.includes(user?.uid || '');
        return selectedSourceIds.includes(e.userId);
    });

    const fullBinary = filteredEntries.map(e => e.binaryStream).join('');
    
    if (!fullBinary) return [];
    return generateResonantWaveform(fullBinary);
  }, [entries, selectedSourceIds, user]);

  // 3. Audio & Visual Logic (Cloned from SpectralAnalysis)
  const theme = { 
      main: '#f59e0b', // Amber/Orange for Mixer
      glow: '#fcd34d',
      text: 'text-amber-500',
      textLight: 'text-amber-300',
      border: 'border-amber-500/30',
      bg: 'bg-amber-900/40',
      hueBase: 30 // Orange hue
  };

  useEffect(() => {
    currentIdxRef.current = 0;
    setScrollOffset(0);
    stopAudio();
  }, [selectedSourceIds]); // Reset on source change

  useEffect(() => {
    return () => stopAudio();
  }, [setIsGlobalPlaying]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stopAudio = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsGlobalPlaying(false);
      
      if (audioCleanupTimerRef.current) {
          clearTimeout(audioCleanupTimerRef.current);
          audioCleanupTimerRef.current = null;
      }

      if (droneGainRef.current && audioContextRef.current) {
          try {
            const now = audioContextRef.current.currentTime;
            droneGainRef.current.gain.cancelScheduledValues(now);
            droneGainRef.current.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          } catch(e) {}
      }

      audioCleanupTimerRef.current = setTimeout(() => {
          if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch(e) {}
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

    const barWidth = width < 768 ? 4 : 5;
    const barGap = width < 768 ? 1 : 1;
    const totalStep = barWidth + barGap;
    const centerX = width / 2;

    ctx.fillStyle = 'rgba(2, 6, 23, 1)'; 
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = height; y > 0; y -= 40) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    const targetOffset = currentIdxRef.current;
    setScrollOffset(targetOffset);

    if (isPlaying) {
      const activeValue = masterData[Math.floor(targetOffset)] || 0;
      const targetHeight = 20 + (activeValue / 255) * (height * 0.6);
      jumperRef.current.targetY = height - targetHeight;
      jumperRef.current.x = centerX;
      jumperRef.current.y += (jumperRef.current.targetY - jumperRef.current.y) * 0.15;
    } else {
      jumperRef.current.y = height - 10;
    }

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
        const hue = theme.hueBase + (val / 255) * 20; 
        const opacity = 0.2 + (val / 255) * 0.6;
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath();
      ctx.roundRect(x, height - barHeight, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
      
      if (val > 50) {
          ctx.fillStyle = `rgba(245, 158, 11, 0.08)`;
          ctx.fillRect(x, height, barWidth, barHeight * 0.3);
      }
    }
    ctx.shadowBlur = 0;

    if (isPlaying) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
      const jumpRadius = (width < 768 ? 15 : 25) * pulse;
      const grd = ctx.createRadialGradient(
          jumperRef.current.x, jumperRef.current.y, 0, 
          jumperRef.current.x, jumperRef.current.y, jumpRadius
      );
      grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grd.addColorStop(0.3, 'rgba(245, 158, 11, 0.5)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grd;
      ctx.beginPath(); 
      ctx.arc(jumperRef.current.x, jumperRef.current.y, jumpRadius, 0, Math.PI * 2); 
      ctx.fill();
    }

    ctx.strokeStyle = isPlaying ? 'rgba(255, 255, 255, 0.15)' : 'rgba(245, 158, 11, 0.1)';
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
  }, [masterData, isPlaying]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    if (masterData.length === 0) return;
    
    if (audioCleanupTimerRef.current) {
        clearTimeout(audioCleanupTimerRef.current);
        audioCleanupTimerRef.current = null;
    }
    if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
    }

    setIsPlaying(true);
    setIsGlobalPlaying(true);
    isPlayingRef.current = true;
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4; 
    masterGainRef.current = masterGain;
    
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 4;
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.45; // Slower echoes for mixer
    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1000; 

    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delayFilter.connect(masterGain);

    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sawtooth'; // Rougher sound for mixer
    droneOsc.frequency.value = 41.20; // Low E1
    
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 80;
    
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.05; 
    
    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
    
    droneOscRef.current = droneOsc;
    droneGainRef.current = droneGain;
    droneFilterRef.current = droneFilter;

    const sequence = async () => {
      let lastVal = 0;
      while (isPlayingRef.current && currentIdxRef.current < masterData.length) {
        const i = Math.floor(currentIdxRef.current);
        const value = masterData[i];
        
        const droneTargetVol = 0.05 + (value / 255) * 0.15;
        const droneTargetFreq = 80 + (value / 255) * 500;
        droneGain.gain.linearRampToValueAtTime(droneTargetVol, ctx.currentTime + 0.1);
        droneFilter.frequency.linearRampToValueAtTime(droneTargetFreq, ctx.currentTime + 0.1);

        const triggerThreshold = 40;
        const playChance = Math.max(0, (value - triggerThreshold) / (255 - triggerThreshold));
        const isTransient = (value - lastVal) > 30;
        
        if (value > triggerThreshold && (Math.random() < playChance * 0.4 || isTransient)) {
            const freq = getHarmonicFreq(value);
            if (freq > 0) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const pan = ctx.createStereoPanner(); 
                
                osc.type = value > 200 ? 'square' : 'triangle'; 
                osc.detune.value = (Math.random() - 0.5) * 15;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                pan.pan.value = (Math.random() - 0.5) * 0.8;

                const now = ctx.currentTime;
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                osc.connect(gain);
                gain.connect(pan);
                pan.connect(masterGain); 
                pan.connect(delay); 
                
                osc.start();
                osc.stop(now + 0.45);
            }
        }
        
        lastVal = value;
        const stepDelay = value > 150 ? 50 : 30;
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

  const toggleSourceSelection = (uid: string) => {
      playMechKey();
      setSelectedSourceIds(prev => {
          if (prev.includes(uid)) return prev.filter(id => id !== uid);
          return [...prev, uid];
      });
  };

  return (
    <HUDFrame 
      title="DATA MIXER [数据混音器]" 
      subtitle="CROSS_DB_HARMONIC_FUSION" 
      className="md:translate-x-6"
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Controls Header */}
        <div className="flex justify-between items-center mb-2 md:mb-5 shrink-0 px-1 relative z-30">
          <div className="flex space-x-4 md:space-x-8 items-center relative">
            
            {/* DATABASE SELECTOR DROPDOWN */}
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
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-black/95 backdrop-blur-xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col max-h-[60vh] overflow-hidden"
                        >
                            <div className="p-3 border-b border-amber-900/30 bg-amber-900/10 flex justify-between items-center">
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Available Nodes</span>
                                {isLoadingSources && <RefreshCw size={10} className="animate-spin text-amber-500" />}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-thin-scrollbar p-2 space-y-1">
                                {availableSources.map(src => (
                                    <div 
                                        key={src.uid}
                                        onClick={() => src.hasPermission && toggleSourceSelection(src.uid)}
                                        className={`flex items-center justify-between p-2 rounded-sm border transition-all ${
                                            !src.hasPermission ? 'opacity-50 cursor-not-allowed border-transparent' : 
                                            'cursor-pointer hover:bg-amber-500/10 ' + (selectedSourceIds.includes(src.uid) ? 'border-amber-500 bg-amber-900/20' : 'border-transparent')
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            {src.isSelf ? <User size={12} className="text-amber-400 shrink-0" /> : <Users size={12} className="text-amber-600 shrink-0" />}
                                            <span className={`text-[10px] font-bold uppercase truncate ${selectedSourceIds.includes(src.uid) ? 'text-amber-100' : 'text-amber-700'}`}>{src.name}</span>
                                        </div>
                                        <div className="shrink-0">
                                            {!src.hasPermission ? (
                                                <Lock size={12} className="text-red-500" />
                                            ) : (
                                                selectedSourceIds.includes(src.uid) ? <Check size={12} className="text-amber-400" /> : <div className="w-3 h-3 border border-amber-800 rounded-sm" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 border-t border-amber-900/30 text-center">
                                <span className="text-[8px] text-amber-800 font-mono">MULTI-SOURCE FUSION ACTIVE</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={`text-[8px] md:text-[11px] ${theme.text} font-mono uppercase tracking-tight hidden sm:block`}>
              <p className={`${theme.textLight} font-bold opacity-95`}>MIXER_BUFFER</p>
              <p className="opacity-50">{Math.floor(scrollOffset)}/{masterData.length}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={handleTogglePlay} className={`flex items-center space-x-2 md:space-x-6 border-2 px-5 md:px-12 py-2 md:py-3 font-bold transition-all bg-transparent ${isPlaying ? `border-white text-white ${theme.bg}` : `${theme.border} ${theme.text} hover:border-current`}`}>
              {isPlaying ? <div className="flex space-x-1"><div className="w-1.5 h-3 bg-white" /><div className="w-1.5 h-3 bg-white" /></div> : <span className="text-white text-[10px] md:text-sm">▶</span>}
              <span className="tracking-[0.2em] md:tracking-[0.6em] uppercase text-[9px] md:text-[11px]">{isPlaying ? 'SUSPEND' : 'FUSE_PLAY'}</span>
             </button>
            <button onClick={() => { currentIdxRef.current = 0; stopAudio(); }} className={`px-3 md:px-8 py-2 md:py-3 border ${theme.border} text-[9px] md:text-[11px] ${theme.text} hover:text-white uppercase font-bold tracking-widest transition-all`}>RST</button>
          </div>
        </div>

        <div className={`mb-2 md:mb-4 px-1 border-l ${theme.border} pl-3`}>
          <p className={`text-[8px] md:text-[10px] ${theme.text} opacity-70 font-mono italic leading-relaxed tracking-tight`}>
            <span className={`${theme.textLight} font-bold not-italic mr-1.5`}>FUSION_ENGINE:</span>
            Merging {selectedSourceIds.length} data streams into a single resonant field.
          </p>
        </div>

        <div ref={containerRef} className={`flex-1 relative border ${theme.border} bg-[#020617] rounded-sm overflow-hidden min-h-[180px] md:min-h-0 shadow-[inset_0_0_30px_rgba(245,158,11,0.2)]`}>
          <canvas ref={canvasRef} className="w-full h-full block" />
          
          <div className="absolute top-3 left-3 text-[7px] md:text-[9px] text-amber-900 font-bold space-y-1 pointer-events-none uppercase tracking-widest bg-black/50 p-1.5 rounded-sm">
            <div className="flex items-center space-x-1.5"><div className="w-2.5 h-0.5 bg-amber-400 shadow-[0_0_5px_orange]" /> <span className="text-amber-100/70">MERGED_SIGNAL</span></div>
            <div className="flex items-center space-x-1.5"><div className={`w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/50`} /> <span className={theme.text}>RESONANCE_CHAMBER</span></div>
          </div>
        </div>

        <div className="mt-2 md:mt-8 flex flex-col space-y-2 shrink-0 pb-2 px-1">
          <input 
            type="range" 
            min="0" 
            max={Math.max(0, masterData.length - 1)} 
            value={Math.floor(scrollOffset)} 
            onChange={(e) => currentIdxRef.current = parseInt(e.target.value)} 
            className={`w-full h-[4px] bg-gray-800 rounded-full appearance-none cursor-pointer accent-amber-500`}
          />
          <div className={`flex justify-between text-[7px] md:text-[9px] ${theme.text} font-bold uppercase tracking-[0.2em] md:tracking-[0.8em] opacity-50`}>
            <span>[ MULTI_INPUT ]</span>
            <span>SPECTRAL_FUSION</span>
            <span>[ HARMONIC_OUT ]</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-thin-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.3); }
      `}</style>
    </HUDFrame>
  );
};

export default DataMixer;
