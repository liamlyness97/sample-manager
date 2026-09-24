import { auth } from '$lib/auth/auth'
import { svelteKitHandler } from 'better-auth/svelte-kit'
import { building } from '$app/environment'
import type { ServerInit } from '@sveltejs/kit';
import { startAnalysisWorker } from '$lib/server/jobs';

export async function handle({ event, resolve }) {
    const session = await auth.api.getSession({
        headers: event.request.headers,
    })

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user
    }

    return svelteKitHandler({ event, resolve, auth, building })
}

export const init: ServerInit = async () => {
    await startAnalysisWorker()
}