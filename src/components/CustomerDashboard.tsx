import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  Heart,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Radar,
  Receipt,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Star,
  User,
  X,
} from 'lucide-react';
import {computeHoursUntilService, useApp} from '../context/AppContext';
import {Booking, BookingStatus, Language} from '../types/kazisafi';

const TRACKER_STEPS: {key: BookingStatus; label: string}[] = [
  {key: 'searching', label: 'Searching Pro'},
  {key: 'confirmed', label: 'Confirmed'},
  {key: 'en-route', label: 'Pro En Route'},
  {key: 'in-progress', label: 'In Progress'},
  {key: 'completed', label: 'Completed'},
];

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    language,
    setLanguage,
    bookings,
    pros,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    savedAddresses,
    activeLocationGroups,
    savedProIds,
    openBooking,
    rebookFromHistory,
    releaseEscrowWithReview,
    cancelBookingWithPolicy,
    toggleSavedPro,
    addSavedAddress,
    updateCurrentUserProfile,
  } = useApp();

  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProNoShow, setIsProNoShow] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEstate, setNewEstate] = useState('Kilimani');
  const [newApt, setNewApt] = useState('');
  const [newGate, setNewGate] = useState('');

  // Profile Settings modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileEstate, setProfileEstate] = useState('Kilimani');
  const [profileLang, setProfileLang] = useState<Language>(language);
  const [profileSmsAlerts, setProfileSmsAlerts] = useState(true);
  const [profileWhatsappAlerts, setProfileWhatsappAlerts] = useState(true);
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(
      (b) => b.customerId === currentUser.id || b.customerName === currentUser.name
    );
  }, [bookings, currentUser]);

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.customerId === currentUser.id);
  }, [notifications, currentUser]);

  const myUnreadNotifications = myNotifications.filter((n) => !n.read);

  const activeBookings = myBookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  );
  const pastBookings = myBookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );
  const completedOrdersCount = myBookings.filter((b) => b.status === 'completed').length;

  const totalSpentKes = myBookings
    .filter((b) => b.escrowStatus !== 'refunded')
    .reduce((sum, b) => sum + (b.paidAmountKes - (b.refundAmountKes ?? 0)), 0);

  const savedPros = pros.filter((p) => savedProIds.includes(p.id));

  const handleConfirmReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    releaseEscrowWithReview(reviewBooking.id, rating, reviewText);
    setReviewBooking(null);
    setRating(5);
    setReviewText('');
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingTarget) return;
    cancelBookingWithPolicy(cancelBookingTarget.id, cancelReason, isProNoShow);
    setCancelBookingTarget(null);
    setCancelReason('');
    setIsProNoShow(false);
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newApt.trim()) return;
    addSavedAddress({
      label: newLabel.trim(),
      estate: newEstate,
      apartmentNumber: newApt.trim(),
      gateInstructions: newGate.trim() || 'Call upon arrival at the main gate.',
    });
    setShowAddAddress(false);
    setNewLabel('');
    setNewApt('');
    setNewGate('');
  };

  const cancelPreview = useMemo(() => {
    if (!cancelBookingTarget) return {hours: 48, pct: 100, refundKes: 0};
    if (isProNoShow) {
      return {hours: 0, pct: 100, refundKes: cancelBookingTarget.paidAmountKes};
    }
    const hours = computeHoursUntilService(cancelBookingTarget.date, cancelBookingTarget.timeSlot);
    const pct = hours >= 24 ? 100 : hours >= 12 ? 50 : 0;
    const refundKes = Math.round((cancelBookingTarget.paidAmountKes * pct) / 100);
    return {hours, pct, refundKes};
  }, [cancelBookingTarget, isProNoShow]);

  const openProfileSettings = () => {
    setProfileName(currentUser?.name || '');
    setProfilePhone(currentUser?.phone || '+254 7');
    setProfileEmail(currentUser?.email || '');
    setProfileEstate(currentUser?.defaultEstate || 'Kilimani');
    setProfileLang(language);
    setProfileSmsAlerts(currentUser?.smsAlerts ?? true);
    setProfileWhatsappAlerts(currentUser?.whatsappAlerts ?? true);
    setProfileNewPassword('');
    setProfileError('');
    setShowProfileModal(true);
  };

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    const res = updateCurrentUserProfile({
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      defaultEstate: profileEstate,
      smsAlerts: profileSmsAlerts,
      whatsappAlerts: profileWhatsappAlerts,
      newPassword: profileNewPassword,
    });
    if (!res.ok) {
      setProfileError(res.error || 'Could not update profile.');
      return;
    }
    setLanguage(profileLang);
    setShowProfileModal(false);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  const customerInitials = (currentUser?.name || 'KS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Customer Portal
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              My Home Hub
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track live nearest-Pro dispatch, KeyCollect handovers, M-Pesa escrow releases, and confirmations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openProfileSettings}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors min-h-[46px] whitespace-nowrap"
            >
              <Settings className="w-4 h-4 text-[#0F766E]" />
              <span>Profile Settings</span>
            </button>
            <button
              type="button"
              onClick={() => openBooking('cleaning', currentUser?.defaultEstate)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors min-h-[46px] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Book a Service</span>
            </button>
          </div>
        </div>

        {profileSavedToast && (
          <div
            role="status"
            className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3.5 text-sm font-semibold text-[#0F766E] flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Your profile settings and estate preferences have been updated.</span>
            </span>
            <button
              type="button"
              onClick={() => setProfileSavedToast(false)}
              className="p-1 rounded-lg text-teal-700 hover:bg-teal-100"
              aria-label="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Simulated SMS / WhatsApp Confirmation Banner */}
        {myUnreadNotifications.length > 0 && (
          <div className="rounded-2xl bg-teal-50 border border-teal-200 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                    SMS &amp; WhatsApp Confirmation Sent ({myUnreadNotifications.length} New)
                  </p>
                  <p className="text-xs text-teal-800">
                    Dispatched to {currentUser?.phone || '+254 7XX XXX XXX'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-teal-200 px-3.5 py-2 text-xs font-semibold text-[#0F766E] hover:bg-teal-100/60 transition-colors min-h-[38px] whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dismiss / Mark All Read</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {myUnreadNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-xl bg-white border border-teal-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {notif.proAvatarUrl && (
                      <img
                        src={notif.proAvatarUrl}
                        alt={notif.proName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{notif.message}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                        <span className="font-mono font-bold text-[#0F766E]">{notif.bookingId}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#0F766E]" />
                          {notif.proPhone}
                        </span>
                        {notif.etaMinutes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>ETA ~{notif.etaMinutes} mins</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => markNotificationRead(notif.id)}
                    className="self-start sm:self-center text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                  >
                    Mark Read
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Active Bookings</span>
            <p className="font-display text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              {activeBookings.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Protected by M-Pesa Escrow</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Total Spent</span>
            <p className="font-display text-3xl font-bold text-[#0F766E] mt-1 tabular-nums">
              KES {totalSpentKes.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across {myBookings.length} bookings</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Completed Orders</span>
            <p className="font-display text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              {completedOrdersCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {savedPros.length} saved vetted Pros
            </p>
          </div>
        </div>

        {/* Active Bookings Section */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900">Active Bookings</h2>

          {activeBookings.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-600">
                You have no active home visits scheduled right now.
              </p>
              <button
                type="button"
                onClick={() => openBooking('cleaning', currentUser?.defaultEstate)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Book Your Next Home Care Visit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((booking) => {
                const currentIdx = TRACKER_STEPS.findIndex((s) => s.key === booking.status);
                const isSearching = booking.status === 'searching' || !booking.proId;
                const matchedPro = booking.proId
                  ? pros.find((p) => p.id === booking.proId)
                  : undefined;
                const proAvatar = booking.proAvatarUrl || matchedPro?.avatarUrl;
                const proPhone = booking.proPhone || matchedPro?.phone;
                const proRating = booking.proRating ?? matchedPro?.rating ?? 4.9;
                const proEta = booking.proEtaMinutes ?? 18;

                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">{booking.id}</span>
                          {booking.parentOrderId && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono font-semibold text-[#0F766E]">
                                Order {booking.parentOrderId}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{booking.date}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{booking.timeSlot}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-700">
                            {booking.escrowStatus === 'disputed'
                              ? 'Dispute Under Review'
                              : booking.paymentPlan === 'deposit-50'
                              ? '50% Deposit Held'
                              : '100% Held in Escrow'}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-900 mt-1">
                          {isSearching
                            ? `${booking.serviceTitle} · Searching for nearest Pro...`
                            : `${booking.serviceTitle} with ${booking.proName}`}
                        </h3>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {booking.scope.primaryOption}
                          {booking.scope.secondaryOption ? ` · ${booking.scope.secondaryOption}` : ''}
                          {booking.scope.addonLabels?.length
                            ? ` · + ${booking.scope.addonLabels.join(', ')}`
                            : ''}
                        </p>
                        {booking.scope.keyCollect && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E]">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>
                              KeyCollect Active · Contact: {booking.scope.keyContactName || 'On-site Guard'} (Original ID held at gate)
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                          KES {booking.totalAmountKes.toLocaleString()}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          Ref: {booking.mpesaRef} ({booking.paymentMethod.toUpperCase()})
                        </p>
                        {booking.balanceDueKes > 0 && (
                          <p className="text-xs text-amber-700 font-semibold tabular-nums mt-0.5">
                            Balance on completion: KES {booking.balanceDueKes.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dispatch Status / Assigned Pro Card */}
                    {isSearching ? (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Radar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-900">
                              Searching for nearest verified Pro in {booking.estate}
                            </p>
                            <p className="text-xs text-amber-800 mt-0.5">
                              Your paid order is live to nearby DCI-vetted Pros ({booking.distanceKm ?? 1.2} km radius). You will receive an SMS, WhatsApp, and Bell confirmation immediately upon acceptance.
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 whitespace-nowrap shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting Match
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          {proAvatar && (
                            <img
                              src={proAvatar}
                              alt={booking.proName}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-teal-200 shrink-0"
                            />
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] uppercase tracking-wide">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmed — Pro Assigned
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                                <BadgeCheck className="w-3 h-3" />
                                ID Verified
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-white border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                                <ShieldCheck className="w-3 h-3" />
                                Good Conduct
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 mt-1">
                              {booking.proName}{' '}
                              <span className="text-xs font-semibold text-amber-600 tabular-nums">
                                · {proRating.toFixed(1)} ★
                              </span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-0.5 tabular-nums">
                              {proPhone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-[#0F766E]" />
                                  {proPhone}
                                </span>
                              )}
                              <span>ETA: ~{proEta} mins</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5-Step Status Tracker */}
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {TRACKER_STEPS.map((st, idx) => {
                        const reached = idx <= currentIdx;
                        return (
                          <div key={st.key} className="space-y-1.5">
                            <div
                              className={`h-2 rounded-full ${
                                reached ? 'bg-[#0F766E]' : 'bg-slate-200'
                              }`}
                            />
                            <p
                              className={`text-[10px] sm:text-xs font-semibold leading-tight ${
                                reached ? 'text-[#0F766E]' : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#0F766E]" />
                          {booking.apartmentNumber}, {booking.estate}
                        </p>
                        <p className="text-slate-500">Gate Notes: {booking.gateInstructions}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!isSearching && booking.proId && (
                          <button
                            type="button"
                            onClick={() => toggleSavedPro(booking.proId)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold min-h-[44px] inline-flex items-center gap-1.5 transition-colors ${
                              savedProIds.includes(booking.proId)
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                savedProIds.includes(booking.proId) ? 'fill-current' : ''
                              }`}
                            />
                            <span>Save Pro</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setCancelBookingTarget(booking);
                            setCancelReason('');
                            setIsProNoShow(false);
                          }}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors min-h-[44px]"
                        >
                          Cancel Booking
                        </button>

                        <button
                          type="button"
                          disabled={isSearching}
                          onClick={() => {
                            setReviewBooking(booking);
                            setRating(5);
                            setReviewText('');
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                        >
                          <Lock className="w-4 h-4" />
                          <span>
                            {isSearching
                              ? 'Awaiting Pro Match'
                              : booking.balanceDueKes > 0
                              ? 'Confirm, Pay Balance & Release Escrow'
                              : 'Confirm Completion & Release M-Pesa Escrow'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Booking History + Saved Addresses & Notification Log Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Past Bookings & M-Pesa Receipts */}
          <div className="lg:col-span-8 space-y-6">
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Booking History &amp; Receipts
                </h2>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {pastBookings.length} records
                </span>
              </div>

              {pastBookings.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Completed bookings and M-Pesa receipts will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Booking</th>
                        <th className="py-3 px-4">Pro &amp; Estate</th>
                        <th className="py-3 px-4">Receipt</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pastBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-900">{b.serviceTitle}</p>
                            <p className="text-xs text-slate-500 tabular-nums">
                              {b.id}
                              {b.parentOrderId ? ` (${b.parentOrderId})` : ''} · {b.date} ·{' '}
                              <span className={b.status === 'cancelled' ? 'text-rose-600' : 'text-[#0F766E]'}>
                                {b.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                              </span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-slate-800">
                              {b.proId ? b.proName : 'Cancelled before match'}
                            </p>
                            <p className="text-xs text-slate-500">{b.estate}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                            <span className="inline-flex items-center gap-1">
                              <Receipt className="w-3.5 h-3.5 text-[#0F766E]" />
                              {b.mpesaRef}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                            KES {b.totalAmountKes.toLocaleString()}
                            {b.refundAmountKes !== undefined && (
                              <span className="block text-[11px] text-[#0F766E]">
                                Refunded: KES {b.refundAmountKes.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => rebookFromHistory(b)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 hover:border-teal-200 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Rebook</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Confirmation Notifications Log */}
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#0F766E]" />
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Confirmation Notifications Log
                  </h2>
                </div>
                {myUnreadNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-[#0F766E] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {myNotifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Real-time SMS, WhatsApp, and in-app confirmation alerts appear here when Pros accept your jobs.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 flex items-start justify-between gap-4 ${
                        !notif.read ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-[#0F766E]">
                            {notif.bookingId}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-800">{notif.serviceTitle}</span>
                          {!notif.read && (
                            <span className="rounded-md bg-[#0F766E] px-2 py-0.5 text-[10px] font-semibold text-white">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{notif.message}</p>
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          Pro: {notif.proName} ({notif.proPhone}) · {notif.date} · {notif.timeSlot}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationRead(notif.id)}
                          className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Saved Kenyan Addresses & Favorite Pros */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Saved Kenyan Addresses
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddress((v) => !v)}
                  className="text-xs font-semibold text-[#0F766E] hover:underline"
                >
                  {showAddAddress ? 'Close' : '+ Add New'}
                </button>
              </div>

              {showAddAddress && (
                <form onSubmit={handleSaveNewAddress} className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="Label (e.g. Parents' House)"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <select
                    value={newEstate}
                    onChange={(e) => setNewEstate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    {activeLocationGroups.map((group) => (
                      <optgroup key={group.id} label={group.city}>
                        {group.estates.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Apartment / House No."
                    value={newApt}
                    onChange={(e) => setNewApt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Gate / Caretaker notes"
                    value={newGate}
                    onChange={(e) => setNewGate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-[#0F766E] text-xs font-semibold text-white"
                  >
                    Save Address
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="pb-3 border-b border-slate-100 last:border-b-0 last:pb-0 text-xs"
                  >
                    <p className="font-semibold text-slate-900">
                      {addr.label} · <span className="text-[#0F766E]">{addr.estate}</span>
                    </p>
                    <p className="text-slate-600 mt-0.5">{addr.apartmentNumber}</p>
                    <p className="text-slate-400 mt-0.5">{addr.gateInstructions}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-slate-900">Saved Vetted Pros</h2>
              {savedPros.length === 0 ? (
                <p className="text-xs text-slate-500">Save pros from your bookings for 1-click rebooking.</p>
              ) : (
                <div className="space-y-3">
                  {savedPros.map((pro) => (
                    <div key={pro.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={pro.avatarUrl}
                          alt={pro.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{pro.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-[#0F766E]" />
                            <span className="tabular-nums">{pro.rating.toFixed(1)} ★</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBooking(pro.primaryService, pro.estates[0])}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 text-[#0F766E] text-xs font-semibold hover:bg-teal-100 shrink-0"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 5-Star Rating & M-Pesa Escrow Release Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Confirm &amp; Release Escrow
              </h3>
              <button
                type="button"
                onClick={() => setReviewBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReview} className="mt-4 space-y-4">
              <p className="text-sm text-slate-600">
                Confirm that <strong>{reviewBooking.proName}</strong> completed{' '}
                <strong>{reviewBooking.serviceTitle}</strong> satisfactorily.{' '}
                {reviewBooking.balanceDueKes > 0
                  ? `This settles the remaining KES ${reviewBooking.balanceDueKes.toLocaleString()} balance and releases KES ${reviewBooking.totalAmountKes.toLocaleString()} total.`
                  : `This releases KES ${reviewBooking.totalAmountKes.toLocaleString()} from M-Pesa Escrow.`}
              </p>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Rate Your Service Pro
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-current'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="review-text" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Review Feedback (Optional)
                </label>
                <textarea
                  id="review-text"
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share punctuality, care, and work quality..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  Not Yet
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 min-h-[44px] inline-flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Release Funds</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {cancelBookingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Cancel Booking {cancelBookingTarget.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelBookingTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800">KaziSafi Cancellation Policy:</p>
                <p>• 24+ hours before service: 100% full refund</p>
                <p>• 12–24 hours before service: 50% refund</p>
                <p>• Less than 12 hours: No refund</p>
                <p>• Service Pro No-Show: 100% full refund</p>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProNoShow}
                  onChange={(e) => setIsProNoShow(e.target.checked)}
                  className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span>Report Service Pro No-Show (100% Full Refund)</span>
              </label>

              <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 flex justify-between items-center tabular-nums">
                <span>Eligible Refund ({cancelPreview.pct}%)</span>
                <span className="font-display text-base font-bold text-[#0F766E]">
                  KES {cancelPreview.refundKes.toLocaleString()}
                </span>
              </div>

              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Cancellation
                </label>
                <input
                  id="cancel-reason"
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Optional note..."
                  className="w-full min-h-[42px] px-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setCancelBookingTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Confirm Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Pop-Up Modal */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-profile-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-[#0F766E] text-white font-display text-sm font-bold flex items-center justify-center shrink-0">
                  {customerInitials}
                </span>
                <div className="min-w-0">
                  <h3
                    id="customer-profile-settings-title"
                    className="font-display text-lg font-bold text-slate-900 truncate"
                  >
                    Profile Settings
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Manage your Kenyan contact, default estate &amp; notification preferences
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close profile settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileSettings} className="p-6 space-y-5">
              {profileError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
                >
                  {profileError}
                </div>
              )}

              <div className="space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Personal &amp; M-Pesa Contact
                </p>

                <div>
                  <label
                    htmlFor="prof-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="prof-name"
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="prof-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Kenyan Phone (+254)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="prof-phone"
                        type="tel"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="prof-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="prof-email"
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Home Location &amp; Language
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="prof-estate"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Default Estate / Area
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="prof-estate"
                        value={profileEstate}
                        onChange={(e) => setProfileEstate(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      >
                        {activeLocationGroups.map((group) => (
                          <optgroup key={group.id} label={group.city}>
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

                  <div>
                    <label
                      htmlFor="prof-lang"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Preferred Language
                    </label>
                    <select
                      id="prof-lang"
                      value={profileLang}
                      onChange={(e) => setProfileLang(e.target.value as Language)}
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    >
                      <option value="en">English (EN)</option>
                      <option value="sw">Kiswahili (SW)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Booking &amp; Arrival Notifications
                </p>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileSmsAlerts}
                    onChange={(e) => setProfileSmsAlerts(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      SMS Booking Confirmations
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Receive instant SMS alerts when your nearest vetted Pro accepts or arrives.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileWhatsappAlerts}
                    onChange={(e) => setProfileWhatsappAlerts(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      WhatsApp Receipts &amp; KeyCollect Updates
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Get M-Pesa escrow receipts and KeyCollect custody handovers on WhatsApp.
                    </span>
                  </div>
                </label>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label
                  htmlFor="prof-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Change Password <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="prof-password"
                    type="password"
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800 inline-flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
