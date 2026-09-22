import React, { useState } from 'react';
import {
  Microscope,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Filter,
} from 'lucide-react';
import { EpidemiologicalIntelligence, DiseaseStat, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';

interface DiseaseIntelligenceProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const DiseaseIntelligence: React.FC<DiseaseIntelligenceProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Disease Intelligence</h1>
          <p className="text-xs text-slate-400 font-mono">Pathogen risk profiling, R₀ reproduction modeling, and growth trajectories</p>
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

  const diseases = intelligence.topDiseases;
  const activeDisease = selectedDisease
    ? diseases.find((d) => d.name === selectedDisease) || diseases[0]
    : diseases[0];

  // Calculate symptoms and statistics specific to active disease
  const diseaseRecords = records.filter((r) => r.disease === activeDisease?.name);
  const hospitalizedCount = diseaseRecords.filter((r) => r.hospitalized).length;
  const icuCount = diseaseRecords.filter((r) => r.icu).length;
  const deceasedCount = diseaseRecords.filter((r) => r.outcome === 'Deceased').length;

  const symptomCounts: Record<string, number> = {};
  diseaseRecords.forEach((r) => {
    r.symptoms.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const sortedSymptoms = Object.entries(symptomCounts)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / Math.max(1, diseaseRecords.length)) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Disease Intelligence</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            PATHOGEN MATRIX
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Tracking {diseases.length} distinct pathogens across {records.length.toLocaleString()} surveillance case entries
        </p>
      </div>

      {/* Pathogen Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {diseases.map((d) => {
          const isSelected = activeDisease?.name === d.name;
          return (
            <div
              key={d.name}
              onClick={() => setSelectedDisease(d.name)}
              className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-[#13112b] to-[#0a0d18] border-cyan-500/60 shadow-xl shadow-purple-950/30 scale-[1.01]'
                  : 'bg-[#090d18]/70 border-slate-800 hover:border-slate-700 hover:bg-[#0c1120]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Microscope className="w-5 h-5" />
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    d.riskLevel === 'Critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : d.riskLevel === 'Elevated'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {d.riskLevel} Risk
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{d.name}</h3>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                <span>{d.count} Cases</span>
                <span>•</span>
                <span>{d.percentage}% of Total</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">REPRODUCTION (R₀)</span>
                  <span className="font-bold text-cyan-300">{d.r0Estimate}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">7-DAY TREND</span>
                  <span
                    className={`font-bold ${
                      d.growthRate >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {d.growthRate >= 0 ? `+${d.growthRate}%` : `${d.growthRate}%`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Disease Deep Dive */}
      {activeDisease && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Pathogen Deep Dive Metrics */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeDisease.name} — Epidemiological Profile
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Calculated from {activeDisease.count} active case telemetry entries
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
                  Est. R₀: {activeDisease.r0Estimate}
                </span>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">TOTAL CASES</span>
                <span className="text-xl font-bold text-white">{activeDisease.count}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">HOSPITALIZED</span>
                <span className="text-xl font-bold text-cyan-300">{hospitalizedCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">ICU ADMITTED</span>
                <span className="text-xl font-bold text-purple-300">{icuCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">FATALITIES</span>
                <span className="text-xl font-bold text-rose-400">{deceasedCount}</span>
              </div>
            </div>

            {/* R0 Interpretation Guide */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-purple-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Reproductive Factor Analysis ($R_0 = {activeDisease.r0Estimate}$)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {activeDisease.r0Estimate > 1.2
                  ? `With an R₀ of ${activeDisease.r0Estimate}, secondary transmission is accelerating super-linearly. Public health interventions (contact tracing, targeted masking, cohort isolation) are required immediately.`
                  : activeDisease.r0Estimate >= 0.9
                  ? `Transmission is approaching equilibrium (R₀ ≈ 1.0). Strict sentinel surveillance recommended to prevent sporadic secondary resurgence.`
                  : `Reproductive rate is sub-critical (R₀ < 0.9). Epidemic wave is entering decay phase in primary monitoring zones.`}
              </p>
            </div>
          </div>

          {/* Right 1 Col: Symptom Co-occurrence */}
          <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Symptom Biomarkers</h3>
              <p className="text-xs text-slate-400">Clinical manifestation frequencies for {activeDisease.name}</p>
            </div>

            <div className="space-y-3 pt-2">
              {sortedSymptoms.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No symptoms recorded for this pathogen.</div>
              ) : (
                sortedSymptoms.map((sym) => (
                  <div key={sym.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{sym.name}</span>
                      <span className="text-cyan-400 font-bold">{sym.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        style={{ width: `${sym.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
