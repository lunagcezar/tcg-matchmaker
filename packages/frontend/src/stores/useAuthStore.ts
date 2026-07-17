import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/composables/useApi';

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  role: 'player' | 'organizer' | 'admin';
  avatar_path: string | null;
  created_at: string;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const profile = ref<UserProfile | null>(null);
  const loading = ref(false);
  const onboardingRequired = ref<boolean | null>(null);

  async function restoreSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      user.value = data.session.user;
      await fetchProfile();
      if (!profile.value) {
        await supabase.auth.signOut();
        user.value = null;
      }
    }
  }

  async function fetchProfile() {
    if (!supabase || !user.value) {
      profile.value = null;
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      profile.value = null;
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.QCLI_API_URL || 'http://localhost:8787'}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        profile.value = null;
        return;
      }
      const json = (await res.json()) as { data: UserProfile | null; error: string | null };
      profile.value = json.data ?? null;
    } catch {
      profile.value = null;
    }
  }

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured');
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured');
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      user.value = data.user;
      await fetchProfile();
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    user.value = null;
    profile.value = null;
  }

  async function updatePassword(newPassword: string): Promise<{ error?: string }> {
    if (!supabase) return { error: 'Supabase not configured' };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Failed to update password' };
    }
  }

  async function checkOnboarding(): Promise<boolean> {
    if (onboardingRequired.value !== null) return onboardingRequired.value;
    try {
      const j = await apiGet('/api/auth/onboarding');
      onboardingRequired.value = !(j.data as Record<string, unknown>)?.hasAdmin;
      return onboardingRequired.value;
    } catch {
      onboardingRequired.value = false;
      return false;
    }
  }

  watch(
    () => user.value?.id,
    () => {
      if (!user.value) profile.value = null;
    },
  );

  return {
    user,
    profile,
    loading,
    onboardingRequired,
    restoreSession,
    fetchProfile,
    signUp,
    signIn,
    signOut,
    updatePassword,
    checkOnboarding,
  };
});
