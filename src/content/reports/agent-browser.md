---
title: "Agent Browser"
description: "面向 AI Agent 的浏览器自动化 CLI，原生 Rust 实现，支持无头 Chrome、CDP 连接与多种云浏览器后端"
date: "2026-07-16"
tags: ["浏览器自动化", "AI", "CLI", "Rust"]
githubUrl: "https://github.com/vercel-labs/agent-browser"
language: "Rust"
license: "Apache-2.0"
stars: 38571
ratings:
  activity: 9
  documentation: 9
  easeOfUse: 8
  community: 9
  overall: 9
---

## 项目概览

Agent Browser 是 Vercel Labs 出品的浏览器自动化 CLI 工具，专为 AI 编码代理（如 Claude Code、Codex、Cursor 等）设计。它用原生 Rust 编写 CLI 与守护进程，通过 Chrome DevTools Protocol（CDP）直接驱动 Chrome/Chromium，无需 Node.js 运行时即可常驻后台。核心理念是：让 AI Agent 用一条条 shell 命令完成"打开页面 - 获取可交互元素快照 - 点击/填表 - 截图"的完整浏览器操作链路。

- GitHub: https://github.com/vercel-labs/agent-browser
- 语言: Rust（CLI 与守护进程）
- License: Apache-2.0
- Stars: 38.6k（38,571）
- 当前版本: 0.32.0
- 创建时间: 2026-01-11
- Forks: 2,510
- Open Issues: 584
- Watchers: 97
- 贡献者: 109
- 官网: https://agent-browser.dev

## 核心功能

- **无头 Chrome 自动化**：通过 `agent-browser install` 从 Chrome for Testing 下载浏览器，首次配置后即可全自动驱动，自动检测已有的 Chrome/Brave/Playwright/Puppeteer 安装
- **Accessibility Tree 快照**：`snapshot` 命令输出页面的可访问性树并为每个可交互元素分配稳定引用（`@e1`、`@e2`），AI Agent 无需解析 DOM 即可定位元素
- **语义化定位器**：支持按 ARIA role、label、placeholder、alt、testid 查找元素，也兼容传统 CSS 选择器
- **AI 友好文本读取**：`read` 命令无需启动 Chrome 即可抓取 URL 的 agent 可读文本，自动尝试 `.md` 后缀、祖先路径的 `llms.txt`，支持 `--filter`、`--outline`、`--llms` 等过滤模式
- **网络拦截与 Mock**：`network route` 可拦截/阻断/Mock 请求，支持 HAR 录制与请求详情查看
- **状态持久化**：`state save/load` 保存认证状态（cookie、localStorage），`cookies set --curl` 可从 cURL 导入 cookie
- **视觉 Diff**：`diff snapshot` 做可访问性树差异对比，`diff screenshot` 做像素级视觉回归，`diff url` 一键对比两个 URL
- **React 内省与 Web Vitals**：`--enable react-devtools` 启动后可查看组件树、props/state、Suspense 边界，`vitals` 命令输出 LCP/CLS/INP 等核心指标
- **WebSocket 实时流**：每个会话自动启动 viewport 流服务器，支持"人机共驾"场景，人类可实时观看并参与 Agent 的浏览器操作
- **iOS 模拟器支持**：通过 Appium + XCUITest 驱动 Mobile Safari，支持模拟器与 USB 真机
- **云浏览器后端**：内置 Browserless、Browserbase、Browser Use、Kernel、AWS Bedrock AgentCore 等云端 provider，serverless 场景无缝切换
- **AI 自然语言控制**：`chat` 命令支持单次指令或交互式 REPL，用自然语言描述操作意图即可驱动浏览器

## 技术架构

Agent Browser 采用客户端-守护进程架构：

- **Rust CLI**：解析命令参数，通过本地 IPC 与守护进程通信，进程启动开销极低
- **Rust Daemon**：纯 Rust 守护进程，直接使用 CDP（Chrome DevTools Protocol）驱动浏览器，不依赖 Node.js；首次命令时自动启动，后续命令复用同一守护进程实现毫秒级响应
- **浏览器引擎**：默认使用 Chrome for Testing，也支持 Lightpanda 引擎；通过 `--executable-path` 可切换到自定义 Chromium 构建（如 serverless 场景下的 `@sparticuz/chromium`）
- **CDP 连接模式**：`connect` 命令可连接已有远程调试端口的浏览器，或通过 WebSocket URL 连接远程浏览器服务，支持 Electron、WebView2 等任何暴露 CDP 端点的应用
- **跨平台原生二进制**：覆盖 macOS ARM64/x64、Linux ARM64/x64、Windows x64，全部为原生 Rust 编译，无运行时依赖
- **Sandbox 集成**：在 Vercel Sandbox microVM 中运行 agent-browser + Chrome，无需外部服务器；提供 `@agent-browser/sandbox` 辅助包和 `@agent-browser/eve` 扩展

## 快速上手

全局安装并初始化：

```bash
npm install -g agent-browser
agent-browser install   # 下载 Chrome for Testing（仅首次）
```

基础操作流程：

```bash
agent-browser open example.com            # 启动浏览器并导航
agent-browser snapshot                    # 获取可交互元素快照（含 @e1 引用）
agent-browser click @e2                   # 按引用点击
agent-browser fill @e3 "test@example.com" # 按引用填充输入框
agent-browser get text @e1                # 获取元素文本
agent-browser screenshot page.png         # 截图
agent-browser close                       # 关闭浏览器
```

语义化定位与等待：

```bash
agent-browser find role button click --name "Submit"   # 按 ARIA role 点击
agent-browser wait --text "Welcome"                     # 等待文本出现
agent-browser wait --load networkidle                   # 等待网络空闲
```

读取 agent 友好文本（无需启动 Chrome）：

```bash
agent-browser read https://docs.example.com --filter auth   # 过滤读取
agent-browser read https://docs.example.com --llms index     # 读取 llms.txt 链接
```

上手难度：中低。核心命令直观，`--help` 输出全面，AI Agent 可自主发现可用命令。守护进程复用机制让连续操作非常快。

## 生态与社区

- **维护方**：Vercel Labs，与 Vercel Sandbox、eve agent 平台深度集成
- **活跃度**：版本迭代快（当前 v0.32.0，2026-07-15 发布；v0.31.2 仅两天前发布），2026 年 1 月创建至今 6 个月已积累 38.6k stars 和 109 位贡献者，几乎每天都有代码推送
- **语言分布**：Rust 86.5%、TypeScript 11.4%、JavaScript 1.8%、Shell 0.8%、HTML 0.3%、CSS 0.2%
- **AI 工具集成**：通过 `npx skills add vercel-labs/agent-browser` 一键接入 Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、Goose、OpenCode、Windsurf 等主流 AI 编码工具
- **云浏览器生态**：支持 Browserless、Browserbase、Browser Use、Kernel、AWS Bedrock AgentCore 五大云浏览器平台
- **Vercel Sandbox**：原生支持在 Vercel Sandbox microVM 中运行，无需外部浏览器服务器
- **eve 扩展**：`@agent-browser/eve` 将约 20 个命名空间工具注入 eve agent，在 agent 沙箱内运行

## 适用场景

**适合：**

- AI Agent 驱动的端到端 Web 测试与表单自动化
- Web 应用的视觉回归测试（diff screenshot）与可访问性树回归（diff snapshot）
- 抓取需要 JS 渲染的 SPA 页面内容，或读取 `llms.txt` / Markdown 文档
- 在 serverless（Vercel Sandbox、AWS Lambda）环境中运行无头浏览器自动化
- 控制 Electron 应用、WebView2 应用或任何暴露 CDP 端点的桌面应用
- iOS Web 测试（通过模拟器或真机上的 Mobile Safari）

**不适合：**

- 需要嵌入应用进程内的浏览器控制（用 Playwright/Puppeteer 库 API 更合适）
- 非 Chrome 内核的浏览器测试（Firefox、旧版 Edge；Safari 仅限 iOS WebDriver）
- 对浏览器进程生命周期有精细控制需求的高并发压测场景

## 优缺点总结

**优势：**

- 原生 Rust 实现，守护进程复用，命令响应快，无 Node.js 运行时依赖
- Accessibility Tree 快照 + 稳定元素引用（`@e1`），AI Agent 定位元素无需解析 DOM
- 命令面覆盖极广：从点击填表到网络 Mock、HAR 录制、React 内省、Web Vitals、视觉 Diff
- 云浏览器后端丰富，serverless 部署路径成熟（Vercel Sandbox 一等公民）
- 文档极其详尽，`--help` 自解释，AI 工具集成开箱即用

**局限：**

- 仍在 0.x 阶段，API 与命令格式可能随版本变化
- 强依赖 Chrome/Chromium 内核，Firefox 与桌面 Safari 不支持
- iOS 支持依赖 Appium + Xcode，配置门槛较高
- 项目仅 6 个月，虽增长极快但生态成熟度和第三方教程资源仍不如 Playwright/Puppeteer 丰富
