import React from 'react';
import {
  Home,
  LayoutDashboard,
  BarChart3,
  Microscope,
  MapPin,
  TrendingUp,
  Users,
  Building2,
  Bot,
  Database,
  Radio,
  Bell,
  Crosshair,
} from 'lucide-react';
import { ActivePage } from '../types';

interface SidebarProps {
  currentPage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  isOpen: boolean;
  onClose: () => void;
  totalRecords: number;
  activeAlerts: number;
}

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onClose,
  totalRecords,
  activeAlerts,
}) => {
  const navItems: NavItem[] = [
    { id: 'landing', label: 'Overview & Mission', icon: Home },
    {
      id: 'dashboard',
      label: 'Health Insights & Dashboard',
      icon: LayoutDashboard,
      badge: activeAlerts > 0 ? `${activeAlerts} Alerts` : undefined,
    },
    {
      id: 'analytics-dashboard',
      label: 'Real-Time Analytics',
      icon: BarChart3,
      badge: 'Data Science',
      highlight: true,
    },
    {
      id: 'alert-center',
      label: 'Alert Center',
      icon: Bell,
      badge: activeAlerts > 0 ? `${activeAlerts}` : undefined,
    },
    {
      id: 'threat-radar',
      label: 'Threat Radar',
      icon: Crosshair,
    },
    { id: 'disease-intelligence', label: 'Disease Monitoring', icon: Microscope },
    { id: 'outbreak-heatmap', label: 'Area Risk & Map', icon: MapPin },
    { id: 'forecast-center', label: 'Prediction Center', icon: TrendingUp },
    { id: 'population-analytics', label: 'People Analysis', icon: Users },
    { id: 'hospital-intelligence', label: 'Hospital Readiness', icon: Building2 },
    {
      id: 'ai-command-center',
      label: 'AI Health Copilot',
      icon: Bot,
      highlight: true,
    },
    {
      id: 'dataset-management',
      label: 'Dataset & Records',
      icon: Database,
      badge: totalRecords > 0 ? totalRecords : 'Empty',
    },
  ];

  const handleNav = (id: ActivePage) => {
    onSelectPage(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-purple-500/10 bg-[#07090e]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4 overflow-y-auto`}
      >
        <div className="space-y-6">
          {/* Section: Platform Navigation */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-500 uppercase">
              <span>Intelligence Modules</span>
              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                Live
              </span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-900/50 via-cyan-950/40 to-transparent border border-cyan-500/30 text-white shadow-lg shadow-purple-950/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg transition ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : item.highlight
                            ? 'bg-purple-500/10 text-purple-400 group-hover:text-purple-300'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={item.highlight && !isActive ? 'text-purple-300 font-semibold' : ''}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          String(item.badge).includes('Alert')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Platform Status Card */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#0c0f1c] to-[#080b12] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Biosurveillance State</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {totalRecords > 0
                ? `${totalRecords.toLocaleString()} incident vectors indexed with continuous Kalman & Holt filtering.`
                : 'Zero records indexed. Awaiting surveillance dataset ingest.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
