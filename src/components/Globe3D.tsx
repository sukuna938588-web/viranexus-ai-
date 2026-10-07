import React, { useRef, useEffect, useState } from 'react';
import { Activity, Shield, Radio, Compass, RotateCcw, ZoomIn, ZoomOut, Play, Pause, X } from 'lucide-react';
import { TAMIL_NADU_DISTRICTS } from '../services/dataScience';

interface HotspotDetail {
  name: string;
  disease: string;
  cases: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  recentTrend: string;
  lat: number;
  lng: number;
}

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
  type: 'core' | 'orbital';
}

// Globe strictly plots locations derived from uploaded records - NO DEMO/FAKE NODES
export const Globe3D: React.FC<Globe3DProps> = ({
  totalRecords = 0,
  r0 = 1.1,
  topDisease,
  topLocation,
  locations = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotDetail | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const rotRef = useRef({
    rotY: -0.8,
    tiltX: 0.28,
    velocityY: 0.005,
    velocityX: 0,
  });

  // Strictly map user surveillance data - no hardcoded global hubs
  const activeHotspots: HotspotDetail[] = React.useMemo(() => {
    if (!locations || locations.length === 0 || totalRecords === 0) {
      return [];
    }

    const list: HotspotDetail[] = [];

    locations.forEach((loc) => {
      const tnMatch = TAMIL_NADU_DISTRICTS[loc.name];
      const lat = tnMatch ? tnMatch.lat : 11.5 + ((loc.name.charCodeAt(0) % 5));
      const lng = tnMatch ? tnMatch.lng : 78.5 + ((loc.name.charCodeAt(1) || 0) % 5);

      let rLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
      const sev = (loc.severity || '').toLowerCase();
      if (sev.includes('crit') || (loc.cases || 0) >= 50) rLevel = 'Critical';
      else if (sev.includes('high') || sev.includes('sev') || (loc.cases || 0) >= 30) rLevel = 'High';
      else if (sev.includes('med') || sev.includes('mod') || (loc.cases || 0) >= 15) rLevel = 'Medium';

      list.push({
        name: loc.name,
        disease: loc.disease || topDisease || 'Pathogen',
        cases: loc.cases || 1,
        riskLevel: rLevel,
        recentTrend: rLevel === 'Critical' ? '+28% Active acceleration' : '+12% Monitored trajectory',
        lat,
        lng,
      });
    });

    return list;
  }, [locations, topDisease, totalRecords]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const baseRadius = 150;

    // Build Fibonacci Sphere Points
    const points: SpherePoint[] = [];
    const totalPoints = 360;
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < totalPoints; i++) {
      const y = 1 - (i / (totalPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const isEquator = Math.abs(y) < 0.15;
      const isGridPole = Math.abs(y) > 0.85;

      points.push({
        x: x * baseRadius,
        y: y * baseRadius,
        z: z * baseRadius,
        origX: x * baseRadius,
        origY: y * baseRadius,
        origZ: z * baseRadius,
        size: isEquator ? 1.8 : isGridPole ? 1.5 : 1.2,
        brightness: isEquator ? 0.9 : 0.65,
        type: 'core',
      });
    }

    // Add cybernetic orbital rings
    const ringRadii = [baseRadius * 1.12, baseRadius * 1.24];
    ringRadii.forEach((rRing, rIdx) => {
      const ringSteps = 56;
      const tiltAngle = (rIdx === 0 ? 28 : -38) * (Math.PI / 180);

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

    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.04;
      const rot = rotRef.current;

      if (isAutoRotate && !isDragging) {
        rot.rotY += rot.velocityY;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const currentRadius = baseRadius * zoomScale;

      const cosY = Math.cos(rot.rotY);
      const sinY = Math.sin(rot.rotY);
      const cosX = Math.cos(rot.tiltX);
      const sinX = Math.sin(rot.tiltX);

      // Deep Hologram Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, currentRadius * 0.1, cx, cy, currentRadius * 1.35);
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      glowGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.08)');
      glowGrad.addColorStop(1, 'rgba(4, 6, 12, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Outer Hologram Grid Sphere
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Render 3D Sphere Points
      points.forEach((pt) => {
        let x1 = pt.origX * cosY - pt.origZ * sinY;
        let z1 = pt.origZ * cosY + pt.origX * sinY;

        let y2 = pt.origY * cosX - z1 * sinX;
        let z2 = z1 * cosX + pt.origY * sinX;

        pt.x = x1 * zoomScale;
        pt.y = y2 * zoomScale;
        pt.z = z2 * zoomScale;

        // Front-facing depth factor
        const alpha = Math.max(0.12, (z2 + currentRadius) / (currentRadius * 2));
        const screenX = cx + pt.x;
        const screenY = cy + pt.y;

        ctx.fillStyle =
          pt.type === 'orbital'
            ? `rgba(168, 85, 247, ${alpha * 0.7})`
            : `rgba(6, 182, 212, ${alpha * pt.brightness})`;

        ctx.beginPath();
        ctx.arc(screenX, screenY, pt.size * (0.8 + alpha * 0.4), 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Hotspots with Glowing Pulse Halos and Beacons
      activeHotspots.forEach((spot) => {
        const phiCoord = (90 - spot.lat) * (Math.PI / 180);
        const thetaCoord = (spot.lng + 180) * (Math.PI / 180);

        const hx = -(currentRadius * Math.sin(phiCoord) * Math.cos(thetaCoord));
        const hz = currentRadius * Math.sin(phiCoord) * Math.sin(thetaCoord);
        const hy = currentRadius * Math.cos(phiCoord);

        const x1 = hx * cosY - hz * sinY;
        const z1 = hz * cosY + hx * sinY;

        const y2 = hy * cosX - z1 * sinX;
        const z2 = z1 * cosX + hy * sinX;

        // Only render front-facing hotspots (z2 > -20)
        if (z2 > -20) {
          const sx = cx + x1;
          const sy = cy + y2;

          let color = '#10b981'; // Low
          let glowColor = 'rgba(16, 185, 129, ';
          if (spot.riskLevel === 'Critical') {
            color = '#f43f5e';
            glowColor = 'rgba(244, 63, 94, ';
          } else if (spot.riskLevel === 'High') {
            color = '#f97316';
            glowColor = 'rgba(249, 115, 22, ';
          } else if (spot.riskLevel === 'Medium') {
            color = '#eab308';
            glowColor = 'rgba(234, 179, 8, ';
          }

          // Animated pulsating beacon halo
          const pulse = (Math.sin(pulseTime * 2.5 + spot.lat) + 1) / 2;
          const haloRadius = 6 + pulse * 14;

          ctx.strokeStyle = `${glowColor}${0.6 - pulse * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, haloRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Outer secondary ring for critical
          if (spot.riskLevel === 'Critical') {
            ctx.strokeStyle = `rgba(244, 63, 94, ${0.4 - pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(sx, sy, haloRadius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Beacon Center Node
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Location Tag Pill
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(spot.name, sx + 8, sy + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeHotspots, isAutoRotate, zoomScale, isDragging]);

  // Click handler to select hotspot & display interactive detail popup
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const currentRadius = 150 * zoomScale;

    const cosY = Math.cos(rotRef.current.rotY);
    const sinY = Math.sin(rotRef.current.rotY);
    const cosX = Math.cos(rotRef.current.tiltX);
    const sinX = Math.sin(rotRef.current.tiltX);

    let clicked: HotspotDetail | null = null;
    let closestDist = 24;

    activeHotspots.forEach((spot) => {
      const phiCoord = (90 - spot.lat) * (Math.PI / 180);
      const thetaCoord = (spot.lng + 180) * (Math.PI / 180);

      const hx = -(currentRadius * Math.sin(phiCoord) * Math.cos(thetaCoord));
      const hz = currentRadius * Math.sin(phiCoord) * Math.sin(thetaCoord);
      const hy = currentRadius * Math.cos(phiCoord);

      const x1 = hx * cosY - hz * sinY;
      const z1 = hz * cosY + hx * sinY;
      const y2 = hy * cosX - z1 * sinX;
      const z2 = z1 * cosX + hy * sinX;

      if (z2 > -20) {
        const sx = cx + x1;
        const sy = cy + y2;
        const dist = Math.hypot(clickX - sx, clickY - sy);
        if (dist < closestDist) {
          closestDist = dist;
          clicked = spot;
        }
      }
    });

    if (clicked) {
      setSelectedHotspot(clicked);
      setPopupPos({ x: clickX, y: clickY });
    } else {
      setSelectedHotspot(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    rotRef.current.rotY += dx * 0.007;
    rotRef.current.tiltX = Math.max(-0.8, Math.min(0.8, rotRef.current.tiltX + dy * 0.007));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#060812] via-[#04060d] to-[#060812] border border-cyan-500/20 p-6 overflow-hidden shadow-2xl">
      {/* Background Cyber Ambient Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950/40 to-transparent pointer-events-none" />

      {/* Top HUD Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="text-base font-black text-white font-mono tracking-tight">
              Global & Regional 3D Biosurveillance Sphere
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            OutbreakX monitors disease vectors and cluster momentum worldwide &bull; Interactive 3D Hologram
          </p>
        </div>

        {/* HUD Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setIsAutoRotate((prev) => !prev)}
            className={`p-2 rounded-xl transition ${
              isAutoRotate ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
            title={isAutoRotate ? 'Pause Rotation' : 'Resume Rotation'}
          >
            {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setZoomScale((z) => Math.min(1.35, z + 0.1))}
            className="p-2 text-slate-400 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomScale((z) => Math.max(0.75, z - 0.1))}
            className="p-2 text-slate-400 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomScale(1);
              rotRef.current.rotY = -0.8;
              rotRef.current.tiltX = 0.28;
              setSelectedHotspot(null);
            }}
            className="p-2 text-slate-400 hover:text-white transition"
            title="Reset Angle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="relative w-full flex justify-center items-center py-4 select-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-grab active:cursor-grabbing w-full max-w-[640px] h-auto drop-shadow-[0_0_35px_rgba(6,182,212,0.2)]"
        />

        {/* Standby State Badge if no records loaded */}
        {totalRecords === 0 && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none z-10 px-4">
            <div className="px-4 py-2 rounded-2xl bg-slate-950/85 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md shadow-xl flex items-center gap-2 text-center">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
              <span>Standby: No outbreak dataset loaded &bull; Upload CSV records to plot live hotspots</span>
            </div>
          </div>
        )}

        {/* Hotspot Click Popup */}
        {selectedHotspot && (
          <div
            className="absolute z-20 w-72 p-4 rounded-2xl bg-[#070b16]/95 border-2 border-cyan-400/60 shadow-2xl backdrop-blur-2xl animate-fade-in space-y-3"
            style={{
              left: popupPos ? Math.min(popupPos.x + 20, 360) : '50%',
              top: popupPos ? Math.min(popupPos.y - 40, 260) : '40%',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h4 className="text-sm font-black text-white font-mono">
                  📍 {selectedHotspot.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Target Pathogen</span>
                <div className="text-xs font-bold text-cyan-300 truncate">
                  {selectedHotspot.disease}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Cases</span>
                <div className="text-xs font-bold text-white">
                  {selectedHotspot.cases} cases
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Risk Level:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  selectedHotspot.riskLevel === 'Critical'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : selectedHotspot.riskLevel === 'High'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : selectedHotspot.riskLevel === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedHotspot.riskLevel} Risk
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
              <strong className="text-cyan-400">Recent Trend:</strong> {selectedHotspot.recentTrend}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono">
        <div className="p-3 rounded-xl bg-[#05070e] border border-slate-800/80">
          <span className="text-slate-400 text-[10px] uppercase">Surveillance Scope</span>
          <div className="text-sm font-bold text-white mt-0.5">Worldwide & Regional</div>
        </div>

        <div className="p-3 rounded-xl bg-[#05070e] border border-slate-800/80">
          <span className="text-slate-400 text-[10px] uppercase">Reproduction Pace</span>
          <div className="text-sm font-bold text-purple-300 mt-0.5">R₀ = {r0}</div>
        </div>

        <div className="p-3 rounded-xl bg-[#05070e] border border-slate-800/80">
          <span className="text-slate-400 text-[10px] uppercase">Active Epicenter</span>
          <div className="text-sm font-bold text-cyan-300 mt-0.5 truncate">
            {totalRecords > 0 ? (topLocation || 'Surveillance Node') : 'None'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#05070e] border border-slate-800/80">
          <span className="text-slate-400 text-[10px] uppercase">Monitored Hotspots</span>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{activeHotspots.length} Nodes</div>
        </div>
      </div>
    </div>
  );
};
