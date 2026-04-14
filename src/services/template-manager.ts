import { db } from "@/db";
import { templates } from "@/db/schema";
import type { TopologyGenerationResponse } from "@/types/topology";
import { eq } from "drizzle-orm";

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  category: string;
  topology: TopologyGenerationResponse;
}

// Seed templates
export const SEED_TEMPLATES: TemplateData[] = [
  {
    id: "tpl_literature_review",
    name: "文献综述",
    description: "自动化文献检索、筛选、分析和综述撰写流程",
    category: "literature_review",
    topology: {
      nodes: [
        {
          id: "search_agent",
          label: "文献检索",
          role: "researcher",
          prompt: "你是一个专业的学术文献检索代理。根据给定的研究主题，使用学术搜索引擎查找相关文献，重点关注近5年的高引用论文。返回文献列表（标题、作者、年份、摘要）。",
          tools: ["web_search", "citation_manager"],
        },
        {
          id: "filter_agent",
          label: "文献筛选",
          role: "analyst",
          prompt: "你是一个文献筛选专家。根据检索到的文献列表，按照相关性、质量和时效性进行筛选，保留最相关的10-20篇核心文献。",
          tools: ["file_reader"],
        },
        {
          id: "analysis_agent",
          label: "文献分析",
          role: "analyst",
          prompt: "你是一个文献分析专家。仔细阅读筛选后的文献，提取关键发现、方法论、结论和研究空白，生成结构化的分析摘要。",
          tools: ["file_reader", "data_visualizer"],
        },
        {
          id: "writer_agent",
          label: "综述撰写",
          role: "writer",
          prompt: "你是一个学术写作专家。根据文献分析结果，撰写一篇结构完整的文献综述，包括引言、主题分类、研究现状、研究空白和未来方向。",
          tools: ["document_generator"],
        },
        {
          id: "reviewer_agent",
          label: "质量审核",
          role: "reviewer",
          prompt: "你是一个学术质量审核专家。审查文献综述的逻辑性、完整性、引用准确性和学术规范性，提出改进建议。",
          tools: ["file_reader", "citation_manager"],
        },
      ],
      edges: [
        { source: "search_agent", target: "filter_agent", label: "文献列表" },
        { source: "filter_agent", target: "analysis_agent", label: "筛选后文献" },
        { source: "analysis_agent", target: "writer_agent", label: "分析摘要" },
        { source: "writer_agent", target: "reviewer_agent", label: "综述草稿" },
      ],
    },
  },
  {
    id: "tpl_data_analysis",
    name: "数据分析",
    description: "从数据采集到可视化报告的完整数据分析流程",
    category: "data_analysis",
    topology: {
      nodes: [
        {
          id: "data_collector",
          label: "数据采集",
          role: "data_collector",
          prompt: "你是一个数据采集专家。根据研究需求，从指定的数据源（API、网页、数据库等）采集原始数据，并进行初步的质量检查。",
          tools: ["web_search", "code_executor", "file_reader"],
        },
        {
          id: "data_cleaner",
          label: "数据清洗",
          role: "analyst",
          prompt: "你是一个数据清洗专家。对采集到的原始数据进行清洗，处理缺失值、异常值和格式问题，生成干净的数据集。",
          tools: ["code_executor", "file_reader"],
        },
        {
          id: "stat_analyst",
          label: "统计分析",
          role: "analyst",
          prompt: "你是一个统计分析专家。对清洗后的数据进行描述性统计、假设检验和深入分析，提取关键洞察。",
          tools: ["code_executor", "data_visualizer"],
        },
        {
          id: "viz_creator",
          label: "可视化制作",
          role: "analyst",
          prompt: "你是一个数据可视化专家。根据统计分析结果，制作清晰、美观的图表（折线图、柱状图、散点图等），支持研究结论。",
          tools: ["data_visualizer", "document_generator"],
        },
        {
          id: "report_writer",
          label: "报告撰写",
          role: "writer",
          prompt: "你是一个数据报告撰写专家。整合分析结果和可视化图表，撰写结构完整的数据分析报告，包括方法、结果和讨论。",
          tools: ["document_generator"],
        },
      ],
      edges: [
        { source: "data_collector", target: "data_cleaner", label: "原始数据" },
        { source: "data_cleaner", target: "stat_analyst", label: "清洗后数据" },
        { source: "stat_analyst", target: "viz_creator", label: "分析结果" },
        { source: "stat_analyst", target: "report_writer", label: "统计结论" },
        { source: "viz_creator", target: "report_writer", label: "可视化图表" },
      ],
    },
  },
];

export async function seedTemplates() {
  const existing = await db.select({ id: templates.id }).from(templates);
  if (existing.length > 0) return; // Already seeded

  for (const tpl of SEED_TEMPLATES) {
    await db.insert(templates).values({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      topology: JSON.stringify(tpl.topology),
    });
  }
}

export async function getAllTemplates() {
  return await db.select().from(templates);
}

export async function getTemplateById(id: string) {
  const results = await db.select().from(templates).where(eq(templates.id, id));
  return results[0];
}
