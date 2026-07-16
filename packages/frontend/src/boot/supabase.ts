import { defineBoot } from '#q-app';
import { createClient } from '@supabase/supabase-js';

export default defineBoot(({ app }) => {
  const supabaseUrl = import.meta.env.QCLI_SUPABASE_URL;
  const supabaseKey = import.meta.env.QCLI_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured. Auth will not work.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  app.provide('supabase', supabase);
});
