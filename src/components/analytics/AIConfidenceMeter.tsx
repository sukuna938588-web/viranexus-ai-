import React from 'react';
import { Gauge, CheckCircle2, AlertCircle, Info, ShieldCheck, Database } from 'lucide-react';
import { OutbreakRecord, EpidemiologicalIntelligence } from '../../types';

interface AIConfidenceMeterProps {
  records: OutbreakRecord[];
  intelligence: EpidemiologicalIntelligence;
}

export const AIConfidenceMeter: React.FC<AIConfidenceMeterProps> = ({ records = [], intelligence }) => {
  if (!records || records.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <Gauge className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">AI Confidence Meter</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No records uploaded yet. Upload patient records to compute statistical model confidence & margin of error.
        </p>
      </div>
    );
  }

  const N = records.length;

  // 1. Sample Size Adequacy (0 - 35 points)
  // N >= 500: 35 pts; N >= 100: 28 pts; N >= 30: 20 pts; N < 30: (N/30)*20
  const samplePoints = N >= 500 ? 35 : N >= 100 ? 28 + (N - 100) / 400 * 7 : N >= 30 ? 20 + (N - 30) / 70 * 8 : (N / 30) * 20;

  // 2. Data Completeness Score (0 - 35 points)
  let completenessSum = 0;
  records.forEach((r) => {
    let fields = 0;
    if (r.date) fields++;
    if (r.disease) fields++;
    if (r.region || r.city) fields++;
    if (typeof r.age === 'number') fields++;
    if (r.severity) fields++;
    if (r.outcome) fields++;
    if (r.gender) fields++;
    completenessSum += fields / 7;
  });
  const completenessRatio = completenessSum / Math.max(1, N);
  const completenessPoints = completenessRatio * 35;

  // 3. Time Series Longitudinal Continuity (0 - 30 points)
  const uniqueDatesCount = intelligence?.dailyTrends?.length || 0;
  const continuityPoints = Math.min(30, uniqueDatesCount * 3.5);

  // Overall Score (0 - 100)
  const overallConfidence = Math.min(99.4, Math.max(12, Math.round(samplePoints + completenessPoints + continuityPoints)));

  // Margin of Error at 95% confidence interval
  const p = 0.5; // most conservative variance
  const marginOfError = Math.max(1.2, Math.min(25.0, 1.96 * Math.sqrt((p * (1 - p)) / Math.max(1, N)) * 100));

  const getConfidenceLevel = (score: number) => {
    if (score >= 85) {
      return {
        label: 'HIGH FIDELITY',
        color: 'text-emerald-400',
        stroke: '#10b981',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        desc: 'Rigorous sample size with high observational certainty',
      };
    }
    if (score >= 60) {
      return {
        label: 'ROBUST SAMPLE',
        color: 'text-cyan-400',
        stroke: '#06b6d4',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        desc: 'Solid epidemiological baseline for predictive inference',
      };
    }
    if (score >= 40) {
      return {
        label: 'MODERATE SAMPLE',
        color: 'text-amber-400',
        stroke: '#eab308',
        bg: 'bg-amber-500/10 border-amber-500/30',
        desc: 'Sufficient for trend detection; additional data recommended',
      };
    }
    return {
      label: 'PRELIMINARY COHORT',
      color: 'text-rose-400',
      stroke: '#f43f5e',
      bg: 'bg-rose-500/10 border-rose-500/30',
      desc: 'Sparse sample size; high confidence bounds require more cases',
    };
  };

  const level = getConfidenceLevel(overallConfidence);

  // SVG Gauge calculations (semi-circle arc)
  const radius = 60;
  const circumference = Math.PI * radius; // 180 degree arc
  const strokeDashoffset = circumference - (overallConfidence / 100) * circumference;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Gauge className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">AI Confidence Meter</h3>
            <p className="text-[11px] text-slate-400 font-mono">Statistical power & epidemiological validity</p>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${level.bg} ${level.color}`}>
          {level.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* Semi-circle Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative select-none">
          <svg width="150" height="90" viewBox="0 0 150 90" className="overflow-visible">
            {/* Background Arc */}
            <path
              d="M 15 80 A 60 60 0 0 1 135 80"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Foreground Arc */}
            <path
              d="M 15 80 A 60 60 0 0 1 135 80"
              fill="none"
              stroke={level.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${level.stroke}88)` }}
            />
          </svg>

          {/* Center Score Text */}
          <div className="text-center -mt-8">
            <div className="text-2xl font-black text-white font-mono">{overallConfidence}%</div>
            <div className="text-[10px] font-mono text-slate-400">Model Precision</div>
          </div>
        </div>

        {/* Statistical Factors Checklist */}
        <div className="sm:col-span-7 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Sample Size (N):
            </span>
            <span className="font-bold text-white">
              {N.toLocaleString()} cases ({Math.round(samplePoints)}/35 pts)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Field Completeness:
            </span>
            <span className="font-bold text-purple-300">
              {Math.round(completenessRatio * 100)}% ({Math.round(completenessPoints)}/35 pts)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Margin of Error (95% CI):
            </span>
            <span className="font-bold text-amber-300">
              ±{marginOfError.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>{level.desc}</span>
      </div>
    </div>
  );
};
