import React from 'react';
import {
  Activity,
  AlertTriangle,
  MapPin,
  HeartPulse,
  TrendingUp,
  ShieldCheck,
  Building,
  Radio,
  FileSpreadsheet,
  Plus,
  Sparkles,
} from 'lucide-react';
import { EpidemiologicalIntelligence, ActivePage, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { TrendChart } from '../components/TrendChart';
import { RadarChart } from '../components/RadarChart';

interface ExecutiveDashboardProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
  onSelectPage: (page: ActivePage) => void;
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  intelligence,
  totalRecords,
  onSelectPage,
  onUploadRecords,
  onOpenAddModal,
}) => {
  if (totalRecords === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 font-mono">Real-time biosurveillance telemetry & risk indices</p>
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

  const dailyChartData = intelligence.dailyTrends.map((d) => ({
    label: d.date,
    primary: d.cases,
    secondary: d.movingAvg7,
  }));

  const severePercent = (intelligence.severeRatio * 100).toFixed(1);
  const hospPercent = (intelligence.hospitalizedRatio * 100).toFixed(1);
  const icuPercent = (intelligence.icuRatio * 100).toFixed(1);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Surveillance Interval: {intelligence.dateRange?.start} to {intelligence.dateRange?.end} ({totalRecords.toLocaleString()} validated cases)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectPage('analytics-dashboard')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-semibold shadow-lg shadow-cyan-950/40 transition active:scale-95"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Data Science Analytics</span>
          </button>
          <button
            onClick={() => onSelectPage('ai-command-center')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-cyan-900/60 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Ask AI Command</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* 4 Core Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Cases */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1324] to-[#07090e] border border-cyan-500/30 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>TOTAL CASES</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {intelligence.totalCases.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono">
            <span className={intelligence.growthRatePct >= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {intelligence.growthRatePct >= 0 ? `+${intelligence.growthRatePct}%` : `${intelligence.growthRatePct}%`}
            </span>
            <span className="text-slate-500">7-Day Velocity</span>
          </div>
        </div>

        {/* KPI 2: Active Alerts */}
        <div
          onClick={() => onSelectPage('alert-center')}
          className="cursor-pointer p-5 rounded-3xl bg-gradient-to-br from-[#160e1e] to-[#07090e] border border-rose-500/30 hover:border-rose-500/60 shadow-xl relative overflow-hidden group transition"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ACTIVE ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:animate-bounce" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
            {intelligence.activeAlertsCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
            <span>{intelligence.liveAlerts?.length || intelligence.anomalies.length} Live Alerts</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-300 group-hover:underline">Open Alert Center →</span>
          </div>
        </div>

        {/* KPI 3: High Risk Locations */}
        <div
          onClick={() => onSelectPage('threat-radar')}
          className="cursor-pointer p-5 rounded-3xl bg-gradient-to-br from-[#120f26] to-[#07090e] border border-purple-500/30 hover:border-purple-500/60 shadow-xl relative overflow-hidden group transition"
        >
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>HIGH RISK LOCATIONS</span>
            <MapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono tracking-tight">
            {intelligence.highRiskZonesCount}{' '}
            <span className="text-sm font-normal text-slate-500">/ {intelligence.topZones.length}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="truncate">Top: {intelligence.topZones[0]?.name || 'None'}</span>
          </div>
        </div>

        {/* KPI 4: Community Health Score */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c161d] to-[#07090e] border border-emerald-500/30 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>COMMUNITY HEALTH SCORE</span>
            <HeartPulse className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight flex items-baseline gap-2">
            <span
              className={
                intelligence.communityHealthScore >= 75
                  ? 'text-emerald-400'
                  : intelligence.communityHealthScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {intelligence.communityHealthScore}
            </span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Status:{' '}
            <span className="text-white font-bold">
              {intelligence.communityHealthScore >= 75
                ? 'Stable Resilience'
                : intelligence.communityHealthScore >= 50
                ? 'Elevated Strain'
                : 'Critical Alert'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Trend & Moving Average */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Transmission Incidence Curve</h3>
              <p className="text-xs text-slate-400">Daily validated cases vs. 7-day trailing moving average</p>
            </div>
            <button
              onClick={() => onSelectPage('forecast-center')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition"
            >
              View 30-Day Forecast →
            </button>
          </div>

          <TrendChart
            data={dailyChartData}
            primaryLabel="Daily Cases"
            secondaryLabel="7-Day Avg"
            primaryColor="#06b6d4"
            secondaryColor="#a855f7"
            height={250}
          />
        </div>

        {/* Right 1 Col: Radar Threat Matrix */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Threat Matrix</h3>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                MULTI-VECTOR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Holistic threat polygon across surveillance dimensions</p>
          </div>

          <div className="py-2 flex justify-center">
            <RadarChart attributes={intelligence.radarAttributes} size={230} />
          </div>

          <div className="text-[11px] font-mono text-slate-500 text-center">
            Estimated R₀: <span className="text-cyan-300 font-bold">{intelligence.estimatedR0}</span> • Anomaly Outliers:{' '}
            <span className="text-rose-400 font-bold">{intelligence.anomalies.length}</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Clinical Acuity & Top Pathogens & Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Acuity & Hospitalization Breakdown */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Clinical Severity Cohorts</h3>
          <div className="space-y-3 pt-2 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Severe / Critical Ratio</span>
                <span className="text-rose-400 font-bold">{severePercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-rose-500"
                  style={{ width: `${Math.min(100, Math.max(5, Number(severePercent)))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Hospital Inpatient Rate</span>
                <span className="text-cyan-300 font-bold">{hospPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${Math.min(100, Math.max(5, Number(hospPercent)))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>ICU Surge Demand</span>
                <span className="text-purple-400 font-bold">{icuPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  style={{ width: `${Math.min(100, Math.max(5, Number(icuPercent)))}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500">
              Surge modeling projects ICU beds reaching 90% capacity if R₀ &gt; 1.4 persists over 14 days.
            </div>
          </div>
        </div>

        {/* Top Active Pathogens */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Active Pathogens</h3>
            <button
              onClick={() => onSelectPage('disease-intelligence')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              All Pathogens →
            </button>
          </div>

          <div className="space-y-2.5">
            {intelligence.topDiseases.slice(0, 4).map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{d.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {d.count} cases ({d.percentage}%) • R₀ ≈ {d.r0Estimate}
                  </div>
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
                  {d.riskLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Zones */}
        <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Risk Sector Heatmap</h3>
            <button
              onClick={() => onSelectPage('outbreak-heatmap')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              Inspect Map →
            </button>
          </div>

          <div className="space-y-2.5">
            {intelligence.topZones.slice(0, 4).map((z) => (
              <div
                key={z.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-semibold text-white">{z.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {z.count} cases • Risk Index: {z.riskScore}/100
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    z.riskCategory === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : z.riskCategory === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {z.riskCategory} Zone
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
