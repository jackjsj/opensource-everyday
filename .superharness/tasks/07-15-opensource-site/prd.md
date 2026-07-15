# 每天一个开源项目 — 调研报告集合站

## 概述

一个纯静态内容站点，收集和展示开源项目的调研报告。用户给出开源项目名称，AI 完成调研后生成 Markdown 报告，添加到站点。站点支持浏览、搜索、分类归档和评分排行，并可分享报告链接。

## 目标用户

对开源项目感兴趣的开发者，希望通过系统化的调研报告快速了解和评估开源项目。

## 技术选型

- **框架**: Astro（静态站点生成器）
- **设计系统**: Supabase DESIGN.md 规范（白底 + 祖母绿 `#3ecf8e` 点缀 + Circular 字体）
- **搜索**: Pagefind（静态站全文搜索，构建时生成索引，客户端搜索）
- **部署**: GitHub Pages（git push 自动构建部署）
- **内容管理**: Astro Content Collections，报告以 Markdown 文件存储于 `src/content/reports/`

## 报告内容结构

每份调研报告包含 8 个板块，按固定顺序：

1. **项目概览** — 一句话简介 + 基本信息（GitHub 地址、语言、License、Stars 数）
2. **核心功能** — 能做什么、解决什么问题
3. **技术架构** — 技术栈、架构特点、依赖关系
4. **快速上手** — 安装方式、最小示例、上手难度
5. **生态与社区** — 贡献者数、活跃度、主要使用者、相关项目
6. **适用场景** — 该用 / 不该用
7. **优缺点总结** — 优势与局限
8. **评分** — 多维度量化评分

### Frontmatter 规范

```yaml
---
title: "项目名称"
description: "一句话简介"
date: "2026-07-15"
tags: ["database", "go"]
githubUrl: "https://github.com/example/project"
language: "Go"
license: "MIT"
stars: 50000
ratings:
  activity: 9
  documentation: 8
  easeOfUse: 7
  community: 8
  overall: 8
---
```

## 站点页面（6 个）

### 1. 首页 (`/`)

- 全量报告列表，按日期倒序
- 每条卡片显示：项目名、简介、日期、标签、综合评分
- 顶部标签筛选栏，点击标签过滤列表

### 2. 报告详情页 (`/reports/[slug]`)

- 完整渲染报告 Markdown 内容
- 左侧固定目录导航（自动从标题生成，滚动跟随高亮）
- 顶部项目基本信息条（语言、License、Stars、GitHub 链接）
- 评分板块以可视化条形图展示

### 3. 搜索页 (`/search`)

- Pagefind 全文搜索
- 输入即出结果，无需按钮
- 结果高亮匹配关键词
- 显示项目名、简介摘要、匹配上下文

### 4. 分类归档页 (`/categories`)

- 按标签分组归类
- 每个分类下显示该标签的所有报告卡片
- 点击分类展开/折叠报告列表

### 5. 评分排行页 (`/leaderboard`)

- 按评分维度排序的排行榜
- 支持切换维度（活跃度 / 文档质量 / 上手难度 / 社区活跃度 / 综合）
- 每行显示排名、项目名、评分、日期

### 6. 关于页 (`/about`)

- 站点目的说明
- 使用方式（如何查阅报告、如何分享）
- 报告生成流程说明

## 设计规范（Supabase DESIGN.md）

### 颜色

| Token | 值 | 用途 |
|-------|-----|------|
| primary | `#3ecf8e` | 主点缀色（CTA、链接高亮、评分条） |
| primary-deep | `#24b47e` | hover 态 |
| ink | `#171717` | 正文文字 |
| ink-mute | `#707070` | 次要文字 |
| canvas | `#ffffff` | 页面背景 |
| canvas-soft | `#fafafa` | 卡片背景 |
| hairline | `#dfdfdf` | 分隔线、卡片边框 |

### 字体

- 显示字体: Circular, fallback 'Helvetica Neue', Helvetica, Arial, sans-serif
- 正文字号: 16px, line-height 1.55
- 标题: 28px-48px, weight 500, 紧字距

### 间距与圆角

- 卡片圆角: 8px
- 按钮圆角: 6px
- 页面最大宽度: 1200px
- 内容区最大宽度: 768px（详情页正文）

## 核心工作流

1. 用户给出开源项目名称
2. AI 完成调研，生成 Markdown 报告文件
3. 报告放入 `src/content/reports/` 目录
4. git push 触发 GitHub Actions 构建
5. 站点自动更新，可查阅可分享

## 项目结构

```
opensource-everyday/
├── DESIGN.md                      # Supabase 设计规范
├── src/
│   ├── content/
│   │   └── reports/              # 调研报告 Markdown 文件
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ReportLayout.astro
│   ├── components/
│   │   ├── ReportCard.astro
│   │   ├── TagFilter.astro
│   │   ├── RatingBar.astro
│   │   ├── TableOfContents.astro
│   │   └── Header.astro
│   ├── pages/
│   │   ├── index.astro           # 首页
│   │   ├── reports/[...slug].astro
│   │   ├── search.astro
│   │   ├── categories.astro
│   │   ├── leaderboard.astro
│   │   └── about.astro
│   └── styles/
│       └── global.css
├── .github/workflows/
│   └── deploy.yml
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 验收标准

- [ ] 首页展示报告列表，按日期倒序，支持标签筛选
- [ ] 报告详情页完整渲染 8 个板块，左侧目录导航滚动跟随
- [ ] 搜索页可通过关键词搜索报告内容，结果高亮
- [ ] 分类归档页按标签分组展示所有报告
- [ ] 评分排行页按多维度排序，可切换维度
- [ ] 关于页展示站点说明
- [ ] 全站视觉遵循 Supabase DESIGN.md 规范（白底 + 祖母绿点缀 + Circular 字体）
- [ ] GitHub Actions workflow 配置正确，push 后自动部署
- [ ] 包含一份示例报告作为内容验证
