import { RoadSignDef, RoadMarkingDef, TestTask } from '../types';

export const AUSTRALIAN_ROAD_SIGNS: RoadSignDef[] = [
  {
    id: 'sign_stop',
    name: 'STOP Sign (R1-1)',
    category: 'regulatory',
    code: 'R1-1',
    description: 'Octagonal red sign with white STOP letters. You MUST come to a complete, stationary halt before the solid white stop line.',
    rule2026: 'In the Australian Driving Test, rolling through a STOP sign (even at 1 km/h) is an IMMEDIATE FAIL. The wheels must be completely stationary for at least 3 seconds.',
    iconType: 'stop'
  },
  {
    id: 'sign_give_way',
    name: 'GIVE WAY Sign (R1-2)',
    category: 'regulatory',
    code: 'R1-2',
    description: 'Inverted triangle with thick red border. Slow down and give way to all traffic on the intersecting road or roundabout.',
    rule2026: 'You must give way to any vehicle travelling on or turning into the road you are entering. In roundabouts, give way to vehicles already in or entering from your right.',
    iconType: 'give_way'
  },
  {
    id: 'sign_school_zone',
    name: 'School Zone 40 km/h (R4-230)',
    category: 'regulatory',
    code: 'R4-230',
    description: 'Fluorescent sign indicating 40 km/h during school peak hours (8:00 AM - 9:30 AM & 2:30 PM - 4:00 PM on school days).',
    rule2026: 'Exceeding 40 km/h in an active school zone by even 1 km/h during an on-road driving test results in immediate test termination and critical failure.',
    iconType: 'school_zone',
    speedLimit: 40
  },
  {
    id: 'sign_speed_50',
    name: 'Default Built-up Speed Limit (50 km/h)',
    category: 'regulatory',
    code: 'R4-1-50',
    description: 'Standard Australian urban residential default speed limit sign.',
    rule2026: 'The default speed limit in built-up urban and residential areas across all Australian states (NSW, VIC, QLD, WA, SA) is 50 km/h unless otherwise signposted.',
    iconType: 'speed_50',
    speedLimit: 50
  },
  {
    id: 'sign_speed_60',
    name: 'Arterial Road Speed Limit (60 km/h)',
    category: 'regulatory',
    code: 'R4-1-60',
    description: 'Standard speed limit on multi-lane suburban arterials and commercial streets.',
    rule2026: 'Maintain between 55–60 km/h when safe. In Australian tests, driving more than 10 km/h below the limit without road hazards is penalised for lack of vehicle progression.',
    iconType: 'speed_60',
    speedLimit: 60
  },
  {
    id: 'sign_speed_80',
    name: 'Connecting Highway Limit (80 km/h)',
    category: 'regulatory',
    code: 'R4-1-80',
    description: 'Semi-rural / ring-road connecting road limit.',
    rule2026: 'On multi-lane roads with a speed limit over 80 km/h, you MUST KEEP LEFT unless overtaking or turning right.',
    iconType: 'speed_80',
    speedLimit: 80
  },
  {
    id: 'sign_roundabout',
    name: 'Roundabout Ahead (W2-7)',
    category: 'warning',
    code: 'W2-7',
    description: 'Yellow diamond with circular arrows indicating a roundabout ahead.',
    rule2026: 'Approach in the correct lane, indicate before entering if turning, give way to traffic in the roundabout (from right), and ALWAYS indicate LEFT prior to leaving the roundabout.',
    iconType: 'roundabout'
  },
  {
    id: 'sign_pedestrian',
    name: 'Pedestrian Crossing (W6-2)',
    category: 'warning',
    code: 'W6-2',
    description: 'Yellow diamond with pedestrian silhouette walking on zebra markings.',
    rule2026: 'Drivers MUST give way to any pedestrian who has stepped onto or is crossing the zebra crossing. Never overtake a car that has stopped at a crossing.',
    iconType: 'pedestrian'
  },
  {
    id: 'sign_keep_left',
    name: 'Keep Left (R2-3)',
    category: 'regulatory',
    code: 'R2-3',
    description: 'White rectangular sign with black arrow pointing down-left, commanding drivers to pass to the left of an island or median.',
    rule2026: 'Passing on the right side of a Keep Left sign is a strict regulatory violation and immediate driving test fail.',
    iconType: 'keep_left'
  },
  {
    id: 'sign_kangaroo',
    name: 'Wildlife / Kangaroo Warning (W5-29)',
    category: 'warning',
    code: 'W5-29',
    description: 'Iconic Australian yellow warning diamond indicating kangaroo and native fauna crossing hazard.',
    rule2026: 'Scan road shoulders especially between dusk and dawn. Do not swerve violently if an animal enters; brake firmly in a straight line.',
    iconType: 'kangaroo'
  }
];

export const AUSTRALIAN_ROAD_MARKINGS: RoadMarkingDef[] = [
  {
    id: 'mark_stop_line',
    name: 'Solid Transverse Stop Line',
    australianStandard: 'AS 1742.2',
    meaning: 'Unbroken white line painted across the lane at STOP signs and traffic signals.',
    testConsequence: 'The front bumper must stop BEFORE crossing this line. Creeping forward over the line before a full stop is an immediate test fail.'
  },
  {
    id: 'mark_give_way_line',
    name: 'Broken Transverse Give Way Line',
    australianStandard: 'AS 1742.2',
    meaning: 'Dashed white line across lane entry at intersections and roundabouts.',
    testConsequence: 'Slow down and prepare to yield. You may proceed without stopping only if the intersection/roundabout is completely clear of conflicting traffic.'
  },
  {
    id: 'mark_double_lines',
    name: 'Double Continuous White Lines',
    australianStandard: 'AS 1742.2',
    meaning: 'Two parallel solid white lines dividing opposite directions of traffic.',
    testConsequence: 'NEVER cross to overtake or make U-turns. (Crossing permitted only into driveway if safe in some states, but prohibited for overtaking).'
  },
  {
    id: 'mark_single_solid',
    name: 'Single Continuous Dividing Line',
    australianStandard: 'AS 1742.2',
    meaning: 'Separates traffic on approaches to crests, curves, and high-risk junctions.',
    testConsequence: 'You must NOT cross this line to overtake. Touching or crossing this line during the driving test incurs severe position penalty.'
  },
  {
    id: 'mark_broken_dividing',
    name: 'Broken Dividing White Line',
    australianStandard: 'AS 1742.2',
    meaning: 'Standard centerline allowing overtaking and lane changes when clear.',
    testConsequence: 'Drive on the left of this line. Crossing allowed when executing turns or overtaking after 5-second indicator signal.'
  },
  {
    id: 'mark_yellow_solid',
    name: 'Solid Yellow Kerb Line (No Stopping)',
    australianStandard: 'ARR Rule 169',
    meaning: 'Painted continuously along the kerb or road edge.',
    testConsequence: 'Strictly NO STOPPING or parking at any time. Stopping here to pick up or park is illegal and results in an immediate test fail.'
  },
  {
    id: 'mark_yellow_broken',
    name: 'Broken Yellow Kerb Line (Clearway)',
    australianStandard: 'ARR Rule 176',
    meaning: 'Indicates a clearway during designated peak traffic hours.',
    testConsequence: 'No stopping or parking during designated hours. Vehicles are towed.'
  },
  {
    id: 'mark_zebra',
    name: 'Zebra Pedestrian Stripes & Wombat Crossing',
    australianStandard: 'AS 1742.10',
    meaning: 'Thick longitudinal white bands on dark asphalt, often on a raised road platform (wombat crossing).',
    testConsequence: 'Absolute right of way to pedestrians. Failing to stop for a waiting pedestrian is an immediate fail.'
  }
];

export const OFFICIAL_DRIVE_TEST_TASKS: TestTask[] = [
  {
    id: 'task_pre_check',
    title: '1. Cockpit Pre-Drive Check',
    description: 'Ensure vehicle roadworthiness: check handbrake, engage Drive gear, and activate right indicator before departing kerb.',
    examinerInstruction: 'Examiner: "Welcome to your 2026 Australian Drive Test. Please release the handbrake, indicate right for 5 seconds to alert oncoming traffic, check your mirrors and blind spot, then pull out safely onto the left lane."',
    targetZone: { x: 0, z: 0, radius: 15 },
    requiredSpeedLimit: 50,
    requiresRightIndicator: true,
    requiresHeadCheck: true,
    isCompleted: false
  },
  {
    id: 'task_school_zone',
    title: '2. School Zone Compliance (Max 40 km/h)',
    description: 'Approach the local primary school. Strictly maintain vehicle speed under 40 km/h throughout the signposted zone.',
    examinerInstruction: 'Examiner: "We are approaching a designated School Zone ahead. The flashing 40 km/h limit is active. Keep your speed strictly at or under 40 km/h and watch for crossing children."',
    targetZone: { x: 0, z: -80, radius: 45 },
    requiredSpeedLimit: 40,
    isCompleted: false
  },
  {
    id: 'task_zebra_crossing',
    title: '3. Pedestrian Zebra Crossing Halt',
    description: 'Scan the zebra crossing. If pedestrians are waiting on the footpath or crossing, come to a smooth halt before the zigzag lines.',
    examinerInstruction: 'Examiner: "Pedestrian crossing ahead on the raised wombat hump. Check both sides of the footpath. Yield to any crossing pedestrians before proceeding."',
    targetZone: { x: 0, z: -140, radius: 25 },
    requiredSpeedLimit: 40,
    requiresStop: true,
    stopDurationSeconds: 2,
    isCompleted: false
  },
  {
    id: 'task_stop_sign',
    title: '4. Compulsory Stop Sign & Solid Line Halt',
    description: 'Bring the vehicle to a full, 100% stationary stop behind the solid white stop line. Wait 3 full seconds while observing traffic left and right.',
    examinerInstruction: 'Examiner: "At the upcoming intersection, there is a Stop sign. Bring the car to a COMPLETE stop behind the solid white line. Do not roll through!"',
    targetZone: { x: 0, z: -210, radius: 20 },
    requiredSpeedLimit: 50,
    requiresStop: true,
    stopDurationSeconds: 3,
    isCompleted: false
  },
  {
    id: 'task_roundabout',
    title: '5. Roundabout Left-Turn Navigation',
    description: 'Approach roundabout in left lane, indicate left before entry, give way to traffic already circulating or entering from right, signal off left.',
    examinerInstruction: 'Examiner: "At the roundabout ahead, we will be taking the first exit (turning left). Signal left on approach, yield to traffic on your right, and take the exit safely."',
    targetZone: { x: 0, z: -300, radius: 40 },
    requiredSpeedLimit: 50,
    requiresLeftIndicator: true,
    isCompleted: false
  },
  {
    id: 'task_parallel_park',
    title: '6. Reverse Parallel Kerb Park',
    description: 'Pull alongside the parked vehicle, indicate left, reverse smoothly into the kerb bay within 50cm of kerb without mounting.',
    examinerInstruction: 'Examiner: "Please perform a reverse parallel park behind the parked silver vehicle ahead on your left. Stop parallel within 50cm of the kerb and apply your handbrake."',
    targetZone: { x: 45, z: -300, radius: 25 },
    requiredSpeedLimit: 50,
    requiresParkingAlign: true,
    isCompleted: false
  }
];

export const AUSTRALIAN_GLS_INFO = {
  stages: [
    {
      stage: 'Learner Permit (L Plate)',
      badge: 'L',
      color: 'bg-yellow-400 text-black border-black',
      minAge: '16 years old (15 yrs 9 mos in ACT)',
      requirements: 'Pass Driver Knowledge Test (DKT) / Learner Permit Test. Must log 120 supervised driving hours (including 20 hours of night driving) with a full license holder.',
      rules: 'Supervised at all times. Blood Alcohol Concentration (BAC) 0.00. No mobile phone usage (even hands-free). Speed capped at 90 km/h (NSW/QLD) or posted limit (VIC).'
    },
    {
      stage: 'Provisional P1 (Red P Plate)',
      badge: 'P1',
      color: 'bg-red-600 text-white border-red-700',
      minAge: '17 years (18 in VIC)',
      requirements: 'Pass Practical Driving Assessment (Drive Test) & Hazard Perception Test (HPT). Must have completed 120 logbook hours.',
      rules: 'Solo driving permitted! 0.00 BAC. Display red P plate. Max speed 90 km/h in NSW. Max 1 peer passenger under 21 at night. Zero phone usage.'
    },
    {
      stage: 'Provisional P2 (Green P Plate)',
      badge: 'P2',
      color: 'bg-emerald-600 text-white border-emerald-700',
      minAge: '18 years (19 in VIC)',
      requirements: 'Hold P1 license for at least 12 months with clean driving record.',
      rules: 'Display green P plate. Max speed 100 km/h in NSW (or posted limit in VIC). 0.00 BAC. Zero phone usage. 7-8 demerit point threshold.'
    },
    {
      stage: 'Full Unrestricted Driver License',
      badge: 'FULL',
      color: 'bg-blue-600 text-white border-blue-700',
      minAge: '20+ years (after 24-36 months on P2)',
      requirements: 'Hold P2 for required duration with good driving history.',
      rules: 'Standard legal speed limits apply. BAC limit under 0.05. Standard 12-13 demerit points allowance. Hands-free phone permitted in cradle.'
    }
  ],
  criticalImmediateFailItems: [
    {
      title: 'Speeding (Any Margin)',
      desc: 'Exceeding the signposted limit (e.g., doing 42 km/h in a 40 km/h school zone or 52 km/h in 50 km/h residential) by any margin is an immediate test termination.'
    },
    {
      title: 'Rolling Stop Sign',
      desc: 'Failing to bring the car to a full, stationary rest before the solid white stop line. Wheels must stop turning completely.'
    },
    {
      title: 'Failing to Give Way',
      desc: 'Entering an intersection, roundabout, or turn where another vehicle or pedestrian has right of way, causing them to brake or alter course.'
    },
    {
      title: 'Mounting the Kerb',
      desc: 'Driving any wheel over or onto the kerb during driving, three-point turns, or parallel parking (light touch/rub is minor fault, mounting is fail).'
    },
    {
      title: 'Crossing Solid Double Lines',
      desc: 'Crossing unbroken double white lines or driving on the wrong side of a traffic island or Keep Left sign.'
    },
    {
      title: 'Intervention Required',
      desc: 'Examiner having to verbally warn you to brake or grab the dual controls/steering wheel to prevent a collision or hazardous situation.'
    },
    {
      title: 'Dangerous Action / Red Light',
      desc: 'Disobeying traffic signals, ignoring pedestrian crossings, or pulling out into oncoming traffic without a blindspot head check.'
    }
  ]
};
