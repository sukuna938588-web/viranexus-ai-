import React, { useState, useMemo } from 'react';
import {
  Flame,
  MapPin,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  Search,
  Bed,
  Microscope,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ZoneStat } from '../../types';

interface SmartHotspotRankingProps {
  zones: ZoneStat[];
  totalCases: number;
}

export const SmartHotspotRanking: React.FC<SmartHotspotRankingProps> = ({ zones = [], totalCases = 0 }) => {
  const [sortBy, setSortBy] = useState<'hazard' | 'cases' | 'velocity' | 'severe'>('hazard');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  const rankedHotspots = useMemo(() => {
    if (!zones || zones.length === 0 || totalCases === 0) return [];

    return zones.map((z, idx) => {
      const caseShare = z.count / Math.max(1, totalCases);
      const severeShare = z.count > 0 ? (z.severeCases + z.hospitalizedCount * 0.5) / z.count : 0;
      const velocityWeight = Math.max(0, Math.min(1, (z.weeklyGrowth + 20) / 60));
      const pathogenDiversity = Math.min(1, (z.activeDiseases?.length || 1) / 4);

      // Composite multi-vector hazard index based on: Case count, Growth rate, Trend acceleration
      const hazardScore = Math.min(
        99.4,
        Math.max(
          12,
          Math.round(
            caseShare * 40 * 100 +
              velocityWeight * 35 * 100 +
              severeShare * 15 * 100 +
              pathogenDiversity * 10 * 100
          )
        )
      );

      // Exact Showcase Tiers
      let rankTitle = `#${idx + 1} Monitored Sector`;
      let rankBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

      if (idx === 0) {
        rankTitle = '#1 Highest Risk Area';
        rankBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/40';
      } else if (idx === 1) {
        rankTitle = '#2 Emerging Risk Area';
        rankBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40';
      } else if (idx === 2) {
        rankTitle = '#3 Watchlist Area';
        rankBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/40';
      }

      let tier: 'CRITICAL HAZARD' | 'HIGH THREAT' | 'ELEVATED STRAIN' | 'CONTAINED' = 'CONTAINED';
      let tierColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

      if (hazardScore >= 70) {
        tier = 'CRITICAL HAZARD';
        tierColor = 'text-rose-400 bg-rose-500/10 border-rose-500/40';
      } else if (hazardScore >= 50) {
        tier = 'HIGH THREAT';
        tierColor = 'text-amber-400 bg-amber-500/10 border-amber-500/40';
      } else if (hazardScore >= 35) {
        tier = 'ELEVATED STRAIN';
        tierColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40';
      }

      return {
        ...z,
        hazardScore,
        tier,
        tierColor,
        rankTitle,
        rankBadgeColor,
        caseSharePct: Math.round(caseShare * 100),
        severeRatePct: Math.round(severeShare * 100),
      };
    });
  }, [zones, totalCases]);

  const sortedAndFiltered = useMemo(() => {
    let list = [...rankedHotspots];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((z) => z.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      if (sortBy === 'hazard') return b.hazardScore - a.hazardScore;
      if (sortBy === 'cases') return b.count - a.count;
      if (sortBy === 'velocity') return b.weeklyGrowth - a.weeklyGrowth;
      if (sortBy === 'severe') return b.severeCases - a.severeCases;
      return 0;
    });
  }, [rankedHotspots, sortBy, searchQuery]);

  if (totalCases === 0 || zones.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
          <Flame className="w-7 h-7 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-white font-mono">Smart Hotspot Ranking</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
          No regional hazard data found. Ingest geographic case logs to generate algorithmic multi-factor vulnerability tiers and priority triage scores.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0c0d1e]/95 via-[#080914]/95 to-[#060812]/95 border border-amber-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Smart Hotspot Ranking
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                MULTI-VECTOR HAZARD INDEX
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Prioritizing {zones.length} sectors by case density, clinical strain & velocity acceleration
            </p>
          </div>
        </div>

        {/* Controls: Search and Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-[11px] font-mono">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" />
            </span>
            {(
              [
                { id: 'hazard', label: 'Hazard Index' },
                { id: 'cases', label: 'Cases' },
                { id: 'velocity', label: 'Velocity' },
                { id: 'severe', label: 'Severe' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  sortBy === s.id ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-3">
        {sortedAndFiltered.map((zone, rankIdx) => {
          const isExpanded = expandedZone === zone.name;

          return (
            <div
              key={zone.name}
              className="p-4 rounded-2xl bg-[#080a18]/90 border border-slate-800 hover:border-amber-500/40 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                    #{rankIdx + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {zone.name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${zone.rankBadgeColor}`}>
                        {zone.rankTitle}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border uppercase ${zone.tierColor}`}>
                        {zone.tier}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {zone.count.toLocaleString()} cases ({zone.caseSharePct}% of total) • Active Pathogens:{' '}
                      <strong className="text-slate-300">{zone.activeDiseases?.join(', ') || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-auto font-mono text-xs">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Hazard Index</div>
                    <div className="text-base font-black text-amber-400">{zone.hazardScore}/100</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Velocity</div>
                    <div className={`text-xs font-bold ${zone.weeklyGrowth >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {zone.weeklyGrowth >= 0 ? '+' : ''}{zone.weeklyGrowth}%
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedZone(isExpanded ? null : zone.name)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                    title="Toggle Detailed Triage"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress Bar of Hazard */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${zone.hazardScore}%` }}
                />
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono animate-fade-in">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px] mb-1">Severe Clinical Acuity</div>
                    <div className="text-rose-400 font-bold">
                      {zone.severeCases} Severe / {zone.icuCount} ICU
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px] mb-1">Hospitalized Patients</div>
                    <div className="text-cyan-400 font-bold">{zone.hospitalizedCount} beds occupied</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-slate-400 text-[10px] mb-1">Triage Priority Directive</div>
                    <div className="text-amber-300 font-sans text-[11px]">
                      {zone.hazardScore >= 70
                        ? 'Establish mobile screening cordon immediately'
                        : zone.hazardScore >= 50
                        ? 'Increase clinic nurse shifts & test stock'
                        : 'Routine epidemiological surveillance'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
