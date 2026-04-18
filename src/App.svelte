<script>
  import { onMount } from 'svelte';

  import Loader from './pages/Loader.svelte';
  import Lander from './pages/Lander.svelte';
  import Portal from './pages/Portal.svelte';
  import Admin from './pages/Admin.svelte';
  import Student from './pages/Student.svelte'; 

  let page = 'loader';

  function navigate(to) {
    page = to;
  }

  onMount(async () => {
    await new Promise((res) => setTimeout(res, 3000));

    navigate('lander'); 
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

{#if page === 'loader'}
  <Loader />
{:else if page === 'portal'}
  <Portal {navigate} />
{:else if page === 'admin'}
  <Admin {navigate} />
{:else if page === 'student'}
  <Student {navigate} />
{:else}
  <Lander {navigate} />
{/if}