// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from '$lib/auth/auth';

type AuthSession = typeof auth.$Infer.Session;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// Only set by hooks.server.ts when the request has a valid session
			user?: AuthSession['user'];
			session?: AuthSession['session'];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
