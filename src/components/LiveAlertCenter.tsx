import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  Building2,
  CloudRain,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { EpidemiologicalIntelligence, LiveAlert, ActivePage } from '../types';

interface LiveAlertCenterProps {
  intelligence: EpidemiologicalIntelligence;
  totalRecords: number;
  onSelectPage?: (page: ActivePage) => void;
  onOpenAddModal?: () => void;
}

export const LiveAlertCenter: React.FC<LiveAlertCenterProps> = ({
  intelligence,
  totalRecords,
  onSelectPage,
  onOpenAddModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'growth' | 'hospital' | 'spike' | 'weather'>('all');
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);

  const { liveAlerts, highRiskZonesCount, totalCases } = intelligence;

  const filteredAlerts = (liveAlerts || []).filter((alert) => {
    if (resolvedAlerts.includes(alert.id)) return false;
    if (filterType === 'all') return true;
    return alert.type === filterType;
  });

  const handleAcknowledge = (id: string) => {
    setResolvedAlerts((prev) => [...prev, id]);
  };

  const getAlertIcon = (type: LiveAlert['type']) => {
    switch (type) {
      case 'growth':
        return <TrendingUp className="w-5 h-5 text-rose-400" />;
      case 'hospital':
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case 'spike':
        return <AlertTriangle className="w-5 h-5 text-purple-400" />;
      case 'weather':
        return <CloudRain className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#080b15] border border-slate-800 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Live Alert Center
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DYNAMIC SURVEILLANCE
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Automatically generated outbreak warnings computed from your surveillance dataset
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Active: <strong className="text-cyan-400">{filteredAlerts.length}</strong> alerts
          </span>
          {onSelectPage && (
            <button
              onClick={() => onSelectPage('ai-command-center')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-xs font-mono text-cyan-200 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Ask AI Copilot
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterType === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Alerts ({liveAlerts?.length || 0})
        </button>
        <button
          onClick={() => setFilterType('growth')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterType === 'growth'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Disease Growth
        </button>
        <button
          onClick={() => setFilterType('hospital')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterType === 'hospital'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hospital Demand
        </button>
        <button
          onClick={() => setFilterType('spike')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterType === 'spike'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Area Clusters & Spikes
        </button>
        <button
          onClick={() => setFilterType('weather')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterType === 'weather'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Weather Alerts
        </button>
      </div>

      {/* Alerts Feed */}
      {totalRecords === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#080b15] border border-dashed border-slate-800 space-y-4">
          <ShieldCheck className="w-12 h-12 text-cyan-400/50 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Dataset Loaded</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload CSV or Add Records to Start Analysis
          </p>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-cyan-400 transition font-mono"
            >
              + Add Records
            </button>
          )}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#080b15] border border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Alerts Acknowledged or Baseline Stable</h3>
          <p className="text-xs text-slate-400">
            No critical anomalies exceed standard alert thresholds in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.level === 'critical';
            const isWarning = alert.level === 'warning';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
                  isCritical
                    ? 'bg-gradient-to-r from-rose-950/40 via-[#0a0d18] to-[#080b14] border-rose-500/40 shadow-lg shadow-rose-950/20'
                    : isWarning
                    ? 'bg-gradient-to-r from-amber-950/30 via-[#0a0d18] to-[#080b14] border-amber-500/30'
                    : 'bg-[#080b15] border-cyan-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border ${
                        isCritical
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : isWarning
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      }`}
                    >
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        {alert.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1 text-cyan-400">
                          <MapPin className="w-3 h-3" />
                          {alert.location}
                        </span>
                        <span>•</span>
                        <span className="text-purple-300">{alert.disease}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {alert.level}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{alert.timestamp}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <div className="inline-block px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200">
                      <strong>Data Signal:</strong> {alert.metric}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">Action Protocol:</strong> {alert.recommendation}
                    </p>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
                    >
                      Acknowledge
                    </button>
                    {onSelectPage && (
                      <button
                        onClick={() => onSelectPage('ai-command-center')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
                      >
                        <span>Deep Dive</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
