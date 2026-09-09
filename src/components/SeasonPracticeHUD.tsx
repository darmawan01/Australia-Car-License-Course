import React, { useEffect } from 'react';
import { CurriculumSeason, GuideStepItem, VehicleState } from '../types';
import { soundManager } from '../utils/audio';
import {
  CheckCircle2,
  ChevronRight,
  BookOpen,
  X,
  Sparkles,
  HelpCircle,
  Flag
} from 'lucide-react';

interface SeasonPracticeHUDProps {
  currentSeason: CurriculumSeason;
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSelectStep: (index: number) => void;
  onOpenSeasonTheory: () => void;
  onClosePractice: () => void;
  vehicleState: VehicleState;
}

export const SeasonPracticeHUD: React.FC<SeasonPracticeHUDProps> = ({
  currentSeason,
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onSelectStep,
  onOpenSeasonTheory,
  onClosePractice,
  vehicleState
}) => {
  const currentStep: GuideStepItem | undefined = currentSeason.steps[currentStepIndex];

  // Helper to test if current step condition is satisfied
  const isStepSatisfied = (step: GuideStepItem): boolean => {
    switch (step.checkType) {
      case 'gear_d':
        return vehicleState.gear === 'D';
      case 'handbrake_off':
        return !vehicleState.handbrake;
      case 'handbrake_on':
        return vehicleState.handbrake;
      case 'indicator_right':
        return vehicleState.rightIndicator;
      case 'indicator_left':
        return vehicleState.leftIndicator;
      case 'indicator_hazard':
        return vehicleState.hazardLights;
      case 'speed_moving':
        return Math.abs(vehicleState.speed) > 10;
      case 'speed_stop':
        return Math.abs(vehicleState.speed) < 1.5;
      case 'headlight_low':
        return vehicleState.headlightMode === 'low' || (vehicleState.headlights && !vehicleState.highBeams);
      case 'headlight_high':
        return vehicleState.headlightMode === 'high' || vehicleState.highBeams;
      case 'headlight_dim':
        return vehicleState.headlightMode === 'dim';
      case 'look_behind':
        return true;
      default:
        return false;
    }
  };

  const isCurrentComplete = currentStep ? isStepSatisfied(currentStep) : false;

  useEffect(() => {
    if (isCurrentComplete) {
      soundManager.playSuccessChime();
    }
  }, [isCurrentComplete]);

  if (!currentStep) return null;

  const totalSteps = currentSeason.steps.length;
  const isLastStep = currentStepIndex >= totalSteps - 1;

  return (
    <div className="pointer-events-none fixed top-16 inset-x-0 z-30 flex justify-center px-3">
      <div className="pointer-events-auto w-full max-w-xl bg-slate-950/92 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200 text-white">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
              {currentSeason.badge}
            </span>
            <h4 className="text-xs font-bold text-slate-200 truncate">
              {currentSeason.title}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Read Theory Button */}
            <button
              id="hud-open-theory-btn"
              onClick={onOpenSeasonTheory}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Read Australian Road Rules & Critical Fail Details for this Season"
            >
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>Read Rules</span>
            </button>

            {/* Exit Practice */}
            <button
              id="hud-close-practice-btn"
              onClick={onClosePractice}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Step-by-Step HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progress & Instruction */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold text-blue-400">
                Step {currentStep.stepNumber} of {totalSteps}:
              </span>
              <span className="text-xs font-black text-white">
                {currentStep.title}
              </span>

              {isCurrentComplete && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold animate-pulse">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  DONE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-snug mb-2">
              {currentStep.instruction}
            </p>

            {/* Practical Explanation */}
            <p className="text-[10px] text-slate-400 italic">
              💡 {currentStep.explanation}
            </p>
          </div>

          {/* Key Prompt Badge & Action Button */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-xl">
              <span className="text-[9px] text-slate-400 uppercase font-mono">Key:</span>
              <span className="font-mono text-xs font-black text-amber-400">
                [{currentStep.keyPrompt}]
              </span>
            </div>

            {isLastStep ? (
              <button
                id="hud-finish-season-btn"
                onClick={onOpenSeasonTheory}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-all"
              >
                <Flag className="w-3 h-3" />
                <span>Next Season</span>
              </button>
            ) : (
              <button
                id="hud-next-step-btn"
                onClick={onNextStep}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  isCurrentComplete
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Step Micro Indicators (Dots) */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
          {currentSeason.steps.map((s, idx) => {
            const done = isStepSatisfied(s);
            const isCurrent = idx === currentStepIndex;
            return (
              <button
                key={s.stepNumber}
                onClick={() => onSelectStep(idx)}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-amber-400 ring-1 ring-amber-300'
                    : done
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
                title={`Step ${s.stepNumber}: ${s.title}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
