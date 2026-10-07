import React from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  MapPin,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  HeartPulse,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Crosshair,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';

interface DashboardProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onOpenAddModal: () => void;
  onLoadSample: () => void;
  onFocusPrediction?: (pred: {
    location: string;
    disease?: string;
    probability?: number;
    timeWindow?: string;
    explanation?: string;
  }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  intelligence,
  records,
  onSelectPage,
  onOpenAddModal,
  onLoadSample,
  onFocusPrediction,
}) => {
  const {
    totalCases,
    activeCases,
    recoveredCount,
    deceasedCount,
    communityHealthScore,
    activeAlertsCount,
    highRiskZonesCount,
    estimatedR0,
    growthRatePct,
    topDiseases,
    topZones,
    prediction,
    liveAlerts,
  } = intelligence;

  if (records.length === 0) {
    return (
      <div className="space-y-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-[#070b14] via-[#090e1f] to-[#070b14] border border-cyan-500/20 backdrop-blur-xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Surveillance Engine Ready</span>
              <span className="text-slate-600">|</span>
              <span>Zero Fake Records</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              SURVEILLANCE DASHBOARD
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl font-light leading-relaxed">
              Real-time multi-pathogen monitoring, verified risk detection, predictive trend intelligence, and active triage warnings. Load sample data or upload your CSV surveillance records.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-3 shrink-0">
            <button
              onClick={onLoadSample}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-xl shadow-cyan-500/20 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Load Sample Dataset
            </button>
            <button
              onClick={() => onSelectPage('dataset')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs font-mono transition"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Upload CSV File
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryEpicenter = topZones[0]?.name || 'N/A';

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Surveillance Command Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time disease surveillance across {topZones.length} districts &bull; {totalCases.toLocaleString()} verified cases
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPage('prediction')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-xs font-mono text-cyan-200 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Prediction Center
          </button>
          <button
            onClick={() => onSelectPage('map')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            Disease Map
          </button>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cases */}
        <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">1. Total Cases</span>
            <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {totalCases.toLocaleString()}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono mt-2 text-slate-400">
            <span className="text-emerald-400 font-semibold">{recoveredCount} Recovered</span>
            <span>&bull;</span>
            <span className="text-cyan-300">{activeCases} Active</span>
          </div>
        </div>

        {/* Card 2: Active Alerts */}
        <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-rose-500/40 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">2. Active Alerts</span>
            <Bell className={`w-4 h-4 ${activeAlertsCount > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} style={{ animationDuration: '3s' }} />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
            {activeAlertsCount}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono mt-2 text-slate-400">
            <span className="text-rose-300 font-semibold">
              {liveAlerts.filter((a) => a.level === 'critical').length} Critical
            </span>
            <span>&bull;</span>
            <span className="text-amber-400">
              {liveAlerts.filter((a) => a.level === 'high').length} High
            </span>
          </div>
        </div>

        {/* Card 3: High Risk Locations */}
        <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-amber-500/40 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">3. High Risk Locations</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
            {highRiskZonesCount}
          </div>
          <div className="text-[11px] font-mono mt-2 text-slate-400 truncate">
            Primary Epicenter: <strong className="text-white">{primaryEpicenter}</strong>
          </div>
        </div>

        {/* Card 4: Community Health Score (Strictly Dataset Calculated!) */}
        <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">4. Community Health Score</span>
            <HeartPulse className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className={`text-3xl font-black font-mono tracking-tight ${
            communityHealthScore >= 75 ? 'text-emerald-400' : communityHealthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {communityHealthScore}/100
          </div>
          <div className="text-[11px] font-mono mt-2 text-slate-400">
            <span className="text-cyan-300 font-semibold">Real Data Derived</span> &bull; R₀: {estimatedR0}
          </div>
        </div>
      </div>

      {/* Main Grid: Forecast Summary Card (Card 5) + District Risk Stratification (Card 6) + Recent Activity (Card 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Forecast Summary Card & District Risk Stratification */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 5: Forecast Summary Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c0f1d] via-[#090c19] to-[#0c0f1d] border border-cyan-500/30 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                    5. Forecast Summary Card
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  EMPIRICAL PREDICTION
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#060810]/80 border border-slate-800">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Next Likely Outbreak</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {prediction.disease}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Outbreak Probability</div>
                  <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                    {prediction.probability}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Expected Window</div>
                  <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
                    {prediction.timeWindow}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-slate-400 mb-1">
                  Affected Regions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prediction.affectedDistricts.map((dist, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200"
                    >
                      📍 {dist}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                {prediction.explanation}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <button
                  onClick={() => {
                    const targetLoc = prediction.affectedDistricts[0] || 'Chennai';
                    if (onFocusPrediction) {
                      onFocusPrediction({
                        location: targetLoc,
                        disease: prediction.disease,
                        probability: prediction.probability,
                        timeWindow: prediction.timeWindow,
                        explanation: prediction.explanation,
                      });
                    }
                    onSelectPage('map');
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs font-mono shadow-md shadow-cyan-500/20 active:scale-95 transition"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>View On Map</span>
                </button>

                <button
                  onClick={() => onSelectPage('prediction')}
                  className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold transition group"
                >
                  <span>Prediction Center &rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 6: District Risk Stratification */}
          <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  6. District Risk Stratification
                </h3>
              </div>
              <button
                onClick={() => onSelectPage('map')}
                className="text-xs font-mono text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
              >
                View Full Map
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topZones.slice(0, 5).map((zone, idx) => {
                let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                if (zone.riskCategory === 'Critical') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                else if (zone.riskCategory === 'High') badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/30';
                else if (zone.riskCategory === 'Medium') badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';

                return (
                  <div
                    key={zone.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#060810] border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                        0{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">
                          {zone.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {zone.activeDiseases.join(', ') || 'Monitored cluster'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {zone.count} cases
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                        {zone.riskCategory}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Active Alerts & Recent Outbreak Activity (Card 7) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Alerts Widget */}
          <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Active Outbreak Alerts
                </h3>
              </div>
              <button
                onClick={() => onSelectPage('alerts')}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 transition flex items-center gap-1"
              >
                All Alerts ({liveAlerts.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {liveAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-2xl bg-[#060810] border border-slate-800 space-y-1.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 font-mono line-clamp-1">
                      {alert.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        alert.level === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : alert.level === 'high'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {alert.level}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    {alert.metric}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono line-clamp-2">
                    {alert.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 7: Recent Outbreak Activity */}
          <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                7. Recent Outbreak Activity
              </h3>
            </div>

            <div className="space-y-3">
              {records.slice(0, 5).map((rec, i) => (
                <div
                  key={rec.id || i}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#060810] border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <div>
                      <div className="text-xs font-bold text-slate-200 font-mono">
                        {rec.disease} &bull; {rec.region}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Date: {rec.date} &bull; Acuity: {rec.severity}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-cyan-300">
                    +{rec.cases} cases
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
