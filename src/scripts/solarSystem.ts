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
    this.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

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
      { count: 3000, size: 0.5, color: 0xffffff },
      { count: 1500, size: 1.0, color: 0xaaaaff },
      { count: 500, size: 1.5, color: 0xffffaa },
    ];

    starGroups.forEach(({ count, size, color }) => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Random position in sphere
        const radius = 300 + Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // Color variation
        const c = new THREE.Color(color);
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
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
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const stars = new THREE.Points(geometry, material);
      this.stars.push(stars);
      this.scene.add(stars);
    });
  }

  private createPlanets() {
    const planetData = [
      { name: 'earth', position: [0, 0, 0], size: 8, color: 0x2233ff, emissive: 0x112244 },
      { name: 'mars', position: [100, 20, -30], size: 6, color: 0xff4422, emissive: 0x441100 },
      { name: 'jupiter', position: [200, -10, -50], size: 15, color: 0xffaa66, emissive: 0x442211 },
      { name: 'saturn', position: [300, 15, -40], size: 12, color: 0xffdd88, emissive: 0x443322 },
      { name: 'moon', position: [50, 10, 10], size: 4, color: 0xaaaaaa, emissive: 0x222222 },
    ];

    planetData.forEach(({ name, position, size, color, emissive }) => {
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.3,
        roughness: 0.7,
        metalness: 0.3,
      });

      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(position[0], position[1], position[2]);
      
      // Add glow effect
      const glowGeometry = new THREE.SphereGeometry(size * 1.2, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      planet.add(glow);

      this.planets.set(name, planet);
      this.scene.add(planet);

      // Add Saturn's rings
      if (name === 'saturn') {
        const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2.5, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffddaa,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2.5;
        planet.add(ring);
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
