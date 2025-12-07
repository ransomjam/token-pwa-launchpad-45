import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DiscoverCreators } from './DiscoverCreators';
import { MyFollows } from './MyFollows';
import { Followers } from './Followers';
import { BuyersWorkspaceHeader } from '@/components/buyers/BuyersWorkspaceHeader';
import type { Session } from '@/types';

type FollowingTabProps = {
  session: Session;
};

export const FollowingTab = ({ session }: FollowingTabProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'followers'>('discover');
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <BuyersWorkspaceHeader ref={headerRef} session={session} />
        <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />
        <div className="flex-1 px-4 pb-28 pt-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0">
                  <TabsTrigger
                    value="discover"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {t('following.discover')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="following"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {t('following.myFollows')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="followers"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {t('following.followersTab')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="discover" className="flex-1 mt-0">
                  <DiscoverCreators />
                </TabsContent>

                <TabsContent value="following" className="flex-1 mt-0">
                  <MyFollows onShowDiscover={() => setActiveTab('discover')} />
                </TabsContent>

                <TabsContent value="followers" className="flex-1 mt-0">
                  <Followers />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
