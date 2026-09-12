export type LicenseStage = 'L' | 'P1' | 'P2' | 'Full';

export type CameraView = 'cockpit' | 'chase' | 'topdown' | 'hood';

export type Gear = 'P' | 'R' | 'N' | 'D';

export interface VehicleState {
  x: number;
  z: number;
  rotation: number; // yaw in radians
  speed: number; // km/h
  rpm: number;
  gear: Gear;
  steering: number; // -1 (full left) to 1 (full right)
  steeringWheelAngle: number; // degrees for visual wheel
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  handbrake: boolean;
  leftIndicator: boolean;
  rightIndicator: boolean;
  hazardLights: boolean;
  headlights: boolean;
  highBeams: boolean;
  headlightMode: 'off' | 'dim' | 'low' | 'high';
  horn: boolean;
  engineRunning: boolean;
  indicatorsBlinkState: boolean;
  inReverse: boolean;
  currentLane: 'left' | 'right' | 'offroad';
  isColliding: boolean;
  collisionObject: string | null;
}

export type TestMode = 'course' | 'practice' | 'exam' | 'test' | 'hazard_challenge' | 'practice_parking' | 'practice_roundabout' | 'practice_schoolzone' | 'freedrive';

export type LevelCategory = 'course' | 'practice' | 'exam';

export type CourseEnvironment = 'morning_sunrise' | 'midday_clear' | 'school_rush' | 'rainy_wet' | 'dusk_sunset' | 'night_twilight';

export interface DrivingSituation {
  timeLabel: string;
  weatherLabel: string;
  environment: CourseEnvironment;
  trafficDensity: 'Quiet' | 'Moderate' | 'School Peak' | 'Heavy Commuter' | 'Circulating Flow';
  roadCondition: 'Dry' | 'Wet Reflective';
  specialCondition: string;
  keyRuleAlert: string;
}

export interface DrivingLevel {
  id: number;
  category: LevelCategory;
  categoryNumber: number;
  title: string;
  subtitle: string;
  badge: string;
  speedLimit: number;
  description: string;
  objectives: string[];
  examinerDirective: string;
  situation?: DrivingSituation;
  targetZone?: { x: number; z: number; radius: number };
  hazardType?: HazardType;
  requiresStop?: boolean;
  stopDurationSeconds?: number;
  requiresIndicator?: 'left' | 'right' | 'hazard';
  requiresParking?: boolean;
  spawnZ: number;
  spawnX: number;
  spawnRotation?: number;
  spawnSpeed?: number;
  requiredHazardTrigger?: HazardType;
  requiresStopDuration?: number;
  passConditionDescription: string;
  tips: string;
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  bestScore: number;
  bestTime: number;
}

export type AIVehicleType = 'lead_car' | 'oncoming_car' | 'kerb_car' | 'bus' | 'ambulance' | 'cyclist' | 'bot_ute' | 'bot_taxi' | 'bot_hatchback';

export interface LaneDisciplineAlert {
  type: 'wrong_turn_lane' | 'solid_line_cross' | 'wrong_way';
  message: string;
  ruleRef: string;
  timestamp: number;
}

export interface AIVehicle {
  id: string;
  type: AIVehicleType;
  x: number;
  y: number;
  z: number;
  rotation: number;
  speed: number; // km/h
  targetSpeed: number;
  isBraking: boolean;
  isIndicatingLeft: boolean;
  isIndicatingRight: boolean;
  isSirenActive: boolean;
  color: number;
  length: number;
  width: number;
}

export type HazardType =
  | 'none'
  | 'sudden_braking'
  | 'kerb_pullout'
  | 'bus_priority'
  | 'cyclist_overtake'
  | 'jaywalker'
  | 'centerline_drift'
  | 'ambulance_yield';

export interface HazardScenarioDef {
  id: HazardType;
  name: string;
  description: string;
  triggerPrompt: string;
  dktReference: string;
  correctReaction: string;
  penaltyOnFail: string;
}

export interface HazardEventState {
  activeHazard: HazardType;
  status: 'idle' | 'warning' | 'in_progress' | 'passed' | 'failed';
  startTime: number;
  reactionTimeMs: number | null;
  followingDistanceSecs: number | null;
  feedback: string;
}

export interface TestTask {
  id: string;
  title: string;
  description: string;
  examinerInstruction: string;
  targetZone: {
    x: number;
    z: number;
    radius: number;
  };
  requiredSpeedLimit: number;
  requiresStop?: boolean;
  stopDurationSeconds?: number;
  requiresLeftIndicator?: boolean;
  requiresRightIndicator?: boolean;
  requiresHeadCheck?: boolean;
  requiresParkingAlign?: boolean;
  isCompleted: boolean;
  timeLimit?: number;
}

export interface TestFault {
  id: string;
  timestamp: string;
  type: 'minor' | 'critical';
  title: string;
  description: string;
  deduction: number;
}

export interface TestResult {
  passed: boolean;
  score: number;
  totalScore: number;
  minorFaults: TestFault[];
  criticalFailItem: string | null;
  tasksCompleted: number;
  totalTasks: number;
  timeElapsed: number;
  completedAt: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA';
}

export interface RoadSignDef {
  id: string;
  name: string;
  category: 'regulatory' | 'warning' | 'guide';
  code: string;
  description: string;
  rule2026: string;
  iconType: 'speed_40' | 'speed_50' | 'speed_60' | 'speed_80' | 'stop' | 'give_way' | 'roundabout' | 'school_zone' | 'pedestrian' | 'keep_left' | 'no_u_turn' | 'no_entry' | 'kangaroo';
  speedLimit?: number;
}

export interface RoadMarkingDef {
  id: string;
  name: string;
  australianStandard: string;
  meaning: string;
  testConsequence: string;
}

export interface RoadCheckpoint {
  id: number;
  title: string;
  shortDesc: string;
  targetZ: number;
  targetX: number;
  radius: number;
  speedLimit: number;
  hint: string;
  requiredGear?: Gear;
  keyInstructions: string[];
}

export interface CarScreenPos {
  x: number;
  y: number;
  isVisible: boolean;
}

export interface TheoryItem {
  ruleCode: string;
  ruleTitle: string;
  description: string;
  practicalImpact: string;
  criticalFailCondition: string;
}

export type StepCheckType =
  | 'gear_d'
  | 'handbrake_off'
  | 'handbrake_on'
  | 'indicator_right'
  | 'indicator_left'
  | 'indicator_hazard'
  | 'speed_moving'
  | 'speed_stop'
  | 'headlight_low'
  | 'headlight_high'
  | 'headlight_dim'
  | 'look_behind';

export interface GuideStepItem {
  stepNumber: number;
  title: string;
  instruction: string;
  keyPrompt: string;
  explanation: string;
  checkType: StepCheckType;
}

export interface CurriculumSeason {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  summary: string;
  theory: TheoryItem[];
  steps: GuideStepItem[];
}
