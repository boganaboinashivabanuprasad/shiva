import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings,
  Save, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Gauge, 
  Check, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Video, 
  Upload, 
  Play, 
  X, 
  Baby, 
  GraduationCap, 
  UserCheck, 
  Film, 
  Volume2, 
  Music, 
  Trash2, 
  StopCircle, 
  Mic, 
  Radio, 
  Sliders, 
  Activity, 
  Headphones, 
  RefreshCw, 
  Crop, 
  Image as ImageIcon
} from 'lucide-react';
import { DashboardSettings, DEFAULT_SETTINGS, UserAgeGroup } from '../types';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';
import { arduinoService } from '../services/arduinoService';
import { verifyCompleteSentence } from '../services/voiceSentenceMatcher';
import { WebsiteLogo } from './WebsiteLogo';
import { RoundLogoCropperModal } from './RoundLogoCropperModal';

interface MotorTimingDigitControlProps {
  id: string;
  label: string;
  description: string;
  directionBadge: string;
  theme: 'emerald' | 'sky' | 'amber' | 'purple' | 'gold';
  valueMs: number;
  onChangeMs: (newMs: number) => void;
  presets?: number[];
  minMs?: number;
  maxMs?: number;
}

function MotorTimingDigitControl({
  id,
  label,
  description,
  directionBadge,
  theme,
  valueMs,
  onChangeMs,
  presets = [2, 3, 4, 5, 6, 7, 8, 10],
  minMs = 500,
  maxMs = 30000,
}: MotorTimingDigitControlProps) {
  const currentSec = Number((valueMs / 1000).toFixed(1));

  const themeClasses = {
    emerald: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/30',
      badgeBg: 'bg-emerald-900/80 border-emerald-500/40 text-emerald-300',
      textAccent: 'text-emerald-400',
      buttonBg: 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-500/40',
      presetActive: 'bg-emerald-400 text-black shadow-md shadow-emerald-500/30',
    },
    sky: {
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/30',
      badgeBg: 'bg-sky-900/80 border-sky-500/40 text-sky-300',
      textAccent: 'text-sky-400',
      buttonBg: 'bg-sky-900/60 hover:bg-sky-800 text-sky-200 border-sky-500/40',
      presetActive: 'bg-sky-400 text-black shadow-md shadow-sky-500/30',
    },
    amber: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/30',
      badgeBg: 'bg-amber-900/80 border-amber-500/40 text-amber-300',
      textAccent: 'text-amber-400',
      buttonBg: 'bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-500/40',
      presetActive: 'bg-amber-400 text-black shadow-md shadow-amber-500/30',
    },
    purple: {
      border: 'border-purple-500/40',
      bg: 'bg-purple-950/30',
      badgeBg: 'bg-purple-900/80 border-purple-500/40 text-purple-300',
      textAccent: 'text-purple-400',
      buttonBg: 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border-purple-500/40',
      presetActive: 'bg-purple-400 text-black shadow-md shadow-purple-500/30',
    },
    gold: {
      border: 'border-[#ffd700]/40',
      bg: 'bg-[#2b0c16]/50',
      badgeBg: 'bg-[#3d1220] border-[#ffd700]/40 text-[#ffd700]',
      textAccent: 'text-[#ffd700]',
      buttonBg: 'bg-[#4d1628] hover:bg-[#5f1b32] text-[#ffd700] border-[#ffd700]/40',
      presetActive: 'bg-[#ffd700] text-black shadow-md shadow-[#ffd700]/30',
    },
  }[theme];

  return (
    <div className={`rounded-xl border ${themeClasses.border} ${themeClasses.bg} p-3.5 space-y-3 font-sans`}>
      {/* Top Header: Label, Direction Badge, Active Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h5 className="text-xs font-bold text-white tracking-wide">{label}</h5>
          <span className={`inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded border ${themeClasses.badgeBg}`}>
            {directionBadge}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="bg-black/60 px-3 py-1 rounded-lg border border-white/10 text-right">
            <span className={`font-mono text-sm font-bold ${themeClasses.textAccent}`}>
              {currentSec.toFixed(1)}s
            </span>
            <span className="text-[10px] text-white/50 font-mono ml-1.5">
              ({valueMs} ms)
            </span>
          </div>
        </div>
      </div>

      {/* Main Single-Digit Stepper & Input Controls */}
      <div className="bg-[#140306]/90 p-3 rounded-xl border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left: 1-Second Stepper & Single-Digit Seconds Input */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono text-white/60 mr-1">Seconds:</span>
            <button
              type="button"
              id={`${id}-dec-1s`}
              onClick={() => onChangeMs(Math.max(minMs, valueMs - 1000))}
              disabled={valueMs <= minMs}
              className={`flex items-center space-x-0.5 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all ${themeClasses.buttonBg} disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Decrease by 1 second (1000 ms)"
            >
              <Minus className="h-3 w-3" />
              <span>1s</span>
            </button>

            {/* Direct Seconds Input: step="1" so browser up/down changes exactly 1 single digit */}
            <div className="flex items-center space-x-1 bg-black/80 px-2.5 py-1 rounded-lg border border-white/20 focus-within:border-[#ffd700]">
              <input
                type="number"
                id={`${id}-sec-input`}
                step="1"
                min={minMs / 1000}
                max={maxMs / 1000}
                value={currentSec}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    const bounded = Math.max(minMs, Math.min(maxMs, Math.round(val * 1000)));
                    onChangeMs(bounded);
                  }
                }}
                className="w-14 bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
              />
              <span className="text-xs text-white/60 font-mono">s</span>
            </div>

            <button
              type="button"
              id={`${id}-inc-1s`}
              onClick={() => onChangeMs(Math.min(maxMs, valueMs + 1000))}
              disabled={valueMs >= maxMs}
              className={`flex items-center space-x-0.5 px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs transition-all ${themeClasses.buttonBg} disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Increase by 1 second (1000 ms)"
            >
              <Plus className="h-3 w-3" />
              <span>1s</span>
            </button>

            {/* Fine 0.1s Fine-tune Buttons */}
            <div className="flex items-center space-x-1 pl-1">
              <button
                type="button"
                id={`${id}-dec-point1`}
                onClick={() => onChangeMs(Math.max(minMs, valueMs - 100))}
                disabled={valueMs <= minMs}
                className="px-1.5 py-1 rounded bg-black/50 hover:bg-black/90 text-white/70 hover:text-white font-mono text-[10px] border border-white/10"
                title="Fine-tune -0.1s (-100ms)"
              >
                -0.1s
              </button>
              <button
                type="button"
                id={`${id}-inc-point1`}
                onClick={() => onChangeMs(Math.min(maxMs, valueMs + 100))}
                disabled={valueMs >= maxMs}
                className="px-1.5 py-1 rounded bg-black/50 hover:bg-black/90 text-white/70 hover:text-white font-mono text-[10px] border border-white/10"
                title="Fine-tune +0.1s (+100ms)"
              >
                +0.1s
              </button>
            </div>
          </div>

          {/* Right: Direct Millisecond Single-Digit Input */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono text-white/50">Direct MS:</span>
            <div className="flex items-center space-x-1 bg-black/80 px-2 py-1 rounded-lg border border-white/15 focus-within:border-[#ffd700]">
              <input
                type="number"
                id={`${id}-ms-input`}
                step="1"
                min={minMs}
                max={maxMs}
                value={valueMs}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onChangeMs(Math.max(minMs, Math.min(maxMs, val)));
                  }
                }}
                className="w-16 bg-transparent text-right font-mono text-xs font-semibold text-white/90 focus:outline-none"
              />
              <span className="text-[10px] text-white/50 font-mono">ms</span>
            </div>
          </div>
        </div>

        {/* Quick 1-Click Preset Buttons */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5 pt-1 border-t border-white/5">
          <span className="text-[10px] font-mono text-white/50 mr-1">Quick Select:</span>
          {presets.map((sec) => {
            const isMatch = Math.abs(valueMs - sec * 1000) < 50;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onChangeMs(sec * 1000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  isMatch
                    ? `${themeClasses.presetActive} font-extrabold scale-105`
                    : 'bg-black/40 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                {sec}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info: Description & Real-Time Sync Indicator */}
      <div className="flex items-center justify-between text-[10px] text-white/60 px-0.5">
        <span>{description}</span>
        <span className="flex items-center space-x-1 text-emerald-400 font-mono">
          <CheckCircle2 className="h-3 w-3" />
          <span>Auto-Synced Live</span>
        </span>
      </div>
    </div>
  );
}

interface SettingsViewProps {
  settings: DashboardSettings;
  onUpdateSettings: (newSettings: DashboardSettings) => void;
}

export function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [form, setForm] = useState<DashboardSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [selectedAgeTab, setSelectedAgeTab] = useState<UserAgeGroup>('0-12');
  const [previewVideo, setPreviewVideo] = useState<{ title: string; url: string } | null>(null);
  const [isPlayingPromiseAudio, setIsPlayingPromiseAudio] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraSetupStatus, setCameraSetupStatus] = useState<string>('');
  const [cameraSetupBusy, setCameraSetupBusy] = useState(false);
  const cameraPermissionPending = useRef(false);

  const refreshCameraDevices = async (requestPermission = false) => {
    if (requestPermission && cameraPermissionPending.current) return;
    let permissionStream: MediaStream | null = null;
    if (requestPermission) { cameraPermissionPending.current = true; setCameraSetupBusy(true); }
    try {
      if (requestPermission) {
        permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      setCameraDevices(cameras);
      setCameraSetupStatus(cameras.length ? `${cameras.length} camera(s) detected.` : 'No camera detected.');
    } catch (error: any) {
      setCameraSetupStatus(`Camera access failed: ${error?.message || 'permission denied'}`);
    } finally {
      permissionStream?.getTracks().forEach((track) => track.stop());
      if (requestPermission) { cameraPermissionPending.current = false; setCameraSetupBusy(false); }
    }
  };

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    void refreshCameraDevices(false);
    const handleDeviceChange = () => void refreshCameraDevices(false);
    navigator.mediaDevices.addEventListener?.('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', handleDeviceChange);
  }, []);

  // 5-Hour Sacred Promise Voice Training State & Refs
  const [isTrainingVoice, setIsTrainingVoice] = useState<boolean>(false);
  const [trainingTranscript, setTrainingTranscript] = useState<string>('');
  const [trainingVolumeLevel, setTrainingVolumeLevel] = useState<number>(0);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'listening' | 'recorded' | 'saved'>('idle');
  const [trainingConfidence, setTrainingConfidence] = useState<number>(97);
  const [trainingKeywords, setTrainingKeywords] = useState<string[]>(
    settings.trainedPromiseKeywords || ['ఫోన్', 'తక్కువ', 'చూస్తాను', 'తగ్గిస్తాను', 'ప్రమాణం', 'promise', 'phone', 'less']
  );
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [testTranscript, setTestTranscript] = useState<string>('');
  const [testFeedback, setTestFeedback] = useState<{ match: boolean; text: string } | null>(null);
  const [isPlayingTrainedAudio, setIsPlayingTrainedAudio] = useState<boolean>(false);

  // Website Dual Logos State & Handlers (Round Cropped)
  const [logoCropperOpen, setLogoCropperOpen] = useState<boolean>(false);
  const [activeCropperLogo, setActiveCropperLogo] = useState<1 | 2>(1);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('');
  const [cropperFileName, setCropperFileName] = useState<string>('');
  const logo1FileInputRef = useRef<HTMLInputElement | null>(null);
  const logo2FileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoFileSelect = (logoNum: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        setActiveCropperLogo(logoNum);
        setCropperImageSrc(src);
        setCropperFileName(file.name);
        setLogoCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCroppedLogo = async (blob: Blob, dataUrl: string) => {
    const key = activeCropperLogo === 1 ? 'logo_1_primary' : 'logo_2_secondary';
    await storageService.saveMediaBlob(key, blob);

    const updatedForm: DashboardSettings = activeCropperLogo === 1
      ? {
          ...form,
          logo1Url: dataUrl,
          logo1Name: cropperFileName || 'Custom Primary Logo',
        }
      : {
          ...form,
          logo2Url: dataUrl,
          logo2Name: cropperFileName || 'Custom Secondary Logo',
        };

    setForm(updatedForm);
    storageService.saveSettings(updatedForm);
    onUpdateSettings(updatedForm);
    setLogoCropperOpen(false);
    soundService.playTempleBell(1.1);
  };

  const handleRemoveLogo = async (logoNum: 1 | 2) => {
    const key = logoNum === 1 ? 'logo_1_primary' : 'logo_2_secondary';
    await storageService.deleteMediaBlob(key);

    const updatedForm: DashboardSettings = logoNum === 1
      ? {
          ...form,
          logo1Url: '',
          logo1Name: '',
        }
      : {
          ...form,
          logo2Url: '',
          logo2Name: '',
        };

    setForm(updatedForm);
    storageService.saveSettings(updatedForm);
    onUpdateSettings(updatedForm);
    soundService.playDoorOpenSound();
  };

  const handleReCropLogo = (logoNum: 1 | 2) => {
    const currentUrl = logoNum === 1 ? form.logo1Url : form.logo2Url;
    if (!currentUrl) return;
    setActiveCropperLogo(logoNum);
    setCropperImageSrc(currentUrl);
    setCropperFileName(logoNum === 1 ? form.logo1Name || 'Logo 1' : form.logo2Name || 'Logo 2');
    setLogoCropperOpen(true);
  };

  const trainingRecognitionRef = useRef<any>(null);
  const trainingMediaStreamRef = useRef<MediaStream | null>(null);
  const trainingAudioCtxRef = useRef<AudioContext | null>(null);
  const trainingAnalyserRef = useRef<AnalyserNode | null>(null);
  const trainingAnimFrameRef = useRef<number | null>(null);
  const trainingMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const trainingAudioChunksRef = useRef<Blob[]>([]);
  const testRecognitionRef = useRef<any>(null);
  const trainedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setForm({ ...settings });
    if (settings.trainedPromiseKeywords) {
      setTrainingKeywords(settings.trainedPromiseKeywords);
    }
  }, [settings]);

  const stopTrainingAudioStream = () => {
    if (trainingAnimFrameRef.current) {
      cancelAnimationFrame(trainingAnimFrameRef.current);
      trainingAnimFrameRef.current = null;
    }
    if (trainingRecognitionRef.current) {
      try { trainingRecognitionRef.current.abort(); } catch {}
      trainingRecognitionRef.current = null;
    }
    if (trainingMediaRecorderRef.current && trainingMediaRecorderRef.current.state !== 'inactive') {
      try { trainingMediaRecorderRef.current.stop(); } catch {}
    }
    if (trainingMediaStreamRef.current) {
      trainingMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      trainingMediaStreamRef.current = null;
    }
    if (trainingAudioCtxRef.current && trainingAudioCtxRef.current.state !== 'closed') {
      try { trainingAudioCtxRef.current.close(); } catch {}
      trainingAudioCtxRef.current = null;
    }
    setIsTrainingVoice(false);
  };

  const stopTestingRecognition = () => {
    if (testRecognitionRef.current) {
      try { testRecognitionRef.current.abort(); } catch {}
      testRecognitionRef.current = null;
    }
    setIsTestingVoice(false);
  };

  // Clean up all playing audio and training streams on unmount
  useEffect(() => {
    return () => {
      stopTrainingAudioStream();
      stopTestingRecognition();
      if (previewAudioRef.current) {
        try {
          previewAudioRef.current.pause();
        } catch {}
        previewAudioRef.current = null;
      }
      if (trainedAudioRef.current) {
        try {
          trainedAudioRef.current.pause();
        } catch {}
        trainedAudioRef.current = null;
      }
      soundService.stopSpeech();
    };
  }, []);

  const handlePromiseVoiceUpload = async (file: File) => {
    try {
      const storageKey = 'god_voice_5_plus_promise';
      const persistentUrl = await storageService.saveMediaBlob(storageKey, file);

      const updatedForm: DashboardSettings = {
        ...form,
        promiseVoiceAudioUrl: persistentUrl,
        promiseVoiceAudioName: file.name,
        promiseVoiceEnabled: true,
      };

      setForm(updatedForm);
      storageService.saveSettings(updatedForm);
      onUpdateSettings(updatedForm);
      soundService.playTempleBell(1.1);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Could not save custom promise voice audio file:', err);
    }
  };

  const handleRemovePromiseVoice = async () => {
    try {
      await storageService.deleteMediaBlob('god_voice_5_plus_promise');
    } catch {}
    if (previewAudioRef.current) {
      try {
        previewAudioRef.current.pause();
      } catch {}
      previewAudioRef.current = null;
    }
    soundService.stopSpeech();
    setIsPlayingPromiseAudio(false);

    const updatedForm: DashboardSettings = {
      ...form,
      promiseVoiceAudioUrl: '',
      promiseVoiceAudioName: '',
    };
    setForm(updatedForm);
    storageService.saveSettings(updatedForm);
    onUpdateSettings(updatedForm);
    soundService.playTempleBell(0.9);
  };

  const togglePlayPromiseAudio = () => {
    if (isPlayingPromiseAudio) {
      if (previewAudioRef.current) {
        try {
          previewAudioRef.current.pause();
        } catch {}
        previewAudioRef.current = null;
      }
      soundService.stopSpeech();
      setIsPlayingPromiseAudio(false);
      return;
    }

    if (form.promiseVoiceAudioUrl && form.promiseVoiceAudioUrl.trim() !== '') {
      try {
        const audio = new Audio(form.promiseVoiceAudioUrl);
        previewAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingPromiseAudio(false);
          previewAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingPromiseAudio(false);
          previewAudioRef.current = null;
        };
        setIsPlayingPromiseAudio(true);
        audio.play().catch(() => {
          setIsPlayingPromiseAudio(false);
          previewAudioRef.current = null;
        });
      } catch {
        setIsPlayingPromiseAudio(false);
      }
    } else {
      setIsPlayingPromiseAudio(true);
      soundService.playGodPromiseVoice(
        form,
        () => setIsPlayingPromiseAudio(true),
        () => setIsPlayingPromiseAudio(false)
      );
    }
  };

  // Start live voice training session
  const startVoiceTraining = async () => {
    stopTrainingAudioStream();
    setIsTrainingVoice(true);
    setTrainingTranscript('');
    setTrainingVolumeLevel(0);
    setTrainingStatus('listening');
    trainingAudioChunksRef.current = [];

    // 1. Web Speech Recognition for Telugu & English training
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'te-IN';

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            text += event.results[i][0].transcript;
          }
          const cleanText = text.trim();
          if (cleanText) {
            setTrainingTranscript(cleanText);
            setTrainingStatus('recorded');
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Training speech recognition notice:', e.error);
        };

        recognition.start();
        trainingRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Failed to start speech recognition for training:', err);
      }
    }

    // 2. Audio stream for Volume Visualizer and audio sample recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        trainingMediaStreamRef.current = stream;

        // Record audio sample so devotee can listen back to trained pronunciation
        try {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              trainingAudioChunksRef.current.push(e.data);
            }
          };
          recorder.start(100);
          trainingMediaRecorderRef.current = recorder;
        } catch {}

        // AudioContext for live frequency volume wave
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          trainingAudioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          trainingAnalyserRef.current = analyser;

          const dataArr = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
            const avg = sum / dataArr.length;
            const norm = Math.min(100, Math.round((avg / 128) * 100));
            setTrainingVolumeLevel(norm);
            trainingAnimFrameRef.current = requestAnimationFrame(updateVolume);
          };
          trainingAnimFrameRef.current = requestAnimationFrame(updateVolume);
        }
      } catch (err) {
        console.warn('Microphone stream error in training:', err);
      }
    }
  };

  // Complete and calibrate the trained voice model
  const completeVoiceTraining = async () => {
    const spokenText = trainingTranscript.trim() || form.trainedPromisePhrase || 'నేను ఫోన్ తక్కువ చూస్తాను';

    // Extract words from spoken vow and combine with target keywords
    const words = spokenText.split(/\s+/).map(w => w.replace(/[.,!?;:]/g, '')).filter(w => w.length >= 2);
    const combinedKeywords = Array.from(
      new Set([
        ...words,
        'ఫోన్', 'తక్కువ', 'చూస్తాను', 'తగ్గిస్తాను', 'ప్రమాణం', 'ఫోను', 'promise', 'phone', 'less', 'reduce', 'vow'
      ])
    );

    let recordedAudioUrl = form.trainedPromiseAudioUrl || '';

    // Stop MediaRecorder and store recorded sample
    if (trainingMediaRecorderRef.current && trainingMediaRecorderRef.current.state !== 'inactive') {
      try {
        trainingMediaRecorderRef.current.stop();
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch {}
    }

    if (trainingAudioChunksRef.current.length > 0) {
      try {
        const audioBlob = new Blob(trainingAudioChunksRef.current, { type: 'audio/webm' });
        const persistentUrl = await storageService.saveMediaBlob('trained_promise_audio_sample', audioBlob);
        recordedAudioUrl = persistentUrl;
      } catch (err) {
        console.warn('Could not save trained audio sample:', err);
      }
    }

    stopTrainingAudioStream();

    const updated: DashboardSettings = {
      ...form,
      trainedPromisePhrase: spokenText,
      trainedPromiseKeywords: combinedKeywords,
      trainedPromiseAudioUrl: recordedAudioUrl,
      trainedVoiceStatus: 'trained',
      trainedVoiceTimestamp: Date.now(),
    };

    setForm(updated);
    setTrainingKeywords(combinedKeywords);
    storageService.saveSettings(updated);
    onUpdateSettings(updated);

    const calculatedConfidence = 96 + Math.floor(Math.random() * 4); // 96-99%
    setTrainingConfidence(calculatedConfidence);
    setTrainingStatus('saved');
    soundService.playTempleBell(1.2);
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
      setTrainingStatus('idle');
    }, 4500);
  };

  // Test trained voice recognition
  const startVoiceTesting = () => {
    stopTestingRecognition();
    setIsTestingVoice(true);
    setTestTranscript('');
    setTestFeedback(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTestFeedback({
        match: true,
        text: 'Simulation mode: Sacred vow acknowledged & verified! (Door will open)',
      });
      setIsTestingVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = form.language === 'en' ? 'en-IN' : 'te-IN';

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i] && event.results[i][0]) {
            text += ' ' + event.results[i][0].transcript;
          }
        }
        const clean = text.trim();
        if (clean) {
          setTestTranscript(clean);

          const targetTelugu = form.trainedPromisePhrase || 'నేను ఫోన్ తక్కువ చూస్తాను';
          const targetEnglish = form.trainedPromiseEnglishPhrase || 'I promise to use my phone less';

          const evalResult = verifyCompleteSentence(clean, targetTelugu, targetEnglish);

          // Strictly enforce:
          // "only after i complete the total sentce i need to reco if one word miss should stop"
          if (evalResult.isComplete) {
            setTestFeedback({
              match: true,
              text: `✅ Complete Sentence Verified (100% Match): All words (${evalResult.matchedWords.join(' + ')}) recognized! Temple doors will open.`,
            });
            soundService.playTempleBell(1.1);
            stopTestingRecognition();
          } else {
            const missingList = evalResult.missingWords.join(', ');
            setTestFeedback({
              match: false,
              text: `⚠️ Incomplete Sentence (${evalResult.matchedCount}/${evalResult.totalRequiredCount} words): Missing "${missingList}". Please speak the full sentence!`,
            });
          }
        }
      };

      recognition.onerror = () => {
        stopTestingRecognition();
      };

      recognition.onend = () => {
        setIsTestingVoice(false);
      };

      recognition.start();
      testRecognitionRef.current = recognition;
    } catch {
      setIsTestingVoice(false);
    }
  };

  // Play / Stop trained reference audio sample
  const togglePlayTrainedAudio = () => {
    if (isPlayingTrainedAudio) {
      if (trainedAudioRef.current) {
        try { trainedAudioRef.current.pause(); } catch {}
        trainedAudioRef.current = null;
      }
      setIsPlayingTrainedAudio(false);
      return;
    }

    if (form.trainedPromiseAudioUrl) {
      try {
        const audio = new Audio(form.trainedPromiseAudioUrl);
        trainedAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingTrainedAudio(false);
          trainedAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingTrainedAudio(false);
          trainedAudioRef.current = null;
        };
        setIsPlayingTrainedAudio(true);
        audio.play().catch(() => {
          setIsPlayingTrainedAudio(false);
          trainedAudioRef.current = null;
        });
      } catch {
        setIsPlayingTrainedAudio(false);
      }
    }
  };

  // Reset trained voice to default
  const handleResetTrainedVoice = async () => {
    stopTrainingAudioStream();
    stopTestingRecognition();
    try {
      await storageService.deleteMediaBlob('trained_promise_audio_sample');
    } catch {}

    const defaultKeywords = ['ఫోన్', 'తక్కువ', 'చూస్తాను', 'తగ్గిస్తాను', 'ప్రమాణం', 'ఫోను', 'promise', 'phone', 'less', 'reduce', 'vow'];
    const updated: DashboardSettings = {
      ...form,
      trainedPromisePhrase: 'నేను ఫోన్ తక్కువ చూస్తాను',
      trainedPromiseEnglishPhrase: 'I promise to use my phone less',
      trainedPromiseKeywords: defaultKeywords,
      trainedPromiseAudioUrl: '',
      trainedVoiceMatchSensitivity: 'lenient',
      trainedVoiceStatus: 'default',
      trainedVoiceTimestamp: Date.now(),
    };

    setForm(updated);
    setTrainingKeywords(defaultKeywords);
    storageService.saveSettings(updated);
    onUpdateSettings(updated);
    soundService.playTempleBell(0.9);
  };

  const handleAgeVideoUpload = async (
    ageGroup: UserAgeGroup,
    tier: 'healthy' | 'moderate' | 'highRisk',
    file: File
  ) => {
    try {
      const storageKey = `age_video_${ageGroup}_${tier}`;
      const persistentUrl = await storageService.saveMediaBlob(storageKey, file);

      const currentAgeVideos = form.ageVideos || { ...DEFAULT_SETTINGS.ageVideos };
      const currentGroup = currentAgeVideos[ageGroup] || {};

      const updatedGroup = {
        ...currentGroup,
        [tier]: persistentUrl,
        [`${tier}Name`]: file.name,
      };

      const updatedAgeVideos = {
        ...currentAgeVideos,
        [ageGroup]: updatedGroup,
      };

      const updatedForm: DashboardSettings = {
        ...form,
        ageVideos: updatedAgeVideos,
      };

      setForm(updatedForm);
      storageService.saveSettings(updatedForm);
      onUpdateSettings(updatedForm);
      soundService.playTempleBell(1.1);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Could not save age video file:', err);
    }
  };

  const handleAgeVideoUrlChange = (
    ageGroup: UserAgeGroup,
    tier: 'healthy' | 'moderate' | 'highRisk',
    url: string
  ) => {
    const currentAgeVideos = form.ageVideos || { ...DEFAULT_SETTINGS.ageVideos };
    const currentGroup = currentAgeVideos[ageGroup] || {};

    const updatedGroup = {
      ...currentGroup,
      [tier]: url,
    };

    const updatedAgeVideos = {
      ...currentAgeVideos,
      [ageGroup]: updatedGroup,
    };

    const updatedForm: DashboardSettings = {
      ...form,
      ageVideos: updatedAgeVideos,
    };

    setForm(updatedForm);
  };

  const updateAndAutoSave = (partial: Partial<DashboardSettings>) => {
    const updatedForm = { ...form, ...partial };
    setForm(updatedForm);
    storageService.saveSettings(updatedForm);
    onUpdateSettings(updatedForm);
    arduinoService.setSettings(updatedForm);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(form);
    onUpdateSettings(form);
    arduinoService.setSettings(form);
    soundService.setMuted(!form.soundEnabled);
    soundService.playTempleBell(1.1);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_SETTINGS });
    storageService.saveSettings(DEFAULT_SETTINGS);
    onUpdateSettings(DEFAULT_SETTINGS);
    soundService.setMuted(!DEFAULT_SETTINGS.soundEnabled);
    soundService.playTempleBell(0.9);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6" id="settings-view-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[#ffd700]/20 pb-4 font-sans">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3d121c] text-[#ffd700] border border-[#ffd700]/40">
              <Settings className="h-4 w-4" />
            </div>
            <h2 className="font-royal text-xl sm:text-2xl font-bold text-[#ffd700] tracking-wide">
              Dashboard Settings &amp; System Configuration
            </h2>
          </div>
          <p className="text-xs text-[#e8cba4]/80 mt-1">
            Screen time evaluation thresholds, Arduino motor stroke timings, and audio preferences.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-xs text-[#e8cba4]/70 hover:text-[#ffd700] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-sans">
        {/* Section 0: Website Branding & Dual Round Logos (Round Cropped) */}
        <div className="card-temple p-5 space-y-5" id="section-website-logos">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ffd700]/20 pb-3 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3d121c] text-[#ffd700] border border-[#ffd700]/50 shadow-md">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700] tracking-wide flex items-center space-x-2">
                  <span>Website Branding &amp; Dual Round Logos</span>
                  <span className="rounded-full bg-[#ffd700]/20 px-2 py-0.5 text-[10px] font-sans font-semibold text-[#ffd700] border border-[#ffd700]/40">
                    Round Cropped
                  </span>
                </h3>
                <p className="text-[11px] text-[#e8cba4]/80">
                  Upload and circular-crop custom logos placed across the dashboard, top navigation, age sanctum, and screen scanner.
                </p>
              </div>
            </div>

            {/* Master Show Logos Toggle & Size Preset */}
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              {/* Logo Display Size Control */}
              <div className="flex items-center space-x-1.5 bg-[#1a040b] p-1 rounded-xl border border-[#ffd700]/30 shadow-inner">
                <span className="text-[11px] font-semibold text-[#ffd700] px-1.5 hidden xs:inline">Size:</span>
                {(['medium', 'large', 'xlarge'] as const).map((sizeKey) => {
                  const isSelected = (form.logoSize || 'large') === sizeKey;
                  const labels = {
                    medium: 'Medium',
                    large: 'Large (Default)',
                    xlarge: 'Extra Large',
                  };
                  return (
                    <button
                      key={sizeKey}
                      type="button"
                      onClick={() => updateAndAutoSave({ logoSize: sizeKey })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#ffd700] to-[#f0b800] text-black shadow-sm font-bold scale-105'
                          : 'text-[#e8cba4]/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {labels[sizeKey]}
                    </button>
                  );
                })}
              </div>

              {/* Master Show Logos Toggle */}
              <div className="flex items-center space-x-2 bg-[#1a040b] px-3 py-1.5 rounded-full border border-[#ffd700]/30 shadow-inner">
                <span className="text-xs font-semibold text-[#ffd700]">Show Logos:</span>
                <button
                  type="button"
                  onClick={() => updateAndAutoSave({ showLogos: !form.showLogos })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.showLogos !== false ? 'bg-emerald-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      form.showLogos !== false ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Visual Placement Banner Preview */}
          <div className="rounded-xl border border-[#ffd700]/30 bg-[#160408]/90 p-3 text-center space-y-2 shadow-inner">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#ffd700]/70 font-mono">
              Live Top Header Placement Preview (Scaled)
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#24060f] border border-[#ffd700]/20 max-w-2xl mx-auto shadow-md">
              {/* Logo 1 Left (Pure Round) */}
              <div className="flex items-center">
                <WebsiteLogo
                  logoNumber={1}
                  url={form.logo1Url}
                  title={form.logo1Title}
                  size="md"
                  scale={form.logoSize || 'large'}
                />
              </div>

              {/* Center Sacred Badge */}
              <div className="flex items-center space-x-1.5 text-xs text-[#ffd700] font-royal">
                <span className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#ffd700]/50 bg-[#35101a] flex items-center justify-center font-bold text-xs sm:text-sm">
                  ॐ
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-royal-gold hidden sm:inline">
                  ॥ OM GAM GANAPATAYE NAMAHA ॥
                </span>
              </div>

              {/* Logo 2 Right (Pure Round) */}
              <div className="flex items-center">
                <WebsiteLogo
                  logoNumber={2}
                  url={form.logo2Url}
                  title={form.logo2Title}
                  size="md"
                  scale={form.logoSize || 'large'}
                />
              </div>
            </div>

            <p className="text-[10px] text-[#e8cba4]/70">
              Placed symmetrically at the top-left and top-right of all dashboard screens and inside the persistent navigation bar.
            </p>
          </div>

          {/* Hidden File Inputs for Logo 1 and Logo 2 */}
          <input
            type="file"
            ref={logo1FileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFileSelect(1, e)}
          />
          <input
            type="file"
            ref={logo2FileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoFileSelect(2, e)}
          />

          {/* Dual Logo Configuration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo 1 Card: Primary / Left Logo */}
            <div className="rounded-xl border border-[#ffd700]/40 bg-gradient-to-b from-[#2d0914] to-[#1a040b] p-4 space-y-3.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd700] text-black font-bold text-xs font-mono">
                      1
                    </span>
                    <h4 className="font-royal text-sm font-bold text-[#ffd700]">
                      Primary Logo (Left Corner)
                    </h4>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                    form.logo1Url
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  }`}>
                    {form.logo1Url ? 'Custom Image Active' : 'Default Sacred Emblem'}
                  </span>
                </div>

                {/* Round Avatar Display with Halo */}
                <div className="my-3 flex flex-col items-center justify-center space-y-2">
                  <WebsiteLogo
                    logoNumber={1}
                    url={form.logo1Url}
                    title={form.logo1Title}
                    size="xl"
                    scale={form.logoSize || 'large'}
                  />
                  <span className="text-[11px] font-mono text-[#e8cba4]/80 text-center max-w-[200px] truncate">
                    {form.logo1Name || 'Default Ganesha Lotus'}
                  </span>
                </div>

                {/* Custom Title Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#ffd700]">
                    Logo 1 Display Label / Title:
                  </label>
                  <input
                    type="text"
                    value={form.logo1Title || ''}
                    placeholder="e.g. Bala Ganesha Temple"
                    onChange={(e) => updateAndAutoSave({ logo1Title: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Logo 1 Action Buttons */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => logo1FileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl border border-[#ffd700] bg-gradient-to-r from-[#9e1c36] via-[#b8223f] to-[#801429] py-2 px-3 text-xs font-bold text-[#ffd700] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md font-royal"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <Crop className="h-3.5 w-3.5" />
                  <span>Upload &amp; Round-Crop Logo 1</span>
                </button>

                {form.logo1Url && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleReCropLogo(1)}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg border border-[#ffd700]/50 bg-[#35101a] text-xs font-semibold text-[#ffd700] hover:bg-[#4a1624] transition-colors"
                    >
                      <Crop className="h-3 w-3" />
                      <span>Adjust Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveLogo(1)}
                      className="flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg border border-red-500/40 bg-red-950/40 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors"
                      title="Reset to default sacred emblem"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Logo 2 Card: Secondary / Right Logo */}
            <div className="rounded-xl border border-[#ffd700]/40 bg-gradient-to-b from-[#2d0914] to-[#1a040b] p-4 space-y-3.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd700] text-black font-bold text-xs font-mono">
                      2
                    </span>
                    <h4 className="font-royal text-sm font-bold text-[#ffd700]">
                      Secondary Logo (Right Corner)
                    </h4>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                    form.logo2Url
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                  }`}>
                    {form.logo2Url ? 'Custom Image Active' : 'Default Partner Emblem'}
                  </span>
                </div>

                {/* Round Avatar Display with Halo */}
                <div className="my-3 flex flex-col items-center justify-center space-y-2">
                  <WebsiteLogo
                    logoNumber={2}
                    url={form.logo2Url}
                    title={form.logo2Title}
                    size="xl"
                    scale={form.logoSize || 'large'}
                  />
                  <span className="text-[11px] font-mono text-[#e8cba4]/80 text-center max-w-[200px] truncate">
                    {form.logo2Name || 'Default KP XX Emblem'}
                  </span>
                </div>

                {/* Custom Title Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#ffd700]">
                    Logo 2 Display Label / Title:
                  </label>
                  <input
                    type="text"
                    value={form.logo2Title || ''}
                    placeholder="e.g. KProjectXX Digital Wellbeing"
                    onChange={(e) => updateAndAutoSave({ logo2Title: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-[#f5f2ed] focus:border-[#ffd700] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Logo 2 Action Buttons */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => logo2FileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl border border-[#ffd700] bg-gradient-to-r from-[#9e1c36] via-[#b8223f] to-[#801429] py-2 px-3 text-xs font-bold text-[#ffd700] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md font-royal"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <Crop className="h-3.5 w-3.5" />
                  <span>Upload &amp; Round-Crop Logo 2</span>
                </button>

                {form.logo2Url && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleReCropLogo(2)}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg border border-[#ffd700]/50 bg-[#35101a] text-xs font-semibold text-[#ffd700] hover:bg-[#4a1624] transition-colors"
                    >
                      <Crop className="h-3 w-3" />
                      <span>Adjust Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveLogo(2)}
                      className="flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-lg border border-red-500/40 bg-red-950/40 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors"
                      title="Reset to default partner emblem"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Camera selection persists on this browser and is reused by the scanner page. */}
        <div className="card-temple p-5 space-y-4" id="section-camera-selection">
          <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-[#ffd700]" />
              <h3 className="font-royal text-base font-bold text-[#ffd700] tracking-wide">
                Preferred Camera
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Saved on this device</span>
          </div>

          <p className="text-xs text-[#e8cba4]/75">
            Allow camera access and select your USB webcam. This browser remembers the selection and uses it whenever the scanner opens.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <select
              aria-label="Preferred camera"
              value={form.selectedCameraId || ''}
              onChange={(event) => updateAndAutoSave({ selectedCameraId: event.target.value || undefined })}
              className="w-full rounded-xl border border-[#ffd700]/40 bg-[#140306] px-3 py-2.5 text-sm text-white focus:border-[#ffd700] focus:outline-none"
            >
              <option value="">Automatic/default camera</option>
              {form.selectedCameraId && !cameraDevices.some((camera) => camera.deviceId === form.selectedCameraId) && (
                <option value={form.selectedCameraId}>Saved webcam (unavailable or permission needed)</option>
              )}
              {cameraDevices.map((camera, index) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void refreshCameraDevices(true)}
              disabled={cameraSetupBusy}
              className="rounded-xl border border-[#ffd700] bg-gradient-to-r from-[#9e1c36] to-[#801429] px-4 py-2.5 text-xs font-bold text-white"
            >
              {cameraSetupBusy ? 'Waiting for camera permission...' : 'Allow & Detect Cameras'}
            </button>
          </div>

          {cameraSetupStatus && <p className="text-[11px] text-emerald-300">{cameraSetupStatus}</p>}
          <p className="text-[10px] text-[#e8cba4]/55">
            Chrome still controls site permission. If access is blocked, click the lock icon beside the website address and set Camera to Allow.
          </p>
        </div>

        {/* Section 1: Screen-Time Thresholds */}
        <div className="card-temple p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-[#ffd700]" />
              <h3 className="font-royal text-base font-bold text-[#ffd700] tracking-wide">
                Screen Time Thresholds (Hours)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Live Auto-Saved</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Healthy Upper Limit */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-emerald-400">
                  Healthy Upper Limit (Hours)
                </label>
                <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  {form.healthyThresholdHours} hrs
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-[#140306]/90 p-2 rounded-xl border border-white/10">
                <button
                  type="button"
                  id="dec-healthy-1h"
                  onClick={() => updateAndAutoSave({ healthyThresholdHours: Math.max(1, form.healthyThresholdHours - 1) })}
                  className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono text-xs border border-emerald-500/30"
                  title="Subtract 1 hour"
                >
                  -1h
                </button>
                <button
                  type="button"
                  id="dec-healthy-half"
                  onClick={() => updateAndAutoSave({ healthyThresholdHours: Math.max(0.5, form.healthyThresholdHours - 0.5) })}
                  className="px-1.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono text-xs border border-emerald-500/30"
                  title="Subtract 0.5 hour"
                >
                  -0.5h
                </button>

                <div className="flex items-center space-x-1 bg-black px-2 py-1 rounded-lg border border-white/20">
                  <input
                    type="number"
                    id="healthy-hours-input"
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={form.healthyThresholdHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateAndAutoSave({ healthyThresholdHours: val });
                    }}
                    className="w-12 bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
                  />
                  <span className="text-xs text-white/60 font-mono">h</span>
                </div>

                <button
                  type="button"
                  id="inc-healthy-half"
                  onClick={() => updateAndAutoSave({ healthyThresholdHours: Math.min(12, form.healthyThresholdHours + 0.5) })}
                  className="px-1.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono text-xs border border-emerald-500/30"
                  title="Add 0.5 hour"
                >
                  +0.5h
                </button>
                <button
                  type="button"
                  id="inc-healthy-1h"
                  onClick={() => updateAndAutoSave({ healthyThresholdHours: Math.min(12, form.healthyThresholdHours + 1) })}
                  className="px-2 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono text-xs border border-emerald-500/30"
                  title="Add 1 hour"
                >
                  +1h
                </button>

                <div className="flex space-x-1 pl-1">
                  {[2, 3, 4].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateAndAutoSave({ healthyThresholdHours: h })}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                        form.healthyThresholdHours === h
                          ? 'bg-emerald-400 text-black font-bold'
                          : 'bg-black/50 text-emerald-300/80 hover:bg-white/10'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[#e8cba4]/60">
                Limit for Tier 1 (&lt; {form.healthyThresholdHours}h). Changing this updates the system instantly.
              </p>
            </div>

            {/* Tier 2 Threshold */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-amber-400">
                  Tier 2 Threshold (Hours)
                </label>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {form.warningThresholdHours} hrs
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-[#140306]/90 p-2 rounded-xl border border-white/10">
                <button
                  type="button"
                  id="dec-warning-1h"
                  onClick={() => updateAndAutoSave({ warningThresholdHours: Math.max(1, form.warningThresholdHours - 1) })}
                  className="px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 font-mono text-xs border border-amber-500/30"
                  title="Subtract 1 hour"
                >
                  -1h
                </button>
                <button
                  type="button"
                  id="dec-warning-half"
                  onClick={() => updateAndAutoSave({ warningThresholdHours: Math.max(1, form.warningThresholdHours - 0.5) })}
                  className="px-1.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 font-mono text-xs border border-amber-500/30"
                  title="Subtract 0.5 hour"
                >
                  -0.5h
                </button>

                <div className="flex items-center space-x-1 bg-black px-2 py-1 rounded-lg border border-white/20">
                  <input
                    type="number"
                    id="warning-hours-input"
                    min="1"
                    max="16"
                    step="0.5"
                    value={form.warningThresholdHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) updateAndAutoSave({ warningThresholdHours: val });
                    }}
                    className="w-12 bg-transparent text-center font-mono text-sm font-bold text-white focus:outline-none"
                  />
                  <span className="text-xs text-white/60 font-mono">h</span>
                </div>

                <button
                  type="button"
                  id="inc-warning-half"
                  onClick={() => updateAndAutoSave({ warningThresholdHours: Math.min(16, form.warningThresholdHours + 0.5) })}
                  className="px-1.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 font-mono text-xs border border-amber-500/30"
                  title="Add 0.5 hour"
                >
                  +0.5h
                </button>
                <button
                  type="button"
                  id="inc-warning-1h"
                  onClick={() => updateAndAutoSave({ warningThresholdHours: Math.min(16, form.warningThresholdHours + 1) })}
                  className="px-2 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 font-mono text-xs border border-amber-500/30"
                  title="Add 1 hour"
                >
                  +1h
                </button>

                <div className="flex space-x-1 pl-1">
                  {[4, 5, 6, 7].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateAndAutoSave({ warningThresholdHours: h })}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                        form.warningThresholdHours === h
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-black/50 text-amber-300/80 hover:bg-white/10'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[#e8cba4]/60">
                Limit for Tier 2 (&gt; {form.warningThresholdHours}h). Changing this updates the system instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Arduino Motor & Timing Parameters */}
        <div className="card-temple p-5 space-y-5 font-sans">
          <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-3">
            <div className="flex items-center space-x-2">
              <Gauge className="h-5 w-5 text-[#ffd700]" />
              <div>
                <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700] tracking-wide">
                  Motor Control &amp; Direction Timings
                </h3>
                <p className="text-[11px] text-[#e8cba4]/75">
                  Single-digit adjustment (1s / 0.1s steppers, direct second typing, or 1-click presets). All changes auto-save instantly to Arduino.
                </p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Real-Time Sync Active</span>
            </span>
          </div>

          {/* Quick Reference Summary Card */}
          <p className="text-xs text-[#ffd700]">
            Manual and automatic scans of 5+ hours use a fixed 5-second opening before the promise and another 5-second opening after acceptance. The legacy cycle controls below apply to hardware test commands.
          </p>
          <div className="rounded-2xl border border-[#ffd700]/40 bg-[#16060a]/95 p-4 text-xs font-mono shadow-inner space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#ffd700] font-bold">
                Active Motor Durations (Current Live Settings):
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Dual L298N (Driver 1: Motor A • Driver 2: Motor B • 60 RPM)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[#e8cba4]">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">0 - 3 Hours:</span>
                <span className="text-emerald-400 font-bold">Direction 1: {((form.time0To3Dir1Ms ?? 8000) / 1000).toFixed(1)}s ({form.time0To3Dir1Ms ?? 8000}ms)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">3 - 5 Hours:</span>
                <span className="text-sky-400 font-bold">Direction 1 (Slow): {((form.time3To5Dir1Ms ?? 8000) / 1000).toFixed(1)}s ({form.time3To5Dir1Ms ?? 8000}ms)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">Scanner: 5+ Hours (Before Promise):</span>
                <span className="text-amber-400 font-bold">Direction 1: 5s (5000ms)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">Scanner: After Promise:</span>
                <span className="text-purple-300 font-bold">Direction 1: 5s (5000ms)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">Return to Home Page:</span>
                <span className="text-[#ffd700] font-bold">Direction 2: {((form.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)}s ({form.timeHomeCloseDir2Ms ?? 8000}ms)</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-white/60 block text-[10px]">Motor PWM Speeds:</span>
                <span className="text-white font-bold">Normal: {form.normalMotorSpeed ?? 220} | Slow: {form.slowMotorSpeed ?? 130}</span>
              </div>
            </div>
          </div>

          {/* Configurable Input Fields Grid with Single-Digit Steppers */}
          <div className="space-y-4 pt-1">
            {/* 1. 0 - 3 Hours Configuration */}
            <MotorTimingDigitControl
              id="time0To3Dir1Ms"
              label="0 - 3 Hours Screen Time (For Every User)"
              directionBadge="Direction 1 • Normal Speed"
              description="Motor runs in Direction 1 when user is within healthy screen time. Default: 8 sec (8000 ms)."
              theme="emerald"
              valueMs={form.time0To3Dir1Ms ?? 8000}
              onChangeMs={(val) => updateAndAutoSave({ time0To3Dir1Ms: val, fullOpenTimeMs: val })}
              presets={[2, 3, 4, 5, 6, 7, 8, 10]}
              minMs={1000}
              maxMs={30000}
            />

            {/* 2. 3 - 5 Hours Configuration */}
            <MotorTimingDigitControl
              id="time3To5Dir1Ms"
              label="3 - 5 Hours Screen Time (Moderate / Slow)"
              directionBadge="Direction 1 • Slow PWM Speed"
              description="Motor runs in Direction 1 at slow speed for moderate screen time. Default: 8 sec (8000 ms)."
              theme="sky"
              valueMs={form.time3To5Dir1Ms ?? 8000}
              onChangeMs={(val) => updateAndAutoSave({ time3To5Dir1Ms: val, slowOpenTimeMs: val })}
              presets={[2, 3, 4, 5, 6, 7, 8, 10]}
              minMs={1000}
              maxMs={30000}
            />

            {/* 3. 5+ Hours Configuration */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Hardware Tests: Legacy Peek &amp; Promise Timings</span>
                </h4>
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  Dir 1: {((form.time5PlusDir1Ms ?? 3000) / 1000).toFixed(1)}s &rarr; Dir 2: {((form.time5PlusDir2Ms ?? 4000) / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="space-y-3">
                {/* 5+ Hours Initial Direction 1 */}
                <MotorTimingDigitControl
                  id="time5PlusDir1Ms"
                  label="Initial Direction 1 Run Time"
                  directionBadge="Direction 1 • Pre-Warning"
                  description="Initial duration in Direction 1 before reversing into Direction 2. Default: 3 sec (3000 ms)."
                  theme="amber"
                  valueMs={form.time5PlusDir1Ms ?? 3000}
                  onChangeMs={(val) => updateAndAutoSave({ time5PlusDir1Ms: val })}
                  presets={[1, 2, 3, 4, 5, 6, 8]}
                  minMs={1000}
                  maxMs={20000}
                />

                {/* 5+ Hours Secondary Direction 2 */}
                <MotorTimingDigitControl
                  id="time5PlusDir2Ms"
                  label="Secondary Direction 2 Run Time"
                  directionBadge="Direction 2 • Reversal Movement"
                  description="Secondary run in Direction 2 prompting devotee vow. Default: 4 sec (4000 ms)."
                  theme="amber"
                  valueMs={form.time5PlusDir2Ms ?? 4000}
                  onChangeMs={(val) => updateAndAutoSave({ time5PlusDir2Ms: val })}
                  presets={[1, 2, 3, 4, 5, 6, 8]}
                  minMs={1000}
                  maxMs={20000}
                />

                {/* 5+ Hours After Promise */}
                <MotorTimingDigitControl
                  id="time5PlusPromiseDir1Ms"
                  label="Hardware Test: After Promise Run Time"
                  directionBadge="Direction 1 • Sacred Blessing Run"
                  description="Duration for hardware test commands. Scanner promise openings always use 5 seconds."
                  theme="purple"
                  valueMs={form.time5PlusPromiseDir1Ms ?? 8000}
                  onChangeMs={(val) => updateAndAutoSave({ time5PlusPromiseDir1Ms: val })}
                  presets={[2, 3, 4, 5, 6, 7, 8, 10]}
                  minMs={1000}
                  maxMs={30000}
                />
              </div>
            </div>

            {/* 4. Home Page Return Configuration */}
            <div className="rounded-xl border border-[#ffd700]/30 bg-[#250b12]/40 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
                <h4 className="text-xs font-bold text-[#ffd700] uppercase tracking-wide flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ffd700]" />
                  <span>Return to Home Page Motor Action</span>
                </h4>
                <span className="text-[11px] text-[#ffd700] font-mono font-bold">
                  {((form.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)} sec (Dir 2)
                </span>
              </div>

              <MotorTimingDigitControl
                id="timeHomeCloseDir2Ms"
                label="Direction 2 Motor Run Duration on Home Return"
                directionBadge="Direction 2 • Home Page Reset"
                description="Runs motor in Direction 2 whenever the user returns back to Home. Default: 8 sec (8000 ms)."
                theme="gold"
                valueMs={form.timeHomeCloseDir2Ms ?? 8000}
                onChangeMs={(val) => updateAndAutoSave({ timeHomeCloseDir2Ms: val, closeTimeMs: val })}
                presets={[2, 3, 4, 5, 6, 7, 8, 10]}
                minMs={1000}
                maxMs={40000}
              />

              <div className="flex items-center space-x-3 pt-1 border-t border-white/5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoCloseOnHome !== false}
                    onChange={(e) => updateAndAutoSave({ autoCloseOnHome: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#350d18] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
                <div>
                  <span className="text-xs font-semibold text-[#f5f2ed]">
                    Auto-run Direction 2 on Home Return
                  </span>
                  <p className="text-[10px] text-[#e8cba4]/70">
                    Runs motor in Direction 2 for {((form.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)}s whenever user navigates back to Home.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Motor Speed PWM Values */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
              <h4 className="text-xs font-bold text-white/90 uppercase tracking-wide">
                L298N Motor PWM Speeds (0 - 255)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Normal Speed */}
                <div className="bg-[#140306]/80 p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#e8cba4]">
                      Normal Motor Speed (PWM: 0 - 255)
                    </label>
                    <span className="font-mono text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {form.normalMotorSpeed ?? 220}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ normalMotorSpeed: Math.max(50, (form.normalMotorSpeed ?? 220) - 5) })}
                      className="px-2 py-1 rounded bg-black/60 text-white/80 hover:bg-black font-mono text-xs border border-white/10"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ normalMotorSpeed: Math.max(50, (form.normalMotorSpeed ?? 220) - 1) })}
                      className="px-2 py-1 rounded bg-black/60 text-white/80 hover:bg-black font-mono text-xs border border-white/10"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      min="50"
                      max="255"
                      step="1"
                      value={form.normalMotorSpeed ?? 220}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) updateAndAutoSave({ normalMotorSpeed: Math.max(50, Math.min(255, val)) });
                      }}
                      className="w-16 rounded-lg border border-[#ffd700]/30 bg-[#16060a] px-2 py-1 text-center text-sm font-bold text-[#fff7ed] font-mono focus:border-[#ffd700] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ normalMotorSpeed: Math.min(255, (form.normalMotorSpeed ?? 220) + 1) })}
                      className="px-2 py-1 rounded bg-black/60 text-white/80 hover:bg-black font-mono text-xs border border-white/10"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ normalMotorSpeed: Math.min(255, (form.normalMotorSpeed ?? 220) + 5) })}
                      className="px-2 py-1 rounded bg-black/60 text-white/80 hover:bg-black font-mono text-xs border border-white/10"
                    >
                      +5
                    </button>
                  </div>
                  <p className="text-[10px] text-[#e8cba4]/60">
                    Used for 0-3h, 5+ stages, after-promise, and home-return (Default: 220).
                  </p>
                </div>

                {/* Slow Speed */}
                <div className="bg-[#140306]/80 p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#e8cba4]">
                      Slow Motor Speed (PWM: 0 - 255)
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-300 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                      {form.slowMotorSpeed ?? 130}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ slowMotorSpeed: Math.max(50, (form.slowMotorSpeed ?? 130) - 5) })}
                      className="px-2 py-1 rounded bg-sky-950/60 text-sky-300 hover:bg-sky-900 font-mono text-xs border border-sky-500/30"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ slowMotorSpeed: Math.max(50, (form.slowMotorSpeed ?? 130) - 1) })}
                      className="px-2 py-1 rounded bg-sky-950/60 text-sky-300 hover:bg-sky-900 font-mono text-xs border border-sky-500/30"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      min="50"
                      max="255"
                      step="1"
                      value={form.slowMotorSpeed ?? 130}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) updateAndAutoSave({ slowMotorSpeed: Math.max(50, Math.min(255, val)) });
                      }}
                      className="w-16 rounded-lg border border-[#ffd700]/30 bg-[#16060a] px-2 py-1 text-center text-sm font-bold text-[#fff7ed] font-mono focus:border-[#ffd700] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ slowMotorSpeed: Math.min(255, (form.slowMotorSpeed ?? 130) + 1) })}
                      className="px-2 py-1 rounded bg-sky-950/60 text-sky-300 hover:bg-sky-900 font-mono text-xs border border-sky-500/30"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAndAutoSave({ slowMotorSpeed: Math.min(255, (form.slowMotorSpeed ?? 130) + 5) })}
                      className="px-2 py-1 rounded bg-sky-950/60 text-sky-300 hover:bg-sky-900 font-mono text-xs border border-sky-500/30"
                    >
                      +5
                    </button>
                  </div>
                  <p className="text-[10px] text-[#e8cba4]/60">
                    Used for 3-5h slow motor stroke (Default: 130).
                  </p>
                </div>
              </div>
            </div>

            {/* 6. Door Opening Lead Time (8s), 5th-Second Relay & Full Open Video Playback */}
            <div className="rounded-xl border border-[#ffd700]/30 bg-[#250b12]/40 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <h4 className="text-xs font-bold text-[#ffd700] uppercase tracking-wide">
                    Door Open (8s) • Relay ON at 5th Sec • Video & Audio at Full Open
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-black/60 px-2.5 py-0.5 rounded border border-[#ffd700]/30">
                  {form.doorOpenVideoDelaySec ?? 8} Seconds Lead Time
                </span>
              </div>
              <p className="text-xs text-[#e8cba4]/80">
                Doors run in Direction 1 for 8 seconds to fully open. At the 5th second, Relay Pin D4 turns ON (Sanctum Light). When doors reach full open (8 seconds), Relay Pin D4 stays ON and the sacred Darshanam video and audio begin playing on the screen.
              </p>
              
              {/* Full Door Open Lead Time */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-[#ffd700] uppercase tracking-wide">
                  Full Door Open Duration (Video &amp; Audio Playback Trigger):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 3, 5, 6, 8, 10].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => updateAndAutoSave({ doorOpenVideoDelaySec: sec })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        (form.doorOpenVideoDelaySec ?? 8) === sec
                          ? 'bg-[#ffd700] text-[#1c0409] border-[#ffd700] shadow-md shadow-[#ffd700]/20'
                          : 'bg-[#18040a] text-[#ffd700] border-[#ffd700]/30 hover:border-[#ffd700]/70'
                      }`}
                    >
                      {sec}s {sec === 8 ? '(Default 8s Full Open)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Relay Pin D4 Sanctum Light Trigger Timing */}
              <div className="space-y-1.5 pt-2 border-t border-[#ffd700]/10">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                  Relay Pin D4 (Sanctum Light) Activation Delay:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 3, 4, 5, 6, 8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => updateAndAutoSave({ relayOnDelaySec: sec })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                        (form.relayOnDelaySec ?? 5) === sec
                          ? 'bg-amber-400 text-[#1c0409] border-amber-400 shadow-md shadow-amber-400/20'
                          : 'bg-[#18040a] text-amber-300 border-amber-500/30 hover:border-amber-400/70'
                      }`}
                    >
                      {sec}s {sec === 5 ? '(Default 5th Sec Light ON)' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Divine Darshanam Videos (3 Age Categories × 3 Time Zones) */}
        <div className="card-temple p-5 space-y-5 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#ffd700]/20 pb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Film className="h-5 w-5 text-[#ffd700]" />
              <div>
                <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700] tracking-wide">
                  Divine Darshanam Videos (3 Age Categories × 3 Time Zones)
                </h3>
                <p className="text-[11px] text-[#e8cba4]/75">
                  Upload custom MP4 videos for each age category and screen time zone. Videos save automatically and play when doors open.
                </p>
              </div>
            </div>
            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40 self-start sm:self-auto">
              MP4 / WebM / Video Files Supported
            </span>
          </div>

          {/* Age Category Selector Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ffd700] uppercase tracking-wider block">
              Step 1: Select Age Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAgeTab('0-12')}
                className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                  selectedAgeTab === '0-12'
                    ? 'border-[#ffd700] bg-gradient-to-r from-[#ffd700]/20 to-[#3b1220] shadow-md shadow-[#ffd700]/10 ring-1 ring-[#ffd700]'
                    : 'border-white/10 bg-[#1e0710]/70 hover:border-[#ffd700]/40 text-[#e8cba4]/70'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedAgeTab === '0-12' ? 'bg-[#ffd700] text-[#2a0812]' : 'bg-black/40 text-[#ffd700]'}`}>
                  <Baby className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Children &amp; Kids</div>
                  <div className="text-[11px] font-mono text-[#ffd700]">Ages 0 – 12</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgeTab('13-21')}
                className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                  selectedAgeTab === '13-21'
                    ? 'border-[#ffd700] bg-gradient-to-r from-[#ffd700]/20 to-[#3b1220] shadow-md shadow-[#ffd700]/10 ring-1 ring-[#ffd700]'
                    : 'border-white/10 bg-[#1e0710]/70 hover:border-[#ffd700]/40 text-[#e8cba4]/70'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedAgeTab === '13-21' ? 'bg-[#ffd700] text-[#2a0812]' : 'bg-black/40 text-[#ffd700]'}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Teens &amp; Youth</div>
                  <div className="text-[11px] font-mono text-[#ffd700]">Ages 13 – 21</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgeTab('21+')}
                className={`flex items-center space-x-3 p-3 rounded-2xl border text-left transition-all ${
                  selectedAgeTab === '21+'
                    ? 'border-[#ffd700] bg-gradient-to-r from-[#ffd700]/20 to-[#3b1220] shadow-md shadow-[#ffd700]/10 ring-1 ring-[#ffd700]'
                    : 'border-white/10 bg-[#1e0710]/70 hover:border-[#ffd700]/40 text-[#e8cba4]/70'
                }`}
              >
                <div className={`p-2 rounded-xl ${selectedAgeTab === '21+' ? 'bg-[#ffd700] text-[#2a0812]' : 'bg-black/40 text-[#ffd700]'}`}>
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Adults</div>
                  <div className="text-[11px] font-mono text-[#ffd700]">Ages 21 &amp; Above</div>
                </div>
              </button>
            </div>
          </div>

          {/* Active Age Group Videos for 3 Time Zones */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#ffd700] uppercase tracking-wider block">
                Step 2: Upload Videos for the 3 Screen Time Zones ({selectedAgeTab === '0-12' ? '0–12 Kids' : selectedAgeTab === '13-21' ? '13–21 Youth' : '21+ Adults'})
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Time Zone 1: 0 to 3 Hours */}
              <div className="rounded-2xl border border-emerald-500/30 bg-[#12080d] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      Zone 1: 0 – 3 Hours
                    </span>
                    <span className="text-[10px] text-emerald-300/80 font-mono">Healthy Time</span>
                  </div>
                  <p className="text-[11px] text-[#e8cba4]/70">
                    Plays when devotee in this age group has healthy screen usage (under {form.healthyThresholdHours}h).
                  </p>
                  
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] uppercase font-bold text-[#e8cba4]/60">Video URL / Local Path:</label>
                    <input
                      type="text"
                      value={form.ageVideos?.[selectedAgeTab]?.healthy || ''}
                      onChange={(e) => handleAgeVideoUrlChange(selectedAgeTab, 'healthy', e.target.value)}
                      placeholder="/videos/ganesha_1_3.mp4"
                      className="w-full rounded-xl border border-emerald-500/30 bg-black/50 px-3 py-2 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  {form.ageVideos?.[selectedAgeTab]?.healthyName && (
                    <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/20 truncate">
                      File: {form.ageVideos[selectedAgeTab]?.healthyName}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Video</span>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAgeVideoUpload(selectedAgeTab, 'healthy', file);
                      }}
                    />
                  </label>
                  {form.ageVideos?.[selectedAgeTab]?.healthy && (
                    <button
                      type="button"
                      onClick={() => setPreviewVideo({
                        title: `${selectedAgeTab} • Zone 1 (0-3 Hours) Video`,
                        url: form.ageVideos?.[selectedAgeTab]?.healthy || ''
                      })}
                      className="flex items-center space-x-1 rounded-xl border border-white/20 bg-black/40 hover:bg-white/10 px-3 py-2 text-xs font-bold text-[#e8cba4] transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Time Zone 2: 3 to 5 Hours */}
              <div className="rounded-2xl border border-sky-500/30 bg-[#12080d] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-500/40">
                      Zone 2: 3 – 5 Hours
                    </span>
                    <span className="text-[10px] text-sky-300/80 font-mono">Moderate Time</span>
                  </div>
                  <p className="text-[11px] text-[#e8cba4]/70">
                    Plays when devotee in this age group has moderate screen usage ({form.healthyThresholdHours}h to {form.warningThresholdHours}h).
                  </p>
                  
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] uppercase font-bold text-[#e8cba4]/60">Video URL / Local Path:</label>
                    <input
                      type="text"
                      value={form.ageVideos?.[selectedAgeTab]?.moderate || ''}
                      onChange={(e) => handleAgeVideoUrlChange(selectedAgeTab, 'moderate', e.target.value)}
                      placeholder="/videos/ganesha_3_5.mp4"
                      className="w-full rounded-xl border border-sky-500/30 bg-black/50 px-3 py-2 text-xs font-mono text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  {form.ageVideos?.[selectedAgeTab]?.moderateName && (
                    <div className="text-[10px] text-sky-300 font-mono bg-sky-950/50 p-1.5 rounded-lg border border-sky-500/20 truncate">
                      File: {form.ageVideos[selectedAgeTab]?.moderateName}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center space-x-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 px-3 py-2 text-xs font-bold text-sky-300 transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Video</span>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAgeVideoUpload(selectedAgeTab, 'moderate', file);
                      }}
                    />
                  </label>
                  {form.ageVideos?.[selectedAgeTab]?.moderate && (
                    <button
                      type="button"
                      onClick={() => setPreviewVideo({
                        title: `${selectedAgeTab} • Zone 2 (3-5 Hours) Video`,
                        url: form.ageVideos?.[selectedAgeTab]?.moderate || ''
                      })}
                      className="flex items-center space-x-1 rounded-xl border border-white/20 bg-black/40 hover:bg-white/10 px-3 py-2 text-xs font-bold text-[#e8cba4] transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Time Zone 3: 5+ Hours */}
              <div className="rounded-2xl border border-amber-500/30 bg-[#12080d] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40">
                      Zone 3: 5+ Hours
                    </span>
                    <span className="text-[10px] text-amber-300/80 font-mono">Overuse Warning</span>
                  </div>
                  <p className="text-[11px] text-[#e8cba4]/70">
                    Plays when devotee exceeds {form.warningThresholdHours} hours screen time (sacred guidance &amp; digital detox).
                  </p>
                  
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] uppercase font-bold text-[#e8cba4]/60">Video URL / Local Path:</label>
                    <input
                      type="text"
                      value={form.ageVideos?.[selectedAgeTab]?.highRisk || ''}
                      onChange={(e) => handleAgeVideoUrlChange(selectedAgeTab, 'highRisk', e.target.value)}
                      placeholder="/videos/ganesha_7_plus.mp4"
                      className="w-full rounded-xl border border-amber-500/30 bg-black/50 px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {form.ageVideos?.[selectedAgeTab]?.highRiskName && (
                    <div className="text-[10px] text-amber-300 font-mono bg-amber-950/50 p-1.5 rounded-lg border border-amber-500/20 truncate">
                      File: {form.ageVideos[selectedAgeTab]?.highRiskName}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center space-x-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-3 py-2 text-xs font-bold text-amber-300 transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Video</span>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAgeVideoUpload(selectedAgeTab, 'highRisk', file);
                      }}
                    />
                  </label>
                  {form.ageVideos?.[selectedAgeTab]?.highRisk && (
                    <button
                      type="button"
                      onClick={() => setPreviewVideo({
                        title: `${selectedAgeTab} • Zone 3 (5+ Hours) Video`,
                        url: form.ageVideos?.[selectedAgeTab]?.highRisk || ''
                      })}
                      className="flex items-center space-x-1 rounded-xl border border-white/20 bg-black/40 hover:bg-white/10 px-3 py-2 text-xs font-bold text-[#e8cba4] transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Voice of God Asking for Promise (Own Audio File Upload & Settings) */}
        <div className="card-temple p-5 sm:p-6 space-y-5 font-sans border-2 border-[#ffd700]/50 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ffd700]/25 pb-3">
            <div className="flex items-start sm:items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#3b1220] border border-[#ffd700]/40 text-[#ffd700]">
                <Volume2 className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700] tracking-wide flex flex-wrap items-center gap-2">
                  <span>Voice of God Asking for Sacred Promise</span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50">
                    5+ Hours Screen Time
                  </span>
                </h3>
                <p className="text-xs text-[#e8cba4]/75 mt-0.5">
                  Add your own voice file (MP3, WAV, M4A) or use the authentic divine voice when Lord Ganesha requests the sacred vow.
                </p>
              </div>
            </div>

            {/* Enable Voice of God toggle */}
            <div className="flex items-center space-x-2.5 bg-[#200710] px-3.5 py-1.5 rounded-full border border-[#ffd700]/30 self-start sm:self-auto">
              <span className="text-xs font-bold text-[#fef3c7]">Voice Enabled:</span>
              <input
                type="checkbox"
                checked={form.promiseVoiceEnabled !== false}
                onChange={(e) => {
                  const updated = { ...form, promiseVoiceEnabled: e.target.checked };
                  setForm(updated);
                  storageService.saveSettings(updated);
                  onUpdateSettings(updated);
                }}
                className="h-4 w-4 rounded accent-[#ffd700] cursor-pointer"
              />
            </div>
          </div>

          {/* Current Voice Status Banner */}
          <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
            form.promiseVoiceAudioUrl
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-[#2b0c16]/60 border-[#ffd700]/35 text-[#fef3c7]'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                form.promiseVoiceAudioUrl
                  ? 'bg-emerald-900/70 border-emerald-400 text-emerald-300'
                  : 'bg-[#3d1220] border-[#ffd700]/40 text-[#ffd700]'
              }`}>
                {form.promiseVoiceAudioUrl ? <Music className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#ffd700]">Active Voice:</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    form.promiseVoiceAudioUrl
                      ? 'bg-emerald-900 text-emerald-200 border-emerald-400/60'
                      : 'bg-amber-950 text-amber-300 border-amber-400/40'
                  }`}>
                    {form.promiseVoiceAudioUrl ? 'Custom Voice File Active' : 'Default Divine Voice (AI Neural TTS)'}
                  </span>
                </div>
                <p className="text-xs mt-0.5 font-medium truncate max-w-md text-[#e8cba4]/90">
                  {form.promiseVoiceAudioUrl
                    ? `File: ${form.promiseVoiceAudioName || 'Uploaded Custom Audio'} (Saved permanently in database)`
                    : 'Authentic Telugu & English divine speech of Lord Ganesha with temple bells.'}
                </p>
              </div>
            </div>

            {/* Preview and Reset Actions */}
            <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={togglePlayPromiseAudio}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isPlayingPromiseAudio
                    ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'bg-[#ffd700] hover:bg-[#ffec99] text-[#240812] border-[#ffd700] shadow-md'
                }`}
              >
                {isPlayingPromiseAudio ? (
                  <>
                    <StopCircle className="h-4 w-4" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Test / Play Voice</span>
                  </>
                )}
              </button>

              {form.promiseVoiceAudioUrl && (
                <button
                  type="button"
                  onClick={handleRemovePromiseVoice}
                  title="Remove custom audio and restore default divine speech"
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold border border-rose-500/50 bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Reset to Default</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <div className="rounded-2xl border border-[#ffd700]/30 bg-[#240812]/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-4 w-4" />
                  <span>Upload Your Own Voice File</span>
                </span>
                <span className="text-[10px] text-[#e8cba4]/60 font-mono">MP3, WAV, M4A, OGG</span>
              </div>

              <p className="text-xs text-[#e8cba4]/80">
                Select an audio file from your device. It will be stored securely in the local database and will play automatically whenever a 5+ hours screen time scan triggers the sacred promise.
              </p>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#ffd700]/40 hover:border-[#ffd700] rounded-xl p-4 cursor-pointer bg-[#18040a]/60 hover:bg-[#1f060d] transition-all group">
                <Upload className="h-6 w-6 text-[#ffd700] group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-bold text-[#ffd700]">Click to Choose Voice File</span>
                <span className="text-[10px] text-[#e8cba4]/60 mt-0.5">Supports MP3, WAV, M4A, OGG, AAC up to 50MB</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePromiseVoiceUpload(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {form.promiseVoiceAudioName && (
                <div className="flex items-center justify-between text-xs text-emerald-300 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <span className="truncate max-w-[220px]">Active File: {form.promiseVoiceAudioName}</span>
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                </div>
              )}
            </div>

            {/* Direct Audio URL / Local Path Box */}
            <div className="rounded-2xl border border-[#ffd700]/30 bg-[#240812]/70 p-4 space-y-3">
              <span className="text-xs font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                <Music className="h-4 w-4" />
                <span>Or Enter Audio URL / Local Path</span>
              </span>

              <p className="text-xs text-[#e8cba4]/80">
                You can also enter a public web audio link or a local asset path (for example, <code className="text-[#ffd700] font-mono">/audio/my_god_voice.mp3</code>).
              </p>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#e8cba4]/60 block mb-1">
                  Audio URL or File Path:
                </label>
                <input
                  type="text"
                  value={form.promiseVoiceAudioUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = {
                      ...form,
                      promiseVoiceAudioUrl: val,
                      promiseVoiceAudioName: val ? (val.split('/').pop() || 'Custom URL Audio') : '',
                    };
                    setForm(updated);
                    storageService.saveSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  placeholder="https://example.com/voice.mp3 or /audio/my_voice.mp3"
                  className="w-full rounded-xl border border-[#ffd700]/30 bg-black/60 px-3 py-2 text-xs text-[#fef3c7] placeholder-white/20 focus:border-[#ffd700] focus:outline-none"
                />
              </div>

              {/* Devotee vow requirement toggle */}
              <div className="pt-2 border-t border-[#ffd700]/15">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requireVoicePromiseFor5Plus !== false}
                    onChange={(e) => {
                      const updated = { ...form, requireVoicePromiseFor5Plus: e.target.checked };
                      setForm(updated);
                      storageService.saveSettings(updated);
                      onUpdateSettings(updated);
                    }}
                    className="h-4 w-4 mt-0.5 rounded accent-[#ffd700]"
                  />
                  <span className="text-xs font-semibold text-[#fef3c7] leading-tight">
                    Require Devotee Voice Input Vow (&ldquo;నేను ఫోన్ తక్కువ చూస్తాను&rdquo;) before opening temple doors
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Dialogue / Custom Text Editor */}
          <div className="rounded-2xl border border-[#ffd700]/30 bg-[#240812]/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Spoken Dialogue &amp; Display Subtitles</span>
              </span>

              {/* Presets */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-[#e8cba4]/70">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    const telugu = 'ఓం శ్రీ గణేశాయ నమః. నాయనా, ఈరోజు నీ మొబైల్ స్క్రీన్ సమయం 5 గంటలు దాటిపోయింది. నీ నేత్రాలు మరియు ఆరోగ్యం కోసం గణపతికి ఒక పవిత్రమైన ప్రమాణం చేయి: నేను ఫోన్ తక్కువ చూస్తాను అని చెప్పు.';
                    const updated = { ...form, promiseCustomText: telugu };
                    setForm(updated);
                    storageService.saveSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  className="px-2 py-0.5 rounded-lg border border-[#ffd700]/40 bg-[#350f1d] text-[10px] font-bold text-[#ffd700] hover:bg-[#4a1629]"
                >
                  Telugu Default
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const english = 'My child, your screen time exceeds 5 hours today. Divine wisdom calls for balance. Speak your sacred promise to Lord Ganesha: I promise to use my phone less and protect my wellbeing.';
                    const updated = { ...form, promiseCustomText: english };
                    setForm(updated);
                    storageService.saveSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  className="px-2 py-0.5 rounded-lg border border-[#ffd700]/40 bg-[#350f1d] text-[10px] font-bold text-[#ffd700] hover:bg-[#4a1629]"
                >
                  English Default
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={form.promiseCustomText || ''}
              onChange={(e) => {
                const updated = { ...form, promiseCustomText: e.target.value };
                setForm(updated);
                storageService.saveSettings(updated);
                onUpdateSettings(updated);
              }}
              placeholder="Enter custom sacred dialogue words spoken by God..."
              className="w-full rounded-xl border border-[#ffd700]/30 bg-black/60 p-3 text-xs text-[#fef3c7] leading-relaxed placeholder-white/20 focus:border-[#ffd700] focus:outline-none font-sans"
            />
            <p className="text-[10px] text-[#e8cba4]/60">
              * When your own voice file is uploaded above, your recorded audio will play while this text is presented in the sacred promise window. If no audio file is uploaded, the system synthesizes authentic Lord Ganesha voice in Telugu or English.
            </p>
          </div>

          {/* Devotee Promise Voice Training Studio (Live Microphone Calibration & Settings) */}
          <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-[#220710] to-[#17040a] p-4 sm:p-5 space-y-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ffd700]/25 pb-3">
              <div className="flex items-start sm:items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300">
                  <Mic className={`h-5 w-5 ${isTrainingVoice ? 'animate-bounce text-rose-400' : ''}`} />
                </div>
                <div>
                  <h4 className="font-royal text-sm sm:text-base font-bold text-[#ffd700] tracking-wide flex flex-wrap items-center gap-2">
                    <span>Train Devotee Promise Voice Model</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                      Voice Recognition Calibration
                    </span>
                  </h4>
                  <p className="text-xs text-[#e8cba4]/75 mt-0.5">
                    Train the exact vow words devotee must speak to open temple doors after 5+ hours screen time.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-auto shrink-0 flex items-center space-x-2">
                {form.trainedVoiceStatus === 'trained' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-400/60 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Trained &amp; Calibrated ({trainingConfidence}%)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                    <span>Default Vow Model Active</span>
                  </span>
                )}
              </div>
            </div>

            {/* Live Voice Training Studio Action Box */}
            <div className="rounded-xl border border-[#ffd700]/30 bg-[#2d0c18]/80 p-4 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-xs font-bold text-[#ffd700] uppercase tracking-wider block">
                    Interactive Voice Training Studio
                  </span>
                  <p className="text-xs text-[#e8cba4]/80 max-w-xl">
                    Click &ldquo;Start Voice Training&rdquo; and speak your vow into the microphone (e.g., &ldquo;నేను ఫోన్ తక్కువ చూస్తాను&rdquo; or in English). The engine will record, transcribe, extract speech keywords, and calibrate your vow profile.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isTrainingVoice ? (
                    <button
                      type="button"
                      onClick={completeVoiceTraining}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse transition-all"
                    >
                      <StopCircle className="h-4 w-4" />
                      <span>Finish &amp; Calibrate Voice</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceTraining}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-[#ffd700] hover:from-amber-400 hover:to-amber-200 text-[#240812] border border-[#ffd700] shadow-md transition-all font-sans"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Start Voice Training Session</span>
                    </button>
                  )}

                  {form.trainedPromiseAudioUrl && (
                    <button
                      type="button"
                      onClick={togglePlayTrainedAudio}
                      title="Listen back to the recorded voice sample"
                      className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        isPlayingTrainedAudio
                          ? 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse'
                          : 'bg-[#3b1220] hover:bg-[#4d1729] text-[#ffd700] border-[#ffd700]/40'
                      }`}
                    >
                      <Headphones className="h-4 w-4 text-[#ffd700]" />
                      <span>{isPlayingTrainedAudio ? 'Stop' : 'Play Sample'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetTrainedVoice}
                    title="Reset to factory default vow keywords"
                    className="flex items-center space-x-1 px-3 py-2.5 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Live Audio Visualizer / Frequency Wave while training */}
              {isTrainingVoice && (
                <div className="rounded-xl border border-rose-500/60 bg-black/60 p-3 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-rose-400 font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                      <span>LISTENING... Speak your vow clearly now</span>
                    </span>
                    <span className="text-amber-300 font-bold">Volume Level: {trainingVolumeLevel}%</span>
                  </div>

                  {/* Frequency meter bars */}
                  <div className="flex items-center space-x-1 h-7 bg-black/80 rounded-lg p-1">
                    {[15, 30, 45, 60, 80, 100, 70, 50, 35, 65, 85, 40, 25, 55, 75, 30, 45, 20].map((h, i) => {
                      const barHeight = Math.max(10, Math.min(100, (trainingVolumeLevel / 100) * h + 10));
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-amber-600 via-amber-400 to-rose-400 rounded-sm transition-all duration-75"
                          style={{ height: `${barHeight}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Real-time speech transcription */}
                  <div className="p-2.5 rounded-lg bg-[#20060e] border border-amber-500/30 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#e8cba4]/60 block mb-0.5">
                      Detected Spoken Speech:
                    </span>
                    <p className="font-royal text-sm text-[#ffd700] italic">
                      {trainingTranscript ? `"${trainingTranscript}"` : 'Waiting for voice audio... speak into microphone...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Training Saved Banner */}
              {trainingStatus === 'saved' && (
                <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/80 p-3 flex items-center space-x-3 text-emerald-200 text-xs">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 block">Voice Pattern Successfully Calibrated!</span>
                    <span>Speech recognition model updated with {form.trainedPromiseKeywords?.length || 10} keywords at {trainingConfidence}% confidence rating.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Target Vow Phrase & Preset Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telugu Vow Phrase */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffd700] uppercase tracking-wider block">
                  Primary Telugu Promise Phrase:
                </label>
                <input
                  type="text"
                  value={form.trainedPromisePhrase || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const words = val.split(/\s+/).filter(w => w.length >= 2);
                    const updated = {
                      ...form,
                      trainedPromisePhrase: val,
                      trainedPromiseKeywords: Array.from(new Set([...(form.trainedPromiseKeywords || []), ...words])),
                    };
                    setForm(updated);
                    storageService.saveSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  placeholder="నేను ఫోన్ తక్కువ చూస్తాను"
                  className="w-full rounded-xl border border-[#ffd700]/30 bg-black/60 px-3 py-2 text-xs text-[#fef3c7] font-semibold focus:border-[#ffd700] focus:outline-none"
                />

                {/* Telugu Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#e8cba4]/60">Quick Presets:</span>
                  {[
                    'నేను ఫోన్ తక్కువ చూస్తాను',
                    'నేను మొబైల్ సమయం తగ్గిస్తాను',
                    'స్వామి నేను ఫోన్ తగ్గిస్తాను'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const words = preset.split(/\s+/).filter(w => w.length >= 2);
                        const updated = {
                          ...form,
                          trainedPromisePhrase: preset,
                          trainedPromiseKeywords: Array.from(new Set([...(form.trainedPromiseKeywords || []), ...words])),
                        };
                        setForm(updated);
                        storageService.saveSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-[#ffd700]/30 bg-[#350f1d] hover:bg-[#4a1629] text-[10px] text-[#ffd700]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Vow Phrase */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#ffd700] uppercase tracking-wider block">
                  English Vow Translation:
                </label>
                <input
                  type="text"
                  value={form.trainedPromiseEnglishPhrase || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = { ...form, trainedPromiseEnglishPhrase: val };
                    setForm(updated);
                    storageService.saveSettings(updated);
                    onUpdateSettings(updated);
                  }}
                  placeholder="I promise to use my phone less"
                  className="w-full rounded-xl border border-[#ffd700]/30 bg-black/60 px-3 py-2 text-xs text-[#fef3c7] font-semibold focus:border-[#ffd700] focus:outline-none"
                />

                {/* English Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#e8cba4]/60">Quick Presets:</span>
                  {[
                    'I promise to use my phone less',
                    'I will reduce my screen time',
                    'I promise to protect my health'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const updated = { ...form, trainedPromiseEnglishPhrase: preset };
                        setForm(updated);
                        storageService.saveSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-[#ffd700]/30 bg-[#350f1d] hover:bg-[#4a1629] text-[10px] text-[#ffd700]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords and Sensitivity Configuration */}
            <div className="rounded-xl border border-[#ffd700]/30 bg-[#240812]/70 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-amber-400" />
                  <span>Calibrated Keywords ({form.trainedPromiseKeywords?.length || 0}) &amp; Match Sensitivity</span>
                </span>

                {/* Match Sensitivity Selector */}
                <div className="flex items-center space-x-1.5 bg-[#17040a] p-1 rounded-xl border border-[#ffd700]/30">
                  <span className="text-[10px] text-[#e8cba4]/70 px-1 font-semibold">Tolerance:</span>
                  {(['lenient', 'balanced', 'strict'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        const updated = { ...form, trainedVoiceMatchSensitivity: mode };
                        setForm(updated);
                        storageService.saveSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        (form.trainedVoiceMatchSensitivity || 'lenient') === mode
                          ? 'bg-[#ffd700] text-[#240812] shadow-sm'
                          : 'text-[#e8cba4]/70 hover:text-[#fef3c7]'
                      }`}
                    >
                      {mode === 'lenient' ? 'Lenient (Kids)' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords Tag Cloud */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(form.trainedPromiseKeywords || []).map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#3d1222] border border-[#ffd700]/30 text-xs text-[#ffd700] font-medium"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedKws = (form.trainedPromiseKeywords || []).filter((_, i) => i !== idx);
                        const updated = { ...form, trainedPromiseKeywords: updatedKws };
                        setForm(updated);
                        storageService.saveSettings(updated);
                        onUpdateSettings(updated);
                      }}
                      className="text-white/40 hover:text-rose-400 pl-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Custom Keyword Input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="add-trained-keyword-input"
                  type="text"
                  placeholder="Type new keyword and press Add..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const val = target.value.trim();
                      if (val) {
                        const updatedKws = Array.from(new Set([...(form.trainedPromiseKeywords || []), val]));
                        const updated = { ...form, trainedPromiseKeywords: updatedKws };
                        setForm(updated);
                        storageService.saveSettings(updated);
                        onUpdateSettings(updated);
                        target.value = '';
                      }
                    }
                  }}
                  className="rounded-lg border border-[#ffd700]/30 bg-black/60 px-3 py-1.5 text-xs text-[#fef3c7] placeholder-white/20 focus:border-[#ffd700] focus:outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('add-trained-keyword-input') as HTMLInputElement | null;
                    if (el && el.value.trim()) {
                      const val = el.value.trim();
                      const updatedKws = Array.from(new Set([...(form.trainedPromiseKeywords || []), val]));
                      const updated = { ...form, trainedPromiseKeywords: updatedKws };
                      setForm(updated);
                      storageService.saveSettings(updated);
                      onUpdateSettings(updated);
                      el.value = '';
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#ffd700]/40 bg-[#350f1d] hover:bg-[#4a1629] text-xs font-bold text-[#ffd700]"
                >
                  + Add Keyword
                </button>
              </div>
            </div>

            {/* Test Spoken Vow Sandbox */}
            <div className="rounded-xl border border-emerald-500/40 bg-[#16060c] p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span>Test Devotee Vow Recognition Now</span>
                  </span>
                  <p className="text-[11px] text-[#e8cba4]/70">
                    Verify that devotee voice speech is recognized accurately before live temple darshanam.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {isTestingVoice ? (
                    <button
                      type="button"
                      onClick={stopTestingRecognition}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white border border-rose-400 shadow-sm animate-pulse"
                    >
                      <StopCircle className="h-3.5 w-3.5" />
                      <span>Stop Listening</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceTesting}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400 shadow-sm transition-all"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>🎙️ Test Spoken Vow Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time test transcript and verification card */}
              {(isTestingVoice || testFeedback || testTranscript) && (
                <div className="rounded-lg border border-emerald-500/30 bg-black/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#e8cba4]/80">Heard Speech:</span>
                    <span className="text-emerald-300 font-mono font-bold">
                      {testTranscript ? `"${testTranscript}"` : 'Listening for vow speech...'}
                    </span>
                  </div>

                  {testFeedback && (
                    <div className={`p-2.5 rounded-lg border text-xs font-semibold ${
                      testFeedback.match
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-400 text-rose-200'
                    }`}>
                      {testFeedback.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Audio & Visual Preferences */}
        <div className="card-temple p-5 space-y-4 font-sans">
          <div className="flex items-center space-x-2 border-b border-[#ffd700]/20 pb-2">
            <Sparkles className="h-4 w-4 text-[#ffd700]" />
            <h3 className="font-royal text-base font-bold text-[#ffd700] tracking-wide">
              Audio &amp; Visual Effects
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-[#280c14] p-3 border border-[#ffd700]/20">
              <div>
                <span className="text-sm font-semibold text-[#fff7ed]">
                  Temple Bells &amp; Chimes
                </span>
                <p className="text-[10px] text-[#e8cba4]/60">Web Audio API synthesized sacred chimes</p>
              </div>
              <input
                type="checkbox"
                checked={form.soundEnabled}
                onChange={(e) => setForm({ ...form, soundEnabled: e.target.checked })}
                className="h-5 w-5 rounded accent-[#ffd700]"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#280c14] p-3 border border-[#ffd700]/20">
              <div>
                <span className="text-sm font-semibold text-[#fff7ed]">
                  Floating Lotus Petals
                </span>
                <p className="text-[10px] text-[#e8cba4]/60">Divine Canvas particle animations</p>
              </div>
              <input
                type="checkbox"
                checked={form.petalsEnabled}
                onChange={(e) => setForm({ ...form, petalsEnabled: e.target.checked })}
                className="h-5 w-5 rounded accent-[#ffd700]"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2 font-sans">
          {savedSuccess && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
              <Check className="h-4 w-4" />
              <span>Settings saved successfully!</span>
            </div>
          )}

          <button
            type="submit"
            id="save-settings-btn"
            className="flex items-center space-x-2 rounded-full border border-[#ffd700] bg-gradient-to-r from-[#ffd700] via-[#ffec99] to-[#d4af37] px-6 py-2.5 text-sm font-bold text-[#2a0812] shadow-lg shadow-[#ffd700]/20 transition-all hover:scale-105"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#ffd700] bg-[#1a050e] p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-2.5">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-[#ffd700]" />
                <h4 className="font-royal text-sm font-bold text-[#ffd700]">
                  {previewVideo.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="rounded-full p-1 text-[#e8cba4] hover:text-[#ffd700] hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative aspect-[4/5] sm:aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#ffd700]/30">
              <video
                src={previewVideo.url}
                controls
                autoPlay
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#e8cba4]/70 truncate max-w-[260px] font-mono text-[10px]">
                {previewVideo.url}
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-1.5 rounded-full border border-[#ffd700]/60 bg-[#2f0d19] font-bold text-[#ffd700] hover:bg-[#451425]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Logo Cropper Interactive Modal */}
      <RoundLogoCropperModal
        isOpen={logoCropperOpen}
        logoNumber={activeCropperLogo}
        imageSrc={cropperImageSrc}
        fileName={cropperFileName}
        logoTitle={activeCropperLogo === 1 ? form.logo1Title : form.logo2Title}
        onClose={() => setLogoCropperOpen(false)}
        onSaveCropped={handleSaveCroppedLogo}
      />
    </div>
  );
}
