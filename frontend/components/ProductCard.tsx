"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { absoluteUrl } from "@/services/api";
import type { Product } from "@/types/product";
import { ImageOff, Pencil } from "lucide-react";

type Props = {
  product: Product;
  onEdit: (product: Product) => void;
};

export function ProductCard({ product, onEdit }: Props) {
  return (
    <Card
      className="cursor-pointer ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-md transition-all duration-200 group py-0 gap-0"
      onClick={() => onEdit(product)}
    >
      <div className="aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden rounded-t-xl">
        {product.content_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={absoluteUrl(product.content_url)}
            alt={product.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="w-8 h-8 text-slate-300" />
        )}
      </div>
      <CardContent className="flex flex-col gap-1.5 py-3">
        <p className="text-sm font-semibold text-slate-900 truncate" title={product.nome}>
          {product.nome}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-slate-500 truncate">{product.sku}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            R$ {Number(product.preco).toFixed(2)}
          </Badge>
        </div>
        <span className="flex items-center gap-1 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3" /> Editar
        </span>
      </CardContent>
    </Card>
  );
}
