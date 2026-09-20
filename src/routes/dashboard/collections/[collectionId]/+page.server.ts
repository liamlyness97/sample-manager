import { db } from "$lib/server/db";
import { samples } from "$lib/server/db/schema";
import { collectionSamples } from "$lib/server/db/schema/collectionSamples";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { collections } from "$lib/server/db/schema/collections";

export const load: PageServerLoad = async ({params, locals}) => {
    if (!locals.user) error(401, 'Not signed in');

	const [collection] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, params.collectionId))
		.limit(1);

	if (!collection) error(404, 'Collection not found');

	const collectionSampleList = await db
		.select(getTableColumns(samples))
		.from(samples)
		.innerJoin(collectionSamples, eq(collectionSamples.sampleId, samples.id))
		.where(
			and(
				eq(collectionSamples.collectionId, collection.id),
				eq(samples.userId, locals.user.id)
			)
		)
		.orderBy(desc(collectionSamples.addedAt));

	return { collection, samples: collectionSampleList };
}