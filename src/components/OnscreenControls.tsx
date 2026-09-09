import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface OnscreenControlsProps {
  steering: number;
  throttle: number;
  brake: number;
  onSteerChange: (val: number) => void;
  onThrottleChange: (val: number) => void;
  onBrakeChange: (val: number) => void;
}

export const OnscreenControls: React.FC<OnscreenControlsProps> = ({
  steering,
  throttle,
  brake,
  onSteerChange,
  onThrottleChange,
  onBrakeChange
}) => {
  return (
    <div className="pointer-events-none absolute bottom-3 inset-x-3 flex items-end justify-between z-25">
      {/* Left side: Ergonomic Steering Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/70 shadow-xl">
        <button
          id="steer-left-touch-btn"
          onMouseDown={() => onSteerChange(-1)}
          onMouseUp={() => onSteerChange(0)}
          onTouchStart={() => onSteerChange(-1)}
          onTouchEnd={() => onSteerChange(0)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white transition-all select-none ${
            steering < -0.2 ? 'bg-blue-600 scale-95 shadow-inner' : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60'
          }`}
          title="Steer Left [A]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col items-center px-1">
          <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 bg-blue-500 rounded-full transition-all"
              style={{
                left: `${50 + (steering * 50)}%`,
                width: '4px',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        </div>

        <button
          id="steer-right-touch-btn"
          onMouseDown={() => onSteerChange(1)}
          onMouseUp={() => onSteerChange(0)}
          onTouchStart={() => onSteerChange(1)}
          onTouchEnd={() => onSteerChange(0)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white transition-all select-none ${
            steering > 0.2 ? 'bg-blue-600 scale-95 shadow-inner' : 'bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60'
          }`}
          title="Steer Right [D]"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right side: Brake and Throttle Pedals */}
      <div className="pointer-events-auto flex items-end gap-2 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800/70 shadow-xl">
        {/* Foot Brake Pedal */}
        <button
          id="pedal-brake-btn"
          onMouseDown={() => onBrakeChange(1)}
          onMouseUp={() => onBrakeChange(0)}
          onTouchStart={() => onBrakeChange(1)}
          onTouchEnd={() => onBrakeChange(0)}
          className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center transition-all select-none border ${
            brake > 0.2
              ? 'bg-red-700 border-red-500 shadow-inner scale-95 text-white'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:border-slate-500'
          }`}
          title="Brake [S / Down]"
        >
          <span className="text-[10px] font-black uppercase tracking-wider">BRAKE</span>
          <span className="text-[8px] text-slate-400 font-mono">[S]</span>
        </button>

        {/* Throttle / Gas Accelerator Pedal */}
        <button
          id="pedal-throttle-btn"
          onMouseDown={() => onThrottleChange(1)}
          onMouseUp={() => onThrottleChange(0)}
          onTouchStart={() => onThrottleChange(1)}
          onTouchEnd={() => onThrottleChange(0)}
          className={`w-11 h-16 rounded-xl flex flex-col items-center justify-center transition-all select-none border ${
            throttle > 0.2
              ? 'bg-emerald-600 border-emerald-400 shadow-inner scale-95 text-white'
              : 'bg-slate-900/90 border-slate-700/70 text-slate-300 hover:border-slate-500'
          }`}
          title="Gas / Accelerate [W / Up]"
        >
          <span className="text-[10px] font-black uppercase tracking-wider">GAS</span>
          <span className="text-[8px] text-slate-400 font-mono">[W]</span>
        </button>
      </div>
    </div>
  );
};
