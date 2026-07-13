"use client";

import { useCallback, useEffect, useState } from "react";
import { storesService } from "@/services/storesService";
import type { Store } from "@/types/store";

const STORAGE_KEY = "prime-import:selected-store-id";

export function useSelectedStore() {
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);

  useEffect(() => {
    const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!savedId) return;

    let cancelled = false;
    storesService.list().then((stores) => {
      if (cancelled) return;
      const match = stores.find((store) => String(store.id) === savedId);
      if (match) setSelectedStoreState(match);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedStore = useCallback((store: Store) => {
    setSelectedStoreState(store);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, String(store.id));
  }, []);

  return { selectedStore, setSelectedStore };
}
