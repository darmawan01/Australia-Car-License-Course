import { DrivingLevel } from '../types';

export const DRIVING_LEVELS: DrivingLevel[] = [
  // ==========================================
  // SECTION 1: THE COURSE (Guided Curriculum)
  // ==========================================
  {
    id: 1,
    category: 'course',
    categoryNumber: 1,
    title: 'Cockpit Setup & Moving Off',
    subtitle: 'Learner Foundation Module',
    badge: 'Course 1',
    speedLimit: 50,
    description: 'Master the fundamental Australian pre-drive routine: engage Drive, signal right for 5 seconds before departing the kerb, and enter the left lane smoothly.',
    objectives: [
      'Shift into Drive [D] and release Park Brake [Space]',
      'Signal right [E] for at least 5 seconds before departing kerb (ARR 46)',
      'Accelerate smoothly and keep strictly in the left lane'
    ],
    examinerDirective: 'Examiner: "Welcome to Level 1. Prepare your vehicle to move off. Indicate right for 5 seconds to alert oncoming traffic, release your handbrake, check your blind spot, and move smoothly onto the left road lane."',
    spawnX: -2.25,
    spawnZ: 10,
    spawnSpeed: 0,
    targetZone: { x: -2.25, z: -60, radius: 20 },
    requiresIndicator: 'right',
    passConditionDescription: 'Signal right for 5s and drive 60 metres down the left lane without crossing the center dividing line.',
    tips: 'In Australia, drivers must indicate right for at least 5 seconds before moving off from a kerb or stationary roadside position.'
  },
  {
    id: 2,
    category: 'course',
    categoryNumber: 2,
    title: 'Keep-Left Discipline & 50 km/h Cruising',
    subtitle: 'Urban Road Mastery',
    badge: 'Course 2',
    speedLimit: 50,
    description: 'Learn the golden Australian road rule: drive on the left side of two-way roads and maintain smooth vehicle progression within the 50 km/h urban default limit.',
    objectives: [
      'Maintain position in the left lane (x between -1.5 and -3.0)',
      'Cruising speed between 35 km/h and 50 km/h',
      'Do not cross over the center broken white dividing line'
    ],
    examinerDirective: 'Examiner: "Level 2 begins. Maintain a steady progression between 35 and 48 km/h. Keep strictly to your left. Straying into the oncoming right lane is an automatic fail."',
    spawnX: -2.25,
    spawnZ: -30,
    spawnSpeed: 25,
    targetZone: { x: -2.25, z: -120, radius: 25 },
    passConditionDescription: 'Cruise 90 metres while maintaining left lane position and staying under 50 km/h.',
    tips: 'Australia drives on the left. Keep at least 1.2 metres buffer from the kerb while staying strictly to the left of the center white line.'
  },
  {
    id: 3,
    category: 'course',
    categoryNumber: 3,
    title: 'School Zone Compliance (40 km/h)',
    subtitle: 'Vulnerable Road Users',
    badge: 'Course 3',
    speedLimit: 40,
    description: 'Navigate an Australian School Zone during active peak hours. Vehicle speed must stay strictly at or below 40 km/h.',
    objectives: [
      'Decelerate to 40 km/h or below before passing the School Zone sign',
      'Strictly avoid exceeding 40 km/h while within the zone',
      'Scan pedestrian footpaths and crossings for children'
    ],
    examinerDirective: 'Examiner: "School zone active ahead. Slow down to under 40 km/h immediately. Exceeding 40 km/h in an Australian school zone will terminate the assessment immediately."',
    spawnX: -2.25,
    spawnZ: -70,
    spawnSpeed: 45,
    targetZone: { x: -2.25, z: -150, radius: 30 },
    passConditionDescription: 'Pass through the active 40 km/h school zone zone without exceeding 40 km/h.',
    tips: 'Standard school zone hours in Australia are 8:00–9:30 AM and 2:30–4:00 PM on school days. Any speeding here is treated as a critical fail.'
  },
  {
    id: 4,
    category: 'course',
    categoryNumber: 4,
    title: 'Compulsory Stop Sign & Solid Line Halt',
    subtitle: 'Regulatory Compliance',
    badge: 'Course 4',
    speedLimit: 50,
    description: 'Execute a legal stop at an octagonal STOP sign (R1-1). The vehicle must achieve a full, complete halt behind the solid line for 3 seconds.',
    objectives: [
      'Come to a 100% stationary stop behind the solid white stop line',
      'Hold the brake stationary for at least 3 full seconds',
      'Do not allow wheels to roll through or creep onto the intersection'
    ],
    examinerDirective: 'Examiner: "There is a Stop sign at the intersection ahead. Bring your vehicle to a complete stationary stop behind the white line. Rolling stops are prohibited."',
    spawnX: -2.25,
    spawnZ: -170,
    spawnSpeed: 30,
    targetZone: { x: -2.25, z: -225, radius: 20 },
    requiresStop: true,
    stopDurationSeconds: 3,
    passConditionDescription: 'Complete stationary halt for 3 seconds behind the solid line at z = -225.',
    tips: 'A rolling stop (even at 2 km/h) is classified as Disobeying a Regulatory Traffic Sign — an automatic critical test failure across all Australian states.'
  },
  {
    id: 5,
    category: 'course',
    categoryNumber: 5,
    title: 'Reverse Parallel Kerb Parking',
    subtitle: 'Precision Maneuver',
    badge: 'Course 5',
    speedLimit: 50,
    description: 'Park parallel to the kerb behind a parked vehicle. Finish within 50 cm of the kerb without touching or mounting the gutter.',
    objectives: [
      'Signal left [Q] and pull parallel to the reference parked car',
      'Engage Reverse gear [R] and steer smoothly into the kerb bay',
      'Straighten wheels and apply Park Brake [Space] within 50 cm of kerb'
    ],
    examinerDirective: 'Examiner: "Pull ahead alongside the parked vehicle, indicate left, and reverse parallel park into the kerb space. Ensure you are parallel, within 50 cm of the kerb, and apply your handbrake."',
    spawnX: -2.25,
    spawnZ: -280,
    spawnSpeed: 0,
    targetZone: { x: -2.8, z: -310, radius: 25 },
    requiresIndicator: 'left',
    requiresParking: true,
    passConditionDescription: 'Align vehicle parallel to kerb (rotation near 0) with handbrake engaged and distance < 50cm from kerb.',
    tips: 'You have 2 minutes and up to 4 direction changes. Mounting the kerb or hitting a vehicle is an immediate critical fail.'
  },

  // ==========================================
  // SECTION 2: PRACTICE (Hazard & Skills Drills)
  // ==========================================
  {
    id: 6,
    category: 'practice',
    categoryNumber: 1,
    title: '3-Second Following Distance & Emergency Stop',
    subtitle: 'Hazard Perception Drill',
    badge: 'Practice 1',
    speedLimit: 50,
    description: 'Follow an AI vehicle maintaining the Australian mandatory 3-second safety gap. React quickly and smoothly when the lead car slams on its brakes.',
    objectives: [
      'Maintain a 3-second gap behind the lead vehicle (ARR 126)',
      'React to lead car brake lights within 1.2 seconds',
      'Bring car to safe stop without rear-end collision'
    ],
    examinerDirective: 'Examiner: "Follow the car ahead. Count 3 seconds from when its rear passes a marker. When it brakes suddenly, respond immediately with controlled, firm braking."',
    spawnX: -2.25,
    spawnZ: 10,
    spawnSpeed: 38,
    hazardType: 'sudden_braking',
    passConditionDescription: 'Stop safely without colliding with lead vehicle when sudden braking triggers.',
    tips: 'The 3-second gap provides sufficient reaction time and braking distance in dry conditions. Double this to 6 seconds in wet or low-visibility conditions.'
  },
  {
    id: 7,
    category: 'practice',
    categoryNumber: 2,
    title: 'Public Bus Priority Yield (ARR 77)',
    subtitle: 'Traffic Priority Drill',
    badge: 'Practice 2',
    speedLimit: 50,
    description: 'In Australian built-up areas, drivers must give way to public buses displaying the "Give Way to Buses" sign when they indicate right to pull out from a kerb bay.',
    objectives: [
      'Identify the bus indicating right from the roadside bay',
      'Slow down and yield right of way safely without sudden swerving',
      'Allow the bus to complete its entry into your lane before proceeding'
    ],
    examinerDirective: 'Examiner: "There is a public transit bus ahead in a roadside bay. Watch for its right indicator. Under ARR 77, you must yield to exiting buses in built-up 50 km/h zones."',
    spawnX: -2.25,
    spawnZ: -40,
    spawnSpeed: 40,
    hazardType: 'bus_priority',
    passConditionDescription: 'Yield cleanly to the indicating bus without cutting off or colliding.',
    tips: 'Australian Road Rule 77: In built-up areas (up to 70 km/h), motorists must yield right-of-way to buses indicating to leave a bus stop.'
  },
  {
    id: 8,
    category: 'practice',
    categoryNumber: 3,
    title: '1-Metre Cyclist Clearance (ARR 144-1)',
    subtitle: 'Vulnerable Road Users',
    badge: 'Practice 3',
    speedLimit: 50,
    description: 'Overtake a roadside cyclist safely by slowing down and ensuring a minimum lateral distance of at least 1.0 metre (1.5m on roads over 60 km/h).',
    objectives: [
      'Spot the cyclist on the left shoulder',
      'Reduce speed and signal right if crossing lane line slightly',
      'Maintain at least 1.0 metre lateral clearance from the cyclist handle-bars'
    ],
    examinerDirective: 'Examiner: "Cyclist riding ahead on your left. Under Australia 2026 rules, you must leave at least 1.0 metre clearance when passing. Slow down and maneuver safely."',
    spawnX: -2.25,
    spawnZ: -80,
    spawnSpeed: 35,
    hazardType: 'cyclist_overtake',
    passConditionDescription: 'Pass the cyclist with at least 1.0 metre lateral gap.',
    tips: 'Drivers are legally permitted to cross single continuous centerlines to safely give cyclists their required 1-metre clearance when safe to do so.'
  },
  {
    id: 9,
    category: 'practice',
    categoryNumber: 4,
    title: 'Jaywalker Pedestrian Hazard Reaction',
    subtitle: 'Emergency Perception',
    badge: 'Practice 4',
    speedLimit: 50,
    description: 'A pedestrian suddenly steps off the kerb mid-block to cross the street. Identify the hazard and stop safely before the impact zone.',
    objectives: [
      'Scan the kerb for pedestrian movements',
      'Apply firm braking immediately upon pedestrian stepping out',
      'Check rear-view mirror while braking to prevent rear-end collision'
    ],
    examinerDirective: 'Examiner: "Watch the residential kerbs closely. Scan for pedestrians stepping out from between parked vehicles and react swiftly."',
    spawnX: -2.25,
    spawnZ: -120,
    spawnSpeed: 40,
    hazardType: 'jaywalker',
    passConditionDescription: 'Halt safely before the pedestrian without striking them.',
    tips: 'Scanning 12 seconds ahead gives drivers the predictive buffer needed to detect pedestrians before they enter the traffic stream.'
  },

  // ==========================================
  // SECTION 3: EXAM (Official Practical Driving Test)
  // ==========================================
  {
    id: 10,
    category: 'exam',
    categoryNumber: 1,
    title: 'Provisional P1 Practical Driving Assessment (PDA)',
    subtitle: 'Official Australian Drive Test',
    badge: 'P1 Exam',
    speedLimit: 50,
    description: 'The official multi-stage on-road driving test. Complete the full route including school zone, stop sign, and parallel park with 0 critical errors and a score >= 90% to earn your Red P-Plates.',
    objectives: [
      'Complete all 6 examination tasks under real testing conditions',
      'Zero Critical Errors (no speeding, no rolling stop, no kerb mounting, no collisions)',
      'Score 90% or higher across vehicle control, observation, and road positioning'
    ],
    examinerDirective: 'Examiner: "Welcome to your official Australian Provisional P1 Drive Test. I will give you directions along our test route. Drive safely, obey all road rules, and treat this as a real on-road evaluation."',
    spawnX: -2.25,
    spawnZ: 10,
    spawnSpeed: 0,
    passConditionDescription: 'Complete full route with score >= 90% and zero critical errors.',
    tips: 'Observation is the #1 reason candidates fail: check your rear-view mirror before braking, check blind spots before moving, and observe both ways at every intersection.'
  },
  {
    id: 11,
    category: 'exam',
    categoryNumber: 2,
    title: 'Provisional P2 Hazard & Traffic Assessment',
    subtitle: 'Advanced Driver License Test',
    badge: 'P2 Exam',
    speedLimit: 50,
    description: 'Advanced assessment required for progression from P1 (Red) to P2 (Green) license. Handles unexpected hazards, dynamic AI traffic, emergency vehicle yield, and complex intersections.',
    objectives: [
      'Navigate dense traffic with unpredictable AI road users',
      'Yield promptly to approaching emergency ambulance with sirens and lights',
      'Achieve flawless road positioning and 3-second cushion'
    ],
    examinerDirective: 'Examiner: "Provisional P2 Assessment. You will encounter active traffic and real-time hazard events. Maintain calm vehicle control and demonstrate proactive hazard perception."',
    spawnX: -2.25,
    spawnZ: 20,
    spawnSpeed: 30,
    hazardType: 'ambulance_yield',
    passConditionDescription: 'Navigate traffic and yield to emergency ambulance safely to pass.',
    tips: 'Under ARR Rule 78, you must move as far left as safe and stop if necessary to give way to an emergency vehicle sounding an alarm or displaying flashing red or blue lights.'
  }
];

export const INITIAL_LEVEL_PROGRESS: Record<number, { unlocked: boolean; completed: boolean; stars: number; bestScore: number; bestTime: number }> = {
  1: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  2: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  3: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  4: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  5: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  6: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  7: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  8: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  9: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  10: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  11: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
};
