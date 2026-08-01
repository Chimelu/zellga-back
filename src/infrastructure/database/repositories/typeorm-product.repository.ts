import { Repository } from "typeorm";
import { Product } from "../../../core/models/product.model";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import { AppDataSource } from "../data-source";
import { ProductOrmEntity } from "../entities/product.orm-entity";

function toDomain(row: ProductOrmEntity): Product {
  return new Product({
    id: row.id,
    storeId: row.storeId,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    media: row.media ?? [],
    available: row.available,
    category: row.category,
    checkoutMode: row.checkoutMode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function toOrm(product: Product): ProductOrmEntity {
  const row = new ProductOrmEntity();
  row.id = product.id;
  row.storeId = product.storeId;
  row.name = product.name;
  row.price = String(product.price);
  row.description = product.description;
  row.imageUrl = product.imageUrl;
  row.imagePublicId = product.imagePublicId;
  row.media = product.media;
  row.available = product.available;
  row.category = product.category;
  row.checkoutMode = product.checkoutMode;
  row.createdAt = product.createdAt;
  row.updatedAt = product.updatedAt;
  return row;
}

export class TypeOrmProductRepository implements ProductRepository {
  private readonly repo: Repository<ProductOrmEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(ProductOrmEntity);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    const rows = await this.repo.find({
      where: { storeId },
      order: { createdAt: "DESC" },
    });
    return rows.map(toDomain);
  }

  async findVisibleByStoreId(storeId: string): Promise<Product[]> {
    const rows = await this.repo.find({
      where: { storeId, available: true },
      order: { createdAt: "DESC" },
    });
    return rows.map(toDomain);
  }

  async save(product: Product): Promise<Product> {
    const saved = await this.repo.save(toOrm(product));
    return toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
