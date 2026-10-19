import { all, one, motionPreference, animate, trap, focusables, onScroll } from './bindings.js';

export function init(root, config) {
  if (!one(root, '[data-header], [data-menu], [data-scroll-progress], [data-page-transition]')) return;
  const doc = root.ownerDocument || root, win = doc.defaultView, reduced = motionPreference(root);
  const header = one(root, '[data-header]'), progress = one(root, '[data-scroll-progress]');
  const wrapper = one(root, '[data-page-transition]');
  let fade;
  const visible = () => { fade?.cancel(); if (wrapper) wrapper.style.opacity = '1'; };
  win.addEventListener('pageshow', visible);
  reduced.addEventListener('change', visible);
  if (wrapper) {
    fade = animate(wrapper, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }, reduced.matches);
    root.addEventListener('click', event => {
      const link = event.target.closest?.('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          link.hasAttribute('download') || link.hasAttribute('target') || reduced.matches) return;
      const url = new URL(link.href, doc.baseURI), current = new URL(win.location.href);
      if (url.origin !== current.origin || !url.pathname.startsWith(current.pathname.startsWith(config.site.basePath) ? config.site.basePath : new URL('../../../', import.meta.url).pathname) ||
          !/\.html$/.test(url.pathname) || url.hash || url.href === current.href) return;
      fade = animate(wrapper, [{ opacity: 1 }, { opacity: 0 }], { duration: 110 });
      if (!fade) return;
      event.preventDefault();
      let navigated = false;
      const go = () => { if (!navigated) { navigated = true; win.location.assign(url.href); } };
      fade.finished.then(go, go); win.setTimeout(go, 120);
    });
  }
  const updateShell = () => {
    if (header) header.dataset.state = win.scrollY > 24 ? 'scrolled' : 'top';
    if (progress) {
      progress.setAttribute('aria-hidden', 'true'); progress.style.transformOrigin = 'left';
      const max = doc.documentElement.scrollHeight - win.innerHeight;
      progress.style.transform = `scaleX(${reduced.matches || max <= 0 ? 0 : Math.min(1, Math.max(0, win.scrollY / max))})`;
    }
  };
  onScroll(win, updateShell);
  reduced.addEventListener('change', updateShell);
  for (const link of all(root, '#site-nav a[href]')) {
    if (new URL(link.href, doc.baseURI).pathname === win.location.pathname) link.setAttribute('aria-current', 'page');
  }
  const menu = one(root, '[data-menu]'), toggle = one(root, '[data-menu-toggle]');
  if (!menu || !toggle) return;
  const mobile = win.matchMedia('(max-width: 959px)');
  let opened = false, opener, animation, generation = 0, locked = [], overflow;
  const lock = () => {
    let node = menu;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && !['SCRIPT', 'STYLE', 'LINK'].includes(sibling.tagName)) {
          locked.push([sibling, sibling.inert]); sibling.inert = true;
        }
      }
      node = node.parentElement;
      if (node === doc.body) break;
    }
    overflow = doc.body.style.overflow; doc.body.style.overflow = 'hidden';
  };
  const unlock = () => { for (const [el, inert] of locked) el.inert = inert; locked = []; if (overflow !== undefined) doc.body.style.overflow = overflow; overflow = undefined; };
  const close = (restore = true, immediate = false) => {
    if (!opened) { menu.hidden = mobile.matches; return; }
    opened = false; const token = ++generation; animation?.cancel();
    toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation');
    menu.dataset.state = 'closed'; unlock(); menu.removeAttribute('aria-modal'); menu.removeAttribute('role');
    if (restore && opener?.isConnected) opener.focus();
    const finish = () => { if (token === generation) menu.hidden = mobile.matches; };
    animation = immediate ? null : animate(menu, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-12px)', opacity: 0 }], { duration: 180 }, reduced.matches);
    if (animation) { animation.finished.then(finish, finish); win.setTimeout(finish, 200); } else finish();
  };
  const open = () => {
    if (!mobile.matches || opened) return;
    ++generation; animation?.cancel(); opener = doc.activeElement; opened = true; menu.hidden = false;
    menu.dataset.state = 'open'; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-modal', 'true');
    if (!menu.hasAttribute('aria-label') && !menu.hasAttribute('aria-labelledby')) menu.setAttribute('aria-label', 'Navigation');
    menu.tabIndex = -1;
    toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Close navigation');
    lock(); (focusables(menu)[0] || menu).focus();
    animation = animate(menu, [{ transform: 'translateY(-12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 180 }, reduced.matches);
  };
  toggle.addEventListener('click', () => opened ? close() : open());
  menu.addEventListener('click', event => {
    if (event.target === menu || event.target.closest('[data-menu-close]')) close();
    else if (event.target.closest('a[href]')) close(false, true);
  });
  doc.addEventListener('keydown', event => {
    if (!opened) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); } else trap(event, menu);
  });
  const resize = () => { close(false, true); menu.hidden = mobile.matches; toggle.hidden = !mobile.matches; };
  mobile.addEventListener('change', resize);
  reduced.addEventListener('change', () => { animation?.cancel(); if (!opened) menu.hidden = mobile.matches; });
  win.addEventListener('pagehide', () => close(false, true));
  if (!menu.id) menu.id = 'site-menu'; toggle.setAttribute('aria-controls', menu.id);
  toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); resize();
}
