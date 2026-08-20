const client = window.supabaseClient;

async function loadProfile() {
    if (!client) {
        console.error('Supabase client not found.');
        return;
    }

    const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

    if (sessionError) {
        console.error('Session error:', sessionError);
        return;
    }

    const session = sessionData.session;

    if (!session) {
        window.location.href = '/auth/login.html';
        return;
    }

    const user = session.user;

    console.log('Logged in user:', user);

    const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('username, avatar_url, bio, created_at')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Profile error:', profileError);
        return;
    }

    console.log('Profile:', profile);

    document.getElementById('username').textContent =
        profile.username || 'User';

    document.getElementById('email').textContent =
        user.email || '';

    document.getElementById('bio').textContent =
        profile.bio || 'No bio yet.';

    document.getElementById('infoUsername').textContent =
        profile.username || '-';

    document.getElementById('infoEmail').textContent =
        user.email || '-';

    if (profile.created_at) {
        const date = new Date(profile.created_at);

        document.getElementById('createdAt').textContent =
            date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
    }

    const avatar = document.getElementById('avatar');

    avatar.src =
        profile.avatar_url || '/img/icons/default-avatar.png';

    avatar.onerror = function() {
        this.src = '/img/icons/default-avatar.png';
    };
}


async function logout() {
    const { error } = await client.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
        return;
    }

    window.location.href = '/auth/login.html';
}


document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();

    document
        .getElementById('logoutBtn')
        .addEventListener('click', logout);
});