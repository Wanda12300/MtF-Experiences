import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test, { before } from 'node:test';
import { build } from 'astro';

const homePagePath = resolve('dist/index.html');
let homePage: string;

before(async () => {
  await build({ logLevel: 'silent' });
  homePage = await readFile(homePagePath, 'utf8');
});

test('home search sends the query to the resources directory', () => {
  assert.match(homePage, /<form[^>]*action="\/resources\/"[^>]*method="get"[^>]*>/);
  assert.match(homePage, /<input[^>]*type="search"[^>]*name="q"[^>]*>/);
});

test('home cards link to real resource details without category controls', () => {
  for (const resource of [
    { id: 'mtf-wiki', name: 'mtf.wiki' },
    { id: 'thai-pharmacy', name: '泰记药房' },
    { id: 'trans-survival-guide', name: '跨性别者邪修生存指南' },
  ]) {
    assert.match(homePage, new RegExp(`href="/resources/${resource.id}/"`));
    assert.ok(homePage.includes(resource.name), `home page should feature ${resource.name}`);
  }

  assert.doesNotMatch(homePage, /aria-label="分类"|class="[^"]*category-filter|href="\/resources\/\?category=/);
});

test('home identifies its resource descriptions as an unreviewed historical snapshot', () => {
  assert.ok(homePage.includes('历史快照'));
  assert.ok(homePage.includes('未经独立复核'));
  assert.doesNotMatch(homePage, /class="[^"]*(?:availability|status-badge)[^"]*"/);
});
