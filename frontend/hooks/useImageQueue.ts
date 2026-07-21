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
    preloaded.src = imagesService.contentUrl(image, 900);
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

  const nextWorkableId = position >= 0 ? workable[position + 1]?.id : undefined;

  useEffect(() => {
    if (nextWorkableId === undefined) return;
    const nextImage = workable.find((img) => img.id === nextWorkableId);
    if (nextImage) warmImage(nextImage);
    // Depende só do id do "próximo" (estável), não do array `workable` inteiro:
    // o poll da fila (8s) sempre devolve um array novo, mesmo sem nada mudar
    // de verdade, o que reiniciaria esse efeito e ficaria re-pré-carregando a
    // mesma imagem sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextWorkableId, warmImage]);

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
    // fila de trabalho pra exibir (sidebar/modal) — não inclui produtos já
    // criados, senão a lista fica cheia de itens que não dá mais pra escolher
    workable,
    position,
    total: workable.length,
    selectId,
    skip,
    goPrev,
    completeCurrentAndAdvance,
    refresh,
  };
}
