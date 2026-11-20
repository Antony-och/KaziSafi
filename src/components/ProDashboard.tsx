import React, {useMemo, useState} from 'react';
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  KeyRound,
  MapPin,
  Navigation,
  Play,
  ShieldAlert,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {KENYAN_LOCATIONS_BY_CITY} from '../data/kazisafiData';
import {WithdrawalRecord} from '../types/kazisafi';

export const ProDashboard: React.FC = () => {
  const {
    currentUser,
    pros,
    bookings,
    services,
    withdrawals,
    commissionPercent,
    updateProOnlineStatus,
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Controls */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img
              src={proProfile.avatarUrl}
              alt={proProfile.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
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
    </div>
  );
};
