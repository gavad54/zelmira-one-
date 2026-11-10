# VAYRO MFA Design

**Design baseline:** 19f4834f601e793df7b33917f5e141155de2ba87  
**Implementation branch:** infra/backup-restore-b2  
**Status:** IMPLEMENTED IN SOURCE — ISOLATED CI PASSED; SECURITY REVIEW PENDING

## 1. Baseline facts

The original baseline had no MFA. The current branch adds Prisma MFA/challenge/recovery models and server-side TOTP workflows. Privileged password login now returns a short-lived challenge and does not issue a normal session until enrollment or second-factor verification succeeds. WebAuthn/passkeys are not implemented.

## 2. Selected initial factor

Implement TOTP (RFC 6238) as the first deployable factor using the Node.js built-in crypto module. This avoids a runtime dependency and supports standard authenticator applications. Passkeys/WebAuthn remain a later enhancement because they require browser ceremony, credential registration, origin/RP-ID configuration, and additional cross-platform acceptance testing.

TOTP parameters:
- HMAC-SHA1, 6 decimal digits, 30-second time step, RFC 6238 compatible.
- Accept only the current step and one adjacent step on either side to tolerate bounded clock skew.
- Store the last accepted time-step and atomically reject a step already consumed (replay protection).
- Require successful verification before marking MFA enabled.
- Never log or return an enrolled secret again after setup confirmation.

## 3. Secret protection

Encrypt TOTP secrets at rest with AES-256-GCM using a dedicated 32-byte key supplied through `VAYRO_MFA_ENCRYPTION_KEY` (64 hexadecimal characters). Use a fresh 96-bit nonce per encryption and store the nonce, authentication tag and ciphertext in a delimited envelope. Fail closed when the key is missing, malformed or cannot authenticate the ciphertext.

The key must be provisioned through the protected runtime secret store, must not be committed, and must be backed up through the owner's approved secret-management procedure. No production secret provisioning is authorized by this design.

## 4. Recovery codes

Generate a bounded set of cryptographically random, high-entropy one-time recovery codes. Persist only SHA-256 digests; plaintext codes are shown once at successful enrollment/rotation and never retrievable. Consume each code atomically in a transaction. Reuse must fail. Recovery must be rate-limited and produce an audit event. Email-only recovery is not an MFA factor and must not bypass the second-factor requirement.

## 5. Enrollment and login protocol

1. Password authentication succeeds.
2. Determine privilege from trusted database state: platform OWNER/PLATFORM_ADMIN or membership OWNER/ADMIN in any active tenant.
3. If a privileged user has no active MFA, do not issue a normal session. Issue a short-lived, single-purpose enrollment capability that can access only MFA setup/confirmation.
4. Enrollment creates a pending encrypted TOTP secret with a short expiry and returns the provisioning URI only once.
5. User confirms enrollment with a valid TOTP value; transactionally activate MFA, record the accepted TOTP step, create recovery-code digests, consume the enrollment capability and audit the event.
6. Subsequent privileged login creates a short-lived MFA challenge, not a session.
7. Successful TOTP or one-time recovery-code verification consumes the challenge and issues the ordinary opaque session with MFA assurance metadata.
8. Invalid attempts are rate-limited by challenge and account. Challenge expiry, exhaustion, replay and recovery-code reuse fail closed.

Normal non-privileged accounts may continue password-only until a product risk policy is approved. If a user holds a privileged membership in any tenant, the account must satisfy MFA before receiving a general-purpose session; do not rely on UI hiding.


## 5.1 Implemented source behavior on this branch

- `POST /api/auth/mfa/enroll`: accepts only a short-lived enrollment challenge and returns the TOTP provisioning secret/URI once; pending secret is AES-256-GCM encrypted and expires after 10 minutes.
- `POST /api/auth/mfa/enroll/confirm`: validates TOTP before activation, records the accepted time-step, stores ten recovery-code SHA-256 digests and issues an MFA-assured session.
- `POST /api/auth/mfa/verify`: verifies a login challenge using TOTP or a one-time recovery code; successful verification consumes the challenge and issues an MFA-assured session.
- `POST /api/auth/mfa/recovery-codes`: requires a recent MFA session and a fresh factor; old recovery codes are atomically invalidated and ten new codes are returned once.
- `POST /api/auth/mfa/disable`: requires a recent MFA session and fresh factor proof; disables the factor, invalidates recovery codes and challenges, and revokes all sessions.
- Platform OWNER/PLATFORM_ADMIN and active-tenant OWNER/ADMIN accounts are detected from database roles during password login. They cannot receive a password-only general session.
- Platform owner routes and tenant owner/admin authorization reject sessions without MFA assurance or with MFA older than 12 hours.
- Challenge tokens are random 256-bit capabilities; only SHA-256 digests are stored. Challenges expire and allow at most five attempts.
- TOTP replay prevention and recovery-code consumption use conditional database updates inside transactions.
- Enrollment, successful verification, failed factor attempts, disablement and recovery-code rotation are audited without recording secrets or codes.
- The login page now guides users through enrollment, second-factor verification and one-time recovery-code display.

The above describes source implementation. Exact source candidate b2b78f3a9171eeddd53c4f11d740b8c54abd6a7d passed VAYRO CI 42777954484 and CodeQL 42777954612. CI uses disposable PostgreSQL; it does not prove production schema/key provisioning or deployment. Independent security review and production provisioning remain outstanding.

## 6. MFA for sensitive operations

Privileged route authorization must validate server-side session assurance. OWNER platform routes and tenant OWNER/ADMIN operations require a session with recent MFA verification. High-risk changes (security settings, owner email contacts, product activation/configuration, membership/role changes, and recovery) require step-up verification or a fresh MFA assertion.

## 7. Recovery and disablement

- MFA disablement requires an active MFA-authenticated session plus current TOTP or an unused recovery code.
- Regenerating recovery codes invalidates all previous recovery-code digests atomically.
- MFA recovery must not use email as a sole factor.
- Lost-factor recovery requires an independently verified owner-controlled procedure and manual audit; this process is not considered implemented until operational ownership and evidence are established.
- MFA enrollment and disablement revoke all existing sessions and outstanding challenges. Successful login verification issues a new MFA-assured session and consumes outstanding challenges, but does not revoke sessions on other devices. Recovery-code rotation atomically invalidates all prior recovery codes; it does not revoke otherwise valid sessions.

## 8. Required data concepts

The schema change is expected to include:
- User MFA enabled timestamp, encrypted active/pending secret, pending expiry, and last accepted TOTP step.
- Short-lived enrollment/login challenge records with hashed random capabilities, purpose, expiry, attempt count and consumed timestamp.
- Recovery-code digest records with consumed timestamp.
- Session assurance metadata (MFA verification timestamp / authentication level) so sensitive endpoints can enforce MFA centrally.

Exact Prisma model and migration names must follow implementation and migration validation; this design does not authorize running any migration against production or VAYRO-CORE.

## 9. Required automated tests

- RFC 6238 known vectors and valid TOTP.
- Invalid, malformed and expired enrollment challenge.
- Pending secret expiry and confirmation.
- Replay of a previously accepted TOTP step.
- Wrong code and attempt throttling.
- Missing/malformed encryption key and ciphertext tampering.
- Recovery code valid once, then rejected on reuse.
- MFA challenge expires and cannot be replayed.
- Privileged login without MFA never creates a normal session.
- Privileged login with MFA succeeds only after challenge verification.
- MFA disablement requires fresh factor proof and revokes sessions.
- Owner and tenant-admin sensitive endpoints reject sessions without MFA assurance.
- Non-privileged flows remain functional.
- No secrets, TOTP values, recovery codes or bearer capabilities appear in logs or API responses beyond their one-time intended delivery.

## 10. Acceptance

MFA remains `BLOCKED` for production release until the isolated CI evidence is reviewed, the production runtime key is provisioned through the protected secret store, the production migration is explicitly approved, the UI/API flow receives independent review, and owner acceptance is recorded. No production secret or database changes have been made. A green build alone is insufficient.
