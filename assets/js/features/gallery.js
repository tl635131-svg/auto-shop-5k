import { all, one, focusables, trap } from './bindings.js';

export function init(root) {
  for (const region of all(root, '[data-gallery]')) {
    const items = all(region, '[data-gallery-item]'), filters = all(region, '[data-gallery-filter]');
    if (!items.length) continue;
    const doc = region.ownerDocument, win = doc.defaultView;
    const dialog = one(root, '[data-lightbox]'), close = dialog && one(dialog, '[data-lightbox-close]');
    let image = dialog && one(dialog, '[data-lightbox-image]');
    const supported = dialog && typeof dialog.showModal === 'function' && typeof dialog.close === 'function' && image?.tagName === 'IMG' && close;
    let visible = items.slice(), index = 0, opener, selected = filters[0], generation = 0;
    const opened = () => supported && dialog.open;
    const anchor = item => one(item, '[data-gallery-open]');
    const source = item => {
      const a = anchor(item);
      if (!a) return null;
      try { const url = new URL(a.href, doc.baseURI); return ['http:', 'https:'].includes(url.protocol) && url.origin === win.location.origin ? url.href : null; }
      catch { return null; }
    };
    const caption = item => one(item, 'figcaption')?.textContent.trim() || one(item, 'img')?.alt || anchor(item)?.textContent.trim() || 'Gallery image';
    const setStatus = message => { const status = one(dialog, '[data-lightbox-status]'); if (status) { status.setAttribute('role', 'status'); status.textContent = message; } };
    const render = () => {
      if (!opened() || !visible.length) return;
      const token = ++generation, item = visible[index], src = source(item), text = caption(item);
      const fresh = image.cloneNode(false); fresh.removeAttribute('src'); fresh.removeAttribute('srcset');
      fresh.alt = one(item, 'img')?.alt || text;
      Object.assign(fresh.style, { aspectRatio: '3 / 2', width: '100%', objectFit: 'contain' });
      image.replaceWith(fresh); image = fresh;
      dialog.setAttribute('aria-busy', 'true'); setStatus('Loading image…');
      const title = one(dialog, '[data-lightbox-caption]'); if (title) title.textContent = text;
      const finish = failed => {
        if (token !== generation || !opened()) return;
        dialog.setAttribute('aria-busy', 'false');
        setStatus(failed ? 'This image could not be loaded. You can still browse the captions.' : `Image ${index + 1} of ${visible.length}`);
      };
      image.onload = () => finish(false); image.onerror = () => finish(true);
      if (src) image.src = src; else finish(true);
      // Prefetch only adjacent images, and only after a deliberate viewer open.
      if (src && visible.length > 1) for (const offset of [-1, 1]) {
        const url = source(visible[(index + offset + visible.length) % visible.length]);
        if (url) { const adjacent = new win.Image(); adjacent.decoding = 'async'; adjacent.src = url; }
      }
    };
    const move = delta => { if (!opened() || !visible.length) return; index = (index + delta + visible.length) % visible.length; render(); };
    const filter = button => {
      const category = button.dataset.galleryFilter;
      if (!['all', 'workshop', 'ev-hybrid', 'detailing'].includes(category)) return;
      selected = button;
      visible = items.filter(item => category === 'all' || item.dataset.galleryCategory === category);
      if (items.some(item => !visible.includes(item) && item.contains(doc.activeElement))) button.focus();
      items.forEach(item => { item.hidden = !visible.includes(item); });
      filters.forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      const status = one(region, '[data-gallery-count]');
      if (status) { status.setAttribute('role', 'status'); status.textContent = visible.length ? `${visible.length} images shown` : 'No images match this filter.'; }
      if (opened()) { if (!visible.length) dialog.close(); else { index = 0; render(); } }
    };
    filters.forEach(button => { button.addEventListener('click', () => filter(button)); button.hidden = false; });
    if (filters.length) filter(filters.find(el => el.dataset.galleryFilter === 'all') || filters[0]);
    if (!supported) continue; // Anchors still open ordinary image URLs.
    for (const item of items) {
      const link = anchor(item); if (!link) continue;
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !source(item)) return;
        index = visible.indexOf(item); if (index < 0) return;
        opener = link;
        dialog.hidden = false;
        try { dialog.showModal(); } catch { return; }
        event.preventDefault(); render(); close.focus();
      });
    }
    close.addEventListener('click', () => dialog.close());
    one(dialog, '[data-lightbox-prev]')?.addEventListener('click', () => move(-1));
    one(dialog, '[data-lightbox-next]')?.addEventListener('click', () => move(1));
    for (const control of all(dialog, '[data-lightbox-close], [data-lightbox-prev], [data-lightbox-next]')) control.hidden = false;
    dialog.addEventListener('keydown', event => {
      trap(event, dialog);
      if (event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      ++generation; dialog.setAttribute('aria-busy', 'false');
      const target = opener?.isConnected && !opener.closest('[hidden], [inert]') ? opener : selected;
      target?.focus();
    });
    win.addEventListener('pagehide', () => { if (opened()) dialog.close(); });
    // Native modal containment handles touch, background inertness and Escape.
    if (!focusables(dialog).length) dialog.tabIndex = -1;
  }
}
