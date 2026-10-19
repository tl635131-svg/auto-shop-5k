import { all, one, motionPreference, animate } from './bindings.js';

export function init(root) {
  if (!one(root, '[data-faq]')) return;
  const reduced = motionPreference(root), doc = root.ownerDocument || root;
  const animations = new Set();
  const stop = () => { for (const animation of animations) animation.cancel(); animations.clear(); };
  reduced.addEventListener('change', stop);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) stop(); });
  for (const item of all(root, '[data-faq] [data-faq-item]')) {
    if (item.tagName !== 'DETAILS') continue;
    item.addEventListener('toggle', () => {
      item.dataset.state = item.open ? 'open' : 'closed';
      if (!item.open || reduced.matches || doc.hidden) return;
      for (const child of item.children) {
        if (child.tagName === 'SUMMARY') continue;
        const animation = animate(child, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
        if (animation) { animations.add(animation); animation.finished.then(() => animations.delete(animation), () => animations.delete(animation)); }
      }
    });
  }
}
