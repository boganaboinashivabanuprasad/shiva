// Web Audio API Synthesizer for Authentic Indian Temple Chimes, Om Resonance, and Blessings
import { ScreenTimeCategory, DashboardSettings } from '../types';

class TempleSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAudioUnlocked: boolean = false;
  private activeCustomAudioElement: HTMLAudioElement | null = null;

  private activeVoiceDroneNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

  constructor() {
    // Auto-unlock audio on the first user interaction
    if (typeof window !== 'undefined') {
      const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown'];
      const unlockHandler = () => {
        this.unlockAudio();
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockHandler));
      };
      unlockEvents.forEach((evt) => window.addEventListener(evt, unlockHandler, { passive: true }));

      // Preload speech synthesis voices
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  /**
   * Unlock Web Audio Context safely on user gesture (bypasses browser autoplay restrictions)
   */
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isAudioUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;
    
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Authentic Temple Brass Bell Sound with rich bell harmonics (fundamental + hum + prime + tierce + quint + nominal)
   */
  public playTempleBell(pitchMultiplier = 1.0) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseFreq = 587.33 * pitchMultiplier; // D5 pitch

      // Temple bell harmonic ratios (traditional bell acoustics)
      const harmonics = [
        { ratio: 0.5, gain: 0.25, decay: 3.5 },   // Hum tone
        { ratio: 1.0, gain: 0.6, decay: 2.8 },    // Prime
        { ratio: 1.19, gain: 0.4, decay: 2.2 },   // Minor third (Tierce)
        { ratio: 1.56, gain: 0.35, decay: 1.8 },  // Fifth (Quint)
        { ratio: 2.0, gain: 0.5, decay: 2.0 },    // Octave (Nominal)
        { ratio: 2.76, gain: 0.2, decay: 1.2 },   // Superquint
        { ratio: 3.0, gain: 0.15, decay: 0.9 },   // Decima
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.connect(ctx.destination);

      harmonics.forEach(({ ratio, gain, decay }) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * ratio, now);

        // Strike impulse envelope
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(gain, now + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Sacred Om (ॐ) vibration sound - Cosmic 136.1 Hz frequency with rich warmth and slow binaural beat
   */
  public playOmChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const omFreq = 136.1; // Earth cosmic frequency / Sacred Om

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.4, now + 0.8);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      masterGain.connect(ctx.destination);

      // Warm Tanpura Drone Frequencies
      [omFreq, omFreq * 1.5, omFreq * 2, omFreq * 3, omFreq * 4].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Micro vibrato for realistic devotional drone
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(4.5, now);
        lfoGain.gain.setValueAtTime(1.2, now);
        lfo.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 4.5);

        oscGain.gain.setValueAtTime(0.3 / (idx + 1), now);
        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 4.5);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Divine Blessing harp glissando when healthy usage is confirmed
   */
  public playBlessingArpeggio() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Raga Kalyani notes (C D E F# G A B C)
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];

      freqs.forEach((freq, i) => {
        const noteTime = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 1.3);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Warning gentle awakening chime for warning category
   */
  public playWarningChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [440, 392, 349.23]; // Descending mindful tones

      freqs.forEach((freq, i) => {
        const noteTime = now + i * 0.2;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.9);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * High Risk Alert chime
   */
  public playHighRiskAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [330, 311.13, 293.66];

      freqs.forEach((freq, i) => {
        const noteTime = now + i * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        // Softened filter to prevent harsh ear fatigue
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.8);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Quick click / shutter audio feedback
   */
  public playScanBeep() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  private activeAudioSource: AudioBufferSourceNode | null = null;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private pendingVoiceFetches: Map<string, Promise<AudioBuffer | null>> = new Map();
  private hasPrewarmed = false;

  /**
   * Pre-warm all 3 canonical category voices on app start so audio is always instant & consistent
   */
  public prewarmAllVoices() {
    if (this.hasPrewarmed) return;
    this.hasPrewarmed = true;
    const categories: Array<'HEALTHY' | 'WARNING' | 'HIGH_RISK'> = ['HEALTHY', 'WARNING', 'HIGH_RISK'];
    categories.forEach((cat) => {
      this.prefetchDivineVoice(cat).catch(() => {});
    });
  }

  /**
   * Convert base64 PCM 24000Hz 16-bit to AudioBuffer
   */
  private decodePcmToBuffer(base64Pcm: string, sampleRate = 24000): AudioBuffer | null {
    try {
      const binaryString = window.atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const ctx = this.getContext();
      if (!ctx) return null;
      const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      return audioBuffer;
    } catch (err) {
      console.warn('Error decoding PCM audio buffer:', err);
      return null;
    }
  }

  /**
   * Convert screen time strings into fluent, grammatically accurate English words
   * for natural speech synthesis
   */
  public formatTimeToTeluguWords(timeStr?: string): string {
    if (!timeStr) return 'Balanced screen time';

    const hourMatch = timeStr.match(/(\d+)\s*(?:h|hr|hrs|hours)/i);
    const minMatch = timeStr.match(/(\d+)\s*(?:m|min|mins|minutes)/i);
    const colonMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);

    let hours = 0;
    let minutes = 0;

    if (colonMatch) {
      hours = parseInt(colonMatch[1], 10);
      minutes = parseInt(colonMatch[2], 10);
    } else {
      if (hourMatch) hours = parseInt(hourMatch[1], 10);
      if (minMatch) minutes = parseInt(minMatch[1], 10);
    }

    if (!hourMatch && !minMatch && !colonMatch) {
      const rawNum = parseInt(timeStr.replace(/\D/g, ''), 10);
      if (!isNaN(rawNum) && rawNum > 0) {
        if (rawNum > 12) {
          hours = Math.floor(rawNum / 60);
          minutes = rawNum % 60;
        } else {
          hours = rawNum;
        }
      }
    }

    const parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }

    return parts.length > 0 ? parts.join(' ') : 'Balanced screen time';
  }

  public getSpeechText(category: ScreenTimeCategory | string, _screenTimeString?: string): string {
    if (category === '0_TO_3_HOURS' || category === '1_TO_3_DAYS' || category === 'HEALTHY') {
      return `Om Gam Ganapataye Namaha. Vakratunda Mahakaya Suryakoti Samaprabha. Nirvighnam Kuru Me Deva Sarva Karyeshu Sarvada. Healthy balance achieved. May wisdom guide your day.`;
    } else if (category === '3_TO_5_HOURS' || category === '3_TO_5_DAYS') {
      return `Om Shri Ganeshaya Namaha. Ekadantam Mahakayam Taptakanchana Sannibham. Lambodaram Vishalaksham Vandeham Gananayakam. Moderate screen usage observed. Rest your eyes and renew your spirit.`;
    } else if (category === '5_PLUS_HOURS' || category === 'HIGH_RISK' || category === '7_PLUS_DAYS') {
      return `Om Vighnarajaya Namaha. Vidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam. Putrarthi Labhate Putran Moksharthi Labhate Gatim. Excessive screen time detected. Step away from devices and embrace real life.`;
    } else {
      return `Om Gajananaaya Namaha. Agajanana Padmarkam Gajananam Aharnisham. Anekadam Tam Bhaktanam Ekadantam Upasmahe. Seek balance, mindfulness, and inner peace.`;
    }
  }

  /**
   * Background drone removed as requested for crystal-clear voice output
   */
  private startDivineOmDrone() {
    // Drone disabled while speaking
  }

  private stopDivineOmDrone() {
    if (this.activeVoiceDroneNodes) {
      try {
        const { osc1, osc2 } = this.activeVoiceDroneNodes;
        osc1.stop();
        osc2.stop();
      } catch {
        // Ignore
      }
      this.activeVoiceDroneNodes = null;
    }
  }

  /**
   * Universal audio buffer decoder supporting both base64 MP3/WAV streams and raw PCM
   */
  public async decodeAudioResponse(data: { audioBase64: string; mimeType?: string; sampleRate?: number }): Promise<AudioBuffer | null> {
    const ctx = this.getContext();
    if (!ctx || !data.audioBase64) return null;

    try {
      const mime = data.mimeType || '';
      if (mime.includes('audio/mpeg') || mime.includes('audio/mp3') || mime.includes('audio/wav') || !mime.includes('pcm')) {
        const binaryStr = window.atob(data.audioBase64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return await ctx.decodeAudioData(bytes.buffer.slice(0));
      } else {
        return this.decodePcmToBuffer(data.audioBase64, data.sampleRate || 24000);
      }
    } catch {
      return this.decodePcmToBuffer(data.audioBase64, data.sampleRate || 24000);
    }
  }

  /**
   * Proactively prefetch divine voice audio buffer ahead of time
   */
  public async prefetchDivineVoice(category: ScreenTimeCategory | string, screenTimeString?: string): Promise<AudioBuffer | null> {
    const text = this.getSpeechText(category, screenTimeString);
    const cacheKey = `${category}_${text}`;
    const categoryKey = `CAT_${category}`;

    if (this.audioBufferCache.has(cacheKey)) {
      return this.audioBufferCache.get(cacheKey)!;
    }

    if (this.audioBufferCache.has(categoryKey)) {
      return this.audioBufferCache.get(categoryKey)!;
    }

    if (this.pendingVoiceFetches.has(cacheKey)) {
      return this.pendingVoiceFetches.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/voice/ganesha-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, category }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.audioBase64) {
            const buffer = await this.decodeAudioResponse(data);
            if (buffer) {
              this.audioBufferCache.set(cacheKey, buffer);
              this.audioBufferCache.set(categoryKey, buffer);
              return buffer;
            }
          }
        }

        // If fetch didn't return audio, check if category buffer already cached
        if (this.audioBufferCache.has(categoryKey)) {
          const catBuffer = this.audioBufferCache.get(categoryKey)!;
          this.audioBufferCache.set(cacheKey, catBuffer);
          return catBuffer;
        }

        return null;
      } catch {
        if (this.audioBufferCache.has(categoryKey)) {
          return this.audioBufferCache.get(categoryKey)!;
        }
        return null;
      } finally {
        this.pendingVoiceFetches.delete(cacheKey);
      }
    })();

    this.pendingVoiceFetches.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Generate Authentic Divine Deep Voice (Lord Ganesha Divine Voice)
   * Guaranteed to use authentic vocal processing every single time
   */
  public async speakDivineGodVoice(
    category: ScreenTimeCategory | string,
    screenTimeString?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stopSpeech();

    const speechText = this.getSpeechText(category, screenTimeString);
    const cacheKey = `${category}_${speechText}`;
    const categoryKey = `CAT_${category}`;

    // Play clear temple bell chime
    if (!this.isMuted) {
      this.playTempleBell(category === 'HEALTHY' ? 1.2 : 0.9);
    }

    // Try pre-cached buffer first for 0ms instant playback
    let buffer = this.audioBufferCache.get(cacheKey) || this.audioBufferCache.get(categoryKey) || null;

    if (!buffer) {
      buffer = await this.prefetchDivineVoice(category, screenTimeString);
    }

    if (!buffer && this.audioBufferCache.has(categoryKey)) {
      buffer = this.audioBufferCache.get(categoryKey)!;
    }

    if (buffer) {
      const ctx = this.getContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        this.startDivineOmDrone();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        // Sweet, natural speaking rate (1.0x) - clear, pleasant and authentic
        source.playbackRate.value = 1.0;

        // 1. Subtle, Gentle Bass (Low-Shelf at 180Hz) - Smooth warmth without wild boominess
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 180;
        bass.gain.value = 2.5;

        // 2. Sweet Male Vocal Warmth (Peaking at 650Hz) - Soft, pleasant and affectionate
        const warmth = ctx.createBiquadFilter();
        warmth.type = 'peaking';
        warmth.frequency.value = 650;
        warmth.Q.value = 0.9;
        warmth.gain.value = 2.0;

        // 3. Silky Clear Telugu Articulation (Peaking at 3000Hz)
        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 3000;
        presence.Q.value = 1.0;
        presence.gain.value = 1.5;

        // 4. Smooth Temple Air Filter (Low-pass)
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 9000;

        // 5. Pleasant, balanced listening volume (1.05x)
        const gain = ctx.createGain();
        gain.gain.value = this.isMuted ? 0 : 1.05;

        // Chain audio DSP for sweet, affectionate divine presence
        source.connect(bass);
        bass.connect(warmth);
        warmth.connect(presence);
        presence.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(ctx.destination);

        this.activeAudioSource = source;

        if (onStart) onStart();

        source.onended = () => {
          this.stopDivineOmDrone();
          this.activeAudioSource = null;
          if (onEnd) onEnd();
        };

        source.start(0);
        return true;
      }
    }

    // Reliable Fallback: Deep Male Voice synthesized with Sacred Om resonance
    return this.speakBrowserTeluguUtterance(speechText, onStart, onEnd);
  }

  /**
   * Browser Web Speech API fallback with GUARANTEED Deep Voice
   */
  public speakBrowserTeluguUtterance(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      this.stopDivineOmDrone();

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();

      // Explicitly reject female voices and seek genuine male voices
      const femaleKeywords = [
        'female', 'zira', 'heera', 'swara', 'geeta', 'kalpana', 'sita', 'veena',
        'ananya', 'woman', 'girl', 'priya', 'neerja', 'harita', 'chitra', 'vani',
        'kavya', 'madhur', 'shruti', 'sunita', 'sapna'
      ];
      const maleKeywords = [
        'male', 'man', 'mohan', 'ravi', 'pradeep', 'hemant', 'guy', 'david',
        'mark', 'george', 'james', 'valluvar', 'madhav', 'google', 'indian', 'narayan', 'shankar'
      ];

      const isFemaleVoice = (name: string) => femaleKeywords.some((k) => name.toLowerCase().includes(k));
      const isMaleVoice = (name: string) => maleKeywords.some((k) => name.toLowerCase().includes(k)) && !isFemaleVoice(name);

      // 1. Genuine Male Telugu Voice (te-IN) - strictly not female
      const maleTeluguVoice = voices.find(
        (v) => (v.lang.toLowerCase().startsWith('te') || v.name.toLowerCase().includes('telugu')) && isMaleVoice(v.name)
      );

      // 2. Genuine Male Indian Voice (Hindi / Marathi / Indian English / Sanskrit)
      const maleIndianVoice = voices.find(
        (v) => (v.lang.includes('IN') || v.lang.startsWith('hi') || v.lang.startsWith('mr') || v.name.toLowerCase().includes('india')) &&
               !isFemaleVoice(v.name)
      );

      // 3. Any Genuine Male Voice (David, Mark, Guy, Google Male, etc.)
      const anyMaleVoice = voices.find((v) => isMaleVoice(v.name));

      // 4. Any Non-Female Voice
      const anyNonFemaleVoice = voices.find((v) => !isFemaleVoice(v.name));

      let selectedVoice: SpeechSynthesisVoice | null = null;
      let textToSpeak = text;

      if (maleTeluguVoice) {
        selectedVoice = maleTeluguVoice;
        utterance.voice = maleTeluguVoice;
        utterance.lang = 'te-IN';
      } else if (maleIndianVoice) {
        selectedVoice = maleIndianVoice;
        utterance.voice = maleIndianVoice;
        utterance.lang = maleIndianVoice.lang;
      } else if (anyMaleVoice) {
        selectedVoice = anyMaleVoice;
        utterance.voice = anyMaleVoice;
        utterance.lang = anyMaleVoice.lang;
      } else if (anyNonFemaleVoice) {
        selectedVoice = anyNonFemaleVoice;
        utterance.voice = anyNonFemaleVoice;
        utterance.lang = anyNonFemaleVoice.lang;
      } else {
        utterance.lang = 'te-IN';
      }

      utterance.text = textToSpeak;

      // SWEET, WARM MALE GOD VOICE ACOUSTIC PARAMETERS:
      utterance.pitch = 0.92; 
      utterance.rate = 0.95;
      utterance.volume = this.isMuted ? 0 : 1.0;

      utterance.onstart = () => {
        this.startDivineOmDrone();
        if (onStart) onStart();
      };

      const handleSpeechEnd = () => {
        this.stopDivineOmDrone();
        if (onEnd) onEnd();
      };

      utterance.onend = handleSpeechEnd;
      utterance.onerror = handleSpeechEnd;

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      this.stopDivineOmDrone();
      if (onEnd) onEnd();
      return false;
    }
  }

  /**
   * Stop any playing speech synthesis, audio buffer, custom audio, or divine drone
   */
  public stopSpeech() {
    this.stopDivineOmDrone();
    if (this.activeCustomAudioElement) {
      try {
        this.activeCustomAudioElement.pause();
        this.activeCustomAudioElement.currentTime = 0;
      } catch {
        // Ignore
      }
      this.activeCustomAudioElement = null;
    }
    if (this.activeAudioSource) {
      try {
        this.activeAudioSource.stop();
      } catch {
        // Ignore
      }
      this.activeAudioSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Play the Screen Scan Guidance Voice (either custom uploaded audio file/URL or Lord Ganesha Divine Voice)
   */
  public async playScanGuidanceVoice(
    settings?: DashboardSettings,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stopSpeech();

    if (this.isMuted || (settings && settings.voiceGuidanceEnabled === false)) {
      if (onEnd) onEnd();
      return false;
    }

    // 1. If Custom Audio file or URL is configured
    if (
      settings &&
      settings.voiceGuidanceType === 'custom_audio' &&
      settings.voiceGuidanceCustomAudioUrl &&
      settings.voiceGuidanceCustomAudioUrl.trim() !== ''
    ) {
      try {
        const audio = new Audio(settings.voiceGuidanceCustomAudioUrl);
        this.activeCustomAudioElement = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        const handleAudioEnd = () => {
          this.activeCustomAudioElement = null;
          if (onEnd) onEnd();
        };

        audio.onended = handleAudioEnd;
        audio.onerror = () => {
          this.activeCustomAudioElement = null;
          // Fallback to divine speech if custom audio URL fails
          const fallbackText =
            settings.voiceGuidanceCustomText ||
            'Om Shri Ganeshaya Namaha. Please position your screen time display in front of the camera and press the Scan button.';
          this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
        };

        await audio.play();
        return true;
      } catch {
        // Audio playback fallback
        const fallbackText =
          settings?.voiceGuidanceCustomText ||
          'Om Shri Ganeshaya Namaha. Please position your screen time display in front of the camera and press the Scan button.';
        return this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
      }
    }

    // 2. Default Divine Ganesha Guidance Voice
    const guidanceText =
      settings?.voiceGuidanceCustomText ||
      'Om Shri Ganeshaya Namaha. Please position your screen time display in front of the camera and press the Scan button. I will assess your digital balance.';

    // Ring temple bell first
    this.playTempleBell(1.1);

    // Try backend AI divine voice or fallback to sweet browser utterance
    try {
      const response = await fetch('/api/voice/ganesha-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: guidanceText, category: 'HEALTHY' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.audioBase64) {
          const buffer = await this.decodeAudioResponse(data);
          if (buffer) {
            const ctx = this.getContext();
            if (ctx) {
              if (ctx.state === 'suspended') {
                await ctx.resume();
              }
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.playbackRate.value = 1.0;

              const gain = ctx.createGain();
              gain.gain.value = this.isMuted ? 0 : 1.05;
              source.connect(gain);
              gain.connect(ctx.destination);

              this.activeAudioSource = source;
              if (onStart) onStart();

              source.onended = () => {
                this.activeAudioSource = null;
                if (onEnd) onEnd();
              };

              source.start(0);
              return true;
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    return this.speakBrowserTeluguUtterance(guidanceText, onStart, onEnd);
  }

  /**
   * Play dedicated door opening bells & arpeggio
   */
  public playDoorOpenSound() {
    this.playTempleBell(1.2);
    setTimeout(() => {
      this.playBlessingArpeggio();
    }, 150);
  }

  /**
   * Play dedicated door closing chime
   */
  public playDoorCloseSound() {
    this.playTempleBell(0.85);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 1.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch {
      // Ignore
    }
  }

  /**
   * Play custom or dedicated audio for Manual Door Open / Darshanam
   */
  public playManualDoorAudio(
    audioUrl?: string,
    onEnded?: () => void
  ): HTMLAudioElement | null {
    this.stopSpeech();

    if (!audioUrl) {
      // Play divine blessing arpeggio & temple bell as default
      this.playDoorOpenSound();
      return null;
    }

    try {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      audio.volume = this.isMuted ? 0 : 1.0;
      this.activeCustomAudioElement = audio;

      audio.onended = () => {
        if (this.activeCustomAudioElement === audio) {
          this.activeCustomAudioElement = null;
        }
        if (onEnded) onEnded();
      };

      audio.onerror = () => {
        if (this.activeCustomAudioElement === audio) {
          this.activeCustomAudioElement = null;
        }
        this.playDoorOpenSound();
      };

      audio.play().catch(() => {
        this.playDoorOpenSound();
      });

      return audio;
    } catch {
      this.playDoorOpenSound();
      return null;
    }
  }

  /**
   * Play God's Voice for 5+ Hours Overuse asking the devotee for a sacred promise
   * Uses custom uploaded audio if available, or falls back to divine male god speech
   */
  public playGodPromiseVoice(
    settings?: DashboardSettings,
    onStart?: () => void,
    onEnd?: () => void
  ): HTMLAudioElement | null {
    this.stopSpeech();

    if (this.isMuted) {
      if (onEnd) onEnd();
      return null;
    }

    // 1. If custom God voice audio URL was uploaded by admin/user in settings
    if (settings?.promiseVoiceAudioUrl && settings.promiseVoiceAudioUrl.trim() !== '') {
      try {
        const audio = new Audio(settings.promiseVoiceAudioUrl);
        audio.crossOrigin = 'anonymous';
        audio.volume = this.isMuted ? 0 : 1.0;
        this.activeCustomAudioElement = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        const handleAudioEnd = () => {
          if (this.activeCustomAudioElement === audio) {
            this.activeCustomAudioElement = null;
          }
          if (onEnd) onEnd();
        };

        audio.onended = handleAudioEnd;
        audio.onerror = () => {
          if (this.activeCustomAudioElement === audio) {
            this.activeCustomAudioElement = null;
          }
          // Fallback to divine speech if audio URL errors
          const fallbackText =
            settings?.promiseCustomText ||
            'My child, your screen time exceeds 5 hours today. Please promise Lord Ganesha that you will look at your phone less and protect your wellbeing. Speak your sacred promise now.';
          this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
        };

        audio.play().catch(() => {
          const fallbackText =
            settings?.promiseCustomText ||
            'My child, your screen time exceeds 5 hours today. Please promise Lord Ganesha that you will look at your phone less and protect your wellbeing. Speak your sacred promise now.';
          this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
        });

        return audio;
      } catch {
        // Fall through to divine synthesis
      }
    }

    // 2. Default divine god voice speech using neural Edge TTS / Gemini
    this.playTempleBell(1.0);
    const speechText =
      settings?.promiseCustomText ||
      'ఓం శ్రీ గణేశాయ నమః. నాయనా, ఈరోజు నీ మొబైల్ స్క్రీన్ సమయం 5 గంటలు దాటిపోయింది. నీ నేత్రాలు మరియు ఆరోగ్యం కోసం గణపతికి ఒక పవిత్రమైన ప్రమాణం చేయి: నేను ఫోన్ తక్కువ చూస్తాను అని చెప్పు.';

    (async () => {
      try {
        const response = await fetch('/api/voice/ganesha-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: speechText, category: 'PROMISE_REQUEST' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.audioBase64) {
            const buffer = await this.decodeAudioResponse(data);
            if (buffer) {
              const ctx = this.getContext();
              if (ctx) {
                if (ctx.state === 'suspended') {
                  await ctx.resume();
                }
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = 1.0;

                const bass = ctx.createBiquadFilter();
                bass.type = 'lowshelf';
                bass.frequency.value = 180;
                bass.gain.value = 2.5;

                const warmth = ctx.createBiquadFilter();
                warmth.type = 'peaking';
                warmth.frequency.value = 650;
                warmth.Q.value = 0.9;
                warmth.gain.value = 2.0;

                const gain = ctx.createGain();
                gain.gain.value = this.isMuted ? 0 : 1.1;

                source.connect(bass);
                bass.connect(warmth);
                warmth.connect(gain);
                gain.connect(ctx.destination);

                this.activeAudioSource = source;
                if (onStart) onStart();

                source.onended = () => {
                  this.activeAudioSource = null;
                  if (onEnd) onEnd();
                };

                source.start(0);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('God promise neural voice fetch error, falling back to speech synthesis:', err);
      }

      // Offline or network fallback
      this.speakBrowserTeluguUtterance(speechText, onStart, onEnd);
    })();

    return null;
  }

  /**
   * Play blessing when devotee's sacred voice promise is accepted
   */
  public playPromiseAcceptedBlessing(onEnd?: () => void) {
    this.stopSpeech();
    this.playTempleBell(1.25);
    setTimeout(() => {
      this.playBlessingArpeggio();
    }, 200);

    const blessingText =
      'ధన్యుడవు నాయనా! నీ పవిత్ర ప్రమాణాన్ని గణపతి స్వీకరించారు. ఆలయ ద్వారాలు తెరుచుకుంటున్నాయి.';

    (async () => {
      try {
        const response = await fetch('/api/voice/ganesha-speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: blessingText, category: 'PROMISE_BLESSING' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.audioBase64) {
            const buffer = await this.decodeAudioResponse(data);
            if (buffer) {
              const ctx = this.getContext();
              if (ctx) {
                if (ctx.state === 'suspended') {
                  await ctx.resume();
                }
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = 1.0;

                const gain = ctx.createGain();
                gain.gain.value = this.isMuted ? 0 : 1.1;
                source.connect(gain);
                gain.connect(ctx.destination);

                this.activeAudioSource = source;
                source.onended = () => {
                  this.activeAudioSource = null;
                  if (onEnd) onEnd();
                };
                source.start(0);
                return;
              }
            }
          }
        }
      } catch {
        // Ignore and fall back
      }

      this.speakBrowserTeluguUtterance(blessingText, undefined, onEnd);
    })();
  }

  /**
   * Check if any custom audio or synthesized voice is currently active
   */
  public isVoiceActive(): boolean {
    if (this.activeCustomAudioElement && !this.activeCustomAudioElement.paused) {
      return true;
    }
    if (this.activeAudioSource) {
      return true;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      return true;
    }
    return false;
  }

  /**
   * Play Age Selection Screen Navigation Voice
   * Uses custom uploaded audio file from settings if available, or falls back to synthesized divine voice navigation.
   */
  public playAgeNavVoice(
    settings?: DashboardSettings,
    onStart?: () => void,
    onEnd?: () => void
  ): HTMLAudioElement | null {
    this.stopSpeech();

    // Age screen voice is disabled
    if (!settings?.ageNavVoiceEnabled) {
      if (onEnd) onEnd();
      return null;
    }

    if (this.isMuted) {
      if (onEnd) onEnd();
      return null;
    }

    // 1. If custom navigation audio file was uploaded in settings
    if (settings?.ageNavVoiceAudioUrl && settings.ageNavVoiceAudioUrl.trim() !== '') {
      try {
        const audio = new Audio(settings.ageNavVoiceAudioUrl);
        audio.crossOrigin = 'anonymous';
        audio.volume = this.isMuted ? 0 : 1.0;
        this.activeCustomAudioElement = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        const handleAudioEnd = () => {
          if (this.activeCustomAudioElement === audio) {
            this.activeCustomAudioElement = null;
          }
          if (onEnd) onEnd();
        };

        audio.onended = handleAudioEnd;
        audio.onerror = () => {
          if (this.activeCustomAudioElement === audio) {
            this.activeCustomAudioElement = null;
          }
          // Fallback to divine speech if audio URL has loading errors
          const fallbackText =
            settings?.ageNavVoiceCustomText ||
            'Om Shri Ganeshaya Namaha. Please select your age group: Children ages 0 to 12, Teens and Youth ages 13 to 21, or Adults ages 21 and above, to begin your sacred digital wellbeing darshanam.';
          this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
        };

        audio.play().catch(() => {
          const fallbackText =
            settings?.ageNavVoiceCustomText ||
            'Om Shri Ganeshaya Namaha. Please select your age group: Children ages 0 to 12, Teens and Youth ages 13 to 21, or Adults ages 21 and above, to begin your sacred digital wellbeing darshanam.';
          this.speakBrowserTeluguUtterance(fallbackText, onStart, onEnd);
        });

        return audio;
      } catch {
        // Fall through to divine synthesis
      }
    }

    // 2. Default divine god navigation speech
    this.playTempleBell(1.0);
    const speechText =
      settings?.ageNavVoiceCustomText ||
      'Om Shri Ganeshaya Namaha. Please select your age group: Children ages 0 to 12, Teens and Youth ages 13 to 21, or Adults ages 21 and above, to begin your sacred digital wellbeing darshanam.';

    this.speakBrowserTeluguUtterance(speechText, onStart, onEnd);
    return null;
  }
}

export const soundService = new TempleSoundSynthesizer();
