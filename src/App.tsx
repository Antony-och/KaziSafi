import React from 'react';
import {CalendarPlus, CheckCircle2, Grid, Home, LayoutDashboard, LogIn, X} from 'lucide-react';
import {AppProvider, useApp} from './context/AppContext';
import {Navbar} from './components/Navbar';
import {LandingPage} from './components/LandingPage';
import {ServicesCatalogPage} from './components/ServicesCatalogPage';
import {HowItWorksPage} from './components/HowItWorksPage';
import {AuthPages} from './components/AuthPages';
import {BookingWizard} from './components/BookingWizard';
import {CustomerDashboard} from './components/CustomerDashboard';
import {ProDashboard} from './components/ProDashboard';
import {AdminDashboard} from './components/AdminDashboard';
import {OfflineIndicator} from './components/OfflineIndicator';
import {Footer} from './components/Footer';

const AppShell: React.FC = () => {
  const {
    route,
    currentUser,
    navigate,
    openBooking,
    t,
    toastNotification,
    dismissToastNotification,
  } = useApp();

  const renderView = () => {
    if (route === '/services') return <ServicesCatalogPage />;
    if (route === '/how-it-works') return <HowItWorksPage />;
    if (route === '/login') return <AuthPages mode="login" />;
    if (route === '/signup') return <AuthPages mode="signup" />;
    if (route === '/book') return <BookingWizard />;
    if (route === '/dashboard') {
      if (!currentUser) return <AuthPages mode="login" />;
      if (currentUser.role === 'pro') return <ProDashboard />;
      if (currentUser.role === 'admin') return <AdminDashboard />;
      return <CustomerDashboard />;
    }
    return <LandingPage />;
  };

  const isAuthView =
    route === '/login' || route === '/signup' || (route === '/dashboard' && !currentUser);

  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${
        isAuthView ? '' : 'pb-14 md:pb-0'
      }`}
    >
      {!isAuthView && <Navbar />}
      <div className="flex-1">{renderView()}</div>
      {!isAuthView && <Footer />}

      {/* Real-Time Customer Confirmation Toast & Simulated SMS/WhatsApp Alert */}
      {toastNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 left-4 sm:left-auto sm:w-[400px] z-50 rounded-2xl bg-slate-900 text-white p-4 shadow-2xl border border-slate-700"
        >
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                  SMS &amp; WhatsApp Dispatch Alert
                </span>
                <button
                  type="button"
                  onClick={dismissToastNotification}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-100 leading-relaxed">
                {toastNotification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Thumb-Zone Bottom Bar (<= 56px = 8.4% of mobile viewport) */}
      {!isAuthView && (
        <nav
          aria-label="Mobile quick navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 items-center"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              route === '/' ? 'text-[#0F766E]' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>{t('navHome')}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              route === '/services' ? 'text-[#0F766E]' : 'text-slate-500'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => openBooking('cleaning', currentUser?.defaultEstate)}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              route === '/book' ? 'text-[#0F766E]' : 'text-slate-500'
            }`}
          >
            <CalendarPlus className="w-5 h-5" />
            <span>Book</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(currentUser ? '/dashboard' : '/login')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              route === '/dashboard' ? 'text-[#0F766E]' : 'text-slate-500'
            }`}
          >
            {currentUser ? <LayoutDashboard className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            <span>{currentUser ? t('dashboard') : t('login')}</span>
          </button>
        </nav>
      )}

      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
