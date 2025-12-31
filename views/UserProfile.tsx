
import React, { useState } from 'react';
import HUDFrame from '../components/HUDFrame';
import { useAuth } from '../context/AuthContext';
import { useGeneData } from '../context/GeneContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, Database, LogOut, Cpu, Zap, Star, Settings, X, Shield, Palette, Save, HelpCircle, Info, Search, UserPlus, Users, FolderLock, ArrowLeft } from 'lucide-react';
import { playHighTechButton, playMechKey } from '../utils/audio';
import { AppView } from '../types';

const UserProfile: React.FC = () => {
  const { user, logout, updateUser, changeCustomUid, searchUserByUid, sendFriendRequest } = useAuth();
  const { entries, thoughtEntries, setView } = useGeneData();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState<string | null>(null);
  
  const [tempName, setTempName] = useState(user?.displayName || '');
  const [tempColor, setTempColor] = useState(user?.themeColor || '#22d3ee');
  const [newUid, setNewUid] = useState(user?.customUid || '');

  const [searchUid, setSearchUid] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user) return null;

  const nodeCount = entries.filter(e => e.userId === user.uid).length;
  const thoughtCount = thoughtEntries.filter(e => e.userId === user.uid).length;
  const evolutionInteractions = user.evolutionInteractions || 0; 
  
  const stability = user.stability || 98.4; 
  const evolutionIdx = (nodeCount * 0.12 + thoughtCount * 0.25 + evolutionInteractions * 0.05).toFixed(2);
  const currentXP = nodeCount * 100 + thoughtCount * 250 + evolutionInteractions * 20;
  const level = Math.floor(Math.sqrt(currentXP / 100)) + 1;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const prevLevelXP = Math.pow(level - 1, 2) * 100;
  const progress = ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;

  const handleSaveSettings = async () => {
    playHighTechButton();
    updateUser({ displayName: tempName.trim() || user.displayName, themeColor: tempColor });
    if (newUid !== user.customUid && !user.uidChanged) {
        const res = await changeCustomUid(newUid);
        if (!res.success) { alert(res.msg); return; }
    }
    setIsSettingsOpen(false);
  };

  const handleSearchFriend = async () => {
      if (!searchUid.trim()) return;
      playMechKey(); setIsSearching(true); setFeedback(null);
      const res = await searchUserByUid(searchUid);
      setIsSearching(false);
      if (res) setSearchResult(res); else setFeedback("ERROR: NODE_NOT_FOUND");
  };

  const handleAddFriend = async (targetUid: string) => {
      playHighTechButton();
      const res = await sendFriendRequest(targetUid);
      alert(res.msg); if (res.success) setSearchResult(null);
  };

  const avatarColor = user.themeColor || '#22d3ee';
  const rankColor = stability <= 50 ? "#ef4444" : "#22d3ee";

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[85vh] h-full overflow-visible relative">
        <HUDFrame title="IDENTITY CORE [身份核心]" subtitle="NEURAL_IDENT_V9.2 [神经身份识别系统]">
          <div className="flex-1 flex flex-col md:flex-row gap-8 p-2 md:p-4 overflow-y-auto custom-thin-scrollbar font-mono">
            <div className="w-full md:w-80 flex flex-col items-center space-y-4 py-4 border-r border-cyan-500/10 relative shrink-0">
              {/* 新增：返回按钮 */}
              <button 
                onClick={() => { playMechKey(); setView(AppView.ENCODING); }}
                className="absolute top-0 left-4 p-2 text-cyan-800 hover:text-cyan-400 transition-all group flex items-center space-x-1"
                title="Return_to_Encoding"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
              </button>

              <button onClick={() => { playMechKey(); setIsSettingsOpen(true); }} className="absolute top-0 right-4 p-2 text-cyan-800 hover:text-cyan-400 transition-colors group" title="Recalibrate_Identity">
                <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              </button>
              
              <div className="relative group mt-8">
                <div className="absolute inset-[-8px] border border-cyan-500/20 rounded-full animate-spin-slow" />
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 bg-black/40 flex items-center justify-center relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-700" style={{ borderColor: `${avatarColor}4d`, boxShadow: `0 0 30px ${avatarColor}33` }}>
                  <User size={48} style={{ color: `${avatarColor}80` }} />
                  <div className="absolute bottom-0 w-full h-1/3 flex flex-col items-center justify-center" style={{ backgroundColor: `${rankColor}1a` }}>
                    <span className="text-[9px] font-black uppercase" style={{ color: rankColor }}>RANK_IDENTIFIED</span>
                  </div>
                </div>
              </div>
              <div className="text-center w-full px-6">
                <h3 className="text-lg font-black text-white tracking-widest uppercase">{user.displayName}</h3>
                <p className="text-[9px] text-cyan-800 font-bold mt-1">NODE_UID: <span className="text-cyan-400">{user.customUid}</span></p>
                <div className="flex items-center justify-between mt-6 mb-1">
                    <span className="text-[9px] text-cyan-600 font-bold uppercase">Level: {level}</span>
                    <span className="text-[8px] text-cyan-900">{currentXP} XP</span>
                </div>
                <div className="w-full h-1 bg-cyan-900/30 rounded-full overflow-hidden border border-cyan-500/10">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                </div>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              <div className="w-full px-4 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[8px] text-cyan-900 font-black uppercase tracking-widest flex items-center"><Users size={10} className="mr-1.5" /> Friends_Link</span>
                    <span className="text-[9px] text-cyan-400 font-mono">[{user.friends?.length || 0}/128]</span>
                 </div>
                 <div className="grid grid-cols-5 gap-2">
                    {user.friends?.slice(0, 10).map((fuid: string) => (
                        <div key={fuid} className="aspect-square bg-cyan-500/10 border border-cyan-500/20 rounded-sm flex items-center justify-center text-[7px] text-cyan-500 font-bold uppercase" title={fuid}>{fuid.slice(0, 2)}</div>
                    ))}
                 </div>
              </div>
              <button onClick={() => { playHighTechButton(); logout(); }} className="mt-auto w-full flex items-center justify-center space-x-2 py-3 border-t border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all uppercase text-[9px] font-bold tracking-widest group"><LogOut size={12} className="group-hover:translate-x-1 transition-transform" /><span>TERMINATE_SESSION</span></button>
            </div>

            <div className="flex-1 flex flex-col space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cyan-900/5 border border-cyan-500/20 p-4 rounded-sm relative group hover:bg-cyan-900/10 transition-colors">
                    <span className="text-[9px] text-cyan-700 font-bold uppercase tracking-widest block mb-1">Neural_Stability</span>
                    <div className="text-2xl font-black text-white" style={{ color: rankColor }}>{stability}%</div>
                </div>
                <div className="bg-purple-900/5 border border-purple-500/20 p-4 rounded-sm relative group hover:bg-purple-900/10 transition-colors">
                    <span className="text-[9px] text-purple-700 font-bold uppercase tracking-widest block mb-1">Evolution_Index</span>
                    <div className="text-2xl font-black text-white">{evolutionIdx}</div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-sm flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform"><FolderLock size={20} /></div>
                    <div>
                        <div className="text-xs font-black text-emerald-100 uppercase tracking-widest">Digital_Archive_Vault</div>
                        <div className="text-[8px] text-emerald-900 uppercase font-bold">Encrypted node data storage</div>
                    </div>
                </div>
                <button 
                    onClick={() => { playHighTechButton(); setView(AppView.PERSONAL_DB); }}
                    className="px-6 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black text-[10px] font-black uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    Access_Vault
                </button>
              </div>

              <div className="border border-cyan-900/20 bg-black/20 p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2"><h4 className="text-xs font-black text-cyan-400 tracking-widest uppercase flex items-center"><Search size={14} className="mr-2" /> Neural_Network_Search</h4></div>
                <div className="flex space-x-3">
                    <div className="flex-1 relative">
                        <input type="text" value={searchUid} onChange={(e) => setSearchUid(e.target.value.toUpperCase())} placeholder="ENTER_NODE_UID_FOR_LINKING..." className="w-full bg-black border border-cyan-900/50 p-3 text-xs text-cyan-100 placeholder:text-cyan-900 focus:border-cyan-500 focus:outline-none transition-all" />
                        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <button onClick={handleSearchFriend} className="px-6 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all uppercase text-[10px] font-black">Scan_Node</button>
                </div>
                <AnimatePresence mode="wait">
                    {searchResult && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 bg-black/40"><User size={20} /></div>
                                <div><div className="text-xs font-black text-white">{searchResult.displayName}</div><div className="text-[8px] text-cyan-800 uppercase font-bold">UID: {searchResult.customUid}</div></div>
                            </div>
                            <button onClick={() => handleAddFriend(searchResult.customUid)} className="flex items-center space-x-2 px-4 py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black text-[9px] font-black uppercase transition-all"><UserPlus size={14} /><span>Establish_Link</span></button>
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </HUDFrame>
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-lg bg-[#080808] border border-cyan-500/30 p-8 shadow-2xl relative">
                <div className="flex justify-between items-center mb-8 border-b border-cyan-900/40 pb-4"><div className="flex items-center space-x-3 text-cyan-400"><Shield size={20} /><h2 className="text-xl font-black text-white tracking-widest uppercase">Identity_Recalibration</h2></div><button onClick={() => setIsSettingsOpen(false)} className="text-cyan-900 hover:text-white transition-colors"><X size={24} /></button></div>
                <div className="space-y-8 font-mono">
                  <div className="space-y-2"><label className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest">Neural_Handle</label><input type="text" value={tempName} onChange={(e) => setTempName(e.target.value.toUpperCase())} className="w-full bg-black border border-cyan-900/50 p-3 text-cyan-100 focus:border-cyan-400 focus:outline-none" /></div>
                  <div className="space-y-2"><label className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest flex items-center">UID_Recalibration {user.uidChanged && <span className="ml-2 text-red-500/50 text-[7px] italic">[LOCKED]</span>}</label><div className="flex items-center space-x-3"><input type="text" disabled={user.uidChanged} value={newUid} onChange={(e) => setNewUid(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} className={`flex-1 bg-black border p-3 text-xs focus:outline-none transition-all ${user.uidChanged ? 'border-red-900/30 text-gray-700' : 'border-cyan-900/50 text-cyan-100 focus:border-cyan-400'}`} />{!user.uidChanged && <div className="text-[8px] text-cyan-900 font-bold uppercase italic">Permitted: 1x Only</div>}</div></div>
                  <button onClick={handleSaveSettings} className="w-full py-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-black tracking-[0.4em] uppercase hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">Execute_Update</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`
        @keyframes spin-slow { from { rotate: 0deg; } to { rotate: 360deg; } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .custom-thin-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-thin-scrollbar::-webkit-scrollbar-track { background: rgba(34, 211, 238, 0.2); }
      `}</style>
    </div>
  );
};

export default UserProfile;
