import { auth } from "$lib/auth/auth.js";
import { redirect, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
    if (locals.session) {
        redirect(303, '/dashboard')
    }
}

export const actions = {
    login: async ({ request }) => {
        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');

        try {
            await auth.api.signInEmail({
                body: {
                    email: `${email}`,
                    password: `${password}`,
                    rememberMe: true,
                }
            });
        } catch {
            return fail(400, { error: 'Invalid email or password.' });
        }

        redirect(303, '/dashboard');
    },
    signup: async ({ request }) => {
        const data = await request.formData();

        const name = data.get('name');
        const email = data.get('email');
        const password = data.get('password');

        try {
            await auth.api.signUpEmail({
                body: {
                    name: `${name}`,
                    email: `${email}`,
                    password: `${password}`,
                }
            });
        } catch {
            return fail(400, { error: 'Could not create account. The email may already be in use.' });
        }

        redirect(303, '/dashboard');
    }
} satisfies Actions