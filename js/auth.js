async function registerUser(email, password, username) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        throw error;
    }

    if (!data.user) {
        throw new Error("User was not created.");
    }

    const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
            id: data.user.id,
            username: username
        });

    if (profileError) {
        throw profileError;
    }

    return data.user;
}

async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data.user;
}

async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        throw error;
    }
}

async function getCurrentUser() {
    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    return user;
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event);
    console.log("Session:", session);
});