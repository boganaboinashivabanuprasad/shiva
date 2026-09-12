import { useState, useEffect } from 'react';
import { AppPage, ArduinoConnectionState, DashboardSettings } from '../types';
import { arduinoService } from '../services/arduinoService';
import { soundService } from '../services/soundService';
import { WebsiteLogo } from './WebsiteLogo';
import { 
  Home, 
  ScanLine, 
  History, 
  BarChart3, 
  Cpu, 
  Settings, 
  Volume2, 
  VolumeX,
  Award
} from 'lucide-react';

interface NavbarProps {
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  settings?: DashboardSettings;
}

export function Navbar({ activePage, onPageChange, soundEnabled, onToggleSound, settings }: NavbarProps) {
  const [arduinoState, setArduinoState] = useState<ArduinoConnectionState>({
    isConnected: false,
    isSupported: true,
    portName: 'Disconnected',
    lastCommandSent: '',
    lastCommandTimestamp: null,
    baudRate: 9600,
    logs: [],
  });

  useEffect(() => {
    const unsub = arduinoService.subscribe((state) => {
      setArduinoState((prev) => ({
        ...prev,
        isConnected: state.isConnected,
        portName: state.portName,
        lastCommandSent: state.lastCommand,
        lastCommandTimestamp: state.lastCommandTimestamp,
        logs: state.logs,
      }));
    });
    return unsub;
  }, []);

  const navItems: { id: AppPage; labelTelugu: string; labelEnglish: string; icon: any }[] = [
    { id: 'home', labelTelugu: 'Dashboard', labelEnglish: 'Dashboard', icon: Home },
    { id: 'scan', labelTelugu: 'Live Scan', labelEnglish: 'Live Scan', icon: ScanLine },
    { id: 'certificate', labelTelugu: 'సంకల్ప పత్రం', labelEnglish: 'Certificate', icon: Award },
    { id: 'history', labelTelugu: 'History', labelEnglish: 'History', icon: History },
    { id: 'analytics', labelTelugu: 'Analytics', labelEnglish: 'Analytics', icon: BarChart3 },
    { id: 'arduino', labelTelugu: 'Hardware', labelEnglish: 'Hardware', icon: Cpu },
    { id: 'settings', labelTelugu: 'Settings', labelEnglish: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: AppPage) => {
    soundService.playScanBeep();
    onPageChange(page);
  };

  const handleSoundToggle = () => {
    onToggleSound();
    if (!soundEnabled) {
      setTimeout(() => soundService.playTempleBell(1.1), 50);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#ffd700]/30 bg-[#1b050b] shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        {/* Brand & English Title with Logo 1 */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex cursor-pointer items-center space-x-3 transition-transform hover:scale-[1.01]"
          id="brand-header-button"
        >
          {settings && settings.showLogos !== false ? (
            <WebsiteLogo
              logoNumber={1}
              url={settings.logo1Url}
              title={settings.logo1Title}
              size="md"
              scale={settings.logoSize || 'large'}
            />
          ) : (
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#ffd700]/60 bg-[#2f0c16] shadow-md">
              <span className="text-xl sm:text-2xl font-bold text-[#ffd700] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] font-royal">
                ॐ
              </span>
              <div className="absolute inset-0 rounded-full border border-[#ffd700]/30 animate-pulse" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-royal text-xl sm:text-2xl font-extrabold tracking-wider text-[#ffd700]">
                Samatulyam
              </h1>
              <span className="hidden sm:inline-block rounded-full border border-[#ffd700]/40 bg-[#35101a] px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#ffd700] uppercase shadow-xs">
                Ganesha Wellbeing
              </span>
            </div>
            <p className="font-marcellus text-[11px] sm:text-xs text-[#e8cba4]/80 font-medium hidden xs:block">
              Digital Wellbeing Awareness System
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2" id="main-navigation-bar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`group relative flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70 shadow-sm'
                    : 'text-[#e8cba4] hover:bg-[#2e0915] hover:text-[#ffd700] border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#ffd700]' : 'text-[#d4af37]/80'}`} />
                <span className="font-sans font-semibold hidden md:inline">{item.labelEnglish}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#ffd700] to-transparent" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status Badges & Controls with Logo 2 */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {settings && settings.showLogos !== false && (
            <WebsiteLogo
              logoNumber={2}
              url={settings.logo2Url}
              title={settings.logo2Title}
              size="md"
              scale={settings.logoSize || 'large'}
            />
          )}

          {/* Arduino Hardware Status Button */}
          <button
            id="nav-arduino-status-btn"
            onClick={() => handleNavClick('arduino')}
            title="Arduino Connection Status & Controls"
            className={`flex items-center space-x-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
              arduinoState.isConnected
                ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300 shadow-xs'
                : 'border-[#ffd700]/40 bg-[#2a0c16] text-[#ffd700] hover:border-[#ffd700]'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${arduinoState.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline font-mono">Arduino</span>
            <span className="text-[10px] opacity-90 font-sans">
              {arduinoState.isConnected ? 'Connected' : 'Connect USB'}
            </span>
          </button>

          {/* Sound Mute / Bell Toggle */}
          <button
            id="nav-sound-toggle-btn"
            onClick={handleSoundToggle}
            title={soundEnabled ? 'Mute Audio Chimes' : 'Unmute Audio Chimes'}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
              soundEnabled
                ? 'border-[#ffd700]/60 bg-[#35101a] text-[#ffd700] hover:bg-[#461523] shadow-xs'
                : 'border-[#ffd700]/30 bg-[#200810] text-[#e8cba4]/60 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
