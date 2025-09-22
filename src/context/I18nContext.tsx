import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

type Locale = 'en' | 'fr';

const translations = {
  en: {
    app: {
      name: 'ProList Mini',
      tagline: 'Fast preorder companion',
    },
    common: {
      continue: 'Continue',
      account: 'Account',
      signOut: 'Sign out',
      changeLanguage: 'Change language',
      language: 'Language',
      cancel: 'Cancel',
      close: 'Close',
    },
    auth: {
      welcome: 'Welcome to ProList Mini',
      intro: 'Sign in with your phone number or email to get started.',
      contactLabel: 'Phone or email',
      contactPlaceholder: 'Enter your phone number or email',
      contactHint: 'Enter phone or email',
      sendCode: 'Send code',
      sendDisabled: 'Connect to the internet to request a code.',
      useDemo: 'Use demo account',
      offlineBanner: "You're offline. Use the demo account to keep exploring.",
      stepOne: '1/2 Verify',
      stepTwo: '2/2 Choose role',
      otpTitle: 'Enter the 6-digit code',
      otpSubtitle: "We\'ve sent a 6-digit code to {{contact}}.",
      verifyCta: 'Verify code',
      wrongCode: 'Wrong code. Try again.',
      resendIn: 'Resend in {{time}}',
      resendNow: 'Resend code',
      changeContact: 'Change contact',
      codeLabel: 'One-time code',
    },
    roles: {
      prompt: 'How do you want to use ProList Mini today?',
      description: 'Pick the workspace you need right now — you can switch anytime.',
      buyerTitle: 'Buyer',
      buyerSubtitle: 'Shop listings and track pooled orders.',
      importerTitle: 'Importer',
      importerSubtitle: 'Create drops and manage preorder pools.',
      buyerBadge: 'Buyer mode',
      importerBadge: 'Importer mode',
      buyerSummary: 'Browse curated products and keep an eye on pooled shipments.',
      importerSummary: 'Launch preorder pools, monitor commitments, and prep paperwork.',
      switchTitle: 'Switch role',
      switchNote: 'Tap a mode to jump right in — updates instantly.',
    },
    dashboard: {
      buyerHeading: 'Buyer home',
      buyerWelcome: 'Good to see you, {{name}}.',
      buyerActionsTitle: 'Quick actions',
      buyerActionBrowse: 'Browse listings',
      buyerActionTrack: 'Track orders',
      buyerActionSupport: 'Request support',
      importerHeading: 'Importer dashboard',
      importerWelcome: 'Welcome back, {{name}}.',
      importerStatusVerified: 'Verified Importer',
      importerStatusPending: 'Verification pending',
      importerActionsTitle: 'Next steps',
      importerActionCreate: 'Create preorder',
      importerActionReview: 'Review commitments',
      importerActionDocs: 'Upload documents',
      statusTitle: 'Status overview',
      buyerStatusPool: 'Pools joined',
      buyerStatusDeliveries: 'Deliveries this month',
      buyerStatusWallet: 'Wallet balance',
      importerStatusActive: 'Active pools',
      importerStatusLogistics: 'Shipments in transit',
      importerStatusBalance: 'Escrow balance',
    },
  },
  fr: {
    app: {
      name: 'ProList Mini',
      tagline: 'Compagnon de précommande rapide',
    },
    common: {
      continue: 'Continuer',
      account: 'Compte',
      signOut: 'Se déconnecter',
      changeLanguage: 'Changer de langue',
      language: 'Langue',
      cancel: 'Annuler',
      close: 'Fermer',
    },
    auth: {
      welcome: 'Bienvenue sur ProList Mini',
      intro: 'Connectez-vous avec votre numéro ou votre email pour démarrer.',
      contactLabel: 'Téléphone ou email',
      contactPlaceholder: 'Saisissez votre téléphone ou votre email',
      contactHint: 'Saisissez votre téléphone ou votre email',
      sendCode: 'Envoyer le code',
      sendDisabled: 'Connectez-vous à internet pour demander un code.',
      useDemo: 'Utiliser le compte démo',
      offlineBanner: "Vous êtes hors connexion. Utilisez le compte démo pour continuer.",
      stepOne: '1/2 Vérifier',
      stepTwo: '2/2 Choisir le rôle',
      otpTitle: 'Entrez le code à 6 chiffres',
      otpSubtitle: 'Nous avons envoyé un code à 6 chiffres à {{contact}}.',
      verifyCta: 'Valider le code',
      wrongCode: 'Code incorrect. Réessayez.',
      resendIn: 'Renvoyer dans {{time}}',
      resendNow: 'Renvoyer le code',
      changeContact: 'Modifier le contact',
      codeLabel: 'Code à usage unique',
    },
    roles: {
      prompt: 'Comment souhaitez-vous utiliser ProList Mini aujourd\'hui ?',
      description: 'Choisissez l\'espace de travail voulu — vous pourrez changer ensuite.',
      buyerTitle: 'Acheteur',
      buyerSubtitle: 'Achetez des offres et suivez vos commandes groupées.',
      importerTitle: 'Importateur',
      importerSubtitle: 'Créez des drops et gérez les précommandes.',
      buyerBadge: 'Mode Acheteur',
      importerBadge: 'Mode Importateur',
      buyerSummary: 'Parcourez les produits et surveillez vos expéditions groupées.',
      importerSummary: 'Lancez des précommandes, suivez les engagements et préparez les dossiers.',
      switchTitle: 'Changer de mode',
      switchNote: 'Touchez un mode pour y accéder immédiatement — mise à jour instantanée.',
    },
    dashboard: {
      buyerHeading: 'Accueil Acheteur',
      buyerWelcome: 'Ravi de vous revoir, {{name}}.',
      buyerActionsTitle: 'Actions rapides',
      buyerActionBrowse: 'Voir les offres',
      buyerActionTrack: 'Suivre les commandes',
      buyerActionSupport: 'Contacter le support',
      importerHeading: 'Tableau Importateur',
      importerWelcome: 'Bon retour, {{name}}.',
      importerStatusVerified: 'Importateur vérifié',
      importerStatusPending: 'Vérification en cours',
      importerActionsTitle: 'Étapes suivantes',
      importerActionCreate: 'Créer une précommande',
      importerActionReview: 'Revoir les engagements',
      importerActionDocs: 'Téléverser des documents',
      statusTitle: 'Vue d\'ensemble',
      buyerStatusPool: 'Pools rejoints',
      buyerStatusDeliveries: 'Livraisons ce mois-ci',
      buyerStatusWallet: 'Solde portefeuille',
      importerStatusActive: 'Pools actifs',
      importerStatusLogistics: 'Expéditions en transit',
      importerStatusBalance: 'Solde en séquestre',
    },
  },
} as const;

type TranslationDict = (typeof translations)['en'];

type InterpolationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: InterpolationValues) => string;
};

const STORAGE_KEY = 'pl.locale';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getPreferredLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'fr') return stored;
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  if (browser === 'fr') return 'fr';
  return 'en';
};

const resolve = (dict: TranslationDict, key: string): string | undefined => {
  return key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict) as string | undefined;
};

const format = (template: string, vars?: InterpolationValues) => {
  if (!vars) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, token) => {
    const value = vars[token.trim()];
    return value !== undefined ? String(value) : '';
  });
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => getPreferredLocale());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(prev => {
      if (prev === next) return prev;
      trackEvent('lang_change', { locale: next });
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, vars?: InterpolationValues) => {
      const primary = resolve(translations[locale], key);
      if (primary) return format(primary, vars);
      const fallback = resolve(translations.en, key);
      return fallback ? format(fallback, vars) : key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
