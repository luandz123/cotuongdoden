import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vugouiksrmrfvwioghpi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z291aWtzcm1yZnZ3aW9naHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDQ4ODgsImV4cCI6MjA2NDY4MDg4OH0.2KN3zrIq1qF2dtBJcg-m1MvlOfVl8zb6ndaEwbOBoJo';

export const supabase = createClient(supabaseUrl, supabaseKey);
