import React from 'react';
import { Shield, Plus, Menu, X, Database, Bell, AlertTriangle } from 'lucide-react';
import { ActivePage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentPage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  totalRecords: number;
  activeAlerts: number;
  highRiskZones: number;
  onOpenAddModal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  totalRecords,
  activeAlerts,
  highRiskZones,
  onOpenAddModal,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-500/10 bg-[#05070a]/90 backdrop-blur-xl transition-all">
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
            onClick={() => onSelectPage('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-900 via-slate-900 to-cyan-900 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-wider bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent font-mono">
                  OUTBREAKX
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  EARLY WARNING
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-mono tracking-wide">
                AI-Powered Disease Outbreak Prediction & Early Warning System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Surveillance Telemetry & Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Dataset Record Counter */}
          <button
            onClick={() => onSelectPage('upload')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono transition"
            title="Manage Surveillance Dataset"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Total Cases:</span>
            <span className={`font-bold ${totalRecords > 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
              {totalRecords.toLocaleString()}
            </span>
          </button>

          {/* Active Outbreak Alerts Badge */}
          <button
            onClick={() => onSelectPage('alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 text-xs font-mono transition"
            title="View Active Outbreak Alerts"
          >
            <Bell className={`w-3.5 h-3.5 ${activeAlerts > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden md:inline text-slate-400">Alerts:</span>
            <span className={`font-bold ${activeAlerts > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {activeAlerts}
            </span>
          </button>

          {/* High Risk Districts Badge */}
          {highRiskZones > 0 && (
            <button
              onClick={() => onSelectPage('map')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300 transition"
              title="High Risk Districts Detected"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{highRiskZones} High Risk Districts</span>
            </button>
          )}

          {/* Add Record Trigger */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-500/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Record</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
