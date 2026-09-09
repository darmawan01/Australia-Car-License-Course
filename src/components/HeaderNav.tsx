import React from 'react';
import { CameraView, DrivingLevel, LevelCategory, LicenseStage, TestMode } from '../types';
import {
  Car,
  Compass,
  Moon,
  SunMedium,
  BookOpen,
  RotateCcw,
  Zap,
  Trophy,
  Award,
  ChevronDown,
  Video,
  Keyboard
} from 'lucide-react';

interface HeaderNavProps {
  currentMode: TestMode;
  onSelectMode: (mode: TestMode) => void;
  currentLevel: DrivingLevel;
  onOpenLevelModal: () => void;
  onSelectCategory: (cat: LevelCategory) => void;
  licenseStage: LicenseStage;
  onSelectLicenseStage: (stage: LicenseStage) => void;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  onOpenGuide: () => void;
  onOpenShortcuts: () => void;
  onResetCar: () => void;
  cameraView: CameraView;
  onSetCameraView: (view: CameraView) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentMode,
  onSelectMode,
  currentLevel,
  onOpenLevelModal,
  onSelectCategory,
  licenseStage,
  onSelectLicenseStage,
  isNightMode,
  onToggleNightMode,
  onOpenGuide,
  onOpenShortcuts,
  onResetCar,
  cameraView,
  onSetCameraView
}) => {
  // Cycle camera views quickly
  const cycleCameraView = () => {
    const views: CameraView[] = ['chase', 'cockpit', 'hood', 'topdown'];
    const nextIdx = (views.indexOf(cameraView) + 1) % views.length;
    onSetCameraView(views[nextIdx]);
  };

  const getCameraLabel = (view: CameraView) => {
    switch (view) {
      case 'chase': return 'Car View';
      case 'cockpit': return 'Cabin (RHD)';
      case 'hood': return 'Hood View';
      case 'topdown': return 'Drone';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
      {/* Left: Brand & Active Level Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center text-white shadow-md shrink-0">
          <Car className="w-4 h-4" />
        </div>

        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <h1 className="font-display font-black text-xs sm:text-sm text-white tracking-tight">
              AU DRIVE SIMULATOR
            </h1>
            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold text-[9px] tracking-wide">
              2026
            </span>
          </div>
        </div>

        {/* Level Menu Trigger */}
        <button
          id="open-levels-menu-btn"
          onClick={onOpenLevelModal}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-white font-bold flex items-center gap-1.5 shadow-md transition-all group"
          title="Open Levels & Curriculum Progress"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[8px] uppercase tracking-wider font-mono text-amber-400">
              {currentLevel.category === 'course' ? 'Stage 1: Course' : currentLevel.category === 'practice' ? 'Stage 2: Practice' : 'Stage 3: Exam'}
            </span>
            <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1">
              <span className="max-w-[140px] sm:max-w-[180px] truncate">Lvl {currentLevel.id}: {currentLevel.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </span>
          </div>
        </button>
      </div>

      {/* Middle: Curriculum Category Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shrink-0">
        <button
          id="mode-course-btn"
          onClick={() => onSelectCategory('course')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            currentLevel.category === 'course' && currentMode !== 'freedrive'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Foundational Maneuvers & Road Rules (Levels 1-5)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Course</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono hidden md:inline">1-5</span>
        </button>

        <button
          id="mode-practice-btn"
          onClick={() => onSelectCategory('practice')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            currentLevel.category === 'practice' && currentMode !== 'freedrive'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Hazard Perception & Priority Drills (Levels 6-9)"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Practice</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono hidden md:inline">6-9</span>
        </button>

        <button
          id="mode-exam-btn"
          onClick={() => onSelectCategory('exam')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            currentLevel.category === 'exam' && currentMode !== 'freedrive'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Official Practical Driving Assessment (Levels 10-11)"
        >
          <Award className="w-3.5 h-3.5 text-emerald-300" />
          <span>Exam</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 font-mono hidden md:inline">10-11</span>
        </button>

        <button
          id="mode-freedrive-btn"
          onClick={() => onSelectMode('freedrive')}
          className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
            currentMode === 'freedrive'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Free Open-World Cruise"
        >
          <span>Free Drive</span>
        </button>
      </div>

      {/* Right Tools: Shortcuts, Camera Cycle, Night, Reset, Guide */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Keyboard Shortcuts Button */}
        <button
          id="open-shortcuts-nav-btn"
          onClick={onOpenShortcuts}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 transition-all"
          title="View Keyboard Controls & Game Shortcuts [?]"
        >
          <Keyboard className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">Controls</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-amber-300">?</kbd>
        </button>

        {/* Compact Camera Cycle Button */}
        <button
          id="cycle-camera-btn"
          onClick={cycleCameraView}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 transition-all"
          title="Cycle Camera View [C]"
        >
          <Video className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">{getCameraLabel(cameraView)}</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400">C</kbd>
        </button>

        {/* Day / Night Vision Mode Toggle */}
        <button
          id="nightmode-toggle-btn"
          onClick={onToggleNightMode}
          className={`px-2.5 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
            isNightMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-800'
          }`}
          title={isNightMode ? 'Night Vision Active (Click for Daylight)' : 'Switch to Night Vision (Road Streetlights & Headlights)'}
        >
          {isNightMode ? <Moon className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" /> : <SunMedium className="w-3.5 h-3.5 text-amber-400" />}
          <span className="hidden sm:inline text-xs">{isNightMode ? 'Night Vision' : 'Daylight'}</span>
        </button>

        {/* Reset Car */}
        <button
          id="reset-car-btn"
          onClick={onResetCar}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset Car [Backspace]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Seasons Curriculum & Per-Section Guide Button */}
        <button
          id="open-guide-nav-btn"
          onClick={onOpenGuide}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          title="Open Australian Driving Curriculum & Per-Section Guide"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Seasons Guide</span>
        </button>
      </div>
    </header>
  );
};
