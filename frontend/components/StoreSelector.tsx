"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStores } from "@/hooks/useStores";
import type { Store } from "@/types/store";

type Props = {
  selectedStore: Store | null;
  onSelect: (store: Store) => void;
};

export function StoreSelector({ selectedStore, onSelect }: Props) {
  const { stores, loading, createStore } = useStores();
  const [showNewStoreForm, setShowNewStoreForm] = useState(false);
  const [name, setName] = useState("");
  const [nuvemshopStoreId, setNuvemshopStoreId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateStore() {
    if (!name || !nuvemshopStoreId || !accessToken) {
      toast.error("Preencha nome, ID da loja e access token");
      return;
    }
    setSaving(true);
    try {
      const store = await createStore({
        name,
        nuvemshop_store_id: nuvemshopStoreId,
        access_token: accessToken,
      });
      onSelect(store);
      setShowNewStoreForm(false);
      setName("");
      setNuvemshopStoreId("");
      setAccessToken("");
      toast.success("Loja cadastrada");
    } catch {
      toast.error("Não foi possível cadastrar a loja");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex items-center gap-2">
        <Select
          value={selectedStore ? String(selectedStore.id) : ""}
          onValueChange={(value) => {
            const store = stores.find((s) => String(s.id) === value);
            if (store) onSelect(store);
          }}
          disabled={loading}
        >
          <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm h-10">
            <SelectValue placeholder={loading ? "Carregando lojas..." : "Selecione a loja"} />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-900">
            {stores.map((store) => (
              <SelectItem key={store.id} value={String(store.id)} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900">
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setShowNewStoreForm((v) => !v)}
          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 border shadow-sm cursor-pointer transition-all duration-200 h-10 text-sm"
        >
          + Nova loja
        </Button>
      </div>

      {showNewStoreForm && (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-md relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-name" className="text-sm font-semibold text-slate-600">Nome da loja</Label>
            <Input 
              id="store-name" 
              placeholder="Ex: Minha Loja" 
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-id" className="text-sm font-semibold text-slate-600">ID da loja na Nuvemshop</Label>
            <Input
              id="store-id"
              placeholder="Ex: 7695983"
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10"
              value={nuvemshopStoreId}
              onChange={(e) => setNuvemshopStoreId(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-token" className="text-sm font-semibold text-slate-600">Access Token (shpat_...)</Label>
            <Input
              id="store-token"
              type="password"
              placeholder="Cole o token de acesso"
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-sm h-10"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>
          
          <Button 
            type="button" 
            onClick={handleCreateStore} 
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-medium cursor-pointer transition-all duration-200 mt-1 border-0 h-10 text-sm"
          >
            {saving ? "Salvando..." : "Salvar loja"}
          </Button>
        </div>
      )}
    </div>
  );
}
