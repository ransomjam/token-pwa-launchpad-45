import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MockPsp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ref = searchParams.get('ref');
  const orderId = searchParams.get('order');
  const returnUrl = searchParams.get('return');

  const displayRef = useMemo(() => ref ?? 'PSP-SESSION', [ref]);

  const handleResult = (status: 'success' | 'failed' | 'cancelled') => {
    if (!returnUrl) {
      navigate('/', { replace: true });
      return;
    }
    const target = new URL(returnUrl, window.location.origin);
    if (orderId && !target.searchParams.get('order')) {
      target.searchParams.set('order', orderId);
    }
    target.searchParams.set('status', status);
    window.location.href = target.toString();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-12 text-white">
      <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white/95 p-6 text-slate-900 shadow-2xl">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Mock PSP</p>
          <h1 className="text-2xl font-semibold">Secure Checkout</h1>
          <p className="text-sm text-slate-500">Session {displayRef}</p>
        </div>
        <div className="space-y-3">
          <Button className="w-full rounded-full bg-emerald-600 py-3 text-base font-semibold text-white hover:bg-emerald-500" onClick={() => handleResult('success')}>
            Succeed payment
          </Button>
          <Button className="w-full rounded-full bg-rose-600 py-3 text-base font-semibold text-white hover:bg-rose-500" onClick={() => handleResult('failed')}>
            Fail payment
          </Button>
          <Button className="w-full rounded-full border border-slate-200 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100" variant="outline" onClick={() => handleResult('cancelled')}>
            Cancel payment
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400">
          This sandbox simulates returning to your escrow order after a PSP redirect.
        </p>
      </div>
    </main>
  );
};

export default MockPsp;
