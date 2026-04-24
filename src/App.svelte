<script>
  import { onMount } from 'svelte';
  import Background from './pages/Background.svelte';
  import Loader from './pages/Loader.svelte';
  import Lander from './pages/Lander.svelte';
  import Portal from './pages/Portal.svelte';
  import Admin from './pages/Admin.svelte';
  import Student from './pages/Student.svelte';
  import Install from './pages/Install.svelte';
  import Crew from './pages/Crew.svelte'; // ✅ NEW

  let page = 'loader';

  function navigate(to) {
    page = to;
    window.history.pushState({}, '', '/' + to);
  }

  function handleRoute() {
    const path = window.location.pathname.replace('/', '');

    if (path === 'install') return 'install';
    if (path === 'admin') return 'admin';
    if (path === 'student') return 'student';
    if (path === 'portal') return 'portal';
    if (path === 'crew') return 'crew'; // ✅ NEW

    return 'lander';
  }

  onMount(async () => {
    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      page = handleRoute();
    });

    const initialRoute = handleRoute();

    // If direct route → skip loader
    if (initialRoute !== 'lander') {
      page = initialRoute;
      return;
    }

    // Default flow
    await new Promise((res) => setTimeout(res, 3000));
    page = 'lander';
  });
</script>

<style>
  @font-face {
    font-family: 'Valo';
    src: url('/Valorant Font.ttf') format('truetype');
  }
  @font-face {
    font-family: 'GoodTimes';
    src: url('/Good Times Rg.otf') format('opentype');
  }
  @font-face {
    font-family: 'Futura';
    src: url('/FuturaLT.ttf') format('truetype');
  }

  :global(body) {
    margin: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    color: white;
    font-family: 'Futura', sans-serif;
    letter-spacing: 1px;
  }

  :global(::-webkit-scrollbar) {
    width: 0px;
    height: 0px;
  }
</style>
<Background />
{#if page === 'loader'}
  <Loader />

{:else if page === 'install'}
  <Install />

{:else if page === 'portal'}
  <Portal {navigate} />

{:else if page === 'admin'}
  <Admin {navigate} />

{:else if page === 'student'}
  <Student {navigate} />

{:else if page === 'crew'} <!-- ✅ NEW -->
  <Crew {navigate} />

{:else}
  <Lander {navigate} />
{/if}