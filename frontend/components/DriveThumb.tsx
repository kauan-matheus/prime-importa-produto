"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";
import { cn } from "@/lib/utils";

// O backend baixa a miniatura do Drive sob demanda; uma rajada grande de
// requisições simultâneas ainda pesa na instância (pouca memória). Por isso
// as miniaturas, em qualquer lugar do app (sidebar, modal de escolha):
// 1) só começam a carregar quando entram (ou quase) na área visível, e
// 2) compartilham UMA fila global de concorrência limitada — se cada
//    componente tivesse sua própria fila, abrir o modal em cima da sidebar
//    dobraria a concorrência real sem a gente perceber.
let activeThumbLoads = 0;
const MAX_CONCURRENT_THUMBS = 4;
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

type Props = {
  image: PendingImage;
  scrollRootRef: React.RefObject<HTMLElement | null>;
  size?: number;
  className?: string;
  iconClassName?: string;
};

export function DriveThumb({ image, scrollRootRef, size = 96, className, iconClassName }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

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
      setSrc(imagesService.contentUrl(image, size));
    });

    return () => {
      cancelled = true;
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
    };
    // Depende só de id/size (valores estáveis), não do objeto `image` inteiro:
    // a cada poll da fila (8s), a API devolve uma nova referência pra cada
    // imagem mesmo sem nada ter mudado. Se o efeito dependesse do objeto,
    // toda miniatura ainda carregando reiniciava a cada poll e voltava pro
    // fim da fila de concorrência — com 30+ itens e poucos slots, a maioria
    // nunca chegava a terminar (só as poucas rápidas o suficiente venciam
    // a corrida contra o próximo poll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearViewport, image.id, size]);

  function releaseSlot() {
    if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
  }

  return (
    <div ref={wrapperRef} className={cn("rounded-md overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center", className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={image.file_name}
          className="w-full h-full object-cover"
          onLoad={releaseSlot}
          onError={() => {
            setFailed(true);
            releaseSlot();
          }}
        />
      ) : (
        <ImageIcon className={cn("w-3.5 h-3.5 text-slate-300", iconClassName)} />
      )}
    </div>
  );
}
