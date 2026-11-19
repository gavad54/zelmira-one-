# ARIA Source Inventory — Initial Findings
**Audit date:** 2026-11-19  
**Scope:** GitHub repositories visible to the connected account and source files fetched for this task.

| Product/source | Evidence | State |
|---|---|---|
| gavad54/aria-android | Node.js web prototype; server.js, index.html, app.js, test/server.test.js; 60 current module records | SOURCE_FOUND |
| gavad54/aria-app | Repository exists but README/package source could not be fetched from main | SOURCE_NOT_LOCATED |
| gavad54/aria-app-1293 | GitHub reports repository empty | EMPTY_REPOSITORY |
| ARIA 32 Android source | README references Library ZIP and multiple checksums; full archive not present in Git repo | BLOCKED_PROVENANCE |
| ARIANA | No attributable source repository found in accessible owner repository list/search | SOURCE_NOT_LOCATED |
| DANA | No attributable independent source repository found in accessible owner repository list/search | SOURCE_NOT_LOCATED |
| LEADORA | Separate repository with README and FastAPI/SQLite product | SOURCE_FOUND |
| ARMIN MARKET | Separate Kotlin/Jetpack Compose Android repository | SOURCE_FOUND |
| VAYRO | zelmira-one- repository and architecture docs | SOURCE_FOUND |

## ARIA web catalogue snapshot
At main SHA 350a05a7e80189df4b24359d03ed1c0fc7e7f178, server.js contains 60 records:
- 2 available records, treated as code foundations only.
- 5 prototype records.
- 53 planned records.

The count is specific to the current web catalogue. It must not be added to the reported 369 ARIA 25 records, 639 ARIA 32 records or 50 ideas. Those are different source/version inventories and require ID-level reconciliation.

## Outstanding source discovery
The known candidate set for ARIA consolidation is ARVAND, CHARSU, GANJINEH, NEGAH, SEPEHR, NAMA and PAYAM. The historical total of eleven or twelve applications is not reconciled. Missing repositories and source archives remain SOURCE_NOT_LOCATED; no implementation or migration is inferred.
