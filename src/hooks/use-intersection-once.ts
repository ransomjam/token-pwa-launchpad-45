import { useEffect, useRef } from 'react';

export function useIntersectionOnce<T extends HTMLElement>(
  callback: () => void,
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null);
  const hasFired = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || hasFired.current) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasFired.current) {
          hasFired.current = true;
          callback();
          observer.disconnect();
        }
      });
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
}
