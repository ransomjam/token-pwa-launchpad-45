import { forwardRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AccountSheet } from '@/components/shell/AccountControls';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useI18n } from '@/context/I18nContext';
import type { Session } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

export type BuyersWorkspaceHeaderProps = {
  session: Session;
  showSearch?: boolean;
};

export const BuyersWorkspaceHeader = forwardRef<HTMLElement, BuyersWorkspaceHeaderProps>(
  ({ session, showSearch = true }, ref) => {
    const { t } = useI18n();
    const [searchOpen, setSearchOpen] = useState(false);

    return (
      <header
        ref={ref}
        className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="order-1 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-white/80 shadow-soft">
                <Logo wrapperClassName="h-8 w-8" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">ProList</span>
              {PREVIEW_BADGE_VISIBLE && (
                <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {t('common.preview')}
                </Badge>
              )}
            </div>
            {showSearch && (
              <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="order-2 h-11 w-11 rounded-xl border border-border/80 bg-white/80 text-foreground shadow-soft transition hover:border-primary/50 hover:text-primary"
                    aria-label={t('home.searchPlaceholder')}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('home.searchPlaceholder')}</DialogTitle>
                  </DialogHeader>
                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('home.searchPlaceholder')}
                      aria-label={t('home.searchPlaceholder')}
                      className="h-12 rounded-full border border-border/60 bg-white/90 pl-11 pr-4 text-sm shadow-soft"
                      disabled
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <div className="order-3 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-3">
              <NotificationBell />
              <AccountSheet session={session} />
            </div>
          </div>
        </div>
      </header>
    );
  },
);

BuyersWorkspaceHeader.displayName = 'BuyersWorkspaceHeader';

