# MtF Experiences resource directory

A static Astro directory that preserves the categories and resource text from
the upstream `index.html`. Each listing is a Markdown file: its frontmatter
stores the name, category, and source URL when one exists; its Markdown body
preserves the source paragraph. The struck-through source entry is identified
in frontmatter. These historical descriptions and external links have not been
independently reviewed. Entries without an upstream hyperlink do not receive an
invented URL.

Categories and their display order are maintained in
`src/content/categories/index.ts`.

## Customize

Edit `src/config.ts` to set the site title, subtitle, language, metadata description,
navigation, featured listing IDs, profile links, interface copy (`textConfig`),
and visual options. Edit `src/content/pages/about.md` for the About page
heading (`title`), page metadata
(`description`), and Markdown body; profile name, bio, avatar, and links remain
in `src/config.ts`:

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

Resource descriptions are independent of interface copy and remain editable in
`src/content/listings/`. The About body is independently editable in Markdown.

Use actual resource IDs from `src/content/listings/` for `featuredIds`; an unknown
ID intentionally fails the build. Internal navigation paths use the root-domain
hosting described in the upstream README. No availability or verification status
is generated for listings.

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
