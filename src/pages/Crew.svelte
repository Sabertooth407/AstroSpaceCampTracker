<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';

    export let navigate;

    let students = [];
    let organisers = [];
let crewViewerStartX = 0;
let crewViewerEndX = 0;
    async function fetchCrew() {
        const { data } = await supabase.from('crew_profiles').select('*');

        students = data?.filter(c => c.role === 'student') || [];
        organisers = data?.filter(c => c.role === 'organiser') || [];
    }

    onMount(fetchCrew);

    let selectedCrew = null;
let crewViewerIndex = 0;

let allCrew = [];

$: allCrew = [...students, ...organisers];

function openCrewViewer(index) {
    crewViewerIndex = index;
    selectedCrew = allCrew;
}

function closeCrewViewer() {
    selectedCrew = null;
}

function nextCrew() {
    crewViewerIndex = (crewViewerIndex + 1) % selectedCrew.length;
}

function prevCrew() {
    crewViewerIndex =
        (crewViewerIndex - 1 + selectedCrew.length) % selectedCrew.length;
}


async function downloadImage(url, name = 'crew-image') {
    try {
        const res = await fetch(url);
        const blob = await res.blob();

        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        const extension = url.split('.').pop().split('?')[0];
a.download = `${name}.${extension}`;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error('Download failed:', err);
    }
}
function handleCrewViewerTouchStart(e) {
    crewViewerStartX = e.changedTouches[0].screenX;
}

function handleCrewViewerTouchEnd(e) {
    crewViewerEndX = e.changedTouches[0].screenX;

    if (!selectedCrew || selectedCrew.length === 0) return;

    // swipe left → next
    if (crewViewerStartX - crewViewerEndX > 50) {
        nextCrew();
    }

    // swipe right → prev
    if (crewViewerEndX - crewViewerStartX > 50) {
        prevCrew();
    }
}
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

.viewer {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.95);

    display: flex;
    justify-content: center;
    align-items: center;

    z-index: 9999;
}

.viewer-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.viewer img {
    max-width: 100%;
    max-height: 75vh;
    object-fit: contain;
}

.viewer-name {
    text-align: center;
    margin-top: 10px;
    color: #fdc134;
}

/* NAV BUTTONS (reuse style vibe) */
.nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;

    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: 50%;

    font-size: 22px;
    cursor: pointer;
}

.nav.left { left: -50px; }
.nav.right { right: -50px; }

/* DOWNLOAD */
.download-btn {
    position: absolute;
    top: 10px;
    right: 10px;

    background: white;
    color: black;

    padding: 6px 10px;
    border-radius: 6px;

    font-size: 12px;
    font-weight: bold;

    cursor: pointer;
    border: none;
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

@media (max-width: 768px) {
    .nav.left { left: 5px; }
    .nav.right { right: 5px; }
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
            {#each students as p, i}
                <div class="card" on:click={() => openCrewViewer(i)}>
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
            {#each organisers as p, i}
                <div class="card" on:click={() => openCrewViewer(i + students.length)}>
        <img src={p.image_url} />
        <div class="name">{p.name}</div>
        <div class="role">{p.role}</div>
    </div>
            {/each}
        </div>
    </div>

</div>

{#if selectedCrew}
<div class="viewer" on:click={closeCrewViewer}>
    
    <div 
        class="viewer-content"
        on:click|stopPropagation
        on:touchstart={handleCrewViewerTouchStart}
        on:touchend={handleCrewViewerTouchEnd}
    >

        <img src={selectedCrew[crewViewerIndex].image_url} />

        <div class="viewer-name">
            {selectedCrew[crewViewerIndex].name}
        </div>

        {#if selectedCrew.length > 1}
            <button class="nav left" on:click={prevCrew}>‹</button>
            <button class="nav right" on:click={nextCrew}>›</button>
        {/if}

        <button
    class="download-btn"
    on:click={() => downloadImage(selectedCrew[crewViewerIndex].image_url, selectedCrew[crewViewerIndex].name)}
>
    ⬇ DOWNLOAD
</button>

    </div>
</div>
{/if}