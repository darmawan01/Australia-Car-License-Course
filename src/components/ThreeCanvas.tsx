import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraView, CourseEnvironment, HazardType, VehicleState } from '../types';
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
  environment?: CourseEnvironment;
  activeCheckpointIndex?: number;
  completedCheckpointIds?: number[];
  onCheckpointPassed?: (checkpointId: number, title: string) => void;
  onCarScreenPosUpdate?: (pos: { x: number; y: number; isVisible: boolean }) => void;
  onLaneDisciplineAlert?: (alert: { type: string; message: string; ruleRef: string }) => void;
  resetSignal?: number;
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
  environment,
  activeCheckpointIndex = 0,
  completedCheckpointIds = [],
  onCheckpointPassed,
  onCarScreenPosUpdate,
  onLaneDisciplineAlert,
  resetSignal
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dedicated continuous physics simulation state (never clobbered by asynchronous React re-renders)
  const physicsRef = useRef({
    x: vehicleState.x,
    z: vehicleState.z,
    rotation: vehicleState.rotation,
    speed: vehicleState.speed,
    rpm: vehicleState.rpm,
    steering: vehicleState.steering,
    throttle: vehicleState.throttle,
    brake: vehicleState.brake,
    gear: vehicleState.gear,
    handbrake: vehicleState.handbrake,
    leftIndicator: vehicleState.leftIndicator,
    rightIndicator: vehicleState.rightIndicator,
    hazardLights: vehicleState.hazardLights,
    headlights: vehicleState.headlights,
    highBeams: vehicleState.highBeams,
    headlightMode: vehicleState.headlightMode,
    engineRunning: vehicleState.engineRunning,
    currentLane: vehicleState.currentLane,
    isColliding: vehicleState.isColliding,
    indicatorsBlinkState: vehicleState.indicatorsBlinkState
  });

  const lastResetSignalRef = useRef<number | undefined>(resetSignal);
  const cameraSnapNeededRef = useRef<boolean>(true);
  const triggeredCheckpointsRef = useRef<Set<number>>(new Set(completedCheckpointIds));
  const lastStateSyncTimeRef = useRef<number>(0);
  const offroadDurationRef = useRef<number>(0);

  // Synchronize triggered checkpoints when completed list changes
  useEffect(() => {
    triggeredCheckpointsRef.current = new Set(completedCheckpointIds);
  }, [completedCheckpointIds]);

  // Handle explicit teleport/level reset signal
  useEffect(() => {
    if (resetSignal !== undefined && resetSignal !== lastResetSignalRef.current) {
      lastResetSignalRef.current = resetSignal;
      physicsRef.current.x = vehicleState.x;
      physicsRef.current.z = vehicleState.z;
      physicsRef.current.rotation = vehicleState.rotation;
      physicsRef.current.speed = vehicleState.speed;
      physicsRef.current.gear = vehicleState.gear;
      physicsRef.current.handbrake = vehicleState.handbrake;
      physicsRef.current.throttle = 0;
      physicsRef.current.brake = 0;
      physicsRef.current.steering = 0;
      cameraSnapNeededRef.current = true;
      triggeredCheckpointsRef.current = new Set(completedCheckpointIds);
      offroadDurationRef.current = 0;
      stopSignTimerRef.current = 0;
      zebraTimerRef.current = 0;
      trafficManagerRef.current?.resetPositions(vehicleState.x, vehicleState.z, vehicleState.rotation);
    }
  }, [resetSignal, vehicleState.x, vehicleState.z, vehicleState.rotation, vehicleState.speed, vehicleState.gear, vehicleState.handbrake, completedCheckpointIds]);

  // Seamlessly update driver control inputs without touching running physics position
  useEffect(() => {
    physicsRef.current.steering = vehicleState.steering;
    physicsRef.current.throttle = vehicleState.throttle;
    physicsRef.current.brake = vehicleState.brake;
    physicsRef.current.gear = vehicleState.gear;
    physicsRef.current.handbrake = vehicleState.handbrake;
    physicsRef.current.leftIndicator = vehicleState.leftIndicator;
    physicsRef.current.rightIndicator = vehicleState.rightIndicator;
    physicsRef.current.hazardLights = vehicleState.hazardLights;
    physicsRef.current.headlights = vehicleState.headlights;
    physicsRef.current.highBeams = vehicleState.highBeams;
    physicsRef.current.headlightMode = vehicleState.headlightMode;
    physicsRef.current.engineRunning = vehicleState.engineRunning;
  }, [
    vehicleState.steering,
    vehicleState.throttle,
    vehicleState.brake,
    vehicleState.gear,
    vehicleState.handbrake,
    vehicleState.leftIndicator,
    vehicleState.rightIndicator,
    vehicleState.hazardLights,
    vehicleState.headlights,
    vehicleState.highBeams,
    vehicleState.headlightMode,
    vehicleState.engineRunning
  ]);

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

  const onKerbCollisionRef = useRef(onKerbCollision);
  onKerbCollisionRef.current = onKerbCollision;

  const onSpeedCheckRef = useRef(onSpeedCheck);
  onSpeedCheckRef.current = onSpeedCheck;

  const onStopSignHaltRef = useRef(onStopSignHalt);
  onStopSignHaltRef.current = onStopSignHalt;

  const onZebraStopRef = useRef(onZebraStop);
  onZebraStopRef.current = onZebraStop;

  const onRoundaboutEnterRef = useRef(onRoundaboutEnter);
  onRoundaboutEnterRef.current = onRoundaboutEnter;

  const onParkAlignCheckRef = useRef(onParkAlignCheck);
  onParkAlignCheckRef.current = onParkAlignCheck;

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

    // Determine active atmospheric environment & low light status
    const effectiveEnv: CourseEnvironment = isNightMode ? 'night_twilight' : (environment || 'morning_sunrise');
    const isLowLight = isNightMode || effectiveEnv === 'night_twilight' || effectiveEnv === 'dusk_sunset' || effectiveEnv === 'rainy_wet';

    // Environment-specific sky, lighting, fog & bitumen parameters
    let skyColor = 0x82b2e8;
    let fogColor = 0x82b2e8;
    let fogDensity = 0.0035;
    let ambientColor = 0xffffff;
    let ambientIntensity = 0.75;
    let sunColor = 0xfffaed;
    let sunIntensity = 1.2;
    const sunPos = new THREE.Vector3(60, 100, 40);
    let roadBitumenColor = 0x2b2d42;
    let roadRoughness = 0.85;
    let roadMetalness = 0.15;
    let groundColor = 0x4f772d;

    if (effectiveEnv === 'morning_sunrise') {
      skyColor = 0xf59e0b;
      fogColor = 0xfde68a;
      fogDensity = 0.003;
      ambientColor = 0xffedd5;
      ambientIntensity = 0.85;
      sunColor = 0xfde047;
      sunIntensity = 1.35;
      sunPos.set(80, 45, 60);
      groundColor = 0x588157;
    } else if (effectiveEnv === 'midday_clear') {
      skyColor = 0x60a5fa;
      fogColor = 0x93c5fd;
      fogDensity = 0.0025;
      ambientColor = 0xffffff;
      ambientIntensity = 0.8;
      sunColor = 0xffffff;
      sunIntensity = 1.3;
      sunPos.set(20, 110, 20);
      groundColor = 0x4f772d;
    } else if (effectiveEnv === 'school_rush') {
      skyColor = 0x94a3b8;
      fogColor = 0xcbd5e1;
      fogDensity = 0.0032;
      ambientColor = 0xf1f5f9;
      ambientIntensity = 0.72;
      sunColor = 0xffedd5;
      sunIntensity = 1.05;
      sunPos.set(40, 70, 40);
      groundColor = 0x476a30;
    } else if (effectiveEnv === 'rainy_wet') {
      skyColor = 0x334155;
      fogColor = 0x475569;
      fogDensity = 0.0048;
      ambientColor = 0x64748b;
      ambientIntensity = 0.55;
      sunColor = 0x94a3b8;
      sunIntensity = 0.6;
      sunPos.set(30, 60, 30);
      groundColor = 0x2d3a2b;
      roadBitumenColor = 0x111318; // Wet dark reflective bitumen!
      roadRoughness = 0.28;
      roadMetalness = 0.6;
    } else if (effectiveEnv === 'dusk_sunset') {
      skyColor = 0xc2410c;
      fogColor = 0xe11d48;
      fogDensity = 0.0035;
      ambientColor = 0xfdba74;
      ambientIntensity = 0.65;
      sunColor = 0xf97316;
      sunIntensity = 1.1;
      sunPos.set(-70, 25, 70);
      groundColor = 0x3f4f2c;
    } else if (effectiveEnv === 'night_twilight') {
      skyColor = 0x090d16;
      fogColor = 0x090d16;
      fogDensity = 0.004;
      ambientColor = 0x223355;
      ambientIntensity = 0.55;
      sunColor = 0x4466aa;
      sunIntensity = 0.3;
      sunPos.set(60, 100, 40);
      groundColor = 0x1a2b1f;
    }

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // --- Interactive AI Traffic & Australian Hazard Engine ---
    const trafficManager = new AITrafficManager(scene);
    trafficManagerRef.current = trafficManager;
    if (activeHazardRef.current !== 'none') {
      trafficManager.triggerHazard(activeHazardRef.current, physicsRef.current.z);
    }

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    sunLight.position.copy(sunPos);
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
      color: groundColor,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    worldGroup.add(ground);

    // Dynamic 3D Torrential Rain Particle System (for rainy_wet course situation)
    let rainLines: THREE.LineSegments | null = null;
    let rainPositions: Float32Array | null = null;
    let rainVelocities: Float32Array | null = null;
    const rainCount = 2200;

    if (effectiveEnv === 'rainy_wet') {
      const rainGeo = new THREE.BufferGeometry();
      rainPositions = new Float32Array(rainCount * 6);
      rainVelocities = new Float32Array(rainCount);
      for (let i = 0; i < rainCount; i++) {
        const rx = (Math.random() - 0.5) * 80;
        const ry = Math.random() * 32;
        const rz = (Math.random() - 0.5) * 80;
        rainPositions[i * 6] = rx;
        rainPositions[i * 6 + 1] = ry;
        rainPositions[i * 6 + 2] = rz;
        rainPositions[i * 6 + 3] = rx - 0.12;
        rainPositions[i * 6 + 4] = ry - 1.1;
        rainPositions[i * 6 + 5] = rz;
        rainVelocities[i] = 26 + Math.random() * 14;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
      const rainMat = new THREE.LineBasicMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.65
      });
      rainLines = new THREE.LineSegments(rainGeo, rainMat);
      scene.add(rainLines);
    }

    // Helper to build asphalt road segment
    function createRoadSegment(
      x: number,
      z: number,
      w: number,
      l: number,
      rotY = 0,
      leftKerb = true,
      rightKerb = true,
      leftPath = true,
      rightPath = true
    ) {
      const roadGeo = new THREE.PlaneGeometry(w, l);
      const roadMat = new THREE.MeshStandardMaterial({
        color: roadBitumenColor,
        roughness: roadRoughness,
        metalness: roadMetalness
      });
      const mesh = new THREE.Mesh(roadGeo, roadMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = rotY;
      mesh.position.set(x, 0.01, z);
      mesh.receiveShadow = true;
      worldGroup.add(mesh);

      // Add concrete kerbs along specified edges
      const kerbGeo = new THREE.BoxGeometry(0.35, 0.25, l);
      const kerbMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });
      
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);

      if (leftKerb) {
        const lKerb = new THREE.Mesh(kerbGeo, kerbMat);
        lKerb.position.set(x - (w / 2) * cosR, 0.1, z - (w / 2) * sinR);
        lKerb.rotation.y = rotY;
        lKerb.castShadow = true;
        lKerb.receiveShadow = true;
        worldGroup.add(lKerb);
      }

      if (rightKerb) {
        const rKerb = new THREE.Mesh(kerbGeo, kerbMat);
        rKerb.position.set(x + (w / 2) * cosR, 0.1, z + (w / 2) * sinR);
        rKerb.rotation.y = rotY;
        rKerb.castShadow = true;
        rKerb.receiveShadow = true;
        worldGroup.add(rKerb);
      }

      // Footpath / Sidewalk along specified edges
      const pathGeo = new THREE.PlaneGeometry(2.5, l);
      const pathMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
      if (leftPath) {
        const lPath = new THREE.Mesh(pathGeo, pathMat);
        lPath.rotation.x = -Math.PI / 2;
        lPath.rotation.z = rotY;
        lPath.position.set(x - (w / 2 + 1.25) * cosR, 0.12, z - (w / 2 + 1.25) * sinR);
        lPath.receiveShadow = true;
        worldGroup.add(lPath);
      }

      if (rightPath) {
        const rPath = new THREE.Mesh(pathGeo, pathMat);
        rPath.rotation.x = -Math.PI / 2;
        rPath.rotation.z = rotY;
        rPath.position.set(x + (w / 2 + 1.25) * cosR, 0.12, z + (w / 2 + 1.25) * sinR);
        rPath.receiveShadow = true;
        worldGroup.add(rPath);
      }

      return mesh;
    }

    // Main Australian 2-way road (Left-hand drive! Left lane: x = -2.5 to -0.5, Right lane: x = 0.5 to 2.5)
    // Standard Road width: 9 meters (4.5m per direction)
    const ROAD_WIDTH = 9;

    // --- Clean Non-Overlapping Road Network ---
    // 1. North Highway & Suburban Corridor (z = 40 down to -258)
    // Runs cleanly up to the intersection entry line without overlapping cross streets
    createRoadSegment(0, -109, ROAD_WIDTH, 298, 0, true, true, true, true);

    // 2. City Cross Junction at z = -270 (Connecting to West Civic branch & East Commerce branch)
    // Central junction box has open edges with no kerbs or sidewalks blocking vehicle turns!
    createRoadSegment(0, -270, ROAD_WIDTH, 24, 0, false, false, false, false);

    // West Branch Street (West Civic left-turn road):
    createRoadSegment(-46.5, -270, ROAD_WIDTH, 77, Math.PI / 2, true, true, true, true);

    // East Branch Street (East Commerce right-turn road):
    createRoadSegment(46.5, -270, ROAD_WIDTH, 77, Math.PI / 2, true, true, true, true);

    // Smooth corner fillets (curved asphalt aprons) so turning left or right has wide, generous asphalt
    createRoadSegment(-6.75, -264, 4.5, 12, 0, false, false, false, false);
    createRoadSegment(6.75, -264, 4.5, 12, 0, false, false, false, false);
    createRoadSegment(-6.75, -276, 4.5, 12, 0, false, false, false, false);
    createRoadSegment(6.75, -276, 4.5, 12, 0, false, false, false, false);

    // 3. Mid City Road (Multi-lane approach & STOP Sign, from z = -282 to -328)
    // Stops cleanly at the roundabout entrance give-way line (z = -328) without overlapping the roundabout!
    createRoadSegment(0, -305, ROAD_WIDTH, 46, 0, true, true, true, true);

    // 4. Roundabout Entrance & Exit transition asphalt pads
    createRoadSegment(0, -331.5, 13, 7, 0, false, false, false, false);
    createRoadSegment(0, -358.5, 13, 7, 0, false, false, false, false);

    // Roundabout West Exit Road (First exit - Turn Left at Roundabout for Task 5!):
    // Runs from outer ring edge (x = -16.5) west to x = -80 at z = -345
    createRoadSegment(-48.5, -345, ROAD_WIDTH, 64, Math.PI / 2, true, true, true, true);

    // Roundabout East Exit Road:
    createRoadSegment(48.5, -345, ROAD_WIDTH, 64, Math.PI / 2, true, true, true, true);

    // 5. South Highway beyond Roundabout (from z = -362 to -460, where Checkpoint 9 Finish Line sits)
    createRoadSegment(0, -411, ROAD_WIDTH, 98, 0, true, true, true, true);

    // 6. Cross residential street for parallel parking (at z = -360, x = 4.5 to 75)
    createRoadSegment(39.75, -360, ROAD_WIDTH, 70.5, Math.PI / 2, true, true, true, true);

    // =========================================================================
    // 7. WATTLE CREEK HISTORIC VILLAGE & RURAL COUNTRY NETWORK (z = 40 to 260)
    // =========================================================================
    // (A) Village Main Street (z = 40 to 226): Length = 186m, center at (0, 133)
    createRoadSegment(0, 133, ROAD_WIDTH, 186, 0, true, true, true, true);

    // (B) Village Green Central Island & Roundabout Apron (at z = 240)
    const VILLAGE_ROUNDABOUT_Z = 240;
    const vIslandGeo = new THREE.CylinderGeometry(10.5, 10.5, 0.45, 36);
    const vIslandMat = new THREE.MeshStandardMaterial({ color: 0x3d7040, roughness: 0.85 });
    const vIsland = new THREE.Mesh(vIslandGeo, vIslandMat);
    vIsland.position.set(0, 0.22, VILLAGE_ROUNDABOUT_Z);
    vIsland.receiveShadow = true;
    worldGroup.add(vIsland);

    // Village Green stone rim
    const vRimGeo = new THREE.TorusGeometry(10.6, 0.28, 12, 36);
    const vRimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const vRim = new THREE.Mesh(vRimGeo, vRimMat);
    vRim.rotation.x = Math.PI / 2;
    vRim.position.set(0, 0.2, VILLAGE_ROUNDABOUT_Z);
    worldGroup.add(vRim);

    // Village Green circulating asphalt ring (inner 10.7m, outer 19.8m)
    const vRingGeo = new THREE.RingGeometry(10.7, 19.8, 36);
    const vRingMat = new THREE.MeshStandardMaterial({ color: roadBitumenColor, roughness: roadRoughness, metalness: roadMetalness });
    const vRing = new THREE.Mesh(vRingGeo, vRingMat);
    vRing.rotation.x = -Math.PI / 2;
    vRing.position.set(0, 0.015, VILLAGE_ROUNDABOUT_Z);
    vRing.receiveShadow = true;
    worldGroup.add(vRing);

    // Transition pads for Village Green roundabout entrances/exits
    createRoadSegment(0, 222.5, 14, 8, 0, false, false, false, false);
    createRoadSegment(0, 257.5, 14, 8, 0, false, false, false, false);

    // (C) East Farmstead Country Lane:
    // Starts at roundabout outer rim (x = 19.8, z = 240) and heads east to x = 125
    createRoadSegment(72.5, 240, 8, 105, Math.PI / 2, true, true, false, false);
    // Curves south from z = 240 down to z = -40 at x = 125
    createRoadSegment(125, 100, 8, 280, 0, true, true, false, false);
    // Connects back west to Highway at z = -40 (from x = 125 west to x = 4.5)
    createRoadSegment(65, -40, 8, 120, Math.PI / 2, true, true, false, false);

    // Corner junction pads for smooth farm lane turns
    createRoadSegment(125, 240, 16, 16, 0, false, false, false, false);
    createRoadSegment(125, -40, 16, 16, 0, false, false, false, false);
    createRoadSegment(8.5, -40, 8, 12, 0, false, false, false, false);

    // (D) West Orchard & Cricket Reserve Lane:
    // Starts at roundabout outer rim (x = -19.8, z = 240) and heads west to x = -85
    createRoadSegment(-52.5, 240, 8, 65, Math.PI / 2, true, true, false, false);
    // Curves south down to connect to the West Civic road at z = -270!
    createRoadSegment(-85, -15, 8, 510, 0, true, true, false, false);

    // --- Dynamic Animated Road Arrows System on Bitumen ---
    function createNavArrowTexture() {
      const cvs = document.createElement('canvas');
      cvs.width = 128; cvs.height = 256;
      const ctx = cvs.getContext('2d')!;
      ctx.clearRect(0, 0, 128, 256);
      
      // Radiant soft cyan glow
      const grad = ctx.createRadialGradient(64, 128, 15, 64, 128, 115);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.55)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);

      // High-contrast luminous chevron
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;

      // Primary Chevron
      ctx.beginPath();
      ctx.moveTo(64, 25);
      ctx.lineTo(112, 105);
      ctx.lineTo(92, 120);
      ctx.lineTo(64, 75);
      ctx.lineTo(36, 120);
      ctx.lineTo(16, 105);
      ctx.closePath();
      ctx.fill();

      // Second Trailing Chevron
      ctx.beginPath();
      ctx.moveTo(64, 115);
      ctx.lineTo(112, 195);
      ctx.lineTo(92, 210);
      ctx.lineTo(64, 165);
      ctx.lineTo(36, 210);
      ctx.lineTo(16, 195);
      ctx.closePath();
      ctx.fill();

      const tex = new THREE.CanvasTexture(cvs);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    const navArrowTex = createNavArrowTexture();
    const navArrowGeo = new THREE.PlaneGeometry(1.5, 3.2);

    interface AnimatedRoadArrow {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      seqIndex: number;
    }
    const animatedRoadArrows: AnimatedRoadArrow[] = [];

    function addAnimatedRoadArrow(x: number, z: number, rotY: number, seqIndex: number) {
      const mat = new THREE.MeshBasicMaterial({
        map: navArrowTex,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(navArrowGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = rotY;
      mesh.position.set(x, 0.035, z);
      worldGroup.add(mesh);
      animatedRoadArrows.push({ mesh, mat, seqIndex });
    }

    // Deploy Animated Guiding Arrows on Road Bitumen:
    let arrowSeq = 0;
    // (A) Australian Keep-Left Highway Lane (x = -2.25): from z = 20 down to -230
    for (let z = 20; z >= -230; z -= 11) {
      addAnimatedRoadArrow(-2.25, z, 0, arrowSeq++);
    }

    // (B) Dedicated Left-Turn Transition into West Civic (z = -236 to -270)
    addAnimatedRoadArrow(-2.7, -236, 0.12, arrowSeq++);
    addAnimatedRoadArrow(-3.4, -246, 0.22, arrowSeq++);
    addAnimatedRoadArrow(-4.1, -256, 0.35, arrowSeq++);
    addAnimatedRoadArrow(-4.9, -264, 0.65, arrowSeq++);
    addAnimatedRoadArrow(-7.5, -269.5, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-15.5, -269.5, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-25.5, -269.5, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-36.5, -269.5, Math.PI / 2, arrowSeq++);

    // (C) Center Lane Continuing Straight towards Stop Line & Roundabout (z = -240 to -324)
    for (let z = -240; z >= -324; z -= 11) {
      addAnimatedRoadArrow(-1.25, z, 0, arrowSeq++);
    }

    // (D) Roundabout Entry, Clockwise Circulating Path, and Left-Turn First Exit (Task 5)
    addAnimatedRoadArrow(-2.25, -328, 0.15, arrowSeq++);
    addAnimatedRoadArrow(-4.5, -334, 0.45, arrowSeq++);
    addAnimatedRoadArrow(-8.5, -339, 0.85, arrowSeq++);
    addAnimatedRoadArrow(-13.0, -343, 1.35, arrowSeq++);
    // First Exit (Left Turn to West):
    addAnimatedRoadArrow(-19.0, -347, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-27.0, -347, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-37.0, -347, Math.PI / 2, arrowSeq++);
    addAnimatedRoadArrow(-48.0, -347, Math.PI / 2, arrowSeq++);

    // Continuing circulating path towards South Exit & Finish Line (Checkpoint 9):
    addAnimatedRoadArrow(-12.5, -350, 1.95, arrowSeq++);
    addAnimatedRoadArrow(-8.0, -356, 2.55, arrowSeq++);
    addAnimatedRoadArrow(-4.0, -361, 2.95, arrowSeq++);
    for (let z = -366; z >= -430; z -= 12) {
      addAnimatedRoadArrow(-2.25, z, 0, arrowSeq++);
    }

    // (E) Wattle Creek Historic Village High Street (z = 30 heading north to z = 225)
    // Left lane heading North (+Z in Australia is x = +2.25):
    for (let z = 30; z <= 220; z += 12) {
      addAnimatedRoadArrow(2.25, z, Math.PI, arrowSeq++);
    }

    // (F) Village Green Roundabout Circulation & East Farmstead Lane Exit (z = 240)
    addAnimatedRoadArrow(2.25, 226, Math.PI - 0.2, arrowSeq++);
    addAnimatedRoadArrow(5.5, 233, Math.PI - 0.6, arrowSeq++);
    addAnimatedRoadArrow(10.5, 238, Math.PI - 1.1, arrowSeq++);
    addAnimatedRoadArrow(15.0, 240, -Math.PI / 2, arrowSeq++);
    // Farmstead Lane Heading East:
    for (let x = 24; x <= 116; x += 14) {
      addAnimatedRoadArrow(x, 242, -Math.PI / 2, arrowSeq++);
    }
    // Farmstead Lane Heading South towards Farm Barn (x = 125, z = 230 down to -30):
    for (let z = 230; z >= -30; z -= 18) {
      addAnimatedRoadArrow(123, z, 0, arrowSeq++);
    }

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

    // Australian Retroreflective Cat's Eyes / Raised Pavement Markers (RPMs) along centerline
    const catEyeMat = new THREE.MeshStandardMaterial({
      color: isLowLight ? 0xffffff : 0xcccccc,
      emissive: isLowLight ? 0xfff0b0 : 0x000000,
      emissiveIntensity: isLowLight ? 1.6 : 0.0,
      roughness: 0.2
    });
    for (let z = 20; z >= -460; z -= 14) {
      if (z > -155 && z < -125) continue; // Skip roundabout
      if (z > -280 && z < -260) continue; // Skip crossroads
      const stud = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.14), catEyeMat);
      stud.position.set(0, 0.035, z);
      worldGroup.add(stud);
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

    // Twin Flashing Amber Electronic Beacons on School Zone Sign (ARR 81 active beacons)
    const schoolBeaconGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const schoolBeaconMat1 = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const schoolBeaconMat2 = new THREE.MeshBasicMaterial({ color: 0x4a3b00 });
    const schoolBeacon1 = new THREE.Mesh(schoolBeaconGeo, schoolBeaconMat1);
    const schoolBeacon2 = new THREE.Mesh(schoolBeaconGeo, schoolBeaconMat2);
    schoolBeacon1.position.set(-ROAD_WIDTH / 2 - 1.5, 3.45, -45);
    schoolBeacon2.position.set(-ROAD_WIDTH / 2 - 0.9, 3.45, -45);
    worldGroup.add(schoolBeacon1);
    worldGroup.add(schoolBeacon2);

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

    // =========================================================================
    // 7.5 WATTLE CREEK HISTORIC VILLAGE & COUNTRY FARMSTEAD 3D SCENERY
    // =========================================================================
    let windmillFanMesh: THREE.Group | null = null;

    // (A) Village Welcome Gateway at z = 48
    const gatewayGroup = new THREE.Group();
    const timberPostMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 5.5, 8), timberPostMat);
    postL.position.set(-6.2, 2.75, 48);
    postL.castShadow = true;
    gatewayGroup.add(postL);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 5.5, 8), timberPostMat);
    postR.position.set(6.2, 2.75, 48);
    postR.castShadow = true;
    gatewayGroup.add(postR);

    // Cross beam & Shire Welcome Sign
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.45, 0.5), timberPostMat);
    beam.position.set(0, 5.2, 48);
    beam.castShadow = true;
    gatewayGroup.add(beam);

    // Green rural shire banner sign
    const signCvs = document.createElement('canvas');
    signCvs.width = 512; signCvs.height = 128;
    const signCtx = signCvs.getContext('2d')!;
    signCtx.fillStyle = '#1b4332';
    signCtx.fillRect(0, 0, 512, 128);
    signCtx.strokeStyle = '#ffffff';
    signCtx.lineWidth = 6;
    signCtx.strokeRect(6, 6, 500, 116);
    signCtx.fillStyle = '#ffffff';
    signCtx.font = 'bold 24px sans-serif';
    signCtx.textAlign = 'center';
    signCtx.fillText('WELCOME TO WATTLE CREEK', 256, 44);
    signCtx.font = 'bold 16px sans-serif';
    signCtx.fillStyle = '#fde047';
    signCtx.fillText('HISTORIC VILLAGE • SPEED LIMIT 40 km/h', 256, 76);
    signCtx.font = '13px sans-serif';
    signCtx.fillStyle = '#e2e8f0';
    signCtx.fillText('FOUNDED 1862 • POPULATION 520', 256, 104);
    const shireSignTex = new THREE.CanvasTexture(signCvs);
    const shireSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 2.1),
      new THREE.MeshStandardMaterial({ map: shireSignTex, roughness: 0.6 })
    );
    shireSignMesh.position.set(0, 4.0, 48);
    gatewayGroup.add(shireSignMesh);

    // Kangaroo Crossing warning sign at gateway
    placeSign('kangaroo', 6.8, 52, Math.PI, 1.4);
    worldGroup.add(gatewayGroup);

    // (B) The Bushman's Rest Hotel (Est. 1888) at x = -16.5, z = 110
    const pubGroup = new THREE.Group();
    // Sandstone Ground Floor
    const pubGroundWalls = new THREE.Mesh(
      new THREE.BoxGeometry(16, 4.5, 14),
      new THREE.MeshStandardMaterial({ color: 0xc49a6c, roughness: 0.9 })
    );
    pubGroundWalls.position.set(0, 2.25, 0);
    pubGroundWalls.castShadow = true;
    pubGroup.add(pubGroundWalls);

    // Upper Floor Weatherboard
    const pubUpperWalls = new THREE.Mesh(
      new THREE.BoxGeometry(15.8, 3.8, 13.8),
      new THREE.MeshStandardMaterial({ color: 0xe8d8c8, roughness: 0.8 })
    );
    pubUpperWalls.position.set(0, 6.4, 0);
    pubUpperWalls.castShadow = true;
    pubGroup.add(pubUpperWalls);

    // Green Colorbond Hipped Roof
    const pubRoof = new THREE.Mesh(
      new THREE.ConeGeometry(13, 3.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x2d4a3e, roughness: 0.6 })
    );
    pubRoof.position.set(0, 10.2, 0);
    pubRoof.rotation.y = Math.PI / 4;
    pubRoof.castShadow = true;
    pubGroup.add(pubRoof);

    // 2-Story Verandah overhang extending towards street
    const verandahFloor = new THREE.Mesh(
      new THREE.BoxGeometry(17, 0.35, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 })
    );
    verandahFloor.position.set(0, 4.5, 8.5);
    pubGroup.add(verandahFloor);

    // Verandah roof
    const verandahRoof = new THREE.Mesh(
      new THREE.BoxGeometry(17.2, 0.25, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x2d4a3e, roughness: 0.6 })
    );
    verandahRoof.position.set(0, 8.2, 8.5);
    pubGroup.add(verandahRoof);

    // Verandah timber support posts
    for (let px = -7.5; px <= 7.5; px += 3.75) {
      const vPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8.2, 0.2), timberPostMat);
      vPost.position.set(px, 4.1, 10.6);
      pubGroup.add(vPost);
    }

    // Pub sign board
    const pubSignCvs = document.createElement('canvas');
    pubSignCvs.width = 512; pubSignCvs.height = 96;
    const pCtx = signCvs.getContext('2d')!;
    pCtx.fillStyle = '#1c1917';
    pCtx.fillRect(0, 0, 512, 96);
    pCtx.fillStyle = '#fbbf24';
    pCtx.font = 'bold 24px serif';
    pCtx.textAlign = 'center';
    pCtx.fillText("THE BUSHMAN'S REST HOTEL", 256, 42);
    pCtx.font = '14px sans-serif';
    pCtx.fillStyle = '#d6d3d1';
    pCtx.fillText('ESTABLISHED 1888 • COLD BEER & MEALS', 256, 72);
    const pubSignTex = new THREE.CanvasTexture(pubSignCvs);
    const pubSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 1.35),
      new THREE.MeshBasicMaterial({ map: pubSignTex })
    );
    pubSignMesh.position.set(0, 8.9, 10.6);
    pubGroup.add(pubSignMesh);

    pubGroup.position.set(-16.5, 0, 110);
    worldGroup.add(pubGroup);

    // (C) Wattle Creek Country Bakery & Tearoom at x = 16.5, z = 110
    const bakeryGroup = new THREE.Group();
    const bakeryWalls = new THREE.Mesh(
      new THREE.BoxGeometry(14, 4.5, 11),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.8 })
    );
    bakeryWalls.position.set(0, 2.25, 0);
    bakeryWalls.castShadow = true;
    bakeryGroup.add(bakeryWalls);

    const bakeryRoof = new THREE.Mesh(
      new THREE.ConeGeometry(10.5, 3.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 })
    );
    bakeryRoof.position.set(0, 6.1, 0);
    bakeryRoof.rotation.y = Math.PI / 4;
    bakeryGroup.add(bakeryRoof);

    // Red-and-white striped bakery awning
    const bakeryAwning = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.25, 2.8),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 })
    );
    bakeryAwning.position.set(0, 3.4, -6.8);
    bakeryAwning.rotation.x = 0.2;
    bakeryGroup.add(bakeryAwning);

    // Outdoor timber picnic table on grass
    const picnicTable = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.85, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    picnicTable.position.set(-2.5, 0.42, -9.5);
    bakeryGroup.add(picnicTable);

    bakeryGroup.position.set(16.5, 0, 110);
    bakeryGroup.rotation.y = Math.PI;
    worldGroup.add(bakeryGroup);

    // (D) Historic General Store & Australia Post at x = -16.5, z = 160
    const storeGroup = new THREE.Group();
    const storeWalls = new THREE.Mesh(
      new THREE.BoxGeometry(15, 4.8, 12),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.85 })
    );
    storeWalls.position.set(0, 2.4, 0);
    storeWalls.castShadow = true;
    storeGroup.add(storeWalls);

    const storeRoof = new THREE.Mesh(
      new THREE.BoxGeometry(15.6, 2.4, 12.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    storeRoof.position.set(0, 5.8, 0);
    storeGroup.add(storeRoof);

    // Red Australian Post pillar postbox on pavement
    const postBox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 })
    );
    postBox.position.set(4.5, 0.7, 7.5);
    storeGroup.add(postBox);

    storeGroup.position.set(-16.5, 0, 160);
    worldGroup.add(storeGroup);

    // (E) CFA Rural Fire Service Station at x = 16.5, z = 160
    const cfaGroup = new THREE.Group();
    const cfaWalls = new THREE.Mesh(
      new THREE.BoxGeometry(15, 5.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
    );
    cfaWalls.position.set(0, 2.6, 0);
    cfaWalls.castShadow = true;
    cfaGroup.add(cfaWalls);

    // CFA Bay 1 & Bay 2 Red Roller Doors
    for (let dx = -3.5; dx <= 3.5; dx += 7.0) {
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 3.8),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
      );
      door.position.set(dx, 1.9, -6.02);
      cfaGroup.add(door);
    }

    // AFDRS Fire Danger Rating Board on roadside
    const fdrBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
    );
    fdrBoard.position.set(7.5, 1.6, -8.5);
    cfaGroup.add(fdrBoard);

    cfaGroup.position.set(16.5, 0, 160);
    cfaGroup.rotation.y = Math.PI;
    worldGroup.add(cfaGroup);

    // (F) Village Hall & Courthouse at x = -16.5, z = 200
    const hallGroup = new THREE.Group();
    const hallWalls = new THREE.Mesh(
      new THREE.BoxGeometry(16, 6.0, 13),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 })
    );
    hallWalls.position.set(0, 3.0, 0);
    hallWalls.castShadow = true;
    hallGroup.add(hallWalls);

    const hallRoof = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 2.5, 13.5),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.6 })
    );
    hallRoof.position.set(0, 7.2, 0);
    hallGroup.add(hallRoof);

    // Clock pediment
    const clock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0, 8.4, 6.8);
    hallGroup.add(clock);

    hallGroup.position.set(-16.5, 0, 200);
    worldGroup.add(hallGroup);

    // (G) THE VILLAGE GREEN & SOUTHERN CROSS WINDMILL (z = 240, x = 0)
    const villageGreenGroup = new THREE.Group();

    // 1. Australian Southern Cross Windmill (Center of Island, x = 0, z = 240)
    const windmillGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.4 });
    // 4 lattice legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.1, 11, 6);
    [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(lx * 0.7, 5.5, lz * 0.7);
      leg.rotation.x = lz * 0.06;
      leg.rotation.z = -lx * 0.06;
      windmillGroup.add(leg);
    });

    // Cross bracing rings
    for (let hy = 2.5; hy <= 10.5; hy += 2.6) {
      const rScale = 1.6 * (1 - (hy / 15));
      const strut = new THREE.Mesh(new THREE.BoxGeometry(rScale * 1.8, 0.08, rScale * 1.8), steelMat);
      strut.position.y = hy;
      windmillGroup.add(strut);
    }

    // Gearbox Head
    const gearHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.8), steelMat);
    gearHead.position.set(0, 11.2, 0);
    windmillGroup.add(gearHead);

    // Directional Tail Vane (Points downwind)
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6), steelMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 11.2, 1.4);
    windmillGroup.add(tailBoom);

    const tailFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 })
    );
    tailFin.position.set(0, 11.2, 2.5);
    windmillGroup.add(tailFin);

    // Animated Windmill Multi-Blade Wheel
    windmillFanMesh = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12), steelMat);
    hub.rotation.x = Math.PI / 2;
    windmillFanMesh.add(hub);

    // 16 Galvanized curved fan blades
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 1.4, 0.03),
        steelMat
      );
      blade.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0);
      blade.rotation.z = angle + 0.3;
      windmillFanMesh.add(blade);
    }
    // Outer stabilizing ring
    const outerFanRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.03, 8, 24),
      steelMat
    );
    windmillFanMesh.add(outerFanRing);

    windmillFanMesh.position.set(0, 11.2, -0.45);
    windmillGroup.add(windmillFanMesh);
    villageGreenGroup.add(windmillGroup);

    // 2. Country Gazebo / Bandstand (x = -4.5, z = 0 relative to island)
    const bandstandGroup = new THREE.Group();
    const bsFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 })
    );
    bsFloor.position.y = 0.2;
    bandstandGroup.add(bsFloor);

    // 8 white timber posts
    for (let i = 0; i < 8; i++) {
      const ba = (i * Math.PI * 2) / 8;
      const bp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
      );
      bp.position.set(Math.cos(ba) * 2.5, 1.4, Math.sin(ba) * 2.5);
      bandstandGroup.add(bp);
    }

    // Green conical octagonal roof
    const bsRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 })
    );
    bsRoof.position.y = 3.4;
    bandstandGroup.add(bsRoof);
    bandstandGroup.position.set(-4.5, 0, 0);
    villageGreenGroup.add(bandstandGroup);

    // 3. Memorial Stone Fountain (x = 4.5, z = 0)
    const fountainPlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 })
    );
    fountainPlinth.position.set(4.5, 0.6, 0);
    villageGreenGroup.add(fountainPlinth);

    // Weeping gum tree on the green
    const greenTree = new THREE.Group();
    const gTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4c5b9, roughness: 0.9 })
    );
    gTrunk.position.y = 3;
    greenTree.add(gTrunk);
    const gCanopy = new THREE.Mesh(
      new THREE.DodecahedronGeometry(3.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 })
    );
    gCanopy.position.y = 6.2;
    greenTree.add(gCanopy);
    greenTree.position.set(0, 0, -4.5);
    villageGreenGroup.add(greenTree);

    villageGreenGroup.position.set(0, 0, VILLAGE_ROUNDABOUT_Z);
    worldGroup.add(villageGreenGroup);

    // (H) EAST FARMSTEAD COUNTRY LANE SCENERY (x = 35 to 135, z = 250 to -40)
    const farmGroup = new THREE.Group();

    // 1. Cattle Grid Crossing at x = 50, z = 240
    const gridBed = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.1, 7.8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.5 })
    );
    gridBed.position.set(50, 0.06, 240);
    farmGroup.add(gridBed);

    // Steel grid transverse rails
    for (let rx = 47.5; rx <= 52.5; rx += 0.5) {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 7.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      rail.rotation.x = Math.PI / 2;
      rail.position.set(rx, 0.12, 240);
      farmGroup.add(rail);
    }

    // 4 Black & White Hazard guideposts at corners of Cattle Grid
    [[-3.2, -4.1], [3.2, -4.1], [-3.2, 4.1], [3.2, 4.1]].forEach(([gx, gz]) => {
      const gp = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.3, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
      );
      gp.position.set(50 + gx, 0.65, 240 + gz);
      farmGroup.add(gp);
    });

    // 2. Classic Red Rural Timber Barn at x = 75, z = 265
    const barnWalls = new THREE.Mesh(
      new THREE.BoxGeometry(18, 7.5, 14),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 })
    );
    barnWalls.position.set(75, 3.75, 265);
    barnWalls.castShadow = true;
    farmGroup.add(barnWalls);

    const barnRoof = new THREE.Mesh(
      new THREE.ConeGeometry(13.5, 4.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
    );
    barnRoof.position.set(75, 9.8, 265);
    barnRoof.rotation.y = Math.PI / 4;
    barnRoof.castShadow = true;
    farmGroup.add(barnRoof);

    // 3. Tractor Shed & 3D Farm Tractor at x = 105, z = 265
    const shedRoof = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.35, 9),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 })
    );
    shedRoof.position.set(105, 4.5, 265);
    farmGroup.add(shedRoof);
    for (let sx = -5; sx <= 5; sx += 10) {
      for (let sz = -3.8; sz <= 3.8; sz += 7.6) {
        const sPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8), timberPostMat);
        sPost.position.set(105 + sx, 2.25, 265 + sz);
        farmGroup.add(sPost);
      }
    }

    // 3D Green Farm Tractor parked inside
    const tractorGroup = new THREE.Group();
    // Green Body
    const tBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.4, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
    );
    tBody.position.y = 1.4;
    tractorGroup.add(tBody);
    // Yellow Hubs & Big Rear Tyres
    const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const rearTyreGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.55, 16);
    const rearL = new THREE.Mesh(rearTyreGeo, tyreMat);
    rearL.rotation.z = Math.PI / 2;
    rearL.position.set(-1.25, 0.85, 0.9);
    tractorGroup.add(rearL);
    const rearR = rearL.clone();
    rearR.position.x = 1.25;
    tractorGroup.add(rearR);

    // Front Steer Tyres
    const frontTyreGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
    const frontL = new THREE.Mesh(frontTyreGeo, tyreMat);
    frontL.rotation.z = Math.PI / 2;
    frontL.position.set(-1.1, 0.48, -1.2);
    tractorGroup.add(frontL);
    const frontR = frontL.clone();
    frontR.position.x = 1.1;
    tractorGroup.add(frontR);

    // Vertical Exhaust Pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), steelMat);
    exhaust.position.set(0.65, 2.6, -1.0);
    tractorGroup.add(exhaust);

    tractorGroup.position.set(105, 0, 265);
    farmGroup.add(tractorGroup);

    // 4. Golden Cylindrical Hay Bales in the Paddock
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 });
    const hayGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.8, 16);
    const hayPositions = [
      [68, 225], [78, 222], [88, 228], [94, 218],
      [112, 195], [116, 175], [108, 145], [114, 115]
    ];
    hayPositions.forEach(([hx, hz], hidx) => {
      const bale = new THREE.Mesh(hayGeo, hayMat);
      bale.rotation.z = Math.PI / 2;
      bale.rotation.y = hidx * 0.4;
      bale.position.set(hx, 0.95, hz);
      bale.castShadow = true;
      farmGroup.add(bale);
    });

    // 5. Galvanized Corrugated Iron Rainwater Tanks
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3.2, 20), tankMat);
    tank1.position.set(87, 1.6, 268);
    tank1.castShadow = true;
    farmGroup.add(tank1);

    // 6. Kangaroos in the Paddock at x = 92, z = 215
    const rooMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
    const createKangaroo = (kx: number, kz: number, ry: number) => {
      const roo = new THREE.Group();
      // Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 8), rooMat);
      body.rotation.x = -0.3;
      body.position.set(0, 0.65, 0);
      roo.add(body);
      // Head & Ears
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), rooMat);
      head.position.set(0, 1.25, -0.2);
      roo.add(head);
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), rooMat);
      earL.position.set(-0.1, 1.45, -0.2);
      roo.add(earL);
      const earR = earL.clone();
      earR.position.x = 0.1;
      roo.add(earR);
      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 0.9, 8), rooMat);
      tail.rotation.x = 0.7;
      tail.position.set(0, 0.35, 0.45);
      roo.add(tail);

      roo.position.set(kx, 0, kz);
      roo.rotation.y = ry;
      return roo;
    };
    farmGroup.add(createKangaroo(92, 215, -0.6));
    farmGroup.add(createKangaroo(95, 218, 0.8));
    farmGroup.add(createKangaroo(89, 212, -1.8));

    // 7. White Rural Guideposts with Reflectors along Farm Lane
    const postGeo = new THREE.BoxGeometry(0.12, 1.1, 0.06);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    for (let z = 230; z >= -30; z -= 25) {
      // Left guidepost (Red reflector)
      const pL = new THREE.Mesh(postGeo, postMat);
      pL.position.set(125 - 4.8, 0.55, z);
      farmGroup.add(pL);
      // Right guidepost (White reflector)
      const pR = new THREE.Mesh(postGeo, postMat);
      pR.position.set(125 + 4.8, 0.55, z);
      farmGroup.add(pR);
    }

    worldGroup.add(farmGroup);

    // ==========================================
    // 8. REALISTIC AUSTRALIAN STREET LIGHTS & ROAD LIGHTING NETWORK
    // ==========================================
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 });
    const lampHousingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const streetBulbMat = new THREE.MeshStandardMaterial({
      color: isLowLight ? 0xfff3c4 : 0xd1d5db,
      emissive: isLowLight ? 0xffe070 : 0x000000,
      emissiveIntensity: isLowLight ? 4.2 : 0.0,
      roughness: 0.1
    });

    const createStreetLight = (x: number, z: number, facingRight: boolean) => {
      const lampGroup = new THREE.Group();
      // Main Vertical Pole (7.8m height)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 7.8, 12), poleMat);
      pole.position.y = 3.9;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Curved Overhang Outreach Arm arching toward road center
      const armDir = facingRight ? 1 : -1;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.7, 8), poleMat);
      arm.position.set(armDir * 1.15, 7.9, 0);
      arm.rotation.z = -armDir * (Math.PI / 3.4);
      lampGroup.add(arm);

      // Streetlamp Luminaire Head (Cobra-head housing)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.95), lampHousingMat);
      head.position.set(armDir * 2.3, 8.25, 0);
      lampGroup.add(head);

      // Glowing Lamp Lens / Bulb facing downward
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.8), streetBulbMat);
      bulb.position.set(armDir * 2.3, 8.16, 0);
      lampGroup.add(bulb);

      if (isLowLight) {
        // Targeted Road Light Source illuminating the road
        const light = new THREE.PointLight(0xfff1b8, 2.6, 38, 1.3);
        light.position.set(armDir * 2.3, 8.1, 0);
        lampGroup.add(light);

        // Illuminated Road Light Pool on the Asphalt surface
        const roadPool = new THREE.Mesh(
          new THREE.PlaneGeometry(9.0, 16.0),
          new THREE.MeshBasicMaterial({
            color: 0xffe680,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            blending: THREE.AdditiveBlending
          })
        );
        roadPool.rotation.x = -Math.PI / 2;
        // Position directly over the driving lane under the lamp
        roadPool.position.set(armDir * 2.8, 0.035, 0);
        lampGroup.add(roadPool);

        // Atmospheric downward light cone from lamp down to road
        const coneHeight = 8.1;
        const beamCone = new THREE.Mesh(
          new THREE.ConeGeometry(3.6, coneHeight, 16, 1, true),
          new THREE.MeshBasicMaterial({
            color: 0xfff0a0,
            transparent: true,
            opacity: 0.045,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        );
        beamCone.position.set(armDir * 2.3, coneHeight / 2, 0);
        lampGroup.add(beamCone);
      }

      lampGroup.position.set(x, 0, z);
      worldGroup.add(lampGroup);
    };

    // Staggered Road Lights along both sides of main road (z = 35 down to -460, alternating left & right every 22m)
    let isLeft = true;
    for (let z = 35; z >= -460; z -= 22) {
      // Don't place inside the roundabout core (z = -128 to -152)
      if (z > -152 && z < -128) continue;
      // Don't place inside the city crossroads (z = -262 to -278)
      if (z > -278 && z < -262) continue;

      const sideX = isLeft ? (-ROAD_WIDTH / 2 - 1.8) : (ROAD_WIDTH / 2 + 1.8);
      createStreetLight(sideX, z, isLeft);
      isLeft = !isLeft;
    }

    // Dedicated High-Mast Lights around the Roundabout (z = -140)
    createStreetLight(-15.5, -140, true);
    createStreetLight(15.5, -140, false);
    createStreetLight(-ROAD_WIDTH / 2 - 1.8, -125, true);
    createStreetLight(ROAD_WIDTH / 2 + 1.8, -155, false);

    // Streetlights along City Cross Branch Street at z = -270
    for (let x = -80; x <= 80; x += 32) {
      if (Math.abs(x) > 7) {
        createStreetLight(x, -270 - ROAD_WIDTH / 2 - 1.8, true);
      }
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
    const headSpotL = new THREE.SpotLight(0xffffff, isLowLight ? 5 : 0, 60, Math.PI / 6, 0.4, 1.2);
    headSpotL.position.set(-0.65, 0.65, -2.2);
    headSpotL.target.position.set(-0.65, 0, -25);
    carGroup.add(headSpotL);
    carGroup.add(headSpotL.target);

    const headSpotR = headSpotL.clone();
    headSpotR.position.set(0.65, 0.65, -2.2);
    headSpotR.target.position.set(0.65, 0, -25);
    carGroup.add(headSpotR);
    carGroup.add(headSpotR.target);

    // Projected Headlight Road Light Pool (brightens the asphalt directly ahead of the vehicle in low light)
    const roadPoolMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: isLowLight ? 0.28 : 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const headlightRoadPool = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 24), roadPoolMat);
    headlightRoadPool.rotation.x = -Math.PI / 2;
    headlightRoadPool.position.set(0, 0.04, -14);
    carGroup.add(headlightRoadPool);

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
    carGroup.position.set(physicsRef.current.x, 0, physicsRef.current.z);
    carGroup.rotation.y = physicsRef.current.rotation;

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

      const cur = { ...physicsRef.current };

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
      let roadPoolOpacity = 0;
      if (cur.headlightMode === 'high' || cur.highBeams) {
        spotIntensity = 8.0;
        spotDistance = 90;
        spotAngle = Math.PI / 5;
        headLightMat.emissive.setHex(0xffffff);
        headLightMat.emissiveIntensity = 3.2;
        roadPoolOpacity = 0.38;
      } else if (cur.headlightMode === 'low' || (cur.headlights && cur.headlightMode !== 'dim')) {
        spotIntensity = 4.8;
        spotDistance = 58;
        spotAngle = Math.PI / 6;
        headLightMat.emissive.setHex(0xffffff);
        headLightMat.emissiveIntensity = 1.8;
        roadPoolOpacity = 0.28;
      } else if (cur.headlightMode === 'dim') {
        spotIntensity = 1.2;
        spotDistance = 22;
        spotAngle = Math.PI / 7;
        headLightMat.emissive.setHex(0xffdfaa);
        headLightMat.emissiveIntensity = 0.8;
        roadPoolOpacity = 0.14;
      } else {
        spotIntensity = isLowLight ? 2.5 : 0;
        spotDistance = 45;
        headLightMat.emissive.setHex(isLowLight ? 0xffffff : 0x222222);
        headLightMat.emissiveIntensity = isLowLight ? 0.6 : 0.1;
        roadPoolOpacity = isLowLight ? 0.22 : 0;
      }
      headSpotL.intensity = spotIntensity;
      headSpotR.intensity = spotIntensity;
      headSpotL.distance = spotDistance;
      headSpotR.distance = spotDistance;
      headSpotL.angle = spotAngle;
      headSpotR.angle = spotAngle;
      roadPoolMat.opacity = roadPoolOpacity;

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
      // Calculate whether the vehicle is on drivable asphalt with comfortable, realistic margins:
      const onNorthHighway = z >= -258 && z <= 48 && Math.abs(x) <= 6.0;
      const onBusBay = x >= -8.2 && x <= 6.0 && z >= -208 && z <= -172;
      const onIntersection270 = Math.abs(x) <= 12.5 && Math.abs(z - (-270)) <= 14.5;
      const onTurnFillet270 = x >= -16.0 && x <= 2.0 && z >= -284 && z <= -256;
      const onWestCivicBranch = x <= 0.0 && x >= -95.0 && Math.abs(z - (-270)) <= 7.2;
      const onEastCommerceBranch = x >= 0.0 && x <= 95.0 && Math.abs(z - (-270)) <= 7.2;
      const onApproachToRoundabout = z >= -332 && z <= -278 && Math.abs(x) <= 8.5;
      const distToRoundabout = Math.hypot(x, z - (-345));
      const onRoundabout = distToRoundabout <= 20.2 && distToRoundabout >= 5.0;
      const onRoundaboutWestExit = x <= -10.0 && x >= -92.0 && Math.abs(z - (-345)) <= 7.2;
      const onRoundaboutEastExit = x >= 10.0 && x <= 92.0 && Math.abs(z - (-345)) <= 7.2;
      const onSouthRoad = z <= -355 && z >= -475 && Math.abs(x) <= 6.0;
      const onCrossParkingStreet = x >= -8.0 && x <= 85.0 && Math.abs(z - (-360)) <= 6.5;

      // Wattle Creek Historic Village & Country Farmstead Network Drivability:
      const onVillageHighStreet = z >= 35 && z <= 232 && Math.abs(x) <= 6.0;
      const distToVillageGreen = Math.hypot(x, z - VILLAGE_ROUNDABOUT_Z);
      const onVillageGreenRoundabout = distToVillageGreen <= 22.0 && distToVillageGreen >= 8.5;
      const onVillageGreenPads = (z >= 215 && z <= 265 && Math.abs(x) <= 8.5);
      const onFarmsteadEastLane = x >= 10.0 && x <= 140.0 && Math.abs(z - 240) <= 6.0;
      const onFarmsteadSouthLane = z <= 252.0 && z >= -52.0 && Math.abs(x - 125) <= 6.0;
      const onFarmsteadReturnLane = x >= -5.0 && x <= 140.0 && Math.abs(z - (-40)) <= 6.0;
      const onOrchardWestLane = x <= -10.0 && x >= -98.0 && Math.abs(z - 240) <= 6.0;
      const onOrchardSouthLane = z <= 252.0 && z >= -282.0 && Math.abs(x - (-85)) <= 6.0;

      const isDrivableRoad = onNorthHighway || onBusBay || onIntersection270 || onTurnFillet270 ||
        onWestCivicBranch || onEastCommerceBranch || onApproachToRoundabout ||
        onRoundabout || onRoundaboutWestExit || onRoundaboutEastExit ||
        onSouthRoad || onCrossParkingStreet ||
        onVillageHighStreet || onVillageGreenRoundabout || onVillageGreenPads ||
        onFarmsteadEastLane || onFarmsteadSouthLane || onFarmsteadReturnLane ||
        onOrchardWestLane || onOrchardSouthLane;
      const isOffroad = !isDrivableRoad;

      if (isOffroad) {
        offroadDurationRef.current += delta;
        // Sustained offroad (>0.38s) or high speed (>12 km/h) constitutes true kerb mounting
        if ((offroadDurationRef.current > 0.38 || Math.abs(speedKmh) > 12) && !cur.isColliding) {
          cur.isColliding = true;
          soundManager.playKerbCollision();
          if (onKerbCollisionRef.current) onKerbCollisionRef.current();
        }
      } else {
        offroadDurationRef.current = 0;
        cur.isColliding = false;
      }

      // Check Stop Sign halt: at z between -280 and -290
      if (z < -280 && z > -290 && Math.abs(x) < 4.5) {
        if (Math.abs(speedKmh) < 0.5) {
          stopSignTimerRef.current += delta;
          if (stopSignTimerRef.current >= 3.0 && onStopSignHaltRef.current) {
            onStopSignHaltRef.current(stopSignTimerRef.current);
          }
        } else {
          stopSignTimerRef.current = 0;
        }
      }

      // Check Zebra crossing pedestrian yield: at z between -135 and -145
      if (z < -135 && z > -145 && Math.abs(x) < 4.0) {
        if (Math.abs(speedKmh) < 1.0) {
          zebraTimerRef.current += delta;
          if (zebraTimerRef.current >= 1.5 && onZebraStopRef.current) {
            onZebraStopRef.current();
          }
        }
      }

      // Check Roundabout entrance: z ~ -330
      if (z < -325 && z > -335 && onRoundaboutEnterRef.current) {
        onRoundaboutEnterRef.current();
      }

      // Check Parallel Park Bay: x near 45, z near -360 - ROAD_WIDTH/2 + 1.3
      if (x > 38 && x < 50 && z < -362 && z > -368 && onParkAlignCheckRef.current) {
        const kerbDist = Math.abs(z - (-364.5));
        const angleDiff = Math.abs(Math.sin(rotation - Math.PI / 2));
        onParkAlignCheckRef.current(kerbDist, angleDiff);
      }

      // Active Lane Discipline Checking in City Approach (z between -235 and -263)
      // Only active on approach BEFORE the intersection line to allow smooth turns
      if (z >= -263 && z <= -235) {
        const inRightTurnLane = x > 0.05 && x < 3.2;
        const inLeftTurnLane = x < -2.45 && x > -5.2;
        const inCenterLane = x >= -2.45 && x <= 0.05;
        const now = Date.now();

        if (inRightTurnLane) {
          // Under ARR Rule 32, right-turn lane MUST turn right. If driver steers left:
          if (cur.steering < -0.22 && (now - lastLaneAlertTimeRef.current > 4000)) {
            lastLaneAlertTimeRef.current = now;
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'wrong_turn_lane',
                message: 'LANE DISCIPLINE: Cannot turn left from marked Right-Turn lane! (ARR Rule 32).',
                ruleRef: 'ARR Rule 32'
              });
            }
          }
        } else if (inLeftTurnLane) {
          // Under ARR Rule 28, left-turn lane MUST turn left. If driver steers right:
          if (cur.steering > 0.22 && (now - lastLaneAlertTimeRef.current > 4000)) {
            lastLaneAlertTimeRef.current = now;
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'wrong_turn_lane',
                message: 'LANE DISCIPLINE: Cannot turn right from marked Left-Turn lane! (ARR Rule 28).',
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
            if (onLaneDisciplineAlertRef.current) {
              onLaneDisciplineAlertRef.current({
                type: 'solid_line_cross',
                message: 'SOLID LINE: You crossed a continuous solid line separating lanes (ARR Rule 147).',
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
      if (onSpeedCheckRef.current && Math.abs(speedKmh) > 0) {
        onSpeedCheckRef.current(Math.abs(speedKmh));
      }

      // Animate Southern Cross Windmill blades on Village Green
      if (windmillFanMesh) {
        windmillFanMesh.rotation.z += 1.6 * delta;
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

      // Update running physics simulation position
      physicsRef.current.x = x;
      physicsRef.current.z = z;
      physicsRef.current.rotation = rotation;
      physicsRef.current.speed = speedKmh;
      physicsRef.current.rpm = rpm;
      physicsRef.current.currentLane = currentLane;
      physicsRef.current.isColliding = isOffroad;
      physicsRef.current.indicatorsBlinkState = blinkState;

      // 5. Camera Management - Focused on the vehicle
      const shouldSnapCamera = cameraSnapNeededRef.current;
      if (shouldSnapCamera) {
        cameraSnapNeededRef.current = false;
      }

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
          if (shouldSnapCamera) {
            camera.position.set(camX, cameraHeight, camZ);
          } else {
            camera.position.lerp(new THREE.Vector3(camX, cameraHeight, camZ), 0.25);
          }
          camera.lookAt(x, 1.35, z + Math.cos(rotation) * 2.5);
        }
      } else if (cameraView === 'chase') {
        // Third person chase behind car - perfectly elevated & centered on the vehicle
        const cameraDist = 6.5;
        const cameraHeight = 2.6;
        const camX = x + Math.sin(rotation) * cameraDist;
        const camZ = z + Math.cos(rotation) * cameraDist;

        if (shouldSnapCamera) {
          camera.position.set(camX, cameraHeight, camZ);
        } else {
          camera.position.lerp(new THREE.Vector3(camX, cameraHeight, camZ), 0.18);
        }
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
          const inRange = distToCP <= Math.max(cpObj.radius, 7.5) || (Math.abs(z - cpObj.targetZ) <= 4.0 && Math.abs(x - cpObj.targetX) <= 6.5);
          const isAlreadyTriggered = completedList.includes(cpObj.id) || triggeredCheckpointsRef.current.has(cpObj.id);

          if (inRange && !isAlreadyTriggered) {
            triggeredCheckpointsRef.current.add(cpObj.id);
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

      // 5.5 Animate Dynamic Flowing Navigational Road Arrows
      const arrowTime = time * 0.0035;
      animatedRoadArrows.forEach((arr) => {
        const wave = Math.sin(arrowTime * 3.2 - arr.seqIndex * 0.35);
        const norm = (wave + 1) * 0.5; // 0 to 1
        arr.mat.opacity = 0.35 + 0.65 * norm;
        const scale = 0.94 + 0.16 * norm;
        arr.mesh.scale.set(scale, scale, 1);
      });

      // 5.6 Animate Dynamic Rain Falling Streaks
      if (rainLines && rainPositions && rainVelocities) {
        const rainGeo = rainLines.geometry;
        for (let i = 0; i < rainCount; i++) {
          const spd = rainVelocities[i];
          rainPositions[i * 6 + 1] -= spd * delta;
          rainPositions[i * 6 + 4] -= spd * delta;
          if (rainPositions[i * 6 + 1] < 0.1) {
            const rx = x + (Math.random() - 0.5) * 80;
            const rz = z + (Math.random() - 0.5) * 80;
            const ry = 25 + Math.random() * 8;
            rainPositions[i * 6] = rx;
            rainPositions[i * 6 + 1] = ry;
            rainPositions[i * 6 + 2] = rz;
            rainPositions[i * 6 + 3] = rx - 0.12;
            rainPositions[i * 6 + 4] = ry - 1.1;
            rainPositions[i * 6 + 5] = rz;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // 5.7 Animate School Zone Twin Amber Flashing Beacons
      if (schoolBeaconMat1 && schoolBeaconMat2) {
        const beaconPhase = Math.floor(time * 0.003) % 2;
        schoolBeaconMat1.color.setHex(beaconPhase === 0 ? 0xffb703 : 0x332200);
        schoolBeaconMat2.color.setHex(beaconPhase === 1 ? 0xffb703 : 0x332200);
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

      // Throttled sync to React state so Dashboard speedometer & controls are silky smooth without re-render thrashing
      const now = performance.now();
      if (now - lastStateSyncTimeRef.current > 40) {
        lastStateSyncTimeRef.current = now;
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

    if (effectiveEnv === 'rainy_wet') {
      soundManager.startRainAmbience();
    }

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
      soundManager.stopRainAmbience();
      if (trafficManagerRef.current) {
        trafficManagerRef.current.dispose();
        trafficManagerRef.current = null;
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraView, isNightMode, environment, setVehicleState]);

  // Sync hazard state dynamically with the AI traffic manager
  useEffect(() => {
    if (trafficManagerRef.current) {
      if (activeHazard !== 'none') {
        trafficManagerRef.current.triggerHazard(activeHazard, physicsRef.current.z);
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
