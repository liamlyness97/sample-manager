import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import { lookup } from 'mime-types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    if (params.userId !== locals.user?.id) error(403, 'Forbidden');

    try {
        const path = `${process.cwd()}/uploads/${params.userId}/${params.filename}`;
        const file = await readFile(path);

        return new Response(file, {
            headers: {
                'Content-Type': lookup(params.filename) || 'audio/mpeg',
                'Cache-Control': 'private, max-age=3600'
            }
        });
    } catch {
        error(404, 'File not found');
    }
};