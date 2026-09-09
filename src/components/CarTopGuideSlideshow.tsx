import React, { useState, useEffect } from 'react';
import { RoadCheckpoint, CarScreenPos, VehicleState } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  CheckCircle2,
  Navigation,
  Compass,
  Minimize2,
  Maximize2,
  Sparkles,
  Info,
  Layers,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  X
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CarTopGuideSlideshowProps {
  checkpoints: RoadCheckpoint[];
  activeCheckpointIndex: number;
  completedCheckpointIds: number[];
  vehicleState: VehicleState;
  carScreenPos?: CarScreenPos;
  onSelectCheckpointSlide?: (index: number) => void;
  onResetToActive?: () => void;
  isVisible?: boolean;
  onClose?: () => void;
  onMoveToNextCourse?: () => void;
  onOpenTestResult?: () => void;
  autoAdvanceCountdown?: number | null;
  nextCourseTitle?: string;
}

export const CarTopGuideSlideshow: React.FC<CarTopGuideSlideshowProps> = ({
  checkpoints,
  activeCheckpointIndex,
  completedCheckpointIds,
  vehicleState,
  carScreenPos,
  onSelectCheckpointSlide,
  onResetToActive,
  isVisible = true,
  onClose,
  onMoveToNextCourse,
  onOpenTestResult,
  autoAdvanceCountdown,
  nextCourseTitle
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(activeCheckpointIndex);
  // Default to minimal waypoint pill so it doesn't block car view or duplicate the top-left HUD
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [dockMode, setDockMode] = useState<'above_car' | 'top_center'>('above_car');

  // Sync slide with active checkpoint when active checkpoint advances
  useEffect(() => {
    setCurrentSlideIndex(activeCheckpointIndex);
  }, [activeCheckpointIndex]);

  if (!isVisible) return null;

  const slide = checkpoints[currentSlideIndex] || checkpoints[0];
  const activeCheckpoint = checkpoints[activeCheckpointIndex] || checkpoints[0];

  // Calculate live distance from car to current slide's target
  const dx = vehicleState.x - slide.targetX;
  const dz = vehicleState.z - slide.targetZ;
  const distanceMeters = Math.max(0, Math.round(Math.sqrt(dx * dx + dz * dz)));

  // Distance to active target
  const activeDx = vehicleState.x - activeCheckpoint.targetX;
  const activeDz = vehicleState.z - activeCheckpoint.targetZ;
  const activeDist = Math.max(0, Math.round(Math.sqrt(activeDx * activeDx + activeDz * activeDz)));

  const isCurrentSlideActive = currentSlideIndex === activeCheckpointIndex;
  const isSlideCompleted = completedCheckpointIds.includes(slide.id);

  const handlePrevSlide = () => {
    soundManager.playClick();
    const nextIdx = Math.max(0, currentSlideIndex - 1);
    setCurrentSlideIndex(nextIdx);
    if (onSelectCheckpointSlide) onSelectCheckpointSlide(nextIdx);
  };

  const handleNextSlide = () => {
    soundManager.playClick();
    const nextIdx = Math.min(checkpoints.length - 1, currentSlideIndex + 1);
    setCurrentSlideIndex(nextIdx);
    if (onSelectCheckpointSlide) onSelectCheckpointSlide(nextIdx);
  };

  const handleJumpToActive = () => {
    soundManager.playClick();
    setCurrentSlideIndex(activeCheckpointIndex);
    if (onResetToActive) onResetToActive();
  };

  // Determine direction arrow relative to car orientation
  const getDirectionHint = () => {
    const forwardZ = vehicleState.z - activeCheckpoint.targetZ;
    const lateralX = activeCheckpoint.targetX - vehicleState.x;

    if (activeDist < 4) return 'Arrived at zone';
    if (Math.abs(lateralX) > 1.2) {
      return lateralX > 0 ? 'Veer Right' : 'Veer Left';
    }
    return forwardZ > 0 ? 'Ahead' : 'Passed / Turn Around';
  };

  // Compute position styling: follow car if screen coords available and valid
  const getContainerStyle = (): React.CSSProperties => {
    if (dockMode === 'above_car' && carScreenPos && carScreenPos.isVisible) {
      const clampedX = Math.max(160, Math.min(window.innerWidth - 160, carScreenPos.x));
      const clampedY = Math.max(80, Math.min(window.innerHeight - 200, carScreenPos.y - 125));
      return {
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        transform: 'translate(-50%, -100%)',
        position: 'absolute'
      };
    }
    // Default top-center position
    return {
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      position: 'absolute'
    };
  };

  const isAllCheckpointsCleared = completedCheckpointIds.length >= checkpoints.length;

  return (
    <div
      id="car-top-guide-slideshow"
      style={getContainerStyle()}
      className="pointer-events-auto z-25 transition-all duration-150 flex flex-col items-center max-w-[92vw] sm:max-w-md"
    >
      {/* MINIMIZED FLOATING PILL */}
      {isMinimized ? (
        <div className={`border rounded-full pl-3 pr-1.5 py-1 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs text-white animate-in fade-in select-none group ${
          isAllCheckpointsCleared
            ? 'bg-emerald-950/95 border-emerald-400/80 shadow-emerald-900/50'
            : 'bg-slate-950/92 hover:bg-slate-900 border-cyan-500/50'
        }`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${isAllCheckpointsCleared ? 'bg-emerald-400' : 'bg-cyan-400 animate-ping'}`} />
          <span className={`font-mono font-bold whitespace-nowrap ${isAllCheckpointsCleared ? 'text-emerald-300' : 'text-cyan-300'}`}>
            {isAllCheckpointsCleared ? '🎉 COURSE FINISHED (9/9)' : `WP ${activeCheckpoint.id}: ${activeDist}m ahead`}
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline truncate max-w-[140px]">
            {isAllCheckpointsCleared ? '• Click to Move Next' : `• ${activeCheckpoint.hint}`}
          </span>
          {isAllCheckpointsCleared && onMoveToNextCourse && (
            <button
              onClick={onMoveToNextCourse}
              className="px-2 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md"
            >
              <span>Next Course</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-full text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/80 transition-colors"
              title="Expand Details"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-950/80 transition-colors"
                title="Hide Car Waypoint (Can reopen from Top-Left Course HUD)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EXPANDED INTERACTIVE CAR-TOP SLIDESHOW CARD */
        <div className={`w-full backdrop-blur-xl border rounded-2xl p-3 sm:p-3.5 shadow-2xl text-white flex flex-col gap-2 ${
          isAllCheckpointsCleared
            ? 'bg-slate-950/95 border-emerald-500/80 shadow-emerald-950/60'
            : 'bg-slate-950/92 border-cyan-500/40 shadow-cyan-950/50'
        }`}>
          {/* Top Slide Pagination Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            {/* Prev / Next Slide Nav */}
            <div className="flex items-center gap-1">
              <button
                id="car-guide-prev-slide-btn"
                onClick={handlePrevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-1 rounded-lg border transition-all ${
                  currentSlideIndex === 0
                    ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-300'
                }`}
                title="Previous Step Guide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded-lg">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-cyan-300">
                  Slide {currentSlideIndex + 1} of {checkpoints.length}
                </span>
              </div>

              <button
                id="car-guide-next-slide-btn"
                onClick={handleNextSlide}
                disabled={currentSlideIndex === checkpoints.length - 1}
                className={`p-1 rounded-lg border transition-all ${
                  currentSlideIndex === checkpoints.length - 1
                    ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-300'
                }`}
                title="Next Step Guide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Checkpoint Status Indicator */}
            <div className="flex items-center gap-1.5">
              {isSlideCompleted ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Completed
                </span>
              ) : isCurrentSlideActive ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono font-bold text-cyan-300 animate-pulse">
                  <Target className="w-3 h-3 text-cyan-400" />
                  Active Target
                </span>
              ) : (
                <button
                  onClick={handleJumpToActive}
                  className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-700 text-[10px] font-mono font-bold text-amber-300 transition-colors"
                  title="Jump to Current Active Target Checkpoint"
                >
                  Jump to Target →
                </button>
              )}

              {/* Minimize Card */}
              <button
                id="minimize-car-guide-btn"
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors ml-1"
                title="Minimize to Waypoint Pill"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              {onClose && (
                <button
                  id="close-car-guide-btn"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-850 transition-colors"
                  title="Hide Car-Top Guide"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ALL CHECKPOINTS CLEARED PROMINENT CALL TO ACTION */}
          {isAllCheckpointsCleared ? (
            <div className="p-3 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 rounded-xl flex flex-col gap-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                      All 9 Checkpoints Cleared — Course Complete!
                    </h4>
                    <p className="text-[11px] text-emerald-300 font-medium">
                      {autoAdvanceCountdown !== undefined && autoAdvanceCountdown !== null
                        ? `Auto-advancing to ${nextCourseTitle || 'Next Course'} in ${autoAdvanceCountdown}s...`
                        : 'Great driving! Ready to advance to the next curriculum course.'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/40 shrink-0">
                  9/9 Done
                </span>
              </div>

              {/* Direct Action Buttons to Move Next */}
              <div className="flex items-center gap-2 pt-1">
                {onMoveToNextCourse && (
                  <button
                    id="guide-move-next-course-btn"
                    onClick={onMoveToNextCourse}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/40 animate-pulse transition-all"
                  >
                    <span>Move to Next Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenTestResult && (
                  <button
                    id="guide-view-cert-btn"
                    onClick={onOpenTestResult}
                    className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md transition-all"
                  >
                    <span>Certificate</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Slide Directive Body: "What to do right now" */
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span className="text-cyan-400 font-mono font-black">#{slide.id}</span>
                  <span>{slide.title}</span>
                </h4>

                {/* Target Distance Badge */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 font-bold shrink-0">
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  <span>{distanceMeters}m</span>
                </div>
              </div>

              {/* Clear, Unambiguous Instruction */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                {slide.shortDesc}
              </p>

              {/* Recommended Action & Shortcut Keys */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Do This:</span>
                  {slide.keyInstructions.map((inst, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-[10px] shadow-sm"
                    >
                      {inst}
                    </kbd>
                  ))}
                </div>

                {/* Direction compass hint */}
                <div className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                  <span>Direct:</span>
                  <span className="text-white font-bold">{getDirectionHint()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Checkpoint Breadcrumbs Ribbon */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-400">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {checkpoints.map((cp, idx) => {
                const isDone = completedCheckpointIds.includes(cp.id);
                const isSelected = idx === currentSlideIndex;
                const isCurActive = idx === activeCheckpointIndex;
                return (
                  <button
                    key={cp.id}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      if (onSelectCheckpointSlide) onSelectCheckpointSlide(idx);
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                        : isDone
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                        : isCurActive
                        ? 'bg-blue-900/80 text-blue-300 border border-blue-500/50 animate-pulse'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                    title={`Go to Checkpoint ${cp.id}: ${cp.title}`}
                  >
                    CP{cp.id}
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] text-emerald-400 font-bold ml-1 shrink-0">
              {completedCheckpointIds.length}/{checkpoints.length} Cleared
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
