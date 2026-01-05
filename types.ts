
export interface GeneEntry {
  id: string;
  timestamp: string;
  originalText: string;
  binaryStream: string;
  visualHash?: string;
  userId?: string;
  mood?: string; // 新增情绪字段
}

export interface ThoughtEntry {
  id: string;
  timestamp: string;
  question: string;
  responseBinary: string;
  userId?: string;
  mood?: string; // 新增情绪字段
}

export enum AppView {
  ENCODING = 'ENCODING',
  DATABASE = 'DATABASE',
  THOUGHT_DB = 'THOUGHT_DB',
  MIXER = 'MIXER',
  SPECTRAL = 'SPECTRAL',
  GENESIS = 'GENESIS',
  GENESIS_LENIA = 'GENESIS_LENIA',
  NEURON_MAPPING = 'NEURON_MAPPING',
  SLIME_LAB = 'SLIME_LAB',
  BIO_QUANTUM = 'BIO_QUANTUM',
  AI_THINKING = 'AI_THINKING',
  PROFILE = 'PROFILE',
  FORUM = 'FORUM',
  PERSONAL_DB = 'PERSONAL_DB'
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  customUid: string;
  uidChanged?: boolean;
  friends?: string[];
  themeColor: string;
  stability: number;
  createdAt: number;
  evolutionInteractions?: number;
}
