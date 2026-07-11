"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";

const EMPTY_QUEUE_POLL_MS = 5000;

export function useNextImage() {
  const [image, setImage] = useState<PendingImage | null>(null);
  const [nextImage, setNextImage] = useState<PendingImage | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefetchRef = useRef<number | null>(null);

  const warmImage = useCallback((pendingImage: PendingImage | null) => {
    if (!pendingImage || typeof window === "undefined") return;
    const preloaded = new window.Image();
    preloaded.src = imagesService.contentUrl(pendingImage);
  }, []);

  const loadNextAfter = useCallback(
    async (afterId?: number) => {
      const next = await imagesService.next(afterId);
      setNextImage(next);
      warmImage(next);
      return next;
    },
    [warmImage]
  );

  const fetchNext = useCallback(async () => {
    setLoading(true);
    try {
      const next = await imagesService.next();
      setImage(next);
      setNextImage(null);
      warmImage(next);
      void loadNextAfter(next?.id);
      return next;
    } finally {
      setLoading(false);
    }
  }, [loadNextAfter, warmImage]);

  const advanceToNext = useCallback(async () => {
    if (nextImage) {
      setImage(nextImage);
      setNextImage(null);
      warmImage(nextImage);
      void loadNextAfter(nextImage.id);
      return nextImage;
    }

    setLoading(true);
    try {
      const next = await imagesService.next(image?.id);
      setImage(next);
      setNextImage(null);
      warmImage(next);
      void loadNextAfter(next?.id);
      return next;
    } finally {
      setLoading(false);
    }
  }, [image?.id, loadNextAfter, nextImage, warmImage]);

  useEffect(() => {
    fetchNext();
  }, [fetchNext]);

  useEffect(() => {
    if (image !== null || nextImage !== null) return;

    timerRef.current = setInterval(() => {
      fetchNext();
    }, EMPTY_QUEUE_POLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchNext, image, nextImage]);

  return { image, loading, fetchNext: advanceToNext };
}
