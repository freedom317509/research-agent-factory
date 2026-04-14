# Research Agent Factory

> A multi-agent research pipeline platform powered by LLMs. Orchestrate AI agents (researchers, analysts, writers, etc.) through a visual topology canvas to automate complex research workflows.
>
> 基于 LLM 的多智能体研究流水线平台。通过可视化拓扑画布编排多个 AI Agent（研究员、分析师、写作者等），自动完成复杂研究任务。

## Features / 功能

- **Visual Topology Canvas** — Drag-and-drop builder for multi-agent collaboration topologies, defining data flow and dependencies.
  **可视化拓扑画布** — 拖拽式构建多 Agent 协作拓扑，定义数据流与依赖关系。
- **LLM-Auto-Generated Topology** — Describe a research task and AI recommends the optimal agent composition and orchestration.
  **LLM 自动生成拓扑** — 输入研究任务描述，AI 自动推荐 Agent 组合与编排方案。
- **Multi-Role Agents** — Built-in roles: researcher, analyst, writer, reviewer, coordinator, data_collector, methodologist, plus custom roles.
  **多角色 Agent** — 内置 researcher、analyst、writer、reviewer、coordinator、data_collector、methodologist 等角色，支持自定义。
- **Pipeline Execution Engine** — Schedule agents based on topology dependencies with real-time execution logs.
  **流水线执行引擎** — 按拓扑依赖关系自动调度 Agent 执行，实时查看执行日志。
- **Template System** — Save common topologies as templates (literature review, data analysis, experiment design) for one-click reuse.
  **模板系统** — 保存常用拓扑为模板（文献综述、数据分析、实验设计等），一键复用。
- **Task History** — Full task lifecycle tracking and archival.
  **任务历史** — 完整的任务生命周期追踪与回溯。

## Tech Stack / 技术栈

| Layer / 层 | Technology / 技术 |
|---|------|
| Framework / 框架 | Next.js 16 + React 19 + TypeScript |
| UI | Tailwind CSS v4 + lucide-react + Sonner |
| Canvas / 画布 | React Flow (@xyflow/react) |
| AI | Vercel AI SDK v6 (Anthropic Claude + OpenAI) |
| Database / 数据库 | SQLite (libsql) + Drizzle ORM |
| Validation / 验证 | Zod |

## Quick Start / 快速开始

### 1. Install Dependencies / 安装依赖

```bash
npm install
```

### 2. Configure API Keys / 配置 API Key

Create `.env.local` at the project root:
在项目根目录创建 `.env.local`：

```env
# At least one LLM provider required / 至少配置一个 LLM Provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Initialize Database / 初始化数据库

```bash
npx drizzle-kit push
```

### 4. Start Dev Server / 启动开发服务器

```bash
npm run dev
```

Open http://localhost:3000 in your browser. / 打开 http://localhost:3000

## Detailed Setup Guide / 详细使用指南

### Prerequisites / 环境要求

| Software / 软件 | Minimum Version / 最低版本 | Check / 检查 |
|---|---|---|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |

Install Node.js from https://nodejs.org

### Step-by-Step Guide / 详细步骤

#### 1. Clone the repository / 克隆仓库

```bash
git clone https://github.com/freedom317509/research-agent-factory.git
cd research-agent-factory
```

#### 2. Install dependencies / 安装依赖

```bash
npm install
```

This takes ~30 seconds and creates the `node_modules/` directory.
安装大约 30 秒，完成后会多出 `node_modules/` 目录。

#### 3. Configure API Keys / 配置 API Key

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in at least one LLM API key:
编辑 `.env.local`，填入至少一个 LLM 的 API Key：

```env
# Use Claude (recommended) / 使用 Claude（推荐）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Or use OpenAI / 或使用 OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

**How to get API keys / 获取 API Key：**
- Anthropic: https://console.anthropic.com/settings/keys → Create Key
- OpenAI: https://platform.openai.com/api-keys → Create new secret key

#### 4. Initialize the database / 初始化数据库

```bash
npx drizzle-kit push
```

This creates `data/research-factory.db` with 4 tables:
自动在 `data/` 目录下创建数据库文件，建好 4 张表：
- `tasks` — research tasks / 研究任务
- `topologies` — agent topology structures / Agent 拓扑结构
- `execution_logs` — execution logs / 执行日志
- `templates` — reusable templates / 可复用模板

#### 5. Start the dev server / 启动开发服务器

```bash
npm run dev
```

You should see: / 看到类似输出即成功：

```
▲ Next.js 16.x.x  - Local:        http://localhost:3000
```

### How to Use the App / 在应用里怎么用

1. **Home page / 首页** — See the task list, click "New Task" to create one.
2. **Create task / 创建任务** — Enter a research description, e.g. "Write a literature review on LLM applications in healthcare".
3. **Generate topology / 生成拓扑** — AI automatically generates an agent collaboration plan (Researcher → Analyst → Writer → Reviewer).
4. **Edit topology / 编辑拓扑** — Drag nodes on the canvas, modify prompts and tools for each agent.
5. **Execute / 执行** — Click execute, the system dispatches agents in dependency order with real-time logs.
6. **View history / 查看历史** — Browse completed tasks in the history page.
7. **Save templates / 保存模板** — Save useful topologies for one-click reuse.

### Troubleshooting / 常见问题

| Problem / 问题 | Solution / 解决 |
|---|---|
| `npm install` fails | Check Node.js version, recommend v20+. 检查 Node.js 版本，建议 v20+ |
| Missing API key error | At least one of `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is required. 必须至少配置一个 API Key |
| `drizzle-kit push` fails | Ensure `data/` directory exists: `mkdir data` then retry. 确保 `data/` 目录存在 |
| Port 3000 in use | Change port: `npm run dev -- -p 3001`. 改端口启动 |

## Project Structure / 项目结构

```
src/
  app/
    page.tsx                    # Home - task list / 首页 - 任务列表
    tasks/[id]/editor/          # Topology editor (canvas + detail panel) / 拓扑编辑器（画布 + 详情面板）
    tasks/[id]/execute/         # Execution console (live logs) / 执行控制台（实时日志）
    history/                    # Task archive / 历史任务归档
    templates/                  # Template management / 模板管理
    api/
      tasks/                    # Task CRUD + topology generation / 任务 CRUD + 拓扑生成
      templates/                # Template CRUD / 模板 CRUD
      topologies/               # Topology management + execution / 拓扑管理 + 执行入口
  components/
    editor/                     # Topology editor components / 拓扑编辑器组件
    execution/                  # Execution log components / 执行日志组件
  db/
    schema.ts                   # Drizzle schema (tasks, topologies, execution_logs, templates)
    index.ts                    # DB connection / 数据库连接
  services/
    topology-generator.ts       # LLM-driven topology generation / LLM 驱动的拓扑生成
    pipeline-executor.ts        # Pipeline executor (topo sort → parallel dispatch) / 流水线执行引擎
    template-manager.ts         # Template management / 模板管理
  types/
    topology.ts                 # Core types (AgentNode, Topology, ExecutionLog, Task) / 核心类型定义
```

## Architecture / 架构概览

```
User inputs research description / 用户输入研究描述
    │
    ▼
LLM generates topology / LLM 生成拓扑
    │
    ├── Coordinator Agent ──┐
    │                       ▼
    ├── Researcher Agent ──► Analyst Agent ──► Writer Agent
    │                       │                      │
    └── Data Collector ─────┘                      ▼
                                            Reviewer Agent
    │
    ▼
Executor dispatches via topological sort → live logs → final output
执行引擎按拓扑排序调度 → 实时日志 → 最终输出
```

## Core Concepts / 核心概念

- **Task** — A research unit with title, description, and lifecycle state (draft → generating → generated → executing → completed).
  一个研究任务，包含标题、描述和状态流转。
- **Topology** — A directed graph of Agent nodes (AgentNode) and edges (TopologyEdge) defining collaboration flow.
  由多个 Agent 节点和有向边组成的协作拓扑图。
- **Agent** — An LLM invocation unit with a specific role, system prompt, and tool set.
  具有特定角色（role）、系统提示（prompt）和工具集（tools）的 LLM 调用单元。
- **Execution** — Agents are dispatched sequentially/in-parallel based on topological sort, with results logged to execution records.
  按照拓扑的依赖关系，拓扑排序后依次/并行执行各 Agent，结果记录到执行日志。

## Scripts / 可用脚本

```bash
npm run dev     # Start dev server / 启动开发服务器
npm run build   # Production build / 生产构建
npm run start   # Run production server / 运行生产服务器
npm run lint    # ESLint check / ESLint 检查
```

## License

MIT