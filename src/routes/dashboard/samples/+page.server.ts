import { dirname, extname } from "path";
import type { Actions, PageServerLoad } from "./$types";
import { writeFile } from "fs/promises";
import { mkdirSync } from "fs";
import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema/samples";
import { eq, inArray } from "drizzle-orm";
import { sampleType } from "$lib/server/db/schema/sampleType";
import { env } from "$env/dynamic/private"
import { collections } from "$lib/server/db/schema/collections";
import { fail } from "@sveltejs/kit";
import { collectionSamples } from "$lib/server/db/schema/collectionSamples";


export const load: PageServerLoad = async ({ locals }) => {
    const sampleList = await db.select().from(samples).where(eq(samples.userId, locals.user!.id))
    const sampleTypes = await db.select().from(sampleType).where(eq(sampleType.userId, locals.user!.id))
    const collectionsList = await db.select().from(collections).where(eq(collections.userId, locals.user!.id))


    return {
        samples: sampleList,
        types: sampleTypes,
        collections: collectionsList
    }
}

export const actions = {
    upload: async ({ request, locals, fetch }) => {
        const data = await request.formData();
        const file = data.get('file') as File;
        const peaks = data.get('peaks') as string;
        const sampleType = data.get('sampleType') as string;

        const requested = [
            ...new Set(data.getAll('collectionIds').filter((v): v is string => typeof v === 'string'))
        ];

        const validIds = requested.length > 0 ? (
            await db.select({ id: collections.id }).from(collections).where(inArray(collections.id, requested))
        ).map((r) => r.id) : []

        const sampleName = file?.name;
        const filepath = `uploads/${locals.user!.id}`;
        const uploadFileName = `${crypto.randomUUID()}${extname(file.name.replace(/ /g, ''))}`;
        const filename = `${filepath}/${uploadFileName}`;

        mkdirSync(filepath, { recursive: true });
        await writeFile(filename, Buffer.from(await file.arrayBuffer()));

       

        const [newSample] = await db.insert(samples).values({
            sampleName: sampleName,
            sampleUrl: filename,
            sampleFormat: file.type,
            sampleFolder: filepath,
            fileSize: `${file.size}`,
            userId: locals.user!.id,
            peaks: peaks,
            typeId: sampleType === 'none' ? null : sampleType,
            status: 'pending'
        }).returning({ id: samples.id, userId: samples.userId, });

        // Testing the pass off to FastAPI
        /*
        const fastApiTest = await fetch(`${env.FASTAPI_URL}/files/test/${locals.user!.id}/${uploadFileName}`);
        const fastApiRes = await fastApiTest.json()
        console.log(fastApiRes)
        */

        if (validIds.length > 0) {
            await db.insert(collectionSamples).values(validIds.map((collectionId) => ({
                collectionId, sampleId: newSample.id
            }))).onConflictDoNothing();
        }

        const analysis = await fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({sample: newSample, filename: uploadFileName})
        })

        return { success: true };
    }
} satisfies Actions