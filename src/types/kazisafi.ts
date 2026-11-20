export type Language = 'en' | 'sw';

export type UserRole = 'customer' | 'pro' | 'admin';

export type AppRoute =
  | '/'
  | '/services'
  | '/how-it-works'
  | '/login'
  | '/signup'
  | '/book'
  | '/dashboard';

export type ServiceId =
  | 'cleaning'
  | 'meal-prep'
  | 'repairs'
  | 'electricians'
  | 'plumbers'
  | 'handyman'
  | 'nannies'
  | 'ground-work';

export type BookingStatus =
  | 'searching'
  | 'confirmed'
  | 'en-route'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export type EscrowStatus = 'held' | 'released' | 'disputed' | 'refunded' | 'partial-refund';

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export type PaymentPlan = 'escrow-100' | 'deposit-50';

export type PaymentMethod = 'mpesa' | 'card' | 'bank';

export interface ServiceCatalogTier {
  id: string;
  serviceId: ServiceId;
  nameEn: string;
  nameSw: string;
  priceLabel: string;
  priceKes: number;
  unitLabel: string;
  descriptionEn: string;
  popular?: boolean;
}

export interface ServiceItem {
  id: ServiceId;
  categoryEn: string;
  categorySw: string;
  titleEn: string;
  titleSw: string;
  subtitleEn: string;
  subtitleSw: string;
  basePriceKes: number;
  imageUrl: string;
}

export interface ServiceAddon {
  id: string;
  labelEn: string;
  labelSw: string;
  priceKes: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  defaultEstate?: string;
  proId?: string;
  avatarUrl?: string;
}

export interface ServicePro {
  id: string;
  name: string;
  phone: string;
  email: string;
  primaryService: ServiceId;
  estates: string[];
  rating: number;
  jobsCompleted: number;
  verificationStatus: VerificationStatus;
  keyCollectEligible: boolean;
  nationalIdNumber: string;
  nationalIdDocName: string;
  goodConductDocName: string;
  goodConductCertNumber: string;
  tradeCertName?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  isOnline: boolean;
  availableBalanceKes: number;
  avatarUrl: string;
  bio: string;
  joinedDate: string;
}

export interface BookingScope {
  primaryOption: string;
  secondaryOption?: string;
  notes?: string;
  photoName?: string;
  addonIds: string[];
  addonLabels?: string[];
  keyCollect: boolean;
  keyContactName?: string;
  keyContactPhone?: string;
}

export interface CartItem {
  id: string;
  serviceId: ServiceId;
  serviceTitle: string;
  primaryOption: string;
  secondaryOption?: string;
  notes?: string;
  photoName?: string;
  addonIds: string[];
  addonLabels: string[];
  primaryPriceKes: number;
  secondarySurchargeKes: number;
  addonsTotalKes: number;
  subtotalKes: number;
}

export interface Booking {
  id: string;
  parentOrderId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  proId: string;
  proName: string;
  proPhone?: string;
  proAvatarUrl?: string;
  proRating?: number;
  proEtaMinutes?: number;
  distanceKm?: number;
  declinedByProIds?: string[];
  serviceId: ServiceId;
  serviceTitle: string;
  estate: string;
  apartmentNumber: string;
  gateInstructions: string;
  staggeredArrivalNotes?: string;
  date: string;
  timeSlot: string;
  scope: BookingScope;
  serviceSubtotalKes: number;
  keyCollectFeeKes: number;
  totalAmountKes: number;
  paidAmountKes: number;
  balanceDueKes: number;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
  platformFeeKes: number;
  proPayoutKes: number;
  mpesaRef: string;
  mpesaPhone: string;
  status: BookingStatus;
  escrowStatus: EscrowStatus;
  proAccepted: boolean;
  rating?: number;
  reviewText?: string;
  disputeNote?: string;
  refundAmountKes?: number;
  cancellationReason?: string;
  createdAt: string;
}

export interface CustomerNotification {
  id: string;
  customerId: string;
  bookingId: string;
  parentOrderId?: string;
  serviceTitle: string;
  proName: string;
  proPhone: string;
  proAvatarUrl?: string;
  proRating?: number;
  etaMinutes?: number;
  estate: string;
  date: string;
  timeSlot: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  estate: string;
  apartmentNumber: string;
  gateInstructions: string;
}

export interface BookingDraft {
  serviceId: ServiceId;
  estate: string;
  scope: BookingScope;
  cartItems: CartItem[];
  date: string;
  timeSlot: string;
  apartmentNumber: string;
  gateInstructions: string;
  staggeredArrivalNotes: string;
  selectedProId: string;
  selectedProsByService: Partial<Record<ServiceId, string>>;
  autoAssignPros: boolean;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentMethod;
  step: 1 | 2 | 3;
}

export interface WithdrawalRecord {
  id: string;
  proId: string;
  amountKes: number;
  mpesaPhone: string;
  mpesaRef: string;
  date: string;
}
