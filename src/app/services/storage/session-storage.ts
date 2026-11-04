export const RETURN_URL_STORAGE_KEY = 'azerothcore.catalogue.returnUrl';

// sessionStorage throws when the browser blocks it, e.g. in a third-party iframe
export function readSessionItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSessionItem(key: string, value: string | null): void {
  try {
    if (value === null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {}
}
