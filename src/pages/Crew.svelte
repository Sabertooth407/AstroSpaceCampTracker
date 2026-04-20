<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';

    export let navigate;

    let students = [];
    let organisers = [];

    async function fetchCrew() {
        const { data } = await supabase.from('crew_profiles').select('*');

        students = data?.filter(c => c.role === 'student') || [];
        organisers = data?.filter(c => c.role === 'organiser') || [];
    }

    onMount(fetchCrew);
</script>

<style>
:global(body) {
    background: #020617;
    font-family: 'Orbitron', sans-serif;
}

/* HEADER (no panel) */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    padding: 14px 18px;
    border-bottom: 2px solid #259ad6;
    background: rgba(0,0,0,0.8);
}

.title {
    font-size: 26px;
    letter-spacing: 3px;
    font-family: Valo, sans-serif;
}

.back-btn {
    background: transparent;
    border: 1px solid #259ad6;
    color: #259ad6;
    padding: 5px 12px;
    cursor: pointer;
}

/* PAGE */
.page {
    padding: 12px;
}

/* SECTION */
.section {
    margin-bottom: 24px;
}

.section-title {
    color: #259ad6;
    font-size: 14px;
    letter-spacing: 2px;
    margin-bottom: 10px;
    font-family: GoodTimes, serif;
}

/* GRID BASE */
.grid {
    display: grid;
    gap: 8px;
}

/* STUDENTS GRID */
.students-grid {
    grid-template-columns: repeat(10, 1fr);
}

/* MISSION CONTROL GRID */
.org-grid {
    grid-template-columns: repeat(6, 1fr);
}

/* CARD */
.card {
    background: black;
    border: 1px solid #259ad6;
    text-align: center;
    padding: 4px;
    transition: 0.2s;
}

.card:hover {
    transform: scale(1.05);
    box-shadow: 0 0 8px #259ad6;
}

/* IMAGE */
.card img {
    width: 100%;
    height: 70px;
    object-fit: cover;
}

/* TEXT */
.name {
    font-size: 11px;
    color: #fdc134;
}

.role {
    font-size: 10px;
    color: #64748b;
}

/* RESPONSIVE */

/* Tablet */
@media (max-width: 1024px) {
    .students-grid {
        grid-template-columns: repeat(5, 1fr);
    }
    .org-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Phone */
@media (max-width: 768px) {
    .students-grid {
        grid-template-columns: repeat(3, 1fr);
    }
    .org-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .card img {
        height: 80px;
    }
}
</style>

<!-- HEADER -->
<div class="header">
    <div class="title">MEET THE CREW</div>
    <button class="back-btn" on:click={() => navigate('lander')}>
        ← BACK
    </button>
</div>

<div class="page">

    <!-- STUDENTS FIRST -->
    <div class="section">
        <div class="section-title">CREW MEMBERS</div>
        <div class="grid students-grid">
            {#each students as p}
                <div class="card">
                    <img src={p.image_url} />
                    <div class="name">{p.name}</div>
                    <div class="role">{p.team}</div>
                </div>
            {/each}
        </div>
    </div>

    <!-- MISSION CONTROL -->
    <div class="section">
        <div class="section-title">MISSION CONTROL</div>
        <div class="grid org-grid">
            {#each organisers as p}
                <div class="card">
                    <img src={p.image_url} />
                    <div class="name">{p.name}</div>
                    <div class="role">{p.role}</div>
                </div>
            {/each}
        </div>
    </div>

</div>