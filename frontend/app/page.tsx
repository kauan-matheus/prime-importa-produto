"use client";

import { useState } from "react";
import { StoreSelector } from "@/components/StoreSelector";
import { ImageDisplay } from "@/components/ImageDisplay";
import { ProductForm } from "@/components/ProductForm";
import { NavTabs } from "@/components/NavTabs";
import { useNextImage } from "@/hooks/useNextImage";
import { useStoreCatalog } from "@/hooks/useStoreCatalog";
import type { Store } from "@/types/store";
import { Layers, CloudLightning, HelpCircle } from "lucide-react";

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const { image, loading: loadingImage, fetchNext } = useNextImage();
  const { categories, collections, brands } = useStoreCatalog(selectedStore?.id ?? null);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-12">
      {/* Header Limpo e Profissional */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-650/10">
              <CloudLightning className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Prime Import
              </h1>
              <p className="text-xs text-slate-500 font-medium">Sincronizador Google Drive & Nuvemshop</p>
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
              Selecione uma loja existente no topo ou clique em &quot;+ Nova loja&quot; para integrar com a Nuvemshop.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Visualizador de Imagens (Esquerda - Sem Sticky/Scrolls estranhos) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Imagem Pendente</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                  Fila do Drive
                </span>
              </div>
              
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300">
                <ImageDisplay image={image} loading={loadingImage} />
              </div>
            </div>

            {/* Formulário de Produto (Direita) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informações de Cadastro</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Preencha os campos abaixo
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {image ? (
                  <ProductForm
                    key={image.id}
                    store={selectedStore}
                    image={image}
                    categories={categories}
                    collections={collections}
                    brands={brands}
                    onSaved={fetchNext}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Aguardando imagem para preenchimento.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
