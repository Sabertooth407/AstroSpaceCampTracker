<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';

    let students = [];
    let organisers = [];

    async function fetchCrew() {
        const { data: crew } = await supabase.from('crew_profiles').select('*');

        students = crew.filter(c => c.role === 'student');
        organisers = crew.filter(c => c.role === 'organiser');
    }

    onMount(fetchCrew);
</script>

<style>
.page {
    padding: 20px;
    color: white;
}

.title {
    font-size: 28px;
    margin-bottom: 20px;
    color: #259ad6;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
}

.card {
    border: 1px solid #259ad6;
    padding: 10px;
    text-align: center;
    background: rgba(0,0,0,0.6);
}

.card img {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.name {
    margin-top: 6px;
    font-size: 14px;
}

.role {
    font-size: 11px;
    color: #94a3b8;
}
</style>

<div class="page">

    <div class="title">ORGANISERS</div>
    <div class="grid">
        {#each organisers as p}
            <div class="card">
                <img src={p.image_url} />
                <div class="name">{p.name}</div>
                <div class="role">{p.role}</div>
            </div>
        {/each}
    </div>

    <div class="title" style="margin-top:30px;">STUDENTS</div>
    <div class="grid">
        {#each students as p}
            <div class="card">
                <img src={p.image_url} />
                <div class="name">{p.name}</div>
                <div class="role">{p.team}</div>
            </div>
        {/each}
    </div>

</div>