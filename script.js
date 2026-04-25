// Contact Information
const contactInfo = {
    email: 'karmakarjyoti777@gmail.com',
    facebook: 'https://www.facebook.com/DARKBOYJYOTI/',
    instagram: 'https://www.instagram.com/darkboyjyoti/',
    website: 'https://darkboyjyoti.github.io',
    telegram: 'https://t.me/DARKBOYJYOTI',
    youtube: 'https://youtube.com/karmakarjyoti777',
    linkedin: 'https://www.linkedin.com/in/jyoti-karmakar-42475b117/'
};

/* -----------------------------------------------------
   🌊 SMOOTH SCROLL
----------------------------------------------------- */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initSmoothScrolling();
    initLazySections(); // Load sections dynamically on scroll
    initScrollHeader();
    initThemeToggle();
    initMobileMenu();
    initSmoothNavigation(); // Fix scroll navigation for Firefox
    initHaptics();
    initHeroAnimation();
    startHeroSequence();
    // initTypingAnimation(); // Managed by sequence
    initAboutTyping();
    initScrollDownButton(); // Add scroll down button handler
    initVisibilityOptimization(); // Battery saving
});


/* -----------------------------------------------------
   ⚡ Dynamic Section Loading (Bidirectional)
   Loads/unloads sections when scrolling up or down
----------------------------------------------------- */
function initLazySections() {
    // Get all sections except hero (always visible)
    const sections = document.querySelectorAll('.section');

    // Mark sections as lazy-loadable
    sections.forEach(section => {
        // Skip hero section - it should always be visible
        if (section.closest('#hero')) return;

        section.classList.add('section-lazy');
    });

    // Observer to load/unload sections based on visibility
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const section = entry.target;

            if (entry.isIntersecting) {
                // Section is entering viewport - load it
                setTimeout(() => {
                    section.classList.add('section-loaded');
                }, 100);
            } else {
                // Section is leaving viewport - unload it
                // This works for both scroll up and scroll down
                setTimeout(() => {
                    section.classList.remove('section-loaded');
                }, 150);
            }
        });
    }, {
        // Trigger when 10% visible
        threshold: 0.1,
        // Start loading 250px before section enters viewport
        rootMargin: '250px 0px'
    });

    // Observe all lazy sections (keep observing, don't unobserve)
    sections.forEach(section => {
        if (section.classList.contains('section-lazy')) {
            observer.observe(section);
        }
    });
}


/* -----------------------------------------------------
   ✨ About Section - Bidirectional Scroll Animation
----------------------------------------------------- */
function initAboutTyping() {
    const paragraphs = document.querySelectorAll('.about-text');
    if (paragraphs.length === 0) return;

    // Set text content from data-text attribute
    paragraphs.forEach(p => {
        const text = p.getAttribute('data-text');
        if (text) p.textContent = text;
    });

    // Use the same bidirectional animation as other sections
    observeElements(paragraphs, 'about-text-visible', 200);
}



/* -----------------------------------------------------
   🤖 AI Chatbot Typing Animation
----------------------------------------------------- */
/* -----------------------------------------------------
   ✨ Orchestrated Hero Animation Sequence
   Profile → Name (+ glow) → Subtitle (+ glow) → Buttons → Description (+ glow) → Pulse
----------------------------------------------------- */
function startHeroSequence() {
    const image = document.querySelector('.hero-image');
    const title = document.querySelector('.hero-title');
    const subtitle = document.querySelector('.hero-subtitle');
    const description = document.querySelector('.hero-description');
    const buttons = document.querySelectorAll('.hero-nav-btn');

    const STEP_DELAY = 600; // Time between major steps

    // 1. Show Profile Picture
    setTimeout(() => {
        if (image) {
            image.classList.add('hero-element-active');
        }
    }, 100);

    // 2. Show Name (no glow yet - will glow when photo pulses)
    setTimeout(() => {
        if (title) {
            title.classList.add('hero-element-active');
        }
    }, 100 + STEP_DELAY);

    // 3. Show Subtitle (no glow)
    setTimeout(() => {
        if (subtitle) {
            subtitle.classList.add('hero-element-active');
        }
    }, 100 + STEP_DELAY * 2);

    // 4. Show Description (simple fade-in like subtitle)
    setTimeout(() => {
        if (description) {
            description.classList.add('hero-element-active');
        }
    }, 100 + STEP_DELAY * 3);

    // 5. Show Buttons (after description)
    setTimeout(() => {
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.add('hero-element-active');
            }, index * 150); // 150ms stagger between buttons
        });

        // Start Pulse + Glow after buttons animation completes
        setTimeout(() => {
            if (image) image.classList.add('pulse-active');
            if (title) title.classList.add('text-glow');
        }, buttons.length * 150 + 300);
    }, 100 + STEP_DELAY * 4);
}

/* -----------------------------------------------------
   🤖 AI Chatbot Typing Animation (Description Only)
----------------------------------------------------- */
function initTypingAnimation(onComplete) {
    const description = document.querySelector('.hero-description');

    if (!description) {
        if (onComplete) onComplete();
        return;
    }

    // Store original text
    const descText = description.getAttribute('data-text-content') || description.textContent;
    // Save it if not saved yet to avoid losing it on re-runs (though we run once)
    description.setAttribute('data-text-content', descText);

    // Clear text initially
    description.textContent = '';

    // Typing helper
    const typeText = (element, text, speed, callback) => {
        let i = 0;
        element.classList.add('typing-cursor');

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                // Small random variation for liquid feel
                const variation = Math.random() * 10;
                setTimeout(type, speed + variation);
            } else {
                element.classList.remove('typing-cursor');
                if (callback) callback();
            }
        }
        type();
    };

    // Start typing immediately (delay handled by sequence orchestrator)
    typeText(description, descText, 25, onComplete);
}

/* -----------------------------------------------------
   ✨ Hero Interactive Background Animation
   Particles with mouse interaction
----------------------------------------------------- */
function initHeroAnimation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration - Heavily optimized for mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 120 : 350; // Increased for better visuals (balanced)
    const connectionDistance = isMobile ? 110 : 140; // Shorter connections on mobile
    const mouseScannerRadius = 220;

    let mouse = { x: null, y: null };

    // Resize handling - Optimized for mobile address bar
    const resize = () => {
        const parent = canvas.parentElement;
        width = canvas.width = parent.offsetWidth;
        height = canvas.height = parent.offsetHeight + 1; // +1px to prevent bottom white line

        // Force redraw on mobile resize to prevent gaps
        if (isMobile) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
    };

    window.addEventListener('resize', () => {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            resize();
            initParticles(); // Re-init to distribute properly
        }, 200);
    });
    resize();

    // Mouse Interaction
    const heroSection = canvas.parentElement;

    heroSection.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Touch Interaction
    heroSection.addEventListener('touchmove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        if (touch) {
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
        }
    }, { passive: true });

    // Click/Tap Effect (Ripple Burst)
    heroSection.addEventListener('click', (e) => {
        if ('vibrate' in navigator) navigator.vibrate(10); // Haptic feedback for animation
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        particles.forEach(p => {
            const dx = p.x - clickX;
            const dy = p.y - clickY;
            if (Math.abs(dx) < 100 && Math.abs(dy) < 100) { // Optimization
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle) * 5;
                    p.vy += Math.sin(angle) * 5;
                }
            }
        });
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5; // Faster
            this.vy = (Math.random() - 0.5) * 0.5; // Faster
            this.size = Math.random() * 2.5 + 1; // Smaller
            this.baseAlpha = (Math.random() * 0.25) + 0.15; // Less visible

            // Gentle random drift
            this.friction = 0.985;
            this.driftSpeed = 0.05; // Increased
        }

        update() {
            // Add very gentle random drift for natural movement
            this.vx += (Math.random() - 0.5) * this.driftSpeed;
            this.vy += (Math.random() - 0.5) * this.driftSpeed;
            // Mouse repulsion
            if (mouse.x != null && mouse.y != null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const mouseRadius = 120;

                if (distance < mouseRadius && distance > 0) {
                    // Repel away from mouse (gentler)
                    const force = (1 - distance / mouseRadius) * 0.5;
                    const angle = Math.atan2(dy, dx);
                    this.vx += Math.cos(angle) * force;
                    this.vy += Math.sin(angle) * force;
                }
            }

            // Apply friction
            this.vx *= this.friction;
            this.vy *= this.friction;

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges (not wrap - less confusing)
            if (this.x <= 0 || this.x >= width) {
                this.vx *= -0.8; // Bounce with damping
                this.x = Math.max(0, Math.min(width, this.x));
            }
            if (this.y <= 0 || this.y >= height) {
                this.vy *= -0.8; // Bounce with damping
                this.y = Math.max(0, Math.min(height, this.y));
            }
        }

        draw() {
            // Blue with subtle glow
            ctx.fillStyle = `rgba(59, 130, 246, ${this.baseAlpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Animation control for battery saving
    let animationId;
    let isAnimating = true;

    function animate() {
        if (!isAnimating) return;

        ctx.clearRect(0, 0, width, height);

        // Hacker Blue Line Color RGB: 51, 170, 255
        const lineColor = '51, 170, 255';

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.update();
            p.draw();

            // Connect to OTHER particles
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;

                // PERFORMANCE OPTIMIZATION: 
                // Skip square root calculation if simple distance is too far
                if (Math.abs(dx) > connectionDistance || Math.abs(dy) > connectionDistance) continue;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${lineColor}, ${0.15 - distance / connectionDistance * 0.15})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }

            // Connect to mouse
            if (mouse.x != null) {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;

                if (Math.abs(dx) < mouseScannerRadius && Math.abs(dy) < mouseScannerRadius) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouseScannerRadius) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${lineColor}, ${0.2 - distance / mouseScannerRadius * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    initParticles();
    animate();

    // Expose control functions for visibility optimization
    window.pauseCanvasAnimation = () => {
        isAnimating = false;
        if (animationId) cancelAnimationFrame(animationId);
    };
    window.resumeCanvasAnimation = () => {
        if (!isAnimating) {
            isAnimating = true;
            animate();
        }
    };
}

// Show Header when scrolling past hero subtitle
function initScrollHeader() {
    const nav = document.getElementById('mainNav');
    // Changed to observe hero-title as requested
    const triggerElement = document.querySelector('.hero-title');

    if (!triggerElement) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Show nav when hero subtitle is not visible (scrolled past)
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                nav.classList.add('visible');
            } else {
                nav.classList.remove('visible');
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px'
    });

    observer.observe(triggerElement);
}

// Dark/Light Mode Toggle - Sync all three buttons
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    const body = document.body;

    // Function to update theme
    function updateTheme(isDark) {
        const icons = [
            themeToggle.querySelector('i'),
            themeToggleMobile.querySelector('i')
        ];

        if (isDark) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            icons.forEach(icon => {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            });
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            icons.forEach(icon => {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            });
            localStorage.setItem('theme', 'light');
        }
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateTheme(savedTheme === 'dark');

    // Add click handlers
    const toggleTheme = () => {
        const isDark = body.classList.contains('light-mode');
        updateTheme(isDark);
    };

    themeToggle.addEventListener('click', toggleTheme);
    themeToggleMobile.addEventListener('click', toggleTheme);
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
            menuToggle.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    });
}

// Smooth Scroll Navigation (Firefox Fix)
function initSmoothNavigation() {
    // Hero navigation buttons - scroll to sections
    const heroNavButtons = document.querySelectorAll('.hero-nav-btn');

    heroNavButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = button.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Firefox-compatible smooth scroll with fallback
                try {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } catch (err) {
                    // Fallback for older browsers
                    targetElement.scrollIntoView();
                }
            }
        });
    });

    // Mobile menu links - scroll to sections (Firefox mobile fix)
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');

    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Close mobile menu first
                const menuToggle = document.getElementById('menuToggle');
                const mobileMenu = document.getElementById('mobileMenu');
                if (menuToggle) menuToggle.classList.remove('active');
                if (mobileMenu) mobileMenu.classList.remove('active');

                // Then scroll smoothly
                try {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } catch (err) {
                    targetElement.scrollIntoView();
                }
            }
        });
    });

    // Nav brand link - scroll to top
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        navBrand.addEventListener('click', (e) => {
            e.preventDefault();

            // Scroll to top smoothly
            try {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } catch (err) {
                // Fallback for older browsers
                window.scrollTo(0, 0);
            }
        });
    }

    // Also handle scroll-down button if exists
    const scrollDownBtn = document.querySelector('.scroll-down');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                try {
                    projectsSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } catch (err) {
                    projectsSection.scrollIntoView();
                }
            }
        });
    }
}


// Social Media Functions
function makeCall() {
    // Function removed as requested
}

function sendEmail() {
    const subject = encodeURIComponent('Hello from your portfolio');
    const body = encodeURIComponent('Hi Jyoti,\\n\\nI visited your portfolio and would like to connect.\\n\\nBest regards,');
    window.open(`mailto:${contactInfo.email}?subject=${subject}&body=${body}`);
}

function openFacebook() {
    window.open(contactInfo.facebook, '_blank');
}

function openInstagram() {
    window.open(contactInfo.instagram, '_blank');
}

function openWebsite() {
    window.open(contactInfo.website, '_blank');
}

function openYouTube() {
    window.open(contactInfo.youtube, '_blank');
}

function openLinkedIn() {
    window.open(contactInfo.linkedin, '_blank');
}

function openTelegram() {
    window.open(contactInfo.telegram, '_blank');
}

// Fix sticky focus on touch devices
document.addEventListener("touchend", () => {
    document.activeElement?.blur();
});

/* -----------------------------------------------------
   📳 Haptic Feedback (Vibration)
   Uses Event Delegation to catch ALL clicks
----------------------------------------------------- */
function initHaptics() {
    // Check if vibration is valid in this browser
    const canVibrate = 'vibrate' in navigator;

    if (canVibrate) {
        // Delegate click events on the body
        document.body.addEventListener('click', (e) => {
            // Find closest interactive element
            const target = e.target.closest('a, button, .project-card, .social-link, .theme-toggle, .menu-toggle, .skill-tag, .hero-image');

            if (target) {
                // Small tactile bump
                navigator.vibrate(10);
            }
        });

        // Also add touchstart for instant feedback on mobile (optional but snappier)
        document.body.addEventListener('touchstart', (e) => {
            const target = e.target.closest('a, button, .project-card, .social-link, .hero-image');
            if (target) {
                navigator.vibrate(5);
            }
        }, { passive: true });
    }
}

/* -----------------------------------------------------
   ✨ Scroll-Triggered Animations System
----------------------------------------------------- */
function initScrollAnimations() {
    // Projects - Staggered fade in (slower for impact)
    const projectCards = document.querySelectorAll('.project-card');
    observeElements(projectCards, 'animate-visible', 250); // 250ms stagger

    // Skills - Staggered fade in
    const skillTags = document.querySelectorAll('.skill-tag');
    observeElements(skillTags, 'animate-visible', 150); // 150ms stagger

    // Social Links - Staggered fade in
    const socialLinks = document.querySelectorAll('.social-link');
    observeElements(socialLinks, 'animate-visible', 150); // 150ms stagger

    // Contact Section
    initContactAnimations();
}

// Generic observer for bidirectional staggered animations
function observeElements(elements, className, staggerDelay = 0) {
    if (elements.length === 0) return;

    // Track last scroll position to detect direction
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';

    // Update scroll direction on scroll
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = currentScrollY;
    }, { passive: true }); // Passive for better performance

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Element entering viewport - animate in
                const allElements = Array.from(elements);
                const index = allElements.indexOf(entry.target);

                // Reverse index if scrolling up (animate from last to first)
                const animationIndex = scrollDirection === 'up'
                    ? (allElements.length - 1 - index)
                    : index;

                setTimeout(() => {
                    entry.target.classList.add(className);
                }, animationIndex * staggerDelay);
            } else {
                // Element leaving viewport - animate out
                setTimeout(() => {
                    entry.target.classList.remove(className);
                }, 100);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '100px 0px'
    });

    // Keep observing for bidirectional support
    elements.forEach(el => observer.observe(el));
}

// Contact Section Animations
function initContactAnimations() {
    const contactSection = document.getElementById('contact'); // Fixed from 'connect' to 'contact'
    if (!contactSection) return;

    const title = contactSection.querySelector('.section-title');
    const contactText = contactSection.querySelector('.contact-text');
    const emailBtn = contactSection.querySelector('.btn-primary');

    let hasAnimated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;

                // 1. Glow up title (300ms delay)
                if (title) {
                    title.classList.add('contact-title-animate');
                    setTimeout(() => {
                        title.classList.add('animate-visible');
                    }, 300);
                }

                // 2. Type contact text (800ms delay)
                if (contactText) {
                    setTimeout(() => {
                        typeContactText(contactText);
                    }, 800);
                }

                // 3. Glow button (1800ms delay)
                if (emailBtn) {
                    emailBtn.classList.add('btn-glow-animate');
                    setTimeout(() => {
                        emailBtn.classList.add('animate-visible');
                    }, 1800);
                }

                observer.unobserve(contactSection);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(contactSection);
}

// Type contact text with cursor
function typeContactText(element) {
    const text = element.textContent;
    element.textContent = '';
    element.classList.add('typing-active', 'typing-cursor');

    let charIndex = 0;
    let lastTime = performance.now();
    const charDelay = 30; // Fast typing

    function typeChar(currentTime) {
        const elapsed = currentTime - lastTime;

        if (elapsed >= charDelay) {
            if (charIndex < text.length) {
                element.textContent += text.charAt(charIndex);
                charIndex++;
                lastTime = currentTime;
            }
        }

        if (charIndex < text.length) {
            requestAnimationFrame(typeChar);
        } else {
            // Remove cursor when done
            element.classList.remove('typing-cursor');
        }
    }

    requestAnimationFrame(typeChar);
}

// Initialize scroll animations on load
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
});

/* -----------------------------------------------------
   🔽 Scroll Down Button Handler
----------------------------------------------------- */
function initScrollDownButton() {
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener('click', () => {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                projectsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/* -----------------------------------------------------
   🔋 Battery Saving - Pause Animations When Tab Hidden
----------------------------------------------------- */
function initVisibilityOptimization() {
    // Pause canvas animation when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Tab is hidden - pause animations
            if (typeof window.pauseCanvasAnimation === 'function') {
                window.pauseCanvasAnimation();
            }
        } else {
            // Tab is visible - resume animations
            if (typeof window.resumeCanvasAnimation === 'function') {
                window.resumeCanvasAnimation();
            }
        }
    });
}