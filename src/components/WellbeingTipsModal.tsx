import { motion } from 'motion/react';
import { X, Sparkles, HeartHandshake, Eye, Moon, Trophy, BookOpen, Users } from 'lucide-react';
import { WELLBEING_TIPS } from '../types';

interface WellbeingTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WellbeingTipsModal({ isOpen, onClose }: WellbeingTipsModalProps) {
  if (!isOpen) return null;

  const tipIcons = [Eye, Moon, Trophy, Users, BookOpen, HeartHandshake];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl rounded-3xl border-2 border-[#ffd700]/70 bg-gradient-to-b from-[#2a0e16] via-[#1a0509] to-[#120306] p-5 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#fff7ed]"
        id="wellbeing-tips-modal"
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          id="close-tips-modal-btn"
          className="absolute top-4 right-4 rounded-full bg-[#3d121c] p-2 text-[#ffd700] hover:text-white hover:bg-[#521727] transition-all border border-[#ffd700]/30"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center border-b border-[#ffd700]/20 pb-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#ffd700] uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="font-royal">Lord Ganesha Wellbeing Guidance</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="font-royal text-2xl sm:text-3xl font-extrabold text-[#ffd700] tracking-wide">
            Healthy Digital Lifestyle &amp; Screen Habits
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#e8cba4]/80 mt-1">
            Mindful screen routines, posture, eye relaxation, and healthy balance
          </p>
        </div>

        {/* Tips Grid */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {WELLBEING_TIPS.map((tip, idx) => {
              const Icon = tipIcons[idx % tipIcons.length];
              return (
                <div
                  key={tip.id}
                  className="rounded-2xl border border-[#ffd700]/30 bg-[#250a12]/80 p-4 transition-all hover:bg-[#340f1a] hover:border-[#ffd700]/60 shadow-md"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#421320] text-[#ffd700] border border-[#ffd700]/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-royal text-base font-bold text-[#ffd700] tracking-wide">
                        {tip.titleEnglish || tip.titleTelugu}
                      </h4>
                      <p className="mt-1 font-sans text-xs text-[#fff7ed]/90 leading-relaxed">
                        {tip.descEnglish || tip.descTelugu}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-[#ffd700]/20 text-center">
          <button
            onClick={onClose}
            className="rounded-full border border-[#ffd700] bg-gradient-to-r from-[#ffd700] via-[#ffec99] to-[#d4af37] px-8 py-2.5 text-xs sm:text-sm font-bold text-[#2a0812] shadow-lg shadow-[#ffd700]/20 font-sans transition-all hover:scale-105"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </motion.div>
    </div>
  );
}
