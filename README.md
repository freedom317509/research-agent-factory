# Research Agent Factory

基于 LLM 的多智能体研究流水线平台。通过可视化拓扑画布编排多个 AI Agent（研究员、分析师、写作者等），自动完成复杂研究任务。

## 功能

- **可视化拓扑画布** — 拖拽式构建多 Agent 协作拓扑，定义数据流与依赖关系
- **LLM 自动生成拓扑** — 输入研究任务描述，AI 自动推荐 Agent 组合与编排方案
- **多角色 Agent** — 内置 researcher、analyst、writer、reviewer、coordinator、data_collector、methodologist 等角色，支持自定义
- **流水线执行引擎** — 按拓扑依赖关系自动调度 Agent 执行，实时查看执行日志
- **模板系统** — 保存常用拓扑为模板（文献综述、数据分析、实验设计等），一键复用
- **任务历史** — 完整的任务生命周期追踪与回溯

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 + React 19 + TypeScript |
| UI | Tailwind CSS v4 + lucide-react + Sonner |
| 画布 | React Flow (@xyflow/react) |
| AI | Vercel AI SDK v6 (Anthropic Claude + OpenAI) |
| 数据库 | SQLite (libsql) + Drizzle ORM |
| Schema 验证 | Zod |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

在根目录创建 `.env.local`：

```env
# 至少配置一个 LLM Provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. 初始化数据库

```bash
npx drizzle-kit push
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

## 项目结构

```
src/
  app/
    page.tsx                    # 首页 — 任务列表
    tasks/[id]/editor/          # 拓扑编辑器（可视化画布 + Agent 详情面板）
    tasks/[id]/execute/         # 执行控制台（实时日志）
    history/                    # 历史任务归档
    templates/                  # 模板管理
    api/
      tasks/                    # 任务 CRUD + 拓扑生成
      templates/                # 模板 CRUD
      topologies/               # 拓扑管理 + 执行入口
  components/
    editor/                     # 拓扑编辑器组件（画布、节点、详情面板）
    execution/                  # 执行日志组件
  db/
    schema.ts                   # Drizzle 数据库 Schema（tasks, topologies, execution_logs, templates）
    index.ts                    # DB 连接
  services/
    topology-generator.ts       # LLM 驱动的拓扑生成
    pipeline-executor.ts        # 流水线执行引擎（拓扑排序 → 并行调度）
    template-manager.ts         # 模板管理
  types/
    topology.ts                 # 核心类型定义（AgentNode, Topology, ExecutionLog, Task）
```

## 架构概览

```
用户输入研究描述
    │
    ▼
LLM 生成拓扑 (Topology Generator)
    │
    ├── Coordinator Agent ──┐
    │                       ▼
    ├── Researcher Agent ──► Analyst Agent ──► Writer Agent
    │                       │                      │
    └── Data Collector ─────┘                      ▼
                                            Reviewer Agent
    │
    ▼
执行引擎按拓扑排序调度 → 实时日志 → 最终输出
```

## 核心概念

- **Task** — 一个研究任务，包含标题、描述和状态流转（draft → generating → generated → executing → completed）
- **Topology** — 由多个 Agent 节点（AgentNode）和有向边（TopologyEdge）组成的协作拓扑图
- **Agent** — 具有特定角色（role）、系统提示（prompt）和工具集（tools）的 LLM 调用单元
- **Execution** — 按照拓扑的依赖关系，拓扑排序后依次/并行执行各 Agent，结果记录到执行日志

## 可用脚本

```bash
npm run dev     # 启动开发服务器
npm run build   # 生产构建
npm run start   # 运行生产服务器
npm run lint    # ESLint 检查
```

## License

MIT