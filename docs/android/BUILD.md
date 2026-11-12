# VAYRO Android wrapper — debug build

This is a native Android WebView shell for the existing VAYRO web application. It does not bundle the Next.js server, database, API, or product backends into the APK.

## Prerequisite

VAYRO must first be deployed to a stable HTTPS origin. The repository currently documents that dedicated VAYRO application hosting is not yet available. Do not substitute an unrelated product's URL or a guessed domain.

## Build

The GitHub Actions workflow `.github/workflows/android-debug-apk.yml` is manually dispatched and requires the deployed VAYRO HTTPS URL as its `app_url` input. It builds `app-debug.apk` and uploads it as the `vayro-debug-apk` artifact for seven days.

The debug APK is suitable for internal installation testing only. It is not a Play Store release and is not signed with an owner-controlled release key.

## Security boundaries

- HTTPS is mandatory; cleartext HTTP is disabled.
- WebView file and content access are disabled.
- Mixed content is blocked and SSL errors fail closed.
- Third-party cookies are disabled.
- External HTTPS navigation is handed to the system browser.
- No production credentials or signing keys are stored in this repository.

## Remaining release work

1. Provision and verify dedicated VAYRO hosting and its HTTPS domain.
2. Run the workflow with that exact origin.
3. Install the resulting APK on supported Android devices and complete login, session, navigation, offline/error and accessibility tests.
4. Configure protected release signing only after owner-controlled key custody and recovery are established.
5. Run release CI and owner UAT before any store publication.
