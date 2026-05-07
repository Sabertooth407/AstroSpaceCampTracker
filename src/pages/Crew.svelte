<script>
    import { onMount } from 'svelte';
    import { supabase } from '../lib/supabase';

    export let navigate;

    let students = [];
let academicTeam = [];
let programTeam = [];
let speakers = [];
let crewViewerStartX = 0;
let crewViewerEndX = 0;
    async function fetchCrew() {
    const { data } = await supabase
        .from('crew_profiles')
        .select('*');

    students = data?.filter(c => c.role === 'student') || [];

    academicTeam =
        data?.filter(c => c.role === 'academic_team') || [];

    programTeam =
        data?.filter(c => c.role === 'program_team') || [];

    speakers =
        data?.filter(c => c.role === 'speaker') || [];
}

    onMount(fetchCrew);

    let selectedCrew = null;
let crewViewerIndex = 0;

let allCrew = [];

$: allCrew = [
    ...students,
    ...academicTeam,
    ...programTeam,
    ...speakers
];

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


async function downloadMedia(url, name = 'download') {
    try {
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();

        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;

        // detect extension safely
        let extension = '';

        if (blob.type) {
            extension = blob.type.split('/')[1]; // image/png → png
        } else {
            extension = url.split('.').pop().split('?')[0];
        }

        // fallback safety
        if (!extension || extension.length > 5) {
            extension = 'jpg';
        }

        a.download = `${name}.${extension}`;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error('Download failed:', err);

        // fallback (opens in new tab if fetch fails)
        window.open(url, '_blank');
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
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* SECTION */
.section {
    margin-bottom: 24px;
    width: 100%;
    max-width: 1000px;
    text-align: center;
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
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    width: 100%;
    margin: 0 auto;
}

/* STUDENTS */
.students-grid {
    max-width: 950px;
}

/* OTHER TEAMS */
.org-grid {
    max-width: 820px;
}

/* CARD */
.card {
    background: black;
    border: 1px solid #259ad6;
    text-align: center;
    padding: 0;
    transition: 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
}

.card {
    box-sizing: border-box;
}

/* STUDENT CARD SIZE */
.students-grid .card {
    width: 85px;
}

/* OTHER TEAM CARD SIZE */
.org-grid .card {
    width: 120px;
}

.card:hover {
    transform: scale(1.05);
    box-shadow: 0 0 8px #259ad6;
}

/* IMAGE */
.card img {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    display: block;
}

.card .name {
    margin-top: 8px;
    padding: 0 6px;
}

.card .role {
    padding-bottom: 8px;
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

.name, .role {
    text-align: center;
}

/* coming soon style */
.coming-soon {
    font-size: 22px;
    letter-spacing: 4px;
    margin-top: 20px;

    color: #38bdf8;

    text-transform: uppercase;

    /* glow */
    text-shadow: 
        0 0 5px #38bdf8,
        0 0 10px #38bdf8,
        0 0 20px rgba(56,189,248,0.5);
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
/* Tablet */
@media (max-width: 1024px) {

    .students-grid {
        max-width: 525px;
    }

    .org-grid {
        max-width: 410px;
    }

    .students-grid .card {
        width: 95px;
    }

    .org-grid .card {
        width: 130px;
    }
}

/* Phone */
@media (max-width: 768px) {

    .students-grid {
        max-width: 320px;
    }

    .org-grid {
        max-width: 280px;
    }

    .students-grid .card {
        width: 100px;
    }

    .org-grid .card {
        width: 135px;
    }

    .nav.left {
        left: 5px;
    }

    .nav.right {
        right: 5px;
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

    {#if students.length === 0 || students.every(s => !s.image_url)}
        <div class="coming-soon">SPACE CREW IS SUITING UP!</div>
    {:else}
        <div class="grid students-grid">
            {#each students as p, i}
                {#if p.image_url}
                    <div class="card" on:click={() => openCrewViewer(i)}>
                        <img src={p.image_url} loading="lazy" />
                        <div class="name">{p.name}</div>
                        <div class="role">{p.team}</div>
                    </div>
                {/if}
            {/each}
        </div>
    {/if}
</div>

    <!-- ACADEMIC TEAM -->
<div class="section">
    <div class="section-title">ACADEMIC TEAM</div>

    <div class="grid org-grid">
        {#each academicTeam as p, i}
            <div
                class="card"
                on:click={() =>
                    openCrewViewer(i + students.length)
                }
            >
                <img src={p.image_url} loading="lazy" />
                <div class="name">{p.name}</div>
                <div class="role">{p.team}</div>
            </div>
        {/each}
    </div>
</div>

<!-- PROGRAM TEAM -->
<div class="section">
    <div class="section-title">PROGRAM TEAM</div>

    <div class="grid org-grid">
        {#each programTeam as p, i}
            <div
                class="card"
                on:click={() =>
                    openCrewViewer(
                        i +
                        students.length +
                        academicTeam.length
                    )
                }
            >
                <img src={p.image_url} loading="lazy" />
                <div class="name">{p.name}</div>
                <div class="role">{p.team}</div>
            </div>
        {/each}
    </div>
</div>

<!-- SPEAKERS -->
<div class="section">
    <div class="section-title">SPEAKERS</div>

    <div class="grid org-grid">
        {#each speakers as p, i}
            <div
                class="card"
                on:click={() =>
                    openCrewViewer(
                        i +
                        students.length +
                        academicTeam.length +
                        programTeam.length
                    )
                }
            >
                <img src={p.image_url} loading="lazy" />
                <div class="name">{p.name}</div>
                <div class="role">{p.team}</div>
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

        <img src={selectedCrew[crewViewerIndex].image_url} loading="lazy" />

        <div class="viewer-name">
            {selectedCrew[crewViewerIndex].name}
        </div>

        {#if selectedCrew.length > 1}
            <button class="nav left" on:click={prevCrew}>‹</button>
            <button class="nav right" on:click={nextCrew}>›</button>
        {/if}

        <button
    class="download-btn"
    on:click={() => downloadMedia(selectedCrew[crewViewerIndex].image_url, selectedCrew[crewViewerIndex].name)}
>
    ⬇ DOWNLOAD
</button>

    </div>
</div>
{/if}