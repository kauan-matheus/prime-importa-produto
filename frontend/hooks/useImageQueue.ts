"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";

const POLL_MS = 8000;

export function useImageQueue() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const warmImage = useCallback((image: PendingImage | undefined | null) => {
    if (!image || typeof window === "undefined") return;
    const preloaded = new window.Image();
    preloaded.src = imagesService.contentUrl(image);
  }, []);

  const refresh = useCallback(async () => {
    const list = await imagesService.list();
    setImages(list);
    setCurrentId((prevId) => {
      if (prevId !== null && list.some((img) => img.id === prevId)) {
        return prevId;
      }
      const firstWorkable = list.find((img) => img.status !== "completed");
      return firstWorkable ? firstWorkable.id : null;
    });
    return list;
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // fila de trabalho: tudo que ainda não virou produto (pendente ou com erro)
  const workable = useMemo(() => images.filter((img) => img.status !== "completed"), [images]);
  const position = useMemo(() => workable.findIndex((img) => img.id === currentId), [workable, currentId]);
  const current = useMemo(() => images.find((img) => img.id === currentId) ?? null, [images, currentId]);

  useEffect(() => {
    if (position >= 0) warmImage(workable[position + 1]);
  }, [workable, position, warmImage]);

  const selectId = useCallback((id: number) => {
    setCurrentId(id);
  }, []);

  const goToOffset = useCallback(
    (offset: number) => {
      if (workable.length === 0) {
        setCurrentId(null);
        return;
      }
      const baseIndex = position === -1 ? 0 : position;
      const nextIndex = Math.min(Math.max(baseIndex + offset, 0), workable.length - 1);
      setCurrentId(workable[nextIndex].id);
    },
    [workable, position]
  );

  const skip = useCallback(() => goToOffset(1), [goToOffset]);
  const goPrev = useCallback(() => goToOffset(-1), [goToOffset]);

  const completeCurrentAndAdvance = useCallback(() => {
    if (currentId === null) return;
    const idx = workable.findIndex((img) => img.id === currentId);
    const remaining = workable.filter((img) => img.id !== currentId);

    setImages((prev) => prev.map((img) => (img.id === currentId ? { ...img, status: "completed" } : img)));
    setCurrentId(remaining.length === 0 ? null : remaining[Math.min(idx, remaining.length - 1)].id);
    void refresh();
  }, [currentId, workable, refresh]);

  return {
    current,
    loading,
    queue: images,
    position,
    total: workable.length,
    selectId,
    skip,
    goPrev,
    completeCurrentAndAdvance,
    refresh,
  };
}
