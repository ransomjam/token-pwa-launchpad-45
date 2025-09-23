import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadImporterPublicProfile, type PublicImporterProfile } from '@/lib/profile-data';
import { useI18n } from '@/context/I18nContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/components/ui/use-toast';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Share2,
  Sparkles,
  Truck,
} from 'lucide-react';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('XAF', 'XAF');

const PublicImporterProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile: PublicImporterProfile = useMemo(() => loadImporterPublicProfile(id), [id]);
  const { t } = useI18n();

  useEffect(() => {
    trackEvent('imp_public_profile_view', { importerId: profile.id });
  }, [profile.id]);

  const handleShare = async () => {
    const shareText = t('publicProfile.shareMessage', {
      store: profile.storeName,
      url: profile.shareUrl,
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.storeName,
          text: shareText,
          url: profile.shareUrl,
        });
        toast({ title: t('publicProfile.shareSent') });
        return;
      } catch (error) {
        // fall through to clipboard path
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(profile.shareUrl);
        toast({ title: t('publicProfile.shareCopied') });
        return;
      } catch (error) {
        // continue to fallback toast
      }
    }

    toast({ title: t('publicProfile.shareFallback'), description: profile.shareUrl });
  };

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('publicProfile.back')}
        </button>

        <header className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-border/70 shadow-soft">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {profile.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground">{profile.storeName}</h1>
                  {profile.verified ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      {t('profile.header.verified')}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.city}</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-full px-4"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {t('publicProfile.shareCta')}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{t('publicProfile.trusted')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('publicProfile.trustStats', {
                onTime: profile.onTime,
                dispute: profile.disputeRate,
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.lanes.map(lane => (
              <Badge
                key={lane}
                variant="outline"
                className="rounded-full border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
              >
                <Truck className="mr-1 h-3.5 w-3.5 text-primary" />
                {lane}
              </Badge>
            ))}
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('publicProfile.listingsTitle')}</h2>
            <span className="text-sm text-muted-foreground">
              {t('publicProfile.listingsSubtitle', { count: profile.recentListings.length })}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {profile.recentListings.map(listing => (
              <article
                key={listing.id}
                className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative overflow-hidden rounded-xl bg-muted">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    loading="lazy"
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">{listing.etaLabel}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{formatPrice(listing.priceXAF)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">{t('publicProfile.aboutTitle')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
        </section>
      </div>
    </main>
  );
};

export default PublicImporterProfile;

