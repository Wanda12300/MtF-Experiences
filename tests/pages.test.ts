import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test, { before } from 'node:test';
import { build } from 'astro';
import { aboutConfig, navBarConfig, profileConfig, siteConfig } from '../src/config.ts';

const homePagePath = resolve('dist/index.html');
const aboutPagePath = resolve('dist/about/index.html');
let homePage: string;
let aboutPage: string;

before(async () => {
  await build({ logLevel: 'silent' });
  homePage = await readFile(homePagePath, 'utf8');
  aboutPage = await readFile(aboutPagePath, 'utf8');
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

test('home uses configurable site identity, navigation, and featured resources', () => {
  assert.ok(homePage.includes(`<title>首页 | ${siteConfig.title}</title>`));
  assert.ok(homePage.includes(`--theme-hue: ${siteConfig.themeColor.hue}`));
  for (const { name, url } of navBarConfig.links) {
    assert.ok(homePage.includes(`href="${url}"`), `nav should contain ${name}`);
  }
  assert.equal(homePage.includes('id="theme-hue"'), !siteConfig.themeColor.fixed);
  assert.ok(homePage.includes('从这里开始了解'));
});

test('about page describes the project without claiming resource verification', () => {
  assert.match(aboutPage, /<main[^>]*id="main-content"/);
  assert.ok(aboutPage.includes(aboutConfig.heading));
  assert.ok(aboutPage.includes(profileConfig.links[0].url));
  assert.ok(aboutPage.includes('未经独立复核'));
});

test('historical snapshot notices are hidden by default but original descriptions remain', () => {
  assert.equal(siteConfig.showHistoricalNotice, false);
  assert.doesNotMatch(homePage, /class="[^"]*history-note/);
  assert.doesNotMatch(aboutPage, /class="[^"]*history-note/);
  assert.doesNotMatch(homePage, /class="[^"]*(?:availability|status-badge)[^"]*"/);
});
