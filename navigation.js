/* ============================================================
   M.A.R.J.E.N.E — navigation.js
   Glass navbar (scroll state + mobile menu) and the animated
   hero stat counters. Self-contained, no dependencies. Safe to
   load on every page — it no-ops if #mjeNav isn't present.

   Works with either stat markup:
     <span class="stat-number" data-count="100">0</span><span class="stat-suffix">+</span>
     <dd data-count="100" data-suffix="+">0</dd>
   ============================================================ */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     1) GLASS NAVBAR — scroll state
     Toggles data-state="top" | "scrolled" on the header, which
     css/navigation.css uses to fade the frosted-glass background
     and drop shadow in as the page scrolls.
     ------------------------------------------------------------ */
  const nav = document.getElementById('mjeNav');

  if (nav) {
    const SCROLL_THRESHOLD = 40; // px before the glass kicks in
    let ticking = false;

    const applyScrollState = () => {
      nav.setAttribute('data-state', window.scrollY > SCROLL_THRESHOLD ? 'scrolled' : 'top');
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(applyScrollState);
        ticking = true;
      }
    };

    applyScrollState(); // set correct state on load (e.g. mid-scroll reload)
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ------------------------------------------------------------
       2) MOBILE MENU
       Toggles data-open on the link list + aria attributes on the
       trigger button. Closes on: link click, Escape, outside
       click, or resize back to desktop width.
       ------------------------------------------------------------ */
    const toggle = document.getElementById('mjeNavToggle');
    const links = document.getElementById('mjeNavLinks');

    if (toggle && links) {
      const isOpen = () => links.getAttribute('data-open') === 'true';
      let lockedScrollY = 0;

      // Real scroll-lock: pins <body> with position:fixed instead of
      // just setting overflow:hidden. overflow:hidden alone doesn't
      // stop iOS Safari's momentum/rubber-band scroll, which is what
      // makes a fixed, blurred menu panel flicker transparent as the
      // page keeps moving underneath it.
      const lockScroll = () => {
        lockedScrollY = window.scrollY;
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.classList.add('mje-menu-open');
      };

      const unlockScroll = () => {
        document.body.classList.remove('mje-menu-open');
        document.body.style.top = '';
        window.scrollTo(0, lockedScrollY);
      };

      const closeMenu = () => {
        links.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        unlockScroll();
      };

      const openMenu = () => {
        links.setAttribute('data-open', 'true');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        lockScroll();
      };

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        isOpen() ? closeMenu() : openMenu();
      });

      links.querySelectorAll('.mje-nav__link').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
          closeMenu();
          toggle.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (isOpen() && !nav.contains(e.target)) closeMenu();
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 860 && isOpen()) closeMenu();
      });
    }

    /* ------------------------------------------------------------
       3) ACTIVE LINK
       Marks the link matching the current page with aria-current,
       so it doesn't have to be hardcoded per page.
       ------------------------------------------------------------ */
    const currentPage = (location.pathname.split('/').pop() || 'index.html');
    nav.querySelectorAll('.mje-nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      const isCurrent = href === currentPage || (currentPage === '' && href === 'index.html');
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ------------------------------------------------------------
     4) HERO STAT COUNTERS
     Animates every [data-count] element from 0 up to its target
     once it scrolls into view. Runs independently of the navbar
     code above, and independently of any other <script> on the
     page — so a broken/unrelated script elsewhere can't stop
     these numbers from counting.
     ------------------------------------------------------------ */
  const counterEls = document.querySelectorAll('[data-count]');

  if (counterEls.length) {
    const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animateCounter = (el) => {
      const raw = el.getAttribute('data-count');
      const target = parseFloat(raw);
      if (isNaN(target)) return;

      const suffix = el.getAttribute('data-suffix') || '';
      const isDecimal = raw.indexOf('.') !== -1;
      const duration = 1800; // ms
      let startTime = null;

      const format = (n) => (isDecimal ? n.toFixed(1) : Math.round(n)) + suffix;

      const tick = (timestamp) => {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        el.textContent = format(target * easeOutExpo(progress));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = format(target); // land exactly on target, no rounding drift
        }
      };

      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counterEls.forEach((el) => observer.observe(el));
    } else {
      // Fallback for browsers without IntersectionObserver support
      counterEls.forEach(animateCounter);
    }
  }
})();