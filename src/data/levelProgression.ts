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
    situation: {
      timeLabel: '07:15 AM • Golden Sunrise',
      weatherLabel: 'Clear Dawn • Dry Bitumen',
      environment: 'morning_sunrise',
      trafficDensity: 'Quiet',
      roadCondition: 'Dry',
      specialCondition: 'Tranquil suburban morning with low golden sun glare. Moving off from quiet residential kerb. Check mirrors and blind spots thoroughly.',
      keyRuleAlert: 'ARR Rule 46: Indicate right for at least 5 seconds before moving off from a stationary kerb position.'
    },
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
    situation: {
      timeLabel: '12:30 PM • Bright Midday Sun',
      weatherLabel: 'Sunny Blue Skies • High Visibility',
      environment: 'midday_clear',
      trafficDensity: 'Moderate',
      roadCondition: 'Dry',
      specialCondition: 'Active suburban traffic flow with oncoming vehicles. Maintain 1.2m kerb buffer and smooth cruising between 35 and 48 km/h.',
      keyRuleAlert: 'ARR Rule 129: Keep strictly to the left on two-way Australian roads unless overtaking or turning.'
    },
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
    situation: {
      timeLabel: '03:15 PM • Afternoon School Rush',
      weatherLabel: 'Overcast Skies • Vulnerable Pedestrians',
      environment: 'school_rush',
      trafficDensity: 'School Peak',
      roadCondition: 'Dry',
      specialCondition: 'Active peak school zone hours with flashing twin amber 40 km/h beacons. Children crossing at the raised Wombat zebra crossing.',
      keyRuleAlert: 'ARR Rule 81: Strict 40 km/h maximum speed; give way to any pedestrian on or entering a crossing.'
    },
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
    title: 'Wet Weather Rain & Compulsory Stop Sign',
    subtitle: 'Adverse Weather & Multi-Lane Gantry',
    badge: 'Course 4',
    speedLimit: 50,
    description: 'Navigate torrential rain precipitation on wet reflective bitumen. Decelerate in reduced grip conditions and execute a complete 3-second stationary halt at the STOP sign.',
    situation: {
      timeLabel: '04:45 PM • Torrential Rainstorm',
      weatherLabel: 'Rain Precipitation • Wet Reflective Bitumen',
      environment: 'rainy_wet',
      trafficDensity: 'Heavy Commuter',
      roadCondition: 'Wet Reflective',
      specialCondition: 'Adverse wet weather: vehicle stopping distance doubles! Approach the 3-lane overhead gantry and bring vehicle to a 100% stationary halt behind the solid stop line.',
      keyRuleAlert: 'ARR Rule 67: Come to a complete stop before the stop line and remain stationary until safe.'
    },
    objectives: [
      'Navigate wet conditions with reduced tyre adhesion and spray',
      'Select proper lane under the overhead Highway Gantry',
      'Come to a 100% stationary stop behind the solid white stop line for 3 full seconds'
    ],
    examinerDirective: 'Examiner: "Heavy rain active. Stopping distances are doubled on wet bitumen. Approach the intersection ahead, follow your lane under the gantry, and execute a full 3-second stationary stop behind the solid line."',
    spawnX: -2.25,
    spawnZ: -170,
    spawnSpeed: 30,
    targetZone: { x: -2.25, z: -225, radius: 20 },
    requiresStop: true,
    stopDurationSeconds: 3,
    passConditionDescription: 'Complete stationary halt for 3 seconds behind the solid line at z = -225 in wet conditions.',
    tips: 'A rolling stop (even at 2 km/h) is classified as Disobeying a Regulatory Traffic Sign — an automatic critical test failure across all Australian states.'
  },
  {
    id: 5,
    category: 'course',
    categoryNumber: 5,
    title: 'Dusk Sunset Roundabout & Left Turn First Exit',
    subtitle: 'Twilight Flow & Kerb Parking',
    badge: 'Course 5',
    speedLimit: 50,
    description: 'Enter the Australian roundabout under golden hour dusk lighting with streetlights active. Give way to your right, take the First Exit (turn left), and perform precision kerb parking.',
    situation: {
      timeLabel: '06:10 PM • Golden Twilight / Dusk',
      weatherLabel: 'Sunset Dusk • Streetlights Active',
      environment: 'dusk_sunset',
      trafficDensity: 'Circulating Flow',
      roadCondition: 'Dry',
      specialCondition: 'Sunset low-light conditions with headlights and streetlights on. Yield to traffic from your right on the roundabout, indicate left, and take the first exit to West Civic.',
      keyRuleAlert: 'ARR Rule 114: Must give way to any vehicle already circulating on the roundabout before entering.'
    },
    objectives: [
      'Yield to circulating vehicles approaching from the right at the Give Way line',
      'Indicate left [Q] and take the first exit onto West Civic Road',
      'Reverse parallel park into the kerb bay within 50 cm of gutter'
    ],
    examinerDirective: 'Examiner: "At the roundabout ahead, give way to traffic on your right. We will take the first exit, turning left onto West Civic. Then prepare to park along the kerb."',
    spawnX: -2.25,
    spawnZ: -280,
    spawnSpeed: 0,
    targetZone: { x: -2.8, z: -310, radius: 25 },
    requiresIndicator: 'left',
    requiresParking: true,
    passConditionDescription: 'Navigate roundabout left exit cleanly and align vehicle parallel to kerb < 50cm with handbrake engaged.',
    tips: 'In Australia, always give way to vehicles already circulating on the roundabout from your right. Always indicate left when taking the first exit.'
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
    situation: {
      timeLabel: '01:45 PM • Midday Arterial Flow',
      weatherLabel: 'Dry Bitumen • Clear Vision',
      environment: 'midday_clear',
      trafficDensity: 'Moderate',
      roadCondition: 'Dry',
      specialCondition: 'Highway tailgating drill. Maintain a 3-second buffer behind lead vehicle. React immediately when brake lights illuminate.',
      keyRuleAlert: 'ARR Rule 126: Must maintain sufficient distance behind lead vehicle to stop safely (minimum 3 seconds).'
    },
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
    situation: {
      timeLabel: '08:30 AM • Morning Transit Peak',
      weatherLabel: 'Morning Commute • Bus Bay Traffic',
      environment: 'morning_sunrise',
      trafficDensity: 'Heavy Commuter',
      roadCondition: 'Dry',
      specialCondition: 'Public transit bus indicating right to depart kerb bay. Yield right of way smoothly without swerving or braking abruptly.',
      keyRuleAlert: 'ARR Rule 77: Mandatory yield to public buses signaling to leave a bus stop in built-up areas up to 70 km/h.'
    },
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
    situation: {
      timeLabel: '11:15 AM • Midday Residential',
      weatherLabel: 'Sunny Daylight • Cyclist on Shoulder',
      environment: 'midday_clear',
      trafficDensity: 'Moderate',
      roadCondition: 'Dry',
      specialCondition: 'Cyclist traveling on left shoulder. Reduce speed and provide at least 1.0 metre lateral passing cushion.',
      keyRuleAlert: 'ARR Rule 144-1: Maintain at least 1.0m lateral distance when overtaking a cyclist in 60 km/h or less zones.'
    },
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
    title: 'Australian Night Driving & Pedestrian Hazard',
    subtitle: 'Night Vision & Emergency Perception',
    badge: 'Practice 4',
    speedLimit: 50,
    description: 'Drive in full Australian nighttime conditions with headlights illuminated and retroreflective road markers guiding the lane. React to a pedestrian stepping off the kerb.',
    situation: {
      timeLabel: '09:15 PM • Night Darkness',
      weatherLabel: 'Night Darkness • Headlights & Streetlights Active',
      environment: 'night_twilight',
      trafficDensity: 'Quiet',
      roadCondition: 'Dry',
      specialCondition: 'Night driving conditions with low ambient illumination. Headlights on low beam, scan road 12 seconds ahead for unlit hazards.',
      keyRuleAlert: 'ARR Rule 215: Use headlights between sunset and sunrise or in hazardous weather causing reduced visibility.'
    },
    objectives: [
      'Operate vehicle under nighttime headlight illumination',
      'Scan the kerb for pedestrian movements in shadows',
      'Apply firm braking immediately upon pedestrian stepping out'
    ],
    examinerDirective: 'Examiner: "Night driving drill. Keep your headlights on, scan the residential kerbs in your beam, and react swiftly to any pedestrians stepping out."',
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
    situation: {
      timeLabel: '09:30 AM • Official Test Morning',
      weatherLabel: 'Clear Daylight • Full Assessment Course',
      environment: 'morning_sunrise',
      trafficDensity: 'Moderate',
      roadCondition: 'Dry',
      specialCondition: 'Complete 6-task practical driving assessment route. Evaluates starting, lane keeping, school zone 40, STOP sign, and parallel parking.',
      keyRuleAlert: 'Official Score >= 90% required. Any critical fail (speeding, rolling stop, collision) terminates assessment.'
    },
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
    situation: {
      timeLabel: '05:45 PM • Twilight Peak Commute',
      weatherLabel: 'Dusk Twilight • Emergency Siren Inbound',
      environment: 'dusk_sunset',
      trafficDensity: 'Heavy Commuter',
      roadCondition: 'Dry',
      specialCondition: 'Dense twilight commuter traffic. Maintain proactive hazard scanning and yield promptly to approaching emergency ambulance with sirens and lights.',
      keyRuleAlert: 'ARR Rule 78: Give way to emergency vehicles sounding alarms or displaying flashing red or blue lights.'
    },
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
  },

  // ==========================================
  // SECTION 4: THE VILLAGE (Wattle Creek Rural Township)
  // ==========================================
  {
    id: 12,
    category: 'course',
    categoryNumber: 6,
    title: 'Wattle Creek Historic Village High Street',
    subtitle: 'Rural Township & 40 km/h Precinct',
    badge: 'Village 1',
    speedLimit: 40,
    description: 'Drive the northern country road into the historic village of Wattle Creek. Observe the 40 km/h village precinct limit, pass the iconic Bushman\'s Rest Hotel and bakery, and circle the historic Windmill Village Green.',
    situation: {
      timeLabel: '10:15 AM • Pleasant Country Morning',
      weatherLabel: 'Sunlight & Blue Skies • Village Precinct',
      environment: 'morning_sunrise',
      trafficDensity: 'Quiet',
      roadCondition: 'Dry',
      specialCondition: 'Historic country village with timber storefronts, bakery visitors, and rural wildlife corridor. Obey 40 km/h speed zone.',
      keyRuleAlert: 'ARR Rule 21: Obey special precinct speed limit of 40 km/h in designated village shopping strips.'
    },
    objectives: [
      'Enter Wattle Creek Village and reduce speed to 40 km/h or below',
      'Maintain safe lane discipline past the Country Pub and Bakery',
      'Yield to right and circulate clockwise around the Windmill Village Green'
    ],
    examinerDirective: 'Examiner: "Welcome to Wattle Creek Village. Drive north into the main street. Observe the 40 km/h village precinct speed limit, scan for pedestrians near the bakery, and circle around the Village Green windmill."',
    spawnX: -2.25,
    spawnZ: 30,
    spawnSpeed: 30,
    targetZone: { x: -3.5, z: 235, radius: 25 },
    passConditionDescription: 'Navigate Wattle Creek Village High Street within 40 km/h and complete the Village Green circle.',
    tips: 'Rural villages in Australia often introduce 40 km/h or 50 km/h safety zones due to narrow verandahs, parked agricultural vehicles, and pedestrians crossing without formal zebras.'
  },
  {
    id: 13,
    category: 'course',
    categoryNumber: 7,
    title: 'Country Farmstead Lane & Wildlife Corridor',
    subtitle: 'Australian Bush Road & Cattle Grid',
    badge: 'Village 2',
    speedLimit: 50,
    description: 'Branch onto East Farmstead country lane past timber barns, hay bales, corrugated iron rainwater tanks, and a rural cattle grid crossing. Practice rural road positioning on narrow lanes.',
    situation: {
      timeLabel: '05:20 PM • Late Afternoon Golden Hour',
      weatherLabel: 'Golden Dusk • Active Wildlife Corridor',
      environment: 'dusk_sunset',
      trafficDensity: 'Quiet',
      roadCondition: 'Dry',
      specialCondition: 'Narrow country bitumen with gravel shoulders, cattle grid crossing, and kangaroo warning zone. Maintain steady control.',
      keyRuleAlert: 'ARR Rule 125: Do not drive abnormally slowly; drive within safe rural road limits and heed wildlife warning signs.'
    },
    objectives: [
      'Turn east at the Village Green onto Farmstead Lane',
      'Traverse the cattle grid safely with centered steering',
      'Maintain safe buffer from roadside farm post-and-rail fences'
    ],
    examinerDirective: 'Examiner: "Take the east exit from the village green onto Farmstead Lane. Drive smoothly across the cattle grid, observe the kangaroo warning zone, and follow the scenic country farm loop."',
    spawnX: -2.25,
    spawnZ: 215,
    spawnSpeed: 25,
    targetZone: { x: 75, z: 235, radius: 25 },
    passConditionDescription: 'Complete the Farmstead Lane crossing and cattle grid transit smoothly.',
    tips: 'On Australian rural country roads, be especially alert for kangaroos, wallabies, and livestock crossing around dawn and dusk.'
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
  12: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
  13: { unlocked: true, completed: false, stars: 0, bestScore: 0, bestTime: 0 },
};
