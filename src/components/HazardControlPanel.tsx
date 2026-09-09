import React from 'react';
import { HazardEventState, HazardType } from '../types';
import { AUSTRALIAN_HAZARDS } from '../data/hazardScenarios';
import {
  AlertTriangle,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Shuffle,
  Info
} from 'lucide-react';

interface HazardControlPanelProps {
  hazardState: HazardEventState;
  onTriggerHazard: (type: HazardType) => void;
  onClearHazard: () => void;
  randomHazardsEnabled: boolean;
  onToggleRandomHazards: () => void;
  followingDistanceSecs: number | null;
  playerSpeed: number;
}

export const HazardControlPanel: React.FC<HazardControlPanelProps> = ({
  hazardState,
  onTriggerHazard,
  onClearHazard,
  randomHazardsEnabled,
  onToggleRandomHazards,
  followingDistanceSecs,
  playerSpeed
}) => {
  const currentDef = AUSTRALIAN_HAZARDS.find(h => h.id === hazardState.activeHazard);

  return (
    <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl max-w-sm w-full text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs leading-none">Interactive Hazard Scenarios</h3>
            <span className="text-[10px] text-slate-400">Australian Road Rules Reaction Tests</span>
          </div>
        </div>

        <button
          id="toggle-random-hazards-btn"
          onClick={onToggleRandomHazards}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
            randomHazardsEnabled
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
          title="Auto-trigger unpredictable road events"
        >
          <Shuffle className="w-3 h-3" />
          <span>{randomHazardsEnabled ? 'Auto-Hazards ON' : 'Auto OFF'}</span>
        </button>
      </div>

      {/* 3-Second Following Distance Indicator */}
      <div className="mt-2.5 p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-slate-300 font-semibold">Following Distance:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {followingDistanceSecs !== null && playerSpeed > 5 ? (
            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
              followingDistanceSecs >= 3.0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : followingDistanceSecs >= 2.0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
            }`}>
              {followingDistanceSecs.toFixed(1)}s {followingDistanceSecs >= 3.0 ? '(Safe 3s Gap)' : '(Too Close!)'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">No Lead Car</span>
          )}
        </div>
      </div>

      {/* Active Hazard Banner & Reaction Timer */}
      {hazardState.activeHazard !== 'none' && currentDef && (
        <div className={`mt-2.5 p-2.5 rounded-xl border transition-all ${
          hazardState.status === 'passed'
            ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
            : hazardState.status === 'failed'
            ? 'bg-red-950/60 border-red-600/60 text-red-200'
            : 'bg-amber-950/60 border-amber-500/60 text-amber-200 animate-pulse'
        }`}>
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              {hazardState.status === 'passed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : hazardState.status === 'failed' ? (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="text-xs font-bold leading-tight">{currentDef.name}</span>
            </div>

            {hazardState.reactionTimeMs !== null && (
              <span className="text-[10px] font-mono font-bold bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 shrink-0">
                {(hazardState.reactionTimeMs / 1000).toFixed(2)}s Reaction
              </span>
            )}
          </div>

          <p className="text-[11px] mt-1.5 text-slate-300 leading-snug">
            {hazardState.feedback || currentDef.triggerPrompt}
          </p>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-300 flex items-center justify-between">
            <span className="font-semibold">{currentDef.dktReference}</span>
            <button
              id="clear-hazard-btn"
              onClick={onClearHazard}
              className="underline text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hazard Scenario Quick Trigger Buttons */}
      <div className="mt-2.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block mb-1">
          Test Specific Hazard:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {AUSTRALIAN_HAZARDS.map((hazard) => {
            const isActive = hazardState.activeHazard === hazard.id;
            return (
              <button
                key={hazard.id}
                id={`trigger-hazard-${hazard.id}`}
                onClick={() => onTriggerHazard(hazard.id)}
                className={`p-1.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <span className="text-[10px] font-semibold block leading-tight truncate">
                  {hazard.name.split(' (')[0]}
                </span>
                <span className="text-[9px] text-slate-400 font-mono block truncate">
                  {hazard.dktReference.split(':')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
