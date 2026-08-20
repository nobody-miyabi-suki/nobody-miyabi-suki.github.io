const headerAuthClient = window.supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    initHeaderAuth();
});

async function initHeaderAuth() {
    if (!headerAuthClient) {
        console.error('Header Auth: Supabase client not found.');
        return;
    }

    await renderAuthControls();

    headerAuthClient.auth.onAuthStateChange((event) => {
        console.log('Header auth event:', event);

        if (
            event === 'INITIAL_SESSION' ||
            event === 'SIGNED_IN' ||
            event === 'SIGNED_OUT' ||
            event === 'USER_UPDATED'
        ) {
            renderAuthControls();
        }
    });
}

async function renderAuthControls() {
    const container = document.getElementById('authControls');

    if (!container) {
        console.error('Header Auth: #authControls not found.');
        return;
    }

    container.innerHTML = `
        <div class="auth-controls">
            <span class="auth-loading">Loading...</span>
        </div>
    `;

    try {
        const {
            data: {
                session
            },
            error: sessionError
        } = await headerAuthClient.auth.getSession();

        if (sessionError) {
            console.error(
                'Header session error:',
                sessionError
            );

            renderGuestAuth();
            return;
        }

        if (!session) {
            renderGuestAuth();
            return;
        }

        const {
            data: {
                user
            },
            error: userError
        } = await headerAuthClient.auth.getUser();

        if (userError || !user) {
            console.error(
                'Header user error:',
                userError
            );

            renderGuestAuth();
            return;
        }

        const {
            data: profile,
            error: profileError
        } = await headerAuthClient
            .from('profiles')
            .select('username,avatar_url')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError) {
            console.error(
                'Header profile error:',
                profileError
            );
        }

        renderLoggedInAuth(
            user,
            profile
        );

    } catch (error) {
        console.error(
            'Header auth error:',
            error
        );

        renderGuestAuth();
    }
}

function renderGuestAuth() {
    const container =
        document.getElementById('authControls');

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="auth-controls">

            <a
                href="/auth/login.html"
                class="auth-btn"
            >
                🔐 Login
            </a>

            <a
                href="/auth/register.html"
                class="auth-btn register"
            >
                ✦ Register
            </a>

        </div>
    `;
}

function renderLoggedInAuth(user, profile) {
    const container =
        document.getElementById('authControls');

    if (!container) {
        return;
    }

    const username =
        profile?.username ||
        user.user_metadata?.username ||
        'User';

    const avatar =
        profile?.avatar_url ||
        '/img/icons/default-avatar.png';

    container.innerHTML = `
        <div
            class="auth-user"
            id="authUser"
        >

            <button
                type="button"
                class="auth-profile-btn"
                id="authProfileBtn"
            >
                <img
                    class="auth-avatar"
                    src="${escapeHtml(avatar)}"
                    alt="Avatar"
                >

                <span class="auth-username">
                    ${escapeHtml(username)}
                </span>

                <span class="auth-arrow">
                    ▼
                </span>
            </button>

            <div class="auth-dropdown">

                <a href="/auth/profile.html">
                    👤 Profile
                </a>

                <a href="/community/index.html">
                    💬 Community
                </a>

                <div class="auth-divider"></div>

                <button
                    type="button"
                    class="logout-item"
                    id="headerLogoutBtn"
                >
                    🚪 Logout
                </button>

            </div>

        </div>
    `;

    const authUser =
        document.getElementById('authUser');

    const profileBtn =
        document.getElementById('authProfileBtn');

    const logoutBtn =
        document.getElementById('headerLogoutBtn');

    if (profileBtn) {
        profileBtn.addEventListener(
            'click',
            (event) => {
                event.stopPropagation();
                authUser.classList.toggle('open');
            }
        );
    }

    if (logoutBtn) {
        logoutBtn.addEventListener(
            'click',
            handleHeaderLogout
        );
    }
}

async function handleHeaderLogout() {
    const logoutBtn =
        document.getElementById('headerLogoutBtn');

    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out...';
    }

    const {
        error
    } = await headerAuthClient.auth.signOut();

    if (error) {
        console.error(
            'Header logout error:',
            error
        );

        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = '🚪 Logout';
        }

        return;
    }

    window.location.href = '/';
}

document.addEventListener(
    'click',
    (event) => {
        const authUser =
            document.getElementById('authUser');

        if (
            authUser &&
            !event.target.closest('#authUser')
        ) {
            authUser.classList.remove('open');
        }
    }
);

function escapeHtml(value) {
    const div =
        document.createElement('div');

    div.textContent =
        String(value ?? '');

    return div.innerHTML;
}