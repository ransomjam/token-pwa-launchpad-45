import { ArrowLeft, Award, BadgeCheck, Clock, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nContext';
import { getMerchantResult } from '@/lib/merchantResults';

const currency = (value: number) => value.toLocaleString();

const MerchantResultsPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const result = getMerchantResult(id);

  const isAuction = result.type === 'auction';

  return (
    <main className="min-h-dvh bg-slate-50 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-full px-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {t('common.demoData', { defaultValue: 'Demo data' })}
          </Badge>
        </div>

        <section className="rounded-3xl border border-white/60 bg-white/95 p-6 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden h-20 w-20 overflow-hidden rounded-2xl bg-muted/40 sm:flex sm:items-center sm:justify-center">
                <img src={result.image} alt={result.title} className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
                    {isAuction ? t('home.modes.auctions') : t('vendor.directListingsTab')}
                  </Badge>
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{result.title}</h1>
                <p className="text-sm text-muted-foreground">{t('merchant.fromFollows')} · {result.ownerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {t('merchant.resultSettled', { defaultValue: 'Settled' })} · {new Date(result.settledAt).toLocaleDateString()}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Award className="h-4 w-4 text-primary" />
                <span>{t('merchant.resultWinner', { defaultValue: 'Winning buyer' })}</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{result.winner.name}</p>
              <p className="text-xs text-muted-foreground">{result.winner.location}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>{t('merchant.finalPrice', { defaultValue: 'Final price' })}</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">₣{currency(result.finalPriceXAF)}</p>
              {typeof result.merchantSharePercent === 'number' && (
                <p className="text-xs text-muted-foreground">{result.merchantSharePercent}% rev-share</p>
              )}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/90 p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                <span>{t('merchant.ownerPayout', { defaultValue: 'Owner payout' })}</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">₣{currency(result.ownerPayoutXAF)}</p>
              <p className="text-xs text-muted-foreground">
                {t('merchant.merchantCommission', { defaultValue: 'Your commission' })}: ₣{currency(result.merchantCommissionXAF)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {isAuction && result.stats.bids !== undefined && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {t('merchant.resultBids', { defaultValue: 'Bids received' })}
                </div>
                <p className="mt-2 text-xl font-semibold">{result.stats.bids}</p>
              </div>
            )}
            {result.stats.watchers !== undefined && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {t('merchant.resultWatchers', { defaultValue: 'Watchers' })}
                </div>
                <p className="mt-2 text-xl font-semibold">{result.stats.watchers}</p>
              </div>
            )}
            {result.stats.repostClicks !== undefined && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  {t('merchant.resultClicks', { defaultValue: 'Repost clicks' })}
                </div>
                <p className="mt-2 text-xl font-semibold">{result.stats.repostClicks}</p>
              </div>
            )}
            {result.stats.orders !== undefined && (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="h-4 w-4" />
                  {t('merchant.resultOrders', { defaultValue: 'Orders via you' })}
                </div>
                <p className="mt-2 text-xl font-semibold">{result.stats.orders}</p>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/90 p-4 text-sm text-muted-foreground">
            {result.summary}
          </div>

          <div className="mt-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('merchant.resultTimeline', { defaultValue: 'Result timeline' })}
            </h2>
            <ol className="space-y-3 text-sm">
              {result.timeline.map(step => (
                <li
                  key={`${step.label}-${step.at}`}
                  className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-foreground">{step.label}</p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(step.at).toLocaleString()}
                    </span>
                  </div>
                  {step.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/merchant/listings/mine">{t('merchant.viewMyReposts', { defaultValue: 'Back to My Reposts' })}</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/merchant/preorder">{t('merchant.exploreCatalog', { defaultValue: 'Explore catalog' })}</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MerchantResultsPage;
