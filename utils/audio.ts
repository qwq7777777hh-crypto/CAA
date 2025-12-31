
let audioCtx: AudioContext | null = null;

export const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * 神经元音效：专为 AI 思考设计的拨弦合成器
 * @param freq 频率
 * @param type 波形 'sine' | 'triangle' (受肾上腺素控制)
 * @param volume 音量
 */
export const playNeuralNote = (freq: number, type: 'sine' | 'triangle' = 'sine', volume: number = 0.1) => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  // 增加微小的随机失调，使声音更具模拟感
  osc.detune.setValueAtTime((Math.random() - 0.5) * 5, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.15);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
};

/**
 * 专门为「涌现」特效设计的配音引擎
 */
export class SacredEmergenceScore {
  private oscillators: OscillatorNode[] = [];
  private mainGain: GainNode | null = null;
  private climaxGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  async start() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const now = ctx.currentTime;

    this.mainGain = ctx.createGain();
    this.climaxGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();

    this.mainGain.gain.setValueAtTime(0, now);
    this.mainGain.gain.linearRampToValueAtTime(0.25, now + 2);

    this.climaxGain.gain.setValueAtTime(0, now);
    
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(350, now);
    this.filter.Q.setValueAtTime(1.5, now);

    this.mainGain.connect(this.filter);
    this.filter.connect(ctx.destination);
    this.climaxGain.connect(this.filter);

    const freqs = [65.41, 130.81, 196.00, 261.63, 392.00, 523.25]; 
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i < 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now);
      g.gain.setValueAtTime(0.04, now);
      osc.connect(g);
      if (i >= 4) {
        g.connect(this.climaxGain!);
      } else {
        g.connect(this.mainGain!);
      }
      osc.start(now);
      this.oscillators.push(osc);
    });
  }

  triggerClimax() {
    if (!this.mainGain || !this.filter || !this.climaxGain) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    this.filter.frequency.exponentialRampToValueAtTime(3500, now + 1.8);
    this.climaxGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
    this.mainGain.gain.linearRampToValueAtTime(0.4, now + 1.8);
  }

  goCalm() {
    if (!this.mainGain || !this.filter || !this.climaxGain) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    this.climaxGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    this.filter.frequency.exponentialRampToValueAtTime(500, now + 3);
    this.mainGain.gain.linearRampToValueAtTime(0.12, now + 3);
  }

  stop() {
    const ctx = getCtx();
    const now = ctx.currentTime;
    if (this.mainGain) {
      this.mainGain.gain.cancelScheduledValues(now);
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
      this.mainGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    }
    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      this.oscillators = [];
    }, 2100);
  }
}

export class SpectralScannerAudio {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private reverbNode: ConvolverNode;
  private scale: number[];

  constructor() {
    this.ctx = getCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbBuffer();
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.ctx.destination);
    this.masterGain.connect(this.ctx.destination);
    const baseFreq = 65.41;
    const intervals = [0, 3, 5, 7, 10];
    this.scale = [];
    for (let octave = 0; octave < 5; octave++) {
      intervals.forEach(interval => {
        const freq = baseFreq * Math.pow(2, (octave * 12 + interval) / 12);
        this.scale.push(freq);
      });
    }
  }

  private createReverbBuffer() {
    const duration = 2.0;
    const decay = 2.0;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = i / length;
      const val = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      left[i] = val;
      right[i] = val;
    }
    return impulse;
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public playColumn(rows: number[], totalRows: number, isMobile: boolean = false) {
    if (rows.length === 0) return;
    const maxVoices = isMobile ? 6 : 14; 
    let notesToPlay: number[] = [];
    if (isMobile) {
        const BANDS = 8;
        const activeBands = new Set<number>();
        rows.forEach(rowIndex => {
            const invertedIndex = totalRows - 1 - rowIndex;
            const bandIndex = Math.floor((invertedIndex / totalRows) * BANDS);
            activeBands.add(bandIndex);
        });
        const scaleStep = Math.floor(this.scale.length / BANDS);
        const sortedBands = Array.from(activeBands).sort((a,b) => a - b);
        const bandsToPlay = sortedBands.slice(0, maxVoices);
        bandsToPlay.forEach(band => {
             const scaleIndex = Math.floor(band * scaleStep) + Math.floor(scaleStep / 2);
             const safeIndex = Math.max(0, Math.min(this.scale.length - 1, scaleIndex));
             notesToPlay.push(this.scale[safeIndex]);
        });
    } else {
        const activeRowIndices = rows.length > maxVoices 
            ? rows.sort(() => 0.5 - Math.random()).slice(0, maxVoices) 
            : rows;
        activeRowIndices.forEach(rowIndex => {
            const invertedIndex = totalRows - 1 - rowIndex;
            const scaleIndex = Math.floor((invertedIndex / totalRows) * this.scale.length);
            const safeIndex = Math.max(0, Math.min(this.scale.length - 1, scaleIndex));
            notesToPlay.push(this.scale[safeIndex]);
        });
    }
    const now = this.ctx.currentTime;
    notesToPlay.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'triangle'; 
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      const volume = (isMobile ? 0.25 : 0.15) / Math.sqrt(notesToPlay.length || 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    });
  }
}

export const playPianoNote = (freq: number, startTimeOffset: number = 0) => {
  const ctx = getCtx();
  const now = ctx.currentTime + startTimeOffset;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, now);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(0.2, now);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 1.0);
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc1.connect(filter);
  osc2.connect(osc2Gain);
  osc2Gain.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.8);
  osc2.stop(now + 0.8);
};

export const playMechKey = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.05);
};

export const playHighTechButton = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  [440, 880, 1320].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(f, now + i * 0.02);
    g.gain.setValueAtTime(0.1, now + i * 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.02);
    osc.stop(now + 0.1);
  });
};

export const playCatMeow = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.1, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.3);
};

export const playPianoSequence = () => {
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
  notes.forEach((freq, i) => {
    playPianoNote(freq, i * 0.1);
  });
};

export const playSacredInitiation = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const frequencies = [261.63, 329.63, 392, 523.25, 783.99]; 
  frequencies.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.05, now + 0.5 + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.5);
  });
};

export const playAtomHover = () => {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(100, now);
  gain2.gain.setValueAtTime(0.02, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.03);
};

export class SacredMelody {
  private gainNode: GainNode | null = null;
  private timer: number | null = null;
  start() {
    const ctx = getCtx();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);
    this.gainNode.connect(ctx.destination);
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00];
    const playNext = () => {
      const now = ctx.currentTime;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (Math.random() > 0.5 ? 2 : 1), now);
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.05, now + 1.5);
      noteGain.gain.linearRampToValueAtTime(0, now + 4);
      osc.connect(noteGain);
      if (this.gainNode) noteGain.connect(this.gainNode);
      osc.start(now);
      osc.stop(now + 4);
      this.timer = window.setTimeout(playNext, 1500 + Math.random() * 2000);
    };
    playNext();
  }
  stop() {
    if (this.timer) clearTimeout(this.timer);
    if (this.gainNode) {
      const ctx = getCtx();
      this.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    }
  }
}
