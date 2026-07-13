"use client";

import { useCallback, useEffect, useState } from "react";
import { productsService } from "@/services/productsService";
import type { Product } from "@/types/product";

export function useProducts(storeId: number | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (storeId === null) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      setProducts(await productsService.list(storeId));
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const replaceProduct = useCallback((updated: Product) => {
    setProducts((prev) => prev.map((product) => (product.id === updated.id ? updated : product)));
  }, []);

  return { products, loading, refetch, replaceProduct };
}
