# VAYRO Email Operations

## Contact management
- Recipient contacts are dynamic PostgreSQL records, not source-code constants.
- A contact can serve OWNER, SUPPORT, BILLING, SECURITY and/or GENERAL purposes.
- Contacts can be enabled/disabled, verified, promoted to primary, added and removed.
- Only an authenticated, active platform OWNER session can manage contacts.
- Every create, update, delete and verification action is audited.
- The last enabled, verified OWNER contact cannot be deleted. Add and verify a replacement first.
- Email addresses are normalized to lowercase and unique.

## Sender versus recipients
Recipient contacts are separate from the sending identity. The sender is configured through protected runtime variables. Never put API keys or personal mailbox credentials in Git, browser code, database contact rows, or chat.

## Provider adapter
The first adapter supports Resend:
- EMAIL_PROVIDER=resend
- EMAIL_API_KEY — protected provider API key
- EMAIL_FROM — provider-verified sender identity
- NEXT_PUBLIC_APP_URL — canonical HTTPS application URL

No provider is configured by default. A production sender normally requires a domain verified with the provider. Until a provider and sender identity are configured, contact creation works after owner authentication, but verification email delivery remains unavailable. Unverified addresses must not receive operational notifications.

## Adding a provider
Implement the provider behind sendTransactionalEmail in src/lib/email-provider.ts. Do not change contact-management APIs or account workflows when switching provider. Add provider-specific tests and failure handling.

## Verification
- Verification tokens contain 256 bits of randomness.
- Only SHA-256 token digests are stored.
- Tokens expire after 30 minutes and are single-use.
- Provider errors are not returned verbatim to clients.
- A contact is not considered verified until the confirmation endpoint consumes a valid token.

## Current limitations / release gates
- The repository does not yet have a complete login/session issuance flow. These APIs fail closed until a valid vayro_session belonging to a non-disabled OWNER exists.
- Database migration generation and application have not been performed against any live database.
- No email provider, verified sender domain, API key, or live delivery has been configured or tested.
- Production notifications must select only enabled and verified contacts and need retry, bounce, suppression and delivery-event handling before launch.
