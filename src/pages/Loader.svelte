<script>
    import { onMount } from 'svelte';

    let loadingVisible = false;
    const letterAppearTimes = [0.5, 1, 1.5, 2, 2.5, 3, 3.5]; // Times in seconds when each letter should appear

    onMount(() => {
        setTimeout(() => {
            loadingVisible = true;
        }, ); // Delay before "Loading" appears
    });
</script>

<style>
.container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
    overflow: hidden;
    z-index: 1000;
}

.rocket {
    position: absolute;
    width: 50px;
    height: 50px;
    background: url('/rocket.png') no-repeat center center;
    background-size: cover;
    transform: rotate(45deg);
    left: -50px; /* Ensure it starts off-screen on the left */
    animation: shootRocket 3s linear forwards;
}

@keyframes shootRocket {
    0% { 
        left: -50px;
        transform: scale(1);
    }
    100% { 
        left: 100vw; 
        transform: scale(1);
    }
}

.loading {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    pointer-events: none;
    color: white;
    opacity: 0;
    transition: opacity 1s;
    font-family: Valo, sans-serif;
}

.loading.visible {
    opacity: 1;
}

.loading span {
    display: inline-block;
    font-size: 2rem;
    opacity: 0;
    animation: fadeInOut 0.5s ease-in-out forwards;
}

@keyframes fadeInOut {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

/* Apply animation delays based on letterAppearTimes */
.loading span:nth-child(1) { animation-delay: 0.1s; }
.loading span:nth-child(2) { animation-delay: 0.6s; }
.loading span:nth-child(3) { animation-delay: 1.1s; }
.loading span:nth-child(4) { animation-delay: 1.5s; }
.loading span:nth-child(5) { animation-delay: 1.8s; }
.loading span:nth-child(6) { animation-delay: 2.3s; }
.loading span:nth-child(7) { animation-delay: 2.6s; }

</style>

<div class="container">
    <div class="rocket"></div>
    <div class="loading {loadingVisible ? 'visible' : ''}">
        <span>L</span>
        <span>O</span>
        <span>A</span>
        <span>D</span>
        <span>I</span>
        <span>N</span>
        <span>G</span>
    </div>
</div>
