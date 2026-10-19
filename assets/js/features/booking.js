import { all, one } from './bindings.js';

const FIELDS = [['service', 'package', 'vehicle', 'concern'], ['date', 'window'], ['name', 'email', 'phone', 'consent']];
const ERRORS = {
  service: 'Choose a listed service.', package: 'Choose a listed package or leave it unselected.',
  vehicle: 'Enter a vehicle description between 3 and 80 characters.', concern: 'Keep your note to 500 characters or fewer.',
  date: 'Choose an open weekday from tomorrow through 90 days ahead in the shop time zone.', window: 'Choose a listed time window.',
  name: 'Enter a name between 2 and 80 characters.', email: 'Enter a valid email address of 254 characters or fewer.',
  phone: 'Use 7–15 digits; spaces, +, parentheses and hyphens are allowed.', consent: 'Confirm you understand this is a demonstration.'
};
const calendarDay = (date, zone) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};
export function addDays(iso, count) {
  const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + count); return date.toISOString().slice(0, 10);
}
export function dateBounds(config, now = new Date()) {
  const today = calendarDay(now, config.business.timezone);
  return { min: addDays(today, config.booking.minLeadDays), max: addDays(today, config.booking.maxAdvanceDays) };
}
export function validDate(value, config, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const bounds = dateBounds(config, now);
  if (value < bounds.min || value > bounds.max) return false;
  const day = new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: 'UTC' }).format(parsed);
  return config.business.hours.some(hours => hours.day === day && !hours.closed);
}
export function validateValues(values, config, emailValid = true, now = new Date()) {
  const errors = {};
  const length = (key, min, max) => String(values[key] || '').trim().length >= min && String(values[key] || '').trim().length <= max;
  if (!Object.hasOwn(config.pricing.serviceStartingCents, values.service || '')) errors.service = ERRORS.service;
  if (values.package && !Object.hasOwn(config.pricing.packages, values.package)) errors.package = ERRORS.package;
  if (!length('vehicle', 3, 80)) errors.vehicle = ERRORS.vehicle;
  if (!length('concern', 0, 500)) errors.concern = ERRORS.concern;
  if (!validDate(values.date || '', config, now)) errors.date = ERRORS.date;
  if (!Object.hasOwn(config.booking.timeWindows, values.window || '')) errors.window = ERRORS.window;
  if (!length('name', 2, 80)) errors.name = ERRORS.name;
  if (!length('email', 1, 254) || !emailValid) errors.email = ERRORS.email;
  const phone = String(values.phone || '').trim(), digits = phone.replace(/\D/g, '').length;
  if (phone && (!/^[\d+()\s-]+$/.test(phone) || digits < 7 || digits > 15)) errors.phone = ERRORS.phone;
  if (values.consent !== true) errors.consent = ERRORS.consent;
  return errors;
}

export function init(root, config) {
  for (const form of all(root, '[data-booking-form]')) {
    // This handler is installed before any enhancement can enable a control.
    form.addEventListener('submit', event => event.preventDefault());
    const steps = ['1', '2', '3'].map(number => one(form, `[data-booking-step="${number}"]`));
    const summary = one(form, '[data-error-summary]');
    const success = one(root, '[data-booking-success]');
    const controls = key => all(form, `[name="${key}"]`);
    if (steps.some(step => !step) || !summary || !success || FIELDS.flat().some(key => !controls(key).length)) continue;
    if (config.booking.mode !== 'demo' || config.booking.retention !== 'memory-only') continue;
    const doc = form.ownerDocument, win = doc.defaultView;
    const state = form.closest('[data-booking-state]') || one(form, '[data-booking-state]') || form;
    const status = one(root, '[data-step-status]');
    if (success.closest('[data-booking-step]')) steps[0].before(success);
    const review = one(form, '[data-booking-review]');
    let current = 0, busy = false, complete = false, frame = 0;
    const initialDisabled = new Map(all(form, 'fieldset, input, select, textarea, button').map(el => [el, el.disabled]));
    const described = new Map(FIELDS.flat().flatMap(key => controls(key)).map(el => [el, el.getAttribute('aria-describedby') || '']));
    const read = () => Object.fromEntries(FIELDS.flat().map(key => {
      const group = controls(key), control = group[0];
      return [key, control.type === 'checkbox' ? control.checked : control.type === 'radio' ? group.find(el => el.checked)?.value || '' : control.value.trim()];
    }));
    const setState = value => { state.dataset.bookingState = value; state.setAttribute('aria-busy', String(value === 'validating')); };
    const updateBounds = () => { const bounds = dateBounds(config); const input = controls('date')[0]; input.min = bounds.min; input.max = bounds.max; };
    const clearErrors = () => {
      summary.replaceChildren(); summary.hidden = true;
      for (const key of FIELDS.flat()) {
        const error = one(form, `[data-field-error="${key}"]`); if (error) { error.textContent = ''; error.hidden = true; }
        for (const input of controls(key)) {
          input.removeAttribute('aria-invalid');
          const before = described.get(input); if (before) input.setAttribute('aria-describedby', before); else input.removeAttribute('aria-describedby');
        }
      }
    };
    const renderReview = () => {
      if (!review) return;
      const values = read(), dl = doc.createElement('dl');
      const labels = { service: 'Service', package: 'Maintenance package (optional)', vehicle: 'Vehicle year, make and model', concern: 'What have you noticed? (optional)', date: 'Preferred date', window: 'Preferred time window', name: 'Your name', email: 'Email address', phone: 'Phone number (optional)' };
      for (const [key, label] of Object.entries(labels)) {
        const dt = doc.createElement('dt'), dd = doc.createElement('dd'); dt.textContent = label;
        const input = controls(key)[0]; let value = values[key];
        if (key === 'window') value = config.booking.timeWindows[value] || '';
        if (key === 'package') value = config.pricing.packages[value]?.name || 'No package selected';
        if (key === 'service') value = input.selectedOptions?.[0]?.textContent || '';
        dd.textContent = value || '—'; dl.append(dt, dd);
      }
      review.replaceChildren(dl);
    };
    const show = (index, focus = true) => {
      current = index;
      steps.forEach((step, i) => { step.hidden = complete || i !== current; });
      for (const button of all(form, '[data-step-next]')) button.hidden = complete || current === 2;
      for (const button of all(form, '[data-step-back]')) button.hidden = complete || current === 0;
      for (const button of all(form, '[data-booking-submit]')) { button.hidden = complete || current !== 2; button.disabled = busy; }
      const title = steps[index].querySelector('legend')?.textContent.trim() || ['Service & vehicle', 'Preferred visit', 'Your details & review'][index];
      if (status) {
        status.setAttribute('role', 'status');
        // A containing status may also hold an ordered progress list.
        const progress = all(form, 'ol li');
        progress.forEach((item, i) => { if (i === index) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current'); });
        if (!status.contains(progress[0] || null)) status.textContent = `Step ${index + 1} of 3: ${title}`;
      }
      if (index === 2) renderReview();
      if (focus && !complete) { const heading = one(steps[index], 'h2, h3, [tabindex="-1"], legend') || steps[index]; heading.tabIndex = -1; heading.focus(); }
    };
    const validate = keys => {
      clearErrors(); updateBounds();
      for (const key of FIELDS.flat()) for (const control of controls(key)) {
        if (['text', 'email', 'tel'].includes(control.type) || control.tagName === 'TEXTAREA') control.value = control.value.trim();
      }
      const errors = validateValues(read(), config, controls('email')[0].validity.valid);
      const selected = Object.entries(errors).filter(([key]) => keys.includes(key));
      if (!selected.length) return true;
      const firstStep = FIELDS.findIndex(names => names.includes(selected[0][0]));
      if (firstStep !== current) show(firstStep, false);
      const heading = doc.createElement('p'); heading.textContent = 'Check the highlighted fields.';
      const list = doc.createElement('ul');
      for (const [key, message] of selected) {
        const input = controls(key)[0];
        if (!input.id) input.id = `booking-${key}`;
        let error = one(form, `[data-field-error="${key}"]`);
        if (!error) { error = doc.createElement('p'); error.dataset.fieldError = key; input.after(error); }
        if (!error.id) error.id = `booking-${key}-error`;
        error.textContent = message; error.hidden = false;
        for (const control of controls(key)) {
          control.setAttribute('aria-invalid', 'true');
          control.setAttribute('aria-describedby', [...new Set(`${described.get(control)} ${error.id}`.trim().split(/\s+/))].join(' '));
        }
        const li = doc.createElement('li'), link = doc.createElement('a'); link.href = `#${input.id}`; link.textContent = message;
        link.addEventListener('click', event => { event.preventDefault(); show(FIELDS.findIndex(names => names.includes(key)), false); input.focus(); });
        li.append(link); list.append(li);
      }
      summary.replaceChildren(heading, list); summary.hidden = false; summary.tabIndex = -1; summary.setAttribute('role', 'alert');
      // Keep the summary exposed even if its template placed it inside another step.
      const parentStep = summary.closest('[data-booking-step]'); if (parentStep) steps[0].before(summary);
      setState('invalid'); summary.focus(); return false;
    };
    const submit = () => {
      if (busy || complete) return;
      if (!validate(FIELDS.flat())) return;
      busy = true; setState('validating'); show(current, false);
      frame = win.requestAnimationFrame(() => {
        frame = 0; busy = false; complete = true; setState('success');
        show(current, false); success.hidden = false; success.setAttribute('role', 'status');
        let heading = one(success, 'h2, h3, [tabindex="-1"]');
        if (!heading) { heading = doc.createElement('h2'); success.prepend(heading); }
        heading.textContent = 'Demo request complete'; heading.tabIndex = -1;
        if (!one(success, 'p')) { const body = doc.createElement('p'); body.textContent = 'Nothing was sent and no appointment was booked. Your details disappear when you leave or reset this page.'; success.append(body); }
        for (const button of all(root, '[data-booking-reset]')) button.hidden = false;
        heading.focus();
      });
    };
    form.addEventListener('submit', () => {
      if (current < 2) { if (!busy && !complete && validate(FIELDS[current])) { setState('ready'); show(current + 1); } }
      else submit();
    });
    for (const button of all(form, '[data-step-next]')) button.addEventListener('click', event => {
      event.preventDefault(); if (!busy && !complete && current < 2 && validate(FIELDS[current])) { setState('ready'); show(current + 1); }
    });
    for (const button of all(form, '[data-step-back]')) button.addEventListener('click', event => {
      event.preventDefault(); if (!busy && !complete && current > 0) { clearErrors(); setState('ready'); show(current - 1); }
    });
    for (const button of all(form, '[data-booking-submit]')) button.addEventListener('click', event => { event.preventDefault(); submit(); });
    const reset = (focus = true) => {
      win.cancelAnimationFrame(frame); frame = 0; busy = complete = false;
      form.reset();
      for (const control of all(form, 'input, textarea, select')) {
        if (control.type === 'checkbox' || control.type === 'radio') control.checked = false;
        else if (control.tagName === 'SELECT') control.value = '';
        else if (!['button', 'submit', 'reset', 'hidden'].includes(control.type)) control.value = '';
      }
      clearErrors(); review?.replaceChildren(); success.hidden = true;
      for (const button of all(root, '[data-booking-reset]')) button.hidden = true;
      for (const fieldset of all(form, 'fieldset')) fieldset.disabled = false;
      setState('ready'); updateBounds(); show(0, focus);
    };
    for (const button of all(root, '[data-booking-reset]')) button.addEventListener('click', event => { event.preventDefault(); reset(); });
    win.addEventListener('pagehide', () => {
      reset(false);
      // Disable while out of the document, including bfcache snapshots.
      for (const [el, disabled] of initialDisabled) el.disabled = disabled;
    });
    win.addEventListener('pageshow', event => { if (event.persisted) reset(false); });
    const updateDetails = () => {
      if (busy || complete) return;
      setState('ready');
      if (current === 2) renderReview();
    };
    form.addEventListener('input', updateDetails);
    form.addEventListener('change', updateDetails);
    form.noValidate = true; form.removeAttribute('action');
    reset(false);
    const query = new URLSearchParams(win.location.search);
    for (const key of ['service', 'package']) {
      const value = query.get(key), allowed = key === 'service' ? config.pricing.serviceStartingCents : config.pricing.packages;
      if (value && Object.hasOwn(allowed, value)) controls(key)[0].value = value;
    }
  }
}
