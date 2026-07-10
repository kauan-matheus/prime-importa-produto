import { api } from "@/services/api";
import type { Category, Store, StoreCreateInput } from "@/types/store";

export const storesService = {
  list: () => api.get<Store[]>("/stores"),
  create: (input: StoreCreateInput) => api.post<Store>("/stores", input),
  categories: (storeId: number) => api.get<Category[]>(`/stores/${storeId}/categories`),
  collections: (storeId: number) => api.get<Category[]>(`/stores/${storeId}/collections`),
  brands: (storeId: number) => api.get<string[]>(`/stores/${storeId}/brands`),
};
