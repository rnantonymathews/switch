import React, { useState } from 'react';
import { Profile } from '../../types';
import { AVATAR_EMOJIS } from '../../constants';
import { Flame, Zap, Dumbbell, ArrowRight, ArrowLeft, Check, Sparkles, User, Target, Scale } from 'lucide-react';

interface BiometricsWelcomeScreenProps {
  initialProfile: Profile;
  onCompleted: (updatedProfile: Partial<Profile>) => void;
}

export const BiometricsWelcomeScreen: React.FC<BiometricsWelcomeScreenProps> = ({
  initialProfile,
  onCompleted
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [username, setUsername] = useState(initialProfile.username || 'Athlete');
  const [avatarEmoji, setAvatarEmoji] = useState(initialProfile.avatarEmoji || '⚡');
  const [gender, setGender] = useState<'male' | 'female'>((initialProfile.gender as any) || 'male');

  const [weight, setWeight] = useState<number>(initialProfile.weight > 25 ? initialProfile.weight : 75);
  const [goalWeight, setGoalWeight] = useState<number>(initialProfile.goalWeight > 25 ? initialProfile.goalWeight : 72);
  const [height, setHeight] = useState<number>(initialProfile.height > 90 ? initialProfile.height : 178);
  const [age, setAge] = useState<number>(initialProfile.age > 10 ? initialProfile.age : 26);

  const [goalType, setGoalType] = useState<string>(initialProfile.goalType || 'recomp');
  const [deadlineMonths, setDeadlineMonths] = useState<number>(initialProfile.deadlineMonths || 6);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (weight <= 25 || height <= 90 || age <= 10) return;
      setStep(3);
    } else if (step === 3) {
      onCompleted({
        username: username.trim() || 'Athlete',
        avatarEmoji,
        gender,
        weight: Number(weight),
        goalWeight: Number(goalWeight),
        height: Number(height),
        age: Number(age),
        goalType,
        deadlineMonths: Number(deadlineMonths)
      });
    }
  };

  const goals = [
    {
      id: 'fatLoss',
      title: 'Fat Loss (Cut)',
      subtitle: '-400 kcal Deficit',
      icon: Flame,
      color: '#FF453A',
      desc: 'Accelerated fat oxidation while preserving lean muscular mass.'
    },
    {
      id: 'recomp',
      title: 'Body Recomp',
      subtitle: 'Maintenance Calorie Burn',
      icon: Zap,
      color: '#D4FB45',
      desc: 'Simultaneously build dense muscle while trimming body fat.'
    },
    {
      id: 'muscleGain',
      title: 'Muscle Gain (Bulk)',
      subtitle: '+350 kcal Surplus',
      icon: Dumbbell,
      color: '#32ADE6',
      desc: 'Progressive strength overload and optimal muscle hypertrophy.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 sm:p-8 overflow-y-auto animate-in fade-in select-none">
      {/* Top Progress Track Header */}
      <div className="w-full max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-[#D4FB45] font-black">STEP 0{step}</span>
            <span className="text-[#8E8E93]">/ 03</span>
          </div>
          <span className="text-[#8E8E93] uppercase font-bold tracking-wider">
            {step === 1 ? 'Identity' : step === 2 ? 'Biometrics' : 'Target Objective'}
          </span>
        </div>

        {/* 3 Step Pill Track */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-[#D4FB45] shadow-[0_0_8px_#D4FB45]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Athlete Identity
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Calibrate your system identity and BMR formula parameters.
              </p>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2 text-center">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                Choose Athlete Emblem
              </label>
              <div className="flex items-center justify-center space-x-2">
                {AVATAR_EMOJIS.slice(0, 6).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarEmoji(emoji)}
                    className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all ios-press cursor-pointer ${
                      avatarEmoji === emoji
                        ? 'bg-[#D4FB45]/20 border-2 border-[#D4FB45] shadow-lg shadow-[#D4FB45]/20 scale-105'
                        : 'bg-[#1C1C1E] border border-white/5 hover:border-white/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Athlete Display Name */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                Athlete Call-Sign / Name
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Aaron"
                className="w-full bg-[#1C1C1E] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white font-bold placeholder-white/20 focus:outline-none focus:border-[#D4FB45]"
              />
            </div>

            {/* Biological Sex Calibration (for Harris-Benedict/Mifflin St Jeor BMR) */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                Biological Calibration (BMR Target)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ios-press cursor-pointer border ${
                    gender === 'male'
                      ? 'bg-[#D4FB45]/15 border-[#D4FB45] text-white shadow-lg shadow-[#D4FB45]/10'
                      : 'bg-[#1C1C1E] border-white/5 text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ios-press cursor-pointer border ${
                    gender === 'female'
                      ? 'bg-[#D4FB45]/15 border-[#D4FB45] text-white shadow-lg shadow-[#D4FB45]/10'
                      : 'bg-[#1C1C1E] border-white/5 text-[#8E8E93] hover:text-white'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Athlete Biometrics
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Your physical markers calibrate basal burn, volume loading, and water quotas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Current Weight */}
              <div className="space-y-1.5 bg-[#141417] p-3.5 rounded-2xl border border-white/10">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-mono font-black text-white focus:outline-none"
                />
              </div>

              {/* Goal Weight */}
              <div className="space-y-1.5 bg-[#141417] p-3.5 rounded-2xl border border-[#D4FB45]/30">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#D4FB45] block">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={goalWeight || ''}
                  onChange={(e) => setGoalWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-mono font-black text-[#D4FB45] focus:outline-none"
                />
              </div>

              {/* Height */}
              <div className="space-y-1.5 bg-[#141417] p-3.5 rounded-2xl border border-white/10">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                  Height (cm)
                </label>
                <input
                  type="number"
                  required
                  value={height || ''}
                  onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-xl font-mono font-black text-white focus:outline-none"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5 bg-[#141417] p-3.5 rounded-2xl border border-white/10">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
                  Age (years)
                </label>
                <input
                  type="number"
                  required
                  value={age || ''}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-transparent text-xl font-mono font-black text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Objective & Pace
              </h2>
              <p className="text-xs text-[#8E8E93]">
                Select your primary training focus to calibrate your macro targets.
              </p>
            </div>

            {/* 3 Visual Goal Cards */}
            <div className="space-y-2.5">
              {goals.map((g) => {
                const isSelected = goalType === g.id;
                const IconComponent = g.icon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoalType(g.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ios-press cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1C1C1E] border-[#D4FB45] shadow-lg shadow-[#D4FB45]/15'
                        : 'bg-[#141417] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${g.color}20` }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color: g.color }} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-white">{g.title}</span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: `${g.color}20`, color: g.color }}
                          >
                            {g.subtitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E8E93] mt-0.5">{g.desc}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#D4FB45] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Target Timeline */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93]">
                  Commitment Timeline
                </span>
                <span className="text-xs font-mono font-bold text-[#D4FB45]">
                  {deadlineMonths} Months
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 9, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDeadlineMonths(m)}
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold transition-all ios-press cursor-pointer border ${
                      deadlineMonths === m
                        ? 'bg-[#D4FB45] text-black border-[#D4FB45]'
                        : 'bg-[#1C1C1E] text-[#8E8E93] border-white/5 hover:text-white'
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="w-full max-w-md mx-auto flex items-center space-x-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as any)}
            className="w-14 py-4 rounded-2xl bg-[#1C1C1E] border border-white/10 text-white flex items-center justify-center ios-press cursor-pointer hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-4 rounded-2xl bg-[#D4FB45] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-[#D4FB45]/20 ios-press cursor-pointer"
        >
          <span>{step === 3 ? 'CALIBRATE HABITS & REMINDERS →' : 'CONTINUE →'}</span>
        </button>
      </div>
    </div>
  );
};
