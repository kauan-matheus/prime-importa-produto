"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { productSchema, type ProductFormInput, type ProductFormValues } from "@/components/ProductForm";
import { productsService } from "@/services/productsService";
import { ApiError, absoluteUrl } from "@/services/api";
import type { Category } from "@/types/store";
import type { Product } from "@/types/product";
import { ImageOff } from "lucide-react";

type Props = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  collections: Category[];
  brands: string[];
  onSaved: (updated: Product) => void;
};

export function ProductEditDialog({
  product,
  open,
  onOpenChange,
  categories,
  collections,
  brands,
  onSaved,
}: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { nome: "", descricao: "", marca: "" },
  });

  useEffect(() => {
    if (!product) return;
    reset({
      nome: product.nome,
      descricao: product.descricao ?? "",
      preco: Number(product.preco),
      preco_promocional: product.preco_promocional != null ? Number(product.preco_promocional) : undefined,
      categoria_id: product.categoria_id,
      marca: product.marca ?? "",
      collection_id: product.collection_id ?? undefined,
      estoque: product.estoque,
      peso: product.peso != null ? Number(product.peso) : undefined,
      comprimento: product.comprimento != null ? Number(product.comprimento) : undefined,
      largura: product.largura != null ? Number(product.largura) : undefined,
      altura: product.altura != null ? Number(product.altura) : undefined,
    });
  }, [product, reset]);

  if (!product) return null;

  async function onSubmit(values: ProductFormValues) {
    try {
      const updated = await productsService.update(product!.id, {
        nome: values.nome,
        descricao: values.descricao,
        preco: values.preco,
        preco_promocional: values.preco_promocional,
        estoque: values.estoque,
        peso: values.peso,
        comprimento: values.comprimento,
        largura: values.largura,
        altura: values.altura,
        categoria_id: values.categoria_id,
        marca: values.marca,
        collection_id: values.collection_id,
      });
      toast.success("Produto atualizado na Nuvemshop");
      onSaved(updated);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro inesperado ao salvar";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="w-28 h-28 mx-auto rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
            {product.content_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={absoluteUrl(`${product.content_url}?size=300`)}
                alt={product.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageOff className="w-6 h-6 text-slate-300" />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-nome" className="text-sm font-semibold text-slate-600">Nome do Produto</Label>
            <Input
              id="edit-nome"
              className="bg-white border-slate-200 text-slate-900 h-10 text-sm"
              {...register("nome")}
            />
            {errors.nome && <p className="text-xs text-rose-600 font-medium">{errors.nome.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-descricao" className="text-sm font-semibold text-slate-600">Descrição</Label>
            <Textarea
              id="edit-descricao"
              rows={3}
              className="bg-white border-slate-200 text-slate-900 resize-none text-sm"
              {...register("descricao")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-marca" className="text-sm font-semibold text-slate-600">Marca</Label>
              <Input
                id="edit-marca"
                list="edit-brands-list"
                className="bg-white border-slate-200 text-slate-900 h-10 text-sm"
                {...register("marca")}
              />
              <datalist id="edit-brands-list">
                {brands.map((brand) => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-slate-600">Coleção</Label>
              <Controller
                name="collection_id"
                control={control}
                render={({ field }) => (
                  <Select
                    items={collections.map((collection) => ({ value: String(collection.id), label: collection.name }))}
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10 text-sm">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={String(collection.id)}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-slate-600">Categoria Principal</Label>
            <Controller
              name="categoria_id"
              control={control}
              render={({ field }) => (
                <Select
                  items={categories.map((category) => ({ value: String(category.id), label: category.name }))}
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10 text-sm">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoria_id && (
              <p className="text-xs text-rose-600 font-medium">{errors.categoria_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preco" className="text-sm font-semibold text-slate-600">Preço (R$)</Label>
              <Input
                id="edit-preco"
                type="number"
                step="0.01"
                className="bg-white border-slate-200 text-slate-900 h-10 text-sm"
                {...register("preco")}
              />
              {errors.preco && <p className="text-xs text-rose-600 font-medium">{errors.preco.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-preco-promo" className="text-sm font-semibold text-slate-600">Promo (R$)</Label>
              <Input
                id="edit-preco-promo"
                type="number"
                step="0.01"
                className="bg-white border-slate-200 text-slate-900 h-10 text-sm"
                {...register("preco_promocional")}
              />
              {errors.preco_promocional && (
                <p className="text-xs text-rose-600 font-medium">{errors.preco_promocional.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-estoque" className="text-sm font-semibold text-slate-600">Qtd Estoque</Label>
              <Input
                id="edit-estoque"
                type="number"
                className="bg-white border-slate-200 text-slate-900 h-10 text-sm"
                {...register("estoque")}
              />
              {errors.estoque && <p className="text-xs text-rose-600 font-medium">{errors.estoque.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-peso" className="text-xs font-semibold text-slate-600 truncate">Peso (kg)</Label>
              <Input id="edit-peso" type="number" step="0.001" className="bg-white border-slate-200 text-slate-900 h-10 text-sm px-2" {...register("peso")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-comprimento" className="text-xs font-semibold text-slate-600 truncate">Comprimento</Label>
              <Input id="edit-comprimento" type="number" step="0.1" className="bg-white border-slate-200 text-slate-900 h-10 text-sm px-2" {...register("comprimento")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-largura" className="text-xs font-semibold text-slate-600 truncate">Largura</Label>
              <Input id="edit-largura" type="number" step="0.1" className="bg-white border-slate-200 text-slate-900 h-10 text-sm px-2" {...register("largura")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-altura" className="text-xs font-semibold text-slate-600 truncate">Altura</Label>
              <Input id="edit-altura" type="number" step="0.1" className="bg-white border-slate-200 text-slate-900 h-10 text-sm px-2" {...register("altura")} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-semibold py-6 rounded-xl mt-2 h-12 text-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
