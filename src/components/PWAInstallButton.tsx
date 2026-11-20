import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';
import {useApp} from '../context/AppContext';

export const PWAInstallButton: React.FC<{variant?: 'header' | 'footer'}> = ({variant = 'footer'}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const {t} = useApp();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'header'
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-teal-700/30 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0 min-h-[36px]'
            : 'inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>{t('installApp')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
        >
          <Share className="w-3.5 h-3.5 text-teal-700" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Install KaziSafi on iPhone</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> icon in your Safari bottom bar.<br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#0F766E] py-2.5 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
