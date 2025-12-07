import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Zap, type LucideIcon } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

export type AppNavProps = {
  className?: string;
};

export const AppNav = ({ className }: AppNavProps) => {
  const location = useLocation();
  const { t } = useI18n();

  const items: Array<{
    key: string;
    label: string;
    href: string;
    active: boolean;
    icon: LucideIcon;
  }> = [
    {
      key: 'preorder',
      label: t('navigation.preorder'),
      href: '/',
      active: location.pathname === '/',
      icon: ShoppingBag,
    },
    {
      key: 'auctions',
      label: t('navigation.auctions'),
      href: '/auctions',
      active:
        location.pathname === '/auctions' ||
        location.pathname.startsWith('/auction'),
      icon: Zap,
    },
  ];

  return (
    <nav className={cn('flex flex-wrap items-center gap-2', className)} aria-label={t('navigation.aria')}>
      {items.map(item => (
        <Link
          key={item.key}
          to={item.href}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-soft',
            item.active
              ? 'bg-foreground text-background'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
          )}
          aria-current={item.active ? 'page' : undefined}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default AppNav;
