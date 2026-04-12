import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth";
import { sql } from "drizzle-orm";

export const samples = sqliteTable('sample', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sampleName: text('sample_name').notNull(),
    sampleUrl: text('sample_url').notNull(),
    sampleFormat: text('sample_format').notNull(),
    sampleFolder: text('sample_folder').notNull(),
    peaks: text('peaks'),
    fileSize: integer(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    userId: text('user_id').notNull().references(() => user.id)
})