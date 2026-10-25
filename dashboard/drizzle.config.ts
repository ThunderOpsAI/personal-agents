interface DrizzleConfig {
  schema: string;
  out: string;
  dialect: 'postgresql';
  dbCredentials: {
    url: string;
  };
}

const config: DrizzleConfig = {
  schema: './dashboard/lib/db/schema.ts',
  out: './dashboard/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL || '',
  },
};

export default config;
