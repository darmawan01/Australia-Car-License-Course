import React, { useState, useEffect } from 'react';
import { SaveGameService, SavedGameState } from '../services/saveGameService';
import {
  Save,
  Play,
  Trash2,
  Download,
  Upload,
  Clock,
  MapPin,
  ShieldCheck,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCurrentSession: () => void;
  onResumeSession: (savedState: SavedGameState) => void;
  currentCheckpointTitle: string;
  currentScore: number;
}

export const SaveGameModal: React.FC<SaveGameModalProps> = ({
  isOpen,
  onClose,
  onSaveCurrentSession,
  onResumeSession,
  currentCheckpointTitle,
  currentScore
}) => {
  const [saves, setSaves] = useState<SavedGameState[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const refreshSaves = () => {
    setSaves(SaveGameService.getSavedGames());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSaves();
      setSaveNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveClick = () => {
    soundManager.playClick();
    onSaveCurrentSession();
    refreshSaves();
    setSaveNotice('Session saved successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleResumeClick = (save: SavedGameState) => {
    soundManager.playSuccessChime();
    onResumeSession(save);
    onClose();
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    SaveGameService.deleteSave(id);
    refreshSaves();
  };

  const handleExportClick = (save: SavedGameState, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    SaveGameService.exportToJSON(save);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = SaveGameService.importFromJSON(content);
        if (imported) {
          soundManager.playSuccessChime();
          refreshSaves();
          setSaveNotice(`Imported "${imported.saveName}" successfully!`);
        } else {
          soundManager.playWarningBuzzer();
          setSaveNotice('Invalid save file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Save & Resume Test
              </h3>
              <p className="text-xs text-slate-400">
                Serialize session state to continue driving test later
              </p>
            </div>
          </div>

          <button
            id="close-save-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row & Active Status */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current State</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {currentCheckpointTitle}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                Score: {currentScore}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              id="save-session-btn"
              onClick={handleSaveClick}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Session</span>
            </button>

            {/* Import JSON File */}
            <label className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Notice feedback */}
        {saveNotice && (
          <div className="mx-4 mt-3 p-2 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveNotice}</span>
          </div>
        )}

        {/* Save Slots List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>SAVED SESSIONS ({saves.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">Click to Resume</span>
          </div>

          {saves.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500">
              <FileText className="w-8 h-8 mb-2 opacity-50 text-slate-600" />
              <p className="text-xs font-semibold text-slate-400">No saved sessions yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "Save Session" above to bookmark your current test progress.
              </p>
            </div>
          ) : (
            saves.map((save) => (
              <div
                key={save.id}
                onClick={() => handleResumeClick(save)}
                className="group p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-850/80 border border-slate-800/90 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {save.saveName}
                    </span>
                    {save.id.includes('autosave') && (
                      <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                        Auto
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {save.formattedDate}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Score: {save.scoreSnapshot}%
                    </span>
                    <span className="text-slate-300">
                      {Math.floor(save.timeElapsed / 60)}m {save.timeElapsed % 60}s
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Export button */}
                  <button
                    onClick={(e) => handleExportClick(save, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Export as JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(save.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete Save Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Resume button */}
                  <button
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Resume</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-400">
          State captures: Car coordinates, gear, checkpoint progress, elapsed timer, and faults.
        </div>
      </div>
    </div>
  );
};
