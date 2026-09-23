import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { auth } from "$lib/auth/auth.js";
import { collections, samples, sampleType } from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
    depends('app:recent-samples')

    if (!locals.session) {
        redirect(303, '/login');
    }

    if (!locals.user) return { recentSamples: [] };

    const sampleList = await db.select().from(samples).where(eq(samples.userId, locals.user!.id));

    const collectionsList = await db.select().from(collections).where(eq(collections.userId, locals.user!.id));

    const recentSamples = await db
        .select()
        .from(samples)
        .where(and(eq(samples.userId, locals.user.id), isNotNull(samples.lastPlayedAt)))
        .orderBy(desc(samples.lastPlayedAt))
        .limit(5)

    return { user: locals.user, session: locals.session, sampleCount: sampleList.length, recentSamples, collections: collectionsList };
};