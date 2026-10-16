import { betterAuth } from 'better-auth';
import { getPool } from './db.mjs';
let auth;
export function getAuth() {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is required');
  const baseURL = process.env.BETTER_AUTH_URL || 'https://aurora-sre-academy.vercel.app';
  return auth ||= betterAuth({
    appName: 'Aurora SRE', baseURL, basePath: '/api/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    database: getPool(), trustedOrigins: [baseURL],
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60,
      customRules: { '/sign-in/email': { window: 60, max: 5 }, '/sign-up/email': { window: 60, max: 3 } } },
    advanced: { useSecureCookies: baseURL.startsWith('https:'), defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' } }
  });
}
