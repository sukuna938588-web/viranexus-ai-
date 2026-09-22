import React, { useRef } from 'react';
import {
  Shield,
  Activity,
  Upload,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Building2,
  Sparkles,
  Database,
  Radio,
  Crosshair,
  Bell,
  Users,
  MapPin,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import { ActivePage, EpidemiologicalIntelligence } from '../types';
import { parseCSVFile, downloadEmptyTemplate } from '../services/csvService';
import { Globe3D } from '../components/Globe3D';
import { RadarChart } from '../components/RadarChart';

interface LandingPageProps {
  onSelectPage: (page: ActivePage) => void;
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
  onUploadRecords: (records: any[], mode: 'append' | 'replace') => void;
  onOpenAddModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectPage,
  intelligence,
  totalRecords,
  onUploadRecords,
  onOpenAddModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { records, errors } = await parseCSVFile(file);
    if (records.length > 0) {
      onUploadRecords(records, 'replace');
      onSelectPage('dashboard');
    } else {
      alert(`CSV Upload Failed: ${errors.join('; ')}`);
    }
  };

  return (
    <div className="relative space-y-16 pb-16">
      {/* Hero Section with 3D Globe & Dynamic Surveillance Telemetry */}
      <section className="relative pt-4 sm:pt-10 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission & Controls */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-lg shadow-cyan-950/40">
              <span className={`w-2 h-2 rounded-full ${totalRecords > 0 ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{totalRecords > 0 ? 'Surveillance Active' : 'No Dataset Loaded'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-300">
                {totalRecords > 0 ? `${totalRecords.toLocaleString()} Indexed Cases` : 'Zero Default Data'}
              </span>
            </div>

            {/* Hero Title & Tagline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Predicting Outbreaks{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Before They Spread
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                {totalRecords > 0
                  ? 'AI-Powered Early Warning & Health Intelligence. Easily track disease outbreaks, project hospital surge risks, detect sudden spikes, and safeguard communities with automated alerts.'
                  : 'Upload CSV or Add Records to Start Analysis. All analytics, charts, forecasts, heatmaps, alerts, disease intelligence cards, and AI responses are generated strictly from your uploaded data.'}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs font-mono shadow-xl shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all duration-300 active:scale-95"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>Upload CSV</span>
              </button>

              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-purple-300 font-bold text-xs font-mono shadow-lg transition-all duration-300 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-purple-400" />
                <span>+ Add Records</span>
              </button>

              {totalRecords > 0 && (
                <button
                  onClick={() => onSelectPage('dashboard')}
                  className="group flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs font-mono transition active:scale-95"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              <button
                onClick={downloadEmptyTemplate}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
                title="Download standard CSV column template"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Template</span>
              </button>
            </div>

            {/* Zero-State Notice */}
            {totalRecords === 0 && (
              <p className="text-xs text-slate-400 font-mono">
                No Dataset Loaded. Upload CSV or Add Records to Start Analysis.
              </p>
            )}
          </div>

          {/* Right Column: 3D Rotating Globe */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <Globe3D
              totalRecords={totalRecords}
              r0={intelligence.estimatedR0}
              topDisease={intelligence.topDiseases[0]?.name || ''}
              topLocation={intelligence.topZones[0]?.name || ''}
            />
          </div>
        </div>
      </section>

      {/* Live Metric Counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 max-w-6xl mx-auto">
        <div
          onClick={() => onSelectPage('dataset-management')}
          className="cursor-pointer p-5 rounded-3xl bg-[#080b15] border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-xl transition shadow-xl"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>RECORDS</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totalRecords}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalRecords > 0 ? 'Surveillance records loaded' : 'No records loaded'}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#080b15] border border-slate-800/80 backdrop-blur-xl transition shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>CASES</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {intelligence.totalCases}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalRecords > 0 ? 'Cumulative cases tracked' : 'No cases logged'}
          </div>
        </div>

        <div
          onClick={() => onSelectPage('alert-center')}
          className="group cursor-pointer p-5 rounded-3xl bg-[#080b15] border border-slate-800/80 hover:border-rose-500/40 backdrop-blur-xl transition shadow-xl"
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>ALERTS</span>
            <Bell className="w-4 h-4 text-rose-400 group-hover:animate-bounce" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
            {intelligence.activeAlertsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1 group-hover:text-rose-300">
            <span>{totalRecords > 0 ? 'Active outbreak alerts' : 'No alerts active'}</span>
            {totalRecords > 0 && <ArrowRight className="w-3 h-3" />}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#080b15] border border-slate-800/80 backdrop-blur-xl transition shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>HEALTH SCORE</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {totalRecords > 0 ? `${intelligence.communityHealthScore}/100` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {totalRecords > 0
              ? intelligence.communityHealthScore >= 75
                ? 'Resilient status'
                : 'Elevated risk'
              : 'Requires surveillance dataset'}
          </div>
        </div>
      </section>

      {/* Visual Health Threat Telemetry */}
      <section className="px-4 max-w-6xl mx-auto">
        {totalRecords > 0 && intelligence.radarAttributes.length > 0 ? (
          <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-[#0a0e1c] to-[#070912] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Real-Time Health Defense
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Holistic Health Threat Surveillance
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  ViraNexus AI calculates spread speed ($R_0$), hospital demand, area spread, and vulnerable groups from your uploaded data in real time.
                </p>

                <div className="space-y-2 pt-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Dominant Illness:</span>
                    <strong className="text-cyan-300">
                      {intelligence.topDiseases[0]?.name || 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Primary Location:</span>
                    <strong className="text-purple-300">
                      {intelligence.topZones[0]?.name || 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
                    <span className="text-slate-400">Spread Speed (R₀):</span>
                    <strong className="text-rose-400">
                      {intelligence.estimatedR0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Radar Chart Display */}
              <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-inner">
                <RadarChart attributes={intelligence.radarAttributes} size={280} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#080b15]/80 p-8 sm:p-12 text-center backdrop-blur-xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400">
              <Database className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">No Dataset Loaded</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Upload CSV or Add Records to Start Analysis. All threat indices, charts, and spatial maps will be calculated dynamically.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV</span>
              </button>
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-mono transition"
              >
                <PlusCircle className="w-4 h-4 text-purple-400" />
                <span>Add Records</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Navigation Feature Cards with Simple English */}
      <section className="px-4 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Specialized Health Intelligence Modules
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Clear, easy-to-understand insights generated exclusively from user surveillance records.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onSelectPage('analytics-dashboard')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#080b15] hover:bg-[#0d1222] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300"
          >
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Data Science Suite</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              9 advanced analytics modules including distribution pies, area bars, trends, and network graphs.
            </p>
          </div>

          <div
            onClick={() => onSelectPage('alert-center')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#080b15] hover:bg-[#0d1222] border border-slate-800 hover:border-rose-500/40 transition-all duration-300"
          >
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Live Alert Center</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated warnings for disease growth, hospital capacity spikes, and weather conditions.
            </p>
          </div>

          <div
            onClick={() => onSelectPage('threat-radar')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#080b15] hover:bg-[#0d1222] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300"
          >
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Crosshair className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>Health Threat Radar</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cyber-style circular radar tracking disease signals, risk intensity, and affected locations.
            </p>
          </div>

          <div
            onClick={() => onSelectPage('ai-command-center')}
            className="group cursor-pointer p-6 rounded-3xl bg-[#080b15] hover:bg-[#0d1222] border border-slate-800 hover:border-purple-500/40 transition-all duration-300"
          >
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1.5 flex items-center justify-between">
              <span>AI Health Copilot</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask questions about dangerous areas, forecast trends, or action steps in conversational natural language.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
