import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';

type ShareRedirectProps = {
  context: 'listing' | 'store';
};

const ShareRedirect = ({ context }: ShareRedirectProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }
    const target = context === 'listing' ? `/listings/${id}` : `/importers/${id}/profile`;
    navigate({ pathname: target, search: location.search }, { replace: true });
  }, [context, id, location.search, navigate]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/20 px-4">
      <span className="text-sm text-muted-foreground">{t('share.redirecting')}</span>
    </main>
  );
};

export default ShareRedirect;
