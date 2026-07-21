"use client";

import { useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DriveThumb } from "@/components/DriveThumb";
import type { PendingImage } from "@/types/image";
import { cn } from "@/lib/utils";

type Props = {
  images: PendingImage[];
  currentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: number) => void;
};

export function ImagePickerModal({ images, currentId, open, onOpenChange, onSelect }: Props) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher foto</DialogTitle>
          <DialogDescription>Clique numa foto da fila do Drive pra usar ela no formulário.</DialogDescription>
        </DialogHeader>

        {images.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-10">Nenhuma imagem na fila ainda.</div>
        ) : (
          <div ref={scrollRootRef} className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {images.map((image) => {
              const isCurrent = image.id === currentId;
              const isError = image.status === "error";

              return (
                <button
                  key={image.id}
                  type="button"
                  title={image.file_name}
                  onClick={() => {
                    onSelect(image.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "relative flex flex-col gap-1 rounded-xl border p-1.5 text-left transition-colors cursor-pointer",
                    isCurrent
                      ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  )}
                >
                  <DriveThumb image={image} scrollRootRef={scrollRootRef} size={160} className="w-full aspect-square" iconClassName="w-5 h-5" />
                  <span className="truncate text-[10px] font-medium text-slate-600 px-0.5">{image.file_name}</span>
                  {isError && <AlertTriangle className="absolute top-2 right-2 w-4 h-4 text-amber-500 bg-white rounded-full" />}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
