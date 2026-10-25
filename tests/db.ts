import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { migrationsFolder, type Db } from "../src/db/client.ts";
import * as schema from "../src/db/schema.ts";

let migrated: Promise<PGlite> | undefined;

async function migrateTemplate(): Promise<PGlite> {
    const client = new PGlite();
    await migrate(drizzle(client), { migrationsFolder });
    return client;
}

/** A fresh, migrated in-memory Postgres per call. Migrations run once, after which the database is cloned. */
export async function createTestDb(): Promise<Db> {
    migrated ??= migrateTemplate();
    // clone() is typed as the interface, but returns a PGlite instance
    const client = await (await migrated).clone() as PGlite;
    return drizzle(client, { schema });
}
