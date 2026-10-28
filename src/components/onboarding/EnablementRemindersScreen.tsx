import React, { useState } from 'react';
import { Bell, Droplets, Dumbbell, UtensilsCrossed, Check, Volume2 } from 'lucide-react';
import { requestNotificationPermission } from '../../lib/notifications';
import { soundEngine } from '../../lib/sound';

interface EnablementRemindersScreenProps {
  onCompleted: (preferences: {
    hydrationAlerts: boolean;
    workoutAlerts: boolean;
    macroAlerts: boolean;
    soundEnabled: boolean;
  }) => void;
  triggerToast: (msg: string) => void;
}

export const EnablementRemindersScreen: React.FC<EnablementRemindersScreenProps> = ({
  onCompleted,
  triggerToast
}) => {
  const [hydrationAlerts, setHydrationAlerts] = useState(true);
  const [workoutAlerts, setWorkoutAlerts] = useState(true);
  const [macroAlerts, setMacroAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowAndEnter = () => {
    setIsRequesting(true);
    soundEngine.playTing();

    // Trigger browser notification prompt asynchronously without blocking entry
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const p = Notification.requestPermission();
        if (p && typeof (p as any).then === 'function') {
          (p as Promise<NotificationPermission>).catch(() => {});
        }
      } catch (e) {}
    }

    triggerToast('Preferences saved! Welcome to SWITCH.');
    onCompleted({
      hydrationAlerts,
      workoutAlerts,
      macroAlerts,
      soundEnabled
    });
  };

  const handleProceedWithoutAlerts = () => {
    soundEngine.playTing();
    triggerToast('Entering SWITCH (Reminders can be adjusted anytime in Settings).');
    onCompleted({
      hydrationAlerts,
      workoutAlerts,
      macroAlerts,
      soundEnabled
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-8 overflow-y-auto animate-in fade-in select-none">
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto space-y-2 text-center pt-2">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-[#D4FB45]/15 border border-[#D4FB45]/30 flex items-center justify-center text-[#D4FB45] shadow-xl shadow-[#D4FB45]/10 mb-3">
          <Bell className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans">
          Habits & Reminders
        </h2>
        <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
          Discipline and consistency build elite athletes. Enable proactive alerts to stay on track.
        </p>
      </div>

      {/* 3 Smart Pre-Toggled Reminder Cards */}
      <div className="w-full max-w-md mx-auto my-auto space-y-3 py-4">
        {/* 1. Hydration Reminders */}
        <div
          onClick={() => setHydrationAlerts(!hydrationAlerts)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            hydrationAlerts ? 'bg-[#1C1C1E] border-[#32ADE6]/50' : 'bg-[#141417] border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#32ADE6]/15 flex items-center justify-center text-[#32ADE6] shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Hydration Wave Nudge
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#32ADE6]/20 text-[#32ADE6] font-bold">
                  EVERY 2H
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Gentle audio buzz between 8 AM – 8 PM (resets automatically when you log drinks).
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              hydrationAlerts ? 'bg-[#32ADE6] text-black shadow-md shadow-[#32ADE6]/30' : 'bg-white/10 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* 2. Daily Workout Routine Ping */}
        <div
          onClick={() => setWorkoutAlerts(!workoutAlerts)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            workoutAlerts ? 'bg-[#1C1C1E] border-[#D4FB45]/50' : 'bg-[#141417] border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4FB45]/15 flex items-center justify-center text-[#D4FB45] shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Workout Routine Alert
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#D4FB45]/20 text-[#D4FB45] font-bold">
                  TRAINING
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Prep alert 30 minutes before your scheduled workout window.
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              workoutAlerts ? 'bg-[#D4FB45] text-black shadow-md shadow-[#D4FB45]/30' : 'bg-white/10 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* 3. Evening Macro Log Review */}
        <div
          onClick={() => setMacroAlerts(!macroAlerts)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            macroAlerts ? 'bg-[#1C1C1E] border-[#FF9F0A]/50' : 'bg-[#141417] border-white/5 opacity-60'
          }`}
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF9F0A]/15 flex items-center justify-center text-[#FF9F0A] shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Evening Nutrition Review
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] font-bold">
                  8:30 PM
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                Evening check-in to log dinner and ensure your protein & calorie goals are hit.
              </p>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              macroAlerts ? 'bg-[#FF9F0A] text-black shadow-md shadow-[#FF9F0A]/30' : 'bg-white/10 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-[#8E8E93]">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3.5 h-3.5 text-[#D4FB45]" />
            <span>Athletic Audio Chimes</span>
          </div>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-[#D4FB45]' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black absolute top-0.5 transition-transform ${
                soundEnabled ? 'left-4' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Primary CTA Button & Direct Entry Option */}
      <div className="w-full max-w-md mx-auto pt-2 space-y-3 text-center">
        <button
          type="button"
          onClick={handleAllowAndEnter}
          className="w-full py-4 rounded-2xl bg-[#D4FB45] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-xl shadow-[#D4FB45]/20 ios-press cursor-pointer hover:bg-[#D4FB45]/90 transition"
        >
          <span>ALLOW ALERTS & ENTER SWITCH →</span>
        </button>

        <button
          type="button"
          onClick={handleProceedWithoutAlerts}
          className="text-[11px] font-mono text-[#8E8E93] hover:text-[#D4FB45] transition tracking-wider uppercase cursor-pointer py-1 block mx-auto"
        >
          Enter Without Push Alerts →
        </button>

        <p className="text-[10px] text-[#8E8E93]/70 font-mono tracking-tight pt-1">
          📱 On iPhone Safari, install SWITCH to Home Screen (PWA) for lock screen alerts.
        </p>
      </div>
    </div>
  );
};
