const SUPABASE_URL = 'https://cszwzywexcfczphjfffz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_c9_F0IXyQWG48_tzu_iP9w_peSwZzIL';

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log('Supabase initialized:', window.supabaseClient);