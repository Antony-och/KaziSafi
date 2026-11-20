import React, {useState} from 'react';
import {
  BadgeCheck,
  Check,
  Eye,
  FileText,
  KeyRound,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {Booking, ServicePro} from '../types/kazisafi';

export const AdminDashboard: React.FC = () => {
  const {
    pros,
    bookings,
    services,
    commissionPercent,
    setCommissionPercent,
    updateProVerification,
    toggleKeyCollectEligibility,
    resolveBookingDispute,
    updateServiceBasePrice,
  } = useApp();

  const [previewPro, setPreviewPro] = useState<ServicePro | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savedPriceId, setSavedPriceId] = useState<string | null>(null);

  const totalGrossKes = bookings
    .filter((b) => b.escrowStatus !== 'refunded')
    .reduce((sum, b) => sum + b.totalAmountKes, 0);

  const platformCommissionKes = bookings
    .filter((b) => b.escrowStatus !== 'refunded')
    .reduce((sum, b) => sum + b.platformFeeKes, 0);

  const activeVettedPros = pros.filter((p) => p.verificationStatus === 'verified').length;
  const pendingVerifications = pros.filter((p) => p.verificationStatus === 'pending').length;

  const verificationQueue = [...pros].sort((a, b) => {
    const order = {pending: 0, verified: 1, rejected: 2};
    return order[a.verificationStatus] - order[b.verificationStatus];
  });

  const handleSavePrice = (serviceId: (typeof services)[number]['id'], currentPrice: number) => {
    const raw = priceEdits[serviceId];
    const parsed = raw !== undefined ? Number(raw) : currentPrice;
    if (!Number.isNaN(parsed) && parsed >= 300) {
      updateServiceBasePrice(serviceId, parsed);
      setSavedPriceId(serviceId);
      setTimeout(() => setSavedPriceId(null), 1800);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
              Operations &amp; Trust Governance
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              KaziSafi Operations Center
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Audit worker DCI Good Conduct &amp; KeyCollect eligibility, monitor escrow settlements, and manage KES pricing.
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 flex items-center gap-3">
            <label htmlFor="comm-rate" className="text-xs font-semibold text-slate-700">
              Platform Commission (15%–20%):
            </label>
            <select
              id="comm-rate"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-[#0F766E] tabular-nums"
            >
              {[15, 16, 17, 18, 19, 20].map((pct) => (
                <option key={pct} value={pct}>
                  {pct}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Total Gross Bookings</span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              KES {totalGrossKes.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">{bookings.length} total orders</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">
              Platform Commission ({commissionPercent}%)
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-[#0F766E] mt-1 tabular-nums">
              KES {platformCommissionKes.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Net marketplace revenue</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Active Vetted Pros</span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
              {activeVettedPros}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across 8 Kenyan services</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <span className="text-xs font-medium text-slate-500">Pending Verifications</span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600 mt-1 tabular-nums">
              {pendingVerifications}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting ID &amp; DCI review</p>
          </div>
        </div>

        {/* Worker Verification Queue */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Worker Verification Queue &amp; KeyCollect Election
              </h2>
              <p className="text-xs text-slate-500">
                Review National ID, DCI Good Conduct certificates, guarantors, and elect top-rated Pros for KeyCollect.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-700 tabular-nums">
              {pendingVerifications} pending review
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">National ID</th>
                  <th className="py-3 px-4">DCI Good Conduct</th>
                  <th className="py-3 px-4">KeyCollect</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationQueue.map((pro) => {
                  const catTitle =
                    services.find((s) => s.id === pro.primaryService)?.titleEn ||
                    pro.primaryService;
                  return (
                    <tr key={pro.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{pro.name}</p>
                        <p className="text-xs text-slate-500 tabular-nums">{pro.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {catTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                        ID #{pro.nationalIdNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setPreviewPro(pro)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{pro.goodConductCertNumber}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={pro.verificationStatus !== 'verified'}
                          onClick={() => toggleKeyCollectEligibility(pro.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            pro.keyCollectEligible
                              ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          } disabled:opacity-40`}
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>{pro.keyCollectEligible ? 'Qualified' : 'Not Elected'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {pro.verificationStatus === 'verified' && (
                          <span className="text-[#0F766E]">Verified Pro</span>
                        )}
                        {pro.verificationStatus === 'pending' && (
                          <span className="text-amber-600">Pending Review</span>
                        )}
                        {pro.verificationStatus === 'rejected' && (
                          <span className="text-rose-600">Rejected</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {pro.verificationStatus !== 'verified' && (
                            <button
                              type="button"
                              onClick={() => updateProVerification(pro.id, 'verified')}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve &amp; Verify</span>
                            </button>
                          )}
                          {pro.verificationStatus !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => updateProVerification(pro.id, 'rejected')}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Bookings & Escrow Monitor */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Live Bookings &amp; Escrow Monitor
            </h2>
            <p className="text-xs text-slate-500">
              Track 50% deposits, 100% escrow holdings, KeyCollect orders, and resolve flagged disputes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Pro</th>
                  <th className="py-3 px-4">Service &amp; Estate</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Escrow Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                      {b.id}
                      {b.parentOrderId && (
                        <span className="block text-[10px] font-semibold text-[#0F766E]">
                          {b.parentOrderId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      {b.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      {b.status === 'searching' || !b.proId ? (
                        <span className="text-amber-700 font-semibold">Searching...</span>
                      ) : (
                        b.proName
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {b.serviceTitle} · {b.estate}
                      {b.scope.keyCollect && (
                        <span className="ml-1.5 text-[#0F766E] font-semibold">· KeyCollect</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                      KES {b.totalAmountKes.toLocaleString()}
                      <span className="block text-[11px] font-normal text-slate-500">
                        Paid: KES {b.paidAmountKes.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {b.escrowStatus === 'held' && (
                        <span className="text-amber-700">Held in Escrow</span>
                      )}
                      {b.escrowStatus === 'released' && (
                        <span className="text-[#0F766E]">Released</span>
                      )}
                      {b.escrowStatus === 'disputed' && (
                        <span className="text-rose-700">Disputed</span>
                      )}
                      {b.escrowStatus === 'refunded' && (
                        <span className="text-slate-500">Refunded</span>
                      )}
                      {b.escrowStatus === 'partial-refund' && (
                        <span className="text-slate-600">50% Refunded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.escrowStatus === 'held' || b.escrowStatus === 'disputed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeBooking(b);
                            setDisputeNote(b.disputeNote || '');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Scale className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Resolve Dispute</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Service Pricing Manager */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Service Base Pricing Manager (KES)
            </h2>
            <p className="text-xs text-slate-500">
              Changes update the public service cards, Services Catalog page, and booking wizard rates immediately.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Base Price (KES)</th>
                  <th className="py-3 px-4 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((srv) => {
                  const val = priceEdits[srv.id] ?? String(srv.basePriceKes);
                  return (
                    <tr key={srv.id}>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-500">
                        {srv.categoryEn}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{srv.titleEn}</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={300}
                          step={50}
                          aria-label={`${srv.titleEn} base price`}
                          value={val}
                          onChange={(e) =>
                            setPriceEdits((prev) => ({...prev, [srv.id]: e.target.value}))
                          }
                          className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleSavePrice(srv.id, srv.basePriceKes)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800"
                        >
                          {savedPriceId === srv.id ? 'Updated' : 'Update Rate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* DCI Good Conduct, ID, Trade Cert & Guarantor Preview Modal */}
      {previewPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Vetting Document Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPro(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant Name</span>
                <span className="font-bold text-slate-900">{previewPro.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kenya National ID</span>
                <span className="font-mono font-semibold text-slate-900">
                  {previewPro.nationalIdNumber} ({previewPro.nationalIdDocName})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DCI Certificate Ref</span>
                <span className="font-mono font-semibold text-[#0F766E]">
                  {previewPro.goodConductCertNumber}
                </span>
              </div>
              {previewPro.guarantorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Guarantor</span>
                  <span className="font-semibold text-slate-800">
                    {previewPro.guarantorName} ({previewPro.guarantorPhone})
                  </span>
                </div>
              )}
              {previewPro.tradeCertName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Trade License</span>
                  <span className="font-mono text-[#0F766E]">{previewPro.tradeCertName}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-slate-600">
                <FileText className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span className="truncate">{previewPro.goodConductDocName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  updateProVerification(previewPro.id, 'rejected');
                  setPreviewPro(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Reject Applicant
              </button>
              <button
                type="button"
                onClick={() => {
                  updateProVerification(previewPro.id, 'verified');
                  setPreviewPro(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center justify-center gap-1.5"
              >
                <BadgeCheck className="w-4 h-4" />
                <span>Approve &amp; Verify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {disputeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Resolve Escrow · {disputeBooking.id}
              </h3>
              <button
                type="button"
                onClick={() => setDisputeBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              Booking between <strong>{disputeBooking.customerName}</strong> and{' '}
              <strong>
                {disputeBooking.proId ? disputeBooking.proName : 'Unassigned (Searching)'}
              </strong>{' '}
              for{' '}
              <strong className="tabular-nums">
                KES {disputeBooking.totalAmountKes.toLocaleString()}
              </strong>
              .
            </p>

            <div>
              <label htmlFor="dispute-note" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Resolution Notes
              </label>
              <textarea
                id="dispute-note"
                rows={3}
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="Document mediation outcome..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resolveBookingDispute(disputeBooking.id, 'refund', disputeNote);
                  setDisputeBooking(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refund Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  resolveBookingDispute(disputeBooking.id, 'release', disputeNote);
                  setDisputeBooking(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800"
              >
                Release to Pro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
