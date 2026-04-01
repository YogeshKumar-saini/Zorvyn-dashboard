import { z } from 'zod';

/**
 * Password must be:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

export const loginSchema = z.preprocess(
  (data) => {
    const d = data as Record<string, unknown>;
    // OAuth2 Password flow sends 'username' instead of 'email'
    if (!d['email'] && d['username']) {
      return { ...d, email: d['username'] };
    }
    return d;
  },
  z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  })
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
