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

## Upload to GitHub Settings

GitHub does not expose an API for org avatars or repo social previews. After generating assets, upload them once:

```bash
pnpm run upload:branding
```

This opens a browser for GitHub sign-in (first run only), then uploads:

1. Org avatar → [Organization profile settings](https://github.com/organizations/askjeeves-tools/settings/profile)
2. csv-tools social preview → [csv-tools Settings](https://github.com/askjeeves-tools/csv-tools/settings)
3. docx-tools social preview → [docx-tools Settings](https://github.com/askjeeves-tools/docx-tools/settings)

### Manual upload (alternative)

Open each settings page above, then upload the matching PNG from `assets/`.

README logos are committed automatically — both tool repos reference `logo-readme.png` from this repo via raw.githubusercontent.com.
