---
name: security-audit
description: Use when reviewing code for security vulnerabilities, implementing auth/authz, handling user input, or configuring security headers. Provides OWASP Top 10 checks, Next.js security patterns, and audit procedures.
---

# Security Audit Skill

## Quick Audit Checklist

### Input Validation
```typescript
// GOOD: Zod schema validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const data = schema.parse(formData);

// BAD: No validation
const email = formData.get('email');
```

### SQL Injection Prevention
```typescript
// GOOD: Prisma parameterized queries
await prisma.user.findUnique({ where: { email } });

// BAD: Raw SQL concatenation
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### XSS Prevention
```typescript
// GOOD: React auto-escapes JSX
return <p>{userInput}</p>;

// BAD: dangerouslySetInnerHTML without sanitization
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;

// SAFE: Sanitize first
import DOMPurify from 'dompurify';
return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />;
```

## Authentication & Authorization

### NextAuth.js v5 Setup
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

### Route Protection
```typescript
// middleware.ts
export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};

// In route handler
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

### Role-Based Access Control
```typescript
// lib/authz.ts
export async function requireRole(role: 'buyer' | 'vendor' | 'admin') {
  const session = await auth();
  if (!session || session.user.role !== role) {
    throw new Error('Forbidden');
  }
  return session;
}

// Usage in Server Action
export async function adminAction() {
  const session = await requireRole('admin');
  // Only admins reach here
}
```

## Security Headers

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## OWASP Top 10 Checks

### 1. Broken Access Control
- [ ] Every protected route checks authentication
- [ ] Every action checks authorization (role/permission)
- [ ] IDOR prevented (user can only access own resources)

### 2. Cryptographic Failures
- [ ] HTTPS enforced in production
- [ ] Passwords hashed with bcrypt (cost factor 12+)
- [ ] Secrets in environment variables (not hardcoded)

### 3. Injection
- [ ] All database queries use parameterized queries
- [ ] User input validated and sanitized
- [ ] Command injection prevented (no shell exec with user input)

### 4. Insecure Design
- [ ] Rate limiting on sensitive endpoints
- [ ] Business logic validated server-side
- [ ] File uploads restricted (type, size, count)

### 5. Security Misconfiguration
- [ ] Debug mode disabled in production
- [ ] Error messages don't leak stack traces
- [ ] Default credentials changed

### 6. Vulnerable Components
- [ ] `npm audit` run regularly
- [ ] Dependencies updated frequently
- [ ] Unused dependencies removed

### 7. Authentication Failures
- [ ] Multi-factor authentication available
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured

### 8. Data Integrity Failures
- [ ] CI/CD pipeline verifies code signatures
- [ ] Dependencies from trusted sources
- [ ] Webhook signatures validated

### 9. Logging Failures
- [ ] Security events logged (login, failed auth)
- [ ] Logs don't contain sensitive data
- [ ] Log monitoring configured

### 10. SSRF
- [ ] User-provided URLs validated
- [ ] Internal network requests restricted
- [ ] DNS rebinding protection enabled

## Common Vulnerabilities in Next.js

### Server Component Data Leakage
```typescript
// BAD: Fetching sensitive data in Server Component
export default async function Page() {
  const users = await prisma.user.findMany(); // Exposes all user data
  return <UserList users={users} />;
}

// GOOD: Filter sensitive fields
export default async function Page() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }, // No passwords
  });
  return <UserList users={users} />;
}
```

### API Route Missing Auth
```typescript
// BAD: No authentication check
export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.product.delete({ where: { id } });
  return Response.json({ success: true });
}

// GOOD: Auth + authorization check
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  const { id } = await req.json();
  const product = await prisma.product.findUnique({ where: { id } });
  
  if (product?.vendorId !== session.user.id && session.user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  
  await prisma.product.delete({ where: { id } });
  return Response.json({ success: true });
}
```

## Output Format

When auditing, return:
```markdown
## Security Audit Report

### CRIT (Immediate Fix Required)
- [ ] Issue description + file:line + fix code

### WARN (Should Fix)
- [ ] Issue description + file:line + recommendation

### INFO (Best Practice)
- [ ] Suggestion + rationale
```
