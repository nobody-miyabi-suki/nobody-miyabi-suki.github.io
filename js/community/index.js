(function() {
    'use strict';

    const supabaseClient = window.supabaseClient;

    let currentUser = null;
    let posts = [];
    let profiles = {};
    let likes = [];
    let comments = {};

    document.addEventListener('DOMContentLoaded',async() => {
        await initCommunity();
    });

    async function initCommunity() {
        if(!supabaseClient) {
            console.error('Supabase client is not initialized.');
            showFeedError('Community could not connect to the database.');
            return;
        }

        try {
            const {
                data:{
                    user
                },
                error
            } = await supabaseClient.auth.getUser();

            if(error) {
                console.error('Auth error:',error);
            }

            currentUser = user || null;

            await loadCommunity();

        }catch(error) {
            console.error('Community initialization error:',error);
            showFeedError('Something went wrong while loading the community.');
        }
    }

    async function loadCommunity() {
        showLoading();

        try {
            const [
                postsResult,
                profilesResult,
                likesResult,
                commentsResult
            ] = await Promise.all([
                supabaseClient
                    .from('posts')
                    .select('*')
                    .order('created_at',{ascending:false}),

                supabaseClient
                    .from('profiles')
                    .select('id,username,avatar_url'),

                supabaseClient
                    .from('post_likes')
                    .select('post_id,user_id'),

                supabaseClient
                    .from('comments')
                    .select('id,post_id')
            ]);

            if(postsResult.error) {
                console.error('Posts error:',postsResult.error);
                showFeedError('Failed to load posts.');
                return;
            }

            if(profilesResult.error) {
                console.error('Profiles error:',profilesResult.error);
            }

            if(likesResult.error) {
                console.error('Likes error:',likesResult.error);
            }

            if(commentsResult.error) {
                console.error('Comments error:',commentsResult.error);
            }

            posts = postsResult.data || [];

            profiles = {};
            (profilesResult.data || []).forEach(profile => {
                profiles[profile.id] = profile;
            });

            likes = likesResult.data || [];

            comments = {};

            (commentsResult.data || []).forEach(comment => {
                if(!comments[comment.post_id]) {
                    comments[comment.post_id] = 0;
                }

                comments[comment.post_id]++;
            });

            renderStats();
            renderPosts();

        }catch(error) {
            console.error('Load community error:',error);
            showFeedError('Failed to load the community.');
        }
    }

    function renderStats() {
        const postCount = document.getElementById('postCount');
        const commentCount = document.getElementById('commentCount');
        const likeCount = document.getElementById('likeCount');

        if(postCount) {
            postCount.textContent = formatNumber(posts.length);
        }

        if(commentCount) {
            const totalComments = Object.values(comments)
                .reduce((total,count) => total + count,0);

            commentCount.textContent = formatNumber(totalComments);
        }

        if(likeCount) {
            likeCount.textContent = formatNumber(likes.length);
        }
    }

    function renderPosts() {
        const feed = document.getElementById('postsFeed');

        if(!feed) {
            return;
        }

        feed.innerHTML = '';

        if(!posts.length) {
            feed.innerHTML = `
                <div class="empty-feed">
                    <div class="empty-feed-icon">✦</div>
                    <h4>No posts yet</h4>
                    <p>
                        Be the first person to share something
                        with the Miyabi-Suki community.
                    </p>

                    <a href="/community/create.html"
                       class="community-btn community-btn-primary">
                        ✦ Create a Post
                    </a>
                </div>
            `;

            return;
        }

        posts.forEach(post => {
            feed.appendChild(createPostElement(post));
        });
    }

    function createPostElement(post) {
        const profile = profiles[post.user_id] || {};

        const username =
            profile.username ||
            'Unknown User';

        const avatar =
            profile.avatar_url ||
            '/img/icons/default-avatar.png';

        const postLikes =
            likes.filter(like => like.post_id === post.id);

        const likeCount =
            postLikes.length;

        const commentCount =
            comments[post.id] || 0;

        const userLiked =
            currentUser &&
            postLikes.some(
                like => like.user_id === currentUser.id
            );

        const article = document.createElement('article');

        article.className = 'post-card';
        article.dataset.postId = post.id;

        article.innerHTML = `
            <div class="post-top">

                <div class="post-author">

                    <div class="author-avatar">
                        <img
                            src="${escapeAttribute(avatar)}"
                            alt="${escapeAttribute(username)} avatar"
                        >
                    </div>

                    <div class="author-info">
                        <div class="author-name">
                            ${escapeHTML(username)}
                        </div>

                        <div class="post-time">
                            ${formatRelativeTime(post.created_at)}
                        </div>
                    </div>

                </div>

                <button
                    class="post-menu"
                    type="button"
                    aria-label="Post options">
                    ⋯
                </button>

            </div>

            <div class="post-content">
                <p>${escapeHTML(post.content || '')}</p>
            </div>

            <div class="post-footer">

                <button
                    class="post-action like ${userLiked ? 'active' : ''}"
                    type="button"
                    data-action="like">

                    <span class="like-symbol">
                        ${userLiked ? '♥' : '♡'}
                    </span>

                    <span class="count">
                        ${likeCount}
                    </span>

                </button>

                <button
                    class="post-action"
                    type="button"
                    data-action="comment">

                    💬
                    <span class="count">
                        ${commentCount}
                    </span>

                </button>

                <button
                    class="post-action"
                    type="button"
                    data-action="share">

                    ↗ Share

                </button>

            </div>
        `;

        const avatarElement =
            article.querySelector('.author-avatar img');

        if(avatarElement) {
            avatarElement.onerror = () => {
                avatarElement.src =
                    '/img/icons/default-avatar.png';
            };
        }

        const likeButton =
            article.querySelector('[data-action="like"]');

        if(likeButton) {
            likeButton.addEventListener(
                'click',
                () => toggleLike(post.id,likeButton)
            );
        }

        const commentButton =
            article.querySelector('[data-action="comment"]');

        if(commentButton) {
            commentButton.addEventListener(
                'click',
                () => openComments(post.id)
            );
        }

        const shareButton =
            article.querySelector('[data-action="share"]');

        if(shareButton) {
            shareButton.addEventListener(
                'click',
                () => sharePost(post)
            );
        }

        const menuButton =
            article.querySelector('.post-menu');

        if(menuButton) {
            menuButton.addEventListener(
                'click',
                () => showPostMenu(post)
            );
        }

        return article;
    }

    async function toggleLike(postId,button) {
        if(!currentUser) {
            showStatus(
                'Please login to like posts.',
                'error'
            );

            return;
        }

        if(button.disabled) {
            return;
        }

        button.disabled = true;

        const alreadyLiked =
            likes.some(like =>
                like.post_id === postId &&
                like.user_id === currentUser.id
            );

        try {
            if(alreadyLiked) {
                const {
                    error
                } = await supabaseClient
                    .from('post_likes')
                    .delete()
                    .eq('post_id',postId)
                    .eq('user_id',currentUser.id);

                if(error) {
                    console.error('Unlike error:',error);

                    showStatus(
                        error.message || 'Failed to remove like.',
                        'error'
                    );

                    return;
                }

                likes = likes.filter(like =>
                    !(
                        like.post_id === postId &&
                        like.user_id === currentUser.id
                    )
                );

            }else {
                const {
                    data,
                    error
                } = await supabaseClient
                    .from('post_likes')
                    .insert({
                        post_id:postId,
                        user_id:currentUser.id
                    })
                    .select('post_id,user_id')
                    .single();

                if(error) {
                    console.error('Like error:',error);

                    showStatus(
                        error.message || 'Failed to like post.',
                        'error'
                    );

                    return;
                }

                if(data) {
                    likes.push(data);
                }
            }

            updatePostLikeUI(postId);

            renderStats();

        }catch(error) {
            console.error('Toggle like error:',error);

            showStatus(
                'Could not update like.',
                'error'
            );

        }finally {
            button.disabled = false;
        }
    }

    function updatePostLikeUI(postId) {
        const post =
            document.querySelector(
                `.post-card[data-post-id="${CSS.escape(String(postId))}"]`
            );

        if(!post) {
            return;
        }

        const button =
            post.querySelector('[data-action="like"]');

        if(!button) {
            return;
        }

        const count =
            likes.filter(
                like => like.post_id === postId
            ).length;

        const liked =
            currentUser &&
            likes.some(
                like =>
                    like.post_id === postId &&
                    like.user_id === currentUser.id
            );

        button.classList.toggle('active',liked);

        const symbol =
            button.querySelector('.like-symbol');

        const countElement =
            button.querySelector('.count');

        if(symbol) {
            symbol.textContent =
                liked ? '♥' : '♡';
        }

        if(countElement) {
            countElement.textContent = count;
        }
    }

    function openComments(postId) {
        window.location.href =
            `/community/post.html?id=${encodeURIComponent(postId)}`;
    }

    async function sharePost(post) {
        const url =
            `${window.location.origin}/community/post.html?id=${encodeURIComponent(post.id)}`;

        const username =
            profiles[post.user_id]?.username ||
            'Someone';

        if(navigator.share) {
            try {
                await navigator.share({
                    title:`${username}'s post · Miyabi-Suki`,
                    text:post.content || 'Check out this post!',
                    url:url
                });
            }catch(error) {
                if(error?.name !== 'AbortError') {
                    console.warn('Share cancelled/error:',error);
                }
            }

            return;
        }

        if(navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);

                showStatus(
                    'Post link copied!',
                    'success'
                );

                return;

            }catch(error) {
                console.warn(
                    'Clipboard error:',
                    error
                );
            }
        }

        window.prompt(
            'Copy this post link:',
            url
        );
    }

    function showPostMenu(post) {
        if(!currentUser) {
            showStatus(
                'Please login to manage posts.',
                'error'
            );

            return;
        }

        if(post.user_id !== currentUser.id) {
            showStatus(
                'Post options are only available to the author.',
                'error'
            );

            return;
        }

        const action =
            window.confirm(
                'Do you want to delete this post?'
            );

        if(action) {
            deletePost(post.id);
        }
    }

    async function deletePost(postId) {
        if(!currentUser) {
            return;
        }

        try {
            const {
                error
            } = await supabaseClient
                .from('posts')
                .delete()
                .eq('id',postId)
                .eq('user_id',currentUser.id);

            if(error) {
                console.error('Delete post error:',error);

                showStatus(
                    error.message || 'Failed to delete post.',
                    'error'
                );

                return;
            }

            posts =
                posts.filter(post => post.id !== postId);

            likes =
                likes.filter(like => like.post_id !== postId);

            delete comments[postId];

            renderStats();
            renderPosts();

            showStatus(
                'Post deleted successfully.',
                'success'
            );

        }catch(error) {
            console.error('Delete post exception:',error);

            showStatus(
                'Failed to delete post.',
                'error'
            );
        }
    }

    function showLoading() {
        const feed =
            document.getElementById('postsFeed');

        if(!feed) {
            return;
        }

        feed.innerHTML = `
            <div class="empty-feed">
                <div class="empty-feed-icon">✦</div>
                <h4>Loading community...</h4>
                <p>
                    Gathering the latest posts.
                </p>
            </div>
        `;

        const postCount =
            document.getElementById('postCount');

        const commentCount =
            document.getElementById('commentCount');

        const likeCount =
            document.getElementById('likeCount');

        if(postCount) {
            postCount.textContent = '—';
        }

        if(commentCount) {
            commentCount.textContent = '—';
        }

        if(likeCount) {
            likeCount.textContent = '—';
        }
    }

    function showFeedError(message) {
        const feed =
            document.getElementById('postsFeed');

        if(!feed) {
            return;
        }

        feed.innerHTML = `
            <div class="empty-feed">
                <div class="empty-feed-icon">⚠</div>
                <h4>Something went wrong</h4>
                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    class="community-btn community-btn-primary"
                    id="retryCommunityBtn">
                    ↻ Try Again
                </button>
            </div>
        `;

        const retry =
            document.getElementById('retryCommunityBtn');

        if(retry) {
            retry.addEventListener(
                'click',
                loadCommunity
            );
        }
    }

    function showStatus(message,type) {
        let element =
            document.getElementById('communityStatus');

        if(!element) {
            element =
                document.createElement('div');

            element.id = 'communityStatus';
            element.className = 'upload-status';

            document.body.appendChild(element);
        }

        element.textContent = message;
        element.className =
            `upload-status ${type}`;

        if(type === 'success' || type === 'error') {
            clearTimeout(
                element._statusTimeout
            );

            element._statusTimeout =
                setTimeout(() => {
                    element.textContent = '';
                    element.className =
                        'upload-status';
                },3000);
        }
    }

    function formatRelativeTime(dateString) {
        if(!dateString) {
            return 'Unknown time';
        }

        const date =
            new Date(dateString);

        if(Number.isNaN(date.getTime())) {
            return 'Unknown time';
        }

        const now =
            Date.now();

        const difference =
            Math.max(
                0,
                now - date.getTime()
            );

        const seconds =
            Math.floor(difference / 1000);

        if(seconds < 10) {
            return 'Just now';
        }

        if(seconds < 60) {
            return `${seconds}s ago`;
        }

        const minutes =
            Math.floor(seconds / 60);

        if(minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours =
            Math.floor(minutes / 60);

        if(hours < 24) {
            return `${hours}h ago`;
        }

        const days =
            Math.floor(hours / 24);

        if(days < 7) {
            return `${days}d ago`;
        }

        const weeks =
            Math.floor(days / 7);

        if(weeks < 5) {
            return `${weeks}w ago`;
        }

        return date.toLocaleDateString(
            'en-US',
            {
                year:'numeric',
                month:'short',
                day:'numeric'
            }
        );
    }

    function formatNumber(number) {
        return Number(number || 0).toLocaleString(
            'en-US'
        );
    }

    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
    }

    function escapeAttribute(value) {
        return escapeHTML(value);
    }

    supabaseClient?.auth?.onAuthStateChange(
        (event,session) => {
            console.log(
                'Community auth event:',
                event
            );

            if(event === 'SIGNED_IN') {
                currentUser =
                    session?.user || null;

                loadCommunity();
            }

            if(event === 'SIGNED_OUT') {
                currentUser = null;
                loadCommunity();
            }
        }
    );

})();