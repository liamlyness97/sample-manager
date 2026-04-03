import { auth } from "$lib/auth/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export const GET = ({ event }) => svelteKitHandler({ event, auth });
export const POST = ({ event }) => svelteKitHandler({ event, auth });
