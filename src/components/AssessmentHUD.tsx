import React, { useState } from 'react';
import { CameraView, DrivingLevel, TestFault, TestMode, TestTask } from '../types';
import {
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Trophy,
  ChevronLeft,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AssessmentHUDProps {
  mode: TestMode;
  currentLevel: DrivingLevel;
  currentTask: TestTask | null;
  currentTaskIndex: number;
  totalTasks: number;
  minorFaults: TestFault[];
  criticalFailItem: string | null;
  onRestartTest: () => void;
  onOpenGuide: () => void;
  onSelectNextLevel?: () => void;
  onSelectPrevLevel?: () => void;
  timeElapsed: number;
  isLevelPassed?: boolean;
}

export const AssessmentHUD: React.FC<AssessmentHUDProps> = ({
  mode,
  currentLevel,
  currentTask,
  currentTaskIndex,
  totalTasks,
  minorFaults,
  criticalFailItem,
  onRestartTest,
  onOpenGuide,
  onSelectNextLevel,
  onSelectPrevLevel,
  timeElapsed,
  isLevelPassed
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 sm:top-16 p-3 z-30 flex items-start justify-between">
      {/* Top Left: Examiner Directives & Active Level Card (Low-profile, sleek) */}
      <div className="pointer-events-auto max-w-sm w-full bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 shadow-xl space-y-2">
        {/* Level Header Strip */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0 ${
              currentLevel.category === 'course'
                ? 'bg-blue-600'
                : currentLevel.category === 'practice'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}>
              {currentLevel.id}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {currentLevel.category} {currentLevel.categoryNumber}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {currentLevel.badge}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                {currentLevel.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
              {formatTime(timeElapsed)}
            </span>
            <button
              id="hud-collapse-btn"
              onClick={() => setIsCollapsed(prev => !prev)}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title={isCollapsed ? 'Expand Details' : 'Collapse Details'}
            >
              {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
            <button
              id="hud-restart-btn"
              onClick={onRestartTest}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              title="Reset Level"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Examiner Directive Message */}
            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
              <p className="text-xs text-slate-200 leading-relaxed italic">
                "{currentLevel.examinerDirective.replace(/^Examiner:\s*"/, '').replace(/"$/, '')}"
              </p>
            </div>

            {/* Level Objectives Checklist */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Objectives
              </span>
              <div className="space-y-1">
                {currentLevel.objectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Level Success Prompt */}
        {isLevelPassed && (
          <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/80 rounded-xl flex items-center justify-between text-emerald-200 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white">Level Complete!</span>
                <span className="text-[10px] text-emerald-300 block">3 Stars Earned</span>
              </div>
            </div>

            {onSelectNextLevel && (
              <button
                id="next-level-btn"
                onClick={onSelectNextLevel}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Critical Fail Alert */}
        {criticalFailItem && (
          <div className="p-2 bg-red-950/90 border border-red-600/80 rounded-xl flex items-start gap-2 text-red-200 animate-pulse">
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold uppercase text-red-400">Critical Fault</span>
              <p className="text-[10px] leading-snug">{criticalFailItem}</p>
            </div>
          </div>
        )}

        {/* Minor Faults Count & Prev/Next Quick Switcher */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Faults: <strong className="text-white">{minorFaults.length}</strong></span>
          </div>

          <div className="flex items-center gap-1">
            {onSelectPrevLevel && currentLevel.id > 1 && (
              <button
                id="hud-prev-lvl-btn"
                onClick={onSelectPrevLevel}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-0.5 text-[10px] font-bold"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>
            )}

            {onSelectNextLevel && currentLevel.id < 11 && (
              <button
                id="hud-next-lvl-btn"
                onClick={onSelectNextLevel}
                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-0.5 text-[10px] font-bold shadow-sm"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
