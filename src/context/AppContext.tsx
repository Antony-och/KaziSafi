import React, {createContext, useContext, useEffect, useState} from 'react';
import {
  INITIAL_BOOKINGS,
  INITIAL_PROS,
  INITIAL_SAVED_ADDRESSES,
  INITIAL_SERVICES,
  INITIAL_USERS,
  KENYAN_ESTATES,
  SERVICE_SCOPE_CONFIG,
} from '../data/kazisafiData';
import {TRANSLATIONS} from '../i18n/translations';
import {
  AppRoute,
  Booking,
  BookingDraft,
  BookingScope,
  BookingStatus,
  CartItem,
  CustomerNotification,
  Language,
  PaymentMethod,
  PaymentPlan,
  SavedAddress,
  ServiceId,
  ServiceItem,
  ServicePro,
  UserAccount,
  UserRole,
  VerificationStatus,
  WithdrawalRecord,
} from '../types/kazisafi';

const STORAGE_KEY = 'kazisafi_state_v3';

const INITIAL_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'notif-seed-1',
    customerId: 'cust-wanjiku',
    bookingId: 'KZ-8491',
    serviceTitle: 'Cleaning & Mama Fua',
    proName: 'Amina Hassan',
    proPhone: '+254 722 890 123',
    proAvatarUrl: '/src/assets/images/pro_amina_1795081024421.jpg',
    proRating: 4.9,
    etaMinutes: 18,
    estate: 'Kilimani',
    date: '2026-11-22',
    timeSlot: '10:30 AM – 12:30 PM',
    message:
      'Booking Confirmed! Amina Hassan (ID & DCI Verified) has accepted your Cleaning & Mama Fua request for 2026-11-22 (10:30 AM – 12:30 PM) in Kilimani. Track arrival in My Home Hub.',
    read: true,
    createdAt: '2026-11-19T07:45:00Z',
  },
];

interface PersistedState {
  language: Language;
  currentUserId: string | null;
  users: UserAccount[];
  services: ServiceItem[];
  pros: ServicePro[];
  bookings: Booking[];
  notifications: CustomerNotification[];
  savedAddresses: SavedAddress[];
  savedProIds: string[];
  withdrawals: WithdrawalRecord[];
  commissionPercent: number;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        language: parsed.language === 'sw' ? 'sw' : 'en',
        currentUserId: parsed.currentUserId ?? null,
        users: parsed.users?.length ? parsed.users : INITIAL_USERS,
        services: parsed.services?.length ? parsed.services : INITIAL_SERVICES,
        pros: parsed.pros?.length ? parsed.pros : INITIAL_PROS,
        bookings: parsed.bookings?.length ? parsed.bookings : INITIAL_BOOKINGS,
        notifications: parsed.notifications ?? INITIAL_NOTIFICATIONS,
        savedAddresses: parsed.savedAddresses?.length ? parsed.savedAddresses : INITIAL_SAVED_ADDRESSES,
        savedProIds: parsed.savedProIds ?? ['pro-amina', 'pro-david'],
        withdrawals: parsed.withdrawals ?? [],
        commissionPercent: parsed.commissionPercent ?? 15,
      };
    }
  } catch {
    // Fallback to seed state
  }
  return {
    language: 'en',
    currentUserId: null,
    users: INITIAL_USERS,
    services: INITIAL_SERVICES,
    pros: INITIAL_PROS,
    bookings: INITIAL_BOOKINGS,
    notifications: INITIAL_NOTIFICATIONS,
    savedAddresses: INITIAL_SAVED_ADDRESSES,
    savedProIds: ['pro-amina', 'pro-david'],
    withdrawals: [],
    commissionPercent: 15,
  };
}

export function calculateScopePricing(
  serviceId: ServiceId,
  scope: Pick<BookingScope, 'primaryOption' | 'secondaryOption' | 'addonIds'>,
  services: ServiceItem[],
  language: Language
) {
  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const cfg = SERVICE_SCOPE_CONFIG[serviceId];
  const primaryPriceKes =
    cfg.primaryOptions.find((o) => o.label === scope.primaryOption)?.priceKes ??
    service.basePriceKes;
  const secondarySurchargeKes =
    cfg.secondaryOptions?.find((o) => o.label === scope.secondaryOption)?.surchargeKes ?? 0;
  const selectedAddons = scope.addonIds
    .map((id) => cfg.addons.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const addonsTotalKes = selectedAddons.reduce((sum, a) => sum + a.priceKes, 0);
  const addonLabels = selectedAddons.map((a) => (language === 'sw' ? a.labelSw : a.labelEn));
  const subtotalKes = primaryPriceKes + secondarySurchargeKes + addonsTotalKes;
  return {
    serviceTitle: language === 'sw' ? service.titleSw : service.titleEn,
    primaryPriceKes,
    secondarySurchargeKes,
    addonsTotalKes,
    addonLabels,
    subtotalKes,
  };
}

function createDefaultDraft(
  serviceId: ServiceId = 'cleaning',
  estate: string = KENYAN_ESTATES[0],
  preselectedTierOption?: string,
  existingCartItems: CartItem[] = []
): BookingDraft {
  const cfg = SERVICE_SCOPE_CONFIG[serviceId];
  const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const matchedOption = preselectedTierOption
    ? cfg.primaryOptions.find((o) => o.label === preselectedTierOption)?.label
    : undefined;

  return {
    serviceId,
    estate,
    scope: {
      primaryOption: matchedOption ?? cfg.primaryOptions[0]?.label ?? '',
      secondaryOption: cfg.secondaryOptions?.[0]?.label ?? '',
      notes: '',
      photoName: '',
      addonIds: [],
      addonLabels: [],
      keyCollect: false,
      keyContactName: '',
      keyContactPhone: '',
    },
    cartItems: existingCartItems,
    date: tomorrow,
    timeSlot: '10:30 AM – 12:30 PM',
    apartmentNumber: '',
    gateInstructions: '',
    staggeredArrivalNotes: '',
    selectedProId: '',
    selectedProsByService: {},
    autoAssignPros: true,
    paymentPlan: 'escrow-100',
    paymentMethod: 'mpesa',
    step: 1,
  };
}

function parseRouteFromPath(pathname: string): AppRoute {
  if (
    pathname === '/services' ||
    pathname === '/how-it-works' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/book' ||
    pathname === '/dashboard'
  ) {
    return pathname;
  }
  return '/';
}

export function computeHoursUntilService(dateStr: string, timeSlot: string): number {
  const startPart = timeSlot.split('–')[0]?.trim() || '08:00 AM';
  const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 8;
  let minutes = 0;
  if (match) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  const target = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  if (Number.isNaN(target.getTime())) return 48;
  return (target.getTime() - Date.now()) / (1000 * 60 * 60);
}

interface SignupCustomerPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  defaultEstate: string;
}

interface SignupProPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  primaryService: ServiceId;
  estates: string[];
  nationalIdNumber: string;
  nationalIdDocName: string;
  goodConductDocName: string;
  tradeCertName?: string;
  guarantorName?: string;
  guarantorPhone?: string;
}

interface CreateBookingPayload {
  mpesaPhone: string;
  mpesaRef: string;
  serviceSubtotalKes: number;
  keyCollectFeeKes: number;
  totalAmountKes: number;
  paidAmountKes: number;
  balanceDueKes: number;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
}

interface CreateMultiOrderPayload {
  items: CartItem[];
  mpesaPhone: string;
  mpesaRef: string;
  keyCollectFeeKes: number;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
}

interface AppContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  route: AppRoute;
  navigate: (to: AppRoute, hash?: string) => void;
  currentUser: UserAccount | null;
  users: UserAccount[];
  services: ServiceItem[];
  pros: ServicePro[];
  bookings: Booking[];
  notifications: CustomerNotification[];
  toastNotification: CustomerNotification | null;
  dismissToastNotification: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  savedAddresses: SavedAddress[];
  savedProIds: string[];
  withdrawals: WithdrawalRecord[];
  commissionPercent: number;
  setCommissionPercent: (pct: number) => void;
  bookingDraft: BookingDraft;
  setBookingDraft: React.Dispatch<React.SetStateAction<BookingDraft>>;
  pendingCheckoutReturn: boolean;
  setPendingCheckoutReturn: (v: boolean) => void;
  openBooking: (serviceId?: ServiceId, estate?: string, preselectedTierOption?: string) => void;
  openCart: () => void;
  addCurrentScopeToCart: () => CartItem;
  removeCartItem: (cartItemId: string) => void;
  buildCartItemFromCurrentScope: () => CartItem;
  rebookFromHistory: (booking: Booking) => void;
  loginWithCredentials: (identifier: string, password: string) => {ok: boolean; error?: string};
  loginAsDemoRole: (role: UserRole) => void;
  signupCustomer: (payload: SignupCustomerPayload) => {ok: boolean; error?: string};
  signupPro: (payload: SignupProPayload) => {ok: boolean; error?: string};
  logout: () => void;
  createBooking: (payload: CreateBookingPayload) => Booking;
  createMultiServiceOrder: (payload: CreateMultiOrderPayload) => {parentOrderId: string; bookings: Booking[]};
  releaseEscrowWithReview: (bookingId: string, rating: number, reviewText: string) => void;
  cancelBookingWithPolicy: (bookingId: string, reason: string, isProNoShow?: boolean) => {refundKes: number; pct: number};
  toggleSavedPro: (proId: string) => void;
  addSavedAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  updateProOnlineStatus: (proId: string, isOnline: boolean) => void;
  respondToJobRequest: (bookingId: string, accept: boolean, actingProId?: string) => void;
  advanceBookingStatus: (bookingId: string, nextStatus: BookingStatus) => void;
  withdrawProFunds: (proId: string, amountKes: number, mpesaPhone: string) => WithdrawalRecord;
  updateProVerification: (proId: string, status: VerificationStatus) => void;
  toggleKeyCollectEligibility: (proId: string) => void;
  resolveBookingDispute: (bookingId: string, resolution: 'release' | 'refund', note: string) => void;
  updateServiceBasePrice: (serviceId: ServiceId, newPriceKes: number) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [route, setRoute] = useState<AppRoute>(() => {
    const initial = parseRouteFromPath(window.location.pathname);
    if (initial === '/dashboard' && !loadInitialState().currentUserId) {
      return '/login';
    }
    return initial;
  });
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(() => createDefaultDraft());
  const [pendingCheckoutReturn, setPendingCheckoutReturn] = useState(false);
  const [toastNotification, setToastNotification] = useState<CustomerNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    const onPopState = () => {
      const next = parseRouteFromPath(window.location.pathname);
      if (next === '/dashboard' && !state.currentUserId) {
        setRoute('/login');
      } else {
        setRoute(next);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [state.currentUserId]);

  const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;

  const navigate = (to: AppRoute, hash?: string) => {
    const targetRoute: AppRoute = to === '/dashboard' && !state.currentUserId ? '/login' : to;
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, '', targetRoute + (hash ? `#${hash}` : ''));
    }
    setRoute(targetRoute);

    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({behavior: 'smooth'});
        }
      }, 60);
    } else {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const setLanguage = (lang: Language) => {
    setState((prev) => ({...prev, language: lang}));
  };

  const setCommissionPercent = (pct: number) => {
    const clamped = Math.min(20, Math.max(15, pct));
    setState((prev) => ({...prev, commissionPercent: clamped}));
  };

  const t = (key: string) => TRANSLATIONS[state.language][key] ?? key;

  const buildCartItemFromCurrentScope = (): CartItem => {
    const calc = calculateScopePricing(
      bookingDraft.serviceId,
      bookingDraft.scope,
      state.services,
      state.language
    );
    return {
      id: `item-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
      serviceId: bookingDraft.serviceId,
      serviceTitle: calc.serviceTitle,
      primaryOption: bookingDraft.scope.primaryOption,
      secondaryOption: bookingDraft.scope.secondaryOption,
      notes: bookingDraft.scope.notes,
      photoName: bookingDraft.scope.photoName,
      addonIds: [...bookingDraft.scope.addonIds],
      addonLabels: calc.addonLabels,
      primaryPriceKes: calc.primaryPriceKes,
      secondarySurchargeKes: calc.secondarySurchargeKes,
      addonsTotalKes: calc.addonsTotalKes,
      subtotalKes: calc.subtotalKes,
    };
  };

  const addCurrentScopeToCart = (): CartItem => {
    const newItem = buildCartItemFromCurrentScope();
    setBookingDraft((prev) => ({
      ...prev,
      cartItems: [...prev.cartItems, newItem],
    }));
    return newItem;
  };

  const removeCartItem = (cartItemId: string) => {
    setBookingDraft((prev) => ({
      ...prev,
      cartItems: prev.cartItems.filter((item) => item.id !== cartItemId),
    }));
  };

  const openBooking = (
    serviceId: ServiceId = 'cleaning',
    estate?: string,
    preselectedTierOption?: string
  ) => {
    const chosenEstate = estate || currentUser?.defaultEstate || bookingDraft.estate || KENYAN_ESTATES[0];
    setBookingDraft((prev) => ({
      ...createDefaultDraft(serviceId, chosenEstate, preselectedTierOption, prev.cartItems),
      date: prev.date,
      timeSlot: prev.timeSlot,
      apartmentNumber: prev.apartmentNumber,
      gateInstructions: prev.gateInstructions,
      staggeredArrivalNotes: prev.staggeredArrivalNotes,
      selectedProsByService: prev.selectedProsByService,
      autoAssignPros: prev.autoAssignPros,
      paymentPlan: prev.paymentPlan,
      paymentMethod: prev.paymentMethod,
    }));
    setPendingCheckoutReturn(false);
    navigate('/book');
  };

  const openCart = () => {
    setPendingCheckoutReturn(false);
    navigate('/book', 'booking-summary-cart');
  };

  const rebookFromHistory = (booking: Booking) => {
    const calc = calculateScopePricing(
      booking.serviceId,
      booking.scope,
      state.services,
      state.language
    );
    const rebookItem: CartItem = {
      id: `item-${Date.now()}`,
      serviceId: booking.serviceId,
      serviceTitle: calc.serviceTitle,
      primaryOption: booking.scope.primaryOption,
      secondaryOption: booking.scope.secondaryOption,
      notes: booking.scope.notes,
      photoName: booking.scope.photoName,
      addonIds: [...booking.scope.addonIds],
      addonLabels: calc.addonLabels,
      primaryPriceKes: calc.primaryPriceKes,
      secondarySurchargeKes: calc.secondarySurchargeKes,
      addonsTotalKes: calc.addonsTotalKes,
      subtotalKes: calc.subtotalKes,
    };

    setBookingDraft({
      serviceId: booking.serviceId,
      estate: booking.estate,
      scope: {...booking.scope},
      cartItems: [rebookItem],
      date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      timeSlot: booking.timeSlot,
      apartmentNumber: booking.apartmentNumber,
      gateInstructions: booking.gateInstructions,
      staggeredArrivalNotes: booking.staggeredArrivalNotes || '',
      selectedProId: booking.proId,
      selectedProsByService: {[booking.serviceId]: booking.proId},
      autoAssignPros: false,
      paymentPlan: booking.paymentPlan,
      paymentMethod: booking.paymentMethod,
      step: 2,
    });
    navigate('/book');
  };

  const loginWithCredentials = (identifier: string, password: string) => {
    const normalized = identifier.trim().toLowerCase();
    const digitsOnly = identifier.replace(/\D/g, '');
    const found = state.users.find((u) => {
      const emailMatch = u.email.toLowerCase() === normalized;
      const phoneMatch =
        digitsOnly.length >= 9 && u.phone.replace(/\D/g, '').endsWith(digitsOnly.slice(-9));
      return (emailMatch || phoneMatch) && u.password === password;
    });

    if (!found) {
      return {ok: false, error: 'Invalid email/phone or password. Please try again or use a demo account.'};
    }

    setState((prev) => ({...prev, currentUserId: found.id}));
    if (pendingCheckoutReturn) {
      setPendingCheckoutReturn(false);
      navigate('/book');
    } else {
      navigate('/dashboard');
    }
    return {ok: true};
  };

  const loginAsDemoRole = (role: UserRole) => {
    const demoUser = state.users.find((u) => u.role === role);
    if (!demoUser) return;
    setState((prev) => ({...prev, currentUserId: demoUser.id}));
    if (pendingCheckoutReturn && role === 'customer') {
      setPendingCheckoutReturn(false);
      navigate('/book');
    } else {
      navigate('/dashboard');
    }
  };

  const signupCustomer = (payload: SignupCustomerPayload) => {
    const exists = state.users.some(
      (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase()
    );
    if (exists) {
      return {ok: false, error: 'An account with this email already exists.'};
    }
    const newUser: UserAccount = {
      id: `cust-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
      role: 'customer',
      defaultEstate: payload.defaultEstate,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
    }));
    if (pendingCheckoutReturn) {
      setPendingCheckoutReturn(false);
      navigate('/book');
    } else {
      navigate('/dashboard');
    }
    return {ok: true};
  };

  const signupPro = (payload: SignupProPayload) => {
    const exists = state.users.some(
      (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase()
    );
    if (exists) {
      return {ok: false, error: 'An account with this email already exists.'};
    }
    const proId = `pro-${Date.now()}`;
    const newPro: ServicePro = {
      id: proId,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      primaryService: payload.primaryService,
      estates: payload.estates.length > 0 ? payload.estates : ['Kilimani', 'Westlands', 'Kileleshwa'],
      rating: 5.0,
      jobsCompleted: 0,
      verificationStatus: 'pending',
      keyCollectEligible: false,
      nationalIdNumber: payload.nationalIdNumber.trim(),
      nationalIdDocName: payload.nationalIdDocName || 'national_id_upload.pdf',
      goodConductDocName: payload.goodConductDocName || 'dci_good_conduct.pdf',
      goodConductCertNumber: `DCI-PCC-${Math.floor(10000 + Math.random() * 89999)}`,
      tradeCertName: payload.tradeCertName,
      guarantorName: payload.guarantorName,
      guarantorPhone: payload.guarantorPhone,
      isOnline: false,
      availableBalanceKes: 0,
      avatarUrl: '/src/assets/images/pro_amina_1795081024421.jpg',
      bio: 'Newly registered KaziSafi service professional awaiting admin verification.',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    const newUser: UserAccount = {
      id: `user-${proId}`,
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
      role: 'pro',
      proId,
    };
    setState((prev) => ({
      ...prev,
      pros: [newPro, ...prev.pros],
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
    }));
    setPendingCheckoutReturn(false);
    navigate('/dashboard');
    return {ok: true};
  };

  const logout = () => {
    setState((prev) => ({...prev, currentUserId: null}));
    setPendingCheckoutReturn(false);
    navigate('/');
  };

  const createBooking = (payload: CreateBookingPayload): Booking => {
    const service = state.services.find((s) => s.id === bookingDraft.serviceId) ?? state.services[0];
    const pro =
      state.pros.find((p) => p.id === bookingDraft.selectedProId) ??
      state.pros.find((p) => p.primaryService === bookingDraft.serviceId && p.verificationStatus === 'verified') ??
      state.pros[0];

    const platformFeeKes = Math.round(payload.totalAmountKes * (state.commissionPercent / 100));
    const proPayoutKes = payload.totalAmountKes - platformFeeKes;
    const customer = currentUser ?? state.users[0];

    const newBooking: Booking = {
      id: `KZ-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      proId: pro.id,
      proName: pro.name,
      serviceId: service.id,
      serviceTitle: state.language === 'sw' ? service.titleSw : service.titleEn,
      estate: bookingDraft.estate,
      apartmentNumber: bookingDraft.apartmentNumber || 'Apartment 3A',
      gateInstructions: bookingDraft.gateInstructions || 'Call upon arrival at the main gate.',
      staggeredArrivalNotes: bookingDraft.staggeredArrivalNotes || undefined,
      date: bookingDraft.date,
      timeSlot: bookingDraft.timeSlot,
      scope: {...bookingDraft.scope},
      serviceSubtotalKes: payload.serviceSubtotalKes,
      keyCollectFeeKes: payload.keyCollectFeeKes,
      totalAmountKes: payload.totalAmountKes,
      paidAmountKes: payload.paidAmountKes,
      balanceDueKes: payload.balanceDueKes,
      paymentPlan: payload.paymentPlan,
      paymentMethod: payload.paymentMethod,
      platformFeeKes,
      proPayoutKes,
      mpesaRef: payload.mpesaRef,
      mpesaPhone: payload.mpesaPhone,
      status: 'confirmed',
      escrowStatus: 'held',
      proAccepted: false,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      bookings: [newBooking, ...prev.bookings],
    }));

    return newBooking;
  };

  const createMultiServiceOrder = (payload: CreateMultiOrderPayload) => {
    const parentOrderId = `KZO-${Math.floor(1000 + Math.random() * 9000)}`;
    const customer = currentUser ?? state.users[0];
    const items = payload.items;
    const totalSubtotal = items.reduce((sum, it) => sum + it.subtotalKes, 0);

    // Distribute KeyCollect fee proportionally across child bookings so sums match exact total
    let remainingKeyFee = payload.keyCollectFeeKes;
    const createdBookings: Booking[] = items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      const itemKeyFee =
        payload.keyCollectFeeKes === 0
          ? 0
          : isLast
          ? remainingKeyFee
          : Math.round((payload.keyCollectFeeKes * item.subtotalKes) / Math.max(1, totalSubtotal));
      remainingKeyFee = Math.max(0, remainingKeyFee - itemKeyFee);

      const totalAmountKes = item.subtotalKes + itemKeyFee;
      const paidAmountKes =
        payload.paymentPlan === 'deposit-50'
          ? Math.round(item.subtotalKes * 0.5) + itemKeyFee
          : totalAmountKes;
      const balanceDueKes = Math.max(0, totalAmountKes - paidAmountKes);
      const platformFeeKes = Math.round(totalAmountKes * (state.commissionPercent / 100));
      const proPayoutKes = totalAmountKes - platformFeeKes;

      const gateNotes = bookingDraft.gateInstructions || 'Call upon arrival at the main gate.';
      const combinedGate = bookingDraft.staggeredArrivalNotes?.trim()
        ? `${gateNotes} (Arrival note: ${bookingDraft.staggeredArrivalNotes.trim()})`
        : gateNotes;

      const distanceKm = Number((0.8 + ((idx * 0.5 + item.serviceId.length * 0.17) % 1.9)).toFixed(1));

      return {
        id: `KZ-${Math.floor(1000 + Math.random() * 9000)}`,
        parentOrderId: items.length > 1 ? parentOrderId : undefined,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        proId: '',
        proName: 'Searching nearest verified Pro...',
        distanceKm,
        declinedByProIds: [],
        serviceId: item.serviceId,
        serviceTitle: item.serviceTitle,
        estate: bookingDraft.estate,
        apartmentNumber: bookingDraft.apartmentNumber || 'Apartment 3A',
        gateInstructions: combinedGate,
        staggeredArrivalNotes: bookingDraft.staggeredArrivalNotes?.trim() || undefined,
        date: bookingDraft.date,
        timeSlot: bookingDraft.timeSlot,
        scope: {
          primaryOption: item.primaryOption,
          secondaryOption: item.secondaryOption,
          notes: item.notes,
          photoName: item.photoName,
          addonIds: [...item.addonIds],
          addonLabels: [...item.addonLabels],
          keyCollect: bookingDraft.scope.keyCollect,
          keyContactName: bookingDraft.scope.keyContactName,
          keyContactPhone: bookingDraft.scope.keyContactPhone,
        },
        serviceSubtotalKes: item.subtotalKes,
        keyCollectFeeKes: itemKeyFee,
        totalAmountKes,
        paidAmountKes,
        balanceDueKes,
        paymentPlan: payload.paymentPlan,
        paymentMethod: payload.paymentMethod,
        platformFeeKes,
        proPayoutKes,
        mpesaRef: payload.mpesaRef,
        mpesaPhone: payload.mpesaPhone,
        status: 'searching',
        escrowStatus: 'held',
        proAccepted: false,
        createdAt: new Date().toISOString(),
      };
    });

    setState((prev) => ({
      ...prev,
      bookings: [...createdBookings, ...prev.bookings],
    }));

    // Reset active cart after confirmed checkout
    setBookingDraft((prev) => ({
      ...createDefaultDraft(prev.serviceId, prev.estate, undefined, []),
    }));

    return {parentOrderId, bookings: createdBookings};
  };

  const releaseEscrowWithReview = (bookingId: string, rating: number, reviewText: string) => {
    setState((prev) => {
      const target = prev.bookings.find((b) => b.id === bookingId);
      if (!target) return prev;
      const shouldCredit = target.escrowStatus === 'held';
      return {
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'completed',
                escrowStatus: 'released',
                paidAmountKes: b.totalAmountKes,
                balanceDueKes: 0,
                rating,
                reviewText: reviewText.trim() || 'Great service!',
              }
            : b
        ),
        pros: prev.pros.map((p) =>
          p.id === target.proId
            ? {
                ...p,
                availableBalanceKes: shouldCredit
                  ? p.availableBalanceKes + target.proPayoutKes
                  : p.availableBalanceKes,
                jobsCompleted: p.jobsCompleted + 1,
                rating: Number(
                  ((p.rating * Math.max(p.jobsCompleted, 1) + rating) / (Math.max(p.jobsCompleted, 1) + 1)).toFixed(1)
                ),
              }
            : p
        ),
      };
    });
  };

  const cancelBookingWithPolicy = (bookingId: string, reason: string, isProNoShow = false) => {
    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target) return {refundKes: 0, pct: 0};

    let pct = 0;
    if (isProNoShow) {
      pct = 100;
    } else {
      const hoursLeft = computeHoursUntilService(target.date, target.timeSlot);
      if (hoursLeft >= 24) pct = 100;
      else if (hoursLeft >= 12) pct = 50;
      else pct = 0;
    }

    const refundKes = Math.round((target.paidAmountKes * pct) / 100);

    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled',
              escrowStatus: pct === 100 ? 'refunded' : pct === 50 ? 'partial-refund' : 'released',
              refundAmountKes: refundKes,
              cancellationReason: reason || (isProNoShow ? 'Service Pro No-Show' : 'Customer cancelled'),
            }
          : b
      ),
    }));

    return {refundKes, pct};
  };

  const toggleSavedPro = (proId: string) => {
    setState((prev) => ({
      ...prev,
      savedProIds: prev.savedProIds.includes(proId)
        ? prev.savedProIds.filter((id) => id !== proId)
        : [...prev.savedProIds, proId],
    }));
  };

  const addSavedAddress = (addr: Omit<SavedAddress, 'id'>) => {
    setState((prev) => ({
      ...prev,
      savedAddresses: [...prev.savedAddresses, {...addr, id: `addr-${Date.now()}`}],
    }));
  };

  const updateProOnlineStatus = (proId: string, isOnline: boolean) => {
    setState((prev) => ({
      ...prev,
      pros: prev.pros.map((p) => (p.id === proId ? {...p, isOnline} : p)),
    }));
  };

  const respondToJobRequest = (bookingId: string, accept: boolean, actingProId?: string) => {
    const pro =
      state.pros.find((p) => p.id === actingProId) ??
      state.pros.find((p) => p.id === currentUser?.proId) ??
      state.pros[0];

    const target = state.bookings.find((b) => b.id === bookingId);
    if (!target || target.proAccepted) return;

    if (accept && pro) {
      const etaMinutes = Math.max(12, Math.round((target.distanceKm ?? 1.2) * 14));
      const newNotif: CustomerNotification = {
        id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
        customerId: target.customerId,
        bookingId: target.id,
        parentOrderId: target.parentOrderId,
        serviceTitle: target.serviceTitle,
        proName: pro.name,
        proPhone: pro.phone,
        proAvatarUrl: pro.avatarUrl,
        proRating: pro.rating,
        etaMinutes,
        estate: target.estate,
        date: target.date,
        timeSlot: target.timeSlot,
        message: `Booking Confirmed! ${pro.name} (ID & DCI Verified) has accepted your ${target.serviceTitle} request for ${target.date} (${target.timeSlot}) in ${target.estate}. Track arrival in My Home Hub.`,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                proId: pro.id,
                proName: pro.name,
                proPhone: pro.phone,
                proAvatarUrl: pro.avatarUrl,
                proRating: pro.rating,
                proEtaMinutes: etaMinutes,
                proAccepted: true,
                status: 'confirmed',
              }
            : b
        ),
        notifications: [newNotif, ...prev.notifications],
      }));

      setToastNotification(newNotif);
    } else {
      const declinedId = actingProId || pro?.id || '';
      setState((prev) => ({
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId
            ? b.status === 'searching'
              ? {
                  ...b,
                  declinedByProIds: declinedId
                    ? [...(b.declinedByProIds ?? []), declinedId]
                    : b.declinedByProIds,
                }
              : {
                  ...b,
                  status: 'searching',
                  proId: '',
                  proName: 'Searching nearest verified Pro...',
                  proAccepted: false,
                  declinedByProIds: declinedId
                    ? [...(b.declinedByProIds ?? []), declinedId]
                    : b.declinedByProIds,
                }
            : b
        ),
      }));
    }
  };

  const dismissToastNotification = () => setToastNotification(null);

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? {...n, read: true} : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.customerId === currentUser.id ? {...n, read: true} : n
      ),
    }));
  };

  const advanceBookingStatus = (bookingId: string, nextStatus: BookingStatus) => {
    setState((prev) => ({
      ...prev,
      bookings: prev.bookings.map((b) => (b.id === bookingId ? {...b, status: nextStatus} : b)),
    }));
  };

  const withdrawProFunds = (proId: string, amountKes: number, mpesaPhone: string): WithdrawalRecord => {
    const record: WithdrawalRecord = {
      id: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
      proId,
      amountKes,
      mpesaPhone,
      mpesaRef: `UA${Math.floor(10 + Math.random() * 89)}MPW${Math.floor(100 + Math.random() * 899)}`,
      date: new Date().toISOString().split('T')[0],
    };
    setState((prev) => ({
      ...prev,
      pros: prev.pros.map((p) =>
        p.id === proId
          ? {...p, availableBalanceKes: Math.max(0, p.availableBalanceKes - amountKes)}
          : p
      ),
      withdrawals: [record, ...prev.withdrawals],
    }));
    return record;
  };

  const updateProVerification = (proId: string, status: VerificationStatus) => {
    setState((prev) => ({
      ...prev,
      pros: prev.pros.map((p) =>
        p.id === proId
          ? {
              ...p,
              verificationStatus: status,
              isOnline: status === 'verified' ? true : false,
            }
          : p
      ),
    }));
  };

  const toggleKeyCollectEligibility = (proId: string) => {
    setState((prev) => ({
      ...prev,
      pros: prev.pros.map((p) =>
        p.id === proId ? {...p, keyCollectEligible: !p.keyCollectEligible} : p
      ),
    }));
  };

  const resolveBookingDispute = (bookingId: string, resolution: 'release' | 'refund', note: string) => {
    setState((prev) => {
      const target = prev.bookings.find((b) => b.id === bookingId);
      if (!target) return prev;
      return {
        ...prev,
        bookings: prev.bookings.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: resolution === 'release' ? 'completed' : 'cancelled',
                escrowStatus: resolution === 'release' ? 'released' : 'refunded',
                refundAmountKes: resolution === 'refund' ? b.paidAmountKes : undefined,
                disputeNote: note || `Admin resolved: ${resolution}`,
              }
            : b
        ),
        pros:
          resolution === 'release'
            ? prev.pros.map((p) =>
                p.id === target.proId
                  ? {...p, availableBalanceKes: p.availableBalanceKes + target.proPayoutKes}
                  : p
              )
            : prev.pros,
      };
    });
  };

  const updateServiceBasePrice = (serviceId: ServiceId, newPriceKes: number) => {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? {...s, basePriceKes: Math.max(300, newPriceKes)} : s
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        language: state.language,
        setLanguage,
        t,
        route,
        navigate,
        currentUser,
        users: state.users,
        services: state.services,
        pros: state.pros,
        bookings: state.bookings,
        notifications: state.notifications,
        toastNotification,
        dismissToastNotification,
        markNotificationRead,
        markAllNotificationsRead,
        savedAddresses: state.savedAddresses,
        savedProIds: state.savedProIds,
        withdrawals: state.withdrawals,
        commissionPercent: state.commissionPercent,
        setCommissionPercent,
        bookingDraft,
        setBookingDraft,
        pendingCheckoutReturn,
        setPendingCheckoutReturn,
        openBooking,
        openCart,
        addCurrentScopeToCart,
        removeCartItem,
        buildCartItemFromCurrentScope,
        rebookFromHistory,
        loginWithCredentials,
        loginAsDemoRole,
        signupCustomer,
        signupPro,
        logout,
        createBooking,
        createMultiServiceOrder,
        releaseEscrowWithReview,
        cancelBookingWithPolicy,
        toggleSavedPro,
        addSavedAddress,
        updateProOnlineStatus,
        respondToJobRequest,
        advanceBookingStatus,
        withdrawProFunds,
        updateProVerification,
        toggleKeyCollectEligibility,
        resolveBookingDispute,
        updateServiceBasePrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
