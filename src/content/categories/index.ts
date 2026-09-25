export const resourceCategories = [
  { slug: 'wiki-baike', name: 'wiki百科：', sourceHeading: ' wiki百科：', order: 1 },
  { slug: 'hrt-shops', name: 'HRT药物购买：', sourceHeading: ' HRT药物购买：', order: 2 },
  { slug: 'hrt-guides', name: 'HRT相关资料：', sourceHeading: ' HRT相关资料：', order: 3 },
  { slug: 'other', name: '其他：', sourceHeading: '其他：', order: 4 },
] as const;

export type ResourceCategorySlug = (typeof resourceCategories)[number]['slug'];
