import * as React from "react";

const STORAGE_KEY = "jotazo:selected-city";

export type SelectedCity = { id: string; name: string; state: string };

function read(): SelectedCity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SelectedCity;
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  const onCity = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("city:changed", onCity);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("city:changed", onCity);
    window.removeEventListener("storage", onStorage);
  };
}

let cache: SelectedCity | null | undefined;
let cacheRaw: string | null | undefined;
function getSnapshot(): SelectedCity | null {
  const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (raw === cacheRaw) return cache ?? null;
  cacheRaw = raw;
  cache = raw ? (() => { try { return JSON.parse(raw) as SelectedCity; } catch { return null; } })() : null;
  return cache;
}

function getServerSnapshot(): SelectedCity | null {
  return null;
}

export function useSelectedCity() {
  const city = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = city ? `${city.name}/${city.state}` : null;
  return { city, label };
}

export function getSelectedCity(): SelectedCity | null {
  return read();
}
