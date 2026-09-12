import { useState, useEffect, useRef } from 'react';
import { AppPage, DashboardSettings, ScanRecord, DEFAULT_SETTINGS, ScreenTimeCategory, UserAgeGroup } from './types';
import { storageService } from './services/storageService';
import { soundService } from './services/soundService';
import { arduinoService } from './services/arduinoService';
import { FloatingPetals } from './components/FloatingPetals';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AgeSelectionView } from './components/AgeSelectionView';
import { LiveScanner } from './components/LiveScanner';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { ArduinoView } from './components/ArduinoView';
import { SettingsView } from './components/SettingsView';
import { SankalpamCertificateView } from './components/SankalpamCertificateView';
import { WellbeingTipsModal } from './components/WellbeingTipsModal';
import { BottomBrandBar } from './components/BottomBrandBar';
import { ShieldCheck, X, LayoutGrid, Home, ScanLine, History, BarChart3, Cpu, Settings as SettingsIcon, Users, Award } from 'lucide-react';

export function App() {
  const [activePage, setActivePage] = useState<AppPage>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (
        page === 'certificate' ||
        page === 'history' ||
        page === 'voice-studio' ||
        page === 'settings' ||
        page === 'hardware' ||
        page === 'dashboard' ||
        page === 'users' ||
        page === 'scan'
      ) {
        return page as AppPage;
      }
    }
    return 'home';
  });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<UserAgeGroup | null>(null);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState<boolean>(false);
  const [arduinoConnected, setArduinoConnected] = useState<boolean>(false);
  const [showNavDrawer, setShowNavDrawer] = useState<boolean>(false);

  useEffect(() => {
    // 1. Instant synchronous load from localStorage cache
    const initialSettings = storageService.getSettings();
    setSettings(initialSettings);
    soundService.setMuted(!initialSettings.soundEnabled);

    // 2. Hydrate persisted media blobs & deep settings from IndexedDB
    storageService.loadPersistedSettings().then((hydrated) => {
      setSettings(hydrated);
      soundService.setMuted(!hydrated.soundEnabled);
    }).catch(() => {});

    // 3. Prewarm Lord Ganesha divine AI voices in memory
    soundService.prewarmAllVoices();

    const unsubArduino = arduinoService.subscribe((state) => {
      setArduinoConnected(state.isConnected);
    });

    const unsubStorage = storageService.subscribe((updated) => {
      setSettings(updated);
    });

    return () => {
      unsubArduino();
      unsubStorage();
    };
  }, []);

  // Synchronize active settings to Arduino hardware service
  useEffect(() => {
    arduinoService.setSettings(settings);
  }, [settings]);

  // Door Auto-Close on Home Return:
  // "only after playing video and video complete after +10sec you should go for home only then doors should close"
  // "when i open dashboard for the first time doors are closing" -> Fixed with initial mount guard & isDoorOpen check
  const isInitialMountRef = useRef<boolean>(true);
  const prevPageRef = useRef<AppPage>(activePage);

  useEffect(() => {
    // Prevent doors from closing on initial dashboard mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevPageRef.current = activePage;
      return;
    }

    // Only close if returning to 'home' from another page AND doors are currently open
    if (activePage === 'home' && prevPageRef.current !== 'home') {
      if (settings.autoCloseOnHome !== false && arduinoService.getIsDoorOpen()) {
        arduinoService.sendCommand('CLOSE_HOME');
      }
    }
    prevPageRef.current = activePage;
  }, [activePage, settings.autoCloseOnHome]);

  const handleUpdateSettings = (newSettings: DashboardSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    soundService.setMuted(!newSettings.soundEnabled);
  };

  const handleUpdateVideoUrl = (category: ScreenTimeCategory, url: string) => {
    const updatedVideos = {
      ...settings.videos,
      [category]: url,
    };
    const updatedSettings = {
      ...settings,
      videos: updatedVideos,
    };
    setSettings(updatedSettings);
    storageService.saveSettings(updatedSettings);
  };

  const handleToggleSound = () => {
    const newSoundState = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: newSoundState };
    setSettings(updated);
    storageService.saveSettings(updated);
    soundService.setMuted(!newSoundState);
  };

  const handleScanCompleted = (record: ScanRecord) => {
    // Save is handled inside scanner
  };

  const isFullImmersiveView = activePage === 'home' || activePage === 'scan' || activePage === 'age-select';

  return (
    <div className="relative min-h-screen bg-[#140306] text-[#f5f2ed] selection:bg-[#ffd700]/30 selection:text-[#ffd700] font-sans antialiased overflow-x-hidden flex flex-col justify-between">
      {/* Background Floating Lotus Petals Canvas */}
      {settings.petalsEnabled && <FloatingPetals count={24} />}

      {/* Quick Menu Launcher Button on Immersive Views (Top Right corner) */}
      {isFullImmersiveView && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50">
          <button
            onClick={() => setShowNavDrawer((prev) => !prev)}
            id="open-menu-drawer-btn"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ffd700]/60 bg-[#2b0c16] text-[#ffd700] hover:bg-[#3d1220] hover:border-[#ffd700] shadow-lg transition-all"
            title="Navigation Menu"
          >
            {showNavDrawer ? <X className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Navigation Modal / Drawer */}
      {showNavDrawer && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/80 p-4 animate-in fade-in">
          <div className="w-72 rounded-2xl border-2 border-[#ffd700]/70 bg-[#220710] p-4 shadow-2xl space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-royal text-lg font-bold text-[#ffd700] tracking-wider">SAMATHULYAM</span>
              </div>
              <button
                onClick={() => setShowNavDrawer(false)}
                className="rounded-full p-1 text-[#e8cba4] hover:text-[#ffd700] hover:bg-[#350d1a] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 font-sans text-sm">
              <button
                onClick={() => {
                  setActivePage('home');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'home' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <Home className="h-4 w-4 text-[#ffd700]" />
                <span>Home Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('age-select');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'age-select' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <Users className="h-4 w-4 text-[#ffd700]" />
                <span>Age Selection (0-12 / 13-21 / 21+)</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('scan');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'scan' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <ScanLine className="h-4 w-4 text-[#ffd700]" />
                <span>Screen Time Scan</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('certificate');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'certificate' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <Award className="h-4 w-4 text-[#ffd700]" />
                <span>Sankalpam Certificate</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('history');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'history' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <History className="h-4 w-4 text-[#ffd700]" />
                <span>Scan History</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('analytics');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'analytics' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <BarChart3 className="h-4 w-4 text-[#ffd700]" />
                <span>Analytics & Insights</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('arduino');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'arduino' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <Cpu className="h-4 w-4 text-[#ffd700]" />
                <span>Arduino Hardware & Doors</span>
              </button>

              <button
                onClick={() => {
                  setActivePage('settings');
                  setShowNavDrawer(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                  activePage === 'settings' ? 'bg-[#3d101c] text-[#ffd700] font-bold border border-[#ffd700]/70' : 'text-[#f5f2ed] hover:bg-[#2e0915]'
                }`}
              >
                <SettingsIcon className="h-4 w-4 text-[#ffd700]" />
                <span>System Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Navbar for Other Views */}
      {!isFullImmersiveView && (
        <Navbar
          activePage={activePage}
          onPageChange={setActivePage}
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          settings={settings}
        />
      )}

      {/* Main Routing Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {activePage === 'home' && (
          <DashboardView
            settings={settings}
            onNavigate={setActivePage}
            onOpenTips={() => setIsTipsModalOpen(true)}
            soundEnabled={settings.soundEnabled}
            onToggleSound={handleToggleSound}
            arduinoConnected={arduinoConnected}
          />
        )}

        {activePage === 'age-select' && (
          <AgeSelectionView
            settings={settings}
            selectedAgeGroup={selectedAgeGroup}
            soundEnabled={settings.soundEnabled}
            onToggleSound={handleToggleSound}
            onSelectAgeGroup={(age) => {
              setSelectedAgeGroup(age);
              setActivePage('scan');
            }}
            onBack={() => setActivePage('home')}
          />
        )}

        {activePage === 'scan' && (
          <LiveScanner
            settings={settings}
            ageGroup={selectedAgeGroup}
            onNavigate={setActivePage}
            onScanCompleted={handleScanCompleted}
            soundEnabled={settings.soundEnabled}
            onToggleSound={handleToggleSound}
            arduinoConnected={arduinoConnected}
            onUpdateVideoUrl={handleUpdateVideoUrl}
          />
        )}

        {activePage === 'history' && <HistoryView onNavigate={setActivePage} />}

        {activePage === 'certificate' && (
          <SankalpamCertificateView
            settings={settings}
            onNavigate={setActivePage}
            defaultAgeGroup={selectedAgeGroup || '0-12'}
          />
        )}

        {activePage === 'analytics' && <AnalyticsView />}

        {activePage === 'arduino' && <ArduinoView settings={settings} onUpdateSettings={handleUpdateSettings} />}

        {activePage === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>

      {/* Standard Bottom Brand Bar across all non-immersive pages */}
      {!isFullImmersiveView && (
        <BottomBrandBar
          soundEnabled={settings.soundEnabled}
          onToggleSound={handleToggleSound}
          idPrefix="main"
        />
      )}

      {/* Child Wellbeing Guidance Modal */}
      <WellbeingTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />
    </div>
  );
}

export default App;
