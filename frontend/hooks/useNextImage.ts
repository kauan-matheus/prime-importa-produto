"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";

const EMPTY_QUEUE_POLL_MS = 5000;

export function useNextImage() {
  const [image, setImage] = useState<PendingImage | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNext = useCallback(async () => {
    setLoading(true);
    try {
      const next = await imagesService.next();
      setImage(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNext();
  }, [fetchNext]);

  useEffect(() => {
    if (image !== null) return;

    timerRef.current = setInterval(() => {
      fetchNext();
    }, EMPTY_QUEUE_POLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [image, fetchNext]);

  return { image, loading, fetchNext };
}
