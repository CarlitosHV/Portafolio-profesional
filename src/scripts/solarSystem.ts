import * as THREE from 'three';

export class SolarSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private planets: Map<string, THREE.Mesh> = new Map();
  private stars: THREE.Points[] = [];
  private comets: THREE.Group[] = [];
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

    // Create comets
    this.createComets();

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
        color: 0x1a4d8f, 
        emissive: 0x0a2545,
        detail: { clouds: true, atmosphere: 0x4488ff }
      },
      { 
        name: 'mars', 
        position: [100, 20, -30], 
        size: 6, 
        color: 0xcc4422, 
        emissive: 0x661100,
        detail: { craters: true, atmosphere: 0xff6644 }
      },
      { 
        name: 'jupiter', 
        position: [200, -10, -50], 
        size: 15, 
        color: 0xd4a574, 
        emissive: 0x8b6f47,
        detail: { bands: true, atmosphere: 0xffcc99 }
      },
      { 
        name: 'saturn', 
        position: [300, 15, -40], 
        size: 12, 
        color: 0xe8d4a0, 
        emissive: 0xa89968,
        detail: { rings: true, atmosphere: 0xffeebb }
      },
      { 
        name: 'moon', 
        position: [50, 10, 10], 
        size: 4, 
        color: 0x888888, 
        emissive: 0x333333,
        detail: { craters: true, atmosphere: null }
      },
    ];

    planetData.forEach(({ name, position, size, color, emissive, detail }) => {
      const geometry = new THREE.SphereGeometry(size, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.4,
        roughness: 0.8,
        metalness: 0.2,
      });

      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(position[0], position[1], position[2]);
      
      // Add atmospheric glow
      if (detail.atmosphere) {
        const glowGeometry = new THREE.SphereGeometry(size * 1.15, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: detail.atmosphere,
          transparent: true,
          opacity: 0.25,
          side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planet.add(glow);
      }

      // Add surface details
      if (detail.craters) {
        // Add subtle surface variation for craters
        const detailGeometry = new THREE.SphereGeometry(size * 1.01, 64, 64);
        const detailMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color).multiplyScalar(0.9),
          transparent: true,
          opacity: 0.3,
          roughness: 0.9,
        });
        const details = new THREE.Mesh(detailGeometry, detailMaterial);
        planet.add(details);
      }

      // Add clouds for Earth
      if (detail.clouds) {
        const cloudGeometry = new THREE.SphereGeometry(size * 1.05, 32, 32);
        const cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2,
          roughness: 1,
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        planet.add(clouds);
      }

      // Add bands for Jupiter
      if (detail.bands) {
        const bandGeometry = new THREE.SphereGeometry(size * 1.02, 64, 64);
        const bandMaterial = new THREE.MeshStandardMaterial({
          color: 0xb8956a,
          transparent: true,
          opacity: 0.4,
          roughness: 0.7,
        });
        const bands = new THREE.Mesh(bandGeometry, bandMaterial);
        planet.add(bands);
      }

      this.planets.set(name, planet);
      this.scene.add(planet);

      // Add Saturn's rings with more detail
      if (detail.rings) {
        const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2.5, 128);
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

        // Add inner ring detail
        const innerRingGeometry = new THREE.RingGeometry(size * 1.3, size * 1.45, 128);
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
    });
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
