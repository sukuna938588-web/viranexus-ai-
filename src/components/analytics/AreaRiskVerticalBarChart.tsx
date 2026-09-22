import React, { useState } from 'react';
import { BarChart3, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ZoneStat } from '../../types';

interface AreaRiskVerticalBarChartProps {
  zones: ZoneStat[];
  totalCases: number;
}

export const AreaRiskVerticalBarChart: React.FC<AreaRiskVerticalBarChartProps> = ({
  zones = [],
  totalCases = 0,
}) => {
  const [hoveredZone, setHoveredZone] = useState<ZoneStat | null>(null);
  const [metric, setMetric] = useState<'riskScore' | 'count'>('riskScore');

  if (totalCases === 0 || zones.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
          <BarChart3 className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Area Risk Vertical Bar Chart</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No location records indexed yet. Upload surveillance cases to analyze regional risk gradients.
        </p>
      </div>
    );
  }

  // Display top 8 zones to keep chart readable and elegant
  const displayZones = zones.slice(0, 8);
  const highestRiskZone = [...displayZones].sort((a, b) => b.riskScore - a.riskScore)[0];
  const maxVal =
    metric === 'riskScore'
      ? 100
      : Math.max(...displayZones.map((z) => z.count), 1);

  const chartHeight = 180;
  const barWidth = 28;

  const getRiskColor = (score: number, cat: string) => {
    if (score >= 70 || cat === 'High') {
      return {
        bar: 'from-rose-500 to-rose-700',
        stroke: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.4)',
        badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      };
    }
    if (score >= 40 || cat === 'Medium') {
      return {
        bar: 'from-amber-500 to-amber-700',
        stroke: '#eab308',
        glow: 'rgba(234, 179, 8, 0.4)',
        badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    }
    return {
      bar: 'from-emerald-500 to-emerald-700',
      stroke: '#10b981',
      glow: 'rgba(16, 185, 129, 0.4)',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    };
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header with Metric Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Area Risk Vertical Bar Chart</h3>
            <p className="text-[11px] text-slate-400 font-mono">Geographic threat severity & volume</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setMetric('riskScore')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
              metric === 'riskScore'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Score (0-100)
          </button>
          <button
            onClick={() => setMetric('count')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
              metric === 'count'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Case Volume
          </button>
        </div>
      </div>

      {/* Vertical Bars Stage */}
      <div className="relative pt-6 pb-2">
        {/* Threshold guidelines if viewing riskScore */}
        {metric === 'riskScore' && (
          <div className="absolute inset-x-0 top-6 pointer-events-none" style={{ height: chartHeight }}>
            {/* Critical 70 Line */}
            <div
              className="absolute w-full border-b border-rose-500/30 border-dashed flex justify-between items-center text-[9px] font-mono text-rose-400 px-1"
              style={{ bottom: `${70}%` }}
            >
              <span>Critical (70)</span>
            </div>
            {/* Moderate 40 Line */}
            <div
              className="absolute w-full border-b border-amber-500/25 border-dashed flex justify-between items-center text-[9px] font-mono text-amber-400 px-1"
              style={{ bottom: `${40}%` }}
            >
              <span>Elevated (40)</span>
            </div>
          </div>
        )}

        {/* Vertical Bars Container */}
        <div
          className="flex items-end justify-between gap-2 sm:gap-4 relative z-10 px-2"
          style={{ height: chartHeight }}
        >
          {displayZones.map((zone) => {
            const rawVal = metric === 'riskScore' ? zone.riskScore : zone.count;
            const heightPct = Math.max(8, Math.round((rawVal / maxVal) * 100));
            const colors = getRiskColor(zone.riskScore, zone.riskCategory);
            const isHovered = hoveredZone?.name === zone.name;
            const isHighestRisk = highestRiskZone?.name === zone.name;

            return (
              <div
                key={zone.name}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group/bar cursor-pointer relative"
              >
                {/* Highest Risk Highlight Callout */}
                {isHighestRisk && (
                  <span className="absolute -top-6 px-1.5 py-0.5 rounded text-[8px] font-mono font-black bg-rose-500 text-white uppercase shadow-lg shadow-rose-950/80 animate-pulse whitespace-nowrap z-20 border border-rose-400">
                    HIGHEST RISK
                  </span>
                )}

                {/* Value Label above Bar */}
                <div
                  className={`text-[10px] font-mono font-bold mb-1 transition-transform ${
                    isHovered || isHighestRisk ? 'scale-110 text-white' : 'text-slate-400'
                  }`}
                >
                  {rawVal}
                </div>

                {/* Vertical Bar */}
                <div
                  className={`w-full max-w-[36px] rounded-t-xl bg-gradient-to-t ${colors.bar} transition-all duration-300 relative ${
                    isHighestRisk ? 'ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-rose-500/30' : ''
                  } ${isHovered ? 'brightness-125 scale-x-105' : 'opacity-90'}`}
                  style={{
                    height: `${heightPct}%`,
                    boxShadow: isHovered || isHighestRisk ? `0 0 16px ${colors.glow}` : undefined,
                  }}
                >
                  {/* Top neon cap */}
                  <div
                    className="w-full h-1 rounded-t-xl"
                    style={{ backgroundColor: colors.stroke }}
                  />
                </div>

                {/* Zone Name Label */}
                <div className="mt-2 text-center w-full">
                  <span
                    className={`block text-[10px] font-mono truncate px-1 transition-colors ${
                      isHovered ? 'text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                    title={zone.name}
                  >
                    {zone.name.split(',')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Card / Detail Inspector */}
      {hoveredZone && (
        <div className="mt-4 p-3 rounded-2xl bg-[#0e1324] border border-cyan-500/30 text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="font-bold text-white">{hoveredZone.name}</span>
              <span className="text-slate-400 ml-2 font-mono text-[11px]">
                {hoveredZone.count.toLocaleString()} cases
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                getRiskColor(hoveredZone.riskScore, hoveredZone.riskCategory).badge
              }`}
            >
              Score: {hoveredZone.riskScore}/100 ({hoveredZone.riskCategory} Risk)
            </span>
            <span className="text-slate-400">
              Hospitalized: <strong className="text-slate-200">{hoveredZone.hospitalizedCount}</strong>
            </span>
            <span className="text-slate-400">
              ICU: <strong className="text-rose-400">{hoveredZone.icuCount}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
