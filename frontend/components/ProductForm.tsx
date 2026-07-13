"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useNextSkuPreview } from "@/hooks/useNextSkuPreview";
import { productsService } from "@/services/productsService";
import { ApiError } from "@/services/api";
import type { Category, Store } from "@/types/store";
import type { PendingImage } from "@/types/image";
import { FileText, Tag, FolderOpen, DollarSign, ArrowRight, Truck } from "lucide-react";

const numberField = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number({ message }).min(0, "Deve ser maior ou igual a zero")
  );

const optionalNumberField = () =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(0, "Deve ser maior ou igual a zero").optional()
  );

export const productSchema = z
  .object({
    nome: z.string().min(1, "Obrigatório"),
    descricao: z.string().optional(),
    preco: numberField("Informe o preço"),
    preco_promocional: optionalNumberField(),
    categoria_id: z.coerce.number({ message: "Selecione uma categoria" }),
    marca: z.string().optional(),
    collection_id: optionalNumberField(),
    estoque: numberField("Informe o estoque"),
    peso: optionalNumberField(),
    comprimento: optionalNumberField(),
    largura: optionalNumberField(),
    altura: optionalNumberField(),
  })
  .refine(
    (data) => data.preco_promocional === undefined || data.preco_promocional < data.preco,
    { message: "Deve ser menor que o preço", path: ["preco_promocional"] }
  );

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;

type Props = {
  store: Store;
  image: PendingImage;
  categories: Category[];
  collections: Category[];
  brands: string[];
  onSaved: () => void;
};

export function ProductForm({ store, image, categories, collections, brands, onSaved }: Props) {
  const skuPreview = useNextSkuPreview(image.id);

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
    reset({ nome: "", descricao: "", marca: "" });
  }, [image.id, reset]);

  async function onSubmit(values: ProductFormValues) {
    try {
      await productsService.create({
        store_id: store.id,
        drive_file_id: image.drive_file_id,
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
      toast.success("Produto criado na Nuvemshop");
      onSaved();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Erro inesperado ao salvar";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full">
      {/* Banner de SKU com animação sutil - Versão Clara */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Próximo SKU Ativo</span>
        </div>
        <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-md">
          {skuPreview}
        </span>
      </div>

      {/* SEÇÃO 1: DADOS BÁSICOS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-650 border-b border-slate-100 pb-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Dados Principais</h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome" className="text-sm font-semibold text-slate-600">Nome do Produto</Label>
          <Input 
            id="nome" 
            placeholder="Ex: Camiseta Algodão Egípcio Premium" 
            className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 h-10 text-sm" 
            {...register("nome")} 
          />
          {errors.nome && <p className="text-xs text-rose-600 font-medium">{errors.nome.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descricao" className="text-sm font-semibold text-slate-600">Descrição</Label>
          <Textarea 
            id="descricao" 
            rows={3} 
            placeholder="Descrição detalhada para a Nuvemshop..." 
            className="bg-white border-slate-200 text-slate-900 resize-none focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm" 
            {...register("descricao")} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marca" className="text-sm font-semibold text-slate-600">Marca</Label>
            <Input 
              id="marca" 
              placeholder="Digite ou selecione" 
              list="brands-list" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 h-10 text-sm" 
              {...register("marca")} 
            />
            <datalist id="brands-list">
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
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 h-10 text-sm">
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={String(collection.id)} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900">
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
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 h-10 text-sm">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900">
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
      </div>

      {/* SEÇÃO 2: VALORES E ESTOQUE */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-indigo-650 border-b border-slate-100 pb-2">
          <DollarSign className="w-4 h-4 text-indigo-655" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Precificação e Inventário</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5 col-span-1">
            <Label htmlFor="preco" className="text-sm font-semibold text-slate-600">Preço (R$)</Label>
            <Input 
              id="preco" 
              type="number" 
              step="0.01" 
              placeholder="0,00" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 h-10 text-sm" 
              {...register("preco")} 
            />
            {errors.preco && <p className="text-xs text-rose-600 font-medium">{errors.preco.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5 col-span-1">
            <Label htmlFor="preco_promocional" className="text-sm font-semibold text-slate-600">Promo (R$)</Label>
            <Input 
              id="preco_promocional" 
              type="number" 
              step="0.01" 
              placeholder="Sem promo" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 h-10 text-sm" 
              {...register("preco_promocional")} 
            />
            {errors.preco_promocional && (
              <p className="text-xs text-rose-600 font-medium">{errors.preco_promocional.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 col-span-1">
            <Label htmlFor="estoque" className="text-sm font-semibold text-slate-600">Qtd Estoque</Label>
            <Input 
              id="estoque" 
              type="number" 
              placeholder="0" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 h-10 text-sm" 
              {...register("estoque")} 
            />
            {errors.estoque && <p className="text-xs text-rose-600 font-medium">{errors.estoque.message}</p>}
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: ENVIO E LOGÍSTICA */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-indigo-650 border-b border-slate-100 pb-2">
          <Truck className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Logística e Frete (Opcional)</h3>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="peso" className="text-xs font-semibold text-slate-600 truncate">Peso (kg)</Label>
            <Input 
              id="peso" 
              type="number" 
              step="0.001" 
              placeholder="0.000" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10 px-2" 
              {...register("peso")} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprimento" className="text-xs font-semibold text-slate-600 truncate">Comprimento</Label>
            <Input 
              id="comprimento" 
              type="number" 
              step="0.1" 
              placeholder="cm" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10 px-2" 
              {...register("comprimento")} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="largura" className="text-xs font-semibold text-slate-600 truncate">Largura</Label>
            <Input 
              id="largura" 
              type="number" 
              step="0.1" 
              placeholder="cm" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10 px-2" 
              {...register("largura")} 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="altura" className="text-xs font-semibold text-slate-600 truncate">Altura</Label>
            <Input 
              id="altura" 
              type="number" 
              step="0.1" 
              placeholder="cm" 
              className="bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10 px-2" 
              {...register("altura")} 
            />
          </div>
        </div>
      </div>

      {/* Botão de Envio Premium */}
      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-semibold py-6 rounded-xl shadow-md active:scale-[0.99] transition-all duration-300 mt-2 flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50 h-12 text-sm"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Sincronizando com a Nuvemshop...</span>
          </>
        ) : (
          <>
            <span>Sincronizar Produto</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
