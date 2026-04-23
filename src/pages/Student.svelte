<script>
    import { supabase } from '../lib/supabase';
    export let navigate;

    let isAuthorized = false;
let loadingPage = true;
let uploadProgress = 0;

    let name = '';
    let activity = '';
    let content = '';
    let files = [];
    let loading = false; 

    async function protectStudent() {
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

    // Not student
    if (error || !data || data.role !== 'Student') {
        navigate('portal');
        return;
    }

    // ✅ Authorized
    isAuthorized = true;

    // Fetch only after auth
    await fetchMyPosts();

    loadingPage = false;
}
    async function submitPost() {
        if (loading) return;
        loading = true;

        const finalName = name.trim() || "Crew";
        const finalActivity = activity;
        const finalContent = content;

        let mediaUrls = [];

        for (let file of files.slice(0, 5)) {

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

            const formData = new FormData();
formData.append("file", file);

const xhr = new XMLHttpRequest();

const promise = new Promise((resolve, reject) => {

    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
            uploadProgress = Math.round((e.loaded / e.total) * 100);
        }
    };

    xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        if (res.url) resolve(res.url);
        else reject();
    };

    xhr.onerror = () => reject();

    xhr.open("POST", "https://astrospacecamptracker.onrender.com/upload");
    xhr.send(formData);
});

const url = await promise;

mediaUrls.push(url);
uploadProgress = 0; // reset after each file
        }

        const { data: { user } } = await supabase.auth.getUser();

await supabase.from('posts').insert([
    {
        user_id: user.id,   // 🔒 REQUIRED
        user_name: finalName,
        activity_name: finalActivity,
        content: finalContent,
        media_urls: mediaUrls,
        likes: 0,
        status: "pending"
    }
]);

        alert("Post sent");

        name = '';
        activity = '';
        content = '';
        files = [];
        loading = false;
    }

    let myPosts = [];

async function fetchMyPosts() {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)   // 🔒 IMPORTANT
        .order('created_at', { ascending: false });

    myPosts = data || [];
}

import { onMount } from 'svelte';

onMount(() => {
    protectStudent();
});
function removeFile(index) {
    files = files.filter((_, i) => i !== index);
}

</script>

<style>
.container {
    padding: 20px;
}

input, textarea {
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
    background: black;
    border: 1px solid #259ad6;
    color: white;
}

button {
    padding: 10px;
    background: #259ad6;
    border: none;
    cursor: pointer;
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.preview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin-bottom: 10px;
}

.preview img,
.preview video {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border: 1px solid #259ad6;
}

@media (max-width: 768px) {
    .container {
        padding: 16px;
    }

    .preview {
        grid-template-columns: repeat(2, 1fr);
    }

    button {
        width: 100%;
    }
}

.previous-posts {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.prev-card {
    border: 1px solid #259ad6;
    padding: 8px;
}

.prev-user {
    font-weight: bold;
    color: #fdc134;
}

.prev-content {
    font-size: 12px;
    margin-top: 4px;
}

.prev-media {
    display: flex;
    gap: 4px;
    margin-top: 6px;
}

.prev-media img,
.prev-media video {
    width: 60px;
    height: 60px;
    object-fit: cover;
}

.preview-item {
    position: relative;
}

.remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;

    background: rgba(0,0,0,0.7);
    color: white;
    border: none;

    width: 20px;
    height: 20px;
    border-radius: 50%;

    font-size: 12px;
    cursor: pointer;
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
{#if loadingPage}
    <div style="color:white; padding:20px;">Checking access...</div>

{:else if isAuthorized}
<div class="container">
    <h2>CREATE POST</h2>

    <input placeholder="Your Name" bind:value={name} />
    <input placeholder="Activity Name" bind:value={activity} />
    <textarea placeholder="Write your log..." bind:value={content}></textarea>

    <input type="file" multiple accept="image/*,video/*"
        on:change={(e) => {
    const newFiles = Array.from(e.target.files);
    files = [...files, ...newFiles].slice(0, 5);
}} />

    {#if files.length > 0}
        <div class="preview">
    {#each files as f, i}
        <div class="preview-item">

            {#if f.type.startsWith('video')}
                <video muted>
                    <source src={URL.createObjectURL(f)} />
                </video>
            {:else}
                <img src={URL.createObjectURL(f)} />
            {/if}

            <button class="remove-btn" on:click={() => removeFile(i)}>✕</button>

        </div>
    {/each}
</div>
    {/if}

    <button on:click={submitPost} disabled={loading}>
        {loading ? "Posting..." : "Submit"}
    </button>
    {#if uploadProgress > 0}
    <div class="progress-bar">
        <div class="progress-fill" style="width:{uploadProgress}%"></div>
    </div>
    <div style="font-size:12px; margin-top:4px;">
        Uploading: {uploadProgress}%
    </div>
{/if}

    <br><br>

    <button on:click={() => navigate('lander')}>
        ← Back
    </button>
</div>

<h3 style="margin-top:20px;">YOUR POSTS</h3>

<div class="previous-posts">
    {#each myPosts as p}
        <div class="prev-card">
            <div class="prev-user">{p.user_name}</div>
            <div class="prev-content">{p.content}</div>

            {#if p.media_urls && p.media_urls.length}
                <div class="prev-media">
                    {#each p.media_urls.slice(0,3) as m}
                        {#if m.match(/\.(mp4|webm|ogg)$/)}
                            <video src={m} muted></video>
                        {:else}
                            <img src={m} />
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>
    {/each}
</div>

{:else}
    <!-- nothing (redirect already happened) -->
{/if}