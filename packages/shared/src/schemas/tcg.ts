import { z } from 'zod';

export const CreateTcgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  logo_path: z.string().optional(),
});

export const TcgSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  logo_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const FormatSchema = z.object({
  id: z.string().uuid(),
  tcg_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

export const CreateFormatSchema = z.object({
  tcg_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export const UpdateTcgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  logo_path: z.string().optional(),
});

export const UpdateFormatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
});

export type CreateTcgInput = z.input<typeof CreateTcgSchema>;
export type UpdateTcgInput = z.input<typeof UpdateTcgSchema>;
export type Tcg = z.infer<typeof TcgSchema>;
export type Format = z.infer<typeof FormatSchema>;
export type CreateFormatInput = z.input<typeof CreateFormatSchema>;
export type UpdateFormatInput = z.input<typeof UpdateFormatSchema>;
