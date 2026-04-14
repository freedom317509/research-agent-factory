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