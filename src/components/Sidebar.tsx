import React from 'react';
import {
  Globe,
  LayoutDashboard,
  Map,
  Network,
  Sparkles,
  Bell,
  BarChart3,
  Database,
  Bot,
  Download,
  Settings,
  Radio,
  Shield,
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
  emoji: string;
  badge?: string | number;
  badgeColor?: string;
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
    {
      id: 'overview',
      label: 'Overview & Globe',
      icon: Globe,
      emoji: '🌐',
      badge: '3D',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      highlight: true,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      emoji: '🏠',
    },
    {
      id: 'map',
      label: 'Disease Map',
      icon: Map,
      emoji: '🗺',
      badge: 'Tamil Nadu',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'network',
      label: 'Network Graph',
      icon: Network,
      emoji: '🕸',
      badge: 'Animated',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      highlight: true,
    },
    {
      id: 'prediction',
      label: 'Prediction Center',
      icon: Sparkles,
      emoji: '🔮',
      badge: 'AI Model',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      highlight: true,
    },
    {
      id: 'alerts',
      label: 'Alert Center',
      icon: Bell,
      emoji: '🚨',
      badge: activeAlerts > 0 ? activeAlerts : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      emoji: '📊',
    },
    {
      id: 'upload',
      label: 'Dataset Management',
      icon: Database,
      emoji: '📂',
      badge: totalRecords > 0 ? `${totalRecords}` : 'CSV',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'copilot',
      label: 'AI Copilot',
      icon: Bot,
      emoji: '🤖',
      badge: 'Tamil & Eng',
      badgeColor: 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30',
      highlight: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      emoji: '⚙',
    },
  ];

  const handleNav = (id: ActivePage) => {
    onSelectPage(id);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-purple-500/10 bg-[#07090e]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4 overflow-y-auto`}
      >
        <div className="space-y-6">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-mono tracking-wider text-slate-500 uppercase">
              <span>Surveillance Modules</span>
              <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                Live HUD
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
                    className={`group relative flex w-full items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-mono font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-transparent border border-cyan-500/30 text-white font-bold shadow-lg shadow-cyan-950/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base select-none">{item.emoji}</span>
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-cyan-400'
                            : item.highlight
                            ? 'text-purple-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="tracking-tight">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                          item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="p-3 rounded-2xl bg-[#05070c] border border-slate-800/80 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                OUTBREAKX v3.0
              </span>
              <span className="text-emerald-400 text-[10px]">ACTIVE</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              AI Outbreak Surveillance Command
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
