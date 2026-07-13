export type ProductCreateInput = {
  store_id: number;
  drive_file_id: string;
  nome: string;
  descricao?: string;
  preco: number;
  preco_promocional?: number;
  estoque: number;
  peso?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
  categoria_id: number;
  marca?: string;
  collection_id?: number;
};

export type ProductUpdateInput = Partial<Omit<ProductCreateInput, "store_id" | "drive_file_id">>;

export type Product = {
  id: number;
  sku: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  estoque: number;
  peso: number | null;
  comprimento: number | null;
  largura: number | null;
  altura: number | null;
  categoria_id: number;
  marca: string | null;
  collection_id: number | null;
  store_id: number;
  nuvemshop_product_id: string;
  drive_file_id: string;
  created_at: string;
  content_url: string | null;
};
