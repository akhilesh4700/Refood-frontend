import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email('Valid email address required')),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Contact person name is required').trim(),
  role: z
    .enum(['supplier', 'recipient', 'processor', 'SUPPLIER', 'RECIPIENT', 'PROCESSOR'])
    .transform((val) => val.toUpperCase() as 'SUPPLIER' | 'RECIPIENT' | 'PROCESSOR'),
  orgName: z.string().min(2, 'Organization name is required').trim(),
  orgType: z.string().min(2, 'Organization type is required').trim(),
  address: z.string().min(5, 'Address is required').trim(),
  city: z.string().min(2, 'City is required').trim(),
  phone: z.string().min(7, 'Contact phone is required').trim(),
  state: z.string().optional().default('Karnataka'),
  postalCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email('Valid email address required')),
  password: z.string().min(1, 'Password is required'),
  role: z
    .enum(['supplier', 'recipient', 'buyer', 'processor', 'SUPPLIER', 'RECIPIENT', 'PROCESSOR'])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const upper = val.toUpperCase();
      return (upper === 'BUYER' ? 'RECIPIENT' : upper) as 'SUPPLIER' | 'RECIPIENT' | 'PROCESSOR';
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
