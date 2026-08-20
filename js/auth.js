async function registerUser(email, password, username) {
    email = email.trim().toLowerCase();
    username = username.trim();

    if (!email || !password || !username) {
        return {
            success: false,
            message: 'Please fill in all fields.'
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: 'Password must be at least 6 characters.'
        };
    }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        console.error('Register error:', error);

        return {
            success: false,
            message: error.message
        };
    }

    console.log('Register success:', data);

    return {
        success: true,
        user: data.user,
        session: data.session
    };
}


async function loginUser(email, password) {
    email = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error('Login error:', error);

        return {
            success: false,
            message: error.message
        };
    }

    console.log('Login success:', data);

    return {
        success: true,
        user: data.user,
        session: data.session
    };
}


async function logoutUser() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
        return false;
    }

    return true;
}


async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error('Get user error:', error);
        return null;
    }

    return user;
}


async function getCurrentSession() {
    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        console.error('Get session error:', error);
        return null;
    }

    return session;
}


supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    console.log('Session:', session);
});