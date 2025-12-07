export const loadWithFallback = <T,>(key: string, fallback: T): { data: T; seeded: boolean } => {
  if (typeof window === 'undefined') {
    return { data: fallback, seeded: true };
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return { data: fallback, seeded: true };
    }

    return { data: JSON.parse(raw) as T, seeded: false };
  } catch (error) {
    console.error(`Failed to load ${key}`, error);
    return { data: fallback, seeded: true };
  }
};

export const saveValue = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
};

export const removeValue = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key}`, error);
  }
};
