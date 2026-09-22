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

## Release flow
1. All development on `main`
2. Before each store build: `git tag v1.x.x && git push --tags`
3. Production builds are run only from a tagged commit
