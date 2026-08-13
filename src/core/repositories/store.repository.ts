import type { Store } from "../models/store.model";

export interface StoreRepository {
  findBySlug(slug: string): Promise<Store | null>;
  findByOwnerId(ownerId: string): Promise<Store | null>;
  findById(id: string): Promise<Store | null>;
  save(store: Store): Promise<Store>;
}
