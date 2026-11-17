(() => {
  const root=document.querySelector('#usersPage'),$=id=>root.querySelector('#'+id),esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let users=[['lei_yang','阳蕾'],['yichang_han','韩一畅'],['pandeng_li','李攀登'],['xiyun_wang','王茜云'],['ruixiang_ji','吉睿翔'],['shaozheng_huang','黄少政'],['yujia_ma','马宇佳'],['zhifeng_huang','黄志锋'],['tong_li2','黎彤'],['zuyang_gao','高祖扬']].map(([username,name],i)=>({id:774-i,username,name,email:username+'@example.com',enabled:i!==9,role:i===8?'admin':'user',group:'default',quota:6730000,remaining:6730000-([13.14,0,0,0,1050.41,93.31,467.45,46.4,1250,0][i]),invited:0,income:0}));
  try{const saved=JSON.parse(localStorage.getItem('maas-users-demo'));if(Array.isArray(saved)&&saved.every(u=>u&&typeof u.username==='string'&&typeof u.id==='number'&&Number.isFinite(u.quota)&&Number.isFinite(u.remaining)))users=saved;}catch{}
  let page=1,editing=null,desc=true;const selected=new Set();
  const save=()=>{try{localStorage.setItem('maas-users-demo',JSON.stringify(users));}catch{}};
  root.innerHTML=`<div class="title-row users-title"><div><h1>用户</h1><p>管理用户账户、可用额度与访问权限 <span class="channel-demo-label">演示数据</span></p></div><button class="btn-dark" id="userAdd">＋ 添加用户</button></div><div class="users-toolbar"><label class="user-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="userSearch" placeholder="按用户名、姓名或邮箱筛选" aria-label="搜索用户" /></label><label class="user-search user-key-search"><input type="search" id="userKeySearch" placeholder="按 API Key 搜索" aria-label="按 API Key 搜索" /></label><label class="user-filter"><select id="userStatus" aria-label="用户状态"><option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已停用</option></select></label><label class="user-filter"><select id="userRole" aria-label="用户角色"><option value="all">全部角色</option><option value="user">用户</option><option value="admin">管理员</option></select></label><button class="btn-dark user-search-confirm" id="userSearchConfirm">确认</button></div><div class="user-bulk" id="userBulk" hidden><span id="userSelected"></span><button class="btn-light" id="userBulkEnable">批量启用</button><button class="btn-light" id="userBulkDisable">批量停用</button></div><div class="users-table-wrap"><table class="users-table"><thead><tr><th><input type="checkbox" id="userSelectAll" aria-label="全选当前页" /></th><th><button id="userSort">ID <span aria-hidden="true">↕</span></button></th><th>用户名</th><th>状态</th><th>额度 <small>剩余 / 总额</small></th><th>分组</th><th>角色</th><th>操作</th></tr></thead><tbody id="userRows"></tbody></table><div id="userEmpty" class="user-empty" hidden>没有匹配的用户，请调整筛选条件。</div></div><div class="models-pagination"><span class="model-total" id="userTotal"></span><label>每页行数<select id="userSize"><option value="5">5</option><option value="20" selected>20</option></select></label><div class="model-page-controls"><button id="userPrev" aria-label="上一页">‹</button><span id="userPage"></span><button id="userNext" aria-label="下一页">›</button></div></div><dialog class="user-dialog" id="userDialog"><form id="userForm"><div class="user-dialog-head"><h2>添加用户</h2><button type="button" id="userClose" aria-label="关闭">×</button></div><p>配置本地演示账户及其额度</p><div class="user-form-grid"><label>用户名<input id="newUserUsername" required maxlength="48" pattern="[A-Za-z0-9_\\-]+" title="使用字母、数字、下划线或连字符" /></label><label>姓名<input id="newUserName" required maxlength="40" /></label><label class="user-form-wide">邮箱<input id="newUserEmail" type="email" required maxlength="100" /></label><label>角色<select id="newUserRole"><option value="user">用户</option><option value="admin">管理员</option></select></label><label>分组<input id="newUserGroup" value="default" required maxlength="32" /></label><label class="user-form-wide">总额度（元）<input id="newUserQuota" type="number" value="6730000" min="0" max="1000000000" step="0.01" required /></label></div><div id="userError" role="alert"></div><div class="user-dialog-foot"><button type="button" class="btn-light" id="userCancel">取消</button><button type="submit" class="btn-dark">保存用户</button></div></form></dialog><dialog class="key-manage-dialog" id="keyManageDialog"><div class="key-manage-head"><div><div class="eyebrow">该用户的 API Key</div><h2 id="keyManageTitle">API Key</h2><p id="keyManageMeta"></p></div><button type="button" class="key-manage-close" id="keyManageClose" aria-label="关闭">&times;</button></div><div class="key-summary"><div><strong id="keyTotal">0</strong><span>创建的 Key</span></div><div><strong id="keyActive">0</strong><span>启用中</span></div><div><strong id="keyMember">0</strong><span>作为成员参与</span></div><button class="btn-dark" id="keyCreate">&plus; 去 API Key 页创建</button></div><div class="key-scope"><p>只读汇总：<b>创建人</b>负责 Key 的配置、成员与撤销；<b>项目成员</b>可使用但不能修改。权限调整统一在 API Key 页完成。</p><div class="key-scope-tools"><label class="key-manage-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="keyManageSearch" placeholder="搜索 Key 名称" aria-label="搜索 Key" /></label><div class="key-manage-filter" role="tablist" aria-label="Key 范围"><button type="button" class="active" data-keytab="all" role="tab" aria-selected="true">全部</button><button type="button" data-keytab="owner" role="tab" aria-selected="false">他创建的</button><button type="button" data-keytab="member" role="tab" aria-selected="false">他参与的</button></div></div></div><div class="key-manage-table"><div class="key-manage-table-head" aria-hidden="true"><span>名称</span><span>场景</span><span>本月调用</span><span>状态</span><span>角色</span><span>操作</span></div><div class="key-manage-list" id="keyManageList"></div></div><div class="key-manage-foot"><span>完整 Key 仅在创建或轮换时展示一次</span><button class="btn-light" id="keyManageDone">关闭</button></div></dialog>`;
  root.querySelector('.users-toolbar').append($('userAdd'));
  const money=v=>'¥'+Number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  const filtered=()=>users.filter(u=>[u.username,u.name,u.email].some(v=>String(v).toLowerCase().includes($('userSearch').value.trim().toLowerCase())) && (!$('userKeySearch')?.value.trim() || JSON.stringify(JSON.parse(localStorage.getItem('maas-api-v2')||'[]')).toLowerCase().includes($('userKeySearch').value.trim().toLowerCase()))&&($('userStatus').value==='all'||u.enabled===($('userStatus').value==='enabled'))&&($('userRole').value==='all'||u.role===$('userRole').value)).sort((a,b)=>desc?b.id-a.id:a.id-b.id);
  const current=()=>filtered().slice((page-1)*Number($('userSize').value),page*Number($('userSize').value));
  // 与 API Key 页共用数据源 maas-api-v2，避免两套 Key 数据
  const keyStore=()=>{try{const v=JSON.parse(localStorage.getItem('maas-api-v2')||'[]');return Array.isArray(v)?v.filter(k=>k&&typeof k.name==='string'):[];}catch{return [];}};
  const keyRole=(k,u)=>(k.creator===u.name||k.creator===u.username)?'owner':((k.admins||[]).some(a=>a===u.name||a===u.username)?'member':'');
  const keyLinks=u=>window.MaasUserKeys?window.MaasUserKeys.list(u):[];
  function render(){const list=filtered(),pages=Math.max(1,Math.ceil(list.length/Number($('userSize').value)));page=Math.min(page,pages);$('userRows').innerHTML=current().map(u=>`<tr><td><input type="checkbox" data-select="${u.id}" aria-label="选择 ${esc(u.username)}" ${selected.has(u.id)?'checked':''} /></td><td class="user-id">${u.id}</td><td><strong class="user-name">${esc(u.username)}</strong><small>${esc(u.name)}</small></td><td><span class="user-status ${u.enabled?'':'off'}">${u.enabled?'已启用':'已停用'}</span></td><td><div class="user-quota-values"><strong>${money(u.remaining)}</strong><span>${money(u.quota)}</span></div><div class="user-quota-line"><i style="width:${u.quota?Math.max(0,Math.min(100,u.remaining/u.quota*100)):0}%"></i></div></td><td><span class="model-tag">${esc(u.group)}</span></td><td>${u.role==='admin'?'管理员':'用户'}</td><td><div class="user-row-actions"><button data-edit="${u.id}">编辑</button><button data-keys="${u.id}" aria-label="查看 ${esc(u.username)} 关联的 Key">Key${keyLinks(u).length?` <em>${keyLinks(u).length}</em>`:''}</button><button class="user-more" data-more="${u.id}" aria-label="${esc(u.username)} 的更多操作" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button></div></td></tr>`).join('');$('userEmpty').hidden=list.length>0;$('userTotal').textContent=`共 ${list.length} 位用户`;$('userPage').textContent=`${page} / ${pages}`;$('userPrev').disabled=page===1;$('userNext').disabled=page===pages;$('userBulk').hidden=!selected.size;$('userSelected').textContent=`已选择 ${selected.size} 位用户`;const rows=current();$('userSelectAll').checked=rows.length>0&&rows.every(u=>selected.has(u.id));$('userSelectAll').indeterminate=!$('userSelectAll').checked&&rows.some(u=>selected.has(u.id));}
  window.renderUsers=render;
  for(const id of ['userSearch','userKeySearch','userStatus','userRole','userSize'])$(id).addEventListener(id==='userSearch'?'input':'change',()=>{page=1;render();});$('userPrev').onclick=()=>{page--;render();};$('userNext').onclick=()=>{page++;render();};$('userSort').onclick=()=>{desc=!desc;render();};$('userSelectAll').onchange=e=>{current().forEach(u=>e.target.checked?selected.add(u.id):selected.delete(u.id));render();};
  $('userRows').onchange=e=>{if(e.target.dataset.select){const id=Number(e.target.dataset.select);e.target.checked?selected.add(id):selected.delete(id);render();}};
  $('userRows').onclick=e=>{const b=e.target.closest('button');if(!b)return;const u=users.find(u=>u.id===Number(b.dataset.edit||b.dataset.keys||b.dataset.more));if(!u)return;if(b.dataset.keys){window.openUserKeys?.(u);return;}if(b.dataset.more){e.stopPropagation();toggleMoreMenu(b,u);return;}open(u);};
  /* 更多操作：三点菜单（禁用/启用、删除） */
  const moreMenu=document.createElement('div');moreMenu.className='user-more-menu';moreMenu.setAttribute('role','menu');moreMenu.hidden=true;document.body.appendChild(moreMenu);
  let moreAnchor=null;
  function closeMoreMenu(){if(moreMenu.hidden)return;moreMenu.hidden=true;moreAnchor?.setAttribute('aria-expanded','false');moreAnchor?.classList.remove('is-open');moreAnchor=null;}
  function toggleMoreMenu(btn,u){
    if(moreAnchor===btn){closeMoreMenu();return;}
    closeMoreMenu();
    moreMenu.innerHTML=`<button type="button" role="menuitem" data-menu-act="toggle"><svg viewBox="0 0 24 24" aria-hidden="true">${u.enabled?'<circle cx="12" cy="12" r="8.5"/><path d="M6 18 18 6"/>':'<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>'}</svg>${u.enabled?'禁用':'启用'}</button><button type="button" role="menuitem" class="danger" data-menu-act="delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V4.8h6V7"/><path d="M6.5 7l.9 12.2h9.2L17.5 7"/><path d="M10 11v5M14 11v5"/></svg>删除</button>`;
    moreMenu.dataset.user=u.id;
    moreMenu.hidden=false;
    const r=btn.getBoundingClientRect(),w=moreMenu.offsetWidth,h=moreMenu.offsetHeight;
    let left=Math.min(r.right-w,window.innerWidth-w-8);left=Math.max(8,left);
    let top=r.bottom+6;if(top+h>window.innerHeight-8)top=r.top-h-6;
    moreMenu.style.left=left+'px';moreMenu.style.top=top+'px';
    btn.setAttribute('aria-expanded','true');btn.classList.add('is-open');moreAnchor=btn;
    moreMenu.querySelector('button')?.focus();
  }
  moreMenu.onclick=e=>{const it=e.target.closest('[data-menu-act]');if(!it)return;const u=users.find(x=>x.id===Number(moreMenu.dataset.user));closeMoreMenu();if(!u)return;
    if(it.dataset.menuAct==='toggle'){u.enabled=!u.enabled;save();render();return;}
    if(it.dataset.menuAct==='delete')openDeleteUser(u);};
  moreMenu.onkeydown=e=>{const items=[...moreMenu.querySelectorAll('[role=menuitem]')],i=items.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length]?.focus();}else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length]?.focus();}else if(e.key==='Escape'){e.preventDefault();const a=moreAnchor;closeMoreMenu();a?.focus();}else if(e.key==='Tab'){closeMoreMenu();}};
  document.addEventListener('click',e=>{if(!moreMenu.hidden&&!moreMenu.contains(e.target)&&e.target!==moreAnchor&&!moreAnchor?.contains(e.target))closeMoreMenu();});
  window.addEventListener('resize',closeMoreMenu);window.addEventListener('scroll',closeMoreMenu,true);
  /* 删除确认 */
  if(!document.getElementById('userDeleteDialog'))document.body.insertAdjacentHTML('beforeend',`<dialog class="user-delete-dialog" id="userDeleteDialog"><form method="dialog" id="userDeleteForm"><h2>删除用户</h2><p id="userDeleteDesc"></p><div class="user-delete-warn">删除后该用户无法登录，其名下的 API Key 将同时失效，此操作不可恢复。</div><div class="user-delete-foot"><button type="button" class="btn-light" id="userDeleteCancel">取消</button><button type="submit" class="btn-danger">确认删除</button></div></form></dialog>`);
  const deleteDialog=document.getElementById('userDeleteDialog');
  function openDeleteUser(u){deleteDialog.dataset.user=u.id;const n=keyLinks(u).length;document.getElementById('userDeleteDesc').textContent=`即将删除 ${u.username}（${u.name}）${n?`，该用户名下有 ${n} 个 API Key`:''}。`;deleteDialog.showModal();}
  document.getElementById('userDeleteCancel').onclick=()=>deleteDialog.close();
  document.getElementById('userDeleteForm').onsubmit=e=>{e.preventDefault();const id=Number(deleteDialog.dataset.user),i=users.findIndex(x=>x.id===id);if(i>=0){users.splice(i,1);selected.delete(id);save();render();}deleteDialog.close();};
  for(const [id,value] of [['userBulkEnable',true],['userBulkDisable',false]])$(id).onclick=()=>{users.forEach(u=>{if(selected.has(u.id))u.enabled=value;});save();render();};
  function open(u){editing=u?.id??null;$('userForm').reset();$('userError').textContent='';$('userDialog').querySelector('h2').textContent=u?'编辑用户':'添加用户';if(u){for(const [id,key] of [['newUserUsername','username'],['newUserName','name'],['newUserEmail','email'],['newUserRole','role'],['newUserGroup','group'],['newUserQuota','quota']])$(id).value=u[key];}$('userDialog').showModal();}
  $('userAdd').onclick=()=>open();for(const id of ['userClose','userCancel'])$(id).onclick=()=>$('userDialog').close();
  $('userForm').onsubmit=e=>{e.preventDefault();const username=$('newUserUsername').value.trim(),name=$('newUserName').value.trim(),email=$('newUserEmail').value.trim(),group=$('newUserGroup').value.trim(),quota=Number($('newUserQuota').value);if(!username||!name||!group){$('userError').textContent='请填写用户名、姓名和分组。';return;}if(users.some(u=>u.id!==editing&&(u.username.toLowerCase()===username.toLowerCase()||u.email.toLowerCase()===email.toLowerCase()))){$('userError').textContent='用户名或邮箱已存在，请使用其他信息。';return;}const values={username,name,email,group,quota,role:$('newUserRole').value};if(editing!==null){const u=users.find(u=>u.id===editing),spent=u.quota-u.remaining;Object.assign(u,values,{remaining:Math.max(0,quota-spent)});}else users.push({...values,id:Math.max(0,...users.map(u=>u.id))+1,remaining:quota,enabled:true,invited:0,income:0});save();$('userDialog').close();render();};
  // ===== 该用户的 API Key（只读汇总，写操作统一回 API Key 页） =====
  let keyTab='all',keyOwner=null;
  const toast=msg=>{let el=document.querySelector('.key-manage-toast');if(!el){el=document.createElement('div');el.className='key-manage-toast';document.body.appendChild(el);}el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200);};
  const gotoApiKeys=()=>{document.querySelectorAll('.nav-item').forEach(item=>{if(item.textContent.trim()==='API 密钥')item.click();});};
  function openKeyManager(u){
    keyOwner=u;keyTab='all';
    const d=$('keyManageDialog');
    $('keyManageTitle').textContent=`${u.username} 的 API Key`;
    $('keyManageMeta').textContent=`${u.name} · ${u.role==='admin'?'管理员':'用户'} · ${u.email}${u.enabled?'':' · 账号已停用'}`;
    $('keyManageSearch').value='';
    d.querySelectorAll('[data-keytab]').forEach(b=>{const on=b.dataset.keytab==='all';b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
    renderKeys();d.showModal();
  }
  function renderKeys(){
    const u=keyOwner;if(!u)return;
    const all=keyStore(),q=($('keyManageSearch').value||'').trim().toLowerCase();
    const linked=all.filter(k=>keyRole(k,u));
    const list=linked.filter(k=>(keyTab==='all'||keyRole(k,u)===keyTab)&&(!q||k.name.toLowerCase().includes(q)));
    $('keyTotal').textContent=linked.filter(k=>keyRole(k,u)==='owner').length;
    $('keyActive').textContent=linked.filter(k=>k.active!==false).length;
    $('keyMember').textContent=linked.filter(k=>keyRole(k,u)==='member').length;
    $('keyManageList').innerHTML=list.length?list.map(k=>{
      const role=keyRole(k,u),isOwner=role==='owner';
      return `<div class="key-manage-row" data-key="${esc(k.id??k.name)}"><div class="key-main"><strong>${esc(k.name)}</strong><code>${esc(k.masked||'sk-••••••••')}</code></div><span class="key-scene ${k.scene==='business'?'business':''}">${k.scene==='business'?'业务':'办公'}</span><div class="key-stat"><b>${(k.calls||0).toLocaleString()} 次</b><small>${esc(k.cost||'¥0.00')}</small></div><span class="status ${k.active===false?'off':''}"><i></i>${k.active===false?'已停用':'启用'}</span><span class="key-role ${isOwner?'owner':''}">${isOwner?'创建人 · 可管理':'项目成员 · 只读'}</span><div class="key-ops"><button type="button" data-keyact="detail">详情</button>${isOwner?'<button type="button" data-keyact="toggle">'+(k.active===false?'启用':'停用')+'</button><button type="button" data-keyact="config">配置</button>':'<button type="button" data-keyact="leave">退出项目</button>'}</div></div>`;
    }).join(''):`<div class="key-manage-empty">${linked.length?'没有匹配的 Key':'该用户还没有关联任何 Key'}</div>`;
  }
  $('keyManageSearch').addEventListener('input',renderKeys);
  $('keyManageDialog').querySelectorAll('[data-keytab]').forEach(b=>b.onclick=()=>{keyTab=b.dataset.keytab;$('keyManageDialog').querySelectorAll('[data-keytab]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-selected',String(on));});renderKeys();});
  const saveKeys=list=>{try{localStorage.setItem('maas-api-v2',JSON.stringify(list));}catch{}};
  $('keyManageList').onclick=e=>{
    const btn=e.target.closest('[data-keyact]');if(!btn)return;
    const row=btn.closest('.key-manage-row'),keyId=row?.dataset.key,u=keyOwner,all=keyStore();
    const k=all.find(x=>String(x.id??x.name)===keyId);if(!k)return;
    if(btn.dataset.keyact==='detail'){k.full?toast(`完整 Key：${k.full}`):toast('完整 Key 不会再次展示');return;}
    if(btn.dataset.keyact==='toggle'){k.active=k.active===false;saveKeys(all);renderKeys();render();toast(k.active?'Key 已启用':'Key 已停用');return;}
    if(btn.dataset.keyact==='config'){$('keyManageDialog').close();gotoApiKeys();toast('已跳转 API Key 页，可在行内编辑该 Key 配置');return;}
    if(btn.dataset.keyact==='leave'){
      if(!confirm(`将 ${u.name} 移出「${k.name}」的项目成员？`))return;
      k.admins=(k.admins||[]).filter(a=>a!==u.name&&a!==u.username);
      saveKeys(all);renderKeys();render();toast('已移出该项目');
    }
  };
  $('keyManageClose').onclick=$('keyManageDone').onclick=()=>$('keyManageDialog').close();
  $('keyCreate').onclick=()=>{$('keyManageDialog').close();gotoApiKeys();toast('已跳转 API Key 页，可在那里新建并分享给该用户');};
  render();
})();
