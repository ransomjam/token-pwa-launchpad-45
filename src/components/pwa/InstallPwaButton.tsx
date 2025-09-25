import { useState } from 'react';
import { Download } from 'lucide-react';

import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

type InstallPwaButtonProps = {
  className?: string;
};

export const InstallPwaButton = ({ className }: InstallPwaButtonProps) => {
  const { t } = useI18n();
  const { canInstall, promptInstall } = usePwaInstall();
  const [isPrompting, setIsPrompting] = useState(false);

  if (!canInstall) {
    return null;
  }

  const handleClick = async () => {
    try {
      setIsPrompting(true);
      await promptInstall();
    } finally {
      setIsPrompting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-9 rounded-full border-white/60 bg-white/90 px-3 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground shadow-soft backdrop-blur hover:border-primary/50 hover:text-primary',
        className,
      )}
      onClick={handleClick}
      disabled={isPrompting}
    >
      <Download className="size-3.5" aria-hidden="true" />
      <span>{t('common.installApp')}</span>
    </Button>
  );
};

export default InstallPwaButton;
