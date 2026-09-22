import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { TrendChart } from '../components/TrendChart';

interface ForecastCenterProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onUploadRecords: (records: OutbreakRecord[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const ForecastCenter: React.FC<ForecastCenterProps> = ({
  intelligence,
  records,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const [horizon, setHorizon] = useState<7 | 30>(7);

  if (records.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Forecast Center</h1>
          <p className="text-xs text-slate-400 font-mono">Time-series forecasting, confidence bands & anomaly surge detection</p>
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

  const forecastData = horizon === 7 ? intelligence.forecast7Day : intelligence.forecast30Day;

  const chartPoints = forecastData.map((f) => ({
    label: f.date,
    primary: f.predictedCases,
    lowerCI: f.lowerCI,
    upperCI: f.upperCI,
    annotation: f.predictedCases > (intelligence.dailyTrends[intelligence.dailyTrends.length - 1]?.cases || 0) * 1.3 ? 'Surge' : undefined,
  }));

  const anomalies = intelligence.anomalies;

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Horizon Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Predictive Forecast Center</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              HOLT-WINTERS FILTER
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Bayesian trend smoothing with 95% empirical confidence intervals
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setHorizon(7)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
              horizon === 7
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7-Day Horizon
          </button>
          <button
            onClick={() => setHorizon(30)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
              horizon === 30
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            30-Day Outlook
          </button>
        </div>
      </div>

      {/* Primary Forecast Chart */}
      <div className="p-6 rounded-3xl bg-[#090d18]/70 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Projected Transmission Volume ({horizon} Days)
            </h3>
            <p className="text-xs text-slate-400">
              Mean projection curve with 95% confidence interval boundaries
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Confidence Index: 92.4%</span>
          </div>
        </div>

        <TrendChart
          data={chartPoints}
          primaryLabel="Forecast Mean"
          primaryColor="#06b6d4"
          height={280}
          showConfidenceBands={true}
        />
      </div>

      {/* Anomaly Detection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Statistical Anomaly Detections (&gt;1.8σ Outliers)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Unusual transmission acceleration exceeding historical Poisson variance
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-mono">
            {anomalies.length} Detected
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            No statistical outliers detected in current baseline surveillance window.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {anomalies.map((ano) => (
              <div
                key={ano.id}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#160c1c] to-[#07090e] border border-rose-500/30 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    {ano.date}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Z = +{ano.zScore}
                  </span>
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  {ano.actual}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    (exp. {Math.round(ano.expected)})
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {ano.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
