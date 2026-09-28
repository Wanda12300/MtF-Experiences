# 数据维护文档

本文档说明网站各类数据存放在哪里、如何修改，以及修改后如何验证。网站内容全部为中文，数据文件不需要编程知识即可维护。

## 数据存放总览

| 数据 | 位置 | 说明 |
| --- | --- | --- |
| 资源条目 | `src/content/listings/*.md` | 每个资源一个 Markdown 文件 |
| 资源分类 | `src/content/categories/categories.json` | 分类的 slug、显示名和排序 |
| 首页文案 | `src/content/pages/index.md` | 首页标题、简介、推荐区文案 |
| 资源目录页文案 | `src/content/pages/resources.md` | 目录页标题和简介 |
| 关于页 | `src/content/pages/about.md` | 关于页标题与正文 |
| 站点设置与共用文案 | `src/config.ts` | 站点标题、导航、主题色、搜索/筛选等共用界面文字 |

原则：**条目自己的内容写在条目文件里，整站共用的文字写在 `src/config.ts` 里**，不要互相复制。

## 一、资源条目（最常维护）

### 新增一个资源

在 `src/content/listings/` 下新建一个 `.md` 文件，文件名（不含扩展名）就是详情页的网址，例如 `mtf-wiki.md` 对应 `/resources/mtf-wiki/`。建议文件名只用小写英文字母、数字和连字符，且不与现有文件重名。

文件格式：

```markdown
---
name: "mtf.wiki"
category: "wiki-baike"
url: "https://mtf.wiki/"
featuredOrder: 1
---
这里写资源说明，会原样显示在详情页。
```

### frontmatter 字段说明

| 字段 | 必填 | 规则 |
| --- | --- | --- |
| `name` | 是 | 资源显示名，非空 |
| `category` | 是 | 必须是 `categories.json` 里已存在的 slug，否则构建报错 |
| `url` | 否 | 资源的外部链接，必须是 `http://` 或 `https://` 开头；不填时详情页显示"此资源未提供外部链接。" |
| `strikethrough` | 否 | `true` 时资源名显示删除线，用于标记已失效或有争议的条目；默认 `false` |
| `featuredOrder` | 否 | 填了就会进入首页"推荐资源"区块，按数字从小到大排列；必须是**正整数且全站唯一** |

**注意：** 不允许写上表以外的字段（schema 是严格模式，多写字段会构建失败）。

### 正文（说明文字）

frontmatter 下方的主体文字就是资源说明，会按原文显示在详情页（保留原有标点和措辞）。写在名称后面的简短描述即可，无需 Markdown 排版。

### 修改 / 删除资源

- 修改：直接编辑对应的 `.md` 文件。
- 删除：删除对应的 `.md` 文件即可，详情页和目录卡片会同时消失。删除前建议确认该条目没有设置 `featuredOrder`（删了不会报错，但首页推荐会少一项）。
- 标记失效而不是删除：把 `strikethrough: true` 加上，保留记录同时向读者传达状态。

### 调整首页推荐

首页"推荐资源"区块由各条目 frontmatter 里的 `featuredOrder` 控制：

- 新增推荐：给目标条目加 `featuredOrder: <数字>`。
- 取消推荐：删掉该条目的 `featuredOrder` 行。
- 调整顺序：修改数字，数字小的排前面。

每个数字只能用一次，重复会导致测试失败。

## 二、资源分类

分类定义在 `src/content/categories/categories.json`：

```json
[
  { "slug": "wiki-baike", "name": "wiki百科：", "order": 1 },
  { "slug": "hrt-shops", "name": "HRT药物购买：", "order": 2 }
]
```

| 字段 | 规则 |
| --- | --- |
| `slug` | 条目的 `category` 引用的就是这个值；全表唯一，建议只用小写字母和连字符，创建后不要改（改了所有引用它的条目都要跟着改） |
| `name` | 目录页筛选按钮上显示的名字；现有分类末尾都带中文冒号"："，新增时保持风格一致 |
| `order` | 分类在目录页的排列顺序，小的在前 |

- **新增分类**：在 JSON 里加一项，然后就可以在条目的 `category` 里使用新 slug。
- **删除分类**：先把该分类下所有条目改到别的分类（或删除），再删 JSON 里的项——只要还有条目引用该 slug，构建就会报 "Unknown resource category"。
- 至少保留一个分类。

## 三、页面文案

页面文案在 `src/content/pages/`，文件名与页面一一对应：

| 文件 | 页面 | 字段 |
| --- | --- | --- |
| `index.md` | 首页 | `title`（页面标题）、`pageTitle`（导航中显示的名称）、`description`（SEO 描述）、`intro`（正文简介）、`searchHint`（搜索框下方提示）、`featuredEyebrow` / `featuredTitle`（推荐资源区块标题）、`viewAll`（"浏览全部"链接文字） |
| `resources.md` | 资源目录页 | `title`、`description`、`intro` |
| `about.md` | 关于页 | `title`、`description`，frontmatter 下方的正文原样显示（支持 Markdown 列表、链接） |

同样不允许写上面没列出的字段。

## 四、站点设置与共用文案（`src/config.ts`）

改站点级的内容时编辑 `src/config.ts`：

- `siteConfig`：站点标题、副标题、描述、主题色（`hue` 0–360）、横幅、favicon。
- `textConfig`：共用界面文字——搜索框提示、筛选器标签、"没有找到匹配的资源"等空结果提示、详情页各区块标题（"资源详情"、"基本信息"、"访问外部网站"等）。这些是**所有条目共用**的，不要复制到条目文件里。
- `navBarConfig`：顶部导航链接。
- `profileConfig`：页脚的名称、简介和社交链接。
- `licenseConfig`：页脚许可证声明，默认关闭。

## 五、修改后的验证

改完任何数据后，依次运行：

```bash
pnpm test    # 数据与页面测试
pnpm check   # Astro 类型与内容校验
pnpm build   # 完整构建
```

测试会自动检查以下规则，违反会失败：

- 每个条目都有唯一的文件名（详情页 slug 唯一）；
- `featuredOrder` 全站唯一；
- 每个条目都生成了详情页和目录卡片；
- `strikethrough` 的显示与 frontmatter 一致；
- 条目的 `category` 都存在于 `categories.json`。

本地预览改动效果：

```bash
pnpm dev
```

然后在浏览器打开终端里显示的地址（通常是 `http://localhost:4321`）。

## 常见操作速查

| 我想…… | 怎么做 |
| --- | --- |
| 收录一个新网站 | 在 `src/content/listings/` 新建 `.md`，填 `name`/`category`/`url` 和说明 |
| 某资源打不开了 | 给条目加 `strikethrough: true`，确认后可删文件 |
| 把某资源放上首页推荐 | 给条目加 `featuredOrder: <未被占用的数字>` |
| 改首页简介 | 编辑 `src/content/pages/index.md` 的 `intro` |
| 改搜索框提示文字 | 编辑 `src/config.ts` 的 `textConfig.common.searchPlaceholder` |
| 新增一个分类 | 在 `categories.json` 加一项，再让条目引用新 slug |
| 改导航栏 | 编辑 `src/config.ts` 的 `navBarConfig.links` |
