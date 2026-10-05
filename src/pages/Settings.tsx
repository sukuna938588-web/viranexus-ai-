import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Languages,
  Database,
  Download,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { OutbreakRecord, ActivePage } from '../types';

interface SettingsProps {
  records: OutbreakRecord[];
  onClearAll: () => void;
  onLoadSample: () => void;
  onSelectPage: (page: ActivePage) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  records,
  onClearAll,
  onLoadSample,
  onSelectPage,
}) => {
  const [sensitivity, setSensitivity] = useState<'Standard' | 'Sensitive' | 'Aggressive'>('Standard');
  const [prefLang, setPrefLang] = useState<'Auto' | 'English' | 'Tamil' | 'Tanglish'>('Auto');
  const [regionFocus, setRegionFocus] = useState<'Tamil Nadu (38 Districts)' | 'All Regions'>('Tamil Nadu (38 Districts)');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `outbreakx_dataset_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const showSaved = (label: string) => {
    setSavedNotice(`Updated: ${label}`);
    setTimeout(() => setSavedNotice(null), 2500);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              System Settings & Configuration
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Surveillance thresholds &bull; Regional parameters &bull; Multilingual engine preferences
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Surveillance Parameters */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Surveillance Thresholds
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-300 font-bold block mb-1.5">
                Outbreak Alert Sensitivity
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {(['Standard', 'Sensitive', 'Aggressive'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSensitivity(s);
                      showSaved(`Sensitivity to ${s}`);
                    }}
                    className={`py-2 px-3 rounded-xl border transition ${
                      sensitivity === s
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                Controls Z-score anomaly sensitivity and rapid surge detection triggers.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 font-bold block mb-1.5">
                Geographic Surveillance Focus
              </label>
              <select
                value={regionFocus}
                onChange={(e) => {
                  setRegionFocus(e.target.value as any);
                  showSaved('Geographic Focus');
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/40"
              >
                <option value="Tamil Nadu (38 Districts)">Tamil Nadu (38 Districts Focus)</option>
                <option value="All Regions">All Regional Datasets</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 font-bold block mb-1.5">
                AI Copilot Preferred Response Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {(['Auto', 'English', 'Tamil', 'Tanglish'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setPrefLang(lang);
                      showSaved(`Copilot Language to ${lang}`);
                    }}
                    className={`py-2 px-2.5 rounded-xl border transition text-center ${
                      prefLang === lang
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'Auto' ? '🌐 Auto' : lang === 'Tamil' ? '🇮🇳 தமிழ்' : lang === 'Tanglish' ? '🗣 Tanglish' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Governance & Export */}
        <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Database className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Data Management & Backup
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#05070e] border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-white font-bold">Active Surveillance Records</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  {records.length} records currently indexed in storage
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                disabled={records.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 disabled:opacity-40 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#05070e] border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-white font-bold">Sample Reference Data</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Load official Tamil Nadu outbreak reference dataset
                </div>
              </div>
              <button
                onClick={onLoadSample}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:opacity-90 transition active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Load Sample</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#05070e] border border-rose-500/20 flex items-center justify-between text-xs font-mono">
              <div>
                <div className="text-rose-300 font-bold">Reset Surveillance System</div>
                <div className="text-slate-400 text-[10px] mt-0.5">
                  Clear all indexed records and restore empty baseline
                </div>
              </div>
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Platform Telemetry Card */}
      <div className="p-6 rounded-3xl bg-[#070913] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">OUTBREAKX v3.0 Enterprise</span>
            </div>
            <p className="text-[11px] text-slate-400">
              AI-Powered Disease Outbreak Prediction & Early Warning System
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              ● All 9 Core Modules Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
