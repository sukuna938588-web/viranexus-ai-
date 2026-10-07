import React from 'react';
import {
  UploadCloud,
  Plus,
  LayoutDashboard,
  FileSpreadsheet,
  Shield,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Bell,
  Globe,
} from 'lucide-react';
import { EpidemiologicalIntelligence, OutbreakRecord, ActivePage } from '../types';
import { Globe3D } from '../components/Globe3D';

interface OverviewProps {
  intelligence: EpidemiologicalIntelligence;
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onOpenAddModal: () => void;
  onLoadSample: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  intelligence,
  records,
  onSelectPage,
  onOpenAddModal,
  onLoadSample,
}) => {
  const { totalCases, estimatedR0, topDiseases, topZones, activeAlertsCount, communityHealthScore } = intelligence;

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Large Hero Quote Banner (CENTER OF ATTENTION) */}
      <div className="relative text-center pt-8 pb-6 px-4 space-y-4">
        {/* Futuristic glowing badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-purple-500/15 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-lg shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-widest uppercase">OUTBREAKX SURVEILLANCE COMMAND</span>
          <span className="text-slate-600">|</span>
          <span className="text-purple-300 font-semibold">AI Early Warning Platform</span>
        </div>

        {/* Massive Hero Quote */}
        <div className="space-y-3 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-mono leading-none">
            <span className="block text-slate-400 text-lg sm:text-2xl font-light mb-2 tracking-widest uppercase">
              AI-Powered Biosurveillance Intelligence
            </span>
            <span className="bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,0.35)]">
              “Predicting Outbreaks Before They Spread”
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-2xl mx-auto leading-relaxed font-light">
            Next-generation epidemiological command center built for hospitals, public health authorities, and researchers to detect pathogen vectors, analyze district clusters, and forecast contagion trajectories.
          </p>
        </div>
      </div>

      {/* 2. Interactive Animated 3D Globe Viewport */}
      <div className="relative max-w-5xl mx-auto">
        <Globe3D
          totalRecords={totalCases}
          r0={estimatedR0}
          topDisease={topDiseases[0]?.name}
          topLocation={topZones[0]?.name}
          locations={topZones.map((z) => ({
            name: z.name,
            cases: z.count,
            disease: z.activeDiseases[0] || 'Target Pathogen',
            severity: z.riskCategory,
          }))}
        />
      </div>

      {/* 3. Overview Large Quick Action Buttons (PREMIUM LOOK) */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            Command Center Quick Actions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Upload CSV */}
          <button
            onClick={() => onSelectPage('upload')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#0c1224] to-[#080d19] border border-cyan-500/30 hover:border-cyan-400 text-left transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              Upload CSV
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Ingest multi-district surveillance datasets with auto-parsing
            </p>
          </button>

          {/* Action 2: Add Dataset Record */}
          <button
            onClick={onOpenAddModal}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#140e24] to-[#0a0715] border border-purple-500/30 hover:border-purple-400 text-left transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-3">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              Add Dataset Record
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-purple-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Manual case entry with smart location GPS & acuity triage
            </p>
          </button>

          {/* Action 3: Open Dashboard */}
          <button
            onClick={() => onSelectPage('dashboard')}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#0c1224] to-[#080d19] border border-cyan-500/30 hover:border-cyan-400 text-left transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-3">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              Access real-time disease metrics & risk stratification
            </p>
          </button>

          {/* Action 4: Load Sample Data (For judges) */}
          <button
            onClick={onLoadSample}
            className="group relative p-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-left transition-all duration-300 shadow-xl shadow-cyan-500/25 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black font-mono flex items-center gap-1.5">
              Load Sample Data
              <Sparkles className="w-3.5 h-3.5" />
            </h3>
            <p className="text-[11px] text-slate-900 font-mono mt-1 font-semibold">
              Instant 1-click test with verified Tamil Nadu surveillance data
            </p>
          </button>
        </div>
      </div>

      {/* 4. Telemetry Highlights Bar */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#070b16] border border-slate-800 text-center font-mono text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Indexed Cases</span>
          <div className="text-lg font-black text-white mt-0.5">{totalCases.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Health Score</span>
          <div className="text-lg font-black text-emerald-400 mt-0.5">
            {records.length > 0 ? `${communityHealthScore}/100` : '--'}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Transmission Speed</span>
          <div className="text-lg font-black text-purple-300 mt-0.5">
            {records.length > 0 ? `R₀ = ${estimatedR0}` : '--'}
          </div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Active Alerts</span>
          <div className="text-lg font-black text-rose-400 mt-0.5">{activeAlertsCount}</div>
        </div>
      </div>
    </div>
  );
};
