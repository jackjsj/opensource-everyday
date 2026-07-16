# 每天一个开源项目 (OpenSource Everyday)

一个精选开源项目的站点，每天介绍一个开源项目，提供结构化分析报告——涵盖项目概览、核心功能、技术架构、快速上手、生态与社区、适用场景、优缺点总结及多维度评分。

## 技术栈

- **框架**: [Astro 5](https://astro.build/) — 静态站点生成
- **搜索**: [Pagefind](https://pagefind.app/) — 静态站内搜索
- **语言**: TypeScript (strict 模式)
- **部署**: GitHub Pages（通过 GitHub Actions 自动部署）
- **内容**: Markdown Content Collection

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本（含 Pagefind 索引）
npm run build

# 预览构建结果
npm run preview

# 运行测试（检查构建产物）
npm test
```

## 项目结构

```
src/
├── components/
│   ├── Header.astro          # 页头导航
│   ├── ReportCard.astro      # 报告卡片
│   ├── TagFilter.astro       # 标签筛选器
│   ├── RatingBar.astro       # 评分条
│   └── TableOfContents.astro # 目录
├── content/
│   └── reports/              # 开源项目报告（Markdown）
│       └── redis.md
├── layouts/
│   ├── BaseLayout.astro      # 基础布局
│   └── ReportLayout.astro    # 报告详情布局
├── pages/
│   ├── index.astro           # 首页
│   ├── about.astro           # 关于页
│   ├── categories.astro      # 分类页
│   ├── leaderboard.astro     # 排行榜
│   ├── search.astro          # 搜索页
│   └── reports/[slug].astro  # 报告详情页
├── styles/
│   └── global.css            # 全局样式
└── content.config.ts        # Content Collection schema
```

## 添加新报告

在 `src/content/reports/` 下新建 `.md` 文件，遵循以下 frontmatter schema：

```yaml
---
title: "项目名称"
description: "一句话描述"
date: "YYYY-MM-DD"
tags: ["标签1", "标签2"]
githubUrl: "https://github.com/owner/repo"
language: "主要编程语言"
license: "开源协议"
stars: 67000
ratings:
  activity: 10        # 活跃度 (1-10)
  documentation: 9    # 文档质量 (1-10)
  easeOfUse: 8        # 易用性 (1-10)
  community: 10       # 社区健康度 (1-10)
  overall: 9          # 综合评分 (1-10)
---

## 项目概览
## 核心功能
## 技术架构
## 快速上手
## 生态与社区
## 适用场景
## 优缺点总结
```

## 部署

推送到 `master` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。

站点地址: https://jackjsj.github.io/opensource-everyday/

## License

MIT
