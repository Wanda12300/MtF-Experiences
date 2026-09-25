import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import test, { after, before } from 'node:test';
import { build } from 'astro';

const listingsDirectory = resolve('src/content/listings');
let resourcesPage: string;
let resourceSearchScript: string;
let testBuildDirectory: string;

before(async () => {
  testBuildDirectory = await mkdtemp(join(resolve('.'), '.resource-search-test-'));
  await build({ logLevel: 'silent', outDir: join(testBuildDirectory, 'dist') });
  resourcesPage = await readFile(join(testBuildDirectory, 'dist/resources/index.html'), 'utf8');
  const script = resourcesPage.match(/<script[^>]*data-resource-search-client[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(script, 'resources page should include its client-side search script');
  resourceSearchScript = script[1];
});

after(async () => {
  if (testBuildDirectory) await rm(testBuildDirectory, { recursive: true, force: true });
});

test('resources page lists every listing under its source category with a detail link', async () => {
  const listingIds = (await readdir(listingsDirectory))
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => filename.slice(0, -'.md'.length));
  const cards = [...resourcesPage.matchAll(/<a\b(?=[^>]*\bdata-resource-card\b)[^>]*>/g)];

  assert.equal(cards.length, listingIds.length);
  for (const id of listingIds) {
    assert.match(resourcesPage, new RegExp(`href="/resources/${id}/"`), `${id} should link to its detail page`);
  }
  for (const category of ['wiki-baike', 'hrt-shops', 'hrt-guides', 'other']) {
    assert.match(resourcesPage, new RegExp(`data-category-filter="${category}"`));
  }
  assert.match(resourcesPage, /action="\/resources\/"[^>]*method="get"/);
  assert.match(resourcesPage, /name="q"/);

  assert.match(resourcesPage, /<del>印度直邮购<\/del>/, 'the source strikethrough should remain visible');
  assert.match(resourcesPage, /href="\/resources\/pdd\/"/, 'listings without external URLs still need detail cards');
  assert.doesNotMatch(resourcesPage, /class="[^"]*(?:availability|status-badge)[^"]*"/);
});

type SearchElement = {
  dataset: Record<string, string>;
  hidden: boolean;
  value: string;
  textContent: string;
  attributes: Record<string, string>;
  listeners: Record<string, () => void>;
  addEventListener: (event: string, callback: () => void) => void;
  setAttribute: (name: string, value: string) => void;
  focus: () => void;
};

function element(dataset: Record<string, string> = {}): SearchElement {
  return {
    dataset,
    hidden: false,
    value: '',
    textContent: '',
    attributes: {},
    listeners: {},
    addEventListener(event, callback) {
      this.listeners[event] = callback;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    focus() {},
  };
}

function getAttribute(tag: string, name: string): string {
  const value = tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
  if (value === undefined) throw new Error(`expected ${name} on ${tag}`);
  return value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
}

function startSearch(search = '') {
  const cards = [...resourcesPage.matchAll(/<a\b(?=[^>]*\bdata-resource-card\b)[^>]*>/g)]
    .map(([tag]) => element({
      category: getAttribute(tag, 'data-category'),
      searchText: getAttribute(tag, 'data-search-text'),
    }));
  const categoryButtons = [...resourcesPage.matchAll(/<button\b(?=[^>]*\bdata-category-filter\b)[^>]*>/g)]
    .map(([tag]) => element({ categoryFilter: getAttribute(tag, 'data-category-filter') }));
  const input = element();
  const clearButton = element();
  const emptyState = element();
  const resultStatus = element();
  const root = {
    querySelector(selector: string) {
      if (selector === 'input[name="q"]') return input;
      if (selector === '[data-clear-search]') return clearButton;
      if (selector === '[data-empty-state]') return emptyState;
      if (selector === '[data-result-status]') return resultStatus;
      throw new Error(`Unexpected querySelector: ${selector}`);
    },
    querySelectorAll(selector: string) {
      if (selector === '[data-category-filter]') return categoryButtons;
      if (selector === '[data-resource-card]') return cards;
      throw new Error(`Unexpected querySelectorAll: ${selector}`);
    },
  };

  runInNewContext(resourceSearchScript, {
    document: { querySelector: () => root },
    window: { location: { search } },
    URLSearchParams,
  });

  return { cards, categoryButtons, input, clearButton, emptyState, resultStatus };
}

function visibleCards(cards: SearchElement[]) {
  return cards.filter((card) => !card.hidden);
}

test('search matches resource names and descriptions without case sensitivity', () => {
  const { cards, input } = startSearch();

  input.value = 'MTF.WIKI';
  input.listeners.input();
  assert.deepEqual(visibleCards(cards).map(({ dataset }) => dataset.category), ['wiki-baike']);
  assert.equal(visibleCards(cards).length, 1);

  input.value = 'apple pay';
  input.listeners.input();
  assert.equal(visibleCards(cards).length, 1, 'description text should also be searchable');
  assert.equal(visibleCards(cards)[0].dataset.category, 'hrt-shops');
});

test('category and search filters combine, and clearing search restores the active category', () => {
  const { cards, categoryButtons, input, clearButton } = startSearch();
  const guides = categoryButtons.find(({ dataset }) => dataset.categoryFilter === 'hrt-guides');
  assert.ok(guides);
  guides.listeners.click();
  assert.equal(visibleCards(cards).length, 2);

  input.value = 'HRT药典';
  input.listeners.input();
  assert.equal(visibleCards(cards).length, 1);
  assert.equal(visibleCards(cards)[0].dataset.category, 'hrt-guides');

  clearButton.listeners.click();
  assert.equal(input.value, '');
  assert.equal(visibleCards(cards).length, 2);
  assert.equal(guides.attributes['aria-pressed'], 'true');
});

test('initial query, struck-through listings, and no-external-link records remain searchable', () => {
  const { cards, input, resultStatus } = startSearch('?q=印度直邮购');
  assert.equal(input.value, '印度直邮购');
  assert.equal(visibleCards(cards).length, 1);
  assert.ok(resultStatus.textContent.includes('1'));

  input.value = 'PDD';
  input.listeners.input();
  assert.equal(visibleCards(cards).length, 1);
  assert.equal(visibleCards(cards)[0].dataset.category, 'hrt-shops');
});

test('filtered resource cards are visually hidden, not merely marked hidden in the DOM', async () => {
  const css = await readFile(resolve('src/styles/app.css'), 'utf8');
  assert.match(css, /\.resource-directory \.resource-card\[hidden\]\s*\{\s*display:\s*none;/);
});

test('unmatched queries expose an empty state and an accessible way to clear the query', () => {
  const { cards, input, clearButton, emptyState, resultStatus } = startSearch();
  input.value = 'no matching resource';
  input.listeners.input();

  assert.equal(visibleCards(cards).length, 0);
  assert.equal(emptyState.hidden, false);
  assert.equal(clearButton.hidden, false);
  assert.ok(resultStatus.textContent.includes('0'));

  clearButton.listeners.click();
  assert.equal(emptyState.hidden, true);
  assert.equal(clearButton.hidden, true);
  assert.equal(visibleCards(cards).length, cards.length);
});
