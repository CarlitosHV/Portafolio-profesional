import * as THREE from 'three';

export class SolarSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private planets: Map<string, THREE.Mesh> = new Map();
  private stars: THREE.Points[] = [];
  private comets: THREE.Group[] = [];
  private asteroidBelt: THREE.InstancedMesh | null = null;
  private spaceship: THREE.Group | null = null;
  private spaceshipPath: THREE.Vector3[] = [];
  private spaceshipProgress = 0;
  private currentPlanetIndex = 0;
  private targetCameraPosition = new THREE.Vector3(0, 0, 50);
  private targetLookAt = new THREE.Vector3(0, 0, 0);

  constructor(canvas: HTMLCanvasElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0001);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 50);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.init();
    this.animate();
    this.setupResize();
  }

  private init() {
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.position.set(-100, 0, 0);
    this.scene.add(sunLight);

    // Create starfield
    this.createStarfield();

    // Create planets
    this.createPlanets();

    // Create asteroid belt
    this.createAsteroidBelt();

    // Create comets
    this.createComets();

    // Create spaceship
    this.createSpaceship();

    // Add nebula background
    this.createNebula();
  }

  private createStarfield() {
    const starGroups = [
      { count: 5000, size: 0.3, color: 0xffffff },
      { count: 3000, size: 0.6, color: 0xffffff },
      { count: 1500, size: 1.0, color: 0xaaaaff },
      { count: 800, size: 1.5, color: 0xffffaa },
      { count: 200, size: 2.0, color: 0xffcccc },
    ];

    starGroups.forEach(({ count, size, color }) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Random position in sphere
        const radius = 300 + Math.random() * 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // Color variation with more diversity
        const c = new THREE.Color(color);
        c.offsetHSL((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      });

      const stars = new THREE.Points(geometry, material);
      this.stars.push(stars);
      this.scene.add(stars);
    });
  }

  private createPlanets() {
    const planetData = [
      { 
        name: 'earth', 
        position: [0, 0, 0], 
        size: 8, 
        textureType: 'earth',
        atmosphere: 0x4488ff
      },
      { 
        name: 'mars', 
        position: [100, 20, -30], 
        size: 6, 
        textureType: 'mars',
        atmosphere: 0xff6644
      },
      { 
        name: 'jupiter', 
        position: [200, -10, -50], 
        size: 15, 
        textureType: 'jupiter',
        atmosphere: 0xffcc99
      },
      { 
        name: 'saturn', 
        position: [300, 15, -40], 
        size: 12, 
        textureType: 'none', // Saturn stays as geometry based
        color: 0xe8d4a0,
        emissive: 0xa89968,
        rings: true
      },
      { 
        name: 'moon', 
        position: [50, 10, 10], 
        size: 4, 
        textureType: 'moon',
        atmosphere: null 
      },
    ];

    planetData.forEach((data) => {
      const geometry = new THREE.SphereGeometry(data.size, 64, 64);
      let material: THREE.MeshStandardMaterial;

      if (data.textureType !== 'none') {
        const texture = this.generatePlanetTexture(data.textureType);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.8,
          metalness: 0.1,
        });
      } else {
        // Fallback for Saturn (or others if specified)
        material = new THREE.MeshStandardMaterial({
          color: data.color,
          emissive: data.emissive,
          emissiveIntensity: 0.2,
          roughness: 0.7,
        });
      }

      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(data.position[0], data.position[1], data.position[2]);
      
      // Add atmosphere/glow
      if (data.atmosphere) {
        const glowGeometry = new THREE.SphereGeometry(data.size * 1.15, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: data.atmosphere,
          transparent: true,
          opacity: 0.2,
          side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planet.add(glow);
      }

      // Special handling for Earth clouds
      if (data.textureType === 'earth') {
        const cloudGeometry = new THREE.SphereGeometry(data.size * 1.02, 64, 64);
        const cloudTexture = this.generateCloudTexture();
        const cloudMaterial = new THREE.MeshStandardMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        (clouds as any).isClouds = true; // Marker for animation
        planet.add(clouds);
      }

      // Add Saturn's rings (Original implementation kept)
      if (data.rings) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.5, data.size * 2.5, 128);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0xc9b896,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          roughness: 0.8,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2.5;
        planet.add(ring);

        // Inner ring
        const innerRingGeometry = new THREE.RingGeometry(data.size * 1.3, data.size * 1.45, 128);
        const innerRingMaterial = new THREE.MeshStandardMaterial({
          color: 0xa89968,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
          roughness: 0.9,
        });
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRing.rotation.x = Math.PI / 2.5;
        planet.add(innerRing);
      }

      this.planets.set(data.name, planet);
      this.scene.add(planet);
    });
  }

  private generatePlanetTexture(type: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const w = canvas.width;
    const h = canvas.height;

    if (type === 'earth') {
      // Ocean
      ctx.fillStyle = '#1a4d8f';
      ctx.fillRect(0, 0, w, h);
      
      // Continents (Random noise)
      ctx.fillStyle = '#2d5a2d';
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const radius = 50 + Math.random() * 100;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some brown for mountains
        ctx.fillStyle = '#4a3c31';
        ctx.beginPath();
        ctx.arc(x + 20, y + 10, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d5a2d'; // Reset
      }
    } else if (type === 'mars') {
      // Base red
      ctx.fillStyle = '#cc4422';
      ctx.fillRect(0, 0, w, h);
      
      // Dark patches
      ctx.fillStyle = '#882211';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const radius = 10 + Math.random() * 40;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      // Polar caps
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, 40); // North
      ctx.fillRect(0, h - 40, w, 40); // South
    } else if (type === 'jupiter') {
      // Bands
      const colors = ['#d4a574', '#b8956a', '#e8d4a0', '#a89968', '#d4a574'];
      const bandHeight = h / 20;
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(0, i * bandHeight, w, bandHeight);
        
        // Add noise/turbulance to bands
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let j = 0; j < 5; j++) {
           const y = i * bandHeight + Math.random() * bandHeight;
           ctx.fillRect(0, y, w, 2);
        }
      }
      // Great Red Spot
      ctx.fillStyle = '#dd4444';
      ctx.beginPath();
      ctx.ellipse(w * 0.7, h * 0.6, 60, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'moon') {
      // Base gray
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, w, h);
      
      // Craters
      ctx.fillStyle = '#555555';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const radius = 2 + Math.random() * 15;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private generateCloudTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 20 + Math.random() * 50;
      ctx.globalAlpha = 0.2 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private createAsteroidBelt() {
    const count = 2000;
    const geometry = new THREE.TetrahedronGeometry(0.5, 1); // Simple rock shape
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.asteroidBelt = new THREE.InstancedMesh(geometry, material, count);
    
    // Place asteroids between Mars (100) and Jupiter (200)
    // Let's say around radius 140-160 from some "center" or just floating in that gap
    // Since our planets are linear for the portfolio, we'll put them in a "belt" shape 
    // located between Mars position and Jupiter position in the scene logic.
    // Mars is at (100, 20, -30), Jupiter at (200, -10, -50).
    // Let's scatter them along the path between them roughly.
    
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      // Random position roughly between Mars and Jupiter X coords
      const t = Math.random(); 
      // Add spread
      const x = 120 + Math.random() * 60; // 120 to 180
      const y = (Math.random() - 0.5) * 50;
      const z = -40 + (Math.random() - 0.5) * 60;
      
      // Add some "belt" rotation logic? Or just random cloud?
      // User asked for "belt". Usually circular. 
      // But our planets are laid out linearly-ish.
      // Let's make a ring or cloud around the path.
      // Actually, let's make a distinct "Belt" feature that looks cool.
      // A ring at x=150.
      
      dummy.position.set(x, y, z);
      
      // Random rotation
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Random scale
      const scale = 0.5 + Math.random() * 1.5;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      this.asteroidBelt.setMatrixAt(i, dummy.matrix);
    }
    
    this.asteroidBelt.instanceMatrix.needsUpdate = true;
    this.scene.add(this.asteroidBelt);
  }

  private createComets() {
    for (let i = 0; i < 5; i++) {
      const comet = new THREE.Group();
      
      // Comet head
      const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        emissive: 0x6699ff,
        emissiveIntensity: 1,
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      comet.add(head);

      // Comet trail
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(50 * 3);
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      
      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.5,
      });
      const trail = new THREE.Line(trailGeometry, trailMaterial);
      comet.add(trail);

      // Random starting position
      comet.position.set(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200
      );

      // Random velocity
      (comet as any).velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      this.comets.push(comet);
      this.scene.add(comet);
    }
  }

  private createSpaceship() {
    this.spaceship = new THREE.Group();

    // UFO body (classic flying saucer)
    const bodyGeometry = new THREE.CylinderGeometry(3, 5, 1, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x4444ff,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.spaceship.add(body);

    // UFO dome (cockpit)
    const domeGeometry = new THREE.SphereGeometry(2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ffff,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.5;
    this.spaceship.add(dome);

    // Alien pilot (green head visible through dome)
    const alienGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const alienMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      emissiveIntensity: 0.5,
    });
    const alien = new THREE.Mesh(alienGeometry, alienMaterial);
    alien.position.y = 0.8;
    this.spaceship.add(alien);

    // Alien eyes
    const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0xffff00,
      emissiveIntensity: 1,
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.9, 0.6);
    this.spaceship.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.9, 0.6);
    this.spaceship.add(rightEye);

    // UFO lights around the edge
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff0000 : 0x00ff00,
        emissive: i % 2 === 0 ? 0xff0000 : 0x00ff00,
        emissiveIntensity: 1,
      });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(
        Math.cos(angle) * 4.5,
        -0.3,
        Math.sin(angle) * 4.5
      );
      this.spaceship.add(light);
    }

    // Start off-screen
    this.spaceship.position.set(-200, 50, -100);
    this.scene.add(this.spaceship);

    // Create flight path
    this.generateSpaceshipPath();
  }

  private generateSpaceshipPath() {
    this.spaceshipPath = [];
    const planetNames = ['earth', 'mars', 'jupiter', 'saturn', 'moon'];
    
    // Create a path that visits all planets
    planetNames.forEach((name) => {
      const planet = this.planets.get(name);
      if (planet) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 30 + 20,
          (Math.random() - 0.5) * 40
        );
        this.spaceshipPath.push(planet.position.clone().add(offset));
      }
    });
    
    // Return to start
    this.spaceshipPath.push(new THREE.Vector3(-200, 50, -100));
  }

  private createNebula() {
    const nebulaGeometry = new THREE.PlaneGeometry(500, 500);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      color: 0x220044,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    
    for (let i = 0; i < 3; i++) {
      const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebula.position.set(
        (Math.random() - 0.5) * 400,
        (Math.random() - 0.5) * 200,
        -100 - i * 50
      );
      nebula.rotation.z = Math.random() * Math.PI;
      this.scene.add(nebula);
    }
  }

  public navigateToPlanet(index: number) {
    const planetNames = ['earth', 'mars', 'jupiter', 'saturn', 'moon'];
    const planetName = planetNames[index];
    const planet = this.planets.get(planetName);
    
    if (!planet) return;

    this.currentPlanetIndex = index;
    
    // Calculate camera position (in front of planet)
    const distance = 30;
    const offset = new THREE.Vector3(0, 5, distance);
    this.targetCameraPosition.copy(planet.position).add(offset);
    this.targetLookAt.copy(planet.position);
  }

  public navigateToPlanetSmooth(currentIndex: number, nextIndex: number, progress: number) {
    const planetNames = ['earth', 'mars', 'jupiter', 'saturn', 'moon'];
    const currentPlanet = this.planets.get(planetNames[currentIndex]);
    const nextPlanet = this.planets.get(planetNames[nextIndex]);
    
    if (!currentPlanet || !nextPlanet) return;

    // Calculate camera positions for both planets
    const distance = 30;
    const offset = new THREE.Vector3(0, 5, distance);
    
    const currentCamPos = new THREE.Vector3().copy(currentPlanet.position).add(offset);
    const nextCamPos = new THREE.Vector3().copy(nextPlanet.position).add(offset);
    
    // Interpolate between positions
    this.targetCameraPosition.lerpVectors(currentCamPos, nextCamPos, progress);
    this.targetLookAt.lerpVectors(currentPlanet.position, nextPlanet.position, progress);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Rotate planets
    this.planets.forEach((planet) => {
      planet.rotation.y += 0.001;
    });

    // Animate stars (subtle rotation)
    this.stars.forEach((starGroup, index) => {
      starGroup.rotation.y += 0.0001 * (index + 1);
    });

    // Animate comets
    this.comets.forEach((comet) => {
      const velocity = (comet as any).velocity as THREE.Vector3;
      comet.position.add(velocity);

      // Reset comet if it goes too far
      if (comet.position.length() > 300) {
        comet.position.set(
          (Math.random() - 0.5) * 400,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200
        );
      }

      // Update trail
      const trail = comet.children[1] as THREE.Line;
      const positions = trail.geometry.attributes.position.array as Float32Array;
      
      // Shift trail positions
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3];
        positions[i + 1] = positions[i - 2];
        positions[i + 2] = positions[i - 1];
      }
      
      // Set new head position
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      
      trail.geometry.attributes.position.needsUpdate = true;
    });

    // Animate spaceship
    if (this.spaceship && this.spaceshipPath.length > 0) {
      this.spaceshipProgress += 0.0003;
      
      if (this.spaceshipProgress >= 1) {
        this.spaceshipProgress = 0;
        this.generateSpaceshipPath();
      }
      
      const totalPoints = this.spaceshipPath.length;
      const currentProgress = this.spaceshipProgress * (totalPoints - 1);
      const currentIndex = Math.floor(currentProgress);
      const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
      const segmentProgress = currentProgress - currentIndex;
      
      const currentPoint = this.spaceshipPath[currentIndex];
      const nextPoint = this.spaceshipPath[nextIndex];
      
      this.spaceship.position.lerpVectors(currentPoint, nextPoint, segmentProgress);
      
      // Rotate spaceship to face direction of travel
      const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      this.spaceship.rotation.y = angle;
      this.spaceship.rotation.z = Math.sin(Date.now() * 0.001) * 0.1;
    }

    // Animate asteroids
    if (this.asteroidBelt) {
      this.asteroidBelt.rotation.y += 0.0005;
      this.asteroidBelt.rotation.z += 0.0002;
    }

    // Smooth camera transition
    this.camera.position.lerp(this.targetCameraPosition, 0.05);
    
    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(this.camera.position);
    currentLookAt.lerp(this.targetLookAt, 0.05);
    this.camera.lookAt(currentLookAt);

    this.renderer.render(this.scene, this.camera);
  };

  private setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public destroy() {
    window.removeEventListener('resize', this.setupResize);
    this.renderer.dispose();
  }
}
