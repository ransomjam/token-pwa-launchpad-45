import type { ImgHTMLAttributes } from 'react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

export const Logo = ({ className, alt, ...props }: LogoProps) => {
  const { t } = useI18n();

  return (
    <img
      src="/images/logo.png"
      alt={alt ?? t('app.name')}
      className={cn('h-10 w-auto', className)}
      {...props}
    />
  );
};

export default Logo;
