export const getStoredNumber = (key: string, fallback: number): number => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export const setStoredNumber = (key: string, value: number): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, `${value}`);
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};
