import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Camera, CheckCircle2, FileCheck2, ShieldCheck } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { VerificationSnapshot } from '@/types';
import { cn } from '@/lib/utils';

export type VerificationPayload = Pick<
  VerificationSnapshot,
  | 'businessName'
  | 'location'
  | 'fullName'
  | 'dateOfBirth'
  | 'profession'
  | 'idCardFrontUrl'
  | 'idCardBackUrl'
  | 'selfieUrl'
>;

type VerificationDialogProps = {
  open: boolean;
  initialBusinessName?: string;
  onOpenChange: (open: boolean) => void;
  onComplete: (payload: VerificationPayload) => void;
};

type VerificationFormState = {
  fullName: string;
  dateOfBirth: string;
  profession: string;
  businessName: string;
  location: string;
  idCardFrontPreview: string | null;
  idCardBackPreview: string | null;
  selfiePreview: string | null;
  idCardFrontFile?: File | null;
  idCardBackFile?: File | null;
  selfieFile?: File | null;
};

type VerificationStage = 'intro' | 'personal' | 'id' | 'selfie' | 'review' | 'submitted';

const STAGE_ORDER: VerificationStage[] = ['intro', 'personal', 'id', 'selfie', 'review', 'submitted'];

type StageCardProps = {
  stage: VerificationStage;
  title: string;
  subtitle: string;
  children?: ReactNode;
  footer?: ReactNode;
  cardRef?: (node: HTMLDivElement | null) => void;
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read file'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unknown file error'));
    reader.readAsDataURL(file);
  });
};

export const VerificationDialog = ({
  open,
  initialBusinessName,
  onOpenChange,
  onComplete,
}: VerificationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<VerificationFormState>(() => ({
    fullName: '',
    dateOfBirth: '',
    profession: '',
    businessName: initialBusinessName ?? '',
    location: '',
    idCardFrontPreview: null,
    idCardBackPreview: null,
    selfiePreview: null,
    idCardFrontFile: null,
    idCardBackFile: null,
    selfieFile: null,
  }));
  const [activeStage, setActiveStage] = useState<VerificationStage>('intro');
  const [unlockedStages, setUnlockedStages] = useState<VerificationStage[]>(['intro']);
  const [completedStages, setCompletedStages] = useState<VerificationStage[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const stageRefs = useRef<Record<VerificationStage, HTMLDivElement | null>>({} as Record<VerificationStage, HTMLDivElement | null>);

  const setStageRef = useCallback(
    (stage: VerificationStage) =>
      (node: HTMLDivElement | null) => {
        stageRefs.current[stage] = node;
      },
    [],
  );

  const resetState = useCallback(() => {
    setState({
      fullName: '',
      dateOfBirth: '',
      profession: '',
      businessName: initialBusinessName ?? '',
      location: '',
      idCardFrontPreview: null,
      idCardBackPreview: null,
      selfiePreview: null,
      idCardFrontFile: null,
      idCardBackFile: null,
      selfieFile: null,
    });
    setActiveStage('intro');
    setUnlockedStages(['intro']);
    setCompletedStages([]);
    setIsSubmitting(false);
    setHasSubmitted(false);
  }, [initialBusinessName]);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }
    setState(prev => ({
      ...prev,
      businessName: initialBusinessName ?? prev.businessName,
    }));
  }, [initialBusinessName, open, resetState]);

  const unlockStage = useCallback((stage: VerificationStage) => {
    setUnlockedStages(prev => (prev.includes(stage) ? prev : [...prev, stage]));
  }, []);

  const markStageComplete = useCallback((stage: VerificationStage) => {
    setCompletedStages(prev => (prev.includes(stage) ? prev : [...prev, stage]));
  }, []);

  const isStageUnlocked = useCallback((stage: VerificationStage) => unlockedStages.includes(stage), [unlockedStages]);
  const isStageComplete = useCallback((stage: VerificationStage) => completedStages.includes(stage), [completedStages]);

  const personalDetailsReady = useMemo(() => {
    return Boolean(
      state.fullName.trim() &&
      state.dateOfBirth.trim() &&
      state.profession.trim() &&
      state.businessName.trim() &&
      state.location.trim(),
    );
  }, [state.businessName, state.dateOfBirth, state.fullName, state.location, state.profession]);

  const documentUploadReady = useMemo(() => Boolean(state.idCardFrontPreview && state.idCardBackPreview), [
    state.idCardBackPreview,
    state.idCardFrontPreview,
  ]);

  const selfieReady = useMemo(() => Boolean(state.selfiePreview), [state.selfiePreview]);

  const canSubmit = useMemo(
    () => personalDetailsReady && documentUploadReady && selfieReady,
    [documentUploadReady, personalDetailsReady, selfieReady],
  );

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    key: 'idCardFront' | 'idCardBack' | 'selfie',
  ) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setState(prev => ({
        ...prev,
        [`${key}Preview`]: null,
        [`${key}File`]: null,
      }) as VerificationFormState);
      return;
    }

    const preview = await readFileAsDataUrl(file);
    setState(prev => ({
      ...prev,
      [`${key}Preview`]: preview,
      [`${key}File`]: file,
    }) as VerificationFormState);
  };

  const handleStart = () => {
    markStageComplete('intro');
    unlockStage('personal');
    setActiveStage('personal');
  };

  const handlePersonalComplete = () => {
    if (!personalDetailsReady) return;
    markStageComplete('personal');
    unlockStage('id');
    setActiveStage('id');
  };

  const handleDocumentsComplete = () => {
    if (!documentUploadReady) return;
    markStageComplete('id');
    unlockStage('selfie');
    setActiveStage('selfie');
  };

  const handleSelfieComplete = () => {
    if (!selfieReady) return;
    markStageComplete('selfie');
    unlockStage('review');
    setActiveStage('review');
  };

  useEffect(() => {
    const node = stageRefs.current[activeStage];
    if (!node) return;

    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeStage]);

  useEffect(() => {
    if (!open) {
      setHasSubmitted(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!canSubmit || hasSubmitted) return;
    if (!state.idCardFrontPreview || !state.idCardBackPreview || !state.selfiePreview) return;
    setIsSubmitting(true);

    const payload: VerificationPayload = {
      fullName: state.fullName.trim(),
      dateOfBirth: state.dateOfBirth.trim(),
      profession: state.profession.trim(),
      businessName: state.businessName.trim(),
      location: state.location.trim(),
      idCardFrontUrl: state.idCardFrontPreview,
      idCardBackUrl: state.idCardBackPreview,
      selfieUrl: state.selfiePreview,
    };

    onComplete(payload);
    setHasSubmitted(true);
    markStageComplete('review');
    unlockStage('submitted');
    markStageComplete('submitted');
    setActiveStage('submitted');
    setIsSubmitting(false);
  };

  const StageCard = ({ stage, title, subtitle, children, footer, cardRef }: StageCardProps) => {
    const stageNumber = STAGE_ORDER.indexOf(stage) + 1;
    const locked = !isStageUnlocked(stage);
    const complete = isStageComplete(stage);
    const active = activeStage === stage;

    return (
      <div
        ref={cardRef}
        className={cn(
          'relative flex flex-col gap-5 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur transition',
          active && 'border-primary/60 shadow-glow',
          complete && 'border-primary/60 bg-primary/10',
          locked && 'pointer-events-none opacity-60',
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-white text-sm font-semibold text-primary shadow-sm',
              complete && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {complete ? <CheckCircle2 className="h-5 w-5" /> : stageNumber}
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Step {stageNumber}</p>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        {children ? <div className="space-y-4">{children}</div> : null}
        {footer}
        {locked ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[2rem] border border-transparent bg-white/80 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            Complete the previous step to unlock
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-y-auto border-none bg-transparent p-0 shadow-none">
        <div className="relative min-h-[70vh] w-full overflow-hidden rounded-[2.25rem] border border-white/60 bg-white/80 text-foreground shadow-card backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-app-gradient opacity-90" />
          <div className="relative z-10 grid h-full grid-cols-1 gap-0 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col gap-10 p-10">
              <div className="space-y-6">
                <Badge
                  className="flex flex-col items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-4 py-3 text-primary"
                  variant="outline"
                >
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Unified verification</span>
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold leading-tight text-foreground">Complete your verification in premium stages</h2>
                  <p className="text-sm text-muted-foreground">
                    Follow a guided journey that keeps every detail aligned with your ProList brand identity.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <StageCard
                  cardRef={setStageRef('intro')}
                  stage="intro"
                  title="Getting started"
                  subtitle="Unlock every mode with one verification. Upload a photo of your ID and a quick selfie with it, confirm your business details, and you&apos;re ready to trade as a Vendor, Importer, or Merchant without restrictions."
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Begin whenever you&apos;re ready—each step saves as you move forward.
                      </p>
                      <Button
                        type="button"
                        onClick={handleStart}
                        disabled={isStageComplete('intro')}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
                      >
                        {isStageComplete('intro') ? 'In progress' : 'Start now'}
                      </Button>
                    </div>
                  }
                />

                <StageCard
                  cardRef={setStageRef('personal')}
                  stage="personal"
                  title="Personal details"
                  subtitle="Provide the exact information that appears on your identification documents so our team can verify you without delays."
                  children={
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="verification-full-name" className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                            Full name (as on ID)
                          </Label>
                          <Input
                            id="verification-full-name"
                            value={state.fullName}
                            onChange={event => setState(prev => ({ ...prev, fullName: event.target.value }))}
                            placeholder="Eg. Clarisse Ndem"
                            className="h-12 rounded-2xl border border-input bg-white/95 px-4 text-base text-foreground shadow-soft placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="verification-dob" className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                            Date of birth
                          </Label>
                          <Input
                            id="verification-dob"
                            type="date"
                            value={state.dateOfBirth}
                            onChange={event => setState(prev => ({ ...prev, dateOfBirth: event.target.value }))}
                            className="h-12 rounded-2xl border border-input bg-white/95 px-4 text-base text-foreground shadow-soft focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="verification-profession" className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                            Profession
                          </Label>
                          <Input
                            id="verification-profession"
                            value={state.profession}
                            onChange={event => setState(prev => ({ ...prev, profession: event.target.value }))}
                            placeholder="Eg. Agricultural Trader"
                            className="h-12 rounded-2xl border border-input bg-white/95 px-4 text-base text-foreground shadow-soft placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="verification-business" className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                            Business / Store name
                          </Label>
                          <Input
                            id="verification-business"
                            value={state.businessName}
                            onChange={event => setState(prev => ({ ...prev, businessName: event.target.value }))}
                            placeholder="Eg. Tchouameni Imports"
                            className="h-12 rounded-2xl border border-input bg-white/95 px-4 text-base text-foreground shadow-soft placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="verification-location" className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
                          Business location
                        </Label>
                        <Input
                          id="verification-location"
                          value={state.location}
                          onChange={event => setState(prev => ({ ...prev, location: event.target.value }))}
                          placeholder="Eg. Mile 3, Bamenda"
                          className="h-12 rounded-2xl border border-input bg-white/95 px-4 text-base text-foreground shadow-soft placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                        />
                      </div>
                    </>
                  }
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        These details help us match your ID exactly—double-check spellings before you continue.
                      </p>
                      <Button
                        type="button"
                        onClick={handlePersonalComplete}
                        disabled={!personalDetailsReady}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
                      >
                        Continue to ID upload
                      </Button>
                    </div>
                  }
                />

                <StageCard
                  cardRef={setStageRef('id')}
                  stage="id"
                  title="ID card upload"
                  subtitle="Capture both sides of the identification document you will use for trading on ProList. Ensure the images are sharp and legible."
                  children={
                    <div className="grid gap-4 md:grid-cols-2">
                      <label
                        htmlFor="verification-id-front"
                        className={cn(
                          'group relative flex h-40 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-4 text-center shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card',
                          state.idCardFrontPreview && 'border-primary/40 bg-primary/10',
                        )}
                      >
                        <input
                          id="verification-id-front"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={event => void handleFileChange(event, 'idCardFront')}
                        />
                        {state.idCardFrontPreview ? (
                          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
                            <img src={state.idCardFrontPreview} alt="ID card front" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <FileCheck2 className="h-10 w-10 text-primary" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileCheck2 className="h-10 w-10 text-primary" />
                            <p className="text-sm font-medium text-foreground">Front of ID</p>
                            <p className="text-xs text-muted-foreground">Upload the front side</p>
                          </div>
                        )}
                      </label>
                      <label
                        htmlFor="verification-id-back"
                        className={cn(
                          'group relative flex h-40 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-4 text-center shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card',
                          state.idCardBackPreview && 'border-primary/40 bg-primary/10',
                        )}
                      >
                        <input
                          id="verification-id-back"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={event => void handleFileChange(event, 'idCardBack')}
                        />
                        {state.idCardBackPreview ? (
                          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
                            <img src={state.idCardBackPreview} alt="ID card back" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <FileCheck2 className="h-10 w-10 text-primary" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <FileCheck2 className="h-10 w-10 text-primary" />
                            <p className="text-sm font-medium text-foreground">Back of ID</p>
                            <p className="text-xs text-muted-foreground">Include holograms and signatures</p>
                          </div>
                        )}
                      </label>
                    </div>
                  }
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        We accept national IDs, passports, and corporate cards with clear information.
                      </p>
                      <Button
                        type="button"
                        onClick={handleDocumentsComplete}
                        disabled={!documentUploadReady}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
                      >
                        Next: Selfie with ID
                      </Button>
                    </div>
                  }
                />

                <StageCard
                  cardRef={setStageRef('selfie')}
                  stage="selfie"
                  title="Selfie confirmation"
                  subtitle="Take a quick selfie holding the same ID card so we can match your face to the document."
                  children={
                    <label
                      htmlFor="verification-selfie"
                      className={cn(
                        'group relative flex h-44 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-4 text-center shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card',
                        state.selfiePreview && 'border-primary/40 bg-primary/10',
                      )}
                    >
                      <input
                        id="verification-selfie"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={event => void handleFileChange(event, 'selfie')}
                      />
                      {state.selfiePreview ? (
                        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl">
                          <img src={state.selfiePreview} alt="Selfie with ID" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <Camera className="h-10 w-10 text-primary" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Camera className="h-10 w-10 text-primary" />
                          <p className="text-sm font-medium text-foreground">Selfie with your ID</p>
                          <p className="text-xs text-muted-foreground">Stand in good light and keep the card visible</p>
                        </div>
                      )}
                    </label>
                  }
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Avoid glare and ensure the ID text is readable in the photo.
                      </p>
                      <Button
                        type="button"
                        onClick={handleSelfieComplete}
                        disabled={!selfieReady}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
                      >
                        Review and submit
                      </Button>
                    </div>
                  }
                />

                <StageCard
                  cardRef={setStageRef('review')}
                  stage="review"
                  title="You&apos;re all set"
                  subtitle="Confirm your entries before sending them to our verification team."
                  children={
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Full name</p>
                          <p className="text-sm font-medium text-foreground">{state.fullName || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Date of birth</p>
                          <p className="text-sm font-medium text-foreground">{state.dateOfBirth || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Profession</p>
                          <p className="text-sm font-medium text-foreground">{state.profession || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Business / Store name</p>
                          <p className="text-sm font-medium text-foreground">{state.businessName || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">Business location</p>
                          <p className="text-sm font-medium text-foreground">{state.location || '—'}</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-dashed border-primary/50 bg-primary/10 p-4 text-sm text-primary">
                        One secure submission unlocks Vendor, Importer, and Merchant workspaces across ProList.
                      </div>
                    </>
                  }
                  footer={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        All data is encrypted in transit and handled by our compliance specialists.
                      </p>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/70"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit for verification'}
                      </Button>
                    </div>
                  }
                />

                <StageCard
                  cardRef={setStageRef('submitted')}
                  stage="submitted"
                  title="Submission received"
                  subtitle="Success! We&apos;ve logged your documents and our verification team is reviewing them."
                  children={
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <p>
                        We&apos;ll confirm your verification status within <span className="font-semibold text-foreground">12 – 48 hours</span>. Keep an eye on your notifications for the green verified badge.
                      </p>
                      <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-foreground shadow-soft">
                        Continue making confident deals on ProList while we complete the checks.
                      </div>
                    </div>
                  }
                  footer={
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
                      >
                        Close and keep trading
                      </Button>
                    </div>
                  }
                />
              </div>
            </div>

            <aside className="hidden flex-col justify-between border-l border-border/60 bg-white/70 p-10 text-sm text-muted-foreground lg:flex">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">Why we take these steps</h3>
                  <p>
                    Premium verification protects every buyer, importer, and vendor in our ecosystem. Submit once and your verified badge follows you across the ProList experience.
                  </p>
                </div>
                <ul className="space-y-3">
                  <li>• Accelerated approvals for listings, deals, and payouts</li>
                  <li>• Trusted visibility across Vendor, Importer, and Merchant dashboards</li>
                  <li>• Eligibility for exclusive ProList trading programs</li>
                </ul>
              </div>
              <div className="space-y-3 rounded-3xl border border-border/70 bg-white p-6 text-sm">
                <p className="font-semibold text-foreground">Need a hand?</p>
                <p>
                  Our compliance specialists review every submission within 12–48 hours. Message us anytime if you need to update your details or upload new documents.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
