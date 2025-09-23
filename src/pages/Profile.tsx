import { useEffect, useMemo, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  demoBuyerProfile,
  demoImporterProfile,
  loadBuyerProfile,
  loadImporterProfile,
  saveBuyerProfile,
  saveImporterProfile,
  type BuyerProfile,
  type ImporterProfile,
  type VerificationStep,
} from '@/lib/profile-data';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { LanguageToggle } from '@/components/shell/AccountControls';

type EditState =
  | {
      mode: 'buyer' | 'importer';
      field:
        | 'name'
        | 'phone'
        | 'email'
        | 'deliveryNote'
        | 'storeName'
        | 'contactName'
        | 'storePhone'
        | 'storeEmail'
        | 'bio';
      label: string;
      description?: string;
      value: string;
      type: 'text' | 'textarea';
    }
  | {
      mode: 'buyer' | 'importer';
      field: 'defaultPickup';
      label: string;
      type: 'pickup';
    };

const SectionCard = ({
  value,
  title,
  subtitle,
  children,
}: {
  value: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <AccordionItem
    value={value}
    className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
  >
    <AccordionTrigger className="px-5 py-4 text-left text-base font-semibold text-foreground">
      <div className="flex flex-col gap-1 text-left">
        <span>{title}</span>
        {subtitle ? (
          <span className="text-sm font-normal text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-5 pb-5">
      <div className="mt-2 space-y-4">{children}</div>
    </AccordionContent>
  </AccordionItem>
);

const InfoRow = ({
  label,
  value,
  hint,
  onClick,
  actionLabel,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  onClick?: () => void;
  actionLabel?: string;
}) => {
  const interactive = Boolean(onClick);
  const Wrapper = interactive ? 'button' : 'div';

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-left shadow-soft transition-all',
        interactive
          ? 'hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px]'
          : 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <div className="text-sm text-muted-foreground">{value}</div>
          {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
        </div>
        {interactive ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            {actionLabel ?? 'Edit'}
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </Wrapper>
  );
};

const QuickActionButton = ({
  label,
  description,
  icon: Icon,
  onClick,
  muted,
  badge,
}: {
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  muted?: boolean;
  badge?: string | null;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'group flex h-full flex-col gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px]'
    )}
  >
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft transition-colors',
          muted ? 'bg-muted text-muted-foreground' : 'group-hover:bg-primary group-hover:text-primary-foreground',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      {badge ? (
        <Badge variant="outline" className="rounded-full border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium">
          {badge}
        </Badge>
      ) : null}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </button>
);

const computeStepProgress = (steps: VerificationStep[]) => {
  const completed = steps.filter(step => step.status === 'complete').length;
  return Math.round((completed / steps.length) * 100);
};

const Profile = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const { t, locale } = useI18n();

  const mode: 'buyer' | 'importer' = session?.role ?? 'buyer';

  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [importerProfile, setImporterProfile] = useState<ImporterProfile | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep | null>(null);

  const activeBuyer = buyerProfile ?? demoBuyerProfile;
  const activeImporter = importerProfile ?? demoImporterProfile;

  useEffect(() => {
    if (mode === 'buyer') {
      setBuyerProfile(loadBuyerProfile());
    } else {
      setImporterProfile(loadImporterProfile());
    }
    trackEvent('profile_view', { mode });
  }, [mode]);

  useEffect(() => {
    if (!editState) return;
    trackEvent('profile_edit_open', { field: editState.field, mode: editState.mode });
  }, [editState]);

  useEffect(() => {
    if (!verificationStep) return;
    trackEvent('kyc_step_view', { step: verificationStep.id });
  }, [verificationStep]);

  const maskedContact = useMemo(() => {
    if (mode === 'buyer') {
      return `${activeBuyer.maskedPhone} • ${activeBuyer.maskedEmail}`;
    }
    return `${activeImporter.maskedPhone} • ${activeImporter.maskedEmail}`;
  }, [mode, activeBuyer, activeImporter]);

  const headerName = useMemo(() => {
    if (mode === 'buyer') {
      return activeBuyer.name || session?.displayName || demoBuyerProfile.name;
    }
    return activeImporter.storeName || session?.displayName || demoImporterProfile.storeName;
  }, [mode, activeBuyer, activeImporter, session]);

  const initials = headerName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const buyerDefaultPickup = activeBuyer.pickups.find(pickup => pickup.id === activeBuyer.defaultPickupId) ??
    demoBuyerProfile.pickups[0];

  const quickActions = mode === 'buyer'
    ? [
        {
          label: t('profile.actions.orders'),
          description: t('profile.actions.ordersHint'),
          icon: Package,
        },
        {
          label: t('profile.actions.pickups'),
          description: t('profile.actions.pickupsHint'),
          icon: MapPin,
        },
        {
          label: t('profile.actions.paymentsSoon'),
          description: t('profile.actions.paymentsSoonHint'),
          icon: CreditCard,
          badge: t('profile.badges.comingSoon'),
        },
        {
          label: t('profile.actions.support'),
          description: t('profile.actions.supportHint'),
          icon: LifeBuoy,
        },
      ]
    : [
        {
          label: t('profile.actions.createListing'),
          description: t('profile.actions.createListingHint'),
          icon: PlusCircle,
          onClick: () => navigate('/importer/create'),
        },
        {
          label: t('profile.actions.dashboard'),
          description: t('profile.actions.dashboardHint'),
          icon: LayoutDashboard,
          onClick: () => navigate('/'),
        },
        {
          label: t('profile.actions.payouts'),
          description: t('profile.actions.payoutsHint'),
          icon: Banknote,
          badge: t('profile.badges.comingSoon'),
        },
        {
          label: t('profile.actions.support'),
          description: t('profile.actions.supportHint'),
          icon: LifeBuoy,
        },
      ];

  const openEdit = (state: EditState) => {
    setEditState(state);
  };

  const handleSaveEdit = () => {
    if (!editState) return;

    if (editState.type === 'text' || editState.type === 'textarea') {
      const nextValue = editValue.trim();
      if (editState.mode === 'buyer') {
        setBuyerProfile(prev => {
          const base = prev ?? loadBuyerProfile();
          let updated: BuyerProfile = base;
          if (editState.field === 'name') {
            updated = { ...base, name: nextValue };
          } else if (editState.field === 'phone') {
            updated = { ...base, phone: nextValue };
          } else if (editState.field === 'email') {
            updated = { ...base, email: nextValue };
          } else if (editState.field === 'deliveryNote') {
            updated = { ...base, deliveryNote: nextValue };
          }
          saveBuyerProfile(updated);
          return updated;
        });
      } else {
        setImporterProfile(prev => {
          const base = prev ?? loadImporterProfile();
          let updated: ImporterProfile = base;
          if (editState.field === 'storeName') {
            updated = { ...base, storeName: nextValue };
          } else if (editState.field === 'contactName') {
            updated = { ...base, contactName: nextValue };
          } else if (editState.field === 'storePhone') {
            updated = { ...base, phone: nextValue };
          } else if (editState.field === 'storeEmail') {
            updated = { ...base, email: nextValue };
          } else if (editState.field === 'bio') {
            updated = { ...base, bio: nextValue };
          }
          saveImporterProfile(updated);
          return updated;
        });
      }
      toast({ title: t('profile.toast.saved') });
      trackEvent('profile_edit_save', { field: editState.field, mode: editState.mode });
      setEditState(null);
      return;
    }

    if (editState.type === 'pickup') {
      const selectedId = mode === 'buyer' ? buyerSelection : importerSelection;
      if (!selectedId) {
        setEditState(null);
        return;
      }
      if (editState.mode === 'buyer') {
        setBuyerProfile(prev => {
          const base = prev ?? loadBuyerProfile();
          const updated = { ...base, defaultPickupId: selectedId };
          saveBuyerProfile(updated);
          return updated;
        });
      } else {
        setImporterProfile(prev => {
          const base = prev ?? loadImporterProfile();
          const updated = { ...base, defaultPickupId: selectedId };
          saveImporterProfile(updated);
          return updated;
        });
      }
      trackEvent('profile_edit_save', { field: editState.field, mode: editState.mode });
      trackEvent('pickup_default_change', { mode: editState.mode, pickupId: selectedId });
      toast({ title: t('profile.toast.pickupSaved') });
      setEditState(null);
    }
  };

  const [editValue, setEditValue] = useState('');
  const [buyerSelection, setBuyerSelection] = useState<string | null>(null);
  const [importerSelection, setImporterSelection] = useState<string | null>(null);

  useEffect(() => {
    if (!editState) return;
    if (editState.type === 'text' || editState.type === 'textarea') {
      setEditValue(editState.value);
    } else if (editState.type === 'pickup') {
      if (editState.mode === 'buyer') {
        setBuyerSelection(activeBuyer.defaultPickupId);
      } else {
        setImporterSelection(activeImporter.defaultPickupId);
      }
    }
  }, [editState, activeBuyer, activeImporter]);

  const closeEdit = () => setEditState(null);

  const buyerPickupOptions = activeBuyer.pickups;
  const importerPickupOptions = activeImporter.pickups;

  const updateBuyerNotifications = (key: keyof BuyerProfile['notifications'], value: boolean) => {
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated: BuyerProfile = {
        ...base,
        notifications: { ...base.notifications, [key]: value },
      };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('notif_pref_change', { mode: 'buyer', name: key, on: value });
  };

  const updateImporterNotifications = (key: keyof ImporterProfile['notifications'], value: boolean) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const updated: ImporterProfile = {
        ...base,
        notifications: { ...base.notifications, [key]: value },
      };
      saveImporterProfile(updated);
      return updated;
    });
    trackEvent('notif_pref_change', { mode: 'importer', name: key, on: value });
  };

  const toggleBuyerPrivacy = (value: boolean) => {
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated = { ...base, privacy: { ...base.privacy, shareNameWithSellers: value } };
      saveBuyerProfile(updated);
      return updated;
    });
  };

  const toggleImporterPrivacy = (value: boolean) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const updated = { ...base, privacy: { ...base.privacy, showEmailToBuyers: value } };
      saveImporterProfile(updated);
      return updated;
    });
  };

  const markStepCompleted = (step: VerificationStep) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const nextSteps = base.verification.steps.map(item => {
        if (item.id === step.id) {
          return { ...item, status: 'complete' as const };
        }
        if (item.status === 'upcoming') {
          return { ...item, status: 'current' as const };
        }
        return item;
      });

      const updated: ImporterProfile = {
        ...base,
        verification: {
          ...base.verification,
          steps: nextSteps,
        },
      };
      saveImporterProfile(updated);
      return updated;
    });
    trackEvent('kyc_step_complete', { step: step.id });
    toast({ title: t('profile.toast.stepComplete') });
    setVerificationStep(null);
  };

  const verificationProgress = computeStepProgress(activeImporter.verification.steps);

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-border/60 shadow-soft">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{headerName}</h1>
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {mode === 'buyer' ? t('roles.buyerBadge') : t('roles.importerBadge')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{maskedContact}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {mode === 'buyer' ? (
                <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-50 shadow-soft">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {t('profile.header.escrow')}
                </Badge>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {activeImporter.verified ? t('profile.header.verified') : t('profile.header.verificationInProgress')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-500" />
                    {t('profile.header.score', { value: activeImporter.score })}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
                  >
                    <Truck className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                    {t('profile.header.onTime', { value: activeImporter.onTime })}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                {mode === 'buyer' ? t('profile.subtitleBuyer') : t('profile.subtitleImporter')}
              </p>
              <div className="hidden sm:flex">
                <LanguageToggle />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickActions.map(action => (
                <QuickActionButton key={action.label} {...action} />
              ))}
            </div>
            <div className="sm:hidden">
              <LanguageToggle className="w-full justify-center" />
            </div>
          </div>
        </header>

        <Accordion type="multiple" defaultValue={['personal', 'verification', 'preferences']} className="space-y-3">
          <SectionCard
            value="personal"
            title={mode === 'buyer' ? t('profile.sections.personalBuyer') : t('profile.sections.personalImporter')}
            subtitle={
              mode === 'buyer'
                ? t('profile.sections.personalBuyerHint')
                : t('profile.sections.personalImporterHint', { city: activeImporter.city })
            }
          >
            {mode === 'buyer' ? (
              <>
                <InfoRow
                  label={t('profile.fields.name')}
                  value={activeBuyer.name}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'name',
                      label: t('profile.edit.nameTitle'),
                      value: activeBuyer.name,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.phone')}
                  value={activeBuyer.phone}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'phone',
                      label: t('profile.edit.phoneTitle'),
                      value: activeBuyer.phone,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.email')}
                  value={activeBuyer.email}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'email',
                      label: t('profile.edit.emailTitle'),
                      value: activeBuyer.email,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.defaultPickup')}
                  value={
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{buyerDefaultPickup.name}</span>
                      <span className="text-xs text-muted-foreground">{buyerDefaultPickup.city}</span>
                    </div>
                  }
                  hint={t('profile.fields.defaultPickupHint')}
                  actionLabel={t('profile.actions.change')}
                  onClick={() =>
                    openEdit({ mode: 'buyer', field: 'defaultPickup', label: t('profile.edit.pickupTitle'), type: 'pickup' })
                  }
                />
                <InfoRow
                  label={t('profile.fields.deliveryNote')}
                  value={activeBuyer.deliveryNote || t('profile.fields.deliveryNotePlaceholder')}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'deliveryNote',
                      label: t('profile.edit.deliveryNoteTitle'),
                      value: activeBuyer.deliveryNote ?? '',
                      type: 'textarea',
                      description: t('profile.edit.deliveryNoteHint'),
                    })
                  }
                />
              </>
            ) : (
              <>
                <InfoRow
                  label={t('profile.fields.storeName')}
                  value={activeImporter.storeName}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storeName',
                      label: t('profile.edit.storeNameTitle'),
                      value: activeImporter.storeName,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.contactName')}
                  value={activeImporter.contactName}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'contactName',
                      label: t('profile.edit.contactNameTitle'),
                      value: activeImporter.contactName,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.phone')}
                  value={activeImporter.phone}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storePhone',
                      label: t('profile.edit.phoneTitle'),
                      value: activeImporter.phone,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.email')}
                  value={activeImporter.email}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storeEmail',
                      label: t('profile.edit.emailTitle'),
                      value: activeImporter.email,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.bio')}
                  value={activeImporter.bio}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'bio',
                      label: t('profile.edit.bioTitle'),
                      value: activeImporter.bio,
                      type: 'textarea',
                      description: t('profile.edit.bioHint'),
                    })
                  }
                />
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-2xl border-primary/60 text-primary"
                  onClick={() => navigate(`/importers/${activeImporter.id}/profile`)}
                >
                  <span>{t('profile.actions.publicProfile')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </SectionCard>

          <SectionCard
            value="verification"
            title={t('profile.sections.verification')}
            subtitle={
              mode === 'buyer'
                ? t('profile.sections.verificationBuyerHint')
                : t('profile.sections.verificationImporterHint')
            }
          >
            {mode === 'buyer' ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeBuyer.kyc.status === 'verified'
                        ? t('profile.verification.verified')
                        : t('profile.verification.pending')}
                    </p>
                    <p className="text-xs text-muted-foreground">{activeBuyer.kyc.helper}</p>
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <p className="text-sm text-muted-foreground">{activeBuyer.kyc.lastChecked}</p>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t('profile.verification.buyerExplainer')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('profile.verification.progress')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.verification.progressHint', { value: verificationProgress })}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/40 text-sm text-primary">
                      {verificationProgress}%
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {activeImporter.verification.steps.map(step => (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft',
                        step.status === 'complete' && 'border-emerald-200 bg-emerald-50/60',
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {step.status === 'complete' ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      {step.status === 'complete' ? (
                        <Badge variant="outline" className="rounded-full border-emerald-400 text-xs text-emerald-700">
                          {t('profile.verification.stepDone')}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setVerificationStep(step)}
                        >
                          {t('profile.verification.reviewStep')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
                  <Sparkles className="mr-2 inline h-4 w-4" />
                  {t('profile.verification.importerExplainer')}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard value="preferences" title={t('profile.sections.preferences')}>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('profile.preferences.language')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.preferences.languageHint')}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-semibold">
                  <Globe2 className="h-4 w-4" />
                  <span className="uppercase">{locale}</span>
                </div>
              </div>
              <LanguageToggle className="w-full justify-center" />
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.preferences.notifications')}</p>
              </div>
              {mode === 'buyer' ? (
                <div className="space-y-3">
                  <ToggleRow
                    label={t('profile.preferences.orderUpdates')}
                    hint={t('profile.preferences.orderUpdatesHint')}
                    checked={activeBuyer.notifications.orderUpdates}
                    onCheckedChange={value => updateBuyerNotifications('orderUpdates', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.arrivals')}
                    hint={t('profile.preferences.arrivalsHint')}
                    checked={activeBuyer.notifications.arrivals}
                    onCheckedChange={value => updateBuyerNotifications('arrivals', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.refunds')}
                    hint={t('profile.preferences.refundsHint')}
                    checked={activeBuyer.notifications.refunds}
                    onCheckedChange={value => updateBuyerNotifications('refunds', value)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <ToggleRow
                    label={t('profile.preferences.buyerUpdates')}
                    hint={t('profile.preferences.buyerUpdatesHint')}
                    checked={activeImporter.notifications.buyerUpdates}
                    onCheckedChange={value => updateImporterNotifications('buyerUpdates', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.payouts')}
                    hint={t('profile.preferences.payoutsHint')}
                    checked={activeImporter.notifications.payouts}
                    onCheckedChange={value => updateImporterNotifications('payouts', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.disputes')}
                    hint={t('profile.preferences.disputesHint')}
                    checked={activeImporter.notifications.disputes}
                    onCheckedChange={value => updateImporterNotifications('disputes', value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.preferences.privacy')}</p>
              </div>
              {mode === 'buyer' ? (
                <ToggleRow
                  label={t('profile.preferences.buyerPrivacy')}
                  hint={t('profile.preferences.buyerPrivacyHint')}
                  checked={activeBuyer.privacy.shareNameWithSellers}
                  onCheckedChange={toggleBuyerPrivacy}
                />
              ) : (
                <ToggleRow
                  label={t('profile.preferences.importerPrivacy')}
                  hint={t('profile.preferences.importerPrivacyHint')}
                  checked={activeImporter.privacy.showEmailToBuyers}
                  onCheckedChange={toggleImporterPrivacy}
                />
              )}
            </div>
          </SectionCard>

          <SectionCard value="logistics" title={t('profile.sections.logistics')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.logistics.pickupsTitle')}</p>
              </div>
              <div className="space-y-3">
                {(mode === 'buyer' ? buyerPickupOptions : importerPickupOptions).map(pickup => {
                  const isDefault =
                    (mode === 'buyer' ? activeBuyer.defaultPickupId : activeImporter.defaultPickupId) === pickup.id;
                  return (
                    <div
                      key={pickup.id}
                      className={cn(
                        'flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft',
                        isDefault && 'border-primary/50',
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pickup.name}</p>
                        <p className="text-xs text-muted-foreground">{pickup.address}</p>
                        <p className="text-xs text-muted-foreground">{pickup.city}</p>
                        {pickup.phone ? (
                          <p className="mt-1 text-xs text-primary">{pickup.phone}</p>
                        ) : null}
                        {pickup.note ? (
                          <p className="mt-1 text-xs text-muted-foreground/80">{pickup.note}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={isDefault ? 'default' : 'outline'}
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-semibold',
                          isDefault ? 'bg-primary text-primary-foreground' : 'border-border/70 text-muted-foreground',
                        )}
                      >
                        {isDefault ? t('profile.logistics.default') : t('profile.actions.setDefault')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() =>
                  openEdit({
                    mode,
                    field: 'defaultPickup',
                    label: t('profile.edit.pickupTitle'),
                    type: 'pickup',
                  })
                }
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t('profile.logistics.changeDefault')}
              </Button>
            </div>
          </SectionCard>

          <SectionCard value="security" title={t('profile.sections.security')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.security.devicesTitle')}</p>
              </div>
              <div className="space-y-3">
                {(mode === 'buyer' ? activeBuyer.devices : activeImporter.devices).map(device => (
                  <div key={device.id} className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{device.label}</p>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                      <p className="text-xs text-muted-foreground">{device.lastActive}</p>
                    </div>
                    {device.current ? (
                      <Badge variant="outline" className="rounded-full border-emerald-400 text-xs text-emerald-700">
                        {t('profile.security.thisDevice')}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 rounded-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('profile.security.logoutAll')}
                </Button>
                <Button variant="ghost" className="flex-1 justify-center rounded-full text-muted-foreground">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('profile.security.deleteAccount')}
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard value="help" title={t('profile.sections.help')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <InfoRow label={t('profile.help.refundPolicy')} value={t('profile.help.refundPolicyHint')} />
              <InfoRow label={t('profile.help.buyerProtection')} value={t('profile.help.buyerProtectionHint')} />
              <InfoRow
                label={t('profile.help.support')}
                value={t('profile.help.supportHint')}
                hint={`${t('profile.help.phoneLabel')}: +237 651 222 333 • ${t('profile.help.emailLabel')}: support@prolist.africa`}
              />
              <Separator className="bg-border/60" />
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{t('profile.help.terms')}</span>
                <span>•</span>
                <span>{t('profile.help.privacy')}</span>
              </div>
            </div>
          </SectionCard>
        </Accordion>
      </div>

      <Drawer open={Boolean(editState)} onOpenChange={open => (!open ? closeEdit() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          {editState ? (
            <>
              <DrawerHeader className="px-6 pt-6 text-left">
                <DrawerTitle>{editState.label}</DrawerTitle>
                {editState.description ? <DrawerDescription>{editState.description}</DrawerDescription> : null}
              </DrawerHeader>
              <div className="px-6">
                {editState.type === 'text' ? (
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={event => setEditValue(event.target.value)}
                    className="rounded-2xl"
                  />
                ) : editState.type === 'textarea' ? (
                  <Textarea
                    value={editValue}
                    onChange={event => setEditValue(event.target.value)}
                    rows={4}
                    className="rounded-2xl"
                  />
                ) : (
                  <div className="space-y-3 pb-6">
                    {(editState.mode === 'buyer' ? buyerPickupOptions : importerPickupOptions).map(pickup => {
                      const selected =
                        editState.mode === 'buyer' ? buyerSelection === pickup.id : importerSelection === pickup.id;
                      return (
                        <button
                          type="button"
                          key={pickup.id}
                          onClick={() =>
                            editState.mode === 'buyer'
                              ? setBuyerSelection(pickup.id)
                              : setImporterSelection(pickup.id)
                          }
                          className={cn(
                            'w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-soft transition-all hover:border-primary/40',
                            selected && 'border-primary bg-primary/10',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{pickup.name}</p>
                              <p className="text-xs text-muted-foreground">{pickup.address}</p>
                            </div>
                            {selected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <CircleIcon />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{pickup.city}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <DrawerFooter className="px-6 pb-6">
                <Button onClick={handleSaveEdit} className="w-full rounded-full text-base font-semibold">
                  {t('profile.actions.save')}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-full">
                    {t('common.cancel')}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(verificationStep)} onOpenChange={open => (!open ? setVerificationStep(null) : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          {verificationStep ? (
            <>
              <DrawerHeader className="px-6 pt-6 text-left">
                <DrawerTitle>{verificationStep.label}</DrawerTitle>
                <DrawerDescription>{verificationStep.description}</DrawerDescription>
              </DrawerHeader>
              <div className="px-6 text-sm text-muted-foreground">
                <p>{t('profile.verification.stepDetail')}</p>
              </div>
              <DrawerFooter className="px-6 pb-6">
                <Button
                  className="w-full rounded-full"
                  onClick={() => markStepCompleted(verificationStep)}
                >
                  {t('profile.verification.completeStep')}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-full">
                    {t('common.cancel')}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </main>
  );
};

const CircleIcon = () => <div className="h-5 w-5 rounded-full border border-border/60" />;

const ToggleRow = ({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-background/70 px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Profile;

