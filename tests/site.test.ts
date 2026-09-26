import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import test, { after, before } from 'node:test';
import { runInNewContext } from 'node:vm';
import { build } from 'astro';
import { navBarConfig, profileConfig, siteConfig, textConfig } from '../src/config.ts';
import { resourceCategories } from '../src/content/categories/index.ts';

const listingsDirectory = resolve('src/content/listings');
let outputDirectory: string;
let homePage: string;
let aboutPage: string;
let resourcesPage: string;
let detailPages: Map<string, string>;
let searchScript: string;
type ListingSource = { id: string; name: string; category: string; body: string; url?: string; strikethrough: boolean };
let listings: ListingSource[];

async function readListing(id: string): Promise<ListingSource> {
  const source = await readFile(join(listingsDirectory, `${id}.md`), 'utf8');
  const header = source.slice(4, source.indexOf('\n---\n', 4));
  const fields = Object.fromEntries(header.split('\n').map((line) => {
    const separator = line.indexOf(': ');
    if (separator < 0) throw new Error(`Malformed frontmatter in ${id}`);
    return [line.slice(0, separator), line.slice(separator + 2)];
  }));
  const name = fields.name;
  const category = fields.category;
  if (!name || !category) throw new Error(`Missing frontmatter in ${id}`);
  return {
    id,
    name: JSON.parse(name) as string,
    category: JSON.parse(category) as string,
    body: source.slice(source.indexOf('\n---\n', 4) + 5).trim(),
    url: fields.url ? JSON.parse(fields.url) as string : undefined,
    strikethrough: fields.strikethrough === 'true',
  };
}

before(async () => {
  outputDirectory = await mkdtemp(join(resolve('.'), '.site-test-'));
  await build({ logLevel: 'silent', outDir: join(outputDirectory, 'dist') });
  const dist = join(outputDirectory, 'dist');
  [homePage, aboutPage, resourcesPage] = await Promise.all([
    'index.html', 'about/index.html', 'resources/index.html',
  ].map((path) => readFile(join(dist, path), 'utf8')));
  listings = await Promise.all((await readdir(listingsDirectory)).filter((name) => name.endsWith('.md'))
    .map((name) => readListing(name.slice(0, -3))));
  const entries = await readdir(join(dist, 'resources'), { withFileTypes: true });
  detailPages = new Map(await Promise.all(entries.filter((entry) => entry.isDirectory())
    .map(async ({ name }) => [name, await readFile(join(dist, 'resources', name, 'index.html'), 'utf8')] as const)));
  const script = resourcesPage.match(/<script[^>]*data-resource-search-client[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(script, 'resources page should include the search client');
  searchScript = script[1];
});

after(async () => {
  if (outputDirectory) await rm(outputDirectory, { recursive: true, force: true });
});

test('home renders configured text, navigation, featured cards, and search route', () => {
  assert.ok(homePage.includes(`<title>${textConfig.common.home} | ${siteConfig.title}</title>`));
  assert.ok(homePage.includes(textConfig.home.intro));
  assert.ok(homePage.includes(`--theme-hue: ${siteConfig.themeColor.hue}`));
  for (const { url } of navBarConfig.links) assert.ok(homePage.includes(`href="${url}"`));
  const featured = homePage.match(/<section class="featured-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(featured);
  assert.deepEqual([...featured.matchAll(/href="\/resources\/([^/]+)\/"/g)].map((match) => match[1]), siteConfig.featuredIds);
  assert.match(homePage, /<form[^>]*action="\/resources\/"[^>]*method="get"/);
  assert.match(homePage, /<input[^>]*type="search"[^>]*name="q"/);
  assert.doesNotMatch(homePage, /data-category-filter/);
});

test('About renders editable Markdown and configured profile links', async () => {
  const source = await readFile(resolve('src/content/pages/about.md'), 'utf8');
  const title = source.match(/^title: "([^"]+)"$/m)?.[1];
  const description = source.match(/^description: "([^"]+)"$/m)?.[1];
  assert.ok(title);
  assert.ok(description);
  assert.ok(aboutPage.includes(`<h1 id="about-title">${title}</h1>`));
  assert.ok(aboutPage.includes(`<meta name="description" content="${description}"`));
  assert.match(aboutPage, /<div class="about-markdown"><(?:p|h2|h3|ul|ol|blockquote|pre)/);
  for (const { url } of profileConfig.links) assert.ok(aboutPage.includes(`href="${url}"`));
});

test('small screens use single-column resource cards', async () => {
  const css = await readFile(resolve('src/styles/app.css'), 'utf8');
  assert.match(css, /@media \(max-width: \d+px\)\s*\{[\s\S]*?\.resource-grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /\.resource-directory \.resource-card\[hidden\]\s*\{\s*display:\s*none;/);
});

test('current Markdown listings generate searchable cards and detail pages', () => {
  assert.ok(listings.length > 0);
  assert.equal(new Set(listings.map(({ id }) => id)).size, listings.length);
  assert.equal(detailPages.size, listings.length);
  assert.equal([...resourcesPage.matchAll(/<a\b(?=[^>]*\bdata-resource-card\b)[^>]*>/g)].length, listings.length);
  for (const { id, category, body } of listings) {
    assert.ok(resourcesPage.includes(`href="/resources/${id}/"`));
    const page = detailPages.get(id);
    assert.ok(page, `${id} should have a static detail page`);
    const label = resourceCategories.find(({ slug }) => slug === category)?.name;
    assert.ok(label && page.includes(`<dd>${label}</dd>`), `${id} should show its category`);
    const original = body.replace(/\s+/g, ' ');
    const visible = page.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
      .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replace(/\s+/g, ' ');
    assert.ok(visible.includes(original), `${id} should render its Markdown description`);
  }
  for (const { slug } of resourceCategories) assert.ok(resourcesPage.includes(`data-category-filter="${slug}"`));
});

test('external links mirror current source URLs and retain safe attributes', () => {
  for (const { id, url } of listings) {
    const page = detailPages.get(id) ?? '';
    if (url) {
      assert.ok(['http:', 'https:'].includes(new URL(url).protocol), id);
      assert.ok(page.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`), id);
    } else {
      assert.ok(page.includes(textConfig.detail.noExternal), id);
      assert.doesNotMatch(page, /<a\b[^>]*href="https?:/);
    }
  }
});

test('strikethrough follows Markdown frontmatter', () => {
  for (const { id, name, strikethrough } of listings) {
    const page = detailPages.get(id) ?? '';
    assert.equal(/<h1><del>/.test(page), strikethrough, id);
    if (strikethrough) assert.ok(page.includes(`<del>${name}</del>`), id);
  }
});

type SearchElement = {
  dataset: Record<string, string>;
  hidden: boolean;
  value: string;
  textContent: string;
  attributes: Record<string, string>;
  listeners: Record<string, (event?: { preventDefault(): void }) => void>;
  addEventListener: (event: string, callback: (event?: { preventDefault(): void }) => void) => void;
  setAttribute: (name: string, value: string) => void;
  focus: () => void;
};

function element(dataset: Record<string, string> = {}): SearchElement {
  return {
    dataset, hidden: false, value: '', textContent: '', attributes: {}, listeners: {},
    addEventListener(event, callback) { this.listeners[event] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() {},
  };
}

function attribute(tag: string, name: string): string {
  const start = tag.indexOf(`${name}="`);
  if (start < 0) throw new Error(`Missing ${name} in ${tag}`);
  const value = tag.slice(start + name.length + 2).split('"', 1)[0];
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}

function startSearch(search = '') {
  const cards = [...resourcesPage.matchAll(/<a\b(?=[^>]*\bdata-resource-card\b)[^>]*>/g)]
    .map(([tag]) => element({ category: attribute(tag, 'data-category'), searchText: attribute(tag, 'data-search-text') }));
  const buttons = [...resourcesPage.matchAll(/<button\b(?=[^>]*\bdata-category-filter\b)[^>]*>/g)]
    .map(([tag]) => element({ categoryFilter: attribute(tag, 'data-category-filter') }));
  const input = element();
  const form = element();
  const clear = element();
  const empty = element();
  const status = element();
  const section = resourcesPage.match(/<section\b[^>]*data-resource-search\b[^>]*>/)?.[0];
  assert.ok(section);
  const root = {
    dataset: {
      countTemplate: attribute(section, 'data-count-template'),
      searchCountTemplate: attribute(section, 'data-search-count-template'),
    },
    querySelector(selector: string) {
      if (selector === 'form[role="search"]') return form;
      if (selector === 'input[name="q"]') return input;
      if (selector === '[data-clear-search]') return clear;
      if (selector === '[data-empty-state]') return empty;
      if (selector === '[data-result-status]') return status;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    querySelectorAll(selector: string) {
      if (selector === '[data-category-filter]') return buttons;
      if (selector === '[data-resource-card]') return cards;
      throw new Error(`Unexpected selector: ${selector}`);
    },
  };
  runInNewContext(searchScript, { document: { querySelector: () => root }, window: { location: { search } }, URLSearchParams });
  return { cards, buttons, input, form, clear, empty, status };
}

const visible = (cards: SearchElement[]) => cards.filter((card) => !card.hidden);

test('search filters by current names, descriptions, and category', () => {
  const { cards, buttons, input, clear } = startSearch();
  const name = listings.find(({ name }) => /[a-z]/i.test(name)
    && cards.filter(({ dataset }) => dataset.searchText.toLocaleLowerCase().includes(name.toLocaleLowerCase())).length === 1)?.name;
  assert.ok(name, 'need a unique searchable name with case variants');
  input.value = name.toLocaleUpperCase();
  input.listeners.input();
  assert.equal(visible(cards).length, 1);

  const descriptionTerm = listings.flatMap(({ body }) => body.match(/[\p{L}\p{N}]{3,}/gu) ?? [])
    .find((term) => !listings.some(({ name }) => name.toLocaleLowerCase().includes(term.toLocaleLowerCase()))
      && cards.filter(({ dataset }) => dataset.searchText.toLocaleLowerCase().includes(term.toLocaleLowerCase())).length === 1);
  assert.ok(descriptionTerm, 'need a unique word in a description');
  input.value = descriptionTerm;
  input.listeners.input();
  assert.equal(visible(cards).length, 1);

  const category = visible(cards)[0].dataset.category;
  const button = buttons.find(({ dataset }) => dataset.categoryFilter === category);
  assert.ok(button);
  button.listeners.click();
  assert.equal(visible(cards).length, 1);
  clear.listeners.click();
  assert.equal(visible(cards).length, cards.filter(({ dataset }) => dataset.category === category).length);
  assert.equal(button.attributes['aria-pressed'], 'true');
});

test('submission retains the category and unmatched queries expose an empty state', () => {
  const { cards, buttons, input, form, empty, clear, status } = startSearch();
  const category = resourceCategories.find(({ slug }) => cards.some(({ dataset }) => dataset.category === slug))?.slug;
  const button = buttons.find(({ dataset }) => dataset.categoryFilter === category);
  assert.ok(button);
  button.listeners.click();
  input.value = cards.map(({ dataset }) => dataset.searchText).join('|');
  assert.equal(cards.some(({ dataset }) => dataset.searchText.includes(input.value)), false);
  let prevented = false;
  form.listeners.submit({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(visible(cards).length, 0);
  assert.equal(empty.hidden, false);
  assert.equal(clear.hidden, false);
  assert.ok(status.textContent.includes('0'));
  clear.listeners.click();
  assert.equal(empty.hidden, true);
  assert.equal(visible(cards).length, cards.filter(({ dataset }) => dataset.category === category).length);
});

test('home query prepopulates the directory search', () => {
  const query = listings[0].name;
  const { input, cards } = startSearch(`?${new URLSearchParams({ q: query })}`);
  assert.equal(input.value, query);
  assert.equal(visible(cards).length, cards.filter(({ dataset }) =>
    dataset.searchText.toLocaleLowerCase().includes(query.toLocaleLowerCase())).length);
});
