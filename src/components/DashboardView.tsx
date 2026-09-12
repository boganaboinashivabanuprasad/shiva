import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award } from 'lucide-react';
import { AppPage, DashboardSettings } from '../types';
import { ASSETS } from '../assets';
import { soundService } from '../services/soundService';
import { WebsiteLogo } from './WebsiteLogo';
import { BottomBrandBar } from './BottomBrandBar';

interface DashboardViewProps {
  settings: DashboardSettings;
  onNavigate: (page: AppPage) => void;
  onOpenTips?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  arduinoConnected?: boolean;
}

export function DashboardView({
  settings,
  onNavigate,
  soundEnabled = true,
  onToggleSound,
  arduinoConnected = false,
}: DashboardViewProps) {
  const handleStart = () => {
    soundService.playTempleBell(1.15);
    onNavigate('age-select');
  };

  const handleDeityClick = () => {
    soundService.playTempleBell(1.0);
  };

  return (
    <div
      className="relative h-screen max-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#140306] text-[#f5f2ed] select-none"
      id="dashboard-landing-sanctum"
      style={{
        backgroundImage: `url(${ASSETS.templeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark Temple Sacred Vignette Overlay - Solid rich temple depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#140306]/80 via-[#1b050c]/60 to-[#120306]/95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12)_0%,transparent_70%)]" />

      {/* Top Sacred Shloka & Centered Om Badge */}
      <header className="relative z-20 pt-2 sm:pt-3 px-3 sm:px-6 w-full flex items-center justify-center shrink-0">
        {/* Center: Glowing Om Circular Badge & Sacred Sanskrit Shloka */}
        <div className="flex flex-col items-center text-center">
          {/* Glowing Om Circular Badge - Precision optically and mathematically centered */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7 }}
            onClick={handleDeityClick}
            className="relative flex h-12 w-12 sm:h-14 sm:w-14 lg:h-15 lg:w-15 items-center justify-center rounded-full border-2 border-[#ffd700] bg-[#260812] shadow-[0_0_22px_rgba(255,215,0,0.55)] cursor-pointer hover:scale-105 active:scale-95 transition-transform overflow-hidden"
            title="Temple Bell (Ring for Blessings)"
          >
            {/* Centered Precision Sacred Om */}
            <svg
              viewBox="0 0 100 100"
              className="h-9 w-9 sm:h-10 sm:w-10 select-none pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]"
            >
              <text
                x="50"
                y="54"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffd700"
                fontFamily="'Cinzel', 'Marcellus', serif"
                fontSize="48"
                fontWeight="bold"
              >
                ॐ
              </text>
            </svg>
            <div className="absolute inset-0 rounded-full border border-[#ffd700]/50 animate-ping opacity-30 pointer-events-none" />
          </motion.div>

          {/* Sacred Sanskrit Shloka in English Transliteration */}
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-1 sm:mt-1.5 flex items-center justify-center space-x-2 text-[11px] sm:text-xs font-bold tracking-widest text-[#ffd700]"
          >
            <span className="text-[#ffd700]/60">•</span>
            <span className="font-royal tracking-widest text-xs sm:text-sm font-bold text-royal-gold">
              ॥ OM GAM GANAPATAYE NAMAHA ॥
            </span>
            <span className="text-[#ffd700]/60">•</span>
          </motion.div>
        </div>
      </header>

      {/* Main Center Sacred Sanctum: Lord Ganesha on Lotus Flanked by Both Logos */}
      <main className="relative z-20 mx-auto max-w-4xl px-4 py-1 flex-1 flex flex-col items-center justify-between text-center min-h-0 w-full my-auto">
        {/* Core Sanctum Group: Centered in the available vertical space */}
        <div className="my-auto flex flex-col items-center justify-center w-full">
          {/* Lord Ganesha Flanked by Logo 1 & Logo 2 in the Center */}
          <div className="relative flex items-center justify-center space-x-3 sm:space-x-6 md:space-x-8 lg:space-x-10 shrink-0">
            {/* Left Side: Logo 1 (Primary / Divine Emblem) - Prominent majestic size */}
            {settings.showLogos !== false && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, x: -15 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                className="flex flex-col items-center justify-center shrink-0"
              >
                <WebsiteLogo
                  logoNumber={1}
                  url={settings.logo1Url}
                  title={settings.logo1Title}
                  size="lg"
                  scale={settings.logoSize || 'large'}
                />
              </motion.div>
            )}

            {/* Center: Lord Ganesha with Radiant Aura */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative flex items-center justify-center shrink-0"
            >
              {/* Radiant Subtle Golden Glow */}
              <div className="pointer-events-none absolute h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.35)_0%,rgba(212,175,55,0.15)_45%,transparent_70%)] animate-pulse" />

              {/* Deity Artwork in Circular Golden Mandala Frame */}
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                onClick={handleDeityClick}
                className="group relative z-10 cursor-pointer flex h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 xl:h-60 xl:w-60 items-center justify-center overflow-hidden rounded-full border-2 sm:border-3 border-[#ffd700] bg-[#1e060e] p-1 shadow-[0_12px_35px_rgba(0,0,0,0.85),0_0_30px_rgba(255,215,0,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95"
                title="Temple Bell (Ring for Blessings)"
              >
                <img
                  src={ASSETS.ganeshaLotus}
                  alt="Lord Ganesha seated on Lotus"
                  className="h-full w-full rounded-full object-cover object-center filter drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
                  referrerPolicy="no-referrer"
                />
                {/* Subtle Golden Shimmer */}
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/40 via-transparent to-[#ffd700]/20" />
              </motion.div>
            </motion.div>

            {/* Right Side: Logo 2 (Secondary / Partner Emblem) - Prominent majestic size */}
            {settings.showLogos !== false && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, x: 15 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                className="flex flex-col items-center justify-center shrink-0"
              >
                <WebsiteLogo
                  logoNumber={2}
                  url={settings.logo2Url}
                  title={settings.logo2Title}
                  size="lg"
                  scale={settings.logoSize || 'large'}
                />
              </motion.div>
            )}
          </div>

          {/* Grand Royal Title: DIGITAL WELLBEING - Positioned cleanly down with generous breathing room */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 sm:mt-8 md:mt-10 w-full flex flex-col items-center justify-center shrink-0"
          >
            <span className="font-royal text-[10px] sm:text-xs font-extrabold tracking-[0.35em] text-[#ffd700]/80 uppercase mb-1">
              SAMATULYAM
            </span>
            <h1 className="font-royal text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#ffd700] leading-tight tracking-wider text-royal-gold filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_0_30px_rgba(255,215,0,0.4)] select-none">
              DIGITAL WELLBEING
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-1.5 sm:mt-2 font-marcellus text-xs sm:text-sm md:text-base font-bold text-[#fbe2b5] drop-shadow-md tracking-wide shrink-0"
          >
            Mindful Screen Habits with Lord Ganesha's Blessings
          </motion.p>

          {/* Velvet Crimson Rounded Pill Action Button: BEGIN DARSHAN */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-4 sm:mt-5 md:mt-6 shrink-0 flex flex-col items-center space-y-2"
          >
            <button
              onClick={handleStart}
              id="landing-start-scan-btn"
              className="group relative flex items-center justify-center rounded-full border-2 border-[#ffd700] bg-gradient-to-r from-[#9e1c36] via-[#c22846] to-[#801429] px-7 sm:px-10 py-2 sm:py-2.5 text-sm sm:text-base font-extrabold text-white shadow-[0_8px_30px_rgba(194,40,70,0.6),0_0_18px_rgba(255,215,0,0.4)] hover:shadow-[0_12px_40px_rgba(194,40,70,0.8)] hover:scale-105 active:scale-95 transition-all font-royal"
            >
              <span className="tracking-widest text-[#ffffff] drop-shadow-sm uppercase">BEGIN DARSHAN</span>
            </button>

            <button
              onClick={() => onNavigate('certificate')}
              id="landing-certificate-btn"
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full border border-[#ffd700]/40 bg-[#2b0c16]/80 text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] transition-all text-xs font-semibold shadow"
            >
              <Award className="h-3.5 w-3.5 text-[#ffd700]" />
              <span>Award Sankalpam Certificate (సంకల్ప పత్రం)</span>
            </button>
          </motion.div>
        </div>

        {/* Bottom Devotional Sub-captions - Brought all the way down above the bottom footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-auto pt-3 pb-1.5 sm:pb-2.5 flex flex-col items-center space-y-0.5 text-[10px] sm:text-xs text-[#e8cba4] shrink-0"
        >
          <div className="font-royal text-[10px] sm:text-xs font-bold text-[#ffd700] tracking-widest uppercase">
            Om Shanti • Divine Harmony
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-[#e8cba4]/90 font-medium tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% Privacy — Your Screen Data Stays Local</span>
          </div>
        </motion.div>
      </main>

      {/* Bottom Bar: Sound Toggle & Product Brand */}
      <BottomBrandBar
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound || (() => {})}
        idPrefix="home"
      />
    </div>
  );
}
