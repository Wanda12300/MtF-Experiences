import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test, { before } from 'node:test';
import { build } from 'astro';
import { navBarConfig, profileConfig, siteConfig } from '../src/config.ts';

const aboutSourcePath = resolve('src/content/pages/about.md');

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

test('home cards follow configured featured IDs without category controls', () => {
  const featuredSection = homePage.match(/<section class="featured-section"[\s\S]*?<\/section>/)?.[0];
  assert.ok(featuredSection, 'home should render featured cards');
  const linkedIds = [...featuredSection.matchAll(/href="\/resources\/([^/]+)\/"/g)].map((match) => match[1]);
  assert.deepEqual(linkedIds, siteConfig.featuredIds);
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

test('about page renders editable Markdown and configured profile links', async () => {
  const source = await readFile(aboutSourcePath, 'utf8');
  const title = source.match(/^title: "([^"]+)"$/m)?.[1];
  const description = source.match(/^description: "([^"]+)"$/m)?.[1];
  assert.ok(title, 'About Markdown must have a title');
  assert.ok(description, 'About Markdown must have a description');
  assert.match(aboutPage, /<main[^>]*id="main-content"/);
  assert.ok(aboutPage.includes(`<h1 id="about-title">${title}</h1>`));
  assert.ok(aboutPage.includes(`<meta name="description" content="${description}"`));
  assert.match(aboutPage, /<div class="about-markdown"><(?:p|h2|h3|ul|ol|blockquote|pre)/);
  for (const { url } of profileConfig.links) {
    assert.ok(aboutPage.includes(`href="${url}"`), `About page should include ${url}`);
  }
});

test('snapshot notices follow configuration instead of a fixed expectation', () => {
  assert.equal(/class="[^"]*history-note/.test(homePage), siteConfig.showHistoricalNotice);
  assert.equal(/class="[^"]*history-note/.test(aboutPage), false);
  assert.doesNotMatch(homePage, /class="[^"]*(?:availability|status-badge)[^"]*"/);
});
