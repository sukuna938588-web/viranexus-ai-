import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Crosshair,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';

interface PredictionCenterProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
  onFocusPrediction?: (pred: {
    location: string;
    disease?: string;
    probability?: number;
    timeWindow?: string;
    explanation?: string;
  }) => void;
}

export const PredictionCenter: React.FC<PredictionCenterProps> = ({
  intelligence,
  records,
  onSelectPage,
  onLoadSample,
  onFocusPrediction,
}) => {
  const [forecastHorizon, setForecastHorizon] = useState<7 | 30>(7);

  const { prediction, forecast7Day, forecast30Day, estimatedR0, growthRatePct } = intelligence;

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">Prediction Center</h1>
          <p className="text-xs text-slate-400 font-mono">AI-powered early outbreak trajectory forecasting</p>
        </div>

        <div className="p-12 rounded-3xl bg-[#080c18] border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white font-mono">No Prediction Telemetry Available</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Upload verified surveillance records or load the sample Tamil Nadu dataset to calculate next outbreak probabilities, time windows, and regional spread trajectories.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onLoadSample}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Load Sample Dataset
            </button>
            <button
              onClick={() => onSelectPage('upload')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-xs font-mono hover:bg-slate-800 transition"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeForecast = forecastHorizon === 7 ? forecast7Day : forecast30Day;
  const maxForecastCase = Math.max(1, ...activeForecast.map((f) => f.upperCI));

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Outbreak Prediction Center
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Empirical Bayesian trend forecasting &bull; Probabilistic outbreak modeling based on dataset spread patterns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
            R₀ = {estimatedR0}
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            {growthRatePct >= 0 ? '+' : ''}{growthRatePct}% Growth
          </span>
        </div>
      </div>

      {/* Primary Hero Card: Most Likely Next Outbreak */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0a0e1c] via-[#080b16] to-[#0a0e1c] border-2 border-cyan-500/40 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Projected Emergence
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-1">
                Most Likely Next Outbreak: <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">{prediction.disease}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase hidden sm:inline-block">
                Primary Threat Vector
              </span>
              <button
                onClick={() => {
                  const targetDistrict =
                    prediction.affectedDistricts[0] ||
                    records[0]?.region ||
                    records[0]?.district ||
                    '';
                  if (targetDistrict && onFocusPrediction) {
                    onFocusPrediction({
                      location: targetDistrict,
                      disease: prediction.disease,
                      probability: prediction.probability,
                      timeWindow: prediction.timeWindow,
                      explanation: prediction.explanation,
                    });
                  }
                  onSelectPage('map');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono shadow-lg shadow-cyan-500/25 active:scale-95 transition"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>View On Map</span>
              </button>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Probability % & Confidence */}
            <div className="p-5 rounded-2xl bg-[#05070e] border border-cyan-500/30 space-y-1">
              <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Surge Probability</span>
                <span className="text-cyan-400 font-bold">
                  {prediction.confidence ? `${prediction.confidence}% Confidence` : 'Empirical CI'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  {prediction.probability}%
                </div>
                {prediction.confidence && (
                  <span className="text-[11px] font-mono text-cyan-200/70">
                    ({prediction.confidence}% Confidence)
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                  style={{ width: `${prediction.probability}%` }}
                />
              </div>
            </div>

            {/* Expected Time Window */}
            <div className="p-5 rounded-2xl bg-[#05070e] border border-purple-500/30 space-y-1">
              <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Expected Time</span>
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-purple-300 font-mono">
                {prediction.timeWindow}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-2">
                Anticipated incubation & localized spread cycle
              </div>
            </div>

            {/* Projected Cases */}
            <div className="p-5 rounded-2xl bg-[#05070e] border border-slate-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Projected Surge</span>
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                ~{prediction.projectedCases} Cases
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-2">
                Velocity estimate: +{prediction.growthRate}% weekly
              </div>
            </div>
          </div>

          {/* Affected Regions */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Affected Regions:
            </div>
            <div className="flex flex-wrap gap-2">
              {prediction.affectedDistricts.map((district) => (
                <button
                  key={district}
                  onClick={() => {
                    if (onFocusPrediction) {
                      onFocusPrediction({
                        location: district,
                        disease: prediction.disease,
                        probability: prediction.probability,
                        timeWindow: prediction.timeWindow,
                        explanation: prediction.explanation,
                      });
                    }
                    onSelectPage('map');
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono text-white font-semibold shadow-sm transition active:scale-95 group"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>{district}</span>
                  <span className="text-[10px] text-cyan-400 opacity-80 group-hover:opacity-100">&bull; View on Map</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Explanation based on uploaded dataset */}
          <div className="p-5 rounded-2xl bg-[#05070e] border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              AI Forecast Explanation
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed">
              {prediction.explanation}
            </p>
          </div>

          {/* Growth Trend Explanation based on date, disease, region, cases, deaths and recovery trends */}
          {prediction.growthTrendExplanation && (
            <div className="p-5 rounded-2xl bg-[#05070e] border border-cyan-500/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Growth Trend & Historical Velocity Explanation
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {prediction.growthTrendExplanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Predictive Timeline Curve with 7-Day & 30-Day Horizons */}
      <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Case Growth Trajectory & Forecast Horizon
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Projected daily case progression with 95% empirical confidence bounds
            </p>
          </div>

          {/* Horizon toggle */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setForecastHorizon(7)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                forecastHorizon === 7
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7-Day Horizon
            </button>
            <button
              onClick={() => setForecastHorizon(30)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                forecastHorizon === 30
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30-Day Horizon
            </button>
          </div>
        </div>

        {/* Forecast Bar visualization */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 max-h-[320px] overflow-y-auto">
            {activeForecast.slice(0, forecastHorizon === 7 ? 7 : 14).map((pt, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#05070f] border border-slate-800 text-center space-y-1.5"
              >
                <div className="text-[10px] font-mono text-slate-400">{pt.day}</div>
                <div className="text-sm font-black text-cyan-300 font-mono">
                  {pt.predictedCases}
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  CI: {pt.lowerCI} - {pt.upperCI}
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (pt.predictedCases / maxForecastCase) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Anticipated Outbreak Threats */}
      {prediction.secondaryOutbreaks.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Secondary Monitored Pathogen Vectors
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediction.secondaryOutbreaks.map((sec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#060810] border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{sec.disease}</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{sec.probability}%</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Expected: <strong className="text-slate-200">{sec.timeWindow}</strong>
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  Districts: {sec.districts.join(', ') || 'Regional'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
