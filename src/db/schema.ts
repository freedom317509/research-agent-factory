import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("draft"), // draft, generating, generated, executing, completed, failed
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const topologies = sqliteTable("topologies", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  nodes: text("nodes").notNull(), // JSON string
  edges: text("edges").notNull(), // JSON string
  layout: text("layout"), // JSON string for positions
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const executionLogs = sqliteTable("execution_logs", {
  id: text("id").primaryKey(),
  topologyId: text("topology_id").notNull().references(() => topologies.id),
  nodeId: text("node_id").notNull(),
  status: text("status").notNull(), // pending, running, completed, failed
  output: text("output"),
  error: text("error"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // literature_review, data_analysis, experiment, etc.
  topology: text("topology").notNull(), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
