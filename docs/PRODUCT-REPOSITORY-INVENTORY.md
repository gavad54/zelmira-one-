# Product repository inventory

**Inspection date:** 2026-11-10  
**Scope:** Repositories visible through the connected GitHub account for owner `gavad54`.  
**Purpose:** Establish evidence-based starting points for the eleven independent applications. This inventory is not a production-readiness certification.

## Inventory

| Application | Repository evidence in the connected account | Observed source state | Operational conclusion |
|---|---|---|---|
| ARVAND | No dedicated repository found in the visible repository list | Product specification is in the VAYRO workstream | Independent application implementation not verified |
| CHARSU | No dedicated repository found | No application source located in the visible list | Not started / not verified |
| GANJINEH | No dedicated repository found | No application source located in the visible list | Not started / not verified |
| NEGAH | No dedicated repository found | VAYRO contains a prototype creative-studio route; this is not an independent application repository/runtime | Independent application not verified |
| SEPEHR | No dedicated repository found | No application source located in the visible list | Not started / not verified |
| NAMA | No dedicated repository found | No application source located in the visible list | Not started / not verified |
| PAYAM | No dedicated repository found | No application source located in the visible list | Not started / not verified |
| LEADORA | [gavad54/LEADORA](https://github.com/gavad54/LEADORA) | FastAPI/SQLite application source and deployment guidance exist; README describes persistent-volume setup, backup limitations and several integrations not yet activated | Separate codebase exists; production hosting, independent encrypted backup/restore and full operational acceptance require fresh evidence |
| ARIANA | No dedicated repository found in the visible repository list | No independent source repository located in this inspection | Not verified; must not be treated as an ARIA module |
| ARIA | [gavad54/aria-android](https://github.com/gavad54/aria-android) | README describes a partial unified app direction; complete Android source archive is not imported and Android build/device verification remains blocked. The app is explicitly not accounting/ERP | Separate repository exists; full app and release not verified |
| ARMIN MARKET | [gavad54/Armin_market](https://github.com/gavad54/Armin_market) | Kotlin/Jetpack Compose Android starter; README says real products, accounts, backend API, sellers, cart, orders, payment and admin panel are not connected | Starter source exists; not a complete operational marketplace |

Other visible repositories include empty or non-operational placeholders such as `aria-app-1293`, `Armin_market1` and `zelmira`; they are not counted as independent application implementations. `zelmira-one-` is the VAYRO control-plane repository, not a substitute for any product repository.

## Immediate engineering implications

1. Do not create eleven empty repositories and call the portfolio implemented.
2. Preserve the existing LEADORA, ARIA and ARMIN MARKET codebases and audit them independently before changing their code or data.
3. Establish a dedicated ARIANA source repository only after its existing source/archive is located and reconciled; do not reconstruct or overwrite it from assumptions.
4. Create separate application repositories and deployment/data ownership plans for ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM only after each product's existing source and requirements have been inventoried.
5. Each app's own release gate must include source ownership, build/test evidence, isolated runtime, independent database, local auth, API scopes, encrypted backup, isolated restore, UAT and rollback.
6. The VAYRO control plane must continue operating if any one application or DANA integration is unavailable.

## Evidence limitations

The inventory is limited to repositories visible to the connected GitHub account at the inspection time. It does not rule out source archives, local files, private repositories outside the connected account, or repositories under another owner. Before creating or replacing an application repository, locate and compare those sources to prevent loss or duplication.
