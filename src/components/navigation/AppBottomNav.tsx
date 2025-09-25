import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Gavel, PlusCircle, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

type NavVisibility = 'visible' | 'hidden';

const SCROLL_THRESHOLD = 8;
const RESTORE_DELAY = 160;

export const AppBottomNav = () => {
  const { t } = useI18n();
  const location = useLocation();
  const lastScrollY = useRef(0);
  const restoreTimeout = useRef<number | null>(null);
  const [visibility, setVisibility] = useState<NavVisibility>('visible');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (delta > SCROLL_THRESHOLD && currentY > 24) {
        setVisibility('hidden');
      } else if (delta < -SCROLL_THRESHOLD || Math.abs(delta) <= SCROLL_THRESHOLD) {
        setVisibility('visible');
      }

      if (restoreTimeout.current) {
        window.clearTimeout(restoreTimeout.current);
      }

      restoreTimeout.current = window.setTimeout(() => {
        setVisibility('visible');
      }, RESTORE_DELAY);
    };

    const handleBlur = () => {
      setVisibility('visible');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('blur', handleBlur);
      if (restoreTimeout.current) {
        window.clearTimeout(restoreTimeout.current);
      }
    };
  }, []);

  const items = useMemo(
    () => [
      {
        key: 'preorder',
        label: t('navigation.preorder'),
        href: '/',
        icon: ShoppingBag,
        color: 'text-primary',
        active: location.pathname === '/',
      },
      {
        key: 'auctions',
        label: t('navigation.auctions'),
        href: '/auctions',
        icon: Gavel,
        color: 'text-sky-500',
        active:
          location.pathname === '/auctions' ||
          location.pathname.startsWith('/auction'),
      },
      {
        key: 'add',
        label: t('navigation.add'),
        href: '/importer/create',
        icon: PlusCircle,
        color: 'text-teal-500',
        active: location.pathname.startsWith('/importer/create'),
      },
      {
        key: 'notifications',
        label: t('navigation.notifications'),
        href: '/account#notifications',
        icon: Bell,
        color: 'text-blue-500',
        active:
          location.pathname.startsWith('/account') &&
          (location.hash.includes('notifications') ||
            location.pathname === '/account'),
      },
    ],
    [location.hash, location.pathname, t]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <nav
        className={cn(
          'pointer-events-auto border-t border-border/60 bg-background/95 shadow-[0_-12px_30px_-28px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300',
          visibility === 'visible' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        )}
        aria-label={t('navigation.aria')}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.href}
                className={cn(
                  'group flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                  item.active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={item.active ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-2xl border border-transparent transition-all duration-200',
                    item.active
                      ? 'bg-gradient-to-br from-primary via-teal-500 to-blue-500 text-white shadow-[0_10px_20px_rgba(15,191,109,0.35)]'
                      : 'bg-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      item.active ? 'text-white' : item.color
                    )}
                    strokeWidth={2.4}
                  />
                </span>
                <span className="font-medium normal-case tracking-normal">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppBottomNav;
