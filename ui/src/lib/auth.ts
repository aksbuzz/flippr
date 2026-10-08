import { useSyncExternalStore } from 'react';

const TOKEN_KEY = 'flippr.adminToken';

type AuthState = {
  token: string | null;
  /** True after the API answered 401 and the user has not yet dealt with it. */
  authRequired: boolean;
};

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

let state: AuthState = { token: readStoredToken(), authRequired: false };
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach(l => l());
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAuthState = () => state;
export const getToken = () => state.token;

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable: keep the token in memory only
  }
  setState({ token, authRequired: false });
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  setState({ token: null, authRequired: false });
}

export function requireAuth() {
  if (!state.authRequired) setState({ ...state, authRequired: true });
}

export function dismissAuthPrompt() {
  if (state.authRequired) setState({ ...state, authRequired: false });
}

export const useAuth = () => useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);
