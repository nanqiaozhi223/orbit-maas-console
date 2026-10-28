(() => {
  const enhance = (selects) => selects.forEach((select) => {
    if (select.dataset.customized === 'true' || select.multiple) return;
    select.dataset.customized = 'true';
    const wrap = document.createElement('div');
    wrap.className = 'filter-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'filter-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.className = 'filter-select-menu';
    menu.setAttribute('role', 'listbox');
    [...select.options].forEach((option, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'filter-select-option';
      item.setAttribute('role', 'option');
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      item.setAttribute('aria-selected', String(index === select.selectedIndex));
      menu.appendChild(item);
    });
    const sync = () => {
      trigger.textContent = select.options[select.selectedIndex]?.textContent || '';
      menu.querySelectorAll('.filter-select-option').forEach((item) => item.setAttribute('aria-selected', String(item.dataset.value === select.value)));
    };
    sync();
    trigger.addEventListener('click', (event) => { event.stopPropagation(); const open = wrap.classList.toggle('open'); trigger.setAttribute('aria-expanded', String(open)); });
    menu.addEventListener('click', (event) => { const item = event.target.closest('.filter-select-option'); if (!item) return; select.value = item.dataset.value; select.dispatchEvent(new Event('change', { bubbles: true })); sync(); wrap.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('click', () => { wrap.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); });
    select.parentNode.insertBefore(wrap, select);
    wrap.append(trigger, menu);
    select.hidden = true;
  });
  enhance(document.querySelectorAll('.filterbar select, .logs-filter-row select, .audit-filter select, .model-filter select, .user-filter select'));
  new MutationObserver(() => enhance(document.querySelectorAll('.usage-filter select:not([data-customized]), .filterbar select:not([data-customized]), .logs-filter-row select:not([data-customized])'))).observe(document.body, { childList: true, subtree: true });
})();
