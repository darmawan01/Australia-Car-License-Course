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
  keyRulesToRemember: string[];
  steps: GuideStepItem[];
}

export const CURRICULUM_SEASONS: CurriculumSeason[] = [
  {
    id: 1,
    badge: 'Season 1',
    title: 'Season 1: Pre-Drive Cockpit Drill & Moving Off from Kerb',
    subtitle: 'Mirrors, 5-Second Signaling & Shoulder Check Before Pulling Out',
    category: 'Vehicle Control Foundation',
    readTime: '3 min read',
    summary: 'Moving off from the left kerb requires systematic safety checks. In Australia, failing to signal for at least 5 seconds before departing the kerb or failing to conduct a blind-spot head check is an immediate test fail.',
    theory: [
      {
        ruleCode: 'ARR Rule 86',
        ruleTitle: 'Giving way when moving from a stationary position at a kerb',
        description: 'A driver who is moving from a stationary position at the side of a road or median strip must give way to any vehicle or cyclist traveling on the road.',
        practicalImpact: 'Never assume other drivers will slow down or yield. Yield to oncoming and approaching traffic.',
        criticalFailCondition: 'Moving out into traffic causing another driver or cyclist to brake or swerve.'
      },
      {
        ruleCode: 'ARR Rule 48',
        ruleTitle: 'Giving a right change of direction signal when moving from a kerb',
        description: 'Before moving off from the side of a road or parking space, you must signal right for at least 5 seconds before pulling out.',
        practicalImpact: 'Gives following traffic ample advance notice so they can prepare.',
        criticalFailCondition: 'Signaling for less than 5 seconds or not signaling before crossing the edge line.'
      }
    ],
    keyRulesToRemember: [
      'Fasten seatbelt and ensure handbrake is firmly engaged before starting.',
      'Check interior rear-view mirror, then right wing mirror.',
      'Turn on right indicator (E key) and let it flash for at least 5 seconds.',
      'Check blind spot over right shoulder for approaching cyclists and cars.',
      'Select Drive (D key), release handbrake (Spacebar), and gently accelerate.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Signal Right for Departure',
        instruction: 'Turn on right indicator to give traffic 5 seconds warning.',
        keyPrompt: 'Press E or Right Indicator',
        explanation: 'Australian Road Rule 48 mandates a minimum 5-second indicator signal before leaving any kerb.',
        checkType: 'indicator_right'
      },
      {
        stepNumber: 2,
        title: 'Check Rear & Blind Spot',
        instruction: 'Check rear-view mirror and look behind for cyclists.',
        keyPrompt: 'Press B or Rearview Mirror',
        explanation: 'Cyclists and passing traffic can enter your blind spot in fractions of a second.',
        checkType: 'look_behind'
      },
      {
        stepNumber: 3,
        title: 'Select Drive Gear',
        instruction: 'Engage Drive (D) while holding the service brake.',
        keyPrompt: 'Press D to Shift to Drive',
        explanation: 'Ensure the transmission is in Drive before disengaging the handbrake.',
        checkType: 'gear_d'
      },
      {
        stepNumber: 4,
        title: 'Release Handbrake',
        instruction: 'Disengage the handbrake to prepare for acceleration.',
        keyPrompt: 'Press Spacebar or Click P-Brake',
        explanation: 'Driving with the handbrake engaged causes brake overheating and deduction of control marks.',
        checkType: 'handbrake_off'
      },
      {
        stepNumber: 5,
        title: 'Move Off Smoothly',
        instruction: 'Accelerate forward smoothly into the left driving lane.',
        keyPrompt: 'Hold W or Up Arrow',
        explanation: 'Build speed smoothly to merge with the 50 km/h traffic flow.',
        checkType: 'speed_moving'
      }
    ]
  },
  {
    id: 2,
    badge: 'Season 2',
    title: 'Season 2: Suburban Lane Discipline & The Keep-Left Rule',
    subtitle: 'Mastering Left Lane Positioning and Solid Center Line Observation',
    category: 'Road Position Discipline',
    readTime: '4 min read',
    summary: 'Australia drives on the left-hand side of the road. Maintaining correct lateral positioning within your lane without straddling the unbroken white line or brushing the concrete gutter is essential.',
    theory: [
      {
        ruleCode: 'ARR Rule 129',
        ruleTitle: 'Keeping to the far left side of the road',
        description: 'A driver on a multi-lane road or standard two-way street must drive as near as practicable to the left side of the carriageway unless overtaking, turning right, or avoiding an obstacle.',
        practicalImpact: 'Keep your car centered between the center dividing line and the gutter.',
        criticalFailCondition: 'Straddling the dividing line into oncoming traffic without necessity.'
      },
      {
        ruleCode: 'ARR Rule 132',
        ruleTitle: 'Crossing a single unbroken dividing line',
        description: 'A driver must not cross an unbroken dividing line except to turn right, enter/leave private property, or avoid a stationary hazard when safe.',
        practicalImpact: 'Never cut corners or cross solid white lines on curves.',
        criticalFailCondition: 'Crossing an unbroken dividing line during normal driving.'
      }
    ],
    keyRulesToRemember: [
      'Drive on the left half of the road at all times.',
      'Maintain 1.0 to 1.5 meters safety clearance from parked vehicles on your left.',
      'Never drift across the single unbroken white line into the oncoming lane.',
      'Keep eyes scanned 12 to 15 seconds ahead along your intended path.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Establish Drive Gear',
        instruction: 'Verify you are in Drive (D) gear.',
        keyPrompt: 'Press D',
        explanation: 'Ensure forward gear is engaged.',
        checkType: 'gear_d'
      },
      {
        stepNumber: 2,
        title: 'Release Handbrake',
        instruction: 'Disengage handbrake for smooth cruising.',
        keyPrompt: 'Press Spacebar',
        explanation: 'Allow wheels to roll freely.',
        checkType: 'handbrake_off'
      },
      {
        stepNumber: 3,
        title: 'Maintain 50 km/h Suburban Pace',
        instruction: 'Accelerate smoothly to suburban cruising speed under 50 km/h.',
        keyPrompt: 'Hold W or Up Arrow',
        explanation: 'Default urban speed limit is 50 km/h in all Australian states.',
        checkType: 'speed_moving'
      },
      {
        stepNumber: 4,
        title: 'Check Rear Mirror Periodically',
        instruction: 'Perform periodic rear-view mirror checks every 8-10 seconds.',
        keyPrompt: 'Press B',
        explanation: 'Regular mirror checks maintain situational awareness of tailgaters and emergency vehicles.',
        checkType: 'look_behind'
      }
    ]
  },
  {
    id: 3,
    badge: 'Season 3',
    title: 'Season 3: School Zones (40 km/h) & Pedestrian Crossings',
    subtitle: 'Vulnerable Road Users, 40 km/h Speed Limit & Zebra Stopping',
    category: 'Vulnerable Road User Safety',
    readTime: '3 min read',
    summary: 'School zones enforce a strict 40 km/h speed limit during operational hours. Exceeding 40 km/h inside a school zone by even 1 km/h is treated as an immediate critical test failure.',
    theory: [
      {
        ruleCode: 'ARR Rule 20',
        ruleTitle: 'Obeying speed limits in school zones',
        description: 'Drivers must not exceed the posted speed limit inside school zones during designated times (typically 8:00–9:30 AM and 2:30–4:00 PM on school days).',
        practicalImpact: 'Slow down BEFORE passing the 40 km/h sign, not after.',
        criticalFailCondition: 'Exceeding 40 km/h in an active school zone.'
      },
      {
        ruleCode: 'ARR Rule 81',
        ruleTitle: 'Giving way to pedestrians at pedestrian (zebra) crossings',
        description: 'A driver approaching a pedestrian crossing must drive at a speed that enables the driver to stop before the crossing, and must stop to give way if a pedestrian is on or about to enter the crossing.',
        practicalImpact: 'Check both sides of the crossing well before arrival.',
        criticalFailCondition: 'Failing to stop for a pedestrian waiting or walking across zebra stripes.'
      }
    ],
    keyRulesToRemember: [
      'Look for the yellow-green school zone signs and road dragon-teeth markings.',
      'Reduce vehicle speed to 35-38 km/h before the school zone boundary.',
      'Watch for children between parked cars and near bus stops.',
      'Come to a complete stop behind the broad white stop line at zebra crossings.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Approach School Zone',
        instruction: 'Hold speed steady under 40 km/h as you approach the school.',
        keyPrompt: 'Feather W / S to regulate 35-38 km/h',
        explanation: '40 km/h maximum speed limit applies strictly between markers.',
        checkType: 'speed_moving'
      },
      {
        stepNumber: 2,
        title: 'Stop for Pedestrian at Zebra Crossing',
        instruction: 'Bring the vehicle to a full and gentle stop before the zebra line.',
        keyPrompt: 'Hold S or Down Arrow to Halt',
        explanation: 'You must yield to pedestrians on or entering pedestrian crossings.',
        checkType: 'speed_stop'
      },
      {
        stepNumber: 3,
        title: 'Resume Safely',
        instruction: 'Once the pedestrian is clear, gently accelerate back up to 40 km/h.',
        keyPrompt: 'Hold W or Up Arrow',
        explanation: 'Never rush pedestrians and ensure crossing is completely clear before moving.',
        checkType: 'speed_moving'
      }
    ]
  },
  {
    id: 4,
    badge: 'Season 4',
    title: 'Season 4: STOP Signs, Transverse Lines & Roundabouts',
    subtitle: 'Zero Speed Mandate at Solid Lines & Clockwise Roundabout Giving Way',
    category: 'Intersection & Priority Rules',
    readTime: '4 min read',
    summary: 'A STOP sign (Rule 67) requires coming to a complete standstill behind the solid transverse line for at least 3 seconds. Rolling stops are illegal and constitute an instant critical failure.',
    theory: [
      {
        ruleCode: 'ARR Rule 67',
        ruleTitle: 'Stopping and giving way at a STOP sign or marking',
        description: 'A driver approaching a STOP sign must stop as near as practicable to, but before, the stop line, and give way to all vehicles in, entering, or approaching the intersection.',
        practicalImpact: 'The car must achieve true 0 km/h speed with visible suspension rebound.',
        criticalFailCondition: 'Rolling through a STOP line without completely stopping (speed > 0 km/h).'
      },
      {
        ruleCode: 'ARR Rule 114',
        ruleTitle: 'Giving way when entering a roundabout',
        description: 'A driver entering a roundabout must give way to any vehicle already in, entering, or approaching the roundabout from the driver\'s right.',
        practicalImpact: 'Look to your right early; give way to vehicles circulating on the roundabout.',
        criticalFailCondition: 'Failing to give way to circulating traffic on the roundabout.'
      }
    ],
    keyRulesToRemember: [
      'Stop completely before the white transverse stop line (0 km/h).',
      'Count 3 full seconds at the stop line while checking left, center, right.',
      'At roundabouts: vehicles travel clockwise; always give way to the right.',
      'Signal right if turning right, signal left before your exit point.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Decelerate Toward STOP Line',
        instruction: 'Apply progressive braking as you approach the intersection.',
        keyPrompt: 'Press S / Down Arrow to Brake',
        explanation: 'Smooth progressive deceleration allows following traffic to react safely.',
        checkType: 'speed_stop'
      },
      {
        stepNumber: 2,
        title: 'Scan Right and Left',
        instruction: 'Check for cross traffic and rear approach while stopped.',
        keyPrompt: 'Press B to Check Mirrors',
        explanation: 'A full scan left, center, right must be completed before moving off.',
        checkType: 'look_behind'
      },
      {
        stepNumber: 3,
        title: 'Indicate Direction if Turning',
        instruction: 'Activate left or right indicator for your intended turn.',
        keyPrompt: 'Press Q for Left or E for Right',
        explanation: 'Must signal continuously until the turn is completed.',
        checkType: 'indicator_left'
      },
      {
        stepNumber: 4,
        title: 'Enter When Clear',
        instruction: 'Accelerate forward smoothly when the intersection is completely clear.',
        keyPrompt: 'Hold W or Up Arrow',
        explanation: 'Commit decisively without hesitating once safe gap is identified.',
        checkType: 'speed_moving'
      }
    ]
  },
  {
    id: 5,
    badge: 'Season 5',
    title: 'Season 5: Reverse Parallel Parking & Securing the Vehicle',
    subtitle: 'Reverse Parallel Maneuver within 1-2 Car Lengths & Parking Alignment',
    category: 'Maneuvers & Vehicle Securing',
    readTime: '4 min read',
    summary: 'The reverse parallel park evaluates your spatial control. The final parking position must be between 300mm and 500mm from the kerb, strictly within the left parking lane, with handbrake and Park (P) engaged.',
    theory: [
      {
        ruleCode: 'ARR Rule 208',
        ruleTitle: 'Parallel parking on a road (except in a median strip)',
        description: 'A driver parking parallel to the kerb must position the vehicle facing in the direction of travel, at least 1 meter from any other vehicle, and within 300-500mm of the left kerb.',
        practicalImpact: 'Never hit the kerb forcefully; parallel parking must be completed in no more than 4 movements.',
        criticalFailCondition: 'Mounting the kerb or colliding with the parking guide vehicle.'
      },
      {
        ruleCode: 'ARR Rule 213',
        ruleTitle: 'Making a motor vehicle secure',
        description: 'Before leaving a stationary vehicle, the driver must turn off the engine, set the parking brake effectively, and put the transmission into Park (P).',
        practicalImpact: 'Always engage handbrake before shifting into Park when finishing.',
        criticalFailCondition: 'Failing to secure handbrake before releasing service brake on gradient.'
      }
    ],
    keyRulesToRemember: [
      'Signal left for at least 5 seconds before pulling over next to the lead car.',
      'Reverse smoothly using 45-degree angle technique.',
      'Check rear window and blind spots constantly while moving backward.',
      'Straighten wheels and align within 30-50cm of the concrete gutter.',
      'Firmly set handbrake (Spacebar) and engage Park (P key).'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Signal Left to Kerb',
        instruction: 'Indicate left to signal your intention to park.',
        keyPrompt: 'Press Q or Left Indicator',
        explanation: 'Informs traffic behind of your intention to pull in.',
        checkType: 'indicator_left'
      },
      {
        stepNumber: 2,
        title: 'Stop Parallel to Target',
        instruction: 'Bring vehicle to a complete stop beside the parking bay.',
        keyPrompt: 'Press S to Halt',
        explanation: 'Position your rear axle in line with the vehicle beside you.',
        checkType: 'speed_stop'
      },
      {
        stepNumber: 3,
        title: 'Engage Reverse and Handbrake Check',
        instruction: 'Check rear view thoroughly before reversing.',
        keyPrompt: 'Press B to Look Behind',
        explanation: 'Must continuously scan 360 degrees while reversing.',
        checkType: 'look_behind'
      },
      {
        stepNumber: 4,
        title: 'Align and Stop at Kerb',
        instruction: 'Bring vehicle to final stop within 30-50cm of the left kerb.',
        keyPrompt: 'Press S / Brake',
        explanation: 'Must be parallel and neatly aligned inside the parking lane.',
        checkType: 'speed_stop'
      },
      {
        stepNumber: 5,
        title: 'Apply Handbrake to Secure',
        instruction: 'Engage parking handbrake firmly.',
        keyPrompt: 'Press Spacebar to Set Handbrake',
        explanation: 'Mandatory vehicle securing under ARR Rule 213.',
        checkType: 'handbrake_on'
      }
    ]
  }
];
