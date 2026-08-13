import { Repository } from "typeorm";
import { Store } from "../../../core/models/store.model";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import { AppDataSource } from "../data-source";
import { StoreOrmEntity } from "../entities/store.orm-entity";

function toDomain(row: StoreOrmEntity): Store {
  return new Store({
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description ?? null,
    defaultCheckoutMode: row.defaultCheckoutMode ?? "whatsapp",
    affiliateCommissionPercent: Number(row.affiliateCommissionPercent ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(store: Store): StoreOrmEntity {
  const row = new StoreOrmEntity();
  row.id = store.id;
  row.ownerId = store.ownerId;
  row.name = store.name;
  row.slug = store.slug;
  row.category = store.category;
  row.description = store.description;
  row.defaultCheckoutMode = store.defaultCheckoutMode;
  row.affiliateCommissionPercent = store.affiliateCommissionPercent.toFixed(2);
  row.createdAt = store.createdAt;
  row.updatedAt = store.updatedAt;
  return row;
}

export class TypeOrmStoreRepository implements StoreRepository {
  private readonly repo: Repository<StoreOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(StoreOrmEntity);
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? toDomain(row) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Store | null> {
    const row = await this.repo.findOne({ where: { ownerId } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<Store | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(store: Store): Promise<Store> {
    const saved = await this.repo.save(toOrm(store));
    return toDomain(saved);
  }
}
