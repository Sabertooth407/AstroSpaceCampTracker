<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';
    export let navigate;

    let pendingPosts = [];
    let approvedPosts = [];
    let alertText = '';
    let crewFile;
    let crewCaption = '';
    let schedule = [];

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
        await supabase.from('alerts').delete().neq('id', 0);
        await supabase.from('alerts').insert([{ text: alertText }]);

        alertText = '';
        alert("Alert sent");
        fetchAll();
    }

    async function uploadCrew() {
        if (!crewFile) return;

        const fileExt = crewFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('media')
            .upload(fileName, crewFile, {
                contentType: crewFile.type
            });

        if (error) {
            alert("Upload failed");
            return;
        }

        const { data } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);

        await supabase.from('crew_media').insert([
            {
                image_url: data.publicUrl,
                caption: crewCaption
            }
        ]);

        alert("Uploaded");

        crewFile = null;
        crewCaption = '';

        fetchAll();
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

    onMount(fetchAll);

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
</style>

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