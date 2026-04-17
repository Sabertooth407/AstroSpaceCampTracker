<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';
    export let navigate;
    let crewStartX = 0;
    let postIndexes = {};
    let activeTab = 'posts';
let isMobile = false;
    let countdown = '';
    let posts = [];
    let alerts = [];
    let scheduleData = [];
    let currentSession = null;
    let crewImages = [];
    let teams = [];

    let completed = 0;
    let total = 0;

    let crewIndex = 0;

    const targetDate = new Date('2026-05-08T11:00:00');

    function updateTimer() {
        const now = new Date();
        let diff = targetDate - now;

        const isPast = diff < 0;
        diff = Math.abs(diff);

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        countdown = `${isPast ? 'T+' : 'T-'} ${d}d ${h}h ${m}m ${s}s`;
    }
let overrideSession = null;
    async function fetchAll() {
        const { data: postData } = await supabase.from('posts').select('*').eq('status', 'approved');
        const { data: alertData } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(1);
        const { data: sched } = await supabase
    .from('schedule')
    .select('*')
    .order('day', { ascending: true })
    .order('time', { ascending: true });
        const { data: override } = await supabase.from('current_override').select('*').maybeSingle();
const { data: current } = await supabase.from('schedule').select('*').eq('status', 'ongoing').maybeSingle();

overrideSession = override;
        const { data: crew } = await supabase.from('crew_media').select('*').order('created_at', { ascending: false });
        const { data: teamData } = await supabase.from('teams').select('*').order('points', { ascending: false });

        posts = (postData || [])
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(p => {
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');

        return {
            id: p.id,
            user: p.user_name,

            media: Array.isArray(p.media_urls)
                ? p.media_urls
                : (p.media_urls ? [p.media_urls] : []),

            caption: p.content,
            likes: Number(p.likes) || 0,

            liked: likedPosts[p.id] || false,
            created_at: p.created_at
        };
    });

        alerts = alertData || [];

        scheduleData = (sched || []).map(s => ({
            day: s.day,
            time: s.time,
            name: s.session_name,
            status: s.status
        }));

        currentSession = current;
        crewImages = crew || [];
        teams = teamData || [];

        total = sched?.length || 0;
        completed = sched?.filter(s => s.status === 'done').length || 0;
    }

    async function likePost(post) {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');

    let newLikes;

    if (likedPosts[post.id]) {
        newLikes = post.likes - 1;
        delete likedPosts[post.id];
        post.liked = false;
    } else {
        newLikes = post.likes + 1;
        likedPosts[post.id] = true;
        post.liked = true;
    }

    post.likes = newLikes;
    posts = [...posts];

    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));

    await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', post.id);
}

    onMount(() => {
    updateTimer();
    setInterval(updateTimer, 1000);

    fetchAll();
const checkMobile = () => isMobile = window.innerWidth <= 768;
checkMobile();
window.addEventListener('resize', checkMobile);
    const channel = supabase
        .channel('live-updates')

        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'posts'
        }, (payload) => {
            console.log('POST CHANGE', payload);
            fetchAll();
        })

        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'schedule'
        }, () => fetchAll())

        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'alerts'
        }, () => fetchAll())

        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'crew_media'
        }, () => fetchAll())

        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'teams'
        }, () => fetchAll())

        .subscribe((status) => {
            console.log('REALTIME STATUS:', status);
        });

    const interval = setInterval(() => {
        if (showCrewViewer) return;
        if (crewImages.length > 0) {
            crewIndex = (crewIndex + 1) % crewImages.length;
        }
    }, 3000);
    return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
    };
});

    let selectedPost = null;
    let viewerIndex = 0;

    function openViewer(post, index = 0) {
        selectedPost ={
        ...post,
        media: post.media.slice(0, 5)
    };
        viewerIndex = index;
    }

    function closeViewer() { selectedPost = null; }

    function nextMedia() { viewerIndex = (viewerIndex + 1) % selectedPost.media.length; }
    function prevMedia() { viewerIndex = (viewerIndex - 1 + selectedPost.media.length) % selectedPost.media.length; }

    function nextCrew() { crewIndex = (crewIndex + 1) % crewImages.length; }
    function prevCrew() { crewIndex = (crewIndex - 1 + crewImages.length) % crewImages.length; }

    let showCrewViewer = false;
    function openCrewViewer() { showCrewViewer = true; }
    function closeCrewViewer() { showCrewViewer = false; }

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;

    if (touchStartX - touchEndX > 50) {
        nextMedia();
    }

    if (touchEndX - touchStartX > 50) {
        prevMedia();
    }
}
function nextPostMedia(postId, mediaLength) {
    postIndexes[postId] = ((postIndexes[postId] || 0) + 1) % Math.min(mediaLength, 5);
    postIndexes = { ...postIndexes };
}

function prevPostMedia(postId, mediaLength) {
    postIndexes[postId] =
        ((postIndexes[postId] || 0) - 1 + Math.min(mediaLength, 5)) % Math.min(mediaLength, 5);
    postIndexes = { ...postIndexes };
}
let startX = 0;

function handlePostTouchStart(e) {
    startX = e.changedTouches[0].screenX;
}

function handlePostTouchEnd(e, post) {
    let endX = e.changedTouches[0].screenX;

    if (startX - endX > 50) {
        nextPostMedia(post.id, post.media.length);
    }

    if (endX - startX > 50) {
        prevPostMedia(post.id, post.media.length);
    }
}

function handleCrewTouchStart(e) {
    crewStartX = e.changedTouches[0].screenX;
}

function handleCrewTouchEnd(e) {
    let endX = e.changedTouches[0].screenX;

    if (crewStartX - endX > 50) {
        nextCrew(); 
    }

    if (endX - crewStartX > 50) {
        prevCrew(); 
    }
}


let boys = 18;
let girls = 12;

$: totalPeople = boys + girls;
$: boysPercent = totalPeople ? (boys / totalPeople) * 100 : 0;
$: girlsPercent = totalPeople ? (girls / totalPeople) * 100 : 0;
</script>


<style>
:global(body) {
    margin: 0;
    background: #020617;
    font-family: 'Orbitron', sans-serif;
}


.topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;

    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    padding: 8px 24px 6px 24px;

    border-bottom: 5px solid #259ad6;
    background: rgba(0, 0, 0, 0.8);
}

.timer {
    color: #259ad6;
    font-size: 20px;
    letter-spacing: 2px;
    text-shadow: 0 0 8px #259ad6;
    font-family: GoodTimes, serif;
}

:global(.prefix.negative),
:global(.prefix.positive) {
    color: #fdc134;
    text-shadow: 0 0 8px #fdc134;
}

.title {
    text-align: center;
    font-size: 60px;
    letter-spacing: 6px;
    color: white;
    font-family: Valo, sans-serif;
    margin: 0;
}

.logo {
    display: flex;
    justify-content: flex-end;
}

.logo img {
    height: 40px;
    filter: drop-shadow(0 0 6px #259ad68e);
}


.page {
    position: fixed;
    top: 90px;
    left: 0;
    right: 0;
    bottom: 0;

    display: grid;
    grid-template-columns: 1.2fr 2fr;
    gap: 12px;
    padding: 12px;

    overflow: hidden;
    
}


.posts {
    overflow-y: auto;
}

@media (max-width: 768px) {
    .posts {
        min-height: 60vh;
    }

    .post-card {
        padding: 10px;
        border: 1px solid #259ad6;
        border-radius: 6px;
        margin-bottom: 12px;
    }

    .post-img {
        width: 100%;
        height: auto;
        max-height: 300px;
        object-fit: cover;
    }
}

.logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 10px;
}

.post-btn {
    background: transparent;
    border: 1px solid #259ad6;
    color: #259ad6;
    padding: 4px 10px;
    cursor: pointer;
    margin-right: 8px;
}

.post-btn {
    transition: all 0.2s ease;
}

.post-btn:hover {
    background: #259ad6;
    color: black;
    box-shadow: 0 0 10px #259ad6;
    transform: translateY(-1px);
}

.post-card {
    margin-top: 12px;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 12px;
}

.post-user {
    font-size: 18px;
    color: #fdc134;
}

.post-img {
    width: 100%;
    height: 160px;
    object-fit: contain;
    border: 1px solid #259ad6;
    margin-top: 6px;
    background: black;
}

.post-actions {
    display: flex;
    gap: 12px;
    margin-top: 6px;
    cursor: pointer;
}

.post-caption {
    font-size: 13px;
    margin-top: 6px;
}

.post-comments {
    font-size: 12px;
    color: #94a3b8;
}

.right {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 6px;
    height: 100%;
}

.panel {
    border: 2px solid #259ad6;
    background: rgba(0, 0, 0, 0.6);
    padding: 9px;
    box-shadow: 0 0 10px #259ad644;
}
.page > .panel:last-child {
    min-height: 210px; 
}

.panel-title {
    color: #259ad6;
    font-size: 14px;
    letter-spacing: 2px;
    margin-bottom: 10px;
    font-family: GoodTimes, serif;
}

.top-row {
    display: grid;
    grid-template-columns: 1.3fr 0.9fr 1.2fr;
    gap: 12px;
    height: 200px;
}




.schedule {
    overflow-y: auto;
    max-height: 180px;
}

.schedule-item {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    font-size: 13px;

}

.schedule-item.ongoing .status-icon {
    animation: blink 1s infinite;
}

@keyframes blink {
    50% { opacity: 0.3; }
}
.status-icon { width: 20px; }

.schedule-item.done { color: #22c55e; }
.schedule-item.ongoing { color: #fdc134; }
.schedule-item.cancelled { color: #ef4444; }

.current-two-panels {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 12px;
}

.session-name {
    font-size: 18px;
    color: #fdc134;
}

.session-time {
    font-size: 14px;
    color: #259ad6;
}


.media-content img {
    width: 100%;
    height: 110px;
    object-fit: contain;
    border: 1px solid #259ad6;
}


.progress-bar {
    height: 8px;
    background: #1e293b;
    margin-top: 10px;
}

.progress-fill {
    height: 100%;
    background: #fdc134;
}

.leader {
    display: flex;
    justify-content: space-between;
}

.alert-blink {
    animation: blink 1s infinite;
    color: #fdc134;
}

@keyframes blink {
    50% { opacity: 0.3; }
}

.media-content video {
    width: 100%;
    height: 120px;
    object-fit: contain;
    border: 1px solid #259ad6;
}
.alert-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    height: 100%;
}

.alert-icon {
    animation: blink 1s infinite;
    color: #fdc134;
    flex-shrink: 0;
}

.alert-text {
    height: 60px;             
    overflow-y: auto;          
    overflow-x: hidden;
    font-size: 22px;
    color: #fdc134;
    line-height: 1.4;
    word-break: break-word; 
}

.media-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}

.viewer {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.viewer-content {
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
    text-align: center;
}

.viewer img,
.viewer video {
    max-width: 100%;
    max-height: 60vh;
    margin-bottom: 10px;
}

.viewer-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}

.viewer button {
    padding: 6px 10px;
    cursor: pointer;
}

.viewer-text {
    color: white;
    font-size: 14px;
}
.crew-controls {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 6px;
}

.crew-controls button {
    padding: 1px 2px;
    cursor: pointer;
}

@media (max-width: 768px) {

    .topbar {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6px;
        gap: 4px;
        border-bottom: 3px solid #259ad6;
    }

    .title {
        order: 1;
        font-size: 24px;
        letter-spacing: 2px;
    }

    .timer {
        order: 3;
        font-size: 12px;
    }

    .logo {
        order:2;
        justify-content: center;
    }

    .logo img {
        height: 22px;
    }

    .page {
        position: absolute;
        top: 80px;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .right {
        display: flex;
        flex-direction: column;
    }

    .top-row {
        display: flex;
        flex-direction: column;
    }

    .current-two-panels {
        display: flex;
        flex-direction: column;
    }

    .post-img {
        height: auto;
        max-height: 250px;
        object-fit: cover;
    }

    .media-grid {
        grid-template-columns: 1fr;
    }

    .media-content img,
    .media-content video {
        height: 180px;
        object-fit: contain;
    }

    .viewer-content {
        max-width: 95%;
        max-height: 90%;
    }
}


@media (max-width: 768px) {

    .topbar {
        display: grid !important;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto;
        align-items: center;
        padding: 8px 10px;
        border-bottom: 3px solid #259ad6;
        row-gap: 4px;
    }


    .title {
        grid-column: 1 / 2;
        grid-row: 1 / 2;
        font-size: 22px;
        letter-spacing: 2px;
        text-align: left;
    }

  
    .logo {
        grid-column: 1 / 2;
        grid-row: 2 / 3;
        justify-content: flex-start;
    }

    .logo img {
        height: 18px;
    }

    .timer {
        grid-column: 2 / 3;
        grid-row: 1 / 3;
        font-size: 12px;
        text-align: right;
        align-self: center;
        white-space: nowrap;
    }
}

.mobile-tabs {
    display: none;
}

@media (max-width: 768px) {
    .mobile-tabs {
        display: flex;
        justify-content: space-around;
        padding: 6px;
        background: rgba(0,0,0,0.9);
        border-bottom: 2px solid #259ad6;
        position: fixed;
        top: 80px;
        left: 0;
        right: 0;
        z-index: 20;
    }

    .mobile-tabs button {
        background: transparent;
    border: 1px solid #259ad6;
    color: #259ad6;
    padding: 6px 10px;
    cursor: pointer;
    font-family: inherit;

    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
    }

    .mobile-tabs button.active {
        background: #259ad6;
    color: black;
    box-shadow: 0 0 10px #259ad6;
    transform: scale(1.05);
    }

    .mobile-tabs button::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(37,154,214,0.3);
    opacity: 0;
    transition: opacity 0.3s;
}

.mobile-tabs button:active::after {
    opacity: 1;
}

    .page {
        top: 130px; 
    }
}

@media (min-width: 769px) {
    .page {
        display: grid;
        grid-template-columns: 1.2fr 2fr;
        grid-template-rows: auto auto;
    }

    .posts {
        grid-column: 1 / 2;
        grid-row: 1 / 3;
    }

    .right {
        grid-column: 2 / 3;
        grid-row: 1 / 2;
    }
    .page > .panel:last-child {
        grid-column: 2 / 3;
        grid-row: 2 / 3;
    }
}

.carousel {
    position: relative;
    width: 100%;
    height: 220px;
    background: black;
    border: 1px solid #259ad6;
    overflow: hidden;
}

.carousel-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.dots {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
}

.dot {
    width: 6px;
    height: 6px;
    background: rgba(255,255,255,0.4);
    border-radius: 50%;
}

.dot.active {
    background: white;
}

.viewer-content {
    position: relative;
}

.nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);

    width: 40px;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: 50%;

    font-size: 22px;
    cursor: pointer;
}
.nav:hover {
    background: rgba(37,154,214,0.8);
}

.nav.left { left: 10px; }
.nav.right { right: 10px; }

.viewer-dots {
    bottom: 20px;
}


.download-btn {
    position: absolute;
    top: 15px;
    right: 15px;

    background: white;
    color: black;

    padding: 6px 12px;
    border-radius: 6px;

    font-size: 13px;
    font-weight: bold;
    text-decoration: none;

    cursor: pointer;
}

.media-content {
    position: relative;
}

.media-content .dots {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
}

.gender-stat {
    margin-top: 14px;
}

.gender-labels {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 5px;
}

.boys {
    color: #ffffff;
    font-weight: bold;
}

.girls {
    color: #ffffff;
    font-weight: bold;
}

.gender-bar {
    display: flex;
    height: 8px;
    background: #1e293b;
    overflow: hidden;
}

.boys-bar {
    background: #259ad6;
}

.girls-bar {
    background: #fdc134;
}

@media (min-width: 769px) {
    .page > .panel:last-child {
        overflow-y: auto;      
    }
}

@media (min-width: 769px) {
    .session-name {
        font-size: clamp(10px, 1vw, 18px);
        line-height: 1;
        word-break: break-word;
    }
}
</style>
<div class="topbar">
    <div class="timer">
        {@html countdown
            .replace(/^T-/, '<span class="prefix negative">T-</span>')
            .replace(/^T\+/, '<span class="prefix positive">T+</span>')
        }
    </div>

    <div class="title">MISSION LOG</div>

    <div class="logo">
        <img src="/asc-logo-color.svg" />
    </div>
</div>


<div class="mobile-tabs">
    <button class:active={activeTab === 'posts'} on:click={() => activeTab = 'posts'}>Logs</button>
    <button class:active={activeTab === 'live'} on:click={() => activeTab = 'live'}>Live</button>
    <button class:active={activeTab === 'stats'} on:click={() => activeTab = 'stats'}>Stats</button>
</div>

<div class="page">

    {#if !isMobile || activeTab === 'posts'}
    <div class="posts panel">

        <div class="logs-header">
            <div class="panel-title">MISSION LOGS</div>
            <button class="post-btn" on:click={() => navigate('portal')}>
                LOGIN
            </button>
        </div>

        {#each posts as post}
    <div class="post-card">
        <div class="post-user">
            {post.user}
            <div style="font-size:10px; color:#64748b;">
                {new Date(post.created_at).toLocaleString()}
            </div>
        </div>

{#if post.media && post.media.length > 0}

<div 
    class="carousel"
    on:touchstart={handlePostTouchStart}
    on:touchend={(e) => handlePostTouchEnd(e, post)}
>

    {#if post.media[(postIndexes[post.id] || 0)].match(/\.(mp4|webm|ogg)$/)}
        <video 
    class="carousel-img"
    src={post.media[(postIndexes[post.id] || 0)]}
    autoplay
    muted
    loop
    playsinline
    on:click={() => openViewer(post, postIndexes[post.id] || 0)}
/>
    {:else}
        <img 
            class="carousel-img"
            src={post.media[(postIndexes[post.id] || 0)]}
            on:click={() => openViewer(post, postIndexes[post.id] || 0)}
        />
    {/if}

    {#if post.media.length > 1}
        <button class="nav left" on:click={() => prevPostMedia(post.id, post.media.length)}>‹</button>
        <button class="nav right" on:click={() => nextPostMedia(post.id, post.media.length)}>›</button>
    {/if}

    {#if post.media.length > 1}
<div class="dots">
    {#each post.media.slice(0,5) as _, i}
        <span class="dot {i === (postIndexes[post.id] || 0) ? 'active' : ''}"></span>
    {/each}
</div>
{/if}

</div>

{/if}

        <div class="post-actions">
            <span on:click={() => likePost(post)}>❤️ {post.likes}</span>
        </div>

        <div class="post-caption">
            <strong>{post.user}</strong> {post.caption}
        </div>
    </div>
{/each}

    </div>
    {/if}

    {#if !isMobile || activeTab === 'live'}
    <div class="right">

        <div class="top-row">

            <div class="panel">
                <div class="panel-title">FULL SCHEDULE</div>
                <div class="schedule">

                    {#each Object.entries(
                        scheduleData.reduce((acc, s) => {
                            if (!acc[s.day]) acc[s.day] = [];
                            acc[s.day].push(s);
                            return acc;
                        }, {})
                    ) as [day, sessions]}

                        <div style="margin-bottom:10px;">
                            <div style="color:#259ad6; font-weight:bold;">DAY {day}</div>

                            {#each sessions as item}
                                <div class="schedule-item {item.status}">
                                    <span class="status-icon">
                                        {#if item.status === 'done'} ✔ {/if}
                                        {#if item.status === 'ongoing'} ● {/if}
                                        {#if item.status === 'cancelled'} ✖ {/if}
                                    </span>
                                    {item.time} — {item.name}
                                </div>
                            {/each}
                        </div>

                    {/each}

                </div>
            </div>

            <div class="current-two-panels">

                <div class="panel">
                    <div class="panel-title">CURRENT SESSION</div>

                    {#if overrideSession}
                        <div class="session-name">{overrideSession.session_name}</div>
                    {:else if currentSession}
                        <div class="session-name">{currentSession.session_name}</div>
                        <div class="session-time">{currentSession.time}</div>
                    {:else}
                        <div class="session-name">No Active Session</div>
                    {/if}
                </div>

                <div class="panel">
                    <div class="panel-title">ALERTS</div>

                    {#if alerts.length > 0}
                        <div class="alert-row">
                            <span class="alert-icon">⚠</span>
                            <div class="alert-text">
                                {alerts[0].text}
                            </div>
                        </div>
                    {/if}
                </div>

            </div>

            <div class="panel">
                <div class="panel-title">CREW</div>

                <div 
    class="media-content"
    on:touchstart={handleCrewTouchStart}
    on:touchend={handleCrewTouchEnd}
>

    {#if crewImages.length > 0}

        {#if crewImages[crewIndex].image_url.match(/\.(mp4|webm|ogg)$/)}
            <video autoplay muted loop on:click={openCrewViewer}>
                <source src={crewImages[crewIndex].image_url} />
            </video>
        {:else}
            <img 
                src={crewImages[crewIndex].image_url}
                on:click={openCrewViewer}
            />
        {/if}

        <div class="crew-controls">
            <button on:click={prevCrew}>◀</button>
            <button on:click={nextCrew}>▶</button>
        </div>

       

        {#if crewImages[crewIndex].caption}
            <div style="text-align:center; margin-top:6px;">
                {crewImages[crewIndex].caption}
            </div>
        {/if}

    {/if}

</div>
            </div>

        </div>

    </div>
    {/if}

{#if !isMobile || activeTab === 'stats'}
<div class="panel">

    <div class="panel-title">MISSION STATS</div>

    Sessions Completed: {completed} / {total}

    <div class="progress-bar">
        <div class="progress-fill"
             style="width:{total ? (completed/total)*100 : 0}%"></div>
    </div>

    <div class="gender-stat">

        <div class="gender-labels">
    <div>
        <span class="boys">Boys</span><br>
        {boys}
    </div>

    <div style="text-align:right;">
        <span class="girls">Girls</span><br>
        {girls}
    </div>
</div>

        <div class="gender-bar">
            <div class="boys-bar" style="width:{boysPercent}%"></div>
            <div class="girls-bar" style="width:{girlsPercent}%"></div>
        </div>

    </div>

    <br>

    <div class="panel-title">LEADING CREWS</div>

    {#each teams as t}
        <div class="leader">
            <span>{t.team_name}</span>
            <span>{t.points}</span>
        </div>
    {/each}

</div>
{/if}

</div>
{#if selectedPost}
<div 
    class="viewer"
    on:click={closeViewer}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
>
    <div class="viewer-content" on:click|stopPropagation>

        {#if selectedPost.media[viewerIndex].match(/\.(mp4|webm|ogg)$/)}
            <video controls autoplay playsinline on:loadeddata={(e) => e.target.muted = false}>
                <source src={selectedPost.media[viewerIndex]} />
            </video>
        {:else}
            <img src={selectedPost.media[viewerIndex]} />
        {/if}

        {#if selectedPost.media.length > 1}
        <button class="nav left" on:click={prevMedia}>‹</button>
        <button class="nav right" on:click={nextMedia}>›</button>
        {/if}

        <div class="dots viewer-dots">
            {#each selectedPost.media as _, i}
                <span class="dot {i === viewerIndex ? 'active' : ''}"></span>
            {/each}
        </div>

        <a href={selectedPost.media[viewerIndex]} download target="_blank" class="download-btn">
            ⬇ DOWNLOAD
        </a>

    </div>
</div>
{/if}

{#if showCrewViewer}
<div 
    class="viewer"
    on:click={closeCrewViewer}
    on:touchstart={handleCrewTouchStart}
    on:touchend={handleCrewTouchEnd}
>
    <div class="viewer-content" on:click|stopPropagation>

        {#if crewImages[crewIndex].image_url.match(/\.(mp4|webm|ogg)$/)}
            <video controls autoplay>
                <source src={crewImages[crewIndex].image_url} />
            </video>
        {:else}
            <img src={crewImages[crewIndex].image_url} />
        {/if}

        {#if crewImages.length > 1}
            <button class="nav left" on:click={prevCrew}>‹</button>
            <button class="nav right" on:click={nextCrew}>›</button>
        {/if}

        <a 
            href={crewImages[crewIndex].image_url} 
            download 
            target="_blank"
            class="download-btn"
        >
            Download
        </a>

    </div>
</div>
{/if}