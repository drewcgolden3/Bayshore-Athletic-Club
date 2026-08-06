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

  // ── Campaign attribution ──
  // Captured on the first page of a visit and kept for the session, so a lead
  // can be credited to the ad that brought them in rather than to whatever page
  // they happened to submit from. Also read by chat.js for page-view tracking.
  const ATTRIBUTION = (function () {
    const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const params = new URLSearchParams(location.search);
    const fresh = {};
    KEYS.forEach(k => { const v = params.get(k); if (v) fresh[k] = v.slice(0, 200); });

    let stored = null;
    try { stored = JSON.parse(sessionStorage.getItem('bac_attribution') || 'null'); } catch (e) {}

    // Keep what's stored unless this page carries tags and the stored visit
    // didn't — someone who browsed organically then clicked an ad should be
    // credited to the ad.
    const hasFresh = Object.keys(fresh).length > 0;
    const data = (hasFresh || !stored) ? Object.assign({
      landing_path: location.pathname,
      referrer: document.referrer || null,
    }, fresh) : stored;

    try { sessionStorage.setItem('bac_attribution', JSON.stringify(data)); } catch (e) {}
    return data;
  })();
  window.BAC_ATTRIBUTION = ATTRIBUTION;

  // ── Day pass form ──
  // Posts to Switchboard OS, so the enquiry lands in the Leads list on the
  // dashboard and the club gets an email the moment it arrives.
  const SWITCHBOARD_API = 'https://switchboard-os.vercel.app';
  const CLIENT_SLUG = 'bayshore-athletic-club';

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

    btn.disabled = true;
    btn.textContent = 'SENDING…';
    try {
      const res = await fetch(SWITCHBOARD_API + '/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({
          clientSlug: CLIENT_SLUG,
          name, email, phone,
          interest: 'Free Day Pass',
          source: 'Website — Free Day Pass',
          company,                       // honeypot; the API answers 200 and drops it
        }, ATTRIBUTION)),
      });
      const data = await res.json();
      // Only claim success once the lead is actually recorded — a silent
      // success screen over a dropped enquiry is worse than an error.
      if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'not recorded');
      showSuccess();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = 'GET MY FREE PASS →';
      err.textContent = 'Something went wrong. Please call us at 781-356-5303 and we\'ll set you up.';
      err.style.display = 'block';
    }
  }

  // ── Amenities lightbox ──
  // Any image inside a .feature-media block opens full-size on click. Built
  // once per page and shared by every image, with prev/next cycling through
  // them in document order.
  (function () {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.feature-media img'));
    if (!imgs.length) return;

    var overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.hidden = true;
    overlay.innerHTML =
      '<button type="button" class="lb-close" aria-label="Close image">&times;</button>' +
      '<button type="button" class="lb-prev" aria-label="Previous image">&#8249;</button>' +
      '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
      '<button type="button" class="lb-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(overlay);

    var lbImg = overlay.querySelector('.lb-img');
    var lbCap = overlay.querySelector('.lb-caption');
    var closeBtn = overlay.querySelector('.lb-close');
    var current = 0;
    var lastFocus = null;

    function show(i) {
      current = (i + imgs.length) % imgs.length;
      lbImg.src = imgs[current].currentSrc || imgs[current].src;
      lbImg.alt = imgs[current].alt || '';
      lbCap.textContent = imgs[current].alt || '';
    }
    function openLb(i) {
      lastFocus = document.activeElement;
      show(i);
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('open'); });
      document.body.classList.add('lb-lock');
      closeBtn.focus();
    }
    function closeLb() {
      overlay.classList.remove('open');
      document.body.classList.remove('lb-lock');
      setTimeout(function () { overlay.hidden = true; lbImg.removeAttribute('src'); }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    imgs.forEach(function (img, i) {
      img.classList.add('lb-zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge: ' + (img.alt || 'photo'));
      img.addEventListener('click', function () { openLb(i); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); }
      });
    });

    closeBtn.addEventListener('click', closeLb);
    overlay.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    overlay.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  })();

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
