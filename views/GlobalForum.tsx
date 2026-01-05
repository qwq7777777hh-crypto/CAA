import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useAuth } from '../context/AuthContext';
import { useGeneData } from '../context/GeneContext';
import { playHighTechButton, playMechKey } from '../utils/audio';
import { Send, Image as ImageIcon, Video, User, Globe, AlertTriangle, Paperclip, ChevronDown, ShieldAlert, ShieldCheck, UserPlus, X, Zap, Star, ArrowLeft } from 'lucide-react';
import { AppView } from '../types';

interface ChatMessage {
  id: string;
  uid: string;
  userName: string;
  userCustomUid?: string; // 论坛消息中携带 UID
  text: string;
  media?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  timestamp: number;
  userStats?: {
    nodes: number;
    thoughts: number;
    stability: number;
  };
}

const GlobalForum: React.FC = () => {
  const { user, openAuthModal, sendFriendRequest } = useAuth();
  const { entries, thoughtEntries, setView } = useGeneData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [inspectUser, setInspectUser] = useState<ChatMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.firebaseDB) return;
    const forumRef = window.firebaseDB.ref('global_forum_v2');
    
    const handleNewMessage = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const sorted = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
      }
    };

    forumRef.limitToLast(100).on('value', handleNewMessage);
    return () => forumRef.off('value', handleNewMessage);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) { openAuthModal(); return; }
    if (!inputText.trim() && !isUploading) return;

    playHighTechButton();
    const forumRef = window.firebaseDB.ref('global_forum_v2');
    
    const currentNodes = entries.filter(e => e.userId === user.uid || !e.userId).length;
    const currentThoughts = thoughtEntries.filter(e => e.userId === user.uid).length;

    const newMessage = {
      uid: user.uid,
      userName: user.displayName,
      userCustomUid: user.customUid,
      text: inputText,
      timestamp: window.firebase.database.ServerValue.TIMESTAMP,
      userStats: {
          nodes: currentNodes,
          thoughts: currentThoughts,
          stability: user.stability || 98 
      }
    };

    await forumRef.push(newMessage);
    setInputText('');
  };

  const handleInspect = (msg: ChatMessage) => {
      playMechKey();
      setInspectUser(msg);
  };

  const handleAddFriendFromInspect = async () => {
      if (!user) { openAuthModal(); return; }
      if (!inspectUser || !inspectUser.userCustomUid) return;
      playHighTechButton();
      const res = await sendFriendRequest(inspectUser.userCustomUid);
      alert(res.msg);
      if (res.success) setInspectUser(null);
  };

  const getLevel = (stats?: any) => {
      if (!stats) return 1;
      const currentXP = stats.nodes * 100 + stats.thoughts * 250;
      return Math.floor(Math.sqrt(currentXP / 100)) + 1;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
    if (file.size > 1024 * 1024 * 2) { alert("SIGNAL OVERLOAD: File exceeds 2MB limit."); return; }
    setIsUploading(true);
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const forumRef = window.firebaseDB.ref('global_forum_v2');
      const currentNodes = entries.filter(e => e.userId === user.uid).length;
      const currentThoughts = thoughtEntries.filter(e => e.userId === user.uid).length;
      await forumRef.push({
        uid: user.uid,
        userName: user.displayName,
        userCustomUid: user.customUid,
        text: type === 'IMAGE' ? "[SENT_VISUAL_DATA]" : "[SENT_MOTION_DATA]",
        media: base64,
        mediaType: type,
        timestamp: window.firebase.database.ServerValue.TIMESTAMP,
        userStats: { nodes: currentNodes, thoughts: currentThoughts, stability: user.stability || 98 }
      });
      setIsUploading(false);
      playHighTechButton();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col px-4 transition-all duration-500 relative h-full justify-center">
      <HUDFrame 
        title="NEURAL COMMONS [神经公共区]" 
        subtitle="GLOBAL_REALTIME_UPLINK_v2.0"
        className="h-[80vh] md:h-[750px] lg:h-[800px]"
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden font-mono relative">
          
          <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/20 bg-cyan-950/10 shrink-0">
            <div className="flex items-center space-x-4">
              {/* 新增：返回按钮 */}
              <button 
                onClick={() => { playMechKey(); setView(AppView.ENCODING); }}
                className="flex items-center space-x-1 text-cyan-800 hover:text-cyan-400 transition-colors group mr-2"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
              </button>
              <div className="w-px h-4 bg-cyan-900/30" />
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-cyan-400 animate-pulse" />
                <span className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">Live_Node_Cluster: Asia-SE</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
                <span className="text-[9px] text-cyan-700 hidden sm:inline">ENCRYPTION: AES_X9</span>
                <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" />
                    <span className="text-[9px] text-cyan-400 font-bold">LIVE_LINK_STABLE</span>
                </div>
            </div>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 space-y-8 custom-forum-scrollbar bg-black/20 relative"
          >
            {messages.map((msg) => {
              const isSelf = msg.uid === user?.uid;
              const msgIsEvil = (msg.userStats?.stability || 100) <= 50;
              const msgColor = msgIsEvil ? 'text-red-400' : 'text-cyan-400';
              const msgBorder = msgIsEvil ? 'border-red-500' : 'border-cyan-500';
              const msgBg = msgIsEvil ? 'bg-red-500/20' : 'bg-cyan-500/20';

              return (
                <motion.div key={msg.id} initial={{ opacity: 0, x: isSelf ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center mb-1.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    <div 
                        onClick={() => handleInspect(msg)}
                        className={`w-7 h-7 rounded-sm flex items-center justify-center border cursor-pointer hover:scale-110 transition-transform ${msgBorder} ${msgBg} shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                    >
                      {msgIsEvil ? <ShieldAlert size={14} className="text-red-400" /> : <User size={14} className="text-cyan-400" />}
                    </div>
                    <div className={`flex items-center ${isSelf ? 'mr-3' : 'ml-3'}`}>
                        <span onClick={() => handleInspect(msg)} className={`text-[10px] font-black tracking-wider cursor-pointer hover:underline ${isSelf ? 'text-cyan-400' : (msgIsEvil ? 'text-red-400' : 'text-purple-400')}`}>
                            {msg.userName}
                        </span>
                        <span className="text-[7px] ml-2 px-1 border border-current opacity-60">LV.{getLevel(msg.userStats)}</span>
                    </div>
                    <span className="text-[8px] text-gray-700 font-mono ml-3">{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                  </div>

                  <div className={`max-w-[80%] p-4 rounded-sm border transition-all duration-500 ${isSelf ? 'bg-cyan-900/10 border-cyan-500/30 text-cyan-50 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-cyan-400' : 'bg-purple-900/5 border-purple-500/20 text-purple-100 hover:border-purple-400'}`}>
                    {msg.media && (
                      <div className="mb-3 overflow-hidden rounded-sm border border-white/5 bg-black/40 min-w-[240px]">
                        {msg.mediaType === 'IMAGE' ? (
                          <img src={msg.media} alt="Visual Data" className="w-full h-auto max-h-80 object-contain" />
                        ) : (
                          <video src={msg.media} controls className="w-full h-auto max-h-80" />
                        )}
                      </div>
                    )}
                    <p className="text-[12px] leading-relaxed break-words whitespace-pre-wrap font-mono tracking-tight">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* 底部输入框 */}
          <div className="p-6 border-t border-cyan-500/20 bg-black/60 shrink-0">
            {!user ? (
              <button onClick={openAuthModal} className="w-full py-6 border border-dashed border-cyan-500/30 text-cyan-800 hover:text-cyan-400 transition-all flex flex-col items-center justify-center space-y-2 bg-cyan-500/5"><AlertTriangle size={20} className="animate-pulse" /><span className="text-[11px] font-black tracking-[0.3em] uppercase">Identity_Verification_Required</span></button>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
                <div className="flex-1 bg-black/40 border border-cyan-900/50 p-1.5 flex flex-col focus-within:border-cyan-400 transition-all">
                  <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="TRANSMIT_SIGNAL_TO_COMMONS..." className="w-full bg-transparent border-none outline-none p-3 text-cyan-50 text-xs placeholder:text-cyan-900 resize-none h-16 md:h-20 custom-forum-scrollbar" />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-cyan-500/20 text-cyan-700 hover:text-cyan-400 transition-all rounded-sm flex items-center space-x-1"><Paperclip size={16} /><span className="text-[8px] font-bold uppercase">Attach</span></button>
                    <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleFileSelect} />
                    <div className="flex space-x-3 text-[8px] text-cyan-900 font-black uppercase tracking-widest"><span>Buffer: STABLE</span></div>
                  </div>
                </div>
                <button type="submit" disabled={!inputText.trim() && !isUploading} className="w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-20 group"><Send size={24} className="mb-1" /><span className="text-[8px] font-black uppercase tracking-widest">Send</span></button>
              </form>
            )}
          </div>
        </div>
      </HUDFrame>

      {/* 用户资料卡 - Inspect Card */}
      <AnimatePresence>
        {inspectUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
                <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#080808] border-2 border-amber-500/40 p-0 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden">
                    <div className="bg-amber-500/10 p-4 border-b border-amber-500/30 flex justify-between items-center relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        <div className="flex items-center space-x-3">
                            <ShieldCheck className="text-amber-400" size={18} />
                            <span className="text-xs font-black text-amber-100 tracking-widest uppercase">Node_Metadata_Card</span>
                        </div>
                        <button onClick={() => setInspectUser(null)} className="text-amber-900 hover:text-white transition-colors"><X size={20} /></button>
                    </div>

                    <div className="p-6 flex flex-col items-center space-y-6">
                        <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 bg-black flex items-center justify-center relative group">
                            <div className="absolute inset-0 border border-amber-500/40 rounded-full animate-ping opacity-20" />
                            <User size={40} className="text-amber-500/60" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl font-black text-white tracking-widest uppercase mb-1">{inspectUser.userName}</h3>
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-[10px] text-amber-500 font-bold uppercase px-2 py-0.5 border border-amber-500/30 bg-amber-500/5">UID: {inspectUser.userCustomUid || 'ANONYMOUS'}</span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-3">
                            <div className="bg-black/40 border border-amber-900/30 p-3 text-center">
                                <span className="text-[7px] text-amber-700 block mb-1 uppercase font-black">Evolution_Level</span>
                                <div className="text-lg font-black text-amber-200">{getLevel(inspectUser.userStats)}</div>
                            </div>
                            <div className="bg-black/40 border border-amber-900/30 p-3 text-center">
                                <span className="text-[7px] text-amber-700 block mb-1 uppercase font-black">Stability_Rate</span>
                                <div className={`text-lg font-black ${inspectUser.userStats?.stability && inspectUser.userStats.stability < 50 ? 'text-red-500' : 'text-cyan-400'}`}>
                                    {inspectUser.userStats?.stability || 98}%
                                </div>
                            </div>
                        </div>

                        <div className="w-full pt-4 border-t border-white/5 space-y-4">
                            <button 
                                onClick={handleAddFriendFromInspect}
                                className="w-full py-4 bg-amber-500/10 border border-amber-500/50 text-amber-400 font-black tracking-[0.4em] uppercase hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center space-x-3 group"
                            >
                                <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                                <span>Request_Neural_Link</span>
                            </button>
                            <p className="text-[7px] text-amber-900 text-center uppercase tracking-widest">Connect to sync genetic markers and evolution logs.</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-forum-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-forum-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
        .custom-forum-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; border: 1px solid rgba(34, 211, 238, 0.1); }
        .custom-forum-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
      `}</style>
    </div>
  );
};

export default GlobalForum;