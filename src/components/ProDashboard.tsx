import React, {useMemo, useState} from 'react';
import {
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Play,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {ServiceId, WithdrawalRecord} from '../types/kazisafi';

export const ProDashboard: React.FC = () => {
  const {
    currentUser,
    pros,
    bookings,
    services,
    activeLocationGroups,
    activeEstates,
    withdrawals,
    commissionPercent,
    updateProOnlineStatus,
    updateProProfile,
    respondToJobRequest,
    advanceBookingStatus,
    withdrawProFunds,
  } = useApp();

  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPhone, setWithdrawPhone] = useState(currentUser?.phone || '+254 722 890 123');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReceipt, setWithdrawReceipt] = useState<WithdrawalRecord | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  // Worker Profile & Document Settings Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [proName, setProName] = useState('');
  const [proPhone, setProPhone] = useState('');
  const [proEmail, setProEmail] = useState('');
  const [proBio, setProBio] = useState('');
  const [proPrimaryService, setProPrimaryService] = useState<ServiceId>('cleaning');
  const [proEstates, setProEstates] = useState<string[]>([]);
  const [proAvatarUrl, setProAvatarUrl] = useState('');
  const [proIdNumber, setProIdNumber] = useState('');
  const [proIdDocName, setProIdDocName] = useState('');
  const [proIdDocDataUrl, setProIdDocDataUrl] = useState<string | undefined>(undefined);
  const [proGcNumber, setProGcNumber] = useState('');
  const [proGcDocName, setProGcDocName] = useState('');
  const [proGcDocDataUrl, setProGcDocDataUrl] = useState<string | undefined>(undefined);
  const [proTradeCertName, setProTradeCertName] = useState('');
  const [proGuarantorName, setProGuarantorName] = useState('');
  const [proGuarantorPhone, setProGuarantorPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const proProfile = useMemo(() => {
    if (!currentUser) return pros[0];
    return (
      pros.find((p) => p.id === currentUser.proId) ??
      pros.find((p) => p.email.toLowerCase() === currentUser.email.toLowerCase()) ??
      pros[0]
    );
  }, [pros, currentUser]);

  const serviceObj = services.find((s) => s.id === proProfile.primaryService);

  const proBookings = useMemo(() => {
    return bookings.filter((b) => {
      const belongsToMe = b.proId === proProfile.id;
      const zoneOk = zoneFilter === 'ALL' || b.estate === zoneFilter;
      return belongsToMe && zoneOk;
    });
  }, [bookings, proProfile.id, zoneFilter]);

  const incomingRequests = useMemo(() => {
    return bookings.filter((b) => {
      const zoneOk = zoneFilter === 'ALL' || b.estate === zoneFilter;
      if (!zoneOk) return false;

      const isBroadcastMatch =
        b.status === 'searching' &&
        !b.proAccepted &&
        b.serviceId === proProfile.primaryService &&
        proProfile.verificationStatus === 'verified' &&
        proProfile.isOnline &&
        proProfile.estates.includes(b.estate) &&
        !(b.declinedByProIds ?? []).includes(proProfile.id) &&
        (!b.scope.keyCollect || proProfile.keyCollectEligible);

      const isDirectPending =
        b.proId === proProfile.id && b.status === 'confirmed' && !b.proAccepted;

      return isBroadcastMatch || isDirectPending;
    });
  }, [bookings, proProfile, zoneFilter]);

  const activeSchedule = proBookings.filter(
    (b) => b.proAccepted && b.status !== 'completed' && b.status !== 'cancelled'
  );
  const completedJobs = proBookings.filter((b) => b.status === 'completed');

  const pendingEscrowKes = bookings
    .filter((b) => b.proId === proProfile.id && b.escrowStatus === 'held')
    .reduce((sum, b) => sum + b.proPayoutKes, 0);

  const myWithdrawals = withdrawals.filter((w) => w.proId === proProfile.id);

  const handleOpenWithdraw = () => {
    setWithdrawAmount(String(proProfile.availableBalanceKes));
    setWithdrawPhone(proProfile.phone);
    setWithdrawReceipt(null);
    setWithdrawError('');
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > proProfile.availableBalanceKes) {
      setWithdrawError(
        `Enter an amount between KES 1 and KES ${proProfile.availableBalanceKes.toLocaleString()}.`
      );
      return;
    }
    const rec = withdrawProFunds(proProfile.id, amt, withdrawPhone);
    setWithdrawReceipt(rec);
  };

  const openProfileModal = () => {
    setProName(proProfile.name);
    setProPhone(proProfile.phone);
    setProEmail(proProfile.email);
    setProBio(proProfile.bio);
    setProPrimaryService(proProfile.primaryService);
    setProEstates([...proProfile.estates]);
    setProAvatarUrl(proProfile.avatarUrl);
    setProIdNumber(proProfile.nationalIdNumber);
    setProIdDocName(proProfile.nationalIdDocName);
    setProIdDocDataUrl(proProfile.nationalIdDocDataUrl);
    setProGcNumber(proProfile.goodConductCertNumber);
    setProGcDocName(proProfile.goodConductDocName);
    setProGcDocDataUrl(proProfile.goodConductDocDataUrl);
    setProTradeCertName(proProfile.tradeCertName || '');
    setProGuarantorName(proProfile.guarantorName || '');
    setProGuarantorPhone(proProfile.guarantorPhone || '');
    setProfileError('');
    setShowProfileModal(true);
  };

  const readFileAsDataUrl = (
    file: File,
    onSuccess: (name: string, dataUrl?: string) => void
  ) => {
    setProfileError('');
    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Please choose a file smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onSuccess(file.name, typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.onerror = () => {
      onSuccess(file.name, undefined);
    };
    reader.readAsDataURL(file);
  };

  const toggleProEstate = (est: string) => {
    setProEstates((prev) =>
      prev.includes(est) ? prev.filter((item) => item !== est) : [...prev, est]
    );
  };

  const handleSaveProProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    if (proEstates.length === 0) {
      setProfileError('Please select at least one working estate.');
      return;
    }
    const res = updateProProfile(proProfile.id, {
      name: proName,
      phone: proPhone,
      email: proEmail,
      bio: proBio,
      primaryService: proPrimaryService,
      estates: proEstates,
      avatarUrl: proAvatarUrl,
      nationalIdNumber: proIdNumber,
      nationalIdDocName: proIdDocName,
      nationalIdDocDataUrl: proIdDocDataUrl,
      goodConductCertNumber: proGcNumber,
      goodConductDocName: proGcDocName,
      goodConductDocDataUrl: proGcDocDataUrl,
      tradeCertName: proTradeCertName.trim() || undefined,
      guarantorName: proGuarantorName.trim() || undefined,
      guarantorPhone: proGuarantorPhone.trim() || undefined,
    });
    if (!res.ok) {
      setProfileError(res.error || 'Could not update worker profile.');
      return;
    }
    setShowProfileModal(false);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3200);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Controls */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={openProfileModal}
              title="Edit profile photo & verification documents"
              className="relative group shrink-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <img
                src={proProfile.avatarUrl}
                alt={proProfile.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#0F766E] text-white flex items-center justify-center border-2 border-white shadow-xs group-hover:bg-teal-800 transition-colors">
                <Camera className="w-3 h-3" />
              </span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  Worker Portal · {proProfile.name}
                </h1>
                {proProfile.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-md px-2.5 py-0.5">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified Pro
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Verification
                  </span>
                )}
                {proProfile.keyCollectEligible && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md px-2.5 py-0.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#0F766E]" />
                    KeyCollect Eligible
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {serviceObj?.titleEn || proProfile.primaryService}
                </span>
                <span aria-hidden="true">·</span>
                <span>Zones: {proProfile.estates.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Working Zone Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <select
                aria-label="Filter working zone"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="min-h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="ALL">All Working Zones</option>
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

            {/* Profile & Documents Settings */}
            <button
              type="button"
              onClick={openProfileModal}
              className="min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Profile &amp; Docs</span>
            </button>

            {/* Online / Offline Toggle */}
            <button
              type="button"
              onClick={() => updateProOnlineStatus(proProfile.id, !proProfile.isOnline)}
              className={`min-h-[42px] px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-2 ${
                proProfile.isOnline
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{proProfile.isOnline ? 'Online · Accepting Jobs' : 'Offline · Paused'}</span>
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
              <span>Profile picture, work zones, and verification documents saved.</span>
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

        {proProfile.verificationStatus === 'pending' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-sm text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Account Verification In Review</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your National ID ({proProfile.nationalIdNumber}) and DCI Certificate of Good Conduct ({proProfile.goodConductDocName}) are in the Admin Verification Queue. You will begin receiving live bookings once approved.
              </p>
            </div>
          </div>
        )}

        {/* M-Pesa Earnings Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500">Available to Withdraw</span>
              <p className="font-display text-3xl font-bold text-[#0F766E] mt-1 tabular-nums">
                KES {proProfile.availableBalanceKes.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              disabled={proProfile.availableBalanceKes <= 0}
              onClick={handleOpenWithdraw}
              className="w-full min-h-[44px] rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw to M-Pesa</span>
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Pending in M-Pesa Escrow</span>
            <p className="font-display text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              KES {pendingEscrowKes.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Net payout after {commissionPercent}% KaziSafi platform fee. Releases immediately upon customer sign-off.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Completed Jobs &amp; Rating</span>
            <p className="font-display text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              {proProfile.jobsCompleted + completedJobs.length}
            </p>
            <p className="text-xs text-slate-500 mt-2 tabular-nums">
              Average rating: <strong className="text-slate-800">{proProfile.rating.toFixed(1)} ★</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Nearest Job Requests (First-to-Accept Dispatch) */}
          <section className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Nearest Job Requests ({incomingRequests.length})
              </h2>
              <span className="text-xs font-semibold text-[#0F766E]">
                First-to-accept wins dispatch
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
                {proProfile.isOnline
                  ? 'No nearby broadcast requests in your selected zones right now.'
                  : 'You are currently Offline. Switch to Online to receive nearby job broadcasts.'}
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#0F766E]">
                            {req.id}
                            {req.parentOrderId ? ` · Order ${req.parentOrderId}` : ''}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E] tabular-nums">
                            <MapPin className="w-3 h-3" />
                            {(req.distanceKm ?? 1.2).toFixed(1)} km away in {req.estate}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-900 mt-1">
                          {req.serviceTitle} for {req.customerName}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          {req.scope.primaryOption}
                          {req.scope.secondaryOption ? ` · ${req.scope.secondaryOption}` : ''}
                          {req.scope.addonLabels?.length
                            ? ` · + ${req.scope.addonLabels.join(', ')}`
                            : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 tabular-nums">
                          {req.date} · {req.timeSlot}
                        </p>
                        {req.scope.keyCollect && (
                          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 space-y-0.5">
                            <p className="font-semibold inline-flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              KeyCollect Custody (Leave Original National ID at Gate)
                            </p>
                            {(req.scope.keyContactName || req.scope.keyContactPhone) && (
                              <p className="text-[11px] text-amber-800 tabular-nums">
                                Caretaker / Guard: {req.scope.keyContactName || 'Gate Guard'}
                                {req.scope.keyContactPhone ? ` · ${req.scope.keyContactPhone}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                        {req.balanceDueKes > 0 && (
                          <p className="text-[11px] font-medium text-slate-600 mt-1.5 tabular-nums">
                            50% Deposit Paid · KES {req.balanceDueKes.toLocaleString()} balance due on completion
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-500 block">Your Net Payout</span>
                        <span className="font-display text-lg font-bold text-[#0F766E] tabular-nums">
                          KES {req.proPayoutKes.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 block tabular-nums">
                          (After {commissionPercent}% fee)
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => respondToJobRequest(req.id, false, proProfile.id)}
                        className="flex-1 min-h-[42px] rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToJobRequest(req.id, true, proProfile.id)}
                        className="flex-1 min-h-[42px] rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Job</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Schedule */}
          <section className="lg:col-span-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Active Schedule ({activeSchedule.length})
            </h2>

            {activeSchedule.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
                Accepted jobs will appear here with arrival &amp; work progress controls.
              </div>
            ) : (
              <div className="space-y-3">
                {activeSchedule.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-[#0F766E]">
                          {job.status === 'confirmed'
                            ? 'Confirmed · Ready for Dispatch'
                            : job.status === 'en-route'
                            ? 'En Route to Customer'
                            : 'Work In Progress'}
                          {job.parentOrderId ? ` · Order ${job.parentOrderId}` : ''}
                        </span>
                        <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                          {job.serviceTitle} · {job.customerName}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          {job.apartmentNumber}, {job.estate}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Gate: {job.gateInstructions}
                        </p>
                        {job.scope.keyCollect && (
                          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 space-y-0.5">
                            <p className="font-semibold inline-flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              KeyCollect Custody (Leave Original National ID at Gate)
                            </p>
                            {(job.scope.keyContactName || job.scope.keyContactPhone) && (
                              <p className="text-[11px] text-amber-800 tabular-nums">
                                Caretaker / Guard: {job.scope.keyContactName || 'Gate Guard'}
                                {job.scope.keyContactPhone ? ` · ${job.scope.keyContactPhone}` : ''}
                              </p>
                            )}
                          </div>
                        )}
                        {job.balanceDueKes > 0 && (
                          <p className="text-[11px] font-medium text-slate-600 mt-1.5 tabular-nums">
                            50% Deposit Paid · KES {job.balanceDueKes.toLocaleString()} balance due on completion
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-900 tabular-nums shrink-0">
                        KES {job.proPayoutKes.toLocaleString()}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 tabular-nums">
                        {job.date} · {job.timeSlot}
                      </span>

                      {job.status === 'confirmed' ? (
                        <button
                          type="button"
                          onClick={() => advanceBookingStatus(job.id, 'en-route')}
                          className="min-h-[42px] px-4 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Start Navigation</span>
                        </button>
                      ) : job.status === 'en-route' ? (
                        <button
                          type="button"
                          onClick={() => advanceBookingStatus(job.id, 'in-progress')}
                          className="min-h-[42px] px-4 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Job</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => advanceBookingStatus(job.id, 'completed')}
                          className="min-h-[42px] px-4 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Work Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {myWithdrawals.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Recent M-Pesa Withdrawals
                </h3>
                <div className="space-y-2 text-xs tabular-nums">
                  {myWithdrawals.map((w) => (
                    <div key={w.id} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-600">
                        {w.date} · <span className="font-mono">{w.mpesaRef}</span>
                      </span>
                      <span className="font-semibold text-[#0F766E]">
                        KES {w.amountKes.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Withdraw to M-Pesa Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            {!withdrawReceipt ? (
              <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    Withdraw to M-Pesa
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label htmlFor="wd-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Safaricom M-Pesa Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="wd-phone"
                      type="tel"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="wd-amt" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (Available: KES {proProfile.availableBalanceKes.toLocaleString()})
                  </label>
                  <input
                    id="wd-amt"
                    type="number"
                    min={1}
                    max={proProfile.availableBalanceKes}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm font-semibold tabular-nums"
                  />
                </div>

                {withdrawError && <p className="text-xs text-rose-600">{withdrawError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-sm font-semibold text-white hover:bg-teal-800"
                  >
                    Send M-Pesa Payout
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  M-Pesa Payout Sent
                </h3>
                <p className="text-sm text-slate-600">
                  KES {withdrawReceipt.amountKes.toLocaleString()} disbursed to{' '}
                  <strong>{withdrawReceipt.mpesaPhone}</strong>.
                </p>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-700">
                  M-Pesa Ref: {withdrawReceipt.mpesaRef}
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#0F766E] text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Worker Profile & Verification Documents Modal */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pro-profile-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={proAvatarUrl || proProfile.avatarUrl}
                  alt={proName || proProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3
                    id="pro-profile-settings-title"
                    className="font-display text-lg font-bold text-slate-900 truncate"
                  >
                    Worker Profile &amp; Vetting Documents
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    Upload your profile photo, Kenya National ID, and DCI Certificate of Good Conduct
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                aria-label="Close worker profile settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProProfile} className="p-6 space-y-6">
              {profileError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
                >
                  {profileError}
                </div>
              )}

              {/* 1. Profile Picture Upload */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={proAvatarUrl || proProfile.avatarUrl}
                    alt="Profile preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Profile Picture</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clear headshot shown to households during nearest-Pro dispatch. JPG or PNG up to 2 MB.
                    </p>
                  </div>
                </div>
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F766E] bg-white px-4 py-2.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 transition-colors shrink-0 min-h-[40px]">
                  <Camera className="w-4 h-4" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      readFileAsDataUrl(file, (_name, dataUrl) => {
                        if (dataUrl) setProAvatarUrl(dataUrl);
                      });
                    }}
                  />
                </label>
              </div>

              {/* 2. Personal & Work Details */}
              <div className="space-y-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Personal &amp; Service Details
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="pro-set-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="pro-set-name"
                        type="text"
                        required
                        value={proName}
                        onChange={(e) => setProName(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pro-set-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kenyan Phone (+254)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="pro-set-phone"
                        type="tel"
                        required
                        value={proPhone}
                        onChange={(e) => setProPhone(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="pro-set-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="pro-set-email"
                        type="email"
                        required
                        value={proEmail}
                        onChange={(e) => setProEmail(e.target.value)}
                        className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pro-set-service" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Primary Service Category
                    </label>
                    <select
                      id="pro-set-service"
                      value={proPrimaryService}
                      onChange={(e) => setProPrimaryService(e.target.value as ServiceId)}
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    >
                      {services.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.titleEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="pro-set-bio" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Short Bio &amp; Experience
                  </label>
                  <textarea
                    id="pro-set-bio"
                    rows={2}
                    value={proBio}
                    onChange={(e) => setProBio(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      Working Estates / Zones
                    </span>
                    <span className="text-[11px] font-semibold text-[#0F766E] tabular-nums">
                      {proEstates.length} selected
                    </span>
                  </div>
                  <div className="max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex flex-wrap gap-1.5">
                    {activeEstates.map((est) => {
                      const active = proEstates.includes(est);
                      return (
                        <button
                          key={est}
                          type="button"
                          onClick={() => toggleProEstate(est)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {est}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Kenyan Vetting Documents (National ID & DCI Good Conduct) */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Kenyan Vetting Documents (ID &amp; DCI Good Conduct)
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      proProfile.verificationStatus === 'verified'
                        ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    {proProfile.verificationStatus === 'verified' ? 'Verified' : 'Pending Review'}
                  </span>
                </div>

                {/* Kenya National ID */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label htmlFor="pro-set-idnum" className="block text-xs font-semibold text-slate-700 mb-1">
                        Kenya National ID Number
                      </label>
                      <input
                        id="pro-set-idnum"
                        type="text"
                        required
                        value={proIdNumber}
                        onChange={(e) => setProIdNumber(e.target.value)}
                        className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 flex items-center justify-between gap-2 min-h-[40px] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <Upload className="w-4 h-4 text-[#0F766E] shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {proIdDocName || 'Upload National ID (PDF/JPG)'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#0F766E] shrink-0">
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          readFileAsDataUrl(file, (name, dataUrl) => {
                            setProIdDocName(name);
                            setProIdDocDataUrl(dataUrl);
                          });
                        }}
                      />
                    </label>
                  </div>
                  {proIdDocDataUrl && proIdDocDataUrl.startsWith('data:image/') && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={proIdDocDataUrl}
                        alt="Uploaded National ID preview"
                        className="h-14 w-24 object-cover rounded-lg border border-slate-200 bg-white"
                      />
                      <span className="text-[11px] text-[#0F766E] font-medium">
                        National ID image attached ({proIdDocName})
                      </span>
                    </div>
                  )}
                </div>

                {/* DCI Certificate of Good Conduct */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label htmlFor="pro-set-gcnum" className="block text-xs font-semibold text-slate-700 mb-1">
                        DCI Good Conduct Certificate Ref
                      </label>
                      <input
                        id="pro-set-gcnum"
                        type="text"
                        required
                        value={proGcNumber}
                        onChange={(e) => setProGcNumber(e.target.value)}
                        placeholder="e.g. DCI-PCC-89412"
                        className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 flex items-center justify-between gap-2 min-h-[40px] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#0F766E] shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {proGcDocName || 'Upload DCI Good Conduct (PDF/JPG)'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#0F766E] shrink-0">
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          readFileAsDataUrl(file, (name, dataUrl) => {
                            setProGcDocName(name);
                            setProGcDocDataUrl(dataUrl);
                          });
                        }}
                      />
                    </label>
                  </div>
                  {proGcDocDataUrl && proGcDocDataUrl.startsWith('data:image/') && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={proGcDocDataUrl}
                        alt="Uploaded DCI Good Conduct preview"
                        className="h-14 w-24 object-cover rounded-lg border border-slate-200 bg-white"
                      />
                      <span className="text-[11px] text-[#0F766E] font-medium">
                        DCI Good Conduct image attached ({proGcDocName})
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Trade License & Guarantor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 p-3 flex items-center gap-2.5 transition-colors">
                    <Upload className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold text-slate-800">
                        Trade Cert (Optional)
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {proTradeCertName || 'EPRA / NCA PDF'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setProTradeCertName(file.name);
                      }}
                    />
                  </label>

                  <div>
                    <label htmlFor="pro-set-gname" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Guarantor Name
                    </label>
                    <input
                      id="pro-set-gname"
                      type="text"
                      value={proGuarantorName}
                      onChange={(e) => setProGuarantorName(e.target.value)}
                      placeholder="Optional guarantor"
                      className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>

                  <div>
                    <label htmlFor="pro-set-gphone" className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Guarantor Phone
                    </label>
                    <input
                      id="pro-set-gphone"
                      type="tel"
                      value={proGuarantorPhone}
                      onChange={(e) => setProGuarantorPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full min-h-[38px] px-3 rounded-xl border border-slate-200 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
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
                  <span>Save Profile &amp; Docs</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
