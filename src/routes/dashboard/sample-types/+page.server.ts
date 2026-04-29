import { db } from "$lib/server/db";
import { sampleType } from "$lib/server/db/schema/sampleType";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    const sampleTypes = await db.select().from(sampleType).where(eq(sampleType.userId, locals.user!.id))

    return {
        sampleTypes
    }
}

export const actions = {
    addType: async ({ request, locals }) => {
        const data = await request.formData();
        const name = data.get('name') as string;

        await db.insert(sampleType).values({
            name: name,
            userId: locals.user!.id
        })

        return { success: true }
    }
} satisfies Actions