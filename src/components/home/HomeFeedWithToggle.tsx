import { useState } from 'react';
import { ModeToggle } from './ModeToggle';
import { AuctionsFeed } from '@/components/auctions/AuctionsFeed';
import { HomeFeed } from './HomeFeed';
import type { Session } from '@/types';

type Mode = 'preorder' | 'auctions';

type HomeFeedWithToggleProps = {
  session: Session;
};

export const HomeFeedWithToggle = ({ session }: HomeFeedWithToggleProps) => {
  const [currentMode, setCurrentMode] = useState<Mode>('preorder');

  return (
    <div className="space-y-6">
      <div className="flex justify-center px-6 pt-6">
        <ModeToggle currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>
      
      {currentMode === 'preorder' ? (
        <HomeFeed session={session} />
      ) : (
        <AuctionsFeed />
      )}
    </div>
  );
};