import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crosshair, Radio, Activity, AlertTriangle, MapPin, Zap, Info } from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';

interface HealthThreatRadarProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onOpenAddModal?: () => void;
  onSelectPage?: (page: any) => void;
}

interface RadarTarget {
  id: string;
  name: string;
  type: 'disease' | 'location';
  cases: number;
  riskScore: number;
  riskCategory: 'Low' | 'Medium' | 'High';
  angle: number; // in degrees
  distance: number; // 0.15 to 0.85
  growth: number;
  status: string;
}

export const HealthThreatRadar: React.FC<HealthThreatRadarProps> = ({
  intelligence,
  records,
  onOpenAddModal,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<RadarTarget | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'diseases' | 'locations'>('all');
  const [scanRotation, setScanRotation] = useState(0);

  // Rotate scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanRotation((prev) => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const { topDiseases, topZones, totalCases, highRiskZonesCount, liveAlerts } = intelligence;

  // Build dynamic radar targets from real user data
  const targets: RadarTarget[] = [];

  if (totalCases > 0) {
    // Add diseases
    topDiseases.forEach((dis, idx) => {
      const angle = (idx * (360 / Math.max(1, topDiseases.length + topZones.length)) + 25) % 360;
      const distance = Math.min(0.85, Math.max(0.2, dis.severeRate * 1.5 + (dis.percentage / 100) * 0.5));
      const riskCategory: 'Low' | 'Medium' | 'High' =
        dis.riskLevel === 'Critical' || dis.riskLevel === 'Elevated'
          ? 'High'
          : dis.riskLevel === 'Guarded'
          ? 'Medium'
          : 'Low';

      targets.push({
        id: `dis-${idx}`,
        name: dis.name,
        type: 'disease',
        cases: dis.count,
        riskScore: Math.round(dis.percentage * 0.5 + dis.severeRate * 50),
        riskCategory,
        angle,
        distance,
        growth: dis.growthRate,
        status: `Growth: ${dis.growthRate > 0 ? '+' : ''}${dis.growthRate}% | Severity: ${(dis.severeRate * 100).toFixed(0)}%`,
      });
    });

    // Add locations
    topZones.forEach((zone, idx) => {
      const angle =
        ((idx + topDiseases.length) * (360 / Math.max(1, topDiseases.length + topZones.length)) + 55) % 360;
      const distance = Math.min(0.85, Math.max(0.25, zone.riskScore / 100));

      targets.push({
        id: `zone-${idx}`,
        name: zone.name,
        type: 'location',
        cases: zone.count,
        riskScore: zone.riskScore,
        riskCategory: zone.riskCategory === 'High' ? 'High' : zone.riskCategory === 'Medium' ? 'Medium' : 'Low',
        angle,
        distance,
        growth: zone.weeklyGrowth,
        status: `Risk Index: ${zone.riskScore}/100 | Active in: ${zone.activeDiseases.slice(0, 2).join(', ')}`,
      });
    });
  }

  const filteredTargets = targets.filter((t) => {
    if (activeFilter === 'diseases') return t.type === 'disease';
    if (activeFilter === 'locations') return t.type === 'location';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080b14] border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Crosshair className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Health Threat Radar
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LIVE BIOSIGNALS
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Continuous real-time threat scanning powered by your loaded outbreak data
          </p>
        </div>

        {/* Live Counters */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tracked Signals</div>
            <div className="text-lg font-black font-mono text-cyan-400">{targets.length}</div>
          </div>
          <div className="px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">High Threats</div>
            <div className="text-lg font-black font-mono text-rose-400">
              {targets.filter((t) => t.riskCategory === 'High').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Radar Screen & Tactical Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Radar Circular Stage */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#060810] border border-cyan-500/30 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
          {/* Cyber Scan Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Filter Toolbar */}
          <div className="w-full flex items-center justify-between mb-4 z-10">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Signals ({targets.length})
              </button>
              <button
                onClick={() => setActiveFilter('diseases')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeFilter === 'diseases'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diseases ({topDiseases.length})
              </button>
              <button
                onClick={() => setActiveFilter('locations')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeFilter === 'locations'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Locations ({topZones.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>SWEEP: ACTIVE</span>
            </div>
          </div>

          {/* The Circular Radar Display */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 my-4 flex items-center justify-center select-none">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]" />
            <div className="absolute inset-[15%] rounded-full border border-cyan-500/25 border-dashed" />
            <div className="absolute inset-[35%] rounded-full border border-cyan-500/20" />
            <div className="absolute inset-[55%] rounded-full border border-cyan-500/20 border-dashed" />
            <div className="absolute inset-[75%] rounded-full border border-cyan-500/30" />

            {/* Crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
            </div>

            {/* Diagonal crosshairs */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-45">
              <div className="w-full h-[1px] bg-cyan-500/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -rotate-45">
              <div className="w-full h-[1px] bg-cyan-500/10" />
            </div>

            {/* Angle markers */}
            <span className="absolute top-2 text-[9px] font-mono text-cyan-400/70">000° N</span>
            <span className="absolute right-2 text-[9px] font-mono text-cyan-400/70">090° E</span>
            <span className="absolute bottom-2 text-[9px] font-mono text-cyan-400/70">180° S</span>
            <span className="absolute left-2 text-[9px] font-mono text-cyan-400/70">270° W</span>

            {/* Rotating Radar Sweep Line */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ transform: `rotate(${scanRotation}deg)` }}
            >
              <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent to-cyan-400 origin-left translate-x-1/2 shadow-[0_0_12px_#06b6d4]" />
              {/* Radar conical trailing glow */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: `conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.25) 0deg, rgba(6, 182, 212, 0) 65deg)`,
                }}
              />
            </div>

            {/* Center Core */}
            <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_15px_#06b6d4] z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Render Targets (Blips) */}
            {totalCases === 0 ? (
              <div className="absolute z-20 inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/75 backdrop-blur-sm rounded-full">
                <Radio className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
                <span className="text-xs font-mono font-bold text-white uppercase">No Dataset Loaded</span>
                <span className="text-[10px] text-slate-400 max-w-[200px] mt-1 font-medium">
                  Upload CSV or Add Records to Start Analysis
                </span>
                {onOpenAddModal && (
                  <button
                    onClick={onOpenAddModal}
                    className="mt-3 px-3.5 py-1.5 text-[11px] font-mono rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
                  >
                    + Add Records
                  </button>
                )}
              </div>
            ) : (
              filteredTargets.map((target) => {
                // Calculate position relative to center (radius = 50% of container)
                const rad = (target.angle * Math.PI) / 180;
                // Distance in pixels (assuming 384px width / 2 = 192px radius)
                const radiusPct = target.distance * 44; // 0 to 44% of radius
                const xPct = 50 + Math.cos(rad) * radiusPct;
                const yPct = 50 + Math.sin(rad) * radiusPct;

                const isSelected = selectedTarget?.id === target.id;
                const isHigh = target.riskCategory === 'High';
                const isMedium = target.riskCategory === 'Medium';

                const colorClass = isHigh
                  ? 'bg-rose-500 text-rose-400 border-rose-400 shadow-rose-500/50'
                  : isMedium
                  ? 'bg-amber-500 text-amber-400 border-amber-400 shadow-amber-500/50'
                  : 'bg-cyan-400 text-cyan-300 border-cyan-300 shadow-cyan-400/50';

                return (
                  <div
                    key={target.id}
                    style={{ left: `${xPct}%`, top: `${yPct}%` }}
                    onClick={() => setSelectedTarget(target)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                  >
                    {/* Pulsing ring */}
                    <div
                      className={`absolute -inset-2 rounded-full opacity-60 animate-ping ${
                        isHigh ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                    />

                    {/* Blip Target Dot */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 ${colorClass} shadow-[0_0_10px] transition-transform group-hover:scale-150 ${
                        isSelected ? 'scale-150 ring-2 ring-white' : ''
                      }`}
                    />

                    {/* Hover tooltip label */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col whitespace-nowrap bg-slate-900/95 border border-cyan-500/40 px-2 py-1 rounded-lg text-[10px] font-mono text-white shadow-xl z-30 pointer-events-none">
                      <span className="font-bold flex items-center gap-1">
                        {target.type === 'location' ? <MapPin className="w-2.5 h-2.5 text-cyan-400" /> : <Activity className="w-2.5 h-2.5 text-purple-400" />}
                        {target.name}
                      </span>
                      <span className="text-slate-400">
                        {target.cases} cases ({target.riskCategory} Risk)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Distance Legend */}
          <div className="w-full flex items-center justify-around pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Outer Ring: Low / Guarded Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Mid Ring: Moderate Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Inner Core: Critical Threat
            </span>
          </div>
        </div>

        {/* Tactical Readout & Signal Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Inspector Card */}
          <div className="p-6 rounded-3xl bg-[#080b15] border border-cyan-500/20 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                Target Telemetry
              </span>
              {selectedTarget && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedTarget.riskCategory === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {selectedTarget.riskCategory} Risk
                </span>
              )}
            </div>

            {selectedTarget ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Selected Signal</div>
                  <div className="text-xl font-black text-white">{selectedTarget.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{selectedTarget.status}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Case Count</div>
                    <div className="text-lg font-black font-mono text-cyan-400">{selectedTarget.cases}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Threat Score</div>
                    <div className="text-lg font-black font-mono text-purple-400">
                      {selectedTarget.riskScore}/100
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Recommended Protocol
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedTarget.riskCategory === 'High'
                      ? 'Immediate containment recommended. Deploy rapid diagnostic kits, mobilize surge clinical personnel, and notify local health workers.'
                      : 'Maintain daily surveillance logs. Check hospital isolation readiness and monitor patient recovery rates.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Click any glowing radar blip to inspect threat telemetry and containment protocols.
                </p>
              </div>
            )}
          </div>

          {/* Active Area Signals List */}
          <div className="p-5 rounded-3xl bg-[#080b15] border border-slate-800 backdrop-blur-xl">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase mb-3 flex items-center justify-between">
              <span>Active Signal List</span>
              <span className="text-[10px] text-cyan-400 font-mono">{filteredTargets.length} items</span>
            </h3>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredTargets.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">No signals to display.</div>
              ) : (
                filteredTargets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTarget(t)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                      selectedTarget?.id === t.id
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          t.riskCategory === 'High'
                            ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                            : t.riskCategory === 'Medium'
                            ? 'bg-amber-400'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span className="text-xs font-medium">{t.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{t.cases} cases</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
