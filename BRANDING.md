# Branding assets

Generated mascot images for the [askjeeves-tools](https://github.com/askjeeves-tools) GitHub org and tool repos.

## Files

| File | Use |
|------|-----|
| `assets/org-avatar.png` | Organization profile picture (512×512) |
| `assets/logo-readme.png` | README header (120px height) |
| `assets/social-preview-csv-tools.png` | csv-tools social preview (1280×640) |
| `assets/social-preview-docx-tools.png` | docx-tools social preview (1280×640) |

Regenerate from source:

```bash
pnpm install
pnpm run generate:assets
```

## Upload to GitHub Settings (recommended: manual)

GitHub has **no API** for org avatars or repo social previews, and it **blocks sign-in from Playwright’s embedded Chromium** (“unsupported browser”). Use your normal browser (Chrome, Edge, or Firefox).

### Quick start

```bash
pnpm run open:upload-pages
```

This opens the `assets/` folder and the three GitHub settings tabs. Sign in there if prompted, then upload:

| Tab | Upload this file |
|-----|------------------|
| [Org profile settings](https://github.com/organizations/askjeeves-tools/settings/profile) | `org-avatar.png` → **Upload new picture** |
| [csv-tools Settings](https://github.com/askjeeves-tools/csv-tools/settings) | `social-preview-csv-tools.png` → **Social preview** → Edit → Upload |
| [docx-tools Settings](https://github.com/askjeeves-tools/docx-tools/settings) | `social-preview-docx-tools.png` → **Social preview** → Edit → Upload |

### Optional: automated upload (Chrome or Edge required)

If you already have a saved session, or can sign in through **installed Chrome or Edge** (not embedded Chromium):

```bash
pnpm run upload:branding
```

First run opens Chrome/Edge for one-time GitHub sign-in, then uploads all three images.

README logos are already live — both tool repos reference `logo-readme.png` from this repo via raw.githubusercontent.com.
