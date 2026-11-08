# VAYRO Brand and Public UI Specification

## Identity

- Public name: **VAYRO** (وایرو).
- Primary logo: `/vayro-logo.svg`.
- App icon and favicon: `/vayro-mark.svg` and `/favicon.svg`.
- The V monogram uses a faceted outline and an ice-blue-to-champagne gradient. The lockup uses the exact Latin wordmark `VAYRO`.
- Do not add suffixes such as ONE to the public brand. Do not show legacy ZELMIRA naming in user-facing surfaces.

## Visual language

| Token | Value | Use |
|---|---|---|
| Background | `#070B13` | Main canvas |
| Soft background | `#0B1220` | Secondary surfaces |
| Panel | `rgba(17,27,43,.76)` | Glass-like cards |
| Primary text | `#EDF5FB` | Main content |
| Muted text | `#9AABBD` | Supporting content |
| Ice blue | `#8BD8F5` | Interactive/focus accent |
| Champagne gold | `#D8BD83` | Brand emphasis |
| Border | `rgba(126,181,221,.22)` | Quiet separators |

The interface uses a premium dark-glass base, subtle blue ambient lighting, and controlled gold accents. Avoid dense glow, decorative gradients behind long text, and color-only status communication.

## Typography and language

- Persian is the primary interface language and the document direction is RTL.
- Latin product names remain LTR in their own labels.
- Current implementation uses system-safe Tahoma/Arial fallbacks; no external font download is required.
- Body copy uses generous line height. Product identifiers use bold Latin typography with restrained tracking.

## Public page structure

1. Header with vector app mark and account entry links.
2. Hero section describing VAYRO as a directory and connection layer, not a claim that every product is live.
3. Eight product catalogue cards: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, DANA.
4. Independent product group: LEADORA, ARIANA, ARIA, ARMIN MARKET, with their boundaries described explicitly.
5. Vision panel and restrained footer.

The page contains no fabricated customer counts, revenue figures, ratings, live availability, or production-release claims.

## Responsive behavior

- Desktop: four-column product and independent-product grids.
- Tablet: two-column grids.
- Narrow mobile: single-column cards, stacked CTA links, compact header.
- Layout width is constrained to a readable maximum and uses fluid typography.
- Reduced-motion preference disables smooth scrolling and minimizes transitions.
- All links and interactive elements retain visible keyboard focus outlines.

## Product and data boundaries

- The directory is not an operational implementation of each listed product.
- ARIA remains separate and contains no accounting/ERP functions.
- ARIANA remains the accounting/ERP product.
- LEADORA remains independently deployed.
- No product database is shared by implication of shared navigation or identity. Integrations require versioned APIs, explicit scopes, service identity, audit logging and revocation.

## Verification

The final design commit must pass the repository's VAYRO CI and CodeQL workflows. A green repository workflow does not certify production hosting, live email, billing, backups, Android, UAT, or release approval.
