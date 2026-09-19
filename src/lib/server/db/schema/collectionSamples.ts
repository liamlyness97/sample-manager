import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { samples } from "./samples";
import { relations } from "drizzle-orm";


export const collectionSamples = pgTable('collection_samples', {
    collectionId: text('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
    sampleId: text('sample_id').notNull().references(() => samples.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').notNull().defaultNow()
}, (t) => [primaryKey({ columns: [t.collectionId, t.sampleId] })])

export const collectionSamplesRelations = relations(collectionSamples, ({ one }) => ({
    collection: one(collections, {
        fields: [collectionSamples.collectionId],
        references: [collections.id]
    }),
    sample: one(samples, {
        fields: [collectionSamples.sampleId],
        references: [samples.id]
    })
}))