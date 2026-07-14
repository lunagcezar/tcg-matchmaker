import { z } from "zod";

export const CreateStoreSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  country: z.string().default("Brasil"),
  state: z.string().default("Ceará"),
  city: z.string().default("Fortaleza"),
  address: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  logo_path: z.string().optional(),
});

export const StoreSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  logo_path: z.string().nullable(),
  created_by_user_id: z.string().uuid(),
  is_verified: z.boolean(),
  status: z.enum(["active", "suspended"]),
  suspended_at: z.string().datetime().nullable(),
  suspension_reason: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const StoreMembershipSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["owner", "manager", "staff"]),
  created_at: z.string().datetime(),
});

export type CreateStoreInput = z.input<typeof CreateStoreSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type StoreMembership = z.infer<typeof StoreMembershipSchema>;
