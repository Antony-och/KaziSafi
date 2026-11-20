import React, {useMemo, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Clock,
  KeyRound,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {
  SERVICE_CATALOG_TIERS,
  SERVICE_SCOPE_CONFIG,
} from '../data/kazisafiData';
import {ServiceId} from '../types/kazisafi';

export const ServicesCatalogPage: React.FC = () => {
  const {language, t, services, activeLocationGroups, openBooking, navigate} = useApp();
  const [activeCategory, setActiveCategory] = useState<'ALL' | ServiceId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const markImageFailed = (key: string) => {
    setFailedImages((prev) => ({...prev, [key]: true}));
  };

  const visibleServices = useMemo(() => {
    return activeCategory === 'ALL'
      ? services
      : services.filter((s) => s.id === activeCategory);
  }, [services, activeCategory]);

  const filteredTiersByService = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const map: Record<string, typeof SERVICE_CATALOG_TIERS> = {};
    for (const srv of visibleServices) {
      const tiers = SERVICE_CATALOG_TIERS.filter((tier) => {
        if (tier.serviceId !== srv.id) return false;
        if (!q) return true;
        return (
          tier.nameEn.toLowerCase().includes(q) ||
          tier.nameSw.toLowerCase().includes(q) ||
          tier.descriptionEn.toLowerCase().includes(q)
        );
      });
      if (tiers.length > 0) {
        map[srv.id] = tiers;
      }
    }
    return map;
  }, [visibleServices, searchQuery]);

  const handleCardSelect = (serviceId: ServiceId) => {
    setActiveCategory((prev) => (prev === serviceId ? 'ALL' : serviceId));
    setTimeout(() => {
      const el = document.getElementById('catalog-matrix');
      if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 50);
  };

  return (
    <main className="bg-white min-h-[calc(100vh-4rem)] pb-20">
      {/* Page Header */}
      <section className="pt-8 pb-10 border-b border-slate-200 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F766E] mb-5 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToHome')}</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1
                className="font-display font-bold tracking-tight text-slate-900"
                style={{fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)', textWrap: 'balance'}}
              >
                {t('ourServicesTitle')} &amp; KES Price Directory
              </h1>
              <div className="mt-2 w-14 h-1 rounded-full bg-[#0F766E]" />
              <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl">
                Transparent Kenyan Shilling (KES) rates across all 8 vetted home care categories. Select any card to filter its itemized price list, or book any rate directly.
              </p>
            </div>

            <div className="w-full lg:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search e.g. Mama Fua, AC, TV mounting..."
                className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>
          </div>

          {/* Reused 4x2 Photo-Overlay Card Design as Interactive Category Filter Grid */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {services.map((service) => {
              const category = language === 'sw' ? service.categorySw : service.categoryEn;
              const title = language === 'sw' ? service.titleSw : service.titleEn;
              const subtitle = language === 'sw' ? service.subtitleSw : service.subtitleEn;
              const isSelected = activeCategory === service.id;

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleCardSelect(service.id)}
                  className={`group relative aspect-[4/3] sm:aspect-[4/3.8] w-full rounded-2xl overflow-hidden border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-[#0F766E] ring-2 ring-[#0F766E] ring-offset-2 bg-slate-900'
                      : 'border-slate-200 bg-slate-900'
                  }`}
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />

                  <div className="relative h-full p-3.5 sm:p-5 flex flex-col justify-end">
                    <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-teal-300">
                      {category}
                    </span>
                    <h2 className="mt-0.5 font-display text-base sm:text-lg font-bold text-white leading-tight">
                      {title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-200 line-clamp-2 hidden sm:block">
                      {subtitle}
                    </p>
                    <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-white tabular-nums">
                      <span>
                        {t('fromKes')} {service.basePriceKes.toLocaleString()}
                      </span>
                      <span className="text-teal-300 text-[11px]">
                        {isSelected ? 'Filtered' : 'View Prices'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Service Catalog & Pricing Matrix */}
      <section id="catalog-matrix" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Interactive Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 8 Categories
            </button>
            {services.map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => setActiveCategory(srv.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeCategory === srv.id
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'sw' ? srv.titleSw : srv.titleEn}
              </button>
            ))}
          </div>

          {Object.keys(filteredTiersByService).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">
                No services matched “{searchQuery}”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-[#0F766E] text-xs font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {visibleServices.map((srv) => {
                const tiers = filteredTiersByService[srv.id];
                if (!tiers?.length) return null;
                const scopeCfg = SERVICE_SCOPE_CONFIG[srv.id];
                const catLabel = language === 'sw' ? srv.categorySw : srv.categoryEn;
                const srvTitle = language === 'sw' ? srv.titleSw : srv.titleEn;

                return (
                  <div key={srv.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                          {catLabel}
                        </span>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                          {srvTitle}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBooking(srv.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline self-start sm:self-auto"
                      >
                        <span>Configure Custom {srvTitle} Booking</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tiers.map((tier) => {
                        const matchableOption = scopeCfg.primaryOptions.find(
                          (o) =>
                            o.label.toLowerCase().slice(0, 12) ===
                            tier.nameEn.toLowerCase().slice(0, 12)
                        )?.label;

                        return (
                          <div
                            key={tier.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-[#0F766E]/50 transition-colors"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                                  {language === 'sw' ? tier.nameSw : tier.nameEn}
                                </h3>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                                {tier.descriptionEn}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-display text-lg font-bold text-[#0F766E] tabular-nums">
                                  {tier.priceLabel}
                                </p>
                                <p className="text-[11px] text-slate-500">{tier.unitLabel}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => openBooking(srv.id, undefined, matchableOption)}
                                className="px-3.5 py-2 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                              >
                                Book Rate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Optional Task Add-ons note for the category */}
                    {scopeCfg.addons.length > 0 && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="font-semibold text-slate-800">Optional Add-Ons:</span>
                        {scopeCfg.addons.map((addon, idx) => (
                          <span key={addon.id} className="tabular-nums">
                            {language === 'sw' ? addon.labelSw : addon.labelEn}{' '}
                            <strong className="text-[#0F766E]">
                              (+KES {addon.priceKes.toLocaleString()})
                            </strong>
                            {idx < scopeCfg.addons.length - 1 && (
                              <span className="ml-3 text-slate-300" aria-hidden="true">
                                ·
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* High-Trust Features & Marketplace Policies */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KeyCollect */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center border border-teal-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                KeyCollect (Attended Key Handover)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Away at work? Assign your caretaker, security guard, or neighbor. Only admin-elected top-rated Pros qualify. They receive a WhatsApp/SMS verification link and leave their <strong>original National ID</strong> at the gate while holding your key.
              </p>
              <p className="text-xs font-semibold text-[#0F766E] tabular-nums">
                Add-on fee: 40% of booking amount (minimum KES 500) paid upfront.
              </p>
            </div>

            {/* Payment, Escrow & Commission */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center border border-teal-100">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Payment, Deposit &amp; Cancellation Rules
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>
                  <strong>Flexible Checkout:</strong> Pay <strong>50% deposit</strong> (balance on completion) or <strong>100% into M-Pesa Escrow</strong> via STK Push, Card, or Bank Transfer.
                </li>
                <li>
                  <strong>24+ hrs before service:</strong> 100% full refund.
                </li>
                <li>
                  <strong>12–24 hrs before service:</strong> 50% refund · <strong>&lt;12 hrs:</strong> No refund.
                </li>
                <li>
                  <strong>Pro No-Show:</strong> 100% refund or free priority rescheduling.
                </li>
              </ul>
            </div>

            {/* Active Launch Locations & Vetting */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center border border-teal-100">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Active Kenyan Launch Locations
              </h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                {activeLocationGroups.map((group) => (
                  <p key={group.id}>
                    <strong className="text-slate-800">{group.city}:</strong>{' '}
                    {group.estates.slice(0, 6).join(', ')}
                    {group.estates.length > 6 ? ` (+${group.estates.length - 6} more)` : ''}
                  </p>
                ))}
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#0F766E]">
                <BadgeCheck className="w-4 h-4" />
                <span>National ID + DCI Good Conduct + Guarantors</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
