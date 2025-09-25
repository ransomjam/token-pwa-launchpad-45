import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';

type Mode = 'preorder' | 'auctions';

type ModeToggleProps = {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
};

export const ModeToggle = ({ currentMode, onModeChange }: ModeToggleProps) => {
  const { t } = useI18n();

  const handleModeChange = (mode: Mode) => {
    if (mode !== currentMode) {
      trackEvent('home_mode_toggle', { from: currentMode, to: mode });
      onModeChange(mode);
    }
  };

  return (
    <div className="inline-flex items-center rounded-2xl bg-muted/60 p-1">
      <Button
        variant={currentMode === 'preorder' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('preorder')}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
          currentMode === 'preorder'
            ? "bg-background text-foreground shadow-soft"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        {t('home.modes.preorder')}
      </Button>
      <Button
        variant={currentMode === 'auctions' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('auctions')}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
          currentMode === 'auctions'
            ? "bg-background text-foreground shadow-soft"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        {t('home.modes.auctions')}
      </Button>
    </div>
  );
};