import { useCallback, useState } from 'react';

import { ModeChooser } from '@/components/onboarding/ModeChooser';
import { AccountCreation } from '@/components/onboarding/AccountCreation';
import { VendorActivation } from '@/components/onboarding/VendorActivation';
import { ImporterActivation } from '@/components/onboarding/ImporterActivation';
import { BuyerSuccess } from '@/components/onboarding/BuyerSuccess';
import type { Session } from '@/types';
import { activateDemoMode } from '@/lib/demoMode';

type SignInFlowProps = {
  onAuthenticated: (session: Session) => void;
};

type FlowStep = 'mode' | 'account' | 'vendorActivation' | 'importerActivation' | 'buyerSuccess';

export const SignInFlow = ({ onAuthenticated }: SignInFlowProps) => {
  const [step, setStep] = useState<FlowStep>('mode');
  const [selectedRole, setSelectedRole] = useState<Session['role'] | null>(null);
  const [isDemoVendor, setIsDemoVendor] = useState(false);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  const resetFlow = useCallback(() => {
    setSelectedRole(null);
    setIsDemoVendor(false);
    setPendingSession(null);
  }, []);

  const goToModeChooser = useCallback(() => {
    resetFlow();
    setStep('mode');
  }, [resetFlow]);

  const handleModeSelected = useCallback((role: Session['role'], demoVendor?: boolean) => {
    setSelectedRole(role);
    setIsDemoVendor(Boolean(demoVendor));
    setPendingSession(null);
    setStep('account');
  }, []);

  const handleAccountCreated = useCallback((session: Session) => {
    setPendingSession(session);

    if (session.role === 'buyer') {
      setStep('buyerSuccess');
      return;
    }

    if (session.role === 'vendor') {
      setStep('vendorActivation');
      return;
    }

    setStep('importerActivation');
  }, []);

  const finalizeSession = useCallback(
    (overrides?: Partial<Session>) => {
      if (!pendingSession) return;
      const nextSession: Session = { ...pendingSession, ...overrides };
      onAuthenticated(nextSession);
    },
    [onAuthenticated, pendingSession],
  );

  const handleVendorActivationComplete = useCallback(
    (_isVerified: boolean) => {
      finalizeSession();
    },
    [finalizeSession],
  );

  const handleVendorSkipToDemo = useCallback(() => {
    activateDemoMode();
    finalizeSession();
  }, [finalizeSession]);

  const handleImporterActivationComplete = useCallback(
    (isVerified: boolean) => {
      if (!isVerified) {
        activateDemoMode();
      }
      finalizeSession({ verifiedImporter: isVerified });
    },
    [finalizeSession],
  );

  const handleImporterSkipToDemo = useCallback(() => {
    activateDemoMode();
    finalizeSession({ verifiedImporter: true });
  }, [finalizeSession]);

  const handleBuyerContinue = useCallback(() => {
    finalizeSession();
  }, [finalizeSession]);

  if (step === 'mode') {
    return <ModeChooser onModeSelected={handleModeSelected} />;
  }

  if (step === 'account' && selectedRole) {
    return (
      <AccountCreation
        selectedRole={selectedRole}
        isDemoVendor={isDemoVendor}
        onAccountCreated={handleAccountCreated}
        onBack={goToModeChooser}
      />
    );
  }

  if (!pendingSession) {
    return <ModeChooser onModeSelected={handleModeSelected} />;
  }

  if (step === 'vendorActivation') {
    return (
      <VendorActivation
        session={pendingSession}
        onActivationComplete={handleVendorActivationComplete}
        onSkipToDemo={handleVendorSkipToDemo}
      />
    );
  }

  if (step === 'importerActivation') {
    return (
      <ImporterActivation
        session={pendingSession}
        onActivationComplete={handleImporterActivationComplete}
        onSkipToDemo={handleImporterSkipToDemo}
      />
    );
  }

  if (step === 'buyerSuccess') {
    return <BuyerSuccess session={pendingSession} onContinue={handleBuyerContinue} />;
  }

  return <ModeChooser onModeSelected={handleModeSelected} />;
};
