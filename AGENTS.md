# AGENTS.md — AI Agent 工作指南

本指南面向在此仓库中工作的 AI 编码代理（如 Codex、Claude Code 等）。遵循以下约定以确保改动符合项目规范。

## 项目概况

「每天一个开源项目」是一个基于 Astro 5 的静态站点，每日精选一个开源项目并发布结构化分析报告。部署在 GitHub Pages。

## 开发命令

```bash
npm install          # 安装依赖
npm run dev          # 本地开发服务器 (localhost:4321/opensource-everyday)
npm run build        # 构建 + Pagefind 索引生成
npm run preview      # 预览构建产物
npm test             # 运行构建产物检查 (scripts/check.mjs)
```

**注意**: `npm test` 依赖 `npm run build` 先执行成功，测试脚本读取 `dist/` 下的产物做断言。

## 技术栈约定

- **框架**: Astro 5，使用 Content Collections 管理内容
- **样式**: 全局 CSS（`src/styles/global.css`），CSS 变量驱动主题，不使用 CSS 框架
- **搜索**: Pagefind，`postbuild` 阶段自动生成索引
- **TypeScript**: strict 模式，所有 `.ts` 文件需通过类型检查
- **Base path**: `/opensource-everyday`（见 `astro.config.mjs`），所有内部链接需带上此前缀

## 内容规范

### 报告 Markdown 文件

- **存放路径**: `src/content/reports/*.md`
- **Frontmatter schema**: 定义在 `src/content.config.ts`，使用 Zod 校验
- **必需字段**: `title`, `description`, `date`, `tags`, `githubUrl`, `language`, `license`, `stars`, `ratings`（含 5 个子维度）
- **正文章节结构**: 项目概览 / 核心功能 / 技术架构 / 快速上手 / 生态与社区 / 适用场景 / 优缺点总结
- **评分范围**: 1-10，整数

### 编码约定

- 组件使用 `.astro` 单文件组件，逻辑写在 `---` 代码块内
- 不引入额外的 CSS 框架或 UI 库
- 页面通过 `getCollection('reports')` 获取内容数据
- 全局样式变量定义在 `:root` 中，组件内直接引用 CSS 变量

## 测试

测试脚本 `scripts/check.mjs` 对 `dist/` 下的构建产物做 HTML 断言检查，覆盖：

- 首页存在性及关键内容
- 报告详情页各章节完整性
- 搜索页 Pagefind 集成
- 分类页、排行榜页、关于页
- GitHub Actions deploy workflow 存在性

**修改页面或内容后，务必先 `npm run build` 再 `npm test` 验证。**

## CI/CD

- **触发**: push 到 `master` 分支
- **流程**: `npm install` -> `npm run build` -> 上传 artifact -> 部署到 GitHub Pages
- **Node 版本**: 22

## 常见陷阱

1. **Base path**: 开发环境 URL 为 `/opensource-everyday`，不是根路径 `/`
2. **Content Collection 修改**: 更改 `content.config.ts` schema 后需重启 `astro dev`
3. **Pagefind 索引**: 只在 `npm run build`（含 postbuild）时生成，`astro dev` 下搜索不可用
4. **测试依赖构建**: `npm test` 不自动触发 build，需手动先运行 `npm run build`
