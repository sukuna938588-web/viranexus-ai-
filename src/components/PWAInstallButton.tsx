import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
        <span>PWA ACTIVE</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (isInstallable) {
      const res = await install();
      if (res) {
        setJustInstalled(true);
      }
    } else {
      // Fallback for browsers without direct prompt event
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install ViraNexus as Progressive Web App"
        className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-200 bg-gradient-to-r from-purple-900/40 via-cyan-950/50 to-blue-900/40 border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg shadow-cyan-950/30 hover:shadow-cyan-500/20 transition-all duration-300 active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-bounce" />
        <span>Install PWA</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
      </button>

      {/* iOS & Manual Install Modal Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#101424] to-[#07090e] border border-cyan-500/30 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Install ViraNexus AI</h3>
                <p className="text-xs text-slate-400">Offline-first Health Intelligence PWA</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950/60 rounded-xl p-4 border border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold shrink-0">1</span>
                <span>Open in <strong>Safari</strong> (iOS) or <strong>Chrome</strong> (Android / Desktop).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold shrink-0">2</span>
                <span>Tap the <strong>Share button</strong> in Safari or <strong>Browser Menu (⋮)</strong> in Chrome.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold shrink-0">3</span>
                <span>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 text-center">
              Provides instant desktop/mobile launching, local dataset caching, and standalone performance.
            </p>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-900/30 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
