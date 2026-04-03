import { dirname, extname } from "path";
import type { Actions, PageServerLoad } from "./$types";
import { writeFile } from "fs/promises";
import { mkdirSync } from "fs";
import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema/samples";
import { user } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
    const sampleList = await db.select().from(samples).where(eq(samples.userId, locals.user!.id))

    return {
        samples: sampleList
    }
}

export const actions = {
    upload: async ({ request, locals }) => {
        const data = await request.formData();
        const file = data.get('file') as File;

        const sampleName = file?.name;

        const filepath = `uploads/${locals.user!.id}`;
        const filename = `${filepath}/${crypto.randomUUID()}${extname(file?.name?.replace(/ /g, ''))}`;

        mkdirSync(filepath, { recursive: true });
        await writeFile(filename, Buffer.from(await file?.arrayBuffer()));

        await db.insert(samples).values({
            sampleName: `${sampleName}`,
            sampleUrl: `${filename}`,
            sampleFormat: `${file?.type}`,
            sampleFolder: `${filepath}`,
            fileSize: `${file!.size}`,
            userId: `${locals.user!.id}`
        })

        return {
            success: true
        }
    }
} satisfies Actions