import { defineBoot } from '#q-app';
import { supabase } from '@/lib/supabase';

export default defineBoot(({ app }) => {
  if (!supabase) {
    console.warn('Supabase credentials not configured. Auth will not work.');
    return;
  }

  app.provide('supabase', supabase);
});
