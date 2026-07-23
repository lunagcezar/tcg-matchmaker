import {
  CreateTcgSchema,
  UpdateTcgSchema,
  TcgSchema,
  CreateFormatSchema,
  UpdateFormatSchema,
  FormatSchema,
} from '@tcg/shared';
import type { createSecretClient } from '../db/client.js';
import {
  findAllTcgs,
  findTcgById,
  insertTcg,
  updateTcg,
  softDeleteTcg,
  findFormatsByTcg,
  insertFormat,
  updateFormat,
  softDeleteFormat,
} from './repository.js';

export async function listTcgs(supabase: ReturnType<typeof createSecretClient>) {
  const data = await findAllTcgs(supabase);
  return { data, error: null, meta: null };
}

export async function getTcg(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const data = await findTcgById(supabase, id);
  if (!data) return { data: null, error: 'TCG not found', meta: null };
  return { data: TcgSchema.parse(data), error: null, meta: null };
}

export async function createTcg(supabase: ReturnType<typeof createSecretClient>, body: unknown) {
  const parsed = CreateTcgSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }
  const { data, error } = await insertTcg(supabase, parsed.data as Record<string, unknown>);
  if (error) return { data: null, error: error.message, meta: null };
  return { data: TcgSchema.parse(data!), error: null, meta: null };
}

export async function editTcg(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  body: unknown,
) {
  const parsed = UpdateTcgSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }
  const { data, error } = await updateTcg(supabase, id, parsed.data as Record<string, unknown>);
  if (error || !data) return { data: null, error: 'TCG not found', meta: null };
  return { data: TcgSchema.parse(data!), error: null, meta: null };
}

export async function removeTcg(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await softDeleteTcg(supabase, id);
  if (error || !data) return { data: null, error: 'TCG not found', meta: null };
  return { data: { success: true }, error: null, meta: null };
}

export async function listFormats(supabase: ReturnType<typeof createSecretClient>, tcgId: string) {
  const data = await findFormatsByTcg(supabase, tcgId);
  return { data, error: null, meta: null };
}

export async function createFormat(
  supabase: ReturnType<typeof createSecretClient>,
  tcgId: string,
  body: unknown,
) {
  const parsed = CreateFormatSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }
  const { data, error } = await insertFormat(supabase, {
    ...(parsed.data as Record<string, unknown>),
    tcg_id: tcgId,
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: FormatSchema.parse(data!), error: null, meta: null };
}

export async function editFormat(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  body: unknown,
) {
  const parsed = UpdateFormatSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }
  const { data, error } = await updateFormat(supabase, id, parsed.data as Record<string, unknown>);
  if (error || !data) return { data: null, error: 'Format not found', meta: null };
  return { data: FormatSchema.parse(data), error: null, meta: null };
}

export async function removeFormat(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await softDeleteFormat(supabase, id);
  if (error || !data) return { data: null, error: 'Format not found', meta: null };
  return { data: { success: true }, error: null, meta: null };
}
