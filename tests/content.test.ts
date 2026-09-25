import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { resourceCategories } from '../src/content/categories/index.ts';

type ListingRecord = {
  id: string;
  name: string;
  url: string | null;
  category: string;
  body: string;
  strikethrough: boolean;
};

const listingsDirectory = new URL('../src/content/listings/', import.meta.url);

function parseFrontmatterValue(value: string): string | boolean {
  if (value.startsWith('"')) return JSON.parse(value) as string;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Unexpected frontmatter value: ${value}`);
}

async function readListings(): Promise<ListingRecord[]> {
  const filenames = (await readdir(listingsDirectory)).filter((name) => name.endsWith('.md')).sort();
  return Promise.all(filenames.map(async (filename) => {
    const source = await readFile(new URL(filename, listingsDirectory), 'utf8');
    assert.ok(source.startsWith('---\n'), `${filename} must start with frontmatter`);

    const closingDelimiter = source.indexOf('\n---\n', 4);
    assert.notEqual(closingDelimiter, -1, `${filename} must close its frontmatter`);

    const metadata: Record<string, string | boolean> = {};
    for (const line of source.slice(4, closingDelimiter).split('\n')) {
      const separator = line.indexOf(': ');
      assert.notEqual(separator, -1, `${filename} has malformed frontmatter: ${line}`);
      metadata[line.slice(0, separator)] = parseFrontmatterValue(line.slice(separator + 2));
    }

    const bodyStart = closingDelimiter + '\n---\n'.length;
    let body = source.slice(bodyStart);
    assert.ok(body.endsWith('\n'), `${filename} must end with a newline`);
    body = body.slice(0, -1);

    return {
      id: filename.slice(0, -'.md'.length),
      name: String(metadata.name),
      url: typeof metadata.url === 'string' ? metadata.url : null,
      category: String(metadata.category),
      body,
      strikethrough: metadata.strikethrough === true,
    };
  }));
}

const expectedCategories = [
  { slug: 'wiki-baike', name: 'wiki百科：', sourceHeading: ' wiki百科：', order: 1 },
  { slug: 'hrt-shops', name: 'HRT药物购买：', sourceHeading: ' HRT药物购买：', order: 2 },
  { slug: 'hrt-guides', name: 'HRT相关资料：', sourceHeading: ' HRT相关资料：', order: 3 },
  { slug: 'other', name: '其他：', sourceHeading: '其他：', order: 4 },
];

const expectedListings: ListingRecord[] = [
  { id: 'akimideshop', name: 'akimideshop', url: 'https://akimideshop.com/', category: 'hrt-shops', body: 'akimideshop 泰补、土色、日雌、贴片等等（现在基本只剩下凝胶了）', strikethrough: false },
  { id: 'ark-health-app', name: '方舟健客APP', url: null, category: 'hrt-shops', body: '方舟健客APP 可以买到国补、\t国色、螺等等，需要下载手机app，需要小证，之前可以用女性家人的身份证买，但是现在强制需要处方', strikethrough: false },
  { id: 'diy-estrogel', name: '自制凝胶', url: 'https://github.com/lydlid/estrogel-diy-guide-zh_CN', category: 'hrt-shops', body: '自制凝胶 自制凝胶教程，来源于Github', strikethrough: false },
  { id: 'gender-dysphoria-fyi-zh', name: '这就是性别烦躁，请参考', url: 'https://genderdysphoria.fyi/zh', category: 'wiki-baike', body: ' 这就是性别烦躁，请参考有关性别焦虑/烦躁的网站', strikethrough: false },
  { id: 'hrt-dictionary', name: 'HRT药典', url: 'https://hrtyaku.com/zh', category: 'hrt-guides', body: 'HRT药典 HRT用药的相关信息', strikethrough: false },
  { id: 'india-direct-mail', name: '印度直邮购', url: 'https://mobile.idzyg.com/goods-416.html', category: 'hrt-shops', body: ' 印度直邮购 有低价50色和100色，279rmb（已经无法搜到）', strikethrough: true },
  { id: 'japan-health', name: 'japan health', url: 'https://bio-japan.net/progynon-depot', category: 'hrt-shops', body: 'japan health 有低价日雌，日本网站，英文，需要小证', strikethrough: false },
  { id: 'monudexiaodian', name: '魔女的小店', url: 'https://monudexiaodian.com/', category: 'hrt-shops', body: ' 魔女的小店 国补、泰补、土色、日雌、贴片都有，价格偏高（日雌和色已经下架）', strikethrough: false },
  { id: 'mtf-party', name: 'MtF指南针', url: 'https://mtf.party/', category: 'wiki-baike', body: 'MtF指南针 提供各种指南的站点，资料较旧', strikethrough: false },
  { id: 'mtf-wiki', name: 'mtf.wiki', url: 'https://mtf.wiki/', category: 'wiki-baike', body: 'mtf.wiki mtf百科：包含用药，开具证明等一系列资料，部分内容可能会过时', strikethrough: false },
  { id: 'pdd', name: 'PDD', url: null, category: 'hrt-shops', body: 'PDD 国补（补佳乐下架，只有仙静的）、爱斯妥凝胶、螺都有（可以P处方），搜加拿大枫林宝可以搜到土色（加拿大枫林宝特强维c）', strikethrough: false },
  { id: 'prescription-photo-generator', name: '处方照片生成器', url: 'https://chufang.lizexua.com/', category: 'other', body: '处方照片生成器 用来P处方，有很多参数可供选择，非常好用', strikethrough: false },
  { id: 'project-trans', name: 'Project Trans', url: 'https://about.project-trans.org/zh-hans/', category: 'other', body: 'Project Trans 跨性别相关网站', strikethrough: false },
  { id: 'rle-wiki', name: 'rle.wiki', url: 'https://rle.wiki/', category: 'wiki-baike', body: 'rle.wiki 一些RLE（ Real Life Experience ）的相关资料', strikethrough: false },
  { id: 'shizis-hrt-guide', name: "Shizi's HRT guide", url: 'https://docs.gaht.guide/', category: 'hrt-guides', body: "Shizi's HRT guide MtF HRT资料", strikethrough: false },
  { id: 'thai-pharmacy', name: '泰记药房', url: 'https://thaifengliu.com/product-category/girl/', category: 'hrt-shops', body: '泰记药房 有泰补、凝胶、色、日雌等，可以用Apple Pay或者联系卖家去其他平台支付；不确定有没有运费以及药品来源；不能用魔法', strikethrough: false },
  { id: 'trans-survival-guide', name: '跨性别者邪修生存指南', url: 'https://t.co/aUWvUUsnVK', category: 'other', body: '跨性别者邪修生存指南 从出柜到生存到hrt等相当多的资料，内容详细全面，非常值得阅读；文档可下载，感谢推友 @Yzmtsky6666 的贡献！', strikethrough: false },
];

test('content records exactly map upstream categories and Markdown listings', async () => {
  assert.deepEqual(resourceCategories, expectedCategories);
  const listings = await readListings();
  assert.deepEqual(listings, expectedListings);

  const categorySlugs: Set<string> = new Set(resourceCategories.map(({ slug }) => slug));
  assert.equal(new Set(listings.map(({ id }) => id)).size, listings.length, 'listing IDs must be unique');
  for (const listing of listings) {
    assert.ok(categorySlugs.has(listing.category), `${listing.id} references an unknown category`);
    if (listing.url !== null) {
      const url = new URL(listing.url);
      assert.ok(['http:', 'https:'].includes(url.protocol), `${listing.id} must use an external HTTP(S) URL`);
    }
  }
});
