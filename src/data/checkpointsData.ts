import { RoadCheckpoint } from '../types';

export const ROAD_CHECKPOINTS: RoadCheckpoint[] = [
  {
    id: 1,
    title: 'Checkpoint 1: Kerb Departure & Signal',
    shortDesc: 'Disengage handbrake [P], shift to Drive [4 or D], signal right [E or O] for 5s, press [W or I] to accelerate.',
    targetX: -2.25,
    targetZ: -15,
    radius: 7,
    speedLimit: 50,
    hint: 'Release Handbrake [P], select Drive [4/D], indicate right [E/O], and tap [W/I] to accelerate.',
    requiredGear: 'D',
    keyInstructions: ['P Release', '4 / D Shift', 'E / O Signal', 'W / I Gas']
  },
  {
    id: 2,
    title: 'Checkpoint 2: Keep-Left Suburban Lane (50 km/h)',
    shortDesc: 'Maintain Australian left lane position between 40-50 km/h without crossing the centreline.',
    targetX: -2.25,
    targetZ: -55,
    radius: 7,
    speedLimit: 50,
    hint: 'Steer using [A/D] or [J/L]. Keep centered safely in the left lane.',
    requiredGear: 'D',
    keyInstructions: ['A / J Steer L', 'D / L Steer R', 'W / I Cruise']
  },
  {
    id: 3,
    title: 'Checkpoint 3: School Zone Entry (40 km/h)',
    shortDesc: 'School Zone 40 begins! Tap [S] or [K] or Space to drop speed below 40 km/h.',
    targetX: -2.25,
    targetZ: -95,
    radius: 7,
    speedLimit: 40,
    hint: 'Decelerate now! Use foot brake [S / K] to reduce speed below 40 km/h before the sign.',
    requiredGear: 'D',
    keyInstructions: ['S / K Brake', 'Speed < 40']
  },
  {
    id: 4,
    title: 'Checkpoint 4: Wombat Pedestrian Zebra Crossing',
    shortDesc: 'Approach raised platform crossing at z = -140. Yield to crossing pedestrians (ARR Rule 81).',
    targetX: -2.25,
    targetZ: -140,
    radius: 7,
    speedLimit: 40,
    hint: 'If pedestrian is on the zebra crossing, press [S / K] to stop completely until clear.',
    requiredGear: 'D',
    keyInstructions: ['S / K Yield', 'Scan Both Sides']
  },
  {
    id: 5,
    title: 'Checkpoint 5: City Transit Zone & Center Bus Stop',
    shortDesc: 'Pass city center bus stop bay. Yield to departing transit buses with flashing blinkers (ARR Rule 77).',
    targetX: -2.25,
    targetZ: -190,
    radius: 7,
    speedLimit: 50,
    hint: 'City bus bay ahead! If public bus indicates right to merge, slow down and yield.',
    requiredGear: 'D',
    keyInstructions: ['Watch Bus Bay', 'Yield ARR 77']
  },
  {
    id: 6,
    title: 'Checkpoint 6: City Branch & Lane Discipline (ARR 28/32)',
    shortDesc: 'Observe painted lane arrows on bitumen. Left=Turn Left, Center=Straight, Right=Turn Right only.',
    targetX: -1.2,
    targetZ: -250,
    radius: 7,
    speedLimit: 40,
    hint: 'Obey lane markers! If you enter Right Lane you MUST turn right; turning left from right lane is prohibited.',
    requiredGear: 'D',
    keyInstructions: ['Obey Lane Arrows', 'No Illegal Turns']
  },
  {
    id: 7,
    title: 'Checkpoint 7: STOP Sign Transverse Line',
    shortDesc: 'Solid white stop line at z = -285. Bring vehicle to a full 3-second standstill before moving.',
    targetX: -2.25,
    targetZ: -285,
    radius: 6,
    speedLimit: 40,
    hint: 'Hold [S] or [K] or Space until speed is 0 km/h behind the line. Check traffic both ways.',
    requiredGear: 'D',
    keyInstructions: ['S / K Stop (0 km/h)', 'Hold 3s']
  },
  {
    id: 8,
    title: 'Checkpoint 8: Australian Roundabout Entry',
    shortDesc: 'Enter clockwise. Give way to circulating vehicles on your right. Signal left [Q / U] to exit.',
    targetX: -2.25,
    targetZ: -345,
    radius: 8,
    speedLimit: 30,
    hint: 'Slow to 20-25 km/h. Steer clockwise around island, press [Q / U] to indicate left when leaving.',
    requiredGear: 'D',
    keyInstructions: ['Q / U Exit Signal', 'A/D Turn']
  },
  {
    id: 9,
    title: 'Checkpoint 9: Drive Test Finish Line',
    shortDesc: 'Course completion! Drive through final gate and bring car to complete stop in Park [1 / P].',
    targetX: -2.25,
    targetZ: -420,
    radius: 8,
    speedLimit: 50,
    hint: 'Cross the finish line! Shift to Park [1 / P] and engage handbrake to finish the test run.',
    requiredGear: 'P',
    keyInstructions: ['Cross Line', '1 / P Secure']
  }
];
