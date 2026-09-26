# MtF Experiences resource directory

A static Astro directory that preserves the categories and resource text from
the upstream `index.html`. Each listing is a Markdown file: its frontmatter
stores the name, category, and source URL when one exists; its Markdown body
preserves the source paragraph. The struck-through source entry is identified
in frontmatter. These historical descriptions and external links have not been
independently reviewed. Entries without an upstream hyperlink do not receive an
invented URL.

Category labels, slugs, and display order are maintained in
`src/content/categories/categories.json`. Listing `category` values must match a slug in that file.

## Customize

Edit `src/config.ts` for site identity, navigation, profile links, visual options,
and shared control labels (`textConfig`). Page-specific titles, metadata, and copy
live in Markdown frontmatter under `src/content/pages/`: `index.md` for the homepage,
`resources.md` for the directory, and `about.md` for the About page. Each
resource detail page reads its own listing's frontmatter and body; shared UI
labels stay in `textConfig`. The About body is also Markdown; profile name,
bio, avatar, and links remain in
`src/config.ts`:

- `siteConfig.themeColor.hue` sets the initial accent color (0–360). Set `fixed: true`
  to hide the visitor color slider and ignore previously saved color choices. The
  light/dark switch remains available.
- `siteConfig.banner` enables an optional banner image and credit. Add your own
  image to `public/` and use a path such as `/images/banner.jpg`; no image is
  bundled by default. `profileConfig.avatar` and profile-link `icon` paths also
  refer to images you provide. Links are shown on `/about/`.
- `siteConfig.favicon` accepts one or more icon paths with optional `sizes` and
  light/dark `theme`. `licenseConfig` is disabled until the owner selects a
  license; enabling it does not license upstream resource descriptions.

Resource descriptions and per-resource attributes remain editable in
`src/content/listings/`. Set `featuredOrder` in a listing's frontmatter to feature
it on the homepage; positive, unique numbers determine display order. Leave it
out to omit the listing from that section. The section is hidden if nothing is
featured. Category labels and order live in `src/content/categories/categories.json`.

Internal navigation paths use the root-domain hosting described in the upstream
README. No availability or verification status is generated for listings.

## Develop

```sh
pnpm install
pnpm dev
```

## Verify and build

```sh
pnpm test
pnpm check
pnpm build
```

The build writes a static site to `dist/`. Listing files are maintained under
`src/content/listings/`; each Markdown filename is its stable content ID.
