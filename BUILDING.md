# Build & Release

## Prerequisites
- EAS CLI: `npm install -g eas-cli` then `eas login`
- Env vars set as EAS Secrets (production profile): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Local dev: copy `.env.local.example` to `.env.local` and fill in values

## Profiles
| Profile | Output | Use |
|---------|--------|-----|
| `development` | Dev client | Local device testing with hot reload |
| `preview` | APK | Internal distribution, direct install on Android |
| `production` | AAB | Google Play Store submission |

## Commands
```bash
eas build --platform android --profile preview     # test APK
eas build --platform android --profile production  # Play Store AAB
eas build --platform ios --profile production      # App Store IPA (requires Apple Developer account)
```

## Known dependency constraints

- **`@supabase/supabase-js` is pinned to `2.105.4`** — versions 2.106.0+ use `dynamic import()` that breaks Hermes compilation on Android. Before upgrading, verify with `npx expo export --platform android`. See build a6e29211 (failed) vs b276c692 (passed).

## OTA updates (expo-updates)

`runtimeVersion` policy is `appVersion` — OTA updates only reach installed builds that share the **exact same `version` in app.json**. After any native rebuild with a version bump, new updates must target the new version.

**JS-only change** (no native modules added/changed):
```bash
eas update --branch production --message "describe the change"
```

**Native change** (new package, config plugin, permission, etc.):
```bash
# 1. Bump version in app.json (e.g. "1.0.1")
# 2. Tag and push
git tag v1.0.1 && git push --tags
# 3. Rebuild and submit
eas build --platform android --profile production
eas submit --platform android
```

## Release flow
1. All development on `main`
2. Before each store build: `git tag v1.x.x && git push --tags`
3. Production builds are run only from a tagged commit
4. After a store build ships, JS fixes deploy via `eas update --branch production`
