# ARIA and legacy product source inventory — 2026-11-19

**Scope:** GitHub owner repositories, prior Library archives, engineering reports and the VAYRO 11-product execution matrix dated 2026-11-18.  
**Rule:** A catalog entry, archive, code prototype, test pass and production-ready product are distinct evidence classes.

## 1. Historical portfolio and current hierarchy
The 2026-11-18 VAYRO execution matrix names 11 historical products: ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA, PAYAM, LEADORA, ARIANA, ARIA and ARMIN MARKET. In that older matrix, DANA was recorded as an internal VAYRO engine. The owner's later explicit decision makes DANA an independent application, directly under VAYRO. The current hierarchy therefore has five direct independent apps: DANA, ARIA, ARIANA, LEADORA and ARMIN MARKET. The seven remaining legacy products are ARIA module targets.

## 2. Source evidence and state
| Product | Current destination | Evidence found | State |
|---|---|---|---|
| ARIA | Independent app; receives seven audited legacy capability sets | Library archive ARIA_32_RUNTIME_FIXES_RELEASE_READINESS_SOURCE.zip, original SHA-256 9dcbb34ef98e4f11e661bd32bbd0573d4de7a3058743f45aa126322f44264f9f; gavad54/aria-android web prototype | SOURCE_FOUND_IN_LIBRARY; canonical import pending |
| ARVAND | ARIA trade/business module | Historical matrix: catalog/definition only; no operational code found | SOURCE_NOT_LOCATED; NOT_STARTED |
| CHARSU | ARIA market discovery/commerce module | Historical matrix: catalog/definition only | SOURCE_NOT_LOCATED; NOT_STARTED |
| GANJINEH | ARIA digital storefront module | Historical matrix: catalog/definition only | SOURCE_NOT_LOCATED; NOT_STARTED |
| NEGAH | ARIA creative studio | Partial VAYRO brief/API routes; live provider and persistent media storage not proven | PARTIAL_SOURCE_IN_VAYRO; NOT_OPERATIONAL |
| SEPEHR | ARIA cloud/resource tools | Historical matrix: catalog/definition only; no operational control plane found | SOURCE_NOT_LOCATED; NOT_STARTED |
| NAMA | ARIA website/page builder | No dedicated editor or preview/publish source found | SOURCE_NOT_LOCATED; NOT_STARTED |
| PAYAM | ARIA marketing/communications | VAYRO Growth overview exists; full campaigns, official OAuth and analytics not proven | PARTIAL_SOURCE_IN_VAYRO; INCOMPLETE |
| ARIANA | Independent accounting/ERP app | Library archives include ariaana_android_app_v37_hardened_integrated.zip, ARIYANA_v0.45_COMMERCIAL_HARDENED.zip and ARIANA_16.0.0_FINAL_REVENUE_FIRST.zip. Prior audit verified v0.37 source and an isolated v0.37.1 candidate | SOURCE_FOUND_IN_LIBRARY; canonical repo not located |
| LEADORA | Independent distribution operations | gavad54/LEADORA source repository; FastAPI/SQLite product | SOURCE_FOUND_IN_GITHUB |
| ARMIN MARKET | Independent marketplace | gavad54/Armin_market; Android/Kotlin/Jetpack Compose project | SOURCE_FOUND_IN_GITHUB |
| DANA | Independent command-center app | Library package contains prompt, audit report and backup-status documents only; no executable independent source located | DOCUMENTATION_FOUND; SOURCE_NOT_LOCATED |

## 3. ARIA versions — never add these counts
| Version/source | Count | Correct interpretation |
|---|---:|---|
| ARIA 15.5 UX Master | 120 | Historical design inventory |
| ARIA 15.18.4 deep audit | 231 | Historical registry; ACTIVE does not prove independent engines or E2E |
| ARIA 25 release report | 369 | Version 25 registry; signed build/device UAT not proven |
| ARIA 32.0.0 source archive | 639 | Android/Backend registry and capability contracts |
| aria-android web prototype | 65 | Current web catalog: 2 foundation, 5 prototype, 58 planned |

These are version-specific inventories, not additive module counts.

## 4. ARIA 32.0.0 source and isolated repair
- The original Library archive was recovered and ZIP integrity verified: 503 ZIP entries / 456 extracted files.
- Independent static verification found Android/Backend registry version_code=310000 while Gradle and capability metadata used 320000.
- Stale verification scripts referenced 24.0.0/329 modules, a 232-module matrix and migration 015 as latest; the actual 32.0.0 chain has 41 contiguous migrations through 041.
- An isolated candidate corrected versionCode parity and stale gates. Candidate SHA-256: e787e02991fbc7044a312cdb071e8484dfb0db6e341c9116be54c1f4978eafdb.
- Candidate gates PASS: aria32_release_readiness, verify_project, R9 final gate, 639 capability matrix and static schema verifier (201 tables).
- The candidate is not yet imported into canonical GitHub, Android-built, signed, installed on a device or deployed.

The 639 capability maturity distribution is 569 not E2E verified, 19 foundation/static-E2E-pending, 12 surface/static-E2E-pending and 39 contract/static-runtime verified. 160 require an external adapter; 31 are optional-or-required depending on capability. The 639 capability handlers were also executed directly in an isolated source audit: all 639 returned PLANNED, none returned COMPLETED; the five external adapter definitions are INTERFACE_ONLY. This is a source-level runtime finding, not a live provider or production test. See the ARIA runtime reality audit. Thus 639 registered records do not equal 639 completed features.

## 5. Current non-negotiable boundaries
- VAYRO has five direct independent applications: DANA, ARIA, ARIANA, LEADORA and ARMIN MARKET.
- ARIA receives ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM capabilities only after source and behavior audit.
- Accounting and ERP remain exclusively in ARIANA.
- DANA is an independent command-center app, not the parent of the other apps.
- LEADORA and ARMIN MARKET remain independent and are not merged into ARIA.
- No source, data or feature is removed or migrated without inventory, mapping, backup, dry run, integrity checks, tests and rollback plan.

## 6. Next engineering gates
1. Import the repaired ARIA 32 candidate into a canonical source branch and run Android CI against its exact SHA.
2. Build APK/AAB, sign through protected CI secrets and perform real-device acceptance.
3. Close Firebase, PSP, Object Storage, DB/Redis, notifications, backup/restore and tenant-isolation gates.
4. Create a 639-row capability evidence matrix with source path, owner, input/output, API, permissions, provider, cost, persistence and E2E test.
5. Obtain source archives for ARVAND, CHARSU, GANJINEH, SEPEHR and NAMA; complete NEGAH and PAYAM implementation.
6. Establish canonical repositories and release evidence for ARIANA and DANA without silently replacing one archive version with another.
7. Migrate each approved capability into ARIA incrementally while preserving existing behavior.
