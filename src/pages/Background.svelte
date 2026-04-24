<script>
    import { onMount } from 'svelte';

    let canvas, ctx;

    const STAR_COUNT = 300;
    let stars = [];

    function createStar() {
        return {
            x: (Math.random() - 0.5) * canvas.width,
            y: (Math.random() - 0.5) * canvas.height,
            z: Math.random() * canvas.width,
            size: Math.random() * 1.2 + 0.3
        };
    }

    function init() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(createStar());
        }
    }

    function draw() {
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let star of stars) {
            star.z -= 2; // 🚀 forward motion

            if (star.z <= 1) {
                Object.assign(star, createStar(), { z: canvas.width });
            }

            const k = 128 / star.z;

            const x = star.x * k + canvas.width / 2;
            const y = star.y * k + canvas.height / 2;

            if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) continue;

            const size = star.size * k;

            // ✨ glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
            gradient.addColorStop(0, "rgba(255,255,255,0.9)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
    }

    onMount(() => {
        ctx = canvas.getContext("2d");
        resize();
        draw();
        window.addEventListener("resize", resize);
    });
</script>

<div class="bg">
    <canvas bind:this={canvas}></canvas>
    <div class="nebula"></div>
</div>

<style>
.bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
}

/* canvas layer */
canvas {
    position: absolute;
    inset: 0;
}

/* 🌌 subtle nebula */
.nebula {
    position: absolute;
    inset: 0;
    pointer-events: none;

    background:
        radial-gradient(circle at 20% 30%, rgba(37,154,214,0.15), transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(253,193,52,0.12), transparent 50%);

    filter: blur(50px);
    opacity: 0.6;

    animation: drift 40s linear infinite;
}

@keyframes drift {
    0% { transform: translate(0,0); }
    50% { transform: translate(-30px, 20px); }
    100% { transform: translate(0,0); }
}
</style>