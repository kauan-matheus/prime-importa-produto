import { api } from "@/services/api";
import type { Product, ProductCreateInput, ProductUpdateInput } from "@/types/product";

export const productsService = {
  create: (input: ProductCreateInput) => api.post<Product>("/products", input),
  nextSkuPreview: () => api.get<{ sku: string }>("/products/next-sku"),
  list: (storeId: number) => api.get<Product[]>(`/products?store_id=${storeId}`),
  update: (id: number, input: ProductUpdateInput) => api.patch<Product>(`/products/${id}`, input),
};
