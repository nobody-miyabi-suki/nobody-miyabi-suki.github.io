const supabaseClient = window.supabaseClient;

let currentUser = null;

document.addEventListener('DOMContentLoaded',async() => {
    setupCreatePost();
    await checkUser();
});

async function checkUser() {
    try {
        const {
            data:{user},
            error
        } = await supabaseClient.auth.getUser();

        if(error) {
            console.error('Get user error:',error);
            redirectToLogin();
            return;
        }

        if(!user) {
            redirectToLogin();
            return;
        }

        currentUser = user;
    }catch(error) {
        console.error('Auth check error:',error);
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.href =
        `/auth/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
}

function setupCreatePost() {
    const form = document.getElementById('createPostForm');
    const content = document.getElementById('postContent');

    if(content) {
        content.addEventListener('input',updateContentCount);
    }

    if(form) {
        form.addEventListener('submit',createPost);
    }
}

function updateContentCount() {
    const content = document.getElementById('postContent');
    const counter = document.getElementById('contentCount');

    if(!content || !counter) {
        return;
    }

    counter.textContent = content.value.length;
}

async function createPost(event) {
    event.preventDefault();

    if(!currentUser) {
        redirectToLogin();
        return;
    }

    const contentElement =
        document.getElementById('postContent');

    const button =
        document.getElementById('createPostBtn');

    const content =
        contentElement.value.trim();

    if(!content) {
        showStatus(
            'Please write something before publishing.',
            'error'
        );
        contentElement.focus();
        return;
    }

    if(content.length > 2000) {
        showStatus(
            'Post must be 2000 characters or less.',
            'error'
        );
        return;
    }

    button.disabled=true;
    button.textContent='Publishing...';

    showStatus('Publishing your post...','loading');

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from('posts')
            .insert({
                user_id:currentUser.id,
                content:content
            })
            .select()
            .single();

        if(error) {
            console.error('Create post error:',error);

            showStatus(
                error.message || 'Failed to publish post.',
                'error'
            );

            return;
        }

        if(!data) {
            showStatus(
                'Post was created but no data was returned.',
                'error'
            );

            return;
        }

        showStatus(
            'Post published successfully! ✦',
            'success'
        );

        contentElement.value='';
        updateContentCount();

        setTimeout(() => {
            window.location.href='/community/index.html';
        },700);

    }catch(error) {
        console.error('Create post exception:',error);

        showStatus(
            'Something went wrong while publishing.',
            'error'
        );
    }finally {
        button.disabled=false;
        button.textContent='✦ Publish Post';
    }
}

function showStatus(message,type) {
    const element =
        document.getElementById('createPostStatus');

    if(!element) {
        return;
    }

    element.textContent=message;
    element.className=`create-status ${type}`;
}