import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@/types';

const STORAGE_KEY = 'pl.session';

type SessionContextValue = {
  session: Session | null;
  setSession: (value: Session) => void;
  clearSession: () => void;
  updateSession: (updater: (current: Session) => Session) => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Session;
      setSessionState(parsed);
    } catch (error) {
      console.error('Failed to restore session', error);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setSession = useCallback((value: Session) => {
    setSessionState(value);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch (error) {
        console.error('Failed to persist session', error);
      }
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear session', error);
      }
    }
  }, []);

  const updateSession = useCallback((updater: (current: Session) => Session) => {
    setSessionState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
          console.error('Failed to persist session', error);
        }
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      session,
      setSession,
      clearSession,
      updateSession,
    }),
    [session, setSession, clearSession, updateSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
