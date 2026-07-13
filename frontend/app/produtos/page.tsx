"use client";

import { useState } from "react";
import { StoreSelector } from "@/components/StoreSelector";
import { NavTabs } from "@/components/NavTabs";
import { ProductCard } from "@/components/ProductCard";
import { ProductEditDialog } from "@/components/ProductEditDialog";
import { useProducts } from "@/hooks/useProducts";
import { useStoreCatalog } from "@/hooks/useStoreCatalog";
import type { Store } from "@/types/store";
import type { Product } from "@/types/product";
import { Layers, CloudLightning, PackageSearch } from "lucide-react";

export default function ProdutosPage() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { products, loading, replaceProduct } = useProducts(selectedStore?.id ?? null);
  const { categories, collections, brands } = useStoreCatalog(selectedStore?.id ?? null);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-12">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-650/10">
              <CloudLightning className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Prime Import</h1>
              <p className="text-xs text-slate-500 font-medium">Produtos cadastrados</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <NavTabs />
            <StoreSelector selectedStore={selectedStore} onSelect={setSelectedStore} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 w-full flex-1 flex flex-col gap-6 mt-8">
        {!selectedStore ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="p-4 rounded-full bg-white border border-slate-200 text-slate-400 mb-4">
              <Layers className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Nenhuma loja ativa</h2>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Selecione uma loja no topo para ver os produtos cadastrados.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="p-4 rounded-full bg-white border border-slate-200 text-slate-400 mb-4">
              <PackageSearch className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Nenhum produto cadastrado</h2>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Produtos importados na aba &quot;Importar&quot; vão aparecer aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      <ProductEditDialog
        product={editingProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        collections={collections}
        brands={brands}
        onSaved={replaceProduct}
      />
    </div>
  );
}
