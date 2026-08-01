import { NotFoundError } from "../../../core/errors/app.error";
import type { ProductRepository } from "../../../core/repositories/product.repository";
import type { StoreRepository } from "../../../core/repositories/store.repository";
import type { UserRepository } from "../../../core/repositories/user.repository";
import type { PublicProductDto, PublicStoreDto } from "../dto/store.dto";

export class StoresService {
  constructor(
    private readonly stores: StoreRepository,
    private readonly products: ProductRepository,
    private readonly users: UserRepository
  ) {}

  async getPublicBySlug(slug: string): Promise<{
    store: PublicStoreDto;
    products: PublicProductDto[];
  }> {
    const store = await this.stores.findBySlug(slug);
    if (!store) {
      throw new NotFoundError("Store not found");
    }

    const owner = await this.users.findById(store.ownerId);
    if (!owner) {
      throw new NotFoundError("Store not found");
    }

    // Hidden products (available=false) are excluded from the storefront link
    const visible = await this.products.findVisibleByStoreId(store.id);

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        description: store.description,
        ownerName: owner.name,
        phone: owner.phone,
      },
      products: visible.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        imageUrl: p.imageUrl,
        media: p.media.map((m) => ({ url: m.url, type: m.type })),
        category: p.category,
        checkoutMode: p.checkoutMode,
      })),
    };
  }
}
