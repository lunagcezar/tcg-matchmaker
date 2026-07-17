import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.QCLI_SUPABASE_URL;
const supabaseKey = import.meta.env.QCLI_SUPABASE_PUBLISHABLE_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
