import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Camera,
  RotateCw, 
  ShieldCheck, 
  Upload, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Monitor,
  DoorOpen,
  DoorClosed,
  Play
} from 'lucide-react';
import { ocrService } from '../services/ocrService';
import { arduinoService } from '../services/arduinoService';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { CameraSession, CameraState } from '../services/cameraSession';
import { ScanSession } from '../services/scanSession';
import { DashboardSettings, ScanRecord, ScreenTimeCategory, CATEGORY_DETAILS, AppPage, UserAgeGroup } from '../types';
import { ASSETS } from '../assets';
import { GaneshaFullPopupModal } from './GaneshaFullPopupModal';
import { WebsiteLogo } from './WebsiteLogo';
import { SacredVoicePromiseModal } from './SacredVoicePromiseModal';
import { BottomBrandBar } from './BottomBrandBar';

interface LiveScannerProps {
  settings: DashboardSettings;
  ageGroup?: UserAgeGroup | null;
  onNavigate?: (page: AppPage) => void;
  onScanCompleted?: (record: ScanRecord) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  arduinoConnected?: boolean;
  onUpdateVideoUrl?: (category: ScreenTimeCategory, url: string) => void;
}

export function LiveScanner({
  settings,
  ageGroup,
  onNavigate,
  onScanCompleted,
  soundEnabled = true,
  onToggleSound,
  arduinoConnected = false,
  onUpdateVideoUrl,
}: LiveScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [camera, setCamera] = useState<CameraState>({ stream: null, devices: [], activeId: '', error: null });
  const cameraSession = useRef<CameraSession | null>(null);
  const scanSession = useRef(new ScanSession());
  const mounted = useRef(true);
  const promiseStage = useRef<'before' | 'waiting' | 'after' | null>(null);
  const actionGeneration = useRef(0);
  const cameraActive = !!camera.stream;
  const cameraError = camera.error;
  const availableCameras = camera.devices;
  const activeCameraId = camera.activeId;
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'manual' | 'auto'>('manual');
  const [scanComplete, setScanComplete] = useState(false);

  // Live Detection State
  const [activeCategory, setActiveCategory] = useState<ScreenTimeCategory | null>(null);
  const [activeScreenTimeString, setActiveScreenTimeString] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Click "Capture Photo" to take photo and give to software');

  // Full Screen Ganesha Modal State
  const [isGaneshaModalOpen, setIsGaneshaModalOpen] = useState<boolean>(false);
  const [isDoorShuttingDown, setIsDoorShuttingDown] = useState<boolean>(false);

  // 5+ Hours Overuse Sacred Voice Promise State
  const [isPromiseModalOpen, setIsPromiseModalOpen] = useState<boolean>(false);
  const [pendingPromiseDetection, setPendingPromiseDetection] = useState<{
    timeMinutes: number;
    formattedTime: string;
    confidence: number;
    source: ScanRecord['source'];
    category: ScreenTimeCategory;
    details: (typeof CATEGORY_DETAILS)[keyof typeof CATEGORY_DETAILS];
  } | null>(null);

  // Live Hardware Door Motion State
  const [doorMotion, setDoorMotion] = useState<'idle' | 'opening' | 'open' | 'closing' | 'closed'>(
    arduinoService.getDoorMotion()
  );
  const [isDoorOpen, setIsDoorOpen] = useState<boolean>(arduinoService.getIsDoorOpen());

  useEffect(() => {
    mounted.current = true;
    // Pre-warm fallback OCR worker in the background
    ocrService.getWorker().catch(() => {});

    const unsubscribe = arduinoService.subscribe((st) => {
      setDoorMotion(st.doorMotion);
      setIsDoorOpen(st.isDoorOpen);
      if (promiseStage.current === 'before' && st.doorMotion === 'open') {
        promiseStage.current = 'waiting';
        setIsPromiseModalOpen(true);
      }
    });
    return () => {
      unsubscribe();
      mounted.current = false;
      ++actionGeneration.current;
      scanSession.current.cancel();
      promiseStage.current = null;
    };
  }, []);

  // When devotee takes voice vow for 5+ hours screen time
  const handlePromiseAccepted = async () => {
    const pending = pendingPromiseDetection;
    if (!pending || promiseStage.current !== 'waiting') return;
    const action = ++actionGeneration.current;
    promiseStage.current = 'after';
    setIsPromiseModalOpen(false);

    // After promise: First motor runs and relay turns ON
    const sent = await arduinoService.sendCommand('OPEN_AFTER_PROMISE', 5000);
    if (!mounted.current || action !== actionGeneration.current) return;
    if (!sent) {
      setStatusMessage('Motor command failed. Reconnect the controller before trying again.');
      promiseStage.current = null;
      setPendingPromiseDetection(null);
      return;
    }
    await arduinoService.sendCommand('RELAY_ON');
    if (!mounted.current || action !== actionGeneration.current) return;
    soundService.playDoorOpenSound();

    // Save record to local storage
    const newRecord = storageService.addScanRecord({
      screenTimeMinutes: pending.timeMinutes,
      screenTimeString: pending.formattedTime,
      category: pending.category,
      ageGroup: ageGroup || undefined,
      teluguMessage: pending.details.teluguMessage,
      englishMessage: pending.details.englishMessage,
      arduinoCommand: 'OPEN_AFTER_PROMISE',
      doorAction: 'After Promise: Motor runs 5s in Direction 1',
      confidence: pending.confidence,
      source: pending.source,
    });

    if (onScanCompleted) onScanCompleted(newRecord);

    setStatusMessage(
      `॥ OM VIGHNARAJAYA NAMAHA ॥ Sacred vow accepted! Motors opening doors for 5 seconds.`
    );

    // Open Full Screen Divine Ganesha Popup Modal with Video Feedback
    setIsGaneshaModalOpen(true);
    setPendingPromiseDetection(null);

  };

  const handleCancelPromise = () => {
    ++actionGeneration.current;
    setIsPromiseModalOpen(false);
    promiseStage.current = null;
    setPendingPromiseDetection(null);
    setStatusMessage('Sacred promise cancelled. Choose Next Scan when ready.');
  };

  // Video Completed handler:
  // "only after playing video and video complete after +10sec you should go for home only then doors should close"
  const handleVideoEnded = () => {
    soundService.stopSpeech();

    // 1. Close darshanam modal and navigate to home first
    setIsDoorShuttingDown(false);
    setIsGaneshaModalOpen(false);

    if (onNavigate) {
      onNavigate('home');
    }

    // 2. Only then the doors close (Direction 2) and Relay LED shuts off
    setTimeout(() => {
      arduinoService.sendCommand('CLOSE_HOME');
      soundService.playDoorCloseSound();
    }, 150);
  };

  // Close or Finish Darshanam handler (when user clicks Close or Home directly)
  const handleCloseOrVideoEnded = () => {
    soundService.stopSpeech();

    setIsDoorShuttingDown(false);
    setIsGaneshaModalOpen(false);

    if (onNavigate) {
      onNavigate('home');
    }

    // Only close doors if they are open
    if (arduinoService.getIsDoorOpen()) {
      setTimeout(() => {
        arduinoService.sendCommand('CLOSE_HOME');
        soundService.playDoorCloseSound();
      }, 150);
    }
  };

  const startCamera = () => cameraSession.current?.start();

  useEffect(() => {
    soundService.stopSpeech();
    scanSession.current.cancel();
    const session = new CameraSession(navigator.mediaDevices, settings.selectedCameraId || '', facingMode, setCamera);
    cameraSession.current = session;
    void session.start();
    const resume = () => {
      if (document.visibilityState === 'visible') {
        void session.start();
        void videoRef.current?.play().catch(() => {});
      } else {
        scanSession.current.cancel();
      }
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      session.dispose();
      document.removeEventListener('visibilitychange', resume);
      soundService.stopSpeech();
    };
  }, [settings.selectedCameraId, facingMode]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = camera.stream;
    if (camera.stream) void videoRef.current.play().catch(() => {});
    else scanSession.current.cancel();
  }, [camera.stream]);

  // Handle successful detection
  const handleSuccessfulDetection = useCallback(
    async (
      timeMinutes: number,
      formattedTime: string,
      confidence: number,
      source: ScanRecord['source'] = 'camera_manual',
      photoUrl?: string
    ) => {
      if (!mounted.current || !scanSession.current.complete()) return;
      const action = ++actionGeneration.current;
      setScanComplete(true);
      const category = ocrService.classifyMinutes(
        timeMinutes,
        settings.healthyThresholdHours,
        settings.warningThresholdHours
      );

      const details = CATEGORY_DETAILS[category];
      setActiveCategory(category);
      setActiveScreenTimeString(formattedTime);

      // Speech bubble status
      setStatusMessage(`॥ OM GAM GANAPATAYE NAMAHA ॥ Screen time detected: ${formattedTime}`);

      // Proactively prefetch divine voice
      soundService.prefetchDivineVoice(category, formattedTime);

      // Stop any speech
      soundService.stopSpeech();

      // Sounds and celebration for scan recognition
      if (soundEnabled) {
        soundService.playTempleBell(1.15);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#f472b6', '#34d399', '#ffffff'],
        });
      }

      if (category === '5_PLUS_HOURS') {
        promiseStage.current = 'before';
        setPendingPromiseDetection({
          category,
          timeMinutes,
          formattedTime,
          confidence,
          source,
          details: details || CATEGORY_DETAILS['5_PLUS_HOURS'],
        });

        setStatusMessage('5+ hours detected. Opening for 5 seconds before the sacred promise...');
        const sent = await arduinoService.sendCommand('OPEN_FULL', 5000);
        if (!mounted.current || action !== actionGeneration.current) return;
        if (!sent) {
          promiseStage.current = null;
          setPendingPromiseDetection(null);
          setStatusMessage('Motor command failed. Reconnect the controller before trying again.');
          return;
        }
        await arduinoService.sendCommand('RELAY_ON');
        if (!mounted.current || action !== actionGeneration.current) return;
        soundService.playDoorOpenSound();
      } else if (category === '3_TO_5_HOURS') {
        // 3-5 Hours: First motor runs and relay turns ON
        const sent = await arduinoService.sendCommand('OPEN_3_5');
        if (!mounted.current || action !== actionGeneration.current) return;
        if (!sent) { setStatusMessage('Motor command failed. Reconnect the controller.'); return; }
        await arduinoService.sendCommand('RELAY_ON');
        if (!mounted.current || action !== actionGeneration.current) return;
        soundService.playDoorOpenSound();

        const newRecord = storageService.addScanRecord({
          screenTimeMinutes: timeMinutes,
          screenTimeString: formattedTime,
          category,
          ageGroup: ageGroup || undefined,
          teluguMessage: details?.teluguMessage || '॥ Om Shri Ganeshaya Namaha ॥',
          englishMessage: details?.englishMessage || '॥ Om Shri Ganeshaya Namaha ॥',
          arduinoCommand: 'OPEN_3_5',
          doorAction: 'Motor runs for 8s in Direction 1 (SLOW)',
          confidence,
          source,
          photoUrl,
        });

        if (onScanCompleted) onScanCompleted(newRecord);
        setIsGaneshaModalOpen(true);
      } else {
        // 0-3 Hours (Healthy / default for every user): First motor runs and relay turns ON
        const sent = await arduinoService.sendCommand('OPEN_0_3');
        if (!mounted.current || action !== actionGeneration.current) return;
        if (!sent) { setStatusMessage('Motor command failed. Reconnect the controller.'); return; }
        await arduinoService.sendCommand('RELAY_ON');
        if (!mounted.current || action !== actionGeneration.current) return;
        soundService.playDoorOpenSound();

        const newRecord = storageService.addScanRecord({
          screenTimeMinutes: timeMinutes,
          screenTimeString: formattedTime,
          category: '0_TO_3_HOURS',
          ageGroup: ageGroup || undefined,
          teluguMessage: details?.teluguMessage || '॥ Om Gam Ganapataye Namaha ॥',
          englishMessage: details?.englishMessage || '॥ Om Gam Ganapataye Namaha ॥',
          arduinoCommand: 'OPEN_0_3',
          doorAction: 'Motor runs for 8s in Direction 1 (Normal Speed)',
          confidence,
          source,
          photoUrl,
        });

        if (onScanCompleted) onScanCompleted(newRecord);
        setIsGaneshaModalOpen(true);
      }

    },
    [settings, soundEnabled, onScanCompleted, ageGroup]
  );

  // Manual Door Open & Case Trigger handlers
  const handleManualDoorCase = (caseType: '0_3' | '3_5' | '5_plus' | 'promise' | 'close') => {
    if (caseType !== 'close' && (scanSession.current.isBusy() || scanSession.current.isComplete() ||
      ['opening', 'closing'].includes(arduinoService.getDoorMotion()))) return;
    soundService.playScanBeep();

    if (caseType === '0_3') {
      setStatusMessage('Case 1 Manual: 0 - 3 Hours (Healthy) • Motor running 8s Dir 1. Opening Doors...');
      void handleSuccessfulDetection(90, '1h 30m', 100, 'demo_trigger');
    } else if (caseType === '3_5') {
      setStatusMessage('Case 2 Manual: 3 - 5 Hours (Warning) • Motor running 8s Dir 1 SLOW. Opening Doors...');
      void handleSuccessfulDetection(240, '4h 00m', 100, 'demo_trigger');
    } else if (caseType === '5_plus') {
      setStatusMessage('Case 3 Manual: 5+ Hours • Motors opening doors for 5 seconds before promise...');
      void handleSuccessfulDetection(360, '6h 00m', 100, 'demo_trigger');
    } else if (caseType === 'promise') {
      scanSession.current.complete();
      setScanComplete(true);
      setStatusMessage('Case 4 Manual: After Promise • Motors opening doors for 5 seconds...');
      arduinoService.sendCommand('OPEN_AFTER_PROMISE', 5000);
      soundService.playDoorOpenSound();
      setActiveCategory('5_PLUS_HOURS');
      setActiveScreenTimeString('5+h (Vow Accepted)');
      setIsGaneshaModalOpen(true);
    } else if (caseType === 'close') {
      ++actionGeneration.current;
      scanSession.current.cancel();
      scanSession.current.complete();
      setScanComplete(true);
      promiseStage.current = null;
      setIsPromiseModalOpen(false);
      setPendingPromiseDetection(null);
      setStatusMessage('Manual Close: Motor running 8s in Dir 2. Temple Doors closing safely...');
      arduinoService.sendCommand('CLOSE_HOME');
      soundService.playDoorCloseSound();
      setIsGaneshaModalOpen(false);
    }
  };

  const recognizePhoto = useCallback(async (canvas: HTMLCanvasElement, token: number, source: ScanRecord['source']) => {
    const photo = canvas.toDataURL('image/jpeg', 0.85);
    if (source !== 'camera_auto') setCapturedPhoto(photo);
    const result = await ocrService.recognizeFrame(canvas, settings.healthyThresholdHours, settings.warningThresholdHours);
    if (!mounted.current || !scanSession.current.isCurrent(token)) return;
    if (result.detected && Number.isFinite(result.screenTimeMinutes) &&
        result.screenTimeMinutes > 0 && result.screenTimeMinutes <= 1440) {
      setCapturedPhoto(photo);
      await handleSuccessfulDetection(result.screenTimeMinutes, result.screenTimeString, result.confidence, source, photo);
    } else {
      setCapturedPhoto(null);
      setStatusMessage('Screen time was not readable. Hold the phone steady and try again.');
    }
  }, [settings.healthyThresholdHours, settings.warningThresholdHours, handleSuccessfulDetection]);

  const triggerCapturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || document.visibilityState === 'hidden' ||
      video.readyState < 2 || !video.videoWidth || !video.videoHeight ||
      !camera.stream?.getVideoTracks().some((track) => track.readyState === 'live' && !track.muted) ||
      ['opening', 'closing'].includes(arduinoService.getDoorMotion())) return;
    const token = scanSession.current.begin();
    if (token === null) return;
    setIsCapturing(true);
    setIsProcessingOcr(true);
    if (scanMode === 'manual' && soundEnabled) soundService.playScanBeep();
    setStatusMessage('Scanning screen time...');
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Unable to capture a camera frame.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      await recognizePhoto(canvas, token, scanMode === 'auto' ? 'camera_auto' : 'camera_manual');
    } catch (error) {
      if (mounted.current && scanSession.current.isCurrent(token)) {
        setCapturedPhoto(null);
        setStatusMessage('Scan failed. No motor command was sent. Please try again.');
      }
    } finally {
      scanSession.current.finish();
      if (mounted.current) { setIsProcessingOcr(false); setIsCapturing(false); }
    }
  }, [camera.stream, scanMode, recognizePhoto, soundEnabled]);

  // A new pass starts only when the previous OCR pass has actually finished.
  useEffect(() => {
    if (scanMode !== 'auto' || !cameraActive || scanComplete || isPromiseModalOpen || isGaneshaModalOpen) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(async () => {
        await triggerCapturePhoto();
        if (!cancelled) schedule();
      }, 500);
    };
    schedule();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [scanMode, cameraActive, scanComplete, isPromiseModalOpen, isGaneshaModalOpen, triggerCapturePhoto]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || ['opening', 'closing'].includes(arduinoService.getDoorMotion())) return;
    const token = scanSession.current.begin();
    if (token === null) return;
    setIsProcessingOcr(true);
    setStatusMessage('Reading uploaded photo...');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Unable to load image.'));
        img.src = url;
      });
      if (!mounted.current || !scanSession.current.isCurrent(token) || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to read image.');
      ctx.drawImage(img, 0, 0);
      await recognizePhoto(canvas, token, 'upload');
    } catch {
      if (mounted.current && scanSession.current.isCurrent(token)) {
        setCapturedPhoto(null);
        setStatusMessage('Unable to scan this image. Try a clear screenshot.');
      }
    } finally {
      URL.revokeObjectURL(url);
      scanSession.current.finish();
      if (mounted.current) setIsProcessingOcr(false);
    }
  };

  const changeScanMode = (mode: 'manual' | 'auto') => {
    if (mode === scanMode) return;
    scanSession.current.cancel();
    setScanMode(mode);
    if (!scanSession.current.isComplete()) setCapturedPhoto(null);
    setStatusMessage(scanSession.current.isComplete() ? 'Scan complete. Choose Next Scan for the next visitor.' :
      mode === 'auto' ? 'Auto Scan is ON. Hold the screen steady in front of the camera.' : 'Manual Scan selected. Click Capture Photo.');
  };

  const handleRetake = () => {
    if (scanSession.current.isBusy() || ['opening', 'closing'].includes(arduinoService.getDoorMotion()) ||
        isPromiseModalOpen || isGaneshaModalOpen) return;
    scanSession.current.reset();
    ++actionGeneration.current;
    setScanComplete(false);
    promiseStage.current = null;
    setPendingPromiseDetection(null);
    setCapturedPhoto(null);
    setActiveCategory(null);
    setActiveScreenTimeString('');
    setStatusMessage(scanMode === 'auto' ? 'Auto Scan resumed. Ready for the next visitor.' : 'Click Capture Photo to scan.');
    if (!cameraActive) void startCamera();
  };

  const handleBack = () => {
    ++actionGeneration.current;
    scanSession.current.cancel();
    promiseStage.current = null;
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div
      className="relative min-h-screen max-h-screen w-full flex flex-col justify-between overflow-y-auto bg-[#140306] text-[#f5f2ed] selection:bg-[#ffd700]/30 selection:text-[#ffd700]"
      id="live-scanner-view-container"
      style={{
        backgroundImage: `url(${ASSETS.templeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Temple Sacred Vignette Overlay - Solid rich temple depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#140306]/85 via-[#1b050c]/65 to-[#120306]/95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12)_0%,transparent_75%)]" />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between px-3 pt-2 sm:px-6 sm:pt-2.5 shrink-0">
        {/* Left: Back Button & Logo 1 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleBack}
            id="scanner-back-btn"
            className="flex items-center space-x-1.5 rounded-full border border-[#ffd700]/60 bg-[#2b0c16] px-3 py-1 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] transition-all shadow-md font-royal"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>

          {settings.showLogos !== false && (
            <WebsiteLogo
              logoNumber={1}
              url={settings.logo1Url}
              title={settings.logo1Title}
              size="md"
              scale={settings.logoSize || 'large'}
            />
          )}
        </div>

        {/* Right: Logo 2 & Menu Drawer Spacing */}
        <div className="flex items-center justify-end pr-12 sm:pr-14">
          {settings.showLogos !== false && (
            <WebsiteLogo
              logoNumber={2}
              url={settings.logo2Url}
              title={settings.logo2Title}
              size="md"
              scale={settings.logoSize || 'large'}
            />
          )}
        </div>
      </header>

      {/* Main View Area: Side-by-Side Camera & Manual Door Controls */}
      <main className="relative z-20 mx-auto max-w-6xl w-full px-3 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col items-center justify-center min-h-0 my-auto">
        {/* Status Guidance Banner */}
        {statusMessage && (
          <motion.div
            key={statusMessage}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2.5 sm:mb-3 px-4 py-1.5 rounded-full border border-[#ffd700]/50 bg-[#250912]/90 shadow-md text-center max-w-2xl"
          >
            <p className="font-marcellus text-xs sm:text-sm font-semibold text-[#ffd700] tracking-wide">
              {statusMessage}
            </p>
          </motion.div>
        )}

        {/* 2-Column Responsive Layout: Camera Viewfinder on Left, Manual Door Controls Beside It on Right */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch justify-center max-w-5xl">
          {/* =========================================================================
              LEFT COLUMN: Live Camera Viewfinder & Primary Capture Photo
             ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col items-center justify-between w-full rounded-2xl border border-[#ffd700]/40 bg-gradient-to-b from-[#20060e]/85 via-[#18040a]/90 to-[#120207]/90 p-3 sm:p-4 shadow-xl">
            {/* Viewfinder Container */}
            <div className="relative w-full h-[250px] sm:h-[285px] md:h-[310px] overflow-hidden rounded-2xl border-2 border-[#ffd700] bg-[#100306] shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(255,215,0,0.25)] flex items-center justify-center shrink-0">
              {/* Corner Ornate Accents */}
              <div className="pointer-events-none absolute top-2 left-2 h-5 w-5 border-t-2 border-l-2 border-[#ffd700] rounded-tl-lg z-20" />
              <div className="pointer-events-none absolute top-2 right-2 h-5 w-5 border-t-2 border-r-2 border-[#ffd700] rounded-tr-lg z-20" />
              <div className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-2 border-l-2 border-[#ffd700] rounded-bl-lg z-20" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-[#ffd700] rounded-br-lg z-20" />

              {/* Shutter flash animation on capture */}
              {/* Keep the same video element mounted throughout capture, OCR and retakes. */}
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
              {isCapturing && (
                <span className="absolute top-3 left-3 rounded-lg bg-black/80 px-3 py-1 text-xs text-emerald-300 z-40">Scanning...</span>
              )}
              {capturedPhoto ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <img
                    src={capturedPhoto}
                    alt="Captured Screen"
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-center space-x-2 rounded-xl border border-emerald-400 bg-emerald-950/95 py-2 px-3 shadow-lg z-30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-emerald-300">
                      {isProcessingOcr ? 'Reading screen time...' : 'Scan complete • Choose Next Scan when ready'}
                    </span>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Subtle, elegant framing guideline */}
                  <div className="pointer-events-none absolute inset-4 rounded-xl border border-dashed border-[#ffd700]/40 flex items-center justify-center">
                    <span className="rounded-full bg-[#240911]/85 px-3 py-1 text-[10px] sm:text-xs font-semibold text-[#ffd700] border border-[#ffd700]/40 shadow-md">
                      {scanMode === 'auto' ? 'Auto Scan • Hold Phone Screen Steady' : 'Align Phone Screen • Tap Capture Photo'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-4 text-center space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ffd700]/70 bg-[#2b0c16] text-[#ffd700] shadow-sm">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="font-sans text-xs text-[#ffd700] font-semibold">
                    {cameraError || 'Connecting camera... Allow access if your browser asks.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="rounded-full border border-[#ffd700] bg-gradient-to-r from-[#9e1c36] to-[#801429] px-4 py-1.5 text-xs font-bold text-white shadow-md font-sans"
                  >
                    Retry Camera
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY HERO BUTTON: CAPTURE PHOTO & GIVE TO SOFTWARE */}
            <div className="mt-3 w-full flex flex-col items-center">
              <div className="mb-2 grid w-full grid-cols-2 gap-2 rounded-xl border border-[#ffd700]/30 bg-black/35 p-1.5">
                <button
                  type="button"
                  onClick={() => changeScanMode('manual')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    scanMode === 'manual' ? 'bg-[#ffd700] text-black shadow-md' : 'bg-[#2b0c16] text-[#ffd700]'
                  }`}
                >
                  Manual Scan
                </button>
                <button
                  type="button"
                  onClick={() => changeScanMode('auto')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    scanMode === 'auto' ? 'bg-emerald-500 text-black shadow-md animate-pulse' : 'bg-[#2b0c16] text-emerald-300'
                  }`}
                >
                  Auto Scan {scanMode === 'auto' ? (scanComplete ? 'PAUSED' : 'ON') : 'OFF'}
                </button>
              </div>

              {availableCameras.length > 0 && (
                <p className="mb-2 text-center text-[10px] text-[#e8cba4]/75">
                  Active camera: {availableCameras.find((camera) => camera.deviceId === activeCameraId)?.label || 'Saved camera'}
                </p>
              )}
              <button
                onClick={triggerCapturePhoto}
                id="capture-photo-software-btn"
                disabled={isProcessingOcr || !cameraActive || scanMode === 'auto' || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                className="group relative w-full flex items-center justify-center space-x-3.5 rounded-2xl border-2 border-[#ffd700] bg-gradient-to-r from-[#9e1c36] via-[#c22846] to-[#801429] px-5 py-3 sm:py-3.5 text-white shadow-[0_8px_30px_rgba(194,40,70,0.7),0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_12px_40px_rgba(194,40,70,0.9)] hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 font-royal"
              >
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/15 border-2 border-[#ffd700] shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-[#ffd700] drop-shadow-md" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-royal text-base sm:text-lg font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
                    {isProcessingOcr ? 'GIVING TO SOFTWARE...' : 'CAPTURE PHOTO'}
                  </span>
                  <span className="font-sans text-[11px] sm:text-xs text-[#ffd700] font-bold">
                    ఫోటో తీసి సాఫ్ట్‌వేర్‌కు ఇవ్వండి (Give to Software)
                  </span>
                </div>
              </button>

              {/* Secondary Controls Bar */}
              <div className="mt-2.5 w-full flex items-center justify-between px-1 text-xs font-sans">
                {/* Flip Camera */}
                <button
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  disabled={isProcessingOcr || !!settings.selectedCameraId}
                  className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/40 bg-[#2b0c16] px-3 py-1.5 text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] transition-all shadow-sm"
                  title={settings.selectedCameraId ? 'Using the saved camera. Change it in Settings.' : 'Switch between front and back camera'}
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Flip Camera</span>
                </button>

                {/* Upload Photo Option */}
                <label className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/40 bg-[#2b0c16] px-3 py-1.5 text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] transition-all shadow-sm cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isProcessingOcr || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                    className="hidden"
                  />
                </label>

                {/* Retake */}
                {(capturedPhoto || scanComplete) && (
                  <button
                    onClick={handleRetake}
                    disabled={isProcessingOcr || doorMotion === 'opening' || doorMotion === 'closing' || isPromiseModalOpen || isGaneshaModalOpen}
                    className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/40 bg-[#2b0c16] px-3 py-1.5 text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] transition-all shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>{scanComplete ? 'Next Scan' : 'Retake'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Manual Door Controls (Different Cases) - BESIDE THE CAMERA
             ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between w-full h-full rounded-2xl border-2 border-[#ffd700]/60 bg-gradient-to-b from-[#240911]/95 to-[#150409]/95 p-3.5 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,0.2)] font-sans">
            <div>
              {/* Header with Live Door Status */}
              <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-2.5 mb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3d1220] border border-[#ffd700]/60 text-[#ffd700] shadow-sm">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-royal text-sm sm:text-base font-bold text-[#ffd700] tracking-wide">
                      Manual Door Controls
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#e8cba4]/80">
                      వివిధ కేసులలో తలుపులు తెరవండి (Different Cases)
                    </p>
                  </div>
                </div>

                {/* Live Door Motion Badge */}
                <span
                  className={`font-mono text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                    doorMotion === 'opening'
                      ? 'bg-sky-950 text-sky-300 border-sky-400 animate-pulse shadow-sm'
                      : doorMotion === 'closing'
                      ? 'bg-amber-950 text-amber-300 border-amber-400 animate-pulse shadow-sm'
                      : isDoorOpen
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-400 shadow-sm'
                      : 'bg-[#1a060c] text-zinc-400 border-zinc-700'
                  }`}
                >
                  {doorMotion === 'opening'
                    ? 'OPENING (Dir 1)'
                    : doorMotion === 'closing'
                    ? 'CLOSING (Dir 2)'
                    : isDoorOpen
                    ? 'DOORS OPEN'
                    : 'DOORS CLOSED'}
                </span>
              </div>

              {/* Hardware Status Note */}
              <div className="mb-2 flex items-center justify-between text-[10px] text-[#e8cba4]/75 px-1 font-mono">
                <span>ESP8266 Motor Relay</span>
                <span className="text-[#ffd700]">Dir 1: Open • Dir 2: Close</span>
              </div>

              {/* 4 Case Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {/* Case 1: 0 - 3 Hours (Healthy) */}
                <button
                  type="button"
                  id="manual-case-0-3-btn"
                  disabled={isProcessingOcr || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                  onClick={() => handleManualDoorCase('0_3')}
                  className="group flex flex-col justify-between rounded-xl border border-emerald-500/60 bg-gradient-to-br from-emerald-950/90 via-[#06241b] to-[#041912] p-2.5 text-left hover:border-emerald-400 hover:shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.01] active:scale-98"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-royal font-bold text-xs sm:text-[13px] text-emerald-300 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Case 1: 0 - 3h</span>
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded border border-emerald-500/50">
                      Dir 1 • {((settings.time0To3Dir1Ms ?? 8000) / 1000).toFixed(0)}s
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-emerald-200/85 leading-tight">
                    Normal Speed Open (Healthy) &bull; సాధారణ వేగంతో తెరుచుకుంటాయి
                  </p>
                </button>

                {/* Case 2: 3 - 5 Hours (Warning) */}
                <button
                  type="button"
                  id="manual-case-3-5-btn"
                  disabled={isProcessingOcr || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                  onClick={() => handleManualDoorCase('3_5')}
                  className="group flex flex-col justify-between rounded-xl border border-sky-500/60 bg-gradient-to-br from-sky-950/90 via-[#092233] to-[#051722] p-2.5 text-left hover:border-sky-400 hover:shadow-[0_4px_16px_rgba(14,165,233,0.35)] transition-all hover:scale-[1.01] active:scale-98"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-royal font-bold text-xs sm:text-[13px] text-sky-300 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-sky-400 fill-sky-400 group-hover:scale-110 transition-transform" />
                      <span>Case 2: 3 - 5h</span>
                    </span>
                    <span className="font-mono text-[10px] bg-sky-900/90 text-sky-200 px-2 py-0.5 rounded border border-sky-500/50">
                      Dir 1 • {((settings.time3To5Dir1Ms ?? 8000) / 1000).toFixed(0)}s SLOW
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-sky-200/85 leading-tight">
                    Slow Speed Open (Warning) &bull; నెమ్మదిగా తలుపులు తెరుచుకుంటాయి
                  </p>
                </button>

                {/* Case 3: 5+ Hours (Overuse / Peek) */}
                <button
                  type="button"
                  id="manual-case-5-plus-btn"
                  disabled={isProcessingOcr || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                  onClick={() => handleManualDoorCase('5_plus')}
                  className="group flex flex-col justify-between rounded-xl border border-amber-500/60 bg-gradient-to-br from-amber-950/90 via-[#2d1808] to-[#1c0f05] p-2.5 text-left hover:border-amber-400 hover:shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.01] active:scale-98"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-royal font-bold text-xs sm:text-[13px] text-amber-300 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                      <span>Case 3: 5+ Hours</span>
                    </span>
                    <span className="font-mono text-[10px] bg-amber-900/90 text-amber-200 px-2 py-0.5 rounded border border-amber-500/50">
                      Dir 1 • 5s
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-amber-200/85 leading-tight">
                    Open for 5 seconds, then take the sacred promise
                  </p>
                </button>

                {/* Case 4: After Promise / Sacred Vow */}
                <button
                  type="button"
                  id="manual-case-promise-btn"
                  disabled={isProcessingOcr || scanComplete || doorMotion === 'opening' || doorMotion === 'closing'}
                  onClick={() => handleManualDoorCase('promise')}
                  className="group flex flex-col justify-between rounded-xl border border-purple-500/60 bg-gradient-to-br from-purple-950/90 via-[#260c33] to-[#170620] p-2.5 text-left hover:border-purple-400 hover:shadow-[0_4px_16px_rgba(168,85,247,0.35)] transition-all hover:scale-[1.01] active:scale-98"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-royal font-bold text-xs sm:text-[13px] text-purple-300 flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-purple-400 fill-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Case 4: After Vow</span>
                    </span>
                    <span className="font-mono text-[10px] bg-purple-900/90 text-purple-200 px-2 py-0.5 rounded border border-purple-500/50">
                      Dir 1 • 5s
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-purple-200/85 leading-tight">
                    Full Open After Taking Vow &bull; సంకల్ప ప్రతిజ్ఞ తర్వాత పూర్తి దర్శనం
                  </p>
                </button>
              </div>
            </div>

            {/* Case 5: Close Doors Button */}
            <button
              type="button"
              id="manual-case-close-btn"
              onClick={() => handleManualDoorCase('close')}
              className="mt-2.5 w-full flex items-center justify-between rounded-xl border-2 border-rose-500/60 bg-gradient-to-r from-[#420e1c] via-[#5c1326] to-[#420e1c] px-3.5 py-2 text-rose-100 hover:border-rose-400 hover:bg-[#6e182f] hover:shadow-[0_4px_20px_rgba(244,63,94,0.4)] transition-all hover:scale-[1.01] active:scale-99 font-sans"
            >
              <div className="flex items-center space-x-2">
                <DoorClosed className="h-4 w-4 text-rose-300 shrink-0" />
                <span className="font-royal font-bold text-xs sm:text-[13px] text-rose-100">
                  Close Temple Doors (CLOSE_HOME)
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] bg-rose-950/90 text-rose-300 px-2 py-0.5 rounded border border-rose-500/50">
                Dir 2 • {((settings.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(0)}s &amp; Off
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar: Sound Toggle & Product Brand */}
      <BottomBrandBar
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound || (() => {})}
        idPrefix="scanner"
      />

      {/* 5+ Hours Overuse Sacred Voice Promise Modal */}
      <SacredVoicePromiseModal
        isOpen={isPromiseModalOpen}
        screenTimeString={pendingPromiseDetection?.formattedTime || activeScreenTimeString || '5+ Hours'}
        settings={settings}
        soundEnabled={soundEnabled}
        onPromiseAccepted={handlePromiseAccepted}
        onCancel={handleCancelPromise}
      />

      {/* Grand Full Screen Lord Ganesha Popup Modal with Gemini AI Video Feedback */}
      {activeCategory && (
        <GaneshaFullPopupModal
          isOpen={isGaneshaModalOpen}
          onClose={handleCloseOrVideoEnded}
          onVideoEnded={handleVideoEnded}
          category={activeCategory}
          ageGroup={ageGroup}
          screenTimeString={activeScreenTimeString}
          soundEnabled={soundEnabled}
          settings={settings}
          isDoorShuttingDown={isDoorShuttingDown}
          onViewDoor={() => {
            soundService.stopSpeech();
            setIsGaneshaModalOpen(false);
            if (onNavigate) onNavigate('arduino');
          }}
        />
      )}
    </div>
  );
}
