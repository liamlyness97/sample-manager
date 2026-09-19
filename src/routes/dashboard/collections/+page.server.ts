import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { collections } from "$lib/server/db/schema/collections";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
    const collectionsList = await db.select().from(collections).where(eq(collections.userId, locals.user!.id));

    return {
        collectionsList
    }
}

export const actions: Actions = {
    create: async ({request, locals}) => {
        const data = await request.formData();
        const name = data.get('name') as string;
        const highlight = data.get('highlight') as string;

        if (!name) {
            return fail(400, { name, missing: true })
        }

        await db.insert(collections).values({
            name: name,
            highlight: highlight,
            userId: locals.user!.id
        })

        return {
            success: true
        }
    }
} satisfies Actions