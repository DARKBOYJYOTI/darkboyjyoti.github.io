(function () {
  'use strict';

  /* ===========================================
     REDUCED MOTION CHECK
     =========================================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ===========================================
     APP-LIKE BEHAVIOR: no select, no zoom, no right-click
     =========================================== */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); }); // fallback

  /* ===========================================
     UTILITY
     =========================================== */
  function qs(s, p) { return (p || document).querySelector(s); }
  function qsa(s, p) { return (p || document).querySelectorAll(s); }

  /* ===========================================
     THEME SYSTEM — M3 Segmented Buttons
     =========================================== */
  function initTheme() {
    const html = document.documentElement;
    const segBtns = qsa('.theme-seg-btn');

    const storedTheme = localStorage.getItem('portfolio_theme') || 'system';
    html.setAttribute('data-theme', storedTheme);

    function setActive(theme) {
      segBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
      });
    }

    setActive(storedTheme);

    segBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const theme = this.dataset.theme;
        if (theme === html.getAttribute('data-theme')) return;
        html.setAttribute('data-theme', theme);
        localStorage.setItem('portfolio_theme', theme);
        setActive(theme);
      });
    });
  }

  /* ===========================================
     MOBILE MENU — M3 Bottom Sheet
     =========================================== */
  function initMobileMenu() {
    const toggle = qs('#menuToggle');
    const menu = qs('#mobileMenu');
    const overlay = qs('#mobileSheetOverlay');
    const links = qsa('.mobile-link');

    // Init: mobile links not tabbable until menu opens
    links.forEach(l => l.setAttribute('tabindex', '-1'));

    function openMenu() {
      toggle.classList.add('active');
      menu.classList.add('open');
      overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      links.forEach(l => l.removeAttribute('tabindex'));
    }

    function closeMenu() {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      links.forEach(l => l.setAttribute('tabindex', '-1'));
    }

    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener('click', closeMenu);

    links.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
      }
    });

    window.addEventListener('scroll', function () {
      if (menu.classList.contains('open')) {
        closeMenu();
      }
    }, { passive: true });
  }

  /* ===========================================
     PROGRESS BAR
     =========================================== */
  function initProgressBar() {
    const bar = qs('#progressBar');
    if (!bar) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ===========================================
     AUTO-HIDE NAV
     =========================================== */
  function initNav() {
    const nav = qs('#mainNav');
    const hero = qs('#hero');
    if (!nav) return;

    let ticking = false;

    function onScroll() {
      const heroHeight = hero ? hero.offsetHeight : window.innerHeight;
      const threshold = heroHeight * 0.65;

      if (window.scrollY > threshold) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ===========================================
     ACTIVE NAV LINK — aria-current
     =========================================== */
  function initActiveNavAria() {
    const nav = qs('#mainNav');
    const desktopLinks = qsa('.nav-links a:not(.nav-cta)');
    const mobileLinks = qsa('.mobile-link');
    const allLinks = [...desktopLinks, ...mobileLinks];
    const navH = nav ? nav.offsetHeight : 64;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          allLinks.forEach(link => {
            const isActive = link.getAttribute('href') === '#' + id;
            link.classList.toggle('active', isActive);
            if (isActive) {
              link.setAttribute('aria-current', 'section');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { threshold: 0.1, rootMargin: '-' + navH + 'px 0px 0px 0px' });

    qsa('.section[id]').forEach(s => observer.observe(s));
  }
  function initParticles() {
    const canvas = qs('#heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouse = { x: null, y: null };
    let animId;

    let isMobile = window.innerWidth < 768;
    let count = isMobile ? 100 : 250;
    let connectDist = isMobile ? 100 : 140;

    function resize() {
      const parent = canvas.parentElement;
      w = canvas.width = parent.offsetWidth;
      h = canvas.height = parent.offsetHeight;
      isMobile = window.innerWidth < 768;
      count = isMobile ? 100 : 250;
      connectDist = isMobile ? 100 : 140;
    }

    window.addEventListener('resize', function () {
      clearTimeout(window._particleResize);
      window._particleResize = setTimeout(function () {
        resize();
        initParticlesArray();
      }, 200);
    });

    resize();

    function Particle() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2.5 + 0.5;
      this.alpha = Math.random() * 0.3 + 0.1;
    }

    Particle.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    };

    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96, 165, 250, ' + this.alpha + ')';
      ctx.fill();
    };

    function initParticlesArray() {
      particles = [];
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          if (Math.abs(dx) > connectDist || Math.abs(dy) > connectDist) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(96, 165, 250, ' + ((1 - dist / connectDist) * 0.12) + ')';
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Mouse connection
        if (mouse.x != null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          if (Math.abs(dx) < 150 && Math.abs(dy) < 150) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(96, 165, 250, ' + ((1 - dist / 150) * 0.15) + ')';
              ctx.lineWidth = 0.5;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(animate);
    }

    const hero = canvas.parentElement;
    hero.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', function () { mouse.x = null; mouse.y = null; });
    hero.addEventListener('touchmove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
      }
    }, { passive: true });

    initParticlesArray();
    animate();

    // Pause on hidden tab
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      } else if (!document.hidden && !animId) {
        animate();
      }
    });
  }

  /* ===========================================
     HERO TYPING
     =========================================== */
  function initTyping() {
    if (prefersReducedMotion) {
      qs('#typedText').textContent = 'Digital Creator';
      return;
    }

    const el = qs('#typedText');
    if (!el) return;

    const phrases = [
      'Educational Professional',
      'Digital Creator',
      'Web Developer',
      'Technical Assistant',
      'Problem Solver'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentPhrase = '';

    function type() {
      const fullText = phrases[phraseIndex];
      let speed = 80;

      if (isDeleting) {
        currentPhrase = fullText.substring(0, charIndex - 1);
        charIndex--;
        speed = 30;
      } else {
        currentPhrase = fullText.substring(0, charIndex + 1);
        charIndex++;
      }

      el.textContent = currentPhrase;

      if (!isDeleting && charIndex === fullText.length) {
        speed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 500;
      }

      setTimeout(type, speed);
    }

    setTimeout(type, 1800);
  }

  /* ===========================================
     GSAP SCROLL ANIMATIONS
     =========================================== */
  function initGsapAnimations() {
    if (typeof gsap === 'undefined') return;
    if (prefersReducedMotion) {
      gsap.set('.hero-image, .hero-title, .hero-subtitle, .hero-description, .hero-actions .hero-btn, .scroll-indicator', { opacity: 1, scale: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero content entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .fromTo('.hero-image', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.4)' }, 0.3)
      .fromTo('.hero-title', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
      .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, 0.9)
      .fromTo('.hero-description', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 1.1)
      .fromTo('.hero-actions .hero-btn', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.5 }, 1.3)
      .fromTo('.scroll-indicator', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 1.6);

    // Section headers
    // (scroll-triggered entrance removed per user request)

    // About cards
    // (scroll-triggered entrance removed per user request)

    // Project cards
    // (scroll-triggered entrance removed per user request)

    // Skill cards — set bar width immediately
    gsap.utils.toArray('.skill-card').forEach(function (card) {
      const fill = card.querySelector('.skill-fill');
      if (fill) fill.style.width = fill.dataset.width + '%';
    });

    // Social links
    // (scroll-triggered entrance removed per user request)

    // Contact
    // (scroll-triggered entrance removed per user request)

    ScrollTrigger.refresh();
  }

  /* ===========================================
     3D TILT ON PROJECT CARDS
     =========================================== */
  function initTilt() {
    if (isTouchDevice || prefersReducedMotion) return;

    const cards = qsa('.project-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -8;
        const rotateY = (x - centerX) / centerX * 8;

        card.style.transform =
          'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ===========================================
     LENIS SMOOTH SCROLL
     =========================================== */
  let lenis = null;

  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') return;

    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5
    });

    // Connect Lenis to GSAP ScrollTrigger (single rAF via GSAP ticker)
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ===========================================
     SMOOTH ANCHOR SCROLL
     =========================================== */
  function initSmoothAnchors() {
    const nav = qs('#mainNav');
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const targetId = link.getAttribute('href');
      if (!targetId) return;

      // Close mobile menu if open
      const menuToggle = qs('#menuToggle');
      const mobileMenu = qs('#mobileMenu');
      if (menuToggle && menuToggle.classList.contains('active')) {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }

      e.preventDefault();

      // Handle # (scroll to top)
      if (targetId === '#') {
        if (typeof lenis !== 'undefined' && lenis) {
          lenis.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      const target = qs(targetId);
      if (!target) return;

      const navH = nav ? nav.offsetHeight : 0;
      
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(target, { offset: -navH });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  /* ===========================================
     SCROLL INDICATOR CLICK
     =========================================== */
  function initScrollIndicator() {
    const btn = qs('#scrollIndicator');
    const nav = qs('#mainNav');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const about = qs('#about');
      if (!about) return;
      const navH = nav ? nav.offsetHeight : 0;
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(about, { offset: -navH });
      } else {
        const top = about.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  /* ===========================================
     FAB — Scroll to Top (M3)
     =========================================== */
  function initFab() {
    const fab = qs('#fabBtn');
    if (!fab) return;

    let ticking = false;

    function checkScroll() {
      const scrollY = window.scrollY;
      if (scrollY > window.innerHeight * 0.6) {
        fab.classList.add('visible');
      } else {
        fab.classList.remove('visible');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });

    fab.addEventListener('click', function () {
      if (typeof lenis !== 'undefined' && lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  /* ===========================================
     RIPPLE EFFECT (M3)
     =========================================== */
  function initRipple() {
    const containers = qsa('.hero-btn, .contact-btn, .project-card, .social-link, .nav-cta, .m3-fab');

    containers.forEach(el => {
      // Ensure overflow hidden for ripple containment (without overriding position)
      const cs = getComputedStyle(el);
      if (cs.position === 'static') el.style.position = 'relative';
      if (cs.overflow !== 'hidden') el.style.overflow = 'hidden';

      el.addEventListener('pointerdown', function (e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.color = 'currentColor';

        // Remove existing ripples
        const existing = this.querySelector('.ripple');
        if (existing) existing.remove();

        this.appendChild(ripple);

        // Clean up after animation
        ripple.addEventListener('animationend', function () {
          ripple.remove();
        });
      });
    });
  }

  /* ===========================================
     INIT
     =========================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initMobileMenu();
    initProgressBar();
    initNav();
    initActiveNavAria();
    initParticles();
    initTyping();
    initSmoothAnchors();
    initScrollIndicator();
    initTilt();
    initFab();
    initRipple();

    // Defer GSAP/Lenis loading
    setTimeout(function () {
      initLenis();
      initGsapAnimations();
    }, 300);
  });

})();
