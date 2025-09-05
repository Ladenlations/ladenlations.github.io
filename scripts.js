document.addEventListener('DOMContentLoaded', () => {
    /* ------------------------------------------------
     * elements
     * ------------------------------------------------ */
    const navbar     = document.getElementById('navbar');
    const navMenu    = document.querySelector('.nav-menu');
    const countdown  = document.querySelector('.navbar-countdown');
  
    // NEW hamburger (checkbox + label with 3 lines -> X)
    const checkbox   = document.getElementById('nav-toggle');
    const hamburger  = document.querySelector('label.hamburger');
  
    // OLD hamburger (text icon) fallback
    const menuToggle = document.querySelector('.menu-toggle');
  
    /* ------------------------------------------------
     * helpers
     * ------------------------------------------------ */
    const updateCountdownLayout = (menuOpenOnMobile) => {
      if (!countdown) return;
  
      if (window.innerWidth <= 768) {
        countdown.style.display = menuOpenOnMobile ? 'flex' : 'none';
        countdown.style.flexDirection = 'column';
        countdown.style.alignItems = 'center';
        countdown.style.marginTop = '20px';
        countdown.style.position = '';
      } else {
        countdown.style.display = 'flex';
        countdown.style.flexDirection = 'row';
        countdown.style.alignItems = 'center';
        countdown.style.marginTop = '0';
        countdown.style.position = 'absolute';
      }
    };
  
    const lockBodyScroll = (lock) => {
      document.body.style.overflow = lock ? 'hidden' : '';
    };
  
    /* ------------------------------------------------
     * shrink navbar on scroll
     * ------------------------------------------------ */
    if (navbar) {
      const handleScroll = () => {
        navbar.classList.toggle('shrink', window.scrollY > 50);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  
    /* ------------------------------------------------
     * HAMBURGER — prefer NEW checkbox version, fallback to OLD
     * ------------------------------------------------ */
    if (checkbox && hamburger && navMenu) {
      const applyState = () => {
        const open = checkbox.checked;
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        lockBodyScroll(open && window.innerWidth <= 768);
        updateCountdownLayout(open);
      };
  
      checkbox.addEventListener('change', applyState);
  
      // close menu when a nav link is clicked
      navMenu.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
          checkbox.checked = false;
          applyState();
        })
      );
  
      // keep things sane on resize
      window.addEventListener('resize', () => applyState());
  
      // init
      applyState();
    } else if (menuToggle && navMenu) {
      // Fallback: previous .menu-toggle approach
      const toggleMenu = () => {
        navMenu.classList.toggle('show');
        const open = navMenu.classList.contains('show');
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        lockBodyScroll(open && window.innerWidth <= 768);
        updateCountdownLayout(open);
      };
  
      menuToggle.addEventListener('click', toggleMenu);
  
      navMenu.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => {
          navMenu.classList.remove('show');
          menuToggle.setAttribute('aria-expanded', 'false');
          lockBodyScroll(false);
          updateCountdownLayout(false);
        })
      );
  
      window.addEventListener('resize', () => {
        const open = navMenu.classList.contains('show');
        if (window.innerWidth > 768) lockBodyScroll(false);
        updateCountdownLayout(open && window.innerWidth <= 768);
      });
  
      updateCountdownLayout(false);
    } else {
      // no hamburger on this page — still make countdown correct on resize
      window.addEventListener('resize', () => updateCountdownLayout(false));
      updateCountdownLayout(false);
    }
  
    /* ------------------------------------------------
     * highlight active nav link
     * ------------------------------------------------ */
    const currentPage = window.location.pathname;
    const pageMap = {
      '/index.html'   : 'home-link',
      '/about.html'   : 'about-link',
      '/puppies.html' : 'puppies-link',
      '/studs.html'   : 'studs-link',
      '/ourgirls.html': 'girls-link',
      '/shop.html'    : 'shop-link',
      '/contact.html' : 'contact-link'
    };
    const currentLinkId = pageMap[currentPage];
    if (currentLinkId) {
      const currentLink = document.getElementById(currentLinkId);
      if (currentLink) currentLink.classList.add('active');
    }
  
    /* ------------------------------------------------
     * INFINITE (SEAMLESS) CAROUSELS — image-safe
     * ------------------------------------------------ */
    document.querySelectorAll('.carousel-container').forEach((carousel) => {
      const track    = carousel.querySelector('.carousel-track');
      const viewport = carousel.querySelector('.carousel-track-container') || (track ? track.parentElement : null);
      const dots     = Array.from(carousel.querySelectorAll('.carousel-indicator'));
      if (!track || !viewport || dots.length === 0) return;
  
      let originals = Array.from(track.children);
      if (originals.length < 2) return;
  
      // Clone for seamless loop (only once)
      if (!track.querySelector('[data-clone="true"]')) {
        const firstClone = originals[0].cloneNode(true);
        const lastClone  = originals[originals.length - 1].cloneNode(true);
        firstClone.dataset.clone = 'true';
        lastClone.dataset.clone  = 'true';
        track.appendChild(firstClone);
        track.insertBefore(lastClone, originals[0]);
      }
  
      let slides = Array.from(track.children);
      const realCount = originals.length;
  
      // Measure based on the viewport (reliable even if images not loaded)
      const measure = () => viewport.getBoundingClientRect().width;
  
      let width = 0;
      let index = 1; // start at first REAL slide (after leading clone)
  
      const setSlideWidths = (w) => {
        slides.forEach(s => {
          s.style.minWidth = w + 'px';   // lock each slide to the viewport width
          s.style.width    = w + 'px';
        });
      };
  
      const setTransform = () => {
        track.style.transform = `translate3d(-${index * width}px,0,0)`;
      };
  
      const enableTransition = () => { track.style.transition = 'transform .5s ease'; };
      const disableTransition = () => { track.style.transition = 'none'; };
  
      const layout = () => {
        width = measure();
        setSlideWidths(width);
        disableTransition();
        setTransform();
        void track.offsetHeight; // flush
        enableTransition();
      };
  
      const getRealIndex = () => (index - 1 + realCount) % realCount;
  
      const updateDots = () => {
        const realIdx = getRealIndex();
        dots.forEach((dot, i) => dot.classList.toggle('current-slide', i === realIdx));
      };
  
      // State guards
      let isAnimating = false;
      let isSnapping  = false;
      let autoTimer   = null;
  
      const next = () => {
        if (isAnimating || isSnapping) return;
        isAnimating = true;
        enableTransition();
        void track.offsetWidth;
        index += 1;
        setTransform();
      };
  
      const goToReal = (realIdx) => {
        const currentReal = getRealIndex();
        if (realIdx === currentReal || isSnapping || isAnimating) return;
        isAnimating = true;
        enableTransition();
        void track.offsetWidth;
        index = realIdx + 1; // offset for leading clone
        setTransform();
      };
  
      track.addEventListener('transitionend', () => {
        slides = Array.from(track.children);
        const current = slides[index];
  
        if (current && current.dataset.clone === 'true') {
          isSnapping = true;
          disableTransition();
  
          if (index === slides.length - 1) index = 1;          // from firstClone -> real first
          else if (index === 0)             index = realCount; // from lastClone  -> real last
  
          setTransform();
          void track.offsetHeight;
          requestAnimationFrame(() => {
            enableTransition();
            isSnapping = false;
          });
        }
  
        isAnimating = false;
        updateDots();
      });
  
      const startAuto = () => { stopAuto(); autoTimer = setInterval(next, 5000); };
      const stopAuto  = () => { if (autoTimer) clearInterval(autoTimer); };
  
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          stopAuto();
          goToReal(i);
          startAuto();
        });
      });
  
      // Wait for images
      const imgs = Array.from(carousel.querySelectorAll('.carousel-slide img'));
      const imgsReady = Promise.all(
        imgs.map(img => img.complete ? Promise.resolve() :
          new Promise(res => img.addEventListener('load', res, { once: true })))
      );
  
      imgsReady.then(() => {
        layout();
        disableTransition();
        index = 1;
        setTransform();
        void track.offsetHeight;
        enableTransition();
        updateDots();
        startAuto();
      });
  
      window.addEventListener('resize', layout);
    });
  
    /* ------------------------------------------------
     * MAKE CAROUSEL IMAGES CLICKABLE TO THEIR PAGES
     * ------------------------------------------------ */
    (function makeImagesClickable() {
      const targetBySectionId = {
        'puppies'  : '/puppies.html',
        'studs'    : '/studs.html',
        'girldogs' : '/ourgirls.html'
      };
  
      document.querySelectorAll('.carousel-container').forEach((carousel) => {
        const section = carousel.closest('section');
        if (!section) return;
        const target = targetBySectionId[section.id];
        if (!target) return;
  
        carousel.querySelectorAll('.carousel-slide img').forEach((img) => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => {
            window.location.href = target;
          });
        });
      });
  
      const shopLogo = document.querySelector('#shop .logo');
      if (shopLogo) {
        shopLogo.style.cursor = 'pointer';
        shopLogo.addEventListener('click', () => {
          window.location.href = '/shop.html';
        });
      }
    })();
  
    /* ------------------------------------------------
     * SMOOTH SCROLLING TEXT (no flicker)
     * ------------------------------------------------ */
    (function initSmoothMarquees() {
      // Inject keyframes that use a CSS var for exact travel distance
      const style = document.createElement('style');
      style.textContent = `
        @keyframes marqueeSlide {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(calc(-1 * var(--marquee-distance, 100%)),0,0); }
        }
      `;
      document.head.appendChild(style);
  
      const SPEED_PX_PER_SEC = 120; // change to taste (lower = slower)
  
      const setupOne = (container) => {
        const wrapper = container.querySelector('.scrolling-text-wrapper');
        if (!wrapper || wrapper.dataset.marqueeReady === 'true') return;
  
        // Ensure at least two identical chunks inside wrapper
        const chunks = Array.from(wrapper.children);
        if (chunks.length === 0) return;
        if (chunks.length === 1) wrapper.appendChild(chunks[0].cloneNode(true));
  
        // Kill any old CSS animation on the child chunks
        wrapper.querySelectorAll('.scrolling-text').forEach(el => {
          el.style.animation = 'none';
        });
  
        // Hide while measuring to avoid flicker
        wrapper.style.visibility = 'hidden';
  
        // Smooth GPU hints
        Object.assign(wrapper.style, {
          display: 'flex',
          whiteSpace: 'nowrap',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        });
  
        const calcAndRun = () => {
          const first = wrapper.children[0];
          const distance = first.scrollWidth; // px
          wrapper.style.setProperty('--marquee-distance', distance + 'px');
          const duration = Math.max(1, distance / SPEED_PX_PER_SEC);
  
          // Apply animation and then show
          wrapper.style.animation = `marqueeSlide ${duration}s linear infinite`;
          // give the browser one frame to apply styles before showing
          requestAnimationFrame(() => { wrapper.style.visibility = 'visible'; });
        };
  
        // Recalc when fonts are ready & on resize
        const ready = document.fonts && document.fonts.ready
          ? document.fonts.ready
          : Promise.resolve();
        ready.then(calcAndRun);
  
        window.addEventListener('load', calcAndRun);
  
        let t;
        window.addEventListener('resize', () => {
          clearTimeout(t);
          t = setTimeout(calcAndRun, 150);
        });
  
        // Optional: pause on hover (remove if you don't want it)
        container.addEventListener('mouseenter', () => { wrapper.style.animationPlayState = 'paused'; });
        container.addEventListener('mouseleave', () => { wrapper.style.animationPlayState = 'running'; });
  
        wrapper.dataset.marqueeReady = 'true';
      };
  
      document.querySelectorAll('.scrolling-text-container').forEach(setupOne);
    })();
  
    /* ------------------------------------------------
     * countdown timers
     * ------------------------------------------------ */
    const initializeCountdown = (endDate, daysEl, hoursEl, minutesEl, secondsEl) => {
      const endTime = new Date(endDate).getTime();
      const update = () => {
        const distance = endTime - Date.now();
        if (distance < 0) {
          daysEl.textContent = hoursEl.textContent = minutesEl.textContent = secondsEl.textContent = '0';
          clearInterval(timer);
          return;
        }
        const days    = Math.floor(distance / 86400000);
        const hours   = Math.floor((distance % 86400000) / 3600000);
        const minutes = Math.floor((distance % 3600000) / 60000);
        const seconds = Math.floor((distance % 60000) / 1000);
        daysEl.textContent = days;
        hoursEl.textContent = hours;
        minutesEl.textContent = minutes;
        secondsEl.textContent = seconds;
      };
      const timer = setInterval(update, 1000);
      update();
    };
  
    const grab = sel => document.querySelector(sel);
  
    const navbarDaysEl    = grab('#days-navbar');
    const navbarHoursEl   = grab('#hours-navbar');
    const navbarMinutesEl = grab('#minutes-navbar');
    const navbarSecondsEl = grab('#seconds-navbar');
    if (navbarDaysEl && navbarHoursEl && navbarMinutesEl && navbarSecondsEl) {
      initializeCountdown('2025-12-26T00:00:00', navbarDaysEl, navbarHoursEl, navbarMinutesEl, navbarSecondsEl);
    }
  
    const popupDaysEl    = grab('#days-popup');
    const popupHoursEl   = grab('#hours-popup');
    const popupMinutesEl = grab('#minutes-popup');
    const popupSecondsEl = grab('#seconds-popup');
    if (popupDaysEl && popupHoursEl && popupMinutesEl && popupSecondsEl) {
      initializeCountdown('2025-12-26T00:00:00', popupDaysEl, popupHoursEl, popupMinutesEl, popupSecondsEl);
    }
  
    const puppyDaysEl    = grab('#days-puppy');
    const puppyHoursEl   = grab('#hours-puppy');
    const puppyMinutesEl = grab('#minutes-puppy');
    const puppySecondsEl = grab('#seconds-puppy');
    if (puppyDaysEl && puppyHoursEl && puppyMinutesEl && puppySecondsEl) {
      initializeCountdown('2025-12-26T00:00:00', puppyDaysEl, puppyHoursEl, puppyMinutesEl, puppySecondsEl);
    }
  
    /* ------------------------------------------------
     * footer year auto-update (safe & optional)
     * ------------------------------------------------ */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
  