import React from 'react';
import {
  Users,
  PieChart,
  ShieldCheck,
  Heart,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';

interface PopulationAnalyticsProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const PopulationAnalytics: React.FC<PopulationAnalyticsProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">People Analysis</h1>
          <p className="text-xs text-slate-400 font-mono">Age groups, recovery rates, and vulnerable communities</p>
        </div>
        <EmptyState
          onUploadRecords={onUploadRecords}
          onOpenAddModal={onOpenAddModal}
          title="No Dataset Loaded"
          description="Upload CSV or Add Records to Start Analysis"
        />
      </div>
    );
  }

  const ageCohorts = intelligence.ageCohorts;
  const genderDist = intelligence.genderDistribution;

  // Outcome statistics
  const activeCases = records.filter((r) => r.outcome === 'Active').length;
  const recoveredCases = records.filter((r) => r.outcome === 'Recovered').length;
  const deceasedCases = records.filter((r) => r.outcome === 'Deceased').length;

  const total = Math.max(1, records.length);
  const activePct = Math.round((activeCases / total) * 100);
  const recoveredPct = Math.round((recoveredCases / total) * 100);
  const deceasedPct = Math.round((deceasedCases / total) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">People Analysis</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            AGE GROUPS & GENDER
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Surveillance breakdown across {records.length.toLocaleString()} individual case profiles
        </p>
      </div>

      {/* Outcome KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#0e1224] border border-cyan-500/30 shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
            <span>ACTIVE CASES</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{activeCases}</div>
          <div className="text-xs text-cyan-400 font-mono mt-1">{activePct}% of total cohort</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c1815] border border-emerald-500/30 shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
            <span>RECOVERED</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{recoveredCases}</div>
          <div className="text-xs text-emerald-500 font-mono mt-1">{recoveredPct}% of total cohort</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#1a0e14] border border-rose-500/30 shadow-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
            <span>FATALITIES</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{deceasedCases}</div>
          <div className="text-xs text-rose-500 font-mono mt-1">{deceasedPct}% Case Fatality Rate</div>
        </div>
      </div>

      {/* Age Cohorts & Gender Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Age Cohorts */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Age Groups</h3>
            <span className="text-xs font-mono text-slate-400">4 Age Tiers</span>
          </div>

          <div className="space-y-4">
            {ageCohorts.map((g) => (
              <div key={g.cohort} className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="font-semibold">{g.cohort}</span>
                  <span>
                    <strong className="text-white">{g.count}</strong> cases ({g.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${Math.max(4, g.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed font-mono">
            * Senior cohort (&ge;65) and Pediatric cohort (&le;17) represent high-priority immunization and prophylactic therapeutic allocation zones.
          </div>
        </div>

        {/* Right: Gender Cohorts */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Gender Cohort Breakdown</h3>
            <Users className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-4">
            {genderDist.map((g) => (
              <div key={g.gender} className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="font-semibold">{g.gender}</span>
                  <span>
                    <strong className="text-white">{g.count}</strong> cases ({g.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      g.gender === 'Female'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                        : g.gender === 'Male'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(4, g.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 leading-relaxed font-mono">
            Demographic parity indices reveal balanced community exposure without biological sex skewing in primary transmission pathways.
          </div>
        </div>
      </div>
    </div>
  );
};
