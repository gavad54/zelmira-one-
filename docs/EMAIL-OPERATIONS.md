# VAYRO Authentication and Email Operations

## Authentication capabilities in this branch
- Persian-first pages: /login, /register, /verify-email, /resend-verification, /forgot-password, /reset-password and /owner/setup.
- APIs: register, login, logout, current session, email verification, verification resend, password recovery and password reset.
- Passwords use Node.js scrypt with random salts; session and action tokens are high-entropy random values and only their digests are stored.
- Session cookies are HttpOnly, SameSite=Lax, Secure in production and expire after seven days. Logout and password reset revoke database sessions.
- Verification and reset links are one-time tokens with expiry (24 hours for initial email verification, 30 minutes for password reset).
- Mutating browser requests require an exact same-origin Origin header.
- Persistent PostgreSQL rate limits apply to registration, login, resend, recovery, reset and owner bootstrap. Rate-limit fingerprints are hashed.
- Public registration is disabled until the first OWNER account has been bootstrapped.
- The initial OWNER can be created once through /owner/setup, backed by POST /api/owner/bootstrap. The deployment operator must set VAYRO_OWNER_BOOTSTRAP_TOKEN (minimum 32 characters) as a protected hosting secret. The token is entered only into the HTTPS setup page, never into chat or Git. Remove the secret from hosting immediately after successful bootstrap.
- The bootstrap operation is serialized and refuses to run if an OWNER or PLATFORM_ADMIN already exists. It creates the OWNER account, an OWNER-purpose email contact and an authenticated session. The OWNER account is initialized through the one-time deployment secret; the separate email contact remains unverified until it receives and confirms a delivery link.

## Owner email contact management
- Recipient contacts are dynamic PostgreSQL records, not source-code constants.
- A contact can serve OWNER, SUPPORT, BILLING, SECURITY and/or GENERAL purposes.
- Contacts can be enabled/disabled, verified, promoted to primary, added and removed.
- Only an authenticated, active platform OWNER session can manage contacts.
- Every create, update and delete action is audited. Email confirmation tokens are single-use and hashed at rest.
- The last enabled, verified OWNER contact cannot be deleted or disabled. Add and verify a replacement first.
- Email addresses are normalized to lowercase and unique.
- Recipient contacts are separate from the sending identity. The sender is configured through protected runtime variables.

## Email provider adapter
The provider adapter is isolated in src/lib/email-provider.ts. The first supported provider is Resend:
- EMAIL_PROVIDER=resend
- EMAIL_API_KEY — protected provider API key
- EMAIL_FROM — provider-verified sender identity
- EMAIL_TEST_RECIPIENT — exact verified mailbox allowed when EMAIL_FROM is onboarding@resend.dev
- NEXT_PUBLIC_APP_URL — canonical application URL; HTTPS in production

### Without a domain
A Gmail address can be used as the owner's recipient/contact address, but it is not a verified sender identity for VAYRO. Resend's shared onboarding@resend.dev sender is a test-only option and can send only to the exact verified inbox associated with the Resend account. The adapter enforces that recipient allowlist. This supports an owner-only delivery test; it does not support arbitrary user registration or password recovery.

An authorized adult/account owner must create/configure the provider account and set its API key in protected hosting variables. Do not send provider keys, Gmail passwords, app passwords or OAuth secrets through chat. No provider credentials are currently configured in this repository or Railway.

### Production email
To deliver account verification and password reset to arbitrary users, configure a provider-verified sender identity. A verified domain is the usual production route. Once configured, dynamic recipient contacts can be added or removed without changing authentication code or deployment source.

### Adding another provider
Implement the provider behind sendTransactionalEmail in src/lib/email-provider.ts. Keep contact-management APIs and account workflows unchanged. Add provider-specific tests, webhook handling, bounce/suppression controls, retry policy and delivery-event audit before production use.

## Database and release gates
- Prisma schema includes AuthActionToken and AuthRateLimit; migration 20261104190000_auth_foundation creates these tables and enum.
- CI validates schema and runs unit plus PostgreSQL authorization integration tests. It does not prove a migration has been safely applied to the production database.
- Apply migrations only after an independent backup and restore proof. Do not use prisma db push on the live database.
- No live Railway secret, email provider, mailbox ownership, external delivery or production migration has been configured or verified by this work.
- Keep public release blocked until fresh CI passes, auth flows are tested end-to-end against isolated PostgreSQL, provider delivery is verified, owner bootstrap is completed by the authorized operator, and production backup/restore gates pass.
