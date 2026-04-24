<script>
    import { onMount, onDestroy } from 'svelte';
    import * as THREE from 'three';

    let container;

    let scene, camera, renderer;
    let starsFar, starsNear;
    let glowStars = [];
    let shootingStars = [];

    let mouseX = 0, mouseY = 0;

    const STAR_COUNT_FAR = 2500;
    const STAR_COUNT_NEAR = 800;

    function createStarLayer(count, spread, size, opacity) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
            positions[i * 3 + 2] = Math.random() * -spread;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size,
            transparent: true,
            opacity,
            depthWrite: false
        });

        return new THREE.Points(geometry, material);
    }

    function createGlowStars() {
        for (let i = 0; i < 120; i++) {
            const geo = new THREE.SphereGeometry(1.2, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: Math.random() * 0.6 + 0.4
            });

            const star = new THREE.Mesh(geo, mat);

            star.position.set(
                (Math.random() - 0.5) * 1200,
                (Math.random() - 0.5) * 1200,
                Math.random() * -1500
            );

            star.userData.twinkleSpeed = Math.random() * 0.02 + 0.005;

            scene.add(star);
            glowStars.push(star);
        }
    }

    function createShootingStar() {
        const geometry = new THREE.BufferGeometry();

        const startX = (Math.random() - 0.5) * 1000;
        const startY = Math.random() * 400;

        const points = [
            new THREE.Vector3(startX, startY, -200),
            new THREE.Vector3(startX - 200, startY - 100, -200)
        ];

        geometry.setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });

        const line = new THREE.Line(geometry, material);

        scene.add(line);

        shootingStars.push({
            line,
            life: 60,
            vx: -5,
            vy: -2
        });
    }

    function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            3000
        );
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        container.appendChild(renderer.domElement);

        // ⭐ layers
        starsFar = createStarLayer(STAR_COUNT_FAR, 2000, 0.7, 0.5);
        starsNear = createStarLayer(STAR_COUNT_NEAR, 1200, 1.2, 0.9);

        scene.add(starsFar);
        scene.add(starsNear);

        createGlowStars();

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);

        // shooting stars
        setInterval(() => {
            if (Math.random() < 0.25) createShootingStar();
        }, 1800);
    }

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(e) {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.0003;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.0003;
    }

    function animateStars(layer, speed, spread) {
        const positions = layer.geometry.attributes.position.array;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 2] += speed;

            if (positions[i * 3 + 2] > 0) {
                positions[i * 3] = (Math.random() - 0.5) * spread;
                positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
                positions[i * 3 + 2] = -spread;
            }
        }

        layer.geometry.attributes.position.needsUpdate = true;
    }

    function animate() {
        requestAnimationFrame(animate);

        // ⭐ depth movement
        animateStars(starsFar, 0.6, 2000);
        animateStars(starsNear, 1.5, 1200);

        // ✨ twinkle glow stars
        glowStars.forEach((s) => {
            s.material.opacity += Math.sin(Date.now() * s.userData.twinkleSpeed) * 0.01;
        });

        // 🖱️ parallax
        camera.position.x += (mouseX * 120 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 120 - camera.position.y) * 0.02;

        // 🚀 shooting stars
        shootingStars.forEach((s) => {
            s.line.position.x += s.vx;
            s.line.position.y += s.vy;
            s.life--;

            s.line.material.opacity = s.life / 60;
        });

        shootingStars = shootingStars.filter((s) => {
            if (s.life <= 0) {
                scene.remove(s.line);
                return false;
            }
            return true;
        });

        renderer.render(scene, camera);
    }

    onMount(() => {
        init();
        animate();
    });

    onDestroy(() => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouseMove);
    });
</script>

<div bind:this={container} class="bg"></div>

<style>
.bg {
    position: fixed;
    inset: 0;
    z-index: -1;
}
</style>