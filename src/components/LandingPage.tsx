import React, {useState} from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {
  HERO_IMAGE_URL,
  KENYAN_ESTATES,
  KENYAN_LOCATIONS_BY_CITY,
  TESTIMONIALS,
} from '../data/kazisafiData';
import {ServiceId} from '../types/kazisafi';

export const LandingPage: React.FC = () => {
  const {language, t, services, openBooking, navigate} = useApp();
  const [quickService, setQuickService] = useState<ServiceId>('cleaning');
  const [quickEstate, setQuickEstate] = useState<string>(KENYAN_ESTATES[0]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({...prev, [key]: true}));
  };

  return (
    <main className="bg-white">
      {/* 1. Hero Section */}
      <section className="pt-8 pb-12 md:pt-14 md:pb-16 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Hero Copy */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <h1
                className="font-display font-bold tracking-tight text-slate-900 leading-[1.12]"
                style={{fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', textWrap: 'balance'}}
              >
                {t('heroHeadline')}
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
                {t('heroSubtext')}
              </p>

              {/* Trust Indicators - Clean unboxed metadata row */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>{t('badgeNationalId')}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>{t('badgeDci')}</span>
                </span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>{t('badgeEscrow')}</span>
                </span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-6">
              <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                {!failedImages['hero'] ? (
                  <img
                    src={HERO_IMAGE_URL}
                    alt="Bright spotless modern apartment in Kilimani, Nairobi"
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed('hero')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 flex flex-col items-center justify-center p-6 text-white">
                    <ShieldCheck className="w-12 h-12 text-teal-300 mb-2" />
                    <p className="font-display font-semibold text-lg">KaziSafi Kenya</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Booking Bar (Full-Width Row Below Hero Split) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openBooking(quickService, quickEstate);
            }}
            className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor="quick-service"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                {t('selectService')}
              </label>
              <div className="relative">
                <Wrench className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="quick-service"
                  value={quickService}
                  onChange={(e) => setQuickService(e.target.value as ServiceId)}
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {language === 'sw' ? srv.titleSw : srv.titleEn} — {t('fromKes')}{' '}
                      {srv.basePriceKes.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="quick-estate"
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                {t('selectEstate')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="quick-estate"
                  value={quickEstate}
                  onChange={(e) => setQuickEstate(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  {KENYAN_LOCATIONS_BY_CITY.map((group) => (
                    <optgroup key={group.city} label={group.city}>
                      {group.estates.map((estate) => (
                        <option key={estate} value={estate}>
                          {estate}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                <span>{t('findAPro')}</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Our Services Section (4x2 Visual Card Grid) */}
      <section id="services" className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {t('ourServicesTitle')}
              </h2>
              <div className="mt-2 w-14 h-1 rounded-full bg-[#0F766E]" />
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl">
                {t('ourServicesSubtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 hover:border-[#0F766E]/40 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <span>{t('viewFullPriceList')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {services.map((service) => {
              const category = language === 'sw' ? service.categorySw : service.categoryEn;
              const title = language === 'sw' ? service.titleSw : service.titleEn;
              const subtitle = language === 'sw' ? service.subtitleSw : service.subtitleEn;

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => openBooking(service.id, quickEstate)}
                  className="group relative aspect-[4/3] sm:aspect-[4/4.2] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                >
                  {!failedImages[service.id] ? (
                    <img
                      src={service.imageUrl}
                      alt={title}
                      referrerPolicy="no-referrer"
                      onError={() => markImageFailed(service.id)}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-800 to-slate-900" />
                  )}

                  {/* Measured Contrast Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                  <div className="relative h-full p-3.5 sm:p-5 flex flex-col justify-end">
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-teal-300">
                      {category}
                    </span>
                    <h3 className="mt-0.5 font-display text-base sm:text-xl font-bold text-white leading-tight">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-200 line-clamp-2 hidden sm:block">
                      {subtitle}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-white tabular-nums">
                      <span>
                        {t('fromKes')} {service.basePriceKes.toLocaleString()}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. How KaziSafi Works & Trust Section */}
      <section id="how-it-works" className="py-14 md:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {t('howItWorksTitle')}
              </h2>
              <div className="mt-2 w-14 h-1 rounded-full bg-[#0F766E]" />
              <p className="mt-3 text-sm sm:text-base text-slate-600">{t('howItWorksSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/how-it-works')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:text-teal-800 whitespace-nowrap shrink-0 self-start sm:self-end"
            >
              <span>{language === 'sw' ? 'Soma Mwongozo Kamili' : 'Explore Full Guide & Safety Rules'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">{t('step1Title')}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('step1Desc')}</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">{t('step2Title')}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('step2Desc')}</p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">{t('step3Title')}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('step3Desc')}</p>
            </div>
          </div>

          {/* Kenyan Customer Testimonials (Adjacent to Trust Claims) */}
          <div className="mt-14 pt-12 border-t border-slate-200">
            <div className="mb-8">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {t('testimonialsTitle')}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">{t('testimonialsSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-3" aria-label="5 stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span>{item.location}</span>
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#0F766E] font-medium">{item.service}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
