"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { imagesService } from "@/services/imagesService";
import type { PendingImage } from "@/types/image";
import { Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";

type Props = {
  image: PendingImage | null;
  loading: boolean;
};

export function ImageDisplay({ image, loading }: Props) {
  if (loading && !image) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-full aspect-square max-w-lg rounded-xl bg-slate-900 animate-pulse border border-slate-850" />
        <Skeleton className="h-4 w-2/3 rounded bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (!image) {
    return (
      <div className="w-full max-w-lg aspect-square rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-400 text-center p-8 transition-all duration-300 hover:border-indigo-500/30 group">
        <div className="p-4 rounded-full bg-slate-900/60 border border-slate-800 text-slate-500 mb-4 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-300">
          <ImageIcon className="w-10 h-10" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">Tudo limpo por aqui!</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
          Nenhuma imagem pendente na fila. Assim que novas imagens forem adicionadas na pasta do Google Drive, elas aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 group">
      {/* Container com moldura premium - Versão Clara */}
      <div className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm group-hover:border-indigo-500/30 transition-all duration-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagesService.contentUrl(image, 900)}
          alt={image.file_name}
          className="max-w-full max-h-full object-contain p-2 rounded-xl transition-all duration-500 group-hover:scale-[1.02]"
        />
        
        {/* Efeito de brilho de hover */}
        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs font-mono text-slate-500 truncate max-w-[70%]" title={image.file_name}>
          {image.file_name}
        </p>
        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
          <Sparkles className="w-2.5 h-2.5" />
          Importar
        </span>
      </div>
    </div>
  );
}
