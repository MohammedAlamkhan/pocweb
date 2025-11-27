import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let scrollProgress = 0;
let clock = new THREE.Clock();
const materials = [];
const particleMaterials = [];
let particlesGroup;

async function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00011d);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load shaders
    const vertexShader = await fetch('vertex.glsl').then(res => res.text());
    const fragmentShader = await fetch('fragment.glsl').then(res => res.text());
    const pointsVertexShader = await fetch('points.vertex.glsl').then(res => res.text());
    const pointsFragmentShader = await fetch('points.fragment.glsl').then(res => res.text());

    // Particles Group
    particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    // Model Loader
    const loader = new GLTFLoader();
    loader.load(
        './office_laptop.glb',
        (gltf) => {
            model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    // Main model material
                    const originalMaterial = child.material;
                    const newMaterial = new THREE.ShaderMaterial({
                        uniforms: {
                            u_progress: { value: 0 },
                            u_time: { value: 0 },
                            u_color: { value: originalMaterial.color || new THREE.Color(0xffffff) },
                            u_map: { value: originalMaterial.map || null },
                            u_has_map: { value: !!originalMaterial.map },
                        },
                        vertexShader,
                        fragmentShader,
                        transparent: true,
                        side: THREE.DoubleSide,
                    });
                    child.material = newMaterial;
                    materials.push(newMaterial);

                    // Particle system for this mesh
                    const pointsMaterial = new THREE.ShaderMaterial({
                        uniforms: {
                            u_progress: { value: 0 },
                            u_time: { value: 0 },
                        },
                        vertexShader: pointsVertexShader,
                        fragmentShader: pointsFragmentShader,
                        transparent: true,
                        depthWrite: false,
                    });
                    const particle = new THREE.Points(child.geometry, pointsMaterial);
                    particlesGroup.add(particle);
                    particleMaterials.push(pointsMaterial);
                }
            });

            scene.add(model);
            model.position.y = -0.5;
            model.scale.set(4.0, 4.0, 4.0);
            
            particlesGroup.position.copy(model.position);
            particlesGroup.scale.copy(model.scale);

            animate();
        },
        undefined,
        (error) => {
            console.error(error);
        }
    );

    // Scroll listener
    window.addEventListener('scroll', onScroll);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    updateSections();
}

function onScroll() {
    const scrollableHeight = document.getElementById('scroll-container').clientHeight - window.innerHeight;
    scrollProgress = window.scrollY / scrollableHeight;
    updateSections();
}

/**
 * Updates the visibility of the content sections based on scroll progress.
 * NOTE: The particle system activation in the HTML script relies on the 'visible' class.
 * By removing the CSS opacity interpolation here, we ensure the entire section 
 * (subheading) appears/disappears sharply, matching the particle system's activation/deactivation.
 */
function updateSections() {
    const sections = document.querySelectorAll('.section');
    const sectionCount = sections.length;
    const centerTolerance = 0.5; // How wide the "active" zone is (0.5 means half the section's scroll space)
    let activeSectionIndex = -1;
    
    // Determine the single active section index
    sections.forEach((section, index) => {
        const sectionStart = index / sectionCount;
        const sectionEnd = (index + 1) / sectionCount;
        
        // Use a strict check to find the currently active section based on where scrollProgress falls
        if (scrollProgress >= sectionStart && scrollProgress < sectionEnd) {
            activeSectionIndex = index;
        }
    });

    // Toggle visibility based ONLY on the single active section index
    sections.forEach((section, index) => {
        if (index === activeSectionIndex) {
            // Force the active section to be visible
            section.classList.add('visible');
        } else {
            // Force all other sections to be inactive
            section.classList.remove('visible');
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    materials.forEach(material => {
        material.uniforms.u_progress.value = scrollProgress;
        material.uniforms.u_time.value = elapsedTime;
    });

    particleMaterials.forEach(material => {
        material.uniforms.u_progress.value = scrollProgress;
        material.uniforms.u_time.value = elapsedTime;
    });

    // Interactive rotation based on scroll
    const rotationAmount = scrollProgress * Math.PI * 4; // Two full rotations on Y axis

    if (model) {
        model.rotation.y = rotationAmount;
        model.rotation.x = rotationAmount * 0.25; // Add some x-axis rotation for more dynamism
    }
    if (particlesGroup) {
        // Ensure particle group rotation matches the model's
        particlesGroup.rotation.y = rotationAmount;
        particlesGroup.rotation.x = rotationAmount * 0.25;
    }


    renderer.render(scene, camera);
}

init();