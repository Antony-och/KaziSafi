import React, {useEffect, useRef, useState} from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  X,
} from 'lucide-react';
import {useApp} from '../context/AppContext';
import {PWAInstallButton} from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    route,
    navigate,
    currentUser,
    logout,
    bookingDraft,
    openCart,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const cartCount = bookingDraft.cartItems.length;

  const userNotifications = currentUser
    ? notifications.filter((n) =>
        currentUser.role === 'customer' ? n.customerId === currentUser.id : true
      )
    : [];
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const roleDisplay =
    currentUser?.role === 'customer'
      ? t('customerRoleLabel')
      : currentUser?.role === 'pro'
      ? t('proRoleLabel')
      : t('adminRoleLabel');

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    : 'KS';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavClick = (hash?: string) => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setUserMenuOpen(false);
    navigate('/', hash);
  };

  return (
    <header className="md:sticky md:top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Left: Brand Logo + Nav Links */}
        <div className="flex items-center gap-5 lg:gap-8 min-w-0">
          <button
            type="button"
            onClick={() => handleNavClick()}
            aria-label="KaziSafi Home"
            className="flex items-center text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-lg py-1"
          >
            <img
              src="/assets/aistudio/kazisafi-logo-horizontal-color_dd737d41.png"
              alt="KaziSafi"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </button>

          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => handleNavClick()}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                route === '/' ? 'border-[#0F766E] text-slate-900' : 'border-transparent'
              }`}
            >
              {t('navHome')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setNotifOpen(false);
                setUserMenuOpen(false);
                navigate('/services');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                route === '/services'
                  ? 'border-[#0F766E] text-slate-900'
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              {t('navServices')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setNotifOpen(false);
                setUserMenuOpen(false);
                navigate('/how-it-works');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                route === '/how-it-works'
                  ? 'border-[#0F766E] text-slate-900'
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              {t('navHowItWorks')}
            </button>
          </nav>
        </div>

        {/* Right: Cart + Language Toggle + Auth / User Account Dropdown */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3 shrink-0">
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open Booking Cart (${cartCount} items)`}
            className={`relative inline-flex items-center justify-center min-w-[40px] min-h-[40px] px-2.5 rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              cartCount > 0 || route === '/book'
                ? 'border-[#0F766E]/40 bg-teal-50/70 text-[#0F766E]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-[#0F766E] text-[11px] font-bold text-white tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          <PWAInstallButton variant="header" />

          <div
            role="group"
            aria-label="Language switch"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                language === 'sw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              SW
            </button>
          </div>

          {!currentUser ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                {t('login')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0F766E] rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                {t('signup')}
              </button>
            </>
          ) : (
            <>
              {/* Notification Bell with Unread Badge */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setNotifOpen((v) => !v);
                  }}
                  aria-label={`Notifications (${unreadCount} unread)`}
                  aria-expanded={notifOpen}
                  className="relative inline-flex items-center justify-center min-w-[40px] min-h-[40px] px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-[#0F766E] text-[11px] font-bold text-white tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-slate-900">
                        Booking Confirmations
                      </span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-xs font-semibold text-[#0F766E] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {userNotifications.length === 0 ? (
                        <p className="p-4 text-xs text-slate-500 text-center">
                          No booking confirmations yet.
                        </p>
                      ) : (
                        userNotifications.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                              navigate('/dashboard');
                            }}
                            className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                              !n.read ? 'bg-teal-50/50' : ''
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">
                                {n.bookingId} · {n.serviceTitle}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <p className="text-[11px] text-[#0F766E] font-medium mt-1 tabular-nums">
                                Pro: {n.proName} ({n.proPhone})
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account Dropdown (User + Role + Dashboard + Log Out) */}
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    setUserMenuOpen((v) => !v);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className={`inline-flex items-center gap-2 min-h-[40px] pl-1.5 pr-2.5 py-1 rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
                    userMenuOpen || route === '/dashboard'
                      ? 'border-[#0F766E]/40 bg-teal-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {userInitials}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 max-w-[135px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="hidden lg:inline-flex items-center rounded-md bg-teal-50 border border-teal-200 px-1.5 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                    {roleDisplay}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {currentUser.email || currentUser.phone}
                      </p>
                      <span className="inline-block mt-1.5 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                        {roleDisplay}
                      </span>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/dashboard');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                          route === '/dashboard'
                            ? 'bg-teal-50 text-[#0F766E]'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#0F766E] shrink-0" />
                        <span>{t('dashboard')}</span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Right Controls */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={() => {
                markAllNotificationsRead();
                navigate('/dashboard');
              }}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative min-w-[44px] min-h-[44px] px-2 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-[#0F766E] text-[10px] font-bold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openCart();
            }}
            aria-label={`Open Booking Cart (${cartCount} items)`}
            className={`relative min-w-[44px] min-h-[44px] px-2 flex items-center justify-center rounded-lg border transition-colors ${
              cartCount > 0 || route === '/book'
                ? 'border-[#0F766E]/40 bg-teal-50/70 text-[#0F766E]'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-[#0F766E] text-[10px] font-bold text-white tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md ${
                language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('sw')}
              className={`px-2 py-1 rounded-md ${
                language === 'sw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              SW
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNavClick()}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[44px]"
            >
              {t('navHome')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/services');
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[44px]"
            >
              {t('navServices')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/how-it-works');
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[44px]"
            >
              {t('navHowItWorks')}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="py-2.5 px-4 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg min-h-[44px]"
                >
                  {t('login')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  className="py-2.5 px-4 text-sm font-semibold text-white bg-[#0F766E] rounded-lg min-h-[44px]"
                >
                  {t('signup')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-3 py-1.5 text-sm text-slate-700 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{currentUser.name}</span>
                  <span className="text-xs font-semibold text-[#0F766E]">{roleDisplay}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="py-2.5 px-4 text-sm font-semibold text-white bg-[#0F766E] rounded-lg min-h-[44px]"
                  >
                    {t('dashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="py-2.5 px-4 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg min-h-[44px]"
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
            <div className="pt-1">
              <PWAInstallButton variant="header" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
