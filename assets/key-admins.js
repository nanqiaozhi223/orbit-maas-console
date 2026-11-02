(() => {
  const form = document.querySelector('#keyForm');
  const preferenceField = form?.querySelector('[name=preference]');
  const preference = preferenceField?.closest('.key-pref-row') || preferenceField?.closest('.form-section');
  if (!form || !preference) return;

  // 演示用人员名单（第一位为当前用户，默认是业务 Key 的管理员）
  const self = ['tong_li2', '黎彤', 'AIM 运维'];
  const people = [self,
    ['wang_xiyun', '王茜云', '平台运维部'], ['zhang_wei', '张伟', '数据智能部'], ['li_na', '李娜', '算法平台组'],
    ['chen_hao', '陈浩', '基础架构部'], ['liu_yang', '刘洋', '产品技术部'], ['zhao_min', '赵敏', '信息安全部'],
    ['sun_qi', '孙琪', '数据智能部'], ['zhou_jie', '周杰', '平台运维部'], ['wu_tingting', '吴婷婷', '财务系统组'],
    ['zheng_kai', '郑凯', '算法平台组'], ['huang_shaozheng', '黄少政', '产品技术部'], ['ma_yujia', '马宇佳', '基础架构部']
  ];
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const option = (type, name, [id, label, dept]) => `<label class="admin-option" data-name="${esc(label)}" data-search="${esc((label + id + dept).toLowerCase())}"><input type="${type}" name="${name}" value="${esc(label)}"${type === 'radio' && label === self[1] ? ' checked' : ''}><span class="admin-avatar" aria-hidden="true">${esc(label.slice(-1))}</span><span class="admin-meta"><strong>${esc(label)}</strong><small>${esc(id)} · ${esc(dept)}</small></span></label>`;
  const picker = ({ id, title, hint, type, name, placeholder, list, search }) => `<div class="form-section key-admins" id="${id}" hidden>
    <h3>${title}</h3><p class="key-admins-hint">${hint}</p>
    <div class="admin-picker">
      <button type="button" class="admin-picker-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}Panel"><span class="admin-picker-label">${placeholder}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button>
      <div class="admin-picker-panel" id="${id}Panel" hidden>
        <label class="admin-picker-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" placeholder="输入姓名或账号搜索" aria-label="${search}" autocomplete="off"></label>
        <div class="admin-picker-list" role="listbox"${type === 'checkbox' ? ' aria-multiselectable="true"' : ''} aria-label="${list}">${people.map(p => option(type, name, p)).join('')}<p class="admin-picker-empty" hidden>没有匹配的人员</p></div>
      </div>
    </div>
    ${type === 'checkbox' ? '<div class="admin-chips" aria-live="polite"></div>' : ''}
  </div>`;

  preference.insertAdjacentHTML('afterend', '<div class="form-section key-admins-row" id="keyPeopleRow" hidden>' +
    picker({ id: 'keyOwnerField', title: 'Key 管理员', hint: '管理员负责该 Key 的配置与成员管理，默认为创建人', type: 'radio', name: 'keyOwner', placeholder: '选择管理员', list: '管理员候选人', search: '搜索管理员' }) +
    picker({ id: 'keyAdminsField', title: '添加项目成员', hint: '项目成员可查看并使用该 Key', type: 'checkbox', name: 'shareAdmin', placeholder: '选择项目成员', list: '项目成员列表', search: '搜索项目成员' }) + '</div>');

  const ownerField = form.querySelector('#keyOwnerField');
  const memberField = form.querySelector('#keyAdminsField');
  const peopleRow = form.querySelector('#keyPeopleRow');
  const fields = [ownerField, memberField];
  const inputs = (field, name) => [...field.querySelectorAll(`[name=${name}]`)];
  const owner = () => inputs(ownerField, 'keyOwner').find(x => x.checked)?.value || self[1];
  const parts = field => ({
    trigger: field.querySelector('.admin-picker-trigger'),
    panel: field.querySelector('.admin-picker-panel'),
    search: field.querySelector('.admin-picker-search input'),
    label: field.querySelector('.admin-picker-label'),
    empty: field.querySelector('.admin-picker-empty'),
    chips: field.querySelector('.admin-chips')
  });

  const filter = field => {
    const { search, empty } = parts(field);
    const q = search.value.trim().toLowerCase();
    const current = owner();
    let shown = 0;
    field.querySelectorAll('.admin-option').forEach(opt => {
      const isOwner = field === memberField && opt.dataset.name === current; // 管理员不出现在成员候选中
      const hit = !isOwner && (!q || opt.dataset.search.includes(q));
      opt.hidden = !hit;
      if (hit) shown++;
    });
    empty.hidden = shown > 0;
  };
  const setOpen = (field, open) => {
    const { panel, trigger, search } = parts(field);
    if (open) fields.filter(f => f !== field).forEach(f => setOpen(f, false));
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) { search.value = ''; filter(field); search.focus(); }
  };
  const render = () => {
    const current = owner();
    inputs(memberField, 'shareAdmin').forEach(x => { if (x.value === current) x.checked = false; });
    const ownerParts = parts(ownerField);
    ownerParts.label.textContent = current === self[1] ? `${current}（我）` : current;
    ownerParts.label.classList.add('has-value');
    const picked = inputs(memberField, 'shareAdmin').filter(x => x.checked).map(x => x.value);
    const memberParts = parts(memberField);
    memberParts.label.textContent = picked.length ? `已选择 ${picked.length} 位成员` : '选择项目成员';
    memberParts.label.classList.toggle('has-value', picked.length > 0);
    memberParts.chips.innerHTML = picked.map(name => `<span class="admin-chip">${esc(name)}<button type="button" data-remove="${esc(name)}" aria-label="移除 ${esc(name)}">×</button></span>`).join('');
    filter(memberField);
  };

  fields.forEach(field => {
    const { trigger, search } = parts(field);
    trigger.addEventListener('click', () => setOpen(field, parts(field).panel.hidden));
    search.addEventListener('input', () => filter(field));
    search.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    field.addEventListener('keydown', e => { if (e.key === 'Escape' && !parts(field).panel.hidden) { e.stopPropagation(); setOpen(field, false); trigger.focus(); } });
  });
  ownerField.addEventListener('change', e => {
    if (e.target.name !== 'keyOwner') return;
    e.stopPropagation();
    render();
    setOpen(ownerField, false);
    parts(ownerField).trigger.focus();
  });
  memberField.addEventListener('change', e => { if (e.target.name === 'shareAdmin') { e.stopPropagation(); render(); } });
  parts(memberField).chips.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const box = inputs(memberField, 'shareAdmin').find(x => x.value === btn.dataset.remove);
    if (box) box.checked = false;
    render();
  });
  document.addEventListener('click', e => { fields.forEach(field => { if (!parts(field).panel.hidden && !field.querySelector('.admin-picker').contains(e.target)) setOpen(field, false); }); });

  // 由 syncKeyConfiguration / loadKeyConfiguration 调用：selected 为项目成员，ownerName 为管理员
  window.syncKeyAdmins = (scene, selected, ownerName) => {
    if (ownerName !== undefined) {
      const target = people.some(p => p[1] === ownerName) ? ownerName : self[1];
      inputs(ownerField, 'keyOwner').forEach(x => { x.checked = x.value === target; });
    }
    if (Array.isArray(selected)) inputs(memberField, 'shareAdmin').forEach(x => { x.checked = selected.includes(x.value); });
    peopleRow.hidden = scene !== 'business';
    fields.forEach(field => { field.hidden = peopleRow.hidden; if (field.hidden) setOpen(field, false); });
    render();
  };
  window.syncKeyAdmins(form.elements.scene.value);
})();
