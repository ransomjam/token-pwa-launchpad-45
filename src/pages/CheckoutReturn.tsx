import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CircleAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trackEvent } from '@/lib/analytics';
import { api } from '@/lib/api';
import { useI18n } from '@/context/I18nContext';
import { CheckoutDraft, clearCheckoutDraft, getCheckoutDraft } from '@/lib/checkoutStorage';

const statusEvents: Record<'failed' | 'cancelled', 'psp_return_fail' | 'psp_return_cancel'> = {
  failed: 'psp_return_fail',
  cancelled: 'psp_return_cancel',
};

const normalizeStatus = (raw: string | null): 'success' | 'failed' | 'cancelled' | null => {
  if (raw === 'success' || raw === 'failed' || raw === 'cancelled') return raw;
  return null;
};

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [processing, setProcessing] = useState(true);
  const [bannerStatus, setBannerStatus] = useState<'failed' | 'cancelled' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const orderId = searchParams.get('order');
  const statusParam = normalizeStatus(searchParams.get('status'));
  const draft = useMemo<CheckoutDraft | null>(() => getCheckoutDraft(), []);

  useEffect(() => {
    if (!orderId || !statusParam) {
      setErrorMessage(t('checkout.verifyError'));
      setProcessing(false);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        await api(`/api/checkout/verify`, {
          method: 'POST',
          body: JSON.stringify({ orderId, status: statusParam }),
        });
        if (!active) return;
        if (statusParam === 'success') {
          trackEvent('psp_return_success', { orderId });
          clearCheckoutDraft();
          navigate(`/order/${orderId}`, { replace: true });
        } else {
          trackEvent(statusEvents[statusParam], { orderId });
          setBannerStatus(statusParam);
          setProcessing(false);
        }
      } catch (error) {
        if (!active) return;
        console.error(error);
        setErrorMessage(t('checkout.verifyError'));
        setProcessing(false);
      }
    }, 900);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [navigate, orderId, statusParam, t]);

  const handleRetry = () => {
    const fallback = draft?.listingId ? `/checkout/${draft.listingId}` : '/';
    navigate(fallback, { replace: true });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.returnTitle')}</p>
          <h1 className="text-xl font-semibold text-foreground">{t('checkout.returnSubtitle')}</h1>
        </div>

        {processing && !errorMessage && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card/70 p-8 shadow-soft">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">{t('checkout.processing')}</p>
          </div>
        )}

        {!processing && bannerStatus && (
          <Alert className="rounded-3xl border-border/60 bg-amber-50 text-left">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-1 h-5 w-5 text-amber-500" />
              <AlertDescription className="space-y-2 text-sm text-amber-900">
                <p>{t(`checkout.statusBanner.${bannerStatus}`)}</p>
                <Button className="w-full rounded-full" onClick={handleRetry}>
                  {t('checkout.retry')}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="rounded-3xl border-destructive/40 bg-destructive/10 text-left text-destructive">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-1 h-5 w-5" />
              <AlertDescription className="space-y-3 text-sm">
                <p>{errorMessage}</p>
                <Button variant="outline" className="w-full rounded-full" onClick={handleRetry}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('checkout.retry')}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
    </main>
  );
};

export default CheckoutReturn;
