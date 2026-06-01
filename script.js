/* ========================================================================
   Hookstadt Chiropractic — interactions
   - Builds the left "spine" navigation (one vertebra per <section data-vertebra>)
   - Draws the animated hero spine SVG
   - Active-section tracking, reveal-on-scroll, sticky header, mobile menu
   ======================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- build spine nav from sections ---- */
  const sections = Array.from(document.querySelectorAll('section[data-vertebra]'));
  const spineList = document.getElementById('spineList');
  const vertButtons = [];

  sections.forEach((sec) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'vert';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Go to ${sec.dataset.vertebra}`);
    btn.innerHTML = `<span class="vert__bone"></span><span class="vert__label">${sec.dataset.vertebra}</span>`;
    btn.addEventListener('click', () => {
      sec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    li.appendChild(btn);
    spineList.appendChild(li);
    vertButtons.push(btn);
  });

  /* ---- active section tracking (spine glow) ----
     Direct scroll-position check: the active section is the last one whose
     top has passed a line ~40% down the viewport. More reactive than ratio-
     based observation across sections of very different heights. */
  let activeIdx = -1;
  const updateActive = () => {
    const line = window.scrollY + window.innerHeight * 0.4;
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= line) idx = i;
    }
    // near the very bottom, force-select the final section
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      idx = sections.length - 1;
    }
    if (idx !== activeIdx) {
      activeIdx = idx;
      vertButtons.forEach((b, i) => b.classList.toggle('active', i === idx));
    }
  };

  /* ---- draw the animated, anatomical hero spine ---- */
  const column = document.getElementById('spineColumn');
  const heroVertebrae = [];
  if (column) {
    const svgns = 'http://www.w3.org/2000/svg';
    const N = 12;                 // vertebrae count
    const top = 30, gap = 40, cx = 60;

    const make = (tag, attrs) => {
      const el = document.createElementNS(svgns, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const cy = top + i * gap;
      const bw = 24 + t * 22;     // body widens toward lumbar (bottom)
      const bh = 20 + t * 6;

      const vert = make('g', { class: 'vertebra-art' });
      vert.style.animationDelay = `${reduceMotion ? 0 : i * 0.07}s`;

      // transverse processes (the side "wings")
      const wing = 14 + t * 8;
      vert.appendChild(make('path', {
        d: `M ${cx - bw / 2} ${cy} q ${-wing} ${-4}, ${-wing - 4} ${4}`,
        class: 'vert-process'
      }));
      vert.appendChild(make('path', {
        d: `M ${cx + bw / 2} ${cy} q ${wing} ${-4}, ${wing + 4} ${4}`,
        class: 'vert-process'
      }));
      // vertebral body
      vert.appendChild(make('rect', {
        x: cx - bw / 2, y: cy - bh / 2, width: bw, height: bh, rx: 8,
        class: 'vert-body'
      }));

      column.appendChild(vert);
      heroVertebrae.push(vert);

      // intervertebral disc
      if (i < N - 1) {
        const disc = make('ellipse', {
          cx, cy: cy + gap / 2, rx: bw / 2 - 1, ry: 4, class: 'disc-art'
        });
        disc.style.animationDelay = `${reduceMotion ? 0 : i * 0.07 + 0.03}s`;
        column.appendChild(disc);
      }
    }

    if (reduceMotion) heroVertebrae.forEach((v) => v.classList.add('lit'));
  }

  // Interactive: hero vertebrae illuminate in sequence as you scroll the page.
  const heroSvg = column ? column.closest('.spine-svg') : null;
  const updateHeroSpine = () => {
    if (!heroVertebrae.length || reduceMotion) return;
    const h = document.documentElement;
    const prog = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    const lit = Math.round(prog * heroVertebrae.length);
    heroVertebrae.forEach((v, i) => v.classList.toggle('lit', i < lit));
    const sway = Math.sin(window.scrollY / 240) * 6;
    if (heroSvg) heroSvg.style.transform = `rotate(${sway * 0.12}deg)`;
  };

  /* ---- reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const revObserver = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = `${(e.target.dataset.delay || (i % 4) * 0.06)}s`;
          e.target.classList.add('in');
          revObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revObserver.observe(el));
  }

  /* ---- single rAF-throttled scroll loop drives everything ---- */
  const topbar = document.querySelector('.topbar');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      topbar.classList.toggle('scrolled', window.scrollY > 24);
      updateActive();
      updateHeroSpine();
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* ---- mobile menu ---- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const toggleMenu = (open) => {
    hamburger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  hamburger.addEventListener('click', () => toggleMenu(!mobileMenu.classList.contains('open')));
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
});
