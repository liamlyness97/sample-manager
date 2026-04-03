import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { auth } from "$lib/auth/auth.js";

export const load: LayoutServerLoad = ({ locals }) => {
    if (!locals.session) {
        redirect(303, '/login');
    }
    return { user: locals.user, session: locals.session };
};