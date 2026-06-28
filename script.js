  // Hamburger
  const _hb = document.getElementById('hamburger');
  if (_hb) _hb.addEventListener('click', () => {
    const mm = document.getElementById('mobileMenu');
    if (mm) mm.classList.toggle('open');
  });
  function closeMobile() {
    document.getElementById('mobileMenu').classList.remove('open');
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

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.plan-card, .class-card, .review-card, .paid-item, .amenity-item, .benefit-item, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
