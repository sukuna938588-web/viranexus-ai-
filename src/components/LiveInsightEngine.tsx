import React from 'react';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Users,
  Activity,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  CloudSun,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';

interface LiveInsightEngineProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectArea?: (area: string) => void;
  onSelectDisease?: (disease: string) => void;
  onAskCopilot?: (question: string) => void;
}

export const LiveInsightEngine: React.FC<LiveInsightEngineProps> = ({
  intelligence,
  records,
  onSelectArea,
  onSelectDisease,
  onAskCopilot,
}) => {
  const {
    totalCases,
    growthRatePct,
    estimatedR0,
    topDiseases,
    topZones,
    ageCohorts,
    anomalies,
  } = intelligence;

  if (!records || records.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800 bg-[#070a14]/60 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">AI Analysis Will Appear Here</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Upload a CSV dataset or add your first record to generate live health insights, affected area alerts, and emerging disease trends.
        </p>
      </div>
    );
  }

  // 1. Most Affected Area
  const topArea = topZones[0] || null;
  const areaPercentage = topArea && totalCases > 0 ? Math.round((topArea.count / totalCases) * 100) : 0;

  // 2. Fastest Growing Disease
  // Determine disease with highest positive growth rate or highest R0
  const fastestDisease = [...topDiseases].sort((a, b) => b.growthRate - a.growthRate || b.r0Estimate - a.r0Estimate)[0] || null;

  // 3. Highest Risk Age Group
  // Calculate cohort with highest severity or highest total count
  const highestRiskAgeCohort = (() => {
    if (!ageCohorts || ageCohorts.length === 0) return null;
    const sorted = [...ageCohorts].sort((a, b) => b.count - a.count);
    return sorted[0];
  })();

  // 4. Recent Case Growth Analysis
  const isGrowing = growthRatePct > 0;
  const growthMagnitude = Math.abs(growthRatePct);

  // 5. Emerging Trends & Signals
  const emergingTrend = (() => {
    if (anomalies && anomalies.length > 0) {
      const topAnomaly = anomalies[0];
      return {
        title: `Cluster Spike in ${topAnomaly.region}`,
        description: `${topAnomaly.disease} recorded ${topAnomaly.actual} cases exceeding normal expectations (${topAnomaly.reason}).`,
        badge: 'Statistical Anomaly',
        badgeColor: 'rose',
      };
    }

    // Weather correlation trend if present
    const rainyCases = records.filter((r) => r.weather?.toLowerCase().includes('rain') || r.weather?.toLowerCase().includes('monsoon')).length;
    if (rainyCases > totalCases * 0.35 && rainyCases >= 3) {
      return {
        title: 'Monsoon / Rainfall Transmission Link',
        description: `${Math.round((rainyCases / totalCases) * 100)}% of reported cases coincide with rainy weather, elevating water & vector risks.`,
        badge: 'Weather Linked',
        badgeColor: 'cyan',
      };
    }

    // High ICU or hospitalization trend
    if (intelligence.icuRatio > 0.1) {
      return {
        title: 'Elevated Intensive Care Demand',
        description: `ICU admission rate is at ${(intelligence.icuRatio * 100).toFixed(1)}%, requiring early clinical staging in regional hospitals.`,
        badge: 'Hospital Surge',
        badgeColor: 'amber',
      };
    }

    return {
      title: 'Stable Transmission Baseline',
      description: `Active transmission across ${topZones.length} monitored sectors remains within expected epidemiological bounds.`,
      badge: 'Surveillance Active',
      badgeColor: 'emerald',
    };
  })();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Live Health Insights
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Data Science Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Computed dynamically from your {records.length.toLocaleString()} uploaded health records
            </p>
          </div>
        </div>

        {onAskCopilot && (
          <button
            onClick={() => onAskCopilot('Summarize the top health insights from this dataset in simple English')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Explain with AI Copilot</span>
          </button>
        )}
      </div>

      {/* 5 Dynamic Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Insight 1: Most Affected Area */}
        <div
          onClick={() => topArea && onSelectArea && onSelectArea(topArea.name)}
          className={`p-4 rounded-2xl bg-gradient-to-br from-[#0b0e1b] to-[#070912] border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden group ${
            onSelectArea ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" /> Most Affected Area
            </span>
            <span className="text-[10px] font-bold text-rose-400">{topArea?.riskCategory || 'Risk'}</span>
          </div>

          <div className="text-base font-extrabold text-white truncate group-hover:text-cyan-300 transition-colors">
            {topArea?.name || 'Unknown Area'}
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>{topArea?.count || 0} cases</span>
            <span className="text-cyan-400 font-bold">{areaPercentage}% of total</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
            Pathogens: {topArea?.activeDiseases?.join(', ') || 'Various'}
          </div>
        </div>

        {/* Insight 2: Fastest Growing Disease */}
        <div
          onClick={() => fastestDisease && onSelectDisease && onSelectDisease(fastestDisease.name)}
          className={`p-4 rounded-2xl bg-gradient-to-br from-[#120c1a] to-[#070912] border border-slate-800/90 hover:border-rose-500/40 transition-all duration-300 relative overflow-hidden group ${
            onSelectDisease ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-rose-400" /> Fastest Growing
            </span>
            <span className="text-[10px] font-mono text-rose-400 font-bold">
              {fastestDisease?.growthRate ? `${fastestDisease.growthRate > 0 ? '+' : ''}${fastestDisease.growthRate}%` : 'Active'}
            </span>
          </div>

          <div className="text-base font-extrabold text-white truncate group-hover:text-rose-300 transition-colors">
            {fastestDisease?.name || 'None'}
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>{fastestDisease?.count || 0} cases</span>
            <span className="text-purple-300 font-bold">R₀ ≈ {fastestDisease?.r0Estimate || estimatedR0}</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
            Severity Rate: {fastestDisease?.severeRate ? `${Math.round(fastestDisease.severeRate * 100)}% severe` : 'Monitoring'}
          </div>
        </div>

        {/* Insight 3: Highest Risk Age Group */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c121e] to-[#070912] border border-slate-800/90 hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> Highest Risk Group
            </span>
            <span className="text-[10px] font-mono text-purple-400 font-bold">Demographics</span>
          </div>

          <div className="text-base font-extrabold text-white truncate">
            {highestRiskAgeCohort?.cohort || 'General Population'}
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>{highestRiskAgeCohort?.count || 0} cases</span>
            <span className="text-purple-300 font-bold">{highestRiskAgeCohort?.percentage || 0}% share</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
            Targeted health advisories recommended
          </div>
        </div>

        {/* Insight 4: Recent Case Growth */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a111a] to-[#070912] border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> Recent Growth
            </span>
            <span className={`text-[10px] font-mono font-bold ${isGrowing ? 'text-rose-400' : 'text-emerald-400'}`}>
              7-Day Trend
            </span>
          </div>

          <div className="text-base font-extrabold text-white truncate flex items-center gap-1.5">
            <span className={isGrowing ? 'text-rose-400' : 'text-emerald-400'}>
              {growthRatePct >= 0 ? `+${growthRatePct}%` : `${growthRatePct}%`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal font-mono">velocity</span>
          </div>

          <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Reproduction R₀</span>
            <span className={`font-bold ${estimatedR0 > 1.2 ? 'text-rose-400' : 'text-cyan-300'}`}>
              {estimatedR0}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 truncate">
            {estimatedR0 > 1.0 ? 'Transmission is accelerating' : 'Spread pace is stabilizing'}
          </div>
        </div>

        {/* Insight 5: Emerging Trends & Signals */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#120e17] to-[#070912] border border-slate-800/90 hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Emerging Signal
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                emergingTrend.badgeColor === 'rose'
                  ? 'bg-rose-500/20 text-rose-300'
                  : emergingTrend.badgeColor === 'amber'
                  ? 'bg-amber-500/20 text-amber-300'
                  : emergingTrend.badgeColor === 'cyan'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {emergingTrend.badge}
            </span>
          </div>

          <div className="text-xs font-bold text-white truncate" title={emergingTrend.title}>
            {emergingTrend.title}
          </div>

          <p className="mt-1.5 text-[11px] text-slate-300 leading-snug line-clamp-2">
            {emergingTrend.description}
          </p>
        </div>
      </div>
    </div>
  );
};
