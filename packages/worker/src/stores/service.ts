import {
  CreateStoreSchema,
  StoreSchema,
  StoreMembershipSchema,
  STORE_MEMBERSHIP_ROLES,
} from '@tcg/shared';
import type { StoreMembershipRole } from '@tcg/shared';
import type { createSecretClient } from '../db/client.js';
import { validate } from '../lib/validation.js';
import {
  findStoresPaginated,
  findStoreById,
  insertStore,
  updateStore,
  deleteStoreById,
  findStoreMembership,
  findStoreMembers,
  insertStoreMembership,
  deleteStoreMembership,
  countOwnerMemberships,
} from './repository.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function encodeCursor(name: string, id: string): string {
  return btoa(JSON.stringify({ name, id }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeCursor(raw: string): { name: string; id: string } {
  const decoded = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded) as { name: string; id: string };
}

export async function listStores(
  supabase: ReturnType<typeof createSecretClient>,
  rawLimit: string | undefined,
  rawCursor: string | undefined,
) {
  const limit = Math.min(Number.parseInt(rawLimit ?? '50', 10), 100);
  const cursor = rawCursor ? decodeCursor(rawCursor) : null;

  const rows = await findStoresPaginated(supabase, { cursor, limit: limit + 1 });
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const last = rows[rows.length - 1] as { name: string; id: string } | undefined;
  const nextCursor = last ? encodeCursor(last.name, last.id) : null;

  return {
    data: rows,
    error: null,
    meta: { next_cursor: nextCursor, has_more: hasMore },
  };
}

export async function getStore(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const data = await findStoreById(supabase, id);
  if (!data) return { data: null, error: 'Store not found', meta: null };
  return { data: StoreSchema.parse(data), error: null, meta: null };
}

export async function createStore(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: unknown,
) {
  const parsed = validate(CreateStoreSchema, body);
  if (!parsed.success) {
    return { data: null, error: parsed.error, meta: null };
  }

  const { data: store, error: insertError } = await insertStore(supabase, {
    ...(parsed.data as Record<string, unknown>),
    slug: slugify(parsed.data.name),
    created_by_user_id: userId,
  });

  if (insertError) return { data: null, error: insertError.message, meta: null };

  const { error: memberError } = await insertStoreMembership(supabase, {
    store_id: store!.id,
    user_id: userId,
    role: STORE_MEMBERSHIP_ROLES[0],
  });

  if (memberError) {
    await supabase.from('game_stores').delete().eq('id', store!.id);
    return { data: null, error: 'Failed to create store membership', meta: null };
  }

  return { data: StoreSchema.parse(store!), error: null, meta: null };
}

export async function updateStoreById(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  storeId: string,
  body: Record<string, unknown>,
) {
  const membership = await findStoreMembership(supabase, storeId, userId);
  if (
    !membership ||
    (membership.role !== STORE_MEMBERSHIP_ROLES[0] && membership.role !== STORE_MEMBERSHIP_ROLES[1])
  ) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const allowedFields: Record<string, unknown> = {};
  if (body.name) allowedFields.name = body.name;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.address) allowedFields.address = body.address;
  if (body.phone !== undefined) allowedFields.phone = body.phone;
  if (body.website !== undefined) allowedFields.website = body.website;
  if (body.logo_path !== undefined) allowedFields.logo_path = body.logo_path;

  const { data, error } = await updateStore(supabase, storeId, {
    ...allowedFields,
    updated_at: new Date().toISOString(),
  });
  if (error || !data) return { data: null, error: 'Store not found', meta: null };
  return { data: StoreSchema.parse(data!), error: null, meta: null };
}

export async function removeStore(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await deleteStoreById(supabase, id);
  if (error || !data) return { data: null, error: 'Store not found', meta: null };
  return { data: { success: true }, error: null, meta: null };
}

export async function verifyStore(supabase: ReturnType<typeof createSecretClient>, id: string) {
  const { data, error } = await updateStore(supabase, id, {
    is_verified: true,
    updated_at: new Date().toISOString(),
  });
  if (error || !data) return { data: null, error: 'Store not found', meta: null };
  return { data: StoreSchema.parse(data!), error: null, meta: null };
}

export async function suspendStore(
  supabase: ReturnType<typeof createSecretClient>,
  id: string,
  reason: string | undefined,
) {
  const { data, error } = await updateStore(supabase, id, {
    status: 'suspended',
    suspended_at: new Date().toISOString(),
    suspension_reason: reason ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error || !data) return { data: null, error: 'Store not found', meta: null };
  return { data: StoreSchema.parse(data!), error: null, meta: null };
}

export async function getMembers(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  storeId: string,
) {
  const membership = await findStoreMembership(supabase, storeId, userId);
  if (!membership) return { data: null, error: 'Forbidden', meta: null };
  const data = await findStoreMembers(supabase, storeId);
  return { data, error: null, meta: null };
}

export async function addMember(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  storeId: string,
  body: { user_id: string; role?: string },
) {
  const membership = await findStoreMembership(supabase, storeId, userId);
  if (!membership) return { data: null, error: 'Forbidden', meta: null };

  const targetRole = (body.role ?? STORE_MEMBERSHIP_ROLES[2]) as StoreMembershipRole;
  if (
    membership.role === STORE_MEMBERSHIP_ROLES[1] &&
    (targetRole === STORE_MEMBERSHIP_ROLES[0] || targetRole === STORE_MEMBERSHIP_ROLES[1])
  ) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  const { data, error } = await insertStoreMembership(supabase, {
    store_id: storeId,
    user_id: body.user_id,
    role: targetRole,
  });
  if (error) return { data: null, error: error.message, meta: null };
  return { data: StoreMembershipSchema.parse(data!), error: null, meta: null };
}

export async function removeMember(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  storeId: string,
  memberUserId: string,
) {
  const membership = await findStoreMembership(supabase, storeId, userId);
  if (!membership || membership.role !== STORE_MEMBERSHIP_ROLES[0]) {
    return { data: null, error: 'Forbidden', meta: null };
  }

  if (memberUserId === userId) {
    const ownerCount = await countOwnerMemberships(supabase, storeId);
    if (ownerCount === 1) {
      return { data: null, error: 'Cannot remove the last owner', meta: null };
    }
  }

  const { error } = await deleteStoreMembership(supabase, storeId, memberUserId);
  if (error) return { data: null, error: error.message, meta: null };
  return { data: { success: true }, error: null, meta: null };
}
