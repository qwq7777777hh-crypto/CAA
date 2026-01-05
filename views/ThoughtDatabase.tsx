import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useGeneData } from '../context/GeneContext';
import { AppView, ThoughtEntry } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { ArrowLeft, Eye, FileText, Headphones, X, Lock, Play, Pause, Activity, ChevronDown, ChevronRight, HelpCircle, Brain, Smile, Frown, Flame } from 'lucide-react';
import ViewManual, { ManualItem } from '../components/ViewManual';

const MOOD_META: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  'RATIONAL': { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', label: '理智' },
  'JOY': { icon: Smile, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: '愉悦' },
  'SADNESS': { icon: Frown, color: 'text-blue-400', bg: 'bg-blue-500/10', label: '伤心' },
  'ANGER': { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', label: '愤怒' },
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
    return <canvas ref={canvasRef} className="w-full h-64 md:h-80 bg-black border border-white/10 rounded-sm" />;
};

const ThoughtDatabase: React.FC = () => {
  const { thoughtEntries, setView, binaryToText } = useGeneData();
  const [selectedEntry, setSelectedEntry] = useState<ThoughtEntry | null>(null);
  const [isDecoderOpen, setIsDecoderOpen] = useState(false);
  const [decoderMode, setDecoderMode] = useState<'MENU' | 'READ' | 'LOOK' | 'LISTEN'>('MENU');
  const [showDecoderHelp, setShowDecoderHelp] = useState(false);

  const handleRowClick = (entry: ThoughtEntry) => {
    playMechKey();
    if (selectedEntry?.id === entry.id) setSelectedEntry(null); else setSelectedEntry(entry);
  };

  const handleBack = () => { playHighTechButton(); setView(AppView.AI_THINKING); };
  const openDecoder = () => { if (!selectedEntry) return; playHighTechButton(); setDecoderMode('MENU'); setIsDecoderOpen(true); };
  const closeDecoder = () => { playHighTechButton(); setIsDecoderOpen(false); };
  const switchMode = (mode: 'READ' | 'LOOK' | 'LISTEN') => { playMechKey(); setDecoderMode(mode); };

  return (
    <HUDFrame title="THOUGHT DATABASE [思维库]" subtitle="AI_COGNITIVE_ARCHIVE_V1.0" className="md:translate-x-12">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative font-mono">
        <div className="flex justify-between items-center mb-2 md:mb-4 px-1 shrink-0 bg-black/20 p-2 border-b border-purple-900/30">
          <div className="flex items-center space-x-4">
             <button onClick={handleBack} className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-400 transition-colors"><ArrowLeft size={14} /><span className="text-[10px] font-bold tracking-widest uppercase">BACK TO CORE</span></button>
             <div className="h-4 w-[1px] bg-purple-900/50" /><div className="text-[8px] text-purple-400 font-mono tracking-widest">TOTAL_NODES: {thoughtEntries.length}</div>
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
                            <div className="w-20 md:w-32 shrink-0 opacity-70 group-hover:opacity-100 pl-2 flex flex-col">
                                <span>{entry.timestamp}</span>
                                <div className={`mt-1 flex items-center space-x-1 ${mood.color}`}>
                                    <MoodIcon size={8} />
                                    <span className="text-[6px] font-black">{mood.label}</span>
                                </div>
                            </div>
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
      {isDecoderOpen && selectedEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="w-full max-w-3xl h-[50vh] bg-[#050505] border border-purple-500/50 shadow-2xl relative flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-purple-500/30 bg-purple-900/10 shrink-0">
                      <div className="flex items-center space-x-3"><Activity size={16} className="text-purple-400" /><span className="text-sm font-black text-white tracking-[0.3em] uppercase">Multimodal Decoder</span></div>
                      <button onClick={closeDecoder} className="text-purple-500 hover:text-white transition-colors"><X size={20} /></button>
                  </div>
                  <div className="flex-1 p-8 overflow-hidden">
                      {decoderMode === 'MENU' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                              <button onClick={() => switchMode('READ')} className="group border border-purple-500/30 hover:border-cyan-400 flex flex-col items-center justify-center bg-black/40"><FileText size={40} className="text-purple-500 group-hover:text-cyan-400 mb-2" /><span className="text-sm font-black uppercase">READ</span></button>
                              <button onClick={() => switchMode('LOOK')} className="group border border-purple-500/30 hover:border-yellow-400 flex flex-col items-center justify-center bg-black/40"><Eye size={40} className="text-purple-500 group-hover:text-yellow-400 mb-2" /><span className="text-sm font-black uppercase">LOOK</span></button>
                              <button onClick={() => switchMode('LISTEN')} className="group border border-purple-500/30 hover:border-red-400 flex flex-col items-center justify-center bg-black/40"><Headphones size={40} className="text-purple-500 group-hover:text-red-400 mb-2" /><span className="text-sm font-black uppercase">LISTEN</span></button>
                          </div>
                      )}
                      {decoderMode === 'LOOK' && <div className="h-full flex flex-col"><NeuroVisualizer binary={selectedEntry.responseBinary} emotion={selectedEntry.mood || 'RATIONAL'} /><button onClick={() => setDecoderMode('MENU')} className="mt-4 text-xs text-purple-500 uppercase self-center">[ RETURN ]</button></div>}
                  </div>
              </div>
          </div>
      )}
      <style>{`.custom-thin-scrollbar::-webkit-scrollbar { width: 4px; } .custom-thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); } .text-glow { text-shadow: 0 0 8px rgba(34, 211, 238, 0.6); }`}</style>
    </HUDFrame>
  );
};

export default ThoughtDatabase;