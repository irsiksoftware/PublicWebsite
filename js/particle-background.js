/**
 * WebGL Particle Background Effect
 * Creates an immersive 3D particle system forming the Avengers 'A' logo
 * with mouse interaction and performance optimizations
 */

(function() {
  'use strict';

  // Check for WebGL support and hardware capabilities
  function checkCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return { webgl: false, lowPerformance: true };
    }

    // Check hardware concurrency for performance estimation
    const cores = navigator.hardwareConcurrency || 2;
    const isMobile = window.innerWidth < 768;
    const lowPerformance = cores < 4 || isMobile;

    return { webgl: true, lowPerformance, isMobile };
  }

  const capabilities = checkCapabilities();

  // Fallback to static gradient for low-performance devices
  if (capabilities.lowPerformance && !window.location.search.includes('debug')) {
    console.log('[Particle Background] Low performance device detected - using fallback');
    document.body.style.background = 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1e 50%, #050510 100%)';
    return;
  }

  if (!capabilities.webgl) {
    console.warn('[Particle Background] WebGL not supported - using fallback');
    document.body.style.background = 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1e 50%, #050510 100%)';
    return;
  }

  // Initialize Three.js scene
  let scene, camera, renderer, particles, particleSystem;
  let mouse = { x: 0, y: 0 };
  let targetMouse = { x: 0, y: 0 };
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;

  // Particle count based on device performance
  const PARTICLE_COUNT = capabilities.isMobile ? 500 : 1500;
  const DEBUG_MODE = window.location.search.includes('debug');

  // Avengers 'A' logo shape coordinates (normalized -1 to 1)
  const LOGO_POINTS = [
    // Left leg of A
    { x: -0.5, y: -0.8 }, { x: -0.4, y: -0.6 }, { x: -0.3, y: -0.4 },
    { x: -0.2, y: -0.2 }, { x: -0.1, y: 0.0 }, { x: 0.0, y: 0.2 },
    { x: 0.0, y: 0.4 }, { x: 0.0, y: 0.6 },
    // Right leg of A
    { x: 0.5, y: -0.8 }, { x: 0.4, y: -0.6 }, { x: 0.3, y: -0.4 },
    { x: 0.2, y: -0.2 }, { x: 0.1, y: 0.0 },
    // Cross bar
    { x: -0.25, y: -0.1 }, { x: -0.15, y: -0.1 }, { x: -0.05, y: -0.1 },
    { x: 0.05, y: -0.1 }, { x: 0.15, y: -0.1 }, { x: 0.25, y: -0.1 },
    // Top point
    { x: 0.0, y: 0.8 }, { x: -0.05, y: 0.7 }, { x: 0.05, y: 0.7 }
  ];

  // Vertex Shader with glow effect
  const vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Calculate alpha based on distance from camera
      vAlpha = smoothstep(0.0, 50.0, -mvPosition.z);
    }
  `;

  // Fragment Shader with glow effect
  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Create circular particle with soft glow
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);

      // Soft circle with glow
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      float glow = 1.0 - smoothstep(0.0, 0.7, dist);

      // Combine particle and glow
      vec3 color = vColor * (alpha + glow * 0.5);

      gl_FragColor = vec4(color, alpha * vAlpha);
    }
  `;

  function init() {
    // Create container for canvas
    const container = document.createElement('div');
    container.id = 'particle-background';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '-1';
    container.style.pointerEvents = 'none';
    document.body.insertBefore(container, document.body.firstChild);

    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.001);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    camera.position.z = 50;

    // Renderer setup with antialiasing
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !capabilities.isMobile // Disable antialiasing on mobile for performance
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(capabilities.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create particle system
    createParticles();

    // Event listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Debug FPS counter
    if (DEBUG_MODE) {
      createFPSCounter();
    }

    // Start animation
    animate();
  }

  function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);

    // Color palette (S.H.I.E.L.D. / Avengers theme)
    const colorPalette = [
      new THREE.Color(0x3498db), // Blue
      new THREE.Color(0xe74c3c), // Red
      new THREE.Color(0xecf0f1), // White
      new THREE.Color(0x2ecc71), // Green (for accent)
    ];

    // Distribute particles to form Avengers 'A' logo
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x, y, z;

      if (i < LOGO_POINTS.length * 30) {
        // Particles forming the logo
        const pointIndex = Math.floor(i / 30) % LOGO_POINTS.length;
        const point = LOGO_POINTS[pointIndex];

        x = point.x * 20 + (Math.random() - 0.5) * 3;
        y = point.y * 20 + (Math.random() - 0.5) * 3;
        z = (Math.random() - 0.5) * 10;
      } else {
        // Random particles in space
        x = (Math.random() - 0.5) * 100;
        y = (Math.random() - 0.5) * 100;
        z = (Math.random() - 0.5) * 100;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Assign color
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Particle size with variation
      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Store reference for interaction
    particles = geometry;
  }

  function onMouseMove(event) {
    targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      targetMouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      targetMouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    // Smooth mouse interpolation
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // Update particles
    if (particles && particleSystem) {
      const positions = particles.attributes.position.array;
      const time = Date.now() * 0.0001;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        // Mouse interaction - particles move away from cursor
        const dx = positions[i3] / 20 - mouse.x;
        const dy = positions[i3 + 1] / 20 - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = Math.max(0, 1 - distance);

        if (force > 0 && distance > 0) {
          positions[i3] += (dx / distance) * force * 2;
          positions[i3 + 1] += (dy / distance) * force * 2;
        }

        // Gentle drift back to original position
        positions[i3] *= 0.99;
        positions[i3 + 1] *= 0.99;

        // Gentle wave motion
        positions[i3 + 2] += Math.sin(time + i * 0.1) * 0.02;
      }

      particles.attributes.position.needsUpdate = true;

      // Rotate entire particle system slowly
      particleSystem.rotation.y = time * 0.2;
      particleSystem.rotation.x = Math.sin(time) * 0.1;
    }

    renderer.render(scene, camera);

    // FPS calculation
    if (DEBUG_MODE) {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        updateFPSCounter(fps);
      }
    }
  }

  function createFPSCounter() {
    const fpsCounter = document.createElement('div');
    fpsCounter.id = 'fps-counter';
    fpsCounter.style.position = 'fixed';
    fpsCounter.style.top = '10px';
    fpsCounter.style.right = '10px';
    fpsCounter.style.padding = '10px';
    fpsCounter.style.background = 'rgba(0, 0, 0, 0.7)';
    fpsCounter.style.color = '#00ff00';
    fpsCounter.style.fontFamily = 'monospace';
    fpsCounter.style.fontSize = '14px';
    fpsCounter.style.zIndex = '9999';
    fpsCounter.style.borderRadius = '4px';
    fpsCounter.textContent = 'FPS: --';
    document.body.appendChild(fpsCounter);
  }

  function updateFPSCounter(currentFPS) {
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) {
      const color = currentFPS >= 50 ? '#00ff00' : currentFPS >= 30 ? '#ffff00' : '#ff0000';
      fpsCounter.style.color = color;
      fpsCounter.textContent = `FPS: ${currentFPS}`;
    }
  }

  // Load Three.js library and initialize
  function loadThreeJS() {
    if (typeof THREE !== 'undefined') {
      init();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.integrity = 'sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==';
      script.crossOrigin = 'anonymous';
      script.onload = init;
      script.onerror = function() {
        console.error('[Particle Background] Failed to load Three.js');
        document.body.style.background = 'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0f1e 50%, #050510 100%)';
      };
      document.head.appendChild(script);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadThreeJS);
  } else {
    loadThreeJS();
  }

})();
