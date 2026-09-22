import React, { useState, useMemo } from 'react';
import { Flame, MapPin, Activity, ShieldAlert, Sparkles, Filter, Info } from 'lucide-react';
import { ZoneStat } from '../../types';

interface AreaRiskHeatmapProps {
  zones: ZoneStat[];
  totalCases: number;
}

export const AreaRiskHeatmap: React.FC<AreaRiskHeatmapProps> = ({ zones = [], totalCases = 0 }) => {
  const [selectedZone, setSelectedZone] = useState<ZoneStat | null>(null);
  const [intensityMode, setIntensityMode] = useState<'risk' | 'density' | 'growth'>('risk');

  const processedZones = useMemo(() => {
    if (!zones || zones.length === 0 || totalCases === 0) return [];

    return zones.map((z) => {
      const densityPct = totalCases > 0 ? (z.count / totalCases) * 100 : 0;
      const normalizedScore = z.riskScore;

      // Color mapping according to intensity
      let heatBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      let heatGlow = 'rgba(16, 185, 129, 0.2)';
      let heatBar = 'from-emerald-500 to-emerald-600';
      let intensityTier = 'LOW INTENSITY';

      if (normalizedScore >= 75) {
        heatBg = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
        heatGlow = 'rgba(244, 63, 94, 0.4)';
        heatBar = 'from-rose-600 via-rose-500 to-amber-500';
        intensityTier = 'CRITICAL HEAT';
      } else if (normalizedScore >= 50) {
        heatBg = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
        heatGlow = 'rgba(245, 158, 11, 0.3)';
        heatBar = 'from-amber-600 to-amber-500';
        intensityTier = 'HIGH HEAT';
      } else if (normalizedScore >= 30) {
        heatBg = 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';
        heatGlow = 'rgba(6, 182, 212, 0.25)';
        heatBar = 'from-cyan-600 to-cyan-500';
        intensityTier = 'ELEVATED HEAT';
      }

      return {
        ...z,
        densityPct: Number(densityPct.toFixed(1)),
        heatBg,
        heatGlow,
        heatBar,
        intensityTier,
      };
    }).sort((a, b) => {
      if (intensityMode === 'risk') return b.riskScore - a.riskScore;
      if (intensityMode === 'density') return b.count - a.count;
      return b.weeklyGrowth - a.weeklyGrowth;
    });
  }, [zones, totalCases, intensityMode]);

  if (totalCases === 0 || zones.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[320px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
          <Flame className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Heatmap Visualization</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No geographic records available. Upload dataset to render area-wise risk intensity matrix.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0c0d1e]/95 to-[#060812]/95 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Flame className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Heatmap Visualization
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                AREA-WISE RISK INTENSITY
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Intensity gradient across {processedZones.length} geographic clusters
            </p>
          </div>
        </div>

        {/* Intensity Metric Selector */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setIntensityMode('risk')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              intensityMode === 'risk' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Score
          </button>
          <button
            onClick={() => setIntensityMode('density')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              intensityMode === 'density' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Case Density
          </button>
          <button
            onClick={() => setIntensityMode('growth')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${
              intensityMode === 'growth' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Growth Rate
          </button>
        </div>
      </div>

      {/* Heatmap Grid Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mb-5">
        {processedZones.map((zone) => {
          const isSelected = selectedZone?.name === zone.name;
          const displayVal =
            intensityMode === 'risk'
              ? `${zone.riskScore}/100`
              : intensityMode === 'density'
              ? `${zone.count} cases (${zone.densityPct}%)`
              : `${zone.weeklyGrowth > 0 ? '+' : ''}${zone.weeklyGrowth}%`;

          return (
            <div
              key={zone.name}
              onClick={() => setSelectedZone(isSelected ? null : zone)}
              className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] ${
                isSelected
                  ? 'ring-2 ring-rose-400 shadow-xl scale-[1.02]'
                  : 'hover:scale-[1.01] hover:brightness-110'
              } ${zone.heatBg}`}
              style={{
                boxShadow: isSelected ? `0 0 20px ${zone.heatGlow}` : undefined,
              }}
            >
              {/* Background Heat Intensity Bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${zone.heatBar}`}
                style={{ width: `${Math.max(15, zone.riskScore)}%` }}
              />

              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1 truncate font-mono">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  {zone.name}
                </span>
                <span className="text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 border border-white/10 shrink-0">
                  {zone.intensityTier.split(' ')[0]}
                </span>
              </div>

              <div>
                <div className="text-lg font-black text-white font-mono tracking-tight">
                  {displayVal}
                </div>
                <div className="text-[10px] font-mono text-slate-300 mt-0.5 flex items-center justify-between">
                  <span>{zone.count} cases</span>
                  <span className={zone.weeklyGrowth > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {zone.weeklyGrowth > 0 ? `+${zone.weeklyGrowth}%` : `${zone.weeklyGrowth}%`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Zone Intelligence Detail Card */}
      {selectedZone && (
        <div className="p-4 rounded-2xl bg-[#090b1c] border border-rose-500/40 text-xs font-mono text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <div>
              <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                {selectedZone.name} Detailed Sector Heat Index
              </div>
              <div className="text-[11px] text-slate-400">
                Risk: {selectedZone.riskScore}/100 • Critical: {selectedZone.severeCases} • Active Pathogens: {selectedZone.activeDiseases?.join(', ') || 'N/A'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedZone(null)}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
          >
            Close Detail
          </button>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Heat (≥75)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High Heat (50-74)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Elevated Heat (30-49)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Contained (&lt;30)
          </span>
        </div>
        <div className="text-slate-500">Click any sector to inspect micro-telemetry</div>
      </div>
    </div>
  );
};
