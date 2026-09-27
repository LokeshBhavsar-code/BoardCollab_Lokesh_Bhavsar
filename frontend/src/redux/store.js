import { configureStore } from "@reduxjs/toolkit";
import canvasReducer from "./canvasSlice.js";
import roomReducer from "./roomSlice.js";

const AUTH_STORAGE_KEY = "boardcollab.auth";

export function getTokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

function readStoredAuth() {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const auth = JSON.parse(stored);
    if (!auth.token || getTokenExpiry(auth.token) <= Date.now()) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return auth;
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

const storedAuth = readStoredAuth();

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    room: roomReducer
  },
  preloadedState: storedAuth
    ? {
        room: {
          token: storedAuth.token,
          user: storedAuth.user,
          activeRoom: storedAuth.activeRoom || null,
          users: [],
          connected: false,
          error: null
        }
      }
    : undefined
});

store.subscribe(() => {
  if (typeof window === "undefined") return;
  const { token, user, activeRoom } = store.getState().room;
  try {
    if (token && getTokenExpiry(token) > Date.now()) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user, activeRoom }));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
});