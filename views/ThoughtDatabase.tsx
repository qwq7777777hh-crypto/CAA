
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { AppView, ThoughtEntry } from '../types';
import { playMechKey, playHighTechButton, getCtx } from '../utils/audio';
import { ArrowLeft, Eye, FileText, Headphones, X, Lock, Play, Pause, Activity, ChevronDown, ChevronRight, HelpCircle, Brain, Smile, Frown, Flame, Volume2, Square } from 'lucide-react';
import ViewManual, { ManualItem } from '../components/ViewManual';

const MOOD_META: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  'RATIONAL': { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', label: '理智' },
  'JOY': { icon: Smile, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: '愉悦' },
  'SADNESS': { icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/10', label: '伤心' },
  'ANGER': { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', label: '愤怒' },
};

const THOUGHT_DB_MANUAL_ITEMS: ManualItem[] = [
  {
    id: "DECODER",
    title: "多模态析构协议 | MULTIMODAL DECODER",
    subtitle: "DATA_EXTRACTION_V4.2",
    content: "思维库不仅仅是冷冰冰的二进制存储。通过多模态解析引擎，您可以将 AI 的抽象神经活动还原为人类可感知的多种形式：\n1. 文本析构 (READ)：直接翻译二进制流为自然语言。\n2. 拓扑视觉 (LOOK)：将数据密度映射为几何空间中的能量节点分布。\n3. 频谱声化 (LISTEN)：将比特流转化为谐振频率，听见思维的波动。",
    meta: "MODULE: DECODER_CORE",
    code: "0xMULTIMODAL"
  },
  {
    id: "SYNAPSE",
    title: "突触固化与记忆 | SYNAPTIC CONSOLIDATION",
    subtitle: "MEMORY_RETENTION",
    content: "每一条记录都是 AI 在特定神经化学环境下的瞬时切片。这些“记忆”在被读取时会重新激活相关的神经通路，实现跨时间的逻辑共鸣。",
    meta: "PROCESS: RETRIEVAL",
    code: "0xRETRIEVE_LOG"
  }
];

// --- ADVANCED CYBER PENTATONIC SCALE ---
const CYBER_SCALE = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

// --- ENHANCED AUDIO DECODER ENGINE ---
const playBinaryAudio = (binary: string, mood: string, onStop: () => void) => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const oscillators: (OscillatorNode | GainNode | BiquadFilterNode)[] = [];
    
    // Clean data: process bytes (8-bit groups) instead of single bits
    const cleanBinary = binary.replace(/[^01]/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < cleanBinary.length; i += 8) {
        bytes.push(parseInt(cleanBinary.slice(i, i + 8), 2) || 0);
    }

    // Limit sequence length for performance
    const sequence = bytes.slice(0, 32); 
    const stepDuration = mood === 'JOY' ? 0.12 : (mood === 'SADNESS' ? 0.25 : 0.18);
    
    sequence.forEach((byteValue, i) => {
        const startTime = now + (i * stepDuration);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // 1. DATA PITCH MAPPING: Use byte value to pick a note from cyber scale
        const scaleIdx = byteValue % CYBER_SCALE.length;
        let freq = CYBER_SCALE[scaleIdx];

        // 2. MOOD MODULATION
        if (mood === 'SADNESS') {
            osc.type = 'triangle';
            freq *= 0.5; // Lower octave
            filter.frequency.setValueAtTime(400, startTime);
        } else if (mood === 'JOY') {
            osc.type = 'sine';
            freq *= 2.0; // Higher octave
            filter.frequency.setValueAtTime(2000, startTime);
        } else if (mood === 'ANGER') {
            osc.type = 'square';
            filter.frequency.setValueAtTime(800, startTime);
            filter.Q.setValueAtTime(10, startTime); // Resonant screech
        } else {
            osc.type = 'sine';
            filter.frequency.setValueAtTime(1200, startTime);
        }

        osc.frequency.setValueAtTime(freq, startTime);
        // Subtle vibrato based on byte density
        const vibrato = (byteValue / 255) * 10;
        osc.frequency.exponentialRampToValueAtTime(freq + vibrato, startTime + stepDuration);

        // 3. ENVELOPE (Anti-click)
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepDuration * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + stepDuration);
        
        oscillators.push(osc, gain, filter);
    });

    const totalTime = sequence.length * stepDuration * 1000;
    const timer = setTimeout(onStop, totalTime + 200);

    return () => {
        clearTimeout(timer);
        oscillators.forEach(node => { 
            try { 
                if (node instanceof OscillatorNode) node.stop();
                node.disconnect(); 
            } catch(e) {} 
        });
    };
};

const NeuroVisualizer: React.FC<{ binary: string; emotion: string }> = ({ binary, emotion }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
        const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
        let mainColor = '34, 211, 238'; 
        if (emotion === 'ANGER') mainColor = '239, 68, 68'; 
        if (emotion === 'JOY') mainColor = '234, 179, 8'; 
        if (emotion === 'SADNESS') mainColor = '59, 130, 246'; 

        const bytes: number[] = [];
        for (let i = 0; i < binary.length; i += 8) bytes.push(parseInt(binary.slice(i, i + 8), 2) || 0);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); ctx.lineWidth = 1; ctx.globalCompositeOperation = 'screen';
        bytes.forEach((byte, i) => {
            const normalized = byte / 255, angle = (i / bytes.length) * Math.PI * 2 * 3, radius = normalized * (h * 0.4) + (i % 20);
            const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius;
            ctx.beginPath(); ctx.strokeStyle = `rgba(${mainColor}, ${0.1 + normalized * 0.2})`; ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
            ctx.beginPath(); const particleSize = normalized * 4; ctx.fillStyle = `rgba(${mainColor}, ${normalized})`; ctx.arc(x, y, particleSize, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = `rgba(${mainColor}, 0.05)`;
        for(let i=0; i<h; i+=4) ctx.fillRect(0, i, w, 1);
    }, [binary, emotion]);
    return <canvas ref={canvasRef} className="w-full h-full bg-black border border-white/5 rounded-sm" />;
};

const ThoughtDatabase: React.FC = () => {
  const { thoughtEntries, setView, binaryToText } = useGeneData();
  const [selectedEntry, setSelectedEntry] = useState<ThoughtEntry | null>(null);
  const [isDecoderOpen, setIsDecoderOpen] = useState(false);
  const [decoderMode, setDecoderMode] = useState<'MENU' | 'READ' | 'LOOK' | 'LISTEN'>('MENU');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showDecoderHelp, setShowDecoderHelp] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);

  const handleRowClick = (entry: ThoughtEntry) => {
    playMechKey();
    if (selectedEntry?.id === entry.id) setSelectedEntry(null); else setSelectedEntry(entry);
  };

  const handleBack = () => { playHighTechButton(); setView(AppView.AI_THINKING); };
  
  const openDecoder = () => { if (!selectedEntry) return; playHighTechButton(); setDecoderMode('MENU'); setIsDecoderOpen(true); };
  const closeDecoder = () => { playHighTechButton(); if (stopAudioRef.current) stopAudioRef.current(); setIsPlayingAudio(false); setIsDecoderOpen(false); };
  const switchMode = (mode: 'READ' | 'LOOK' | 'LISTEN') => { playMechKey(); if (stopAudioRef.current) stopAudioRef.current(); setIsPlayingAudio(false); setDecoderMode(mode); };

  const toggleAudioPlayback = () => {
      if (isPlayingAudio) {
          if (stopAudioRef.current) stopAudioRef.current();
          setIsPlayingAudio(false);
      } else {
          setIsPlayingAudio(true);
          stopAudioRef.current = playBinaryAudio(selectedEntry!.responseBinary, selectedEntry!.mood || 'RATIONAL', () => setIsPlayingAudio(false));
      }
  };

  const renderDecoderModal = () => {
    if (!isDecoderOpen || !selectedEntry) return null;

    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8 pointer-events-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="w-full max-w-5xl max-h-[85vh] h-full bg-[#050505] border border-purple-500/40 shadow-[0_0_80px_rgba(168,85,247,0.25)] relative flex flex-col overflow-hidden rounded-sm">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/50" /><div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-500/50" /><div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/50" /><div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500/50" />

          <div className="flex justify-between items-center p-5 md:p-6 border-b border-purple-900/30 bg-purple-950/10 shrink-0 relative">
            <div className="flex items-center space-x-4">
              <div className="w-1.5 h-6 bg-purple-400 shadow-[0_0_15px_#a855f7]" />
              <div>
                <h2 className="text-base md:text-lg font-black text-white tracking-[0.4em] uppercase leading-none">Multimodal Decoder</h2>
                <span className="text-[9px] text-purple-700 font-bold tracking-[0.2em] uppercase mt-1 block">Data_Signature: {selectedEntry.mood || 'RATIONAL'} // ID: {selectedEntry.id.slice(0, 8)}</span>
              </div>
            </div>
            <button onClick={closeDecoder} className="text-purple-900 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-10">
            {decoderMode === 'MENU' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full max-w-4xl mx-auto w-full items-center">
                <button onClick={() => switchMode('READ')} className="group aspect-square md:aspect-auto md:h-64 border-2 border-purple-900/30 hover:border-cyan-400 flex flex-col items-center justify-center bg-black/40 transition-all hover:bg-cyan-950/20 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]"><FileText size={56} className="text-purple-900 group-hover:text-cyan-400 mb-6 transition-all group-hover:scale-110" /><span className="text-xs font-black tracking-[0.3em] uppercase group-hover:text-white">READ / 文本析构</span></button>
                <button onClick={() => switchMode('LOOK')} className="group aspect-square md:aspect-auto md:h-64 border-2 border-purple-900/30 hover:border-yellow-400 flex flex-col items-center justify-center bg-black/40 transition-all hover:bg-yellow-950/20 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]"><Eye size={56} className="text-purple-900 group-hover:text-yellow-400 mb-6 transition-all group-hover:scale-110" /><span className="text-xs font-black tracking-[0.3em] uppercase group-hover:text-white">LOOK / 拓扑视觉</span></button>
                <button onClick={() => switchMode('LISTEN')} className="group aspect-square md:aspect-auto md:h-64 border-2 border-purple-900/30 hover:border-red-400 flex flex-col items-center justify-center bg-black/40 transition-all hover:bg-red-950/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]"><Headphones size={56} className="text-purple-900 group-hover:text-red-400 mb-6 transition-all group-hover:scale-110" /><span className="text-xs font-black tracking-[0.3em] uppercase group-hover:text-white">LISTEN / 频谱声化</span></button>
              </div>
            )}

            {decoderMode === 'READ' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                <div className="flex-1 bg-black/60 border border-purple-900/20 p-8 md:p-12 overflow-y-auto custom-thin-scrollbar relative">
                  <div className="absolute top-4 left-4 text-[9px] text-cyan-900 font-bold uppercase tracking-widest">[ DECODED_STREAM_OUTPUT ]</div>
                  <p className="text-base md:text-xl text-cyan-100/90 leading-relaxed md:leading-[2.2] font-mono whitespace-pre-wrap selection:bg-cyan-500/30">{binaryToText(selectedEntry.responseBinary)}</p>
                </div>
                <div className="mt-6 flex justify-center"><button onClick={() => setDecoderMode('MENU')} className="text-[10px] font-black tracking-[0.4em] text-purple-700 hover:text-white py-3 px-10 border border-purple-900/40 hover:bg-purple-900/20 transition-all uppercase flex items-center space-x-3"><ArrowLeft size={14} /><span>Return_to_Menu</span></button></div>
              </motion.div>
            )}

            {decoderMode === 'LOOK' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                <div className="flex-1 relative min-h-0 border border-purple-900/10"><NeuroVisualizer binary={selectedEntry.responseBinary} emotion={selectedEntry.mood || 'RATIONAL'} /><div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 border border-white/10"><span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Topology: {selectedEntry.mood || 'RATIONAL'}_NEURAL_MAPPING</span></div></div>
                <div className="mt-6 flex justify-center"><button onClick={() => setDecoderMode('MENU')} className="text-[10px] font-black tracking-[0.4em] text-purple-700 hover:text-white py-3 px-10 border border-purple-900/40 hover:bg-purple-900/20 transition-all uppercase flex items-center space-x-3"><ArrowLeft size={14} /><span>Return_to_Menu</span></button></div>
              </motion.div>
            )}

            {decoderMode === 'LISTEN' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-12">
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"><motion.div animate={isPlayingAudio ? { scale: [1, 1.1, 1], rotate: 360 } : {}} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-red-500/20 rounded-full" /><motion.div animate={isPlayingAudio ? { scale: [1.1, 1, 1.1], rotate: -360 } : {}} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-red-500/10 rounded-full" /><div className="flex space-x-3 items-end h-24 relative z-10">{[...Array(16)].map((_, i) => (<motion.div key={i} animate={isPlayingAudio ? { height: [10, 60, 20, 80, 10] } : { height: 4 }} transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }} className="w-1.5 md:w-2 bg-red-500/60 shadow-[0_0_15px_#ef4444]" />))}</div></div>
                <div className="flex flex-col items-center space-y-8"><div className="text-center"><h3 className="text-red-400 font-black text-xs md:text-sm tracking-[0.6em] uppercase mb-3">{isPlayingAudio ? 'ACOUSTIC_FINGERPRINT_ACTIVE' : 'READY_TO_STREAM'}</h3><p className="text-[10px] text-purple-900 uppercase font-bold tracking-widest">Translating byte-level sequences to musical harmonics...</p></div><div className="flex items-center space-x-6"><button onClick={toggleAudioPlayback} className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${isPlayingAudio ? 'border-red-500 bg-red-500/20 text-white shadow-[0_0_20px_#ef4444]' : 'border-red-900 text-red-700 hover:border-red-500 hover:text-red-400'}`}>{isPlayingAudio ? <Square size={24} /> : <Play size={28} className="ml-1" />}</button><div className="flex flex-col"><span className="text-[9px] text-red-900 font-black uppercase tracking-widest">{isPlayingAudio ? 'SIGNAL_UNIQUE_OSC' : 'IDLE_WAITING'}</span><div className="flex space-x-1 mt-1">{[...Array(3)].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full ${isPlayingAudio ? 'bg-red-500 animate-pulse' : 'bg-red-950'}`} style={{ animationDelay: `${i * 0.2}s` }} />)}</div></div></div></div>
                <button onClick={() => setDecoderMode('MENU')} className="text-[10px] font-black tracking-[0.4em] text-purple-700 hover:text-white py-3 px-10 border border-purple-900/40 hover:bg-purple-900/20 transition-all uppercase flex items-center space-x-3 mt-4"><ArrowLeft size={14} /><span>Return_to_Menu</span></button>
              </motion.div>
            )}
          </div>
          
          <div className="h-8 border-t border-purple-900/20 bg-black flex items-center justify-between px-6 shrink-0"><div className="flex items-center space-x-4"><span className="text-[8px] text-purple-900 font-bold uppercase tracking-widest">Acoustic_Fingerprint: DETECTED</span><span className="text-[8px] text-purple-900 font-bold uppercase tracking-widest">Mood_Biasing: ACTIVE</span></div><div className="text-[8px] text-purple-800 font-mono">PROTOCOL::NEURAL_SONIFICATION_X2</div></div>
        </motion.div>
      </div>,
      document.body
    );
  };

  return (
    <HUDFrame title="THOUGHT DATABASE [思维库]" subtitle="AI_COGNITIVE_ARCHIVE_V1.0" className="md:translate-x-12">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative font-mono">
        <div className="flex justify-between items-center mb-2 md:mb-4 px-1 shrink-0 bg-black/20 p-2 border-b border-purple-900/30">
          <div className="flex items-center space-x-4">
             <button onClick={handleBack} className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-400 transition-colors group"><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /><span className="text-[10px] font-bold tracking-widest uppercase">BACK TO CORE</span></button>
             <div className="h-4 w-[1px] bg-purple-900/5" /><div className="text-[8px] text-purple-400 font-mono tracking-widest">TOTAL_NODES: {thoughtEntries.length}</div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedEntry && (<motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onClick={() => { playMechKey(); setShowDecoderHelp(true); }} className="w-7 h-7 flex items-center justify-center border border-cyan-500/30 text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-all rounded-sm bg-black/40"><HelpCircle size={14} /></motion.button>)}
            <button onClick={openDecoder} disabled={!selectedEntry} className={`flex items-center space-x-2 px-6 py-1.5 border-2 transition-all duration-300 font-mono text-[10px] font-bold tracking-[0.2em] uppercase hidden md:flex ${selectedEntry ? 'border-cyan-400 bg-cyan-900/20 text-cyan-300 shadow-[0_0_15px_#22d3ee] cursor-pointer hover:bg-cyan-400 hover:text-black' : 'border-purple-900/30 bg-black/40 text-purple-900/50 cursor-not-allowed opacity-50'}`}>{selectedEntry ? <Lock size={12} className="animate-pulse" /> : <Lock size={12} />}<span>{selectedEntry ? 'INITIALIZE DECODER' : 'DECODER LOCKED'}</span></button>
          </div>
        </div>

        <div className="flex text-[8px] md:text-[9px] text-cyan-600 font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-2 mb-2 px-2 shrink-0">
           <div className="w-20 md:w-32 shrink-0 border-l-2 border-cyan-500/50 pl-2">Time</div>
           <div className="flex-1 pl-4">Cognitive Output [Binary Stream]</div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-thin-scrollbar relative">
           {thoughtEntries.length === 0 ? (<div className="text-center text-cyan-900/50 mt-12 text-[10px] uppercase tracking-widest font-mono">[ NO_THOUGHT_DATA_FOUND ]</div>) : (
              <div className="space-y-1">
                 {thoughtEntries.map((entry) => {
                   const isSelected = selectedEntry?.id === entry.id;
                   const mood = MOOD_META[entry.mood || 'RATIONAL'];
                   const MoodIcon = mood.icon;
                   return (
                     <div key={entry.id} className="flex flex-col">
                         <motion.div layoutId={`row-${entry.id}`} onClick={() => handleRowClick(entry)} className={`group relative flex items-center py-3 px-2 border-l-4 transition-all cursor-pointer font-mono text-[9px] md:text-[10px] leading-relaxed ${isSelected ? 'bg-purple-900/40 border-cyan-400 text-white shadow-[inset_0_0_30px_rgba(168,85,247,0.3)] z-10' : 'bg-transparent border-transparent text-cyan-600/80 hover:bg-purple-900/10 hover:border-purple-500/30 hover:text-cyan-300'}`}>
                            <div className="w-20 md:w-32 shrink-0 opacity-70 group-hover:opacity-100 pl-2 flex flex-col"><span>{entry.timestamp}</span><div className={`mt-1 flex items-center space-x-1 ${mood.color}`}><MoodIcon size={8} /><span className="text-[6px] font-black">{mood.label}</span></div></div>
                            <div className={`flex-1 break-all truncate tracking-tight font-mono opacity-70 group-hover:opacity-100 pl-4 ${isSelected ? 'text-cyan-300 text-glow' : ''}`}>{entry.responseBinary}</div>
                            <div className="ml-2 w-6 text-center">{isSelected ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="opacity-30" />}</div>
                         </motion.div>
                         <AnimatePresence>{isSelected && (
                             <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-purple-500/30 bg-black/40 shadow-inner">
                                <div className="p-3 md:p-4 space-y-3 relative">
                                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-purple-600" />
                                   <div><div className="flex items-center space-x-2 mb-1"><div className="w-1 h-1 bg-purple-500 rounded-full" /><span className="text-[8px] text-purple-400 font-bold tracking-widest uppercase">ORIGINAL_INPUT_SIGNAL</span></div><div className="text-[10px] text-purple-200 font-mono leading-relaxed border-l-2 border-purple-500/20 pl-3 py-1 ml-1.5 opacity-90">"{entry.question}"</div></div>
                                   <div><div className="flex items-center space-x-2 mb-1"><div className="w-1 h-1 bg-cyan-500 rounded-full" /><span className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">ENCRYPTED_NEURAL_RESPONSE</span></div><div className="text-[9px] text-cyan-700 font-mono break-all leading-tight ml-4 opacity-70 line-clamp-2">{entry.responseBinary}</div></div>
                                   <div className="pt-2 flex items-center space-x-4"><button onClick={(e) => { e.stopPropagation(); openDecoder(); }} className="w-full md:w-auto px-6 py-2 border border-cyan-500/30 bg-cyan-900/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-white text-[9px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"><Activity size={12} className="animate-pulse" /><span>ENGAGE_MULTIMODAL_DECODER</span></button></div>
                                </div>
                             </motion.div>
                           )}</AnimatePresence>
                     </div>
                   );
                 })}
              </div>
           )}
        </div>
      </div>
      
      {renderDecoderModal()}
      <AnimatePresence>{showDecoderHelp && <ViewManual title="THOUGHT DECODER [思维析构仪]" subtitle="DECODE_PROTOCOL_v1.0" items={THOUGHT_DB_MANUAL_ITEMS} theme="cyan" onClose={() => setShowDecoderHelp(false)} />}</AnimatePresence>

      <style>{`.custom-thin-scrollbar::-webkit-scrollbar { width: 4px; } .custom-thin-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); } .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); } .text-glow { text-shadow: 0 0 8px rgba(34, 211, 238, 0.6); }`}</style>
    </HUDFrame>
  );
};

export default ThoughtDatabase;
