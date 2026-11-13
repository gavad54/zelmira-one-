# VAYRO Android wrapper — debug build

This is a native Android WebView shell for the existing VAYRO web application. It does not bundle the Next.js server, database, API, or product backends into the APK.

## Prerequisite

VAYRO must first be deployed to a stable, dedicated HTTPS origin. The repository currently records that independent VAYRO application hosting is not provisioned; Railway's free-plan resource limit previously blocked a separate project. Do not reuse ARIA/LEADORA hosting, an unrelated product URL, or a guessed domain.

## Build

The workflow `.github/workflows/android-debug-apk.yml` supports two paths:

- Push to the isolated branch `feat/vayro-android-webview-wrapper`: after hosting is ready, set the repository Actions variable `VAYRO_APP_URL` to the exact public HTTPS origin. The next branch push runs the debug build.
- Manual dispatch: provide the exact deployed HTTPS URL as `app_url`. Manual dispatch is available after the workflow is present on the repository default branch; do not merge this PR solely to enable it.

If neither URL is supplied, the workflow reports that it is waiting for hosting and does not create an APK. It never substitutes a placeholder URL.

A successful run uploads `app-debug.apk` as the `vayro-debug-apk` artifact for seven days.

The debug APK is suitable for internal installation testing only. It is not a Play Store release and is not signed with an owner-controlled release key.

## Security boundaries

- HTTPS is mandatory; cleartext HTTP is disabled.
- WebView file and content access are disabled.
- Mixed content is blocked and SSL errors fail closed.
- Third-party cookies are disabled.
- External HTTPS navigation is handed to the system browser.
- No production credentials or signing keys are stored in this repository.

## Remaining release work

1. Provision and verify dedicated VAYRO hosting and its HTTPS domain with owner-controlled access.
2. Set `VAYRO_APP_URL` or dispatch the workflow with that exact origin.
3. Verify a successful Actions run and retrieve the APK artifact.
4. Install the APK on supported Android devices and complete login, session, navigation, offline/error and accessibility tests.
5. Configure protected release signing only after owner-controlled key custody and recovery are established.
6. Run release CI and owner UAT before any store publication.
