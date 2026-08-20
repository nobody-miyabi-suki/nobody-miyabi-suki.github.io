async function registerUser(email, password, username) {
    email = email.trim().toLowerCase();
    username = username.trim();

    if (!email || !password || !username) {
        return {
            success: false,
            message: 'Please fill in all fields.'
        };
    }

    if (username.length < 3) {
        return {
            success: false,
            message: 'Username must be at least 3 characters.'
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: 'Password must be at least 6 characters.'
        };
    }

    const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                username
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

    if (!email || !password) {
        return {
            success: false,
            message: 'Please enter your email and password.'
        };
    }

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
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
    const { error } = await window.supabaseClient.auth.signOut();

    if (error) {
        console.error('Logout error:', error);

        return {
            success: false,
            message: error.message
        };
    }

    console.log('Logout success.');

    return {
        success: true
    };
}


async function getCurrentSession() {
    const { data, error } = await window.supabaseClient.auth.getSession();

    if (error) {
        console.error('Session error:', error);
        return null;
    }

    console.log('Session:', data.session);

    return data.session;
}


window.supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    console.log('Session:', session);
});


document.addEventListener('DOMContentLoaded', async () => {
    await getCurrentSession();
});