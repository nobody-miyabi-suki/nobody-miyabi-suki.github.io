const SUPABASE_URL = "https://cszwzywexcfczphjfffz.supabase.co";
const SUPABASE_KEY = "sb_publishable_c9_F0IXyQWG48_tzu_iP9w_peSwZzIL";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testSupabase() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*");

    console.log("Supabase test:", {
        data,
        error
    });
}

testSupabase();