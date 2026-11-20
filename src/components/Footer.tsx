import React from 'react';
import {BadgeCheck, Lock, Mail, MapPin, Phone, ShieldCheck} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {KENYAN_LOCATIONS_BY_CITY} from '../data/kazisafiData';
import {PWAInstallButton} from './PWAInstallButton';

export const Footer: React.FC = () => {
  const {language, setLanguage, t, services, currentUser, navigate, openBooking, siteSettings} =
    useApp();
  const isSw = language === 'sw';

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand, Trust Summary & Kenyan Support */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="KaziSafi Home"
              className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-lg"
            >
              <img
                src="/assets/aistudio/kazisafi-logo-horizontal-color_dd737d41.png"
                alt={siteSettings.platformName}
                className="h-8 w-auto object-contain"
              />
            </button>

            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              {t('footerTagline')}{' '}
              {isSw
                ? 'Malipo yanalindwa na M-Pesa Escrow kote Kenya.'
                : 'Every booking is protected by M-Pesa Escrow and DCI-vetted professionals.'}
            </p>

            <div className="space-y-2 text-xs text-slate-600 tabular-nums">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>
                  {siteSettings.supportPhone} · {siteSettings.operatingHours}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>{siteSettings.supportEmail}</span>
              </p>
            </div>

            <div className="pt-1">
              <PWAInstallButton variant="footer" />
            </div>
          </div>

          {/* Services Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              {isSw ? 'Huduma Zetu' : 'Home & Care Services'}
            </h3>
            <ul className="space-y-2 text-sm">
              {services.slice(0, 6).map((srv) => (
                <li key={srv.id}>
                  <button
                    type="button"
                    onClick={() => openBooking(srv.id, currentUser?.defaultEstate)}
                    className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                  >
                    {isSw ? srv.titleSw : srv.titleEn}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="font-semibold text-[#0F766E] hover:underline text-left"
                >
                  {isSw ? 'Tazama Huduma Zote (8) →' : 'View All 8 Services & KES Prices →'}
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Navigation & Pro Onboarding */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              {isSw ? 'Jukwaa' : 'Platform'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {t('navHome')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/how-it-works')}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {t('navHowItWorks')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {t('navServices')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openBooking('cleaning', currentUser?.defaultEstate)}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {t('findAPro')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {isSw ? 'Omba Kazi Kama Mtaalamu' : 'Apply as a Vetted Pro'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
                  className="text-slate-600 hover:text-[#0F766E] transition-colors text-left"
                >
                  {currentUser ? t('dashboard') : t('login')}
                </button>
              </li>
            </ul>
          </div>

          {/* Active Kenyan Cities & Trust Badges */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
              {isSw ? 'Maeneo na Usalama' : 'Coverage & Protection'}
            </h3>
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {KENYAN_LOCATIONS_BY_CITY.map((c) => c.city).join(' · ')} —{' '}
                  {isSw
                    ? 'Kilimani, Westlands, Karen, Syokimau, Nyali, Milimani na kwingineko.'
                    : 'Kilimani, Westlands, Karen, Syokimau, Nyali, Milimani & more.'}
                </span>
              </p>
            </div>

            <div className="pt-2 space-y-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>{t('badgeNationalId')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>{t('badgeDci')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>{t('badgeEscrow')} · KeyCollect Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Language Row */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© 2026 KaziSafi Kenya Ltd. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">
              ·
            </span>
            <span>Nairobi, Kenya</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">{isSw ? 'Lugha:' : 'Language:'}</span>
            <div
              role="group"
              aria-label="Footer language switcher"
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 font-semibold"
            >
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-[#0F766E] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sw')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  language === 'sw'
                    ? 'bg-[#0F766E] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
