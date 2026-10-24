"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimale store bovenop localStorage: synchroniseert tussen componenten via listeners en tussen tabbladen via
 * het native `storage`-event. Lezen/schrijven faalt stil (privémodus, volle quota):
 * dan blijft de staat enkel in het geheugen.
 *
 * Later (Shopify): de winkelmand verhuist naar de Storefront Cart API; de hooks
 * (useCart) behouden hun vorm, enkel de implementatie wijzigt.
 */
export function createLocalStore<T>(key: string, fallback: T, sanitize: (raw: unknown) => T) {
  let state: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      state = raw ? sanitize(JSON.parse(raw)) : fallback;
    } catch {
      state = fallback;
    }
    loaded = true;
  };

  const emit = () => listeners.forEach((l) => l());

  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        read();
        emit();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  const get = () => {
    if (!loaded) read();
    return state;
  };

  const set = (next: T | ((prev: T) => T)) => {
    state = typeof next === "function" ? (next as (p: T) => T)(get()) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* geheugen-only */
    }
    emit();
  };

  function useStore(): [T, boolean] {
    const value = useSyncExternalStore(subscribe, get, () => fallback);
    const hydrated = useSyncExternalStore(
      subscribe,
      () => true,
      () => false,
    );
    return [value, hydrated];
  }

  return { get, set, useStore };
}
