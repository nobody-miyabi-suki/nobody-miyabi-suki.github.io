async function registerUser(email, password, username) {
    const cleanEmail = String(email).trim();
    const cleanUsername = String(username).trim();

    if (!cleanEmail || !password || !cleanUsername) {
        throw new Error("Email, password, and username are required.");
    }

    if (cleanUsername.length < 3) {
        throw new Error("Username must be at least 3 characters.");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
            data: {
                username: cleanUsername
            }
        }
    });

    if (error) {
        throw error;
    }

    return data;
}

async function loginUser(email, password) {
    const cleanEmail = String(email).trim();

    if (!cleanEmail || !password) {
        throw new Error("Email and password are required.");
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password
    });

    if (error) {
        throw error;
    }

    return data;
}

async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        throw error;
    }
}

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    return user;
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth event:", event);
    console.log("Session:", session);
});