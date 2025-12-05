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

  // Track current section
  let currentSection = 0;

  // Scroll event listener
  lenis.on('scroll', ({ scroll }: { scroll: number }) => {
    // Calculate which section we're in
    const windowHeight = window.innerHeight;
    const sectionIndex = Math.floor(scroll / windowHeight);
    
    if (sectionIndex !== currentSection && sectionIndex < sections.length) {
      currentSection = sectionIndex;
      solarSystem.navigateToPlanet(sections[sectionIndex].planetIndex);
    }
  });

  // Intersection Observer for more precise section detection
  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        const section = sections.find((s) => s.id === sectionId);
        if (section) {
          solarSystem.navigateToPlanet(section.planetIndex);
        }
      }
    });
  }, observerOptions);

  // Observe all sections
  sections.forEach(({ id }) => {
    const element = document.getElementById(id);
    if (element) {
      observer.observe(element);
    }
  });

  return { lenis, observer };
}
