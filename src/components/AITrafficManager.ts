import * as THREE from 'three';
import { HazardType, VehicleState } from '../types';
import { soundManager } from '../utils/audio';

export interface TrafficUpdateResult {
  followingDistanceSecs: number | null;
  hazardStatus: 'passed' | 'failed' | 'in_progress' | null;
  reactionTimeMs: number | null;
  feedback: string | null;
  collisionDetected: string | null;
}

export class AITrafficManager {
  private scene: THREE.Scene;
  private trafficGroup: THREE.Group;

  // 3D AI Entities
  private leadCarGroup: THREE.Group;
  private leadCarTailMat: THREE.MeshStandardMaterial;
  private kerbCarGroup: THREE.Group;
  private kerbCarIndMat: THREE.MeshStandardMaterial;
  private busGroup: THREE.Group;
  private busIndMat: THREE.MeshStandardMaterial;
  private busBeaconMat: THREE.MeshStandardMaterial;
  private cyclistGroup: THREE.Group;
  private oncomingCarGroup: THREE.Group;
  private ambulanceGroup: THREE.Group;
  private ambulanceBlueLight: THREE.MeshStandardMaterial;
  private ambulanceRedLight: THREE.MeshStandardMaterial;
  private jaywalkerGroup: THREE.Group;
  private botUteGroup: THREE.Group;
  private botTaxiGroup: THREE.Group;
  private botTaxiIndMat: THREE.MeshStandardMaterial;

  // AI Vehicle State variables
  private leadCar = { x: -2.25, z: -35, speed: 42, targetSpeed: 42, isBraking: false };
  private kerbCar = { x: -4.1, z: -75, speed: 0, rotY: 0, isMerging: false, blinkTimer: 0 };
  private bus = { x: -4.5, z: -190, speed: 0, rotY: 0, isMerging: false, flashTimer: 0 };
  private cyclist = { x: -3.8, z: -150, speed: 14 };
  private oncomingCar = { x: 2.25, z: -180, speed: 48, rotY: Math.PI, isDrifting: false };
  private ambulance = { x: -2.25, z: 60, speed: 0, isActive: false, passedPlayer: false };
  private jaywalker = { x: -4.5, z: -105, speed: 0, isWalking: false, reachedOtherSide: false };

  // Ambient Autonomous Bot Fleet
  private botUte = { x: -55, z: -270, speed: 36, rotY: Math.PI / 2 };
  private botTaxi = { x: 1.2, z: -170, speed: 40, rotY: 0, isTurning: false, blinkTimer: 0 };

  // Hazard Evaluation Tracking
  private currentHazard: HazardType = 'none';
  private hazardStartTime = 0;
  private playerReactedTime: number | null = null;
  private hazardResolved = false;
  private ambulanceSirenPlaying = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.trafficGroup = new THREE.Group();
    this.scene.add(this.trafficGroup);

    // 1. Build Lead Car (Red Sedan)
    const { group: leadG, tailMat: lTail } = this.buildSedanMesh(0xdc2626);
    this.leadCarGroup = leadG;
    this.leadCarTailMat = lTail;
    this.leadCarGroup.position.set(this.leadCar.x, 0, this.leadCar.z);
    this.trafficGroup.add(this.leadCarGroup);

    // 2. Build Kerb Car (Silver Sedan)
    const { group: kerbG, indMat: kInd } = this.buildSedanMesh(0x94a3b8);
    this.kerbCarGroup = kerbG;
    this.kerbCarIndMat = kInd;
    this.kerbCarGroup.position.set(this.kerbCar.x, 0, this.kerbCar.z);
    this.trafficGroup.add(this.kerbCarGroup);

    // 3. Build Public Bus (Australian Blue/White Transit)
    const { group: bG, indMat: bInd, beaconMat: bBeacon } = this.buildBusMesh();
    this.busGroup = bG;
    this.busIndMat = bInd;
    this.busBeaconMat = bBeacon;
    this.busGroup.position.set(this.bus.x, 0, this.bus.z);
    this.trafficGroup.add(this.busGroup);

    // 4. Build Cyclist
    this.cyclistGroup = this.buildCyclistMesh();
    this.cyclistGroup.position.set(this.cyclist.x, 0, this.cyclist.z);
    this.trafficGroup.add(this.cyclistGroup);

    // 5. Build Oncoming Car (Blue Aussie Sedan)
    const { group: onG } = this.buildSedanMesh(0x2563eb);
    this.oncomingCarGroup = onG;
    this.oncomingCarGroup.position.set(this.oncomingCar.x, 0, this.oncomingCar.z);
    this.oncomingCarGroup.rotation.y = Math.PI;
    this.trafficGroup.add(this.oncomingCarGroup);

    // 6. Build Emergency Ambulance
    const { group: ambG, blueMat, redMat } = this.buildAmbulanceMesh();
    this.ambulanceGroup = ambG;
    this.ambulanceBlueLight = blueMat;
    this.ambulanceRedLight = redMat;
    this.ambulanceGroup.position.set(this.ambulance.x, 0, this.ambulance.z);
    this.trafficGroup.add(this.ambulanceGroup);

    // 7. Build Jaywalker Pedestrian
    this.jaywalkerGroup = this.buildPedestrianMesh(0x0284c7);
    this.jaywalkerGroup.position.set(this.jaywalker.x, 0, this.jaywalker.z);
    this.trafficGroup.add(this.jaywalkerGroup);

    // 8. Build Australian Bot Ute (White utility pickup)
    this.botUteGroup = this.buildUteMesh(0xf8fafc);
    this.botUteGroup.position.set(this.botUte.x, 0, this.botUte.z);
    this.botUteGroup.rotation.y = this.botUte.rotY;
    this.trafficGroup.add(this.botUteGroup);

    // 9. Build Aussie City Bot Taxi (Yellow Falcon style)
    const { group: taxiG, indMat: tInd } = this.buildTaxiMesh();
    this.botTaxiGroup = taxiG;
    this.botTaxiIndMat = tInd;
    this.botTaxiGroup.position.set(this.botTaxi.x, 0, this.botTaxi.z);
    this.trafficGroup.add(this.botTaxiGroup);
  }

  // --- 3D Mesh Builders ---

  private buildUteMesh(bodyColorHex: number) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColorHex, metalness: 0.5, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.5 });
    const rollbarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });

    // Front Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.7, 2.3), bodyMat);
    cab.position.set(0, 0.7, -1.0);
    cab.castShadow = true;
    group.add(cab);

    // Upper Cabin
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 1.4), glassMat);
    roof.position.set(0, 1.3, -0.85);
    roof.castShadow = true;
    group.add(roof);

    // Flatbed Tray (Aussie Ute tray)
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 2.2), trayMat);
    tray.position.set(0, 0.55, 1.05);
    tray.castShadow = true;
    group.add(tray);

    // Rollbar
    const rollbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), rollbarMat);
    rollbar.rotation.z = Math.PI / 2;
    rollbar.position.set(0, 1.25, 0.0);
    group.add(rollbar);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [[-0.95, -1.2], [0.95, -1.2], [-0.95, 1.2], [0.95, 1.2]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.36, wz);
      group.add(w);
    });

    return group;
  }

  private buildTaxiMesh() {
    const { group, indMat } = this.buildSedanMesh(0xeab308); // Vivid Australian Taxi Yellow
    // Add rooftop "TAXI" sign
    const signGeo = new THREE.BoxGeometry(0.6, 0.18, 0.25);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfffbeb, emissiveIntensity: 0.6 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.7, -0.1);
    group.add(sign);
    return { group, indMat };
  }

  private buildSedanMesh(bodyColorHex: number) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColorHex, metalness: 0.6, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.1 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x880000, emissive: 0x880000, emissiveIntensity: 0.5 });
    const indMat = new THREE.MeshStandardMaterial({ color: 0x331a00 });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 4.2), bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.2), glassMat);
    cabin.position.set(0, 1.25, -0.1);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 1.8), bodyMat);
    roof.position.set(0, 1.58, -0.1);
    group.add(roof);

    // Tail lights
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), tailMat);
    tailL.position.set(-0.6, 0.75, 2.12);
    group.add(tailL);

    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), tailMat);
    tailR.position.set(0.6, 0.75, 2.12);
    group.add(tailR);

    // Indicators
    const indR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), indMat);
    indR.position.set(0.82, 0.75, 2.12);
    group.add(indR);

    // 4 Wheels
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    [[-0.92, -1.3], [0.92, -1.3], [-0.92, 1.3], [0.92, 1.3]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.35, wz);
      group.add(w);
    });

    return { group, tailMat, indMat };
  }

  private buildBusMesh() {
    const group = new THREE.Group();
    const busBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.5 }); // Aussie Transit Blue
    const busWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const indMat = new THREE.MeshStandardMaterial({ color: 0x331a00 });
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });

    // Lower chassis (Blue)
    const lower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 9.5), busBodyMat);
    lower.position.y = 0.9;
    lower.castShadow = true;
    group.add(lower);

    // Upper cabin (White)
    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.4, 9.4), busWhiteMat);
    upper.position.y = 2.15;
    upper.castShadow = true;
    group.add(upper);

    // Large passenger windows along side
    const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 8.2), glassMat);
    sideWinL.position.set(-1.19, 2.2, 0);
    group.add(sideWinL);

    const sideWinR = sideWinL.clone();
    sideWinR.position.x = 1.19;
    group.add(sideWinR);

    // Windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.05), glassMat);
    wind.position.set(0, 2.2, -4.72);
    group.add(wind);

    // Official Australian "GIVE WAY" Priority Sign on Rear
    const giveWayCvs = document.createElement('canvas');
    giveWayCvs.width = 256;
    giveWayCvs.height = 128;
    const ctx = giveWayCvs.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(8, 8, 240, 112);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GIVE WAY', 128, 55);
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('BUS PRIORITY', 128, 95);

    const giveWayTex = new THREE.CanvasTexture(giveWayCvs);
    const rearSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      new THREE.MeshBasicMaterial({ map: giveWayTex })
    );
    rearSign.position.set(0, 2.2, 4.76);
    group.add(rearSign);

    // Flashing 40km/h amber beacons on top rear corners
    const beaconL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 12), beaconMat);
    beaconL.position.set(-0.95, 2.9, 4.6);
    group.add(beaconL);

    const beaconR = beaconL.clone();
    beaconR.position.x = 0.95;
    group.add(beaconR);

    // Rear Right Turn Blinker
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), indMat);
    ind.position.set(1.05, 1.2, 4.76);
    group.add(ind);

    // Wheels (6 wheels for bus)
    const wGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    [[-1.2, -3.2], [1.2, -3.2], [-1.2, 2.2], [1.2, 2.2], [-1.2, 3.4], [1.2, 3.4]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.5, wz);
      group.add(w);
    });

    return { group, indMat, beaconMat };
  }

  private buildCyclistMesh() {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

    // Bicycle Wheels
    const wheelGeo = new THREE.TorusGeometry(0.35, 0.04, 8, 20);
    const frontW = new THREE.Mesh(wheelGeo, tireMat);
    frontW.position.set(0, 0.35, -0.6);
    frontW.castShadow = true;
    group.add(frontW);

    const rearW = new THREE.Mesh(wheelGeo, tireMat);
    rearW.position.set(0, 0.35, 0.6);
    rearW.castShadow = true;
    group.add(rearW);

    // Bike Frame (crossbars)
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.75);
    const bar1 = new THREE.Mesh(barGeo, frameMat);
    bar1.rotation.x = Math.PI / 4;
    bar1.position.set(0, 0.55, 0);
    group.add(bar1);

    // Rider Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.25), riderMat);
    torso.position.set(0, 1.15, 0.05);
    torso.rotation.x = 0.2; // leaning slightly forward
    torso.castShadow = true;
    group.add(torso);

    // Head + Helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    head.position.set(0, 1.6, -0.05);
    group.add(head);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), helmetMat);
    helmet.position.set(0, 1.68, -0.05);
    helmet.scale.set(1, 0.6, 1.2);
    group.add(helmet);

    return group;
  }

  private buildAmbulanceMesh() {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a }); // Paramedic Green
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 2.0 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 });

    // Ambulance Box Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 5.0), whiteMat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);

    // Side paramedic chevrons
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 4.8), stripeMat);
    stripeL.position.set(-1.02, 1.2, 0);
    group.add(stripeL);

    const stripeR = stripeL.clone();
    stripeR.position.x = 1.02;
    group.add(stripeR);

    // Front windshield
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 0.05), glassMat);
    wind.position.set(0, 1.4, -2.52);
    group.add(wind);

    // Roof Emergency Strobe Lightbar (alternating Blue and Red)
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    barBase.position.set(0, 2.05, -1.2);
    group.add(barBase);

    const strobeBlue = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.2), blueMat);
    strobeBlue.position.set(-0.35, 2.12, -1.2);
    group.add(strobeBlue);

    const strobeRed = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.2), redMat);
    strobeRed.position.set(0.35, 2.12, -1.2);
    group.add(strobeRed);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.24, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
    [[-1.0, -1.5], [1.0, -1.5], [-1.0, 1.5], [1.0, 1.5]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.4, wz);
      group.add(w);
    });

    return { group, blueMat, redMat };
  }

  private buildPedestrianMesh(shirtColorHex: number) {
    const group = new THREE.Group();
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColorHex, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.5 });

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.2), pantsMat);
    leftLeg.position.set(-0.12, 0.38, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.2), pantsMat);
    rightLeg.position.set(0.12, 0.38, 0);
    group.add(rightLeg);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.28), shirtMat);
    torso.position.set(0, 1.08, 0);
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
    head.position.set(0, 1.52, 0);
    group.add(head);

    return group;
  }

  // --- Hazard Control Interface ---

  public triggerHazard(type: HazardType, playerZ: number) {
    this.currentHazard = type;
    this.hazardStartTime = performance.now();
    this.playerReactedTime = null;
    this.hazardResolved = false;

    if (type === 'sudden_braking') {
      // Reposition lead car directly ahead of player in left lane
      this.leadCar.x = -2.25;
      this.leadCar.z = playerZ - 28;
      this.leadCar.speed = 45;
      this.leadCar.targetSpeed = 0;
      this.leadCar.isBraking = true;
      this.leadCarTailMat.emissiveIntensity = 3.0;
      this.leadCarTailMat.color.setHex(0xff0000);
      soundManager.playBrakeScreech();
    } else if (type === 'kerb_pullout') {
      // Parked car ahead begins merging
      this.kerbCar.x = -4.1;
      this.kerbCar.z = playerZ - 22;
      this.kerbCar.speed = 18;
      this.kerbCar.rotY = -0.25; // angled into lane
      this.kerbCar.isMerging = true;
    } else if (type === 'bus_priority') {
      // Bus prepares to pull out
      this.bus.x = -4.4;
      this.bus.z = playerZ - 25;
      this.bus.speed = 16;
      this.bus.rotY = -0.2;
      this.bus.isMerging = true;
    } else if (type === 'cyclist_overtake') {
      this.cyclist.x = -3.8;
      this.cyclist.z = playerZ - 30;
      this.cyclist.speed = 12;
    } else if (type === 'centerline_drift') {
      this.oncomingCar.x = 2.25;
      this.oncomingCar.z = playerZ - 60;
      this.oncomingCar.speed = 45;
      this.oncomingCar.isDrifting = true;
    } else if (type === 'ambulance_yield') {
      this.ambulance.x = -2.25;
      this.ambulance.z = playerZ + 45;
      this.ambulance.speed = 70;
      this.ambulance.isActive = true;
      this.ambulance.passedPlayer = false;
      if (!this.ambulanceSirenPlaying) {
        soundManager.startSiren();
        this.ambulanceSirenPlaying = true;
      }
    } else if (type === 'jaywalker') {
      this.jaywalker.x = -4.4;
      this.jaywalker.z = playerZ - 20;
      this.jaywalker.speed = 4.0;
      this.jaywalker.isWalking = true;
      this.jaywalker.reachedOtherSide = false;
    }
  }

  public clearHazard() {
    this.currentHazard = 'none';
    this.hazardResolved = true;
    this.leadCar.targetSpeed = 42;
    this.leadCar.isBraking = false;
    this.leadCarTailMat.emissiveIntensity = 0.5;
    this.leadCarTailMat.color.setHex(0x880000);
    this.kerbCar.isMerging = false;
    this.bus.isMerging = false;
    this.oncomingCar.isDrifting = false;
    this.ambulance.isActive = false;
    this.jaywalker.isWalking = false;

    if (this.ambulanceSirenPlaying) {
      soundManager.stopSiren();
      this.ambulanceSirenPlaying = false;
    }
  }

  // --- Per-frame Physics & Hazard Resolution ---

  public update(delta: number, player: VehicleState): TrafficUpdateResult {
    const result: TrafficUpdateResult = {
      followingDistanceSecs: null,
      hazardStatus: null,
      reactionTimeMs: null,
      feedback: null,
      collisionDetected: null
    };

    const now = performance.now();
    const playerSpeedMs = Math.max(0.1, (player.speed * 1000) / 3600);

    // 1. Lead Car Behavior
    if (this.leadCar.isBraking) {
      this.leadCar.speed = Math.max(0, this.leadCar.speed - 55 * delta);
    } else {
      // Cruise forward
      this.leadCar.speed += (this.leadCar.targetSpeed - this.leadCar.speed) * 0.1;
    }
    this.leadCar.z -= (this.leadCar.speed * 1000 / 3600) * delta;
    this.leadCarGroup.position.set(this.leadCar.x, 0, this.leadCar.z);

    // Calculate Following Distance to Lead Car
    const leadGap = player.z - this.leadCar.z - 4.5; // distance bumper to bumper
    if (leadGap > 0 && leadGap < 80 && Math.abs(player.x - this.leadCar.x) < 2.0) {
      result.followingDistanceSecs = Math.max(0, leadGap / playerSpeedMs);
    }

    // 2. Kerb Car Behavior
    if (this.kerbCar.isMerging) {
      this.kerbCar.blinkTimer += delta;
      const blink = Math.sin(this.kerbCar.blinkTimer * 10) > 0;
      this.kerbCarIndMat.color.setHex(blink ? 0xf59e0b : 0x331a00);

      if (this.kerbCar.x < -2.25) {
        this.kerbCar.x += 1.2 * delta;
        this.kerbCar.z -= (this.kerbCar.speed * 1000 / 3600) * delta;
      }
      this.kerbCarGroup.position.set(this.kerbCar.x, 0, this.kerbCar.z);
      this.kerbCarGroup.rotation.y = this.kerbCar.rotY;
    }

    // 3. Bus Behavior
    if (this.bus.isMerging) {
      this.bus.flashTimer += delta;
      const flash = Math.sin(this.bus.flashTimer * 8) > 0;
      this.busIndMat.color.setHex(flash ? 0xf59e0b : 0x331a00);
      this.busBeaconMat.emissiveIntensity = flash ? 2.5 : 0.4;

      if (this.bus.x < -2.25) {
        this.bus.x += 0.8 * delta;
        this.bus.z -= (this.bus.speed * 1000 / 3600) * delta;
      }
      this.busGroup.position.set(this.bus.x, 0, this.bus.z);
    }

    // 4. Cyclist Behavior
    this.cyclist.z -= (this.cyclist.speed * 1000 / 3600) * delta;
    this.cyclistGroup.position.set(this.cyclist.x, 0, this.cyclist.z);

    // 5. Oncoming Car Behavior (Continuous Ambient Autonomous Flow)
    if (this.oncomingCar.isDrifting) {
      if (this.oncomingCar.x > -0.6) {
        this.oncomingCar.x -= 2.0 * delta; // Drifting across centerline into player lane!
      }
    } else {
      this.oncomingCar.x += (2.25 - this.oncomingCar.x) * 0.1;
    }
    this.oncomingCar.z += (this.oncomingCar.speed * 1000 / 3600) * delta;
    // Continuous ambient loop: reset oncoming traffic once it passes behind player
    if (this.oncomingCar.z > player.z + 40 && !this.oncomingCar.isDrifting) {
      this.oncomingCar.z = player.z - 170;
      this.oncomingCar.x = 2.25;
      this.oncomingCar.speed = 46 + Math.random() * 8;
    }
    this.oncomingCarGroup.position.set(this.oncomingCar.x, 0, this.oncomingCar.z);

    // 8. Bot Ute Behavior (Traverses East-West City Cross Branch at z = -270)
    this.botUte.x += (this.botUte.speed * 1000 / 3600) * delta;
    if (this.botUte.x > 65) {
      this.botUte.x = -65;
    }
    this.botUteGroup.position.set(this.botUte.x, 0, this.botUte.z);

    // 9. Bot Taxi Behavior (Drives in Right-Turn Lane, Indicates and turns onto East Branch)
    this.botTaxi.blinkTimer += delta;
    const taxiBlink = Math.sin(this.botTaxi.blinkTimer * 9) > 0;
    this.botTaxiIndMat.color.setHex(taxiBlink ? 0xf59e0b : 0x331a00);

    if (this.botTaxi.z > -265) {
      // Approaching right turn junction
      this.botTaxi.z -= (this.botTaxi.speed * 1000 / 3600) * delta;
      this.botTaxiGroup.rotation.y = 0;
    } else if (this.botTaxi.x < 45) {
      // Turning right onto East Branch Road
      this.botTaxi.isTurning = true;
      this.botTaxi.rotY = Math.min(Math.PI / 2, this.botTaxi.rotY + 1.6 * delta);
      this.botTaxiGroup.rotation.y = this.botTaxi.rotY;
      this.botTaxi.x += (28 * 1000 / 3600) * delta;
    } else {
      // Reset taxi back to north approach
      this.botTaxi.x = 1.2;
      this.botTaxi.z = -170;
      this.botTaxi.rotY = 0;
      this.botTaxiGroup.rotation.y = 0;
    }
    this.botTaxiGroup.position.set(this.botTaxi.x, 0, this.botTaxi.z);

    // Dynamic Following Distance: Check closest vehicle ahead in player's lane
    let closestAheadDist = Infinity;
    const carsAhead = [this.leadCar, this.bus, this.botTaxi];
    carsAhead.forEach(c => {
      const gap = player.z - c.z - 4.5;
      if (gap > 0 && gap < 70 && Math.abs(player.x - c.x) < 2.2) {
        if (gap < closestAheadDist) closestAheadDist = gap;
      }
    });
    if (closestAheadDist < Infinity) {
      result.followingDistanceSecs = Math.max(0, closestAheadDist / playerSpeedMs);
    }

    // Check collisions with ambient bot vehicles
    const botCars = [
      { name: 'Oncoming Blue Sedan', x: this.oncomingCar.x, z: this.oncomingCar.z, w: 2.0, l: 4.4 },
      { name: 'Australian White Ute', x: this.botUte.x, z: this.botUte.z, w: 2.1, l: 4.6 },
      { name: 'City Taxi', x: this.botTaxi.x, z: this.botTaxi.z, w: 2.0, l: 4.4 }
    ];
    for (const b of botCars) {
      if (Math.hypot(player.x - b.x, player.z - b.z) < 2.6) {
        result.collisionDetected = b.name;
        break;
      }
    }

    // 6. Ambulance Behavior
    if (this.ambulance.isActive) {
      // Strobe lights toggle
      const strobe = Math.sin(now * 0.02) > 0;
      this.ambulanceBlueLight.emissiveIntensity = strobe ? 3.0 : 0.2;
      this.ambulanceRedLight.emissiveIntensity = !strobe ? 3.0 : 0.2;

      this.ambulance.z -= (this.ambulance.speed * 1000 / 3600) * delta;
      if (this.ambulance.z < player.z - 5) {
        this.ambulance.passedPlayer = true;
      }
      this.ambulanceGroup.position.set(this.ambulance.x, 0, this.ambulance.z);
    }

    // 7. Jaywalker Pedestrian Behavior
    if (this.jaywalker.isWalking) {
      if (this.jaywalker.x < 3.5) {
        this.jaywalker.x += this.jaywalker.speed * delta;
      } else {
        this.jaywalker.reachedOtherSide = true;
      }
      this.jaywalkerGroup.position.set(this.jaywalker.x, 0, this.jaywalker.z);
    }

    // --- Check Player Hazard Reaction ---
    if (this.currentHazard !== 'none' && !this.hazardResolved) {
      const elapsedMs = now - this.hazardStartTime;

      // Track first reaction (brake applied or indicator or horn)
      if (this.playerReactedTime === null && (player.brake > 0.2 || player.leftIndicator || player.horn)) {
        this.playerReactedTime = elapsedMs;
      }

      // 1. Sudden Braking Hazard Evaluation
      if (this.currentHazard === 'sudden_braking') {
        if (leadGap < 0.5) {
          result.hazardStatus = 'failed';
          result.feedback = 'CRITICAL FAIL: Rear-end collision with lead vehicle! Failed to maintain 3-second cushion (Rule 126).';
          result.collisionDetected = 'Lead Car (Rear-end)';
          this.hazardResolved = true;
        } else if (player.speed < 2 && leadGap >= 2.0) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = `PASSED: Stopped safely with ${(leadGap).toFixed(1)}m buffer. Reaction: ${((this.playerReactedTime || 1000) / 1000).toFixed(2)}s.`;
          this.hazardResolved = true;
        }
      }

      // 2. Kerb Pullout Hazard Evaluation
      else if (this.currentHazard === 'kerb_pullout') {
        const kerbDist = Math.hypot(player.x - this.kerbCar.x, player.z - this.kerbCar.z);
        if (kerbDist < 2.5) {
          result.hazardStatus = 'failed';
          result.feedback = 'CRITICAL FAIL: Collided with merging kerb vehicle!';
          result.collisionDetected = 'Parked Car';
          this.hazardResolved = true;
        } else if (player.z < this.kerbCar.z - 8 && player.speed > 5) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = 'PASSED: Safely slowed down and yielded space to merging vehicle (Rule 144).';
          this.hazardResolved = true;
        }
      }

      // 3. Bus Priority Evaluation
      else if (this.currentHazard === 'bus_priority') {
        const busDist = Math.hypot(player.x - this.bus.x, player.z - this.bus.z);
        if (busDist < 3.2) {
          result.hazardStatus = 'failed';
          result.feedback = 'CRITICAL FAIL: Disobeyed Bus Priority Rule 77 / Collision with bus!';
          result.collisionDetected = 'Public Bus';
          this.hazardResolved = true;
        } else if (player.z > this.bus.z && player.speed < 25) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = 'PASSED: Honoured Australian Bus Priority! Slowed down and allowed bus to merge.';
          this.hazardResolved = true;
        }
      }

      // 4. Cyclist Overtake Evaluation
      else if (this.currentHazard === 'cyclist_overtake') {
        if (Math.abs(player.z - this.cyclist.z) < 3.0) {
          const lateralClearance = Math.abs(player.x - this.cyclist.x);
          if (lateralClearance < 1.0) {
            result.hazardStatus = 'failed';
            result.feedback = `FAILED: Passed cyclist with only ${(lateralClearance).toFixed(2)}m clearance. Minimum 1.0m required under 60km/h (Rule 144-1).`;
            this.hazardResolved = true;
          } else {
            result.hazardStatus = 'passed';
            result.feedback = `PASSED: Excellent safe pass with ${(lateralClearance).toFixed(2)}m lateral clearance!`;
            this.hazardResolved = true;
          }
        }
      }

      // 5. Centerline Drift Evaluation
      else if (this.currentHazard === 'centerline_drift') {
        const distToOncoming = Math.hypot(player.x - this.oncomingCar.x, player.z - this.oncomingCar.z);
        if (distToOncoming < 2.5) {
          result.hazardStatus = 'failed';
          result.feedback = 'CRITICAL FAIL: Head-on collision with oncoming vehicle!';
          result.collisionDetected = 'Oncoming Car';
          this.hazardResolved = true;
        } else if (player.horn || (player.x < -3.0 && player.brake > 0.3)) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = 'PASSED: Responded correctly to head-on hazard! Steered left towards shoulder and warned driver (Rule 125).';
          this.oncomingCar.isDrifting = false; // driver corrects
          this.hazardResolved = true;
        }
      }

      // 6. Ambulance Yield Evaluation
      else if (this.currentHazard === 'ambulance_yield') {
        if (player.leftIndicator && player.x < -3.0 && player.speed < 5) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = 'PASSED: Fully complied with ARR Rule 78: Moved to the left and stopped to let emergency ambulance pass!';
          if (this.ambulanceSirenPlaying) {
            soundManager.stopSiren();
            this.ambulanceSirenPlaying = false;
          }
          this.hazardResolved = true;
        } else if (this.ambulance.passedPlayer && !player.leftIndicator) {
          result.hazardStatus = 'failed';
          result.feedback = 'FAILED: Failed to indicate left and make way for approaching emergency ambulance!';
          this.hazardResolved = true;
        }
      }

      // 7. Jaywalker Evaluation
      else if (this.currentHazard === 'jaywalker') {
        const pedDist = Math.hypot(player.x - this.jaywalker.x, player.z - this.jaywalker.z);
        if (pedDist < 1.8) {
          result.hazardStatus = 'failed';
          result.feedback = 'CRITICAL FAIL: Pedestrian Near-Miss / Collision!';
          result.collisionDetected = 'Pedestrian Jaywalker';
          this.hazardResolved = true;
        } else if (player.speed < 2 && Math.abs(player.z - this.jaywalker.z) < 12) {
          result.hazardStatus = 'passed';
          result.reactionTimeMs = this.playerReactedTime;
          result.feedback = `PASSED: Performed emergency stop for pedestrian. Reaction: ${((this.playerReactedTime || 800) / 1000).toFixed(2)}s.`;
          this.hazardResolved = true;
        }
      }
    }

    return result;
  }

  public dispose() {
    if (this.ambulanceSirenPlaying) {
      soundManager.stopSiren();
    }
    this.scene.remove(this.trafficGroup);
  }
}
