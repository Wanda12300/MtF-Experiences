// Edit this file to customize the directory. Resource descriptions remain in src/content/listings/.
export type NavigationLink = { name: string; url: string; external?: boolean };
export type ProfileLink = { name: string; url: string; icon?: string };

export const siteConfig = {
  title: 'MtF Experiences',
  subtitle: '跨性别资源目录',
  lang: 'zh-CN',
  description: '收录跨性别相关资源与原有说明，供读者进一步了解。',
  themeColor: {
    hue: 270, // 0–360; visitors can change it unless fixed is true.
    fixed: false,
  },
  banner: {
    enable: false,
    src: '', // A path under public/, such as /images/banner.jpg.
    position: 'center' as 'top' | 'center' | 'bottom',
    credit: { enable: false, text: '', url: '' },
  },
  favicon: [] as { src: string; sizes?: string; theme?: 'light' | 'dark' }[],
  showHistoricalNotice: false,
  featuredIds: ['mtf-wiki', 'thai-pharmacy', 'trans-survival-guide'],
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
    { name: 'GitHub', url: 'https://github.com/Wanda12300/MtF-Experiences' },
  ],
};

export const aboutConfig = {
  heading: '关于 MtF Experiences',
  paragraphs: [
    '本项目汇集跨性别相关资源，包括 Wiki 百科和 HRT 资料；本站将原有条目整理为可检索的目录。',
    '资源名称、分类和说明沿用上游原始收录，未经独立复核。外部网站及其内容可能发生变化，请自行判断；这里的收录不构成医疗建议。',
  ],
};

export const licenseConfig = {
  enable: false, // Do not assert a license unless the project owner selects one.
  name: '',
  url: '',
};
