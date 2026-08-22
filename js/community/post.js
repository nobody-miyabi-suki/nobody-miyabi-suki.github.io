(function(){
    'use strict';

    const supabaseClient=window.supabaseClient;
    const params=new URLSearchParams(window.location.search);
    const postId=params.get('id');

    let currentUser=null;
    let post=null;
    let profile=null;
    let comments=[];
    let likes=[];

    document.addEventListener('DOMContentLoaded',initPost);

    async function initPost(){
        if(!supabaseClient){
            showError('Database connection is unavailable.');
            return;
        }

        if(!postId){
            showError('No post ID was provided.');
            return;
        }

        try{
            const{
                data:{user},
                error
            }=await supabaseClient.auth.getUser();

            if(error) console.error('Auth error:',error);

            currentUser=user||null;
            await loadPost();
        }catch(error){
            console.error('Post initialization error:',error);
            showError('Something went wrong while loading this post.');
        }
    }

    async function loadPost(){
        showLoading();

        try{
            const postResult=await supabaseClient
                .from('posts')
                .select('*')
                .eq('id',postId)
                .single();

            if(postResult.error){
                console.error('Post error:',postResult.error);
                showError('This post could not be found.');
                return;
            }

            post=postResult.data;

            const[
                profileResult,
                likesResult,
                commentsResult
            ]=await Promise.all([
                supabaseClient
                    .from('profiles')
                    .select('id,username,avatar_url')
                    .eq('id',post.user_id)
                    .maybeSingle(),

                supabaseClient
                    .from('post_likes')
                    .select('post_id,user_id')
                    .eq('post_id',postId),

                supabaseClient
                    .from('comments')
                    .select('*')
                    .eq('post_id',postId)
                    .order('created_at',{ascending:true})
            ]);

            if(profileResult.error){
                console.error('Profile error:',profileResult.error);
            }

            if(likesResult.error){
                console.error('Likes error:',likesResult.error);
            }

            if(commentsResult.error){
                console.error('Comments error:',commentsResult.error);
            }

            profile=profileResult.data||{};
            likes=likesResult.data||[];
            comments=commentsResult.data||[];

            renderPost();
            renderComments();

        }catch(error){
            console.error('Load post error:',error);
            showError('Failed to load this post.');
        }
    }

    function renderPost(){
        const container=document.getElementById('postContent');

        if(!container) return;

        const username=profile.username||'Unknown User';
        const avatar=profile.avatar_url||'/img/icons/default-avatar.png';

        const liked=currentUser&&likes.some(
            like=>like.user_id===currentUser.id
        );

        container.innerHTML=`
            <article class="post-detail">
                <div class="post-detail-header">
                    <div class="post-author">
                        <div class="author-avatar">
                            <img src="${escapeAttribute(avatar)}" alt="${escapeAttribute(username)} avatar">
                        </div>
                        <div class="author-info">
                            <div class="author-name">${escapeHTML(username)}</div>
                            <div class="post-time">${formatRelativeTime(post.created_at)}</div>
                        </div>
                    </div>
                    <button class="post-menu" id="postMenu" type="button" aria-label="Post options">⋯</button>
                </div>
                <div class="post-body">
                    <p>${escapeHTML(post.content||'')}</p>
                </div>
                <div class="post-actions">
                    <button class="post-action like ${liked?'active':''}" id="likeButton" type="button">
                        <span id="likeSymbol">${liked?'♥':'♡'}</span>
                        <span id="likeCount">${likes.length}</span>
                    </button>
                    <button class="post-action" type="button" id="commentFocusButton">
                        💬
                        <span>${comments.length}</span>
                    </button>
                    <button class="post-action" type="button" id="shareButton">
                        ↗ Share
                    </button>
                </div>
            </article>
        `;

        const image=container.querySelector('.author-avatar img');

        if(image){
            image.onerror=()=>{
                image.src='/img/icons/default-avatar.png';
            };
        }

        document.getElementById('likeButton')?.addEventListener(
            'click',toggleLike
        );

        document.getElementById('shareButton')?.addEventListener(
            'click',sharePost
        );

        document.getElementById('commentFocusButton')?.addEventListener(
            'click',()=>{
                document.getElementById('commentInput')?.focus();
            }
        );

        document.getElementById('postMenu')?.addEventListener(
            'click',handlePostMenu
        );
    }

    function renderComments(){
        const list=document.getElementById('commentsList');
        const count=document.getElementById('commentsCount');

        if(!list) return;

        if(count){
            count.textContent=comments.length;
        }

        if(!comments.length){
            list.innerHTML=`
                <div class="empty-comments">
                    <div class="empty-comments-icon">✦</div>
                    <h4>No comments yet</h4>
                    <p>Be the first to say something.</p>
                </div>
            `;
            return;
        }

        list.innerHTML='';

        comments.forEach(comment=>{
            list.appendChild(createComment(comment));
        });
    }

    function createComment(comment){
        const username=comment.username||'User';
        const avatar=comment.avatar_url||'/img/icons/default-avatar.png';

        const element=document.createElement('div');
        element.className='comment';

        element.innerHTML=`
            <div class="comment-avatar">
                <img src="${escapeAttribute(avatar)}" alt="${escapeAttribute(username)} avatar">
            </div>
            <div class="comment-content">
                <div class="comment-author">${escapeHTML(username)}</div>
                <div class="comment-text">${escapeHTML(comment.content||'')}</div>
                <div class="comment-time">${formatRelativeTime(comment.created_at)}</div>
            </div>
        `;

        const image=element.querySelector('img');

        if(image){
            image.onerror=()=>{
                image.src='/img/icons/default-avatar.png';
            };
        }

        return element;
    }

    async function toggleLike(){
        if(!currentUser){
            showStatus('Please login to like posts.','error');
            return;
        }

        const button=document.getElementById('likeButton');

        if(!button||button.disabled) return;

        button.disabled=true;

        const existing=likes.some(
            like=>like.user_id===currentUser.id
        );

        try{
            if(existing){
                const{error}=await supabaseClient
                    .from('post_likes')
                    .delete()
                    .eq('post_id',postId)
                    .eq('user_id',currentUser.id);

                if(error) throw error;

                likes=likes.filter(
                    like=>like.user_id!==currentUser.id
                );
            }else{
                const{data,error}=await supabaseClient
                    .from('post_likes')
                    .insert({
                        post_id:postId,
                        user_id:currentUser.id
                    })
                    .select('post_id,user_id')
                    .single();

                if(error) throw error;

                if(data) likes.push(data);
            }

            updateLikeUI();
        }catch(error){
            console.error('Like error:',error);
            showStatus(error.message||'Failed to update like.','error');
        }finally{
            button.disabled=false;
        }
    }

    function updateLikeUI(){
        const button=document.getElementById('likeButton');
        const symbol=document.getElementById('likeSymbol');
        const count=document.getElementById('likeCount');

        const liked=currentUser&&likes.some(
            like=>like.user_id===currentUser.id
        );

        if(button) button.classList.toggle('active',!!liked);
        if(symbol) symbol.textContent=liked?'♥':'♡';
        if(count) count.textContent=likes.length;
    }

    async function sharePost(){
        const url=window.location.href;

        if(navigator.share){
            try{
                await navigator.share({
                    title:`${profile.username||'Someone'}'s post · Miyabi-Suki`,
                    text:post.content||'Check out this post!',
                    url
                });
                return;
            }catch(error){
                if(error?.name==='AbortError') return;
            }
        }

        try{
            await navigator.clipboard.writeText(url);
            showStatus('Post link copied!','success');
        }catch(error){
            window.prompt('Copy this post link:',url);
        }
    }

    function handlePostMenu(){
        if(!currentUser){
            showStatus('Please login to manage posts.','error');
            return;
        }

        if(post.user_id!==currentUser.id){
            showStatus('Post options are only available to the author.','error');
            return;
        }

        if(confirm('Do you want to delete this post?')){
            deletePost();
        }
    }

    async function deletePost(){
        try{
            const{error}=await supabaseClient
                .from('posts')
                .delete()
                .eq('id',postId)
                .eq('user_id',currentUser.id);

            if(error) throw error;

            window.location.href='/community/';
        }catch(error){
            console.error('Delete post error:',error);
            showStatus(error.message||'Failed to delete post.','error');
        }
    }

    function showLoading(){
        const container=document.getElementById('postContent');

        if(container){
            container.innerHTML=`
                <div class="post-loading">
                    <div class="post-loading-icon">✦</div>
                    Loading post...
                </div>
            `;
        }
    }

    function showError(message){
        const container=document.getElementById('postContent');

        if(!container) return;

        container.innerHTML=`
            <div class="post-error">
                <div class="post-error-icon">⚠</div>
                <h3>Something went wrong</h3>
                <p>${escapeHTML(message)}</p>
                <button type="button" id="retryPost">↻ Try Again</button>
            </div>
        `;

        document.getElementById('retryPost')?.addEventListener(
            'click',loadPost
        );
    }

    function showStatus(message,type){
        let element=document.getElementById('postStatus');

        if(!element){
            element=document.createElement('div');
            element.id='postStatus';
            element.className='upload-status';
            document.body.appendChild(element);
        }

        element.textContent=message;
        element.className=`upload-status ${type}`;

        clearTimeout(element._timeout);

        element._timeout=setTimeout(()=>{
            element.textContent='';
            element.className='upload-status';
        },3000);
    }

    function formatRelativeTime(value){
        const date=new Date(value);

        if(Number.isNaN(date.getTime())) return 'Unknown time';

        const seconds=Math.floor(
            Math.max(0,Date.now()-date.getTime())/1000
        );

        if(seconds<10) return 'Just now';
        if(seconds<60) return `${seconds}s ago`;

        const minutes=Math.floor(seconds/60);

        if(minutes<60) return `${minutes}m ago`;

        const hours=Math.floor(minutes/60);

        if(hours<24) return `${hours}h ago`;

        const days=Math.floor(hours/24);

        if(days<7) return `${days}d ago`;

        const weeks=Math.floor(days/7);

        if(weeks<5) return `${weeks}w ago`;

        return date.toLocaleDateString('en-US',{
            year:'numeric',
            month:'short',
            day:'numeric'
        });
    }

    function escapeHTML(value){
        return String(value??'')
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
    }

    function escapeAttribute(value){
        return escapeHTML(value);
    }

    supabaseClient?.auth?.onAuthStateChange(
        (event,session)=>{
            if(event==='SIGNED_IN'){
                currentUser=session?.user||null;
                updateLikeUI();
            }

            if(event==='SIGNED_OUT'){
                currentUser=null;
                updateLikeUI();
            }
        }
    );
})();