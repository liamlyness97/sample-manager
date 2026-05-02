import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const sampleType = pgTable('sampleType', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    userId: text('user_id').notNull().references(() => user.id)
});