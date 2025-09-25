import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Share2, UploadCloud, Users, Loader2, AlertCircle, FileText, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useI18n } from '@/context/I18nContext';
import { activateDemoMode, isDemoActive } from '@/lib/demoMode';
import {
  DEMO_IMPORTER_LISTINGS,
  ImporterListing,
  ImporterKpi,
  computeKpis,
  locksInCopy,
  statusLabel,
  statusTone,
  toImporterListing,
  committedRatio,
} from '@/lib/importerDashboard';
import ShareSheet from '@/components/share/ShareSheet';
import { ensureAbsoluteUrl, type ListingShareContent } from '@/lib/share';
import type { ListingSummary, Session } from '@/types';

const fetchImporterListings = async (): Promise<ListingSummary[]> => {
  const response = await fetch('/api/listings');
  if (!response.ok) {
    throw new Error('Failed to load listings');
  }
  const json = await response.json() as { items?: ListingSummary[] };
  return json.items ?? [];
};

type EvidenceSlot = 'invoice' | 'awb' | 'photo';

type UploadedEvidence = {
  name: string;
  url: string;
};

type EvidenceMap = Record<string, Partial<Record<EvidenceSlot, UploadedEvidence>>>;

const slotLabels: Record<EvidenceSlot, { en: string; fr: string }> = {
  invoice: { en: 'Supplier invoice', fr: 'Facture fournisseur' },
  awb: { en: 'AWB / BOL', fr: 'LTA / connaissement' },
  photo: { en: 'Shipment photo', fr: "Photo de l'envoi" },
};

const slotIcons: Record<EvidenceSlot, JSX.Element> = {
  invoice: <FileText className="h-4 w-4" />,
  awb: <FileText className="h-4 w-4" />,
  photo: <CameraMini />,
};

function CameraMini() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 6h6l1 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function formatPrice(value: number, locale: string) {
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(value).replace(/\u00A0/g, '\u202F');
  return `XAF ${formatted}`;
}

const buyerNames = ['Fabrice N.', 'Stéphanie K.', 'Roland T.', 'Claudia M.', 'Yannick P.', 'Amina B.'];

function getLaneTone(signal: ImporterListing['lane']['signal']) {
  switch (signal) {
    case 'green':
      return 'border border-primary/40 bg-primary/15 text-primary shadow-soft';
    case 'amber':
      return 'border border-amber-300/50 bg-amber-100/40 text-amber-700 shadow-soft';
    case 'red':
      return 'border border-rose-300/50 bg-rose-100/40 text-rose-600 shadow-soft';
    default:
      return 'border border-white/50 bg-white/70 text-muted-foreground shadow-sm';
  }
}

function getStatusChipTone(status: ReturnType<typeof statusTone>) {
  switch (status) {
    case 'green':
      return 'border border-primary/40 bg-primary/15 text-primary shadow-soft';
    case 'amber':
      return 'border border-amber-300/50 bg-amber-100/40 text-amber-700 shadow-soft';
    case 'blue':
      return 'border border-blue/40 bg-blue/15 text-blue shadow-soft';
    default:
      return 'border border-white/50 bg-white/70 text-muted-foreground shadow-sm';
  }
}

type ImporterDashboardProps = {
  session: Session;
};

export const ImporterDashboard = ({ session }: ImporterDashboardProps) => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [selectedKpi, setSelectedKpi] = useState<ImporterKpi['id']>('onTime');
  const [listings, setListings] = useState<ImporterListing[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareListing, setShareListing] = useState<ImporterListing | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceListing, setEvidenceListing] = useState<ImporterListing | null>(null);
  const [buyersOpen, setBuyersOpen] = useState(false);
  const [buyersListing, setBuyersListing] = useState<ImporterListing | null>(null);
  const [evidenceMap, setEvidenceMap] = useState<EvidenceMap>({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['importer', 'listings'],
    queryFn: fetchImporterListings,
    staleTime: 1000 * 60,
  });

  const shouldUseDemo = (isError || !data || data.length === 0) && !isDemoActive;
  const fallbackActive = shouldUseDemo || isDemoActive;

  const shareContent = useMemo<ListingShareContent | null>(() => {
    if (!shareListing) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const absoluteOrigin = ensureAbsoluteUrl(origin);
    const trimmedOrigin = absoluteOrigin.endsWith('/') ? absoluteOrigin.slice(0, -1) : absoluteOrigin;
    return {
      id: shareListing.id,
      title: shareListing.title,
      priceXAF: shareListing.priceXAF,
      etaMin: shareListing.etaDays.min,
      etaMax: shareListing.etaDays.max,
      laneCode: shareListing.lane.code,
      onTimePct: shareListing.lane.onTimePct * 100,
      committed: shareListing.moq.committed,
      target: shareListing.moq.target,
      image: shareListing.image,
      shareUrls: {
        short: `${trimmedOrigin}/l/${shareListing.id}`,
        long: `${trimmedOrigin}/listings/${shareListing.id}`,
      },
      isDemo: fallbackActive,
    };
  }, [fallbackActive, shareListing]);

  useEffect(() => {
    if (fallbackActive) {
      if (!isDemoActive) {
        activateDemoMode();
      }
      setListings(DEMO_IMPORTER_LISTINGS);
    }
  }, [fallbackActive]);

  useEffect(() => {
    if (!fallbackActive && data && data.length > 0) {
      const mapped = data.map(item => toImporterListing(item));
      setListings(mapped);
    } else if (!fallbackActive && !data && !isLoading) {
      setListings([]);
    }
  }, [data, fallbackActive, isLoading]);

  useEffect(() => {
    return () => {
      Object.values(evidenceMap).forEach(slots => {
        Object.values(slots).forEach(slot => {
          if (slot?.url) URL.revokeObjectURL(slot.url);
        });
      });
    };
  }, [evidenceMap]);

  useEffect(() => {
    if (listings.length && !selectedKpi) {
      setSelectedKpi('onTime');
    }
  }, [listings.length, selectedKpi]);

  const kpis = useMemo(() => computeKpis(listings), [listings]);

  const kpiContent = useMemo(() => {
    const descriptions: Record<ImporterKpi['id'], string> = {
      onTime: t('importerDashboard.kpis.onTime.help'),
      disputes: t('importerDashboard.kpis.disputes.help'),
      reserve: t('importerDashboard.kpis.reserve.help'),
      active: t('importerDashboard.kpis.active.help'),
    };
    return descriptions[selectedKpi];
  }, [selectedKpi, t]);

  const openShare = (listing: ImporterListing) => {
    setShareListing(listing);
    setShareOpen(true);
  };

  const openEvidence = (listing: ImporterListing) => {
    setEvidenceListing(listing);
    setEvidenceOpen(true);
  };

  const openBuyers = (listing: ImporterListing) => {
    setBuyersListing(listing);
    setBuyersOpen(true);
  };

  const handleFileChange = (listingId: string, slot: EvidenceSlot, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    setEvidenceMap(prev => {
      const existing = prev[listingId]?.[slot];
      if (existing?.url) URL.revokeObjectURL(existing.url);
      return {
        ...prev,
        [listingId]: {
          ...(prev[listingId] ?? {}),
          [slot]: { name: file.name, url },
        },
      };
    });
  };

  const clearEvidence = (listingId: string, slot: EvidenceSlot) => {
    setEvidenceMap(prev => {
      const current = prev[listingId]?.[slot];
      if (current?.url) URL.revokeObjectURL(current.url);
      const next = { ...(prev[listingId] ?? {}) };
      delete next[slot];
      return { ...prev, [listingId]: next };
    });
  };

  const markArrived = (listing: ImporterListing) => {
    setListings(prev => prev.map(item => (item.id === listing.id ? { ...item, status: 'arrived' } : item)));
    toast(t('importerDashboard.arrivedToast'));
  };

  const numberFormat = useMemo(
    () => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'decimal', maximumFractionDigits: 0 }),
    [locale],
  );

  const formatPct = (value: number) => `${Math.round(value * 100)}%`;

  const statusToneClass = (status: ImporterListing['status']) => getStatusChipTone(statusTone(status));

  const explanation = kpis.find(item => item.id === selectedKpi);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5 rounded-3xl border border-white/80 bg-gradient-to-br from-white/95 via-primary/5 to-blue/10 p-6 shadow-[0_20px_45px_rgba(14,116,144,0.12)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="rounded-full border-primary/20 bg-primary/15 px-3 py-1 text-primary" variant="outline">
                {t('roles.importerBadge')}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">{session.displayName}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('importerDashboard.heading')}</h1>
            <p className="text-sm text-muted-foreground">{t('importerDashboard.tagline')}</p>
            <Badge
              variant={session.verifiedImporter ? 'default' : 'outline'}
              className={`rounded-full px-3 py-1 text-xs ${
                session.verifiedImporter
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-700'
              }`}
            >
              {session.verifiedImporter ? t('dashboard.importerStatusVerified') : t('dashboard.importerStatusPending')}
            </Badge>
          </div>
          <Button
            size="lg"
            className="rounded-full bg-primary px-6 text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5"
            onClick={() => navigate('/importer/create')}
          >
            {t('importerDashboard.createListing')}
          </Button>
        </div>
        {isError && !shouldUseDemo && (
          <Alert className="border-amber-500/40 bg-amber-100/40">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('importerDashboard.loadErrorTitle')}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{t('importerDashboard.loadErrorBody')}</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                {t('importerDashboard.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </header>

      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {isLoading && listings.length === 0
            ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
            : kpis.map(kpi => (
                <button
                  key={kpi.id}
                  type="button"
                  onClick={() => setSelectedKpi(kpi.id)}
                  className={`flex h-24 flex-col justify-between rounded-2xl border border-white/60 bg-white/90 p-4 text-left shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    selectedKpi === kpi.id ? 'shadow-lg ring-1 ring-primary/30' : 'hover:-translate-y-0.5'
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(`importerDashboard.kpis.${kpi.id}.label`)}
                  </span>
                  <span className="text-2xl font-semibold text-foreground">{kpi.value}</span>
                </button>
              ))}
        </div>
        <p className="text-sm text-muted-foreground transition-all">{kpiContent}</p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('importerDashboard.listingsTitle')}</h2>
          {isLoading && listings.length === 0 && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {listings.length === 0 && !isLoading ? (
          <Card className="rounded-3xl border border-dashed border-primary/20 bg-white/90 p-8 text-center shadow-soft">
            <h3 className="text-lg font-semibold">{t('importerDashboard.emptyTitle')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('importerDashboard.emptyBody')}</p>
            <Button
              className="mt-6 rounded-full bg-primary px-5 text-primary-foreground shadow-soft"
              onClick={() => navigate('/importer/create')}
            >
              {t('importerDashboard.createListing')}
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {isLoading && listings.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index} className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
                    <CardContent className="flex items-center gap-4 p-0">
                      <Skeleton className="h-24 w-24 rounded-2xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-2.5 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {listings.map(listing => {
              const ratio = committedRatio(listing);
              const progressValue = Math.round(ratio * 100);
              const evidence = evidenceMap[listing.id] ?? {};
              return (
                <Card
                  key={listing.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,118,180,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_60px_rgba(15,118,180,0.12)]"
                >
                  <CardContent className="flex gap-4 p-0">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-muted shadow-inner">
                      <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold tracking-tight text-foreground">{listing.title}</h3>
                              <p className="text-sm text-muted-foreground">{formatPrice(listing.priceXAF, locale)}</p>
                            </div>
                          <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${statusToneClass(listing.status)}`}>
                            {statusLabel(listing.status, locale)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded-full border px-3 py-1 font-medium ${getLaneTone(listing.lane.signal)}`}>
                            {listing.lane.label}
                          </span>
                          <span className="font-medium text-primary/80">
                            {listing.moq.committed}/{listing.moq.target}
                          </span>
                          <span className="text-muted-foreground">{locksInCopy(listing.moq.lockAt, locale)}</span>
                        </div>
                        <div className="space-y-2">
                          <Progress value={progressValue} className="h-2 overflow-hidden rounded-full bg-blue/10" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t('importerDashboard.progressLabel', { committed: listing.moq.committed, target: listing.moq.target })}</span>
                            <span>{formatPct(listing.moq.committed / Math.max(1, listing.moq.target))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-11 flex-1 rounded-full bg-primary/10 text-primary shadow-soft transition-colors hover:bg-primary/20"
                          onClick={() => openShare(listing)}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          {t('importerDashboard.actions.share')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-11 flex-1 rounded-full bg-blue/10 text-blue-700 shadow-soft transition-colors hover:bg-blue/20"
                          onClick={() => openEvidence(listing)}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {t('importerDashboard.actions.evidence')}
                          {Object.keys(evidence).length > 0 && <span className="ml-2 text-xs text-emerald-600">•</span>}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <AlertDialogTriggerButton
                          label={t('importerDashboard.actions.arrived')}
                          onConfirm={() => markArrived(listing)}
                          disabled={listing.status === 'arrived'}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 flex-1 rounded-full border-primary/30 text-primary shadow-soft hover:bg-primary/10"
                          onClick={() => openBuyers(listing)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          {t('importerDashboard.actions.buyers')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <ShareSheet
        open={shareOpen}
        onOpenChange={next => {
          setShareOpen(next);
          if (!next) {
            setShareListing(null);
          }
        }}
        context="listing"
        data={shareContent}
      />

      <Sheet open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>{t('importerDashboard.evidenceTitle')}</SheetTitle>
            <SheetDescription>{t('importerDashboard.evidenceSubtitle')}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {evidenceListing && (['invoice', 'awb', 'photo'] as EvidenceSlot[]).map(slot => {
              const evidence = evidenceMap[evidenceListing.id]?.[slot];
              const label = slotLabels[slot][locale === 'fr' ? 'fr' : 'en'];
              return (
                <div key={slot} className="flex flex-col gap-2 rounded-2xl border border-dashed p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {slotIcons[slot]}
                      <span>{label}</span>
                    </div>
                    {evidence ? (
                      <Button size="sm" variant="ghost" onClick={() => clearEvidence(evidenceListing.id, slot)}>
                        {t('importerDashboard.removeEvidence')}
                      </Button>
                    ) : null}
                  </div>
                  <label className="flex h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
                    <Input
                      type="file"
                      accept={slot === 'photo' ? 'image/*' : '.pdf,.jpg,.jpeg,.png'}
                      className="hidden"
                      onChange={event => handleFileChange(evidenceListing.id, slot, event.target.files)}
                    />
                    <UploadCloud className="h-4 w-4" />
                    <span>{evidence ? t('importerDashboard.replaceEvidence') : t('importerDashboard.addEvidence')}</span>
                  </label>
                  {evidence && (
                    <div className="flex items-center gap-3 rounded-xl bg-background/60 p-3 text-sm">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-muted">
                        <img src={evidence.url} alt={label} className="h-full w-full object-cover" />
                      </div>
                      <span className="truncate text-sm text-foreground">{evidence.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={buyersOpen} onOpenChange={setBuyersOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>{t('importerDashboard.buyersTitle')}</SheetTitle>
            <SheetDescription>{t('importerDashboard.buyersSubtitle')}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {buyersListing && (
              <>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
                  {t('importerDashboard.buyersSummary', {
                    count: buyersListing.buyersCount,
                    committed: buyersListing.moq.committed,
                    target: buyersListing.moq.target,
                  })}
                </div>
                <div className="space-y-3">
                  {buyerNames.slice(0, Math.min(4, buyersListing.buyersCount)).map((name, index) => (
                    <div key={name} className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/95 p-4 text-sm shadow-sm">
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {index === 0 ? t('importerDashboard.buyerReady') : t('importerDashboard.buyerPending')}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-600">
                        {t('importerDashboard.badgeUnits', { count: Math.max(1, Math.round(buyersListing.moq.target / buyersListing.buyersCount)) })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

type AlertDialogTriggerButtonProps = {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
};

const AlertDialogTriggerButton = ({ label, onConfirm, disabled }: AlertDialogTriggerButtonProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-11 flex-1 rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700 shadow-soft transition-colors hover:bg-emerald-500/20"
          disabled={disabled}
        >
          <PackageCheck className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('importerDashboard.arrivedConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('importerDashboard.arrivedConfirmBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full px-6 text-muted-foreground hover:bg-muted/40">
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-primary px-6 text-primary-foreground shadow-soft hover:bg-primary/90"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {t('importerDashboard.arrivedConfirmCta')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

