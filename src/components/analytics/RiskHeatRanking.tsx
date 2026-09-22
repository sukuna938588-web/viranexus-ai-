import React, { useState } from 'react';
import { Flame, MapPin, TrendingUp, TrendingDown, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { ZoneStat } from '../../types';

interface RiskHeatRankingProps {
  zones: ZoneStat[];
  totalCases: number;
}

export const RiskHeatRanking: React.FC<RiskHeatRankingProps> = ({ zones = [], totalCases = 0 }) => {
  const [sortBy, setSortBy] = useState<'riskScore' | 'count' | 'growth'>('riskScore');

  if (totalCases === 0 || zones.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
          <Flame className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Risk Heat Ranking</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No geographic hot zones registered. Ingest case logs to generate epidemiological heat rankings.
        </p>
      </div>
    );
  }

  // Sorted zones
  const sortedZones = [...zones].sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'count') return b.count - a.count;
    return b.weeklyGrowth - a.weeklyGrowth;
  });

  const getHeatCategory = (score: number, growth: number) => {
    if (score >= 75 || (score >= 60 && growth > 25)) {
      return {
        label: 'EXTREME HEAT',
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        flameColor: 'text-rose-500',
      };
    }
    if (score >= 50 || growth > 15) {
      return {
        label: 'HIGH HEAT',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        flameColor: 'text-amber-500',
      };
    }
    if (score >= 30) {
      return {
        label: 'ELEVATED',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        flameColor: 'text-cyan-500',
      };
    }
    return {
      label: 'CONTAINED',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      flameColor: 'text-emerald-500',
    };
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header with Sort Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Flame className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Risk Heat Ranking</h3>
            <p className="text-[11px] text-slate-400 font-mono">Ranked epidemiological vulnerability index</p>
          </div>
        </div>

        {/* Sort criteria */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono font-bold self-start sm:self-auto">
          <span className="text-slate-500 px-1.5">Sort:</span>
          <button
            onClick={() => setSortBy('riskScore')}
            className={`px-2 py-0.5 rounded-lg transition ${
              sortBy === 'riskScore' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Risk Score
          </button>
          <button
            onClick={() => setSortBy('count')}
            className={`px-2 py-0.5 rounded-lg transition ${
              sortBy === 'count' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cases
          </button>
          <button
            onClick={() => setSortBy('growth')}
            className={`px-2 py-0.5 rounded-lg transition ${
              sortBy === 'growth' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Growth %
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="pb-2.5 font-semibold">Rank</th>
              <th className="pb-2.5 font-semibold">Area / Zone</th>
              <th className="pb-2.5 font-semibold">Heat Level</th>
              <th className="pb-2.5 font-semibold text-right">Risk Index</th>
              <th className="pb-2.5 font-semibold text-right">Cases</th>
              <th className="pb-2.5 font-semibold text-right">7D Growth</th>
              <th className="pb-2.5 font-semibold">Active Pathogens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedZones.map((zone, idx) => {
              const heat = getHeatCategory(zone.riskScore, zone.weeklyGrowth);
              return (
                <tr key={zone.name} className="hover:bg-slate-800/30 transition group/row">
                  {/* Rank */}
                  <td className="py-3 pr-2 text-slate-400">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                        idx === 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : idx === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : idx === 2
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                  </td>

                  {/* Zone Name */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover/row:text-cyan-400 transition" />
                      <span className="font-bold text-white font-sans">{zone.name}</span>
                    </div>
                  </td>

                  {/* Heat Badge */}
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${heat.bg} ${heat.color}`}
                    >
                      <Flame className={`w-3 h-3 ${heat.flameColor}`} />
                      {heat.label}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3 pr-3 text-right">
                    <span className="text-white font-black">{zone.riskScore}</span>
                    <span className="text-slate-500 text-[10px]">/100</span>
                  </td>

                  {/* Cases */}
                  <td className="py-3 pr-3 text-right">
                    <strong className="text-cyan-300">{zone.count.toLocaleString()}</strong>
                  </td>

                  {/* Weekly Growth */}
                  <td className="py-3 pr-3 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        zone.weeklyGrowth > 0
                          ? 'text-rose-400'
                          : zone.weeklyGrowth < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {zone.weeklyGrowth > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {zone.weeklyGrowth > 0 ? `+${zone.weeklyGrowth}%` : `${zone.weeklyGrowth}%`}
                    </span>
                  </td>

                  {/* Pathogens */}
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {zone.activeDiseases.slice(0, 2).map((d) => (
                        <span
                          key={d}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-[10px] text-slate-300 font-sans"
                        >
                          {d}
                        </span>
                      ))}
                      {zone.activeDiseases.length > 2 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{zone.activeDiseases.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
