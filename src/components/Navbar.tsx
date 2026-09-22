import React from 'react';
import { Shield, Activity, Plus, Menu, X, Database, BarChart3 } from 'lucide-react';
import { ActivePage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentPage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  totalRecords: number;
  healthScore: number;
  activeAlerts: number;
  onOpenAddModal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  totalRecords,
  healthScore,
  activeAlerts,
  onOpenAddModal,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/10 bg-[#05070a]/85 backdrop-blur-xl transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            aria-label="Toggle Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onSelectPage('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-900 via-slate-900 to-cyan-900 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
                  ViraNexus AI
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  BIOSURVEILLANCE
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-mono tracking-wide">
                Predicting Outbreaks Before They Spread
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right: Live Telemetry Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Active Dataset Record Counter */}
          <div
            onClick={() => onSelectPage('dataset-management')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 text-xs font-mono transition"
            title="Click to view Dataset & Records"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Records:</span>
            <span className={`font-bold ${totalRecords > 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
              {totalRecords.toLocaleString()}
            </span>
          </div>

          {/* Health Score Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Health Index:</span>
            <span
              className={`font-bold ${
                totalRecords === 0
                  ? 'text-slate-400'
                  : healthScore >= 80
                  ? 'text-emerald-400'
                  : healthScore >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {totalRecords > 0 ? `${healthScore}/100` : '--'}
            </span>
          </div>

          {/* Active Alerts Badge */}
          <div
            onClick={() => onSelectPage('alert-center')}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${
              totalRecords > 0 && activeAlerts > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
            title={totalRecords > 0 ? `${activeAlerts} active outbreak alerts` : '0 Alerts'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                totalRecords > 0 && activeAlerts > 0 ? 'bg-rose-500' : 'bg-slate-600'
              }`}
            />
            <span>{totalRecords > 0 ? activeAlerts : 0} Alerts</span>
          </div>

          {/* Analytics Dashboard Button */}
          <button
            onClick={() => onSelectPage('analytics-dashboard')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
              currentPage === 'analytics-dashboard'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-cyan-500/30'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analytics</span>
          </button>

          {/* Add Record Button */}
          <button
            onClick={onOpenAddModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Record</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
