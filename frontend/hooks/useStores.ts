"use client";

import { useCallback, useEffect, useState } from "react";
import { storesService } from "@/services/storesService";
import type { Store, StoreCreateInput } from "@/types/store";

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setStores(await storesService.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createStore = useCallback(
    async (input: StoreCreateInput) => {
      const store = await storesService.create(input);
      await refetch();
      return store;
    },
    [refetch]
  );

  return { stores, loading, createStore, refetch };
}
