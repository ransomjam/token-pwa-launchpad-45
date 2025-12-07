import { useMemo, useState } from 'react';

import { SignInForm } from '@/components/auth/SignInForm';
import { UnifiedAccountLanding } from '@/components/auth/UnifiedAccountLanding';
import type { Session } from '@/types';
import { listDemoAccounts, saveAccount, type StoredAccount } from '@/lib/authStorage';

type SignInFlowProps = {
  onAuthenticated: (session: Session) => void;
};

type FlowStep = 'landing' | 'signIn';

export const SignInFlow = ({ onAuthenticated }: SignInFlowProps) => {
  const [step, setStep] = useState<FlowStep>('landing');
  const demoAccounts = useMemo(() => listDemoAccounts(), []);

  const persistAndAuthenticate = (session: Session, password: string) => {
    const normalizedSession: Session = session.isVerified
      ? { ...session, hasSelectedRole: true }
      : { ...session, role: 'buyer', hasSelectedRole: true };

    saveAccount({ ...normalizedSession, password });
    onAuthenticated(normalizedSession);
  };

  const handleAccountCreated = (session: Session, password: string) => {
    persistAndAuthenticate(session, password);
  };

  const handleGoogleAccountCreated = (session: Session, password: string) => {
    persistAndAuthenticate(
      {
        ...session,
        verification: session.verification ?? {
          status: 'unverified',
          businessName: session.businessName,
          location: '',
        },
      },
      password,
    );
  };

  const handleDemoLogin = (account: StoredAccount) => {
    const { password: _password, ...session } = account;
    const normalizedSession: Session = session.isVerified
      ? { ...session, hasSelectedRole: true }
      : { ...session, role: 'buyer', hasSelectedRole: true };
    onAuthenticated(normalizedSession);
  };

  if (step === 'signIn') {
    return <SignInForm onBack={() => setStep('landing')} onAuthenticated={onAuthenticated} />;
  }

  return (
    <UnifiedAccountLanding
      demoAccounts={demoAccounts}
      onAccountCreated={handleAccountCreated}
      onGoogleAccountCreated={handleGoogleAccountCreated}
      onShowSignIn={() => setStep('signIn')}
      onDemoLogin={handleDemoLogin}
    />
  );
};

