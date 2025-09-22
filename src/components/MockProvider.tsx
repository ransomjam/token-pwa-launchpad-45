import { useEffect, useState } from 'react';

export default function MockProvider() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import('@/mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => setReady(true));
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  return null;
}