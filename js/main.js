/* Samaksh Travels — page behaviour (scroll choreography, UI, enquiry form) */
(function () {
  'use strict';

  /* ===== EDIT THESE: your real contact details =====
     phone: country code + number, digits only (e.g. 919876543210) */
  var CONFIG = {
    phone: '919419961983',            /* primary WhatsApp + call */
    phoneDisplay: '+91 94199 61983',
    phone2: '919419161983',
    phone2Display: '+91 94191 61983',
    email: 'inquiry@samakshtravels.com', /* public + receives enquiries (ImprovMX forwards to the owner's Gmail accounts) */
    address: 'Opp. 35 BRTF GREF Gate, Dhar Road, Udhampur – 182101, J&K'
  };

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = function () { return window.innerWidth < 900; };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var scene = window.SamakshScene;
  if (reduce) root.classList.add('still');

  /* ---------- contact links ---------- */
  $$('[data-tel]').forEach(function (a) { a.href = 'tel:+' + CONFIG.phone; });
  $$('[data-tel2]').forEach(function (a) { a.href = 'tel:+' + CONFIG.phone2; });
  $$('[data-phone2-text]').forEach(function (a) { a.textContent = CONFIG.phone2Display; });
  $$('[data-phone-text]').forEach(function (a) { a.textContent = CONFIG.phoneDisplay; });
  $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + CONFIG.email; a.textContent = CONFIG.email; });
  $$('[data-wa]').forEach(function (a) {
    a.href = 'https://wa.me/' + CONFIG.phone + '?text=' + encodeURIComponent('Hi Samaksh Travels, I would like to plan a trip. (Sent from samakshtravels.com)');
    a.target = '_blank'; a.rel = 'noopener';
  });
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- scenic SVG art for destination cards ---------- */
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  $$('svg.scenic').forEach(function (svg) {
    var seed = +svg.dataset.seed || 1, hue = +svg.dataset.hue || 200, r = rng(seed * 977 + 13), W = 400, H = 520, out = '';
    out += '<defs><linearGradient id="sg' + seed + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',55%,14%)"/><stop offset=".55" stop-color="hsl(' + ((hue + 25) % 360) + ',70%,40%)"/><stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',80%,62%)"/></linearGradient></defs>';
    out += '<rect width="' + W + '" height="' + H + '" fill="url(#sg' + seed + ')"/>';
    out += '<circle cx="' + (80 + r() * 240) + '" cy="' + (150 + r() * 70) + '" r="' + (34 + r() * 18) + '" fill="hsl(' + ((hue + 40) % 360) + ',95%,82%)" opacity=".85"/>';
    for (var layer = 0; layer < 4; layer++) {
      var baseY = 250 + layer * 62, amp = 120 - layer * 22, d = 'M0 ' + H + ' L0 ' + baseY, x = 0;
      while (x < W + 40) { x += 30 + r() * 50; d += ' L' + x.toFixed(0) + ' ' + (baseY - r() * amp).toFixed(0); }
      d += ' L' + (W + 40) + ' ' + H + ' Z';
      out += '<path d="' + d + '" fill="hsl(' + hue + ',' + (35 - layer * 6) + '%,' + (22 - layer * 5) + '%)" opacity="' + (0.5 + layer * 0.15) + '"/>';
    }
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.innerHTML = out;
  });

  /* ---------- nav ---------- */
  var nav = $('#nav'), burger = $('#burger');
  function navState() { nav.classList.toggle('scrolled', (window.scrollY || 0) > 40); }
  navState();
  burger.addEventListener('click', function () {
    var open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('#navLinks a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }); });
  var spy = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { $$('#navLinks a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); }); } });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['hero', 'manifesto', 'showcase', 'services', 'destinations', 'packages', 'stats', 'process', 'enquiry', 'faq'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });

  /* ---------- manifesto words ---------- */
  var mt = $('#manifestoText'), words = [];
  if (mt) {
    mt.setAttribute('aria-label', mt.textContent.trim());
    mt.innerHTML = mt.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    words = $$('.w', mt);
  }
  var manifest = $('#manifesto');
  function updateManifesto() {
    if (!manifest || reduce) return;
    var r = manifest.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
    var n = Math.round(p * 1.15 * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }

  /* ---------- showcase text + nav ---------- */
  var stages = $$('.stage'), dots = $$('#stageNav button'), bar = $('#stageBar'), showEl = $('#showcase');
  function setStage(i) {
    stages.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); $$('a', s).forEach(function (a) { a.tabIndex = k === i ? 0 : -1; }); });
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  }
  if (!reduce) setStage(0);
  if (scene) scene.onStage = setStage;
  else if (!reduce) { /* no WebGL: still show all stages */ root.classList.add('still'); }
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var i = +d.dataset.go, y = scene ? scene.goToStage(i) : showEl.getBoundingClientRect().top + window.scrollY;
      if (window.lenis) window.lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
  function updateBar() {
    if (!bar || !showEl) return;
    var r = showEl.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ---------- horizontal destinations ---------- */
  var dest = $('#destinations'), track = $('#destTrack'), destMax = 0;
  function sizeDest() {
    if (!dest || !track) return;
    var horizontal = !narrow() && !root.classList.contains('still');
    if (!horizontal) { dest.style.height = ''; track.style.transform = ''; return; }
    destMax = Math.max(0, track.scrollWidth - window.innerWidth + 40);
    dest.style.height = (destMax + window.innerHeight * 1.1) + 'px';
  }
  function updateDest() {
    if (!dest || narrow() || root.classList.contains('still')) return;
    var r = dest.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
    track.style.transform = 'translate3d(' + (-destMax * p).toFixed(1) + 'px,0,0)';
  }

  /* ---------- hero parallax out ---------- */
  var heroInner = $('.hero-inner'), heroEl = $('#hero'), heroList = $('.hero-list'), cue = $('.scroll-cue');
  function updateHero() {
    if (reduce || root.classList.contains('still')) return;
    var p = Math.min(1, (window.scrollY || 0) / (window.innerHeight * 0.7));
    heroInner.style.transform = 'translate3d(0,' + (-p * 90).toFixed(1) + 'px,0)'; heroInner.style.opacity = (1 - p * 1.25).toFixed(3);
    if (heroList) heroList.style.opacity = Math.max(0, 1 - p * 2).toFixed(3);
    if (cue) cue.style.opacity = Math.max(0, 1 - p * 3).toFixed(3);
  }

  /* ---------- reveal on view ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach(function (el, i) { el.style.transitionDelay = ((i % 4) * 70) + 'ms'; io.observe(el); });

  /* counters */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var to = +e.target.dataset.count, t0 = performance.now(), dur = 1400;
      if (reduce) { e.target.textContent = to; return; }
      (function tick(now) { var p = Math.min(1, (now - t0) / dur); e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); })(t0);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { el.textContent = '0'; cio.observe(el); });

  /* cursor spotlight on cards */
  $$('.spot').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var b = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - b.left) + 'px'); c.style.setProperty('--my', (e.clientY - b.top) + 'px'); });
  });

  /* ---------- FAQ ---------- */
  $$('.acc-item button').forEach(function (b) {
    var panel = b.parentElement.nextElementSibling; panel.id = panel.id || 'acc-' + Math.random().toString(36).slice(2, 7);
    b.setAttribute('aria-controls', panel.id); panel.setAttribute('role', 'region');
    b.addEventListener('click', function () {
      var item = b.closest('.acc-item'), open = !item.classList.contains('open');
      item.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- enquiry prefill from any CTA ---------- */
  function setSelect(sel, val) {
    var o = $$('option', sel).filter(function (x) { return x.textContent.trim().toLowerCase() === val.toLowerCase(); })[0];
    if (o) sel.value = o.value;
  }
  $$('[data-service],[data-tier],[data-dest]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.dataset.service) setSelect($('#f-service'), a.dataset.service);
      if (a.dataset.tier) { setSelect($('#f-service'), 'Holiday package'); setSelect($('#f-tier'), a.dataset.tier); }
      if (a.dataset.dest) { $('#f-to').value = a.dataset.dest; setSelect($('#f-service'), 'Holiday package'); }
    });
  });

  /* ---------- enquiry form → WhatsApp ---------- */
  var form = $('#enqForm'), note = $('#formNote');
  var d = $('#f-date'); if (d) d.min = new Date().toISOString().slice(0, 10);
  function err(id, msg) { var f = $('#' + id), e = $('#e-' + id.split('-')[1]); e.textContent = msg || ''; if (msg) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid'); return !msg; }
  ['f-name', 'f-phone'].forEach(function (id) { $('#' + id).addEventListener('blur', validate); $('#' + id).addEventListener('input', function () { if (this.getAttribute('aria-invalid')) validate(); }); });
  function validate() {
    var okN = err('f-name', $('#f-name').value.trim().length < 2 ? 'Please enter your name.' : '');
    var digits = $('#f-phone').value.replace(/\D/g, '');
    var okP = err('f-phone', digits.length < 10 ? 'Enter a 10-digit mobile number so we can reach you.' : '');
    return okN && okP;
  }
  function enquiry() {
    var v = function (n) { return form.elements[n].value.trim(); };
    return { name: v('name'), lines: ['*New enquiry — Samaksh Travels*', 'Name: ' + v('name'), 'Phone: ' + v('phone'), (v('email') ? 'Email: ' + v('email') : 'Email: —'), 'Need: ' + v('service') + (v('service') === 'Holiday package' ? ' (' + v('tier') + ')' : ''),
      'From: ' + (v('from') || '—'), 'To: ' + (v('to') || '—'), 'Date: ' + (v('date') || 'flexible'), 'Travellers: ' + (v('pax') || '—')].concat(v('note') ? ['Notes: ' + v('note')] : []) };
  }
  function send(channel) {
    if (!validate()) { (form.querySelector('[aria-invalid=true]') || form).focus(); return; }
    var q = enquiry(), text = q.lines.concat(['(Sent from samakshtravels.com)']).join('\n'), url;
    if (channel === 'mail') { window.location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Trip enquiry — ' + q.name) + '&body=' + encodeURIComponent(text); return; }
    url = 'https://wa.me/' + CONFIG.phone + '?text=' + encodeURIComponent(text);
    if (!window.open(url, '_blank', 'noopener')) window.location.href = url;
    note.classList.add('ok'); note.textContent = 'Opening WhatsApp with your details — just press send.';
  }

  /* automatic delivery to the agency inbox (FormSubmit.co; first use needs a one-time email activation) */
  var sendBtn = $('#sendBtn');
  function deliver() {
    if (!validate()) { (form.querySelector('[aria-invalid=true]') || form).focus(); return; }
    var data = new FormData(form), q = enquiry();
    data.append('_subject', 'New enquiry — ' + q.name + ' (' + form.elements.service.value + ')');
    data.append('_autoresponse', 'Thank you for contacting Samaksh Travels! We have received your enquiry and will reply shortly. For anything urgent, WhatsApp or call ' + CONFIG.phoneDisplay + ' or write to ' + CONFIG.email + '.'); data.append('_template', 'table'); data.append('_captcha', 'false');
    sendBtn.disabled = true; sendBtn.classList.add('busy'); note.classList.remove('ok', 'bad'); note.textContent = 'Sending…';
    fetch('https://formsubmit.co/ajax/' + CONFIG.email, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || j.success === 'false' || j.success === false) throw new Error(j.message || 'failed'); }); })
      .then(function () {
        form.reset(); form.elements.from.value = 'Udhampur'; form.elements.pax.value = 2;
        note.classList.add('ok'); note.textContent = 'Thank you! Your enquiry has reached us — we’ll contact you shortly on the number you gave.';
      })
      .catch(function () {
        note.classList.add('bad');
        note.innerHTML = 'Sorry, that didn’t go through. Please send it on WhatsApp or call ' + CONFIG.phoneDisplay + ' — your details are still in the form.';
      })
      .then(function () { sendBtn.disabled = false; sendBtn.classList.remove('busy'); });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); if (form.elements._honey.value) return; deliver(); });
  $('#sendWa').addEventListener('click', function () { send('wa'); });
  $('#sendMail').addEventListener('click', function () { send('mail'); });

  /* ---------- scroll engine: Lenis + one RAF loop ---------- */
  var lenis = null;
  if (!reduce && !narrow() && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    window.lenis = lenis;
    root.classList.add('lenis');
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var h = a.getAttribute('href'); if (h.length < 2) return;
        var t = document.querySelector(h); if (!t) return;
        e.preventDefault(); lenis.scrollTo(t, { offset: h === '#showcase' ? 0 : -10, duration: 1.6 });
      });
    });
  }

  function measureAll() { sizeDest(); if (scene) scene.measure(); }
  window.addEventListener('resize', function () { measureAll(); updateAll(); });
  window.addEventListener('load', function () { measureAll(); updateAll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureAll(); updateAll(); });

  function updateAll() { navState(); updateManifesto(); updateBar(); updateDest(); updateHero(); }
  function loop(time) {
    if (lenis) lenis.raf(time);
    updateAll();
    if (scene && !reduce) scene.frame(time);
    requestAnimationFrame(loop);
  }
  measureAll();
  requestAnimationFrame(loop);
  if (scene && reduce) { scene.invalidate(); scene.frame(performance.now()); }

  /* ---------- intro ---------- */
  function ready() { root.classList.add('ready'); }
  if (document.readyState === 'complete') setTimeout(ready, 80); else window.addEventListener('load', function () { setTimeout(ready, 80); });
  setTimeout(ready, 2500); /* never leave content hidden */
})();
