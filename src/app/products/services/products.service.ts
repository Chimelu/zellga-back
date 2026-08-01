import { randomUUID } from "crypto";
import {
  Product,
  type ProductMediaItem,
} from "../../../core/models/product.model";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../core/errors/app.error";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { ImageStorage } from "../../../core/services/image-storage";
import type {
  CreateProductDto,
  ProductResponseDto,
  SetProductVisibilityDto,
  UpdateProductDto,
} from "../dto/product.dto";

function toDto(product: Product): ProductResponseDto {
  return {
    id: product.id,
    storeId: product.storeId,
    name: product.name,
    price: product.price,
    description: product.description,
    imageUrl: product.imageUrl,
    media: product.media,
    available: product.available,
    category: product.category,
    checkoutMode: product.checkoutMode,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function normalizeMedia(media?: ProductMediaItem[]): ProductMediaItem[] {
  return (media ?? []).slice(0, 2);
}

export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly stores: StoreRepository,
    private readonly images: ImageStorage
  ) {}

  private async requireOwnerStore(userId: string) {
    const store = await this.stores.findByOwnerId(userId);
    if (!store) {
      throw new NotFoundError("Store not found for this account");
    }
    return store;
  }

  private async requireOwnedProduct(userId: string, productId: string) {
    const store = await this.requireOwnerStore(userId);
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    if (product.storeId !== store.id) {
      throw new ForbiddenError("You can only manage your own products");
    }
    return { store, product };
  }

  async listMine(userId: string): Promise<ProductResponseDto[]> {
    const store = await this.requireOwnerStore(userId);
    const items = await this.products.findByStoreId(store.id);
    return items.map(toDto);
  }

  async getMine(userId: string, productId: string): Promise<ProductResponseDto> {
    const { product } = await this.requireOwnedProduct(userId, productId);
    return toDto(product);
  }

  async create(
    userId: string,
    input: CreateProductDto
  ): Promise<ProductResponseDto> {
    const store = await this.requireOwnerStore(userId);
    const now = new Date();
    const media = normalizeMedia(input.media);
    const cover = media[0] ?? null;

    const product = new Product({
      id: randomUUID(),
      storeId: store.id,
      name: input.name.trim(),
      price: input.price,
      description: input.description?.trim() || null,
      imageUrl: cover?.url ?? null,
      imagePublicId: cover?.publicId ?? null,
      media,
      available: input.available ?? true,
      category: input.category?.trim() || null,
      checkoutMode: input.checkoutMode ?? store.defaultCheckoutMode ?? "whatsapp",
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.products.save(product);
    return toDto(saved);
  }

  async update(
    userId: string,
    productId: string,
    input: UpdateProductDto
  ): Promise<ProductResponseDto> {
    const { product } = await this.requireOwnedProduct(userId, productId);

    if (input.name !== undefined) product.name = input.name.trim();
    if (input.price !== undefined) product.price = input.price;
    if (input.description !== undefined) {
      product.description =
        input.description === null ? null : input.description.trim() || null;
    }
    if (input.category !== undefined) {
      product.category =
        input.category === null ? null : input.category.trim() || null;
    }
    if (input.checkoutMode !== undefined) {
      product.checkoutMode = input.checkoutMode;
    }

    if (input.media !== undefined) {
      const next = normalizeMedia(input.media);
      const nextIds = new Set(next.map((m) => m.publicId));
      for (const old of product.media) {
        if (!nextIds.has(old.publicId)) {
          await this.images.delete(old.publicId, old.type);
        }
      }
      product.media = next;
      product.imageUrl = next[0]?.url ?? null;
      product.imagePublicId = next[0]?.publicId ?? null;
    }

    product.updatedAt = new Date();
    const saved = await this.products.save(product);
    return toDto(saved);
  }

  async setVisibility(
    userId: string,
    productId: string,
    input: SetProductVisibilityDto
  ): Promise<ProductResponseDto> {
    const { product } = await this.requireOwnedProduct(userId, productId);
    product.available = input.available;
    product.updatedAt = new Date();
    const saved = await this.products.save(product);
    return toDto(saved);
  }

  async remove(userId: string, productId: string): Promise<void> {
    const { product } = await this.requireOwnedProduct(userId, productId);
    for (const item of product.media) {
      await this.images.delete(item.publicId, item.type);
    }
    await this.products.delete(product.id);
  }
}
