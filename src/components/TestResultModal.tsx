import React, { useEffect } from 'react';
import { TestResult } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, ShieldAlert } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface TestResultModalProps {
  result: TestResult | null;
  onRetake: () => void;
  onUpgradeLicense: () => void;
  onClose: () => void;
  onNextCourse?: () => void;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  result,
  onRetake,
  onUpgradeLicense,
  onClose,
  onNextCourse
}) => {
  useEffect(() => {
    if (result) {
      if (result.passed) {
        soundManager.playSuccessChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        soundManager.playWarningBuzzer();
      }
    }
  }, [result]);

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Certificate Header Banner */}
        <div className={`p-6 text-center text-white flex flex-col items-center justify-center relative ${
          result.passed
            ? 'bg-gradient-to-b from-emerald-600 to-emerald-800'
            : 'bg-gradient-to-b from-red-600 to-red-800'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-xl">
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>

          <span className="text-xs uppercase tracking-widest font-extrabold text-white/80">
            Australian Transport Authority • 2026 Assessment
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">
            {result.passed ? 'TEST PASSED: PROVISIONAL P1' : 'PRACTICAL TEST UNSUCCESSFUL'}
          </h2>
          <p className="text-xs text-white/90 mt-1 max-w-sm">
            {result.passed
              ? 'Congratulations! You have demonstrated competent low-risk driving under the Australian Road Rules.'
              : result.criticalFailItem
              ? `Immediate Fail: ${result.criticalFailItem}`
              : 'You have accumulated excess minor driver errors.'}
          </p>
        </div>

        {/* Score and Metrics */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Final Score</span>
              <div className={`text-xl font-black mt-0.5 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.score}%
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Tasks Completed</span>
              <div className="text-xl font-black text-white mt-0.5">
                {result.tasksCompleted} / {result.totalTasks}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Minor Faults</span>
              <div className={`text-xl font-black mt-0.5 ${result.minorFaults.length > 5 ? 'text-amber-400' : 'text-slate-200'}`}>
                {result.minorFaults.length}
              </div>
            </div>
          </div>

          {/* Fault Feedback List */}
          {result.minorFaults.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Deduction Items & Feedback
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {result.minorFaults.map((fault) => (
                  <div key={fault.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-white">{fault.title}</strong>
                      <p className="text-[11px] text-slate-400">{fault.description}</p>
                    </div>
                    <span className="text-red-400 font-bold shrink-0 font-mono">-{fault.deduction} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              id="retake-test-btn"
              onClick={onRetake}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Course</span>
            </button>

            {result.passed ? (
              <>
                {onNextCourse && (
                  <button
                    id="next-course-modal-btn"
                    onClick={() => {
                      onClose();
                      onNextCourse();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 animate-pulse"
                  >
                    <span>Move to Next Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="upgrade-license-btn"
                  onClick={onUpgradeLicense}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Red P-Plate</span>
                </button>
              </>
            ) : (
              <button
                id="close-result-btn"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <span>Review Feedback</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
