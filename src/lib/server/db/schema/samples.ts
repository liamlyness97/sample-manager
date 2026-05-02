import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sampleType } from "./sampleType";

export const samples = pgTable('sample', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sampleName: text('sample_name').notNull(),
    sampleUrl: text('sample_url').notNull(),
    sampleFormat: text('sample_format').notNull(),
    sampleFolder: text('sample_folder').notNull(),
    peaks: text('peaks'),
    fileSize: integer(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    userId: text('user_id').notNull().references(() => user.id),
    typeId: text('type_id').references(() => sampleType.id)
});