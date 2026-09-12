import React, { useState } from 'react';
import { CourseEnvironment, DrivingSituation } from '../types';
import {
  Sun,
  Sunrise,
  Sunset,
  CloudRain,
  Moon,
  School,
  AlertCircle,
  Clock,
  Gauge,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Droplets,
  ShieldAlert,
  X
} from 'lucide-react';

interface CourseSituationCardProps {
  levelTitle: string;
  badge: string;
  situation?: DrivingSituation;
  activeEnvironment: CourseEnvironment;
  onSelectEnvironmentOverride: (env: CourseEnvironment) => void;
  overrideActive: boolean;
  onResetEnvironmentOverride: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const ENVIRONMENT_PRESETS: {
  id: CourseEnvironment;
  label: string;
  time: string;
  weather: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  desc: string;
}[] = [
  {
    id: 'morning_sunrise',
    label: 'Golden Sunrise',
    time: '07:15 AM',
    weather: 'Clear Dawn',
    icon: Sunrise,
    accentColor: 'from-amber-500 to-orange-500 text-amber-300 border-amber-500/40',
    desc: 'Low golden sun glare, peaceful suburban streets, dry bitumen.'
  },
  {
    id: 'midday_clear',
    label: 'Midday Daylight',
    time: '12:30 PM',
    weather: 'High Visibility',
    icon: Sun,
    accentColor: 'from-sky-500 to-blue-500 text-sky-300 border-sky-500/40',
    desc: 'Clear blue skies, optimal braking grip, active oncoming traffic.'
  },
  {
    id: 'school_rush',
    label: 'School Zone Peak',
    time: '03:15 PM',
    weather: 'Overcast Skies',
    icon: School,
    accentColor: 'from-yellow-500 to-amber-600 text-yellow-300 border-yellow-500/40',
    desc: 'Flashing twin 40 km/h amber beacons, children near crossings.'
  },
  {
    id: 'rainy_wet',
    label: 'Torrential Rainstorm',
    time: '04:45 PM',
    weather: 'Wet Reflective Bitumen',
    icon: CloudRain,
    accentColor: 'from-blue-600 to-indigo-600 text-cyan-300 border-cyan-500/40',
    desc: 'Rain precipitation, 2x braking distance, reflective asphalt.'
  },
  {
    id: 'dusk_sunset',
    label: 'Twilight Dusk',
    time: '06:10 PM',
    weather: 'Sunset Glow',
    icon: Sunset,
    accentColor: 'from-rose-500 to-amber-600 text-rose-300 border-rose-500/40',
    desc: 'Fiery sunset horizon, headlights & streetlamps turning on.'
  },
  {
    id: 'night_twilight',
    label: 'Night Driving',
    time: '09:15 PM',
    weather: 'Night Darkness',
    icon: Moon,
    accentColor: 'from-indigo-700 to-slate-800 text-indigo-300 border-indigo-500/40',
    desc: 'Low ambient light, headlights active, retroreflective RPM markers.'
  }
];

export const CourseSituationCard: React.FC<CourseSituationCardProps> = ({
  levelTitle,
  badge,
  situation,
  activeEnvironment,
  onSelectEnvironmentOverride,
  overrideActive,
  onResetEnvironmentOverride,
  isOpen = true,
  onClose,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  if (!isOpen) return null;

  // Determine current icon & preset info
  const activePreset = ENVIRONMENT_PRESETS.find(p => p.id === activeEnvironment) || ENVIRONMENT_PRESETS[0];
  const IconComponent = activePreset.icon;

  const isRain = activeEnvironment === 'rainy_wet';
  const isSchool = activeEnvironment === 'school_rush';

  const containerClass = className || 'absolute top-16 left-3 z-30 max-w-sm sm:max-w-md w-full pointer-events-auto select-none';

  return (
    <div className={containerClass}>
      {/* Main Situation Card Container */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden transition-all duration-300">
        {/* Top Header Strip */}
        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Situation Icon Badge */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md bg-gradient-to-tr ${activePreset.accentColor}`}>
              <IconComponent className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  {badge}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {situation?.timeLabel || activePreset.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate flex items-center gap-1">
                {isRain && <Droplets className="w-3 h-3 text-cyan-400 shrink-0" />}
                {isSchool && <School className="w-3 h-3 text-amber-400 shrink-0" />}
                <span>{situation?.weatherLabel || activePreset.weather}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Weather / Situation Switcher Trigger */}
            <button
              id="toggle-env-presets-btn"
              onClick={() => setShowPresetPicker(prev => !prev)}
              title="Change Course Environment & Weather"
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                overrideActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold hidden sm:inline">
                {overrideActive ? 'Custom Env' : 'Atmosphere'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showPresetPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Expand / Collapse Details Button */}
            <button
              id="expand-situation-details-btn"
              onClick={() => setIsExpanded(prev => !prev)}
              aria-label="Expand situation details"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Optional Close Button */}
            {onClose && (
              <button
                id="close-situation-card-btn"
                onClick={onClose}
                aria-label="Close situation card"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-900/60 hover:text-red-300 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Situation Badges row */}
        <div className="px-3 py-2 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-[11px] border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-200">{situation?.timeLabel.split('•')[0].trim() || activePreset.time}</span>
          </span>

          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

          <span className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400">Grip:</span>
            <span className={`font-semibold ${isRain ? 'text-cyan-300 font-bold' : 'text-emerald-400'}`}>
              {situation?.roadCondition || (isRain ? 'Wet Reflective' : 'Dry Bitumen')}
            </span>
          </span>

          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

          <span className="flex items-center gap-1 shrink-0">
            <span className="text-slate-400">Traffic:</span>
            <span className="text-slate-200 font-medium">
              {situation?.trafficDensity || 'Active Flow'}
            </span>
          </span>
        </div>

        {/* Expandable Situation Narrative & Australian Road Rule Warning */}
        {isExpanded && (
          <div className="p-3.5 space-y-2.5 bg-slate-900/95 text-xs animate-in fade-in duration-150">
            {/* Real World Situation Narrative */}
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-blue-400" />
                <span>Real-World Scenario Brief</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {situation?.specialCondition || activePreset.desc}
              </p>
            </div>

            {/* Australian Key Rule Alert */}
            {situation?.keyRuleAlert && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block text-[11px] mb-0.5">
                    Official Australian Driving Rule
                  </span>
                  <p className="text-[11px] leading-snug text-amber-100/90">
                    {situation.keyRuleAlert}
                  </p>
                </div>
              </div>
            )}

            {/* Special Rain Warning if Wet */}
            {isRain && (
              <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-[11px] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Adverse Wet Weather:</strong> Tyre friction coefficient reduced by 40%. Stopping distance is doubled!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Environment Preset Picker Dropdown */}
        {showPresetPicker && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                Select Course Situation & Weather
              </span>
              {overrideActive && (
                <button
                  id="reset-course-env-btn"
                  onClick={() => {
                    onResetEnvironmentOverride();
                    setShowPresetPicker(false);
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                >
                  Reset to Level Default
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ENVIRONMENT_PRESETS.map((preset) => {
                const PresetIcon = preset.icon;
                const isSelected = activeEnvironment === preset.id;
                return (
                  <button
                    key={preset.id}
                    id={`env-preset-${preset.id}`}
                    onClick={() => {
                      onSelectEnvironmentOverride(preset.id);
                      setShowPresetPicker(false);
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all relative ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <PresetIcon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{preset.time}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
