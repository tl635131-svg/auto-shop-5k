import { all, one, calculatePackage } from './bindings.js';
export { calculatePackage } from './bindings.js';
export function init(root, config) {
  if (!one(root, '[data-pricing], [data-price-service]')) return;
  const money = cents => new Intl.NumberFormat(config.site.locale, { style: 'currency', currency: config.site.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
  for (const el of all(root, '[data-price-service]')) {
    const cents = config.pricing.serviceStartingCents[el.dataset.priceService];
    if (Number.isSafeInteger(cents)) el.textContent = `From ${money(cents)} CAD, before tax`;
  }
  for (const region of all(root, '[data-pricing]')) {
    const fieldset = one(region, '[data-billing-toggle]');
    if (!fieldset) continue;
    const update = (announce = true) => {
      const yearly = one(fieldset, 'input[name="billing"]:checked')?.value === 'yearly';
      const unit = yearly ? 'per year, billed annually' : 'per month, billed monthly';
      const changes = [];
      const set = (scope, selector, value) => { for (const el of all(scope, selector)) changes.push([el, value]); };
      for (const card of all(region, '[data-package-id]')) {
        const plan = config.pricing.packages[card.dataset.packageId]; if (!plan) continue;
        const result = calculatePackage(plan);
        set(card, '[data-package-price]', `${money(yearly ? result.annual : plan.monthlyCents)} CAD`);
        set(card, '[data-package-unit]', unit);
        set(card, '[data-package-equivalent]', yearly ? `Equivalent to ${money(result.equivalent)} CAD per month` : '');
        set(card, '[data-package-savings]', yearly ? `Save ${money(result.savings)} CAD per year (${plan.discountPercent}%) versus 12 monthly payments` : '');
      }
      for (const cell of all(region, '[data-price-cell]')) {
        const plan = config.pricing.packages[cell.dataset.priceCell]; if (!plan) continue;
        changes.push([cell, `${money(yearly ? calculatePackage(plan).annual : plan.monthlyCents)} CAD ${unit}`]);
      }
      for (const cell of all(region, '[data-feature-cell]')) {
        const [id, key] = cell.dataset.featureCell.split('.');
        const value = config.pricing.packages[id]?.features[key];
        if (['number', 'boolean'].includes(typeof value)) changes.push([cell, typeof value === 'boolean' ? value ? 'Included' : 'Not included' : String(value)]);
      }
      for (const [el, value] of changes) el.textContent = value;
      const status = one(region, '[data-pricing-status]');
      if (status && announce) { status.setAttribute('role', 'status'); status.textContent = `${yearly ? 'Yearly' : 'Monthly'} prices shown. All amounts in CAD, before tax.`; }
    };
    fieldset.addEventListener('change', () => update()); update(false); fieldset.hidden = false; fieldset.disabled = false;
  }
}
