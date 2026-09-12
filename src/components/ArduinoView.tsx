import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Play, 
  Square, 
  RotateCcw, 
  Terminal, 
  Copy, 
  Check, 
  Trash2, 
  Zap, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  Code2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { arduinoService, ArduinoCommand } from '../services/arduinoService';
import { soundService } from '../services/soundService';
import { ArduinoConnectionState, DashboardSettings } from '../types';

interface ArduinoViewProps {
  settings: DashboardSettings;
  onUpdateSettings?: (settings: DashboardSettings) => void;
}

export function ArduinoView({ settings, onUpdateSettings }: ArduinoViewProps) {
  const [arduinoState, setArduinoState] = useState<ArduinoConnectionState>({
    isConnected: false,
    isSupported: true,
    portName: 'Disconnected',
    lastCommandSent: '',
    lastCommandTimestamp: null,
    baudRate: 9600,
    logs: [],
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'console' | 'code' | 'wiring'>('console');
  const isWebSerialAvailable = arduinoService.isWebSerialSupported();
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const unsub = arduinoService.subscribe((state) => {
      setArduinoState((prev) => ({
        ...prev,
        isConnected: state.isConnected,
        portName: state.portName,
        lastCommandSent: state.lastCommand,
        lastCommandTimestamp: state.lastCommandTimestamp,
        logs: state.logs,
        isDoorOpen: state.isDoorOpen,
        isRelayOn: state.isRelayOn,
      }));
    });
    return unsub;
  }, []);

  const handleConnectToggle = async () => {
    soundService.playScanBeep();
    if (arduinoState.isConnected) {
      await arduinoService.disconnect();
    } else {
      await arduinoService.connect();
    }
  };

  const handleSendCommand = (cmd: ArduinoCommand) => {
    soundService.playScanBeep();
    arduinoService.sendCommand(cmd);
  };

  const handleCopyArduinoCode = () => {
    const code = arduinoService.generateArduinoCode(settings);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    soundService.playTempleBell(1.2);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyTestingLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6" id="arduino-view-container">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ffd700]/30 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#35101a] text-[#ffd700] border border-[#ffd700]/50 shadow-md">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="font-royal text-xl sm:text-2xl font-bold text-[#ffd700] tracking-wide">
              Arduino Hardware &amp; Dual Motor Door Control
            </h2>
          </div>
          <p className="font-sans text-xs text-[#e8cba4]/80 mt-1">
            Dual L298N Driver Setup (Driver 1 for Motor A, Driver 2 for Motor B • 60 RPM DC Motors @ 9600 Baud).
          </p>
        </div>

        {/* Connect Button */}
        <div className="flex items-center space-x-2 font-sans">
          <button
            onClick={handleConnectToggle}
            id="arduino-connect-btn"
            className={`flex items-center space-x-2 rounded-xl border px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all ${
              arduinoState.isConnected
                ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                : 'border-[#ffd700]/60 bg-[#2b0c16] text-[#ffd700] hover:bg-[#3d1220]'
            }`}
          >
            <div className={`h-2.5 w-2.5 rounded-full ${arduinoState.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-[#ffd700]'}`} />
            <span>{arduinoState.isConnected ? 'Disconnect' : 'Connect USB Serial'}</span>
          </button>
        </div>
      </div>

      {/* Direct Testing Link Notice for Web Serial API */}
      <div className="mb-6 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#2c1305] via-[#1f0b12] to-[#120408] p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h4 className="font-bold text-xs sm:text-sm text-[#ffd700]">
              Direct Hardware Testing Link (Web Serial API)
            </h4>
          </div>
          <p className="text-xs text-[#e8cba4]/85 leading-relaxed">
            Due to browser iframe security restrictions, open this link in a new browser tab to connect your computer's USB COM port:
          </p>
          <p className="font-mono text-[11px] text-amber-300/90 break-all select-all bg-black/40 px-2 py-1 rounded border border-amber-500/20">
            {currentAppUrl}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyTestingLink}
            className="flex items-center space-x-1.5 rounded-xl border border-[#ffd700]/40 bg-[#2b0c16] px-3 py-2 text-xs font-bold text-[#ffd700] hover:bg-[#3d1220] transition-all"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="flex items-center space-x-1.5 rounded-xl border border-amber-400 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30 transition-all shadow-md"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in New Tab</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#ffd700]/20 pb-3 mb-6 font-sans">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'console'
              ? 'bg-[#ffd700] text-black shadow-md'
              : 'bg-[#250912] text-[#e8cba4] hover:bg-[#350d1a] border border-[#ffd700]/30'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>Serial Console &amp; Controls</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'code'
              ? 'bg-[#ffd700] text-black shadow-md'
              : 'bg-[#250912] text-[#e8cba4] hover:bg-[#350d1a] border border-[#ffd700]/30'
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Arduino C++ Firmware</span>
        </button>

        <button
          onClick={() => setActiveTab('wiring')}
          className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'wiring'
              ? 'bg-[#ffd700] text-black shadow-md'
              : 'bg-[#250912] text-[#e8cba4] hover:bg-[#350d1a] border border-[#ffd700]/30'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Dual L298N Wiring &amp; Pinout Guide</span>
        </button>
      </div>

      {activeTab === 'console' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Hardware Status & Command Buttons (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Status Card */}
            <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#220710] shadow-xl font-sans">
              <h3 className="font-royal text-base font-bold text-[#ffd700] mb-3 flex items-center space-x-2 tracking-wide">
                <Zap className="h-4 w-4 text-[#ffd700]" />
                <span>Connection Status</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-[#ffd700]/20 py-1.5">
                  <span className="text-[#e8cba4]">Status:</span>
                  <span className={`font-bold ${arduinoState.isConnected ? 'text-emerald-400' : 'text-[#ffd700]'}`}>
                    {arduinoState.isConnected ? 'Connected (Online)' : 'Disconnected (Offline/Sim)'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#ffd700]/20 py-1.5">
                  <span className="text-[#e8cba4]">Device Port:</span>
                  <span className="font-mono text-white font-bold">{arduinoState.portName}</span>
                </div>

                <div className="flex justify-between border-b border-[#ffd700]/20 py-1.5">
                  <span className="text-[#e8cba4]">Baud Rate:</span>
                  <span className="font-mono text-[#ffd700] font-bold">9600 bps</span>
                </div>

                <div className="flex justify-between border-b border-[#ffd700]/20 py-1.5">
                  <span className="text-[#e8cba4]">Last Command:</span>
                  <span className="font-mono font-bold text-[#ffd700]">
                    {arduinoState.lastCommandSent || 'None'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-[#ffd700]/20 py-1.5 items-center">
                  <span className="text-[#e8cba4]">Door Position:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    arduinoState.doorMotion === 'opening'
                      ? 'bg-sky-950 text-sky-300 border border-sky-500/40 animate-pulse'
                      : arduinoState.doorMotion === 'closing'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                      : arduinoState.isDoorOpen
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-black/40 text-amber-300/80 border border-white/10'
                  }`}>
                    {arduinoState.doorMotion === 'opening'
                      ? 'DOORS OPENING (Dir 1)'
                      : arduinoState.doorMotion === 'closing'
                      ? 'DOORS CLOSING (Dir 2)'
                      : arduinoState.isDoorOpen
                      ? 'DOORS OPEN (Darshanam)'
                      : 'DOORS CLOSED (Home)'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 items-center">
                  <span className="text-[#e8cba4]">Relay (Pin D4):</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center space-x-1.5 ${
                    arduinoState.isRelayOn
                      ? 'bg-amber-400 text-black shadow-md animate-pulse'
                      : 'bg-black/40 text-zinc-400 border border-white/10'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${arduinoState.isRelayOn ? 'bg-black' : 'bg-zinc-600'}`} />
                    <span>{arduinoState.isRelayOn ? 'RELAY D4 ON (Illuminated)' : 'RELAY D4 OFF'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Configured Motor Timings Card */}
            <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#1e070e] shadow-xl space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-[#ffd700]" />
                  <h3 className="font-royal text-sm font-bold text-[#ffd700] tracking-wide">
                    Configured Motor Timings
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/40">
                  NEW LOGIC ACTIVE
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>0-3 Hours (Dir 1):</span>
                  <span className="font-bold text-emerald-400">{((settings.time0To3Dir1Ms ?? 8000) / 1000).toFixed(1)}s ({settings.time0To3Dir1Ms ?? 8000} ms)</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>3-5 Hours (Dir 1 Slow):</span>
                  <span className="font-bold text-sky-400">{((settings.time3To5Dir1Ms ?? 8000) / 1000).toFixed(1)}s ({settings.time3To5Dir1Ms ?? 8000} ms)</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>5+ Hours (Dir 1 &rarr; Dir 2):</span>
                  <span className="font-bold text-amber-400">{((settings.time5PlusDir1Ms ?? 3000) / 1000).toFixed(1)}s Dir 1 &rarr; {((settings.time5PlusDir2Ms ?? 4000) / 1000).toFixed(1)}s Dir 2</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>After Promise (Dir 1):</span>
                  <span className="font-bold text-purple-300">{((settings.time5PlusPromiseDir1Ms ?? 8000) / 1000).toFixed(1)}s ({settings.time5PlusPromiseDir1Ms ?? 8000} ms)</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>Home Return (Dir 2):</span>
                  <span className="font-bold text-[#ffd700]">{((settings.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)}s ({settings.timeHomeCloseDir2Ms ?? 8000} ms)</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1 border-b border-white/5">
                  <span>Normal PWM Speed:</span>
                  <span className="font-bold text-white">{settings.normalMotorSpeed ?? 220} / 255</span>
                </div>
                <div className="flex justify-between text-[#e8cba4] py-1">
                  <span>Slow PWM Speed:</span>
                  <span className="font-bold text-white">{settings.slowMotorSpeed ?? 130} / 255</span>
                </div>
              </div>
            </div>

            {/* Test Commands Card */}
            <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#220710] shadow-xl font-sans space-y-3">
              <div className="flex items-center justify-between border-b border-[#ffd700]/20 pb-2">
                <h3 className="font-royal text-base font-bold text-[#ffd700] flex items-center space-x-2 tracking-wide">
                  <Sliders className="h-4 w-4 text-[#ffd700]" />
                  <span>Manual Hardware Controls</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  Live Auto-Cutoff Active
                </span>
              </div>

              <div className="text-[11px] text-[#e8cba4]/80 bg-[#16060a] p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                <span>Directly adjust single digits below — applies instantly to physical motor:</span>
              </div>

              <div className="space-y-3">
                {/* OPEN_0_3 */}
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSendCommand('OPEN_0_3')}
                      className="flex-1 flex items-center justify-between rounded-lg border border-emerald-500/50 bg-emerald-950/90 px-3 py-2 text-emerald-300 hover:bg-emerald-900 transition-all font-mono font-bold text-xs shadow-md"
                    >
                      <span className="flex items-center space-x-2">
                        <Play className="h-3.5 w-3.5" />
                        <span>OPEN_0_3 (0 - 3h Run)</span>
                      </span>
                      <span className="font-sans text-[11px] bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-500/30">
                        {((settings.time0To3Dir1Ms ?? 8000) / 1000).toFixed(1)}s
                      </span>
                    </button>
                  </div>

                  {onUpdateSettings && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
                      <span className="text-[10px] text-emerald-300/80 font-mono">Dir 1 Duration:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time0To3Dir1Ms ?? 8000;
                            const updated = Math.max(1000, current - 1000);
                            onUpdateSettings({ ...settings, time0To3Dir1Ms: updated, fullOpenTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30 transition-all"
                          title="Decrease by 1 second"
                        >
                          -1s
                        </button>
                        <span className="font-mono font-bold text-white px-1.5 text-xs">
                          {((settings.time0To3Dir1Ms ?? 8000) / 1000).toFixed(1)}s
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time0To3Dir1Ms ?? 8000;
                            const updated = Math.min(30000, current + 1000);
                            onUpdateSettings({ ...settings, time0To3Dir1Ms: updated, fullOpenTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30 transition-all"
                          title="Increase by 1 second"
                        >
                          +1s
                        </button>
                        <div className="flex space-x-1 pl-1">
                          {[3, 5, 8].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ ...settings, time0To3Dir1Ms: sec * 1000, fullOpenTimeMs: sec * 1000 });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                                (settings.time0To3Dir1Ms ?? 8000) === sec * 1000
                                  ? 'bg-emerald-400 text-black font-bold'
                                  : 'bg-black/40 text-emerald-300/80 hover:bg-emerald-900/60'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* OPEN_3_5 */}
                <div className="rounded-xl border border-sky-500/40 bg-sky-950/40 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSendCommand('OPEN_3_5')}
                      className="flex-1 flex items-center justify-between rounded-lg border border-sky-500/50 bg-sky-950/90 px-3 py-2 text-sky-300 hover:bg-sky-900 transition-all font-mono font-bold text-xs shadow-md"
                    >
                      <span className="flex items-center space-x-2">
                        <Play className="h-3.5 w-3.5" />
                        <span>OPEN_3_5 (3 - 5h Slow)</span>
                      </span>
                      <span className="font-sans text-[11px] bg-sky-900/80 px-2 py-0.5 rounded text-sky-200 border border-sky-500/30">
                        {((settings.time3To5Dir1Ms ?? 8000) / 1000).toFixed(1)}s
                      </span>
                    </button>
                  </div>

                  {onUpdateSettings && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-sky-500/20">
                      <span className="text-[10px] text-sky-300/80 font-mono">Slow Duration:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time3To5Dir1Ms ?? 8000;
                            const updated = Math.max(1000, current - 1000);
                            onUpdateSettings({ ...settings, time3To5Dir1Ms: updated, slowOpenTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-300 font-mono font-bold text-xs border border-sky-500/30 transition-all"
                          title="Decrease by 1 second"
                        >
                          -1s
                        </button>
                        <span className="font-mono font-bold text-white px-1.5 text-xs">
                          {((settings.time3To5Dir1Ms ?? 8000) / 1000).toFixed(1)}s
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time3To5Dir1Ms ?? 8000;
                            const updated = Math.min(30000, current + 1000);
                            onUpdateSettings({ ...settings, time3To5Dir1Ms: updated, slowOpenTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-300 font-mono font-bold text-xs border border-sky-500/30 transition-all"
                          title="Increase by 1 second"
                        >
                          +1s
                        </button>
                        <div className="flex space-x-1 pl-1">
                          {[3, 5, 8].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ ...settings, time3To5Dir1Ms: sec * 1000, slowOpenTimeMs: sec * 1000 });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                                (settings.time3To5Dir1Ms ?? 8000) === sec * 1000
                                  ? 'bg-sky-400 text-black font-bold'
                                  : 'bg-black/40 text-sky-300/80 hover:bg-sky-900/60'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* OPEN_5_PLUS */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 space-y-2">
                  <button
                    onClick={() => handleSendCommand('OPEN_5_PLUS')}
                    className="w-full flex items-center justify-between rounded-lg border border-amber-500/50 bg-amber-950/90 px-3 py-2 text-amber-300 hover:bg-amber-900 transition-all font-mono font-bold text-xs shadow-md"
                  >
                    <span className="flex items-center space-x-2">
                      <Play className="h-3.5 w-3.5" />
                      <span>OPEN_5_PLUS (Dir 1 &rarr; Dir 2)</span>
                    </span>
                    <span className="font-sans text-[11px] bg-amber-900/80 px-2 py-0.5 rounded text-amber-200 border border-amber-500/30">
                      {((settings.time5PlusDir1Ms ?? 3000) / 1000).toFixed(1)}s &rarr; {((settings.time5PlusDir2Ms ?? 4000) / 1000).toFixed(1)}s
                    </span>
                  </button>

                  {onUpdateSettings && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-500/20">
                      <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded">
                        <span className="text-[10px] text-amber-300/80">Dir 1:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = settings.time5PlusDir1Ms ?? 3000;
                              onUpdateSettings({ ...settings, time5PlusDir1Ms: Math.max(1000, cur - 1000) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-[10px] font-mono font-bold"
                          >
                            -1s
                          </button>
                          <span className="font-mono text-[11px] font-bold text-white">
                            {((settings.time5PlusDir1Ms ?? 3000) / 1000).toFixed(0)}s
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = settings.time5PlusDir1Ms ?? 3000;
                              onUpdateSettings({ ...settings, time5PlusDir1Ms: Math.min(20000, cur + 1000) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-[10px] font-mono font-bold"
                          >
                            +1s
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-black/40 px-2 py-1 rounded">
                        <span className="text-[10px] text-amber-300/80">Dir 2:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = settings.time5PlusDir2Ms ?? 4000;
                              onUpdateSettings({ ...settings, time5PlusDir2Ms: Math.max(1000, cur - 1000) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-[10px] font-mono font-bold"
                          >
                            -1s
                          </button>
                          <span className="font-mono text-[11px] font-bold text-white">
                            {((settings.time5PlusDir2Ms ?? 4000) / 1000).toFixed(0)}s
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = settings.time5PlusDir2Ms ?? 4000;
                              onUpdateSettings({ ...settings, time5PlusDir2Ms: Math.min(20000, cur + 1000) });
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-[10px] font-mono font-bold"
                          >
                            +1s
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* OPEN_AFTER_PROMISE */}
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/40 p-2.5 space-y-2">
                  <button
                    onClick={() => handleSendCommand('OPEN_AFTER_PROMISE')}
                    className="w-full flex items-center justify-between rounded-lg border border-purple-500/50 bg-purple-950/90 px-3 py-2 text-purple-300 hover:bg-purple-900 transition-all font-mono font-bold text-xs shadow-md"
                  >
                    <span className="flex items-center space-x-2">
                      <Play className="h-3.5 w-3.5" />
                      <span>OPEN_AFTER_PROMISE (Devotee Vow)</span>
                    </span>
                    <span className="font-sans text-[11px] bg-purple-900/80 px-2 py-0.5 rounded text-purple-200 border border-purple-500/30">
                      {((settings.time5PlusPromiseDir1Ms ?? 8000) / 1000).toFixed(1)}s
                    </span>
                  </button>

                  {onUpdateSettings && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-500/20">
                      <span className="text-[10px] text-purple-300/80 font-mono">Dir 1 Duration:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time5PlusPromiseDir1Ms ?? 8000;
                            const updated = Math.max(1000, current - 1000);
                            onUpdateSettings({ ...settings, time5PlusPromiseDir1Ms: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-300 font-mono font-bold text-xs border border-purple-500/30 transition-all"
                        >
                          -1s
                        </button>
                        <span className="font-mono font-bold text-white px-1.5 text-xs">
                          {((settings.time5PlusPromiseDir1Ms ?? 8000) / 1000).toFixed(1)}s
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.time5PlusPromiseDir1Ms ?? 8000;
                            const updated = Math.min(30000, current + 1000);
                            onUpdateSettings({ ...settings, time5PlusPromiseDir1Ms: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-300 font-mono font-bold text-xs border border-purple-500/30 transition-all"
                        >
                          +1s
                        </button>
                        <div className="flex space-x-1 pl-1">
                          {[3, 5, 8].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ ...settings, time5PlusPromiseDir1Ms: sec * 1000 });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                                (settings.time5PlusPromiseDir1Ms ?? 8000) === sec * 1000
                                  ? 'bg-purple-400 text-black font-bold'
                                  : 'bg-black/40 text-purple-300/80 hover:bg-purple-900/60'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CLOSE_HOME */}
                <div className="rounded-xl border border-[#ffd700]/40 bg-[#38101e]/60 p-2.5 space-y-2">
                  <button
                    onClick={() => handleSendCommand('CLOSE_HOME')}
                    className="w-full flex items-center justify-between rounded-lg border border-[#ffd700]/60 bg-[#38101e] px-3 py-2 text-[#ffd700] hover:bg-[#4d1628] transition-all font-mono font-bold text-xs shadow-md"
                  >
                    <span className="flex items-center space-x-2">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>CLOSE_HOME (Home Return Dir 2)</span>
                    </span>
                    <span className="font-sans text-[11px] bg-[#220710] px-2 py-0.5 rounded text-[#ffd700] border border-[#ffd700]/30">
                      {((settings.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)}s
                    </span>
                  </button>

                  {onUpdateSettings && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#ffd700]/20">
                      <span className="text-[10px] text-[#ffd700]/80 font-mono">Dir 2 Duration:</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.timeHomeCloseDir2Ms ?? 8000;
                            const updated = Math.max(1000, current - 1000);
                            onUpdateSettings({ ...settings, timeHomeCloseDir2Ms: updated, closeTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-[#4d1628] hover:bg-[#5f1b32] text-[#ffd700] font-mono font-bold text-xs border border-[#ffd700]/40 transition-all"
                        >
                          -1s
                        </button>
                        <span className="font-mono font-bold text-white px-1.5 text-xs">
                          {((settings.timeHomeCloseDir2Ms ?? 8000) / 1000).toFixed(1)}s
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settings.timeHomeCloseDir2Ms ?? 8000;
                            const updated = Math.min(30000, current + 1000);
                            onUpdateSettings({ ...settings, timeHomeCloseDir2Ms: updated, closeTimeMs: updated });
                          }}
                          className="px-2 py-0.5 rounded bg-[#4d1628] hover:bg-[#5f1b32] text-[#ffd700] font-mono font-bold text-xs border border-[#ffd700]/40 transition-all"
                        >
                          +1s
                        </button>
                        <div className="flex space-x-1 pl-1">
                          {[3, 5, 8].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                onUpdateSettings({ ...settings, timeHomeCloseDir2Ms: sec * 1000, closeTimeMs: sec * 1000 });
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                                (settings.timeHomeCloseDir2Ms ?? 8000) === sec * 1000
                                  ? 'bg-[#ffd700] text-black font-bold'
                                  : 'bg-black/40 text-[#ffd700]/80 hover:bg-[#4d1628]'
                              }`}
                            >
                              {sec}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Relay Module LED Control (Driver 1 Channel 2 & Pin D4) */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center space-x-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#ffd700]" />
                      <span>Relay Pin D4 (Sanctum LED Light)</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      arduinoState.isRelayOn
                        ? 'bg-amber-400 text-black font-bold border-amber-300 animate-pulse'
                        : 'bg-black/50 text-zinc-400 border-white/10'
                    }`}>
                      {arduinoState.isRelayOn ? 'D4 RELAY ON' : 'D4 RELAY OFF'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => handleSendCommand('RELAY_ON')}
                      className="flex items-center justify-center space-x-1.5 rounded-lg border border-amber-500/60 bg-amber-900/80 hover:bg-amber-800 p-2 text-amber-100 font-mono font-bold text-xs shadow-md transition-all"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>RELAY_ON (D4)</span>
                    </button>
                    <button
                      onClick={() => handleSendCommand('RELAY_OFF')}
                      className="flex items-center justify-center space-x-1.5 rounded-lg border border-white/20 bg-black/50 hover:bg-black/70 p-2 text-zinc-300 font-mono font-bold text-xs shadow-md transition-all"
                    >
                      <span>RELAY_OFF (D4)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#e8cba4]/85 font-sans leading-tight">
                    Pin D4 automatically turns ON when door opens and <strong>remains ON continuously until the doors close</strong> (including throughout the video &amp; blessing delay).
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handleSendCommand('STOP')}
                    className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/50 bg-rose-950/90 p-3 text-rose-300 hover:bg-rose-900 transition-all font-mono font-bold text-xs shadow-md"
                  >
                    <Square className="h-4 w-4" />
                    <span>STOP (Emergency Halt)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Serial Terminal Logs (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#220710] shadow-xl flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-[#ffd700]" />
                  <h3 className="font-mono text-sm font-bold text-[#ffd700]">
                    Serial Stream Monitor (9600 Baud)
                  </h3>
                </div>
                <button
                  onClick={() => arduinoService.clearLogs()}
                  className="flex items-center space-x-1 text-xs text-rose-400 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Logs Box */}
              <div className="h-96 overflow-y-auto rounded-xl bg-[#120206] p-4 font-mono text-xs text-emerald-400 space-y-1.5 border border-[#ffd700]/30 shadow-inner">
                {arduinoState.logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-[#e8cba4]/50 shrink-0">[{log.time}]</span>
                    <span
                      className={`font-bold shrink-0 ${
                        log.direction === 'TX'
                          ? 'text-cyan-300'
                          : log.direction === 'RX'
                          ? 'text-[#ffd700]'
                          : 'text-amber-400'
                      }`}
                    >
                      {log.direction}:
                    </span>
                    <span className="text-[#f5f2ed] break-all">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div className="rounded-2xl p-6 border border-[#ffd700]/40 bg-[#220710] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#ffd700]/30 pb-4 mb-4 font-sans">
            <div>
              <h3 className="font-royal text-lg font-bold text-[#ffd700] tracking-wide">
                Arduino Uno C++ Firmware Sketch
              </h3>
              <p className="text-xs text-[#e8cba4]/80 mt-0.5">
                Paste this code into the Arduino IDE and upload it to your Arduino Uno board.
              </p>
            </div>
            <button
              onClick={handleCopyArduinoCode}
              id="copy-arduino-code-btn"
              className="flex items-center space-x-2 rounded-xl border border-[#ffd700]/60 bg-[#2b0c16] px-4 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] shadow-md transition-all"
            >
              {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="max-h-[500px] overflow-auto rounded-xl bg-[#120206] p-4 font-mono text-xs text-[#ffd700] leading-relaxed border border-[#ffd700]/30 shadow-inner">
            {arduinoService.generateArduinoCode(settings)}
          </pre>
        </div>
      )}

      {activeTab === 'wiring' && (
        <div className="rounded-2xl p-6 border border-[#ffd700]/40 bg-[#220710] shadow-xl font-sans space-y-6">
          <div className="border-b border-[#ffd700]/30 pb-4">
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/40">
                2x L298N DRIVERS ACTIVE
              </span>
              <span className="rounded-full bg-amber-950 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300 border border-amber-500/40">
                60 RPM GEARED MOTORS
              </span>
            </div>
            <h3 className="font-royal text-lg sm:text-xl font-bold text-[#ffd700] mt-2 tracking-wide">
              Dual L298N Motor Driver + Arduino Uno Wiring Map
            </h3>
            <p className="text-xs text-[#e8cba4]/80 mt-1 leading-relaxed">
              Using <strong>two separate L298N modules</strong> isolates the electrical load of two 60 RPM high-torque DC motors. This eliminates voltage collapse, prevents driver overheating, and delivers steady torque to both door wings.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Driver 1 (L298N #1) - Motor A */}
            <div className="rounded-xl bg-[#1a050c] p-5 border border-emerald-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <h4 className="font-bold text-xs text-emerald-300 uppercase font-mono flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Driver 1 (L298N #1) &rarr; Motor A (60 RPM)</span>
                </h4>
                <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-950/80 px-2 py-0.5 rounded">
                  Left Door Wing
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#e8cba4] font-mono">
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">ENA (PWM Speed):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D5 (PWM)</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">IN1 (Direction 1):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D6</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">IN2 (Direction 2):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D7</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">OUT1 &amp; OUT2:</span>
                  <span className="font-bold text-emerald-300">60 RPM Motor A Terminals</span>
                </li>
                <li className="flex justify-between text-[11px] text-[#e8cba4]/70">
                  <span>Note:</span>
                  <span>Remove ENA jumper to enable PWM control</span>
                </li>
              </ul>
            </div>

            {/* Driver 2 (L298N #2) - Motor B */}
            <div className="rounded-xl bg-[#1a050c] p-5 border border-sky-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                <h4 className="font-bold text-xs text-sky-300 uppercase font-mono flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                  <span>Driver 2 (L298N #2) &rarr; Motor B (60 RPM)</span>
                </h4>
                <span className="text-[10px] text-sky-400/90 font-mono bg-sky-950/80 px-2 py-0.5 rounded">
                  Right Door Wing
                </span>
              </div>
              <ul className="space-y-2 text-xs text-[#e8cba4] font-mono">
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">ENA (PWM Speed):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D10 (PWM)</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">IN1 (Direction 1):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D8</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">IN2 (Direction 2):</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D9</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-white">OUT1 &amp; OUT2:</span>
                  <span className="font-bold text-sky-300">60 RPM Motor B Terminals</span>
                </li>
                <li className="flex justify-between text-[11px] text-[#e8cba4]/70">
                  <span>Note:</span>
                  <span>Remove ENA jumper on Driver 2</span>
                </li>
              </ul>
            </div>

            {/* Relay Module Connection (Driver 1 Channel 2 + Arduino Digital Pin D4) */}
            <div className="rounded-xl bg-[#1b0a12] p-5 border border-amber-500/50 space-y-3 shadow-md md:col-span-2">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <h4 className="font-bold text-xs text-amber-300 uppercase font-mono flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-[#ffd700]" />
                  <span>Relay Module &amp; Sanctum LED Light (L298N #1 Channel 2 &amp; Pin D4)</span>
                </h4>
                <span className="text-[10px] text-[#ffd700] font-mono bg-amber-950/90 px-2.5 py-0.5 rounded border border-amber-500/40">
                  Accurate Door Open Trigger
                </span>
              </div>
              <p className="text-xs text-[#e8cba4] leading-relaxed">
                Connect your 5V Relay module to Driver 1 (L298N #1) Channel 2 for power, and wire its digital trigger signal to Arduino Pin <strong>D4</strong>. When door opening begins, the relay module energizes at the <strong>exact and accurate millisecond</strong>, lighting up the high-intensity Sanctum LED. The LED remains active throughout the darshanam video and the <strong>+10-second blessing buffer</strong>, and automatically switches OFF when the doors close and return to Home.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                <div className="p-3 bg-black/40 rounded-lg border border-amber-500/30">
                  <div className="text-[#ffd700] font-bold mb-1">1. Signal / Trigger (IN):</div>
                  <div className="text-white">Arduino Digital Pin <strong>D4</strong></div>
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-amber-500/30">
                  <div className="text-[#ffd700] font-bold mb-1">2. Power (VCC &amp; GND):</div>
                  <div className="text-white">L298N #1 Channel 2 (OUT3/OUT4) or 5V &amp; GND</div>
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-amber-500/30">
                  <div className="text-[#ffd700] font-bold mb-1">3. Switching Contacts:</div>
                  <div className="text-white">COM &amp; NO (Normally Open) in series with LED</div>
                </div>
              </div>
            </div>

            {/* Power & Grounding Connections */}
            <div className="rounded-xl bg-[#0e2118] p-5 border border-emerald-500/40 space-y-3 md:col-span-2 shadow-md">
              <h4 className="font-bold text-xs text-emerald-400 uppercase font-mono flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-emerald-400" />
                <span>Power Supply &amp; Common Ground Connections (Mandatory)</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#e8cba4] font-mono">
                <li className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="text-white">+12V DC External Adapter / Battery:</span>
                  <span className="font-bold text-emerald-300">Connect in PARALLEL to Driver 1 (12V) AND Driver 2 (12V)</span>
                </li>
                <li className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="text-white">Common Ground (GND):</span>
                  <span className="font-bold text-emerald-300">Connect Arduino GND, Driver 1 GND, and Driver 2 GND together</span>
                </li>
                <li className="flex justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="text-white">Manual Override Button:</span>
                  <span className="font-bold text-[#ffd700]">Arduino Pin D2 to Pushbutton, other terminal to GND</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-white">5V Logic Power:</span>
                  <span className="font-bold text-emerald-300">Leave the onboard 5V regulator jumper plugged in on both L298N boards</span>
                </li>
              </ul>
            </div>

            {/* Symmetrical Door Inversion Guide */}
            <div className="rounded-xl bg-[#1b1406] p-5 border border-amber-500/40 space-y-2 md:col-span-2 shadow-md">
              <h4 className="font-bold text-xs text-amber-300 uppercase font-mono flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                <span>60 RPM Mirrored Door Inversion Guide (`INVERT_MOTOR_B`)</span>
              </h4>
              <p className="text-xs text-[#e8cba4] leading-relaxed">
                If your physical door wings are installed on opposite sides (mirrored hinges), one motor might need to rotate clockwise while the other rotates counter-clockwise to open outward together.
              </p>
              <div className="bg-black/60 p-3 rounded-lg border border-amber-500/30 text-xs font-mono text-amber-200">
                <p className="font-bold">// In the Arduino firmware sketch:</p>
                <p>const bool INVERT_MOTOR_B = <span className="text-emerald-400 font-bold">false</span>; <span className="text-white/60">// Keep false if both spin identical direction</span></p>
                <p>const bool INVERT_MOTOR_B = <span className="text-emerald-400 font-bold">true</span>;  <span className="text-white/60">// Set to true if Motor B must spin reversed for symmetrical opening!</span></p>
              </div>
              <p className="text-[11px] text-[#e8cba4]/75">
                Alternatively, you can reverse the two wires on Driver 2's OUT1 &amp; OUT2 screw terminals.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
