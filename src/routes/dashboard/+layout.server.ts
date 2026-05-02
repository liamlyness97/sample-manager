import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { auth } from "$lib/auth/auth.js";
import { samples, sampleType } from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { eq } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.session) {
        redirect(303, '/login');
    }

    const sampleList = await db.select().from(samples).where(eq(samples.userId, locals.user!.id))

    const sampleTypes = await db.select().from(sampleType).where(eq(sampleType.userId, locals.user!.id))

    return { user: locals.user, session: locals.session, sampleCount: sampleList.length };
};