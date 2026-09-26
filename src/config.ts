// Edit this file to customize the directory. Resource descriptions remain in src/content/listings/.
export type NavigationLink = { name: string; url: string; external?: boolean };
export type ProfileLink = { name: string; url: string; icon?: string };

export const siteConfig = {
  title: 'MtF Experiences',
  subtitle: '跨性别资源目录',
  lang: 'zh-CN',
  description: '收录跨性别相关资源与原有说明，供读者进一步了解。',
  themeColor: {
    hue: 348, // 0–360; visitors can change it unless fixed is true.
    fixed: true,
  },
  banner: {
    enable: false,
    src: '', // A path under public/, such as /images/banner.jpg.
    position: 'center' as 'top' | 'center' | 'bottom',
    credit: { enable: false, text: '', url: '' },
  },
  favicon: [] as { src: string; sizes?: string; theme?: 'light' | 'dark' }[],
  featuredIds: ['mtf-wiki', 'thai-pharmacy', 'trans-survival-guide'],
};

// Interface copy is kept here so this directory can later become a reusable template.
export const textConfig = {
  common: {
    home: '首页',
    resources: '资源目录',
    navigation: '主导航',
    skipToContent: '跳至主要内容',
    toggleTheme: '切换明暗主题',
    themeColor: '主题色',
    searchLabel: '搜索资源名称或说明',
    searchPlaceholder: '搜索资源名称或说明…',
    searchButton: '搜索',
  },
  home: {
    intro: '整理上游收录的跨性别相关资源与原有说明，帮助你进一步了解并自行判断。',
    searchHint: '输入名称或说明中的关键词，前往资源目录查看匹配结果。',
    featuredEyebrow: '精选收录',
    featuredTitle: '从这里开始了解',
    viewAll: '浏览全部资源',
  },
  directory: {
    intro: '浏览上游页面收录的跨性别相关资源，或按名称和原有说明搜索。',
    filterLabel: '资源目录筛选',
    categoriesLabel: '按分类筛选资源',
    allCategories: '全部',
    clearSearch: '清除搜索词',
    empty: '没有找到匹配的资源。请调整搜索词或分类，或清除搜索词后重试。',
    count: '显示 {count} 项资源。',
    searchCount: '搜索“{query}”：找到 {count} 项资源。',
  },
  card: {
    open: '查看详情',
    label: (name: string, struck: boolean) => `查看${name}详情${struck ? '（上游原有删除线标记）' : ''}`,
  },
  detail: {
    eyebrow: '资源详情',
    description: '原始说明',
    infoEyebrow: '收录信息',
    infoTitle: '基本信息',
    category: '所属分类',
    source: '来源',
    sourceValue: '上游页面原始收录',
    external: '访问外部网站',
    externalLabel: (host: string, name: string) => `在外部网站 ${host} 打开 ${name}`,
    noExternal: '此条目在上游原始收录中未提供外部链接。',
    back: '返回资源目录',
  },
  footer: {
    about: '关于',
  },
};

export const navBarConfig: { links: NavigationLink[] } = {
  links: [
    { name: '首页', url: '/' },
    { name: '资源目录', url: '/resources/' },
    { name: '关于', url: '/about/' },
  ],
};

export const profileConfig: { name: string; bio: string; avatar?: string; links: ProfileLink[] } = {
  name: 'MtF Experiences',
  bio: '跨性别相关资源汇总。',
  links: [
    { name: 'Twitter', url: 'https://twitter.com/Wanda12300' },
    { name: 'GitHub', url: 'https://github.com/Wanda12300/MtF-Experiences' },
  ],
};

export const licenseConfig = {
  enable: false, // Do not assert a license unless the project owner selects one.
  name: '',
  url: '',
};
