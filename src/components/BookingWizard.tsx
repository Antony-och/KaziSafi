import React, {useMemo, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  KeyRound,
  Lock,
  MapPin,
  Plus,
  Radar,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  Upload,
} from 'lucide-react';
import {calculateScopePricing, useApp} from '../context/AppContext';
import {KENYAN_LOCATIONS_BY_CITY, SERVICE_SCOPE_CONFIG} from '../data/kazisafiData';
import {
  Booking,
  CartItem,
  PaymentMethod,
  PaymentPlan,
  ServiceId,
} from '../types/kazisafi';

const TIME_SLOTS = [
  '08:00 AM – 10:00 AM',
  '10:30 AM – 12:30 PM',
  '02:00 PM – 04:00 PM',
  '04:30 PM – 06:30 PM',
];

const SHORT_TAB_LABELS: Record<ServiceId, {en: string; sw: string}> = {
  cleaning: {en: 'Cleaning', sw: 'Usafi'},
  'meal-prep': {en: 'Meal Prep', sw: 'Mapishi'},
  repairs: {en: 'Repairs', sw: 'Matengenezo'},
  electricians: {en: 'Electricians', sw: 'Umeme'},
  plumbers: {en: 'Plumbers', sw: 'Bomba'},
  handyman: {en: 'Handyman', sw: 'Fundi'},
  nannies: {en: 'Nannies', sw: 'Malezi'},
  'ground-work': {en: 'Ground Work', sw: 'Bustani'},
};

export const BookingWizard: React.FC = () => {
  const {
    language,
    services,
    pros,
    savedAddresses,
    currentUser,
    bookingDraft,
    setBookingDraft,
    setPendingCheckoutReturn,
    navigate,
    addCurrentScopeToCart,
    removeCartItem,
    buildCartItemFromCurrentScope,
    createMultiServiceOrder,
  } = useApp();

  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState(currentUser?.phone || '0712 345 678');
  const [checkoutStage, setCheckoutStage] = useState<'input' | 'push-sent' | 'confirmed'>('input');
  const [confirmedOrder, setConfirmedOrder] = useState<{
    parentOrderId: string;
    bookings: Booking[];
    mpesaRef: string;
    totalPaidKes: number;
    balanceDueKes: number;
  } | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  const selectedService =
    services.find((s) => s.id === bookingDraft.serviceId) ?? services[0];
  const scopeConfig = SERVICE_SCOPE_CONFIG[selectedService.id];

  // Current live configuration pricing (for draft preview before adding to cart)
  const currentScopeCalc = useMemo(
    () =>
      calculateScopePricing(
        bookingDraft.serviceId,
        bookingDraft.scope,
        services,
        language
      ),
    [bookingDraft.serviceId, bookingDraft.scope, services, language]
  );

  // Effective items for pricing & checkout: cartItems if non-empty, otherwise single live draft preview
  const effectiveItems: CartItem[] = useMemo(() => {
    if (bookingDraft.cartItems.length > 0) {
      return bookingDraft.cartItems;
    }
    return [
      {
        id: 'draft-preview',
        serviceId: bookingDraft.serviceId,
        serviceTitle: currentScopeCalc.serviceTitle,
        primaryOption: bookingDraft.scope.primaryOption,
        secondaryOption: bookingDraft.scope.secondaryOption,
        notes: bookingDraft.scope.notes,
        photoName: bookingDraft.scope.photoName,
        addonIds: bookingDraft.scope.addonIds,
        addonLabels: currentScopeCalc.addonLabels,
        primaryPriceKes: currentScopeCalc.primaryPriceKes,
        secondarySurchargeKes: currentScopeCalc.secondarySurchargeKes,
        addonsTotalKes: currentScopeCalc.addonsTotalKes,
        subtotalKes: currentScopeCalc.subtotalKes,
      },
    ];
  }, [bookingDraft.cartItems, bookingDraft.serviceId, bookingDraft.scope, currentScopeCalc]);

  // Distinct service categories in the cart (preserving cart order)
  const distinctServiceCategories = useMemo(() => {
    const seen = new Set<ServiceId>();
    const list: {serviceId: ServiceId; serviceTitle: string}[] = [];
    for (const item of effectiveItems) {
      if (!seen.has(item.serviceId)) {
        seen.add(item.serviceId);
        list.push({serviceId: item.serviceId, serviceTitle: item.serviceTitle});
      }
    }
    return list;
  }, [effectiveItems]);

  // Combined cart totals including KeyCollect (40% of combined subtotal, min KES 500) & 50%/100% deposit plan
  const pricing = useMemo(() => {
    const servicesSubtotal = effectiveItems.reduce((sum, item) => sum + item.subtotalKes, 0);
    const keyCollectFee = bookingDraft.scope.keyCollect
      ? Math.max(500, Math.round(servicesSubtotal * 0.4))
      : 0;
    const total = servicesSubtotal + keyCollectFee;
    const dueNow =
      bookingDraft.paymentPlan === 'deposit-50'
        ? Math.round(servicesSubtotal * 0.5) + keyCollectFee
        : total;
    const balanceDue = Math.max(0, total - dueNow);

    return {
      servicesSubtotal,
      keyCollectFee,
      total,
      dueNow,
      balanceDue,
    };
  }, [effectiveItems, bookingDraft.scope.keyCollect, bookingDraft.paymentPlan]);

  // Count active verified pros near the selected estate across matching categories
  const activeNearbyProsCount = useMemo(() => {
    const matching = pros.filter(
      (p) =>
        p.verificationStatus === 'verified' &&
        p.isOnline &&
        (!bookingDraft.scope.keyCollect || p.keyCollectEligible) &&
        (p.estates.includes(bookingDraft.estate) ||
          distinctServiceCategories.some((c) => c.serviceId === p.primaryService))
    );
    return Math.max(4, matching.length);
  }, [pros, bookingDraft.estate, bookingDraft.scope.keyCollect, distinctServiceCategories]);

  const handleServiceChange = (newId: ServiceId) => {
    const nextCfg = SERVICE_SCOPE_CONFIG[newId];
    setAddedFeedback(null);
    setBookingDraft((prev) => ({
      ...prev,
      serviceId: newId,
      scope: {
        ...prev.scope,
        primaryOption: nextCfg.primaryOptions[0]?.label ?? '',
        secondaryOption: nextCfg.secondaryOptions?.[0]?.label ?? '',
        notes: '',
        photoName: '',
        addonIds: [],
        addonLabels: [],
      },
    }));
  };

  const toggleAddon = (addonId: string) => {
    setBookingDraft((prev) => {
      const exists = prev.scope.addonIds.includes(addonId);
      return {
        ...prev,
        scope: {
          ...prev.scope,
          addonIds: exists
            ? prev.scope.addonIds.filter((id) => id !== addonId)
            : [...prev.scope.addonIds, addonId],
        },
      };
    });
  };

  const handleAddToCart = () => {
    const added = addCurrentScopeToCart();
    setAddedFeedback(`${added.serviceTitle} added to your booking cart.`);
    setTimeout(() => setAddedFeedback(null), 3000);
  };

  const isCurrentScopeAlreadyInCart = () => {
    const sortedCurrentAddons = [...bookingDraft.scope.addonIds].sort().join(',');
    return bookingDraft.cartItems.some((item) => {
      const sortedItemAddons = [...item.addonIds].sort().join(',');
      return (
        item.serviceId === bookingDraft.serviceId &&
        item.primaryOption === bookingDraft.scope.primaryOption &&
        (item.secondaryOption || '') === (bookingDraft.scope.secondaryOption || '') &&
        sortedItemAddons === sortedCurrentAddons &&
        (item.notes || '') === (bookingDraft.scope.notes || '')
      );
    });
  };

  const handleContinueFromStep1 = () => {
    if (bookingDraft.cartItems.length === 0) {
      const newItem = buildCartItemFromCurrentScope();
      setBookingDraft((prev) => ({
        ...prev,
        cartItems: [newItem],
        step: 2,
      }));
      return;
    }

    // If the user switched tabs or configured another service without clicking "+ Add Service to Cart", include it automatically
    const hasCategoryInCart = bookingDraft.cartItems.some(
      (item) => item.serviceId === bookingDraft.serviceId
    );
    if (!hasCategoryInCart && !isCurrentScopeAlreadyInCart()) {
      const newItem = buildCartItemFromCurrentScope();
      setBookingDraft((prev) => ({
        ...prev,
        cartItems: [...prev.cartItems, newItem],
        step: 2,
      }));
      return;
    }

    setBookingDraft((prev) => ({...prev, step: 2}));
  };

  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep > 1 && bookingDraft.cartItems.length === 0) {
      const newItem = buildCartItemFromCurrentScope();
      setBookingDraft((prev) => ({
        ...prev,
        cartItems: [newItem],
        step: targetStep,
      }));
      return;
    }
    setBookingDraft((prev) => ({...prev, step: targetStep}));
  };

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setPendingCheckoutReturn(true);
      setShowAuthPromptModal(true);
      return;
    }
    if (bookingDraft.paymentMethod === 'mpesa') {
      const digits = mpesaPhone.replace(/\D/g, '');
      if (digits.length < 9) {
        setCheckoutError('Enter a valid Kenyan Safaricom/Airtel number (e.g. +254 712 345 678).');
        return;
      }
      setCheckoutError('');
      setCheckoutStage('push-sent');
      setShowCheckoutModal(true);
    } else {
      setCheckoutError('');
      handleConfirmPayment();
      setShowCheckoutModal(true);
    }
  };

  const handleInitiateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingDraft.paymentMethod === 'mpesa') {
      const digits = mpesaPhone.replace(/\D/g, '');
      if (digits.length < 9) {
        setCheckoutError('Enter a valid Kenyan Safaricom/Airtel number (e.g. +254 712 345 678).');
        return;
      }
      setCheckoutError('');
      setCheckoutStage('push-sent');
    } else {
      handleConfirmPayment();
    }
  };

  const handleConfirmPayment = () => {
    const prefix =
      bookingDraft.paymentMethod === 'mpesa'
        ? 'UA'
        : bookingDraft.paymentMethod === 'card'
        ? 'CD'
        : 'BK';
    const ref = `${prefix}${Math.floor(10 + Math.random() * 89)}KZS${Math.floor(100 + Math.random() * 899)}`;

    const itemsToOrder =
      bookingDraft.cartItems.length > 0
        ? bookingDraft.cartItems
        : [buildCartItemFromCurrentScope()];

    const result = createMultiServiceOrder({
      items: itemsToOrder,
      mpesaPhone,
      mpesaRef: ref,
      keyCollectFeeKes: pricing.keyCollectFee,
      paymentPlan: bookingDraft.paymentPlan,
      paymentMethod: bookingDraft.paymentMethod,
    });

    const totalPaidKes = result.bookings.reduce((s, b) => s + b.paidAmountKes, 0);
    const balanceDueKes = result.bookings.reduce((s, b) => s + b.balanceDueKes, 0);

    setConfirmedOrder({
      parentOrderId: result.parentOrderId,
      bookings: result.bookings,
      mpesaRef: ref,
      totalPaidKes,
      balanceDueKes,
    });
    setCheckoutStage('confirmed');
  };

  const cartItemCount = bookingDraft.cartItems.length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F766E] min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Full Price Guide</span>
          </button>

          <div className="text-xs font-medium text-slate-500 tabular-nums">
            Step {bookingDraft.step} of 3
          </div>
        </div>

        {/* Stepper Bar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              {step: 1 as const, label: '1. Service Scope'},
              {step: 2 as const, label: '2. Schedule & Location'},
              {step: 3 as const, label: '3. Review & M-Pesa payment'},
            ].map((item) => {
              const active = bookingDraft.step === item.step;
              const done = bookingDraft.step > item.step;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => handleStepClick(item.step)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-center ${
                    active
                      ? 'bg-[#0F766E] text-white'
                      : done
                      ? 'bg-teal-50 text-[#0F766E]'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Wizard Form */}
          <div className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
            {bookingDraft.step === 1 && (
              <div className="space-y-6">
                <div className="pb-5 border-b border-slate-100 space-y-4">
                  <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                      Build Your Service Order
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                      Choose a category, pick its package &amp; add-ons, then add it to your cart or switch tabs to bundle multiple services.
                    </p>
                  </div>

                  {/* 8 Service Category Tabs */}
                  <div
                    role="tablist"
                    aria-label="Service categories"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    {services.map((s) => {
                      const isActive = s.id === selectedService.id;
                      const inCartCount = bookingDraft.cartItems.filter(
                        (ci) => ci.serviceId === s.id
                      ).length;
                      const label =
                        SHORT_TAB_LABELS[s.id]?.[language] ??
                        (language === 'sw' ? s.titleSw : s.titleEn);

                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => handleServiceChange(s.id)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between gap-1.5 ${
                            isActive
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#0F766E]/50 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {inCartCount > 0 && (
                            <span
                              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md text-[10px] font-bold tabular-nums shrink-0 ${
                                isActive
                                  ? 'bg-white text-[#0F766E]'
                                  : 'bg-[#0F766E] text-white'
                              }`}
                            >
                              {inCartCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {language === 'sw' ? scopeConfig.primaryLabelSw : scopeConfig.primaryLabelEn}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {scopeConfig.primaryOptions.map((opt) => {
                      const selected = bookingDraft.scope.primaryOption === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({
                              ...prev,
                              scope: {...prev.scope, primaryOption: opt.label},
                            }))
                          }
                          className={`p-3.5 rounded-xl border text-left transition-colors min-h-[54px] flex items-center justify-between gap-2 ${
                            selected
                              ? 'border-[#0F766E] bg-teal-50/70 text-slate-900'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-medium leading-snug">
                            {opt.label}
                          </span>
                          <span className="text-xs font-bold text-[#0F766E] tabular-nums shrink-0">
                            KES {opt.priceKes.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Option (if applicable) */}
                {scopeConfig.secondaryOptions && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      {language === 'sw'
                        ? scopeConfig.secondaryLabelSw
                        : scopeConfig.secondaryLabelEn}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {scopeConfig.secondaryOptions.map((opt) => {
                        const selected = bookingDraft.scope.secondaryOption === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() =>
                              setBookingDraft((prev) => ({
                                ...prev,
                                scope: {...prev.scope, secondaryOption: opt.label},
                              }))
                            }
                            className={`p-3.5 rounded-xl border text-left transition-colors min-h-[52px] flex items-center justify-between gap-2 ${
                              selected
                                ? 'border-[#0F766E] bg-teal-50/70 text-slate-900'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <span className="text-xs sm:text-sm font-medium">{opt.label}</span>
                            <span className="text-xs font-semibold text-[#0F766E] tabular-nums shrink-0">
                              {opt.surchargeKes === 0
                                ? 'None'
                                : `+KES ${opt.surchargeKes.toLocaleString()}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Technical Issue Description & Photo Upload */}
                {scopeConfig.requiresIssueInput && (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div>
                      <label htmlFor="issue-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Describe the Issue or Installation Details
                      </label>
                      <textarea
                        id="issue-notes"
                        rows={3}
                        value={bookingDraft.scope.notes || ''}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({
                            ...prev,
                            scope: {...prev.scope, notes: e.target.value},
                          }))
                        }
                        placeholder="e.g. Kitchen sink pipe leaking under the P-trap, or mounting 55-inch Samsung TV on concrete wall..."
                        className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>

                    <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 p-4 flex items-center gap-3 transition-colors">
                      <Upload className="w-5 h-5 text-[#0F766E] shrink-0" />
                      <div>
                        <span className="block text-xs font-semibold text-slate-800">
                          Attach Photo of Issue (Optional)
                        </span>
                        <span className="block text-xs text-slate-500">
                          {bookingDraft.scope.photoName || 'Helps the fundi bring the exact spare parts or tools'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]?.name || 'issue_photo.jpg';
                          setBookingDraft((prev) => ({
                            ...prev,
                            scope: {...prev.scope, photoName: file},
                          }));
                        }}
                      />
                    </label>
                  </div>
                )}

                {/* Optional Add-ons */}
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Optional Task Add-ons
                  </span>
                  <div className="space-y-2">
                    {scopeConfig.addons.map((addon) => {
                      const checked = bookingDraft.scope.addonIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`w-full p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors min-h-[48px] ${
                            checked
                              ? 'border-[#0F766E] bg-teal-50/50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                checked
                                  ? 'bg-[#0F766E] border-[#0F766E] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span className="text-sm font-medium text-slate-800 text-left">
                              {language === 'sw' ? addon.labelSw : addon.labelEn}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#0F766E] tabular-nums shrink-0">
                            +KES {addon.priceKes.toLocaleString()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {addedFeedback && (
                  <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-xs font-semibold text-[#0F766E] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {addedFeedback}
                    </span>
                    <span className="tabular-nums">
                      Cart Total: KES {pricing.servicesSubtotal.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0F766E] bg-white px-5 py-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 transition-colors min-h-[48px] whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      Add Service to Cart (KES {currentScopeCalc.subtotalKes.toLocaleString()})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleContinueFromStep1}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors min-h-[48px] whitespace-nowrap"
                  >
                    <span>
                      Continue{cartItemCount > 0 ? ` (${cartItemCount} in Cart)` : ''}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {bookingDraft.step === 2 && (
              <div className="space-y-6">
                <div className="pb-5 border-b border-slate-100">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Schedule, Location &amp; KeyCollect
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    {effectiveItems.length > 1
                      ? `Applies across all ${effectiveItems.length} services in your order. Add arrival timing notes below if Pros should arrive in sequence.`
                      : 'Pick your arrival slot, Kenyan estate, and optional KeyCollect attended handover.'}
                  </p>
                </div>

                {currentUser && savedAddresses.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 mb-2">
                      Quick-fill Saved Address
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({
                              ...prev,
                              estate: addr.estate,
                              apartmentNumber: addr.apartmentNumber,
                              gateInstructions: addr.gateInstructions,
                            }))
                          }
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0F766E] text-xs font-semibold text-slate-700 transition-colors"
                        >
                          {addr.label} · {addr.estate}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="book-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Service Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="book-date"
                        type="date"
                        value={bookingDraft.date}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({...prev, date: e.target.value}))
                        }
                        className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="book-estate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Estate / Neighborhood
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="book-estate"
                        value={bookingDraft.estate}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({...prev, estate: e.target.value}))
                        }
                        className="w-full min-h-[46px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      >
                        {KENYAN_LOCATIONS_BY_CITY.map((group) => (
                          <optgroup key={group.city} label={group.city}>
                            {group.estates.map((est) => (
                              <option key={est} value={est}>
                                {est}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Preferred Arrival Window
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const active = bookingDraft.timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setBookingDraft((prev) => ({...prev, timeSlot: slot}))}
                          className={`p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-2 min-h-[46px] transition-colors ${
                            active
                              ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] font-semibold'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="tabular-nums">{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="book-apt" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Apartment / Court / House Number
                  </label>
                  <input
                    id="book-apt"
                    type="text"
                    value={bookingDraft.apartmentNumber}
                    onChange={(e) =>
                      setBookingDraft((prev) => ({...prev, apartmentNumber: e.target.value}))
                    }
                    placeholder="e.g. Cedar Heights, Block B, Apt 4B"
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <label htmlFor="book-gate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Gate &amp; Caretaker Instructions
                  </label>
                  <textarea
                    id="book-gate"
                    rows={2}
                    value={bookingDraft.gateInstructions}
                    onChange={(e) =>
                      setBookingDraft((prev) => ({...prev, gateInstructions: e.target.value}))
                    }
                    placeholder="e.g. Sign in with Caretaker Musa at the main steel gate or call intercom 402."
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                {/* Optional Staggered Arrival Note for Multi-Service Orders */}
                <div>
                  <label htmlFor="staggered-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staggered Arrival &amp; Coordination Notes (Optional)
                  </label>
                  <input
                    id="staggered-notes"
                    type="text"
                    value={bookingDraft.staggeredArrivalNotes}
                    onChange={(e) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        staggeredArrivalNotes: e.target.value,
                      }))
                    }
                    placeholder="e.g. Plumber can arrive at 8:00 AM, Mama Fua at 10:30 AM after sink repair"
                    className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                {/* High-Trust Add-on: KeyCollect (Attended Key Handover) */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                        <KeyRound className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-slate-900">
                          Add KeyCollect (Attended Key Handover)
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Not home? Name your caretaker or guard. Top-rated Pros receive a WhatsApp/SMS verification link and leave their <strong>original National ID</strong> at the gate while holding your key.
                        </p>
                        <p className="text-xs font-semibold text-[#0F766E] mt-1 tabular-nums">
                          +KES {Math.max(500, Math.round(pricing.servicesSubtotal * 0.4)).toLocaleString()} (40% of order subtotal, min KES 500 upfront)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={bookingDraft.scope.keyCollect}
                      onClick={() =>
                        setBookingDraft((prev) => ({
                          ...prev,
                          scope: {...prev.scope, keyCollect: !prev.scope.keyCollect},
                        }))
                      }
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 min-h-[40px] ${
                        bookingDraft.scope.keyCollect
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {bookingDraft.scope.keyCollect ? 'Added' : 'Add KeyCollect'}
                    </button>
                  </div>

                  {bookingDraft.scope.keyCollect && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                      <input
                        type="text"
                        placeholder="On-site Contact Name (e.g. Caretaker Musa)"
                        value={bookingDraft.scope.keyContactName || ''}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({
                            ...prev,
                            scope: {...prev.scope, keyContactName: e.target.value},
                          }))
                        }
                        className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Contact WhatsApp/SMS (+254 7XX...)"
                        value={bookingDraft.scope.keyContactPhone || ''}
                        onChange={(e) =>
                          setBookingDraft((prev) => ({
                            ...prev,
                            scope: {...prev.scope, keyContactPhone: e.target.value},
                          }))
                        }
                        className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 bg-white text-xs tabular-nums"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingDraft((prev) => ({...prev, step: 1}))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingDraft((prev) => ({...prev, step: 3}))}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors min-h-[48px]"
                  >
                    <span>Review &amp; M-Pesa Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {bookingDraft.step === 3 && (
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div className="pb-5 border-b border-slate-100">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                    Review &amp; M-Pesa Payment
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Confirm your bundled order and complete M-Pesa Escrow payment to trigger instant nearest-Pro dispatch.
                  </p>
                </div>

                {/* Smart Auto-Dispatch Card (Automatic Nearest-Pro Matching) */}
                <div className="rounded-2xl border-2 border-[#0F766E]/35 bg-teal-50/60 p-5 space-y-3">
                  <div className="flex items-start gap-3.5">
                    <span className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                      <Radar className="w-5 h-5" />
                    </span>
                    <div className="space-y-1.5">
                      <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                        Automatic Nearest-Pro Matching
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        Once payment is confirmed, your request is instantly broadcast to the closest available, ID &amp; DCI-verified pros in{' '}
                        <strong className="text-slate-900">{bookingDraft.estate}</strong> for fast acceptance.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-teal-200/70">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-teal-200 px-3 py-1.5 text-xs font-semibold text-[#0F766E] tabular-nums">
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" aria-hidden="true" />
                      {activeNearbyProsCount} verified pros currently active near {bookingDraft.estate}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                      <BadgeCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>National ID &amp; DCI Good Conduct Verified</span>
                    </span>
                  </div>
                </div>

                {/* Itemized Order Review */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Order Items ({effectiveItems.length})
                    </span>
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                      {bookingDraft.date} · {bookingDraft.timeSlot} · {bookingDraft.estate}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {effectiveItems.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{item.serviceTitle}</p>
                          <p className="text-slate-600">
                            {item.primaryOption}
                            {item.secondaryOption ? ` · ${item.secondaryOption}` : ''}
                            {item.addonLabels.length > 0 ? ` · + ${item.addonLabels.join(', ')}` : ''}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 tabular-nums shrink-0">
                          KES {item.subtotalKes.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escrow Deposit Choice (50% Deposit vs 100% M-Pesa Escrow) */}
                <div className="pt-2 space-y-3">
                  <span className="block text-xs font-semibold text-slate-700">
                    Choose Escrow Payment Schedule
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          id: 'escrow-100' as PaymentPlan,
                          title: '100% into M-Pesa Escrow',
                          desc: 'Full order held safely in escrow until you confirm each job complete.',
                        },
                        {
                          id: 'deposit-50' as PaymentPlan,
                          title: '50% Booking Deposit Now',
                          desc: 'Pay 50% (+ KeyCollect if selected) now; settle remaining 50% on completion.',
                        },
                      ] as const
                    ).map((plan) => {
                      const active = bookingDraft.paymentPlan === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({...prev, paymentPlan: plan.id}))
                          }
                          className={`p-3.5 rounded-xl border text-left transition-colors ${
                            active
                              ? 'border-[#0F766E] bg-teal-50/70'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-900">{plan.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{plan.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Method Choice */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-700">
                    Payment Method
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        {id: 'mpesa' as PaymentMethod, label: 'M-Pesa STK', icon: Smartphone},
                        {id: 'card' as PaymentMethod, label: 'Debit / Credit Card', icon: CreditCard},
                        {id: 'bank' as PaymentMethod, label: 'Bank Transfer', icon: Building2},
                      ] as const
                    ).map((m) => {
                      const Icon = m.icon;
                      const active = bookingDraft.paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setBookingDraft((prev) => ({...prev, paymentMethod: m.id}))
                          }
                          className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-colors ${
                            active
                              ? 'border-[#0F766E] bg-teal-50 text-[#0F766E]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* M-Pesa Express Checkout Input */}
                {bookingDraft.paymentMethod === 'mpesa' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                    <label htmlFor="step3-mpesa-phone" className="block text-xs font-semibold text-slate-800">
                      M-Pesa Express Phone Number (+254 7XX XXX XXX)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="step3-mpesa-phone"
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Prompts an interactive M-Pesa STK Push for Paybill <strong>522533</strong> and notifies you immediately when a Pro accepts.
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <p className="text-xs text-rose-600 font-medium">{checkoutError}</p>
                )}

                <div className="pt-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setBookingDraft((prev) => ({...prev, step: 2}))}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors min-h-[48px]"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="tabular-nums">
                      {bookingDraft.paymentMethod === 'mpesa'
                        ? `Pay KES ${pricing.dueNow.toLocaleString()} via M-Pesa`
                        : `Authorize KES ${pricing.dueNow.toLocaleString()}`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Sticky Multi-Item Cart & Escrow Summary */}
          <aside
            id="booking-summary-cart"
            className="lg:col-span-4 lg:sticky lg:top-20 rounded-2xl bg-white border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0F766E]" />
                <h2 className="font-display text-base font-bold text-slate-900 uppercase tracking-wide">
                  Booking Summary
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-[11px] font-bold text-[#0F766E] tabular-nums">
                {cartItemCount > 0
                  ? `${cartItemCount} ${cartItemCount === 1 ? 'Service' : 'Services'} Selected`
                  : 'Draft Preview'}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              {cartItemCount === 0 ? (
                <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F766E]">
                      {currentScopeCalc.serviceTitle}
                    </span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      KES {currentScopeCalc.subtotalKes.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    {bookingDraft.scope.primaryOption}
                    {bookingDraft.scope.secondaryOption
                      ? ` · ${bookingDraft.scope.secondaryOption}`
                      : ''}
                  </p>
                  {currentScopeCalc.addonLabels.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      + {currentScopeCalc.addonLabels.join(', ')}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 pt-1">
                    Click &ldquo;+ Add Service to Cart&rdquo; to bundle more services, or &ldquo;Continue&rdquo; to book this service.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                  {bookingDraft.cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0F766E] block">
                            {item.serviceTitle}
                          </span>
                          <p className="text-xs font-semibold text-slate-900 leading-snug">
                            {item.primaryOption}
                            {item.secondaryOption ? ` · ${item.secondaryOption}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          aria-label={`Remove ${item.serviceTitle}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {item.addonLabels.length > 0 && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Add-ons: {item.addonLabels.join(', ')}
                        </p>
                      )}

                      <div className="pt-1 flex justify-between items-center text-xs tabular-nums">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold text-slate-900">
                          KES {item.subtotalKes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-1 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Estate</span>
                  <span className="font-medium text-slate-800">{bookingDraft.estate}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Schedule</span>
                  <span className="font-medium text-slate-800 text-right tabular-nums">
                    {bookingDraft.date} · {bookingDraft.timeSlot.split('–')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span>
                  Services Subtotal ({effectiveItems.length}{' '}
                  {effectiveItems.length === 1 ? 'item' : 'items'})
                </span>
                <span>KES {pricing.servicesSubtotal.toLocaleString()}</span>
              </div>
              {pricing.keyCollectFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>KeyCollect (40%, min 500)</span>
                  <span>KES {pricing.keyCollectFee.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-semibold text-slate-700">Combined Total</span>
                <span className="font-bold text-slate-900">
                  KES {pricing.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900">
                  {bookingDraft.paymentPlan === 'deposit-50'
                    ? 'Due Now (50% Deposit)'
                    : 'Due Now (100% Escrow)'}
                </span>
                <span className="font-display text-xl font-bold text-[#0F766E]">
                  KES {pricing.dueNow.toLocaleString()}
                </span>
              </div>
              {pricing.balanceDue > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Balance on Completion</span>
                  <span>KES {pricing.balanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-3.5 text-xs text-teal-900 space-y-1.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  One combined M-Pesa escrow checkout. Funds for each service release independently only when you confirm completion.
                </span>
              </div>
              <p className="text-[11px] text-teal-800/90 pl-6">
                Cancellation: 24h+ = 100% refund · 12–24h = 50% refund · &lt;12h = No refund · Pro No-Show = 100% refund.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Auth Gate Modal for Logged-Out Users */}
      {showAuthPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">
              Sign in to Complete Payment
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Your {effectiveItems.length} selected{' '}
              {effectiveItems.length === 1 ? 'service' : 'services'}, KeyCollect setup, and Pro choices are saved. Log in or sign up to protect your order under your Customer account.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAuthPromptModal(false);
                  navigate('/login');
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 min-h-[44px]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthPromptModal(false);
                  navigate('/signup');
                }}
                className="py-2.5 px-4 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 min-h-[44px]"
              >
                Sign Up
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAuthPromptModal(false)}
              className="mt-3 w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Simulated Combined M-Pesa / Card / Bank Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {checkoutStage === 'input' && (
              <form onSubmit={handleInitiateCheckout} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                      {bookingDraft.paymentMethod === 'mpesa'
                        ? 'M-Pesa Express Checkout'
                        : bookingDraft.paymentMethod === 'card'
                        ? 'Card Escrow Checkout'
                        : 'Bank Transfer Escrow'}
                    </span>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {bookingDraft.paymentPlan === 'deposit-50'
                        ? `Pay 50% Deposit (${effectiveItems.length} ${effectiveItems.length === 1 ? 'Service' : 'Services'})`
                        : `Lipa na M-Pesa Escrow (${effectiveItems.length} ${effectiveItems.length === 1 ? 'Service' : 'Services'})`}
                    </h3>
                  </div>
                  <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    KES {pricing.dueNow.toLocaleString()}
                  </span>
                </div>

                {bookingDraft.paymentMethod === 'mpesa' ? (
                  <div>
                    <label htmlFor="mpesa-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      M-Pesa Phone Number
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="mpesa-phone"
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="0712 345 678"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      You will receive a single combined STK push prompt on your handset for Paybill <strong>522533</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      {bookingDraft.paymentMethod === 'card'
                        ? 'Visa / Mastercard Protected Escrow'
                        : 'KCB / Equity Instant Bank Escrow'}
                    </p>
                    <p>
                      Authorizing KES {pricing.dueNow.toLocaleString()} into KaziSafi Escrow account.
                    </p>
                  </div>
                )}

                {checkoutError && (
                  <p className="text-xs text-rose-600 font-medium">{checkoutError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 min-h-[44px]"
                  >
                    {bookingDraft.paymentMethod === 'mpesa' ? 'Send STK Push' : 'Authorize Payment'}
                  </button>
                </div>
              </form>
            )}

            {checkoutStage === 'push-sent' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800">
                  <div className="flex items-center justify-between text-xs text-teal-400 font-semibold mb-3">
                    <span>SIM TOOLKIT · M-PESA</span>
                    <span className="tabular-nums">{mpesaPhone}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-100">
                    Do you want to pay <strong className="text-white">KES {pricing.dueNow.toLocaleString()}</strong> to{' '}
                    <strong className="text-white">KaziSafi Escrow</strong> for{' '}
                    {effectiveItems.length > 1
                      ? `${effectiveItems.length} bundled home services`
                      : selectedService.id.toUpperCase()}
                    ?
                  </p>
                  <div className="mt-4 rounded-xl bg-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>M-PESA PIN</span>
                    <span>• • • •</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center">
                  Tap below to simulate confirming the M-Pesa PIN prompt on your phone.
                </p>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="w-full py-3 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 min-h-[48px]"
                >
                  Confirm M-Pesa PIN &amp; Lock Escrow
                </button>
              </div>
            )}

            {checkoutStage === 'confirmed' && confirmedOrder && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                    Escrow Confirmed
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
                    {confirmedOrder.bookings.length > 1
                      ? `Order ${confirmedOrder.parentOrderId} Dispatched`
                      : `Booking ${confirmedOrder.bookings[0]?.id} Dispatched`}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Broadcast to nearest ID &amp; DCI-verified Pros in{' '}
                    <strong>{confirmedOrder.bookings[0]?.estate}</strong>. You will receive an instant SMS &amp; WhatsApp confirmation as soon as each Pro accepts.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs space-y-2 tabular-nums">
                  {confirmedOrder.bookings.length > 1 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parent Order ID</span>
                      <span className="font-mono font-bold text-slate-900">
                        {confirmedOrder.parentOrderId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Receipt</span>
                    <span className="font-mono font-bold text-[#0F766E]">
                      {confirmedOrder.mpesaRef}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid Into Escrow</span>
                    <span className="font-bold text-slate-900">
                      KES {confirmedOrder.totalPaidKes.toLocaleString()}
                    </span>
                  </div>
                  {confirmedOrder.balanceDueKes > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Balance on Completion</span>
                      <span className="font-bold">
                        KES {confirmedOrder.balanceDueKes.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="font-semibold text-slate-700 block">
                      Dispatched Jobs ({confirmedOrder.bookings.length})
                    </span>
                    {confirmedOrder.bookings.map((b) => (
                      <div key={b.id} className="flex justify-between gap-2 text-[11px]">
                        <span className="text-slate-700 truncate">
                          <strong className="font-mono">{b.id}</strong> · {b.serviceTitle} ·{' '}
                          <span className="text-amber-700 font-semibold">Searching...</span>
                        </span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          KES {b.totalAmountKes.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-3 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 min-h-[48px]"
                >
                  Open My Home Hub Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
