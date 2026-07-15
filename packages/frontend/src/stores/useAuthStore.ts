import { defineStore } from 'pinia';
import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { apiGet } from '@/composables/useApi';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const onboardingRequired = ref<boolean | null>(null);

  async function restoreSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      user.value = data.session.user;
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
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    user.value = null;
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

  return {
    user,
    loading,
    onboardingRequired,
    restoreSession,
    signUp,
    signIn,
    signOut,
    checkOnboarding,
  };
});
