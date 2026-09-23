import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const POST: RequestHandler = async ({ request }) => {
    const { sample, filename } = await request.json()

    
    const librosa = await fetch(`${env.FASTAPI_URL}/files/analyse/${sample.userId}/${filename}`)
    
    if (!librosa.ok) error(librosa.status);
    
    const librosaRes = await librosa.json()

    const [sampleUpdate] = await db.update(samples)
        .set({ 
            sampleBpm: librosaRes.bpm,
            sampleRate: librosaRes.sampleRate,
            duration: librosaRes.duration,
            estimatedKey: librosaRes.key,
            harmonicRatio: librosaRes.harmonicRatio,
            tonality: librosaRes.tonality,
            status: 'complete'
        })
        .where(eq(samples.id, sample.id))
        .returning()

    console.log(sampleUpdate)


   return json({ success: true })
}