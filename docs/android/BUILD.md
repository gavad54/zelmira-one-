# VAYRO Android wrapper — build and acceptance

This is a native Android WebView shell for the existing VAYRO web application. It does not bundle the Next.js server, database, API or product backends into the APK.

## Current prerequisite

A stable, dedicated VAYRO HTTPS origin is not yet provisioned. Do not reuse the ARIA or LEADORA Railway project, their service domains, a guessed domain, or any unrelated product URL.

## CI build behavior

The workflow `.github/workflows/android-debug-apk.yml` has two modes:

- Push to the isolated Android integration branch: builds the APK with an internal-only `https://vayro.invalid` sentinel to verify Gradle, Android SDK and compilation. This build does not upload an installable artifact.
- Manual dispatch after the workflow reaches the default branch: requires the exact deployed VAYRO HTTPS URL. Only this mode uploads `vayro-debug-apk` for seven days.

The compile-only sentinel is never accepted for a manual artifact build. The workflow does not fall back to the ARIA or LEADORA service URL.

## Security boundaries

- HTTPS is mandatory; cleartext HTTP is disabled.
- WebView file and content access are disabled.
- Mixed content is blocked and TLS errors fail closed.
- Third-party cookies are disabled.
- External HTTPS navigation is handed to the system browser.
- No production credentials or signing keys are stored in the repository.

## Remaining Android release work

1. Provision independent VAYRO hosting and verify its HTTPS certificate and health endpoint.
2. Run the manual workflow with that exact URL and verify the artifact.
3. Install on real supported Android devices and test login/MFA, cookies/session persistence, navigation, keyboard/RTL, offline/error states, accessibility and back navigation.
4. Establish owner-controlled release-signing key custody and recovery.
5. Run signed release CI, UAT and rollback/upgrade acceptance before store distribution.

A debug APK is for internal testing only. It is not a signed store release.
