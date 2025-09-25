import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { useI18n } from '@/context/I18nContext';
import { cn } from '@/lib/utils';

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
};

export const Logo = ({
  className,
  alt,
  style,
  wrapperClassName,
  wrapperStyle,
  ...props
}: LogoProps) => {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-teal to-blue p-2',
        wrapperClassName,
      )}
      style={wrapperStyle}
    >
      <img
        src="/images/logo-transparent.png"
        alt={alt ?? t('app.name')}
        className={cn('h-full w-full rounded-2xl object-contain', className)}
        style={style}
        {...props}
      />
    </div>
  );
};

export default Logo;
