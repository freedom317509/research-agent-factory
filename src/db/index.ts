import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = "file:D:/projects/research-agent-factory/data/research-factory.db";

const client = createClient({
  url: dbPath,
});

export const db = drizzle(client, { schema });
