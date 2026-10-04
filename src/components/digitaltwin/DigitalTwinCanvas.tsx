import { BatteryCharging, Eye, Power, RotateCcw, Sun, Zap } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';

interface DigitalTwinCanvasProps {
  solarKw?: number;
  demandKw?: number;
  batterySoc?: number;
  isSimulating?: boolean;
  extraLoadKw?: number;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  solarKw = 6.4,
  demandKw = 2.1,
  batterySoc = 82,
  isSimulating = false,
  extraLoadKw = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeComponent, setActiveComponent] = useState<string>('Overview');
  const effectiveDemand = demandKw + extraLoadKw;
  const netExport = solarKw - effectiveDemand;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(10, 8, 12);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffecd2, 1.8);
    sunLight.position.set(12, 18, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const cyberPoint = new THREE.PointLight(0x06b6d4, 2.5, 15);
    cyberPoint.position.set(-2, 3, 2);
    scene.add(cyberPoint);

    const batteryPoint = new THREE.PointLight(0x10b981, 2.0, 10);
    batteryPoint.position.set(3.5, 1, -2);
    scene.add(batteryPoint);

    // 3. Ground grid
    const gridHelper = new THREE.GridHelper(24, 24, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 4. Main Smart Home Group
    const houseGroup = new THREE.Group();

    // Base concrete slab
    const slabGeo = new THREE.BoxGeometry(6, 0.3, 5);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 0.15;
    slab.receiveShadow = true;
    houseGroup.add(slab);

    // Main building volume (semi-translucent cyber architectural style)
    const wallGeo = new THREE.BoxGeometry(4.8, 2.4, 3.8);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.set(0, 1.45, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Large glass window facade
    const glassGeo = new THREE.PlaneGeometry(2.4, 1.6);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.8,
      opacity: 1,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.5, 1.91);
    houseGroup.add(glass);

    // Angled Photovoltaic Roof
    const roofGeo = new THREE.BoxGeometry(5.2, 0.15, 4.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 2.8, 0);
    roof.rotation.x = -0.15;
    houseGroup.add(roof);

    // Solar panels on roof (3x2 grid of glowing blue cells)
    const panelGroup = new THREE.Group();
    for (let rx = -1.6; rx <= 1.6; rx += 1.6) {
      for (let rz = -1.2; rz <= 1.2; rz += 1.2) {
        const panelGeo = new THREE.BoxGeometry(1.3, 0.05, 0.9);
        const panelMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x0369a1,
          emissiveIntensity: 0.3,
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(rx, 2.9, rz);
        panel.rotation.x = -0.15;
        panelGroup.add(panel);
      }
    }
    houseGroup.add(panelGroup);

    // Battery Storage Enclosure (ESS)
    const batteryGeo = new THREE.BoxGeometry(0.8, 1.4, 0.6);
    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x059669,
      emissiveIntensity: 0.4,
    });
    const battery = new THREE.Mesh(batteryGeo, batteryMat);
    battery.position.set(3.2, 0.8, -1.0);
    battery.castShadow = true;
    houseGroup.add(battery);

    // Smart Meter AMI unit with status pulse
    const meterGeo = new THREE.BoxGeometry(0.3, 0.4, 0.2);
    const meterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
    });
    const meter = new THREE.Mesh(meterGeo, meterMat);
    meter.position.set(-2.5, 1.2, 1.95);
    houseGroup.add(meter);

    // EV Charging station
    const chargerGeo = new THREE.BoxGeometry(0.3, 1.1, 0.3);
    const chargerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });
    const charger = new THREE.Mesh(chargerGeo, chargerMat);
    charger.position.set(-3.2, 0.6, -1.2);
    houseGroup.add(charger);

    // Stylized EV Car placeholder
    const carGeo = new THREE.BoxGeometry(1.6, 0.8, 3.2);
    const carMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2,
    });
    const car = new THREE.Mesh(carGeo, carMat);
    car.position.set(-4.5, 0.45, -1.2);
    car.castShadow = true;
    houseGroup.add(car);

    scene.add(houseGroup);

    // 5. Dynamic Power Flow Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Interactive Orbit & Rotation Handling
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0.3;
    let targetRotationX = 0.05;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.006;
      targetRotationX = Math.max(-0.2, Math.min(0.8, targetRotationX));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 7. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth rotation dampening
      houseGroup.rotation.y += (targetRotationY - houseGroup.rotation.y) * 0.08;
      houseGroup.rotation.x += (targetRotationX - houseGroup.rotation.x) * 0.08;

      // Particle oscillation representing energy flow
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsed * 2 + i) * 0.005;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Pulse meter and battery lights
      cyberPoint.intensity = 2.0 + Math.sin(elapsed * 4) * 0.8;
      batteryPoint.intensity = 1.6 + Math.cos(elapsed * 3) * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      if (container && domEl.parentNode === container) {
        container.removeChild(domEl);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className="relative w-full h-[450px] md:h-[500px] rounded-2xl overflow-hidden border border-border bg-slate-950 shadow-2xl">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Telemetry Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-background/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/60 text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-foreground">Digital Twin 3D</span>
          <span className="text-muted-foreground font-mono">Matter 1.4 Virtualized</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs shadow-md flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-medium">{solarKw.toFixed(1)} kW PV</span>
          </div>

          <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs shadow-md flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-medium">{effectiveDemand.toFixed(1)} kW Load</span>
          </div>

          <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs shadow-md flex items-center gap-2">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-medium">{batterySoc}% ESS</span>
          </div>
        </div>
      </div>

      {/* Floating Interactive HUD at Bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex gap-1.5 bg-background/80 backdrop-blur-md p-1.5 rounded-xl border border-border/60 shadow-lg text-xs">
          {['Overview', 'Fotowoltaika', 'Bateria ESS', 'Ładowarka EV'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveComponent(tab)}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeComponent === tab
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 shadow-lg text-xs">
          <span className="text-muted-foreground">Bilans sieci:</span>
          <span
            className={`font-mono font-semibold ${
              netExport >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {netExport >= 0
              ? `+${netExport.toFixed(2)} kW (Eksport)`
              : `${netExport.toFixed(2)} kW (Import)`}
          </span>
        </div>
      </div>

      {/* Instruction tooltip */}
      <div className="absolute top-16 left-4 pointer-events-none text-[11px] text-muted-foreground/70 flex items-center gap-1 font-mono">
        <Eye className="w-3.5 h-3.5" /> Przeciągnij myszą, aby obracać model 3D
      </div>
    </div>
  );
};
