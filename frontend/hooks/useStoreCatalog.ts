"use client";

import { useEffect, useState } from "react";
import { storesService } from "@/services/storesService";
import type { Category } from "@/types/store";

export function useStoreCatalog(storeId: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (storeId === null) {
      setCategories([]);
      setCollections([]);
      setBrands([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      storesService.categories(storeId),
      storesService.collections(storeId),
      storesService.brands(storeId),
    ])
      .then(([categoriesRes, collectionsRes, brandsRes]) => {
        if (cancelled) return;
        setCategories(categoriesRes);
        setCollections(collectionsRes);
        setBrands(brandsRes);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return { categories, collections, brands, loading };
}
