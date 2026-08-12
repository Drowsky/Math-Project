---
name: nextjs-patterns
description: Use when implementing Next.js App Router features, data fetching, Server Actions, caching, or performance optimizations. Provides patterns for Server Components, Route Handlers, middleware, and modern Next.js best practices.
---

# Next.js Patterns Skill

## App Router Fundamentals

### File Conventions
```
app/
  layout.tsx        # Shared UI wrapper
  page.tsx          # Route UI
  loading.tsx       # Suspense fallback
  error.tsx         # Error boundary
  not-found.tsx     # 404 UI
  route.ts          # API endpoint (Route Handler)
  template.tsx      # Non-cached layout
```

### Server Components (Default)
```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await prisma.product.findMany();
  return <ProductList products={products} />;
}
```

### Client Components
```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**When to use `'use client'`:**
- useState, useEffect, useRef
- Event listeners (onClick, onChange)
- Browser APIs (window, localStorage)
- Class components

## Data Fetching Patterns

### Direct Database Access (Server Components)
```typescript
// app/dashboard/page.tsx
import { prisma } from '@/lib/db';

export default async function Dashboard() {
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { product: true },
  });
  
  return <OrderList orders={orders} />;
}
```

### Route Handlers (API)
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const category = searchParams.get('category');
  
  const products = await prisma.product.findMany({
    where: category ? { category: { slug: category } } : undefined,
  });
  
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await prisma.product.create({ data: body });
  return NextResponse.json(product, { status: 201 });
}
```

### Server Actions (Mutations)
```typescript
// app/actions.ts
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
});

export async function createProduct(formData: FormData) {
  const validated = schema.parse({
    title: formData.get('title'),
    price: Number(formData.get('price')),
  });
  
  await prisma.product.create({ data: validated });
  revalidatePath('/products');
}
```

### Parallel Data Fetching
```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  const ordersPromise = prisma.order.findMany();
  const statsPromise = prisma.stats.findFirst();
  const usersPromise = prisma.user.findMany();
  
  const [orders, stats, users] = await Promise.all([
    ordersPromise,
    statsPromise,
    usersPromise,
  ]);
  
  return <Dashboard orders={orders} stats={stats} users={users} />;
}
```

### Streaming with Suspense
```typescript
// app/page.tsx
import { Suspense } from 'react';

export default function Home() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

async function SlowComponent() {
  const data = await slowQuery();
  return <DataView data={data} />;
}
```

## Caching Strategies

### Route Segment Config
```typescript
// app/products/page.tsx
export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-static'; // Static generation
// or
export const dynamic = 'force-dynamic'; // Always dynamic
```

### Fetch Cache Options
```typescript
// Cache indefinitely (default for GET)
fetch('https://api.example.com/data');

// No cache (always fresh)
fetch('https://api.example.com/data', { cache: 'no-store' });

// Revalidate every 60 seconds
fetch('https://api.example.com/data', { next: { revalidate: 60 } });

// Revalidate on tag
fetch('https://api.example.com/data', { next: { tags: ['products'] } });
```

### On-Demand Revalidation
```typescript
// After mutation
import { revalidatePath, revalidateTag } from 'next/cache';

revalidatePath('/products'); // Revalidate path
revalidateTag('products'); // Revalidate tag
```

## Middleware Patterns

### Authentication Check
```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const protectedPaths = ['/dashboard', '/api/protected'];
  const isProtected = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Rate Limiting
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '10 s'),
});

export default async function middleware(req: NextRequest) {
  const identifier = req.ip ?? 'anonymous';
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
  
  return NextResponse.next();
}
```

## Performance Optimizations

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Preload LCP image
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Font Optimization
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### Dynamic Imports
```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false, // Skip server-side rendering
});
```

### Bundle Analyzer
```bash
npm install @next/bundle-analyzer
```

```javascript
// next.config.mjs
import withBundleAnalyzer from '@next/bundle-analyzer';

const config = {
  // your config
};

export default process.env.ANALYZE === 'true'
  ? withBundleAnalyzer({ enabled: true })(config)
  : config;
```

## Error Handling

### Error Boundary
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Global Error Handler
```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Critical error</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

## Output Format

When using this skill, provide:
1. Code snippets with file paths
2. Explanation of trade-offs
3. Performance implications
4. Testing recommendations
