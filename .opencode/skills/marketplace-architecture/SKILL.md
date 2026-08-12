---
name: marketplace-architecture
description: Use when designing marketplace features, data models, user flows, or business logic. Provides architecture patterns for multi-vendor marketplaces, product catalogs, orders, payments, and messaging systems.
---

# Marketplace Architecture Skill

## Core Domains

### 1. Products & Catalog
- Multi-vendor product listings
- Categories and taxonomies
- Search and filtering (full-text, faceted)
- Inventory management
- Pricing strategies (fixed, auction, negotiation)

**Data Model:**
```prisma
model Product {
  id          String   @id @default(cuid())
  title       String
  description String
  price       Decimal  @db.Decimal(10, 2)
  stock       Int
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  vendorId    String
  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  images      Image[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2. Users & Roles
- Buyers, vendors, admins
- Profile management
- Reviews and ratings
- Favorites and watchlists

**RBAC Pattern:**
```
Role: buyer, vendor, admin
Permissions: 
  - buyer: browse, purchase, review
  - vendor: CRUD own products, view orders
  - admin: CRUD all, moderate, analytics
```

### 3. Orders & Transactions
- Shopping cart (session-based or persisted)
- Checkout flow (address, payment, confirmation)
- Order lifecycle (pending, paid, shipped, delivered, cancelled)
- Refunds and disputes

**State Machine:**
```
pending -> paid -> shipped -> delivered -> completed
  |         |        |          |
  v         v        v          v
cancelled  refund   returned   disputed
```

### 4. Payments
- Payment gateway integration (Stripe, MercadoPago, PayPal)
- Escrow system (hold funds until delivery)
- Vendor payouts (commission split)
- Multi-currency support

**Webhook Pattern:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature')
  const event = stripe.webhooks.constructEvent(body, signature, secret)
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await updateOrderStatus(event.data.object.id, 'paid')
      break
    case 'transfer.created':
      await logVendorPayout(event.data.object)
      break
  }
}
```

### 5. Messaging
- Real-time chat (buyer-vendor)
- Notifications (email, push, in-app)
- Message templates

## Architecture Patterns

### CQRS for Read/Write Separation
```
Commands: mutations (createProduct, placeOrder)
Queries: reads (getProductList, searchProducts)
```

### Event Sourcing for Audit Trail
```
OrderCreated -> PaymentProcessed -> OrderShipped -> OrderDelivered
```

### Microservices Boundaries
```
- Product Service: catalog, search, inventory
- Order Service: cart, checkout, fulfillment
- Payment Service: transactions, refunds
- User Service: auth, profiles, reviews
- Notification Service: email, push, SMS
```

## Scalability Considerations

### Database
- Read replicas for product catalog
- Sharding by vendor or region
- Caching layer (Redis) for hot products

### Search
- Elasticsearch for full-text search
- Algolia for instant search
- Postgres full-text for simple cases

### File Storage
- CDN for product images (Cloudflare R2, AWS S3)
- Image optimization pipeline (resize, WebP conversion)

### Rate Limiting
```
- API routes: 100 req/min per user
- Search: 50 req/min per IP
- Checkout: 10 req/min per user
```

## Output Format

When using this skill, provide:
1. Data model (Prisma schema)
2. API endpoints (route handlers)
3. Business logic (services)
4. State management (client-side)
5. Integration points (webhooks, external APIs)
