(() => {
  const form = document.querySelector('#keyForm');
  const preference = form?.querySelector('[name=preference]')?.closest('.form-section');
  if (!form || !preference) return;

  // 演示用管理员名单（不含当前用户）
  const admins = [
    ['wang_xiyun', '王茜云', '平台运维部'], ['zhang_wei', '张伟', '数据智能部'], ['li_na', '李娜', '算法平台组'],
    ['chen_hao', '陈浩', '基础架构部'], ['liu_yang', '刘洋', '产品技术部'], ['zhao_min', '赵敏', '信息安全部'],
    ['sun_qi', '孙琪', '数据智能部'], ['zhou_jie', '周杰', '平台运维部'], ['wu_tingting', '吴婷婷', '财务系统组'],
    ['zheng_kai', '郑凯', '算法平台组'], ['huang_shaozheng', '黄少政', '产品技术部'], ['ma_yujia', '马宇佳', '基础架构部']
  ];
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  preference.insertAdjacentHTML('afterend', `<div class="form-section key-admins" id="keyAdminsField" hidden>
    <h3>加入其他管理员</h3>
    <div class="admin-picker">
      <button type="button" class="admin-picker-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="adminPickerPanel"><span class="admin-picker-label">选择管理员</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>
      <div class="admin-picker-panel" id="adminPickerPanel" hidden>
        <label class="admin-picker-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" placeholder="输入姓名或账号搜索" aria-label="搜索管理员" autocomplete="off"></label>
        <div class="admin-picker-list" role="listbox" aria-multiselectable="true" aria-label="管理员列表">${admins.map(([id, name, dept]) => `<label class="admin-option" data-search="${esc((name + id + dept).toLowerCase())}"><input type="checkbox" name="shareAdmin" value="${esc(name)}"><span class="admin-avatar" aria-hidden="true">${esc(name.slice(-1))}</span><span class="admin-meta"><strong>${esc(name)}</strong><small>${esc(id)} · ${esc(dept)}</small></span></label>`).join('')}<p class="admin-picker-empty" hidden>没有匹配的管理员</p></div>
      </div>
    </div>
    <div class="admin-chips" aria-live="polite"></div>
  </div>`);

  const field = form.querySelector('#keyAdminsField');
  const trigger = field.querySelector('.admin-picker-trigger');
  const panel = field.querySelector('.admin-picker-panel');
  const search = field.querySelector('.admin-picker-search input');
  const label = field.querySelector('.admin-picker-label');
  const chips = field.querySelector('.admin-chips');
  const empty = field.querySelector('.admin-picker-empty');
  const boxes = () => [...field.querySelectorAll('[name=shareAdmin]')];

  const render = () => {
    const picked = boxes().filter(x => x.checked).map(x => x.value);
    label.textContent = picked.length ? `已选择 ${picked.length} 位管理员` : '选择管理员';
    label.classList.toggle('has-value', picked.length > 0);
    chips.innerHTML = picked.map(name => `<span class="admin-chip">${esc(name)}<button type="button" data-remove="${esc(name)}" aria-label="移除 ${esc(name)}">×</button></span>`).join('');
  };
  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    field.querySelectorAll('.admin-option').forEach(opt => { const hit = !q || opt.dataset.search.includes(q); opt.hidden = !hit; if (hit) shown++; });
    empty.hidden = shown > 0;
  };
  const setOpen = open => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) { search.value = ''; filter(); search.focus(); }
  };

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  search.addEventListener('input', filter);
  search.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
  field.addEventListener('change', e => { if (e.target.name === 'shareAdmin') { e.stopPropagation(); render(); } });
  chips.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const box = boxes().find(x => x.value === btn.dataset.remove);
    if (box) box.checked = false;
    render();
  });
  field.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { e.stopPropagation(); setOpen(false); trigger.focus(); } });
  document.addEventListener('click', e => { if (!panel.hidden && !field.querySelector('.admin-picker').contains(e.target)) setOpen(false); });

  // 由 syncKeyConfiguration / loadKeyConfiguration 调用
  window.syncKeyAdmins = (scene, selected) => {
    if (Array.isArray(selected)) boxes().forEach(x => { x.checked = selected.includes(x.value); });
    field.hidden = scene !== 'business';
    if (field.hidden) setOpen(false);
    render();
  };
  window.syncKeyAdmins(form.elements.scene.value);
})();
