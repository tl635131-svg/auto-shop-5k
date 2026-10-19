import { all, one, animate, motionPreference } from './bindings.js';

export function init(root) {
  for (const region of all(root, '[data-testimonials]')) {
    const slides = all(region, '[data-testimonial-slide]'), prev = one(region, '[data-testimonial-prev]'), next = one(region, '[data-testimonial-next]');
    if (!slides.length || !prev || !next) continue;
    const doc = region.ownerDocument, win = doc.defaultView, reduced = motionPreference(root);
    let index = 0, generation = 0, animations = [], start;
    const settle = () => {
      ++generation; for (const animation of animations) animation?.cancel(); animations = [];
      slides.forEach((slide, i) => { slide.hidden = i !== index; slide.inert = i !== index; });
    };
    region.setAttribute('aria-roledescription', 'carousel');
    slides.forEach((slide, i) => {
      // Preserve native figure/figcaption semantics; figure cannot be overridden as group.
      slide.setAttribute('aria-roledescription', 'slide'); slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    });
    // Reserve the largest slide without animating layout or depending on CSS classes.
    const measure = () => {
      const visibility = region.style.visibility; region.style.visibility = 'hidden';
      slides.forEach(slide => { slide.hidden = false; slide.style.minHeight = ''; });
      const height = Math.max(...slides.map(slide => slide.getBoundingClientRect().height));
      slides.forEach(slide => { slide.style.minHeight = `${height}px`; });
      settle(); region.style.visibility = visibility;
    };
    const show = value => {
      const outgoing = slides[index]; settle(); index = (value + slides.length) % slides.length;
      const token = ++generation, incoming = slides[index];
      if (outgoing.contains(doc.activeElement)) next.focus();
      outgoing.inert = outgoing !== incoming;
      const out = outgoing === incoming ? null : animate(outgoing, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 }, reduced.matches);
      let finished = false;
      const finish = () => {
        if (token !== generation || finished) return;
        finished = true;
        slides.forEach((slide, i) => { slide.hidden = i !== index; slide.inert = i !== index; });
        animations = [animate(incoming, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 }, reduced.matches)];
      };
      animations = [out];
      if (out) { out.finished.then(finish, finish); win.setTimeout(finish, 140); } else finish();
      const status = one(region, '[data-testimonial-status]');
      if (status) { status.setAttribute('role', 'status'); status.textContent = `Review ${index + 1} of ${slides.length}`; }
    };
    prev.addEventListener('click', () => show(index - 1)); next.addEventListener('click', () => show(index + 1));
    region.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') start = { x: event.clientX, y: event.clientY }; });
    region.addEventListener('pointerup', event => {
      if (!start) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y; start = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && !event.target.closest('a, button, input')) show(index + (dx < 0 ? 1 : -1));
    });
    region.addEventListener('pointercancel', () => { start = null; });
    reduced.addEventListener('change', settle);
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) settle(); });
    if (win.IntersectionObserver) new win.IntersectionObserver(entries => { if (!entries[0].isIntersecting) settle(); }).observe(region);
    win.addEventListener('resize', measure);
    doc.fonts?.ready.then(measure);
    prev.hidden = next.hidden = slides.length < 2; measure();
  }
}
