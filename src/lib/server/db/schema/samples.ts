import { pgTable, text, timestamp, integer, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { sampleType } from "./sampleType";
import { relations } from "drizzle-orm";
import { collectionSamples } from "./collectionSamples";

export const statusEnum = pgEnum('status', ['pending', 'processing', 'failed', 'complete']);

export const samples = pgTable('sample', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sampleName: text('sample_name').notNull(),
    sampleUrl: text('sample_url').notNull(),
    sampleFormat: text('sample_format').notNull(),
    sampleFolder: text('sample_folder').notNull(),
    peaks: text('peaks'),
    fileSize: integer('file_size'),
    sampleBpm: doublePrecision('sample_bpm'),
    duration: doublePrecision('duration'),
    sampleRate: integer('sample_rate'),
    estimatedKey: text('estimated_key'),
    harmonicRatio: doublePrecision('harmonic_ratio'),
    tonality: text('tonality'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    lastPlayedAt: timestamp('last_played_at'),
    playCount: integer('play_count').notNull().default(0),
    analysisVersion: integer('analysis_version'),
    analysedAt: timestamp('analysed_at'),
    analysisError: text('analysis_error'),
    userId: text('user_id').notNull().references(() => user.id),
    typeId: text('type_id').references(() => sampleType.id),
    status: statusEnum('status').notNull().default('pending')
});

export const sampleRelations = relations(samples, ({ many }) => ({
    collectionSamples: many(collectionSamples)
}))