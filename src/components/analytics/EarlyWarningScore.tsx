import React from 'react';
import { AlertOctagon, ShieldAlert, Zap, HeartPulse, Activity, ArrowRight } from 'lucide-react';
import { EpidemiologicalIntelligence } from '../../types';

interface EarlyWarningScoreProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
}

export const EarlyWarningScore: React.FC<EarlyWarningScoreProps> = ({
  intelligence,
  totalRecords = 0,
}) => {
  if (totalRecords === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
          <AlertOctagon className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Early Warning Score (EWS)</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No active case records indexed. Add surveillance data to evaluate clinical and outbreak warning indices.
        </p>
      </div>
    );
  }

  // 1. R0 component (0 - 30 pts)
  const r0 = intelligence.estimatedR0 || 1.0;
  const r0Score = r0 > 2.0 ? 30 : r0 > 1.4 ? 22 : r0 > 1.1 ? 14 : r0 > 0.9 ? 6 : 2;

  // 2. Growth Velocity component (0 - 25 pts)
  const growth = intelligence.growthRatePct || 0;
  const growthScore = growth > 40 ? 25 : growth > 20 ? 18 : growth > 5 ? 10 : 2;

  // 3. Clinical Severity & ICU Acuity component (0 - 30 pts)
  const severeScore = Math.min(30, Math.round(intelligence.severeRatio * 80 + intelligence.icuRatio * 90));

  // 4. Anomaly Density component (0 - 15 pts)
  const anomalyScore = Math.min(15, (intelligence.anomalies?.length || 0) * 4);

  // Composite Early Warning Score
  const rawEWS = r0Score + growthScore + severeScore + anomalyScore;
  const ewsScore = Math.min(100, Math.max(5, rawEWS));

  const getAlertProfile = (score: number) => {
    if (score >= 75) {
      return {
        level: 'LEVEL 4: CRITICAL EMERGENCY',
        color: 'text-rose-400',
        barColor: 'from-rose-500 to-red-600',
        badge: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
        recommendation: 'Mobilize emergency field reserves, mandate PPE protocols in hot zones, and trigger ICU overflow triage.',
      };
    }
    if (score >= 50) {
      return {
        level: 'LEVEL 3: HIGH WARNING',
        color: 'text-amber-400',
        barColor: 'from-amber-500 to-rose-500',
        badge: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
        recommendation: 'Increase diagnostic PCR screening, enforce localized contact tracing, and ready secondary bed capacities.',
      };
    }
    if (score >= 30) {
      return {
        level: 'LEVEL 2: ELEVATED ADVISORY',
        color: 'text-cyan-400',
        barColor: 'from-cyan-500 to-amber-500',
        badge: 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300',
        recommendation: 'Maintain sentinel clinical surveillance, monitor regional transmission nodes, and refresh ward supplies.',
      };
    }
    return {
      level: 'LEVEL 1: STABLE SURVEILLANCE',
      color: 'text-emerald-400',
      barColor: 'from-emerald-500 to-cyan-500',
      badge: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
      recommendation: 'Pathogen transmission metrics within standard manageable baseline thresholds.',
    };
  };

  const profile = getAlertProfile(ewsScore);

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Early Warning Score (EWS)</h3>
            <p className="text-[11px] text-slate-400 font-mono">Multi-factor epidemiological threat index</p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border self-start sm:self-auto ${profile.badge}`}>
          {profile.level}
        </span>
      </div>

      {/* Main Score Bar */}
      <div className="p-4 rounded-2xl bg-[#090d1c] border border-slate-800/80 mb-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Composite Threat Rating</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">{ewsScore}</span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-slate-400">R₀ Index: </span>
            <strong className={r0 > 1.2 ? 'text-rose-400' : 'text-emerald-400'}>
              {r0.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* EWS Multi-stage Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r ${profile.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${ewsScore}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-1">
          <span>0 (Normal)</span>
          <span>30 (Advisory)</span>
          <span>50 (Warning)</span>
          <span>75+ (Emergency)</span>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-0.5">Transmission R₀</span>
          <span className="font-bold text-white">{r0.toFixed(2)}</span>
          <span className="text-[9px] text-slate-500 block">+{r0Score} pts</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-0.5">7D Velocity</span>
          <span className={`font-bold ${growth > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {growth > 0 ? `+${growth}%` : `${growth}%`}
          </span>
          <span className="text-[9px] text-slate-500 block">+{growthScore} pts</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-0.5">ICU Strain</span>
          <span className="font-bold text-purple-300">
            {(intelligence.icuRatio * 100).toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-500 block">+{severeScore} pts</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-0.5">Anomalies</span>
          <span className="font-bold text-amber-400">
            {intelligence.anomalies?.length || 0}
          </span>
          <span className="text-[9px] text-slate-500 block">+{anomalyScore} pts</span>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs flex items-start gap-2">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 text-[11px] leading-relaxed">
          <strong className="text-white font-mono">Action Protocol: </strong>
          {profile.recommendation}
        </p>
      </div>
    </div>
  );
};
