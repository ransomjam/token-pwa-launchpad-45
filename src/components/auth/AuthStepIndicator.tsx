import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

type AuthStep = 'contact' | 'otp' | 'role';

type Props = {
  current: AuthStep;
};

const steps: { id: Exclude<AuthStep, 'contact'>; order: number; labelKey: string }[] = [
  { id: 'otp', order: 1, labelKey: 'auth.stepOne' },
  { id: 'role', order: 2, labelKey: 'auth.stepTwo' },
];

export const AuthStepIndicator = ({ current }: Props) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-center gap-3 text-sm font-medium text-muted-foreground">
      {steps.map((step, index) => {
        const isActive =
          step.id === current || (step.id === 'otp' && (current === 'contact' || current === 'otp')) || (current === 'role' && step.id === 'otp');

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors',
                isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
              )}
            >
              {step.order}
            </div>
            <span className={cn('tracking-tight', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {t(step.labelKey)}
            </span>
            {index < steps.length - 1 && <span className="text-muted-foreground">•</span>}
          </div>
        );
      })}
    </div>
  );
};
