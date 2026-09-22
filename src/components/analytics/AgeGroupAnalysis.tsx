import React, { useMemo } from 'react';
import { Users, ShieldAlert, HeartPulse, UserCheck } from 'lucide-react';
import { OutbreakRecord } from '../../types';

interface AgeGroupAnalysisProps {
  records: OutbreakRecord[];
}

interface AgeCohortStat {
  label: string;
  range: string;
  count: number;
  percentage: number;
  hospitalizedCount: number;
  hospitalizedRate: number;
  icuCount: number;
  severeCount: number;
  vulnerabilityScore: number; // 0 - 100
  dominantDisease: string;
}

export const AgeGroupAnalysis: React.FC<AgeGroupAnalysisProps> = ({ records = [] }) => {
  const cohortStats: AgeCohortStat[] = useMemo(() => {
    if (!records || records.length === 0) return [];

    const total = records.length;
    const cohortsDef = [
      { label: 'Child', range: '0 - 12 yrs', min: 0, max: 12, baseRisk: 1.15, iconColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
      { label: 'Teen', range: '13 - 19 yrs', min: 13, max: 19, baseRisk: 0.85, iconColor: 'text-cyan-400', badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' },
      { label: 'Adult', range: '20 - 59 yrs', min: 20, max: 59, baseRisk: 1.0, iconColor: 'text-purple-400', badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30' },
      { label: 'Senior', range: '60+ yrs', min: 60, max: 125, baseRisk: 1.75, iconColor: 'text-rose-400', badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
    ];

    return cohortsDef.map((def) => {
      const cohortRecords = records.filter((r) => {
        const age = typeof r.age === 'number' ? r.age : 30;
        return age >= def.min && age <= def.max;
      });

      const count = cohortRecords.length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      const hosp = cohortRecords.filter((r) => r.hospitalized).length;
      const icu = cohortRecords.filter((r) => r.icu).length;
      const severe = cohortRecords.filter((r) => r.severity === 'Severe' || r.severity === 'Critical').length;
      const hospRate = count > 0 ? Math.round((hosp / count) * 100) : 0;
      const severeRate = count > 0 ? severe / count : 0;

      // Vulnerability calculation based on clinical severity and age susceptibility
      const vulnerabilityScore = Math.min(
        100,
        Math.round((hospRate * 0.4 + severeRate * 100 * 0.4 + (count / total) * 20) * def.baseRisk)
      );

      // Dominant illness in this cohort
      const diseaseCounts: Record<string, number> = {};
      cohortRecords.forEach((r) => {
        if (r.disease) {
          diseaseCounts[r.disease] = (diseaseCounts[r.disease] || 0) + 1;
        }
      });
      const topDis = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unspecified';

      return {
        label: def.label,
        range: def.range,
        count,
        percentage,
        hospitalizedCount: hosp,
        hospitalizedRate: hospRate,
        icuCount: icu,
        severeCount: severe,
        vulnerabilityScore,
        dominantDisease: topDis,
      };
    });
  }, [records]);

  if (!records || records.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
          <Users className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Age Group Analysis</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No demographic data loaded. Upload case records to calculate demographic susceptibility.
        </p>
      </div>
    );
  }

  // Find most vulnerable cohort
  const mostVulnerable = [...cohortStats].sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)[0];

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Age Group Analysis</h3>
            <p className="text-[11px] text-slate-400 font-mono">Demographic susceptibility & clinical severity</p>
          </div>
        </div>

        {mostVulnerable && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Highest Risk: {mostVulnerable.label}
          </span>
        )}
      </div>

      {/* Cohort Cards Grid */}
      <div className="space-y-3">
        {cohortStats.map((cohort) => {
          const isHighest = cohort.label === mostVulnerable?.label;
          return (
            <div
              key={cohort.label}
              className={`p-3.5 rounded-2xl border transition-all ${
                isHighest
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{cohort.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {cohort.range}
                  </span>
                  {cohort.count > 0 && (
                    <span className="text-[10px] font-mono text-cyan-400">
                      Top: {cohort.dominantDisease}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-300">
                    <strong className="text-white">{cohort.count.toLocaleString()}</strong> cases ({cohort.percentage}%)
                  </span>
                  <span className="text-amber-400 font-semibold">
                    Hosp: {cohort.hospitalizedRate}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      cohort.vulnerabilityScore >= 60
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : cohort.vulnerabilityScore >= 35
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Risk {cohort.vulnerabilityScore}/100
                  </span>
                </div>
              </div>

              {/* Progress Bar with Severity Breakdown */}
              <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden flex">
                {/* Hospitalized segment */}
                <div
                  className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500"
                  style={{ width: `${cohort.hospitalizedRate}%` }}
                  title={`Hospitalized: ${cohort.hospitalizedRate}%`}
                />
                {/* Mild / Home care segment */}
                <div
                  className="bg-cyan-600/40 h-full transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - cohort.hospitalizedRate)}%` }}
                  title="Non-Hospitalized"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
