import React, { useState } from 'react';
import { CURRICULUM_SEASONS } from '../data';
import { CurriculumSeason } from '../types';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Award,
  ChevronRight,
  ShieldCheck,
  Compass,
  AlertOctagon,
  X,
  FileCheck2
} from 'lucide-react';

interface SeasonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeasonId: number;
  onSelectSeasonId: (id: number) => void;
  onStartPracticeSeason: (season: CurriculumSeason) => void;
}

export const SeasonGuideModal: React.FC<SeasonGuideModalProps> = ({
  isOpen,
  onClose,
  selectedSeasonId,
  onSelectSeasonId,
  onStartPracticeSeason
}) => {
  const [activeView, setActiveView] = useState<'seasons' | 'signs' | 'fails'>('seasons');

  if (!isOpen) return null;

  const currentSeason =
    CURRICULUM_SEASONS.find(s => s.id === selectedSeasonId) || CURRICULUM_SEASONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-black text-white">
                  Australian Driving Curriculum 2026
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Per-Section Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Read each season section first, then practice with real-time step-by-step guidance
              </p>
            </div>
          </div>

          <button
            id="close-season-guide-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Mode Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/50 border-b border-slate-800/80 overflow-x-auto scrollbar-none text-xs">
          <button
            id="tab-seasons-curriculum"
            onClick={() => setActiveView('seasons')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'seasons'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Seasons Curriculum (Read & Practice)</span>
          </button>

          <button
            id="tab-signs-guide"
            onClick={() => setActiveView('signs')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'signs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Signs & Regulatory Rules</span>
          </button>

          <button
            id="tab-fails-guide"
            onClick={() => setActiveView('fails')}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeView === 'fails'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Immediate Fail Items (ARR 2026)</span>
          </button>
        </div>

        {/* Modal Main Body */}
        {activeView === 'seasons' ? (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Left Season Selector Sidebar */}
            <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800/90 bg-slate-950/70 p-3 overflow-y-auto shrink-0 flex md:flex-col gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 hidden md:block">
                Curriculum Seasons
              </span>

              {CURRICULUM_SEASONS.map(season => {
                const isSelected = season.id === currentSeason.id;
                return (
                  <button
                    key={season.id}
                    id={`select-season-${season.id}-btn`}
                    onClick={() => onSelectSeasonId(season.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-center md:items-start justify-between md:justify-start gap-2 shrink-0 md:shrink ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-lg'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {season.badge}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {season.readTime}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate leading-tight text-white">
                        {season.title.replace(/Season \d+: /, '')}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 hidden md:block">
                        {season.steps.length} practical steps
                      </p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Right Season Content (Read Section + Practice CTA) */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {/* Season Header Banner */}
              <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-slate-950 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                      {currentSeason.badge} • {currentSeason.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300">
                      <Clock className="w-3 h-3" />
                      {currentSeason.readTime}
                    </span>
                  </div>

                  {/* Primary CTA: Practice with step-by-step guide */}
                  <button
                    id="start-season-practice-btn"
                    onClick={() => onStartPracticeSeason(currentSeason)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Practice with Step-by-Step Guide</span>
                  </button>
                </div>

                <h3 className="text-lg font-black text-white tracking-tight">
                  {currentSeason.title}
                </h3>
                <p className="text-xs font-semibold text-blue-300 mt-0.5">
                  {currentSeason.subtitle}
                </p>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {currentSeason.summary}
                </p>
              </div>

              {/* Part 1: Season to Read (Official Rules & Safety Foundation) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    1. Season Theory & Australian Road Rules
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentSeason.theory.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                            {item.ruleCode}
                          </span>
                          <span className="text-xs font-black text-white">
                            {item.ruleTitle}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-bold text-amber-400 shrink-0">Practical Safety:</span>
                        <span>{item.practicalImpact}</span>
                      </div>

                      {/* Immediate Fail Item Callout */}
                      <div className="flex items-start gap-2 text-[11px] text-red-300 bg-red-950/40 p-2.5 rounded-lg border border-red-900/50">
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-400">Immediate Critical Fail: </strong>
                          <span>{item.criticalFailCondition}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Rules to Remember Checklist */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Key Habits to Remember
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {currentSeason.keyRulesToRemember.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Part 2: Step-by-Step Practice Guide Preview */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      2. Step-by-Step Practice Routine ({currentSeason.steps.length} Steps)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Keyboard & Touch Controlled
                  </span>
                </div>

                <div className="space-y-2">
                  {currentSeason.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="flex items-start gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-xl hover:border-slate-700 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {step.stepNumber}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h5 className="text-xs font-bold text-white">
                            {step.title}
                          </h5>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[10px] font-bold">
                            [{step.keyPrompt}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {step.instruction}
                        </p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                          {step.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Launch Button */}
                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => onStartPracticeSeason(currentSeason)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all hover:scale-102"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch Interactive Practice for {currentSeason.badge}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'signs' ? (
          /* Signs View */
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Key Australian Regulatory Road Signs (AS 1742.2)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-4 border-red-600 flex flex-col items-center justify-center text-slate-950 font-black font-mono shrink-0">
                  <span className="text-[6px] uppercase leading-none">LIMIT</span>
                  <span className="text-xs leading-none">50</span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">50 km/h Urban Default</h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">Default speed limit on all residential and suburban streets unless signs post otherwise.</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-4 border-red-600 flex flex-col items-center justify-center text-slate-950 font-black font-mono shrink-0">
                  <span className="text-[6px] uppercase leading-none">LIMIT</span>
                  <span className="text-xs leading-none text-red-600">40</span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">40 km/h School Zone</h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">Mandatory 40 km/h speed limit on school days (8:00–9:30 AM & 2:30–4:00 PM).</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600 text-white font-black font-mono flex items-center justify-center text-xs shrink-0 shadow-md">
                  STOP
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">ARR Rule 67: STOP Sign</h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">You must come to a complete standstill before the solid white stop line. Rolling stops fail instantly.</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border-2 border-red-600 text-slate-900 font-bold font-mono flex flex-col items-center justify-center text-[8px] leading-tight shrink-0 shadow-md">
                  <span>GIVE</span>
                  <span>WAY</span>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">ARR Rule 69: GIVE WAY Sign</h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">Slow down and yield to any vehicle or pedestrian crossing the road.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Critical Fails View */
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div className="bg-red-950/40 border border-red-600/40 rounded-xl p-4">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                Australian Practical Drive Test - Immediate Critical Errors
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                In any official Australian state practical driving assessment (NSW, VIC, QLD, WA), committing any single one of these errors results in immediate termination of the drive test with an instant FAIL.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { title: 'Exceeding the Speed Limit', desc: 'Driving even 1 km/h above the posted or default speed limit at any time.' },
                { title: 'Failure to Give Way', desc: 'Failing to yield priority at a Stop sign, Give Way sign, or roundabout to vehicles on the right.' },
                { title: 'Failing to Keep Left', desc: 'Crossing the white dividing centerline into opposing oncoming traffic without a lawful reason.' },
                { title: 'Rolling Through a STOP Sign', desc: 'Failing to come to a complete zero km/h standstill behind the solid line.' },
                { title: 'Mounting or Striking the Kerb', desc: 'Hitting or mounting the roadside kerb during parking maneuvers or turns.' },
                { title: 'Collision or Examiner Intervention', desc: 'Causing a collision or forcing the examiner to apply emergency dual controls.' }
              ].map((err, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-900/80 border border-red-900/40 p-3 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{err.title}</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5">{err.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
