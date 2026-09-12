import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  DoorOpen,
  HeartHandshake,
  ArrowRight,
  ShieldAlert,
  Music
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DashboardSettings } from '../types';
import { soundService } from '../services/soundService';
import { ASSETS } from '../assets';
import { verifyCompleteSentence, SentenceMatchResult } from '../services/voiceSentenceMatcher';

interface SacredVoicePromiseModalProps {
  isOpen: boolean;
  screenTimeString: string;
  settings: DashboardSettings;
  soundEnabled?: boolean;
  onPromiseAccepted: () => void;
  onCancel?: () => void;
}

type ModalStage = 'god_speaking' | 'user_speaking' | 'accepted';

export function SacredVoicePromiseModal({
  isOpen,
  screenTimeString,
  settings,
  soundEnabled = true,
  onPromiseAccepted,
  onCancel,
}: SacredVoicePromiseModalProps) {
  const [currentStage, setCurrentStage] = useState<ModalStage>('god_speaking');
  const [isGodSpeaking, setIsGodSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingTrainedSample, setIsPlayingTrainedSample] = useState<boolean>(false);
  const [sentenceEval, setSentenceEval] = useState<SentenceMatchResult | null>(null);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  const trainedSampleAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech & Audio references
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasTriggeredAcceptRef = useRef<boolean>(false);
  const acceptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const speechEvaluationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup all audio and timers
  const cleanupAudio = () => {
    if (acceptTimerRef.current) {
      clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }

    if (speechEvaluationDebounceRef.current) {
      clearTimeout(speechEvaluationDebounceRef.current);
      speechEvaluationDebounceRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (trainedSampleAudioRef.current) {
      try {
        trainedSampleAudioRef.current.pause();
      } catch {}
      trainedSampleAudioRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  // Stage 2: Divine Voice of God asking for promise
  const startGodSpeakingStage = () => {
    if (!activeRef.current) return;
    setCurrentStage('god_speaking');
    setIsGodSpeaking(true);
    soundService.stopSpeech();

    soundService.playGodPromiseVoice(
      settings,
      () => setIsGodSpeaking(true),
      () => {
        if (!activeRef.current) return;
        setIsGodSpeaking(false);
        // Automatically proceed to user voice input stage
        startListeningStage();
      }
    );
  };

  // Stage 3: Listen for User's Voice Input
  const startListeningStage = async () => {
    if (!activeRef.current || hasTriggeredAcceptRef.current) return;
    setCurrentStage('user_speaking');
    setIsGodSpeaking(false);
    setIsListening(true);
    setMicError(null);
    setCompletionNotice(null);

    const targetTelugu = settings.trainedPromisePhrase || 'నేను ఫోన్ తక్కువ చూస్తాను';
    const targetEnglish = settings.trainedPromiseEnglishPhrase || 'I promise to use my phone less';

    // Initialize full sentence word breakdown
    const initialEval = verifyCompleteSentence('', targetTelugu, targetEnglish);
    setSentenceEval(initialEval);

    // 1. Web Speech Recognition for Telugu & English with full sentence enforcement
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        // Listen in Indian locale for dual Telugu / English speech detection
        recognition.lang = settings.language === 'en' ? 'en-IN' : 'te-IN';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res && res[0]) {
              currentTranscript += ' ' + res[0].transcript;
            }
          }
          const text = currentTranscript.trim();
          if (text) {
            setVoiceTranscript(text);

            const evalResult = verifyCompleteSentence(text, targetTelugu, targetEnglish);
            setSentenceEval(evalResult);

            if (speechEvaluationDebounceRef.current) {
              clearTimeout(speechEvaluationDebounceRef.current);
            }

            // Strictly enforce:
            // "only after i complete the total sentce i need to reco if one word miss should stop"
            if (evalResult.isComplete) {
              setCompletionNotice('✅ Full sacred sentence recognized perfectly! All words verified.');
              speechEvaluationDebounceRef.current = setTimeout(() => {
                if (!hasTriggeredAcceptRef.current) {
                  acceptPromise(text);
                }
              }, 700);
            } else {
              // Wait for user to finish speaking. If they stop with missing words, alert them:
              speechEvaluationDebounceRef.current = setTimeout(() => {
                if (hasTriggeredAcceptRef.current) return;
                const missingList = evalResult.missingWords.join(', ');
                setCompletionNotice(
                  `⚠️ Incomplete Sentence! Missing word${evalResult.missingWords.length > 1 ? 's' : ''}: "${missingList}". Please speak the complete sentence.`
                );
              }, 1400);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission needed. You may also click "Confirm Sacred Vow" below.');
          }
        };

        recognition.onend = () => {
          if (activeRef.current && isListening && !hasTriggeredAcceptRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    }

    // 2. Web Audio Analyser (Voice sound meter visualization ONLY - NO false volume auto-accept)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!activeRef.current || hasTriggeredAcceptRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        mediaStreamRef.current = stream;

        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const checkVolume = () => {
            if (!activeRef.current || hasTriggeredAcceptRef.current) return;
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setVoiceVolumeLevel(normalized);

            animationFrameRef.current = requestAnimationFrame(checkVolume);
          };

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        }
      } catch {
        setMicError('Microphone unavailable in iframe. Please tap the Confirm Vow button.');
      }
    }
  };

  // Stage 4: Devotee Voice Input Accepted -> Door Opens
  const acceptPromise = (customText?: string) => {
    if (!activeRef.current || hasTriggeredAcceptRef.current) return;
    hasTriggeredAcceptRef.current = true;

    cleanupAudio();
    setIsListening(false);
    setIsGodSpeaking(false);
    setCurrentStage('accepted');

    if (customText) {
      setVoiceTranscript(customText);
    }

    // Sacred confetti celebration
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffd700', '#f59e0b', '#10b981', '#ffffff', '#ec4899'],
    });

    if (soundEnabled) {
      soundService.playPromiseAcceptedBlessing();
    }

    // The scanner sends the single five-second command after this acceptance.
    acceptTimerRef.current = setTimeout(() => {
      if (activeRef.current) onPromiseAccepted();
    }, 2200);
  };

  // Initialize sequence when modal opens
  useEffect(() => {
    activeRef.current = isOpen;
    if (!isOpen) {
      cleanupAudio();
      setCurrentStage('god_speaking');
      hasTriggeredAcceptRef.current = false;
      setVoiceTranscript('');
      return;
    }

    hasTriggeredAcceptRef.current = false;
    setVoiceTranscript('');

    // The scanner opens this modal only after the first five-second motion completes.
    startGodSpeakingStage();

    return () => {
      activeRef.current = false;
      cleanupAudio();
      soundService.stopSpeech();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl border-2 border-[#ffd700] bg-gradient-to-b from-[#250813] via-[#1a050d] to-[#120206] p-5 sm:p-6 text-center text-[#fbe2b5] shadow-[0_0_50px_rgba(255,215,0,0.4)] overflow-hidden font-sans"
        >
          {/* Subtle Divine Ray Background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,215,0,0.2)_0%,transparent_70%)]" />

          {/* Top Temple Header & Overuse Warning Pill */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#ffd700]/25 pb-3">
            <div className="flex items-center space-x-1.5 text-xs text-rose-300 font-bold bg-rose-950/90 px-3 py-1 rounded-full border border-rose-500/60 shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              <span>5+ Hours Excessive Screen Time</span>
            </div>

            <div className="flex items-center space-x-1 text-xs font-mono text-[#ffd700] bg-[#33101d] px-2.5 py-1 rounded-full border border-[#ffd700]/40">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>{screenTimeString} Detected</span>
            </div>
          </div>

          {/* 3-Step Sequence Stepper Indicator */}
          <div className="relative z-10 mt-3 grid grid-cols-3 gap-1 text-[11px] font-bold">
            <div
              className="flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 border border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
            >
              <span>1. Opened for 5s</span>
            </div>

            <div
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 border transition-all ${
                currentStage === 'god_speaking'
                  ? 'border-[#ffd700] bg-[#421422] text-[#ffd700] shadow-md animate-pulse'
                  : currentStage === 'user_speaking' || currentStage === 'accepted'
                  ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                  : 'border-stone-800 bg-stone-900/40 text-stone-500'
              }`}
            >
              <span>2. God Asks Vow</span>
            </div>

            <div
              className={`flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 border transition-all ${
                currentStage === 'user_speaking'
                  ? 'border-rose-400 bg-rose-950/80 text-rose-300 shadow-md animate-pulse'
                  : currentStage === 'accepted'
                  ? 'border-emerald-400 bg-emerald-900 text-emerald-200 shadow-md'
                  : 'border-stone-800 bg-stone-900/40 text-stone-500'
              }`}
            >
              <span>3. Voice Input & Open</span>
            </div>
          </div>

          {/* Deity Portrait with Golden Aura */}
          <div className="relative z-10 my-3 flex flex-col items-center">
            <div className="relative">
              {(isGodSpeaking || isListening) && (
                <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500 via-[#ffd700] to-rose-500 opacity-45 blur-md animate-pulse" />
              )}

              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 border-[#ffd700] bg-[#360e1d] p-1 shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                <img
                  src={ASSETS.ganeshaLotus}
                  alt="Lord Ganesha"
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ffd700] bg-[#1a050d] text-[#ffd700] shadow-md">
                {currentStage === 'accepted' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-bounce" />
                ) : isGodSpeaking ? (
                  <Volume2 className="h-4 w-4 text-[#ffd700] animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4 text-rose-400 animate-pulse" />
                )}
              </div>
            </div>

            <h2 className="mt-2 font-royal text-xl sm:text-2xl font-bold tracking-wide text-[#ffd700] drop-shadow-sm">
              Sacred Promise to Lord Ganesha
            </h2>
            <p className="text-xs text-[#e8cba4] mt-0.5 max-w-sm">
              Devotees above 5 hours must speak a sacred promise to open the divine temple doors.
            </p>
          </div>

          {/* Voice of God Speaking Card */}
          <div className="relative z-10 rounded-2xl border border-[#ffd700]/50 bg-[#17040b] p-3.5 text-center space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#ffd700]">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Voice of God Asking for Promise:</span>
              </span>
              <button
                type="button"
                onClick={startGodSpeakingStage}
                className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full border border-[#ffd700]/50 bg-[#2b0c16] text-[10px] text-[#ffd700] hover:bg-[#3d1220] transition-colors"
                title="Replay divine voice of God"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Play Voice of God</span>
              </button>
            </div>

            {settings?.promiseVoiceAudioUrl && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 font-semibold">
                <Music className="h-3 w-3 text-emerald-400" />
                <span>Custom Voice File Active: {settings.promiseVoiceAudioName || 'Uploaded Voice Audio'}</span>
              </div>
            )}

            {/* Telugu text */}
            <p className="font-royal text-xs sm:text-sm font-semibold text-[#fef3c7] leading-relaxed italic">
              &ldquo;
              {settings.promiseCustomText ||
                'ఓం శ్రీ గణేశాయ నమః. నాయనా, ఈరోజు నీ మొబైల్ స్క్రీన్ సమయం 5 గంటలు దాటిపోయింది. నీ ఆరోగ్యం మరియు సమతుల్యత కోసం గణపతికి ఒక పవిత్రమైన ప్రమాణం చేయి: నేను ఫోన్ తక్కువ చూస్తాను అని చెప్పు.'}
              &rdquo;
            </p>

            {/* English translation */}
            <p className="text-[11px] text-[#e8cba4]/80 italic">
              &ldquo;My child, your screen time exceeds 5 hours today. For your wellbeing, make a sacred promise to Lord Ganesha: Say 'I promise to use my phone less'.&rdquo;
            </p>

            {isGodSpeaking && (
              <div className="flex items-center justify-center space-x-1 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-amber-300">
                  {settings?.promiseVoiceAudioUrl
                    ? 'Playing Your Custom Voice File... Listen Carefully'
                    : 'Divine Voice Speaking... Listen Carefully'}
                </span>
              </div>
            )}
          </div>

          {/* Stage 3 & 4: User Voice Input Area */}
          <div className="relative z-10 mt-3 space-y-3">
            {currentStage === 'accepted' ? (
              /* Promise Accepted Celebration State */
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-950/95 text-center space-y-2 shadow-[0_0_35px_rgba(16,185,129,0.5)]"
              >
                <div className="flex items-center justify-center space-x-2 text-emerald-300 font-bold text-base font-royal">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Sacred Promise Accepted by Lord Ganesha!</span>
                </div>
                <p className="text-xs text-emerald-100 font-medium">
                  {voiceTranscript ? `"${voiceTranscript}"` : 'నేను ఫోన్ తక్కువ చూస్తాను (I promise to use phone less)'}
                </p>
                <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-400/80 bg-emerald-900 px-4 py-1.5 text-xs font-bold text-emerald-200 animate-pulse">
                  <DoorOpen className="h-4 w-4 text-[#ffd700]" />
                  <span>Arduino Command: OPEN_AFTER_PROMISE (Doors Opening 8s)!</span>
                </div>
              </motion.div>
            ) : (
              /* Voice Input Card with Specific Phrase Display */
              <div className="p-4 rounded-2xl border border-[#ffd700]/50 bg-[#1c070e] space-y-3 shadow-md">
                {/* Specific Voice Input Prompts */}
                <div className="rounded-xl border-2 border-[#ffd700] bg-gradient-to-r from-[#2c0b17] via-[#3a0f20] to-[#2c0b17] p-2.5 text-center shadow-md space-y-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-[#ffd700] uppercase tracking-wider block">
                      🗣️ Specific Voice Input to Speak:
                    </span>
                    {settings.trainedVoiceStatus === 'trained' && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-400/50">
                        ✓ Trained Voice Model Active
                      </span>
                    )}
                  </div>
                  <div className="font-royal text-base sm:text-lg font-extrabold text-[#ffd700] drop-shadow">
                    &ldquo;{settings.trainedPromisePhrase || 'నేను ఫోన్ తక్కువ చూస్తాను'}&rdquo;
                  </div>
                  <div className="text-[11px] text-[#fef3c7] font-medium">
                    (Or in English: &ldquo;{settings.trainedPromiseEnglishPhrase || 'I promise to use my phone less'}&rdquo;)
                  </div>

                  {/* Word-by-Word Sentence Progress Chips */}
                  {sentenceEval && (
                    <div className="pt-2 border-t border-[#ffd700]/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px] px-1 font-bold">
                        <span className="text-[#ffd700]/90">Sentence Completion:</span>
                        <span className={`font-mono text-xs ${
                          sentenceEval.isComplete ? 'text-emerald-300 font-extrabold' : 'text-amber-300'
                        }`}>
                          {sentenceEval.matchedCount} / {sentenceEval.totalRequiredCount} Words ({sentenceEval.completenessPercent}%)
                        </span>
                      </div>

                      {/* Word Chips */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-xl bg-black/50 border border-[#ffd700]/30">
                        {sentenceEval.wordStatuses.map((ws, i) => {
                          const isMissingAlert = completionNotice && !ws.matched;
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                ws.matched
                                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)] scale-105'
                                  : isMissingAlert
                                  ? 'bg-rose-950/90 text-rose-200 border border-rose-500/80 animate-pulse'
                                  : 'bg-[#2b0c16] text-[#e8cba4]/75 border border-[#ffd700]/25'
                              }`}
                            >
                              <span>{ws.matched ? '✓' : isMissingAlert ? '⚠️' : '○'}</span>
                              <span className="font-semibold">{ws.originalWord}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Completion or Missing Word Alert Banner */}
                      {completionNotice && (
                        <div className={`text-[11px] px-3 py-1.5 rounded-xl font-bold text-center transition-all ${
                          sentenceEval.isComplete
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-rose-950/90 text-rose-300 border border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        }`}>
                          {completionNotice}
                        </div>
                      )}
                    </div>
                  )}

                  {settings.trainedPromiseAudioUrl && (
                    <div className="pt-1 border-t border-[#ffd700]/20 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingTrainedSample) {
                            if (trainedSampleAudioRef.current) {
                              try { trainedSampleAudioRef.current.pause(); } catch {}
                              trainedSampleAudioRef.current = null;
                            }
                            setIsPlayingTrainedSample(false);
                          } else {
                            try {
                              const audio = new Audio(settings.trainedPromiseAudioUrl);
                              trainedSampleAudioRef.current = audio;
                              audio.onended = () => setIsPlayingTrainedSample(false);
                              audio.onerror = () => setIsPlayingTrainedSample(false);
                              setIsPlayingTrainedSample(true);
                              audio.play().catch(() => setIsPlayingTrainedSample(false));
                            } catch {
                              setIsPlayingTrainedSample(false);
                            }
                          }
                        }}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[10px] font-bold text-[#ffd700] transition-all"
                      >
                        <Volume2 className="h-3 w-3" />
                        <span>{isPlayingTrainedSample ? 'Stop Trained Audio' : '🔊 Hear Trained Voice Pronunciation'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center space-y-2">
                  {/* Glowing Microphone Button */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (!isListening) {
                        startListeningStage();
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full border-2 shadow-xl transition-all ${
                      isListening
                        ? 'border-rose-400 bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)]'
                        : 'border-[#ffd700] bg-[#33101d] text-[#ffd700] hover:bg-[#4a172a]'
                    }`}
                  >
                    {isListening && (
                      <span
                        className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-75"
                        style={{
                          transform: `scale(${1 + voiceVolumeLevel / 100})`,
                        }}
                      />
                    )}
                    <Mic className="h-7 w-7" />
                  </motion.button>

                  <div className="text-center">
                    <span className="text-xs font-bold text-[#ffd700] block">
                      {isListening
                        ? 'Microphone Listening... Speak the full sentence!'
                        : 'Tap Microphone to Speak Sacred Promise to God'}
                    </span>
                  </div>

                  {/* Audio Volume Equalizer Bar */}
                  {isListening && (
                    <div className="w-48 h-2 rounded-full bg-black/60 overflow-hidden border border-[#ffd700]/30 mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75 rounded-full"
                        style={{ width: `${Math.max(5, voiceVolumeLevel)}%` }}
                      />
                    </div>
                  )}

                  {/* Real-time Voice Transcript */}
                  {voiceTranscript && (
                    <div className="w-full text-center px-3 py-1.5 rounded-xl bg-black/50 border border-[#ffd700]/40 text-xs text-amber-200 italic font-semibold">
                      Spoken Vow: &ldquo;{voiceTranscript}&rdquo;
                    </div>
                  )}
                </div>

                {/* Direct Affirmation Fallback Button */}
                <div className="pt-2 border-t border-[#ffd700]/20 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => acceptPromise('నేను ఫోన్ తక్కువ చూస్తాను (I promise to use phone less)')}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <HeartHandshake className="h-4 w-4 text-emerald-300" />
                    <span>Confirm Sacred Vow: &ldquo;నేను ఫోన్ తక్కువ చూస్తాను&rdquo;</span>
                  </button>

                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-3 py-2 text-xs text-[#e8cba4]/70 hover:text-[#fff7ed] hover:underline transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {micError && (
                  <p className="text-[10px] text-amber-300/90 text-center">
                    {micError}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
