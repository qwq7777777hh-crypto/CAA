
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Fingerprint, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playHighTechButton, playMechKey } from '../utils/audio';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ERROR' | 'INFO' | 'SUCCESS', msg: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isAuthModalOpen) return null;

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const generateRandomUid = () => {
    return Math.random().toString(16).slice(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.firebaseDB) return;
    setFeedback(null);

    if (!validateEmail(email)) {
      playMechKey();
      setFeedback({ type: 'ERROR', msg: "INVALID_SIGNAL: Please use a valid real-world Email address." });
      return;
    }

    const emailKey = email.replace(/\./g, ','); 
    setIsScanning(true);

    try {
      const snapshot = await window.firebaseDB.ref(`users/${emailKey}`).once('value');
      const userData = snapshot.val();

      if (mode === 'LOGIN') {
        if (!userData) {
          setTimeout(() => {
            playMechKey();
            setMode('REGISTER');
            setIsScanning(false);
            setFeedback({ 
              type: 'INFO', 
              msg: "IDENTITY_NOT_FOUND: This Node is not in our records. Please complete REGISTRATION." 
            });
          }, 1500);
          return;
        }
        
        if (userData.password !== password) {
          setTimeout(() => {
            setIsScanning(false);
            setFeedback({ type: 'ERROR', msg: "ACCESS_DENIED: Token mismatch for this Node." });
          }, 1500);
          return;
        }

        setTimeout(() => {
          playHighTechButton();
          login(userData);
          setIsScanning(false);
        }, 1500);

      } else {
        if (userData) {
          setTimeout(() => {
            setIsScanning(false);
            setMode('LOGIN');
            setFeedback({ type: 'ERROR', msg: "CONFLICT: Node already registered. Switching to Login." });
          }, 1500);
          return;
        }

        const customUid = generateRandomUid();
        const newUser = {
          uid: 'node_' + Math.random().toString(36).substr(2, 9),
          customUid: customUid,
          email: email,
          password: password, 
          displayName: email.split('@')[0].toUpperCase(),
          themeColor: '#22d3ee',
          stability: 98.4,
          uidChanged: false,
          createdAt: Date.now()
        };

        // 建立双向索引
        await window.firebaseDB.ref(`uid_map/${customUid}`).set(emailKey);
        await window.firebaseDB.ref(`users/${emailKey}`).set(newUser);
        
        setTimeout(() => {
          playHighTechButton();
          login(newUser);
          setIsScanning(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      setFeedback({ type: 'ERROR', msg: "CONNECTION_FAILED: Neural server unreachable." });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md font-mono p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#050505] border border-cyan-500/30 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2)]"
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[length:100%_4px]" />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="text-cyan-400" size={24} />
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase leading-none">Identity_Auth</h2>
              <span className="text-[8px] text-cyan-800 font-bold uppercase tracking-widest">Protocol_v2.0_Global</span>
            </div>
          </div>
          <button onClick={closeAuthModal} className="text-cyan-900 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className={`p-3 border flex items-start space-x-3 overflow-hidden ${
                feedback.type === 'ERROR' ? 'border-red-500/40 bg-red-500/5 text-red-400' : 
                feedback.type === 'INFO' ? 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400' : 
                'border-green-500/40 bg-green-500/5 text-green-400'
              }`}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter">{feedback.type}_SIGNAL</span>
                <p className="text-[9px] font-bold leading-relaxed">{feedback.msg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isScanning ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-24 h-24">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-cyan-500 rounded-full"
              />
              <Fingerprint size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-cyan-400 font-bold tracking-[0.3em] animate-pulse uppercase">Uplink_Sync_Running</p>
              <p className="text-[8px] text-cyan-900 mt-1 uppercase font-black">Connecting to Neural Server...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest">Neural_Address (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-900 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-cyan-900/50 p-3 pl-10 text-cyan-100 focus:border-cyan-400 focus:outline-none transition-all placeholder:text-cyan-900/40"
                  placeholder="USER@DNA_CORE.COM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest">Access_Token</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-900 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input 
                  type="password" 
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-cyan-900/50 p-3 pl-10 text-cyan-100 focus:border-cyan-400 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-black tracking-[0.4em] uppercase hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-[0.98]"
            >
              {mode === 'LOGIN' ? 'Authorize_Login' : 'Initialize_Node'}
            </button>

            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => { playMechKey(); setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setFeedback(null); }}
                className="text-[10px] text-cyan-800 hover:text-cyan-400 uppercase tracking-widest underline decoration-cyan-900 underline-offset-4 transition-colors"
              >
                {mode === 'LOGIN' ? "New Identity? [Access Register]" : "Known Node? [Access Login]"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-cyan-900/30 flex justify-between items-center text-[8px] text-cyan-900 font-bold uppercase tracking-widest">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-1 bg-cyan-500/40 rounded-full" />
            <span>Server: ASIA-SE1</span>
          </div>
          <div className="flex space-x-2">
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
            <span className="text-cyan-700">Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
