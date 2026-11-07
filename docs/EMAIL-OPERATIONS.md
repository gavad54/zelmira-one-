# VAYRO Authentication and Email Operations

## Authentication implemented in this branch
- Persian-first screens: /login, /register, /verify-email, /resend-verification, /forgot-password, /reset-password and /owner/setup.
- APIs: register, login, logout, current session, email verification, verification resend, password recovery and password reset.
- Passwords use Node.js scrypt with random salts. Session and action tokens are high-entropy random values; only token digests are stored.
- Sessions use HttpOnly, SameSite=Lax cookies, Secure in production and a seven-day expiry. Logout and password reset revoke database sessions.
- Email verification and reset tokens are single-use and expire after 24 hours and 30 minutes respectively.
- Mutating browser requests require exact same-origin Origin validation.
- PostgreSQL-backed rate limiting applies to registration, login, resend, recovery, reset and owner bootstrap.
- Public registration remains unavailable until the first OWNER is provisioned.
- The initial OWNER is created once through /owner/setup backed by POST /api/owner/bootstrap. The operator must set VAYRO_OWNER_BOOTSTRAP_TOKEN (minimum 32 characters) in protected hosting secrets. The authorized adult/operator enters it only on the HTTPS setup page, never in chat or Git. Remove the secret from hosting immediately after successful bootstrap.
- Bootstrap refuses to run if an OWNER or PLATFORM_ADMIN already exists. It creates the OWNER account with an unverified login email, an OWNER-purpose email contact and a temporary authenticated bootstrap session. The owner must configure a sender, send the contact verification link and confirm it. Confirmation also verifies the matching login email; only then can the owner log in normally.

## Owner email contact management
- Recipient contacts are dynamic PostgreSQL records, not source-code constants.
- A contact can serve OWNER, SUPPORT, BILLING, SECURITY and/or GENERAL purposes.
- Contacts can be enabled/disabled, verified, promoted to primary, added and removed.
- Only an active OWNER session can manage contacts.
- Create, update and delete actions are audited. Email confirmation tokens are single-use and hashed at rest.
- The last enabled, verified OWNER contact cannot be deleted or disabled. Add and verify a replacement first.
- Recipient contacts are separate from the sender identity. Sender configuration lives only in protected server-side variables.

## Supported email providers

### Gmail API — no domain required
Set EMAIL_PROVIDER=gmail and configure these protected server variables:
- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- GMAIL_REFRESH_TOKEN
- GMAIL_SENDER_EMAIL

An authorized adult mailbox owner/operator must create a Google Cloud project and OAuth client, enable Gmail API and complete the OAuth grant with the narrow scopes https://www.googleapis.com/auth/gmail.send, openid and email. The adapter refreshes access tokens server-side, checks the authorized mailbox identity through Google's OpenID userinfo endpoint, then sends via Gmail API. It does not use or store a Gmail password or app password. Google classifies gmail.send as a sensitive scope; a public production app generally needs OAuth verification before broad public use. Google recommends separate Cloud projects for testing and production. A project left in Testing has a limited tester audience and refresh-token lifetime, so it is not a durable production configuration. The authorized operator must review current Google verification requirements, publish the required app branding/privacy information and verify domain ownership where required before public launch.

This option does not require a custom email-sending domain and can use the owner's Gmail address as sender. That does not waive Google's OAuth production verification, app-homepage, privacy-policy or domain-ownership requirements where they apply. Consumer Gmail has sending and account limits; use it only for low-volume transactional messages, not bulk campaigns. Do not send OAuth client secrets or refresh tokens through chat or commit them.

### Resend
Set EMAIL_PROVIDER=resend, EMAIL_API_KEY and EMAIL_FROM. For the shared onboarding@resend.dev test sender, also set EMAIL_TEST_RECIPIENT to the exact verified inbox attached to the Resend account. The adapter enforces this recipient allowlist. Test mode is not a production sender for arbitrary users.

### Provider switching
All delivery calls go through sendTransactionalEmail in src/lib/email-provider.ts. A future provider can be added behind this adapter without changing contact records or authentication endpoints. Production still needs retry policy, bounce/suppression handling, delivery-event audit and monitoring.

## Environment and release gates
- NEXT_PUBLIC_APP_URL must be the canonical app URL and HTTPS in production.
- The Gmail API and Resend adapters are implemented, but no provider account, OAuth grant, live mailbox verification or delivery test has been completed.
- No VAYRO Railway project currently exists in the connected workspace, so there is no VAYRO runtime in which to store protected email variables. Do not put VAYRO credentials into ARIA or LEADORA.
- Gmail credentials must be configured by the authorized adult mailbox owner in a dedicated VAYRO production host after that host exists. Google OAuth verification for the sensitive gmail.send scope must be assessed before public production use.
- Prisma schema includes AuthActionToken and AuthRateLimit. The branch currently contains the consolidated migration `20261106055500_init_vayro_core`; the separately provisioned Supabase schema has not been baselined into Prisma migration history. Do not run `prisma migrate deploy` against the live VAYRO database until a catalog/schema/migration reconciliation and an isolated restore/forward test are approved.
- CI schema validation uses an isolated PostgreSQL database. It does not prove a migration has been safely applied to production.
- Apply migrations only after an independent backup and restore proof. Do not run prisma db push on the live database.
- Keep public release blocked until fresh CI passes, auth flows are tested end-to-end, Gmail/provider delivery is verified, owner bootstrap is completed by the authorized operator, and backup/restore and UAT gates pass.
