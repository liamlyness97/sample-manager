import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const POST: RequestHandler = async ({params, locals}) => {
    if (!locals.user) error(401, 'Not signed in');

    const updated = await db
        .update(samples)
        .set({ lastPlayedAt: new Date(), playCount: sql`${samples.playCount} + 1` })
        .where(and(eq(samples.id, params.id), eq(samples.userId, locals.user.id)))
        .returning({ id: samples.id })

    if (updated.length === 0) error(404, 'Sample not found')

    return json({ ok: true })
}