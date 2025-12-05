import Lenis from '@studio-freight/lenis';
import { SolarSystem } from './solarSystem';

export function initSmoothScroll(solarSystem: SolarSystem) {
  // Initialize Lenis
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false,
  });

  // Animation loop for Lenis
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Section mapping to planets
  const sections = [
    { id: 'hero', planetIndex: 0 },      // Earth
    { id: 'skills', planetIndex: 1 },    // Mars
    { id: 'projects', planetIndex: 2 },  // Jupiter
    { id: 'about', planetIndex: 3 },     // Saturn
    { id: 'contact', planetIndex: 4 },   // Moon
  ];

  // Progressive scroll-based navigation
  lenis.on('scroll', ({ scroll }: { scroll: number }) => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = scroll / documentHeight;
    
    // Calculate smooth transition between planets based on scroll
    const totalSections = sections.length;
    const planetProgress = scrollProgress * (totalSections - 1);
    const currentPlanetIndex = Math.floor(planetProgress);
    const nextPlanetIndex = Math.min(currentPlanetIndex + 1, totalSections - 1);
    const transitionProgress = planetProgress - currentPlanetIndex;
    
    // Interpolate between current and next planet
    solarSystem.navigateToPlanetSmooth(currentPlanetIndex, nextPlanetIndex, transitionProgress);
  });

  return { lenis };
}
