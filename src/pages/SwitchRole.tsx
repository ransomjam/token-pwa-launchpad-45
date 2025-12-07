import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { AccountSwitcherContent } from '@/components/shell/AccountControls';

const SwitchRolePage = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">{t('common.back')}</span>
          </Button>
          <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t('roles.switchTitle')}
          </h1>
          <div className="w-10" aria-hidden />
        </div>

        <AccountSwitcherContent session={session} />
      </div>
    </main>
  );
};

export default SwitchRolePage;
