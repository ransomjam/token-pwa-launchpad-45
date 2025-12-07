import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Handshake, PenSquare, ShoppingBag, Users, Zap, Plus } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

type NavVisibility = 'visible' | 'hidden';

const SCROLL_THRESHOLD = 8;
const RESTORE_DELAY = 160;

export const AppBottomNav = () => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const restoreTimeout = useRef<number | null>(null);
  const [visibility, setVisibility] = useState<NavVisibility>('visible');
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

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
        key: 'auctions',
        label: t('navigation.auctions'),
        href: '/auctions',
        icon: Zap,
        color: 'text-teal-500',
        active:
          location.pathname === '/auctions' ||
          location.pathname.startsWith('/auction'),
      },
      {
        key: 'preorder',
        label: t('navigation.preorder'),
        href: '/',
        icon: ShoppingBag,
        color: 'text-teal-500',
        active: location.pathname === '/',
      },
      {
        key: 'create',
        label: 'Create',
        href: '/user/create-post',
        icon: Plus,
        color: 'text-blue',
        active:
          location.pathname === '/user/create-post' ||
          location.pathname === '/user/posts',
        isAction: true,
      },
      {
        key: 'listings',
        label: t('navigation.listings'),
        href: '/buyers/listings',
        icon: ShoppingBag,
        color: 'text-teal-500',
        active: location.pathname === '/buyers/listings',
      },
      {
        key: 'following',
        label: t('navigation.following'),
        href: '/buyers/following',
        icon: Users,
        color: 'text-teal-500',
        active:
          location.pathname === '/buyers/following' ||
          location.pathname === '/buyer/following' ||
          location.pathname === '/following',
      },
    ],
    [location.pathname, t]
  );

  const handleStartDeal = () => {
    setIsCreateSheetOpen(false);
    navigate('/buyers/deals');
  };

  const handleCreatePost = () => {
    setIsCreateSheetOpen(false);
    navigate('/user/create-post');
  };

  return (
    <>
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
              const isActionButton = 'isAction' in item && item.isAction;
              const baseClasses = cn(
                'group flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                item.active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              );

              const iconClasses = cn(
                'flex h-9 w-9 items-center justify-center rounded-2xl border border-transparent transition-all duration-200',
                isActionButton
                  ? 'bg-gradient-to-br from-blue via-blue to-teal text-white shadow-[0_12px_24px_rgba(2,132,199,0.35)]'
                  : item.active
                  ? 'bg-gradient-to-br from-primary via-teal-500 to-blue-500 text-white shadow-[0_10px_20px_rgba(15,191,109,0.35)]'
                  : 'bg-transparent'
              );

              const iconColor = cn(
                'h-5 w-5 transition-colors',
                isActionButton || item.active ? 'text-white' : item.color
              );

              if (isActionButton) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setIsCreateSheetOpen(true)}
                    className={baseClasses}
                    aria-pressed={item.active}
                  >
                    <span className={iconClasses}>
                      <Icon className={iconColor} strokeWidth={2.4} />
                    </span>
                    <span className="font-medium normal-case tracking-normal">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={baseClasses}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <span className={iconClasses}>
                    <Icon className={iconColor} strokeWidth={2.4} />
                  </span>
                  <span className="font-medium normal-case tracking-normal">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent side="bottom" className="px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Choose an action</SheetTitle>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleStartDeal}
              className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-border bg-card text-foreground shadow-sm transition hover:border-primary"
            >
              <Handshake className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">Start Deal</span>
            </Button>
            <Button
              onClick={handleCreatePost}
              className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue via-blue to-teal text-white shadow-lg transition hover:opacity-90"
            >
              <PenSquare className="h-6 w-6" />
              <span className="text-sm font-semibold">Create Post</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AppBottomNav;
