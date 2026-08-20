const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const AVATAR_BUCKET = 'avatars';
const DEFAULT_AVATAR = '/img/icons/default-avatar.png';

let currentUser = null;
let currentProfile = null;


document.addEventListener('DOMContentLoaded', async () => {
    const avatarInput = document.getElementById('avatarInput');
    const logoutBtn = document.getElementById('logoutBtn');

    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    await loadProfile();
});


async function loadProfile() {
    try {
        const {
            data: {
                user
            },
            error
        } = await supabase.auth.getUser();

        if (error) {
            console.error('Get user error:', error);
            showError('Failed to get user information.');
            return;
        }

        if (!user) {
            window.location.href = '/auth/login.html';
            return;
        }

        currentUser = user;

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile error:', profileError);
            showError('Failed to load profile.');
            return;
        }

        currentProfile = profile;

        renderProfile(user, profile);

    } catch (error) {
        console.error('Load profile error:', error);
        showError('Something went wrong while loading your profile.');
    }
}


function renderProfile(user, profile) {
    const username =
        profile?.username ||
        user.user_metadata?.username ||
        'Unknown User';

    const email =
        user.email ||
        'No email';

    const bio =
        profile?.bio ||
        'No bio yet.';

    const avatarUrl =
        profile?.avatar_url ||
        DEFAULT_AVATAR;

    const joinedDate =
        profile?.created_at ||
        user.created_at;

    setText(
        'profileUsername',
        username
    );

    setText(
        'profileEmail',
        email
    );

    setText(
        'infoUsername',
        username
    );

    setText(
        'infoEmail',
        email
    );

    setText(
        'profileBio',
        bio
    );

    setText(
        'profileJoined',
        formatDate(joinedDate)
    );

    const avatar =
        document.getElementById('profileAvatar');

    if (avatar) {
        avatar.src = avatarUrl;

        avatar.onerror = () => {
            avatar.src = DEFAULT_AVATAR;
        };
    }
}


async function handleAvatarUpload(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    event.target.value = '';

    if (!currentUser) {
        showUploadStatus(
            'You must be logged in.',
            'error'
        );

        return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        showUploadStatus(
            'Only JPG, PNG and WebP images are allowed.',
            'error'
        );

        return;
    }

    if (file.size >= MAX_AVATAR_SIZE) {
        showUploadStatus(
            'Avatar must be smaller than 9 MB.',
            'error'
        );

        return;
    }

    const extension =
        getExtension(file.type);

    if (!extension) {
        showUploadStatus(
            'Unsupported image format.',
            'error'
        );

        return;
    }

    const newPath =
        `${currentUser.id}/avatar.${extension}`;

    showUploadStatus(
        'Uploading avatar...',
        'loading'
    );

    try {
        /*
         * Find which avatar files currently exist.
         * This lets us remove the old format if necessary.
         */
        const oldExtensions = [
            'jpg',
            'png',
            'webp'
        ];

        const oldPaths = oldExtensions.map(
            oldExtension =>
                `${currentUser.id}/avatar.${oldExtension}`
        );

        /*
         * Upload the new file.
         *
         * upsert: true means:
         * if the exact same path already exists,
         * replace it instead of creating a duplicate.
         */
        const {
            error: uploadError
        } = await supabase
            .storage
            .from(AVATAR_BUCKET)
            .upload(
                newPath,
                file,
                {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                }
            );

        if (uploadError) {
            console.error(
                'Avatar upload error:',
                uploadError
            );

            showUploadStatus(
                uploadError.message ||
                'Avatar upload failed.',
                'error'
            );

            return;
        }

        /*
         * Remove old avatar formats.
         *
         * We don't remove the newly uploaded file.
         */
        const filesToDelete =
            oldPaths.filter(
                path => path !== newPath
            );

        if (filesToDelete.length > 0) {
            const {
                error: deleteError
            } = await supabase
                .storage
                .from(AVATAR_BUCKET)
                .remove(filesToDelete);

            if (deleteError) {
                console.warn(
                    'Old avatar cleanup warning:',
                    deleteError
                );
            }
        }

        /*
         * Get public URL.
         *
         * This requires the avatars bucket
         * to be public.
         */
        const {
            data: publicData
        } = supabase
            .storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(newPath);

        if (!publicData?.publicUrl) {
            showUploadStatus(
                'Avatar uploaded, but URL could not be generated.',
                'error'
            );

            return;
        }

        /*
         * Cache buster.
         *
         * Without this, the browser/CDN can keep
         * showing the previous avatar after overwrite.
         */
        const avatarUrl =
            `${publicData.publicUrl}?v=${Date.now()}`;

        /*
         * Save avatar URL inside profiles table.
         */
        const {
            error: profileError
        } = await supabase
            .from('profiles')
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            })
            .eq(
                'id',
                currentUser.id
            );

        if (profileError) {
            console.error(
                'Profile update error:',
                profileError
            );

            showUploadStatus(
                'Avatar uploaded, but profile update failed.',
                'error'
            );

            return;
        }

        /*
         * Update local profile state.
         */
        currentProfile = {
            ...currentProfile,
            avatar_url: avatarUrl
        };

        /*
         * Update avatar immediately on the page.
         */
        const avatar =
            document.getElementById('profileAvatar');

        if (avatar) {
            avatar.src = avatarUrl;
        }

        showUploadStatus(
            'Avatar updated successfully!',
            'success'
        );

    } catch (error) {
        console.error(
            'Avatar upload exception:',
            error
        );

        showUploadStatus(
            'Avatar upload failed. Please try again.',
            'error'
        );
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


function formatDate(dateString) {
    if (!dateString) {
        return 'Unknown';
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    );
}


async function handleLogout() {
    const logoutBtn =
        document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out...';
    }

    try {
        const {
            error
        } = await supabase.auth.signOut();

        if (error) {
            console.error(
                'Logout error:',
                error
            );

            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.textContent = 'Logout';
            }

            showError(
                error.message ||
                'Logout failed.'
            );

            return;
        }

        window.location.href =
            '/auth/login.html';

    } catch (error) {
        console.error(
            'Logout exception:',
            error
        );

        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = 'Logout';
        }

        showError(
            'Logout failed. Please try again.'
        );
    }
}


function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function showUploadStatus(message, type) {
    const element =
        document.getElementById('uploadStatus');

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className =
        `upload-status ${type}`;

    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className =
                'upload-status';
        }, 3000);
    }
}


function showError(message) {
    console.error(
        'Profile error:',
        message
    );

    showUploadStatus(
        message,
        'error'
    );
}