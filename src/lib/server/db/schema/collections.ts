import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { collectionSamples } from "./collectionSamples";

export const collections = pgTable('collections', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    highlight: text('highlight'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    userId: text('user_id').notNull().references(() => user.id)
})

export const collectionRelations = relations(collections, ({ many }) => ({
    collectionSamples: many(collectionSamples)
}))