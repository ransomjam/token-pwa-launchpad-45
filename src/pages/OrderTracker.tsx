import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Clock, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/context/I18nContext';
import type { MilestoneCode, OrderStatus } from '@/types';

type OrderDetails = {
  id: string;
  status: OrderStatus;
  countdown: { deadline: string; secondsLeft: number };
  milestones: { code: MilestoneCode; at: string | null }[];
  eligibility: { canRefund: boolean; canDispute: boolean };
};

const milestoneOrder: MilestoneCode[] = ['POOL_LOCKED', 'SUPPLIER_PAID', 'EXPORTED', 'ARRIVED', 'COLLECTED'];

const OrderTracker = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing order id');
      return api<OrderDetails>(`/api/orders/${id}`);
    },
    enabled: !!id,
  });

  const order = orderQuery.data;

  const statusLabel = order ? t(`order.status.${order.status}`) : '';

  const countdownText = useMemo(() => {
    if (!order) return '—';
    const seconds = order.countdown.secondsLeft;
    if (seconds <= 0) {
      return t('order.countdownLate');
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days > 0) parts.push(t('order.countdownValue.days', { value: days }));
    if (hours > 0) parts.push(t('order.countdownValue.hours', { value: hours }));
    if (minutes > 0 && days === 0) parts.push(t('order.countdownValue.minutes', { value: minutes }));
    if (parts.length === 0) {
      parts.push(t('order.countdownValue.minutes', { value: 1 }));
    }
    return parts.join(' · ');
  }, [order, t]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  const timeline = useMemo(() => {
    if (!order) return [] as OrderDetails['milestones'];
    const mapped = milestoneOrder
      .map(code => order.milestones.find(item => item.code === code) ?? { code, at: null })
      .filter(Boolean);
    return mapped as OrderDetails['milestones'];
  }, [order]);

  const renderTimeline = () => (
    <ul className="space-y-6">
      {timeline.map((item, index) => {
        const completed = Boolean(item.at);
        const dateLabel = completed && item.at ? formatter.format(new Date(item.at)) : t('order.milestonePending');
        const nextLine = index < timeline.length - 1;
        return (
          <li key={item.code} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                  completed
                    ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {completed ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {nextLine && <div className="mt-1 h-full w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 rounded-2xl border border-border bg-card/60 p-4 shadow-soft">
              <p className="text-sm font-semibold text-foreground">{t(`order.milestone.${item.code}`)}</p>
              <p className="text-xs text-muted-foreground">{dateLabel}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <main className="min-h-dvh bg-background pb-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex flex-1 flex-col text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('order.title')}</p>
            {order ? (
              <p className="text-sm font-medium text-foreground">#{order.id}</p>
            ) : (
              <Skeleton className="ml-auto h-4 w-32 rounded-full" />
            )}
          </div>
        </header>

        {orderQuery.isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-36 w-full rounded-3xl" />
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        )}

        {orderQuery.isError && !order && (
          <div className="space-y-3 rounded-3xl border border-border bg-card/60 p-6 text-center shadow-soft">
            <p className="text-base font-semibold text-foreground">{t('home.detailUnavailable')}</p>
            <p className="text-sm text-muted-foreground">{t('home.detailUnavailableSubtitle')}</p>
            <Button className="rounded-full" onClick={() => navigate('/')}>
              {t('order.backHome')}
            </Button>
          </div>
        )}

        {order && (
          <>
            <section className="space-y-5 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('order.statusLabel')}</p>
                  <h1 className="text-2xl font-semibold text-foreground">{statusLabel}</h1>
                </div>
                <Badge variant="outline" className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  {t('order.escrowBadge')}
                </Badge>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('order.countdownLabel')}</p>
                    <p className="text-sm text-muted-foreground">{countdownText}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-foreground">{t('order.timelineTitle')}</p>
                <Separator className="ml-6 flex-1" />
              </div>
              {renderTimeline()}
            </section>

            <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('order.helpCta')}</p>
                  <p className="text-sm text-muted-foreground">support@prolist.africa</p>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => navigate('/')}> 
                  {t('order.backHome')}
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default OrderTracker;
