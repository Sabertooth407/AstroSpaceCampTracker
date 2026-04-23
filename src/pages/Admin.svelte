<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';
    export let navigate;
    let uploadProgress = 0;
    let pendingPosts = [];
    let approvedPosts = [];
    let alertText = '';
    let crewFile;
    let crewCaption = '';
    let schedule = [];
   let isAuthorized = false;
let loading = true;

async function protectAdmin() {
    const { data: { user } } = await supabase.auth.getUser();

    // Not logged in
    if (!user) {
        navigate('portal');
        return;
    }

    // Get role
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Not admin
    if (error || !data || data.role !== 'Admin') {
        navigate('portal');
        return;
    }

    // ✅ Authorized
    isAuthorized = true;

    // ONLY NOW fetch data
    await fetchAll();

    loading = false;
}

    async function fetchAll() {
        const { data: pending } = await supabase.from('posts').select('*').eq('status', 'pending');
        const { data: approved } = await supabase.from('posts').select('*').eq('status', 'approved');
        const { data: sched } = await supabase
    .from('schedule')
    .select('*')
    .order('day', { ascending: true })
    .order('time', { ascending: true });

        pendingPosts = pending || [];
        approvedPosts = approved || [];
        schedule = sched || [];
    }

    async function approve(id) {
        await supabase.from('posts').update({ status: 'approved' }).eq('id', id);
        fetchAll();
    }

    async function reject(id) {
        await supabase.from('posts').delete().eq('id', id);
        fetchAll();
    }

    async function deletePost(id) {
        await supabase.from('posts').delete().eq('id', id);
        fetchAll();
    }

    async function sendAlert() {
    const del = await supabase.from('alerts').delete().neq('id', 0);
    console.log("DELETE:", del);

    const ins = await supabase.from('alerts').insert([{ text: alertText }]);
    console.log("INSERT:", ins);

    if (ins.error) {
        alert("Failed: " + ins.error.message);
        return;
    }

    alertText = '';
    alert("Alert sent");
    fetchAll();
}

    async function uploadCrew() {
        if (!crewFile) return;

        const fileExt = crewFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const formData = new FormData();
formData.append("file", crewFile);
uploadProgress = 1;

const xhr = new XMLHttpRequest();

const data = await new Promise((resolve, reject) => {

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            uploadProgress = Math.round((e.loaded / e.total) * 100);
        }
    };

    xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (res.url) resolve(res);
        else reject();
    };

    xhr.onerror = () => reject();

    xhr.open("POST", "https://astrospacecamptracker.onrender.com/upload");
    xhr.send(formData);
});


if (!data.url) {
    alert("Upload failed");
    return;
}

await supabase.from('crew_media').insert([
    {
        image_url: data.url,
        caption: crewCaption
    }
]);

        alert("Uploaded");

        crewFile = null;
        crewCaption = '';

        fetchAll();
        setTimeout(() => {
    uploadProgress = 0;
}, 800);
    }
    
    async function updateStatus(id, status) {
    await supabase.from('current_override').delete().eq('id', 1);
    if (status === 'ongoing') {

        const { data: current } = await supabase
            .from('schedule')
            .select('*')
            .eq('status', 'ongoing')
            .maybeSingle();

        if (current && current.id !== id) {

            if (current.status !== 'cancelled') {
                await supabase
                    .from('schedule')
                    .update({ status: 'done' })
                    .eq('id', current.id);
            }
        }
    }

    await supabase
        .from('schedule')
        .update({ status })
        .eq('id', id);

    fetchAll();
}
onMount(() => {
    protectAdmin();
});
    

async function forceSession(name) {
    await supabase.from('current_override').upsert([
        { id: 1, session_name: name }
    ]);
}

async function clearForce() {
    await supabase.from('current_override').delete().eq('id', 1);
}
let showApproved = false;
let showPending = true;
</script>

<style>
.container { padding: 20px; }

.card {
    border: 1px solid #259ad6;
    padding: 10px;
    margin-bottom: 10px;
}

textarea, input {
    width: 100%;
    background: black;
    color: white;
    border: 1px solid #259ad6;
    margin-bottom: 8px;
}

button {
    margin: 4px;
    padding: 6px 10px;
    cursor: pointer;
}

.media {
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    background: black;
    border: 1px solid #259ad6;
}


@media (max-width: 768px) {
    .container {
        padding: 12px;
    }

    .card {
        font-size: 14px;
    }

    .media {
        width: 100%;
        max-width: 100%;
    }

    button {
        width: 100%;
    }
}
.section {
    margin-bottom: 30px;
    border-top: 1px solid #259ad6;
    padding-top: 15px;
}

h3 {
    color: #259ad6;
}

.progress-bar {
    height: 8px;
    background: #1e293b;
    margin-top: 10px;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #259ad6;
    transition: width 0.2s;
}
</style>
{#if loading}
    <div style="color:white; padding:20px;">Checking access...</div>
{:else if isAuthorized}
<div class="container">

    <h2>ADMIN PANEL</h2>

    <div class="section">
    <h3 on:click={() => showPending = !showPending}>
    Pending Posts {showPending ? '▲' : '▼'}
</h3>
{#if showPending}
    {#each pendingPosts as post}
        <div class="card">
            <b>{post.user_name}</b><br>
            {post.activity_name}<br>
            {post.content}

            {#if post.media_urls}
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px;">
        {#each post.media_urls as url}
            {#if url.match(/\.(mp4|webm|ogg)$/)}
                <video class="media" controls>
                    <source src={url} />
                </video>
            {:else}
                <img class="media" src={url} />
            {/if}
        {/each}
        
    </div>
{/if}

            <br>
            <button on:click={() => approve(post.id)}>Approve</button>
            <button on:click={() => reject(post.id)}>Reject</button>
        </div>
    {/each}
    {/if}
</div>

    <!-- APPROVED -->
     <div class="section">
    <h3 on:click={() => showApproved = !showApproved} style="cursor:pointer;">
    Approved Posts {showApproved ? '▲' : '▼'}
</h3>
{#if showApproved}
    {#each approvedPosts as post}
        <div class="card">
            {post.content}

            {#if post.media_urls}
                <div class="media-grid">
                    {#each post.media_urls as url}
                        {#if url.match(/\.(mp4|webm|ogg)$/)}
                            <video class="media" controls>
                                <source src={url} />
                            </video>
                        {:else}
                            <img class="media" src={url} />
                        {/if}
                    {/each}
                </div>
            {/if}

            <button on:click={() => deletePost(post.id)}>Delete</button>
        </div>
    {/each}
{/if}
</div>
<div class="section">
    <h3>Send Alert</h3>
    <textarea bind:value={alertText}></textarea>
    <button on:click={sendAlert}>Send</button>
</div>
<div class="section">
    <h3>Upload Crew Media</h3>
    <input type="file" accept="image/*,video/*"
        on:change={(e) => crewFile = e.target.files[0]} />

    <input placeholder="Caption (optional)" bind:value={crewCaption} />

    <button on:click={uploadCrew}>Upload</button>
    {#if uploadProgress > 0 || loading}
    <div class="progress-bar">
        <div class="progress-fill" style="width:{uploadProgress}%"></div>
    </div>
    <div style="font-size:12px; margin-top:4px;">
        Uploading: {uploadProgress}%
    </div>
{/if}
</div>
<div class="section">
<h3>Force Current Session</h3>

<button on:click={() => forceSession('Break')}>Break</button>
<button on:click={() => forceSession('Sleep')}>Sleep</button>
</div>  
<div class="section">
    <h3>Schedule Control</h3>
    {#each Object.entries(
    schedule.reduce((acc, s) => {
        if (!acc[s.day]) acc[s.day] = [];
        acc[s.day].push(s);
        return acc;
    }, {})
) as [day, sessions]}

    <div class="card">
        <b>DAY {day}</b>

        {#each sessions as s}
            <div style="margin-top:6px;">
                {s.time} — {s.session_name}

                <button on:click={() => updateStatus(s.id, 'done')}>✔</button>
                <button on:click={() => updateStatus(s.id, 'ongoing')}>●</button>
                <button on:click={() => updateStatus(s.id, 'cancelled')}>✖</button>
            </div>
        {/each}
    </div>

{/each}
</div>
    <br>
    <button on:click={() => navigate('lander')}>← Back</button>

</div>
{:else}
    <!-- nothing (user already redirected) -->
{/if}