import React, { useRef, useEffect, useState } from 'react';
import { Activity, Shield, Radio, Compass } from 'lucide-react';
import { resolveSmartLocation } from '../services/locationService';

interface Globe3DProps {
  totalRecords: number;
  r0: number;
  topDisease?: string;
  topLocation?: string;
  locations?: Array<{ name: string; cases?: number; disease?: string; severity?: string }>;
}

interface SpherePoint {
  x: number;
  y: number;
  z: number;
  origX: number;
  origY: number;
  origZ: number;
  size: number;
  brightness: number;
  type: 'core' | 'ring' | 'orbital' | 'grid';
}

interface CyberHotspot {
  name: string;
  disease?: string;
  cases: number;
  origX: number;
  origY: number;
  origZ: number;
  color: string;
  coreColor: string;
}

export const Globe3D: React.FC<Globe3DProps> = ({
  totalRecords = 0,
  r0 = 0,
  topDisease = '',
  topLocation = '',
  locations = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Physics rotation ref with inertia
  const rotRef = useRef({
    rotY: 0,
    tiltX: 0.25,
    velocityY: 0.004,
    velocityX: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const radius = 135;

    // 1. Build Multi-layered 3D Cybernetic Hologram Points (Fibonacci sphere + orbital rings)
    const points: SpherePoint[] = [];
    const totalPoints = 320;
    const phi = Math.PI * (3 - Math.sqrt(5)); // golden ratio angle

    for (let i = 0; i < totalPoints; i++) {
      const y = 1 - (i / (totalPoints - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Brightness variations for holographic depth
      const isGridPole = Math.abs(y) > 0.85;
      const isEquator = Math.abs(y) < 0.15;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        origX: x * radius,
        origY: y * radius,
        origZ: z * radius,
        size: isEquator ? 1.8 : isGridPole ? 1.6 : 1.2,
        brightness: isEquator ? 0.9 : 0.7,
        type: 'core',
      });
    }

    // 2. Add concentric cybernetic orbital particle rings
    const ringRadii = [radius * 1.08, radius * 1.2];
    ringRadii.forEach((rRing, rIdx) => {
      const ringSteps = 48;
      const tiltAngle = (rIdx === 0 ? 25 : -40) * (Math.PI / 180);

      for (let s = 0; s < ringSteps; s++) {
        const ang = (s / ringSteps) * Math.PI * 2;
        const px = Math.cos(ang) * rRing;
        const py = Math.sin(ang) * rRing * Math.sin(tiltAngle);
        const pz = Math.sin(ang) * rRing * Math.cos(tiltAngle);

        points.push({
          x: px,
          y: py,
          z: pz,
          origX: px,
          origY: py,
          origZ: pz,
          size: 1.0,
          brightness: 0.5,
          type: 'orbital',
        });
      }
    });

    // 3. Build Dynamic Hotspots from User Surveillance Data
    const hotspots: CyberHotspot[] = [];

    if (totalRecords > 0) {
      const locList =
        locations.length > 0
          ? locations
          : topLocation
          ? [{ name: topLocation, disease: topDisease, cases: totalRecords }]
          : [];

      locList.slice(0, 5).forEach((item, idx) => {
        const smart = resolveSmartLocation(item.name);
        const lat = smart.latitude || 12.0 + ((idx * 28 + 15) % 65) - 20;
        const lon = smart.longitude || 78.0 + ((idx * 55 + 20) % 180) - 90;

        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;

        let color = '#06b6d4'; // cyan
        let coreColor = '#22d3ee';
        if (item.severity === 'Critical' || idx === 0) {
          color = '#f43f5e'; // neon rose
          coreColor = '#fb7185';
        } else if (item.severity === 'Severe' || idx === 1) {
          color = '#a855f7'; // purple
          coreColor = '#c084fc';
        }

        hotspots.push({
          name: item.name,
          disease: item.disease || topDisease,
          cases: item.cases || Math.ceil(totalRecords / Math.max(1, locList.length)),
          origX: radius * Math.cos(latRad) * Math.cos(lonRad),
          origY: radius * Math.sin(latRad),
          origZ: radius * Math.cos(latRad) * Math.sin(lonRad),
          color,
          coreColor,
        });
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Update rotation with gentle inertia
      if (!isDragging) {
        rotRef.current.rotY += rotRef.current.velocityY;
        rotRef.current.tiltX += rotRef.current.velocityX;
        rotRef.current.velocityX *= 0.95; // damping
      }

      const rotY = rotRef.current.rotY;
      const tiltX = rotRef.current.tiltX;

      const cosRot = Math.cos(rotY);
      const sinRot = Math.sin(rotY);
      const cosTilt = Math.cos(tiltX);
      const sinTilt = Math.sin(tiltX);

      // --- LAYER 1: Deep Volumetric Holographic Glow ---
      const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.4);
      if (totalRecords > 0) {
        outerGlow.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
        outerGlow.addColorStop(0.4, 'rgba(147, 51, 234, 0.10)');
        outerGlow.addColorStop(0.75, 'rgba(6, 182, 212, 0.03)');
      } else {
        outerGlow.addColorStop(0, 'rgba(71, 85, 105, 0.12)');
        outerGlow.addColorStop(0.6, 'rgba(30, 41, 59, 0.04)');
      }
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // --- LAYER 2: Inner Deep Dark Energy Core ---
      const coreGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius * 0.96);
      if (totalRecords > 0) {
        coreGlow.addColorStop(0, '#0c162e');
        coreGlow.addColorStop(0.6, '#060a17');
        coreGlow.addColorStop(1, '#02040a');
      } else {
        coreGlow.addColorStop(0, '#0f1422');
        coreGlow.addColorStop(0.7, '#070a13');
        coreGlow.addColorStop(1, '#020307');
      }
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.96, 0, Math.PI * 2);
      ctx.fill();

      // --- LAYER 3: Holographic Equatorial Ring ---
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = totalRecords > 0 ? 'rgba(6, 182, 212, 0.35)' : 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = totalRecords > 0 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(100, 116, 139, 0.2)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Project all 3D points
      interface ProjectedPoint {
        sx: number;
        sy: number;
        sz: number;
        size: number;
        brightness: number;
        type: string;
      }

      const projected: ProjectedPoint[] = [];

      points.forEach((p) => {
        // Y rotation
        const rx = p.origX * cosRot - p.origZ * sinRot;
        const rz = p.origX * sinRot + p.origZ * cosRot;

        // X tilt
        const ry = p.origY * cosTilt - rz * sinTilt;
        const finalZ = p.origY * sinTilt + rz * cosTilt;

        // Perspective scale factor
        const fov = 340;
        const scale = fov / (fov + finalZ);
        const sx = cx + rx * scale;
        const sy = cy - ry * scale;

        projected.push({
          sx,
          sy,
          sz: finalZ,
          size: p.size * scale,
          brightness: p.brightness,
          type: p.type,
        });
      });

      // Sort by Z for true 3D depth perception
      projected.sort((a, b) => a.sz - b.sz);

      // Render projected points with depth coloring
      projected.forEach((p) => {
        // Normalize Z depth (-radius to +radius)
        const depthRatio = (p.sz + radius * 1.2) / (radius * 2.4);
        const alpha = Math.max(0.08, Math.min(1, depthRatio * p.brightness));

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.size, 0, Math.PI * 2);

        if (totalRecords > 0) {
          if (p.type === 'orbital') {
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.7})`;
          } else if (p.sz > 30) {
            ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          } else if (p.sz > -30) {
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha * 0.75})`;
          } else {
            ctx.fillStyle = `rgba(147, 51, 234, ${alpha * 0.4})`;
          }
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${alpha * 0.45})`;
        }

        ctx.fill();
      });

      // --- LAYER 4: Animated Great-Circle Cyber Transmission Arcs ---
      if (totalRecords > 0 && hotspots.length > 1) {
        const time = Date.now() / 1000;

        for (let i = 0; i < hotspots.length - 1; i++) {
          const h1 = hotspots[i];
          const h2 = hotspots[i + 1];

          // Project h1
          const rx1 = h1.origX * cosRot - h1.origZ * sinRot;
          const rz1 = h1.origX * sinRot + h1.origZ * cosRot;
          const ry1 = h1.origY * cosTilt - rz1 * sinTilt;
          const z1 = h1.origY * sinTilt + rz1 * cosTilt;

          // Project h2
          const rx2 = h2.origX * cosRot - h2.origZ * sinRot;
          const rz2 = h2.origX * sinRot + h2.origZ * cosRot;
          const ry2 = h2.origY * cosTilt - rz2 * sinTilt;
          const z2 = h2.origY * sinTilt + rz2 * cosTilt;

          if (z1 > -40 || z2 > -40) {
            const fov = 340;
            const s1 = fov / (fov + z1);
            const s2 = fov / (fov + z2);

            const sx1 = cx + rx1 * s1;
            const sy1 = cy - ry1 * s1;
            const sx2 = cx + rx2 * s2;
            const sy2 = cy - ry2 * s2;

            const midX = (sx1 + sx2) / 2;
            const midY = (sy1 + sy2) / 2 - 28; // high curvature arc

            // Draw cyber arc line
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.quadraticCurveTo(midX, midY, sx2, sy2);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.lineWidth = 1.3;
            ctx.stroke();

            // Animated light particle traveling along arc
            const t = (time * 0.55 + i * 0.28) % 1;
            const px = (1 - t) * (1 - t) * sx1 + 2 * (1 - t) * t * midX + t * t * sx2;
            const py = (1 - t) * (1 - t) * sy1 + 2 * (1 - t) * t * midY + t * t * sy2;

            ctx.beginPath();
            ctx.arc(px, py, 2.6, 0, Math.PI * 2);
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // --- LAYER 5: Hotspot Nodes with Radiating Sonar Pulses & Beacons ---
      if (totalRecords > 0) {
        const timeNow = Date.now();

        hotspots.forEach((h, idx) => {
          const rx = h.origX * cosRot - h.origZ * sinRot;
          const rz = h.origX * sinRot + h.origZ * cosRot;
          const ry = h.origY * cosTilt - rz * sinTilt;
          const finalZ = h.origY * sinTilt + rz * cosTilt;

          if (finalZ > -15) {
            const fov = 340;
            const scale = fov / (fov + finalZ);
            const sx = cx + rx * scale;
            const sy = cy - ry * scale;
            const frontAlpha = Math.min(1, (finalZ + 15) / 60);

            // 1. Concentric Expanding Pulse Rings (Sonar Radar)
            const pulsePhase = (timeNow / 850 + idx * 0.35) % 1;
            const pulseRadius = (6 + pulsePhase * 22) * scale;
            const pulseOpacity = (1 - pulsePhase) * frontAlpha * 0.85;

            ctx.beginPath();
            ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `${h.color}${Math.round(pulseOpacity * 255)
              .toString(16)
              .padStart(2, '0')}`;
            ctx.lineWidth = 1.3;
            ctx.stroke();

            // 2. Rising Energy Beacon Pillar
            const normalX = rx / radius;
            const normalY = -ry / radius;
            const pillarHeight = 18 * scale;
            const topX = sx + normalX * pillarHeight;
            const topY = sy + normalY * pillarHeight;

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(topX, topY);
            ctx.strokeStyle = `${h.color}cc`;
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Beacon Tip
            ctx.beginPath();
            ctx.arc(topX, topY, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // 3. Hotspot Epicenter Core with Neon Glow
            ctx.beginPath();
            ctx.arc(sx, sy, 4.2 * scale, 0, Math.PI * 2);
            ctx.fillStyle = h.coreColor;
            ctx.shadowColor = h.color;
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;

            // 4. Futuristic Floating Tag Label
            if (idx === 0 || finalZ > 45) {
              ctx.font = 'bold 9px JetBrains Mono, monospace';
              const labelText = `${h.name} (${h.cases})`;
              const textWidth = ctx.measureText(labelText).width;

              const tagX = topX + 6;
              const tagY = topY - 7;

              ctx.fillStyle = 'rgba(6, 9, 18, 0.92)';
              ctx.strokeStyle = `${h.color}aa`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect
                ? ctx.roundRect(tagX, tagY, textWidth + 8, 14, 4)
                : ctx.rect(tagX, tagY, textWidth + 8, 14);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.fillText(labelText, tagX + 4, tagY + 10);
            }
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [r0, topDisease, topLocation, totalRecords, locations, isDragging]);

  // Drag interaction with inertia
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    rotRef.current.rotY += deltaX * 0.007;
    rotRef.current.tiltX = Math.max(
      -0.6,
      Math.min(0.6, rotRef.current.tiltX + deltaY * 0.004)
    );
    rotRef.current.velocityX = deltaY * 0.0004;

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative flex items-center justify-center w-full max-w-[430px] aspect-square mx-auto select-none group">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        width={430}
        height={430}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing"
        title="Interactive 3D Biosurveillance Sphere: Drag to rotate"
      />

      {/* Futuristic Telemetry Indicator (Top Left) */}
      <div className="absolute top-2 left-0 z-20 p-2.5 rounded-2xl bg-[#080c18]/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl text-left pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold uppercase">
          <Activity className="w-3 h-3 text-cyan-400" />
          Biosurveillance Core
        </div>
        <div className="text-xs font-black font-mono text-white mt-0.5">
          {totalRecords > 0 ? (
            <>
              {r0 > 0 ? r0 : '--'}{' '}
              <span className="text-[10px] font-normal text-slate-400">Velocity (R₀)</span>
            </>
          ) : (
            <span className="text-slate-400 font-mono">Standby (0 Records)</span>
          )}
        </div>
      </div>

      {/* Outbreak / Dataset Status (Bottom Right) */}
      <div className="absolute bottom-4 right-0 z-20 p-2.5 rounded-2xl bg-[#080c18]/90 border border-slate-700/60 backdrop-blur-xl shadow-xl text-left pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 font-bold uppercase">
          <Radio
            className={`w-3 h-3 ${
              totalRecords > 0 ? 'text-rose-400 animate-ping' : 'text-slate-500'
            }`}
          />
          {totalRecords > 0 ? 'Active Epicenter' : 'Surveillance State'}
        </div>
        <div className="text-xs font-bold text-white mt-0.5 max-w-[150px] truncate">
          {totalRecords > 0 && topLocation ? (
            <>
              {topLocation} {topDisease ? `• ${topDisease}` : ''}
            </>
          ) : (
            <span className="text-slate-400">No Dataset Loaded</span>
          )}
        </div>
      </div>

      {/* Interaction Hint (Bottom Left) */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md text-[10px] font-mono text-slate-400 pointer-events-none">
        <Compass className="w-3 h-3 text-cyan-400" />
        <span>Drag sphere to rotate</span>
      </div>
    </div>
  );
};
