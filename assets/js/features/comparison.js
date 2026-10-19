import { all, one } from './bindings.js';

export function init(root) {
  for (const region of all(root, '[data-comparison]')) {
    const range = one(region, '[data-comparison-range]'), before = one(region, '[data-comparison-before]'), after = one(region, '[data-comparison-after]');
    if (!range || !before || !after) continue;
    const images = [before, after].flatMap(el => el.matches('img') ? [el] : all(el, 'img'));
    if (images.length < 2) continue;
    const doc = region.ownerDocument, win = doc.defaultView;
    let ready = false, clip;
    const original = new Map([region, after, range, ...images].map(el => [el, el.getAttribute('style')]));
    const fallback = () => {
      range.hidden = true; region.dataset.state = 'fallback';
      if (clip) { clip.before(after); clip.remove(); clip = null; }
      for (const [el, style] of original) style === null ? el.removeAttribute('style') : el.setAttribute('style', style);
      ready = false;
    };
    const update = () => {
      if (!ready) return;
      const value = Math.max(0, Math.min(100, Number(range.value) || 0));
      clip.style.transform = `translateX(${value - 100}%)`;
      after.style.transform = `translateX(${100 - value}%)`;
      range.setAttribute('aria-valuetext', `${value}% after image revealed`);
    };
    const geometry = () => {
      if (!clip) return;
      const base = region.getBoundingClientRect(), frame = before.getBoundingClientRect();
      Object.assign(clip.style, { left: `${frame.left - base.left}px`, top: `${frame.top - base.top}px`, width: `${frame.width}px`, height: `${frame.height}px` });
    };
    const enhance = () => {
      if (ready || images.some(img => !img.complete || !img.naturalWidth)) return;
      clip = doc.createElement('div');
      after.before(clip); clip.append(after);
      region.style.position = 'relative';
      Object.assign(clip.style, { position: 'absolute', overflow: 'hidden', pointerEvents: 'none' });
      Object.assign(after.style, { width: '100%', height: '100%', display: 'block', objectFit: 'cover' });
      for (const img of all(after, 'img')) Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' });
      range.min = '0'; range.max = '100'; range.step = '1'; range.value = '50';
      ready = true; region.dataset.state = 'ready'; geometry(); update(); range.hidden = false;
      // The native range remains above the translated image layer.
      range.style.position = 'relative'; range.style.zIndex = '1';
    };
    range.hidden = true;
    range.addEventListener('input', update);
    win.addEventListener('resize', geometry);
    if (win.ResizeObserver) new win.ResizeObserver(geometry).observe(before);
    for (const image of images) { image.addEventListener('load', enhance); image.addEventListener('error', fallback); }
    enhance();
  }
}
