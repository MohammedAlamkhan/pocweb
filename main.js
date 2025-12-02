import * as THREE from 'three';

let scene, camera, renderer;
let scrollProgress = 0;

let video;
let plane;
const mouse = new THREE.Vector2();
const targetRotation = new THREE.Vector2();

// --- Scene Group ---
let backgroundGroup;

// --- Particle System Variables ---
let particles, particleGeometry, particleVelocities;
const particleCount = 5000;
let viewHeight, viewWidth;

// Flag to throttle scroll updates to once per frame
let scrollUpdateRequest = false;

function init() {
    // Scene
    scene = new THREE.Scene();
    backgroundGroup = new THREE.Group();
    scene.add(backgroundGroup);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- Viewport Size Calculation ---
    const fov = camera.fov * (Math.PI / 180);
    viewHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    viewWidth = viewHeight * camera.aspect;

    // --- Video Background Setup ---
    video = document.createElement('video');
    video.src = 'bg.mp4';
    video.muted = true;
    // video.loop = true;
    video.playsInline = true;

    video.onerror = () => {
        console.error("Error loading video file: bg.mp4. Make sure the file exists and the path is correct.");
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.color = 'red';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.fontFamily = 'monospace';
        errorDiv.innerHTML = 'Error: Could not load video file "bg.mp4".';
        document.body.appendChild(errorDiv);
    };
    
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const zoom = 1.2; // Zoom in by 20%
    const planeGeometry = new THREE.PlaneGeometry(viewWidth * zoom, viewHeight * zoom);
    const videoMaterial = new THREE.MeshBasicMaterial({ 
        map: videoTexture,
        color: 0x4e1212
    });
    plane = new THREE.Mesh(planeGeometry, videoMaterial);
    backgroundGroup.add(plane); // Add to group
    
    video.load();
    video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => {
            console.error("Video play failed. User interaction might be needed.", e);
            const playOnFirstInteraction = () => {
                video.play();
                window.removeEventListener('scroll', playOnFirstInteraction);
                window.removeEventListener('click', playOnFirstInteraction);
            };
            window.addEventListener('scroll', playOnFirstInteraction);
            window.addEventListener('click', playOnFirstInteraction);
        });
    });

    video.addEventListener('ended', function() {
        console.log("Video ended, re-loading source and playing again.");
        this.load();
        this.play();
    });

    // --- Particle System Setup ---
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * viewWidth;
        positions[i3 + 1] = (Math.random() - 0.5) * viewHeight;
        positions[i3 + 2] = (Math.random() - 0.5) * 30;

        particleVelocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.05,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    backgroundGroup.add(particles); // Add to group

    // Start animation loop
    animate();

    // --- Event Listeners ---
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // Set initial section visibility
    onScroll();
}

function onScroll() {
    if (!scrollUpdateRequest) {
        requestAnimationFrame(() => {
            const scrollableHeight = document.getElementById('scroll-container').clientHeight - window.innerHeight;
            scrollProgress = window.scrollY / scrollableHeight;
            updateSections();
            scrollUpdateRequest = false;
        });
        scrollUpdateRequest = true;
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function updateSections() {
    const sections = document.querySelectorAll('.section');
    const sectionCount = sections.length;
    let activeSectionIndex = -1;
    
    sections.forEach((section, index) => {
        const sectionStart = index / sectionCount;
        const sectionEnd = (index + 1) / sectionCount;
        
        if (scrollProgress >= sectionStart && scrollProgress < sectionEnd) {
            activeSectionIndex = index;
        }
    });

    sections.forEach((section, index) => {
        if (index === activeSectionIndex) {
            section.classList.add('visible');
        } else {
            section.classList.remove('visible');
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update viewport dimensions
    const fov = camera.fov * (Math.PI / 180);
    viewHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    viewWidth = viewHeight * camera.aspect;

    if (plane) {
        const zoom = 1.2;
        plane.geometry.dispose();
        plane.geometry = new THREE.PlaneGeometry(viewWidth * zoom, viewHeight * zoom);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // --- Animate Particles ---
    if (particles) {
        const positions = particleGeometry.attributes.position.array;
        const boundaryX = viewWidth / 2;
        const boundaryY = viewHeight / 2;
        const boundaryZ = 15;

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            positions[i3] += particleVelocities[i].x;
            positions[i3 + 1] += particleVelocities[i].y;
            positions[i3 + 2] += particleVelocities[i].z;

            // Wrap particles around
            if (positions[i3] > boundaryX) positions[i3] = -boundaryX;
            if (positions[i3] < -boundaryX) positions[i3] = boundaryX;

            if (positions[i3 + 1] > boundaryY) positions[i3 + 1] = -boundaryY;
            if (positions[i3 + 1] < -boundaryY) positions[i3 + 1] = boundaryY;

            if (positions[i3 + 2] > boundaryZ) positions[i3 + 2] = -boundaryZ;
            if (positions[i3 + 2] < -boundaryZ) positions[i3 + 2] = boundaryZ;
        }
        particleGeometry.attributes.position.needsUpdate = true;
    }

    // --- Apply Tilt Effect to Group ---
    targetRotation.x = mouse.y * 0.08;
    targetRotation.y = -mouse.x * 0.08;

    if (backgroundGroup) {
        backgroundGroup.rotation.x += 0.05 * (targetRotation.x - backgroundGroup.rotation.x);
        backgroundGroup.rotation.y += 0.05 * (targetRotation.y - backgroundGroup.rotation.y);
    }

    renderer.render(scene, camera);
}

init();