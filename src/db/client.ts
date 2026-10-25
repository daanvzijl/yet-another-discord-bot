import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const migrationsFolder = join(import.meta.dir, "../../drizzle");

export async function connectDb(url: string): Promise<Db> {
    const db = drizzle(url, { schema });
    await migrate(db, { migrationsFolder });
    return db;
}
