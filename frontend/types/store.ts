export type Store = {
  id: number;
  name: string;
  nuvemshop_store_id: string;
  created_at: string;
};

export type StoreCreateInput = {
  name: string;
  nuvemshop_store_id: string;
  access_token: string;
};

export type Category = {
  id: number;
  name: string;
};
