import type { Session } from '@/types';
import { demoBuyerProfile, demoImporterProfile } from '@/lib/profile-data';
import { getDemoProfileImage } from '@/lib/demoProfileImages';

export type StoredAccount = Session & {
  password: string;
};

const STORAGE_KEY = 'pl.auth.accounts';

type AccountKey = `${string}|${Session['role']}`;

const normalizeContact = (value: string) => value.replace(/\s+/g, '').toLowerCase();

const makeKey = (contact: string, role: Session['role']): AccountKey => {
  return `${normalizeContact(contact)}|${role}`;
};

const demoAccounts: StoredAccount[] = [
  {
    userId: 'demo-unverified',
    personalName: 'Ada Kameni',
    businessName: 'Kameni Trading House',
    email: 'ada@demo.prolist',
    phone: demoBuyerProfile.phone,
    displayName: 'Ada Kameni',
    contact: demoBuyerProfile.phone,
    role: 'buyer',
    hasSelectedRole: true,
    isVerified: false,
    verification: {
      status: 'unverified',
      businessName: 'Kameni Trading House',
      location: 'Douala, Cameroon',
    },
    avatarUrl: getDemoProfileImage(1),
    password: 'demo-pass',
  },
  {
    userId: 'demo-verified',
    personalName: 'Marc Tchouameni',
    businessName: demoImporterProfile.storeName,
    email: 'marc@demo.prolist',
    phone: demoImporterProfile.phone,
    displayName: 'Marc Tchouameni',
    contact: demoImporterProfile.phone,
    role: 'buyer',
    hasSelectedRole: true,
    isVerified: true,
    verification: {
      status: 'verified',
      businessName: demoImporterProfile.storeName,
      location: `${demoImporterProfile.city}, Cameroon`,
      fullName: 'Marc Tchouameni',
      dateOfBirth: '1988-02-14',
      profession: 'Importer',
      idCardFrontUrl: getDemoProfileImage(3),
      idCardBackUrl: getDemoProfileImage(5),
      selfieUrl: getDemoProfileImage(4),
    },
    avatarUrl: getDemoProfileImage(1),
    password: 'demo-pass',
  },
];

const ensureUsersMode = <T extends Session>(session: T): T => {
  if (session.isVerified) {
    return session.hasSelectedRole
      ? session
      : {
          ...session,
          hasSelectedRole: true,
        };
  }

  return {
    ...session,
    role: 'buyer',
    hasSelectedRole: true,
  };
};

const readStoredAccounts = (): StoredAccount[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAccount[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(account => account && typeof account.contact === 'string');
  } catch (error) {
    console.warn('Failed to read stored accounts', error);
    return [];
  }
};

const writeStoredAccounts = (accounts: StoredAccount[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.warn('Failed to persist accounts', error);
  }
};

export const listDemoAccounts = (): StoredAccount[] => demoAccounts;

export const listAccounts = (): StoredAccount[] => {
  const stored = readStoredAccounts();
  const map = new Map<AccountKey, StoredAccount>();

  for (const account of demoAccounts) {
    map.set(makeKey(account.contact, account.role), account);
  }

  for (const account of stored) {
    map.set(makeKey(account.contact, account.role), account);
  }

  return Array.from(map.values());
};

export const saveAccount = (account: StoredAccount) => {
  if (typeof window === 'undefined') return;

  const stored = readStoredAccounts();
  const normalized = ensureUsersMode(account);
  const key = makeKey(normalized.contact, normalized.role);
  const filtered = stored.filter(item => makeKey(item.contact, item.role) !== key);
  filtered.push(normalized);
  writeStoredAccounts(filtered);
};

export const authenticate = (
  contact: string,
  password: string,
): Session | null => {
  const accounts = listAccounts();
  const normalizedContact = normalizeContact(contact);

  const match = accounts.find(account => {
    return normalizeContact(account.contact) === normalizedContact;
  });

  if (!match) return null;
  if (match.password !== password) return null;

  const { password: _password, ...session } = match;
  return ensureUsersMode(session);
};
