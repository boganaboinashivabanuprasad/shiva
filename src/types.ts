export type ScreenTimeCategory =
  | '0_TO_3_HOURS'
  | '3_TO_5_HOURS'
  | '5_PLUS_HOURS'
  // Backward-compatibility aliases
  | '1_TO_3_DAYS'
  | '3_TO_5_DAYS'
  | '5_TO_7_DAYS'
  | '7_PLUS_DAYS'
  | 'HEALTHY'
  | 'WARNING'
  | 'HIGH_RISK';

export type UserAgeGroup = '0-12' | '13-21' | '21+';

export type AppPage = 'home' | 'age-select' | 'scan' | 'certificate' | 'history' | 'analytics' | 'arduino' | 'settings';

export interface VideoConfig {
  '0_TO_3_HOURS'?: string;
  '3_TO_5_HOURS'?: string;
  '5_PLUS_HOURS'?: string;
  '1_TO_3_DAYS'?: string;
  '3_TO_5_DAYS'?: string;
  '5_TO_7_DAYS'?: string;
  '7_PLUS_DAYS'?: string;
  [key: string]: string | undefined;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  screenTimeMinutes: number;
  screenTimeString: string;
  category: ScreenTimeCategory;
  ageGroup?: UserAgeGroup;
  teluguMessage: string;
  englishMessage: string;
  arduinoCommand: string;
  doorAction: string;
  confidence: number;
  source: 'screen_capture' | 'camera_manual' | 'upload' | 'demo_trigger' | 'camera_auto';
  videoUrl?: string;
  photoUrl?: string;
}

export interface AgeGroupVideoDetails {
  default?: string;
  defaultName?: string;
  healthy?: string; // 0-3 hours
  healthyName?: string;
  moderate?: string; // 3-5 hours
  moderateName?: string;
  highRisk?: string; // 5+ hours
  highRiskName?: string;
}

export interface AgeBasedVideosConfig {
  '0-12'?: AgeGroupVideoDetails;
  '13-21'?: AgeGroupVideoDetails;
  '21+'?: AgeGroupVideoDetails;
  [key: string]: AgeGroupVideoDetails | undefined;
}

export interface DashboardSettings {
  healthyThresholdHours: number; // default: 3 (0-3 Hours)
  warningThresholdHours: number; // default: 5 (3-5 Hours)

  // --- Hardware Motor & Timing Configuration ---
  // 1. Screen Time 0-3h: runs for 8s in Direction 1 (for every user)
  time0To3Dir1Ms: number; // default: 8000
  // 2. Screen Time 3-5h: runs for 8s in Direction 1 (SLOW)
  time3To5Dir1Ms: number; // default: 8000
  // 3. Screen Time 5+h Initial: runs for 3s in Direction 1 and 4s in Direction 2
  time5PlusDir1Ms: number; // default: 3000
  time5PlusDir2Ms: number; // default: 4000
  // 4. Screen Time 5+h After Promise: runs for 8s in Direction 1
  time5PlusPromiseDir1Ms: number; // default: 8000
  // 5. Coming to Home page: runs for 8s in Direction 2
  timeHomeCloseDir2Ms: number; // default: 8000
  autoCloseOnHome: boolean; // default: true

  // Backward compatibility aliases
  fullOpenTimeMs: number; // default: 8000
  slowOpenTimeMs: number; // default: 8000
  partialOpenTimeMs: number; // default: 3000
  twentyPercentOpenTimeMs: number; // default: 4000
  closeTimeMs: number; // default: 8000

  normalMotorSpeed: number; // 0-255, default: 220
  slowMotorSpeed: number; // 0-255, default: 130
  language: 'te' | 'en' | 'both';
  soundEnabled: boolean;
  petalsEnabled: boolean;
  autoScanIntervalMs: number; // ms between OCR passes
  privacyNoticeAcknowledged: boolean;
  selectedCameraId?: string;
  themeGlowIntensity: 'subtle' | 'radiant' | 'divine';
  videoUrls: VideoConfig;
  videos?: VideoConfig;
  ageVideos?: AgeBasedVideosConfig;
  autoPlayVideo: boolean;
  doorOpenVideoDelaySec: number; // 8s default: after door open for 8sec, play video at full door open on relay and play video and its audio
  relayOnDelaySec: number; // 5s default: at 5th second during door opening, turn on relay (sanctum light)
  // Voice Guidance Settings
  voiceGuidanceEnabled: boolean;
  voiceGuidanceType: 'default_divine' | 'custom_audio';
  voiceGuidanceCustomAudioUrl?: string;
  voiceGuidanceCustomAudioName?: string;
  voiceGuidanceCustomText?: string;
  autoPlayVoiceOnScanEnter: boolean;
  // Manual Door Open (Darshanam) Video & Audio Settings
  manualDoorVideoUrl?: string;
  manualDoorVideoName?: string;
  manualDoorAudioUrl?: string;
  manualDoorAudioName?: string;
  // 5+ Hours Overuse Sacred Promise Settings
  promiseVoiceEnabled?: boolean;
  promiseVoiceAudioUrl?: string;
  promiseVoiceAudioName?: string;
  promiseCustomText?: string;
  requireVoicePromiseFor5Plus?: boolean;
  // Trained Devotee Promise Voice Recognition Settings
  trainedPromisePhrase?: string;
  trainedPromiseEnglishPhrase?: string;
  trainedPromiseKeywords?: string[];
  trainedPromiseAudioUrl?: string;
  trainedVoiceMatchSensitivity?: 'lenient' | 'balanced' | 'strict';
  trainedVoiceStatus?: 'trained' | 'default';
  trainedVoiceTimestamp?: number;
  // Age Selection Screen Navigation Voice Settings
  ageNavVoiceEnabled?: boolean;
  ageNavVoiceAudioUrl?: string;
  ageNavVoiceAudioName?: string;
  ageNavVoiceCustomText?: string;
  autoPlayAgeNavVoice?: boolean;
  // Website Dual Logos Configuration (Round Cropped)
  showLogos: boolean;
  logoSize?: 'medium' | 'large' | 'xlarge';
  logo1Url?: string;
  logo1Name?: string;
  logo1Title?: string;
  logo2Url?: string;
  logo2Name?: string;
  logo2Title?: string;
}

export interface SerialLog {
  id: string;
  time: string;
  direction: 'TX' | 'RX' | 'SYS';
  text: string;
}

export interface ArduinoConnectionState {
  isConnected: boolean;
  isSupported: boolean;
  isVirtual: boolean;
  portName: string;
  lastCommandSent: string;
  lastCommandTimestamp: number | null;
  baudRate: number;
  logs: SerialLog[];
  connectionError?: string | null;
  isInsideIframe: boolean;
  isDoorOpen?: boolean;
  isRelayOn?: boolean;
  doorMotion?: 'idle' | 'opening' | 'open' | 'closing' | 'closed';
}

export type ArduinoCommand =
  | 'OPEN_0_3'
  | 'OPEN_3_5'
  | 'OPEN_5_PLUS'
  | 'OPEN_AFTER_PROMISE'
  | 'CLOSE_HOME'
  | 'OPEN_FULL'
  | 'OPEN_SLOW'
  | 'OPEN_PARTIAL'
  | 'OPEN_20_CLOSE'
  | 'CLOSE'
  | 'STOP'
  | 'RELAY_ON'
  | 'RELAY_OFF'
  | 'LED_ON'
  | 'LED_OFF';

export interface WellbeingTip {
  id: string;
  titleTelugu: string;
  titleEnglish: string;
  descTelugu: string;
  descEnglish: string;
  icon: string;
}

export const DEFAULT_SETTINGS: DashboardSettings = {
  healthyThresholdHours: 3,
  warningThresholdHours: 5,

  // Hardware Timing Rules (Configurable in Settings):
  // 1. 0-3h: runs for 8s in Direction 1
  time0To3Dir1Ms: 8000,
  // 2. 3-5h: runs for 8s in Direction 1 SLOW
  time3To5Dir1Ms: 8000,
  // 3. 5+h Initial: runs for 3s in Direction 1 and 4s in Direction 2
  time5PlusDir1Ms: 3000,
  time5PlusDir2Ms: 4000,
  // 4. 5+h After Promise: runs for 8s in Direction 1
  time5PlusPromiseDir1Ms: 8000,
  // 5. Coming to Home page: runs for 8s in Direction 2
  timeHomeCloseDir2Ms: 8000,
  autoCloseOnHome: true,

  // Backward compatibility aliases
  fullOpenTimeMs: 8000,
  slowOpenTimeMs: 8000,
  partialOpenTimeMs: 3000,
  twentyPercentOpenTimeMs: 4000,
  closeTimeMs: 8000,

  normalMotorSpeed: 220,
  slowMotorSpeed: 130,
  language: 'both',
  soundEnabled: true,
  petalsEnabled: true,
  autoScanIntervalMs: 1500,
  privacyNoticeAcknowledged: true,
  themeGlowIntensity: 'divine',
  videoUrls: {
    '0_TO_3_HOURS': '/videos/ganesha_1_3.mp4',
    '3_TO_5_HOURS': '/videos/ganesha_3_5.mp4',
    '5_PLUS_HOURS': '/videos/ganesha_7_plus.mp4',
    '1_TO_3_DAYS': '/videos/ganesha_1_3.mp4',
    '3_TO_5_DAYS': '/videos/ganesha_3_5.mp4',
    '5_TO_7_DAYS': '/videos/ganesha_5_7.mp4',
    '7_PLUS_DAYS': '/videos/ganesha_7_plus.mp4',
  },
  ageVideos: {
    '0-12': {
      default: '/videos/ganesha_1_3.mp4',
      defaultName: 'Kids Sacred Darshanam Video',
      healthy: '/videos/ganesha_1_3.mp4',
      healthyName: 'Kids Healthy Screen Habit Video (0-3h)',
      moderate: '/videos/ganesha_3_5.mp4',
      moderateName: 'Kids Moderate Screen Habit Video (3-5h)',
      highRisk: '/videos/ganesha_7_plus.mp4',
      highRiskName: 'Kids Eye-Care & Overuse Warning Video (5+h)',
    },
    '13-21': {
      default: '/videos/ganesha_3_5.mp4',
      defaultName: 'Youth & Teens Darshanam Video',
      healthy: '/videos/ganesha_1_3.mp4',
      healthyName: 'Youth Focus & Balance Video (0-3h)',
      moderate: '/videos/ganesha_3_5.mp4',
      moderateName: 'Youth Study & Screen Limit Video (3-5h)',
      highRisk: '/videos/ganesha_7_plus.mp4',
      highRiskName: 'Youth Mindful Break & Detox Video (5+h)',
    },
    '21+': {
      default: '/videos/ganesha_7_plus.mp4',
      defaultName: 'Adults Devotional Darshanam Video',
      healthy: '/videos/ganesha_1_3.mp4',
      healthyName: 'Adults Digital Harmony Video (0-3h)',
      moderate: '/videos/ganesha_3_5.mp4',
      moderateName: 'Adults Work-Life Balance Video (3-5h)',
      highRisk: '/videos/ganesha_7_plus.mp4',
      highRiskName: 'Adults Digital Wellbeing & Eye-Rest Video (5+h)',
    },
  },
  autoPlayVideo: true,
  doorOpenVideoDelaySec: 8,
  relayOnDelaySec: 5,
  voiceGuidanceEnabled: true,
  voiceGuidanceType: 'default_divine',
  voiceGuidanceCustomAudioUrl: '',
  voiceGuidanceCustomAudioName: '',
  voiceGuidanceCustomText: 'Om Shri Ganeshaya Namaha. Please position your screen time display in front of the camera and press the Scan button.',
  autoPlayVoiceOnScanEnter: true,
  manualDoorVideoUrl: '/videos/ganesha_1_3.mp4',
  manualDoorVideoName: 'Default Divine Darshanam Video',
  manualDoorAudioUrl: '',
  manualDoorAudioName: '',
  promiseVoiceEnabled: true,
  promiseVoiceAudioUrl: '',
  promiseVoiceAudioName: '',
  promiseCustomText: 'ఓం శ్రీ గణేశాయ నమః. నాయనా, ఈరోజు నీ మొబైల్ స్క్రీన్ సమయం 5 గంటలు దాటిపోయింది. నీ నేత్రాలు మరియు ఆరోగ్యం కోసం గణపతికి ఒక పవిత్రమైన ప్రమాణం చేయి: నేను ఫోన్ తక్కువ చూస్తాను అని చెప్పు.',
  requireVoicePromiseFor5Plus: true,
  trainedPromisePhrase: 'నేను ఫోన్ తక్కువ చూస్తాను',
  trainedPromiseEnglishPhrase: 'I promise to use my phone less',
  trainedPromiseKeywords: ['ఫోన్', 'తక్కువ', 'చూస్తాను', 'తగ్గిస్తాను', 'ప్రమాణం', 'ఫోను', 'promise', 'phone', 'less', 'reduce', 'vow', 'use'],
  trainedPromiseAudioUrl: '',
  trainedVoiceMatchSensitivity: 'lenient',
  trainedVoiceStatus: 'default',
  trainedVoiceTimestamp: Date.now(),
  ageNavVoiceEnabled: false,
  ageNavVoiceAudioUrl: '',
  ageNavVoiceAudioName: '',
  ageNavVoiceCustomText: '',
  autoPlayAgeNavVoice: false,
  showLogos: true,
  logoSize: 'large',
  logo1Url: '',
  logo1Name: 'Default Sacred Ganesha Emblem',
  logo1Title: 'Bala Ganesha Temple',
  logo2Url: '',
  logo2Name: 'Default Wellbeing Emblem',
  logo2Title: 'KProjectXX Digital Wellbeing',
};

export const CATEGORY_DETAILS: Record<string, {
  labelTelugu: string;
  labelEnglish: string;
  shortTelugu: string;
  ageLabel: string;
  daysRange: string;
  colorClass: string;
  badgeBg: string;
  borderGlow: string;
  glowRgb: string;
  teluguMessage: string;
  englishMessage: string;
  arduinoCommand: ArduinoCommand;
  doorActionTextTelugu: string;
  doorActionTextEnglish: string;
  defaultVideoPath: string;
  accentColor: string;
}> = {
  '0_TO_3_HOURS': {
    labelTelugu: '0-3 Hours (Healthy & Balanced - Full Blessings)',
    labelEnglish: '0-3 HOURS (HEALTHY & BALANCED - FULL BLESSINGS)',
    shortTelugu: '0-3 Hours (Healthy)',
    ageLabel: '0 - 3 Hours',
    daysRange: '0-3 Hours',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
    borderGlow: 'rgba(16, 185, 129, 0.6)',
    glowRgb: '16, 185, 129',
    teluguMessage: '॥ Om Gam Ganapataye Namaha ॥\nVakratunda Mahakaya Suryakoti Samaprabha |\nNirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    englishMessage: '॥ Om Gam Ganapataye Namaha ॥ Vakratunda Mahakaya Suryakoti Samaprabha | Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    arduinoCommand: 'OPEN_0_3',
    doorActionTextTelugu: 'Motor runs for 8s in Direction 1 (Normal Speed)',
    doorActionTextEnglish: 'Motor runs for 8s in Direction 1 (Normal Speed)',
    defaultVideoPath: '/videos/ganesha_1_3.mp4',
    accentColor: '#10b981',
  },
  '3_TO_5_HOURS': {
    labelTelugu: '3-5 Hours (Moderate Screen Time - Steady Blessings)',
    labelEnglish: '3-5 HOURS (MODERATE / MINDFUL - PARTIAL BLESSINGS)',
    shortTelugu: '3-5 Hours (Moderate)',
    ageLabel: '3 - 5 Hours',
    daysRange: '3-5 Hours',
    colorClass: 'text-sky-400',
    badgeBg: 'bg-sky-950/90 text-sky-300 border-sky-500/50',
    borderGlow: 'rgba(14, 165, 233, 0.6)',
    glowRgb: '14, 165, 233',
    teluguMessage: '॥ Om Shri Ganeshaya Namaha ॥\nEkadantam Mahakayam Taptakanchana Sannibham |\nLambodaram Vishalaksham Vandeham Gananayakam ॥',
    englishMessage: '॥ Om Shri Ganeshaya Namaha ॥ Ekadantam Mahakayam Taptakanchana Sannibham | Lambodaram Vishalaksham Vandeham Gananayakam ॥',
    arduinoCommand: 'OPEN_3_5',
    doorActionTextTelugu: 'Motor runs for 8s in Direction 1 (Slow Speed)',
    doorActionTextEnglish: 'Motor runs for 8s in Direction 1 (Slow Speed)',
    defaultVideoPath: '/videos/ganesha_3_5.mp4',
    accentColor: '#0ea5e9',
  },
  '5_PLUS_HOURS': {
    labelTelugu: '5+ Hours (Overuse / Critical Alert - Auto Close)',
    labelEnglish: '5+ HOURS (OVERUSE / WARNING - IMMEDIATE AUTO-CLOSE)',
    shortTelugu: '5+ Hours (Overuse)',
    ageLabel: '5+ Hours',
    daysRange: '5+ Hours',
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
    borderGlow: 'rgba(244, 63, 94, 0.6)',
    glowRgb: '244, 63, 94',
    teluguMessage: '॥ Om Vighnarajaya Namaha ॥\nVidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam |\nPutrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    englishMessage: '॥ Om Vighnarajaya Namaha ॥ Vidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam | Putrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    arduinoCommand: 'OPEN_5_PLUS',
    doorActionTextTelugu: 'Motor runs 3s in Dir 1 -> 4s in Dir 2 -> After Promise runs 8s in Dir 1',
    doorActionTextEnglish: 'Motor runs 3s in Dir 1 -> 4s in Dir 2 -> After Promise runs 8s in Dir 1',
    defaultVideoPath: '/videos/ganesha_7_plus.mp4',
    accentColor: '#f43f5e',
  },
  '1_TO_3_DAYS': {
    labelTelugu: '1-3 Hours (Healthy & Balanced)',
    labelEnglish: '1-3 HOURS (HEALTHY & BALANCED)',
    shortTelugu: '1-3 Hours (Healthy)',
    ageLabel: '1 - 3 Hours',
    daysRange: '1-3 Hours',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
    borderGlow: 'rgba(16, 185, 129, 0.6)',
    glowRgb: '16, 185, 129',
    teluguMessage: '॥ Om Gam Ganapataye Namaha ॥\nVakratunda Mahakaya Suryakoti Samaprabha |\nNirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    englishMessage: '॥ Om Gam Ganapataye Namaha ॥ Vakratunda Mahakaya Suryakoti Samaprabha | Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    arduinoCommand: 'OPEN_FULL',
    doorActionTextTelugu: 'Temple door opens fully (100% Full Open 8s)',
    doorActionTextEnglish: 'Temple door opens fully (100% Full Open)',
    defaultVideoPath: '/videos/ganesha_1_3.mp4',
    accentColor: '#10b981',
  },
  '3_TO_5_DAYS': {
    labelTelugu: '3-5 Hours (Moderate Screen Time)',
    labelEnglish: '3-5 HOURS (MODERATE / MINDFUL)',
    shortTelugu: '3-5 Hours (Moderate)',
    ageLabel: '3 - 5 Hours',
    daysRange: '3-5 Hours',
    colorClass: 'text-sky-400',
    badgeBg: 'bg-sky-950/90 text-sky-300 border-sky-500/50',
    borderGlow: 'rgba(14, 165, 233, 0.6)',
    glowRgb: '14, 165, 233',
    teluguMessage: '॥ Om Shri Ganeshaya Namaha ॥\nEkadantam Mahakayam Taptakanchana Sannibham |\nLambodaram Vishalaksham Vandeham Gananayakam ॥',
    englishMessage: '॥ Om Shri Ganeshaya Namaha ॥ Ekadantam Mahakayam Taptakanchana Sannibham | Lambodaram Vishalaksham Vandeham Gananayakam ॥',
    arduinoCommand: 'OPEN_SLOW',
    doorActionTextTelugu: 'Temple door opens steadily for 4 seconds (Open 4s)',
    doorActionTextEnglish: 'Temple door opens for 4 seconds (Open 4s)',
    defaultVideoPath: '/videos/ganesha_3_5.mp4',
    accentColor: '#0ea5e9',
  },
  '5_TO_7_DAYS': {
    labelTelugu: '5-7 Hours (Warning / Take Break)',
    labelEnglish: '5-7 HOURS (WARNING / TAKE BREAK)',
    shortTelugu: '5-7 Hours (Warning)',
    ageLabel: '5 - 7 Hours',
    daysRange: '5-7 Hours',
    colorClass: 'text-amber-400',
    badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
    borderGlow: 'rgba(245, 158, 11, 0.6)',
    glowRgb: '245, 158, 11',
    teluguMessage: '॥ Om Gajananaya Namaha ॥\nAgajanana Padmarkam Gajananam Aharnisham |\nAnekadam Tam Bhaktanam Ekadantam Upasmahe ॥',
    englishMessage: '॥ Om Gajananaya Namaha ॥ Agajanana Padmarkam Gajananam Aharnisham | Anekadam Tam Bhaktanam Ekadantam Upasmahe ॥',
    arduinoCommand: 'OPEN_PARTIAL',
    doorActionTextTelugu: 'Temple door opens for 2 seconds (Open 2s)',
    doorActionTextEnglish: 'Temple door opens for 2 seconds (Open 2s)',
    defaultVideoPath: '/videos/ganesha_5_7.mp4',
    accentColor: '#f59e0b',
  },
  '7_PLUS_DAYS': {
    labelTelugu: '7+ Hours (Critical Overuse)',
    labelEnglish: '7+ HOURS (CRITICAL / OVERUSE)',
    shortTelugu: '7+ Hours (Critical)',
    ageLabel: '7+ Hours',
    daysRange: '7+ Hours',
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
    borderGlow: 'rgba(244, 63, 94, 0.6)',
    glowRgb: '244, 63, 94',
    teluguMessage: '॥ Om Vighnarajaya Namaha ॥\nVidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam |\nPutrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    englishMessage: '॥ Om Vighnarajaya Namaha ॥ Vidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam | Putrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    arduinoCommand: 'OPEN_20_CLOSE',
    doorActionTextTelugu: 'Temple door opens 2 seconds then auto-closes in 26s',
    doorActionTextEnglish: 'Temple door opens for 2 seconds then auto-closes completely in 26s',
    defaultVideoPath: '/videos/ganesha_7_plus.mp4',
    accentColor: '#f43f5e',
  },
  // Backward compatibility aliases
  HEALTHY: {
    labelTelugu: '1-3 Hours (Healthy & Balanced)',
    labelEnglish: '1-3 HOURS (HEALTHY & BALANCED)',
    shortTelugu: '1-3 Hours (Healthy)',
    ageLabel: '1 - 3 Hours',
    daysRange: '1-3 Hours',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
    borderGlow: 'rgba(16, 185, 129, 0.6)',
    glowRgb: '16, 185, 129',
    teluguMessage: '॥ Om Gam Ganapataye Namaha ॥\nVakratunda Mahakaya Suryakoti Samaprabha |\nNirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    englishMessage: '॥ Om Gam Ganapataye Namaha ॥ Vakratunda Mahakaya Suryakoti Samaprabha | Nirvighnam Kuru Me Deva Sarvakaryeshu Sarvada ॥',
    arduinoCommand: 'OPEN_FULL',
    doorActionTextTelugu: 'Temple door opens fully for 8 seconds (100% Full Open 8s)',
    doorActionTextEnglish: 'Temple door opens fully for 8 seconds (100% Full Open 8s)',
    defaultVideoPath: '/videos/ganesha_1_3.mp4',
    accentColor: '#10b981',
  },
  WARNING: {
    labelTelugu: '5-7 Hours (Warning / Take Break)',
    labelEnglish: '5-7 HOURS (WARNING / TAKE BREAK)',
    shortTelugu: '5-7 Hours (Warning)',
    ageLabel: '5 - 7 Hours',
    daysRange: '5-7 Hours',
    colorClass: 'text-amber-400',
    badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/50',
    borderGlow: 'rgba(245, 158, 11, 0.6)',
    glowRgb: '245, 158, 11',
    teluguMessage: '॥ Om Gajananaya Namaha ॥\nAgajanana Padmarkam Gajananam Aharnisham |\nAnekadam Tam Bhaktanam Ekadantam Upasmahe ॥',
    englishMessage: '॥ Om Gajananaya Namaha ॥ Agajanana Padmarkam Gajananam Aharnisham | Anekadam Tam Bhaktanam Ekadantam Upasmahe ॥',
    arduinoCommand: 'OPEN_PARTIAL',
    doorActionTextTelugu: 'Temple door opens for 2 seconds (Open 2s)',
    doorActionTextEnglish: 'Temple door opens for 2 seconds (Open 2s)',
    defaultVideoPath: '/videos/ganesha_5_7.mp4',
    accentColor: '#f59e0b',
  },
  HIGH_RISK: {
    labelTelugu: '7+ Hours (Critical Overuse)',
    labelEnglish: '7+ HOURS (CRITICAL / OVERUSE)',
    shortTelugu: '7+ Hours (Critical)',
    ageLabel: '7+ Hours',
    daysRange: '7+ Hours',
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
    borderGlow: 'rgba(244, 63, 94, 0.6)',
    glowRgb: '244, 63, 94',
    teluguMessage: '॥ Om Vighnarajaya Namaha ॥\nVidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam |\nPutrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    englishMessage: '॥ Om Vighnarajaya Namaha ॥ Vidyarthi Labhate Vidyam Dhanarthi Labhate Dhanam | Putrarthi Labhate Putran Moksharthi Labhate Gatim ॥',
    arduinoCommand: 'OPEN_20_CLOSE',
    doorActionTextTelugu: 'Temple door opens 2 seconds then auto-closes in 26s',
    doorActionTextEnglish: 'Temple door opens 20% for 2 seconds then auto-closes completely in 26s',
    defaultVideoPath: '/videos/ganesha_7_plus.mp4',
    accentColor: '#f43f5e',
  },
};

export const WELLBEING_TIPS: WellbeingTip[] = [
  {
    id: 'tip-1',
    titleTelugu: '20-20-20 Eye Protection Rule',
    titleEnglish: '20-20-20 Eye Protection Rule',
    descTelugu: 'Every 20 minutes, look at an object 20 feet away for 20 seconds to relax your optic nerves.',
    descEnglish: 'Every 20 minutes, look at an object 20 feet away for 20 seconds to relax your optic nerves.',
    icon: 'Eye',
  },
  {
    id: 'tip-2',
    titleTelugu: 'No Screens Before Bedtime',
    titleEnglish: 'No Screens Before Bedtime',
    descTelugu: 'Avoid digital screens 1 hour before sleep to boost natural melatonin and deep restorative sleep.',
    descEnglish: 'Avoid digital screens 1 hour before sleep to boost natural melatonin and deep restorative sleep.',
    icon: 'Moon',
  },
  {
    id: 'tip-3',
    titleTelugu: 'Outdoor Sports & Physical Play',
    titleEnglish: 'Outdoor Sports & Physical Play',
    descTelugu: 'Spend at least 60 minutes outdoors daily for Vitamin D, bone strength, and joyful energy.',
    descEnglish: 'Spend at least 60 minutes outdoors daily for Vitamin D, bone strength, and joyful energy.',
    icon: 'Sun',
  },
  {
    id: 'tip-4',
    titleTelugu: 'Learn, Create, Do Not Get Addicted',
    titleEnglish: 'Learn, Create, Do Not Get Addicted',
    descTelugu: 'Use smart devices for learning and creativity rather than mindless endless scrolling.',
    descEnglish: 'Use smart devices for learning and creativity rather than mindless endless scrolling.',
    icon: 'Sparkles',
  },
  {
    id: 'tip-5',
    titleTelugu: 'Family Dining Screen-Free Zone',
    titleEnglish: 'Family Dining Screen-Free Zone',
    descTelugu: 'Keep meal times 100% screen-free to foster warm conversations with parents and siblings.',
    descEnglish: 'Keep meal times 100% screen-free to foster warm conversations with parents and siblings.',
    icon: 'HeartHandshake',
  },
];
