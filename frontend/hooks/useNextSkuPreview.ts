"use client";

import { useEffect, useState } from "react";
import { productsService } from "@/services/productsService";

export function useNextSkuPreview(imageId: number | undefined) {
  const [sku, setSku] = useState<string>("");

  useEffect(() => {
    if (imageId === undefined) {
      setSku("");
      return;
    }
    let cancelled = false;
    productsService.nextSkuPreview().then((res) => {
      if (!cancelled) setSku(res.sku);
    });
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  return sku;
}
