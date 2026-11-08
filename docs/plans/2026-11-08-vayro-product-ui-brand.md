# VAYRO Product UI and Brand Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a coherent, accessible Persian-first VAYRO application shell and a reusable vector brand identity, with verifiable repository checks and explicit release boundaries.

**Architecture:** Preserve the existing Next.js App Router application and its server-side auth/API boundaries. Implement the public product-directory experience in the existing home route and global stylesheet, with logo assets as static SVG files. Keep the product catalogue distinct from operational integrations; do not fabricate account metrics, production availability, or product capabilities.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS, SVG, Node.js test runner, GitHub Actions CI, CodeQL.

## Global Constraints

- Public app name is only VAYRO / وایرو. Do not show ZELMIRA, ZELMIRA ONE, or VAYRO ONE in user-facing identity.
- Persian-first, RTL, responsive mobile-first UI; retain English product names and accessible English metadata.
- Visual direction: premium dark glass, restrained neon ice-blue, controlled gold accents, clear typography and high contrast.
- Product boundaries remain independent: ARIA has no accounting/ERP; ARIANA owns accounting/ERP; LEADORA remains independent; no cross-product database sharing.
- Eight catalogue entries (ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, DANA) are a directory only, not proof of live operational services.
- No production deployment, production migration, customer onboarding, real payment activation, or merge to main.
- Do not modify ARIA or LEADORA infrastructure or data.
- All claims of completion require inspectable source changes and successful relevant checks.

---

### Task 1: Define and verify VAYRO vector identity

**Files:**
- Create: `public/vayro-logo.svg`
- Modify: `public/vayro-mark.svg`
- Modify: `public/favicon.svg`
- Test: SVG XML parsing and repository build

**Interfaces:**
- Produces a standalone logo lockup with a reusable V monogram and wordmark.
- Produces a square icon mark suitable for favicon/PWA usage.
- SVG files remain dependency-free and use viewBox sizing for responsive scaling.

- [ ] Create a distinct V monogram from vector paths, with accessible title/description and a restrained blue-to-gold gradient.
- [ ] Keep logo text exactly VAYRO; do not bake marketing claims or fake product metrics into the asset.
- [ ] Verify each SVG parses as XML and contains a valid viewBox.
- [ ] Commit the identity assets independently.

### Task 2: Implement the responsive public application shell

**Files:**
- Modify: `src/app/globals.css`
- Modify only if required: `src/app/page.tsx`
- Test: existing lint, typecheck, production build

**Interfaces:**
- Consumes the existing product and independent-product data arrays in `src/app/page.tsx`.
- Preserves the current `/login`, `/register`, and `/growth` navigation targets.
- Produces a responsive public directory with clear hierarchy, product cards, independent-product boundaries, and visible focus states.

- [ ] Style the existing page shell, header, hero, CTA links, product grid, independent product section, vision panel, and footer.
- [ ] Add breakpoints for narrow phones, tablets, and desktop; prevent horizontal overflow.
- [ ] Respect reduced-motion preferences and preserve keyboard focus visibility.
- [ ] Avoid invented ratings, usage counts, revenues, live-status badges, or claims of production readiness.
- [ ] Run lint, TypeScript, and production build.

### Task 3: Publish design and release evidence

**Files:**
- Create: `docs/design/VAYRO-BRAND-AND-UI.md`
- Modify: `docs/RELEASE-GATES.md`
- Test: GitHub Actions CI and CodeQL for the resulting PR head

**Interfaces:**
- Documents exact colors, typography, spacing, RTL behavior, logo usage, component states, and responsive behavior.
- Release gate record identifies exact source SHA and workflow run IDs.

- [ ] Document the identity and UI system and distinguish implemented interface from future product integrations.
- [ ] Record only completed test evidence; keep pending checks and release gates explicit.
- [ ] Run CI and CodeQL on the final branch head and inspect every job conclusion.
- [ ] Keep PR #2 draft/unmerged and deployment blocked until all operational gates and owner approval are complete.

## External decisions that remain owner-controlled

- Dedicated production host/domain and protected runtime credentials.
- External encrypted backup destination and authorized restore drill.
- Email sender/provider activation, privileged MFA policy, billing/legal approval.
- Android signing key custody and real-device UAT.
- Explicit approval to merge and release after all gates pass.
