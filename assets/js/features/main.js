import { validateConfig, announce, all } from './bindings.js';

export async function bootstrap(root = document) {
  let config;
  try { config = validateConfig((await import('../config.js')).config); }
  catch {
    const message = 'Demo business details are unavailable. Reload to try again.';
    for (const el of all(root, '[data-config-status]')) {
      el.dataset.configStatus = 'error'; el.textContent = message;
      (el.closest('section') || el).setAttribute('aria-busy', 'false');
    }
    // Do not enable form or pricing when configuration is unavailable.
    announce(root, message); return;
  }
  try { (await import('./bindings.js')).init(root, config); }
  catch { announce(root, 'The business detail enhancement is unavailable. Reload to try again.'); }
  const modules = ['navigation', 'motion', 'testimonials', 'comparison', 'pricing', 'gallery', 'faq', 'booking'];
  await Promise.all(modules.map(async name => {
    try { (await import(`./${name}.js`)).init(root, config); }
    catch { announce(root, `The ${name} enhancement is unavailable. Reload to try again.`); }
  }));
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
  else bootstrap();
}
