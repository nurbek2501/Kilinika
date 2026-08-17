// Access token is kept in sessionStorage (not a cookie) so that each browser
// tab has its own isolated session. This prevents logging in as one role in a
// second tab from overwriting the session of a tab that is showing another role.

const KEY = 'accessToken';

export const tokenStore = {
  get(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return window.sessionStorage.getItem(KEY) ?? undefined;
  },
  set(token: string): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(KEY, token);
  },
  remove(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(KEY);
  },
};
