import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles,
  DoorClosed,
  DoorOpen,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { ScreenTimeCategory, CATEGORY_DETAILS, DashboardSettings, UserAgeGroup } from '../types';
import { ASSETS } from '../assets';
import { arduinoService } from '../services/arduinoService';
import { soundService } from '../services/soundService';

interface GaneshaAiVideoPlayerProps {
  category: ScreenTimeCategory;
  ageGroup?: UserAgeGroup | null;
  settings: DashboardSettings;
  autoPlay?: boolean;
  onVideoEnded?: () => void;
  customVideoSrc?: string;
  customAudioSrc?: string;
  isManualDarshanam?: boolean;
}

export function GaneshaAiVideoPlayer({
  category,
  ageGroup,
  settings,
  autoPlay = true,
  onVideoEnded,
  customVideoSrc,
  customAudioSrc,
  isManualDarshanam = false,
}: GaneshaAiVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isVideoFinished, setIsVideoFinished] = useState<boolean>(false);
  const [postVideoSecondsLeft, setPostVideoSecondsLeft] = useState<number | null>(null);

  // 8-Second Pre-Video Door Delay & 5th-Second Relay Light Activation:
  // "after door open for 8sec on relay at 5th light play video at full door open on relay and play video and its audio"
  const preVideoDelaySec = settings?.doorOpenVideoDelaySec ?? 8;
  const relayOnDelaySec = settings?.relayOnDelaySec ?? 5;
  const [preVideoMsLeft, setPreVideoMsLeft] = useState<number | null>(null);
  const [isRelayLitAt5th, setIsRelayLitAt5th] = useState<boolean>(false);
  const relayAt5thTriggeredRef = useRef<boolean>(false);

  const activeSrcRef = useRef<string | null>(null);

  const details = CATEGORY_DETAILS[category] || CATEGORY_DETAILS['1_TO_3_DAYS'];
  
  // Resolve video source (custom, manual, age-based, tier-based, or default path)
  let resolvedAgeVideo: string | null = null;
  if (ageGroup && settings.ageVideos?.[ageGroup]) {
    const ageConfig = settings.ageVideos[ageGroup];
    const isHealthy = category === '0_TO_3_HOURS' || category === '1_TO_3_DAYS' || category === 'HEALTHY';
    const isModerate = category === '3_TO_5_HOURS' || category === '3_TO_5_DAYS' || category === 'WARNING';
    const isOveruse = category === '5_PLUS_HOURS' || category === '7_PLUS_DAYS' || category === '5_TO_7_DAYS' || category === 'HIGH_RISK';

    if (isHealthy && ageConfig?.healthy) {
      resolvedAgeVideo = ageConfig.healthy;
    } else if (isModerate && ageConfig?.moderate) {
      resolvedAgeVideo = ageConfig.moderate;
    } else if (isOveruse && ageConfig?.highRisk) {
      resolvedAgeVideo = ageConfig.highRisk;
    } else if (ageConfig?.default) {
      resolvedAgeVideo = ageConfig.default;
    }
  }

  const currentVideoSrc = 
    customVideoSrc || 
    (isManualDarshanam && settings.manualDoorVideoUrl ? settings.manualDoorVideoUrl : null) ||
    resolvedAgeVideo ||
    settings.videos?.[category] || 
    settings.videoUrls?.[category] || 
    details.defaultVideoPath;

  // Resolve audio source for manual darshanam
  const currentAudioSrc = 
    customAudioSrc || 
    (isManualDarshanam && settings.manualDoorAudioUrl ? settings.manualDoorAudioUrl : null);

  // Auto fallback timeout if video fails to load or cannot be played
  useEffect(() => {
    let fallbackTimer: NodeJS.Timeout | null = null;
    if (videoError) {
      // In fallback state (no video file found), display divine darshanam card for 6 seconds then auto navigate to home
      fallbackTimer = setTimeout(() => {
        if (onVideoEnded) {
          onVideoEnded();
        }
      }, 6000);
    }
    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [videoError, onVideoEnded]);

  // 10-Second Post-Video Delay Countdown:
  // "only after playing video and video complete after +10sec you should go for home only then doors should close"
  useEffect(() => {
    if (postVideoSecondsLeft === null) return;

    if (postVideoSecondsLeft <= 0) {
      if (onVideoEnded) {
        onVideoEnded();
      }
      return;
    }

    const timer = setTimeout(() => {
      setPostVideoSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [postVideoSecondsLeft, onVideoEnded]);

  // Safely play video and its audio at full door open with Relay Pin D4 active
  const safePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    // At full door open: Ensure relay is ON (Sanctum Light)
    arduinoService.sendCommand('RELAY_ON');
    setIsRelayLitAt5th(true);

    if (!video.paused) {
      setIsPlaying(true);
      setIsBuffering(false);
      return;
    }

    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
      setIsBuffering(false);
      if (audioRef.current && currentAudioSrc) {
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        await audioRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      // Browser autoplay policy often requires muted video initially
      if (err?.name === 'NotAllowedError') {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            setIsPlaying(true);
            setIsBuffering(false);
          } catch (innerErr: any) {
            if (innerErr?.name !== 'AbortError') {
              console.warn('Playback error after mute:', innerErr);
            }
          }
        }
      } else if (err?.name !== 'AbortError') {
        // AbortError is normal when interrupting/seeking - do NOT trigger videoError
        console.warn('Video play warning:', err);
      }
    }
  }, [currentAudioSrc, isMuted]);

  // Pre-Video Door Delay Countdown & 5th-Second Relay Light Activation:
  // "after door open for 8sec on relay at 5th light play video at full door open on relay and play video and its audio"
  useEffect(() => {
    if (preVideoMsLeft === null) return;

    const totalMs = Math.round(preVideoDelaySec * 1000);
    const elapsedMs = totalMs - preVideoMsLeft;
    const relayTriggerMs = Math.min(Math.round(relayOnDelaySec * 1000), totalMs);

    // At 5th second: turn ON relay (Sanctum Light)
    if (elapsedMs >= relayTriggerMs && !relayAt5thTriggeredRef.current) {
      relayAt5thTriggeredRef.current = true;
      setIsRelayLitAt5th(true);
      arduinoService.sendCommand('RELAY_ON');
      soundService.playTempleBell();
    }

    // At full door open (e.g. 8s): play video and play its audio on relay
    if (preVideoMsLeft <= 0) {
      setPreVideoMsLeft(null);
      arduinoService.sendCommand('RELAY_ON');
      safePlay();
      return;
    }

    const timer = setTimeout(() => {
      setPreVideoMsLeft((prev) => (prev !== null ? Math.max(0, prev - 100) : null));
    }, 100);

    return () => clearTimeout(timer);
  }, [preVideoMsLeft, preVideoDelaySec, relayOnDelaySec, safePlay]);

  const handleSkipDoorDelay = () => {
    relayAt5thTriggeredRef.current = true;
    setIsRelayLitAt5th(true);
    arduinoService.sendCommand('RELAY_ON');
    setPreVideoMsLeft(null);
    safePlay();
  };

  // Handle video playback: Door opens for 8s, relay ON at 5th second, video and audio at full door open
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only initiate fresh playback when the video source string actually changes
    if (activeSrcRef.current !== currentVideoSrc) {
      activeSrcRef.current = currentVideoSrc;
      setVideoError(false);
      setIsBuffering(false);
      setIsVideoFinished(false);
      setPostVideoSecondsLeft(null);

      if (autoPlay) {
        // 1. FIRST: Motors run in Direction 1 to open doors for 8 seconds
        const cmd = category === '3_TO_5_HOURS' || category === '3_TO_5_DAYS' ? 'OPEN_3_5' : 'OPEN_0_3';
        arduinoService.sendCommand(cmd);
        soundService.playDoorOpenSound();
        relayAt5thTriggeredRef.current = false;
        setIsRelayLitAt5th(false);

        // 2. Play video: if delay set > 0, wait for lead time; otherwise play immediately
        if (preVideoDelaySec > 0) {
          // If delay is less than 5s, turn relay ON immediately; otherwise it triggers at 5th second
          if (preVideoDelaySec < relayOnDelaySec) {
            arduinoService.sendCommand('RELAY_ON');
            relayAt5thTriggeredRef.current = true;
            setIsRelayLitAt5th(true);
          }
          setPreVideoMsLeft(Math.round(preVideoDelaySec * 1000));
        } else {
          setPreVideoMsLeft(null);
          arduinoService.sendCommand('RELAY_ON');
          setIsRelayLitAt5th(true);
          const timer = setTimeout(() => {
            safePlay();
          }, 30);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [currentVideoSrc, autoPlay, safePlay, category, preVideoDelaySec, relayOnDelaySec]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // Just on relay and motors in D1 before video
      const cmd = category === '3_TO_5_HOURS' || category === '3_TO_5_DAYS' ? 'OPEN_3_5' : 'OPEN_0_3';
      arduinoService.sendCommand(cmd);
      arduinoService.sendCommand('RELAY_ON');
      video.play().then(() => {
        setIsPlaying(true);
        if (audioRef.current) audioRef.current.play().catch(() => {});
      }).catch(() => {});
    } else {
      video.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setIsVideoFinished(false);
    setPostVideoSecondsLeft(null);
    const cmd = category === '3_TO_5_HOURS' || category === '3_TO_5_DAYS' ? 'OPEN_3_5' : 'OPEN_0_3';
    arduinoService.sendCommand(cmd);
    arduinoService.sendCommand('RELAY_ON');
    safePlay();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
    setIsMuted(newMuted);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Optional separate Audio Element for custom Darshanam audio */}
      {currentAudioSrc && (
        <audio
          ref={audioRef}
          src={currentAudioSrc}
          preload="auto"
          onEnded={() => {
            if (!videoRef.current || videoRef.current.ended) {
              if (onVideoEnded) onVideoEnded();
            }
          }}
        />
      )}

      {/* Main Video Frame Container */}
      <div 
        className="relative w-full aspect-video sm:aspect-[16/9] max-h-[380px] rounded-2xl sm:rounded-3xl border-3 border-[#ffd700] bg-[#100205] shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(255,215,0,0.25)] overflow-hidden flex items-center justify-center group"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      >
        
        {/* Glowing Status Ribbon */}
        <div className="absolute top-3 left-3 z-30 flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-sans shadow-lg border flex items-center space-x-1.5 ${isManualDarshanam ? 'bg-amber-950 text-[#ffd700] border-[#ffd700]/60' : details.badgeBg}`}>
            <span className="h-2 w-2 rounded-full animate-ping bg-[#ffd700]" />
            <span>{isManualDarshanam ? 'Direct Darshanam (Manual Door Open)' : `${details.ageLabel} — ${details.labelEnglish}`}</span>
          </span>
        </div>

        {/* Auto Navigation Pill */}
        <div className="absolute top-3 right-3 z-30 flex items-center space-x-1.5 bg-black/75 px-3 py-1 rounded-full border border-[#ffd700]/50 text-[10px] sm:text-xs font-sans text-[#ffd700] backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#ffd700] animate-spin [animation-duration:6s]" />
          <span>Doors will auto-close &amp; return to home after video</span>
        </div>

        {/* The HTML5 Video Element - Direct and Instant with Zero Delay */}
        <video
          ref={videoRef}
          src={currentVideoSrc}
          autoPlay={autoPlay}
          preload="auto"
          playsInline
          disablePictureInPicture
          className={`h-full w-full object-cover object-center ${videoError ? 'hidden' : 'block'}`}
          style={{ transform: 'translateZ(0)' }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onCanPlay={() => {
            setIsBuffering(false);
            setVideoError(false);
            if (autoPlay && videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onLoadedData={() => {
            setIsBuffering(false);
            setVideoError(false);
          }}
          onError={() => {
            const err = videoRef.current?.error;
            if (err && err.code !== 0) {
              setVideoError(true);
              setIsBuffering(false);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsBuffering(false);
            setIsVideoFinished(true);
            setPostVideoSecondsLeft(10); // Start exact 10s post-video delay
          }}
          onPlay={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
        />

        {/* Subtle Video Buffering Spinner */}
        {isBuffering && !videoError && !isVideoFinished && preVideoMsLeft === null && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none animate-fadeIn">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-[#ffd700] animate-spin" />
              <span className="text-[11px] font-sans font-medium text-[#ffd700] drop-shadow-md">
                Loading video...
              </span>
            </div>
          </div>
        )}

        {/* Pre-Video Door Delay Overlay (Only shown if delay > 0s is configured) */}
        {preVideoMsLeft !== null && preVideoMsLeft > 0 && preVideoDelaySec > 0 && (
          <div
            id="pre-video-door-delay-overlay"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black/95 via-[#1a040b]/95 to-black/95 backdrop-blur-sm pointer-events-auto animate-fadeIn text-center border-2 border-[#ffd700]/70 rounded-xl"
          >
            {/* Animated Door Open & Glowing Aura */}
            <div className="relative mb-2.5 flex items-center justify-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-[#ffd700] bg-[#3a0d18] flex items-center justify-center text-[#ffd700] shadow-[0_0_35px_rgba(255,215,0,0.6)] animate-pulse">
                <DoorOpen className="h-8 w-8 sm:h-10 sm:w-10 text-[#ffd700] animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            </div>

            {/* Sacred Door Opening Heading */}
            <h3 className="font-royal text-base sm:text-lg font-bold text-[#ffd700] tracking-wide flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)]">
              {isRelayLitAt5th ? (
                <span className="text-amber-300 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                  Relay Pin D4 ON (Sanctum Light Lit)
                </span>
              ) : (
                <span>Doors Opening • Motors Running (8s)</span>
              )}
            </h3>
            <p className="font-sans text-[11px] sm:text-xs text-[#fbe2b5] mt-0.5 font-medium max-w-sm">
              {isRelayLitAt5th
                ? 'రిలే & గర్భగుడి దీపం ఆన్ చేయబడింది • తలుపులు పూర్తిగా తెరుచుకున్నాక వీడియో మరియు ఆడియో ప్లే అవుతాయి'
                : 'గుడి తలుపులు తెరుచుకుంటున్నాయి (8 సెకన్లు) • 5వ సెకను వద్ద రిలే & గర్భగుడి దీపం ఆన్ అవుతుంది'}
            </p>

            {/* Countdown Badge & Hardware Status */}
            <div className="my-2.5 flex items-center justify-center gap-3 bg-[#240710]/90 border border-[#ffd700]/60 px-4 py-2 rounded-2xl shadow-lg">
              <div className="h-11 min-w-16 px-2.5 rounded-full border-2 border-[#ffd700] bg-[#1a040a] flex items-center justify-center text-[#ffd700] text-xl font-bold font-mono shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                {(preVideoMsLeft / 1000).toFixed(1)}s
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[#ffd700]">
                  Full door open in {(preVideoMsLeft / 1000).toFixed(1)}s
                </div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    Motor: Direction 1 (8s) • Relay D4:{' '}
                    {isRelayLitAt5th ? (
                      <strong className="text-amber-300 font-bold">ON (Light Lit)</strong>
                    ) : (
                      <span className="text-amber-400/80">ON at 5th sec</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-56 max-w-full h-2 bg-[#2b0c16] rounded-full overflow-hidden border border-[#ffd700]/40 mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-[#ffd700] transition-all duration-100 ease-linear rounded-full shadow-[0_0_10px_rgba(255,215,0,0.6)]"
                style={{
                  width: `${Math.min(100, Math.max(0, ((preVideoDelaySec * 1000 - preVideoMsLeft) / (preVideoDelaySec * 1000)) * 100))}%`
                }}
              />
            </div>

            {/* Manual Skip Button */}
            <button
              type="button"
              id="skip-door-delay-play-video-btn"
              onClick={handleSkipDoorDelay}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-[#ffd700]/50 bg-[#35101a] hover:bg-[#4a1624] text-[11px] font-bold text-[#ffd700] transition-all shadow-sm active:scale-95"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Open Fully & Play Video + Audio Now</span>
            </button>
          </div>
        )}

        {/* Automatic Door Shutdown Overlay on Video Completion with +10sec Darshanam Buffer */}
        {isVideoFinished && postVideoSecondsLeft !== null && postVideoSecondsLeft > 0 && (
          <div className="absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-t from-black/90 via-black/35 to-black/60 pointer-events-auto animate-fadeIn">
            {/* Top Status Indicators */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 bg-[#250912]/90 border border-[#ffd700]/70 px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-[#ffd700]">
                  Doors OPEN • Relay D4 Active
                </span>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#35101a]/95 border border-[#ffd700]/80 px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin [animation-duration:8s]" />
                <span className="text-xs font-mono font-extrabold text-[#ffd700]">
                  {postVideoSecondsLeft}s Buffer Left
                </span>
              </div>
            </div>

            {/* Bottom Floating Blessing Card (Keeps Video Visible) */}
            <div className="mx-auto w-full max-w-md rounded-2xl border-2 border-[#ffd700]/80 bg-[#1f050d]/92 p-4 text-center shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-md">
              <div className="flex items-center justify-center space-x-2 mb-1.5">
                <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
                <h4 className="font-royal text-sm sm:text-base font-bold text-[#ffd700]">
                  Divine Darshanam Blessing (10s Buffer)
                </h4>
                <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
              </div>
              <p className="font-sans text-[11px] sm:text-xs text-[#e8cba4] font-medium leading-relaxed">
                Video finished. Sacred doors &amp; Sanctum LED light (Pin D4) remain <span className="text-[#ffd700] font-bold">OPEN</span> for divine blessings. Doors will close and D4 will turn off after this buffer.
              </p>

              {/* 10s Countdown Progress Bar */}
              <div className="w-full mt-2.5 mb-2 bg-[#2b0c16] rounded-full h-2 border border-[#ffd700]/40 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-[#ffd700] h-full transition-all duration-1000 ease-linear rounded-full shadow-[0_0_10px_rgba(255,215,0,0.6)]"
                  style={{ width: `${((10 - postVideoSecondsLeft) / 10) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-amber-300/90 font-medium">
                  Auto-closing doors in {postVideoSecondsLeft}s
                </span>
                <button
                  onClick={() => setPostVideoSecondsLeft(0)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#ffd700]/70 bg-[#35101a] hover:bg-[#4a1624] text-xs font-bold text-[#ffd700] transition-colors shadow-sm"
                >
                  <span>Close Doors Now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transition Screen when 10-second buffer completes */}
        {isVideoFinished && postVideoSecondsLeft === 0 && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="h-16 w-16 rounded-full border-2 border-[#ffd700] bg-[#35101a] flex items-center justify-center text-[#ffd700] shadow-[0_0_20px_rgba(255,215,0,0.4)] mb-3 animate-pulse">
              <DoorClosed className="h-8 w-8" />
            </div>
            <h4 className="font-royal text-base sm:text-lg font-bold text-[#ffd700]">
              Returning to Home
            </h4>
            <p className="font-sans text-xs text-[#e8cba4] mt-1 font-medium">
              Temple doors are closing (Direction 2)... Relay D4 stays ON while doors swing shut, and turns OFF when doors are fully closed.
            </p>
            <div className="mt-3 flex items-center space-x-1.5 rounded-full border border-[#ffd700]/40 bg-[#240c14] px-3.5 py-1.5 text-xs font-mono text-[#ffd700]">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Direction 2 Closing Motion Active • D4 ON until shut</span>
            </div>
          </div>
        )}

        {/* Fallback View if Video File is Not Found */}
        {videoError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#1c050d] via-[#240812] to-[#120206]">
            {/* Pulsing Sacred Halo Backdrop */}
            <div className="pointer-events-none absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.25)_0%,transparent_70%)] animate-pulse" />
            
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-2 border-[#ffd700] overflow-hidden p-1 shadow-[0_0_25px_rgba(255,215,0,0.3)] mb-3"
            >
              <img
                src={ASSETS.ganeshaLotus}
                alt="Lord Ganesha"
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <h3 className="font-royal text-sm sm:text-base font-bold text-[#ffd700] mb-1">
              {details.ageLabel} Darshanam
            </h3>
            <p className="font-sans text-[11px] text-[#e8cba4]/80 max-w-sm">
              {details.englishMessage}
            </p>

            {/* Auto Returning Timer Bar */}
            <div className="mt-3 flex items-center space-x-2 text-[10px] font-sans text-[#ffd700]/90 bg-[#2b0c16]/90 px-3 py-1 rounded-full border border-[#ffd700]/40">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Auto-returning to Home...</span>
            </div>
          </div>
        )}

        {/* Video Overlay Play/Pause Bottom Bar */}
        {!videoError && (
          <div className="absolute bottom-0 inset-x-0 z-30 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd700] text-black hover:bg-yellow-300 transition-all shadow-md"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-black translate-x-0.5" />}
              </button>

              <button
                onClick={handleReplay}
                title="Replay"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ffd700]/50 bg-[#220710]/80 text-[#ffd700] hover:bg-[#350d1a] transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ffd700]/50 bg-[#220710]/80 text-[#ffd700] hover:bg-[#350d1a] transition-all"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="font-sans text-[11px] text-[#ffd700] font-bold">
              {details.doorActionTextEnglish}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
