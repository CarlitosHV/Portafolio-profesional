import { SolarSystem } from "../scripts/solarSystem";
import { initSmoothScroll } from "../scripts/smoothScroll";

const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;
if (canvas) {
    const solarSystem = new SolarSystem(canvas);

    const { lenis } = initSmoothScroll(solarSystem);

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const href = (this as HTMLAnchorElement).getAttribute("href");
            if (href) {
                const target = document.querySelector(href);
                if (target) {
                    lenis.scrollTo(target as HTMLElement);
                }
            }
        });
    });

    const navbar = document.getElementById("navbar");
    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                navbar.style.transform = "translateX(-50%) translateY(0)";
                navbar.style.opacity = "1";
            } else {
                // Optional: you can make it hide or fade when at the very top, 
                // or just leave it floating 
                navbar.style.transform = "translateX(-50%) translateY(0)";
                navbar.style.opacity = "1";
            }
        });
    }

    const translations: Record<string, any> = {
        es: {
            "nav.skills": "Habilidades",
            "nav.projects": "Proyectos",
            "nav.about": "Sobre mí",
            "nav.contact": "Contacto",
            "hero.available": "Disponible para proyectos",
            "hero.viewProjects": "Ver Proyectos",
            "hero.contact": "Contactar",
            "hero.description":
                "Ingeniero de Software apasionado por el desarrollo móvil y web. Enfocado en convertirme en un <span class='text-space-400 font-bold'>Full-Stack Developer</span> creando soluciones creativas para problemas complejos.",
            "skills.title1": "Habilidades",
            "skills.title2": "Técnicas",
            "skills.subtitle":
                "Tecnologías y lenguajes con los que trabajo día a día",
            "skills.card1.desc":
                "Desarrollo de aplicaciones móviles y empresariales con .NET, Xamarin Forms y MAUI",
            "skills.card2.desc":
                "Desarrollo de aplicaciones móviles nativas y soluciones backend seguras",
            "skills.card3.desc":
                "Desarrollo moderno con JavaScript, Kotlin y Xamarin Forms",
            "skills.comm": "Comunicación",
            "skills.team": "Trabajo en Equipo",
            "skills.other": "Otras Tecnologías",
            "nav.game": "Juegos",
            "game.title1": "Diversión y",
            "game.title2": "Juegos",
            "game.desc": "Un pequeño juego estilo Candy Crush desarrollado por mí. ¡Pruébalo!",
            "game.playFullscreen": "Jugar en pantalla completa",
            "projects.p1.title": "App de Ventas de Seguros",
            "projects.p1.desc":
                "Aplicación móvil para optimizar la cotización y registro de clientes, desarrollada con Xamarin Forms y Backend .NET.",
            "projects.p2.title": "Aplicaciones Web Razor",
            "projects.p2.desc":
                "Implementación de aplicaciones web con Razor Pages en .NET (5/6/8), mejorando la compatibilidad multiplataforma.",
            "projects.p3.title": "Core Bancario - Registro",
            "projects.p3.desc":
                "App móvil para registro de usuarios en core de crédito, desarrollada en Java, asegurando cumplimiento normativo.",
            "projects.viewCode": "Ver Código",
            "projects.demo": "Demo",
            "about.title1": "Sobre",
            "about.title2": "Mí",
            "about.desc1":
                "Ingeniero de Software con una pasión particular por el desarrollo móvil. Disfruto enfrentando nuevos desafíos y encontrando soluciones creativas a problemas complejos.",
            "about.desc2":
                "Mi enfoque principal es convertirme en un <strong class='text-space-400'>Full-Stack Developer</strong>. Tengo experiencia colaborando en proyectos de los sectores financiero, afianzador y corporativo.",
            "about.education": "Educación",
            "about.degree": "Ingeniería de Software",
            "about.uni":
                "Universidad Autónoma del Estado de México (2018 – 2024)",
            "about.stats.exp": "Años de Experiencia",
            "about.stats.projects": "Proyectos Completados",
            "exp.title": "Experiencia",
            "exp.job1.date": "2023 - Presente",
            "exp.job1.role": "Software Developer",
            "exp.job1.desc":
                "• Participación en 6 proyectos (financiero, afianzador, corporativo).<br>• Desarrollo de App móvil ventas seguros (Xamarin + .NET).<br>• Apps Web con Razor Pages (.NET 5/6/8).<br>• Proyectos bancarios en Java.",
            "contact.title1": "Trabajemos",
            "contact.title2": "Juntos",
            "contact.desc":
                "¿Tienes un proyecto en mente? Me encantaría escuchar sobre él. Contáctame y hablemos sobre cómo puedo ayudarte.",
            "contact.email": "Enviar Email",
            "footer.madeWith": "Diseñado y desarrollado con",
            "footer.using": "usando Astro y Tailwind CSS",
            "footer.rights": "Todos los derechos reservados.",
        },
        en: {
            "nav.skills": "Skills",
            "nav.projects": "Projects",
            "nav.about": "About Me",
            "nav.contact": "Contact",
            "hero.available": "Available for projects",
            "hero.viewProjects": "View Projects",
            "hero.contact": "Contact Me",
            "hero.description":
                "Software Engineer with a particular passion for mobile and web development. Focused on becoming a <span class='text-space-400 font-bold'>Full-Stack Developer</span> finding creative solutions to complex problems.",
            "skills.title1": "Technical",
            "skills.title2": "Skills",
            "skills.subtitle":
                "Technologies and languages I work with every day",
            "skills.card1.desc":
                "Enterprise and mobile application development with .NET, Xamarin Forms and MAUI",
            "skills.card2.desc":
                "Native mobile application development and secure backend solutions",
            "skills.card3.desc":
                "Modern development with JavaScript, Kotlin and Xamarin Forms",
            "skills.comm": "Communication",
            "skills.team": "Teamwork",
            "skills.other": "Other Technologies",
            "nav.game": "Games",
            "game.title1": "Fun &",
            "game.title2": "Games",
            "game.desc": "A small Candy Crush style game developed by me. Give it a try!",
            "game.playFullscreen": "Play fullscreen",
            "projects.p1.title": "Insurance Sales App",
            "projects.p1.desc":
                "Mobile application to optimize quotation and customer registration, developed with Xamarin Forms and .NET Backend.",
            "projects.p2.title": "Razor Web Apps",
            "projects.p2.desc":
                "Implementation of web applications with Razor Pages in .NET (5/6/8), improving cross-platform compatibility.",
            "projects.p3.title": "Banking Core - Registration",
            "projects.p3.desc":
                "Mobile user registration app for credit core, developed in Java, ensuring regulatory compliance.",
            "projects.viewCode": "View Code",
            "projects.demo": "Demo",
            "about.title1": "About",
            "about.title2": "Me",
            "about.desc1":
                "Software Engineer with a particular passion for mobile development. I enjoy facing new challenges and finding creative solutions to complex problems.",
            "about.desc2":
                "My main focus is to become a <strong class='text-space-400'>Full-Stack Developer</strong>. I have experience collaborating on projects in the financial, insurance, and corporate sectors.",
            "about.education": "Education",
            "about.degree": "Software Engineering",
            "about.uni":
                "Autonomous University of Mexico State (2018 – 2024)",
            "about.stats.exp": "Years of Experience",
            "about.stats.projects": "Completed Projects",
            "exp.title": "Experience",
            "exp.job1.date": "2023 - Present",
            "exp.job1.role": "Software Developer",
            "exp.job1.desc":
                "• Participated in 6 projects (financial, insurance, corporate).<br>• Developed Insurance sales mobile app (Xamarin + .NET).<br>• Web apps with Razor Pages (.NET 5/6/8).<br>• Banking projects in Java.",
            "contact.title1": "Let's Work",
            "contact.title2": "Together",
            "contact.desc":
                "Have a project in mind? I'd love to hear about it. Contact me and let's talk about how I can help you.",
            "contact.email": "Send Email",
            "footer.madeWith": "Designed and developed with",
            "footer.using": "using Astro and Tailwind CSS",
            "footer.rights": "All rights reserved.",
        },
    };

    let currentLang = "es";
    const langToggle = document.getElementById("lang-toggle");
    const langText = document.getElementById("lang-text");

    if (langToggle && langText) {
        langToggle.addEventListener("click", () => {
            currentLang = currentLang === "es" ? "en" : "es";
            langText.textContent = currentLang.toUpperCase();
            updateLanguage(currentLang);
        });
    }

    function updateLanguage(lang: string) {
        document.querySelectorAll("[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (key && translations[lang] && translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });
    }
}
