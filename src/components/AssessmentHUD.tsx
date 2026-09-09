import React, { useState } from 'react';
import { CameraView, DrivingLevel, RoadCheckpoint, TestFault, TestMode, TestTask } from '../types';
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
  ChevronUp,
  Target,
  Navigation,
  Compass
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
  activeCheckpoint?: RoadCheckpoint;
  activeCheckpointIndex?: number;
  totalCheckpoints?: number;
  distanceToTarget?: number;
  showCarBeacon?: boolean;
  onToggleCarBeacon?: () => void;
  autoAdvance?: {
    nextLevel: DrivingLevel;
    countdown: number;
    completedLevelTitle: string;
  } | null;
  onCancelAutoAdvance?: () => void;
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
  isLevelPassed,
  activeCheckpoint,
  activeCheckpointIndex = 0,
  totalCheckpoints = 10,
  distanceToTarget = 0,
  showCarBeacon = true,
  onToggleCarBeacon,
  autoAdvance,
  onCancelAutoAdvance
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
            {onToggleCarBeacon && (
              <button
                id="toggle-car-beacon-btn"
                onClick={onToggleCarBeacon}
                className={`p-1 rounded-lg border transition-colors ${
                  showCarBeacon
                    ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title={showCarBeacon ? 'Hide Floating Car Waypoint' : 'Show Floating Car Waypoint'}
              >
                <Navigation className="w-3 h-3" />
              </button>
            )}
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

        {/* Active Checkpoint Milestone Indicator */}
        {activeCheckpoint && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-cyan-300 truncate">
              <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <span className="truncate font-bold">
                WP {activeCheckpointIndex + 1}/{totalCheckpoints}: {activeCheckpoint.title.replace(/^Checkpoint\s*\d+:\s*/, '')}
              </span>
            </div>
            <span className="text-amber-300 font-bold ml-2 shrink-0 bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/30">
              {distanceToTarget}m
            </span>
          </div>
        )}

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

        {/* Auto-Advance / Level Success Banner */}
        {autoAdvance ? (
          <div className="p-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-2 border-emerald-400/80 rounded-xl flex flex-col gap-2 text-emerald-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wide block">
                    {autoAdvance.completedLevelTitle} Passed!
                  </span>
                  <span className="text-[11px] text-emerald-300 block font-medium">
                    Moving to <strong className="text-white">{autoAdvance.nextLevel.badge}</strong> in{' '}
                    <span className="font-mono text-amber-300 font-black text-xs px-1.5 py-0.5 rounded bg-black/40 border border-amber-500/40">
                      {autoAdvance.countdown}s
                    </span>
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400 flex items-center justify-center font-mono font-black text-white text-xs bg-emerald-900/60 shrink-0">
                {autoAdvance.countdown}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                id="hud-auto-advance-now-btn"
                onClick={() => onSelectNextLevel && onSelectNextLevel()}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/40 transition-all uppercase tracking-wider"
              >
                <span>Move to Next Course Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {onCancelAutoAdvance && (
                <button
                  id="hud-cancel-auto-advance-btn"
                  onClick={onCancelAutoAdvance}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors shrink-0"
                >
                  Stay
                </button>
              )}
            </div>
          </div>
        ) : isLevelPassed ? (
          <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/80 rounded-xl flex items-center justify-between text-emerald-200 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white">Level Complete!</span>
                <span className="text-[10px] text-emerald-300 block">All Objectives Passed</span>
              </div>
            </div>

            {onSelectNextLevel && (
              <button
                id="next-level-btn"
                onClick={onSelectNextLevel}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30"
              >
                <span>Next Course</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null}

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
