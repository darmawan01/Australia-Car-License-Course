import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CameraView,
  DrivingLevel,
  Gear,
  HazardEventState,
  HazardType,
  LevelCategory,
  LevelProgress,
  LicenseStage,
  TestFault,
  TestMode,
  TestResult,
  TestTask,
  VehicleState,
  CarScreenPos,
  CourseEnvironment
} from './types';
import { ROAD_CHECKPOINTS } from './data/checkpointsData';
import { CarTopGuideSlideshow } from './components/CarTopGuideSlideshow';
import { OFFICIAL_DRIVE_TEST_TASKS } from './data/australiaRoadData';
import { AUSTRALIAN_HAZARDS } from './data/hazardScenarios';
import { DRIVING_LEVELS, INITIAL_LEVEL_PROGRESS } from './data/levelProgression';
import { ThreeCanvas } from './components/ThreeCanvas';
import { Dashboard } from './components/Dashboard';
import { AssessmentHUD } from './components/AssessmentHUD';
import { CourseSituationCard } from './components/CourseSituationCard';
import { OnscreenControls } from './components/OnscreenControls';
import { HeaderNav } from './components/HeaderNav';
import { LicenseGuide2026 } from './components/LicenseGuide2026';
import { SeasonGuideModal } from './components/SeasonGuideModal';
import { SeasonPracticeHUD } from './components/SeasonPracticeHUD';
import { CURRICULUM_SEASONS, CurriculumSeason } from './data';
import { TestResultModal } from './components/TestResultModal';
import { HazardControlPanel } from './components/HazardControlPanel';
import { LevelSelectModal } from './components/LevelSelectModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { FloatingShortcutsBar } from './components/FloatingShortcutsBar';
import { SaveGameModal } from './components/SaveGameModal';
import { SaveGameService, SavedGameState } from './services/saveGameService';
import { soundManager } from './utils/audio';
import confetti from 'canvas-confetti';
import { AlertCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';

// Centralized Australian Driving Assessment Scoring Formula
export const calculateDrivingScore = (
  faults: TestFault[],
  hasCriticalFail: boolean = false
): { score: number; passed: boolean } => {
  const totalDeductions = faults.reduce((sum, f) => sum + (f.deduction || 4), 0);
  const criticalPenalty = hasCriticalFail ? 20 : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions - criticalPenalty)));
  const passed = !hasCriticalFail && score >= 85;
  return { score, passed };
};

const INITIAL_VEHICLE_STATE: VehicleState = {
  x: -2.25, // Australian Left Lane
  z: 10,
  rotation: 0,
  speed: 0,
  rpm: 0,
  gear: 'P',
  steering: 0,
  steeringWheelAngle: 0,
  throttle: 0,
  brake: 0,
  handbrake: true,
  leftIndicator: false,
  rightIndicator: false,
  hazardLights: false,
  headlights: false,
  highBeams: false,
  headlightMode: 'off',
  horn: false,
  engineRunning: true,
  indicatorsBlinkState: false,
  inReverse: false,
  currentLane: 'left',
  isColliding: false,
  collisionObject: null
};

export default function App() {
  const [vehicleState, setVehicleState] = useState<VehicleState>(INITIAL_VEHICLE_STATE);
  const [cameraView, setCameraView] = useState<CameraView>('chase');
  const [licenseStage, setLicenseStage] = useState<LicenseStage>('L');
  const [currentMode, setCurrentMode] = useState<TestMode>('test');
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSeasonGuideOpen, setIsSeasonGuideOpen] = useState<boolean>(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(1);
  const [isPracticingSeason, setIsPracticingSeason] = useState<boolean>(false);
  const [practiceSeasonId, setPracticeSeasonId] = useState<number>(1);
  const [practiceStepIndex, setPracticeStepIndex] = useState<number>(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [showFloatingShortcuts, setShowFloatingShortcuts] = useState<boolean>(false);
  const [isLookingBehind, setIsLookingBehind] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [environmentOverride, setEnvironmentOverride] = useState<CourseEnvironment | null>(null);
  const [isSituationCardOpen, setIsSituationCardOpen] = useState<boolean>(false);

  // Level Progression State
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState<boolean>(false);
  const [isLevelPassed, setIsLevelPassed] = useState<boolean>(false);
  const [levelProgress, setLevelProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem('au_sim_level_progress_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read level progress from storage', e);
    }
    return INITIAL_LEVEL_PROGRESS;
  });

  // Current active level object
  const currentLevel = DRIVING_LEVELS.find(l => l.id === currentLevelId) || DRIVING_LEVELS[0];

  // Active environment derived from night mode toggle, user override, or level situation default
  const activeEnvironment: CourseEnvironment = isNightMode
    ? 'night_twilight'
    : (environmentOverride || currentLevel.situation?.environment || 'morning_sunrise');

  // Sync level progress to local storage
  useEffect(() => {
    try {
      localStorage.setItem('au_sim_level_progress_v1', JSON.stringify(levelProgress));
    } catch (e) {
      console.warn('Could not write level progress to storage', e);
    }
  }, [levelProgress]);

  // Test Assessment States
  const [tasks, setTasks] = useState<TestTask[]>(OFFICIAL_DRIVE_TEST_TASKS);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);
  const [minorFaults, setMinorFaults] = useState<TestFault[]>([]);
  const [criticalFailItem, setCriticalFailItem] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(true);

  // Interactive AI Traffic & Hazard State (Collapsed by default to keep screen focused on the car)
  const [hazardState, setHazardState] = useState<HazardEventState>({
    activeHazard: 'none',
    status: 'idle',
    startTime: 0,
    reactionTimeMs: null,
    followingDistanceSecs: null,
    feedback: ''
  });
  const [randomHazardsEnabled, setRandomHazardsEnabled] = useState<boolean>(false);
  const [isHazardPanelExpanded, setIsHazardPanelExpanded] = useState<boolean>(false);

  // Keyboard active keys tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Checkpoints & In-Car Holographic Slideshow
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number>(0);
  const [completedCheckpointIds, setCompletedCheckpointIds] = useState<number[]>([]);
  const completedCheckpointIdsRef = useRef<number[]>(completedCheckpointIds);
  completedCheckpointIdsRef.current = completedCheckpointIds;

  const tasksRef = useRef<TestTask[]>(tasks);
  tasksRef.current = tasks;

  const currentLevelIdRef = useRef<number>(currentLevelId);
  currentLevelIdRef.current = currentLevelId;

  const overspeedTimerRef = useRef<number>(0);
  const lastSpeedCheckTimeRef = useRef<number>(Date.now());

  const [carScreenPos, setCarScreenPos] = useState<CarScreenPos>({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: 320, isVisible: true });
  const [checkpointNotice, setCheckpointNotice] = useState<{ show: boolean; text: string; sub: string } | null>(null);
  const [laneAlert, setLaneAlert] = useState<{ type: string; message: string; ruleRef: string } | null>(null);
  const [showCarGuide, setShowCarGuide] = useState<boolean>(true);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [autoAdvance, setAutoAdvance] = useState<{
    nextLevel: DrivingLevel;
    countdown: number;
    completedLevelTitle: string;
  } | null>(null);

  // Dynamic Speed limit based on location & level (School Zone is z from -45 to -165)
  const isSchoolZoneArea = vehicleState.z < -45 && vehicleState.z > -165;
  const currentSpeedLimit = isSchoolZoneArea ? 40 : currentLevel.speedLimit || 50;

  // Initialize engine sound on first user gesture
  useEffect(() => {
    const handleFirstClick = () => {
      soundManager.startEngine();
      window.removeEventListener('click', handleFirstClick);
      window.removeEventListener('keydown', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);
    window.addEventListener('keydown', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
      window.removeEventListener('keydown', handleFirstClick);
    };
  }, []);

  // Timer loop for active session
  useEffect(() => {
    if (!isTestRunning || testResult) return;
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTestRunning, testResult]);

  // Indicator toggle helper
  const handleToggleIndicator = useCallback((dir: 'left' | 'right' | 'hazard') => {
    setVehicleState(prev => {
      if (dir === 'hazard') {
        const next = !prev.hazardLights;
        return {
          ...prev,
          hazardLights: next,
          leftIndicator: false,
          rightIndicator: false
        };
      } else if (dir === 'left') {
        return {
          ...prev,
          leftIndicator: !prev.leftIndicator,
          rightIndicator: false,
          hazardLights: false
        };
      } else {
        return {
          ...prev,
          rightIndicator: !prev.rightIndicator,
          leftIndicator: false,
          hazardLights: false
        };
      }
    });
  }, []);

  // Gear selector helper
  const handleSelectGear = useCallback((gear: Gear) => {
    setVehicleState(prev => ({
      ...prev,
      gear,
      handbrake: gear === 'P' ? true : (gear === 'D' || gear === 'R' ? false : prev.handbrake)
    }));
  }, []);

  // Keyboard driving controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGuideOpen || isSeasonGuideOpen || isLevelModalOpen) return;
      keysPressed.current[e.key.toLowerCase()] = true;

      // Single trigger actions
      // u -> sign left
      if (e.key === 'u' || e.key === 'U') {
        handleToggleIndicator('left');
      }
      // o -> sign right
      else if (e.key === 'o' || e.key === 'O') {
        handleToggleIndicator('right');
      }
      // h -> hazard
      else if (e.key === 'h' || e.key === 'H') {
        handleToggleIndicator('hazard');
      }
      // p / P -> parking brake & Parking shifter
      else if (e.key === 'p' || e.key === 'P' || e.key === '1') {
        setVehicleState(prev => {
          if (prev.gear === 'P') {
            return { ...prev, handbrake: !prev.handbrake };
          }
          return { ...prev, gear: 'P', handbrake: true };
        });
      }
      // R -> Reverse
      else if (e.key === 'r' || e.key === 'R' || e.key === '2') {
        handleSelectGear('R');
      }
      // 3 -> Netral
      else if (e.key === '3') {
        handleSelectGear('N');
      }
      // D -> drive
      else if (e.key === 'd' || e.key === 'D' || e.key === '4') {
        handleSelectGear('D');
      }
      // n -> low light (lowercase)
      else if (e.key === 'n' && !e.shiftKey) {
        setVehicleState(prev => {
          const nextLow = prev.headlightMode !== 'low';
          return {
            ...prev,
            headlights: nextLow,
            highBeams: false,
            headlightMode: nextLow ? 'low' : 'off'
          };
        });
      }
      // N -> high light (uppercase / Shift+n)
      else if (e.key === 'N' || (e.shiftKey && (e.key === 'n' || e.key === 'N'))) {
        setVehicleState(prev => {
          const nextHigh = prev.headlightMode !== 'high';
          return {
            ...prev,
            headlights: nextHigh,
            highBeams: nextHigh,
            headlightMode: nextHigh ? 'high' : 'off'
          };
        });
      }
      // m -> dim
      else if (e.key === 'm' || e.key === 'M') {
        setVehicleState(prev => {
          const nextDim = prev.headlightMode !== 'dim';
          return {
            ...prev,
            headlights: nextDim,
            highBeams: false,
            headlightMode: nextDim ? 'dim' : 'off'
          };
        });
      }
      // c -> camera cycle
      else if (e.key === 'c' || e.key === 'C') {
        const views: CameraView[] = ['chase', 'cockpit', 'hood', 'topdown'];
        setCameraView(prev => {
          const idx = views.indexOf(prev);
          return views[(idx + 1) % views.length];
        });
      }
      // b -> look behind (rear view)
      else if (e.key === 'b' || e.key === 'B') {
        setIsLookingBehind(true);
      }
      // g -> horn
      else if (e.key === 'g' || e.key === 'G') {
        soundManager.startHorn();
      }
      // ? or / -> shortcuts modal
      else if (e.key === '?' || e.key === '/') {
        setIsShortcutsOpen(prev => !prev);
      }
      // Tab -> Season Curriculum Guide
      else if (e.key === 'Tab') {
        e.preventDefault();
        setIsSeasonGuideOpen(prev => !prev);
      }
      // Backspace -> Reset vehicle
      else if (e.key === 'Backspace') {
        handleResetCar();
      }

      updateControlsFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (e.key === 'g' || e.key === 'G') {
        soundManager.stopHorn();
      } else if (e.key === 'b' || e.key === 'B') {
        setIsLookingBehind(false);
      }
      updateControlsFromKeys();
    };

    const updateControlsFromKeys = () => {
      const keys = keysPressed.current;
      // I -> gas
      const isGas = keys['i'] || keys['w'] || keys['arrowup'];
      // k / space -> brake
      const isBrake = keys['k'] || keys['s'] || keys['arrowdown'] || keys[' '];
      // j -> left
      const isLeft = keys['j'] || keys['a'] || keys['arrowleft'];
      // l -> right
      const isRight = keys['l'] || keys['d'] || keys['arrowright'];

      setVehicleState(prev => {
        let throttle = 0;
        let brake = 0;
        let steering = 0;
        let currentGear = prev.gear;
        let currentHandbrake = prev.handbrake;

        // I -> Gas pedal
        if (isGas) {
          throttle = 1;
          if (currentGear === 'P') {
            currentGear = 'D';
            currentHandbrake = false;
          }
        }

        // k / space -> Brake pedal
        if (isBrake) {
          brake = 1;
        }

        // j -> left, l -> right
        if (isLeft && !isRight) steering = -1;
        else if (isRight && !isLeft) steering = 1;

        return {
          ...prev,
          gear: currentGear,
          handbrake: currentHandbrake,
          throttle,
          brake,
          steering
        };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleSelectGear, handleToggleIndicator, isGuideOpen, isLevelModalOpen]);

  // Touch on-screen control handlers
  const handleSteerChange = (val: number) => {
    setVehicleState(prev => ({ ...prev, steering: val }));
  };

  const handleThrottleChange = (val: number) => {
    setVehicleState(prev => ({ ...prev, throttle: val }));
  };

  const handleBrakeChange = (val: number) => {
    setVehicleState(prev => ({ ...prev, brake: val }));
  };

  // Add a minor driving fault
  const addMinorFault = useCallback((title: string, description: string, deduction = 5) => {
    soundManager.playWarningBuzzer();
    setMinorFaults(prev => {
      if (prev.some(f => f.title === title && Date.now() - parseInt(f.timestamp) < 5000)) {
        return prev;
      }
      const newFault: TestFault = {
        id: Math.random().toString(),
        timestamp: Date.now().toString(),
        type: 'minor',
        title,
        description,
        deduction
      };
      const updated = [...prev, newFault];
      if (updated.length >= 15) {
        triggerFail('Accumulation of 15+ Minor Driving Errors');
      }
      return updated;
    });
  }, []);

  // Lane Discipline Infraction Handler
  const handleLaneDisciplineAlert = useCallback((alert: { type: string; message: string; ruleRef: string }) => {
    soundManager.playWarningBuzzer();
    setLaneAlert(alert);
    addMinorFault('Lane Discipline Violation', `${alert.message} (${alert.ruleRef})`);
    setTimeout(() => {
      setLaneAlert(prev => (prev?.message === alert.message ? null : prev));
    }, 5500);
  }, [addMinorFault]);

  // Helper to compute how many official tasks (out of 6) were completed based on checkpoints cleared
  const computeCompletedTasksCount = useCallback((completedIds: number[]): number => {
    let count = 0;
    // Task 1: Cockpit Pre-Drive Check (Departing kerb / Checkpoint 1)
    if (completedIds.includes(1) || completedIds.includes(2) || completedIds.some(id => id > 1)) count++;
    // Task 2: School Zone Compliance (Checkpoint 3/4)
    if (completedIds.includes(3) || completedIds.includes(4) || completedIds.some(id => id > 3)) count++;
    // Task 3: Pedestrian Zebra Crossing Halt (Checkpoint 4/5)
    if (completedIds.includes(5) || completedIds.some(id => id > 5)) count++;
    // Task 4: Compulsory Stop Sign & Solid Line Halt (Checkpoint 7)
    if (completedIds.includes(7) || completedIds.some(id => id > 7)) count++;
    // Task 5: Roundabout Left-Turn Navigation (Checkpoint 8)
    if (completedIds.includes(8) || completedIds.some(id => id > 8)) count++;
    // Task 6: Reverse Parallel Kerb Park / Finish Line (Checkpoint 9)
    if (completedIds.includes(9) || completedIds.some(id => id >= 9)) count++;
    return Math.min(6, Math.max(0, count));
  }, []);

  // Trigger an Immediate Critical Fail
  const triggerFail = useCallback((reason: string) => {
    if (criticalFailItem) return;
    setCriticalFailItem(reason);
    soundManager.playWarningBuzzer();
    setIsTestRunning(false);

    const { score } = calculateDrivingScore(minorFaults, true);
    const cpTasks = computeCompletedTasksCount(completedCheckpointIdsRef.current);
    const listTasks = tasksRef.current.filter(t => t.isCompleted).length;
    const levelTasks = Math.min(6, Math.max(0, currentLevelIdRef.current - 1));
    const tasksDone = Math.min(6, Math.max(cpTasks, listTasks, levelTasks));

    setTestResult({
      passed: false,
      score,
      totalScore: 100,
      minorFaults,
      criticalFailItem: reason,
      tasksCompleted: tasksDone,
      totalTasks: 6,
      timeElapsed,
      completedAt: new Date().toLocaleTimeString(),
      state: 'NSW'
    });
  }, [computeCompletedTasksCount, criticalFailItem, minorFaults, timeElapsed]);

  // Check speed limits during drive with Australian Driving Test tolerance (Roads & Maritime RMS standard)
  const handleSpeedCheck = useCallback((speed: number) => {
    if (currentMode === 'freedrive' || !isTestRunning) return;
    const now = Date.now();
    const dt = Math.min(0.2, (now - lastSpeedCheckTimeRef.current) / 1000);
    lastSpeedCheckTimeRef.current = now;

    // Australian Test Standard:
    // Minor margin: 1-4 km/h over the limit (e.g. 41-44 in a 40) is tolerated briefly on road crests/undulations.
    // Sustained overspeed (>2.5s) or excessive overspeed (>= 6 km/h over in 40, >= 8 km/h elsewhere) results in fault / fail.
    const excess = speed - currentSpeedLimit;

    if (excess > 2.0) {
      overspeedTimerRef.current += dt;
      if (currentSpeedLimit === 40) {
        if (excess >= 6.0 || overspeedTimerRef.current > 2.5) {
          triggerFail(`Exceeding 40 km/h School/Village Zone Speed Limit (${Math.round(speed)} km/h)`);
        }
      } else {
        if (excess >= 10.0 || overspeedTimerRef.current > 2.5) {
          addMinorFault('Speed Exceedance', `Travelling at ${Math.round(speed)} km/h in a ${currentSpeedLimit} km/h zone.`);
          overspeedTimerRef.current = 0; // reset to avoid rapid repeated faults
        }
      }
    } else {
      overspeedTimerRef.current = Math.max(0, overspeedTimerRef.current - dt * 2);
    }
  }, [addMinorFault, currentMode, currentSpeedLimit, isTestRunning, triggerFail]);

  // Kerb collision trigger
  const handleKerbCollision = useCallback(() => {
    if (currentMode !== 'freedrive') {
      triggerFail('Mounting the Kerb / Collision with Roadside');
    }
  }, [currentMode, triggerFail]);

  // Complete a level with stars calculation and auto-advance queue
  const completeLevel = useCallback((levelId: number, targetNextLevelId?: number, isContinuousDrive: boolean = false) => {
    setIsLevelPassed(true);

    // Calculate stars and official Australian driving score
    const stars = minorFaults.length === 0 ? 3 : minorFaults.length <= 2 ? 2 : 1;
    const { score, passed } = calculateDrivingScore(minorFaults, false);
    const nextId = targetNextLevelId ?? (levelId + 1);

    setLevelProgress(prev => {
      const nextProgress = { ...prev };
      nextProgress[levelId] = {
        unlocked: true,
        completed: true,
        stars: Math.max(nextProgress[levelId]?.stars || 0, stars),
        bestScore: Math.max(nextProgress[levelId]?.bestScore || 0, score),
        bestTime: timeElapsed
      };

      // Unlock next level
      if (nextId <= DRIVING_LEVELS.length && nextProgress[nextId]) {
        nextProgress[nextId] = {
          ...nextProgress[nextId],
          unlocked: true
        };
      }

      return nextProgress;
    });

    const nextLevelObj = DRIVING_LEVELS.find(l => l.id === nextId);

    // If final course level (Course 5) is completed OR all 9 checkpoints completed:
    if (levelId === 5 || levelId === 10) {
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 } });
      } catch (e) {
        console.warn('Confetti error', e);
      }
      soundManager.playCelebrationFanfare();
      soundManager.speakAnnouncement(
        `Driving course completed! Outstanding work. Your final test score is ${score} percent.`
      );
      setTestResult({
        passed,
        score,
        totalScore: 100,
        minorFaults,
        tasksCompleted: 6,
        totalTasks: 6,
        timeElapsed,
        completedAt: new Date().toLocaleTimeString(),
        state: 'NSW'
      });
      setAutoAdvance(null);
      return;
    }

    soundManager.playSuccessChime();

    // In continuous drive mode along the road course (Levels 1-5), seamlessly transition
    // current level without any teleportation or physics reset!
    if (isContinuousDrive && nextLevelObj && nextLevelObj.id <= 5) {
      setCurrentLevelId(nextLevelObj.id);
      setAutoAdvance(null);
      return;
    }

    if (nextLevelObj && !isContinuousDrive) {
      const currentLevelObj = DRIVING_LEVELS.find(l => l.id === levelId);
      setAutoAdvance({
        nextLevel: nextLevelObj,
        countdown: 5,
        completedLevelTitle: currentLevelObj?.title || `Course ${levelId}`
      });
    }
  }, [minorFaults, timeElapsed]);

  // Checkpoint Passed Handler - Synchronizes Road Checkpoints with Course Level Progression!
  const handleCheckpointPassed = useCallback((checkpointId: number, title: string) => {
    let updatedCompleted = completedCheckpointIds;
    if (!completedCheckpointIds.includes(checkpointId)) {
      updatedCompleted = [...completedCheckpointIds, checkpointId];
      setCompletedCheckpointIds(updatedCompleted);
    }

    // Advance active checkpoint index
    const nextCpIdx = Math.min(ROAD_CHECKPOINTS.length - 1, checkpointId);
    setActiveCheckpointIndex(nextCpIdx);

    // Synchronize Official Drive Test tasks state & active task index
    const tasksDoneCount = computeCompletedTasksCount(updatedCompleted);
    setCurrentTaskIndex(Math.min(5, tasksDoneCount));
    setTasks(prevTasks =>
      prevTasks.map((t, idx) => ({
        ...t,
        isCompleted: idx < tasksDoneCount
      }))
    );

    // Map road milestones to Course levels 1-5
    let completedCourseLevelId: number | null = null;
    let nextCourseLevelId: number | null = null;

    if (checkpointId === 1) {
      // Checkpoint 1 (Kerb Departure & Moving Off) completes Course 1!
      completedCourseLevelId = 1;
      nextCourseLevelId = 2;
    } else if (checkpointId === 2) {
      // Checkpoint 2 (Keep-Left Suburban Lane) completes Course 2!
      completedCourseLevelId = 2;
      nextCourseLevelId = 3;
    } else if (checkpointId === 4 || (checkpointId === 3 && currentLevelId === 3)) {
      // Checkpoint 3/4 (School Zone & Pedestrian Crossing) completes Course 3!
      completedCourseLevelId = 3;
      nextCourseLevelId = 4;
    } else if (checkpointId === 7) {
      // Checkpoint 7 (STOP Sign Transverse Line) completes Course 4!
      completedCourseLevelId = 4;
      nextCourseLevelId = 5;
    } else if (checkpointId === 9 || checkpointId === 10 || updatedCompleted.length >= ROAD_CHECKPOINTS.length) {
      // Checkpoint 9/10 (Finish Line) completes Course 5!
      completedCourseLevelId = 5;
      nextCourseLevelId = 6;
    }

    if (completedCourseLevelId) {
      completeLevel(completedCourseLevelId, nextCourseLevelId || undefined, true);
    }

    const isAllDone = checkpointId >= 9 || updatedCompleted.length >= ROAD_CHECKPOINTS.length;
    if (isAllDone) {
      soundManager.playCelebrationFanfare();
      soundManager.speakAnnouncement("Course complete! All 9 checkpoints cleared! Driving test completed.");
    }

    const nextLevelObj = nextCourseLevelId ? DRIVING_LEVELS.find(l => l.id === nextCourseLevelId) : null;
    const bannerTitle = isAllDone
      ? '🎉 COURSE COMPLETE: 9/9 CHECKPOINTS CLEARED!'
      : nextLevelObj
      ? `ADVANCED TO ${nextLevelObj.badge.toUpperCase()}!`
      : `CHECKPOINT ${checkpointId} CLEARED!`;

    const bannerSub = isAllDone
      ? 'All checkpoints cleared! Superb driving! Test scorecard ready.'
      : `${title} • ${nextLevelObj ? nextLevelObj.title : 'Waypoint cleared!'}`;

    setCheckpointNotice({
      show: true,
      text: bannerTitle,
      sub: bannerSub
    });

    setTimeout(() => {
      setCheckpointNotice(null);
    }, 4500);
  }, [completedCheckpointIds, completeLevel, currentLevelId]);

  // Interactive Hazard & Traffic Handlers
  const handleTriggerHazard = useCallback((type: HazardType) => {
    soundManager.playWarningBuzzer();
    const hazardDef = AUSTRALIAN_HAZARDS.find(h => h.id === type);
    setHazardState({
      activeHazard: type,
      status: 'active',
      startTime: Date.now(),
      reactionTimeMs: null,
      followingDistanceSecs: null,
      feedback: hazardDef ? hazardDef.description : 'React safely!'
    });
  }, []);

  const handleClearHazard = useCallback(() => {
    setHazardState({
      activeHazard: 'none',
      status: 'idle',
      startTime: 0,
      reactionTimeMs: null,
      followingDistanceSecs: null,
      feedback: ''
    });
  }, []);

  const handleHazardResolved = useCallback((success: boolean, reactionMs: number) => {
    if (success) {
      soundManager.playSuccessChime();
      setHazardState(prev => ({
        ...prev,
        status: 'resolved',
        reactionTimeMs: reactionMs,
        feedback: `Hazard safe! Reaction time: ${(reactionMs / 1000).toFixed(2)}s.`
      }));

      // If in practice or hazard level, award completion
      if (currentLevel.category === 'practice') {
        completeLevel(currentLevel.id);
      }
    } else {
      soundManager.playWarningBuzzer();
      setHazardState(prev => ({
        ...prev,
        status: 'failed',
        feedback: 'Too close or delayed braking! Maintain safe 3-second buffer.'
      }));
      addMinorFault('Inadequate Hazard Response', 'Failed to maintain safe Australian 3-second following distance.');
    }
  }, [addMinorFault, completeLevel, currentLevel.category, currentLevel.id]);

  const handleFollowingDistanceUpdate = useCallback((distanceSecs: number) => {
    setHazardState(prev => ({
      ...prev,
      followingDistanceSecs: distanceSecs
    }));
  }, []);

  const handleAICarCollision = useCallback((objectName: string) => {
    if (currentMode !== 'freedrive') {
      triggerFail(`Collision with ${objectName}! Failure to yield priority.`);
    }
  }, [currentMode, triggerFail]);

  // Road Event Handlers
  const handleZebraStop = useCallback((stoppedProperly: boolean) => {
    if (stoppedProperly) {
      soundManager.playSuccessChime();
      if (currentLevel.id === 3 || currentLevel.id === 8) {
        completeLevel(currentLevel.id, undefined, true);
      }
    } else {
      triggerFail('Failing to Give Way to Pedestrian at Marked Australian Zebra Crossing');
    }
  }, [completeLevel, currentLevel.id, triggerFail]);

  const handleStopSignHalt = useCallback((heldFullStop: boolean) => {
    if (heldFullStop) {
      soundManager.playSuccessChime();
      if (currentLevel.id === 4) {
        completeLevel(currentLevel.id, undefined, true);
      }
    } else {
      triggerFail('Rolling Stop at Australian Regulatory STOP Sign (R1-1)');
    }
  }, [completeLevel, currentLevel.id, triggerFail]);

  const handleRoundaboutEnter = useCallback((signaledProperly: boolean) => {
    if (signaledProperly) {
      soundManager.playSuccessChime();
      if (currentLevel.id === 5) {
        completeLevel(currentLevel.id, undefined, true);
      }
    } else {
      addMinorFault('Roundabout Indicator Violation', 'Failed to signal right on entry or left on exit of roundabout.');
    }
  }, [addMinorFault, completeLevel, currentLevel.id]);

  const handleParkAlignCheck = useCallback((isSuccess: boolean) => {
    if (isSuccess) {
      soundManager.playSuccessChime();
      if (currentLevel.id === 5 || currentLevel.id === 2) {
        completeLevel(currentLevel.id, undefined, true);
      }
    }
  }, [completeLevel, currentLevel.id]);

  // Level Selection Handler
  const handleSelectLevel = useCallback((level: DrivingLevel) => {
    setCurrentLevelId(level.id);
    setIsLevelPassed(false);
    setMinorFaults([]);
    setCriticalFailItem(null);
    setTestResult(null);
    setTimeElapsed(0);
    setIsTestRunning(true);
    overspeedTimerRef.current = 0;

    // Map selected course level to corresponding starting checkpoint
    let startingCheckpointIdx = 0;
    const completedIds: number[] = [];
    if (level.id === 1) {
      startingCheckpointIdx = 0; // Checkpoint 1 (Kerb Departure)
    } else if (level.id === 2) {
      startingCheckpointIdx = 1; // Checkpoint 2 (Keep-Left)
      completedIds.push(1);
    } else if (level.id === 3) {
      startingCheckpointIdx = 2; // Checkpoint 3 (School Zone)
      completedIds.push(1, 2);
    } else if (level.id === 4) {
      startingCheckpointIdx = 6; // Checkpoint 7 (Stop sign at z = -285)
      completedIds.push(1, 2, 3, 4, 5, 6);
    } else if (level.id === 5) {
      startingCheckpointIdx = 8; // Checkpoint 9 (Reverse parallel park at z = -360)
      completedIds.push(1, 2, 3, 4, 5, 6, 7, 8);
    } else {
      startingCheckpointIdx = 0;
    }

    setActiveCheckpointIndex(startingCheckpointIdx);
    setCompletedCheckpointIds(completedIds);

    // Sync tasks and currentTaskIndex with starting level
    const initialTasksDone = computeCompletedTasksCount(completedIds);
    setCurrentTaskIndex(Math.min(5, initialTasksDone));
    setTasks(prevTasks =>
      prevTasks.map((t, idx) => ({
        ...t,
        isCompleted: idx < initialTasksDone
      }))
    );

    // Reset manual environment override so the new level's atmosphere takes effect
    setEnvironmentOverride(null);
    const isNightLevel = level.situation?.environment === 'night_twilight';
    const isDuskLevel = level.situation?.environment === 'dusk_sunset';
    setIsNightMode(isNightLevel);

    // Position vehicle according to level spawn coordinates
    const hasInitialSpeed = Boolean(level.spawnSpeed && level.spawnSpeed > 0);
    const needHeadlights = isNightLevel || isDuskLevel;
    setVehicleState({
      ...INITIAL_VEHICLE_STATE,
      x: level.spawnX,
      z: level.spawnZ,
      rotation: level.spawnRotation || 0,
      gear: hasInitialSpeed ? 'D' : 'P',
      handbrake: !hasInitialSpeed,
      speed: level.spawnSpeed || 0,
      headlights: needHeadlights,
      headlightMode: needHeadlights ? 'low' : 'off'
    });
    setResetSignal(prev => prev + 1);

    // If level has an initial hazard, trigger it
    if (level.requiredHazardTrigger) {
      setTimeout(() => {
        handleTriggerHazard(level.requiredHazardTrigger!);
      }, 2500);
    } else {
      handleClearHazard();
    }
  }, [handleClearHazard, handleTriggerHazard]);

  // Next / Previous level helpers
  const handleSelectNextLevel = useCallback(() => {
    if (currentLevelId < DRIVING_LEVELS.length) {
      handleSelectLevel(DRIVING_LEVELS[currentLevelId]); // 0-indexed matches currentLevelId
    }
  }, [currentLevelId, handleSelectLevel]);

  // Auto-advance countdown interval
  useEffect(() => {
    if (!autoAdvance) return;
    if (autoAdvance.countdown <= 0) {
      const targetLvl = autoAdvance.nextLevel;
      setAutoAdvance(null);
      handleSelectLevel(targetLvl);
      return;
    }

    const timer = setTimeout(() => {
      setAutoAdvance(prev => (prev ? { ...prev, countdown: prev.countdown - 1 } : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvance, handleSelectLevel]);

  // Proceed immediately to next course
  const handleProceedToNextCourse = useCallback(() => {
    if (autoAdvance) {
      const target = autoAdvance.nextLevel;
      setAutoAdvance(null);
      handleSelectLevel(target);
    } else {
      handleSelectNextLevel();
    }
  }, [autoAdvance, handleSelectLevel, handleSelectNextLevel]);

  const handleSelectPrevLevel = useCallback(() => {
    if (currentLevelId > 1) {
      handleSelectLevel(DRIVING_LEVELS[currentLevelId - 2]);
    }
  }, [currentLevelId, handleSelectLevel]);

  // Reset Car & Current Level
  const handleResetCar = useCallback(() => {
    handleSelectLevel(currentLevel);
  }, [currentLevel, handleSelectLevel]);

  // Save current game session state
  const handleSaveCurrentSession = useCallback(() => {
    const currentCheckpoint = ROAD_CHECKPOINTS[activeCheckpointIndex] || ROAD_CHECKPOINTS[0];
    const { score } = calculateDrivingScore(minorFaults, !!criticalFailItem);
    SaveGameService.saveGame({
      saveName: `Course ${currentLevelId} • ${currentCheckpoint.title}`,
      currentLevelId,
      currentMode,
      activeCheckpointIndex,
      completedCheckpointIds,
      vehicleState,
      minorFaults,
      criticalFailItem,
      timeElapsed,
      licenseStage,
      levelProgress,
      scoreSnapshot: score
    });
  }, [
    activeCheckpointIndex,
    completedCheckpointIds,
    criticalFailItem,
    currentLevelId,
    currentMode,
    levelProgress,
    licenseStage,
    minorFaults,
    timeElapsed,
    vehicleState
  ]);

  // Resume saved game session state
  const handleResumeSession = useCallback((saved: SavedGameState) => {
    setCurrentLevelId(saved.currentLevelId);
    setCurrentMode(saved.currentMode);
    setActiveCheckpointIndex(saved.activeCheckpointIndex);
    setCompletedCheckpointIds(saved.completedCheckpointIds || []);
    setMinorFaults(saved.minorFaults || []);
    setCriticalFailItem(saved.criticalFailItem);
    setTimeElapsed(saved.timeElapsed || 0);
    setLicenseStage(saved.licenseStage || 'L');
    if (saved.levelProgress) {
      setLevelProgress(saved.levelProgress);
    }
    setVehicleState(saved.vehicleState);
    setResetSignal(prev => prev + 1);
    setIsTestRunning(true);
    setTestResult(null);
    setAutoAdvance(null);

    // Sync tasks and currentTaskIndex when resuming
    const resumedTaskCount = computeCompletedTasksCount(saved.completedCheckpointIds || []);
    setCurrentTaskIndex(Math.min(5, resumedTaskCount));
    setTasks(prevTasks =>
      prevTasks.map((t, idx) => ({
        ...t,
        isCompleted: idx < resumedTaskCount
      }))
    );

    const cpTitle = ROAD_CHECKPOINTS[saved.activeCheckpointIndex]?.title || 'Waypoint';
    soundManager.speakAnnouncement(`Resumed test at ${cpTitle}`);
  }, [computeCompletedTasksCount]);

  // Header category selection: Course, Practice, Exam
  const handleSelectCategory = (cat: LevelCategory) => {
    setCurrentMode('test');
    if (cat === 'course') {
      handleSelectLevel(DRIVING_LEVELS[0]); // Level 1
    } else if (cat === 'practice') {
      handleSelectLevel(DRIVING_LEVELS[5]); // Level 6
    } else if (cat === 'exam') {
      handleSelectLevel(DRIVING_LEVELS[9]); // Level 10
    }
  };

  const handleSelectMode = (mode: TestMode) => {
    setCurrentMode(mode);
    if (mode === 'freedrive') {
      setVehicleState({
        ...INITIAL_VEHICLE_STATE,
        x: -2.25,
        z: 10,
        gear: 'D',
        handbrake: false
      });
      setResetSignal(prev => prev + 1);
      handleClearHazard();
    } else if (mode === 'test') {
      handleSelectCategory('exam');
    } else {
      handleResetCar();
    }
  };

  const handleUpgradeLicense = () => {
    setLicenseStage('P1');
    setTestResult(null);
    handleResetCar();
  };

  const currentPracticeSeason = CURRICULUM_SEASONS.find(s => s.id === practiceSeasonId) || CURRICULUM_SEASONS[0];

  const handleStartPracticeSeason = (season: CurriculumSeason) => {
    setPracticeSeasonId(season.id);
    setPracticeStepIndex(0);
    setIsPracticingSeason(true);
    setIsSeasonGuideOpen(false);
    const targetLevel = DRIVING_LEVELS.find(l => l.id === season.id) || DRIVING_LEVELS[0];
    handleSelectLevel(targetLevel);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Header Navigation: Course, Practice, Exam, and Level Button */}
      <HeaderNav
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        currentLevel={currentLevel}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
        onSelectCategory={handleSelectCategory}
        licenseStage={licenseStage}
        onSelectLicenseStage={setLicenseStage}
        isNightMode={isNightMode}
        onToggleNightMode={() => {
          setIsNightMode(prev => {
            const next = !prev;
            if (next) {
              setVehicleState(v => ({
                ...v,
                headlights: true,
                headlightMode: v.headlightMode === 'off' ? 'low' : v.headlightMode
              }));
            }
            return next;
          });
        }}
        onOpenGuide={() => setIsSeasonGuideOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onResetCar={handleResetCar}
        cameraView={cameraView}
        onSetCameraView={setCameraView}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onOpenSituationCard={() => setIsSituationCardOpen(prev => !prev)}
        activeEnvironment={activeEnvironment}
      />

      {/* 3D Simulation Canvas - Full Viewport Focused on the Car */}
      <ThreeCanvas
        vehicleState={vehicleState}
        setVehicleState={setVehicleState}
        resetSignal={resetSignal}
        cameraView={cameraView}
        isLookingBehind={isLookingBehind}
        activeHazard={hazardState.activeHazard}
        onHazardResolved={handleHazardResolved}
        onFollowingDistanceUpdate={handleFollowingDistanceUpdate}
        onAICarCollision={handleAICarCollision}
        onSpeedCheck={handleSpeedCheck}
        onKerbCollision={handleKerbCollision}
        onZebraStop={handleZebraStop}
        onStopSignHalt={handleStopSignHalt}
        onRoundaboutEnter={handleRoundaboutEnter}
        onParkAlignCheck={handleParkAlignCheck}
        onLaneDisciplineAlert={handleLaneDisciplineAlert}
        isNightMode={isNightMode}
        environment={activeEnvironment}
        activeCheckpointIndex={activeCheckpointIndex}
        completedCheckpointIds={completedCheckpointIds}
        onCheckpointPassed={handleCheckpointPassed}
        onCarScreenPosUpdate={setCarScreenPos}
      />

      {/* Floating Interactive Guide Slideshow Hovering on Top of the Car */}
      <CarTopGuideSlideshow
        checkpoints={ROAD_CHECKPOINTS}
        activeCheckpointIndex={activeCheckpointIndex}
        completedCheckpointIds={completedCheckpointIds}
        vehicleState={vehicleState}
        carScreenPos={carScreenPos}
        onSelectCheckpointSlide={(idx) => {}}
        onResetToActive={() => {}}
        isVisible={showCarGuide}
        onClose={() => setShowCarGuide(false)}
        onMoveToNextCourse={handleProceedToNextCourse}
        onOpenTestResult={() => {
          const { score, passed } = calculateDrivingScore(minorFaults, !!criticalFailItem);
          const tasksDone = computeCompletedTasksCount(completedCheckpointIds);
          setTestResult({
            passed,
            score,
            totalScore: 100,
            minorFaults,
            criticalFailItem: criticalFailItem ?? undefined,
            tasksCompleted: Math.max(1, tasksDone),
            totalTasks: 6,
            timeElapsed,
            completedAt: new Date().toLocaleTimeString(),
            state: 'NSW'
          });
        }}
        autoAdvanceCountdown={autoAdvance?.countdown ?? null}
        nextCourseTitle={autoAdvance ? `${autoAdvance.nextLevel.badge}: ${autoAdvance.nextLevel.title}` : undefined}
      />

      {/* High-Visibility Australian Lane Discipline Infraction Alert Banner */}
      {laneAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] bg-red-950/95 border-2 border-red-500 rounded-2xl p-3.5 shadow-2xl shadow-red-950/80 backdrop-blur-md animate-in slide-in-from-top-4 duration-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 font-black text-lg shadow-md shadow-red-600/30">
            !
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-black text-amber-300 tracking-wide uppercase">
                {laneAlert.ruleRef}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-800/80 border border-red-400/40 text-red-100 font-bold uppercase">
                Australian Road Rule Infraction
              </span>
            </div>
            <p className="text-xs text-white font-medium mt-1 leading-snug">
              {laneAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* Celebratory Checkpoint Cleared Banner */}
      {checkpointNotice && checkpointNotice.show && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in zoom-in-90 fade-in duration-300">
          <div className="bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 text-white px-5 py-2 rounded-2xl shadow-2xl border border-white/40 flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black text-sm shadow">
              ✓
            </div>
            <div>
              <div className="text-xs font-mono font-black tracking-wider text-cyan-100 uppercase">
                {checkpointNotice.text}
              </div>
              <div className="text-xs text-white/95 font-medium">
                {checkpointNotice.sub}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Practice HUD (Per-Section Step Training) */}
      {isPracticingSeason && (
        <SeasonPracticeHUD
          season={currentPracticeSeason}
          currentStepIndex={practiceStepIndex}
          vehicleState={vehicleState}
          onNextStep={() => setPracticeStepIndex(prev => Math.min(currentPracticeSeason.steps.length - 1, prev + 1))}
          onPrevStep={() => setPracticeStepIndex(prev => Math.max(0, prev - 1))}
          onSelectStep={(idx) => setPracticeStepIndex(idx)}
          onOpenSeasonTheory={() => {
            setSelectedSeasonId(practiceSeasonId);
            setIsSeasonGuideOpen(true);
          }}
          onClosePractice={() => setIsPracticingSeason(false)}
        />
      )}

      {/* Test Assessment HUD (Top overlay, sleek card showing Level objectives & directives) */}
      {!isPracticingSeason && currentMode !== 'freedrive' && (
        <AssessmentHUD
          mode={currentMode}
          currentLevel={currentLevel}
          currentTask={tasks[currentTaskIndex] || null}
          currentTaskIndex={currentTaskIndex}
          totalTasks={tasks.length}
          minorFaults={minorFaults}
          criticalFailItem={criticalFailItem}
          onRestartTest={handleResetCar}
          onOpenGuide={() => setIsGuideOpen(true)}
          onSelectNextLevel={handleSelectNextLevel}
          onSelectPrevLevel={handleSelectPrevLevel}
          timeElapsed={timeElapsed}
          isLevelPassed={isLevelPassed}
          activeCheckpoint={ROAD_CHECKPOINTS[activeCheckpointIndex]}
          activeCheckpointIndex={activeCheckpointIndex}
          totalCheckpoints={ROAD_CHECKPOINTS.length}
          distanceToTarget={Math.max(
            0,
            Math.round(
              Math.hypot(
                vehicleState.x - (ROAD_CHECKPOINTS[activeCheckpointIndex]?.targetX || 0),
                vehicleState.z - (ROAD_CHECKPOINTS[activeCheckpointIndex]?.targetZ || 0)
              )
            )
          )}
          showCarBeacon={showCarGuide}
          onToggleCarBeacon={() => setShowCarGuide(prev => !prev)}
          autoAdvance={autoAdvance}
          onCancelAutoAdvance={() => setAutoAdvance(null)}
          onOpenSituationCard={() => setIsSituationCardOpen(prev => !prev)}
        />
      )}

      {/* Course Atmosphere & Situation Details Card Modal */}
      {isSituationCardOpen && (
        <CourseSituationCard
          levelTitle={currentLevel.title}
          badge={currentLevel.badge}
          situation={currentLevel.situation}
          activeEnvironment={activeEnvironment}
          onSelectEnvironmentOverride={(env) => {
            setEnvironmentOverride(env);
            if (env === 'night_twilight') {
              setIsNightMode(true);
              setVehicleState(v => ({ ...v, headlights: true, headlightMode: 'low' }));
            } else if (isNightMode) {
              setIsNightMode(false);
            }
          }}
          overrideActive={environmentOverride !== null}
          onResetEnvironmentOverride={() => {
            setEnvironmentOverride(null);
            if (currentLevel.situation?.environment === 'night_twilight') {
              setIsNightMode(true);
              setVehicleState(v => ({ ...v, headlights: true, headlightMode: 'low' }));
            } else {
              setIsNightMode(false);
            }
          }}
          isOpen={isSituationCardOpen}
          onClose={() => setIsSituationCardOpen(false)}
          className="fixed top-20 left-3 sm:left-4 z-40 max-w-sm sm:max-w-md w-[92%] sm:w-full pointer-events-auto select-none"
        />
      )}

      {/* Interactive Australian Hazards & AI Traffic Panel (Collapsible Top-Right, cleanly tucked away) */}
      <div className="absolute top-16 right-3 z-30 flex flex-col items-end max-w-sm">
        <button
          id="toggle-hazard-panel-btn"
          onClick={() => setIsHazardPanelExpanded(prev => !prev)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800 shadow-lg text-xs font-bold flex items-center gap-2 mb-1.5 backdrop-blur-md transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Traffic Hazards</span>
          {hazardState.activeHazard !== 'none' && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
          {isHazardPanelExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {isHazardPanelExpanded && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <HazardControlPanel
              hazardState={hazardState}
              onTriggerHazard={handleTriggerHazard}
              onClearHazard={handleClearHazard}
              randomHazardsEnabled={randomHazardsEnabled}
              onToggleRandomHazards={() => setRandomHazardsEnabled(prev => !prev)}
            />
          </div>
        )}
      </div>

      {/* Floating Quick Shortcuts Bar (Show/Hide anytime) */}
      <FloatingShortcutsBar
        isVisible={showFloatingShortcuts}
        onClose={() => setShowFloatingShortcuts(false)}
        onOpenFullModal={() => setIsShortcutsOpen(true)}
        isLookingBehind={isLookingBehind}
        onToggleLookBehind={() => setIsLookingBehind(prev => !prev)}
      />

      {/* On-Screen Touch / Mouse Steering & Pedals (Ergonomically tucked in bottom-left and bottom-right corners) */}
      <OnscreenControls
        steering={vehicleState.steering}
        throttle={vehicleState.throttle}
        brake={vehicleState.brake}
        onSteerChange={handleSteerChange}
        onThrottleChange={handleThrottleChange}
        onBrakeChange={handleBrakeChange}
      />

      {/* Bottom Main Cockpit Dashboard: Redesigned Clean, Low-Profile, Informative, Zero Overlap */}
      <Dashboard
        vehicleState={vehicleState}
        onToggleIndicator={handleToggleIndicator}
        onSelectGear={handleSelectGear}
        onToggleHeadlights={() => setVehicleState(prev => ({ ...prev, headlights: !prev.headlights }))}
        onSetHeadlightMode={(mode) => setVehicleState(prev => ({
          ...prev,
          headlights: mode !== 'off',
          highBeams: mode === 'high',
          headlightMode: mode
        }))}
        onToggleHandbrake={() => setVehicleState(prev => ({ ...prev, handbrake: !prev.handbrake }))}
        onHornStart={() => soundManager.startHorn()}
        onHornEnd={() => soundManager.stopHorn()}
        currentSpeedLimit={currentSpeedLimit}
        licenseStage={licenseStage}
        isLookingBehind={isLookingBehind}
        onToggleLookBehind={() => setIsLookingBehind(prev => !prev)}
        onOpenSeasonGuide={() => setIsSeasonGuideOpen(true)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* Save Game & Session Resume Modal */}
      <SaveGameModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveCurrentSession={handleSaveCurrentSession}
        onResumeSession={handleResumeSession}
        currentLevelTitle={currentLevel.title}
        currentCheckpointTitle={ROAD_CHECKPOINTS[activeCheckpointIndex]?.title || 'Starting Point'}
        currentScore={calculateDrivingScore(minorFaults, !!criticalFailItem).score}
      />

      {/* Keyboard Shortcuts & Controls Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        showFloatingBar={showFloatingShortcuts}
        onToggleFloatingBar={() => setShowFloatingShortcuts(prev => !prev)}
      />

      {/* Level Selection & Curriculum Progression Modal */}
      <LevelSelectModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        currentLevelId={currentLevelId}
        onSelectLevel={handleSelectLevel}
        levelProgress={levelProgress}
      />

      {/* Season Curriculum & Per-Section Step Guide Modal */}
      <SeasonGuideModal
        isOpen={isSeasonGuideOpen}
        onClose={() => setIsSeasonGuideOpen(false)}
        selectedSeasonId={selectedSeasonId}
        onSelectSeasonId={setSelectedSeasonId}
        onStartPracticeSeason={handleStartPracticeSeason}
      />

      {/* 2026 Australian License Guide Modal (Road Rules & Official DKT Quiz) */}
      <LicenseGuide2026
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Test Result Certificate Modal */}
      <TestResultModal
        result={testResult}
        onRetake={handleResetCar}
        onUpgradeLicense={handleUpgradeLicense}
        onClose={() => setTestResult(null)}
        onNextCourse={handleSelectNextLevel}
      />
    </div>
  );
}
