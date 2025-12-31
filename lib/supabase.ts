
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxjsypwqzhfspgthkfdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4anN5cHdxemhmc3BndGhrZmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNDI2MzcsImV4cCI6MjA4MjYxODYzN30.f9IyPOu0VESnb6HIgHlg9I7ibSxBCQhhUj0wD2suV7E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
