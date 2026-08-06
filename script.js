  // Hamburger
  const _hb = document.getElementById('hamburger');
  if (_hb) _hb.addEventListener('click', () => {
    const mm = document.getElementById('mobileMenu');
    if (mm) mm.classList.toggle('open');
  });
  function closeMobile() {
    const mm = document.getElementById('mobileMenu');
    if (mm) mm.classList.remove('open');
  }

  // ── Day pass form ──
  // Paste your deployed Google Apps Script Web App URL between the quotes below.
  // Until then the form will show success but NOT send anything — wire this before going live.
  const DAYPASS_ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

  function val(id) { return (document.getElementById(id).value || '').trim(); }

  async function submitDayPass() {
    const name = val('dp-name');
    const email = val('dp-email');
    const phone = val('dp-phone');
    const company = val('dp-company'); // honeypot
    const err = document.getElementById('dp-error');
    const btn = document.getElementById('dp-submit');
    err.style.display = 'none';

    if (company) return; // bot caught
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = 'Please enter your name and a valid email to claim your pass.';
      err.style.display = 'block';
      return;
    }

    const showSuccess = () => {
      document.getElementById('daypassForm').style.display = 'none';
      document.getElementById('daypass-success').style.display = 'block';
    };

    // Backend not wired yet — don't error publicly, but make it obvious in the console.
    if (DAYPASS_ENDPOINT.indexOf('PASTE_') === 0) {
      console.warn('Day pass backend not configured: set DAYPASS_ENDPOINT to your Apps Script URL. No email was sent.');
      showSuccess();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'SENDING…';
    try {
      await fetch(DAYPASS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web apps don't return CORS headers; we submit fire-and-forget
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ name, email, phone, source: 'Free Day Pass — website' })
      });
      showSuccess();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'GET MY FREE PASS →';
      err.textContent = 'Something went wrong. Please call us at 781-356-5303 and we\'ll set you up.';
      err.style.display = 'block';
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  Premium motion layer — nav elevate + staggered scroll reveal.
  //  Native scrolling only; no smooth-scroll library.
  //  All gated behind prefers-reduced-motion for accessibility.
  // ─────────────────────────────────────────────────────────────
  (function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || new URLSearchParams(location.search).has('nomotion');
    const nav = document.getElementById('navbar');

    function setNav(y) { if (nav) nav.classList.toggle('scrolled', y > 12); }
    setNav(window.scrollY || 0);
    window.addEventListener('scroll', () => setNav(window.scrollY), { passive: true });

    if (reduce) return; // honor reduced motion — no transforms, no reveal

    // ── Staggered scroll-reveal (fade + rise, expo-out) ──
    // The hidden state is a CSS class gated on html.js-reveal, not an inline
    // style. If this script never runs, nothing is ever hidden and the page
    // renders in full instead of blank below the hero.
    const revealSel = [
      '.section-label', '.section-title', '.section-body',
      '.plan-card', '.class-card', '.review-card', '.paid-item', '.amenity-item',
      '.benefit-item', '.stat-item', '.feature', '.trainer-card', '.explore-card',
      '.reviews-aggregate', '.daypass-steps .step',
      '.insurance-note', '.hours-table', '.contact-item'
    ].join(', ');

    const els = Array.from(document.querySelectorAll(revealSel));
    if (!els.length) return;

    document.documentElement.classList.add('js-reveal');
    els.forEach(el => el.classList.add('will-reveal'));

    function reveal(el, delay) {
      if (el.classList.contains('is-revealed')) return;
      el.style.transition =
        'opacity .85s var(--ease-expo) ' + delay + 'ms, transform .9s var(--ease-expo) ' + delay + 'ms';
      el.classList.add('is-revealed');
      setTimeout(() => { el.style.willChange = 'auto'; }, 1400 + delay);
    }

    // IntersectionObserver only delivers callbacks while the page is actually
    // being rendered, so a backgrounded or occluded tab would otherwise leave
    // everything at opacity 0. This is the net that catches that.
    const failsafe = setTimeout(() => {
      els.forEach(el => reveal(el, 0));
    }, 2500);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const sibs = el.parentElement
          ? Array.from(el.parentElement.children).filter(c => els.indexOf(c) !== -1)
          : [el];
        const idx = Math.max(0, sibs.indexOf(el));
        reveal(el, Math.min(idx * 85, 340));
        io.unobserve(el);
      });
      if (els.every(el => el.classList.contains('is-revealed'))) clearTimeout(failsafe);
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    els.forEach(el => io.observe(el));
  })();
