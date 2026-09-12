import React from 'react';
import { ASSETS } from '../assets';

interface WebsiteLogoProps {
  logoNumber: 1 | 2;
  url?: string;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  scale?: 'medium' | 'large' | 'xlarge';
  className?: string;
  showTooltip?: boolean;
  onClick?: () => void;
}

export function WebsiteLogo({
  logoNumber,
  url,
  title,
  size = 'md',
  scale = 'large',
  className = '',
  showTooltip = true,
  onClick,
}: WebsiteLogoProps) {
  // Enhanced size classes - comfortably bigger, majestic & clearly legible
  const getDimensions = () => {
    if (scale === 'xlarge') {
      switch (size) {
        case 'xs':
          return 'h-9 w-9 sm:h-10 sm:w-10 border text-xs';
        case 'sm':
          return 'h-13 w-13 sm:h-15 sm:w-15 border-2 text-sm';
        case 'md':
          return 'h-16 w-16 sm:h-20 sm:w-20 border-2 text-base';
        case 'lg':
          return 'h-22 w-22 sm:h-26 sm:w-26 border-[3px] text-xl';
        case 'xl':
          return 'h-28 w-28 sm:h-34 sm:w-34 border-4 text-2xl';
        case '2xl':
          return 'h-36 w-36 sm:h-44 sm:w-44 border-4 text-3xl';
      }
    }
    if (scale === 'medium') {
      switch (size) {
        case 'xs':
          return 'h-7 w-7 border text-[10px]';
        case 'sm':
          return 'h-10 w-10 sm:h-11 sm:w-11 border text-xs';
        case 'md':
          return 'h-12 w-12 sm:h-14 sm:w-14 border-2 text-sm';
        case 'lg':
          return 'h-15 w-15 sm:h-18 sm:w-18 border-2 text-base';
        case 'xl':
          return 'h-20 w-20 sm:h-24 sm:w-24 border-[3px] text-xl';
        case '2xl':
          return 'h-28 w-28 sm:h-32 sm:w-32 border-4 text-2xl';
      }
    }
    // Default: 'large' (comfortably bigger size across all devices)
    switch (size) {
      case 'xs':
        return 'h-8 w-8 sm:h-9 sm:w-9 border text-[11px]';
      case 'sm':
        return 'h-12 w-12 sm:h-13 sm:w-13 lg:h-14 lg:w-14 border-2 text-xs';
      case 'md':
        return 'h-14 w-14 sm:h-16 sm:w-16 lg:h-18 lg:w-18 border-2 sm:border-[2.5px] text-sm';
      case 'lg':
        return 'h-18 w-18 sm:h-22 sm:w-22 lg:h-24 lg:w-24 border-2 sm:border-[3px] text-lg';
      case 'xl':
        return 'h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 border-[3px] text-2xl';
      case '2xl':
        return 'h-32 w-32 sm:h-36 sm:w-36 border-4 text-3xl';
    }
  };

  const sizeClasses = getDimensions();

  const defaultTitle =
    title || (logoNumber === 1 ? 'Bala Ganesha Temple' : 'KProjectXX Digital Wellbeing');

  const hasCustomImage = Boolean(url && url.trim() !== '');

  return (
    <div
      className={`group relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      onClick={onClick}
      title={showTooltip ? defaultTitle : undefined}
    >
      {/* Golden Halo Glow Container */}
      <div
        className={`relative flex items-center justify-center rounded-full overflow-hidden border-[#ffd700] bg-[#220710] shadow-[0_3px_14px_rgba(0,0,0,0.9),0_0_18px_rgba(255,215,0,0.4)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.95),0_0_26px_rgba(255,215,0,0.65)] ${sizeClasses} ${
          onClick ? 'cursor-pointer active:scale-95' : ''
        }`}
      >
        {hasCustomImage ? (
          <img
            src={url}
            alt={defaultTitle}
            className="h-full w-full rounded-full object-cover object-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            referrerPolicy="no-referrer"
          />
        ) : logoNumber === 1 ? (
          // Default Logo 1: Sacred Golden ॐ / Ganesha Lotus Emblem
          <div className="relative h-full w-full rounded-full flex items-center justify-center bg-gradient-to-br from-[#3d0e1b] via-[#24060e] to-[#120206] p-0.5">
            <img
              src={ASSETS.ganeshaLotus}
              alt="Bala Ganesha Emblem"
              className="h-full w-full rounded-full object-cover opacity-90 filter drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-black/50 via-transparent to-[#ffd700]/30" />
            <div className="pointer-events-none absolute inset-0 rounded-full border border-[#ffd700]/40" />
          </div>
        ) : (
          // Default Logo 2: KProjectXX Digital Wellbeing Emblem
          <div className="relative h-full w-full rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a0510] via-[#2d0a1b] to-[#14030a] p-1 text-center font-royal">
            <div className="flex items-center justify-center text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] leading-none">
              <span className="font-extrabold tracking-tighter text-sm sm:text-base lg:text-lg">KP</span>
            </div>
            <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-mono tracking-widest text-[#ffd700]/80 uppercase leading-none mt-0.5">
              XX
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-full border border-[#ffd700]/40" />
          </div>
        )}

        {/* Inner Glaze Ring */}
        <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
      </div>

      {/* Hover Tooltip Label */}
      {showTooltip && (
        <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-md border border-[#ffd700]/40 bg-[#1e050c]/95 px-2 py-0.5 text-[9px] font-sans font-semibold text-[#ffd700] opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
          {defaultTitle}
        </div>
      )}
    </div>
  );
}
