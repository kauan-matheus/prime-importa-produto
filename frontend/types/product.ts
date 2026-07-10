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

export type Product = {
  id: number;
  sku: string;
  nome: string;
  nuvemshop_product_id: string;
  drive_file_id: string;
  created_at: string;
};
