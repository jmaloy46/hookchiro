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

  /* ---- active section tracking (spine glow) ---- */
  const byVisibility = new Map();
  const secObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => byVisibility.set(e.target, e.intersectionRatio));
    let best = null, bestRatio = 0;
    byVisibility.forEach((ratio, target) => {
      if (ratio > bestRatio) { bestRatio = ratio; best = target; }
    });
    if (best) {
      const idx = sections.indexOf(best);
      vertButtons.forEach((b, i) => b.classList.toggle('active', i === idx));
    }
  }, { threshold: [0.1, 0.25, 0.5, 0.75] });
  sections.forEach((s) => secObserver.observe(s));

  /* ---- draw the animated hero spine ---- */
  const column = document.getElementById('spineColumn');
  if (column) {
    const N = 11;            // vertebrae count
    const top = 24, gap = 44;
    const svgns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < N; i++) {
      const cy = top + i * gap;
      // widen toward the bottom (lumbar) for an anatomical taper
      const w = 26 + i * 2.6;
      const x = 60 - w / 2;
      const rect = document.createElementNS(svgns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', cy);
      rect.setAttribute('width', w);
      rect.setAttribute('height', 26);
      rect.setAttribute('rx', 10);
      rect.setAttribute('class', 'vertebra-art');
      rect.style.animationDelay = `${reduceMotion ? 0 : i * 0.08}s`;
      column.appendChild(rect);

      if (i < N - 1) {
        const disc = document.createElementNS(svgns, 'ellipse');
        disc.setAttribute('cx', 60);
        disc.setAttribute('cy', cy + 35);
        disc.setAttribute('rx', (w + (w + 2.6)) / 4.2);
        disc.setAttribute('ry', 5);
        disc.setAttribute('class', 'disc-art');
        disc.style.animationDelay = `${reduceMotion ? 0 : i * 0.08 + 0.04}s`;
        column.appendChild(disc);
      }
    }
    // gentle parallax sway on scroll
    if (!reduceMotion) {
      const svg = column.closest('.spine-svg');
      window.addEventListener('scroll', () => {
        const sway = Math.sin(window.scrollY / 220) * 6;
        if (svg) svg.style.transform = `rotate(${sway * 0.15}deg)`;
      }, { passive: true });
    }
  }

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

  /* ---- sticky header shadow ---- */
  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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
