"use client";

import { useSyncExternalStore } from "react";

const EVENT = "local-setting-change";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Saves a per-browser setting and notifies every component using it. */
export function writeLocalSetting(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback); // other tabs
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * A localStorage value as React state. Returns null during server rendering
 * and hydration, then the stored value.
 */
export function useLocalSetting(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}
