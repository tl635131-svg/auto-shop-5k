/** Safe shared DOM/config helpers. No business values are duplicated here. */
export const all = (root, selector) => Array.from(root.querySelectorAll(selector));
export const one = (root, selector) => root.querySelector(selector);
export function get(config, path) {
  return String(path).split('.').reduce((value, key) =>
    ['__proto__', 'prototype', 'constructor'].includes(key) || !value ||
    !Object.hasOwn(value, key) ? undefined : value[key], config);
}
export function tokens(text, config) {
  return String(text).replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    const value = get(config, key);
    return ['string', 'number', 'boolean'].includes(typeof value) ? String(value) : '';
  });
}
export function calculatePackage(plan) {
  const baseline = 12 * plan.monthlyCents;
  const annual = Math.round(baseline * (100 - plan.discountPercent) / 100);
  return { baseline, annual, savings: baseline - annual, equivalent: Math.round(annual / 12) };
}
export function validateConfig(config) {
  const fail = () => { throw new Error('Invalid demo configuration'); };
  const scalar = value => typeof value === 'string' && value.length > 0;
  if (!config || !config.business || !config.site || !config.pricing || !config.demo || !config.booking) fail();
  const { business: b, site: s, pricing: p, booking: k } = config;
  if (!scalar(b.name) || !scalar(b.tagline) || b.isDemo !== true ||
      !/^tel:\+?[\d-]+$/.test(b.phone?.href) || !/^mailto:[^\s@]+@[^\s@]+$/.test(b.email?.href) ||
      !scalar(b.phone.display) || !scalar(b.email.display) || !scalar(b.address?.display) ||
      !(s.basePath === '/' || /^\/[\w/-]*\/$/.test(s.basePath)) || !/^https:\/\/[^/]+$/.test(s.publicOrigin) ||
      s.locale !== 'en-CA' || s.currency !== 'CAD' || !/^assets\/images\/[\w.-]+$/.test(s.defaultOgImage)) fail();
  new Intl.DateTimeFormat(s.locale, { timeZone: b.timezone }).format();
  // Validate weekday order against the calendar without duplicating configured hours text.
  const weekday = new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'UTC' });
  const days = Array.from({ length: 7 }, (_, i) => weekday.format(new Date(Date.UTC(2024, 0, i + 1))));
  if (!Array.isArray(b.hours) || b.hours.length !== 7) fail();
  b.hours.forEach((h, i) => {
    if (h.day !== days[i] || typeof h.closed !== 'boolean' || (h.closed ? h.opens !== null || h.closes !== null :
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes) || h.opens >= h.closes)) fail();
  });
  for (const id of ['instagram', 'facebook']) {
    const social = b.socials?.[id];
    if (!social || !scalar(social.label) || (social.url !== null && !safeHref(social.url, 'https:'))) fail();
  }
  const services = ['diagnostics', 'brakes', 'oil-maintenance', 'tires-alignment', 'ev-hybrid', 'engine-transmission', 'ac-climate', 'detailing'];
  for (const id of services) if (!Number.isSafeInteger(p.serviceStartingCents?.[id]) || p.serviceStartingCents[id] < 0) fail();
  for (const id of ['essential', 'plus', 'complete']) {
    const plan = p.packages?.[id];
    if (!plan || !scalar(plan.name) || !Number.isSafeInteger(plan.monthlyCents) || plan.monthlyCents < 0 || plan.discountPercent !== 10) fail();
    const result = calculatePackage(plan);
    if (!Number.isSafeInteger(result.baseline) || plan.annualCents !== result.annual || plan.savingsCents !== result.savings || plan.equivalentMonthlyCents !== result.equivalent) fail();
    for (const key of ['inspections', 'oilCredits', 'tireRotations', 'detailCredits']) {
      if (!Number.isSafeInteger(plan.features?.[key]) || plan.features[key] < 0) fail();
    }
    if (typeof plan.features.priorityBooking !== 'boolean') fail();
  }
  if (k.mode !== 'demo' || k.retention !== 'memory-only' || k.minLeadDays !== 1 || k.maxAdvanceDays !== 90 ||
      !scalar(k.timeWindows?.morning) || !scalar(k.timeWindows?.afternoon)) fail();
  for (const value of Object.values(config.demo.stats || {})) if (!Number.isFinite(value) || value < 0) fail();
  if (Object.keys(config.demo.stats || {}).length !== 3) fail();
  return config;
}
export function safeHref(value, protocol) {
  try { const url = new URL(value); return url.protocol === protocol && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
export function announce(root, message) {
  let status = one(root, '#site-status');
  if (!status) {
    status = root.ownerDocument?.createElement('p') || root.createElement('p');
    status.id = 'site-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    (root.body || root).append(status);
  }
  if (!status.textContent.includes(message)) status.textContent += `${status.textContent ? ' ' : ''}${message}`;
}
export function motionPreference(root) {
  const win = root.defaultView || root.ownerDocument.defaultView;
  return win.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: true, addEventListener() {} };
}
export function animate(element, frames, options, reduced = false) {
  if (reduced || !element.animate) return null;
  try { return element.animate(frames, options); } catch { return null; }
}
export function focusables(root) {
  return all(root, 'a[href], button, input, select, textarea, [tabindex]')
    .filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden], [inert]') && el.getClientRects().length);
}
export function trap(event, panel) {
  if (event.key !== 'Tab') return;
  const list = focusables(panel);
  if (!list.length) { event.preventDefault(); panel.focus(); return; }
  const active = panel.ownerDocument.activeElement;
  if (event.shiftKey && (active === list[0] || !list.includes(active))) { event.preventDefault(); list.at(-1).focus(); }
  else if (!event.shiftKey && (active === list.at(-1) || !list.includes(active))) { event.preventDefault(); list[0].focus(); }
}
export function init(root, config) {
  const doc = root.ownerDocument || root;
  for (const el of all(root, '[data-config-text]')) {
    const value = get(config, el.dataset.configText);
    if (['string', 'number', 'boolean'].includes(typeof value)) el.textContent = value;
  }
  for (const image of all(root, 'img[data-team-portrait]')) {
    const member = config.demo.team[image.dataset.teamPortrait];
    if (member) image.alt = `${member.name} in the demo workshop.`;
  }
  for (const el of all(root, '[data-config-meta]')) {
    const value = get(config, el.dataset.configMeta);
    if (['string', 'number', 'boolean'].includes(typeof value)) el.setAttribute('content', String(value));
  }
  for (const el of all(root, '[data-config-href]')) {
    const key = el.dataset.configHref;
    const protocol = key === 'business.phone.href' ? 'tel:' : key === 'business.email.href' ? 'mailto:' :
      /^business\.socials\.(instagram|facebook)\.url$/.test(key) ? 'https:' : null;
    const href = protocol && safeHref(get(config, key), protocol);
    if (href) { el.setAttribute('href', href); el.hidden = false; }
    else { el.removeAttribute('href'); el.hidden = true; }
  }
  for (const container of all(root, '[data-business-hours]')) {
    const dl = doc.createElement('dl');
    for (const hours of config.business.hours) {
      const dt = doc.createElement('dt'); dt.textContent = hours.day;
      const dd = doc.createElement('dd');
      if (hours.closed) dd.textContent = 'Closed';
      else for (const [i, time] of [hours.opens, hours.closes].entries()) {
        if (i) dd.append('–');
        const node = doc.createElement('time'); node.dateTime = time; node.textContent = time; dd.append(node);
      }
      dl.append(dt, dd);
    }
    container.replaceChildren(dl);
  }
  for (const container of all(root, '[data-business-socials]')) {
    const links = Object.values(config.business.socials).flatMap(social => {
      const href = social.url && safeHref(social.url, 'https:');
      if (!href) return [];
      const a = doc.createElement('a'); a.href = href; a.textContent = social.label; return [a];
    });
    container.replaceChildren(...links); container.hidden = !links.length;
  }
  for (const el of all(root, '[data-config-status]')) {
    el.dataset.configStatus = 'ready'; el.textContent = ''; (el.closest('section') || el).setAttribute('aria-busy', 'false');
  }
  const page = one(root, '[data-page]')?.dataset.page;
  const pages = { home: ['index.html', 'Home'], services: ['services.html', 'Services'], about: ['about.html', 'About'], pricing: ['pricing.html', 'Pricing'], gallery: ['gallery.html', 'Gallery'], booking: ['booking.html', 'Booking & Contact'], faq: ['faq.html', 'FAQ & Reviews'], 'not-found': ['404.html', 'Page not found'] };
  if (pages[page]) {
    const [file, title] = pages[page]; const base = config.site.publicOrigin + config.site.basePath;
    doc.title = `${title} | ${config.business.name}`;
    const set = (selector, attribute, value) => { const el = one(root, selector); if (el) el.setAttribute(attribute, value); };
    set('link[rel="canonical"]', 'href', new URL(file, base).href);
    set('meta[property="og:url"]', 'content', new URL(file, base).href);
    set('meta[property="og:title"]', 'content', doc.title);
    set('meta[property="og:image"]', 'content', new URL(config.site.defaultOgImage, base).href);
    set('meta[name="twitter:title"]', 'content', doc.title);
    set('meta[name="twitter:image"]', 'content', new URL(config.site.defaultOgImage, base).href);
    set('meta[property="og:locale"]', 'content', config.site.locale.replace('-', '_'));
  }
}

const scrollQueues = new WeakMap();
/** One passive scroll listener and one frame shared by navigation and hero effects. */
export function onScroll(win, callback) {
  let queue = scrollQueues.get(win);
  if (!queue) {
    queue = { callbacks: new Set(), frame: 0 };
    const run = () => { queue.frame = 0; for (const fn of queue.callbacks) fn(); };
    const schedule = () => { if (!queue.frame) queue.frame = win.requestAnimationFrame(run); };
    win.addEventListener('scroll', schedule, { passive: true }); win.addEventListener('resize', schedule);
    scrollQueues.set(win, queue);
  }
  queue.callbacks.add(callback); callback();
  return () => queue.callbacks.delete(callback);
}
