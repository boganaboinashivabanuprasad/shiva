import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { UserAgeGroup, DashboardSettings } from '../types';
import { ASSETS } from '../assets';
import { soundService } from '../services/soundService';
import { WebsiteLogo } from './WebsiteLogo';
import { BottomBrandBar } from './BottomBrandBar';
import { 
  Sparkles,
  Baby, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

interface AgeSelectionViewProps {
  settings: DashboardSettings;
  selectedAgeGroup: UserAgeGroup | null;
  onSelectAgeGroup: (ageGroup: UserAgeGroup) => void;
  onBack: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function AgeSelectionView({
  settings,
  selectedAgeGroup,
  onSelectAgeGroup,
  onBack,
  soundEnabled = true,
  onToggleSound,
}: AgeSelectionViewProps) {
  useEffect(() => {
    soundService.stopSpeech();
    return () => {
      soundService.stopSpeech();
    };
  }, []);

  const ageOptions: {
    id: UserAgeGroup;
    range: string;
    titleTelugu: string;
    titleEnglish: string;
    descTelugu: string;
    descEnglish: string;
    icon: typeof Baby;
    badgeColor: string;
    borderColor: string;
    glowColor: string;
    gradientBg: string;
    timeThresholdTipTelugu: string;
    accentColor: string;
    iconBoxClass: string;
    selectedBorderClass: string;
    selectedBadgeClass: string;
    selectedGlow: string;
    tipColor: string;
  }[] = [
    {
      id: '0-12',
      range: 'Ages 0 - 12',
      titleTelugu: 'Children (Ages 0 - 12)',
      titleEnglish: 'Vision care, active play & healthy development',
      descTelugu: 'Recommended for eyesight protection and outdoor physical activities. Maintain mindful digital wellbeing.',
      descEnglish: 'Recommended for eyesight protection and outdoor physical activities. Maintain mindful digital wellbeing.',
      icon: Baby,
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
      borderColor: 'border-emerald-500/50 hover:border-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      gradientBg: 'from-[#1a3828]/60 via-[#132219]/70 to-[#0e1712]/90',
      timeThresholdTipTelugu: 'Target: Eyesight & Digital Balance',
      accentColor: 'text-emerald-400',
      iconBoxClass: 'bg-[#0e1f16]/90 border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400',
      selectedBorderClass: 'border-emerald-400 ring-2 ring-emerald-400/50',
      selectedBadgeClass: 'bg-emerald-500 text-black shadow-md',
      selectedGlow: '0 10px 30px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.5)',
      tipColor: 'text-emerald-400',
    },
    {
      id: '13-21',
      range: 'Ages 13 - 21',
      titleTelugu: 'Teens & Youth (Ages 13 - 21)',
      titleEnglish: 'Study focus, skill building & mindful learning',
      descTelugu: 'Ideal for study focus, exam preparation, and balanced digital habits. Practice mindful screen balance.',
      descEnglish: 'Ideal for study focus, exam preparation, and balanced digital habits. Practice mindful screen balance.',
      icon: GraduationCap,
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/60',
      borderColor: 'border-sky-500/50 hover:border-sky-400',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      gradientBg: 'from-[#0e2c40]/60 via-[#0a1e2c]/70 to-[#07131c]/90',
      timeThresholdTipTelugu: 'Target: Mindful Learning & Study Balance',
      accentColor: 'text-sky-400',
      iconBoxClass: 'bg-[#0b1b26]/90 border-sky-500/40 text-sky-400 group-hover:border-sky-400',
      selectedBorderClass: 'border-sky-400 ring-2 ring-sky-400/50',
      selectedBadgeClass: 'bg-sky-500 text-black shadow-md',
      selectedGlow: '0 10px 30px rgba(14, 165, 233, 0.4), 0 0 20px rgba(14, 165, 233, 0.5)',
      tipColor: 'text-sky-400',
    },
    {
      id: '21+',
      range: 'Ages 21+',
      titleTelugu: 'Adults & Professionals (Age 21+)',
      titleEnglish: 'Digital wellness, work balance & eye strain prevention',
      descTelugu: 'Productivity and digital balance for working professionals. Take frequent breaks during work screen time.',
      descEnglish: 'Productivity and digital balance for working professionals. Take frequent breaks during work screen time.',
      icon: UserCheck,
      badgeColor: 'bg-red-950 text-red-200 border-red-500/80',
      borderColor: 'border-red-500/70 hover:border-red-400',
      glowColor: 'rgba(239, 68, 68, 0.55)',
      gradientBg: 'from-[#4a0b0f]/85 via-[#2e0609]/90 to-[#160203]/98',
      timeThresholdTipTelugu: 'Target: Work-Life Balance & Wellness',
      accentColor: 'text-red-400',
      iconBoxClass: 'bg-[#220609]/90 border-red-500/60 text-red-400 group-hover:border-red-400',
      selectedBorderClass: 'border-red-500 ring-2 ring-red-500/60',
      selectedBadgeClass: 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)]',
      selectedGlow: '0 10px 30px rgba(239, 68, 68, 0.45), 0 0 25px rgba(239, 68, 68, 0.6)',
      tipColor: 'text-red-400',
    },
  ];

  const handleSelect = (ageGroup: UserAgeGroup) => {
    soundService.stopSpeech();
    soundService.playTempleBell(1.1);
    onSelectAgeGroup(ageGroup);
  };

  const handleBack = () => {
    soundService.stopSpeech();
    onBack();
  };

  return (
    <div
      className="relative h-screen max-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#140306] text-[#f5f2ed] select-none font-sans"
      id="age-selection-sanctum"
      style={{
        backgroundImage: `url(${ASSETS.templeBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Sacred Dark Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#140306]/85 via-[#1b050c]/70 to-[#120306]/95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12)_0%,transparent_70%)]" />

      {/* Top Header Bar with Website Logos */}
      <header className="relative z-20 pt-1.5 sm:pt-2 px-3 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleBack}
            id="age-select-back-btn"
            className="flex items-center space-x-1.5 rounded-full border border-[#ffd700]/50 bg-[#2b0c16] px-3 py-1 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] shadow-md transition-all font-royal"
            title="Back to Home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
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

        <div className="flex items-center space-x-2 text-xs font-bold text-[#ffd700]">
          <span className="font-royal tracking-wider text-[11px] sm:text-xs">॥ OM SHRI GANESHAYA NAMAHA ॥</span>
        </div>

        <div className="flex items-center space-x-2 pr-12 sm:pr-14">
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

      {/* Main Age Selection Sanctum Content */}
      <main className="relative z-20 mx-auto max-w-5xl px-3 sm:px-6 pt-1 sm:pt-2 pb-2 flex-1 flex flex-col items-center justify-between text-center min-h-0 w-full">
        {/* Header Block: Om + Title + Description */}
        <div className="flex flex-col items-center shrink-0 w-full">
          {/* Sacred Om Badge */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 border-[#ffd700] bg-[#260812] shadow-[0_0_15px_rgba(255,215,0,0.4)] shrink-0 mt-0.5"
          >
            <span className="text-sm sm:text-base font-bold text-[#ffd700] font-royal">ॐ</span>
          </motion.div>

          {/* Page Title */}
          <motion.h1
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-1 font-royal text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#ffd700] tracking-wide filter drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] text-royal-gold uppercase shrink-0"
          >
            Select Your Age Group
          </motion.h1>

          {/* Subtitle with Time Categories Highlight */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-0.5 font-marcellus text-xs sm:text-sm text-[#fbe2b5] max-w-xl leading-snug shrink-0"
          >
            Lord Ganesha evaluates digital screen time across <span className="text-[#ffd700] font-bold font-mono">0-3 / 3-5 / 5+</span> hours based on age group to grant sacred temple door blessings.
          </motion.p>
        </div>

        {/* 3 Age Group Cards Grid - Positioned cleanly down */}
        <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14 mb-auto w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4.5 shrink-0">
          {ageOptions.map((opt, idx) => {
            const Icon = opt.icon;
            const isSelected = selectedAgeGroup === opt.id;

            return (
              <motion.div
                key={opt.id}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + idx * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.02, translateY: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(opt.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 ${
                  isSelected ? opt.selectedBorderClass : opt.borderColor
                } bg-gradient-to-b ${opt.gradientBg} p-4 sm:p-4.5 lg:p-5 text-left shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[175px] sm:min-h-[195px]`}
                style={{
                  boxShadow: isSelected
                    ? opt.selectedGlow
                    : opt.id === '21+'
                    ? '0 8px 20px rgba(185, 28, 28, 0.3)'
                    : '0 6px 20px rgba(0, 0, 0, 0.6)',
                }}
                id={`age-select-card-${opt.id.replace('+', 'plus')}`}
              >
                {/* Top Row: Icon + Age Range Badge */}
                <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                  <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all shadow-md group-hover:scale-105 ${opt.iconBoxClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-black ${opt.badgeColor} shadow-md`}>
                    {opt.id}
                  </span>
                </div>

                {/* Age Title & Subtitle */}
                <div className="space-y-0.5">
                  <div className={`font-mono text-[10px] font-bold tracking-wider uppercase ${opt.accentColor}`}>
                    {opt.range}
                  </div>
                  <h3 className="font-royal text-sm sm:text-base font-bold text-white group-hover:text-white/95 transition-colors leading-snug">
                    {opt.titleTelugu}
                  </h3>
                  <div className="text-[11px] text-[#e8cba4]/75 font-sans font-medium">
                    {opt.titleEnglish}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-1.5 font-sans text-[11px] text-[#f5f2ed]/80 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {opt.descTelugu}
                </p>

                {/* Bottom Recommendation Tip */}
                <div className={`mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] font-sans font-semibold ${opt.tipColor}`}>
                  <span className="flex items-center space-x-1">
                    <Clock className={`h-3 w-3 ${opt.tipColor}`} />
                    <span>{opt.timeThresholdTipTelugu}</span>
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 ${opt.tipColor} group-hover:translate-x-1 transition-transform`} />
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className={`absolute top-2 right-2 flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-md font-sans ${opt.selectedBadgeClass}`}>
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Selected</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Privacy Note */}
        <div className="mt-auto py-1 flex items-center justify-center space-x-1.5 text-[10px] sm:text-xs text-[#e8cba4]/75 font-medium font-sans shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>100% Privacy — All Evaluation Runs Locally (No Images Uploaded)</span>
        </div>
      </main>

      {/* Bottom Bar: Sound Toggle & Product Brand */}
      <BottomBrandBar
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound || (() => {})}
        idPrefix="age-select"
      />
    </div>
  );
}
