import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 5 seconds
      setTimeout(() => setShowPrompt(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-48 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-4 shadow-xl shadow-cyan-500/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-lg">📲</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">Instalar SynthWave</p>
          <p className="text-[10px] text-slate-400">Úsala como app nativa en tu teléfono</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowPrompt(false)}
            className="px-3 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white"
          >
            No
          </button>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-cyan-600 text-white active:bg-cyan-700"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
