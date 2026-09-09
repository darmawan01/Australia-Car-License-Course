import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, HazardType, VehicleState } from '../types';
import { soundManager } from '../utils/audio';
import { AITrafficManager } from './AITrafficManager';
import { ROAD_CHECKPOINTS } from '../data/checkpointsData';

interface ThreeCanvasProps {
  vehicleState: VehicleState;
  setVehicleState: React.Dispatch<React.SetStateAction<VehicleState>>;
  cameraView: CameraView;
  isLookingBehind?: boolean;
  activeHazard?: HazardType;
  onHazardResolved?: (status: 'passed' | 'failed', reactionTimeMs: number | null, feedback: string) => void;
  onFollowingDistanceUpdate?: (seconds: number | null) => void;
  onAICarCollision?: (objectName: string) => void;
  onSpeedCheck?: (speed: number) => void;
  onKerbCollision?: () => void;
  onZebraStop?: () => void;
  onStopSignHalt?: (duration: number) => void;
  onRoundaboutEnter?: () => void;
  onParkAlignCheck?: (distanceToKerb: number, angleDiff: number) => void;
  isNightMode?: boolean;
  activeCheckpointIndex?: number;
  completedCheckpointIds?: number[];
  onCheckpointPassed?: (checkpointId: number, title: string) => void;
  onCarScreenPosUpdate?: (pos: { x: number; y: number; isVisible: boolean }) => void;
  onLaneDisciplineAlert?: (alert: { type: string; message: string; ruleRef: string }) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  vehicleState,
  setVehicleState,
  cameraView,
  isLookingBehind = false,
  activeHazard = 'none',
  onHazardResolved,
  onFollowingDistanceUpdate,
  onAICarCollision,
  onSpeedCheck,
  onKerbCollision,
  onZebraStop,
  onStopSignHalt,
  onRoundaboutEnter,
  onParkAlignCheck,
  isNightMode = false,
  activeCheckpointIndex = 0,
  completedCheckpointIds = [],
  onCheckpointPassed,
  onCarScreenPosUpdate,
  onLaneDisciplineAlert
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(vehicleState);
  stateRef.current = vehicleState;

  const isLookingBehindRef = useRef(isLookingBehind);
  isLookingBehindRef.current = isLookingBehind;

  const activeHazardRef = useRef(activeHazard);
  activeHazardRef.current = activeHazard;
  const trafficManagerRef = useRef<AITrafficManager | null>(null);

  const activeCheckpointIndexRef = useRef(activeCheckpointIndex);
  activeCheckpointIndexRef.current = activeCheckpointIndex;

  const completedCheckpointsRef = useRef(completedCheckpointIds);
  completedCheckpointsRef.current = completedCheckpointIds;

  const onCheckpointPassedRef = useRef(onCheckpointPassed);
  onCheckpointPassedRef.current = onCheckpointPassed;

  const onCarScreenPosUpdateRef = useRef(onCarScreenPosUpdate);
  onCarScreenPosUpdateRef.current = onCarScreenPosUpdate;

  const onLaneDisciplineAlertRef = useRef(onLaneDisciplineAlert);
  onLaneDisciplineAlertRef.current = onLaneDisciplineAlert;

  const lastLaneAlertTimeRef = useRef<number>(0);
  const lastLaneZoneRef = useRef<'left' | 'center' | 'right'>('left');

  // Track stop durations for stop sign & zebra crossing
  const stopSignTimerRef = useRef<number>(0);
  const zebraTimerRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const carScreenVec = new THREE.Vector3();
    const lastScreenPosTimeRef = { current: 0 };

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x090d16 : 0x82b2e8);
    scene.fog = new THREE.FogExp2(isNightMode ? 0x090d16 : 0x82b2e8, 0.0035);

    // --- Interactive AI Traffic & Australian Hazard Engine ---
    const trafficManager = new AITrafficManager(scene);
    trafficManagerRef.current = trafficManager;
    if (activeHazardRef.current !== 'none') {
      trafficManager.triggerHazard(activeHazardRef.current, stateRef.current.z);
    }

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(isNightMode ? 0x223355 : 0xffffff, isNightMode ? 0.6 : 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(isNightMode ? 0x4466aa : 0xfffaed, isNightMode ? 0.3 : 1.2);
    sunLight.position.set(60, 100, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 350;
    const shadowDist = 80;
    sunLight.shadow.camera.left = -shadowDist;
    sunLight.shadow.camera.right = shadowDist;
    sunLight.shadow.camera.top = shadowDist;
    sunLight.shadow.camera.bottom = -shadowDist;
    scene.add(sunLight);

    // --- Textures & Canvas Helpers ---
    function createSignTexture(type: string): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 256;
      const ctx = cvs.getContext('2d')!;

      if (type === 'stop') {
        // Octagon STOP
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        const r = 120, cx = 128, cy = 128;
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 70px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STOP', 128, 128);
      } else if (type === 'give_way') {
        // Inverted triangle GIVE WAY
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(20, 24);
        ctx.lineTo(236, 24);
        ctx.lineTo(128, 235);
        ctx.closePath();
        ctx.fill();

        ctx.lineWidth = 18;
        ctx.strokeStyle = '#d90429';
        ctx.stroke();

        ctx.fillStyle = '#d90429';
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GIVE', 128, 76);
        ctx.fillText('WAY', 128, 124);
      } else if (type.startsWith('speed_')) {
        // Speed circle: red ring, white background, black speed number
        const num = type.replace('speed_', '');
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 128, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 26;
        ctx.strokeStyle = '#d90429';
        ctx.stroke();

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 100px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num, 128, 134);
      } else if (type === 'school_zone') {
        // Australian School Zone 40
        ctx.fillStyle = '#ffde59';
        ctx.fillRect(8, 8, 240, 240);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(12, 12, 232, 232);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SCHOOL', 128, 42);
        ctx.fillText('ZONE', 128, 68);

        // Circle 40
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 142, 54, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#d90429';
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 50px "Outfit", sans-serif';
        ctx.fillText('40', 128, 158);

        ctx.font = 'bold 16px "Outfit", sans-serif';
        ctx.fillText('8 - 9:30 AM  2:30 - 4 PM', 128, 222);
      } else if (type === 'roundabout') {
        // Yellow Diamond Roundabout Ahead
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(128, 10);
        ctx.lineTo(246, 128);
        ctx.lineTo(128, 246);
        ctx.lineTo(10, 128);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Roundabout circular arrows
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(128, 128, 48, 0, Math.PI * 1.6);
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(128, 70);
        ctx.lineTo(150, 85);
        ctx.lineTo(150, 55);
        ctx.fill();
      } else if (type === 'pedestrian') {
        // Yellow Diamond Pedestrian Crossing
        ctx.fillStyle = '#ffbe0b';
        ctx.beginPath();
        ctx.moveTo(128, 10);
        ctx.lineTo(246, 128);
        ctx.lineTo(128, 246);
        ctx.lineTo(10, 128);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Walking person
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(128, 80, 16, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.fillRect(122, 100, 14, 50); // torso
        // Legs
        ctx.beginPath();
        ctx.moveTo(122, 150); ctx.lineTo(100, 195);
        ctx.moveTo(136, 150); ctx.lineTo(158, 195);
        ctx.lineWidth = 10;
        ctx.stroke();
      } else if (type === 'keep_left') {
        // Australian Keep Left Sign (White rectangle with arrow pointing bottom-left)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 10, 236, 236);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(10, 10, 236, 236);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('KEEP', 128, 55);
        ctx.fillText('LEFT', 128, 92);

        // Arrow pointing down and left
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(160, 130);
        ctx.lineTo(95, 195);
        ctx.stroke();
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(75, 215);
        ctx.lineTo(120, 195);
        ctx.lineTo(95, 160);
        ctx.closePath();
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(cvs);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    }

    // --- Build Australian Road World ---
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Ground Grass / Nature Strips
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: isNightMode ? 0x1a2b1f : 0x4f772d,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    worldGroup.add(ground);

    // Helper to build asphalt road segment
    function createRoadSegment(x: number, z: number, w: number, l: number, rotY = 0) {
      const roadGeo = new THREE.PlaneGeometry(w, l);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x2b2d42,
        roughness: 0.85,
        metalness: 0.15
      });
      const mesh = new THREE.Mesh(roadGeo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = rotY;
      mesh.position.set(x, 0.01, z);
      mesh.receiveShadow = true;
      worldGroup.add(mesh);

      // Add concrete kerbs along both edges
      const kerbGeo = new THREE.BoxGeometry(0.35, 0.25, l);
      const kerbMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
      
      const leftKerb = new THREE.Mesh(kerbGeo, kerbMat);
      leftKerb.position.set(x - w / 2, 0.1, z);
      leftKerb.rotation.y = rotY;
      leftKerb.castShadow = true;
      leftKerb.receiveShadow = true;
      worldGroup.add(leftKerb);

      const rightKerb = new THREE.Mesh(kerbGeo, kerbMat);
      rightKerb.position.set(x + w / 2, 0.1, z);
      rightKerb.rotation.y = rotY;
      rightKerb.castShadow = true;
      rightKerb.receiveShadow = true;
      worldGroup.add(rightKerb);

      // Footpath / Sidewalk
      const pathGeo = new THREE.PlaneGeometry(2.5, l);
      const pathMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
      const leftPath = new THREE.Mesh(pathGeo, pathMat);
      leftPath.rotation.x = -Math.PI / 2;
      leftPath.rotation.z = rotY;
      leftPath.position.set(x - w / 2 - 1.25, 0.12, z);
      leftPath.receiveShadow = true;
      worldGroup.add(leftPath);

      const rightPath = new THREE.Mesh(pathGeo, pathMat);
      rightPath.rotation.x = -Math.PI / 2;
      rightPath.rotation.z = rotY;
      rightPath.position.set(x + w / 2 + 1.25, 0.12, z);
      rightPath.receiveShadow = true;
      worldGroup.add(rightPath);

      return mesh;
    }

    // Main Australian 2-way road (Left-hand drive! Left lane: x = -2.5 to -0.5, Right lane: x = 0.5 to 2.5)
    // Road width: 9 meters (4.5m per direction)
    const ROAD_WIDTH = 9;
    // Extended Main Australian Highway / City Boulevard (z = 40 to -480)
    createRoadSegment(0, -220, ROAD_WIDTH, 480);

    // City Cross Branch Street at z = -270 (Branching west to West Civic and east to East Commerce)
    createRoadSegment(0, -270, ROAD_WIDTH, 180, Math.PI / 2);

    // Cross residential street for parking & turns (at z = -360)
    createRoadSegment(65, -360, ROAD_WIDTH, 130, Math.PI / 2);

    // Helper to generate crisp painted directional lane arrows on bitumen
    function createLaneArrowTexture(type: 'left' | 'straight' | 'right') {
      const cvs = document.createElement('canvas');
      cvs.width = 256; cvs.height = 512;
      const ctx = cvs.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 512);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ffffff';

      if (type === 'straight') {
        ctx.fillRect(116, 170, 24, 280);
        ctx.beginPath();
        ctx.moveTo(128, 60);
        ctx.lineTo(55, 180);
        ctx.lineTo(105, 180);
        ctx.lineTo(105, 200);
        ctx.lineTo(151, 200);
        ctx.lineTo(151, 180);
        ctx.lineTo(201, 180);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'right') {
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(95, 450);
        ctx.lineTo(95, 250);
        ctx.arcTo(95, 150, 195, 150, 70);
        ctx.lineTo(180, 150);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(225, 150);
        ctx.lineTo(158, 90);
        ctx.lineTo(158, 126);
        ctx.lineTo(148, 126);
        ctx.lineTo(148, 174);
        ctx.lineTo(158, 174);
        ctx.lineTo(158, 210);
        ctx.closePath();
        ctx.fill();
      } else if (type === 'left') {
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(161, 450);
        ctx.lineTo(161, 250);
        ctx.arcTo(161, 150, 61, 150, 70);
        ctx.lineTo(76, 150);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(31, 150);
        ctx.lineTo(98, 90);
        ctx.lineTo(98, 126);
        ctx.lineTo(108, 126);
        ctx.lineTo(108, 174);
        ctx.lineTo(98, 174);
        ctx.lineTo(98, 210);
        ctx.closePath();
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // --- Line Markings (Australian Standards AS 1742.2) ---
    // 1. Broken Centerline: z = 20 down to -50 (standard 50 residential)
    for (let z = 20; z >= -50; z -= 7) {
      const lineGeo = new THREE.PlaneGeometry(0.18, 3.5);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.025, z);
      worldGroup.add(line);
    }

    // 2. School Zone 40 Markings & Double Continuous Lines: z = -50 to -115
    // Double solid white line prevents overtaking near school zone
    const doubleLineGeo = new THREE.PlaneGeometry(0.15, 65);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const doubleLeft = new THREE.Mesh(doubleLineGeo, lineMat);
    doubleLeft.rotation.x = -Math.PI / 2;
    doubleLeft.position.set(-0.15, 0.025, -82.5);
    worldGroup.add(doubleLeft);

    const doubleRight = new THREE.Mesh(doubleLineGeo, lineMat);
    doubleRight.rotation.x = -Math.PI / 2;
    doubleRight.position.set(0.15, 0.025, -82.5);
    worldGroup.add(doubleRight);

    // Painted "SCHOOL" & "40" on Australian bitumen
    const schoolTextCvs = document.createElement('canvas');
    schoolTextCvs.width = 512; schoolTextCvs.height = 256;
    const sctx = schoolTextCvs.getContext('2d')!;
    sctx.fillStyle = '#ffffff';
    sctx.font = 'bold 80px "Outfit", sans-serif';
    sctx.textAlign = 'center';
    sctx.fillText('SCHOOL', 256, 110);
    sctx.fillText('40', 256, 210);
    const schoolTextTex = new THREE.CanvasTexture(schoolTextCvs);
    const schoolTextMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.6), new THREE.MeshBasicMaterial({ map: schoolTextTex, transparent: true }));
    schoolTextMesh.rotation.x = -Math.PI / 2;
    // Australian left lane: centered at x = -2.25
    schoolTextMesh.position.set(-2.25, 0.026, -75);
    worldGroup.add(schoolTextMesh);

    // 3. Wombat Pedestrian Crossing (Raised speed platform + Zebra stripes): at z = -140
    // Platform ramp
    const wombatGeo = new THREE.BoxGeometry(ROAD_WIDTH, 0.12, 6);
    const wombatMat = new THREE.MeshStandardMaterial({ color: 0x333748, roughness: 0.9 });
    const wombatPlatform = new THREE.Mesh(wombatGeo, wombatMat);
    wombatPlatform.position.set(0, 0.06, -140);
    wombatPlatform.receiveShadow = true;
    worldGroup.add(wombatPlatform);

    // Zebra white stripes across platform
    for (let x = -ROAD_WIDTH / 2 + 0.6; x <= ROAD_WIDTH / 2 - 0.6; x += 1.0) {
      const stripeGeo = new THREE.PlaneGeometry(0.5, 5);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.13, -140);
      worldGroup.add(stripe);
    }

    // Zig-zag approach markings on Australian road
    [-132, -148].forEach((zPos) => {
      const zigGeo = new THREE.PlaneGeometry(0.2, 8);
      const zigMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const zig = new THREE.Mesh(zigGeo, zigMat);
      zig.rotation.x = -Math.PI / 2;
      zig.position.set(-ROAD_WIDTH / 2 + 0.5, 0.025, zPos);
      worldGroup.add(zig);
    });

    // Twin Belisha beacons / pedestrian poles with yellow balls
    [-ROAD_WIDTH / 2 - 0.4, ROAD_WIDTH / 2 + 0.4].forEach((xPos) => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 16);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(xPos, 1.75, -140);
      pole.castShadow = true;
      worldGroup.add(pole);

      const beaconGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(xPos, 3.6, -140);
      worldGroup.add(beacon);
    });

    // Animated Pedestrian NPC at Zebra Crossing
    const pedGroup = new THREE.Group();
    const pedBodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 12);
    const pedBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const pedBody = new THREE.Mesh(pedBodyGeo, pedBodyMat);
    pedBody.position.y = 1.0;
    pedBody.castShadow = true;
    pedGroup.add(pedBody);

    const pedHeadGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const pedHeadMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d });
    const pedHead = new THREE.Mesh(pedHeadGeo, pedHeadMat);
    pedHead.position.y = 1.85;
    pedHead.castShadow = true;
    pedGroup.add(pedHead);

    pedGroup.position.set(-ROAD_WIDTH / 2 - 0.8, 0.12, -140);
    worldGroup.add(pedGroup);

    // ==========================================
    // 4. CENTER BUS STOP TRANSIT ZONE (z = -180 to -210)
    // ==========================================
    // Indented concrete bus bay pad on the left kerb
    const busBayPadGeo = new THREE.PlaneGeometry(3.8, 26);
    const busBayPadMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.85 });
    const busBayPad = new THREE.Mesh(busBayPadGeo, busBayPadMat);
    busBayPad.rotation.x = -Math.PI / 2;
    busBayPad.position.set(-ROAD_WIDTH / 2 - 1.9, 0.015, -190);
    busBayPad.receiveShadow = true;
    worldGroup.add(busBayPad);

    // Painted yellow "BUS STOP" and safety hatch lines on bitumen
    const busStopTextCvs = document.createElement('canvas');
    busStopTextCvs.width = 512; busStopTextCvs.height = 256;
    const bctx = busStopTextCvs.getContext('2d')!;
    bctx.fillStyle = '#facc15';
    bctx.font = 'bold 72px "Outfit", sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('BUS STOP', 256, 110);
    bctx.lineWidth = 14;
    bctx.strokeStyle = '#facc15';
    bctx.strokeRect(20, 20, 472, 216);
    // diagonal hazard hatch
    for (let hx = 40; hx < 480; hx += 60) {
      bctx.beginPath();
      bctx.moveTo(hx, 20);
      bctx.lineTo(hx + 80, 236);
      bctx.stroke();
    }
    const busStopTex = new THREE.CanvasTexture(busStopTextCvs);
    const busStopMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 16),
      new THREE.MeshBasicMaterial({ map: busStopTex, transparent: true })
    );
    busStopMesh.rotation.x = -Math.PI / 2;
    busStopMesh.position.set(-ROAD_WIDTH / 2 - 1.9, 0.026, -190);
    worldGroup.add(busStopMesh);

    // Modern Glass Bus Shelter (Australian Transit Authority Standard)
    const busShelterGroup = new THREE.Group();
    // Concrete foundation platform
    const platformGeo = new THREE.BoxGeometry(4.5, 0.2, 10);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 0.1, 0);
    busShelterGroup.add(platform);

    // Steel Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    [-1.8, 1.8].forEach(px => {
      [-4.0, 0, 4.0].forEach(pz => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.12), pillarMat);
        pillar.position.set(px, 1.5, pz);
        pillar.castShadow = true;
        busShelterGroup.add(pillar);
      });
    });

    // Glass walls
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1
    });
    const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 8.2), glassMat);
    backGlass.position.set(-1.8, 1.4, 0);
    busShelterGroup.add(backGlass);

    // Curved Canopy Roof
    const roofCurveGeo = new THREE.BoxGeometry(4.8, 0.15, 9.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.4 });
    const busRoof = new THREE.Mesh(roofCurveGeo, roofMat);
    busRoof.position.set(0, 2.9, 0);
    busRoof.castShadow = true;
    busShelterGroup.add(busRoof);

    // Timber passenger bench inside shelter
    const benchGeo = new THREE.BoxGeometry(0.8, 0.45, 4.2);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(-1.2, 0.35, 0);
    bench.castShadow = true;
    busShelterGroup.add(bench);

    // Bus Timetable Totem Pole
    const totem = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.7), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    totem.position.set(1.5, 1.2, 4.2);
    totem.castShadow = true;
    busShelterGroup.add(totem);

    // 2 Waiting Passenger NPCs
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0xe11d48 }));
    p1.position.set(-0.8, 0.8, 0.8);
    busShelterGroup.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    p2.position.set(-0.8, 0.8, -0.8);
    busShelterGroup.add(p2);

    busShelterGroup.position.set(-ROAD_WIDTH / 2 - 4.5, 0, -190);
    worldGroup.add(busShelterGroup);

    // ==========================================
    // 5. CITY MULTI-LANE SECTION & BRANCH ARROWS (z = -230 to -285)
    // ==========================================
    // Bitumen widening to 12.5m to accommodate 3 marked lanes
    const widenGeo = new THREE.PlaneGeometry(12.5, 55);
    const widenMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.85 });
    const widenMesh = new THREE.Mesh(widenGeo, widenMat);
    widenMesh.rotation.x = -Math.PI / 2;
    widenMesh.position.set(0, 0.012, -257.5);
    worldGroup.add(widenMesh);

    // Directional Painted Arrows on Bitumen:
    const leftArrowTex = createLaneArrowTexture('left');
    const straightArrowTex = createLaneArrowTexture('straight');
    const rightArrowTex = createLaneArrowTexture('right');

    const arrowGeo = new THREE.PlaneGeometry(1.5, 3.8);

    // Lane 1 (Left-turn only to West Civic branch, x = -3.6)
    [-242, -260].forEach(zPos => {
      const leftArrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ map: leftArrowTex, transparent: true }));
      leftArrowMesh.rotation.x = -Math.PI / 2;
      leftArrowMesh.position.set(-3.6, 0.026, zPos);
      worldGroup.add(leftArrowMesh);
    });

    // Lane 2 (Straight-ahead to Roundabout, x = -1.2)
    [-242, -260].forEach(zPos => {
      const straightArrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ map: straightArrowTex, transparent: true }));
      straightArrowMesh.rotation.x = -Math.PI / 2;
      straightArrowMesh.position.set(-1.2, 0.026, zPos);
      worldGroup.add(straightArrowMesh);
    });

    // Lane 3 (Right-turn only to East Commerce branch, x = +1.2)
    [-242, -260].forEach(zPos => {
      const rightArrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ map: rightArrowTex, transparent: true }));
      rightArrowMesh.rotation.x = -Math.PI / 2;
      rightArrowMesh.position.set(1.2, 0.026, zPos);
      worldGroup.add(rightArrowMesh);
    });

    // Continuous Solid White Line separating Right-Turn Lane from Center Lane (ARR Rule 147)
    const solidDividerGeo = new THREE.PlaneGeometry(0.18, 50);
    const solidDivider = new THREE.Mesh(solidDividerGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    solidDivider.rotation.x = -Math.PI / 2;
    solidDivider.position.set(0.0, 0.027, -255);
    worldGroup.add(solidDivider);

    // Dashed White Line separating Left-Turn Lane from Center Lane (x = -2.4)
    for (let lz = -230; lz >= -275; lz -= 6) {
      const dashGeo = new THREE.PlaneGeometry(0.15, 3.0);
      const dash = new THREE.Mesh(dashGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(-2.4, 0.027, lz);
      worldGroup.add(dash);
    }

    // Overhead Highway Directional Gantry at z = -236
    const gantryGroup = new THREE.Group();
    // Steel Arch posts
    const gPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
    gPillarL.position.set(-ROAD_WIDTH / 2 - 1.8, 3.75, 0);
    gantryGroup.add(gPillarL);

    const gPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 7.5, 12), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
    gPillarR.position.set(ROAD_WIDTH / 2 + 1.8, 3.75, 0);
    gantryGroup.add(gPillarR);

    const gBeam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 4.2, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
    gBeam.position.set(0, 7.2, 0);
    gantryGroup.add(gBeam);

    // Overhead Australian Green Directional Signboard
    const gantrySignCvs = document.createElement('canvas');
    gantrySignCvs.width = 1024; gantrySignCvs.height = 256;
    const gctx = gantrySignCvs.getContext('2d')!;
    gctx.fillStyle = '#065f46'; // Australian National Highway Green
    gctx.fillRect(8, 8, 1008, 240);
    gctx.lineWidth = 10;
    gctx.strokeStyle = '#ffffff';
    gctx.strokeRect(8, 8, 1008, 240);

    // Text for 3 lanes
    gctx.fillStyle = '#ffffff';
    gctx.font = 'bold 44px "Outfit", sans-serif';
    gctx.textAlign = 'center';
    gctx.fillText('↰ WEST CIVIC', 200, 110);
    gctx.font = 'bold 30px "Outfit", sans-serif';
    gctx.fillText('SHOPS / BUS', 200, 165);

    gctx.font = 'bold 44px "Outfit", sans-serif';
    gctx.fillText('↑ ROUNDABOUT', 512, 110);
    gctx.font = 'bold 30px "Outfit", sans-serif';
    gctx.fillText('CITY CENTRE', 512, 165);

    gctx.font = 'bold 44px "Outfit", sans-serif';
    gctx.fillText('COMMERCE ↱', 820, 110);
    gctx.font = 'bold 30px "Outfit", sans-serif';
    gctx.fillText('RIGHT LANE ONLY', 820, 165);

    // Dividers on sign
    gctx.strokeStyle = '#ffffff';
    gctx.lineWidth = 4;
    gctx.beginPath();
    gctx.moveTo(350, 20); gctx.lineTo(350, 230);
    gctx.moveTo(670, 20); gctx.lineTo(670, 230);
    gctx.stroke();

    const gantrySignTex = new THREE.CanvasTexture(gantrySignCvs);
    const gantrySignMesh = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.6), new THREE.MeshBasicMaterial({ map: gantrySignTex }));
    gantrySignMesh.position.set(0, 6.2, -0.2);
    gantryGroup.add(gantrySignMesh);

    gantryGroup.position.set(0, 0, -236);
    worldGroup.add(gantryGroup);

    // 4-Way Traffic Signal Heads at z = -270 Branch Intersection
    function createTrafficLightGantry(posX: number, posZ: number, rotY: number) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.5, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      pole.position.y = 2.75;
      g.add(pole);

      const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.35), new THREE.MeshStandardMaterial({ color: 0x111827 }));
      headBox.position.set(0, 4.4, 0);
      g.add(headBox);

      // Red, Amber, Green lenses
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 }));
      redLight.position.set(0, 4.75, 0.18);
      g.add(redLight);

      const amberLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0x332200 }));
      amberLight.position.set(0, 4.4, 0.18);
      g.add(amberLight);

      const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: 0x052e16 }));
      greenLight.position.set(0, 4.05, 0.18);
      g.add(greenLight);

      g.position.set(posX, 0, posZ);
      g.rotation.y = rotY;
      worldGroup.add(g);
    }
    createTrafficLightGantry(-ROAD_WIDTH / 2 - 1.2, -263, 0);
    createTrafficLightGantry(ROAD_WIDTH / 2 + 1.2, -263, 0);
    createTrafficLightGantry(-ROAD_WIDTH / 2 - 1.2, -277, Math.PI);
    createTrafficLightGantry(ROAD_WIDTH / 2 + 1.2, -277, Math.PI);

    // 6. STOP Sign and Solid Transverse Stop Line: at z = -285
    // Solid stop line across left lane (approaching roundabout)
    const stopLineGeo = new THREE.PlaneGeometry(ROAD_WIDTH / 2, 0.45);
    const stopLine = new THREE.Mesh(stopLineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(-ROAD_WIDTH / 4, 0.026, -285);
    worldGroup.add(stopLine);

    // Solid yellow kerb line: ARR Rule 169 (No Stopping) along kerb near stop sign
    const yellowKerbGeo = new THREE.PlaneGeometry(0.18, 30);
    const yellowKerbMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const yellowKerb = new THREE.Mesh(yellowKerbGeo, yellowKerbMat);
    yellowKerb.rotation.x = -Math.PI / 2;
    yellowKerb.position.set(-ROAD_WIDTH / 2 + 0.15, 0.026, -285);
    worldGroup.add(yellowKerb);

    // 7. Australian Roundabout (at z = -345)
    // Central Roundabout Island with radius 9m
    const ROUNDABOUT_Z = -345;
    const islandGeo = new THREE.CylinderGeometry(7, 7, 0.45, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x225724, roughness: 0.8 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0.22, ROUNDABOUT_Z);
    island.receiveShadow = true;
    worldGroup.add(island);

    // Roundabout kerb rim
    const rimGeo = new THREE.TorusGeometry(7.1, 0.25, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.2, ROUNDABOUT_Z);
    worldGroup.add(rim);

    // Eucalyptus tree in center of roundabout
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6, 12);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 3, ROUNDABOUT_Z);
    trunk.castShadow = true;
    worldGroup.add(trunk);

    const foliageGeo = new THREE.SphereGeometry(2.6, 12, 12);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(0, 6.5, ROUNDABOUT_Z);
    foliage.castShadow = true;
    worldGroup.add(foliage);

    // Roundabout Circulating Road Ring (Asphalt apron)
    const ringGeo = new THREE.RingGeometry(7.2, 16.5, 36);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.85 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.015, ROUNDABOUT_Z);
    ring.receiveShadow = true;
    worldGroup.add(ring);

    // Broken Give Way lines at entrance to roundabout (at z = -328.5)
    for (let x = -ROAD_WIDTH / 2 + 0.3; x <= -0.5; x += 0.8) {
      const gwDash = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      gwDash.rotation.x = -Math.PI / 2;
      gwDash.position.set(x, 0.026, -328.5);
      worldGroup.add(gwDash);
    }

    // 8. Reverse Parallel Parking Zone (on cross street at x = 35 to 55, z = -360)
    // Painted parking bay with dashed white lines
    const bayGeo = new THREE.PlaneGeometry(2.4, 7);
    const bayBorderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const parkingBay = new THREE.Mesh(bayGeo, bayBorderMat);
    parkingBay.rotation.x = -Math.PI / 2;
    parkingBay.rotation.z = Math.PI / 2;
    parkingBay.position.set(45, 0.026, -360 - ROAD_WIDTH / 2 + 1.3);
    worldGroup.add(parkingBay);

    // Parked NPC car to park behind!
    const npcCarGroup = new THREE.Group();
    const npcBodyGeo = new THREE.BoxGeometry(1.9, 1.2, 4.2);
    const npcBodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    const npcBody = new THREE.Mesh(npcBodyGeo, npcBodyMat);
    npcBody.position.y = 0.75;
    npcBody.castShadow = true;
    npcCarGroup.add(npcBody);

    const npcRoofGeo = new THREE.BoxGeometry(1.6, 0.8, 2.2);
    const npcRoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
    const npcRoof = new THREE.Mesh(npcRoofGeo, npcRoofMat);
    npcRoof.position.set(0, 1.5, -0.2);
    npcCarGroup.add(npcRoof);

    npcCarGroup.rotation.y = Math.PI / 2;
    npcCarGroup.position.set(53, 0, -360 - ROAD_WIDTH / 2 + 1.3);
    worldGroup.add(npcCarGroup);

    // --- Add 3D Australian Road Signs ---
    function placeSign(type: string, x: number, z: number, rotY = 0, scale = 1.3) {
      const signGroup = new THREE.Group();
      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.7, roughness: 0.3 })
      );
      pole.position.y = 1.6;
      pole.castShadow = true;
      signGroup.add(pole);

      // Sign face plate
      const tex = createSignTexture(type);
      const faceGeo = new THREE.PlaneGeometry(1.0 * scale, 1.0 * scale);
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.set(0, 2.5, 0.04);
      face.castShadow = true;
      signGroup.add(face);

      // Back plate
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0 * scale, 1.0 * scale),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 })
      );
      back.position.set(0, 2.5, -0.01);
      back.rotation.y = Math.PI;
      signGroup.add(back);

      signGroup.position.set(x, 0, z);
      signGroup.rotation.y = rotY;
      worldGroup.add(signGroup);
      return signGroup;
    }

    // Place road signs along test course:
    // Start area: Speed 50 default urban limit sign
    placeSign('speed_50', -ROAD_WIDTH / 2 - 1.2, 5, 0);

    // School Zone start: School Zone 40
    placeSign('school_zone', -ROAD_WIDTH / 2 - 1.2, -45, 0, 1.5);

    // School Zone speed 40 reminder & pedestrian crossing ahead
    placeSign('pedestrian', -ROAD_WIDTH / 2 - 1.2, -115, 0);

    // End School Zone / Speed 50
    placeSign('speed_50', -ROAD_WIDTH / 2 - 1.2, -165, 0);

    // STOP Sign before T-intersection
    placeSign('stop', -ROAD_WIDTH / 2 - 1.2, -208, 0, 1.4);

    // Roundabout Ahead Warning Sign
    placeSign('roundabout', -ROAD_WIDTH / 2 - 1.2, -260, 0, 1.3);

    // GIVE WAY Sign at Roundabout Entry
    placeSign('give_way', -ROAD_WIDTH / 2 - 1.2, -282, 0, 1.3);

    // Keep Left Sign on Roundabout Central Island
    placeSign('keep_left', -ROAD_WIDTH / 2 + 1.8, -295, Math.PI / 4, 1.1);

    // --- 3D Holographic Road Checkpoints & Waypoint Arches ---
    interface CheckpointMeshObj {
      id: number;
      outerRing: THREE.Mesh;
      innerRing: THREE.Mesh;
      groundTarget: THREE.Mesh;
      banner: THREE.Mesh;
      outerMat: THREE.MeshStandardMaterial;
      innerMat: THREE.MeshBasicMaterial;
      groundMat: THREE.MeshBasicMaterial;
      targetX: number;
      targetZ: number;
      radius: number;
      passed: boolean;
    }
    const checkpointMeshObjects: CheckpointMeshObj[] = [];

    ROAD_CHECKPOINTS.forEach((cp, idx) => {
      const cpGroup = new THREE.Group();
      cpGroup.position.set(cp.targetX, 0, cp.targetZ);

      // Outer Torus Ring
      const ringRadius = 2.5;
      const outerRingGeo = new THREE.TorusGeometry(ringRadius, 0.09, 12, 36);
      const outerRingMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x00e5ff : 0x0ea5e9,
        emissive: idx === 0 ? 0x00b4d8 : 0x0284c7,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85
      });
      const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      outerRing.position.set(0, 2.3, 0);
      cpGroup.add(outerRing);

      // Inner Counter-Rotating Ring
      const innerRingGeo = new THREE.TorusGeometry(ringRadius - 0.35, 0.05, 12, 32);
      const innerRingMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x38bdf8 : 0x0284c7,
        transparent: true,
        opacity: 0.9
      });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.position.set(0, 2.3, 0);
      cpGroup.add(innerRing);

      // Ground Target Ring
      const groundTargetGeo = new THREE.RingGeometry(0.6, 2.2, 32);
      const groundTargetMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00e5ff : 0x0284c7,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });
      const groundTarget = new THREE.Mesh(groundTargetGeo, groundTargetMat);
      groundTarget.rotation.x = -Math.PI / 2;
      groundTarget.position.set(0, 0.035, 0);
      cpGroup.add(groundTarget);

      // Overhead Floating 3D Checkpoint Canvas Signboard
      const cpCvs = document.createElement('canvas');
      cpCvs.width = 512;
      cpCvs.height = 160;
      const cpCtx = cpCvs.getContext('2d')!;

      cpCtx.fillStyle = '#050c1a';
      cpCtx.fillRect(6, 6, 500, 148);
      cpCtx.lineWidth = 6;
      cpCtx.strokeStyle = idx === 0 ? '#00e5ff' : '#38bdf8';
      cpCtx.strokeRect(6, 6, 500, 148);

      cpCtx.fillStyle = '#ffffff';
      cpCtx.font = 'bold 42px "Outfit", sans-serif';
      cpCtx.textAlign = 'center';
      cpCtx.fillText(`CHECKPOINT ${cp.id}`, 256, 60);

      cpCtx.fillStyle = '#38bdf8';
      cpCtx.font = 'bold 26px "Outfit", monospace';
      cpCtx.fillText(`${cp.speedLimit} km/h • ${cp.title.replace(/Checkpoint \d+: /, '')}`, 256, 112);

      const bannerTex = new THREE.CanvasTexture(cpCvs);
      const bannerGeo = new THREE.PlaneGeometry(3.2, 1.0);
      const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true });
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.set(0, 5.1, 0);
      cpGroup.add(banner);

      worldGroup.add(cpGroup);

      checkpointMeshObjects.push({
        id: cp.id,
        outerRing,
        innerRing,
        groundTarget,
        banner,
        outerMat: outerRingMat,
        innerMat: innerRingMat,
        groundMat: groundTargetMat,
        targetX: cp.targetX,
        targetZ: cp.targetZ,
        radius: cp.radius,
        passed: false
      });
    });

    // --- Aussie Suburban Houses & Gum Trees & Streetlights ---
    // Eucalyptus / Gum trees along road
    for (let z = 30; z >= -270; z -= 25) {
      // Left side trees
      const treeLeft = new THREE.Group();
      const tTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 5, 10),
        new THREE.MeshStandardMaterial({ color: 0xd4c5b9, roughness: 0.9 })
      );
      tTrunk.position.y = 2.5;
      tTrunk.castShadow = true;
      treeLeft.add(tTrunk);

      const tCanopy = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2.4, 1),
        new THREE.MeshStandardMaterial({ color: 0x386641, roughness: 0.8 })
      );
      tCanopy.position.y = 5.2;
      tCanopy.castShadow = true;
      treeLeft.add(tCanopy);

      treeLeft.position.set(-ROAD_WIDTH / 2 - 4.5, 0, z + (Math.random() * 4 - 2));
      worldGroup.add(treeLeft);

      // Right side trees
      const treeRight = treeLeft.clone();
      treeRight.position.set(ROAD_WIDTH / 2 + 4.5, 0, z + (Math.random() * 4 - 2));
      worldGroup.add(treeRight);
    }

    // Australian Suburban Houses
    for (let z = 15; z >= -250; z -= 40) {
      if (Math.abs(z - (-140)) < 15 || Math.abs(z - (-210)) < 15) continue; // Skip intersection & crossing
      [-ROAD_WIDTH / 2 - 12, ROAD_WIDTH / 2 + 12].forEach((xPos, hIdx) => {
        const houseGroup = new THREE.Group();
        // Brick base (Classic Aussie red brick or weatherboard)
        const wallColor = hIdx % 2 === 0 ? 0xb97355 : 0xe2e8f0;
        const walls = new THREE.Mesh(
          new THREE.BoxGeometry(10, 4, 12),
          new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 })
        );
        walls.position.y = 2;
        walls.castShadow = true;
        walls.receiveShadow = true;
        houseGroup.add(walls);

        // Colorbond hip roof
        const roofGeo = new THREE.ConeGeometry(8.5, 3.2, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 5.6;
        roof.castShadow = true;
        houseGroup.add(roof);

        // Mailbox on nature strip
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        post.position.set(hIdx === 0 ? 5 : -5, 0.5, 3);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0xe11d48 }));
        box.position.set(hIdx === 0 ? 5 : -5, 1.1, 3);
        houseGroup.add(post);
        houseGroup.add(box);

        houseGroup.position.set(xPos, 0, z);
        worldGroup.add(houseGroup);
      });
    }

    // Streetlights
    for (let z = 20; z >= -420; z -= 45) {
      const lampGroup = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 }));
      pole.position.y = 3.5;
      pole.castShadow = true;
      lampGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x64748b }));
      arm.rotation.z = Math.PI / 3;
      arm.position.set(1.0, 7.2, 0);
      lampGroup.add(arm);

      if (isNightMode) {
        const light = new THREE.PointLight(0xfff3b0, 1.8, 30);
        light.position.set(2.0, 7.5, 0);
        lampGroup.add(light);
      }

      lampGroup.position.set(-ROAD_WIDTH / 2 - 2, 0, z);
      worldGroup.add(lampGroup);
    }

    // ==========================================
    // 9. CITY BUILDINGS & COMMERCIAL SHOPFRONTS (z = -250 to -310)
    // ==========================================
    // Helper to create storefront text canvas textures
    function createStorefrontSignTexture(text: string, bgColor: string, textColor: string, subText?: string): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512; cvs.height = 128;
      const ctx = cvs.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 128);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(4, 4, 504, 120);

      ctx.fillStyle = textColor;
      ctx.font = 'bold 36px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, subText ? 56 : 74);

      if (subText) {
        ctx.font = 'bold 22px "Outfit", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(subText, 256, 96);
      }

      const tex = new THREE.CanvasTexture(cvs);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // --- WEST CIVIC STREET (x = -18 to -85, z = -270) : Retail & Cafe Strip ---
    // Shop 1: "MELBOURNE SPECIALTY COFFEE" (x = -24, z = -282)
    const cafeGroup = new THREE.Group();
    const cafeWalls = new THREE.Mesh(
      new THREE.BoxGeometry(16, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.6 }) // stylish urban boutique tone
    );
    cafeWalls.position.y = 4;
    cafeWalls.castShadow = true;
    cafeGroup.add(cafeWalls);

    // Large glass shop windows
    const shopGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.45, roughness: 0.1 });
    const shopGlass = new THREE.Mesh(new THREE.BoxGeometry(14, 3.2, 0.2), shopGlassMat);
    shopGlass.position.set(0, 2.2, 7.1);
    cafeGroup.add(shopGlass);

    // Striped Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.4, 2.5), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }));
    awning.position.set(0, 4.2, 8.0);
    awning.rotation.x = 0.2;
    cafeGroup.add(awning);

    // Cafe Signboard
    const cafeSignTex = createStorefrontSignTexture('MELBOURNE COFFEE', '#1e1b4b', '#f59e0b', 'ROASTERY & ESPRESSO');
    const cafeSign = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: cafeSignTex }));
    cafeSign.position.set(0, 5.8, 7.15);
    cafeGroup.add(cafeSign);

    // Outdoor cafe tables on sidewalk
    for (let tx = -4; tx <= 4; tx += 4) {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      table.position.set(tx, 0.4, 8.8);
      cafeGroup.add(table);
    }
    cafeGroup.position.set(-24, 0, -282);
    worldGroup.add(cafeGroup);

    // Shop 2: "CITY CENTRAL PHARMACY" (x = -45, z = -282)
    const pharmGroup = new THREE.Group();
    const pharmWalls = new THREE.Mesh(
      new THREE.BoxGeometry(18, 10, 15),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    pharmWalls.position.y = 5;
    pharmWalls.castShadow = true;
    pharmGroup.add(pharmWalls);

    const pharmSignTex = createStorefrontSignTexture('CITY PHARMACY', '#047857', '#ffffff', 'CHEMIST & HEALTH');
    const pharmSign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshBasicMaterial({ map: pharmSignTex }));
    pharmSign.position.set(0, 6.5, 7.65);
    pharmGroup.add(pharmSign);

    // Illuminated Green Cross on facade
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.9 }));
    crossH.position.set(-6, 7.5, 7.65);
    pharmGroup.add(crossH);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.15), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.9 }));
    crossV.position.set(-6, 7.5, 7.65);
    pharmGroup.add(crossV);

    pharmGroup.position.set(-45, 0, -282);
    worldGroup.add(pharmGroup);

    // Shop 3: "AUSTRALIA POST / RETAIL" (x = -32, z = -256)
    const postGroup = new THREE.Group();
    const postWalls = new THREE.Mesh(
      new THREE.BoxGeometry(16, 9, 14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }) // Australia Post signature red
    );
    postWalls.position.y = 4.5;
    postWalls.castShadow = true;
    postGroup.add(postWalls);

    const postSignTex = createStorefrontSignTexture('AUSTRALIA POST', '#991b1b', '#ffffff', 'POST & BANKING');
    const postSign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.1), new THREE.MeshBasicMaterial({ map: postSignTex }));
    postSign.position.set(0, 6.2, -7.15);
    postSign.rotation.y = Math.PI;
    postGroup.add(postSign);

    postGroup.position.set(-32, 0, -256);
    worldGroup.add(postGroup);

    // --- EAST COMMERCE STREET (x = +18 to +85, z = -270) : Commercial Towers ---
    // Tower 1: 10-Storey Modern Corporate Center (x = 26, z = -285)
    const tower1Group = new THREE.Group();
    const t1Height = 32;
    const t1Body = new THREE.Mesh(
      new THREE.BoxGeometry(18, t1Height, 18),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 })
    );
    t1Body.position.y = t1Height / 2;
    t1Body.castShadow = true;
    tower1Group.add(t1Body);

    // Window grid panels
    for (let wy = 4; wy < t1Height - 2; wy += 3.5) {
      const winStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: isNightMode ? 0.7 : 0.2 })
      );
      winStrip.position.set(0, wy, 9.05);
      tower1Group.add(winStrip);
    }
    const t1SignTex = createStorefrontSignTexture('COMMBANK CENTRE', '#0f172a', '#facc15', 'FINANCIAL TOWER');
    const t1Sign = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), new THREE.MeshBasicMaterial({ map: t1SignTex }));
    t1Sign.position.set(0, t1Height - 3, 9.1);
    tower1Group.add(t1Sign);

    tower1Group.position.set(26, 0, -285);
    worldGroup.add(tower1Group);

    // Tower 2: 16-Storey Glass Skyscraper with Spire (x = 52, z = -285)
    const tower2Group = new THREE.Group();
    const t2Height = 46;
    const t2Body = new THREE.Mesh(
      new THREE.BoxGeometry(20, t2Height, 20),
      new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.85, roughness: 0.15 })
    );
    t2Body.position.y = t2Height / 2;
    t2Body.castShadow = true;
    tower2Group.add(t2Body);

    // Rooftop Communications Mast / Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 12, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    spire.position.y = t2Height + 6;
    spire.castShadow = true;
    tower2Group.add(spire);

    // Red beacon light on spire
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 }));
    beacon.position.y = t2Height + 12;
    tower2Group.add(beacon);

    tower2Group.position.set(52, 0, -285);
    worldGroup.add(tower2Group);

    // Tower 3: Commercial Plaza Office (x = 36, z = -255)
    const tower3Group = new THREE.Group();
    const t3Height = 24;
    const t3Body = new THREE.Mesh(
      new THREE.BoxGeometry(20, t3Height, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.35 })
    );
    t3Body.position.y = t3Height / 2;
    t3Body.castShadow = true;
    tower3Group.add(t3Body);

    const t3SignTex = createStorefrontSignTexture('VIC ROADS HQ', '#0284c7', '#ffffff', 'REGULATORY AUTHORITY');
    const t3Sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshBasicMaterial({ map: t3SignTex }));
    t3Sign.position.set(0, t3Height - 2.5, -8.1);
    t3Sign.rotation.y = Math.PI;
    tower3Group.add(t3Sign);

    tower3Group.position.set(36, 0, -255);
    worldGroup.add(tower3Group);

    // Australian Street Name Blade Signs at Branch Intersection (z = -270)
    function createStreetBladeSign(streetName: string, posX: number, posZ: number, rotY: number) {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      post.position.y = 1.9;
      g.add(post);

      const bcvs = document.createElement('canvas');
      bcvs.width = 256; bcvs.height = 64;
      const bctx = bcvs.getContext('2d')!;
      bctx.fillStyle = '#065f46'; // Australian green council blade
      bctx.fillRect(0, 0, 256, 64);
      bctx.lineWidth = 3;
      bctx.strokeStyle = '#ffffff';
      bctx.strokeRect(2, 2, 252, 60);
      bctx.fillStyle = '#ffffff';
      bctx.font = 'bold 24px "Outfit", sans-serif';
      bctx.textAlign = 'center';
      bctx.fillText(streetName, 128, 40);

      const btex = new THREE.CanvasTexture(bcvs);
      const bladeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: btex, side: THREE.DoubleSide }));
      bladeMesh.position.set(0, 3.5, 0);
      g.add(bladeMesh);

      g.position.set(posX, 0, posZ);
      g.rotation.y = rotY;
      worldGroup.add(g);
    }
    createStreetBladeSign('WEST CIVIC ST', -ROAD_WIDTH / 2 - 1.5, -266, 0);
    createStreetBladeSign('COMMERCE AVE', ROAD_WIDTH / 2 + 1.5, -266, 0);
    createStreetBladeSign('HIGHWAY 1', ROAD_WIDTH / 2 + 1.5, -274, Math.PI / 2);

    // --- DETAILED REALISTIC AUSTRALIAN CAR MODEL ---
    // Right-Hand Drive Sedan (Toyota Camry / Commodore style)
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    // Car Body / Chassis (Glossy Australian Navy or Burgundy or Pearl White)
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d3557, // Deep metallic Australian ocean blue
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    // Lower chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 4.4), bodyMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    carGroup.add(chassis);

    // Front Bonnet / Hood curve
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 1.3), bodyMat);
    hood.position.set(0, 0.95, -1.35);
    hood.rotation.x = 0.08;
    hood.castShadow = true;
    carGroup.add(hood);

    // Cabin / Roof (Sleek curve)
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 2.4), cabinMat);
    cabin.position.set(0, 1.35, 0.1);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Windshield (Front & Rear angled)
    const frontWindshield = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.9),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.1 })
    );
    frontWindshield.rotation.x = -Math.PI / 3;
    frontWindshield.position.set(0, 1.35, -1.05);
    carGroup.add(frontWindshield);

    // Cockpit Interior: RIGHT-HAND DRIVE!
    // Driver seat on the RIGHT (x = 0.4)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), seatMat);
    driverSeat.position.set(0.4, 1.0, 0.05);
    carGroup.add(driverSeat);

    const passengerSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), seatMat);
    passengerSeat.position.set(-0.4, 1.0, 0.05);
    carGroup.add(passengerSeat);

    // Dashboard & Steering Wheel (Rotatable with user input)
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x111827 }));
    dash.position.set(0, 1.1, -0.7);
    carGroup.add(dash);

    // Steering wheel (Torus on the right side)
    const steeringWheelGroup = new THREE.Group();
    steeringWheelGroup.position.set(0.4, 1.25, -0.55);
    steeringWheelGroup.rotation.x = -Math.PI / 6;

    const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), new THREE.MeshStandardMaterial({ color: 0x030712 }));
    steeringWheelGroup.add(wheelRim);
    const wheelSpoke1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36), new THREE.MeshStandardMaterial({ color: 0x374151 }));
    wheelSpoke1.rotation.z = Math.PI / 2;
    steeringWheelGroup.add(wheelSpoke1);
    carGroup.add(steeringWheelGroup);

    // Rearview Mirror & Wing Mirrors
    const rearMirror = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    rearMirror.position.set(0, 1.6, -0.65);
    carGroup.add(rearMirror);

    // Right & Left wing mirrors
    const mirrorRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), bodyMat);
    mirrorRight.position.set(0.95, 1.15, -0.7);
    carGroup.add(mirrorRight);

    const mirrorLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), bodyMat);
    mirrorLeft.position.set(-0.95, 1.15, -0.7);
    carGroup.add(mirrorLeft);

    // Australian License Plates & L/P Plates
    // Front Plate + L-plate
    const plateCvs = document.createElement('canvas');
    plateCvs.width = 256; plateCvs.height = 64;
    const pctx = plateCvs.getContext('2d')!;
    pctx.fillStyle = '#f8fafc';
    pctx.fillRect(0, 0, 256, 64);
    pctx.strokeStyle = '#0284c7';
    pctx.lineWidth = 4;
    pctx.strokeRect(2, 2, 252, 60);
    pctx.fillStyle = '#0284c7';
    pctx.font = 'bold 36px "Outfit", monospace';
    pctx.textAlign = 'center';
    pctx.fillText('VIC • 2026', 128, 44);
    const plateTex = new THREE.CanvasTexture(plateCvs);

    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.16), new THREE.MeshBasicMaterial({ map: plateTex }));
    frontPlate.position.set(0, 0.45, -2.21);
    frontPlate.rotation.y = Math.PI;
    carGroup.add(frontPlate);

    const rearPlate = frontPlate.clone();
    rearPlate.position.set(0, 0.52, 2.21);
    rearPlate.rotation.y = 0;
    carGroup.add(rearPlate);

    // L-plate (Black L on bright yellow square)
    const lPlateCvs = document.createElement('canvas');
    lPlateCvs.width = 128; lPlateCvs.height = 128;
    const lctx = lPlateCvs.getContext('2d')!;
    lctx.fillStyle = '#facc15';
    lctx.fillRect(0, 0, 128, 128);
    lctx.lineWidth = 6;
    lctx.strokeStyle = '#000000';
    lctx.strokeRect(4, 4, 120, 120);
    lctx.fillStyle = '#000000';
    lctx.font = 'bold 95px "Outfit", sans-serif';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText('L', 64, 68);
    const lPlateTex = new THREE.CanvasTexture(lPlateCvs);

    const frontLPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ map: lPlateTex }));
    frontLPlate.position.set(0.48, 0.45, -2.215);
    frontLPlate.rotation.y = Math.PI;
    carGroup.add(frontLPlate);

    const rearLPlate = frontLPlate.clone();
    rearLPlate.position.set(0.48, 0.52, 2.215);
    rearLPlate.rotation.y = 0;
    carGroup.add(rearLPlate);

    // Front Headlights
    const headLightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x444444,
      emissiveIntensity: 0.3
    });
    const headLightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), headLightMat);
    headLightL.position.set(-0.65, 0.65, -2.18);
    carGroup.add(headLightL);

    const headLightR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), headLightMat);
    headLightR.position.set(0.65, 0.65, -2.18);
    carGroup.add(headLightR);

    // Dynamic Headlight Spotlights
    const headSpotL = new THREE.SpotLight(0xffffff, isNightMode ? 5 : 0, 60, Math.PI / 6, 0.4, 1.2);
    headSpotL.position.set(-0.65, 0.65, -2.2);
    headSpotL.target.position.set(-0.65, 0, -25);
    carGroup.add(headSpotL);
    carGroup.add(headSpotL.target);

    const headSpotR = headSpotL.clone();
    headSpotR.position.set(0.65, 0.65, -2.2);
    headSpotR.target.position.set(0.65, 0, -25);
    carGroup.add(headSpotR);
    carGroup.add(headSpotR.target);

    // Rear Taillights (Glow red when brake applied)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x990000,
      emissive: 0x660000,
      emissiveIntensity: 0.8
    });
    const tailLightL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.08), tailMat);
    tailLightL.position.set(-0.65, 0.72, 2.18);
    carGroup.add(tailLightL);

    const tailLightR = tailLightL.clone();
    tailLightR.position.set(0.65, 0.72, 2.18);
    carGroup.add(tailLightR);

    // Reverse Backup Lights (Bright white glow when in Reverse gear)
    const reverseMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    const reverseLightL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), reverseMat);
    reverseLightL.position.set(-0.38, 0.72, 2.18);
    carGroup.add(reverseLightL);

    const reverseLightR = reverseLightL.clone();
    reverseLightR.position.set(0.38, 0.72, 2.18);
    carGroup.add(reverseLightR);

    // Turn Signal Indicators (Amber/Orange blinking)
    const indMatL = new THREE.MeshBasicMaterial({ color: 0x442200 });
    const indMatR = new THREE.MeshBasicMaterial({ color: 0x442200 });

    const indFrontL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), indMatL);
    indFrontL.position.set(-0.85, 0.65, -2.16);
    carGroup.add(indFrontL);

    const indFrontR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), indMatR);
    indFrontR.position.set(0.85, 0.65, -2.16);
    carGroup.add(indFrontR);

    const indRearL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), indMatL);
    indRearL.position.set(-0.85, 0.72, 2.16);
    carGroup.add(indRearL);

    const indRearR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), indMatR);
    indRearR.position.set(0.85, 0.72, 2.16);
    carGroup.add(indRearR);

    // Wheels (4 physical wheels with rubber tires & silver spokes)
    const wheelRadius = 0.38;
    const wheelWidth = 0.24;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMatDetail = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    function createWheelMesh() {
      const g = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      g.add(tire);

      const rimCap = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 12), rimMatDetail);
      rimCap.rotation.z = Math.PI / 2;
      g.add(rimCap);
      return g;
    }

    const frontLeftWheel = createWheelMesh();
    frontLeftWheel.position.set(-0.95, wheelRadius, -1.35);
    carGroup.add(frontLeftWheel);

    const frontRightWheel = createWheelMesh();
    frontRightWheel.position.set(0.95, wheelRadius, -1.35);
    carGroup.add(frontRightWheel);

    const rearLeftWheel = createWheelMesh();
    rearLeftWheel.position.set(-0.95, wheelRadius, 1.35);
    carGroup.add(rearLeftWheel);

    const rearRightWheel = createWheelMesh();
    rearRightWheel.position.set(0.95, wheelRadius, 1.35);
    carGroup.add(rearRightWheel);

    // Initial Car Placement: Parked on the left side of the Australian road (x = -2.5, z = 10) facing forward (-Z)
    carGroup.position.set(stateRef.current.x, 0, stateRef.current.z);
    carGroup.rotation.y = stateRef.current.rotation;

    // --- Blinkers & Pedestrian Animation Clock ---
    let lastTime = performance.now();
    let blinkAccumulator = 0;
    let blinkState = false;
    let pedZPos = -ROAD_WIDTH / 2 - 0.8;
    let pedDir = 1;
    let animFrameId: number;

    // --- Main Physics & Render Loop ---
    const animate = (time: number) => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const cur = { ...stateRef.current };

      // 1. Indicator blinker clock (1.5 Hz frequency)
      blinkAccumulator += delta;
      if (blinkAccumulator >= 0.35) {
        blinkAccumulator = 0;
        blinkState = !blinkState;
        if (cur.leftIndicator || cur.rightIndicator || cur.hazardLights) {
          soundManager.playIndicatorClick(blinkState ? 'on' : 'off');
        }
      }

      // Update indicator material colors
      const isLeftBlinking = (cur.leftIndicator || cur.hazardLights) && blinkState;
      const isRightBlinking = (cur.rightIndicator || cur.hazardLights) && blinkState;
      indMatL.color.setHex(isLeftBlinking ? 0xf59e0b : 0x331a00);
      indMatR.color.setHex(isRightBlinking ? 0xf59e0b : 0x331a00);

      // Brake light glow
      const isBraking = cur.brake > 0.1 || cur.handbrake;
      tailMat.emissiveIntensity = isBraking ? 2.5 : 0.4;
      tailMat.color.setHex(isBraking ? 0xff0000 : 0x880000);

      // Reverse light glow (Bright white when shifted into Reverse)
      const isReversingGear = cur.gear === 'R';
      reverseMat.emissiveIntensity = isReversingGear ? 2.8 : 0.0;
      reverseMat.emissive.setHex(isReversingGear ? 0xffffff : 0x000000);
      reverseMat.color.setHex(isReversingGear ? 0xffffff : 0x222222);

      // Headlight Beam & Spotlight adjustment (Low light 'n', High light 'N', Dim 'm')
      let spotIntensity = 0;
      let spotDistance = 60;
      let spotAngle = Math.PI / 6;
      if (cur.headlightMode === 'high' || cur.highBeams) {
        spotIntensity = 8.0;
        spotDistance = 90;
        spotAngle = Math.PI / 5;
        headLightMat.emissive.setHex(0xffffff);
        headLightMat.emissiveIntensity = 3.2;
      } else if (cur.headlightMode === 'low' || (cur.headlights && cur.headlightMode !== 'dim')) {
        spotIntensity = 4.8;
        spotDistance = 58;
        spotAngle = Math.PI / 6;
        headLightMat.emissive.setHex(0xffffff);
        headLightMat.emissiveIntensity = 1.8;
      } else if (cur.headlightMode === 'dim') {
        spotIntensity = 1.2;
        spotDistance = 22;
        spotAngle = Math.PI / 7;
        headLightMat.emissive.setHex(0xffdfaa);
        headLightMat.emissiveIntensity = 0.8;
      } else {
        spotIntensity = isNightMode ? 2.5 : 0;
        spotDistance = 45;
        headLightMat.emissive.setHex(isNightMode ? 0xffffff : 0x222222);
        headLightMat.emissiveIntensity = isNightMode ? 0.6 : 0.1;
      }
      headSpotL.intensity = spotIntensity;
      headSpotR.intensity = spotIntensity;
      headSpotL.distance = spotDistance;
      headSpotR.distance = spotDistance;
      headSpotL.angle = spotAngle;
      headSpotR.angle = spotAngle;

      // 2. Realistic Driving Vehicle Physics
      const ACCELERATION_RATE = 28; // km/h per second
      const BRAKE_DECEL = 65; // km/h per second
      const NATURAL_DRAG = 8; // coasting drag
      const MAX_SPEED_FORWARD = 110;
      const MAX_SPEED_REVERSE = 25;

      let speedKmh = cur.speed;

      if (cur.gear === 'D') {
        if (cur.throttle > 0 && !cur.handbrake) {
          speedKmh += cur.throttle * ACCELERATION_RATE * delta;
          if (speedKmh > MAX_SPEED_FORWARD) speedKmh = MAX_SPEED_FORWARD;
        } else if (cur.brake > 0) {
          speedKmh -= cur.brake * BRAKE_DECEL * delta;
          if (speedKmh < 0) speedKmh = 0;
        } else {
          // Natural deceleration
          if (speedKmh > 0) {
            speedKmh -= NATURAL_DRAG * delta;
            if (speedKmh < 0) speedKmh = 0;
          }
        }
      } else if (cur.gear === 'R') {
        if (cur.throttle > 0 && !cur.handbrake) {
          speedKmh -= cur.throttle * (ACCELERATION_RATE * 0.7) * delta;
          if (speedKmh < -MAX_SPEED_REVERSE) speedKmh = -MAX_SPEED_REVERSE;
        } else if (cur.brake > 0) {
          speedKmh += cur.brake * BRAKE_DECEL * delta;
          if (speedKmh > 0) speedKmh = 0;
        } else {
          if (speedKmh < 0) {
            speedKmh += NATURAL_DRAG * delta;
            if (speedKmh > 0) speedKmh = 0;
          }
        }
      } else if (cur.gear === 'P' || cur.handbrake) {
        speedKmh *= 0.8;
        if (Math.abs(speedKmh) < 0.1) speedKmh = 0;
      } else if (cur.gear === 'N') {
        if (Math.abs(speedKmh) > 0) {
          speedKmh += (speedKmh > 0 ? -1 : 1) * (NATURAL_DRAG * 0.5) * delta;
        }
      }

      // Steering with vehicle speed factor (Ackermann turning)
      const speedFactor = Math.min(Math.abs(speedKmh) / 30, 1.2);
      const turnRate = cur.steering * (Math.PI * 0.45) * delta * (speedKmh !== 0 ? (speedKmh > 0 ? 1 : -1) : 0);
      let rotation = cur.rotation - turnRate * Math.max(speedFactor, 0.4);

      // Velocity components in world space
      const speedMs = (speedKmh * 1000) / 3600;
      // Moving in direction car is facing (front is -Z in local space)
      const dx = -Math.sin(rotation) * speedMs * delta;
      const dz = -Math.cos(rotation) * speedMs * delta;

      let x = cur.x + dx;
      let z = cur.z + dz;

      // 3. Collision Detection & Kerb Check
      // Calculate whether the vehicle is on drivable asphalt:
      // - Main road: |x| <= 4.8 (widens to 6.4m in multi-lane zone z between -230 and -285)
      // - Bus stop bay: x between -6.8 and 4.8, z between -175 and -205
      // - Branch cross street at z = -270: |x| <= 85.0 && |z - (-270)| <= 5.2
      // - Roundabout at z = -345: hypot(x, z - (-345)) <= 16.8 && hypot(x, z - (-345)) >= 6.8
      // - Cross street at z = -360: x between -5.0 and 70.0 && |z - (-360)| <= 5.2
      const onMainRoad = (z >= -285 && z <= -230) ? Math.abs(x) <= 6.4 : Math.abs(x) <= 4.8;
      const onBusBay = x >= -6.8 && x <= 4.8 && z >= -205 && z <= -175;
      const onBranchStreet = Math.abs(x) <= 85.0 && Math.abs(z - (-270)) <= 5.2;
      const onRoundabout = (Math.hypot(x, z - (-345)) <= 16.8 && Math.hypot(x, z - (-345)) >= 6.8);
      const onCrossParkingStreet = x >= -5.0 && x <= 70.0 && Math.abs(z - (-360)) <= 5.2;

      const isDrivableRoad = onMainRoad || onBusBay || onBranchStreet || onRoundabout || onCrossParkingStreet;
      const isOffroad = !isDrivableRoad;
      if (isOffroad && !cur.isColliding) {
        soundManager.playKerbCollision();
        if (onKerbCollision) onKerbCollision();
      }

      // Check Stop Sign halt: at z between -280 and -290
      if (z < -280 && z > -290 && Math.abs(x) < 4.5) {
        if (Math.abs(speedKmh) < 0.5) {
          stopSignTimerRef.current += delta;
          if (stopSignTimerRef.current >= 3.0 && onStopSignHalt) {
            onStopSignHalt(stopSignTimerRef.current);
          }
        } else {
          stopSignTimerRef.current = 0;
        }
      }

      // Check Zebra crossing pedestrian yield: at z between -135 and -145
      if (z < -135 && z > -145 && Math.abs(x) < 4.0) {
        if (Math.abs(speedKmh) < 1.0) {
          zebraTimerRef.current += delta;
          if (zebraTimerRef.current >= 1.5 && onZebraStop) {
            onZebraStop();
          }
        }
      }

      // Check Roundabout entrance: z ~ -330
      if (z < -325 && z > -335 && onRoundaboutEnter) {
        onRoundaboutEnter();
      }

      // Check Parallel Park Bay: x near 45, z near -360 - ROAD_WIDTH/2 + 1.3
      if (x > 38 && x < 50 && z < -362 && z > -368 && onParkAlignCheck) {
        const kerbDist = Math.abs(z - (-364.5));
        const angleDiff = Math.abs(Math.sin(rotation - Math.PI / 2));
        onParkAlignCheck(kerbDist, angleDiff);
      }

      // Active Lane Discipline Checking in City Multi-Lane Section (z between -235 and -275)
      if (z >= -275 && z <= -235) {
        const inRightTurnLane = x > 0.05 && x < 3.2;
        const inLeftTurnLane = x < -2.45 && x > -5.2;
        const inCenterLane = x >= -2.45 && x <= 0.05;
        const now = Date.now();

        if (inRightTurnLane) {
          // Under ARR Rule 32, right-turn lane MUST turn right. If driver steers left:
          if (cur.steering < -0.22 && (now - lastLaneAlertTimeRef.current > 4000)) {
            lastLaneAlertTimeRef.current = now;
            soundManager.playKerbCollision();
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'wrong_turn_lane',
                message: 'LANE DISCIPLINE INFRACTION: Cannot turn left from marked Right-Turn lane! (ARR Rule 32: Starting a right turn from a multi-lane road).',
                ruleRef: 'ARR Rule 32'
              });
            }
          }
        } else if (inLeftTurnLane) {
          // Under ARR Rule 28, left-turn lane MUST turn left. If driver steers right:
          if (cur.steering > 0.22 && (now - lastLaneAlertTimeRef.current > 4000)) {
            lastLaneAlertTimeRef.current = now;
            soundManager.playKerbCollision();
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'wrong_turn_lane',
                message: 'LANE DISCIPLINE INFRACTION: Cannot turn right from marked Left-Turn lane! (ARR Rule 28: Starting a left turn from a multi-lane road).',
                ruleRef: 'ARR Rule 28'
              });
            }
          }
        }

        // Check crossing continuous solid line between right-turn lane (x > 0) and center lane (x <= 0)
        const currentLaneZone = inRightTurnLane ? 'right' : (inLeftTurnLane ? 'left' : 'center');
        if (lastLaneZoneRef.current === 'right' && currentLaneZone === 'center') {
          if (now - lastLaneAlertTimeRef.current > 4000) {
            lastLaneAlertTimeRef.current = now;
            soundManager.playKerbCollision();
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'solid_line_cross',
                message: 'SOLID LINE INFRACTION: You crossed a continuous solid line separating lanes (ARR Rule 147: Moving from one marked lane to another over continuous line).',
                ruleRef: 'ARR Rule 147'
              });
            }
          }
        }
        lastLaneZoneRef.current = currentLaneZone;
      }

      // 4. Update Three.js meshes
      carGroup.position.set(x, 0, z);
      carGroup.rotation.y = rotation;

      // Front wheels steering visual
      const steerAngle = -cur.steering * 0.55;
      frontLeftWheel.rotation.y = steerAngle;
      frontRightWheel.rotation.y = steerAngle;

      // Rotate wheels rolling
      const rollDistance = (speedMs * delta) / wheelRadius;
      frontLeftWheel.children[0].rotation.x += rollDistance;
      frontRightWheel.children[0].rotation.x += rollDistance;
      rearLeftWheel.children[0].rotation.x += rollDistance;
      rearRightWheel.children[0].rotation.x += rollDistance;

      // Steering wheel interior rotation
      steeringWheelGroup.rotation.z = -cur.steering * Math.PI * 1.5;

      // Calculate RPM for audio
      const baseRpm = 800;
      const currentGearRatio = cur.gear === 'R' ? 30 : Math.max(1, Math.min(5, Math.floor(speedKmh / 25) + 1));
      const gearRpm = (speedKmh % 25) * 160;
      const rpm = cur.engineRunning ? baseRpm + gearRpm + (cur.throttle * 900) : 0;
      soundManager.updateEngineSound(speedKmh, rpm, cur.throttle);

      // Notify parent of speed
      if (onSpeedCheck && Math.abs(speedKmh) > 0) {
        onSpeedCheck(Math.abs(speedKmh));
      }

      // Animate Pedestrian walking across zebra
      pedZPos += pedDir * 2.2 * delta;
      if (pedZPos > ROAD_WIDTH / 2 + 0.8) {
        pedZPos = ROAD_WIDTH / 2 + 0.8;
        pedDir = -1;
      } else if (pedZPos < -ROAD_WIDTH / 2 - 0.8) {
        pedZPos = -ROAD_WIDTH / 2 - 0.8;
        pedDir = 1;
      }
      pedGroup.position.x = pedZPos;

      // Determine Lane: Australian driving is ON THE LEFT (x negative when going forward -Z)
      const currentLane: 'left' | 'right' | 'offroad' = isOffroad
        ? 'offroad'
        : x < 0 ? 'left' : 'right';

      // 5. Camera Management - Focused on the vehicle
      if (isLookingBehindRef.current) {
        // Look Behind Camera: view facing backward
        if (cameraView === 'cockpit') {
          const driverOffset = new THREE.Vector3(0.4, 1.35, 0.05).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
          const lookAtOffset = new THREE.Vector3(0.4, 1.3, 20).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
          camera.position.set(x + driverOffset.x, driverOffset.y, z + driverOffset.z);
          camera.lookAt(x + lookAtOffset.x, lookAtOffset.y, z + lookAtOffset.z);
        } else {
          // Chase / exterior camera placed in front looking back at vehicle and rear traffic
          const cameraDist = 6.5;
          const cameraHeight = 2.6;
          const camX = x - Math.sin(rotation) * cameraDist;
          const camZ = z - Math.cos(rotation) * cameraDist;
          camera.position.lerp(new THREE.Vector3(camX, cameraHeight, camZ), 0.25);
          camera.lookAt(x, 1.35, z + Math.cos(rotation) * 2.5);
        }
      } else if (cameraView === 'chase') {
        // Third person chase behind car - perfectly elevated & centered on the vehicle
        const cameraDist = 6.5;
        const cameraHeight = 2.6;
        const camX = x + Math.sin(rotation) * cameraDist;
        const camZ = z + Math.cos(rotation) * cameraDist;

        camera.position.lerp(new THREE.Vector3(camX, cameraHeight, camZ), 0.18);
        camera.lookAt(x, 1.35, z - Math.cos(rotation) * 2.5);
      } else if (cameraView === 'cockpit') {
        // Driver seat view: RIGHT-HAND DRIVE (x = 0.4, y = 1.35, z = 0.05)
        const driverOffset = new THREE.Vector3(0.4, 1.35, 0.05);
        driverOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

        const lookAtOffset = new THREE.Vector3(0.4, 1.3, -15);
        lookAtOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);

        camera.position.set(x + driverOffset.x, driverOffset.y, z + driverOffset.z);
        camera.lookAt(x + lookAtOffset.x, lookAtOffset.y, z + lookAtOffset.z);
      } else if (cameraView === 'topdown') {
        // Drone tactical view
        camera.position.set(x, 35, z);
        camera.lookAt(x, 0, z);
      } else if (cameraView === 'hood') {
        // Front bumper view
        const hoodOffset = new THREE.Vector3(0, 0.9, -2.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
        camera.position.set(x + hoodOffset.x, hoodOffset.y, z + hoodOffset.z);
        const lookTarget = new THREE.Vector3(0, 0.9, -25).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
        camera.lookAt(x + lookTarget.x, lookTarget.y, z + lookTarget.z);
      }

      // 5.5 Update Checkpoint Rings, Collision, & Screen Coordinate Tracking
      const activeIdx = activeCheckpointIndexRef.current;
      const completedList = completedCheckpointsRef.current;

      checkpointMeshObjects.forEach((cpObj, idx) => {
        const isActive = idx === activeIdx;
        const isPassed = completedList.includes(cpObj.id);

        // Rotate rings & ground target
        cpObj.outerRing.rotation.z += 0.015;
        cpObj.innerRing.rotation.z -= 0.02;
        cpObj.groundTarget.rotation.z += 0.008;

        if (isActive && !isPassed) {
          const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.12;
          cpObj.outerRing.scale.set(pulse, pulse, pulse);
          cpObj.groundTarget.scale.set(pulse, pulse, 1);
          cpObj.outerMat.color.setHex(0x00e5ff);
          cpObj.outerMat.emissive.setHex(0x00b4d8);
          cpObj.innerMat.color.setHex(0x38bdf8);
          cpObj.groundMat.color.setHex(0x00e5ff);
          cpObj.groundMat.opacity = 0.75;
          cpObj.banner.visible = true;

          // Check if car reached this active checkpoint
          const distToCP = Math.hypot(x - cpObj.targetX, z - cpObj.targetZ);
          if (distToCP <= cpObj.radius && !cpObj.passed) {
            cpObj.passed = true;
            soundManager.playLevelPass();
            if (onCheckpointPassedRef.current) {
              onCheckpointPassedRef.current(cpObj.id, ROAD_CHECKPOINTS[idx]?.title || '');
            }
          }
        } else if (isPassed) {
          cpObj.outerRing.scale.set(1, 1, 1);
          cpObj.groundTarget.scale.set(1, 1, 1);
          cpObj.outerMat.color.setHex(0x10b981);
          cpObj.outerMat.emissive.setHex(0x059669);
          cpObj.innerMat.color.setHex(0x34d399);
          cpObj.groundMat.color.setHex(0x10b981);
          cpObj.groundMat.opacity = 0.35;
          cpObj.banner.visible = false;
        } else {
          cpObj.outerRing.scale.set(1, 1, 1);
          cpObj.groundTarget.scale.set(1, 1, 1);
          cpObj.outerMat.color.setHex(0x334155);
          cpObj.outerMat.emissive.setHex(0x1e293b);
          cpObj.innerMat.color.setHex(0x475569);
          cpObj.groundMat.color.setHex(0x334155);
          cpObj.groundMat.opacity = 0.2;
          cpObj.banner.visible = false;
        }
      });

      // Project car roof to 2D screen coordinates for CarTopGuideSlideshow
      if (onCarScreenPosUpdateRef.current && (Date.now() - lastScreenPosTimeRef.current > 35)) {
        lastScreenPosTimeRef.current = Date.now();
        carScreenVec.set(x, 2.3, z);
        carScreenVec.project(camera);
        const isVisible = carScreenVec.z < 1;
        const screenX = (carScreenVec.x * 0.5 + 0.5) * width;
        const screenY = (-carScreenVec.y * 0.5 + 0.5) * height;
        onCarScreenPosUpdateRef.current({ x: screenX, y: screenY, isVisible });
      }

      // 6. Update AI Traffic & Hazard Reactions
      if (trafficManagerRef.current) {
        const trafficResult = trafficManagerRef.current.update(delta, {
          ...cur,
          x,
          z,
          rotation,
          speed: speedKmh
        });

        if (trafficResult.followingDistanceSecs !== null && onFollowingDistanceUpdate) {
          onFollowingDistanceUpdate(trafficResult.followingDistanceSecs);
        }
        if (trafficResult.hazardStatus && onHazardResolved) {
          onHazardResolved(
            trafficResult.hazardStatus === 'passed' ? 'passed' : 'failed',
            trafficResult.reactionTimeMs,
            trafficResult.feedback || ''
          );
        }
        if (trafficResult.collisionDetected && onAICarCollision) {
          onAICarCollision(trafficResult.collisionDetected);
        }
      }

      // Update React vehicle state if values changed meaningfully
      if (
        Math.abs(cur.speed - speedKmh) > 0.1 ||
        cur.currentLane !== currentLane ||
        cur.isColliding !== isOffroad ||
        cur.indicatorsBlinkState !== blinkState
      ) {
        setVehicleState(prev => ({
          ...prev,
          x,
          z,
          rotation,
          speed: Math.round(speedKmh * 10) / 10,
          rpm: Math.round(rpm),
          currentLane,
          isColliding: isOffroad,
          indicatorsBlinkState: blinkState
        }));
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (trafficManagerRef.current) {
        trafficManagerRef.current.dispose();
        trafficManagerRef.current = null;
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraView, isNightMode, setVehicleState]);

  // Sync hazard state dynamically with the AI traffic manager
  useEffect(() => {
    if (trafficManagerRef.current) {
      if (activeHazard !== 'none') {
        trafficManagerRef.current.triggerHazard(activeHazard, stateRef.current.z);
      } else {
        trafficManagerRef.current.clearHazard();
      }
    }
  }, [activeHazard]);

  return (
    <div
      ref={containerRef}
      id="three-driving-canvas"
      className="w-full h-full relative cursor-crosshair overflow-hidden select-none"
    />
  );
};
