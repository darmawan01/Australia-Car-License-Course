import React, { useState } from 'react';
import { VehicleState, Gear, LicenseStage } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Sun,
  AlertTriangle,
  Volume2,
  VolumeX,
  Eye,
  Minimize2,
  Maximize2,
  TriangleAlert,
  Sparkles,
  BookOpen,
  Activity,
  Save
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { RealtimeTelemetryChart } from './RealtimeTelemetryChart';

interface DashboardProps {
  vehicleState: VehicleState;
  onToggleIndicator: (dir: 'left' | 'right' | 'hazard') => void;
  onSelectGear: (gear: Gear) => void;
  onToggleHeadlights: () => void;
  onSetHeadlightMode?: (mode: 'off' | 'dim' | 'low' | 'high') => void;
  onToggleHandbrake: () => void;
  onHornStart: () => void;
  onHornEnd: () => void;
  currentSpeedLimit: number;
  licenseStage: LicenseStage;
  isLookingBehind?: boolean;
  onToggleLookBehind?: () => void;
  onOpenSeasonGuide?: () => void;
  onOpenSaveModal?: () => void;
}

const GEAR_CONFIG: Record<Gear, { label: string; key: string; color: string; activeStyle: string; hint: string }> = {
  P: {
    label: 'PARKING',
    key: 'P',
    color: 'text-red-400',
    activeStyle: 'bg-red-600 text-white shadow-md shadow-red-600/50 border-red-400 font-black scale-102',
    hint: 'P -> Parking Shifter [Press P or 1]'
  },
  R: {
    label: 'REVERSE',
    key: 'R',
    color: 'text-amber-400',
    activeStyle: 'bg-amber-600 text-white shadow-md shadow-amber-600/50 border-amber-400 font-black scale-102',
    hint: 'R -> Reverse [Press R or 2]'
  },
  N: {
    label: 'NETRAL',
    key: 'N',
    color: 'text-sky-400',
    activeStyle: 'bg-sky-600 text-white shadow-md shadow-sky-600/50 border-sky-400 font-black scale-102',
    hint: 'N -> Netral / Neutral [Press N or 3]'
  },
  D: {
    label: 'DRIVE',
    key: 'D',
    color: 'text-emerald-400',
    activeStyle: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/50 border-emerald-400 font-black scale-102',
    hint: 'D -> Drive [Press D, G, or 4]'
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  vehicleState,
  onToggleIndicator,
  onSelectGear,
  onToggleHeadlights,
  onSetHeadlightMode,
  onToggleHandbrake,
  currentSpeedLimit,
  isLookingBehind = false,
  onToggleLookBehind,
  onOpenSeasonGuide,
  onOpenSaveModal
}) => {
  const [isCarFocusMode, setIsCarFocusMode] = useState<boolean>(false);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(true);
  const isSpeeding = Math.abs(vehicleState.speed) > currentSpeedLimit + 1;
  const isMuted = soundManager.getIsMuted();
  const speed = Math.round(Math.abs(vehicleState.speed));
  const speedRatio = Math.min(1, speed / 80);

  // Compute realistic throttle output percentage (0 - 100%)
  const throttlePercent = vehicleState.handbrake
    ? 0
    : vehicleState.gear === 'P' || vehicleState.gear === 'N'
    ? 0
    : Math.min(100, Math.round(Math.max(0, (speed / Math.max(1, currentSpeedLimit)) * 90 + (speed > 2 ? 10 : 0))));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end p-2 sm:p-3 z-20">
      {/* Real-time D3.js Telemetry Line Chart (Speed & Throttle) */}
      {showTelemetry && !isCarFocusMode && (
        <div className="pointer-events-auto self-center w-full max-w-3xl mb-1.5 flex justify-end">
          <div className="w-72 sm:w-80">
            <RealtimeTelemetryChart
              speed={speed}
              throttle={throttlePercent}
              speedLimit={currentSpeedLimit}
            />
          </div>
        </div>
      )}

      {/* Speed Warning Banner if Exceeded */}
      {isSpeeding && (
        <div className="self-center mb-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-lg animate-pulse border border-red-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          Speed Warning: {speed} km/h in a {currentSpeedLimit} zone!
        </div>
      )}

      {/* MINIMAL CAR FOCUS PILL (When Focus Mode is Active) */}
      {isCarFocusMode ? (
        <div className="pointer-events-auto self-center bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-full px-4 py-1.5 shadow-xl flex items-center gap-3">
          {/* Australian Speed Limit Badge */}
          <div className="relative flex flex-col items-center justify-center w-6 h-6 rounded-full bg-white border border-red-600 shadow-sm shrink-0">
            <span className="font-mono text-[9px] font-black text-slate-900 leading-none">
              {currentSpeedLimit}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-lg font-black ${isSpeeding ? 'text-red-500' : 'text-white'}`}>
              {speed}
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">km/h</span>
          </div>

          <div className="h-3.5 w-px bg-slate-700" />

          {/* Shifter indicator */}
          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
            vehicleState.gear === 'P' ? 'text-red-400 bg-red-950/80 border-red-500/40' :
            vehicleState.gear === 'R' ? 'text-amber-400 bg-amber-950/80 border-amber-500/40' :
            vehicleState.gear === 'N' ? 'text-sky-400 bg-sky-950/80 border-sky-500/40' :
            'text-emerald-400 bg-emerald-950/80 border-emerald-500/40'
          }`}>
            {vehicleState.gear} • {GEAR_CONFIG[vehicleState.gear].label}
          </span>

          <div className="h-3.5 w-px bg-slate-700" />

          {/* Look Behind quick button */}
          {onToggleLookBehind && (
            <button
              onClick={onToggleLookBehind}
              className={`p-1 rounded-md text-xs transition-colors ${
                isLookingBehind ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Look Behind [B]"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsCarFocusMode(false)}
            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 ml-1"
          >
            Expand
          </button>
        </div>
      ) : (
        /* FULL AUTOMOTIVE ERGONOMIC DASHBOARD (Separated Pods, Zero Overlap) */
        <div className="pointer-events-auto self-center w-full max-w-3xl bg-slate-950/92 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">

            {/* POD 1: SIGNALS & HAZARD POD (Sign Left [U], Hazard [H], Sign Right [O]) */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1 shrink-0">
              {/* Sign Left [U] */}
              <button
                id="sign-left-btn"
                onClick={() => onToggleIndicator('left')}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all ${
                  vehicleState.leftIndicator && vehicleState.indicatorsBlinkState
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50 scale-105'
                    : vehicleState.leftIndicator
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-600/50'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
                title="Sign Left / Left Indicator [Press U]"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[7px] font-mono font-bold leading-none mt-0.5">U</span>
              </button>

              {/* Hazard Warning Flashers [H] (Distinct dedicated flasher button) */}
              <button
                id="hazard-warning-btn"
                onClick={() => onToggleIndicator('hazard')}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all border ${
                  vehicleState.hazardLights && vehicleState.indicatorsBlinkState
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/60 animate-pulse border-red-400'
                    : vehicleState.hazardLights
                    ? 'bg-red-950 text-red-400 border-red-700'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
                title="Hazard Warning Flashers [Press H]"
              >
                <TriangleAlert className="w-4 h-4 text-red-400" />
                <span className="text-[7px] font-mono font-bold leading-none mt-0.5">H</span>
              </button>

              {/* Sign Right [O] */}
              <button
                id="sign-right-btn"
                onClick={() => onToggleIndicator('right')}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all ${
                  vehicleState.rightIndicator && vehicleState.indicatorsBlinkState
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50 scale-105'
                    : vehicleState.rightIndicator
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-600/50'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
                title="Sign Right / Right Indicator [Press O]"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[7px] font-mono font-bold leading-none mt-0.5">O</span>
              </button>
            </div>

            {/* POD 2: SPEEDOMETER & AUSTRALIAN SPEED LIMIT SIGN */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1 min-w-0">
              {/* Australian Regulatory Speed Limit Circle */}
              <div className="relative flex flex-col items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-red-600 shadow-sm shrink-0">
                <span className="text-[5px] font-black uppercase text-slate-900 leading-none">LIMIT</span>
                <span className={`font-mono text-xs font-black leading-none ${isSpeeding ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                  {currentSpeedLimit}
                </span>
              </div>

              {/* Digital Speed Value */}
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className={`font-mono text-xl sm:text-2xl font-black tracking-tight leading-none ${
                    isSpeeding ? 'text-red-500' : 'text-white'
                  }`}>
                    {speed}
                  </span>
                  <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">km/h</span>
                </div>

                {/* Micro speed LED line */}
                <div className="w-16 sm:w-20 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      isSpeeding ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                    }`}
                    style={{ width: `${Math.round(speedRatio * 100)}%` }}
                  />
                </div>
              </div>

              {/* Handbrake Badge / Toggle [P] */}
              <button
                id="handbrake-toggle-btn"
                onClick={onToggleHandbrake}
                className={`px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all shrink-0 border ${
                  vehicleState.handbrake
                    ? 'bg-red-600/90 text-white border-red-500 shadow-sm animate-pulse'
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300 border-slate-800'
                }`}
                title="Parking Brake [Press P or Space]"
              >
                <span>{vehicleState.handbrake ? 'P-BRAKE ON' : 'P-BRAKE OFF'}</span>
                <span className="block text-[6px] opacity-80">[P]</span>
              </button>
            </div>

            {/* POD 3: DEDICATED TRANSMISSION SHIFTER POD (P, R, N, D) - NEVER OVERLAPS */}
            <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner shrink-0">
              <div className="flex items-center gap-1">
                {(['P', 'R', 'N', 'D'] as Gear[]).map((g) => {
                  const isActive = vehicleState.gear === g;
                  const cfg = GEAR_CONFIG[g];
                  return (
                    <button
                      key={g}
                      id={`gear-btn-${g.toLowerCase()}`}
                      onClick={() => onSelectGear(g)}
                      className={`px-2 py-1 rounded-lg font-mono text-xs transition-all flex items-center gap-1 border ${
                        isActive
                          ? cfg.activeStyle
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 hover:border-slate-700'
                      }`}
                      title={cfg.hint}
                    >
                      <span className="font-black text-xs leading-none">{g}</span>
                      <span className="hidden sm:inline text-[8px] font-bold tracking-wider uppercase opacity-90">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Gear Status Line */}
              <div className="text-[8px] font-mono font-bold mt-0.5 tracking-wider uppercase">
                {vehicleState.gear === 'R' && (
                  <span className="text-amber-400 animate-pulse">◀ REVERSE • BACKING UP</span>
                )}
                {vehicleState.gear === 'P' && (
                  <span className="text-red-400">PARKED • SHIFT [D] TO DRIVE</span>
                )}
                {vehicleState.gear === 'N' && (
                  <span className="text-sky-400">NETRAL • ENGINE DISENGAGED</span>
                )}
                {vehicleState.gear === 'D' && (
                  <span className="text-emerald-400">DRIVE • READY</span>
                )}
              </div>
            </div>

            {/* POD 4: LIGHTING POD (Low [n], High [N], Dim [m]) */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1 shrink-0">
              {/* Low Light [n] */}
              <button
                id="light-low-btn"
                onClick={() => {
                  if (onSetHeadlightMode) {
                    onSetHeadlightMode(vehicleState.headlightMode === 'low' ? 'off' : 'low');
                  } else {
                    onToggleHeadlights();
                  }
                }}
                className={`px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors flex flex-col items-center ${
                  vehicleState.headlightMode === 'low' || (vehicleState.headlights && !vehicleState.highBeams && vehicleState.headlightMode !== 'dim')
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
                title="Low Light Beam [Press n]"
              >
                <Sun className="w-3 h-3" />
                <span className="text-[7px] mt-0.5">LOW [n]</span>
              </button>

              {/* High Light [N / Shift+N] */}
              <button
                id="light-high-btn"
                onClick={() => {
                  if (onSetHeadlightMode) {
                    onSetHeadlightMode(vehicleState.headlightMode === 'high' ? 'off' : 'high');
                  }
                }}
                className={`px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors flex flex-col items-center ${
                  vehicleState.headlightMode === 'high' || vehicleState.highBeams
                    ? 'bg-blue-500/30 border-blue-400 text-blue-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
                title="High Light Beam [Press N or Shift+N]"
              >
                <Sun className="w-3 h-3 text-blue-300" />
                <span className="text-[7px] mt-0.5">HIGH [N]</span>
              </button>

              {/* Dim Light [m] */}
              <button
                id="light-dim-btn"
                onClick={() => {
                  if (onSetHeadlightMode) {
                    onSetHeadlightMode(vehicleState.headlightMode === 'dim' ? 'off' : 'dim');
                  }
                }}
                className={`px-1.5 py-1 rounded-lg text-[9px] font-mono font-bold border transition-colors flex flex-col items-center ${
                  vehicleState.headlightMode === 'dim'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
                title="Dim Light [Press m]"
              >
                <Sun className="w-3 h-3 opacity-60" />
                <span className="text-[7px] mt-0.5">DIM [m]</span>
              </button>
            </div>

            {/* POD 5: AUXILIARY POD (Look Behind [B], Season Guide, Focus, Mute) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Look Behind (Rear View) [B] */}
              {onToggleLookBehind && (
                <button
                  id="look-behind-btn"
                  onClick={onToggleLookBehind}
                  className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center border transition-all ${
                    isLookingBehind
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold scale-105'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                  title="Look Behind / Rearview Mirror [Press B]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[6px] font-mono font-bold leading-none mt-0.5">B</span>
                </button>
              )}

              {/* Season Guide Trigger */}
              {onOpenSeasonGuide && (
                <button
                  id="dash-season-guide-btn"
                  onClick={onOpenSeasonGuide}
                  className="w-8 h-8 rounded-lg bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white flex items-center justify-center transition-all"
                  title="Open Season Curriculum & Step-by-Step Practice Guide"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              )}

              {/* D3 Telemetry Toggle Button */}
              <button
                id="toggle-telemetry-btn"
                onClick={() => setShowTelemetry(prev => !prev)}
                className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center border transition-all ${
                  showTelemetry
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
                title={showTelemetry ? 'Hide Realtime D3 Telemetry Chart' : 'Show Realtime D3 Telemetry Chart'}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[6px] font-mono font-bold leading-none mt-0.5">D3</span>
              </button>

              {/* Save Game Button */}
              {onOpenSaveModal && (
                <button
                  id="dash-save-game-btn"
                  onClick={onOpenSaveModal}
                  className="w-8 h-8 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-600/50 text-blue-300 hover:text-white flex flex-col items-center justify-center transition-all shadow-sm"
                  title="Save & Resume Test Session"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="text-[6px] font-mono font-bold leading-none mt-0.5">SAVE</span>
                </button>
              )}

              {/* Audio Mute */}
              <button
                id="dashboard-mute-btn"
                onClick={() => soundManager.toggleMute()}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title="Toggle Sound Effects"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              {/* Car Focus Mode Toggle */}
              <button
                id="toggle-car-focus-btn"
                onClick={() => setIsCarFocusMode(true)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                title="Minimize Dashboard (Car Focus Mode)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
