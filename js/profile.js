const supabaseClient = window.supabaseClient;

const AVATAR_BUCKET = 'avatars';
const DEFAULT_AVATAR = '/img/icons/default-avatar.png';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = {
    'image/jpeg':'jpg',
    'image/png':'png',
    'image/webp':'webp'
};

let currentUser = null;
let currentProfile = null;

document.addEventListener('DOMContentLoaded',async() => {
    setupEvents();
    await loadProfile();
});

function setupEvents() {
    const avatarInput = document.getElementById('avatarInput');
    const editBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editProfileForm');
    const bio = document.getElementById('editBio');
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('editModal');

    if(avatarInput) {
        avatarInput.addEventListener('change',handleAvatarUpload);
    }

    if(editBtn) {
        editBtn.addEventListener('click',openEditModal);
    }

    if(closeBtn) {
        closeBtn.addEventListener('click',closeEditModal);
    }

    if(cancelBtn) {
        cancelBtn.addEventListener('click',closeEditModal);
    }

    if(editForm) {
        editForm.addEventListener('submit',saveProfile);
    }

    if(bio) {
        bio.addEventListener('input',updateBioCount);
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click',handleLogout);
    }

    if(modal) {
        modal.addEventListener('click',event => {
            if(event.target === modal) {
                closeEditModal();
            }
        });
    }

    document.addEventListener('keydown',event => {
        if(event.key === 'Escape') {
            closeEditModal();
        }
    });
}

async function loadProfile() {
    try {
        const {
            data:{user},
            error:userError
        } = await supabaseClient.auth.getUser();

        if(userError) {
            console.error('Get user error:',userError);
            showStatus('Failed to load account.','error');
            return;
        }

        if(!user) {
            window.location.href='/auth/login.html';
            return;
        }

        currentUser = user;

        const {
            data:profile,
            error:profileError
        } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id',user.id)
            .single();

        if(profileError) {
            console.error('Profile error:',profileError);
            showStatus('Failed to load profile.','error');
            return;
        }

        currentProfile = profile;
        renderProfile();
    }catch(error) {
        console.error('Load profile error:',error);
        showStatus('Something went wrong.','error');
    }
}

function renderProfile() {
    if(!currentUser || !currentProfile) {
        return;
    }

    const username =
        currentProfile.username ||
        currentUser.user_metadata?.username ||
        'User';

    const email =
        currentUser.email ||
        'No email';

    const bio =
        currentProfile.bio ||
        'No bio yet.';

    const avatar =
        currentProfile.avatar_url ||
        DEFAULT_AVATAR;

    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('infoUsername').textContent = username;
    document.getElementById('infoEmail').textContent = email;
    document.getElementById('profileBio').textContent = bio;

    document.getElementById('profileJoined').textContent =
        formatDate(currentProfile.created_at);

    const avatarElement = document.getElementById('profileAvatar');

    avatarElement.src = avatar;
    avatarElement.alt = `${username} avatar`;

    avatarElement.onerror = () => {
        avatarElement.src = DEFAULT_AVATAR;
    };
}

function openEditModal() {
    const modal = document.getElementById('editModal');

    if(!modal || !currentProfile) {
        return;
    }

    document.getElementById('editUsername').value =
        currentProfile.username || '';

    document.getElementById('editBio').value =
        currentProfile.bio || '';

    updateBioCount();

    modal.classList.add('active');
    document.body.style.overflow='hidden';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');

    if(!modal) {
        return;
    }

    modal.classList.remove('active');
    document.body.style.overflow='';
}

function updateBioCount() {
    const bio = document.getElementById('editBio');
    const counter = document.getElementById('bioCount');

    if(bio && counter) {
        counter.textContent = bio.value.length;
    }
}

async function saveProfile(event) {
    event.preventDefault();

    if(!currentUser) {
        return;
    }

    const username =
        document.getElementById('editUsername').value.trim();

    const bio =
        document.getElementById('editBio').value.trim();

    const saveButton =
        document.getElementById('saveProfileBtn');

    if(username.length < 3) {
        showStatus('Username must be at least 3 characters.','error');
        return;
    }

    if(username.length > 32) {
        showStatus('Username must be 32 characters or less.','error');
        return;
    }

    if(bio.length > 160) {
        showStatus('Bio must be 160 characters or less.','error');
        return;
    }

    saveButton.disabled=true;
    saveButton.textContent='Saving...';

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from('profiles')
            .update({
                username:username,
                bio:bio,
                updated_at:new Date().toISOString()
            })
            .eq('id',currentUser.id)
            .select()
            .single();

        if(error) {
            console.error('Save profile error:',error);

            showStatus(
                error.message || 'Profile update failed.',
                'error'
            );

            return;
        }

        currentProfile = {
            ...currentProfile,
            ...data
        };

        renderProfile();
        closeEditModal();

        showStatus(
            'Profile updated successfully.',
            'success'
        );
    }catch(error) {
        console.error('Save profile exception:',error);
        showStatus('Profile update failed.','error');
    }finally {
        saveButton.disabled=false;
        saveButton.textContent='Save Changes';
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];

    if(!file) {
        return;
    }

    event.target.value='';

    if(!currentUser) {
        showStatus('You must be logged in.','error');
        return;
    }

    if(!ALLOWED_TYPES[file.type]) {
        showStatus(
            'Only JPG, PNG and WebP images are allowed.',
            'error'
        );
        return;
    }

    if(file.size > MAX_AVATAR_SIZE) {
        showStatus(
            'Avatar must be smaller than 2 MB.',
            'error'
        );
        return;
    }

    const extension = ALLOWED_TYPES[file.type];

    const newPath =
        `${currentUser.id}/avatar.${extension}`;

    showStatus('Uploading avatar...','loading');

    try {
        const {
            error:uploadError
        } = await supabaseClient
            .storage
            .from(AVATAR_BUCKET)
            .upload(
                newPath,
                file,
                {
                    cacheControl:'3600',
                    upsert:true,
                    contentType:file.type
                }
            );

        if(uploadError) {
            console.error('Avatar upload error:',uploadError);

            showStatus(
                uploadError.message || 'Avatar upload failed.',
                'error'
            );

            return;
        }

        const extensions = [
            'jpg',
            'png',
            'webp'
        ];

        const oldFiles = extensions
            .filter(ext => ext !== extension)
            .map(ext =>
                `${currentUser.id}/avatar.${ext}`
            );

        if(oldFiles.length) {
            const {
                error:deleteError
            } = await supabaseClient
                .storage
                .from(AVATAR_BUCKET)
                .remove(oldFiles);

            if(deleteError) {
                console.warn(
                    'Old avatar cleanup warning:',
                    deleteError
                );
            }
        }

        const {
            data:publicData
        } = supabaseClient
            .storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(newPath);

        if(!publicData?.publicUrl) {
            showStatus(
                'Avatar uploaded but URL could not be generated.',
                'error'
            );
            return;
        }

        const avatarUrl =
            `${publicData.publicUrl}?v=${Date.now()}`;

        const {
            error:profileError
        } = await supabaseClient
            .from('profiles')
            .update({
                avatar_url:avatarUrl,
                updated_at:new Date().toISOString()
            })
            .eq('id',currentUser.id);

        if(profileError) {
            console.error(
                'Avatar profile update error:',
                profileError
            );

            showStatus(
                'Avatar uploaded but profile update failed.',
                'error'
            );

            return;
        }

        currentProfile = {
            ...currentProfile,
            avatar_url:avatarUrl
        };

        renderProfile();

        showStatus(
            'Avatar updated successfully!',
            'success'
        );
    }catch(error) {
        console.error('Avatar upload exception:',error);

        showStatus(
            'Avatar upload failed.',
            'error'
        );
    }
}

async function handleLogout() {
    const button = document.getElementById('logoutBtn');

    button.disabled=true;
    button.textContent='Logging out...';

    try {
        const {
            error
        } = await supabaseClient.auth.signOut();

        if(error) {
            console.error('Logout error:',error);

            button.disabled=false;
            button.textContent='⇥ Logout';

            showStatus(
                error.message || 'Logout failed.',
                'error'
            );

            return;
        }

        window.location.href='/auth/login.html';
    }catch(error) {
        console.error('Logout exception:',error);

        button.disabled=false;
        button.textContent='⇥ Logout';

        showStatus(
            'Logout failed.',
            'error'
        );
    }
}

function formatDate(dateString) {
    if(!dateString) {
        return 'Unknown';
    }

    const date = new Date(dateString);

    if(Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleDateString(
        'en-US',
        {
            year:'numeric',
            month:'long',
            day:'numeric'
        }
    );
}

function showStatus(message,type) {
    const element =
        document.getElementById('uploadStatus');

    if(!element) {
        return;
    }

    element.textContent=message;
    element.className=`upload-status ${type}`;

    if(type==='success') {
        setTimeout(() => {
            if(element.textContent===message) {
                element.textContent='';
                element.className='upload-status';
            }
        },3000);
    }
}

supabaseClient.auth.onAuthStateChange((event,session) => {
    console.log('Profile auth event:',event);

    if(event==='SIGNED_OUT') {
        window.location.href='/auth/login.html';
    }

    if(event==='SIGNED_IN' && session && !currentUser) {
        loadProfile();
    }
});