import { api } from "@/services/api";
import type { Product, ProductCreateInput } from "@/types/product";

export const productsService = {
  create: (input: ProductCreateInput) => api.post<Product>("/products", input),
  nextSkuPreview: () => api.get<{ sku: string }>("/products/next-sku"),
};
