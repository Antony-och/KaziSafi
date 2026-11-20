import React, {useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Home,
  KeyRound,
  Lock,
  MapPin,
  Radar,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  UserCheck,
  Wallet,
} from 'lucide-react';
import {useApp} from '../context/AppContext';

type AudienceTab = 'customer' | 'pro';

interface JourneyStep {
  number: string;
  titleEn: string;
  titleSw: string;
  summaryEn: string;
  summarySw: string;
  highlightsEn: string[];
  highlightsSw: string[];
  icon: React.ComponentType<{className?: string}>;
}

const CUSTOMER_STEPS: JourneyStep[] = [
  {
    number: '01',
    titleEn: 'Build Your Multi-Service Cart',
    titleSw: 'Unda Kikapu cha Huduma Nyingi',
    summaryEn:
      'Select one or combine multiple home services—such as Mama Fua Cleaning, Meal Prep, Plumbing, or Electrical—with upfront Kenyan Shilling (KES) pricing.',
    summarySw:
      'Chagua huduma moja au changanya huduma nyingi kama Usafi wa Mama Fua, Mapishi, Bomba au Umeme kwa bei wazi za KES.',
    highlightsEn: [
      'Pick exact scope by apartment size or task complexity',
      'Include optional add-ons like ironing, fridge care, or cabinets',
      'Bundle multiple tasks into one unified checkout cart',
    ],
    highlightsSw: [
      'Chagua ukubwa wa nyumba au aina ya kazi',
      'Ongeza huduma za ziada kama kupiga pasi au kusafisha friji',
      'Unganisha huduma nyingi katika malipo moja',
    ],
    icon: ShoppingCart,
  },
  {
    number: '02',
    titleEn: 'Set Estate, Schedule & KeyCollect',
    titleSw: 'Chagua Mtaa, Muda na KeyCollect',
    summaryEn:
      'Choose your estate, arrival window, and gate notes. Not home? Activate KeyCollect so a verified Pro collects keys from your guard or caretaker.',
    summarySw:
      'Weka mtaa wako, saa ya kufika na maelezo ya geti. Haupo nyumbani? Tumia KeyCollect kupokea msaada kupitia mlinzi wako.',
    highlightsEn: [
      'Live across Kilimani, Westlands, Karen, Syokimau, Nyali & more',
      'Optional staggered arrival notes when booking multiple pros',
      'KeyCollect pros leave their original National ID at your gate',
    ],
    highlightsSw: [
      'Inapatikana Kilimani, Westlands, Karen, Syokimau, Nyali na kwingineko',
      'Maelezo ya ziada ya ratiba kwa oda zenye huduma nyingi',
      'Wataalamu wa KeyCollect huacha Kitambulisho halisi getini',
    ],
    icon: CalendarClock,
  },
  {
    number: '03',
    titleEn: 'M-Pesa Checkout & Nearest-Pro Dispatch',
    titleSw: 'Malipo ya M-Pesa na Usambazaji wa Karibu',
    summaryEn:
      'Authorize a 50% deposit or 100% escrow payment via M-Pesa STK Push. Your paid order broadcasts immediately to the closest vetted Pros in your estate.',
    summarySw:
      'Lipa amana ya 50% au 100% kupitia M-Pesa STK Push. Oda yako inatumwa papo hapo kwa wataalamu waliokaguliwa walio karibu.',
    highlightsEn: [
      'Instant M-Pesa Express prompt to your Safaricom or Airtel line',
      'Smart matching filters by service skill, estate zone & online status',
      'No manual browsing delays—first qualified Pro to accept locks the job',
    ],
    highlightsSw: [
      'Ombi la M-Pesa Express linafika mara moja kwenye simu yako',
      'Mfumo unalinganisha ujuzi, mtaa na wataalamu walioko mtandaoni',
      'Mtaalamu wa kwanza aliye karibu kukubali anathibitishwa mara moja',
    ],
    icon: Radar,
  },
  {
    number: '04',
    titleEn: 'Live Confirmation, Tracking & Escrow Release',
    titleSw: 'Uthibitisho wa Papo Hapo na Malipo Salama',
    summaryEn:
      'Receive an instant SMS, WhatsApp, and Bell notification with your assigned Pro’s photo, phone number, and ETA. Release escrow only after work is done.',
    summarySw:
      'Pokea ujumbe wa SMS, WhatsApp na kengele yenye picha, namba na muda wa kufika. Toa malipo tu ukiridhika na kazi.',
    highlightsEn: [
      'Track 5 live stages: Searching → Confirmed → En Route → In Progress → Done',
      'Inspect work before tapping Confirm Completion & Rating (1–5 stars)',
      '100% refund protection if a Pro cancels or fails to show up',
    ],
    highlightsSw: [
      'Fuatilia hatua 5 za kazi mubashara kwenye My Home Hub',
      'Kagua kazi kabla ya kutoa alama za nyota na kufungua malipo',
      'Marejesho ya 100% endapo mtaalamu ataghairi au kutofika',
    ],
    icon: Bell,
  },
];

const PRO_STEPS: JourneyStep[] = [
  {
    number: '01',
    titleEn: 'Apply & Upload Vetting Credentials',
    titleSw: 'Jisajili na Tuma Nyaraka za Uthibitisho',
    summaryEn:
      'Create a Service Pro profile with your primary skill, working estates, Kenya National ID, DCI Certificate of Good Conduct, and a trusted guarantor.',
    summarySw:
      'Fungua akaunti ya Mtaalamu ukitumia ujuzi wako, mitaa unayofanyia kazi, Kitambulisho, cheti cha DCI na mdhamini.',
    highlightsEn: [
      'Select multiple estates where you can travel fast',
      'Upload trade licenses (EPRA / NCA) for plumbing & electrical',
      'Zero sign-up fees—built for dignified Kenyan home professionals',
    ],
    highlightsSw: [
      'Chagua mitaa mingi unayoweza kufika kwa haraka',
      'Pakia vyeti vya ufundi (EPRA / NCA) kwa umeme na bomba',
      'Hakuna ada ya kujisajili kwa wataalamu wa nyumbani',
    ],
    icon: FileCheck2,
  },
  {
    number: '02',
    titleEn: 'Trust Review & KeyCollect Qualification',
    titleSw: 'Ukaguzi wa Maadili na KeyCollect',
    summaryEn:
      'Our Trust Operations team verifies your National ID and DCI Good Conduct certificate. Top-rated Pros earn KeyCollect eligibility for unattended home visits.',
    summarySw:
      'Timu yetu hukagua Kitambulisho na cheti cha DCI. Wataalamu wenye alama za juu hupata sifa ya huduma za KeyCollect.',
    highlightsEn: [
      'Verified Pro badge increases customer trust & booking volume',
      'KeyCollect jobs carry higher net payouts for custody responsibility',
      'Transparent 80%–85% take-home earnings clearly shown before acceptance',
    ],
    highlightsSw: [
      'Beji ya uthibitisho huongeza imani na oda za wateja',
      'Kazi za KeyCollect huongeza mapato yako halisi',
      'Unaona mapato yako halisi (80%–85%) kabla ya kukubali kazi',
    ],
    icon: BadgeCheck,
  },
  {
    number: '03',
    titleEn: 'Accept Nearest Job Broadcasts',
    titleSw: 'Pokea Kazi za Karibu Mtandaoni',
    summaryEn:
      'Toggle Online in your Worker Portal to see live customer requests matching your service and estate, complete with distance tags and net KES payout.',
    summarySw:
      'Washa hali ya Online kwenye Worker Portal ili uone oda za karibu na mtaa wako pamoja na umbali na malipo yako.',
    highlightsEn: [
      'See exact estate, distance (km), scope & KeyCollect requirements upfront',
      'First-to-accept wins the dispatch—no middleman favoritism',
      'Filter requests by your active working zones anytime',
    ],
    highlightsSw: [
      'Ona mtaa, umbali (km), maelezo ya kazi na KeyCollect mapema',
      'Wa kwanza kukubali anapata kazi moja kwa moja',
      'Chuja maombi kulingana na maeneo unayofanyia kazi',
    ],
    icon: Briefcase,
  },
  {
    number: '04',
    titleEn: 'Deliver Great Care & Withdraw to M-Pesa',
    titleSw: 'Kamilisha Kazi na Toa Pesa kwa M-Pesa',
    summaryEn:
      'Tap Start Navigation, Start Job, and Mark Work Done. Once the customer confirms, your net earnings unlock instantly for M-Pesa withdrawal.',
    summarySw:
      'Bonyeza Start Navigation, Start Job, kisha Mark Work Done. Mteja akithibitisha, mapato yanatumwa moja kwa moja kwenye M-Pesa yako.',
    highlightsEn: [
      'Escrow guarantees the customer already funded the booking upfront',
      'Zero cash haggling or unpaid invoices at the doorstep',
      'Withdraw available KES balance directly to your Safaricom M-Pesa line',
    ],
    highlightsSw: [
      'Escrow inahakikisha malipo ya kazi yako tayari yamelipwa',
      'Hakuna ubishi wa pesa taslimu mlangoni baada ya kazi',
      'Toa salio lako la KES moja kwa moja kwenda M-Pesa yako',
    ],
    icon: Wallet,
  },
];

const FAQS = [
  {
    qEn: 'How does Automatic Nearest-Pro Dispatch work?',
    qSw: 'Usambazaji wa Kiotomatiki kwa Mtaalamu wa Karibu hufanyaje kazi?',
    aEn: 'Instead of asking you to guess or message dozens of profiles, KaziSafi broadcasts your paid booking immediately to verified, online Pros whose registered working zones cover your estate. The first matching Pro to accept is locked in, and you receive an instant SMS, WhatsApp, and in-app confirmation with their photo, phone number, and ETA.',
    aSw: 'Badala ya kubahatisha au kutafuta wataalamu mmoja mmoja, KaziSafi hutuma oda yako iliyolipwa mara moja kwa wataalamu waliokaguliwa walio karibu na mtaa wako. Wa kwanza kukubali anathibitishwa papo hapo na unapokea SMS, WhatsApp na taarifa yenye picha na namba yake.',
  },
  {
    qEn: 'How does M-Pesa Escrow protect my money?',
    qSw: 'M-Pesa Escrow inalindaje pesa zangu?',
    aEn: 'When you pay via M-Pesa Express (either a 50% deposit or 100% upfront), KaziSafi holds the funds securely in escrow rather than paying the worker immediately. Funds are only released to the Service Pro after you inspect the completed work in My Home Hub and confirm satisfaction.',
    aSw: 'Unapolipa kupitia M-Pesa Express (amana ya 50% au 100%), KaziSafi huhifadhi pesa hizo salama kwenye Escrow. Malipo yanatolewa kwa mtaalamu tu baada ya wewe kukagua kazi na kuthibitisha imekamilika vizuri.',
  },
  {
    qEn: 'Can I book a service when I am away at work?',
    qSw: 'Je, ninaweza kuweka nafasi ya huduma nikiwa kazini?',
    aEn: 'Yes. Enable KeyCollect during Step 1 or Step 2 of booking and provide your estate guard, caretaker, or neighbor contact. Only Admin-elected, top-rated Pros qualify for KeyCollect, and they are required to leave their original Kenya National ID at your gate while holding your keys.',
    aSw: 'Ndiyo. Washa huduma ya KeyCollect wakati wa kuweka nafasi na uweke namba ya mlinzi au msimamizi wa nyumba. Wataalamu waliochaguliwa kwa uaminifu wa hali ya juu pekee ndio hufanya KeyCollect, na huacha Kitambulisho chao halisi getini.',
  },
  {
    qEn: 'Can I combine multiple services in one checkout?',
    qSw: 'Je, ninaweza kuunganisha huduma nyingi katika malipo moja?',
    aEn: 'Yes. Use the "+ Add Service to Cart" button in Step 1 to bundle Mama Fua cleaning, meal prep, plumbing, or repairs into a single order. You make one combined M-Pesa checkout, and KaziSafi creates linked job dispatches so the right specialist handles each task.',
    aSw: 'Ndiyo. Tumia kitufe cha "+ Add Service to Cart" kuunganisha usafi, mapishi, bomba au ukarabati katika oda moja. Unalipa mara moja tu kwa M-Pesa na kila mtaalamu anapokea kazi yake.',
  },
  {
    qEn: 'What is the cancellation and no-show refund policy?',
    qSw: 'Sera ya kughairi nafasi au mtaalamu kutofika ikoje?',
    aEn: 'Cancellations 24+ hours before the scheduled slot receive a 100% full refund. Cancellations 12–24 hours ahead receive a 50% refund. Under 12 hours is non-refundable unless the Service Pro fails to arrive—Pro no-shows always receive a 100% full refund or priority rematch.',
    aSw: 'Ukighairi saa 24+ kabla ya huduma unapata marejesho ya 100%. Saa 12–24 kabla unapata 50%. Chini ya saa 12 hakuna marejesho, isipokuwa kama mtaalamu hatofika—ambapo unapata marejesho ya 100% papo hapo.',
  },
];

export const HowItWorksPage: React.FC = () => {
  const {language, t, navigate, openBooking} = useApp();
  const [audience, setAudience] = useState<AudienceTab>('customer');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const steps = audience === 'customer' ? CUSTOMER_STEPS : PRO_STEPS;
  const isSw = language === 'sw';

  return (
    <main className="bg-white min-h-[calc(100vh-4rem)] pb-20">
      {/* Header & Audience Switch */}
      <section className="pt-8 pb-12 border-b border-slate-200 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0F766E] mb-5 min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToHome')}</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
                {isSw ? 'Mwongozo Kamili wa KaziSafi' : 'End-to-End Platform Guide'}
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 mt-1"
                style={{fontSize: 'clamp(1.9rem, 3.4vw, 2.85rem)', textWrap: 'balance'}}
              >
                {t('howItWorksTitle')}
              </h1>
              <div className="mt-2.5 w-14 h-1 rounded-full bg-[#0F766E]" />
              <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                {isSw
                  ? 'Kuanzia kuweka huduma kwenye kikapu hadi uthibitisho wa mtaalamu wa karibu na ulinzi wa M-Pesa Escrow — hivi ndivyo KaziSafi inavyofanya kazi.'
                  : 'From multi-service cart checkout to instant nearest-Pro dispatch, DCI vetting, and M-Pesa Escrow release—explore how every visit stays safe and transparent.'}
              </p>
            </div>

            {/* Dual Audience Tab Switcher */}
            <div
              role="tablist"
              aria-label="How it works audience view"
              className="inline-flex rounded-xl bg-slate-200/70 p-1 self-start lg:self-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'customer'}
                onClick={() => setAudience('customer')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[42px] whitespace-nowrap ${
                  audience === 'customer'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{isSw ? 'Kwa Wateja' : 'For Households'}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'pro'}
                onClick={() => setAudience('pro')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[42px] whitespace-nowrap ${
                  audience === 'pro'
                    ? 'bg-white text-[#0F766E] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSw ? 'Kwa Wataalamu' : 'For Service Pros'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Step-by-Step Walkthrough */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              const title = isSw ? step.titleSw : step.titleEn;
              const summary = isSw ? step.summarySw : step.summaryEn;
              const highlights = isSw ? step.highlightsSw : step.highlightsEn;

              return (
                <article
                  key={step.number}
                  className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 text-[#0F766E] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-sm font-bold text-[#0F766E] bg-teal-50 border border-teal-200 rounded-md px-2.5 py-1 tabular-nums">
                        STEP {step.number}
                      </span>
                    </div>

                    <h2 className="font-display text-xl font-bold text-slate-900 mt-4">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{summary}</p>
                  </div>

                  <ul className="pt-4 border-t border-slate-100 space-y-2">
                    {highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Tier Kenyan Vetting & Home Safety Standard */}
      <section className="py-12 md:py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              {isSw ? 'Uthibitisho wa Usalama' : '3-Tier Trust Protocol'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              {isSw
                ? 'Kila Mtaalamu Hukaguliwa Kabla ya Kazi ya Kwanza'
                : 'Every Pro Is Vetted Before Their First Visit'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              {isSw
                ? 'Timu yetu ya uaminifu hukagua nyaraka zote rasmi za Kenya kabla ya kuwasha akaunti.'
                : 'No unverified workers enter your compound. Our Trust Operations team audits three layers before activating any Service Pro.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {t('badgeNationalId')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every Pro submits a valid Kenya National ID or Passport number with photo matching. For KeyCollect bookings, their original ID stays safely with your gate guard.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">{t('badgeDci')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We require an active Directorate of Criminal Investigations (DCI) Certificate of Good Conduct reference number and certificate document review prior to approval.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Guarantors &amp; Trade Licenses
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Verified Kenyan guarantor contacts plus specialized technical credentials (EPRA / NCA) for electricians and plumbers handling high-risk home systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* M-Pesa Escrow, KeyCollect & Cancellation Rules */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                M-Pesa Escrow Protection
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pay a <strong>50% deposit</strong> or <strong>100% upfront</strong> via Safaricom M-Pesa Express, Card, or Bank Transfer. Your money stays protected until work is signed off.
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1.5">
              <p className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>1. M-Pesa STK Push funds KaziSafi Escrow</span>
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>2. Pro completes task &amp; you inspect</span>
              </p>
              <p className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>3. Rate 1–5 ★ to release Pro payout</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                KeyCollect Handover
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Away from your apartment? Assign your gate guard, caretaker, or neighbor to hand over keys to an Admin-elected KeyCollect Pro.
            </p>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Gate Security Standard:</p>
              <p>
                Pro receives SMS/WhatsApp verification and leaves their <strong>original Kenya National ID</strong> at the gate. Fee: 40% of service subtotal (min KES 500).
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Fair Cancellation Rules
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>24+ hours before service</span>
                <strong className="text-[#0F766E] tabular-nums">100% Refund</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>12–24 hours before service</span>
                <strong className="text-amber-700 tabular-nums">50% Refund</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-slate-100">
                <span>Under 12 hours</span>
                <strong className="text-slate-600 tabular-nums">No Refund</strong>
              </li>
              <li className="flex justify-between pt-1">
                <span>Service Pro No-Show</span>
                <strong className="text-[#0F766E] tabular-nums">100% Refund</strong>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {isSw ? 'Maswali Yanayoulizwa Mara kwa Mara' : 'Frequently Asked Questions'}
            </h2>
            <div className="mt-2 w-12 h-1 rounded-full bg-[#0F766E]" />
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.qEn}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-slate-900">
                      {isSw ? faq.qSw : faq.qEn}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#0F766E]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {isSw ? faq.aSw : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="pt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded-2xl bg-[#0F766E] text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
              {isSw
                ? 'Uko tayari kuweka nafasi ya mtaalamu mtaani kwako?'
                : 'Ready to book a vetted Pro in your estate?'}
            </h2>
            <p className="mt-2 text-sm text-teal-100">
              {isSw
                ? 'Chagua huduma, lipa kupitia M-Pesa Escrow, na upokee uthibitisho wa papo hapo.'
                : 'Bundle your home tasks, pay safely via M-Pesa Express, and receive instant Pro confirmation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openBooking('cleaning')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#0F766E] hover:bg-teal-50 transition-colors min-h-[46px] whitespace-nowrap"
            >
              <span>{t('findAPro')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-300/60 bg-teal-800/40 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800/70 transition-colors min-h-[46px] whitespace-nowrap"
            >
              <span>{t('viewFullPriceList')}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
