import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, model, mixer;
let scrollProgress = 0;
let clock = new THREE.Clock();

async function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00011d);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

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

    // Model Loader
    const loader = new GLTFLoader();
    loader.load(
        './basemodel.glb',
        (gltf) => {
            model = gltf.scene;
            
            scene.add(model);
            model.position.y = -0.5;
            model.scale.set(4.0, 4.0, 4.0);

            // Animation
            mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                mixer.clipAction(clip).play();
            });

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
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }

    const rotationAmount = scrollProgress * Math.PI * 4; 

    if (model) {
        model.rotation.y = rotationAmount;
        model.rotation.x = rotationAmount * 0.25;
    }

    renderer.render(scene, camera);
}

init();
