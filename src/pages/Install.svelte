<script>
  import { onMount } from 'svelte';

  let deferredPrompt = null;
  let isAndroid = false;
  let isIOS = false;
  let ready = false;

  onMount(() => {
    const ua = navigator.userAgent;

    isAndroid = /android/i.test(ua);
    isIOS = /iphone|ipad|ipod/i.test(ua);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      ready = true;
    });

    // fallback: show something after 2 sec anyway
    setTimeout(() => {
      ready = true;
    }, 2000);
  });

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert("Tap menu (⋮) → Add to Home Screen");
    }
  }
</script>

<style>
  .screen {
    height: 100vh;
    width: 100vw;
    background: black;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
  }

  .logo {
    width: 100px;
    margin-bottom: 20px;
  }

  button {
    padding: 16px 28px;
    font-size: 18px;
    border-radius: 12px;
    border: none;
    background: white;
    color: black;
    cursor: pointer;
  }

  .hint {
    margin-top: 15px;
    font-size: 14px;
    opacity: 0.7;
  }
</style>

<div class="screen">
  <img src="/rocket.png" class="logo" alt="logo" />

  <h1>Astro Camp</h1>

  {#if ready}
    {#if isAndroid}
      <button on:click={installApp}>
        Install App
      </button>
      <div class="hint">Quick install ⚡</div>

    {:else if isIOS}
      <div class="hint">
        Tap Share ⬆️ <br />
        Then “Add to Home Screen”
      </div>

    {:else}
      <div class="hint">
        Open on your phone to install
      </div>
    {/if}
  {:else}
    <div class="hint">Preparing installer...</div>
  {/if}
</div>