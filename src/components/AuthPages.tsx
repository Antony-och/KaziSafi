import React, {useState} from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Lock,
  Mail,
  MapPin,
  Phone,
  Upload,
  User,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {KENYAN_ESTATES, KENYAN_LOCATIONS_BY_CITY} from '../data/kazisafiData';
import {ServiceId} from '../types/kazisafi';

export const AuthPages: React.FC<{mode: 'login' | 'signup'}> = ({mode}) => {
  const {
    language,
    setLanguage,
    t,
    navigate,
    services,
    loginWithCredentials,
    loginAsDemoRole,
    signupCustomer,
    signupPro,
    pendingCheckoutReturn,
  } = useApp();

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Signup state
  const [accountType, setAccountType] = useState<'customer' | 'pro'>('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [defaultEstate, setDefaultEstate] = useState('Kilimani');
  const [primaryService, setPrimaryService] = useState<ServiceId>('cleaning');
  const [selectedEstates, setSelectedEstates] = useState<string[]>([
    'Kilimani',
    'Westlands',
    'Kileleshwa',
  ]);
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [nationalIdDocName, setNationalIdDocName] = useState('');
  const [goodConductDocName, setGoodConductDocName] = useState('');
  const [tradeCertName, setTradeCertName] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [isOver18, setIsOver18] = useState(true);
  const [signupError, setSignupError] = useState('');

  const toggleEstate = (est: string) => {
    setSelectedEstates((prev) =>
      prev.includes(est) ? prev.filter((item) => item !== est) : [...prev, est]
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!identifier.trim() || !loginPassword.trim()) {
      setLoginError('Please enter your email or phone number and password.');
      return;
    }
    const res = loginWithCredentials(identifier, loginPassword);
    if (!res.ok && res.error) {
      setLoginError(res.error);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (!fullName.trim() || !phone.trim() || !email.trim() || password.length < 6) {
      setSignupError('Please fill all required fields (password at least 6 characters).');
      return;
    }

    if (accountType === 'customer') {
      const res = signupCustomer({
        name: fullName,
        phone,
        email,
        password,
        defaultEstate,
      });
      if (!res.ok && res.error) setSignupError(res.error);
    } else {
      if (!nationalIdNumber.trim()) {
        setSignupError('Please enter your Kenyan National ID or Passport number.');
        return;
      }
      if (!isOver18) {
        setSignupError('Service Pros must be 18 years or older with a smartphone.');
        return;
      }
      if (selectedEstates.length === 0) {
        setSignupError('Select at least one preferred working estate/zone.');
        return;
      }
      const res = signupPro({
        name: fullName,
        phone,
        email,
        password,
        primaryService,
        estates: selectedEstates,
        nationalIdNumber,
        nationalIdDocName: nationalIdDocName || 'national_id_copy.pdf',
        goodConductDocName: goodConductDocName || 'dci_good_conduct_cert.pdf',
        tradeCertName: tradeCertName || undefined,
        guarantorName: guarantorName.trim() || undefined,
        guarantorPhone: guarantorPhone.trim() || undefined,
      });
      if (!res.ok && res.error) setSignupError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-5xl w-full mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F766E] transition-colors min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToHome')}</span>
          </button>

          <div
            role="group"
            aria-label="Language switch"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                language === 'sw'
                  ? 'bg-[#0F766E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SW
            </button>
          </div>
        </div>

        {pendingCheckoutReturn && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span>
              Your booking selection is saved. Sign in or create a Customer account to complete M-Pesa Escrow payment.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {/* Left Trust Panel (Desktop) */}
          <div className="lg:col-span-5 bg-[#0F766E] text-white p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center rounded-xl bg-white px-3.5 py-2 mb-8 shadow-xs">
                <img
                  src="/assets/aistudio/kazisafi-logo-horizontal-color_dd737d41.png"
                  alt="KaziSafi"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                {mode === 'login'
                  ? 'Welcome back to trusted Kenyan home care.'
                  : 'Join Kenya’s vetted home care marketplace.'}
              </h2>
              <p className="mt-3 text-sm text-teal-100 leading-relaxed">
                Every Service Pro completes National ID / Passport verification, DCI Certificate of Good Conduct screening, and guarantor checks.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 space-y-3 text-xs text-teal-50">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-teal-200 shrink-0" />
                <span>National ID &amp; DCI Good Conduct Screening</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-200 shrink-0" />
                <span>50% Deposit or 100% M-Pesa Escrow Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-200 shrink-0" />
                <span>Nairobi, Mombasa, Nakuru, Kisumu &amp; Eldoret</span>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10">
            {mode === 'login' ? (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('login')}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      Sign in with your email or Safaricom/Airtel number.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="login-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email or Phone Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-id"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="wanjiku@kazisafi.co.ke or +254 712 345 678"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setForgotSent(true)}
                        className="text-xs font-semibold text-[#0F766E] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-pass"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  {forgotSent && (
                    <div className="rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2.5 text-xs text-teal-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                      <span>
                        If an account matches that contact, a password reset SMS &amp; email link has been queued.
                      </span>
                    </div>
                  )}

                  {loginError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full min-h-[48px] rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
                  >
                    {t('login')}
                  </button>
                </form>

                {/* 3 Compact 1-Click Test Account Links */}
                <div className="mt-7 pt-6 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Quick test access for evaluation:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loginAsDemoRole('customer')}
                      className="text-xs font-semibold text-[#0F766E] hover:text-teal-900 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/80 rounded-lg px-3 py-2 transition-colors"
                    >
                      Sign in as Demo Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => loginAsDemoRole('pro')}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      Sign in as Demo Service Pro
                    </button>
                    <button
                      type="button"
                      onClick={() => loginAsDemoRole('admin')}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                    >
                      Sign in as Demo Admin
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-sm text-slate-600">
                  New to KaziSafi?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="font-semibold text-[#0F766E] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('signup')}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Choose whether you are booking home services or applying as a vetted Service Pro.
                </p>

                {/* Account Type Toggle */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[44px] ${
                      accountType === 'customer'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span>I need home services</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('pro')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[44px] ${
                      accountType === 'pro'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span>I want to work as a Pro</span>
                  </button>
                </div>

                <form onSubmit={handleSignupSubmit} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="signup-name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Wanjiku Mwangi"
                          className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="signup-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kenyan Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="signup-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+254 712 345 678"
                          className="w-full min-h-[44px] pl-10 pr-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.co.ke"
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                    <div>
                      <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Password
                      </label>
                      <input
                        id="signup-password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                      />
                    </div>
                  </div>

                  {accountType === 'customer' ? (
                    <div>
                      <label htmlFor="signup-estate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Default Estate / Area
                      </label>
                      <select
                        id="signup-estate"
                        value={defaultEstate}
                        onChange={(e) => setDefaultEstate(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
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
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          Service Pro Vetting Credentials
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Verification</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="pro-service" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Primary Service Category
                          </label>
                          <select
                            id="pro-service"
                            value={primaryService}
                            onChange={(e) => setPrimaryService(e.target.value as ServiceId)}
                            className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                          >
                            {services.map((srv) => (
                              <option key={srv.id} value={srv.id}>
                                {language === 'sw' ? srv.titleSw : srv.titleEn}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="pro-id-num" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            National ID / Passport No.
                          </label>
                          <input
                            id="pro-id-num"
                            type="text"
                            required
                            value={nationalIdNumber}
                            onChange={(e) => setNationalIdNumber(e.target.value)}
                            placeholder="e.g. 32940182"
                            className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                          />
                        </div>
                      </div>

                      {/* Preferred Working Estates / Zones Multi-Select */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="block text-xs font-semibold text-slate-700">
                            Preferred Working Estates / Zones
                          </span>
                          <span className="text-[11px] font-medium text-[#0F766E] tabular-nums">
                            {selectedEstates.length} selected
                          </span>
                        </div>
                        <div className="max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 flex flex-wrap gap-1.5">
                          {KENYAN_ESTATES.map((est) => {
                            const active = selectedEstates.includes(est);
                            return (
                              <button
                                key={est}
                                type="button"
                                onClick={() => toggleEstate(est)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 p-3.5 flex items-center gap-3 transition-colors">
                          <Upload className="w-4 h-4 text-[#0F766E] shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold text-slate-800">
                              National ID Copy (Front &amp; Back)
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {nationalIdDocName || 'Upload PDF or JPG'}
                            </span>
                          </div>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              setNationalIdDocName(e.target.files?.[0]?.name || 'national_id_scan.pdf')
                            }
                          />
                        </label>

                        <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 p-3.5 flex items-center gap-3 transition-colors">
                          <FileText className="w-4 h-4 text-[#0F766E] shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold text-slate-800">
                              DCI Good Conduct
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {goodConductDocName || 'Upload eCitizen PCC'}
                            </span>
                          </div>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              setGoodConductDocName(e.target.files?.[0]?.name || 'dci_pcc_cert.pdf')
                            }
                          />
                        </label>
                      </div>

                      {(primaryService === 'electricians' || primaryService === 'plumbers') && (
                        <label className="cursor-pointer rounded-xl border border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 p-3.5 flex items-center gap-3 transition-colors">
                          <BadgeCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                          <div className="min-w-0">
                            <span className="block text-xs font-semibold text-slate-800">
                              Trade Certificate (EPRA / NCA / NITA)
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {tradeCertName || 'Required for Electricians & Plumbers'}
                            </span>
                          </div>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              setTradeCertName(e.target.files?.[0]?.name || 'trade_certificate.pdf')
                            }
                          />
                        </label>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Guarantor / Reference Name"
                          value={guarantorName}
                          onChange={(e) => setGuarantorName(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-xs"
                        />
                        <input
                          type="tel"
                          placeholder="Guarantor Phone (+254 7XX...)"
                          value={guarantorPhone}
                          onChange={(e) => setGuarantorPhone(e.target.value)}
                          className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOver18}
                          onChange={(e) => setIsOver18(e.target.checked)}
                          className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                        />
                        <span>I confirm I am 18+ years old with smartphone &amp; internet access.</span>
                      </label>
                    </div>
                  )}

                  {signupError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                      {signupError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full min-h-[48px] rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
                  >
                    {accountType === 'customer'
                      ? 'Create Customer Account'
                      : 'Submit Pro Application'}
                  </button>
                </form>

                <p className="mt-5 text-sm text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#0F766E] hover:underline"
                  >
                    {t('login')}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
