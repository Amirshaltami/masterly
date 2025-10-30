This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security (NIST-inspired hardening)

This project includes a set of security improvements inspired by NIST guidance to reduce the risk of common authentication and web vulnerabilities. These measures are intended for development and early staging; review and adapt them for production.

- HTTP security headers: `src/middleware.ts` sets a Content Security Policy (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a basic `Permissions-Policy`. Review and tune the CSP to match any third-party scripts or assets you use.
- Rate limiting: `src/lib/rateLimiter.ts` provides an in-memory limiter used by registration and login flows to slow automated attacks and brute force attempts. For production use, replace this with a centralized store (Redis) so counters persist across instances and restarts.
- Password guidance: Registration now requires a minimum length of 8 characters to encourage passphrases (per NIST recommendations favoring longer passphrases). Consider adding password strength feedback and checks against breached password lists.
- Authentication hardening: NextAuth is configured to use JWT sessions with a reduced `maxAge` (24 hours) and the credentials provider tracks failed login attempts per-user and blocks after repeated failures. Account lockout and notification behavior can be added as needed.

Recommended next steps for production:

- Use Redis (or another central store) for rate limiting and session/state management.
- Enforce HTTPS at the hosting/load-balancer level and verify HSTS is appropriate for your deployment.
- Add Multi-Factor Authentication (MFA) for user accounts — NIST recommends stronger authentication for privileged access.
- Add audit logging for authentication events and admin alerts for suspicious activity.
- Periodically run automated security scans (SAST/DAST) and dependency vulnerability checks.

If you want, I can implement Redis-backed rate limiting and a TOTP-based MFA flow next.
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
