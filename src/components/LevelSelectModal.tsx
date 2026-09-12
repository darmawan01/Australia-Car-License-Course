import React, { useState } from 'react';
import { DrivingLevel, LevelCategory, LevelProgress } from '../types';
import { DRIVING_LEVELS } from '../data/levelProgression';
import {
  X,
  Star,
  Trophy,
  Play,
  CheckCircle2,
  Lock,
  Compass,
  AlertTriangle,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevelId: number;
  onSelectLevel: (level: DrivingLevel) => void;
  levelProgress: Record<number, { unlocked: boolean; completed: boolean; stars: number; bestScore: number; bestTime: number }>;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  currentLevelId,
  onSelectLevel,
  levelProgress
}) => {
  const [activeCategory, setActiveCategory] = useState<LevelCategory>('course');

  if (!isOpen) return null;

  const filteredLevels = DRIVING_LEVELS.filter(l => l.category === activeCategory);

  // Overall stats
  const totalCompleted = (Object.values(levelProgress) as LevelProgress[]).filter(p => p.completed).length;
  const totalStars = (Object.values(levelProgress) as LevelProgress[]).reduce((acc, p) => acc + (p.stars || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Driver Curriculum & Levels</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  2026 Australian Standard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Progress through Course, Hazard Practice, and the Official Practical Drive Exam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{totalStars} / {DRIVING_LEVELS.length * 3} Stars</span>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="text-slate-300 font-semibold">
                {totalCompleted} / {DRIVING_LEVELS.length} Complete
              </div>
            </div>

            <button
              id="close-level-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Main Categories Tabs */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto">
          <button
            id="cat-tab-course"
            onClick={() => setActiveCategory('course')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 ${
              activeCategory === 'course'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Course (Basics & Maneuvers)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/40">
              Levels 1-5
            </span>
          </button>

          <button
            id="cat-tab-practice"
            onClick={() => setActiveCategory('practice')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 ${
              activeCategory === 'practice'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. Practice (Hazard Perception)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-400/40">
              Levels 6-9
            </span>
          </button>

          <button
            id="cat-tab-exam"
            onClick={() => setActiveCategory('exam')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shrink-0 ${
              activeCategory === 'exam'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>3. Exam (Official Assessment)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-400/40">
              Levels 10-11
            </span>
          </button>
        </div>

        {/* Level List / Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredLevels.map((lvl) => {
            const progress = levelProgress[lvl.id] || { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 };
            const isCurrent = lvl.id === currentLevelId;

            return (
              <div
                key={lvl.id}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-blue-950/30 border-blue-500/80 shadow-lg shadow-blue-500/10'
                    : progress.completed
                    ? 'bg-slate-950/60 border-emerald-800/50 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left side details */}
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Level Number Box */}
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 border shadow-sm ${
                    progress.completed
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : isCurrent
                      ? 'bg-blue-900 text-blue-200 border-blue-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    <span className="text-[9px] uppercase font-mono tracking-tighter text-slate-400">LVL</span>
                    <span className="text-lg leading-none font-mono">{lvl.id}</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <span>{lvl.title}</span>
                        {progress.completed && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </h3>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        {lvl.badge}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-bold">
                        Limit: {lvl.speedLimit} km/h
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      {lvl.description}
                    </p>

                    {/* Course Driving Situation Pill */}
                    {lvl.situation && (
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                          <span>{lvl.situation.timeLabel}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-cyan-300 font-semibold border border-cyan-500/30 flex items-center gap-1">
                          <span>{lvl.situation.weatherLabel}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 font-medium border border-slate-700">
                          Traffic: {lvl.situation.trafficDensity}
                        </span>
                      </div>
                    )}

                    {/* Objectives Checklist */}
                    <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300">
                      {lvl.objectives.map((obj, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>{obj}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Stars & Play Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  {/* Star rating */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx <= progress.stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {progress.bestScore > 0 ? `${progress.bestScore}% Score` : 'Not completed'}
                    </span>
                  </div>

                  {/* Start / Replay Button */}
                  <button
                    id={`start-level-${lvl.id}-btn`}
                    onClick={() => {
                      onSelectLevel(lvl);
                      onClose();
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md ${
                      isCurrent
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 ring-2 ring-blue-400/50'
                        : progress.completed
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCurrent ? 'Current Level' : progress.completed ? 'Replay' : 'Start'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Meets Austroads 2026 National Graduated Licensing Scheme (GLS) Standards</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
