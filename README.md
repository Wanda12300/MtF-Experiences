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
