import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';
import { POSTGRES_URL } from '$env/static/private';


export const db = drizzle(POSTGRES_URL, { schema });
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];