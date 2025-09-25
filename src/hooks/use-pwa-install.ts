import { useCallback, useEffect, useMemo, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
};

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.matchMedia('(display-mode: window-controls-overlay)').matches ?? false) ||
    // @ts-expect-error - iOS Safari exposes this property on navigator
    navigator.standalone === true
  );
};

export const usePwaInstall = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isStandaloneDisplay());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    const overlayMedia = window.matchMedia('(display-mode: window-controls-overlay)');

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsInstalled(true);
      }
    };

    if (displayModeMedia.addEventListener) {
      displayModeMedia.addEventListener('change', handleDisplayModeChange);
      overlayMedia.addEventListener('change', handleDisplayModeChange);
    } else {
      // Safari < 14
      // eslint-disable-next-line deprecation/deprecation
      displayModeMedia.addListener(handleDisplayModeChange);
      // eslint-disable-next-line deprecation/deprecation
      overlayMedia.addListener(handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if (displayModeMedia.removeEventListener) {
        displayModeMedia.removeEventListener('change', handleDisplayModeChange);
        overlayMedia.removeEventListener('change', handleDisplayModeChange);
      } else {
        // eslint-disable-next-line deprecation/deprecation
        displayModeMedia.removeListener(handleDisplayModeChange);
        // eslint-disable-next-line deprecation/deprecation
        overlayMedia.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) {
      return false;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }

    return false;
  }, [promptEvent]);

  const canInstall = useMemo(() => !isInstalled && promptEvent !== null, [isInstalled, promptEvent]);

  return { canInstall, promptInstall, isInstalled } as const;
};

export type UsePwaInstall = ReturnType<typeof usePwaInstall>;
