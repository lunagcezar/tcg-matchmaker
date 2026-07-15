# PWA Assets

## Icons (TODO)

PWA icons are required for the install prompt to appear. Generate them using one of:

- **Quasar Icon Genie CLI**: `icongenie generate -i <source-icon>`
- **pwa-asset-generator**: `npx pwa-asset-generator <icon>`
- **Manual**: Generate 192x192 and 512x512 PNG icons

### Required sizes

| Size    | Purpose                  |
| ------- | ------------------------ |
| 192x192 | General PWA icon         |
| 512x512 | Splash screen / maskable |

Place generated icons in `public/icons/` and update `src-pwa/manifest.json` with the correct paths.
