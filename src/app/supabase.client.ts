import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrswhavilzipwnrtmrei.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc3doYXZpbHppcHducnRtcmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1OTg2MzMsImV4cCI6MjA3MDE3NDYzM30.8zBkYq1q3b8HkQWEOJhlGP3h4k1_JNhUt12Y_KU4vF0';

export const supabase = createClient(supabaseUrl, supabaseKey);
