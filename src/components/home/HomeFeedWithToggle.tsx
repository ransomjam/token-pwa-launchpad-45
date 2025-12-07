import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AuctionsFeed } from '@/components/auctions/AuctionsFeed';
import { HomeFeed } from './HomeFeed';
import { FollowingTab } from '@/components/followers/FollowingTab';
import { DealsHub } from '@/pages/DealsHub';
import { AppBottomNav } from '@/components/navigation/AppBottomNav';
import type { Session } from '@/types';

type Mode = 'preorder' | 'auctions' | 'following' | 'deals';

type HomeFeedWithToggleProps = {
  session: Session;
};

export const HomeFeedWithToggle = ({ session }: HomeFeedWithToggleProps) => {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const modeFromPath = useMemo<Mode>(() => {
    if (location.pathname === '/auctions') return 'auctions';
    if (
      location.pathname === '/following' ||
      location.pathname === '/buyer/following' ||
      location.pathname === '/buyers/following'
    )
      return 'following';
    if (
      location.pathname === '/buyers/deals' ||
      location.pathname === '/buyer/deals' ||
      location.pathname === '/deals'
    )
      return 'deals';
    return 'preorder';
  }, [location.pathname]);
  const [currentMode, setCurrentMode] = useState<Mode>(modeFromPath);

  useEffect(() => {
    setCurrentMode(modeFromPath);
  }, [modeFromPath]);

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
    const path =
      mode === 'auctions'
        ? '/auctions'
        : mode === 'following'
          ? '/buyers/following'
          : mode === 'deals'
            ? '/buyers/deals'
            : '/';
    navigate(path, { replace: location.pathname === path });
  };

  return (
    <>
      <div className="pb-28">
        <Tabs value={currentMode} onValueChange={(v) => handleModeChange(v as Mode)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
            <TabsTrigger
              value="preorder"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('home.modes.preorder')}
            </TabsTrigger>
            <TabsTrigger
              value="auctions"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('home.modes.auctions')}
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('following.tab')}
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t('navigation.deals') ?? 'Deals'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preorder" className="mt-0">
            <HomeFeed session={session} />
          </TabsContent>

          <TabsContent value="auctions" className="mt-0">
            <AuctionsFeed
              session={session}
              variant={location.pathname === '/auctions' ? 'page' : 'embedded'}
            />
          </TabsContent>

          <TabsContent value="following" className="mt-0">
            <FollowingTab session={session} />
          </TabsContent>

          <TabsContent value="deals" className="mt-0">
            <DealsHub session={session} />
          </TabsContent>
        </Tabs>
      </div>
      <AppBottomNav />
    </>
  );
};