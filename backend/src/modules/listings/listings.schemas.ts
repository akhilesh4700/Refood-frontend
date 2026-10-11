import { z } from 'zod';

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').trim(),
  description: z.string().min(10, 'Description must be at least 10 characters long').trim(),
  type: z
    .enum(['edible', 'organic', 'EDIBLE', 'ORGANIC'])
    .transform((val) => val.toUpperCase() as 'EDIBLE' | 'ORGANIC'),
  category: z.string().min(1, 'Category is required').trim(),
  subcategory: z.string().optional(),
  weightKg: z.coerce.number().positive('Weight must be greater than zero'),
  portions: z.coerce.number().int().positive().optional(),
  storageMethod: z
    .enum(['ambient', 'refrigerated', 'frozen', 'AMBIENT', 'REFRIGERATED', 'FROZEN'])
    .default('AMBIENT')
    .transform((val) => val.toUpperCase() as 'AMBIENT' | 'REFRIGERATED' | 'FROZEN'),
  handlingInstructions: z.string().optional(),
  allergens: z.array(z.string()).default([]),
  preparedAt: z.string().datetime().optional(),
  safeUntil: z.string().datetime().optional(),
  earliestPickup: z.string().datetime().default(() => new Date().toISOString()),
  collectionDeadline: z.string().datetime(),
  pickupAddress: z.string().min(5, 'Pickup address is required').trim(),
  pickupInstructions: z.string().optional(),
  onSiteContact: z.string().min(2, 'On-site contact name is required').trim(),
  onSitePhone: z.string().min(7, 'On-site contact phone is required').trim(),
  imageUrl: z.string().url().optional(),
  isFree: z.boolean().default(true),
  price: z.coerce.number().positive().optional(),
  currency: z.string().default('INR'),
}).refine((data) => {
  // Food safety rule: Edible food requires a safe-consumption deadline
  if (data.type === 'EDIBLE' && !data.safeUntil) {
    return false;
  }
  return true;
}, {
  message: 'Edible surplus listings must declare a safe-until consumption deadline',
  path: ['safeUntil'],
});

export const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  weightKg: z.coerce.number().positive().optional(),
  portions: z.coerce.number().int().positive().optional(),
  storageMethod: z
    .enum(['ambient', 'refrigerated', 'frozen', 'AMBIENT', 'REFRIGERATED', 'FROZEN'])
    .transform((val) => val.toUpperCase() as 'AMBIENT' | 'REFRIGERATED' | 'FROZEN')
    .optional(),
  allergens: z.array(z.string()).optional(),
  collectionDeadline: z.string().datetime().optional(),
  pickupAddress: z.string().min(5).optional(),
  pickupInstructions: z.string().optional(),
  onSiteContact: z.string().optional(),
  onSitePhone: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const withdrawListingSchema = z.object({
  reason: z.string().max(300).optional().default('Withdrawn by supplier'),
});

export const queryListingsSchema = z.object({
  type: z
    .enum(['edible', 'organic', 'EDIBLE', 'ORGANIC'])
    .optional()
    .transform((val) => (val ? (val.toUpperCase() as 'EDIBLE' | 'ORGANIC') : undefined)),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z
    .enum(['active', 'draft', 'claimed', 'completed', 'expired', 'withdrawn', 'ACTIVE', 'DRAFT', 'CLAIMED', 'COMPLETED', 'EXPIRED', 'WITHDRAWN'])
    .optional()
    .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['deadline', 'created', 'weight']).default('deadline'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type QueryListingsInput = z.infer<typeof queryListingsSchema>;
