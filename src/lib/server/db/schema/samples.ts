import { pgTable, text, timestamp, integer, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sampleType } from "./sampleType";
import { relations } from "drizzle-orm";
import { collectionSamples } from "./collectionSamples";

export const statusEnum = pgEnum('status', ['pending', 'complete']);

export const samples = pgTable('sample', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sampleName: text('sample_name').notNull(),
    sampleUrl: text('sample_url').notNull(),
    sampleFormat: text('sample_format').notNull(),
    sampleFolder: text('sample_folder').notNull(),
    peaks: text('peaks'),
    fileSize: integer(),
    sampleBpm: doublePrecision(),
    duration: doublePrecision(),
    sampleRate: integer(),
    estimatedKey: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    userId: text('user_id').notNull().references(() => user.id),
    typeId: text('type_id').references(() => sampleType.id),
    status: statusEnum('status').notNull().default('pending')
});

export const sampleRelations = relations(samples, ({ many }) => ({
    collectionSamples: many(collectionSamples)
}))