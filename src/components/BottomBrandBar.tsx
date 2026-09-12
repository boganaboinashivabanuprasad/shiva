import { Volume2, VolumeX } from 'lucide-react';

interface BottomBrandBarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  className?: string;
  idPrefix?: string;
}

export function BottomBrandBar({
  soundEnabled,
  onToggleSound,
  className = '',
  idPrefix = 'universal',
}: BottomBrandBarProps) {
  return (
    <footer
      className={`relative z-20 flex items-center justify-between px-4 py-2 sm:py-2.5 sm:px-8 border-t border-[#ffd700]/20 bg-[#160408] shrink-0 select-none ${className}`}
    >
      {/* Left: Volume / Sound Toggle */}
      <div>
        <button
          onClick={onToggleSound}
          id={`${idPrefix}-volume-toggle-btn`}
          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[#ffd700]/50 bg-[#2b0c16] text-[#ffd700] hover:bg-[#3d1220] hover:scale-105 transition-all shadow-md"
          title={soundEnabled ? 'Temple Sound Chimes On' : 'Unmute Temple Sound'}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Center: AN KPROJECTXX PRODUCT */}
      <div className="flex items-center font-mono text-[9px] sm:text-[10px] tracking-[0.25em] font-semibold text-[#ffd700]/80 uppercase text-center">
        <span>AN KPROJECTXX PRODUCT</span>
      </div>

      {/* Right Spacer for balanced centering */}
      <div className="w-7 sm:w-8" />
    </footer>
  );
}
