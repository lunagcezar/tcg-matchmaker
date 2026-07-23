import {
  SignupSchema,
  ProfileUpdateSchema,
  OnboardingStatusSchema,
  UserResponseSchema,
} from '@tcg/shared';
import type { createSecretClient } from '../db/client.js';
import {
  countAdminUsers,
  insertUser,
  insertConsent,
  findUserById,
  resolveUserByIdentifier,
  findUserByUsername,
  updateUser,
  findUserConsents,
  anonymizeUser,
} from './repository.js';

export async function checkOnboarding(supabase: ReturnType<typeof createSecretClient>) {
  const count = await countAdminUsers(supabase);
  return {
    data: OnboardingStatusSchema.parse({ hasAdmin: count > 0 }),
    error: null,
    meta: null,
  };
}

export async function createFirstAdmin(
  supabase: ReturnType<typeof createSecretClient>,
  body: unknown,
) {
  const count = await countAdminUsers(supabase);
  if (count > 0) return { data: null, error: 'Admin already exists', meta: null };

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { data: null, error: authError?.message ?? 'Failed to create user', meta: null };
  }

  const { error: insertError } = await insertUser(supabase, {
    id: authData.user.id,
    email: parsed.data.email,
    username: parsed.data.username,
    role: 'admin',
  });

  if (insertError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return {
      data: null,
      error: `Failed to create user profile: ${insertError.message}`,
      meta: null,
    };
  }

  await insertConsent(supabase, {
    user_id: authData.user.id,
    policy_version: '1.0',
  });

  const userRecord = await findUserById(supabase, authData.user.id);
  return {
    data: userRecord ? UserResponseSchema.parse(userRecord) : null,
    error: null,
    meta: null,
  };
}

export async function getProfile(supabase: ReturnType<typeof createSecretClient>, userId: string) {
  const userRecord = await findUserById(supabase, userId);
  if (!userRecord) return { data: null, error: 'User not found', meta: null };
  return { data: UserResponseSchema.parse(userRecord), error: null, meta: null };
}

export async function resolveIdentifier(
  supabase: ReturnType<typeof createSecretClient>,
  identifier: string,
) {
  const data = await resolveUserByIdentifier(supabase, identifier);
  if (!data) return { data: null, error: 'User not found', meta: null };
  return { data: { email: data.email, username: data.username }, error: null, meta: null };
}

export async function updateProfile(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  body: unknown,
) {
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: `Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
      meta: null,
    };
  }

  const updateData: Record<string, string> = { updated_at: new Date().toISOString() };
  if (parsed.data.username) {
    const existing = await findUserByUsername(supabase, parsed.data.username, userId);
    if (existing) return { data: null, error: 'Username already taken', meta: null };
    updateData.username = parsed.data.username;
  }

  const { error: updateError } = await updateUser(supabase, userId, updateData);
  if (updateError) return { data: null, error: 'Failed to update profile', meta: null };

  const userRecord = await findUserById(supabase, userId);
  return {
    data: userRecord ? UserResponseSchema.parse(userRecord) : null,
    error: null,
    meta: null,
  };
}

export async function suspendAccount(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const { error } = await updateUser(supabase, userId, {
    suspended_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { data: null, error: 'Failed to suspend account', meta: null };
  return { data: { success: true }, error: null, meta: null };
}

export async function exportUserData(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
) {
  const userRecord = await findUserById(supabase, userId);
  const consents = await findUserConsents(supabase, userId);
  return {
    data: { profile: userRecord, consents },
    error: null,
    meta: null,
  };
}

export async function deleteAccount(
  supabase: ReturnType<typeof createSecretClient>,
  userId: string,
  userRole: string,
) {
  if (userRole === 'admin') {
    const count = await countAdminUsers(supabase);
    if (count === 1) {
      return {
        data: null,
        error: 'Promote another admin before deleting your account',
        meta: null,
      };
    }
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) return { data: null, error: 'Failed to delete account', meta: null };

  const { data: deletedUsers, error: anonymizeError } = await anonymizeUser(
    supabase,
    userId,
    `deleted-${userId.slice(0, 8)}@deleted.local`,
  );

  if (anonymizeError || !deletedUsers || deletedUsers.length === 0) {
    return { data: null, error: 'Failed to anonymize profile', meta: null };
  }

  return { data: { success: true }, error: null, meta: null };
}
