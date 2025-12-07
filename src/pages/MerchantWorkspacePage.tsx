import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SignInFlow } from '@/components/auth/SignInFlow';
import { useSession } from '@/context/SessionContext';
import { MerchantWorkspace, type MerchantPrimaryTab, type MerchantSubview } from '@/components/merchant/MerchantWorkspace';

const deriveStateFromPath = (pathname: string): { tab: MerchantPrimaryTab; view: MerchantSubview } => {
  if (pathname.startsWith('/merchant/preorder/mine')) {
    return { tab: 'preorders', view: 'reposts' };
  }
  if (pathname.startsWith('/merchant/preorder')) {
    return { tab: 'preorders', view: 'catalog' };
  }
  if (pathname.startsWith('/merchant/listings/mine')) {
    return { tab: 'listings', view: 'reposts' };
  }
  if (pathname.startsWith('/merchant/listings')) {
    return { tab: 'listings', view: 'catalog' };
  }
  if (pathname.startsWith('/merchant/follows')) {
    return { tab: 'follows', view: 'catalog' };
  }
  return { tab: 'listings', view: 'catalog' };
};

const buildPath = (tab: MerchantPrimaryTab, view: MerchantSubview): string => {
  if (tab === 'listings') {
    return view === 'catalog' ? '/merchant/listings' : '/merchant/listings/mine';
  }
  if (tab === 'preorders') {
    return view === 'catalog' ? '/merchant/preorder' : '/merchant/preorder/mine';
  }
  return '/merchant/follows';
};

const MerchantWorkspacePage = () => {
  const { session, setSession, updateSession } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const { tab, view } = deriveStateFromPath(location.pathname);

  useEffect(() => {
    if (location.pathname === '/merchant') {
      navigate('/merchant/listings', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!session || session.role === 'merchant') return;
    updateSession(current => ({ ...current, role: 'merchant', hasSelectedRole: true }));
  }, [session, updateSession]);

  const handleTabChange = (nextTab: MerchantPrimaryTab) => {
    const nextPath =
      nextTab === 'follows'
        ? buildPath(nextTab, 'catalog')
        : buildPath(nextTab, nextTab === tab ? view : 'catalog');
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const handleViewChange = (nextView: MerchantSubview) => {
    if (tab === 'follows') return;
    const nextPath = buildPath(tab, nextView);
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  if (!session) {
    return <SignInFlow onAuthenticated={setSession} />;
  }

  const effectiveSession = session.role === 'merchant' ? session : { ...session, role: 'merchant' as const };

  return (
    <MerchantWorkspace
      session={effectiveSession}
      activeTab={tab}
      activeView={view}
      onTabChange={handleTabChange}
      onViewChange={handleViewChange}
    />
  );
};

export default MerchantWorkspacePage;
