<script>
    import * as THREE from 'three';
    import { onMount } from 'svelte';

    let scene, camera, renderer, stars = [];
    let canvas;

    let speed = 5;
    let boost = false;

    // ⭐ MUCH faster than 50k meshes
    const STAR_COUNT = 12000;

    const initStars = () => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(STAR_COUNT * 3);

        for (let i = 0; i < STAR_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = Math.random() * 2000;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.2,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        stars.push(points);
        scene.add(points);
    };

    const animateStars = () => {
        stars.forEach(points => {
            const positions = points.geometry.attributes.position.array;

            for (let i = 0; i < STAR_COUNT; i++) {
                positions[i * 3 + 2] -= boost ? speed * 4 : speed;

                if (positions[i * 3 + 2] < -500) {
                    positions[i * 3 + 2] = 1500;
                }
            }

            points.geometry.attributes.position.needsUpdate = true;
        });
    };

    onMount(() => {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // 🌌 NICE SPACE BACKGROUND (THIS FIXES YOUR MAIN ISSUE)
        scene.background = new THREE.Color(0x020617);

        // subtle fog for depth
        scene.fog = new THREE.FogExp2(0x020617, 0.0008);

        initStars();

        const animate = () => {
            requestAnimationFrame(animate);

            animateStars();

            renderer.render(scene, camera);
        };

        animate();

        // ⚡ BOOST ON CLICK
        window.addEventListener('mousedown', () => boost = true);
        window.addEventListener('mouseup', () => boost = false);

        // resize
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    });
</script>

<canvas bind:this={canvas}></canvas>

<style>
canvas {
    position: fixed;
    inset: 0;
    z-index: -1;
    width: 100vw;
    height: 100vh;
    display: block;
}
</style>