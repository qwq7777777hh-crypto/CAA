
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HUDFrame from '../components/HUDFrame';
import { useAuth } from '../context/AuthContext';
import { useGeneData } from '../context/GeneContext';
import { AppView, GeneEntry } from '../types';
import { playMechKey, playHighTechButton } from '../utils/audio';
import { ArrowLeft, Database, ShieldCheck, User, Users, Lock, Unlock, Eye, Send, Check, X, ShieldAlert, ChevronLeft } from 'lucide-react';

const PersonalDatabase: React.FC = () => {
    const { user, requestDbAccess, approveDbAccess, checkDbPermission, searchUserByUid } = useAuth();
    const { entries, setView } = useGeneData();
    
    const [activeTab, setActiveTab] = useState<'OWN' | 'FRIENDS' | 'REQUESTS'>('OWN');
    const [viewingFriendUid, setViewingFriendUid] = useState<string | null>(null);
    const [viewingFriendData, setViewingFriendData] = useState<GeneEntry[]>([]);
    const [friendDbLoading, setFriendDbLoading] = useState(false);

    const [accessRequests, setAccessRequests] = useState<string[]>([]); // 申请者的 UID 列表
    const [friendsInfo, setFriendsInfo] = useState<any[]>([]);

    // 筛选出属于当前用户的条目
    const myEntries = useMemo(() => entries.filter(e => e.userId === user?.uid), [entries, user]);

    // 加载好友基本信息和访问申请
    useEffect(() => {
        if (!user || !window.firebaseDB) return;

        // 1. 加载访问申请
        const reqRef = window.firebaseDB.ref(`db_requests/${user.customUid}`);
        reqRef.on('value', (snap: any) => {
            const data = snap.val();
            if (data) setAccessRequests(Object.keys(data)); else setAccessRequests([]);
        });

        // 2. 加载好友信息
        const fetchFriends = async () => {
            if (!user.friends) return;
            const info = await Promise.all(user.friends.map(async (fuid: string) => {
                const fUser = await searchUserByUid(fuid);
                const hasPerm = await checkDbPermission(fuid, user.customUid);
                return { ...fUser, hasPermission: hasPerm };
            }));
            setFriendsInfo(info.filter(Boolean));
        };
        fetchFriends();

        return () => reqRef.off();
    }, [user, activeTab]);

    const handleViewFriendDb = async (friend: any) => {
        playHighTechButton();
        if (!friend.hasPermission) {
            const res = await requestDbAccess(friend.customUid);
            alert(res.msg);
            return;
        }

        setFriendDbLoading(true);
        setViewingFriendUid(friend.customUid);
        // 通过 Firebase 过滤出好友的 UID
        const friendFullUser = await searchUserByUid(friend.customUid);
        if (friendFullUser) {
            const friendData = entries.filter(e => e.userId === friendFullUser.uid);
            setViewingFriendData(friendData);
        }
        setFriendDbLoading(false);
    };

    const handleApprove = async (requesterUid: string) => {
        playHighTechButton();
        await approveDbAccess(requesterUid);
    };

    return (
        <HUDFrame 
            title={viewingFriendUid ? `REMOTE_ARCHIVE: ${viewingFriendUid}` : "PERSONAL_VAULT [个人数据库]"} 
            subtitle={viewingFriendUid ? "READ_ONLY_ACCESS_ESTABLISHED" : "ENCRYPTED_NODE_STORAGE"}
            className="md:translate-x-12"
        >
            <div className="flex-1 flex flex-col h-full overflow-hidden relative font-mono min-h-0">
                
                {/* 导航条 */}
                <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4 mb-4 shrink-0">
                    <div className="flex items-center space-x-6">
                        {viewingFriendUid ? (
                            <button onClick={() => { playMechKey(); setViewingFriendUid(null); }} className="flex items-center space-x-2 text-emerald-400 hover:text-white transition-all text-[10px] font-black uppercase">
                                <ArrowLeft size={14} /><span>Exit_Remote_Link</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-6">
                                {/* 新增：返回个人主页按钮 */}
                                <button 
                                    onClick={() => { playMechKey(); setView(AppView.PROFILE); }}
                                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-400 transition-colors group mr-2"
                                >
                                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                                </button>
                                <div className="w-px h-4 bg-emerald-900/30" />
                                <button onClick={() => { playMechKey(); setActiveTab('OWN'); }} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OWN' ? 'text-emerald-400 border-b border-emerald-400 pb-1' : 'text-emerald-900 hover:text-emerald-600'}`}>My_Data</button>
                                <button onClick={() => { playMechKey(); setActiveTab('FRIENDS'); }} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'FRIENDS' ? 'text-emerald-400 border-b border-emerald-400 pb-1' : 'text-emerald-900 hover:text-emerald-600'}`}>Friend_Nodes</button>
                                <button onClick={() => { playMechKey(); setActiveTab('REQUESTS'); }} className={`text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'REQUESTS' ? 'text-emerald-400 border-b border-emerald-400 pb-1' : 'text-emerald-900 hover:text-emerald-600'}`}>
                                    Access_Protocol
                                    {accessRequests.length > 0 && <span className="absolute -top-2 -right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                                </button>
                            </div>
                        )}
                    </div>
                    {!viewingFriendUid && (
                        <div className="text-[8px] text-emerald-900 font-bold uppercase flex items-center space-x-2">
                            <Database size={10} /><span>STORAGE_SYNCED: {myEntries.length} NODES</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-emerald-scrollbar pr-2 relative min-h-0">
                    {/* 远程数据查看特效 */}
                    {viewingFriendUid && (
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[length:100%_4px] z-0 animate-pulse" />
                    )}

                    <AnimatePresence mode="wait">
                        {viewingFriendUid ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 relative z-10">
                                {viewingFriendData.length === 0 ? (
                                    <div className="p-12 text-center text-emerald-900 italic uppercase text-[11px] tracking-widest">Target vault is currently void of sequences.</div>
                                ) : (
                                    viewingFriendData.map(entry => (
                                        <div key={entry.id} className="p-4 bg-emerald-500/5 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between group hover:bg-emerald-500/10 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[8px] text-emerald-700 font-bold mb-1 uppercase tracking-tighter">{entry.timestamp} // {entry.visualHash}</div>
                                                <div className="text-sm font-black text-emerald-100 truncate">{entry.originalText}</div>
                                            </div>
                                            <div className="md:w-64 text-[9px] text-emerald-900 font-mono truncate mt-2 md:mt-0 opacity-40 group-hover:opacity-100 transition-opacity">{entry.binaryStream}</div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <>
                                {activeTab === 'OWN' && (
                                    <div className="space-y-2">
                                        {myEntries.length === 0 ? (
                                            <div className="p-12 text-center text-emerald-900 italic uppercase text-[11px] tracking-widest">Your local archive is empty. Begin encoding to populate.</div>
                                        ) : (
                                            myEntries.map(entry => (
                                                <div key={entry.id} className="p-4 bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[8px] text-emerald-800 font-bold mb-1 uppercase tracking-tighter">TIMESTAMP_ID: {entry.id.substring(0,12)}</div>
                                                        <div className="text-sm font-black text-white">{entry.originalText}</div>
                                                    </div>
                                                    <div className="md:w-80 h-1 bg-emerald-900/20 overflow-hidden relative mt-3 md:mt-0 md:ml-4">
                                                        <div className="absolute inset-0 bg-emerald-500 opacity-30 shadow-[0_0_10px_#10b981]" style={{ width: `${(entry.originalText.length / 100) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'FRIENDS' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {friendsInfo.length === 0 ? (
                                            <div className="col-span-2 p-12 text-center text-emerald-900 italic uppercase text-[11px] tracking-widest">No neural connections detected. Establish links in the Commons.</div>
                                        ) : (
                                            friendsInfo.map(friend => (
                                                <div key={friend.customUid} className="p-5 bg-black/40 border border-emerald-500/10 flex items-center justify-between hover:border-emerald-500/40 transition-all">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500/40 bg-black"><User size={24} /></div>
                                                        <div>
                                                            <div className="text-xs font-black text-white tracking-widest uppercase">{friend.displayName}</div>
                                                            <div className="text-[8px] text-emerald-900 font-bold">UID: {friend.customUid}</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleViewFriendDb(friend)}
                                                        className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 border
                                                            ${friend.hasPermission 
                                                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black' 
                                                                : 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black'}`}
                                                    >
                                                        {friend.hasPermission ? <><Unlock size={10} /><span>Access_Database</span></> : <><Lock size={10} /><span>Request_Access</span></>}
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === 'REQUESTS' && (
                                    <div className="space-y-4">
                                        {accessRequests.length === 0 ? (
                                            <div className="p-12 text-center text-emerald-900 italic uppercase text-[11px] tracking-widest">No pending access requests. System fully isolated.</div>
                                        ) : (
                                            accessRequests.map(ruid => (
                                                <div key={ruid} className="p-6 bg-orange-500/5 border border-orange-500/20 flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <ShieldAlert size={20} className="text-orange-500 animate-pulse" />
                                                        <div>
                                                            <div className="text-xs font-black text-white tracking-widest uppercase">Node_Protocol_Alert</div>
                                                            <div className="text-[9px] text-orange-900 font-bold uppercase mt-1">Requester UID: <span className="text-orange-400">{ruid}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => handleApprove(ruid)} className="flex items-center space-x-2 px-5 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all text-[9px] font-black uppercase"><Check size={12} /><span>Authorize</span></button>
                                                        <button className="flex items-center space-x-2 px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-500/60 hover:text-red-500 transition-all text-[9px] font-black uppercase"><X size={12} /><span>Ignore</span></button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* 底部控制 */}
                <div className="mt-4 pt-4 border-t border-emerald-900/30 flex justify-between items-center shrink-0">
                    <button onClick={() => { playMechKey(); setView(AppView.PROFILE); }} className="flex items-center space-x-2 text-emerald-800 hover:text-emerald-400 transition-colors uppercase text-[9px] font-bold tracking-widest">
                        <ArrowLeft size={12} /><span>Return_to_Identity_Core</span>
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" /> <span className="text-[8px] text-emerald-900 font-black uppercase">Archive_Secured</span></div>
                    </div>
                </div>
            </div>
            <style>{`
                .custom-emerald-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-emerald-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-emerald-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); }
            `}</style>
        </HUDFrame>
    );
};

export default PersonalDatabase;
