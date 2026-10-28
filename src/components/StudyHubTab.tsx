import React from 'react';
import {
  Play,
  Check,
  Upload,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { StudyChapter } from '../types';

export interface StudyHubSummary {
  completionPct: number;
  completedChapters: number;
  totalChapters: number;
  diffDays: number;
  avgHoursFormatted: string;
  todaysChapters: StudyChapter[];
}

interface StudyHubTabProps {
  studyHubSummary: StudyHubSummary;
  studyChapters: StudyChapter[];
  studyFilterMode: 'today' | 'all';
  setStudyFilterMode: (mode: 'today' | 'all') => void;
  examTargetDate: string;
  setExamTargetDate: (val: string) => void;
  totalStudyMinutesLogged: number;
  handleToggleChapterComplete: (id: string) => void;
  startFullScreenStudySession: () => void;
  saveStudyDataToFirestore: (chapters: StudyChapter[], examDate: string, totalMins: number) => Promise<void>;
  studyCsvError: string;
  handleStudyTimetableCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StudyHubTab: React.FC<StudyHubTabProps> = ({
  studyHubSummary,
  studyChapters,
  studyFilterMode,
  setStudyFilterMode,
  examTargetDate,
  setExamTargetDate,
  totalStudyMinutesLogged,
  handleToggleChapterComplete,
  startFullScreenStudySession,
  saveStudyDataToFirestore,
  studyCsvError,
  handleStudyTimetableCsvUpload
}) => {
  const displayedChapters = studyFilterMode === 'today' ? studyHubSummary.todaysChapters : studyChapters;

  return (
    <div className="space-y-4 pb-16 font-sans">
      {/* CARD 1: Study Overview */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Study Overview
          </h2>

          <button
            type="button"
            onClick={startFullScreenStudySession}
            className="btn-primary-green px-3.5 py-1.5 rounded-xl text-black font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-md shadow-[#D4FB45]/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black stroke-none" />
            <span>Start Session</span>
          </button>
        </div>

        {/* 3 Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Course Done</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#D4FB45] font-mono leading-none">
                {studyHubSummary.completionPct}%
              </span>
              <p className="text-[10px] text-white/60 mt-1 font-mono">
                {studyHubSummary.completedChapters} / {studyHubSummary.totalChapters} Ch
              </p>
            </div>
          </div>

          <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Avg Time / Ch</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                {studyHubSummary.avgHoursFormatted}
              </span>
              <p className="text-[10px] text-white/60 mt-1 font-mono">
                {totalStudyMinutesLogged}m total
              </p>
            </div>
          </div>

          <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Countdown</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#D4FB45] font-mono leading-none">
                {studyHubSummary.diffDays}d
              </span>
              <p className="text-[10px] text-white/60 mt-1">Days Left</p>
            </div>
          </div>
        </div>

        {/* Course Progress Bar & Exam Date Picker */}
        <div className="space-y-3 bg-[#19191D]/90 border border-white/10 rounded-2xl p-3.5 text-xs shadow-inner">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/60 font-semibold">Overall Course Progress</span>
            <span className="font-mono font-bold text-[#D4FB45]">{studyHubSummary.completionPct}%</span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#D4FB45] to-[#30D158] transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, studyHubSummary.completionPct))}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-white/60 font-semibold">Target Exam Date:</span>
            <input
              type="date"
              value={examTargetDate}
              onChange={(e) => {
                setExamTargetDate(e.target.value);
                saveStudyDataToFirestore(studyChapters, e.target.value, totalStudyMinutesLogged);
              }}
              className="bg-[#141417] border border-white/10 rounded-xl px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#D4FB45] transition cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* CARD 2: Syllabus & Chapters */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white shrink-0">
            Syllabus & Chapters
          </h2>

          {/* Apple-Style Segmented Filter Control */}
          <div className="p-1 bg-black/40 border border-white/10 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStudyFilterMode('today')}
              className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                studyFilterMode === 'today'
                  ? 'bg-[#242429] text-white font-bold shadow-md border border-white/10'
                  : 'text-white/50 hover:text-white/80 border border-transparent'
              }`}
            >
              Today ({studyHubSummary.todaysChapters.length})
            </button>
            <button
              type="button"
              onClick={() => setStudyFilterMode('all')}
              className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                studyFilterMode === 'all'
                  ? 'bg-[#242429] text-white font-bold shadow-md border border-white/10'
                  : 'text-white/50 hover:text-white/80 border border-transparent'
              }`}
            >
              All ({studyChapters.length})
            </button>
          </div>
        </div>

        {/* Chapter Checklist Rows */}
        <div className="bg-[#19191D]/90 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-inner">
          {displayedChapters.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-2">
              <p className="text-xs font-semibold text-white/50">
                No chapters scheduled for today's date window.
              </p>
              <button
                type="button"
                onClick={() => setStudyFilterMode('all')}
                className="text-xs font-bold text-[#D4FB45] hover:underline cursor-pointer"
              >
                View All {studyChapters.length} Chapters
              </button>
            </div>
          ) : (
            displayedChapters.map((ch) => (
              <div
                key={ch.id}
                className="w-full py-3 px-3.5 flex items-center justify-between text-xs hover:bg-white/[0.04] transition group"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                  {/* Tactile Circular Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleChapterComplete(ch.id)}
                    title={ch.completed ? 'Mark incomplete' : 'Mark completed'}
                    className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition shrink-0 active:scale-90 cursor-pointer ${
                      ch.completed
                        ? 'bg-[#D4FB45] border-[#D4FB45] text-black shadow-xs'
                        : 'border-white/30 hover:border-[#D4FB45] hover:bg-[#D4FB45]/15 text-transparent'
                    }`}
                  >
                    <Check className={`w-3 h-3 stroke-[2.5] ${ch.completed ? 'text-black' : 'group-hover:text-[#D4FB45]'}`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-[13px] font-semibold truncate transition-colors ${
                        ch.completed ? 'line-through text-white/40' : 'text-white group-hover:text-[#D4FB45]'
                      }`}
                    >
                      {ch.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-white/60 mt-0.5 font-mono">
                      <span className="flex items-center gap-1 text-[#38BDF8]">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{ch.startDate} → {ch.endDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chapter Serial Badge */}
                <span className="text-[10px] font-mono font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md shrink-0">
                  #{ch.serialNo}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Compact Bottom CSV Importer */}
        <div className="pt-1">
          {studyCsvError && (
            <p className="text-[#FF453A] font-bold bg-[#FF453A]/10 border border-[#FF453A]/30 p-2 rounded-xl text-[11px] mb-2">
              {studyCsvError}
            </p>
          )}
          <label className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-white/15 hover:border-[#D4FB45]/40 hover:bg-[#D4FB45]/5 text-white/50 hover:text-[#D4FB45] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Timetable (.CSV)</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleStudyTimetableCsvUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
