"use client";

import { useRef } from "react";
import { CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import type { PendingImage } from "@/types/image";
import { cn } from "@/lib/utils";
import { DriveThumb } from "@/components/DriveThumb";

type Props = {
  images: PendingImage[];
  currentId: number | null;
  onSelect: (id: number) => void;
};

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
            <DriveThumb image={image} scrollRootRef={scrollRootRef} size={96} className="w-8 h-8" />
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
