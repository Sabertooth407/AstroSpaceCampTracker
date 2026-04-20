<script>
  import { onMount } from 'svelte';

  let deferredPrompt = null;
  let isAndroid = false;
  let isIOS = false;
  let showButton = false;

  onMount(() => {
    const ua = navigator.userAgent;

    isAndroid = /android/i.test(ua);
    isIOS = /iphone|ipad|ipod/i.test(ua);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showButton = true;
    });
  });

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
  }
</script>

<style>
  .container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    text-align: center;
    padding: 20px;
  }

  button {
    padding: 15px 25px;
    font-size: 18px;
    border-radius: 10px;
    border: none;
    background: black;
    color: white;
    cursor: pointer;
  }

  .hint {
    margin-top: 15px;
    color: #555;
    font-size: 14px;
  }
</style>

<div class="container">
  <h1>Install App</h1>

  {#if isAndroid && showButton}
    <button on:click={installApp}>
      Install App
    </button>
    <div class="hint">Takes 2 seconds ⚡</div>

  {:else if isIOS}
    <p>
      Tap <b>Share</b> (⬆️) <br />
      Then <b>Add to Home Screen</b>
    </p>

  {:else}
    <p>Open this page on your phone to install</p>
  {/if}
</div>