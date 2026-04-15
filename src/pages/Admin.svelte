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
        const { data: sched } = await supabase.from('schedule').select('*');

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
        await supabase.from('schedule').update({ status }).eq('id', id);
        fetchAll();
    }

    onMount(fetchAll);
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
    width: 200px;
    margin-top: 8px;
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
</style>

<div class="container">

    <h2>ADMIN PANEL</h2>

    <!-- PENDING -->
    <h3>Pending Posts</h3>
    {#each pendingPosts as post}
        <div class="card">
            <b>{post.user_name}</b><br>
            {post.activity_name}<br>
            {post.content}

            {#if post.media_url}
                {#if post.media_url.match(/\.(mp4|webm|ogg)$/)}
                    <video class="media" controls>
                        <source src={post.media_url} />
                    </video>
                {:else}
                    <img class="media" src={post.media_url} />
                {/if}
            {/if}

            <br>
            <button on:click={() => approve(post.id)}>Approve</button>
            <button on:click={() => reject(post.id)}>Reject</button>
        </div>
    {/each}

    <!-- APPROVED -->
    <h3>Approved Posts</h3>
    {#each approvedPosts as post}
        <div class="card">
            {post.content}

            {#if post.media_url}
                {#if post.media_url.match(/\.(mp4|webm|ogg)$/)}
                    <video class="media" controls>
                        <source src={post.media_url} />
                    </video>
                {:else}
                    <img class="media" src={post.media_url} />
                {/if}
            {/if}

            <button on:click={() => deletePost(post.id)}>Delete</button>
        </div>
    {/each}

    <!-- ALERT -->
    <h3>Send Alert</h3>
    <textarea bind:value={alertText}></textarea>
    <button on:click={sendAlert}>Send</button>

    <!-- CREW -->
    <h3>Upload Crew Media</h3>
    <input type="file" accept="image/*,video/*"
        on:change={(e) => crewFile = e.target.files[0]} />

    <input placeholder="Caption (optional)" bind:value={crewCaption} />

    <button on:click={uploadCrew}>Upload</button>

    <!-- SCHEDULE CONTROL -->
    <h3>Schedule Control</h3>
    {#each schedule as s}
        <div class="card">
            {s.day} - {s.session_name}

            <button on:click={() => updateStatus(s.id, 'done')}>✔</button>
            <button on:click={() => updateStatus(s.id, 'ongoing')}>●</button>
            <button on:click={() => updateStatus(s.id, 'cancelled')}>✖</button>
        </div>
    {/each}

    <br>
    <button on:click={() => navigate('lander')}>← Back</button>

</div>