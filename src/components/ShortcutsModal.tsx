import React from 'react';
import {
  X,
  Keyboard,
  Compass,
  Eye,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showFloatingBar: boolean;
  onToggleFloatingBar: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  showFloatingBar,
  onToggleFloatingBar
}) => {
  if (!isOpen) return null;

  const controlSections = [
    {
      category: 'Vehicle Movement & Pedals (Dual Keybindings)',
      items: [
        { keys: ['I', 'W', '↑'], action: 'Gas / Accelerate forward (I or W or Up Arrow)' },
        { keys: ['K', 'S', 'Space', '↓'], action: 'Brake / Stop (K or S or Space or Down Arrow)' },
        { keys: ['J', 'A', '←'], action: 'Steer Left (J or A or Left Arrow)' },
        { keys: ['L', 'D', '→'], action: 'Steer Right (L or D or Right Arrow)' },
        { keys: ['P'], action: 'Parking Brake toggle' }
      ]
    },
    {
      category: 'Gear Shifter (Automatic Transmission: P - R - N - D)',
      items: [
        { keys: ['P', '1'], action: 'P -> Parking shifter (Locks wheels & engages handbrake)' },
        { keys: ['R', '2'], action: 'R -> Reverse (Back up with rear reverse lights)' },
        { keys: ['N', '3'], action: 'N -> Netral (Neutral - engine uncoupled coasting)' },
        { keys: ['D', '4'], action: 'D -> Drive (Standard forward acceleration)' }
      ]
    },
    {
      category: 'Signalling & Hazard Warnings',
      items: [
        { keys: ['U'], action: 'Sign Left (Left Turn Indicator / ARR 46)' },
        { keys: ['O'], action: 'Sign Right (Right Turn Indicator / 5s before departure)' },
        { keys: ['H'], action: 'Hazard Warning Flashers (All 4 blinkers)' }
      ]
    },
    {
      category: 'Lighting Pod',
      items: [
        { keys: ['n'], action: 'Low Light (Standard driving headlights)' },
        { keys: ['N', 'Shift+n'], action: 'High Light (High-beam long-range spotlights)' },
        { keys: ['m'], action: 'Dim Light (Low-intensity parking lights)' }
      ]
    },
    {
      category: 'Vision, Horn & System',
      items: [
        { keys: ['B'], action: 'Look Behind (3D Rearview camera & mirror)' },
        { keys: ['C'], action: 'Cycle Camera (Chase, Cabin RHD, Hood, Drone)' },
        { keys: ['G'], action: 'Car Horn' },
        { keys: ['Backspace'], action: 'Reset Car to starting position' },
        { keys: ['?'], action: 'Toggle this Controls menu' }
      ]
    },
    {
      category: '3D Checkpoints & Car-Top Guide Slideshow',
      items: [
        { keys: ['Slide < / >'], action: 'Browse Step-by-Step Guide Slideshow hovering directly above your car' },
        { keys: ['Target Ring'], action: 'Drive through glowing 3D Checkpoint Gates with live distance meters' },
        { keys: ['Minimize [-]'], action: 'Collapse guide into compact hover pill or expand to see what to do' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Driver Controls & Key Map</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-500/40">
                  Updated Layout
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Full ergonomic key mapping: I/K/J/L drive, U/O/H signals, P/R/N/D shifter, n/N/m lights.
              </p>
            </div>
          </div>

          <button
            id="close-shortcuts-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Floating Bar Switch */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-semibold">
              Floating On-Screen Controls Pill
            </span>
            <span className="text-[10px] text-slate-400">
              (Quick reference at top right)
            </span>
          </div>

          <button
            id="toggle-floating-bar-switch"
            onClick={onToggleFloatingBar}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-bold text-white transition-all"
          >
            {showFloatingBar ? (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Visible</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">Hidden</span>
              </>
            )}
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {controlSections.map((section, idx) => (
            <div key={idx} className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0">
                    <span className="text-slate-300 font-medium">{item.action}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono font-bold text-[11px] shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
