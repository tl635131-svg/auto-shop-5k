import { all, one, get, motionPreference, animate, onScroll } from './bindings.js';

export function init(root, config) {
  if (!one(root, '[data-reveal], [data-hero-motion], [data-count-key], [data-tilt], [data-image-zoom], [data-magnetic], [data-cert-marquee]')) return;
  const doc = root.ownerDocument || root, win = doc.defaultView, reduced = motionPreference(root);
  const fine = win.matchMedia('(hover: hover) and (pointer: fine)');
  const effects = [], cleanup = new Set();
  const observer = typeof win.IntersectionObserver === 'function' ? new win.IntersectionObserver(entries => {
    for (const entry of entries) for (const effect of effects) if (effect.el === entry.target) {
      effect.visible = entry.isIntersecting; effect.update();
    }
  }, { threshold: 0.15 }) : null;
  const watch = effect => { effects.push(effect); effect.visible = !observer; observer?.observe(effect.el); effect.update(); };
  const allowed = effect => effect.visible && !doc.hidden && !reduced.matches;
  const refresh = () => { if (reduced.matches) for (const fn of cleanup) fn(); for (const effect of effects) effect.update(); };
  reduced.addEventListener('change', refresh); doc.addEventListener('visibilitychange', refresh);
  for (const el of all(root, '[data-reveal]')) {
    if (!observer || reduced.matches || !el.animate) continue;
    let animation, started = false;
    const parent = el.closest('[data-stagger]');
    const delay = parent ? Math.min(350, all(parent, '[data-reveal]').indexOf(el) * 70) : 0;
    const reset = () => { animation?.cancel(); el.style.opacity = ''; el.style.transform = ''; started = true; };
    cleanup.add(reset);
    el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
    watch({ el, update() {
      if (reduced.matches) { reset(); return; }
      if (!started && allowed(this)) {
        started = true;
        animation = animate(el, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, delay, easing: 'ease-out', fill: 'both' });
        el.style.opacity = ''; el.style.transform = '';
        if (animation) animation.finished.then(() => animation.cancel(), () => {});
      } else if (animation && animation.playState !== 'finished') allowed(this) ? animation.play() : animation.pause();
    } });
  }
  for (const el of all(root, '[data-count-key]')) {
    const value = get(config, el.dataset.countKey);
    if (!Number.isFinite(value) || value < 0) continue;
    el.textContent = String(value);
    const accessible = doc.createElement('span'), visual = doc.createElement('span');
    accessible.textContent = String(value); visual.setAttribute('aria-hidden', 'true'); visual.hidden = true;
    el.replaceChildren(accessible, visual);
    let frame = 0, elapsed = 0, previous = null, done = false;
    const stop = () => { win.cancelAnimationFrame(frame); frame = 0; previous = null; };
    const reset = () => { stop(); done = true; accessible.removeAttribute('style'); visual.hidden = true; };
    cleanup.add(reset);
    const effect = { el, update() {
      if (reduced.matches) { reset(); return; }
      if (!allowed(this) || done) { stop(); return; }
      Object.assign(accessible.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' });
      visual.hidden = false;
      const tick = now => {
        if (!allowed(effect)) { stop(); return; }
        if (previous !== null) elapsed += now - previous;
        previous = now; visual.textContent = String(Math.round(value * Math.min(1, elapsed / 900)));
        if (elapsed < 900) frame = win.requestAnimationFrame(tick); else reset();
      };
      if (!frame) frame = win.requestAnimationFrame(tick);
    } };
    watch(effect);
  }
  for (const el of all(root, '[data-hero-motion]')) {
    const image = el.matches('img') ? el : one(el, 'img');
    if (!image) continue;
    const frame = doc.createElement('span'); frame.style.display = 'block';
    image.before(frame); frame.append(image); // Independent parallax and Ken Burns transform layers.
    let animation;
    const effect = { el: frame, update() {
      if (reduced.matches) { animation?.cancel(); animation = null; frame.style.transform = ''; image.style.transform = ''; return; }
      if (!animation) animation = animate(image, [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }], { duration: 12000, easing: 'linear', fill: 'forwards' });
      if (animation) allowed(this) ? animation.play() : animation.pause();
      if (allowed(this)) {
        const rect = frame.getBoundingClientRect();
        const offset = Math.max(-24, Math.min(24, (win.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.04));
        frame.style.transform = `translateY(${offset}px)`;
      }
    } };
    watch(effect); onScroll(win, () => { if (effect.visible) effect.update(); });
  }
  for (const el of all(root, '[data-tilt], [data-magnetic], [data-image-zoom]')) {
    const zoom = el.hasAttribute('data-image-zoom'), magnetic = el.hasAttribute('data-magnetic');
    const target = zoom ? one(el, 'img') : el;
    if (!target) continue;
    if (zoom) el.style.overflow = 'hidden';
    let rect, frame = 0, animation, pending, focused = false, hovered = false;
    const reset = () => { win.cancelAnimationFrame(frame); frame = 0; animation?.cancel(); target.style.transform = ''; };
    cleanup.add(reset);
    const apply = transform => {
      animation?.cancel(); animation = animate(target, [{ transform: target.style.transform || 'none' }, { transform }], { duration: zoom ? 240 : 180, fill: 'forwards', easing: 'ease-out' }, reduced.matches);
      target.style.transform = transform;
    };
    const enabled = () => !reduced.matches && fine.matches && !doc.hidden;
    const leave = () => { hovered = false; if (zoom && focused && enabled()) return; reset(); };
    el.addEventListener('pointerenter', () => { if (!enabled()) return; hovered = true; rect = el.getBoundingClientRect(); if (zoom) apply('scale(1.035)'); else if (!magnetic) apply('translateY(-6px) rotateX(0deg) rotateY(0deg)'); });
    el.addEventListener('pointermove', event => {
      if (!enabled() || zoom || !hovered || !rect) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      pending = magnetic ? `translate(${x * 6}px, ${y * 6}px)` : `translateY(-6px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
      if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; if (enabled() && hovered) apply(pending); });
    }, { passive: true });
    el.addEventListener('pointerleave', leave); el.addEventListener('pointercancel', leave);
    el.addEventListener('focusin', () => { focused = true; if (zoom && enabled()) apply('scale(1.035)'); });
    el.addEventListener('focusout', event => { if (!el.contains(event.relatedTarget)) { focused = false; if (!hovered) reset(); } });
    win.addEventListener('resize', () => { rect = null; reset(); });
    onScroll(win, () => { if (hovered) rect = el.getBoundingClientRect(); });
    fine.addEventListener('change', reset);
    watch({ el, update() { if (!allowed(this)) reset(); } });
  }
  for (const el of all(root, '[data-cert-marquee]')) {
    const list = one(el, 'ul, ol'), button = one(el, '[data-marquee-pause]');
    if (!list || !button || !list.animate) continue;
    const strip = doc.createElement('div'); strip.setAttribute('aria-hidden', 'true'); strip.inert = true;
    Object.assign(strip.style, { display: 'flex', width: 'max-content' });
    for (let i = 0; i < 2; i++) {
      const clone = list.cloneNode(true);
      clone.removeAttribute('id');
      for (const node of all(clone, '[id]')) node.removeAttribute('id');
      strip.append(clone);
    }
    const viewport = doc.createElement('div'); viewport.style.overflow = 'hidden'; viewport.append(strip); list.after(viewport);
    let animation, paused = false, hovered = false, focused = false;
    const originalStyle = list.getAttribute('style');
    const effect = { el, update() {
      if (reduced.matches) {
        animation?.cancel(); animation = null; viewport.hidden = true; button.hidden = true;
        if (originalStyle === null) list.removeAttribute('style'); else list.setAttribute('style', originalStyle);
        return;
      }
      if (!animation) animation = animate(strip, [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 24000, iterations: Infinity, easing: 'linear' });
      if (!animation) { viewport.hidden = true; button.hidden = true; return; }
      Object.assign(list.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' });
      viewport.hidden = false; button.hidden = false;
      button.textContent = paused ? 'Resume practice-theme animation' : 'Pause practice-theme animation';
      button.setAttribute('aria-pressed', String(paused));
      allowed(this) && !paused && !hovered && !focused ? animation.play() : animation.pause();
    } };
    button.addEventListener('click', () => { paused = !paused; effect.update(); });
    el.addEventListener('pointerenter', () => { hovered = true; effect.update(); });
    el.addEventListener('pointerleave', () => { hovered = false; effect.update(); });
    el.addEventListener('focusin', () => { focused = true; effect.update(); });
    el.addEventListener('focusout', event => { focused = el.contains(event.relatedTarget); effect.update(); });
    watch(effect);
  }
}
