import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type DistributionOptionValue = 'publish' | 'offer' | 'publish_offer';

type DistributionOption = {
  value: DistributionOptionValue;
  label: string;
  description: string;
  disabled?: boolean;
  badge?: string;
};

type DistributionCardProps = {
  title: string;
  subtitle: string;
  options: DistributionOption[];
  value: DistributionOptionValue;
  onChange: (value: DistributionOptionValue) => void;
  commissionLabel: string;
  commissionValue: string;
  successMessage?: string;
  showSuccess?: boolean;
};

export const DistributionCard = ({
  title,
  subtitle,
  options,
  value,
  onChange,
  commissionLabel,
  commissionValue,
  successMessage,
  showSuccess = false,
}: DistributionCardProps) => {
  return (
    <div className="space-y-4 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={nextValue => onChange(nextValue as DistributionOptionValue)}
        className="gap-3"
      >
        {options.map(option => (
          <label
            key={option.value}
            htmlFor={`distribution-${option.value}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/85 p-4 transition hover:border-primary/70',
              option.disabled && 'cursor-not-allowed opacity-60 hover:border-border/60'
            )}
          >
            <RadioGroupItem
              value={option.value}
              id={`distribution-${option.value}`}
              disabled={option.disabled}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{option.label}</span>
                {option.badge && (
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {option.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </label>
        ))}
      </RadioGroup>

      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium text-primary">{commissionLabel}</p>
        <p className="text-muted-foreground">{commissionValue}</p>
      </div>

      {showSuccess && successMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DistributionCard;
