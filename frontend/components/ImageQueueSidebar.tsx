"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Circle, ImageIcon } from "lucide-react";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";
import { cn } from "@/lib/utils";

type Props = {
  images: PendingImage[];
  currentId: number | null;
  onSelect: (id: number) => void;
};

// O backend roda numa instância com pouca memória: baixar várias fotos do
// Drive ao mesmo tempo derruba o processo (502 em cascata, inclusive pra
// imagem atual, que nem tem relação com a fila). Por isso as miniaturas:
// 1) só começam a carregar quando entram (ou quase) na área visível, e
// 2) carregam uma de cada vez — fila global de concorrência 1, nunca em paralelo.
let activeThumbLoads = 0;
const MAX_CONCURRENT_THUMBS = 1;
const thumbWaiters: (() => void)[] = [];

function acquireThumbSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const grant = () => {
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        activeThumbLoads--;
        const next = thumbWaiters.shift();
        if (next) next();
      });
    };
    if (activeThumbLoads < MAX_CONCURRENT_THUMBS) {
      activeThumbLoads++;
      grant();
    } else {
      thumbWaiters.push(() => {
        activeThumbLoads++;
        grant();
      });
    }
  });
}

function QueueThumb({ image, scrollRootRef }: { image: PendingImage; scrollRootRef: React.RefObject<HTMLElement | null> }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (nearViewport || !wrapperRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { root: scrollRootRef.current, rootMargin: "150px" }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [nearViewport, scrollRootRef]);

  useEffect(() => {
    if (!nearViewport) return;
    let cancelled = false;

    acquireThumbSlot().then((release) => {
      if (cancelled) {
        release();
        return;
      }
      releaseRef.current = release;
      setSrc(imagesService.contentUrl(image, 96));
    });

    return () => {
      cancelled = true;
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
    };
  }, [nearViewport, image]);

  function releaseSlot() {
    if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
  }

  return (
    <div ref={wrapperRef} className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={image.file_name}
          className="w-full h-full object-cover"
          onLoad={releaseSlot}
          onError={releaseSlot}
        />
      ) : (
        <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
      )}
    </div>
  );
}

export function ImageQueueSidebar({ images, currentId, onSelect }: Props) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return <div className="text-xs text-slate-400 text-center py-6">Nenhuma imagem na fila ainda.</div>;
  }

  return (
    <div ref={scrollRootRef} className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
      {images.map((image) => {
        const isCurrent = image.id === currentId;
        const isDone = image.status === "completed";
        const isError = image.status === "error";

        return (
          <button
            key={image.id}
            type="button"
            disabled={isDone}
            onClick={() => onSelect(image.id)}
            title={isDone ? `${image.file_name} (já cadastrada)` : image.file_name}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left transition-colors",
              isCurrent
                ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300"
                : "border-slate-200 bg-white hover:border-indigo-200",
              isDone ? "opacity-50 cursor-default hover:border-slate-200" : "cursor-pointer"
            )}
          >
            <QueueThumb image={image} scrollRootRef={scrollRootRef} />
            <span className="flex-1 min-w-0 truncate text-xs font-medium text-slate-700">{image.file_name}</span>
            {isDone ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : isError ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Circle className={cn("w-3.5 h-3.5 shrink-0", isCurrent ? "text-indigo-500" : "text-slate-300")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
