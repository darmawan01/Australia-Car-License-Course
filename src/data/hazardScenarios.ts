import { HazardScenarioDef, HazardType } from '../types';

export const AUSTRALIAN_HAZARDS: HazardScenarioDef[] = [
  {
    id: 'sudden_braking',
    name: 'Sudden Emergency Braking (3-Second Rule)',
    description: 'The vehicle travelling directly ahead in your lane slams on its brakes unexpectedly for an obstruction.',
    triggerPrompt: 'HAZARD: The red car ahead is braking sharply! Apply brakes immediately and maintain a safe stopping cushion.',
    dktReference: 'DKT FD001 / FD037: Maintain at least a 3-second gap under normal conditions, 4 seconds at night or in rain.',
    correctReaction: 'Brake firmly without locking wheels or colliding; maintain minimum 1 car-length distance when stopped.',
    penaltyOnFail: 'Critical Fail: Tailgating / Rear-end Collision'
  },
  {
    id: 'kerb_pullout',
    name: 'Parked Car Pulling Out with Right Indicator',
    description: 'A parked vehicle on the left nature strip turns on its right indicator and begins merging into your path without giving way.',
    triggerPrompt: 'HAZARD: Parked sedan pulling out from kerb ahead! Scan its blinker, reduce speed, and yield space.',
    dktReference: 'DKT ND002: Check for parked vehicles with turn signals on or car doors opening.',
    correctReaction: 'Ease off throttle, brake gently, and hold lane position or safely overtake if road ahead is clear.',
    penaltyOnFail: 'Critical Fail: Failure to anticipate merging hazard'
  },
  {
    id: 'bus_priority',
    name: 'Bus Priority (Give Way to Merging Bus)',
    description: 'A public route bus is pulling out from an Australian bus stop bay in a 50/60 km/h zone with its right blinker active.',
    triggerPrompt: 'HAZARD: Public Bus indicating to enter traffic flow! In Australia, buses have legal priority in 50–60 km/h zones.',
    dktReference: 'DKT CG031: In a 60km/h zone or lower, drivers MUST slow down and give way to a bus signalling to pull out from a kerb.',
    correctReaction: 'Slow down smoothly, do not accelerate to cut off the bus, and yield the lane to allow it to merge.',
    penaltyOnFail: 'Critical Fail: Disobeying Bus Priority Rule (ARR Rule 77)'
  },
  {
    id: 'cyclist_overtake',
    name: 'Cyclist on Roadway (Minimum 1m Clearance)',
    description: 'A bicycle rider is pedalling along the left road edge. You must judge passing distance safely.',
    triggerPrompt: 'HAZARD: Cyclist ahead on left shoulder! Australian law requires minimum 1.0m clearance when passing (1.5m if >60km/h).',
    dktReference: 'DKT BI001 / BI003: Must give at least 1.0m space; you may cross continuous dividing lines only if clear and safe.',
    correctReaction: 'Slow down behind the cyclist until oncoming traffic is clear, then indicate and pass with >1m margin.',
    penaltyOnFail: 'Minor Fault: Insufficient cyclist clearance (<1 metre)'
  },
  {
    id: 'jaywalker',
    name: 'Pedestrian Stepping Out from Blind Spot',
    description: 'A pedestrian suddenly jogs out between parked cars towards the center of the road.',
    triggerPrompt: 'HAZARD: Pedestrian entering the roadway unexpectedly! Drivers must give way if there is any risk of collision.',
    dktReference: 'DKT PD016 / PD024: A driver must give way to pedestrians at all times if there is danger of a collision, even outside crossings.',
    correctReaction: 'Brake promptly to a stop or safe speed until the pedestrian is completely clear of your lane.',
    penaltyOnFail: 'Critical Fail: Dangerous Driving / Pedestrian Near Miss'
  },
  {
    id: 'centerline_drift',
    name: 'Oncoming Vehicle Drifting Across Centerline',
    description: 'An oncoming vehicle drifts over the unbroken white dividing line directly into your path.',
    triggerPrompt: 'HAZARD: Oncoming driver crossing the centerline! Brake, move left toward the shoulder, and sound horn.',
    dktReference: 'DKT CG043: If oncoming car crosses the centre line: brake, look for room to the left, sound horn and flash lights.',
    correctReaction: 'Brake immediately, steer towards the left kerb margin, and sound the horn [H] to warn the erratic driver.',
    penaltyOnFail: 'Critical Fail: Head-on Collision'
  },
  {
    id: 'ambulance_yield',
    name: 'Emergency Ambulance Approaching from Behind',
    description: 'An ambulance with flashing emergency lights and siren approaches rapidly in your rear mirror.',
    triggerPrompt: 'HAZARD: Emergency siren approaching from rear! Check mirrors, indicate left, and move over to let it pass.',
    dktReference: 'DKT CG090 / CG094: Move to the left lane or road shoulder and safely stop or slow down until the emergency vehicle passes.',
    correctReaction: 'Indicate left [Q], steer to the left side of the lane, and brake to a standstill to let the ambulance pass.',
    penaltyOnFail: 'Critical Fail: Failing to Make Way for Emergency Vehicle'
  }
];

export interface DKTQuizItem {
  id: string;
  category: string;
  code: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const OFFICIAL_DKT_QUESTIONS: DKTQuizItem[] = [
  {
    id: 'dkt_1',
    category: 'Intersections & Give Way',
    code: 'IN003',
    question: 'When making a right-hand turn at an intersection with oncoming traffic, you must give way to:',
    options: [
      'An oncoming vehicle going straight ahead or turning left, and any vehicle on your right',
      'A vehicle approaching from your left and intending to turn right',
      'Only pedestrians'
    ],
    correctIndex: 0,
    explanation: 'When turning right, you must give way to all oncoming traffic going straight or turning left, plus traffic approaching from your right.'
  },
  {
    id: 'dkt_2',
    category: 'Emergency Vehicles',
    code: 'CG090 / CG094',
    question: 'You hear the siren of an ambulance or police vehicle approaching you from behind. You should:',
    options: [
      'Move to the left lane or road shoulder and make way for the emergency vehicle',
      'Slow down to the speed of other traffic and maintain your lane',
      'Continue at the same speed and sound your horn'
    ],
    correctIndex: 0,
    explanation: 'By law (ARR Rule 78), drivers must move as far left as safely practical to give clear passage to emergency vehicles with flashing lights or sirens.'
  },
  {
    id: 'dkt_3',
    category: 'Bicycle Safety',
    code: 'BI001',
    question: 'You are driving on a road with a speed limit of 60 km/h or less. How much space must you leave when passing a bicycle rider?',
    options: [
      'At least 1 metre',
      'At least 1.5 metres',
      'As much as you think is safe'
    ],
    correctIndex: 0,
    explanation: 'In Australian states, drivers must leave at least 1 metre clearance when passing a cyclist on roads up to 60 km/h, and at least 1.5 metres on roads over 60 km/h.'
  },
  {
    id: 'dkt_4',
    category: 'General Knowledge',
    code: 'CG031',
    question: 'You are driving in a 60 km/h zone. A bus ahead signals its intention to pull out from a bus stop. You should:',
    options: [
      'Slow down, and give way to the bus as it has priority',
      'Sound your horn to stop the bus from pulling out',
      'Continue at your normal speed as the bus does not have priority'
    ],
    correctIndex: 0,
    explanation: 'Buses with the priority Give Way sign have legal right of way when pulling out from a stop in built-up areas where the speed limit is 60 km/h or less.'
  },
  {
    id: 'dkt_5',
    category: 'Defensive Driving',
    code: 'FD001 / FD037',
    question: 'Under good conditions, when driving behind any vehicle at any speed, you should:',
    options: [
      'Stay at least three seconds behind the vehicle in front of you',
      'Stay one second behind the vehicle in front of you',
      'Drive as close to the vehicle in front as possible'
    ],
    correctIndex: 0,
    explanation: 'The 3-second rule provides a safe crash-avoidance space cushion for observation, perception delay, and stopping distance.'
  },
  {
    id: 'dkt_6',
    category: 'Traffic Signs & Stop Lines',
    code: 'IN027 / SI051',
    question: 'You drive up to an intersection displaying a STOP sign. You must stop:',
    options: [
      'Even when there is no other traffic, completely behind the solid line',
      'Only if there is a car on your right or left',
      'Only if there is danger of a collision'
    ],
    correctIndex: 0,
    explanation: 'A STOP sign requires a 100% stationary halt before the stop line, even at empty intersections with zero traffic.'
  },
  {
    id: 'dkt_7',
    category: 'Pedestrians',
    code: 'PD005',
    question: 'A vehicle ahead of you has stopped at a marked pedestrian crossing. You:',
    options: [
      'Must not overtake the stopped vehicle',
      'May overtake the vehicle if there are no pedestrians visible',
      'May overtake provided no cars are coming the other way'
    ],
    correctIndex: 0,
    explanation: 'You must NEVER overtake a vehicle that has stopped or slowed at a pedestrian or school crossing, as pedestrians may be obscured.'
  },
  {
    id: 'dkt_8',
    category: 'Roundabouts',
    code: 'IN058',
    question: 'When you wish to turn left at a roundabout, how should you indicate?',
    options: [
      'Indicate left on approach, and keep indicating left until you have exited',
      'Only indicate after you enter the roundabout',
      'Indicating is only required if other vehicles are waiting'
    ],
    correctIndex: 0,
    explanation: 'When turning left at an Australian roundabout, indicate left on approach from the left lane and continue indicating left through the exit.'
  }
];
