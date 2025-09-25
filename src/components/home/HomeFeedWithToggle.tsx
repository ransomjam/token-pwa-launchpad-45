import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { AuctionsFeed } from '@/components/auctions/AuctionsFeed';
import { HomeFeed } from './HomeFeed';
import type { Session } from '@/types';

type Mode = 'preorder' | 'auctions';

type HomeFeedWithToggleProps = {
  session: Session;
};

export const HomeFeedWithToggle = ({ session }: HomeFeedWithToggleProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const modeFromPath = useMemo<Mode>(() => (location.pathname === '/auctions' ? 'auctions' : 'preorder'), [location.pathname]);
  const [currentMode, setCurrentMode] = useState<Mode>(modeFromPath);

  useEffect(() => {
    setCurrentMode(modeFromPath);
  }, [modeFromPath]);

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
    navigate(mode === 'auctions' ? '/auctions' : '/', { replace: location.pathname === (mode === 'auctions' ? '/auctions' : '/') });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center px-6 pt-6">
        <ModeToggle currentMode={currentMode} onModeChange={handleModeChange} />
      </div>

      {currentMode === 'preorder' ? (
        <HomeFeed session={session} />
      ) : (
        <AuctionsFeed
          session={session}
          variant={location.pathname === '/auctions' ? 'page' : 'embedded'}
        />
      )}
    </div>
  );
};