import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://refood_user:refood_password@localhost:5432/refood_db?schema=public'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('refood_super_secure_jwt_secret_dev_key_2026'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
