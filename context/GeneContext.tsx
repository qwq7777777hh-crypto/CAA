
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeneEntry, ThoughtEntry, AppView } from '../types';

interface GeneContextType {
  entries: GeneEntry[];
  thoughtEntries: ThoughtEntry[];
  addEntry: (text: string, userId?: string) => void;
  addThoughtEntry: (question: string, responseBinary: string, userId?: string) => void;
  currentView: AppView;
  setView: (view: AppView) => void;
  isGlobalPlaying: boolean;
  setIsGlobalPlaying: (playing: boolean) => void;
  selectedGene: GeneEntry | null;
  setSelectedGene: (entry: GeneEntry | null) => void;
  textToBinary: (text: string) => string;
  binaryToText: (binary: string) => string;
}

const GeneContext = createContext<GeneContextType | undefined>(undefined);

declare global {
  interface Window {
    firebaseDB: any;
    firebase: any;
  }
}

const computeVisualHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return '0x' + (hash >>> 0).toString(16).toUpperCase();
};

export const GeneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<GeneEntry[]>([]);
  const [thoughtEntries, setThoughtEntries] = useState<ThoughtEntry[]>([]);
  const [currentView, setView] = useState<AppView>(AppView.ENCODING);
  const [isGlobalPlaying, setIsGlobalPlaying] = useState(false);
  const [selectedGene, setSelectedGene] = useState<GeneEntry | null>(null);

  const textToBinary = (text: string) => {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(text);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += uint8Array[i].toString(2).padStart(8, '0');
    }
    return binary;
  };

  const binaryToText = (binary: string): string => {
    const cleanBinary = binary.replace(/[^01]/g, '');
    if (cleanBinary.length % 8 !== 0) return ""; 
    const byteArray = new Uint8Array(cleanBinary.length / 8);
    for (let i = 0; i < cleanBinary.length; i += 8) {
        const byte = cleanBinary.slice(i, i + 8);
        byteArray[i / 8] = parseInt(byte, 2);
    }
    try {
        const decoder = new TextDecoder();
        return decoder.decode(byteArray);
    } catch (e) {
        return "DECODING_ERROR";
    }
  };

  useEffect(() => {
    if (!window.firebaseDB) return;
    
    const logsRef = window.firebaseDB.ref('genesis_logs');
    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const globalEntries: GeneEntry[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          timestamp: new Date(value.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          originalText: value.text || value.code || "",
          binaryStream: textToBinary(value.text || value.code || ""),
          visualHash: value.visual_hash,
          userId: value.user_id // 确保解析出 UID
        })).reverse();
        setEntries(globalEntries);
      }
    };
    logsRef.limitToLast(1000).on('value', handleData);

    const thoughtsRef = window.firebaseDB.ref('thought_logs');
    const handleThoughtData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const globalThoughts: ThoughtEntry[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          timestamp: new Date(value.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          question: value.question || "",
          responseBinary: value.response_binary || "",
          userId: value.user_id // 新增：解析出 UID
        })).reverse();
        setThoughtEntries(globalThoughts);
      }
    };
    thoughtsRef.limitToLast(500).on('value', handleThoughtData);

    return () => {
      logsRef.off('value', handleData);
      thoughtsRef.off('value', handleThoughtData);
    };
  }, []);

  const addEntry = (text: string, userId?: string) => {
    if (!window.firebaseDB || !window.firebase) return;
    const logsRef = window.firebaseDB.ref('genesis_logs');
    const visualHash = computeVisualHash(text);

    logsRef.push({
      text: text, 
      code: text, 
      timestamp: window.firebase.database.ServerValue.TIMESTAMP,
      user_id: userId || 'anonymous', // 绑定当前用户 UID
      visual_hash: visualHash
    });
  };

  const addThoughtEntry = (question: string, responseBinary: string, userId?: string) => {
    if (!window.firebaseDB || !window.firebase) return;
    const thoughtsRef = window.firebaseDB.ref('thought_logs');
    
    thoughtsRef.push({
      question: question,
      response_binary: responseBinary,
      timestamp: window.firebase.database.ServerValue.TIMESTAMP,
      user_id: userId || 'anonymous' // 绑定当前用户 UID
    });
  };

  return (
    <GeneContext.Provider value={{ 
      entries, 
      thoughtEntries,
      addEntry, 
      addThoughtEntry,
      currentView, 
      setView, 
      isGlobalPlaying, 
      setIsGlobalPlaying,
      selectedGene,
      setSelectedGene,
      textToBinary,
      binaryToText
    }}>
      {children}
    </GeneContext.Provider>
  );
};

export const useGeneData = () => {
  const context = useContext(GeneContext);
  if (!context) throw new Error("useGeneData must be used within a GeneProvider");
  return context;
};
