import { type ReactNode, useEffect, useState } from 'react';

type MockProviderProps = {
  children: ReactNode;
};

export default function MockProvider({ children }: MockProviderProps) {
  const [ready, setReady] = useState(() => !import.meta.env.DEV);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;

    import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(error => {
        console.error('Failed to start mock service worker', error);
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
