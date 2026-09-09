import React, { useState } from 'react';
import { Keyboard, X, ChevronUp, ChevronDown, Eye } from 'lucide-react';

interface FloatingShortcutsBarProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenFullModal: () => void;
  isLookingBehind: boolean;
  onToggleLookBehind: () => void;
}

export const FloatingShortcutsBar: React.FC<FloatingShortcutsBarProps> = ({
  isVisible,
  onClose,
  onOpenFullModal,
  isLookingBehind,
  onToggleLookBehind
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed top-16 right-3 z-30 flex justify-end">
      <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-xl flex items-center gap-2 text-[11px] text-slate-300">
        <button
          id="open-full-shortcuts-modal-btn"
          onClick={onOpenFullModal}
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold border-r border-slate-800 pr-2"
          title="Open Full Shortcuts Menu [?]"
        >
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Controls</span>
        </button>

        {isMinimized ? (
          <span className="text-[10px] text-slate-400 font-mono">
            [I / W] Gas • [K / S] Brake • [J/L or A/D] Steer • [U / O] Sign
          </span>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 text-[10px]">
            {/* Drive Keys */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Gas:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold" title="I or W or Up Arrow">I / W</kbd>
              <span className="text-slate-400 ml-1">Brake:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold" title="K or S or Space or Down Arrow">K / S / Space</kbd>
              <span className="text-slate-400 ml-1">Steer:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold" title="J or A (Left)">J / A</kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold" title="L or D (Right)">L / D</kbd>
            </div>

            <span className="text-slate-700">|</span>

            {/* Signals & Hazard */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Sign:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold" title="u -> Sign Left">U</kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold" title="o -> Sign Right">O</kbd>
              <span className="text-slate-400 ml-1">Hazard:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-red-400 font-mono font-bold" title="h -> Hazard">H</kbd>
            </div>

            <span className="text-slate-700">|</span>

            {/* Shifter PRND */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Shifter:</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-red-400 font-mono font-bold" title="P -> Parking Shifter (or key 1)">P</kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold" title="R -> Reverse (or key 2)">R</kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-sky-400 font-mono font-bold" title="N -> Netral (or key 3)">N</kbd>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold" title="D -> Drive (or key 4)">D</kbd>
            </div>

            <span className="text-slate-700">|</span>

            {/* Lights */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Lights:</span>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold" title="n -> Low Light">n</kbd>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-blue-300 font-mono font-bold" title="N -> High Light">N</kbd>
              <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold" title="m -> Dim">m</kbd>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-slate-200"
            title={isMinimized ? 'Expand controls list' : 'Minimize controls'}
          >
            {isMinimized ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button
            id="close-floating-shortcuts-btn"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-red-400"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
