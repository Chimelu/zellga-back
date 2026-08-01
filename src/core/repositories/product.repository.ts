import type { Product } from "../models/product.model";

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByStoreId(storeId: string): Promise<Product[]>;
  findVisibleByStoreId(storeId: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}
