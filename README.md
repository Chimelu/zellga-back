# Zellga API

Node.js + TypeScript + Express + PostgreSQL + TypeORM

## Folder structure (`src/`)

| Folder | Responsibility |
|--------|----------------|
| **`core/`** | Domain models + repository/service interfaces + errors/utils. No Express/TypeORM. |
| **`app/`** | Feature modules (HTTP API). Each feature has the same shape. |
| **`infrastructure/`** | TypeORM, bcrypt/JWT, Express app, env config. |

### Feature folder shape (`app/<feature>/`)

```
app/auth/
  controller/     # HTTP handlers
  services/       # business logic
  dto/            # request/response types
  validator/      # Zod (or similar) validation schemas
  auth.routes.ts
  auth.module.ts  # wiring
```

### Adding a new feature (e.g. items)

1. **`core/models/item.model.ts`** — domain model  
2. **`core/repositories/item.repository.ts`** — interface  
3. **`infrastructure/database/entities/item.orm-entity.ts`** — TypeORM table  
4. **`infrastructure/database/repositories/typeorm-item.repository.ts`**  
5. **`app/items/dto/`** · **`validator/`** · **`services/`** · **`controller/`**  
6. **`app/items/items.routes.ts`** + **`items.module.ts`**  
7. Mount in `infrastructure/http/create-app.ts`

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Auth endpoints

**POST** `/api/auth/register`
```json
{
  "name": "Amara",
  "phone": "08012345678",
  "password": "secret1",
  "storeName": "Atelier Studio",
  "category": "fashion"
}
```

**POST** `/api/auth/login`
```json
{
  "phone": "08012345678",
  "password": "secret1"
}
```

Both return `{ success, data: { token, user, store } }`.

## Products (vendor — Bearer token required)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/products` | All items including hidden |
| GET | `/api/products/:id` | One item |
| POST | `/api/products` | `multipart/form-data`: `name`, `price`, optional `description`, `category`, `checkoutMode`, `available`, `image` |
| PATCH | `/api/products/:id` | Same fields + optional new `image` |
| PATCH | `/api/products/:id/visibility` | JSON `{ "available": false }` hides from storefront |
| DELETE | `/api/products/:id` | Deletes item + Cloudinary image |

## Public storefront

**GET** `/api/stores/:slug` — store + **only visible** products (`available: true`).

## Business profile (vendor — Bearer token required)

| Method | Path | Body |
|--------|------|------|
| GET | `/api/profile` | — full profile (user + store + settings) |
| PATCH | `/api/profile/store` | `{ name?, slug?, category?, description? }` |
| PATCH | `/api/profile/account` | `{ name?, phone? }` |
| PATCH | `/api/profile/settings` | `{ defaultCheckoutMode?: "whatsapp" \| "platform" }` |
| PATCH | `/api/profile/password` | `{ currentPassword, newPassword, confirmPassword }` |
