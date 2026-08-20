const supabaseClient = window.supabaseClient;

const AVATAR_BUCKET = 'avatars';
const DEFAULT_AVATAR = '/img/icons/default-avatar.png';
const MAX_AVATAR_SIZE = 9 * 1024 * 1024;

const ALLOWED_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

let currentUser = null;
let currentProfile = null;


document.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) {
        console.error('Supabase client not found.');
        showUploadStatus(
            'Supabase is not initialized.',
            'error'
        );
        return;
    }

    const avatarInput = document.getElementById('avatarInput');
    const logoutBtn = document.getElementById('logoutBtn');

    if (avatarInput) {
        avatarInput.addEventListener(
            'change',
            handleAvatarUpload
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            'click',
            handleLogout
        );
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
        } = await supabaseClient.auth.getUser();

        if (error) {
            console.error(
                'Get user error:',
                error
            );

            showUploadStatus(
                'Failed to get user information.',
                'error'
            );

            return;
        }

        if (!user) {
            window.location.href =
                '/auth/login.html';

            return;
        }

        currentUser = user;

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error(
                'Profile error:',
                profileError
            );

            showUploadStatus(
                'Failed to load profile.',
                'error'
            );

            return;
        }

        currentProfile = profile;

        renderProfile(
            user,
            profile
        );

    } catch (error) {
        console.error(
            'Load profile error:',
            error
        );

        showUploadStatus(
            'Something went wrong while loading your profile.',
            'error'
        );
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

    if (!ALLOWED_TYPES[file.type]) {
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
        ALLOWED_TYPES[file.type];

    const newPath =
        `${currentUser.id}/avatar.${extension}`;

    showUploadStatus(
        'Uploading avatar...',
        'loading'
    );

    try {
        /*
         * Upload new avatar.
         *
         * The original file format is preserved.
         *
         * Example:
         * image/jpeg -> avatar.jpg
         * image/png  -> avatar.png
         * image/webp -> avatar.webp
         */
        const {
            error: uploadError
        } = await supabaseClient
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
         * Keep the newly uploaded file.
         */
        const extensions = [
            'jpg',
            'png',
            'webp'
        ];

        const oldFiles = extensions
            .filter(ext => ext !== extension)
            .map(
                ext =>
                    `${currentUser.id}/avatar.${ext}`
            );

        if (oldFiles.length > 0) {
            const {
                error: deleteError
            } = await supabaseClient
                .storage
                .from(AVATAR_BUCKET)
                .remove(oldFiles);

            if (deleteError) {
                console.warn(
                    'Old avatar cleanup warning:',
                    deleteError
                );
            }
        }


        /*
         * Get public URL.
         */
        const {
            data: publicData
        } = supabaseClient
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
         */
        const avatarUrl =
            `${publicData.publicUrl}?v=${Date.now()}`;


        /*
         * Save URL in profiles table.
         */
        const {
            error: profileError
        } = await supabaseClient
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
         * Update local state.
         */
        currentProfile = {
            ...currentProfile,
            avatar_url: avatarUrl
        };


        /*
         * Update avatar immediately.
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


async function handleLogout() {
    const logoutBtn =
        document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent =
            'Logging out...';
    }

    try {
        const {
            error
        } = await supabaseClient
            .auth
            .signOut();

        if (error) {
            console.error(
                'Logout error:',
                error
            );

            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.textContent =
                    'Logout';
            }

            showUploadStatus(
                error.message ||
                'Logout failed.',
                'error'
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
            logoutBtn.textContent =
                'Logout';
        }

        showUploadStatus(
            'Logout failed. Please try again.',
            'error'
        );
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