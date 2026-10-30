(() => {
  const root = document.querySelector('#userPermissionsPage');
  if (!root) return;
  const assignments = [
    {name:'林晓彤', department:'产品与研发部', count:8, people:['陈哲','周宁','赵敏','刘洋','孙悦','高远','吴倩','李然'], time:'2026-10-28 14:32'},
    {name:'周宁', department:'运营管理部', count:5, people:['李然','王珂','高远','吴倩','孙悦'], time:'2026-10-26 09:18'},
    {name:'陈哲', department:'平台工程部', count:3, people:['赵敏','刘洋','孙悦'], time:'2026-10-21 16:05'},
    {name:'王珂', department:'客户成功部', count:2, people:['高远','吴倩'], time:'2026-10-18 11:47'}
  ];
  root.innerHTML = `<div class="title-row users-title"><div><h1>权限设置</h1><p>配置不同角色可使用的功能 <span class="channel-demo-label">演示数据</span></p></div><button class="btn-dark permission-add" type="button" id="permissionAdd">＋ 添加权限配置</button></div><div class="permissions-outside-toolbar"><label class="permission-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="permissionSearch" placeholder="按员工姓名搜索" aria-label="按员工姓名搜索" /></label><button class="btn-dark permission-confirm" type="button" id="permissionConfirm">确认</button></div><section class="permissions-list card"><div class="permissions-table-wrap"><table class="permissions-table"><thead><tr><th>员工姓名</th><th>所属部门</th><th>管理人数</th><th>可管理人员</th><th>操作时间</th><th>操作</th></tr></thead><tbody id="permissionRows"></tbody></table><div class="permission-empty" id="permissionEmpty" hidden>暂无权限配置名单</div></div><div class="permission-pagination"><span id="permissionCount"></span><label>每页行数<select id="permissionSize"><option value="10" selected>10</option><option value="20">20</option></select></label><div><button type="button" id="permissionPrev" aria-label="上一页">‹</button><span id="permissionPage">1 / 1</span><button type="button" id="permissionNext" aria-label="下一页">›</button></div></div></section><dialog class="permission-dialog" id="permissionDialog" aria-labelledby="permissionDialogTitle"><form id="permissionForm" class="permission-dialog-form"><div class="permission-dialog-head"><div><h2 id="permissionDialogTitle">添加权限配置</h2><p>先选择员工，再勾选其名下可管理的人员</p></div><button type="button" class="permission-dialog-close" id="permissionClose" aria-label="关闭">×</button></div><section class="perm-step"><div class="perm-step-title"><span class="perm-step-no">1</span>选择员工</div><div class="perm-admin" id="permAdmin"><div class="perm-admin-search" id="permAdminSearchWrap"><label class="permission-search perm-admin-input"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="permAdminSearch" placeholder="搜索员工姓名或部门" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="permAdminList" aria-autocomplete="list" aria-label="搜索员工姓名或部门" /></label><ul class="perm-admin-list" id="permAdminList" role="listbox" hidden></ul></div><div class="perm-admin-chip" id="permAdminChip" hidden></div></div></section><section class="perm-step perm-step-assign is-locked" id="permAssign"><div class="perm-step-title"><span class="perm-step-no">2</span>分配可管理人员<span class="perm-step-tip" id="permAssignTip">请先在上方选择员工</span></div><div class="perm-panels" id="permPanels" inert><div class="perm-panel"><div class="perm-panel-head"><strong>部门与人员</strong><span>勾选部门可选中其下全部人员</span></div><div class="perm-panel-body"><ul class="perm-tree" id="permTree"></ul></div></div><div class="perm-panel"><div class="perm-panel-head"><strong>已选人员 (<span id="permPickedCount">0</span>)</strong><button type="button" class="perm-clear" id="permClear" disabled>清空</button></div><div class="perm-panel-body"><ul class="perm-picked" id="permPicked"></ul><div class="perm-picked-empty" id="permPickedEmpty">还没有勾选人员</div></div></div></div></section><div class="permission-dialog-foot"><button type="button" class="btn-light" id="permissionCancel">取消</button><button type="submit" class="btn-dark" id="permissionSave" disabled>保存配置</button></div></form></dialog>`;
  const permissionToolbar = root.querySelector('.permissions-outside-toolbar');
  const permissionAdd = root.querySelector('#permissionAdd');
  if (permissionToolbar && permissionAdd) permissionToolbar.appendChild(permissionAdd);
  const rows = root.querySelector('#permissionRows');
  const count = root.querySelector('#permissionCount');
  const search = root.querySelector('#permissionSearch');
  root.querySelector('#permissionPrev').disabled=true; root.querySelector('#permissionNext').disabled=true;
  const render = () => { const query=search.value.trim().toLowerCase(); const visible=assignments.map((item,index)=>({...item,index})).filter(item=>item.name.toLowerCase().includes(query)); count.textContent = `共 ${visible.length} 条`; rows.innerHTML = visible.map(item=>{const names=item.people.join('、'); const preview=item.people.slice(0,3).join('、')+(item.people.length>3?'…':''); return `<tr><td><strong>${item.name}</strong></td><td>${item.department}</td><td><span class="permission-number">${item.count}</span> 人</td><td><span class="permission-people" title="${names}">${preview}</span></td><td>${item.time}</td><td><div class="permission-actions"><button type="button" data-action="edit" data-index="${item.index}">调整权限</button><button type="button" class="is-danger" data-action="remove" data-index="${item.index}">移除</button></div></td></tr>`;}).join(''); root.querySelector('#permissionEmpty').hidden=visible.length>0; };
  search.addEventListener('input',render);
  root.querySelector('#permissionConfirm').addEventListener('click',render);
  // 演示数据：组织架构（部门 -> 子部门 / 人员）
  const org = [
    { dept:'ACG智能创新', children:[ { dept:'智能交互', children:['何静','韩冬'] }, '许诺', '冯磊' ] },
    { dept:'AIM', children:[ '龙腾', '丁凯', { dept:'Data4AI', children:['钱程','蒋薇','沈涛'] }, { dept:'安全与合规', children:[ '宋宏宇', '廖超豪', { dept:'安全研发', children:['曹宇','彭飞'] } ] } ] },
    { dept:'产品与研发部', children:['林晓彤','陈哲','赵敏','刘洋'] },
    { dept:'运营管理部', children:['周宁','李然','孙悦'] },
    { dept:'客户成功部', children:['王珂','高远','吴倩'] }
  ];
  const people = []; const deptMembers = new Map();
  const walk = (nodes, path) => { const names = []; nodes.forEach(node => { if (typeof node === 'string') { people.push({ name:node, path:path.join(' / ') }); names.push(node); } else { const key = [...path, node.dept].join('/'); const inner = walk(node.children, [...path, node.dept]); deptMembers.set(key, inner); names.push(...inner); } }); return names; };
  walk(org, []);
  const byName = new Map(people.map(person => [person.name, person]));
  const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const tone = name => [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
  const avatar = name => `<span class="perm-avatar tone-${tone(name)}" aria-hidden="true">${esc(name.slice(-2))}</span>`;
  const deptIcon = '<span class="perm-dept-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3.2"/><path d="M3.5 18.5c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7"/><circle cx="16.5" cy="8" r="2.6"/><path d="M15.4 13.4c2.6-.3 4.6 1.2 5.1 4.1"/></svg></span>';

  const dialog = root.querySelector('#permissionDialog');
  const adminSearch = root.querySelector('#permAdminSearch');
  const adminList = root.querySelector('#permAdminList');
  const adminWrap = root.querySelector('#permAdminSearchWrap');
  const adminChip = root.querySelector('#permAdminChip');
  const assign = root.querySelector('#permAssign');
  const panels = root.querySelector('#permPanels');
  const tree = root.querySelector('#permTree');
  const picked = root.querySelector('#permPicked');
  const saveBtn = root.querySelector('#permissionSave');
  let admin = null; let selected = []; let open = new Set(['AIM','AIM/安全与合规']); let matches = []; let active = -1;

  const deptState = key => { const members = deptMembers.get(key).filter(name => name !== admin); const count = members.filter(name => selected.includes(name)).length; return { members, count, all: members.length > 0 && count === members.length, some: count > 0 && count < members.length }; };
  const renderTree = (nodes, path, depth) => nodes.map(node => {
    if (typeof node === 'string') {
      const self = node === admin; const person = byName.get(node);
      return `<li><label class="perm-node perm-person${self ? ' is-self' : ''}" style="--depth:${depth}"><input type="checkbox" data-person="${esc(node)}" ${selected.includes(node) ? 'checked' : ''} ${self ? 'disabled' : ''} aria-label="${esc(person.path)} ${esc(node)}" />${avatar(node)}<span class="perm-node-name">${esc(node)}</span>${self ? '<em>当前员工</em>' : ''}</label></li>`;
    }
    const key = [...path, node.dept].join('/'); const isOpen = open.has(key); const state = deptState(key);
    return `<li><div class="perm-node perm-dept" style="--depth:${depth}"><button type="button" class="perm-caret" data-toggle="${esc(key)}" aria-expanded="${isOpen}" aria-label="${isOpen ? '收起' : '展开'} ${esc(node.dept)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button><label><input type="checkbox" data-dept="${esc(key)}" ${state.all ? 'checked' : ''} ${state.some ? 'data-mixed="1"' : ''} ${state.members.length ? '' : 'disabled'} />${deptIcon}<span class="perm-node-name">${esc(node.dept)}</span><span class="perm-node-count">${state.count ? `${state.count}/` : ''}${state.members.length}</span></label></div>${isOpen ? `<ul>${renderTree(node.children, [...path, node.dept], depth + 1)}</ul>` : ''}</li>`;
  }).join('');
  const renderPicked = () => {
    picked.innerHTML = selected.map(name => `<li>${avatar(name)}<div><strong>${esc(name)}</strong><span>${esc(byName.get(name).path)}</span></div><button type="button" data-remove="${esc(name)}" aria-label="移除 ${esc(name)}">移除</button></li>`).join('');
    root.querySelector('#permPickedCount').textContent = selected.length;
    root.querySelector('#permPickedEmpty').hidden = selected.length > 0;
    root.querySelector('#permClear').disabled = !selected.length;
    saveBtn.disabled = !admin || !selected.length;
  };
  const renderAssign = () => {
    const focusKey = document.activeElement && tree.contains(document.activeElement) ? ['data-person','data-dept','data-toggle'].map(attr => document.activeElement.getAttribute(attr) && `[${attr}="${CSS.escape(document.activeElement.getAttribute(attr))}"]`).find(Boolean) : null;
    tree.innerHTML = renderTree(org, [], 0);
    tree.querySelectorAll('input[data-mixed]').forEach(input => { input.indeterminate = true; });
    if (focusKey) tree.querySelector(focusKey)?.focus();
    renderPicked();
  };

  const renderOptions = () => {
    const query = adminSearch.value.trim().toLowerCase();
    matches = query ? people.filter(person => person.name.toLowerCase().includes(query) || person.path.toLowerCase().includes(query)).slice(0, 8) : people.slice(0, 8);
    active = matches.length ? 0 : -1;
    adminList.innerHTML = matches.length ? matches.map((person, index) => `<li role="option" id="permOpt${index}" data-index="${index}" aria-selected="${index === active}">${avatar(person.name)}<div><strong>${esc(person.name)}</strong><span>${esc(person.path)}</span></div>${assignments.some(item => item.name === person.name) ? '<em>已有配置</em>' : ''}</li>`).join('') : '<li class="perm-admin-none">没有匹配的员工</li>';
    adminList.hidden = false; adminSearch.setAttribute('aria-expanded', 'true');
    adminSearch.setAttribute('aria-activedescendant', active >= 0 ? `permOpt${active}` : '');
  };
  const closeOptions = () => { adminList.hidden = true; adminSearch.setAttribute('aria-expanded', 'false'); adminSearch.removeAttribute('aria-activedescendant'); };
  const moveActive = step => { if (!matches.length) return; active = (active + step + matches.length) % matches.length; adminList.querySelectorAll('[role=option]').forEach((li, index) => li.setAttribute('aria-selected', index === active)); adminSearch.setAttribute('aria-activedescendant', `permOpt${active}`); adminList.querySelector(`#permOpt${active}`)?.scrollIntoView({ block:'nearest' }); };

  const setAdmin = person => {
    admin = person ? person.name : null;
    const existing = person && assignments.find(item => item.name === person.name);
    if (person) selected = existing ? existing.people.filter(name => byName.has(name) && name !== admin) : selected.filter(name => name !== admin);
    adminWrap.hidden = !!person; adminChip.hidden = !person;
    adminChip.innerHTML = person ? `${avatar(person.name)}<div><strong>${esc(person.name)}</strong><span>${esc(person.path)}${existing ? ' · 已有配置，保存后将覆盖' : ''}</span></div><button type="button" class="btn-light perm-admin-change" id="permAdminChange">更换</button>` : '';
    assign.classList.toggle('is-locked', !person); panels.inert = !person;
    root.querySelector('#permAssignTip').textContent = person ? `为 ${person.name} 勾选可管理的人员` : '请先在上方选择员工';
    closeOptions(); renderAssign();
  };
  const pickOption = index => { const person = matches[index]; if (person) setAdmin(person); };

  adminSearch.addEventListener('input', renderOptions);
  adminSearch.addEventListener('focus', renderOptions);
  adminSearch.addEventListener('blur', () => setTimeout(closeOptions, 120));
  adminSearch.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); adminList.hidden ? renderOptions() : moveActive(1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
    else if (event.key === 'Enter') { event.preventDefault(); if (!adminList.hidden && active >= 0) pickOption(active); }
    else if (event.key === 'Escape' && !adminList.hidden) { event.preventDefault(); closeOptions(); }
  });
  adminList.addEventListener('mousedown', event => { const option = event.target.closest('[role=option]'); if (option) { event.preventDefault(); pickOption(Number(option.dataset.index)); } });
  adminChip.addEventListener('click', event => { if (!event.target.closest('#permAdminChange')) return; setAdmin(null); adminSearch.value = ''; adminSearch.focus(); });

  tree.addEventListener('click', event => { const caret = event.target.closest('[data-toggle]'); if (!caret) return; const key = caret.dataset.toggle; open.has(key) ? open.delete(key) : open.add(key); renderAssign(); });
  tree.addEventListener('change', event => {
    const input = event.target;
    if (input.dataset.person) { const name = input.dataset.person; selected = input.checked ? [...selected, name] : selected.filter(item => item !== name); }
    else if (input.dataset.dept) { const { members, all } = deptState(input.dataset.dept); selected = all ? selected.filter(name => !members.includes(name)) : [...selected, ...members.filter(name => !selected.includes(name))]; }
    renderAssign();
  });
  picked.addEventListener('click', event => { const button = event.target.closest('[data-remove]'); if (!button) return; selected = selected.filter(name => name !== button.dataset.remove); renderAssign(); });
  root.querySelector('#permClear').addEventListener('click', () => { selected = []; renderAssign(); });

  const openDialog = () => { selected = []; adminSearch.value = ''; open = new Set(['AIM','AIM/安全与合规']); setAdmin(null); dialog.showModal(); adminSearch.focus(); };
  root.querySelector('#permissionAdd').addEventListener('click', openDialog);
  root.querySelector('#permissionClose').addEventListener('click', () => dialog.close());
  root.querySelector('#permissionCancel').addEventListener('click', () => dialog.close());
  root.querySelector('#permissionForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!admin) { showToast('请先选择员工'); return; }
    if (!selected.length) { showToast('请勾选至少一名可管理人员'); return; }
    const old = assignments.findIndex(item => item.name === admin); if (old >= 0) assignments.splice(old, 1);
    const department = byName.get(admin).path.split(' / ').pop();
    assignments.unshift({ name:admin, department, count:selected.length, people:[...selected], time:new Date().toLocaleString('zh-CN', { hour12:false }).replace(/\//g, '-') });
    dialog.close(); render(); showToast(old >= 0 ? `已更新 ${admin} 的权限配置` : '权限配置已添加');
  });
  rows.addEventListener('click', event => { const button=event.target.closest('button'); if(!button)return; const item=assignments[Number(button.dataset.index)]; if(button.dataset.action==='remove'){ assignments.splice(Number(button.dataset.index),1); render(); showToast(`已移除 ${item.name} 的权限配置`); } else showToast(`已打开 ${item.name} 的权限调整`); });
  render();
})();
