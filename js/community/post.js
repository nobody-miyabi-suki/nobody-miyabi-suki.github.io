(function(){
    'use strict';

    const supabaseClient=window.supabaseClient;

    let currentUser=null;
    let post=null;
    let profile=null;
    let likes=[];
    let comments=[];

    const params=new URLSearchParams(window.location.search);
    const postId=params.get('id');

    const $=id=>document.getElementById(id);

    document.addEventListener('DOMContentLoaded',init);

    async function init(){

        if(!supabaseClient){
            showError('Database connection is unavailable.');
            return;
        }

        if(!postId){
            showError('No post ID was provided.');
            return;
        }

        bindEvents();

        try{

            const{
                data:{user},
                error
            }=await supabaseClient.auth.getUser();

            if(error){
                console.error('Auth error:',error);
            }

            currentUser=user||null;

            await loadPost();

            await updateCommentUI();

        }catch(error){

            console.error('Post initialization error:',error);

            showError(
                error.message||
                'Something went wrong while loading this post.'
            );
        }
    }

    function bindEvents(){

        $('likeButton')?.addEventListener(
            'click',
            toggleLike
        );

        $('shareButton')?.addEventListener(
            'click',
            sharePost
        );

        $('commentScrollButton')?.addEventListener(
            'click',
            scrollToComments
        );

        $('postMenu')?.addEventListener(
            'click',
            handlePostMenu
        );

        $('retryButton')?.addEventListener(
            'click',
            loadPost
        );

        $('commentForm')?.addEventListener(
            'submit',
            submitComment
        );

        $('commentInput')?.addEventListener(
            'input',
            updateCharacterCount
        );

        $('postAuthorAvatar')?.addEventListener(
            'error',
            handleAvatarError
        );

        $('currentUserAvatar')?.addEventListener(
            'error',
            handleAvatarError
        );
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
                console.error(
                    'Post error:',
                    postResult.error
                );

                throw new Error(
                    postResult.error.message||
                    'This post could not be found.'
                );
            }

            post=postResult.data;

            if(!post){
                throw new Error(
                    'This post could not be found.'
                );
            }

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
                    .order(
                        'created_at',
                        {ascending:true}
                    )
            ]);

            if(profileResult.error){
                console.error(
                    'Profile error:',
                    profileResult.error
                );
            }

            if(likesResult.error){
                console.error(
                    'Likes error:',
                    likesResult.error
                );
            }

            if(commentsResult.error){
                console.error(
                    'Comments error:',
                    commentsResult.error
                );
            }

            profile=profileResult.data||{};
            likes=likesResult.data||[];
            comments=commentsResult.data||[];

            renderPost();
            renderComments();

            await updateCommentUI();

        }catch(error){

            console.error(
                'Load post error:',
                error
            );

            showError(
                error.message||
                'Failed to load this post.'
            );
        }
    }

    function renderPost(){

        $('postLoading').hidden=true;
        $('postError').hidden=true;
        $('postContent').hidden=false;

        const username=
            profile?.username||
            post?.username||
            'Unknown User';

        const avatar=
            profile?.avatar_url||
            post?.avatar_url||
            '/img/icons/default-avatar.png';

        const content=
            post?.content||
            '';

        const liked=
            currentUser&&
            likes.some(
                like=>like.user_id===currentUser.id
            );

        $('postAuthorName').textContent=username;

        $('postTime').textContent=
            formatRelativeTime(post.created_at);

        $('postText').textContent=content;

        $('postAuthorAvatar').src=avatar;

        updateLikeUI(liked);

        updateCommentCount();

        renderPostImage();

        updatePostMenu();

    }

    function renderPostImage(){

        const wrapper=$('postImageWrapper');
        const image=$('postImage');

        if(!wrapper||!image) return;

        const imageUrl=
            post?.image_url||
            post?.image||
            post?.media_url||
            null;

        if(imageUrl){

            image.src=imageUrl;

            image.alt=
                `${profile?.username||'User'}'s post image`;

            image.onerror=()=>{
                wrapper.hidden=true;
            };

            wrapper.hidden=false;

        }else{

            image.removeAttribute('src');

            wrapper.hidden=true;
        }
    }

    function renderComments(){

        const list=$('commentsList');

        if(!list) return;

        updateCommentCount();

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
            list.appendChild(
                createComment(comment)
            );
        });
    }

    function createComment(comment){

        const username=
            comment.username||
            comment.author_username||
            'User';

        const avatar=
            comment.avatar_url||
            comment.author_avatar||
            '/img/icons/default-avatar.png';

        const element=
            document.createElement('div');

        element.className='comment';

        element.innerHTML=`
            <div class="comment-avatar">
                <img
                    src="${escapeAttribute(avatar)}"
                    alt="${escapeAttribute(username)} avatar"
                >
            </div>

            <div class="comment-content">

                <div class="comment-author">
                    ${escapeHTML(username)}
                </div>

                <div class="comment-text">
                    ${escapeHTML(comment.content||'')}
                </div>

                <div class="comment-time">
                    ${formatRelativeTime(comment.created_at)}
                </div>

            </div>
        `;

        const image=
            element.querySelector('img');

        if(image){

            image.addEventListener(
                'error',
                handleAvatarError
            );

        }

        return element;
    }

    function updateCommentCount(){

        const count=$('commentCount');
        const total=$('commentsTotal');

        if(count){
            count.textContent=comments.length;
        }

        if(total){

            total.textContent=
                `${comments.length} ${
                    comments.length===1
                    ?'comment'
                    :'comments'
                }`;
        }
    }

    async function toggleLike(){

        if(!currentUser){

            showStatus(
                'Please login to like posts.',
                'error'
            );

            return;
        }

        const button=$('likeButton');

        if(!button||button.disabled) return;

        button.disabled=true;

        const existing=
            likes.some(
                like=>
                    like.user_id===currentUser.id
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
                    like=>
                        like.user_id!==currentUser.id
                );

            }else{

                const{data,error}=
                    await supabaseClient
                        .from('post_likes')
                        .insert({
                            post_id:postId,
                            user_id:currentUser.id
                        })
                        .select(
                            'post_id,user_id'
                        )
                        .single();

                if(error) throw error;

                if(data){
                    likes.push(data);
                }
            }

            updateLikeUI();

        }catch(error){

            console.error(
                'Like error:',
                error
            );

            showStatus(
                error.message||
                'Failed to update like.',
                'error'
            );

        }finally{

            button.disabled=false;
        }
    }

    function updateLikeUI(){

        const button=$('likeButton');
        const icon=$('likeIcon');
        const count=$('likeCount');

        const liked=
            !!currentUser&&
            likes.some(
                like=>
                    like.user_id===currentUser.id
            );

        if(button){
            button.classList.toggle(
                'active',
                liked
            );
        }

        if(icon){
            icon.textContent=
                liked?'♥':'♡';
        }

        if(count){
            count.textContent=
                likes.length;
        }
    }

    async function sharePost(){

        const url=
            window.location.href;

        const username=
            profile?.username||
            'Someone';

        if(navigator.share){

            try{

                await navigator.share({
                    title:
                        `${username}'s post · Miyabi-Suki`,
                    text:
                        post?.content||
                        'Check out this post!',
                    url
                });

                return;

            }catch(error){

                if(
                    error?.name===
                    'AbortError'
                ){
                    return;
                }
            }
        }

        try{

            await navigator.clipboard.writeText(
                url
            );

            showStatus(
                'Post link copied!',
                'success'
            );

        }catch(error){

            window.prompt(
                'Copy this post link:',
                url
            );
        }
    }

    function scrollToComments(){

        $('commentsSection')?.scrollIntoView({
            behavior:'smooth',
            block:'start'
        });

        setTimeout(()=>{
            $('commentInput')?.focus();
        },500);
    }

    function handlePostMenu(){

        if(!currentUser){

            showStatus(
                'Please login to manage posts.',
                'error'
            );

            return;
        }

        if(
            !post||
            post.user_id!==currentUser.id
        ){

            showStatus(
                'Post options are only available to the author.',
                'error'
            );

            return;
        }

        const confirmed=
            confirm(
                'Do you want to delete this post?'
            );

        if(confirmed){
            deletePost();
        }
    }

    async function deletePost(){

        try{

            const{error}=
                await supabaseClient
                    .from('posts')
                    .delete()
                    .eq('id',postId)
                    .eq(
                        'user_id',
                        currentUser.id
                    );

            if(error) throw error;

            showStatus(
                'Post deleted.',
                'success'
            );

            setTimeout(()=>{
                window.location.href=
                    '/community/';
            },500);

        }catch(error){

            console.error(
                'Delete post error:',
                error
            );

            showStatus(
                error.message||
                'Failed to delete post.',
                'error'
            );
        }
    }

    async function submitComment(event){

        event.preventDefault();

        if(!currentUser){

            showStatus(
                'Please login to comment.',
                'error'
            );

            return;
        }

        const input=$('commentInput');
        const button=$('commentSubmit');

        if(!input||!button) return;

        const content=
            input.value.trim();

        if(!content){

            showStatus(
                'Please write a comment first.',
                'error'
            );

            return;
        }

        button.disabled=true;

        try{

            const{data,error}=
                await supabaseClient
                    .from('comments')
                    .insert({
                        post_id:postId,
                        user_id:currentUser.id,
                        content
                    })
                    .select('*')
                    .single();

            if(error) throw error;

            if(data){

                comments.push({
                    ...data,
                    username:
                        profile?.username||
                        currentUser.user_metadata?.username||
                        currentUser.email?.split('@')[0]||
                        'User',
                    avatar_url:
                        profile?.avatar_url||
                        currentUser.user_metadata?.avatar_url||
                        '/img/icons/default-avatar.png'
                });
            }

            input.value='';

            updateCharacterCount();

            renderComments();

            showStatus(
                'Comment posted!',
                'success'
            );

        }catch(error){

            console.error(
                'Comment error:',
                error
            );

            showStatus(
                error.message||
                'Failed to post comment.',
                'error'
            );

        }finally{

            button.disabled=false;
        }
    }

    async function updateCommentUI(){

        const login=$('commentLogin');
        const form=$('commentForm');

        if(!login||!form) return;

        if(currentUser){

            login.hidden=true;
            form.hidden=false;

            await loadCurrentUserProfile();

        }else{

            login.hidden=false;
            form.hidden=true;
        }
    }

    async function loadCurrentUserProfile(){

        const avatar=$('currentUserAvatar');

        if(!avatar||!currentUser) return;

        try{

            const{data,error}=
                await supabaseClient
                    .from('profiles')
                    .select(
                        'username,avatar_url'
                    )
                    .eq(
                        'id',
                        currentUser.id
                    )
                    .maybeSingle();

            if(error){

                console.error(
                    'Current profile error:',
                    error
                );

                return;
            }

            if(data?.avatar_url){

                avatar.src=
                    data.avatar_url;

            }else if(
                currentUser.user_metadata?.avatar_url
            ){

                avatar.src=
                    currentUser.user_metadata.avatar_url;

            }else{

                avatar.src=
                    '/img/icons/default-avatar.png';
            }

        }catch(error){

            console.error(
                'Current avatar error:',
                error
            );
        }
    }

    function updateCharacterCount(){

        const input=$('commentInput');
        const counter=
            $('commentCharacterCount');

        if(!input||!counter) return;

        counter.textContent=
            `${input.value.length} / 1000`;
    }

    function updatePostMenu(){

        const menu=$('postMenu');

        if(!menu||!post) return;

        if(
            currentUser&&
            post.user_id===currentUser.id
        ){

            menu.hidden=false;

        }else{

            menu.hidden=false;
        }
    }

    function showLoading(){

        $('postLoading').hidden=false;
        $('postContent').hidden=true;
        $('postError').hidden=true;
    }

    function showError(message){

        const loading=$('postLoading');
        const content=$('postContent');
        const error=$('postError');
        const errorMessage=
            $('postErrorMessage');

        if(loading){
            loading.hidden=true;
        }

        if(content){
            content.hidden=true;
        }

        if(error){
            error.hidden=false;
        }

        if(errorMessage){

            errorMessage.textContent=
                message||
                'Something went wrong while loading this post.';
        }
    }

    function showStatus(message,type){

        let element=
            $('communityStatus');

        if(!element){

            element=
                document.createElement('div');

            element.id=
                'communityStatus';

            element.className=
                'community-status';

            document.body.appendChild(
                element
            );
        }

        element.textContent=
            message;

        element.className=
            `community-status ${type||''}`;

        clearTimeout(
            element._timeout
        );

        element._timeout=
            setTimeout(()=>{

                element.textContent='';
                element.className=
                    'community-status';

            },3000);
    }

    function formatRelativeTime(value){

        if(!value){
            return 'Unknown time';
        }

        const date=
            new Date(value);

        if(
            Number.isNaN(
                date.getTime()
            )
        ){

            return 'Unknown time';
        }

        const seconds=
            Math.floor(
                Math.max(
                    0,
                    Date.now()-
                    date.getTime()
                )/1000
            );

        if(seconds<10){
            return 'Just now';
        }

        if(seconds<60){
            return `${seconds}s ago`;
        }

        const minutes=
            Math.floor(
                seconds/60
            );

        if(minutes<60){
            return `${minutes}m ago`;
        }

        const hours=
            Math.floor(
                minutes/60
            );

        if(hours<24){
            return `${hours}h ago`;
        }

        const days=
            Math.floor(
                hours/24
            );

        if(days<7){
            return `${days}d ago`;
        }

        const weeks=
            Math.floor(
                days/7
            );

        if(weeks<5){
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

    function handleAvatarError(event){

        const image=
            event.currentTarget;

        if(
            image.src.endsWith(
                '/img/icons/default-avatar.png'
            )
        ){
            return;
        }

        image.src=
            '/img/icons/default-avatar.png';
    }

    function escapeHTML(value){

        return String(
            value??''
        )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
    }

    function escapeAttribute(value){

        return escapeHTML(value);
    }

    supabaseClient?.auth?.onAuthStateChange(
        async(event,session)=>{

            if(event==='SIGNED_IN'){

                currentUser=
                    session?.user||
                    null;

                updateLikeUI();

                await updateCommentUI();

            }

            if(event==='SIGNED_OUT'){

                currentUser=null;

                updateLikeUI();

                await updateCommentUI();
            }
        }
    );

})();