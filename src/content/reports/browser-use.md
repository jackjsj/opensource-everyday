---
title: "Browser Use"
description: "Python AI 浏览器自动化 Agent，让 LLM 像人一样操作网页，支持自定义工具与云端扩展"
date: "2026-07-20"
tags: ["浏览器自动化", "AI", "Python", "LLM"]
githubUrl: "https://github.com/browser-use/browser-use"
language: "Python"
license: "MIT"
stars: 105597
ratings:
  activity: 10
  documentation: 9
  easeOfUse: 8
  community: 10
  overall: 9
---

## 项目概览

Browser Use 是一个开源的 Python 库，让 AI Agent（LLM）像人一样使用浏览器——打开页面、点击按钮、填表单、提取数据。你只需用自然语言描述任务，Agent 自主决策每一步操作。由 Magnus Müller 和 Gregor Žunič 创建，2024 年 10 月开源，迅速成为浏览器自动化领域 Star 数最多的项目。底层基于 Playwright 驱动浏览器，上层封装了完整的 Agent 决策循环（观察页面 → LLM 推理 → 执行动作 → 反馈结果）。

- GitHub: https://github.com/browser-use/browser-use
- 语言: Python（99.3%），少量 Shell / Dockerfile
- License: MIT
- Stars: 105.6k（105,597）
- Forks: 11,626
- 贡献者: 315
- 创建时间: 2024-10-31
- 当前版本: 0.13.6（2026-07-17 发布）
- 官网: https://browser-use.com
- 排名: Odysseys 网页任务排行榜 #1（87.4% 平均成功率），领先 OpenAI、Anthropic、Google、Microsoft 的 computer-use agents

## 核心功能

- **自然语言任务驱动**：用一句话描述任务（如"帮我投递这个职位并附上简历"），Agent 自主规划并执行完整的浏览器操作链路，无需编写选择器或脚本
- **多 LLM 后端**：通过 ChatBrowserUse 统一接口接入 OpenAI / Anthropic / Google / 自有 bu-* 模型，一个 API Key 即可访问所有 provider；也支持 Ollama 本地模型
- **自有优化模型**：提供 bu-2-0、bu-30b-a3b-preview 等专为浏览器自动化优化的模型，任务完成速度比通用模型快 3-5 倍
- **Python 库 API**：Agent(task=..., llm=...) 一行代码启动 Agent，支持 async/await 异步编程，可嵌入自有应用做规模化自动化
- **CLI 模式**：browser-use 命令行工具，配合 AI 编码助手（Claude Code、Codex、Cursor 等）使用，一键安装 skill 即可让 Agent 操控浏览器
- **自定义工具扩展**：通过 @tools.action 装饰器注册自定义 Python 函数，Agent 可在浏览器操作之外调用外部 API、数据库等
- **结构化输出**：支持将 Agent 执行结果转为结构化数据（如 CSV、JSON），适合数据提取场景
- **真实浏览器配置**：可复用已有 Chrome profile（保存的登录态），或通过 profile.sh 脚本同步认证 profile 到远程浏览器
- **云端 Agent**：Browser Use Cloud 提供托管 Agent，内置代理轮换、反检测指纹、CAPTCHA 处理、1000+ 集成（Gmail、Slack、Notion 等）
- **Benchmark 体系**：开源 BU Bench V1（100 个真实网页任务）和 Odysseys 排行榜（200 个长周期任务），模型能力可量化对比

## 技术架构

Browser Use 的核心是"LLM Agent 循环"：

- **Agent 决策循环**：Agent.run() 启动循环，每轮提取页面状态（DOM / 可访问性树 / 截图）→ 发送给 LLM → LLM 返回动作（click/fill/scroll 等）→ 执行动作 → 截图反馈 → 下一轮，直到任务完成或达到最大步数
- **Playwright 底层**：浏览器操作通过 Playwright 的 Python binding 完成，支持 Chromium/Firefox/WebKit，复用 Playwright 的等待、选择器、截图能力
- **页面状态提取**：将 DOM 简化为 LLM 可理解的文本表示（元素列表 + 语义标注），配合可访问性树减少 token 消耗
- **动作空间**：标准动作包括 click、fill、select、scroll、goto、go_back、search 等；自定义工具通过 Tools 注册扩展动作空间
- **Cloud 架构**：云端 Agent 在 Browser Use 基础设施上运行，提供反检测浏览器、代理轮换、并行调度、内存管理，开发者通过 API 调用
- **Python 生态**：纯 Python 实现，依赖 Playwright + LLM SDK（langchain/openai/anthropic），无编译依赖

## 快速上手

安装并配置 LLM Key：

```bash
uv add browser-use          # 或 pip install browser-use
```

在 .env 中配置 API Key（任选其一）：

```bash
BROWSER_USE_API_KEY=your-key       # 统一接口，一个 key 访问所有 provider
# GOOGLE_API_KEY=your-key          # 或直接用 provider key
# ANTHROPIC_API_KEY=your-key
```

运行第一个 Agent：

```python
import asyncio
from browser_use import Agent, ChatBrowserUse

async def main():
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=ChatBrowserUse(model='openai/gpt-5.5'),
        # llm=ChatBrowserUse(model='bu-2-0'),           # 自有优化模型
        # llm=ChatOpenAI(model='gpt-5.5'),
        # llm=ChatAnthropic(model='claude-opus-4-8'),
    )
    history = await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

CLI 模式（配合 AI 编码助手）：

```bash
browser-use skill install    # 注册 skill 到 Claude Code / Codex / Cursor
```

然后直接告诉你的 AI 助手："帮我在 YouTube 上传这个视频" 或 "比较这三款笔记本并给我一张价格表"。

上手难度：中。Python 库需要理解 async/await 和 LLM API 调用；CLI 模式门槛更低，一句话即可启动。

## 生态与社区

- **维护方**：Magnus Müller、Gregor Žunič，团队位于苏黎世和旧金山，商业化实体为 Browser Use Cloud
- **活跃度**：GitHub 上 105.6k Stars、315 贡献者，几乎每周都有新版本（v0.13.6 和 v0.13.5 同一天发布），issue 响应快
- **Benchmark 生态**：开源 benchmark 仓库 + Odysseys 排行榜，推动整个 web agent 领域的标准化评测
- **Cloud 服务**：Browser Use Cloud 提供托管 Agent + 云浏览器 + 反检测 + 1000+ 集成
- **LLM 合作**：与 OpenAI、Anthropic、Google 深度兼容，同时训练自有浏览器优化模型 bu-30b
- **社区**：Discord 活跃，Twitter @browser_use 持续发布 demo

## 适用场景

**适合：**

- 用自然语言驱动浏览器完成端到端任务（投简历、比价、填表、数据提取）
- 需要嵌入 Python 应用的可编程浏览器自动化（定时爬取、监控、QA 测试）
- 需要自定义工具扩展 Agent 能力（调 API、查数据库、发通知）
- 研究和 benchmark web agent 能力（BU Bench、Odysseys）
- 大规模生产场景（通过 Cloud API 调度并行 Agent + 反检测 + 代理轮换）

**不适合：**

- 需要确定性、可重复的精确浏览器操作（用 Playwright/Puppeteer 写脚本更可靠）
- 对延迟敏感的实时交互场景（LLM 推理每步需数百毫秒到数秒）
- 不想接入 LLM 的纯脚本自动化（browser-use 的核心价值在 LLM 决策）

## 优缺点总结

**优势：**

- 105.6k Stars，浏览器自动化 AI 领域绝对头部项目
- 自然语言驱动，零选择器代码即可完成复杂网页任务
- 多 LLM 后端灵活切换，自有优化模型速度领先
- Python 库 + CLI 双模式，覆盖开发者与非开发者两类用户
- 开源 benchmark 推动行业标准化，社区生态成熟

**局限：**

- 强依赖 LLM，每步操作有推理延迟和 API 成本，不适合高频确定性任务
- 开源版 Agent 在复杂场景下准确率不如 Cloud 托管版（Cloud 有反检测、代理、优化模型加持）
- CAPTCHA 和反爬场景需依赖 Cloud 服务，开源版能力有限
- 并行大规模运行时 Chrome 内存管理复杂，生产环境推荐用 Cloud

## 与 Agent Browser 对比

Browser Use 和 Agent Browser 都做"AI + 浏览器自动化"，但范式和定位有本质差异：

| 维度 | Browser Use | Agent Browser |
|------|-------------|---------------|
| **核心理念** | LLM-driven Agent：AI 自主决策每一步 | Imperative CLI：AI 或人手动发每条命令 |
| **自动化范式** | 声明式（描述任务，Agent 自主完成） | 命令式（open，snapshot，click @e2） |
| **语言** | Python | Rust（原生二进制） |
| **底层驱动** | Playwright（封装层） | CDP（直接协议，无中间层） |
| **LLM 依赖** | 必须接 LLM 才能工作 | 不依赖 LLM，纯工具；chat 命令可选接入 |
| **Agent 决策** | 内置决策循环（观察，推理，执行，反馈） | 无内置决策循环，由外部 AI Agent 驱动 |
| **性能** | 每步需 LLM 推理（百毫秒到秒级延迟） | 守护进程常驻，命令毫秒级响应 |
| **Stars** | 105.6k | 38.6k |
| **创建时间** | 2024-10（近 2 年） | 2026-01（约 6 个月） |
| **License** | MIT | Apache-2.0 |
| **云服务** | Browser Use Cloud（托管 Agent，反检测，1000 集成） | Vercel Sandbox，五大云浏览器 provider |
| **模型** | 自有 bu 优化模型，benchmark | 无自有模型，工具属性 |
| **适用** | 让 AI 自主完成端到端网页任务 | 给 AI 提供精确的浏览器操控工具 |

一句话区分：Browser Use 是"告诉 AI 要做什么，它自己想怎么做"；Agent Browser 是"给 AI（或你）一套浏览器命令行工具，每一步你来指挥"。两者也可以互补——Agent Browser 已将 Browser Use 列为支持的云浏览器后端之一（`-p browseruse`），说明定位上 Agent Browser 是工具层，Browser Use 是 Agent 层。
