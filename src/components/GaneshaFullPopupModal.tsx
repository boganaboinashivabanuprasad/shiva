import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenTimeCategory, CATEGORY_DETAILS, DashboardSettings } from '../types';
import { soundService } from '../services/soundService';
import { GaneshaAiVideoPlayer } from './GaneshaAiVideoPlayer';
import {
  Sparkles,
  Bell,
  CheckCircle2,
  X,
  Home,
  DoorClosed
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserAgeGroup } from '../types';

interface GaneshaFullPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ScreenTimeCategory;
  ageGroup?: UserAgeGroup | null;
  screenTimeString: string;
  settings?: DashboardSettings;
  soundEnabled?: boolean;
  onViewDoor?: () => void;
  onVideoEnded?: () => void;
  isManualDarshanam?: boolean;
  customVideoUrl?: string;
  customAudioUrl?: string;
  isDoorShuttingDown?: boolean;
}

export function GaneshaFullPopupModal({
  isOpen,
  onClose,
  category,
  ageGroup,
  screenTimeString,
  settings,
  soundEnabled = true,
  onVideoEnded,
  isManualDarshanam = false,
  customVideoUrl,
  customAudioUrl,
  isDoorShuttingDown = false,
}: GaneshaFullPopupModalProps) {
  const currentDetails = CATEGORY_DETAILS[category] || CATEGORY_DETAILS['1_TO_3_DAYS'];

  // The scanner owns motor commands; opening a popup must not restart the motor timer.
  useEffect(() => {
    if (isOpen) {
      if (category === '0_TO_3_HOURS' || category === '1_TO_3_DAYS' || category === 'HEALTHY') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ffd700', '#f472b6', '#34d399', '#ffedd5'],
        });
      }
    }
  }, [isOpen, category]);

  const handleRingBell = () => {
    soundService.playTempleBell(category === '0_TO_3_HOURS' || category === '1_TO_3_DAYS' ? 1.25 : 0.95);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.4 },
      colors: ['#ffd700', '#fbbf24'],
    });
  };

  const handleFlowerShower = () => {
    soundService.playBlessingArpeggio();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.45 },
      colors: ['#f43f5e', '#fb7185', '#ffd700', '#fef08a'],
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/90 transition-all backdrop-blur-sm"
        id="ganesha-full-screen-popup-modal"
      >
        {/* Divine Background Cosmic Rays */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden opacity-30">
          <div className="h-[600px] w-[600px] sm:h-[900px] sm:w-[900px] animate-rays rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.4)_0%,rgba(218,165,32,0.15)_50%,transparent_75%)]" />
          <div className="absolute h-[500px] w-[500px] sm:h-[750px] sm:w-[750px] rounded-full border border-[#ffd700]/40 border-dashed animate-spin [animation-duration:140s]" />
        </div>

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="relative z-10 w-full max-w-2xl lg:max-w-3xl rounded-2xl border-2 border-[#ffd700] bg-[#1e050c] p-2.5 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(255,215,0,0.25)] flex flex-col items-center max-h-[96vh] overflow-y-auto custom-scrollbar text-[#f5f2ed]"
        >
          {/* Top Temple Header Bar */}
          <div className="w-full flex items-center justify-between border-b border-[#ffd700]/30 pb-2 mb-1.5 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full border border-[#ffd700]/60 bg-[#35101a] flex items-center justify-center text-[#ffd700] shadow-md">
                <Sparkles className="h-3.5 w-3.5 text-[#ffd700]" />
              </div>
              <div>
                <h2 className="font-royal text-sm sm:text-base font-extrabold text-[#ffd700] tracking-wide flex items-center gap-1.5 leading-tight">
                  <span>Lord Ganesha Divine Darshanam</span>
                </h2>
                <p className="font-sans text-[10px] sm:text-[11px] text-[#e8cba4]/80 font-medium">
                  {currentDetails.ageLabel} ({currentDetails.daysRange}) • Digital Wellbeing Darshanam
                </p>
              </div>
            </div>

            {/* Direct Close / Home Button */}
            <button
              onClick={onClose}
              id="close-ganesha-full-popup-btn"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-full border border-[#ffd700]/50 bg-[#160408] text-[#ffd700] hover:bg-[#3d1220] transition-all shadow-md font-sans text-xs font-bold"
              title="Finish and return home"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Home</span>
              <X className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>

          {/* Video Player Mode (Directly Plays the Scanned Time Slot Video or Manual Darshanam Video) */}
          {settings && (
            <div className="relative w-full my-0.5 shrink-0">
              <GaneshaAiVideoPlayer
                category={category}
                ageGroup={ageGroup}
                settings={settings}
                autoPlay={true}
                onVideoEnded={onVideoEnded}
                isManualDarshanam={isManualDarshanam}
                customVideoSrc={customVideoUrl}
                customAudioSrc={customAudioUrl}
              />

              {/* Automatic Door Shutdown Notification Overlay */}
              {isDoorShuttingDown && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-xl bg-black/85 backdrop-blur-sm p-3 text-center border-2 border-[#ffd700]/70 animate-fadeIn">
                  <div className="h-12 w-12 rounded-full border-2 border-[#ffd700] bg-rose-950/90 flex items-center justify-center text-[#ffd700] shadow-[0_0_25px_rgba(255,215,0,0.5)] mb-1.5 animate-pulse">
                    <DoorClosed className="h-6 w-6" />
                  </div>
                  <h3 className="font-royal text-sm sm:text-base font-bold text-[#ffd700]">
                    Darshanam Completed
                  </h3>
                  <p className="font-sans text-xs text-[#fbe2b5] mt-0.5 font-medium">
                    Temple doors are shutting down automatically...
                  </p>
                  <div className="mt-1.5 flex items-center space-x-1.5 rounded-full border border-[#ffd700]/30 bg-[#2b0c16] px-2.5 py-0.5 text-[9px] font-mono text-[#ffd700]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Arduino Command: CLOSE Transmitted</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sacred Sanskrit Mantra Card */}
          <div
            className={`w-full rounded-xl border p-2.5 sm:p-3 text-center shadow-lg transition-all my-1.5 shrink-0 ${
              category === '1_TO_3_DAYS' || category === 'HEALTHY'
                ? 'border-emerald-500/60 bg-[#0e2118]'
                : category === '3_TO_5_DAYS'
                ? 'border-sky-500/60 bg-[#0c1f2d]'
                : category === '5_TO_7_DAYS' || category === 'WARNING'
                ? 'border-amber-500/60 bg-[#251508]'
                : 'border-rose-500/60 bg-[#2b080e]'
            }`}
          >
            {/* Lord Ganesha Sacred Sanskrit Mantra */}
            <p className="font-devanagari text-sm sm:text-lg lg:text-xl font-bold leading-snug text-[#ffd700] drop-shadow-[0_2px_12px_rgba(255,215,0,0.45)] tracking-wide whitespace-pre-line">
              {currentDetails.teluguMessage}
            </p>
          </div>

          {/* Bottom Action Controls */}
          <div className="w-full mt-1 grid grid-cols-3 gap-2 shrink-0">
            {/* 1. Flower Shower Blessing */}
            <button
              type="button"
              onClick={handleFlowerShower}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/50 bg-rose-950/80 p-2 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-all font-sans shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              <span>Flower Blessing</span>
            </button>

            {/* 2. Temple Bell Ring */}
            <button
              type="button"
              onClick={handleRingBell}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-[#ffd700]/50 bg-[#2b0c16] p-2 text-xs font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all font-sans shadow-md"
            >
              <Bell className="h-3.5 w-3.5 text-[#ffd700]" />
              <span>Temple Bell</span>
            </button>

            {/* 3. Finish & Return to Home Page */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-[#ffd700] bg-gradient-to-r from-[#801429] to-[#9e1c36] p-2 text-xs font-bold text-[#ffd700] hover:brightness-110 active:scale-98 transition-all font-sans shadow-lg"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd700]" />
              <span>Finish (Home)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
