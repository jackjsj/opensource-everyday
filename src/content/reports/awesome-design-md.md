---
title: "Awesome DESIGN.md"
description: "知名网站设计系统规范的策展集合，让 AI 编码工具一键生成视觉一致的高质量 UI"
date: "2026-07-16"
tags: ["设计系统", "AI编码", "文档"]
githubUrl: "https://github.com/VoltAgent/awesome-design-md"
language: "Markdown"
license: "MIT"
stars: 102173
ratings:
  activity: 9
  documentation: 8
  easeOfUse: 10
  community: 9
  overall: 9
---

## 项目概览

Awesome DESIGN.md 是一个开源的 DESIGN.md 文件策展集合，由 VoltAgent 团队维护。它从全球知名品牌的网站中提取设计系统规范，整理成结构化的 Markdown 文件。每个 DESIGN.md 文件包含完整的颜色 token、字体规范、圆角间距、组件样式等设计决策，让 AI 编码工具（如 Claude、Cursor、Windsurf）能按特定品牌的设计语言生成视觉一致的 UI。

- GitHub: https://github.com/VoltAgent/awesome-design-md
- 语言: Markdown（策展内容，非代码项目）
- License: MIT
- Stars: 102k+

## 核心功能

- **73+ 品牌设计规范**：覆盖 AI/LLM、开发工具、数据库、SaaS、设计工具、金融、电商、媒体、汽车等多个领域，包括 Apple、Tesla、Linear、Vercel、Stripe、Supabase、Notion、Figma 等知名品牌
- **结构化设计 Token**：每个 DESIGN.md 包含 colors、typography、rounded、spacing 等完整设计变量，格式遵循 Google Stitch DESIGN.md 规范
- **即插即用**：将 DESIGN.md 放入项目根目录，告诉 AI "按这个设计风格构建页面"，即可生成符合该品牌视觉语言的 UI
- **Retro Web 系列**：包含 90 年代和 2000 年代初的复古网站设计规范（如 Dell 1996、Nintendo 2001），可用于生成怀旧风格 UI
- **在线浏览**：每个设计规范在 getdesign.md 网站上有在线版本，可直接预览和分享

## 技术架构

项目本身是一个纯内容仓库，不包含可执行代码：

- **存储格式**：每个品牌一个目录（如 `design-md/linear.app/DESIGN.md`），使用 YAML frontmatter + Markdown 结构
- **DESIGN.md 规范**：遵循 Google Stitch 的 DESIGN.md 规范格式，包含 7 个标准化章节（视觉主题与氛围、颜色、字体、圆角、间距、组件、页面模式）
- **YAML Token 结构**：颜色以嵌套 YAML 对象形式存储（如 `colors.primary: "#3ecf8e"`），字体按显示级别分层（display-xl / heading / body / mono 等）
- **无构建依赖**：纯 Markdown 内容，无需安装任何依赖即可使用

## 快速上手

使用方式非常简单：

1. 从 [GitHub 仓库](https://github.com/VoltAgent/awesome-design-md) 浏览 `design-md/` 目录
2. 选择一个你喜欢的品牌设计风格（如 Linear、Supabase、Vercel）
3. 将对应的 `DESIGN.md` 复制到你的项目根目录
4. 告诉 AI 编码工具："按 DESIGN.md 的设计风格构建页面"

```bash
# 克隆仓库
git clone https://github.com/VoltAgent/awesome-design-md.git

# 复制你想要的设计规范到项目
cp design-md/supabase/DESIGN.md /your-project/DESIGN.md

# 在 AI 编码工具中指示：
# "请阅读 DESIGN.md 并按其设计风格构建页面"
```

上手难度：极低。不需要安装任何东西，不需要配置任何工具，只需要一个 Markdown 文件。

## 生态与社区

- **贡献者**：4 位核心贡献者，由 VoltAgent 团队主导
- **活跃度**：GitHub 上持续高频更新，定期添加新的品牌设计规范
- **Star 增长**：102k+ Stars，GitHub 全球排名约 150 名，是设计系统领域最受关注的开源项目之一
- **关联生态**：
  - Google Stitch：DESIGN.md 概念的提出者，提供规范定义和工具支持
  - VoltAgent：项目维护方，同时提供 AI Agent 框架和 LaunchKit 等产品
  - getdesign.md：配套网站，提供在线浏览和请求新设计规范的服务

## 适用场景

**适合：**

- 使用 AI 编码工具（Claude、Cursor、Windsurf 等）构建前端页面时，需要统一视觉风格
- 快速原型设计：选一个品牌风格，让 AI 直接生成高质量 UI
- 设计学习：研究知名品牌的设计决策（颜色、字体、间距）如何系统化定义
- 团队设计规范：作为 DESIGN.md 格式的参考模板，建立自己的设计系统

**不适合：**

- 需要可执行代码或组件库的项目（这只是设计规范文档，不是代码库）
- 需要 Figma 导出或 JSON Schema 格式的场景（DESIGN.md 是纯 Markdown）
- 需要动态主题切换的运行时方案（DESIGN.md 是构建时规范，不是运行时主题引擎）

## 优缺点总结

**优势：**

- 格式简单：纯 Markdown，AI 天然理解，无需解析器
- 覆盖广泛：73+ 品牌涵盖几乎所有主流设计风格
- 质量高：每个文件从真实网站提取，包含深度分析而非表面描述
- 即插即用：一个文件解决 AI 生成 UI 的视觉一致性问题
- 社区活跃：102k Stars，持续更新

**局限：**

- 依赖 AI 工具：DESIGN.md 本身不生成 UI，需要配合 AI 编码工具使用
- 静态规范：不包含响应式断点、动画时间曲线等动态设计决策
- 品牌覆盖有限：74 个品牌无法覆盖所有需求，部分垂直领域可能缺失
- 无版本化 API：DESIGN.md 格式标注为 alpha 版本，未来可能变化
