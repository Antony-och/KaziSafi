import React, {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Briefcase,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Radar,
  Receipt,
  RotateCcw,
  Save,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Users,
  X,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {Booking, ServiceId, ServicePro, SiteSettings} from '../types/kazisafi';

type AdminTab =
  | 'overview'
  | 'workers'
  | 'customers'
  | 'verification'
  | 'bookings'
  | 'pricing'
  | 'locations'
  | 'settings';

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultEstate: string;
  bookings: Booking[];
  totalSpentKes: number;
  activeCount: number;
  completedCount: number;
  latestApartment?: string;
  latestGateNotes?: string;
}

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    pros,
    bookings,
    services,
    commissionPercent,
    setCommissionPercent,
    updateProOnlineStatus,
    updateProVerification,
    toggleKeyCollectEligibility,
    resolveBookingDispute,
    updateServiceBasePrice,
    siteSettings,
    updateSiteSettings,
    resetSiteSettings,
    locationZones,
    activeLocationGroups,
    activeEstates,
    addLocationCity,
    toggleLocationCityActive,
    updateLocationCityConfig,
    addEstateToCity,
    removeEstateFromCity,
    resetLocationZones,
    navigate,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Workers directory state
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerServiceFilter, setWorkerServiceFilter] = useState<'ALL' | ServiceId>('ALL');
  const [workerStatusFilter, setWorkerStatusFilter] = useState<
    'ALL' | 'verified' | 'pending' | 'rejected'
  >('ALL');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Customers directory state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Verification queue state
  const [proFilter, setProFilter] = useState<'ALL' | 'pending' | 'verified' | 'rejected'>('ALL');
  const [proSearch, setProSearch] = useState('');

  // Bookings & Escrow state
  const [bookingFilter, setBookingFilter] = useState<
    'ALL' | 'searching' | 'held' | 'disputed' | 'released' | 'refunded'
  >('ALL');
  const [bookingSearch, setBookingSearch] = useState('');

  // Location Settings state
  const [newCityName, setNewCityName] = useState('');
  const [newCityRadius, setNewCityRadius] = useState('8');
  const [newCityTransportFee, setNewCityTransportFee] = useState('0');
  const [newCityInitialEstates, setNewCityInitialEstates] = useState('');
  const [estateInputsByCity, setEstateInputsByCity] = useState<Record<string, string>>({});
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  // Modals & Editors
  const [previewPro, setPreviewPro] = useState<ServicePro | null>(null);
  const [disputeBooking, setDisputeBooking] = useState<Booking | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savedPriceId, setSavedPriceId] = useState<string | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(siteSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setSettingsDraft(siteSettings);
  }, [siteSettings]);

  const totalGrossKes = bookings
    .filter((b) => b.escrowStatus !== 'refunded')
    .reduce((sum, b) => sum + b.totalAmountKes, 0);

  const platformCommissionKes = bookings
    .filter((b) => b.escrowStatus !== 'refunded')
    .reduce((sum, b) => sum + b.platformFeeKes, 0);

  const activeVettedPros = pros.filter((p) => p.verificationStatus === 'verified').length;
  const pendingVerifications = pros.filter((p) => p.verificationStatus === 'pending').length;
  const searchingCount = bookings.filter((b) => b.status === 'searching' || !b.proId).length;
  const disputedCount = bookings.filter((b) => b.escrowStatus === 'disputed').length;

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase();
    return pros.filter((p) => {
      const catOk = workerServiceFilter === 'ALL' || p.primaryService === workerServiceFilter;
      const statusOk = workerStatusFilter === 'ALL' || p.verificationStatus === workerStatusFilter;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.nationalIdNumber.toLowerCase().includes(q) ||
        p.estates.some((e) => e.toLowerCase().includes(q));
      return catOk && statusOk && qOk;
    });
  }, [pros, workerSearch, workerServiceFilter, workerStatusFilter]);

  const selectedWorker = useMemo(
    () => (selectedWorkerId ? pros.find((p) => p.id === selectedWorkerId) ?? null : null),
    [pros, selectedWorkerId]
  );

  const selectedWorkerBookings = useMemo(() => {
    if (!selectedWorker) return [];
    return bookings.filter((b) => b.proId === selectedWorker.id);
  }, [bookings, selectedWorker]);

  const customerRecords = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    for (const u of users) {
      if (u.role !== 'customer') continue;
      map.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        defaultEstate: u.defaultEstate || 'Kilimani',
        bookings: [],
        totalSpentKes: 0,
        activeCount: 0,
        completedCount: 0,
      });
    }

    for (const b of bookings) {
      let rec = map.get(b.customerId);
      if (!rec) {
        rec = {
          id: b.customerId,
          name: b.customerName,
          email: `${b.customerName.toLowerCase().replace(/\s+/g, '.')}@kazisafi.co.ke`,
          phone: b.customerPhone,
          defaultEstate: b.estate,
          bookings: [],
          totalSpentKes: 0,
          activeCount: 0,
          completedCount: 0,
        };
        map.set(b.customerId, rec);
      }
      rec.bookings.push(b);
      if (b.escrowStatus !== 'refunded') {
        rec.totalSpentKes += b.paidAmountKes - (b.refundAmountKes ?? 0);
      }
      if (b.status === 'completed') rec.completedCount += 1;
      else if (b.status !== 'cancelled') rec.activeCount += 1;

      if (!rec.latestApartment) {
        rec.latestApartment = b.apartmentNumber;
        rec.latestGateNotes = b.gateInstructions;
      }
      if (!rec.defaultEstate) rec.defaultEstate = b.estate;
    }

    return Array.from(map.values());
  }, [users, bookings]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customerRecords.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.defaultEstate.toLowerCase().includes(q)
    );
  }, [customerRecords, customerSearch]);

  const selectedCustomer = useMemo(
    () =>
      selectedCustomerId
        ? customerRecords.find((c) => c.id === selectedCustomerId) ?? null
        : null,
    [customerRecords, selectedCustomerId]
  );

  const verificationQueue = useMemo(() => {
    const q = proSearch.trim().toLowerCase();
    return [...pros]
      .sort((a, b) => {
        const order = {pending: 0, verified: 1, rejected: 2};
        return order[a.verificationStatus] - order[b.verificationStatus];
      })
      .filter((p) => {
        const statusOk = proFilter === 'ALL' || p.verificationStatus === proFilter;
        const queryOk =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.nationalIdNumber.toLowerCase().includes(q) ||
          p.estates.some((e) => e.toLowerCase().includes(q));
        return statusOk && queryOk;
      });
  }, [pros, proFilter, proSearch]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      const statusOk =
        bookingFilter === 'ALL' ||
        (bookingFilter === 'searching'
          ? b.status === 'searching' || !b.proId
          : b.escrowStatus === bookingFilter);
      const queryOk =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.proName.toLowerCase().includes(q) ||
        b.estate.toLowerCase().includes(q) ||
        b.serviceTitle.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [bookings, bookingFilter, bookingSearch]);

  const handleSavePrice = (serviceId: (typeof services)[number]['id'], currentPrice: number) => {
    const raw = priceEdits[serviceId];
    const parsed = raw !== undefined ? Number(raw) : currentPrice;
    if (!Number.isNaN(parsed) && parsed >= 300) {
      updateServiceBasePrice(serviceId, parsed);
      setSavedPriceId(serviceId);
      setTimeout(() => setSavedPriceId(null), 1800);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(settingsDraft);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2400);
  };

  const handleResetSettings = () => {
    resetSiteSettings();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2400);
  };

  const showLocationToast = (msg: string) => {
    setLocationFeedback(msg);
    setTimeout(() => setLocationFeedback(null), 2400);
  };

  const handleAddCityHub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const initialList = newCityInitialEstates
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    addLocationCity(
      newCityName.trim(),
      Number(newCityRadius) || 8,
      Number(newCityTransportFee) || 0,
      initialList
    );
    showLocationToast(`Added ${newCityName.trim()} service hub.`);
    setNewCityName('');
    setNewCityRadius('8');
    setNewCityTransportFee('0');
    setNewCityInitialEstates('');
  };

  const handleAddEstate = (cityId: string, cityName: string) => {
    const val = (estateInputsByCity[cityId] || '').trim();
    if (!val) return;
    addEstateToCity(cityId, val);
    setEstateInputsByCity((prev) => ({...prev, [cityId]: ''}));
    showLocationToast(`Added "${val}" under ${cityName}.`);
  };

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{className?: string}>;
    badge?: number;
    badgeTone?: 'amber' | 'teal';
  }[] = [
    {id: 'overview', label: 'Overview', icon: LayoutDashboard},
    {
      id: 'workers',
      label: 'Workers',
      icon: Briefcase,
      badge: pros.length,
      badgeTone: 'teal',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      badge: customerRecords.length,
      badgeTone: 'teal',
    },
    {
      id: 'verification',
      label: 'Worker Verification',
      icon: ShieldCheck,
      badge: pendingVerifications > 0 ? pendingVerifications : undefined,
      badgeTone: 'amber',
    },
    {
      id: 'bookings',
      label: 'Bookings & Escrow',
      icon: Receipt,
      badge: searchingCount + disputedCount > 0 ? searchingCount + disputedCount : undefined,
      badgeTone: disputedCount > 0 ? 'amber' : 'teal',
    },
    {id: 'pricing', label: 'Pricing & Commission', icon: Tag},
    {
      id: 'locations',
      label: 'Location Settings',
      icon: MapPin,
      badge: activeEstates.length,
      badgeTone: 'teal',
    },
    {id: 'settings', label: 'Site Settings', icon: Settings},
  ];

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'KS';

  const renderSidebarNav = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
            Operations Center
          </p>
          <p className="font-display text-base font-bold text-slate-900 mt-0.5 truncate">
            {currentUser?.name || 'Admin Operations'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {currentUser?.email || 'ops@kazisafi.co.ke'}
          </p>
        </div>

        <nav aria-label="Admin dashboard sections" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[42px] ${
                  active
                    ? 'bg-[#0F766E] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[11px] font-bold tabular-nums ${
                      active
                        ? 'bg-white/20 text-white'
                        : item.badgeTone === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-teal-50 text-[#0F766E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200 space-y-1.5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors min-h-[38px]"
        >
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          <span>View Public Storefront</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors min-h-[38px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 p-5">
        <div className="sticky top-20 h-[calc(100vh-7rem)]">{renderSidebarNav()}</div>
      </aside>

      {/* Mobile Sidebar Bar & Drawer */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open admin navigation"
            className="min-w-[40px] min-h-[40px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E]">
              KaziSafi Operations
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {navItems.find((i) => i.id === activeTab)?.label}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => selectTab('settings')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
        >
          <Settings className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Settings</span>
        </button>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full p-5 shadow-2xl border-r border-slate-200 z-10 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <span className="font-display text-sm font-bold text-slate-900">
                Operations Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarNav()}</div>
          </div>
        </div>
      )}

      {/* Main Dashboard Workspace */}
      <div className="flex-1 min-w-0 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Workspace Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
                Operations &amp; Trust Governance
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                {activeTab === 'overview' && 'KaziSafi Operations Center'}
                {activeTab === 'workers' && 'Service Pros & Workers Directory'}
                {activeTab === 'customers' && 'Households & Customers Directory'}
                {activeTab === 'verification' && 'Worker Verification & KeyCollect'}
                {activeTab === 'bookings' && 'Live Bookings & Escrow Monitor'}
                {activeTab === 'pricing' && 'KES Pricing & Commission'}
                {activeTab === 'locations' && 'Location Settings & Service Zones'}
                {activeTab === 'settings' && 'Site Settings & Dispatch Rules'}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {activeTab === 'overview' &&
                  'Monitor marketplace revenue, active nearest-Pro broadcasts, DCI verification queues, and site configuration.'}
                {activeTab === 'workers' &&
                  'Browse all registered Mama Fuas, nannies, and fundis. Select any worker to inspect full vetting, zones, and wallet details.'}
                {activeTab === 'customers' &&
                  'View all registered household accounts, active estates, and M-Pesa order history. Click any customer for full profile details.'}
                {activeTab === 'verification' &&
                  'Audit Kenya National ID, DCI Good Conduct certificates, guarantors, and elect KeyCollect-qualified Pros.'}
                {activeTab === 'bookings' &&
                  'Track Searching broadcast orders, 50% deposits, 100% escrow holdings, and resolve flagged disputes.'}
                {activeTab === 'pricing' &&
                  'Adjust base rates in KES and configure the KaziSafi platform commission rate (15%–20%).'}
                {activeTab === 'locations' &&
                  'Manage active Kenyan cities, neighborhood estates, per-hub dispatch radiuses, and zone transport fees.'}
                {activeTab === 'settings' &&
                  'Manage platform identity, Kenyan support channels, nearest-Pro dispatch behavior, KeyCollect rules, and alerts.'}
              </p>
            </div>

            {activeTab !== 'settings' && activeTab !== 'locations' && (
              <div className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 flex items-center gap-3 self-start sm:self-auto shrink-0">
                <label htmlFor="comm-rate-top" className="text-xs font-semibold text-slate-700">
                  Commission:
                </label>
                <select
                  id="comm-rate-top"
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
            )}
          </div>

          {siteSettings.maintenanceMode && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Maintenance Mode Active:</strong> {siteSettings.maintenanceMessage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => selectTab('settings')}
                className="font-semibold text-amber-800 underline shrink-0"
              >
                Manage
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-xs font-medium text-slate-500">Total Gross Bookings</span>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tabular-nums">
                    KES {totalGrossKes.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {bookings.length} total orders
                  </p>
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
                  <p className="text-xs text-slate-500 mt-1 tabular-nums">
                    {customerRecords.length} households registered
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-xs font-medium text-slate-500">Pending Verifications</span>
                  <p className="font-display text-2xl sm:text-3xl font-bold text-amber-600 mt-1 tabular-nums">
                    {pendingVerifications}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Awaiting ID &amp; DCI review</p>
                </div>
              </div>

              {/* Action Queues Snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Workers Directory Snapshot
                      </h2>
                      <p className="text-xs text-slate-500">
                        {pendingVerifications} pending DCI review · click any worker for profile
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectTab('workers')}
                      className="text-xs font-semibold text-[#0F766E] hover:underline whitespace-nowrap"
                    >
                      All Workers →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {pros.slice(0, 4).map((pro) => (
                      <button
                        key={pro.id}
                        type="button"
                        onClick={() => setSelectedWorkerId(pro.id)}
                        className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={pro.avatarUrl}
                            alt={pro.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {pro.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {services.find((s) => s.id === pro.primaryService)?.titleEn} ·{' '}
                              {pro.estates.join(', ')}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            pro.verificationStatus === 'verified'
                              ? 'text-[#0F766E]'
                              : pro.verificationStatus === 'pending'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {pro.verificationStatus === 'verified'
                            ? 'Verified'
                            : pro.verificationStatus === 'pending'
                            ? 'Pending'
                            : 'Rejected'}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Recent Dispatch &amp; Escrow Activity
                      </h2>
                      <p className="text-xs text-slate-500">
                        {searchingCount} searching broadcast · {disputedCount} disputed
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectTab('bookings')}
                      className="text-xs font-semibold text-[#0F766E] hover:underline whitespace-nowrap"
                    >
                      Monitor All →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {bookings.slice(0, 4).map((b) => (
                      <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            <span className="font-mono text-xs text-[#0F766E] mr-1.5">{b.id}</span>
                            {b.serviceTitle}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {b.customerName} · {b.estate} ·{' '}
                            {b.status === 'searching' || !b.proId ? (
                              <span className="text-amber-700 font-semibold">Searching...</span>
                            ) : (
                              b.proName
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">
                          KES {b.totalAmountKes.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Active Site Config Snapshot Card */}
              <section className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Active Site &amp; Coverage Configuration
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Coverage: <strong>{activeEstates.length} estates</strong> across{' '}
                    <strong>{activeLocationGroups.length} Kenyan hubs</strong> (Default:{' '}
                    {siteSettings.defaultEstate}) · Support: {siteSettings.supportPhone} · Auto-Dispatch:{' '}
                    <strong>{siteSettings.autoNearestDispatch ? 'Enabled' : 'Disabled'}</strong> (
                    {siteSettings.dispatchRadiusKm} km)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => selectTab('locations')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Location Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('settings')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                  >
                    Site Settings
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: WORKERS DIRECTORY PAGE */}
          {activeTab === 'workers' && (
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="Search name, estate, ID, phone..."
                      className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>

                  <select
                    aria-label="Filter workers by category"
                    value={workerServiceFilter}
                    onChange={(e) => setWorkerServiceFilter(e.target.value as 'ALL' | ServiceId)}
                    className="min-h-[40px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="ALL">All 8 Services</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.titleEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['ALL', 'verified', 'pending', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setWorkerStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        workerStatusFilter === st
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? `All (${pros.length})`
                        : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Worker</th>
                      <th className="py-3 px-4">Service &amp; Zones</th>
                      <th className="py-3 px-4">Rating &amp; Jobs</th>
                      <th className="py-3 px-4">Wallet Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                          No workers match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkers.map((pro) => {
                        const catTitle =
                          services.find((s) => s.id === pro.primaryService)?.titleEn ||
                          pro.primaryService;
                        return (
                          <tr
                            key={pro.id}
                            onClick={() => setSelectedWorkerId(pro.id)}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={pro.avatarUrl}
                                  alt={pro.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <p className="font-semibold text-slate-900">{pro.name}</p>
                                  <p className="text-xs text-slate-500 tabular-nums">{pro.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="text-xs font-semibold text-slate-800">{catTitle}</p>
                              <p className="text-xs text-slate-500 max-w-[220px] truncate">
                                {pro.estates.join(', ')}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs tabular-nums">
                              <p className="font-semibold text-slate-900">
                                {pro.rating.toFixed(1)} ★
                              </p>
                              <p className="text-slate-500">{pro.jobsCompleted} jobs done</p>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-[#0F766E] tabular-nums">
                              KES {pro.availableBalanceKes.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`font-semibold ${
                                    pro.verificationStatus === 'verified'
                                      ? 'text-[#0F766E]'
                                      : pro.verificationStatus === 'pending'
                                      ? 'text-amber-600'
                                      : 'text-rose-600'
                                  }`}
                                >
                                  {pro.verificationStatus === 'verified'
                                    ? 'Verified'
                                    : pro.verificationStatus === 'pending'
                                    ? 'Pending Review'
                                    : 'Rejected'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {pro.isOnline ? 'Online' : 'Offline'}
                                  {pro.keyCollectEligible ? ' · KeyCollect' : ''}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWorkerId(pro.id);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 hover:border-teal-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Profile</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: CUSTOMERS DIRECTORY PAGE */}
          {activeTab === 'customers' && (
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer name, phone, email, estate..."
                    className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {filteredCustomers.length} households
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Primary Estate</th>
                      <th className="py-3 px-4">Orders</th>
                      <th className="py-3 px-4 text-right">Total Spent</th>
                      <th className="py-3 px-4 text-right">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                          No customers match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs font-bold flex items-center justify-center shrink-0">
                                {getInitials(cust.name)}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-900">{cust.name}</p>
                                <p className="font-mono text-[11px] text-slate-400">{cust.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-medium text-slate-800 tabular-nums">{cust.phone}</p>
                            <p className="text-slate-500">{cust.email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                              {cust.defaultEstate}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs tabular-nums">
                            <p className="font-semibold text-slate-900">
                              {cust.bookings.length} total
                            </p>
                            <p className="text-slate-500">
                              {cust.activeCount} active · {cust.completedCount} done
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#0F766E] text-xs tabular-nums">
                            KES {cust.totalSpentKes.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomerId(cust.id);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-teal-50 hover:border-teal-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Profile</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: WORKER VERIFICATION */}
          {activeTab === 'verification' && (
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={proSearch}
                    onChange={(e) => setProSearch(e.target.value)}
                    placeholder="Search Pro, ID, phone, estate..."
                    className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['ALL', 'pending', 'verified', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setProFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        proFilter === status
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {status === 'ALL'
                        ? `All (${pros.length})`
                        : status === 'pending'
                        ? `Pending (${pendingVerifications})`
                        : status === 'verified'
                        ? `Verified (${activeVettedPros})`
                        : 'Rejected'}
                    </button>
                  ))}
                </div>
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
                    {verificationQueue.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          No service professionals match your filter.
                        </td>
                      </tr>
                    ) : (
                      verificationQueue.map((pro) => {
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 5: LIVE BOOKINGS & ESCROW MONITOR */}
          {activeTab === 'bookings' && (
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search ID, customer, pro, estate..."
                    className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      {id: 'ALL', label: `All (${bookings.length})`},
                      {id: 'searching', label: `Searching (${searchingCount})`},
                      {id: 'held', label: 'Held in Escrow'},
                      {id: 'disputed', label: `Disputed (${disputedCount})`},
                      {id: 'released', label: 'Released'},
                      {id: 'refunded', label: 'Refunded'},
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBookingFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        bookingFilter === f.id
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
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
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          No bookings match your selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
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
                              <span className="ml-1.5 text-[#0F766E] font-semibold">
                                · KeyCollect
                              </span>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 6: PRICING & COMMISSION */}
          {activeTab === 'pricing' && (
            <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Service Base Pricing Manager (KES)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Changes update the public service cards, Services Catalog page, and booking wizard rates immediately.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">Marketplace Fee:</span>
                  <span className="font-bold text-[#0F766E] tabular-nums">
                    {commissionPercent}%
                  </span>
                </div>
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
          )}

          {/* TAB 7: LOCATION SETTINGS */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              {locationFeedback && (
                <div
                  role="status"
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-[#0F766E] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{locationFeedback}</span>
                </div>
              )}

              {/* Coverage KPI & Default Launch Estate Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-xs font-medium text-slate-500">Active Kenyan Hubs</span>
                  <p className="font-display text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {activeLocationGroups.length}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      / {locationZones.length} configured
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Visible in booking &amp; signup pickers</p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <span className="text-xs font-medium text-slate-500">Active Service Estates</span>
                  <p className="font-display text-2xl font-bold text-[#0F766E] mt-1 tabular-nums">
                    {activeEstates.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Synced across Quick Book, Cart &amp; Pro zones
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-2">
                  <label
                    htmlFor="loc-default-estate"
                    className="text-xs font-medium text-slate-500"
                  >
                    Default Launch Estate
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      id="loc-default-estate"
                      value={
                        activeEstates.includes(siteSettings.defaultEstate)
                          ? siteSettings.defaultEstate
                          : activeEstates[0] || 'Kilimani'
                      }
                      onChange={(e) => {
                        updateSiteSettings({defaultEstate: e.target.value});
                        showLocationToast(`Default estate set to ${e.target.value}.`);
                      }}
                      className="flex-1 min-h-[40px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
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
                    <button
                      type="button"
                      onClick={() => {
                        resetLocationZones();
                        showLocationToast('Restored default Kenyan cities and estates.');
                      }}
                      title="Reset default locations"
                      className="min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Add New City / County Hub */}
              <form
                onSubmit={handleAddCityHub}
                className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Add New Kenyan City / County Hub
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Immediately available in storefront estate dropdowns
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-3">
                    <label
                      htmlFor="new-city-name"
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
                    >
                      City / Region Name
                    </label>
                    <input
                      id="new-city-name"
                      type="text"
                      required
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder="e.g. Thika & Kiambu"
                      className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <label
                      htmlFor="new-city-estates"
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
                    >
                      Initial Estates (comma-separated)
                    </label>
                    <input
                      id="new-city-estates"
                      type="text"
                      value={newCityInitialEstates}
                      onChange={(e) => setNewCityInitialEstates(e.target.value)}
                      placeholder="e.g. Section 9, Makongeni, Kiambu Town"
                      className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="new-city-radius"
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
                    >
                      Radius (km)
                    </label>
                    <input
                      id="new-city-radius"
                      type="number"
                      min={1}
                      max={35}
                      value={newCityRadius}
                      onChange={(e) => setNewCityRadius(e.target.value)}
                      className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label
                      htmlFor="new-city-fee"
                      className="block text-[11px] font-semibold text-slate-600 mb-1"
                    >
                      Zone Fee (KES)
                    </label>
                    <input
                      id="new-city-fee"
                      type="number"
                      min={0}
                      step={50}
                      value={newCityTransportFee}
                      onChange={(e) => setNewCityTransportFee(e.target.value)}
                      className="w-full min-h-[40px] px-3 rounded-xl border border-slate-200 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-end">
                    <button
                      type="submit"
                      className="w-full min-h-[40px] px-3 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* City Hub & Estate Manager Cards */}
              <div className="space-y-4">
                {locationZones.map((zone) => {
                  const verifiedProsInCity = pros.filter(
                    (p) =>
                      p.verificationStatus === 'verified' &&
                      p.estates.some((est) => zone.estates.includes(est))
                  ).length;

                  return (
                    <section
                      key={zone.id}
                      className={`rounded-2xl border p-5 sm:p-6 space-y-4 transition-colors ${
                        zone.active
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/80 border-slate-200 opacity-85'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-display text-lg font-bold text-slate-900">
                              {zone.city}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                                zone.active
                                  ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {zone.active ? 'Active Coverage' : 'Paused'}
                            </span>
                            <span className="text-xs text-slate-500 tabular-nums">
                              {zone.estates.length} estates · {verifiedProsInCity} verified Pros
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <label
                              htmlFor={`radius-${zone.id}`}
                              className="font-semibold text-slate-600"
                            >
                              Radius (km):
                            </label>
                            <input
                              id={`radius-${zone.id}`}
                              type="number"
                              min={1}
                              max={35}
                              value={zone.dispatchRadiusKm}
                              onChange={(e) =>
                                updateLocationCityConfig(zone.id, {
                                  dispatchRadiusKm: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs">
                            <label
                              htmlFor={`fee-${zone.id}`}
                              className="font-semibold text-slate-600"
                            >
                              Zone Fee (KES):
                            </label>
                            <input
                              id={`fee-${zone.id}`}
                              type="number"
                              min={0}
                              step={50}
                              value={zone.transportFeeKes}
                              onChange={(e) =>
                                updateLocationCityConfig(zone.id, {
                                  transportFeeKes: Math.max(0, Number(e.target.value) || 0),
                                })
                              }
                              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleLocationCityActive(zone.id)}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                              zone.active
                                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                : 'border-[#0F766E] bg-[#0F766E] text-white hover:bg-teal-800'
                            }`}
                          >
                            {zone.active ? 'Pause Hub' : 'Activate Hub'}
                          </button>
                        </div>
                      </div>

                      {/* Estate Chips */}
                      <div className="flex flex-wrap gap-2">
                        {zone.estates.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No estates added yet for {zone.city}. Add an estate below to enable bookings.
                          </p>
                        ) : (
                          zone.estates.map((est) => {
                            const proCount = pros.filter(
                              (p) => p.verificationStatus === 'verified' && p.estates.includes(est)
                            ).length;
                            return (
                              <span
                                key={est}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800"
                              >
                                <span className="font-medium">{est}</span>
                                <span
                                  className={`text-[11px] font-semibold tabular-nums ${
                                    proCount > 0 ? 'text-[#0F766E]' : 'text-slate-400'
                                  }`}
                                >
                                  {proCount} {proCount === 1 ? 'Pro' : 'Pros'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeEstateFromCity(zone.id, est);
                                    showLocationToast(`Removed "${est}" from ${zone.city}.`);
                                  }}
                                  aria-label={`Remove ${est}`}
                                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            );
                          })
                        )}
                      </div>

                      {/* Inline Add Estate Input */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 max-w-md">
                        <input
                          type="text"
                          value={estateInputsByCity[zone.id] || ''}
                          onChange={(e) =>
                            setEstateInputsByCity((prev) => ({
                              ...prev,
                              [zone.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddEstate(zone.id, zone.city);
                            }
                          }}
                          placeholder={`Add estate to ${zone.city} (e.g. Kikuyu, Donholm)...`}
                          className="flex-1 min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddEstate(zone.id, zone.city)}
                          className="min-h-[38px] px-3.5 rounded-xl border border-[#0F766E] text-xs font-semibold text-[#0F766E] hover:bg-teal-50 inline-flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Estate</span>
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: SITE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsSaved && (
                <div
                  role="status"
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-[#0F766E] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Site settings saved and applied across KaziSafi.</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Brand & Support Contact */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <Globe className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Brand &amp; Kenyan Support Contact
                    </h2>
                  </div>

                  <div>
                    <label
                      htmlFor="set-platform-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Platform Display Name
                    </label>
                    <input
                      id="set-platform-name"
                      type="text"
                      value={settingsDraft.platformName}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({...prev, platformName: e.target.value}))
                      }
                      className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="set-support-phone"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Support Phone (+254)
                      </label>
                      <input
                        id="set-support-phone"
                        type="text"
                        value={settingsDraft.supportPhone}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({...prev, supportPhone: e.target.value}))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="set-support-email"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Support Email
                      </label>
                      <input
                        id="set-support-email"
                        type="email"
                        value={settingsDraft.supportEmail}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({...prev, supportEmail: e.target.value}))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="set-hours"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Operating Hours (EAT)
                      </label>
                      <input
                        id="set-hours"
                        type="text"
                        value={settingsDraft.operatingHours}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({...prev, operatingHours: e.target.value}))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="set-lang"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Default Storefront Language
                      </label>
                      <select
                        id="set-lang"
                        value={settingsDraft.defaultLanguage}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            defaultLanguage: e.target.value as SiteSettings['defaultLanguage'],
                          }))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      >
                        <option value="en">English (EN)</option>
                        <option value="sw">Kiswahili (SW)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Dispatch & M-Pesa Escrow Rules */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <Radar className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Nearest-Pro Dispatch &amp; Escrow Rules
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="set-comm"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Platform Commission (15%–20%)
                      </label>
                      <select
                        id="set-comm"
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(Number(e.target.value))}
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0F766E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      >
                        {[15, 16, 17, 18, 19, 20].map((pct) => (
                          <option key={pct} value={pct}>
                            {pct}% Platform Fee
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="set-radius"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Max Dispatch Broadcast Radius (km)
                      </label>
                      <input
                        id="set-radius"
                        type="number"
                        min={1}
                        max={25}
                        value={settingsDraft.dispatchRadiusKm}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            dispatchRadiusKm: Math.max(1, Number(e.target.value) || 5),
                          }))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.autoNearestDispatch}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          autoNearestDispatch: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Automatic Nearest-Pro Broadcast Dispatch
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Automatically broadcast paid cart orders to closest verified, online Pros in the customer’s estate.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.allow50PercentDeposit}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          allow50PercentDeposit: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Allow 50% Deposit Checkout Option
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Let households pay 50% upfront into M-Pesa Escrow and settle the remaining balance on completion.
                      </span>
                    </div>
                  </label>
                </div>

                {/* 3. KeyCollect & Customer Notification Channels */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <KeyRound className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      KeyCollect &amp; Notification Channels
                    </h2>
                  </div>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.keyCollectEnabled}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          keyCollectEnabled: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Enable KeyCollect Custody Service
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        Allows customers to designate a caretaker or gate guard for unattended Pro visits.
                      </span>
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="set-kc-pct"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        KeyCollect Surcharge (%)
                      </label>
                      <input
                        id="set-kc-pct"
                        type="number"
                        min={10}
                        max={100}
                        value={settingsDraft.keyCollectPercent}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            keyCollectPercent: Math.max(10, Number(e.target.value) || 40),
                          }))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="set-kc-min"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        KeyCollect Minimum Fee (KES)
                      </label>
                      <input
                        id="set-kc-min"
                        type="number"
                        min={200}
                        step={50}
                        value={settingsDraft.keyCollectMinFeeKes}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            keyCollectMinFeeKes: Math.max(200, Number(e.target.value) || 500),
                          }))
                        }
                        className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={settingsDraft.smsNotificationsEnabled}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            smsNotificationsEnabled: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <Bell className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>SMS Dispatch Alerts</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="checkbox"
                        checked={settingsDraft.whatsappAlertsEnabled}
                        onChange={(e) =>
                          setSettingsDraft((prev) => ({
                            ...prev,
                            whatsappAlertsEnabled: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                      />
                      <Bell className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>WhatsApp Alerts</span>
                    </label>
                  </div>
                </div>

                {/* 4. Platform Availability / Maintenance Mode */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <Lock className="w-4 h-4 text-[#0F766E]" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Platform Availability &amp; Maintenance
                    </h2>
                  </div>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.maintenanceMode}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          maintenanceMode: e.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-amber-300 text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <span className="block text-xs font-bold text-amber-900">
                        Enable Scheduled Maintenance Banner
                      </span>
                      <span className="block text-xs text-amber-800 mt-0.5">
                        Displays an operations notice across the dashboard during Safaricom M-Pesa API maintenance windows.
                      </span>
                    </div>
                  </label>

                  <div>
                    <label
                      htmlFor="set-maint-msg"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Maintenance Notice Message
                    </label>
                    <textarea
                      id="set-maint-msg"
                      rows={3}
                      value={settingsDraft.maintenanceMessage}
                      onChange={(e) =>
                        setSettingsDraft((prev) => ({
                          ...prev,
                          maintenanceMessage: e.target.value,
                        }))
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                  </div>
                </div>
              </div>

              {/* Save / Reset Action Bar */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Changes persist immediately across sessions and update live storefront contact &amp; dispatch defaults.
                </p>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[42px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 min-h-[42px]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Site Settings</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* WORKER PROFILE DETAILS POP-UP MODAL */}
      {selectedWorker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="worker-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={selectedWorker.avatarUrl}
                  alt={selectedWorker.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id="worker-modal-title"
                      className="font-display text-lg font-bold text-slate-900 truncate"
                    >
                      {selectedWorker.name}
                    </h3>
                    {selectedWorker.verificationStatus === 'verified' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                        <BadgeCheck className="w-3 h-3" />
                        Verified Pro
                      </span>
                    ) : selectedWorker.verificationStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Pending Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {services.find((s) => s.id === selectedWorker.primaryService)?.titleEn ||
                      selectedWorker.primaryService}{' '}
                    · Joined {selectedWorker.joinedDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkerId(null)}
                aria-label="Close worker profile"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Customer Rating</span>
                  <p className="font-display text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-1 tabular-nums">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    {selectedWorker.rating.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Jobs Completed</span>
                  <p className="font-display text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                    {selectedWorker.jobsCompleted}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3.5">
                  <span className="text-[11px] font-medium text-[#0F766E]">M-Pesa Balance</span>
                  <p className="font-display text-lg font-bold text-[#0F766E] mt-0.5 tabular-nums">
                    KES {selectedWorker.availableBalanceKes.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bio & Contact */}
              <div className="space-y-3 text-xs">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedWorker.bio}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span className="tabular-nums">{selectedWorker.phone}</span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span className="truncate">{selectedWorker.email}</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Active Working Estates</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWorker.estates.map((est) => (
                        <span
                          key={est}
                          className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                        >
                          {est}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vetting & Compliance Credentials */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Kenyan Vetting &amp; Trust Records
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-500 block">National ID Number</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {selectedWorker.nationalIdNumber} ({selectedWorker.nationalIdDocName})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">DCI Certificate Ref</span>
                    <span className="font-mono font-semibold text-[#0F766E]">
                      {selectedWorker.goodConductCertNumber} ({selectedWorker.goodConductDocName})
                    </span>
                  </div>
                  {selectedWorker.guarantorName && (
                    <div>
                      <span className="text-slate-500 block">Guarantor</span>
                      <span className="font-semibold text-slate-800">
                        {selectedWorker.guarantorName} · {selectedWorker.guarantorPhone}
                      </span>
                    </div>
                  )}
                  {selectedWorker.tradeCertName && (
                    <div>
                      <span className="text-slate-500 block">Trade License</span>
                      <span className="font-mono font-semibold text-[#0F766E]">
                        {selectedWorker.tradeCertName}
                      </span>
                    </div>
                  )}
                </div>
                {(selectedWorker.nationalIdDocDataUrl?.startsWith('data:image/') ||
                  selectedWorker.goodConductDocDataUrl?.startsWith('data:image/')) && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
                    {selectedWorker.nationalIdDocDataUrl?.startsWith('data:image/') && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Uploaded National ID
                        </span>
                        <img
                          src={selectedWorker.nationalIdDocDataUrl}
                          alt="National ID copy"
                          className="h-24 w-full object-cover rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    )}
                    {selectedWorker.goodConductDocDataUrl?.startsWith('data:image/') && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Uploaded DCI Good Conduct
                        </span>
                        <img
                          src={selectedWorker.goodConductDocDataUrl}
                          alt="DCI Good Conduct copy"
                          className="h-24 w-full object-cover rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Bookings Assigned to Worker */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Platform Bookings ({selectedWorkerBookings.length})
                </p>
                {selectedWorkerBookings.length === 0 ? (
                  <p className="text-xs text-slate-500 rounded-xl border border-slate-200 p-3">
                    No active platform bookings logged for this worker yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {selectedWorkerBookings.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs bg-white"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#0F766E] mr-2">{b.id}</span>
                          <span className="font-semibold text-slate-900">{b.customerName}</span>
                          <span className="text-slate-500">
                            {' '}
                            · {b.estate} · {b.date}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800 tabular-nums shrink-0">
                          KES {b.proPayoutKes.toLocaleString()} ({b.status})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Controls inside Modal */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateProOnlineStatus(selectedWorker.id, !selectedWorker.isOnline)
                    }
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      selectedWorker.isOnline
                        ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {selectedWorker.isOnline ? 'Online · Click to Pause' : 'Offline · Set Online'}
                  </button>

                  <button
                    type="button"
                    disabled={selectedWorker.verificationStatus !== 'verified'}
                    onClick={() => toggleKeyCollectEligibility(selectedWorker.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>
                      {selectedWorker.keyCollectEligible
                        ? 'Revoke KeyCollect'
                        : 'Elect KeyCollect'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedWorker.verificationStatus !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => updateProVerification(selectedWorker.id, 'rejected')}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  )}
                  {selectedWorker.verificationStatus !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => updateProVerification(selectedWorker.id, 'verified')}
                      className="px-4 py-2 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800 inline-flex items-center gap-1.5"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Approve &amp; Verify</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE DETAILS POP-UP MODAL */}
      {selectedCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white font-display text-base font-bold flex items-center justify-center shrink-0">
                  {getInitials(selectedCustomer.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id="customer-modal-title"
                      className="font-display text-lg font-bold text-slate-900 truncate"
                    >
                      {selectedCustomer.name}
                    </h3>
                    <span className="inline-flex items-center rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                      Customer Account
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">
                    ID: {selectedCustomer.id} · {selectedCustomer.defaultEstate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                aria-label="Close customer profile"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Total Bookings</span>
                  <p className="font-display text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                    {selectedCustomer.bookings.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <span className="text-[11px] font-medium text-slate-500">Active / Completed</span>
                  <p className="font-display text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                    {selectedCustomer.activeCount} / {selectedCustomer.completedCount}
                  </p>
                </div>
                <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-3.5">
                  <span className="text-[11px] font-medium text-[#0F766E]">Total Spent</span>
                  <p className="font-display text-lg font-bold text-[#0F766E] mt-0.5 tabular-nums">
                    KES {selectedCustomer.totalSpentKes.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Contact Details
                  </p>
                  <p className="text-slate-700 flex items-center gap-1.5 font-medium tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                    {selectedCustomer.phone}
                  </p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5">
                  <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Primary Home Address
                  </p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                    {selectedCustomer.defaultEstate}
                  </p>
                  {selectedCustomer.latestApartment && (
                    <p className="text-slate-600">{selectedCustomer.latestApartment}</p>
                  )}
                  {selectedCustomer.latestGateNotes && (
                    <p className="text-slate-400">{selectedCustomer.latestGateNotes}</p>
                  )}
                </div>
              </div>

              {/* Customer Bookings History */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Booking &amp; M-Pesa History ({selectedCustomer.bookings.length})
                </p>
                {selectedCustomer.bookings.length === 0 ? (
                  <p className="text-xs text-slate-500 rounded-xl border border-slate-200 p-4">
                    This customer has not placed any bookings yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                    {selectedCustomer.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white text-xs"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-[#0F766E]">{b.id}</span>
                            <span className="font-semibold text-slate-900">{b.serviceTitle}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">{b.estate}</span>
                          </div>
                          <p className="text-slate-500 mt-0.5 tabular-nums">
                            {b.date} · {b.timeSlot} · Pro:{' '}
                            {b.status === 'searching' || !b.proId ? 'Searching...' : b.proName} ·
                            Ref: {b.mpesaRef}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className="font-bold text-slate-900 tabular-nums">
                            KES {b.totalAmountKes.toLocaleString()}
                          </span>
                          <span className="block text-[11px] font-semibold text-[#0F766E] capitalize">
                            {b.status} ({b.escrowStatus})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-teal-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {(previewPro.nationalIdDocDataUrl?.startsWith('data:image/') ||
                previewPro.goodConductDocDataUrl?.startsWith('data:image/')) && (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2.5">
                  {previewPro.nationalIdDocDataUrl?.startsWith('data:image/') && (
                    <img
                      src={previewPro.nationalIdDocDataUrl}
                      alt="National ID"
                      className="h-20 w-full object-cover rounded-lg border border-slate-200 bg-white"
                    />
                  )}
                  {previewPro.goodConductDocDataUrl?.startsWith('data:image/') && (
                    <img
                      src={previewPro.goodConductDocDataUrl}
                      alt="DCI Good Conduct"
                      className="h-20 w-full object-cover rounded-lg border border-slate-200 bg-white"
                    />
                  )}
                </div>
              )}
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
