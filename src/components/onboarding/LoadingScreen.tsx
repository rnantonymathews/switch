import React, { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish, isReady = true }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  useEffect(() => {
    // 1.2-second minimum smooth progress animation
    const startTime = Date.now();
    const duration = 1200;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration && isReadyRef.current) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onFinishRef.current) onFinishRef.current();
        }, 350);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-8 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full flex justify-end">
        <span className="text-[10px] font-mono tracking-widest text-[#8E8E93]/60 uppercase">
          v1.0.0
        </span>
      </div>

      {/* Centered Brand Emblem */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Neon Glow halo */}
          <div className="absolute inset-0 rounded-3xl bg-[#D4FB45]/20 blur-2xl animate-pulse" />
          
          {/* Logo container */}
          <div className="relative w-full h-full rounded-3xl overflow-hidden border border-[#D4FB45]/40 shadow-2xl shadow-[#D4FB45]/20 bg-[#141417] flex items-center justify-center p-1">
            <img
              src="/icon-192.png"
              alt="SWITCH Logo"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase font-sans">
            SWITCH
          </h1>
          <p className="text-xs font-mono tracking-[0.25em] text-[#D4FB45] uppercase font-bold">
            Elite Athletic OS
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress Track */}
      <div className="w-full max-w-xs space-y-2.5">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D4FB45] rounded-full transition-all duration-75 shadow-[0_0_12px_#D4FB45]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-[#8E8E93]">
          <span className="tracking-widest">CALIBRATING SYSTEM</span>
          <span className="text-[#D4FB45] font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
