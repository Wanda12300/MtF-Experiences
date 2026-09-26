import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test, { after, before } from 'node:test';
import { build } from 'astro';
import { resourceCategories } from '../src/content/categories/index.ts';
import { siteConfig } from '../src/config.ts';

const listingsDirectory = resolve('src/content/listings');
let resourcesOutputDirectory: string;
let detailPages: Map<string, string>;

before(async () => {
  const buildDirectory = await mkdtemp(join(resolve('.'), '.resource-details-test-'));
  resourcesOutputDirectory = join(buildDirectory, 'dist/resources');
  await build({ logLevel: 'silent', outDir: join(buildDirectory, 'dist') });

  const outputEntries = await readdir(resourcesOutputDirectory, { withFileTypes: true });
  detailPages = new Map(await Promise.all(outputEntries
    .filter((entry) => entry.isDirectory())
    .map(async ({ name }) => [name, await readFile(join(resourcesOutputDirectory, name, 'index.html'), 'utf8')] as const)));
});

after(async () => {
  if (resourcesOutputDirectory) {
    await rm(resolve(resourcesOutputDirectory, '../..'), { recursive: true, force: true });
  }
});

test('every Markdown listing has a static detail page with its source category and original description', async () => {
  const listingIds = (await readdir(listingsDirectory))
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => filename.slice(0, -'.md'.length));

  assert.equal(detailPages.size, listingIds.length);
  const categoryNames = new Map<string, string>(resourceCategories.map(({ slug, name }) => [slug, name]));
  for (const id of listingIds) {
    const page = detailPages.get(id);
    assert.ok(page, `${id} should have its own static detail page`);
    assert.match(page, /<main[^>]*class="resource-detail-page"/);
    assert.match(page, /class="resource-detail-layout"/);
    assert.equal(/class="[^"]*history-note/.test(page), siteConfig.showHistoricalNotice);
    assert.match(page, /原始说明/);
    assert.match(page, /所属分类/);

    const source = await readFile(join(listingsDirectory, `${id}.md`), 'utf8');
    const categorySlug = source.match(/^category: "([^"]+)"$/m)?.[1];
    const categoryName = categorySlug ? categoryNames.get(categorySlug) : undefined;
    assert.ok(categoryName, `${id} should retain a known source category`);
    assert.ok(page.includes(`<dd>${categoryName}</dd>`), `${id} should show its source category`);

    const bodyStart = source.indexOf('\n---\n', 4) + '\n---\n'.length;
    const originalBody = source.slice(bodyStart).trim().replace(/\s+/g, ' ');
    const visibleText = page
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replace(/\s+/g, ' ');
    assert.ok(visibleText.includes(originalBody), `${id} should render its original Markdown body`);
  }
});

test('external links only appear for source URLs and use safe new-window attributes', async () => {
  const listingIds = (await readdir(listingsDirectory))
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => filename.slice(0, -'.md'.length));

  for (const id of listingIds) {
    const source = await readFile(join(listingsDirectory, `${id}.md`), 'utf8');
    const sourceUrl = source.match(/^url: "([^"]+)"$/m)?.[1];
    const page = detailPages.get(id) ?? '';

    if (sourceUrl) {
      assert.ok(page.includes(`href="${sourceUrl}" target="_blank" rel="noopener noreferrer"`), `${id} should link only to its source URL safely`);
      assert.ok(page.includes(new URL(sourceUrl).host), `${id} should identify the external site`);
    } else {
      assert.match(page, /未提供外部链接/);
      assert.doesNotMatch(page, /<a\b[^>]*href="https?:/);
    }
  }
});

test('historically struck-through listings retain semantic strikethrough without an availability claim', () => {
  const page = detailPages.get('india-direct-mail') ?? '';
  assert.match(page, /<del[^>]*>印度直邮购<\/del>/);
  assert.match(page, /<del[^>]*>[\s\S]*已经无法搜到[\s\S]*<\/del>/);
  assert.doesNotMatch(page, /可用|现货|库存|已核验|核验日期/);
});

test('unrecognized resource slugs do not receive a generated detail page', () => {
  assert.equal(detailPages.has('not-a-resource'), false);
});
