(() => {
  const form = document.querySelector('#keyForm');
  const lockedRouteLabel = [...form.querySelectorAll('.model-option b')].find(label => label.textContent.trim() === '锁定单一模型');
  if (lockedRouteLabel) lockedRouteLabel.textContent = '锁定模型';
  form.querySelectorAll('#lockedModelField input[name="lockedModel"]').forEach(input => { input.type = 'checkbox'; });
  const select = form.elements.preference;
  select.hidden = true;
  select.tabIndex = -1;
  const control = document.createElement('div');
  control.className = 'key-preference';
  control.innerHTML = '<button type="button" class="key-preference-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="keyPreferenceOptions" aria-label="调用偏好"><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><div id="keyPreferenceOptions" class="key-preference-menu" role="listbox" aria-label="调用偏好" hidden></div>';
  select.after(control);
  const trigger = control.querySelector('button');
  const menu = control.querySelector('[role=listbox]');
  const options = [...select.options].map(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'option';
    button.textContent = option.text;
    button.dataset.value = option.value;
    button.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    });
    menu.append(button);
    return button;
  });
  function sync() {
    trigger.querySelector('span').textContent = select.selectedOptions[0]?.text || '';
    options.forEach(option => option.setAttribute('aria-selected', String(option.dataset.value === select.value)));
  }
  function close(focus = false) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  }
  function open() {
    sync();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const bounds = control.getBoundingClientRect();
    const panel = control.closest('.modal-panel').getBoundingClientRect();
    control.classList.toggle('opens-up', panel.bottom - bounds.bottom < menu.offsetHeight + 12);
    options.find(option => option.dataset.value === select.value)?.focus();
  }
  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(); }
  });
  menu.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(); return; }
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) { event.preventDefault(); options[next].focus(); }
  });
  document.addEventListener('click', event => { if (!control.contains(event.target)) close(); });
  form.addEventListener('reset', () => queueMicrotask(() => { close(); sync(); }));
  select.addEventListener('change', sync);
  sync();
})();
