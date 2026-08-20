const client = window.supabaseClient;

let currentUser = null;


async function loadProfile() {
    if (!client) {
        console.error('Supabase client not found.');
        return;
    }

    const { data: userData, error: userError } =
        await client.auth.getUser();

    if (userError || !userData.user) {
        window.location.href = '/auth/login.html';
        return;
    }

    currentUser = userData.user;

    console.log('Logged in user:', currentUser);

    const { data: profile, error: profileError } =
        await client
            .from('profiles')
            .select('username, avatar_url, bio, created_at')
            .eq('id', currentUser.id)
            .single();

    if (profileError) {
        console.error('Profile error:', profileError);
        return;
    }

    console.log('Profile:', profile);

    document.getElementById('username').textContent =
        profile.username || 'User';

    document.getElementById('email').textContent =
        currentUser.email || '';

    document.getElementById('bio').textContent =
        profile.bio || 'No bio yet.';

    document.getElementById('infoUsername').textContent =
        profile.username || '-';

    document.getElementById('infoEmail').textContent =
        currentUser.email || '-';

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


    document.getElementById('editUsername').value =
        profile.username || '';

    document.getElementById('editBio').value =
        profile.bio || '';
}


async function saveProfile() {
    if (!currentUser) {
        return;
    }

    const username =
        document.getElementById('editUsername').value.trim();

    const bio =
        document.getElementById('editBio').value.trim();

    const message =
        document.getElementById('profileMessage');

    if (username.length < 3) {
        message.textContent =
            'Username must be at least 3 characters.';

        return;
    }

    if (username.length > 30) {
        message.textContent =
            'Username must be 30 characters or less.';

        return;
    }

    if (bio.length > 160) {
        message.textContent =
            'Bio must be 160 characters or less.';

        return;
    }

    message.textContent = 'Saving...';

    const { error } = await client
        .from('profiles')
        .update({
            username: username,
            bio: bio,
            updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

    if (error) {
        console.error('Update profile error:', error);

        message.textContent =
            'Failed to update profile.';

        return;
    }

    document.getElementById('username').textContent =
        username;

    document.getElementById('bio').textContent =
        bio || 'No bio yet.';

    document.getElementById('infoUsername').textContent =
        username;

    message.textContent =
        'Profile updated successfully.';

    console.log('Profile updated successfully.');
}


async function logout() {
    const { error } =
        await client.auth.signOut();

    if (error) {
        console.error('Logout error:', error);
        return;
    }

    window.location.href =
        '/auth/login.html';
}


document.addEventListener('DOMContentLoaded', async () => {

    await loadProfile();

    document
        .getElementById('saveProfileBtn')
        .addEventListener('click', saveProfile);

    document
        .getElementById('logoutBtn')
        .addEventListener('click', logout);

});