import React, { useState } from 'react';
import { Trophy, User, X, Send, ShieldAlert, KeyRound, Download, Upload, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { AVATAR_EMOJIS, PRESET_HYPE_BUBBLES, ANONYMOUS_ADJECTIVES, ANONYMOUS_NOUNS } from '../constants';
import { linkAccountWithGoogle, exportAllUserData, importUserData, appId } from '../lib/firebase';
import type { Profile, ZestGroup, ZestMember } from '../types';

export interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  myLiveZestMemberStats: ZestMember;
  activeZestObj: ZestGroup | null;
  activeZestCode: string;
  setActiveZestCode: (code: string) => void;
  newZestTitleInput: string;
  setNewZestTitleInput: (val: string) => void;
  joinZestCodeInput: string;
  setJoinZestCodeInput: (val: string) => void;
  handleCreatePublicZest: () => Promise<void>;
  handleJoinPublicZest: () => Promise<void>;
  handleAddDemoSquadMates: () => Promise<void>;
  handleSendZestBubble: (member: ZestMember, preset: string) => Promise<void>;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  user: any;
  triggerToast: (msg: string) => void;
  db: any;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  profile,
  setProfile,
  myLiveZestMemberStats,
  activeZestObj,
  activeZestCode,
  newZestTitleInput,
  setNewZestTitleInput,
  joinZestCodeInput,
  setJoinZestCodeInput,
  handleCreatePublicZest,
  handleJoinPublicZest,
  handleAddDemoSquadMates,
  handleSendZestBubble,
  handleSaveProfile,
  user,
  triggerToast,
  db
}) => {
  const [profileSectionTab, setProfileSectionTab] = useState<'leaderboard' | 'settings' | 'account'>('leaderboard');
  const [zestTimeframe, setZestTimeframe] = useState<'today' | '7day'>('today');
  const [zestSortMetric, setZestSortMetric] = useState<string>('fairScore');
  const [selectedBubbleTarget, setSelectedBubbleTarget] = useState<ZestMember | null>(null);
  const [peekMemberUid, setPeekMemberUid] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleRandomizeUsername = () => {
    const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
    const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setProfile((prev) => ({ ...prev, username: `${adj}${noun}${num}` }));
  };

  const handleGoogleBackup = async () => {
    try {
      const res = await linkAccountWithGoogle(user, triggerToast);
      if (res.success) {
        triggerToast('Google Account linked successfully!');
      }
    } catch (err: any) {
      console.error('Account backup error:', err);
    }
  };

  const handleExportData = async () => {
    if (!db || !user) {
      triggerToast('Database not connected. Offline mode.');
      return;
    }
    try {
      setIsExporting(true);
      const jsonStr = await exportAllUserData(db, user, appId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `switch-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast('Downloaded complete SWITCH data backup!');
    } catch (err: any) {
      triggerToast(`Export error: ${err.message || 'Failed'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string') return;
      try {
        setIsImporting(true);
        const res = await importUserData(db, user, appId, content);
        triggerToast(`Restored ${res.count} records! Reloading app...`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        triggerToast(`Import error: ${err.message || 'Invalid backup file'}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
      {/* iOS 18 Bottom Sheet Container */}
      <div className="bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto ios-sheet-animate">
        {/* iOS Grab Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto shrink-0 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl p-2 rounded-2xl bg-[#2C2C2E] border border-white/5 flex items-center justify-center">
              {profile.avatarEmoji}
            </span>
            <div>
              <h3 className="text-base font-black text-white leading-tight">@{profile.username}</h3>
              <p className="text-[11px] text-[#30D158] font-bold">
                Fair Zest Score: {myLiveZestMemberStats.fairZestScore} pts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition ios-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-[#2C2C2E] p-1 rounded-2xl border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setProfileSectionTab('leaderboard')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 truncate ${
              profileSectionTab === 'leaderboard'
                ? 'bg-[#3A3A3C] text-white shadow-md'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <span className="truncate">Squad</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileSectionTab('settings')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 truncate ${
              profileSectionTab === 'settings'
                ? 'bg-[#3A3A3C] text-white shadow-md'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#30D158]" />
            <span className="truncate">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setProfileSectionTab('account')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 truncate ${
              profileSectionTab === 'account'
                ? 'bg-[#3A3A3C] text-white shadow-md'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#32ADE6]" />
            <span className="truncate">Backup</span>
          </button>
        </div>

        {/* TAB 1: LEADERBOARD & ZESTS */}
        {profileSectionTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#30D158]">
                  Competition Zests (8-Char Codes)
                </span>
                {activeZestObj && (
                  <span className="text-[11px] font-mono font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 px-2.5 py-0.5 rounded-full">
                    Active: {activeZestObj.code}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Squad Name (optional)"
                    value={newZestTitleInput}
                    onChange={(e) => setNewZestTitleInput(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#30D158]"
                  />
                  <button
                    type="button"
                    onClick={handleCreatePublicZest}
                    className="shrink-0 px-3 py-2 rounded-xl bg-[#30D158] hover:bg-[#30D158]/90 text-black font-black text-xs ios-press transition"
                  >
                    + Create
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="8-Char Code"
                    value={joinZestCodeInput}
                    onChange={(e) => setJoinZestCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase placeholder-white/30 focus:outline-none focus:border-[#32ADE6]"
                  />
                  <button
                    type="button"
                    onClick={handleJoinPublicZest}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-[#32ADE6] hover:bg-[#32ADE6]/90 text-black font-black text-xs ios-press transition"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {!activeZestObj ? (
              <div className="bg-[#2C2C2E]/40 border border-white/5 rounded-2xl p-6 text-center space-y-2">
                <Trophy className="w-8 h-8 text-[#FF9F0A] mx-auto" />
                <p className="text-xs font-bold text-white">No Competition Zest Active</p>
                <p className="text-[11px] text-[#8E8E93]">
                  Create a squad to generate a shareable 8-character code, or join a friend's squad to compete live!
                </p>
              </div>
            ) : (
              <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeZestObj.title}</h4>
                    <span className="text-[10px] text-[#8E8E93]">
                      {(activeZestObj.members || []).length} Athlete(s) • Code:{' '}
                      <b className="text-[#30D158] font-mono">{activeZestObj.code}</b>
                    </span>
                  </div>
                  <div className="flex bg-[#1C1C1E] p-1 rounded-xl border border-white/5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setZestTimeframe('today')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        zestTimeframe === 'today' ? 'bg-[#3A3A3C] text-white' : 'text-[#8E8E93]'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setZestTimeframe('7day')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        zestTimeframe === '7day' ? 'bg-[#3A3A3C] text-white' : 'text-[#8E8E93]'
                      }`}
                    >
                      7-Day
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'fairScore', label: 'Fair Score' },
                    { id: 'kgs', label: 'Volume (kg)' },
                    { id: 'kcal', label: 'Kcal Burn' },
                    { id: 'discipline', label: 'Macros & Water' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setZestSortMetric(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border whitespace-nowrap transition ios-press ${
                        zestSortMetric === tab.id
                          ? 'bg-[#D4FB45] text-black border-[#D4FB45] font-black'
                          : 'bg-[#1C1C1E] border-white/5 text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {(activeZestObj.members || []).length < 3 && (
                  <div className="bg-[#D4FB45]/10 border border-[#D4FB45]/20 rounded-xl p-3 flex items-center justify-between gap-2 text-[11px]">
                    <div className="text-white/80">
                      <b className="text-[#D4FB45] flex items-center gap-1 inline-flex">
                        <Lock className="w-3 h-3 text-[#D4FB45]" />
                        <span>Full Records Locked ({(activeZestObj.members || []).length}/3 Joined):</span>
                      </b>{' '}
                      Once 3 people join, full daily track records unlock!
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDemoSquadMates}
                      className="shrink-0 btn-primary-green px-2.5 py-1.5 rounded-lg text-[10px]"
                    >
                      + Simulate 2 Friends
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {[...(activeZestObj.members || [])]
                    .sort((a, b) => {
                      if (zestSortMetric === 'kgs') {
                        return zestTimeframe === 'today'
                          ? (b.todayVolumeKg || 0) - (a.todayVolumeKg || 0)
                          : (b.sevenDayVolumeKg || 0) - (a.sevenDayVolumeKg || 0);
                      }
                      if (zestSortMetric === 'kcal') {
                        return zestTimeframe === 'today'
                          ? (b.todayKcalBurn || 0) - (a.todayKcalBurn || 0)
                          : (b.sevenDayKcalBurn || 0) - (a.sevenDayKcalBurn || 0);
                      }
                      if (zestSortMetric === 'discipline') {
                        return (
                          (b.pureFoodMacroPct || 0) +
                          (b.waterPct || 0) -
                          ((a.pureFoodMacroPct || 0) + (a.waterPct || 0))
                        );
                      }
                      return zestTimeframe === 'today'
                        ? (b.fairZestScore || 0) - (a.fairZestScore || 0)
                        : (b.sevenDayZestScore || 0) - (a.sevenDayZestScore || 0);
                    })
                    .map((member, rankIdx) => {
                      const isUnlocked = (activeZestObj.members || []).length >= 3;
                      const isPeekOpen = peekMemberUid === member.uid;
                      const primaryBadge =
                        zestSortMetric === 'kgs'
                          ? `${(
                              zestTimeframe === 'today' ? member.todayVolumeKg || 0 : member.sevenDayVolumeKg || 0
                            ).toLocaleString()} kg`
                          : zestSortMetric === 'kcal'
                          ? `${(
                              zestTimeframe === 'today' ? member.todayKcalBurn || 0 : member.sevenDayKcalBurn || 0
                            ).toLocaleString()} kcal`
                          : zestSortMetric === 'discipline'
                          ? `M:${member.pureFoodMacroPct || 0}% • W:${member.waterPct || 0}%`
                          : `${
                              zestTimeframe === 'today' ? member.fairZestScore || 0 : member.sevenDayZestScore || 0
                            } pts`;

                      return (
                        <div
                          key={member.uid || rankIdx}
                          className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                                  rankIdx === 0
                                    ? 'bg-[#FFD60A] text-black shadow-md'
                                    : rankIdx === 1
                                    ? 'bg-[#E5E5EA] text-black'
                                    : rankIdx === 2
                                    ? 'bg-[#A2845E] text-white'
                                    : 'bg-[#2C2C2E] text-[#8E8E93]'
                                }`}
                              >
                                {rankIdx + 1}
                              </span>
                              <span className="text-lg shrink-0">{member.avatarEmoji || '🦍'}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  @{member.username}
                                  {member.uid === (user?.uid || 'local-user') && (
                                    <span className="ml-1.5 text-[9px] bg-[#30D158]/20 text-[#30D158] px-1.5 py-0.2 rounded font-bold">
                                      YOU
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-[#8E8E93]">
                                  Vol: {(member.todayVolumeKg || 0).toLocaleString()} kg • RPE {member.todayAvgRpe || 7.5}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className="px-2.5 py-1 rounded-xl bg-[#2C2C2E] border border-white/5 font-mono text-xs font-bold text-[#30D158]">
                                {primaryBadge}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBubbleTarget(
                                    selectedBubbleTarget?.uid === member.uid ? null : member
                                  );
                                }}
                                className="p-2 rounded-xl bg-[#30D158]/15 hover:bg-[#30D158]/25 text-[#30D158] border border-[#30D158]/30 transition ios-press"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isUnlocked) {
                                    triggerToast('3 members required in this Zest to unlock Track Records!');
                                    return;
                                  }
                                  setPeekMemberUid(isPeekOpen ? null : member.uid);
                                }}
                                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                  isUnlocked
                                    ? 'bg-[#D4FB45]/15 border-[#D4FB45]/30 text-[#D4FB45] hover:bg-[#D4FB45]/25'
                                    : 'bg-[#2C2C2E] border-white/5 text-[#8E8E93]'
                                }`}
                              >
                                {isUnlocked ? (isPeekOpen ? 'Hide' : 'Track Record') : '3 Req (Locked)'}
                              </button>
                            </div>
                          </div>

                          {isUnlocked && isPeekOpen && (
                            <div className="bg-[#2C2C2E]/40 border border-[#32ADE6]/30 rounded-xl p-3 space-y-2 text-[11px]">
                              <div className="flex items-center justify-between text-[#32ADE6] font-bold border-b border-white/5 pb-1">
                                <span>@{member.username}'s Track Record</span>
                                <span className="font-mono">{member.fairZestScore || 0} Pts</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-[#1C1C1E] p-2 rounded-lg">
                                  <span className="text-[9px] text-[#8E8E93] block uppercase">Workout Volume</span>
                                  <b className="text-white font-mono">
                                    {(member.todayVolumeKg || 0).toLocaleString()} kg
                                  </b>
                                </div>
                                <div className="bg-[#1C1C1E] p-2 rounded-lg">
                                  <span className="text-[9px] text-[#8E8E93] block uppercase">Active Burn</span>
                                  <b className="text-[#FF9F0A] font-mono">{member.todayKcalBurn || 0} kcal</b>
                                </div>
                                <div className="bg-[#1C1C1E] p-2 rounded-lg">
                                  <span className="text-[9px] text-[#8E8E93] block uppercase">Pure Food</span>
                                  <b className="text-[#30D158] font-mono">{member.pureFoodMacroPct || 0}%</b>
                                </div>
                                <div className="bg-[#1C1C1E] p-2 rounded-lg">
                                  <span className="text-[9px] text-[#8E8E93] block uppercase">Hydration</span>
                                  <b className="text-[#32ADE6] font-mono">{member.waterMl || 0} ml</b>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedBubbleTarget?.uid === member.uid && (
                            <div className="bg-[#2C2C2E]/60 border border-[#30D158]/40 rounded-xl p-3 space-y-2 text-xs">
                              <span className="font-bold text-[#30D158] text-[11px] block">
                                Send Zero-Chat Bubble to @{member.username}
                              </span>
                              <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                {PRESET_HYPE_BUBBLES.map((preset, pIdx) => {
                                  const preview = preset.replace(/@username/g, `@${member.username}`);
                                  return (
                                    <button
                                      key={pIdx}
                                      type="button"
                                      onClick={() => handleSendZestBubble(member, preset)}
                                      className="text-left px-2.5 py-2 rounded-lg bg-[#1C1C1E] hover:bg-[#3A3A3C] border border-white/5 text-[11px] text-white flex items-center justify-between transition"
                                    >
                                      <span className="truncate">{preview}</span>
                                      <span className="text-[10px] text-[#30D158] font-black ml-2 shrink-0">
                                        Send →
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & BIOMETRICS (Apple Inset Grouped) */}
        {profileSectionTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-[#1C1C1E] border border-white/10">
                  {profile.avatarEmoji}
                </span>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#8E8E93] uppercase block">
                    Anonymous Squad Username
                  </label>
                  <div className="flex gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#30D158]"
                    />
                    <button
                      type="button"
                      onClick={handleRandomizeUsername}
                      className="px-2.5 py-1.5 rounded-xl bg-[#3A3A3C] text-white text-[10px] font-bold shrink-0 ios-press"
                    >
                      Randomize
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 p-2.5 rounded-xl text-[11px] text-[#FF9F0A]">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Privacy Guarantee: Raw weight and age are NEVER sent to squad leaderboards. They stay strictly private on your device.
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase block mb-1">
                  Choose Avatar Emoji
                </span>
                <div className="grid grid-cols-8 gap-1">
                  {AVATAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setProfile({ ...profile, avatarEmoji: em })}
                      className={`h-8 rounded-lg text-base flex items-center justify-center transition ${
                        profile.avatarEmoji === em
                          ? 'bg-[#30D158] text-black font-bold'
                          : 'bg-[#1C1C1E] hover:bg-[#3A3A3C]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Goal Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profile.goalWeight}
                    onChange={(e) => setProfile({ ...profile, goalWeight: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    value={profile.height}
                    onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Primary Goal</label>
                  <select
                    value={profile.goalType}
                    onChange={(e) => setProfile({ ...profile, goalType: e.target.value })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  >
                    <option value="fatloss">Fat Loss</option>
                    <option value="recomp">Body Recomposition</option>
                    <option value="muscle">Lean Muscle Gain</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#8E8E93] block mb-1">Goal Deadline</label>
                  <select
                    value={profile.deadlineMonths}
                    onChange={(e) => setProfile({ ...profile, deadlineMonths: Number(e.target.value) })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  >
                    {[3, 6, 9, 12, 15, 18, 21, 24].map((m) => (
                      <option key={m} value={m}>
                        {m} Months
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#30D158] hover:bg-[#30D158]/90 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#30D158]/20 ios-press transition mt-2"
              >
                Save Athlete Profile
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: BACKUP & DATA EXPORT */}
        {profileSectionTab === 'account' && (
          <div className="space-y-4">
            <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-[#30D158]">Cloud Sync & Authentication</h4>
                  <p className="text-[11px] text-[#8E8E93] mt-0.5">
                    {user?.isAnonymous
                      ? 'Currently using an anonymous guest session.'
                      : user?.email
                      ? `Linked to Google: ${user.email}`
                      : 'Authenticated.'}
                  </p>
                </div>
                {!user?.isAnonymous && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Backed Up</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleGoogleBackup}
                className="w-full py-3 rounded-2xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition ios-press"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{user?.isAnonymous ? 'Link with Google Account' : 'Switch Google Account'}</span>
              </button>
            </div>

            <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase text-[#32ADE6]">Offline JSON Backup</h4>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Save your logs, notes, workouts, and reminders to your local drive.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleExportData}
                  className="py-2.5 px-3 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#32ADE6]/40 text-[#32ADE6] font-bold text-xs flex items-center justify-center gap-1.5 transition ios-press"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Exporting...' : 'Export JSON'}</span>
                </button>
                <label className="py-2.5 px-3 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-[#30D158]/40 text-[#30D158] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer text-center ios-press">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Restoring...' : 'Restore JSON'}</span>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
