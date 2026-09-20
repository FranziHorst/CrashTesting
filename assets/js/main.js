/* =========================================================
   N. SANE TRANSFORMATION — interactions
   Vanilla JS, no dependencies. One rAF loop for everything
   that lerps; IntersectionObserver for everything that fades.
   ========================================================= */
(() => {
  'use strict';

  const doc = document;
  const body = doc.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = (s, ctx = doc) => ctx.querySelector(s);
  const $$ = (s, ctx = doc) => [...ctx.querySelectorAll(s)];

  /* ---------- text splitting ---------- */
  const splitChars = (el) => {
    const text = el.textContent.replace(/­/g, '');
    el.textContent = '';
    [...text].forEach((c, i) => {
      const s = doc.createElement('span');
      s.className = 'ch';
      s.textContent = c === ' ' ? ' ' : c;
      s.style.animationDelay = `${i * 38}ms`;
      s.style.transitionDelay = `${i * 38}ms`;
      el.appendChild(s);
    });
  };
  $$('[data-split]').forEach(splitChars);

  /* ---------- fit hero headline to the container width ----------
     Line 1 is scaled by font-size until it spans the column, line 2 is set
     smaller and tracked out, so both lines end flush on the same edges.    */
  const heroTitle = $('#heroTitle');
  const heroInner = $('.hero__inner');
  const heroEyebrow = $('.hero .eyebrow');
  const heroBottom = $('.hero__bottom');
  const tickerEl = $('.ticker');
  const fitWords = $$('[data-fit]', heroTitle || doc);
  const fitSingles = $$('[data-fit-single]');

  // offscreen probe: measuring the live element while restyling it is unreliable
  const probe = doc.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;letter-spacing:0;font-size:100px;pointer-events:none';
  doc.body.appendChild(probe);

  const widthPerPx = (el) => {
    const cs = getComputedStyle(el);
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.fontStyle = cs.fontStyle;
    probe.style.textTransform = cs.textTransform;
    probe.textContent = el.textContent;
    return (probe.offsetWidth || 100) / 100;
  };
  // set the size, then track the line so it lands exactly on the column edge
  const setLine = (el, size, cw, ratio) => {
    const gaps = Math.max(1, el.children.length - 1);
    const ls = (cw - ratio * size) / gaps;
    el.style.fontSize = `${size.toFixed(2)}px`;
    el.style.letterSpacing = `${ls.toFixed(3)}px`;
    el.style.marginRight = `${(-ls).toFixed(3)}px`;
  };

  const fitHero = () => {
    if (!heroTitle || fitWords.length < 2) return;
    const cw = heroTitle.clientWidth - 3; // room for the outlined line's stroke
    if (cw <= 0) return;
    const [w1, w2] = fitWords;

    const r1 = widthPerPx(w1);
    const r2 = widthPerPx(w2);
    const gaps2 = Math.max(1, w2.children.length - 1);
    let size1 = cw / r1;                                   // line 1 fills the column
    let size2 = Math.min(cw / (r2 + 0.26 * gaps2), size1 * 0.45); // line 2: ~.26em tracking

    // on desktop the headline also has to fit the leftover height of the hero
    if (innerWidth > 860) {
      const cs = getComputedStyle(heroInner);
      const used = (heroEyebrow?.offsetHeight || 0) + (heroBottom?.offsetHeight || 0)
        + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        + parseFloat(getComputedStyle(heroTitle).marginTop);
      const avail = Math.max(150, innerHeight - (nav?.offsetHeight || 76)
        - (tickerEl?.offsetHeight || 0) - used);
      const needed = (size1 + size2) * 0.83;
      if (needed > avail) { const k = avail / needed; size1 *= k; size2 *= k; }
    }
    setLine(w1, size1, cw, r1);
    setLine(w2, size2, cw, r2);
  };

  // single display lines that should span their column exactly
  const fitSingleLines = () => {
    fitSingles.forEach((el) => {
      const host = el.closest('h1,h2,h3,p,div') || el.parentElement;
      const cw = (host?.clientWidth || 0) - 4;
      if (cw <= 0) return;
      setLine(el, cw / widthPerPx(el), cw, widthPerPx(el));
    });
  };

  /* ---------- preloader ---------- */
  const preNum = $('#preloadNum');
  const preBar = $('#preloadBar');
  const startAt = performance.now();

  const finish = () => {
    body.classList.remove('is-loading');
    body.classList.add('is-done');
    requestAnimationFrame(() => body.classList.add('is-ready'));
    setTimeout(() => $('#preloader')?.remove(), 1600);
  };

  if (reduced.matches) {
    preNum && (preNum.textContent = '100');
    finish();
  } else {
    let shown = 0;
    const tick = () => {
      // ease toward 100, but never faster than the real page load
      const elapsed = performance.now() - startAt;
      const target = Math.min(100, (elapsed / 1500) * 100);
      shown = lerp(shown, target, 0.18);
      const v = Math.round(shown);
      preNum.textContent = String(v).padStart(3, '0');
      preBar.style.width = v + '%';
      if (v >= 100) { setTimeout(finish, 260); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- custom cursor ---------- */
  const cursor = $('#cursor');
  const cDot = $('#cursorDot');
  const cRing = $('#cursorRing');
  const cLabel = $('#cursorLabel');
  const LABELS = { boom: 'Boom', spin: 'Spin!', open: 'Öffnen', scroll: 'Runter', case: 'Case' };
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ring = { x: mouse.x, y: mouse.y };

  if (finePointer.matches && !reduced.matches) {
    body.classList.add('has-cursor');
    addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener('mousedown', () => cursor.classList.add('is-down'));
    addEventListener('mouseup', () => cursor.classList.remove('is-down'));
    addEventListener('mouseleave', () => cursor.style.opacity = '0');
    addEventListener('mouseenter', () => cursor.style.opacity = '1');

    doc.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const hover = e.target.closest('a,button,input,select,label,.tilt,[role="button"]');
      cursor.classList.toggle('is-hover', !!hover && !labelled);
      cursor.classList.toggle('is-label', !!labelled);
      if (labelled) cLabel.textContent = LABELS[labelled.dataset.cursor] || '';
    });
  }

  /* ---------- magnetic buttons ---------- */
  const magnets = $$('.magnetic');
  if (finePointer.matches && !reduced.matches) {
    magnets.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.28}px, ${my * 0.34}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- scramble text ---------- */
  const GLYPHS = '▓▒░#@%&*+=<>/\\|';
  $$('[data-scramble]').forEach((el) => {
    const original = el.textContent;
    let raf, frame;
    const run = () => {
      if (reduced.matches) return;
      cancelAnimationFrame(raf);
      frame = 0;
      const step = () => {
        el.textContent = [...original].map((c, i) => {
          if (c === ' ' || i < frame / 2.2) return c;
          return GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }).join('');
        frame++;
        if (frame / 2.2 < original.length) raf = requestAnimationFrame(step);
        else el.textContent = original;
      };
      step();
    };
    el.addEventListener('mouseenter', run);
    el.addEventListener('focus', run);
  });

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const d = +(en.target.dataset.delay || 0);
      setTimeout(() => en.target.classList.add('in'), d);
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      countIO.unobserve(el);
      const to = parseFloat(el.dataset.to);
      const dec = +(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const fmt = (n) => n.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      if (reduced.matches) { el.textContent = fmt(to); return; }
      const dur = 1400, t0 = performance.now();
      const step = (now) => {
        const p = clamp((now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  $$('.counter').forEach((el) => countIO.observe(el));

  /* ---------- manifest word reveal ---------- */
  const manifest = $('#manifestText');
  let mWords = [];
  if (manifest) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part.trim()) { frag.appendChild(doc.createTextNode(part)); return; }
            const s = doc.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(manifest);
    mWords = $$('.w', manifest);
  }

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const navLinks = $$('.nav__links a');
  const burger = $('#burger');
  let lastY = scrollY;

  burger?.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    $$('.menu__links a').forEach((a, i) => a.style.transitionDelay = open ? `${120 + i * 55}ms` : '0ms');
  });
  $$('.menu__links a').forEach((a) => a.addEventListener('click', () => {
    body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  }));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) burger.click();
  });

  // active link highlighting
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = '#' + en.target.id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  ['manifest', 'leistungen', 'prozess', 'cases', 'faq'].forEach((id) => {
    const el = doc.getElementById(id);
    if (el) sectionIO.observe(el);
  });

  // logo easter egg: click spins the mark
  const logoMark = $('#logoMark');
  logoMark?.addEventListener('click', () => {
    logoMark.classList.remove('spin');
    void logoMark.offsetWidth;
    logoMark.classList.add('spin');
  });

  /* ---------- accordions (services + faq) ---------- */
  const toggleRow = (head, item) => {
    const open = item.classList.toggle('is-open');
    head.setAttribute('aria-expanded', String(open));
  };
  $$('.svc__head').forEach((head) => {
    const row = head.closest('.svc__row');
    head.addEventListener('click', () => toggleRow(head, row));
  });
  $$('.acc__head').forEach((head) => {
    const item = head.closest('.acc__item');
    head.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      $$('.acc__item').forEach((o) => {
        o.classList.remove('is-open');
        $('.acc__head', o).setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) toggleRow(head, item);
    });
  });

  /* ---------- case cards: pointer glow + tilt ---------- */
  if (finePointer.matches && !reduced.matches) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform =
          `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 7}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- crash-o-meter ---------- */
  const range = $('#meterRange');
  const mTitle = $('#meterTitle');
  const mDesc = $('#meterDesc');
  const mRead = $('#meterRead');
  const bars = $('#meterBars');
  const mPct = $('#meterPct');
  const LEVELS = [
    [20, 'Sanfte Delle', 'Wir streichen ein Meeting und nennen es einen Anfang. Ehrlich gesagt: dafür brauchen Sie uns nicht.'],
    [45, 'Strukturschubs', 'Zwei Gremien fallen weg, drei Rollen werden neu geschnitten. Spürbar, aber niemand verliert den Schlaf.'],
    [70, 'Kistenbruch', 'Freigabewege halbiert, Doppelrollen aufgelöst. Ab hier wird es in der Kantine besprochen.'],
    [90, 'Kontrollierte Kernschmelze', 'Wir ziehen die Struktur einmal komplett auseinander — mit Statik, aber ohne Rücksicht auf Gewohnheiten.'],
    [101, 'N. Sane Modus', 'Kein Kästchen im Org-Chart bleibt, wo es war. Ihr Umsatz schon — der bleibt und wächst.']
  ];
  if (bars) bars.innerHTML = Array.from({ length: 34 }, () => '<i></i>').join('');
  const barEls = bars ? $$('i', bars) : [];

  const renderMeter = (v, animate) => {
    const level = LEVELS.find(([max]) => v < max) || LEVELS[LEVELS.length - 1];
    if (mTitle.textContent !== level[1]) {
      mTitle.textContent = level[1];
      mDesc.textContent = level[2];
      if (animate && !reduced.matches) {
        mRead.classList.remove('flash');
        void mRead.offsetWidth;
        mRead.classList.add('flash');
      }
    }
    if (mPct) mPct.firstChild.nodeValue = String(v);
    const active = Math.round((v / 100) * barEls.length);
    barEls.forEach((b, i) => {
      b.classList.toggle('on', i < active);
      const wave = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.8 + v * 0.02));
      b.style.height = i < active ? `${clamp(10 + wave * v, 10, 100)}%` : '10%';
    });
  };
  if (range) {
    renderMeter(+range.value, false);
    range.addEventListener('input', () => renderMeter(+range.value, true));
  }

  /* ---------- form (demo only) ---------- */
  const form = $('#form');
  const note = $('#formNote');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = $$('input[required]', form).filter((i) => !i.value.trim());
    if (missing.length) {
      missing[0].focus();
      note.textContent = 'Bitte noch ausfüllen — wir raten ungern.';
      note.classList.remove('ok');
      return;
    }
    note.textContent = 'Angekommen. (Demo — es wird nichts gesendet.)';
    note.classList.add('ok');
    form.reset();
  });

  /* ---------- marquees ---------- */
  const marquees = [];
  const addMarquee = (track, speed) => {
    if (!track) return;
    marquees.push({ el: track, x: 0, speed, span: 0 });
  };
  addMarquee($('#ticker'), -70);

  const voicesTrack = $('.voices__track');
  if (voicesTrack) {
    [...voicesTrack.children].forEach((c) => voicesTrack.appendChild(c.cloneNode(true)));
    addMarquee(voicesTrack, -45);
    // quotes are meant to be read: hold the marquee while the pointer is on it
    const shell = voicesTrack.parentElement;
    const hold = (state) => { const m = marquees.find((x) => x.el === voicesTrack); if (m) m.paused = state; };
    shell.addEventListener('mouseenter', () => hold(true));
    shell.addEventListener('mouseleave', () => hold(false));
    shell.addEventListener('focusin', () => hold(true));
    shell.addEventListener('focusout', () => hold(false));
  }

  const measureMarquees = () => marquees.forEach((m) => {
    const kids = [...m.el.children];
    m.span = m.el === voicesTrack
      ? m.el.scrollWidth / 2
      : (kids[0] ? kids[0].getBoundingClientRect().width : 0);
  });

  /* ---------- horizontal process ---------- */
  const proc = $('.process');
  const procTrack = $('#procTrack');
  const procBar = $('#procBar');
  const phases = $$('.phase');
  let procX = 0, procTargetX = 0, procDistance = 0;

  const measureProcess = () => {
    if (!procTrack || reduced.matches) return;
    procDistance = Math.max(0, procTrack.scrollWidth - innerWidth + 24);
  };

  /* ---------- hero parallax ---------- */
  const heroFig = $('#heroFigure');
  const hero = $('.hero');
  const heroState = { x: 0, y: 0, tx: 0, ty: 0, scroll: 0 };
  if (finePointer.matches && !reduced.matches) {
    addEventListener('mousemove', (e) => {
      heroState.tx = (e.clientX / innerWidth - 0.5) * 34;
      heroState.ty = (e.clientY / innerHeight - 0.5) * 22;
    }, { passive: true });
  }

  /* ---------- scroll bookkeeping ---------- */
  const progressBar = $('#scrollBar');
  let scrollVel = 0, prevScroll = scrollY;

  const onScroll = () => {
    const y = scrollY;
    scrollVel = y - prevScroll;
    prevScroll = y;

    // progress bar
    const max = doc.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = `${clamp(max ? y / max : 0) * 100}%`;

    // nav auto-hide
    nav.classList.toggle('is-stuck', y > 40);
    if (!body.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;

    // hero parallax on scroll
    heroState.scroll = y;

    // manifest words
    if (mWords.length) {
      const r = manifest.getBoundingClientRect();
      const p = clamp((innerHeight * 0.82 - r.top) / (r.height + innerHeight * 0.32));
      const upto = Math.round(p * (mWords.length + 6));
      mWords.forEach((w, i) => w.classList.toggle('on', i < upto));
    }

    // horizontal process
    if (proc && procTrack && !reduced.matches) {
      const r = proc.getBoundingClientRect();
      const total = proc.offsetHeight - innerHeight;
      const p = clamp(-r.top / (total || 1));
      procTargetX = -procDistance * p;
      procBar.style.width = `${p * 100}%`;
      const mid = innerWidth / 2;
      let best = null, bestDist = Infinity;
      phases.forEach((ph) => {
        const pr = ph.getBoundingClientRect();
        const dist = Math.abs(pr.left + pr.width / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = ph; }
      });
      phases.forEach((ph) => ph.classList.toggle('is-active', ph === best));
    }
  };

  /* ---------- single rAF loop ---------- */
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(64, now - last) / 1000;
    last = now;

    // cursor
    if (cursor && body.classList.contains('has-cursor')) {
      ring.x = lerp(ring.x, mouse.x, 0.16);
      ring.y = lerp(ring.y, mouse.y, 0.16);
      cDot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      cRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
    }

    // marquees — base speed plus scroll velocity
    const boost = clamp(Math.abs(scrollVel) / 18, 0, 3.4);
    marquees.forEach((m) => {
      if (!m.span || m.paused) return;
      m.x += m.speed * (1 + boost) * dt;
      if (m.x <= -m.span) m.x += m.span;
      if (m.x > 0) m.x -= m.span;
      m.el.style.transform = `translate3d(${m.x}px,0,0)`;
    });
    scrollVel *= 0.9;

    // horizontal process
    if (procTrack && !reduced.matches) {
      procX = lerp(procX, procTargetX, 0.11);
      procTrack.style.transform = `translate3d(${procX.toFixed(2)}px,0,0)`;
    }

    // hero figure
    if (heroFig && hero) {
      heroState.x = lerp(heroState.x, heroState.tx, 0.07);
      heroState.y = lerp(heroState.y, heroState.ty, 0.07);
      const sy = reduced.matches ? 0 : heroState.scroll * 0.16;
      const rot = heroState.x * 0.08;
      heroFig.style.transform =
        `translate3d(${heroState.x}px, ${heroState.y - sy}px, 0) rotate(${rot.toFixed(2)}deg)`;
    }

    requestAnimationFrame(loop);
  };

  /* ---------- boot ---------- */
  const measureAll = () => { fitHero(); fitSingleLines(); measureMarquees(); measureProcess(); onScroll(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measureAll);
  addEventListener('load', measureAll);
  if (doc.fonts?.ready) doc.fonts.ready.then(measureAll);
  measureAll();
  requestAnimationFrame(loop);

  /* ---------- smooth anchors (respects reduced motion) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = doc.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });
})();
