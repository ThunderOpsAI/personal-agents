import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './dashboard/lib/db/schema.ts',
  out: './dashboard/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL || '',
  },
});
