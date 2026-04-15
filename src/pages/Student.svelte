<script>
    import { supabase } from '../lib/supabase';
    export let navigate;

    let name = '';
    let activity = '';
    let content = '';
    let files = [];

    async function submitPost() {
        let mediaUrls = [];


        for (let file of files.slice(0, 5)) {

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

            const { error } = await supabase.storage
                .from('media')
                .upload(fileName, file, {
                    contentType: file.type
                });

            if (error) {
                alert("Upload failed ❌");
                continue;
            }

            const { data } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

            mediaUrls.push(data.publicUrl);
        }


        await supabase.from('posts').insert([
            {
                user_name: name || "Crew",
                activity_name: activity,
                content: content,
                media_urls: mediaUrls,
                likes: 0,
                status: "pending"
            }
        ]);

        alert("Post sent 🚀");

        
        name = '';
        activity = '';
        content = '';
        files = [];
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
</style>

<div class="container">
    <h2>CREATE POST</h2>

    <input placeholder="Your Name" bind:value={name} />
    <input placeholder="Activity Name" bind:value={activity} />
    <textarea placeholder="Write your log..." bind:value={content}></textarea>


    <input type="file" multiple accept="image/*,video/*"
        on:change={(e) => files = Array.from(e.target.files).slice(0,5)} />

    {#if files.length > 0}
        <div class="preview">
            {#each files as f}
                {#if f.type.startsWith('video')}
                    <video muted>
                        <source src={URL.createObjectURL(f)} />
                    </video>
                {:else}
                    <img src={URL.createObjectURL(f)} />
                {/if}
            {/each}
        </div>
    {/if}

    <button on:click={submitPost}>Submit</button>

    <br><br>
    <button on:click={() => navigate('lander')}>
        ← Back
    </button>
</div>