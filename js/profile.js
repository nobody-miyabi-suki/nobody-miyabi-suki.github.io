const supabaseClient = window.supabaseClient;

const DEFAULT_AVATAR = '/img/icons/default-avatar.png';

let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();

    const avatarInput = document.getElementById('avatarInput');
    const logoutBtn = document.getElementById('logoutBtn');

    avatarInput.addEventListener('change', handleAvatarUpload);
    logoutBtn.addEventListener('click', handleLogout);
});


async function loadProfile() {
    try {
        const {
            data: { user },
            error: sessionError
        } = await supabaseClient.auth.getUser();

        if (sessionError || !user) {
            window.location.href = '/auth/login.html';
            return;
        }

        currentUser = user;

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id, username, avatar_url, bio, created_at')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            showStatus('Could not load profile.', 'error');
            return;
        }

        currentProfile = profile;

        renderProfile(profile, user);

    } catch (error) {
        console.error('Load profile error:', error);
        showStatus('Something went wrong.', 'error');
    }
}


function renderProfile(profile, user) {
    const username = profile.username || 'Anonymous';
    const email = user.email || 'No email';
    const bio = profile.bio && profile.bio.trim()
        ? profile.bio
        : 'No bio yet.';

    const avatar = profile.avatar_url || DEFAULT_AVATAR;

    document.getElementById('profileAvatar').src = avatar;

    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = email;

    document.getElementById('profileBio').textContent = bio;

    document.getElementById('infoUsername').textContent = username;
    document.getElementById('infoEmail').textContent = email;

    document.getElementById('profileJoined').textContent =
        formatDate(profile.created_at);
}


function formatDate(date) {
    if (!date) {
        return 'Unknown';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Unknown';
    }

    return parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}


async function handleAvatarUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    clearStatus();

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    const maxSize = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        showStatus(
            'Only JPG, PNG and WebP images are allowed.',
            'error'
        );

        event.target.value = '';
        return;
    }

    if (file.size > maxSize) {
        showStatus(
            'Avatar must be smaller than 2 MB.',
            'error'
        );

        event.target.value = '';
        return;
    }

    if (!currentUser) {
        showStatus(
            'You must be logged in.',
            'error'
        );

        return;
    }

    const extension = getExtension(file.type);

    if (!extension) {
        showStatus(
            'Invalid image format.',
            'error'
        );

        return;
    }

    const filePath = `${currentUser.id}/avatar-${Date.now()}.${extension}`;

    showStatus('Uploading avatar...');

    try {

        const { error: uploadError } = await supabaseClient
            .storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type
            });

        if (uploadError) {
            console.error('Avatar upload error:', uploadError);

            showStatus(
                uploadError.message || 'Avatar upload failed.',
                'error'
            );

            return;
        }

        const {
            data: publicData
        } = supabaseClient
            .storage
            .from('avatars')
            .getPublicUrl(filePath);

        const publicUrl = publicData.publicUrl;

        const finalUrl = `${publicUrl}?t=${Date.now()}`;

        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
                avatar_url: finalUrl
            })
            .eq('id', currentUser.id);

        if (updateError) {
            console.error(
                'Profile avatar update error:',
                updateError
            );

            showStatus(
                'Avatar uploaded, but profile update failed.',
                'error'
            );

            return;
        }

        document.getElementById('profileAvatar').src = finalUrl;

        currentProfile.avatar_url = finalUrl;

        showStatus(
            'Avatar updated successfully.',
            'success'
        );

    } catch (error) {
        console.error('Avatar upload exception:', error);

        showStatus(
            'Something went wrong while uploading.',
            'error'
        );

    } finally {
        event.target.value = '';
    }
}


function getExtension(mimeType) {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';

        case 'image/png':
            return 'png';

        case 'image/webp':
            return 'webp';

        default:
            return null;
    }
}


async function handleLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Logging out...';

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Logout error:', error);

        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Logout';

        showStatus(
            error.message || 'Logout failed.',
            'error'
        );

        return;
    }

    window.location.href = '/';
}


function showStatus(message, type = '') {
    const status = document.getElementById('uploadStatus');

    status.textContent = message;
    status.className = 'upload-status';

    if (type) {
        status.classList.add(type);
    }
}


function clearStatus() {
    const status = document.getElementById('uploadStatus');

    status.textContent = '';
    status.className = 'upload-status';
}