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
    try {
      const j = await apiGet('/api/auth/onboarding');
      return !(j.data as Record<string, unknown>)?.hasAdmin;
    } catch {
      return false;
    }
  }

  return { user, loading, restoreSession, signUp, signIn, signOut, checkOnboarding };
});
