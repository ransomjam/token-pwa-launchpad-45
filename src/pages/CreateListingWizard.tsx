import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles, Upload, Info, Trash2, MoveLeft, MoveRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import { DEMO_LISTINGS, DEMO_PICKUPS } from '@/lib/demoMode';
import ShareSheet from '@/components/share/ShareSheet';
import { ensureAbsoluteUrl, type ListingShareContent } from '@/lib/share';
import { DistributionCard, type DistributionOptionValue } from '@/components/distribution/DistributionCard';

const STORAGE_KEY = 'importer_listing_draft_v1';

const LANE_OPTIONS = [
  { code: 'GZ-DLA-AIR', mode: 'Air', label: 'Guangzhou → Douala (Air)', onTime: 0.93, medianDays: 12, safe: { min: 10, max: 14 } },
  { code: 'GZ-DLA-SEA', mode: 'Sea', label: 'Guangzhou → Douala (Sea)', onTime: 0.78, medianDays: 28, safe: { min: 25, max: 35 } },
  { code: 'SHK-DLA-AIR', mode: 'Air', label: 'Shenzhen → Douala (Air)', onTime: 0.9, medianDays: 11, safe: { min: 9, max: 13 } },
] as const;

type LaneOption = typeof LANE_OPTIONS[number];

const EXTRA_PICKUPS = [
  {
    id: 'pkp_seed_3',
    name: 'Bonamoussadi Hub',
    address: 'Carrefour Lycée, Bonamoussadi',
    city: 'Douala',
  },
];

const PICKUP_OPTIONS = [...DEMO_PICKUPS, ...EXTRA_PICKUPS];

type UploadedPhoto = {
  id: string;
  url: string;
  name: string;
  source: 'demo' | 'upload';
};

type ListingDraft = {
  title: string;
  category: string;
  priceXAF: number;
  moqTarget: number;
  minPerBuyer: number;
  maxPerBuyer: number;
  laneCode: string;
  etaMin: number;
  etaMax: number;
  photos: UploadedPhoto[];
  pickupPoints: string[];
  pickupNote: string;
  buyerProtection: boolean;
};

const demoListing = DEMO_LISTINGS[0];

const defaultDraft: ListingDraft = {
  title: demoListing.title,
  category: demoListing.category ?? 'Accessories',
  priceXAF: demoListing.priceXAF,
  moqTarget: demoListing.moq.target,
  minPerBuyer: 5,
  maxPerBuyer: 12,
  laneCode: demoListing.lane.code,
  etaMin: demoListing.etaDays.min,
  etaMax: demoListing.etaDays.max,
  photos: demoListing.images.slice(0, 3).map((url, index) => ({
    id: `demo-${index}`,
    url,
    name: `demo-${index + 1}.jpg`,
    source: 'demo',
  })),
  pickupPoints: [DEMO_PICKUPS[0]?.id ?? 'pkp_seed_1'],
  pickupNote: '',
  buyerProtection: true,
};

const STEPS = ['basics', 'price', 'delivery', 'media', 'pickup', 'review'] as const;

type StepId = typeof STEPS[number];

type StepMeta = {
  id: StepId;
  label: string;
  shortLabel: string;
  description: string;
};

const ensureTitleCase = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return trimmed
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return trimmed;
};

const formatNumber = (value: number, locale: string) => {
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });
  return formatter.format(value).replace(/\u00A0/g, '\u202F');
};

const getLaneSafeBand = (code: string): LaneOption['safe'] => {
  const lane = LANE_OPTIONS.find(item => item.code === code);
  return lane?.safe ?? { min: 10, max: 14 };
};

const hasClearTitle = (title: string) => title.trim().length >= 8;
const hasSafeEta = (draft: ListingDraft) => {
  const safe = getLaneSafeBand(draft.laneCode);
  return draft.etaMin >= safe.min && draft.etaMax <= safe.max;
};
const hasEnoughPhotos = (draft: ListingDraft) => draft.photos.length >= 2;
const hasPickup = (draft: ListingDraft) => draft.pickupPoints.length >= 1;

const sanitizeForStorage = (draft: ListingDraft): ListingDraft => ({
  ...draft,
  photos: draft.photos.filter(photo => photo.source === 'demo'),
});

const CreateListingWizard = () => {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(() => {
    if (typeof window === 'undefined') return defaultDraft;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultDraft;
      const parsed = JSON.parse(stored) as ListingDraft;
      return { ...defaultDraft, ...parsed };
    } catch (error) {
      console.warn('Failed to parse importer draft', error);
      return defaultDraft;
    }
  });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [distributionChoice, setDistributionChoice] = useState<DistributionOptionValue>('publish');
  const [distributionSuccess, setDistributionSuccess] = useState(false);

  const shareContent = useMemo<ListingShareContent>(() => {
    const lane = LANE_OPTIONS.find(item => item.code === draft.laneCode) ?? LANE_OPTIONS[0];
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const absoluteOrigin = ensureAbsoluteUrl(origin);
    const trimmedOrigin = absoluteOrigin.endsWith('/') ? absoluteOrigin.slice(0, -1) : absoluteOrigin;
    const slug = draft.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-listing';
    const shareId = `draft-${slug}`;
    return {
      id: shareId,
      title: draft.title || demoListing.title,
      priceXAF: draft.priceXAF || demoListing.priceXAF,
      etaMin: draft.etaMin,
      etaMax: draft.etaMax,
      laneCode: draft.laneCode || lane.code,
      onTimePct: (lane?.onTime ?? 0.85) * 100,
      committed: 0,
      target: draft.moqTarget,
      image: draft.photos[0]?.url ?? demoListing.images[0] ?? '/placeholder.svg',
      shareUrls: {
        short: `${trimmedOrigin}/l/${shareId}`,
        long: `${trimmedOrigin}/listings/${shareId}`,
      },
      isDemo: true,
    };
  }, [draft]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty && !published) {
        event.preventDefault();
        event.returnValue = t('listingWizard.savePrompt');
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, published, t]);

  useEffect(() => {
    return () => {
      if (!dirty || published) return;
      const keep = window.confirm(t('listingWizard.savePrompt'));
      if (!keep && typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, [dirty, published, t]);

  useEffect(() => {
    if (!dirty) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeForStorage(draft)));
      }
      setSaveState('saved');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, dirty]);

  useEffect(() => {
    return () => {
      draft.photos.forEach(photo => {
        if (photo.source === 'upload') {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [draft.photos]);

  const steps: StepMeta[] = useMemo(
    () => [
      {
        id: 'basics',
        label: t('listingWizard.steps.basics'),
        shortLabel: t('listingWizard.stepsShort.basics'),
        description: t('listingWizard.stepDescriptions.basics'),
      },
      {
        id: 'price',
        label: t('listingWizard.steps.price'),
        shortLabel: t('listingWizard.stepsShort.price'),
        description: t('listingWizard.stepDescriptions.price'),
      },
      {
        id: 'delivery',
        label: t('listingWizard.steps.delivery'),
        shortLabel: t('listingWizard.stepsShort.delivery'),
        description: t('listingWizard.stepDescriptions.delivery'),
      },
      {
        id: 'media',
        label: t('listingWizard.steps.media'),
        shortLabel: t('listingWizard.stepsShort.media'),
        description: t('listingWizard.stepDescriptions.media'),
      },
      {
        id: 'pickup',
        label: t('listingWizard.steps.pickup'),
        shortLabel: t('listingWizard.stepsShort.pickup'),
        description: t('listingWizard.stepDescriptions.pickup'),
      },
      {
        id: 'review',
        label: t('listingWizard.steps.review'),
        shortLabel: t('listingWizard.stepsShort.review'),
        description: t('listingWizard.stepDescriptions.review'),
      },
    ],
    [t],
  );

  const currentStep = steps[stepIndex];
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const lane = useMemo(() => LANE_OPTIONS.find(item => item.code === draft.laneCode) ?? LANE_OPTIONS[0], [draft.laneCode]);

  const revenueHint = draft.priceXAF * draft.moqTarget;

  const gotoStep = (nextIndex: number) => {
    setStepIndex(Math.max(0, Math.min(steps.length - 1, nextIndex)));
  };

  const handleTitleChange = (value: string) => {
    setDirty(true);
    setDraft(prev => ({ ...prev, title: value }));
  };

  const handleTitleBlur = () => {
    setDraft(prev => ({ ...prev, title: ensureTitleCase(prev.title) }));
  };

  const handleCategoryChange = (value: string) => {
    setDirty(true);
    setDraft(prev => ({ ...prev, category: value }));
  };

  const handleNumberChange = (field: keyof Pick<ListingDraft, 'priceXAF' | 'moqTarget' | 'minPerBuyer' | 'maxPerBuyer'>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setDirty(true);
      const next = Number(event.target.value);
      setDraft(prev => ({ ...prev, [field]: Number.isNaN(next) ? 0 : next }));
    };

  const handleLaneChange = (code: string) => {
    const option = LANE_OPTIONS.find(item => item.code === code);
    setDirty(true);
    setDraft(prev => ({
      ...prev,
      laneCode: code,
      etaMin: option?.safe.min ?? prev.etaMin,
      etaMax: option?.safe.max ?? prev.etaMax,
    }));
  };

  const handleEtaChange = (field: 'etaMin' | 'etaMax') => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setDirty(true);
    setDraft(prev => ({ ...prev, [field]: Number.isNaN(value) ? prev[field] : value }));
  };

  const addPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDirty(true);
    const additions: UploadedPhoto[] = Array.from(files)
      .slice(0, 5 - draft.photos.length)
      .map(file => ({
        id: `${file.name}-${file.lastModified}`,
        url: URL.createObjectURL(file),
        name: file.name,
        source: 'upload',
      }));
    setDraft(prev => ({ ...prev, photos: [...prev.photos, ...additions] }));
  };

  const removePhoto = (id: string) => {
    setDirty(true);
    setDraft(prev => {
      const photo = prev.photos.find(item => item.id === id);
      if (photo?.source === 'upload') {
        URL.revokeObjectURL(photo.url);
      }
      return { ...prev, photos: prev.photos.filter(item => item.id !== id) };
    });
  };

  const movePhoto = (id: string, direction: -1 | 1) => {
    setDirty(true);
    setDraft(prev => {
      const index = prev.photos.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.photos.length) return prev;
      const next = [...prev.photos];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return { ...prev, photos: next };
    });
  };

  const togglePickup = (id: string) => {
    setDirty(true);
    setDraft(prev => {
      const has = prev.pickupPoints.includes(id);
      return {
        ...prev,
        pickupPoints: has ? prev.pickupPoints.filter(item => item !== id) : [...prev.pickupPoints, id],
      };
    });
  };

  const handleNoteChange = (value: string) => {
    setDirty(true);
    setDraft(prev => ({ ...prev, pickupNote: value }));
  };

  const goNext = () => gotoStep(stepIndex + 1);
  const goBack = () => gotoStep(stepIndex - 1);

  const handlePublish = async () => {
    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsPublishing(false);
    setPublished(true);
    setShareOpen(true);
    setDirty(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    toast.success(t('listingWizard.publishSuccess'));
    if (distributionChoice !== 'publish') {
      setDistributionSuccess(true);
      toast.success(t('distribution.successAdded'));
    } else {
      setDistributionSuccess(false);
    }
  };

  const missingPickup = currentStep.id === 'pickup' && draft.pickupPoints.length === 0;
  const minMaxInvalid = draft.minPerBuyer > draft.maxPerBuyer && draft.maxPerBuyer !== 0;
  const moqInvalid = draft.moqTarget < draft.minPerBuyer;
  const minInvalid = draft.minPerBuyer < 1;
  const safeBand = getLaneSafeBand(draft.laneCode);
  const etaTooShort = draft.etaMax < safeBand.min;

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (session.role !== 'importer') {
    return <Navigate to="/" replace />;
  }

  const stepContent = () => {
    switch (currentStep.id) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('listingWizard.basics.titleLabel')}</label>
              <Input
                value={draft.title}
                onChange={event => handleTitleChange(event.target.value)}
                onBlur={handleTitleBlur}
                placeholder={t('listingWizard.basics.titlePlaceholder')}
                className="h-12 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">{t('listingWizard.basics.titleHint')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('listingWizard.basics.categoryLabel')}</label>
              <Select value={draft.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <SelectValue placeholder={t('listingWizard.basics.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {['Accessories', 'Electronics', 'Beauty', 'Home', 'Fashion'].map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'price':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed bg-primary/5 p-4 text-sm text-primary">
              {t('listingWizard.price.nudge')}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.price.priceLabel')}</label>
                <Input
                  type="number"
                  min={0}
                  value={draft.priceXAF || ''}
                  onChange={handleNumberChange('priceXAF')}
                  className="h-12 rounded-2xl"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.price.moqLabel')}</label>
                <Input
                  type="number"
                  min={1}
                  value={draft.moqTarget || ''}
                  onChange={handleNumberChange('moqTarget')}
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.price.minLabel')}</label>
                <Input
                  type="number"
                  min={1}
                  value={draft.minPerBuyer || ''}
                  onChange={handleNumberChange('minPerBuyer')}
                  className="h-12 rounded-2xl"
                />
                <p className="text-xs text-muted-foreground">{t('listingWizard.price.minHint')}</p>
                {minInvalid && <p className="text-xs text-red-500">{t('listingWizard.price.validationMin')}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.price.maxLabel')}</label>
                <Input
                  type="number"
                  min={draft.minPerBuyer}
                  value={draft.maxPerBuyer || ''}
                  onChange={handleNumberChange('maxPerBuyer')}
                  className="h-12 rounded-2xl"
                />
                {minMaxInvalid && <p className="text-xs text-red-500">{t('listingWizard.price.validationRange')}</p>}
                {moqInvalid && <p className="text-xs text-amber-500">{t('listingWizard.price.validationMoq')}</p>}
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              {t('listingWizard.price.profitHint', {
                moq: draft.moqTarget || 0,
                revenue: formatNumber(revenueHint || 0, locale),
              })}
            </div>
          </div>
        );
      case 'delivery':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('listingWizard.delivery.laneLabel')}</label>
              <div className="flex flex-col gap-3">
                {LANE_OPTIONS.map(option => {
                  const active = draft.laneCode === option.code;
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleLaneChange(option.code)}
                      className={`flex flex-col gap-2 rounded-3xl border px-4 py-3 text-left transition ${
                        active ? 'border-primary bg-primary/10 shadow-sm' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{option.label}</span>
                        {active && <Badge className="rounded-full bg-primary/90 text-primary-foreground">{t('listingWizard.delivery.selected')}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{t('listingWizard.delivery.cardOnTime', { pct: Math.round(option.onTime * 100) })}</span>
                        <span className="flex items-center gap-1"><ClockMini />{t('listingWizard.delivery.cardMedian', { days: option.medianDays })}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.delivery.etaMin')}</label>
                <Input
                  type="number"
                  min={1}
                  value={draft.etaMin}
                  onChange={handleEtaChange('etaMin')}
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('listingWizard.delivery.etaMax')}</label>
                <Input
                  type="number"
                  min={draft.etaMin}
                  value={draft.etaMax}
                  onChange={handleEtaChange('etaMax')}
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('listingWizard.delivery.etaHint')}</p>
            {etaTooShort && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/60 bg-amber-100/40 p-3 text-sm text-amber-700">
                <Info className="mt-0.5 h-4 w-4" />
                {t('listingWizard.delivery.warningShort', { min: safeBand.min, max: safeBand.max })}
              </div>
            )}
          </div>
        );
      case 'media':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed bg-muted/40 p-4 text-sm">
              {t('listingWizard.media.tip')}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t('listingWizard.media.intro')}</label>
              <label className="mt-3 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-background text-sm font-medium text-primary hover:border-primary" htmlFor="media-upload">
                <Upload className="h-4 w-4" />
                {t('listingWizard.media.addPhotos')}
              </label>
              <input id="media-upload" type="file" accept="image/*" multiple className="hidden" onChange={event => addPhotos(event.target.files)} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.photos.map((photo, index) => (
                <div key={photo.id} className="flex flex-col gap-2 rounded-2xl border bg-muted/30 p-3">
                  <div className="relative overflow-hidden rounded-xl bg-muted">
                    <img src={photo.url} alt={photo.name} className="h-28 w-full rounded-xl object-cover" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{photo.name}</span>
                    <span>{index + 1}/{draft.photos.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => movePhoto(photo.id, -1)} disabled={index === 0}>
                      <MoveLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => movePhoto(photo.id, 1)} disabled={index === draft.photos.length - 1}>
                      <MoveRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500" onClick={() => removePhoto(photo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {!hasEnoughPhotos(draft) && <p className="text-sm text-amber-600">{t('listingWizard.media.tooFew')}</p>}
          </div>
        );
      case 'pickup':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border bg-muted/40 p-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{t('listingWizard.pickup.trustTitle')}</span>
                <span className="text-xs text-muted-foreground">{t('listingWizard.pickup.trustCopy')}</span>
              </div>
              <Switch checked disabled className="scale-90" />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t('listingWizard.pickup.pickupTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('listingWizard.pickup.pickupHint')}</p>
              <div className="space-y-3">
                {PICKUP_OPTIONS.map(option => (
                  <label key={option.id} className="flex items-center gap-3 rounded-2xl border p-4">
                    <Checkbox
                      checked={draft.pickupPoints.includes(option.id)}
                      onCheckedChange={() => togglePickup(option.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{option.name}</span>
                      <span className="text-xs text-muted-foreground">{option.address} — {option.city}</span>
                    </div>
                  </label>
                ))}
              </div>
              {missingPickup && <p className="text-sm text-red-500">{t('listingWizard.pickup.validationPickup')}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('listingWizard.pickup.noteLabel')}</label>
              <Textarea
                value={draft.pickupNote}
                onChange={event => handleNoteChange(event.target.value)}
                placeholder={t('listingWizard.pickup.notePlaceholder')}
                className="min-h-[120px] rounded-2xl"
              />
            </div>
          </div>
        );
      case 'review': {
        const commissionAmount = Math.round(draft.priceXAF * 0.12);
        const formattedCommission = `₣${commissionAmount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')}`;
        return (
          <div className="space-y-6">
            <Card className="rounded-3xl border bg-background/80">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-muted">
                    <img src={draft.photos[0]?.url ?? demoListing.images[0]} alt={draft.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{draft.title}</p>
                    <p className="text-sm text-muted-foreground">XAF {formatNumber(draft.priceXAF, locale)}</p>
                    <p className="text-xs text-muted-foreground">{lane.label}</p>
                    <p className="text-xs text-muted-foreground">ETA {draft.etaMin}–{draft.etaMax} {locale === 'fr' ? 'jours' : 'days'} • MOQ {draft.moqTarget}</p>
                  </div>
                </div>
                <SeparatorMini />
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChecklistItem label={t('listingWizard.review.checklist.title')} ok={hasClearTitle(draft.title)} />
                  <ChecklistItem label={t('listingWizard.review.checklist.eta')} ok={hasSafeEta(draft)} />
                  <ChecklistItem label={t('listingWizard.review.checklist.photos')} ok={hasEnoughPhotos(draft)} />
                  <ChecklistItem label={t('listingWizard.review.checklist.pickup')} ok={hasPickup(draft)} />
                </div>
              </CardContent>
            </Card>
            <DistributionCard
              title={t('distribution.title')}
              subtitle={t('distribution.importerSubtitle')}
              options={[
                {
                  value: 'publish',
                  label: t('distribution.publishOnly'),
                  description: t('distribution.publishOnlyDesc'),
                },
                {
                  value: 'offer',
                  label: t('distribution.offerMerchants'),
                  description: t('distribution.offerMerchantsDesc'),
                },
                {
                  value: 'publish_offer',
                  label: t('distribution.publishOffer'),
                  description: t('distribution.publishOfferDesc'),
                },
              ]}
              value={distributionChoice}
              onChange={value => {
                setDistributionChoice(value);
                setDistributionSuccess(false);
              }}
              commissionLabel={t('distribution.importerCommissionLabel')}
              commissionValue={t('distribution.importerCommissionValue', {
                amount: formattedCommission,
              })}
              successMessage={t('distribution.successAdded')}
              showSuccess={distributionSuccess}
            />
            <div className="rounded-2xl border border-dashed bg-emerald-500/10 p-4 text-sm text-emerald-700">
              {t('listingWizard.review.shareNudge')}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
        <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('listingWizard.preamble')}</p>
                <h1 className="text-lg font-semibold text-foreground">{t('listingWizard.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              <span>{saveState === 'saving' ? t('listingWizard.saving') : t('listingWizard.saved')}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative h-1 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => gotoStep(index)}
                  className={`rounded-full px-2 py-1 transition ${index === stepIndex ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {step.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8 px-6 py-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">{currentStep.label}</h2>
            <p className="text-sm text-muted-foreground">{currentStep.description}</p>
          </div>
          {stepContent()}
        </div>

        <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="h-12 rounded-full px-6"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('listingWizard.back')}
            </Button>
            {currentStep.id === 'review' ? (
              <Button
                className="h-12 rounded-full px-8"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('listingWizard.publish')}
              </Button>
            ) : (
              <Button className="h-12 rounded-full px-8" onClick={goNext}>
                {t('listingWizard.next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} context="listing" data={shareContent} />
    </main>
  );
};

const ChecklistItem = ({ label, ok }: { label: string; ok: boolean }) => (
  <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' : 'border-border text-muted-foreground'}`}>
    <CheckCircle2 className={`h-5 w-5 ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`} />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const SeparatorMini = () => <div className="h-px w-full bg-border/60" />;

function ClockMini() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

export default CreateListingWizard;
