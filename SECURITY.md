# Security Policy

## Supported Versions

We currently support the following versions of HooksLens with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Security Context

HooksLens is a **development-only** debugging tool that:
- Intercepts `fetch` calls via `installFetchObserver()`
- Hooks into SWR middleware via `hooksLensMiddleware`
- Stores debugging data in memory and BroadcastChannel
- Exposes a UI dashboard at `/hookslens` route

**Important:** HooksLens is designed to run exclusively in development environments and should **never** be deployed to production.

## Reporting a Vulnerability

If you discover a security vulnerability in HooksLens, please report it responsibly:

### Private Disclosure (Preferred)

1. **Do NOT open a public issue** for security vulnerabilities
2. Use GitHub Security Advisories: [Report a vulnerability](https://github.com/riordanalfredo/hookslens/security/advisories/new)
3. Or email: **hello@rioalfredo.com** with subject line "HooksLens Security"

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Affected versions
- Any suggested fixes (optional)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Varies by severity
  - Critical: 7-14 days
  - High: 14-30 days
  - Medium/Low: 30-60 days

## Security Best Practices

When using HooksLens:

### ✅ DO:
- Use only in development environments
- Conditionally enable based on `process.env.NODE_ENV === 'development'`
- Restrict `/hookslens` routes to development/staging
- Review what data is being tracked before deployment
- Keep HooksLens updated to the latest version

### ❌ DON'T:
- Deploy HooksLens to production
- Log or transmit sensitive data (API keys, tokens, PII)
- Leave the `/hookslens` route accessible in production
- Use HooksLens with production data or credentials
- Disable or skip development-only guards

## Example: Safe Configuration

```tsx
// ✅ Correct: Development-only usage
"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { installFetchObserver, hooksLensMiddleware } from "hookslens";

export const SWRProvider = ({ children }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      installFetchObserver();
    }
  }, []);

  const swrUse = process.env.NODE_ENV === "development"
    ? [hooksLensMiddleware]
    : [];

  return <SWRConfig value={{ use: swrUse }}>{children}</SWRConfig>;
};
```

```tsx
// ✅ Correct: Conditional route
// src/app/hookslens/page.tsx
import HooksLensPanel from "hookslens/panel";

export default function Page() {
  if (process.env.NODE_ENV !== "development") {
    return null; // or redirect
  }
  return <HooksLensPanel />;
}
```

## Known Security Considerations

1. **Development-Only Tool:** Not audited for production security
2. **Client-Side Storage:** Data stored in browser memory and BroadcastChannel
3. **No Authentication:** The `/hookslens` route has no built-in auth
4. **Fetch Interception:** Observer wraps `window.fetch` globally
5. **Data Exposure:** Hook keys, fetch URLs, and timing data are visible in the UI

## Disclosure Policy

Once a vulnerability is fixed:
1. We'll release a patched version
2. Update CHANGELOG.md with security notes
3. Publish a GitHub Security Advisory
4. Credit the reporter (unless anonymity is requested)

## Questions?

For security questions that aren't vulnerabilities, please:
- Open a [Discussion](https://github.com/riordanalfredo/hookslens/discussions)
- Email: hello@rioalfredo.com

Thank you for helping keep HooksLens secure!
