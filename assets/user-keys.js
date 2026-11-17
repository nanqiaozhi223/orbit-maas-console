(() => {
  const root = document.querySelector('#userKeysPage');
  if (!root) return;

  const $ = id => root.querySelector('#' + id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = v => '¥' + Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const STORE = 'maas-user-keys';

  /* ============ 数据 ============ */
  const seedKeys = () => ([
    { id: 'k-101', ownerId: 774, name: '研发办公助手', masked: 'sk-••••82a1', scene: 'office', route: 'smart', model: '全部模型', poolSummary: 'Claude Sonnet 5，Gemini Flash，GPT-5.4 Mini', preference: 'balanced', status: 'active', cost: 128.5, calls: 6420, lastCall: '11-16 10:35', createdAt: '2026-09-12 10:24', expiresAt: '2026-12-31', rpm: 600, tpm: 200000, quota: null },
    { id: 'k-102', ownerId: 774, name: '代码测试项目', masked: 'sk-••••39df', scene: 'business', route: 'locked', model: 'GLM-5.3 自建', poolSummary: '', preference: 'latency', status: 'active', cost: 562.0, calls: 2380, lastCall: '11-16 09:28', createdAt: '2026-08-30 15:02', expiresAt: '—', rpm: 1200, tpm: 400000, quota: null },
    { id: 'k-103', ownerId: 774, name: '知识库问答', masked: 'sk-••••c7b2', scene: 'office', route: 'smart', model: '全部模型', poolSummary: 'Claude Haiku 4.5，Gemini Flash', preference: 'quality', status: 'active', cost: 85.6, calls: 1740, lastCall: '11-15 16:40', createdAt: '2026-10-06 09:11', expiresAt: '2026-12-31', rpm: 600, tpm: 200000, quota: 2000 },
    { id: 'k-104', ownerId: 774, name: '历史测试 Key', masked: 'sk-••••9c14', scene: 'business', route: 'locked', model: 'Qwen3 自建', poolSummary: '', preference: 'balanced', status: 'disabled', cost: 16.2, calls: 320, lastCall: '11-08 14:10', createdAt: '2026-07-18 11:45', expiresAt: '2026-11-01', rpm: 600, tpm: 200000, quota: null },
    { id: 'k-201', ownerId: 766, name: 'AIM-运维-智算平台', masked: 'sk-••••9k2m', scene: 'office', route: 'smart', model: '全部模型', poolSummary: '全部模型 · 智能均衡', preference: 'balanced', status: 'active', cost: 0, calls: 0, lastCall: '—', createdAt: '2026-10-26 09:40', expiresAt: '2026-12-31', rpm: 600, tpm: 200000, quota: null },
    { id: 'k-202', ownerId: 766, name: '办公助手', masked: 'sk-••••4x9q', scene: 'office', route: 'smart', model: '全部模型', poolSummary: 'Claude Sonnet 5，Gemini Flash，Claude Haiku 4.5', preference: 'balanced', status: 'active', cost: 4.71, calls: 315, lastCall: '11-16 09:12', createdAt: '2026-10-08 14:20', expiresAt: '2026-12-31', rpm: 600, tpm: 200000, quota: null },
    { id: 'k-203', ownerId: 766, name: '业务代码服务', masked: 'sk-••••7n2a', scene: 'business', route: 'locked', model: 'Claude Sonnet 5', poolSummary: '', preference: 'latency', status: 'active', cost: 800.0, calls: 862, lastCall: '11-15 22:08', createdAt: '2026-09-26 10:05', expiresAt: '—', rpm: 1200, tpm: 400000, quota: null },
    { id: 'k-301', ownerId: 771, name: '数据同步作业', masked: 'sk-••••5b8f', scene: 'business', route: 'locked', model: 'DeepSeek V4 自建', poolSummary: '', preference: 'latency', status: 'active', cost: 214.3, calls: 1180, lastCall: '11-16 08:40', createdAt: '2026-09-02 16:30', expiresAt: '—', rpm: 900, tpm: 300000, quota: null },
    { id: 'k-401', ownerId: 773, name: '本地调试 Key', masked: 'sk-••••2d7c', scene: 'office', route: 'smart', model: '全部模型', poolSummary: 'Gemini Flash', preference: 'speed', status: 'expired', cost: 32.4, calls: 210, lastCall: '10-21 19:02', createdAt: '2026-06-11 09:00', expiresAt: '2026-10-31', rpm: 300, tpm: 120000, quota: 500 }
  ]);

  let db = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    db = Array.isArray(saved) && saved.length ? saved : seedKeys();
  } catch { db = seedKeys(); }
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch {} };
  persist();

  const keysOf = u => db.filter(k => Number(k.ownerId) === Number(u.id));
  const keyOf = id => db.find(k => k.id === id);
  const isActive = k => k.status === 'active';
  const statusText = s => (s === 'active' ? '启用中' : s === 'expired' ? '已过期' : '已停用');
  const statusClass = s => (s === 'active' ? '' : s === 'expired' ? 'expired' : 'off');

  /* ============ 对外接口 ============ */
  window.MaasUserKeys = { count: u => keysOf(u).length, list: u => keysOf(u) };

  /* ============ 视图状态 ============ */
  let view = { user: null, mode: 'list', keyId: null, tab: 'basic', page: 1, size: 20, q: '', scene: 'all', status: 'all' };
  const selected = new Set();

  /* ============ 骨架 ============ */
  root.innerHTML = `
    <div class="uk-page" id="ukApp"></div>
    <dialog class="uk-dialog uk-detail-dialog" id="ukDetailDialog"><div id="ukDdContent"></div></dialog>
    <dialog class="uk-dialog" id="ukRevokeDialog"><form method="dialog" id="ukRevokeForm">
      <h2>撤销 API Key</h2><p id="ukRevokeDesc"></p>
      <div class="uk-warn">撤销后该 Key 立即失效且<b>无法恢复</b>，所有使用它的服务会中断。请确认影响范围后再操作。</div>
      <label for="ukRevokeInput">输入 Key 名称以确认：<input id="ukRevokeInput" autocomplete="off" /></label>
      <p class="uk-error" id="ukRevokeError" hidden></p>
      <div class="uk-dialog-foot"><button type="button" class="btn-light" data-close="ukRevokeDialog">取消</button><button type="submit" class="btn-dark">确认撤销</button></div>
    </form></dialog>
    <dialog class="uk-dialog" id="ukRenameDialog"><form method="dialog" id="ukRenameForm">
      <h2>编辑 Key 名称</h2><p>名称仅用于识别，不影响调用。长度 2–40 个字符。</p>
      <label for="ukRenameInput">Key 名称<input id="ukRenameInput" maxlength="40" autocomplete="off" /></label>
      <p class="uk-error" id="ukRenameError" hidden></p>
      <div class="uk-dialog-foot"><button type="button" class="btn-light" data-close="ukRenameDialog">取消</button><button type="submit" class="btn-dark">保存</button></div>
    </form></dialog>
    <dialog class="uk-dialog" id="ukResultDialog"><form method="dialog">
      <h2 id="ukResultTitle">操作结果</h2><div id="ukResultBody"></div>
      <div class="uk-dialog-foot"><button type="submit" class="btn-dark">知道了</button></div>
    </form></dialog>
    <div class="uk-toast" id="ukToast"></div>`;

  const toast = msg => { const el = $('ukToast'); el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200); };
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $(b.dataset.close).close());

  /* ============ 页面切换 ============ */
  function activate(page) {
    document.querySelectorAll('.page-view').forEach(x => x.classList.toggle('active', x === page));
    document.querySelectorAll('.nav-item,.nav-subitem').forEach(x => { x.classList.remove('active'); x.removeAttribute('aria-current'); });
    const sub = document.querySelector('.nav-subitem[data-user-view="list"]');
    sub?.classList.add('active');
    const parent = document.querySelector('#userNavigation');
    if (parent) { parent.classList.add('active', 'has-active-child'); parent.setAttribute('aria-expanded', 'true'); }
    const menu = document.querySelector('#userNavSubmenu'); if (menu) menu.hidden = false;
  }

  window.openUserKeys = user => {
    view = { user, mode: 'list', keyId: null, tab: 'basic', page: 1, size: 20, q: '', scene: 'all', status: 'all' };
    selected.clear();
    activate(root);
    render();
    window.scrollTo({ top: 0 });
  };

  const backToList = () => { window.openUserKeys = window.openUserKeys; };
  function goList() {
    view.mode = 'list'; view.keyId = null; view.tab = 'basic'; selected.clear(); render();
  }

  /* ============ 渲染 ============ */
  function render() {
    const app = $('ukApp');
    if (!view.user) { app.innerHTML = '<div class="uk-empty"><strong>未选择用户</strong><span>请从用户列表进入。</span></div>'; return; }
    app.innerHTML = listHTML();
    bind();
  }

  function crumb() {
    return `<nav class="uk-crumb" aria-label="面包屑">
      <button type="button" data-nav="users">用户管理</button><i>/</i>
      <button type="button" data-nav="users">用户列表</button><i>/</i>
      <span aria-current="page">Key 管理</span>
    </nav>`;
  }

  function listHTML() {
    const u = view.user;
    const all = keysOf(u);
    const active = all.filter(isActive).length;
    const disabled = all.filter(k => k.status === 'disabled').length;
    const cost = all.reduce((s, k) => s + Number(k.cost || 0), 0);

    let list = all.filter(k => {
      const q = view.q.trim().toLowerCase();
      return (!q || k.name.toLowerCase().includes(q) || k.masked.toLowerCase().includes(q))
        && (view.scene === 'all' || k.scene === view.scene)
        && (view.status === 'all' || k.status === view.status);
    }).sort((a, b) => String(b.lastCall).localeCompare(String(a.lastCall)));

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / view.size));
    view.page = Math.min(view.page, pages);
    const rows = list.slice((view.page - 1) * view.size, view.page * view.size);

    return `${crumb()}
    <div class="uk-head">
      <div><h1>API Key 管理</h1><p>管理用户创建的 API Key、调用权限与使用情况</p></div>
      <div class="uk-head-actions"></div>
    </div>
    <section class="uk-user-card">
      <div class="uk-avatar">${esc((u.name || u.username).slice(0, 1))}</div>
      <div class="uk-user-main">
        <strong>${esc(u.username)}（${esc(u.name)}）</strong>
        <div><span>用户 ID：<b>${esc(u.id)}</b></span><span>角色：<b>${u.role === 'admin' ? '管理员' : '普通用户'}</b></span><span>状态：<b>${u.enabled ? '已启用' : '已停用'}</b></span><span>分组：<b>${esc(u.group || 'default')}</b></span></div>
      </div>
      <div class="uk-quota"><span>用户剩余额度 / 总额度</span><strong>${money(u.remaining)} / ${money(u.quota)}</strong><small>仅业务 Key 消耗计入该用户配额</small></div>
    </section>
    <div class="uk-stats">
      <div class="uk-stat"><span>Key 总数</span><strong>${all.length}</strong><small>该用户创建的全部 Key</small></div>
      <div class="uk-stat"><span>启用中</span><strong>${active}</strong><small>允许正常调用</small></div>
      <div class="uk-stat"><span>已停用</span><strong>${disabled}</strong></div>
      <div class="uk-stat"><span>本月消耗</span><strong>${money(cost)}</strong><small>全部 Key 累计费用</small></div>
    </div>
    <div class="uk-toolbar">
      <label class="uk-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input type="search" id="ukSearch" placeholder="搜索 Key 名称或标识" aria-label="搜索 Key" value="${esc(view.q)}" /></label>
      <select class="uk-select" id="ukScene" aria-label="使用场景">
        <option value="all"${view.scene === 'all' ? ' selected' : ''}>全部场景</option>
        <option value="office"${view.scene === 'office' ? ' selected' : ''}>办公</option>
        <option value="business"${view.scene === 'business' ? ' selected' : ''}>业务</option>
      </select>
      <select class="uk-select" id="ukStatus" aria-label="Key 状态">
        <option value="all"${view.status === 'all' ? ' selected' : ''}>全部状态</option>
        <option value="active"${view.status === 'active' ? ' selected' : ''}>启用中</option>
        <option value="disabled"${view.status === 'disabled' ? ' selected' : ''}>已停用</option>
        <option value="expired"${view.status === 'expired' ? ' selected' : ''}>已过期</option>
      </select>
      <button type="button" class="btn-light" id="ukReset">重置</button><button type="button" class="btn-dark" id="ukApply">确认</button>
      <span class="uk-spacer"></span>
      <div class="uk-batch"${selected.size ? '' : ' hidden'}>已选择 <b>${selected.size}</b> 项 <button type="button" class="btn-light" id="ukBatchDisable">批量停用</button></div>
    </div>
    <section class="uk-table-card">
      <div class="uk-table-wrap">
        <table class="uk-table">
          <thead><tr>
            <th><input type="checkbox" id="ukSelectAll" aria-label="全选当前页" ${rows.length && rows.every(k => selected.has(k.id)) ? 'checked' : ''} /></th>
            <th>Key 名称</th><th>使用场景</th><th>模型配置</th><th>RPM</th><th>状态</th><th>本月消耗</th><th>最近调用</th><th>操作</th>
          </tr></thead>
          <tbody>${rows.map(rowHTML).join('')}</tbody>
        </table>
        ${total ? '' : '<div class="uk-empty"><strong>没有匹配的 Key</strong><span>调整搜索或筛选条件后再试。</span></div>'}
      </div>
      <div class="uk-pager">
        <span>共 ${total} 条${selected.size ? ` · 已选择 ${selected.size} 项` : ''} · 演示数据</span>
        <label>每页行数<select id="ukSize">${[20, 50, 100].map(n => `<option value="${n}"${view.size === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="uk-pager-controls"><button type="button" id="ukPrev" aria-label="上一页"${view.page === 1 ? ' disabled' : ''}>‹</button><span>${view.page} / ${pages}</span><button type="button" id="ukNext" aria-label="下一页"${view.page === pages ? ' disabled' : ''}>›</button></div>
      </div>
    </section>`;
  }

  function rowHTML(k) {
    const model = k.route === 'smart' ? '智能路由' : k.model;
    const sub = k.route === 'smart' ? (k.poolSummary || '按智能策略选择模型') : '指定模型';
    const st = k.status === 'active' ? '启用中' : (k.status === 'expired' ? '已过期' : '已停用');
    const stCls = k.status === 'active' ? '' : (k.status === 'expired' ? 'expired' : 'off');
    return `<tr data-row="${esc(k.id)}">
      <td><input type="checkbox" data-select="${esc(k.id)}" aria-label="选择 ${esc(k.name)}" ${selected.has(k.id) ? 'checked' : ''} /></td>
      <td class="uk-key-name"><strong>${esc(k.name)}</strong><code>${esc(k.masked)}</code></td>
      <td><span class="uk-tag ${k.scene === 'business' ? 'business' : 'office'}">${k.scene === 'business' ? '业务' : '办公'}</span></td>
      <td class="uk-model"><b>${esc(model)}</b><small>${esc(sub)}</small></td>
      <td class="uk-num uk-rpm-cell" data-rpm-cell="${esc(k.id)}"><span class="uk-rpm-val">${Number(k.rpm || 0)}</span><button type="button" class="uk-edit-icon" data-rpm-edit="${esc(k.id)}" aria-label="修改 ${esc(k.name)} 的 RPM"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg></button></td>
      <td><span class="uk-status ${stCls}"><em class="uk-dot"></em>${st}</span></td>
      <td class="uk-num">${money(k.cost)}</td>
      <td class="uk-num">${esc(k.lastCall ? `2026-${k.lastCall}` : '—')}</td>
      <td><div class="uk-row-actions"><button type="button" data-detail="${esc(k.id)}">详情</button><button type="button" class="uk-more" data-more-key="${esc(k.id)}" aria-label="更多操作">•••</button></div></td>
    </tr>`;
  }

  function detailContent(k) {
    const tabs = [['config', '基本信息与配置'], ['usage', '使用统计'], ['audit', '操作日志']];
    const st = k.status === 'active' ? '启用中' : (k.status === 'expired' ? '已过期' : '已停用');
    const stCls = k.status === 'active' ? '' : (k.status === 'expired' ? 'expired' : 'off');
    return `<div class="uk-dd-head">
      <div class="uk-dd-title">
        <div class="uk-dd-eyebrow">用户 API Key</div>
        <h2>${esc(k.name)}</h2>
      </div>
      <button type="button" class="uk-dd-close" id="ukDdClose" aria-label="关闭">×</button>
    </div>
    <div class="uk-tabs" role="tablist" aria-label="Key 详情">${tabs.map(([id, label]) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${view.tab === id}" class="${view.tab === id ? 'active' : ''}">${label}</button>`).join('')}</div>
    <div class="uk-dd-body">${tabHTML(k)}</div>`;
  }

  function tabHTML(k) {
    if (view.tab === 'config') return configTab(k);
    if (view.tab === 'usage') return usageTab(k);
    if (view.tab === 'audit') return auditTab(k);
    return configTab(k);
  }

  function configTab(k) {
    const office = k.scene === 'office';
    const prefText = { balanced: '均衡', speed: '速度优先', latency: '延迟优先', quality: '质量优先' }[k.preference] || '均衡';
    return `<h2 class="uk-section-title">基本信息与配置</h2>
    <dl class="uk-dl uk-dl-compact">
      <div><dt>Key 名称</dt><dd>${esc(k.name)}</dd></div><div><dt>API Key</dt><dd><code>${esc(k.masked)}</code></dd></div>
      <div><dt>使用场景</dt><dd>${k.scene === 'business' ? '业务' : '办公'}</dd></div>
      <div><dt>创建时间</dt><dd>${esc(k.createdAt)}</dd></div>
      <div><dt>状态</dt><dd><span class="uk-status ${statusClass(k.status)}"><i></i>${statusText(k.status)}</span></dd></div><div><dt>路由模式</dt><dd>${k.route === 'smart' ? '智能路由' : esc(k.model)}</dd></div><div><dt>模型</dt><dd>${esc(k.route === 'smart' ? (k.poolSummary || '智能路由模型池') : k.model)}</dd></div><div><dt>渠道路由偏好</dt><dd>${prefText}</dd></div><div><dt>模型路由偏好</dt><dd>跟随平台设置</dd></div>
      
    </dl>
    <h3 class="uk-section-title">可编辑配置</h3>
    <form class="uk-form" id="ukConfigForm" novalidate>
      ${!office ? `<label>Key 管理员<input name="keyOwner" value="${esc(k.owner || k.creator || '黎彤')}" placeholder="选择 Key 管理员" /></label><label>添加项目成员<input name="shareMembers" value="${esc((k.admins || []).join('、'))}" placeholder="选择项目成员" /></label>` : ''}
      <label>RPM<input type="number" name="rpm" min="1" max="100000" value="${Number(k.rpm || 600)}" /></label>
      <div class="uk-form-foot uk-wide"><button type="button" class="btn-light" data-act="reset-config">重置</button><button type="button" class="btn-dark" data-act="save-config">保存配置</button></div>
    </form>`;
  }

  function usageTab(k) {
    const calls = Number(k.calls || 0);
    const success = calls ? 99.2 : 0;
    const tokens = Math.round(calls * 1.35);
    const trend = [42, 58, 51, 73, 66, 88, 74, 95, 81, 90, 67, 78];
    const models = [
      { name: k.route === 'smart' ? 'Claude Sonnet 5' : k.model, share: 52, cost: Number(k.cost) * 0.52 },
      { name: k.route === 'smart' ? 'Gemini Flash' : '同模型冗余渠道', share: 31, cost: Number(k.cost) * 0.31 },
      { name: k.route === 'smart' ? 'Claude Haiku 4.5' : '其他', share: 17, cost: Number(k.cost) * 0.17 }
    ];
    const records = [
      ['11-16 10:35', models[0].name, '渠道-主', '成功', '842ms', '¥0.86'],
      ['11-16 10:31', models[1].name, '渠道-备', '成功', '1.2s', '¥0.31'],
      ['11-16 09:58', models[0].name, '渠道-主', '成功', '910ms', '¥0.74'],
      ['11-15 22:12', models[2].name, '渠道-备', '限流 429', '—', '¥0.00'],
      ['11-15 18:40', models[0].name, '渠道-主', '成功', '1.4s', '¥1.02']
    ];
    return `<div class="uk-metrics">
      <div class="uk-stat"><span>累计调用次数</span><strong>${calls.toLocaleString()}</strong><small>自创建以来</small></div>
      <div class="uk-stat"><span>本月 Token 消耗</span><strong>${tokens.toLocaleString()}</strong><small>输入 + 输出合计</small></div>
      <div class="uk-stat"><span>本月费用</span><strong>${money(k.cost)}</strong><small>按实际调用计费</small></div>
      <div class="uk-stat"><span>调用成功率</span><strong>${success}%</strong><small>最近 30 天</small></div>
    </div>
    <h2 class="uk-section-title">调用趋势（近 12 天）</h2>
    <div class="uk-chart" role="img" aria-label="近 12 天调用量柱状图">${trend.map((v, i) => `<div><i style="height:${v}%"></i><span>${i + 5}</span></div>`).join('')}</div>
    <h2 class="uk-section-title">按模型分布</h2>
    <table class="uk-table" style="min-width:0"><thead><tr><th>模型</th><th>占比</th><th>费用</th></tr></thead><tbody>${models.map(m => `<tr><td>${esc(m.name)}</td><td class="uk-num">${m.share}%</td><td class="uk-num">${money(m.cost)}</td></tr>`).join('')}</tbody></table>
    <h2 class="uk-section-title">最近调用记录</h2>
    <table class="uk-table" style="min-width:0"><thead><tr><th>时间</th><th>模型</th><th>渠道</th><th>状态</th><th>延迟</th><th>费用</th></tr></thead><tbody>${records.map(r => `<tr>${r.map((c, i) => `<td${i ? ' class="uk-num"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function auditTab(k) {
    const logs = (k.logs || []).concat([
      { at: k.createdAt, who: '系统', act: '创建 Key', detail: '创建后仅展示一次完整密钥', result: '成功' },
      { at: k.createdAt, who: view.user.name, act: '首次使用', detail: '完成首次调用鉴权', result: '成功' },
      { at: '2026-10-12 14:20', who: '平台管理员', act: '修改配置', detail: `RPM 由 300 调整为 ${Number(k.rpm || 600)}`, result: '成功' },
      { at: '2026-11-06 09:05', who: view.user.name, act: k.status === 'disabled' ? '停用 Key' : '启用 Key', detail: '用户自助操作', result: '成功' }
    ]).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return `<ul class="uk-log">${logs.map(l => `<li><time>${esc(l.at)}</time><span>${esc(l.who)}</span><div><b>${esc(l.act)}</b><small>${esc(l.detail)} · ${esc(l.result)}</small></div></li>`).join('')}</ul>`;
  }

  /* ============ 事件 ============ */
  function bind() {
    const app = $('ukApp');
    app.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => {
      if (b.dataset.nav === 'users') document.querySelector('.nav-subitem[data-user-view="list"]')?.click();
    });

    const search = $('ukSearch');
    if (search && view._focusSearch) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }
    search?.addEventListener('input', e => { view.q = e.target.value; view._focusSearch = true; view.page = 1; render(); });
    $('ukSearchBtn')?.addEventListener('click', () => { view.q = search.value.trim(); view.page = 1; render(); });
    $('ukScene')?.addEventListener('change', e => { view.scene = e.target.value; view.page = 1; render(); });
    $('ukStatus')?.addEventListener('change', e => { view.status = e.target.value; view.page = 1; render(); });
    $('ukReset')?.addEventListener('click', () => { Object.assign(view, { q: '', scene: 'all', status: 'all', page: 1 }); selected.clear(); render(); });
    $('ukApply')?.addEventListener('click', () => { view.q = $('ukSearch')?.value.trim() || ''; view.scene = $('ukScene')?.value || 'all'; view.status = $('ukStatus')?.value || 'all'; view.page = 1; render(); });
    $('ukApply')?.addEventListener('click', () => { view.page = 1; render(); });
    $('ukSize')?.addEventListener('change', e => { view.size = Number(e.target.value); view.page = 1; render(); });
    $('ukPrev')?.addEventListener('click', () => { view.page--; render(); });
    $('ukNext')?.addEventListener('click', () => { view.page++; render(); });
    $('ukSelectAll')?.addEventListener('change', e => {
      pageKeys().map(k => k.id).forEach(id => e.target.checked ? selected.add(id) : selected.delete(id));
      render();
    });
    $('ukBatchDisable')?.addEventListener('click', () => {
      const targets = db.filter(k => selected.has(k.id) && isActive(k));
      if (!targets.length) { toast('所选 Key 中没有可停用的项'); return; }
      targets.forEach(k => {
        k.status = 'disabled';
        k.logs = (k.logs || []).concat({ at: nowText(), who: '平台管理员', act: '批量停用', detail: '来自用户 Key 列表的批量操作', result: '成功' });
      });
      persist();
      const failed = selected.size - targets.length;
      selected.clear();
      render();
      $('ukResultTitle').textContent = '批量停用结果';
      $('ukResultBody').innerHTML = `<ul class="uk-log"><li><time>成功 ${targets.length} 项</time><span>—</span><div><b>${targets.map(t => esc(t.name)).join('、')}</b><small>Key 已立即停止接受新请求</small></div></li>${failed ? `<li><time>跳过 ${failed} 项</time><span>—</span><div><b>非启用状态</b><small>已停用或已过期的 Key 不会被重复处理</small></div></li>` : ''}</ul>`;
      $('ukResultDialog').showModal();
    });
    app.querySelectorAll('[data-select]').forEach(cb => cb.onchange = () => { cb.checked ? selected.add(cb.dataset.select) : selected.delete(cb.dataset.select); render(); });
    app.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => openDetail(b.dataset.detail));
    app.querySelectorAll('[data-more-key]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const existing = document.querySelector('.uk-row-menu[data-for="'+b.dataset.moreKey+'"]');
      document.querySelectorAll('.uk-row-menu').forEach(x => x.remove());
      if (existing) return;
      const k = keyOf(b.dataset.moreKey); if (!k) return;
      const menu = document.createElement('div'); menu.className = 'uk-row-menu';
      menu.dataset.for = b.dataset.moreKey;
      menu.innerHTML = `<button data-menu-act="toggle">${isActive(k) ? '禁用' : '启用'}</button><button data-menu-act="revoke">删除</button>`;
      document.body.appendChild(menu); const r = b.getBoundingClientRect(); menu.style.top = `${r.bottom + 4}px`; menu.style.left = `${Math.max(8, r.right - 110)}px`;
      menu.onclick = e => { const action = e.target.dataset.menuAct; if (action) act(action, k); menu.remove(); };
    });
    document.addEventListener('click', e => { if (!e.target.closest('.uk-more') && !e.target.closest('.uk-row-menu')) document.querySelectorAll('.uk-row-menu').forEach(x => x.remove()); }, { once: true });
    app.querySelectorAll('[data-rpm-edit]').forEach(btn => btn.onclick = () => {
      const cell = btn.closest('.uk-rpm-cell'); const k = keyOf(btn.dataset.rpmEdit);
      if (!cell || !k) return;
      const prev = Number(k.rpm || 0);
      cell.classList.add('is-editing');
      cell.innerHTML = `<span class="uk-rpm-edit"><input type="number" min="1" max="100000" value="${prev}" aria-label="RPM" /><button type="button" data-rpm-save aria-label="保存">✓</button><button type="button" data-rpm-cancel aria-label="取消">✕</button></span>`;
      const input = cell.querySelector('input');
      let done = false;
      const commit = () => {
        if (done) return; done = true;
        const v = Number(input.value);
        if (v > 0 && v !== prev) {
          k.rpm = v;
          k.logs = (k.logs || []).concat({ at: nowText(), who: '平台管理员', act: '修改 RPM', detail: `${prev} → ${v}`, result: '成功' });
          persist(); toast(`RPM 已更新为 ${v}`);
        }
        render();
      };
      const cancel = () => { if (done) return; done = true; render(); };
      cell.querySelector('[data-rpm-save]').onclick = e => { e.preventDefault(); commit(); };
      cell.querySelector('[data-rpm-cancel]').onclick = e => { e.preventDefault(); cancel(); };
      input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.preventDefault(); cancel(); } };
      input.onblur = () => setTimeout(() => { if (!done) commit(); }, 140);
      input.focus(); input.select();
    });
    app.querySelectorAll('[data-row-act]').forEach(b => b.onclick = () => { const k = keyOf(b.dataset.rowKey); if (k) act(b.dataset.rowAct, k); });
  }

  /* ============ 详情弹窗 ============ */
  function openDetail(id) {
    view.keyId = id; view.tab = 'config';
    renderDetail();
    const d = $('ukDetailDialog');
    if (!d.open) d.showModal();
  }

  function renderDetail() {
    const k = keyOf(view.keyId);
    const d = $('ukDetailDialog');
    if (!k) { if (d.open) d.close(); return; }
    $('ukDdContent').innerHTML = detailContent(k);
    bindDetail(k);
  }

  function bindDetail(k) {
    $('ukDdClose').onclick = () => $('ukDetailDialog').close();
    $('ukDetailDialog').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { view.tab = b.dataset.tab; renderDetail(); });
    $('ukDetailDialog').querySelectorAll('[data-act]').forEach(b => b.onclick = () => act(b.dataset.act, k));
    $('ukConfigForm')?.addEventListener('submit', e => { e.preventDefault(); saveConfig(k); });
    $('ukConfigForm')?.querySelector('[data-act="reset-config"]')?.addEventListener('click', () => renderDetail());
  }

  function pageKeys() {
    return keysOf(view.user).filter(k => {
      const q = view.q.trim().toLowerCase();
      return (!q || k.name.toLowerCase().includes(q) || k.masked.toLowerCase().includes(q))
        && (view.scene === 'all' || k.scene === view.scene)
        && (view.status === 'all' || k.status === view.status);
    }).sort((a, b) => String(b.lastCall).localeCompare(String(a.lastCall))).slice((view.page - 1) * view.size, view.page * view.size);
  }

  const nowText = () => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  function saveConfig(k) {
    const form = root.querySelector('#ukConfigForm');
    if (!form) return;
    const val = name => form.querySelector(`[name="${name}"]`)?.value ?? '';
    const rpm = Number(val('rpm')), tpm = Number(val('tpm') || k.tpm || 200000);
    if (!val('name').trim()) { toast('请填写 Key 名称'); return; }
    k.name = val('name').trim(); k.description = val('description').trim();
    if (k.scene === 'business') {
      k.owner = val('keyOwner').trim() || k.owner || k.creator || '黎彤';
      k.admins = val('shareMembers').split('、').map(x => x.trim()).filter(Boolean);
    }
    if (!(rpm > 0) || !(tpm > 0)) { toast('RPM / TPM 需为正整数'); return; }
    const quotaRaw = String(val('quota')).trim();
    if (quotaRaw !== '' && !(Number(quotaRaw) >= 0)) { toast('Key 独立上限需为非负数字'); return; }
    k.route = k.scene === 'office' ? (val('route') || k.route) : 'locked';
    k.preference = val('preference') || k.preference;
    k.rpm = rpm; k.tpm = tpm;
    k.quota = k.scene === 'office' && quotaRaw !== '' ? Number(quotaRaw) : null;
    k.logs = (k.logs || []).concat({ at: nowText(), who: '平台管理员', act: '修改配置', detail: `路由 ${k.route === 'smart' ? '智能' : '指定模型'} · ${rpm} RPM · ${tpm} TPM`, result: '成功' });
    persist(); renderDetail(); render(); toast('配置已保存');
  }

  function act(action, k) {
    if (action === 'save-config') { saveConfig(k); return; }
    if (action === 'reset-config') { render(); return; }
    if (action === 'toggle') {
      k.status = isActive(k) ? 'disabled' : 'active';
      k.logs = (k.logs || []).concat({ at: nowText(), who: '平台管理员', act: k.status === 'active' ? '启用 Key' : '停用 Key', detail: '状态切换后立即生效', result: '成功' });
      persist(); renderDetail(); render(); toast(k.status === 'active' ? 'Key 已启用' : 'Key 已停用，新请求将被拒绝');
      return;
    }
    if (action === 'rename') {
      $('ukRenameInput').value = k.name;
      $('ukRenameError').hidden = true;
      $('ukRenameDialog').dataset.key = k.id;
      $('ukRenameDialog').showModal();
      $('ukRenameInput').focus();
      return;
    }
    if (action === 'revoke') {
      $('ukRevokeDesc').textContent = `即将撤销「${k.name}」（${k.masked}）。`;
      $('ukRevokeInput').value = '';
      $('ukRevokeError').hidden = true;
      $('ukRevokeDialog').dataset.key = k.id;
      $('ukRevokeDialog').showModal();
      $('ukRevokeInput').focus();
    }
  }

  $('ukRenameForm').onsubmit = e => {
    e.preventDefault();
    const k = keyOf($('ukRenameDialog').dataset.key);
    const v = $('ukRenameInput').value.trim();
    if (!k) return $('ukRenameDialog').close();
    if (v.length < 2) { $('ukRenameError').textContent = '名称至少 2 个字符。'; $('ukRenameError').hidden = false; return; }
    if (db.some(x => x.ownerId === k.ownerId && x.id !== k.id && x.name === v)) { $('ukRenameError').textContent = '该用户下已存在同名 Key。'; $('ukRenameError').hidden = false; return; }
    const before = k.name;
    k.name = v;
    k.logs = (k.logs || []).concat({ at: nowText(), who: '平台管理员', act: '修改名称', detail: `${before} → ${v}`, result: '成功' });
    persist(); $('ukRenameDialog').close(); renderDetail(); render(); toast('名称已更新');
  };

  $('ukRevokeForm').onsubmit = e => {
    e.preventDefault();
    const k = keyOf($('ukRevokeDialog').dataset.key);
    if (!k) return $('ukRevokeDialog').close();
    const v = $('ukRevokeInput').value.trim();
    if (v !== k.name) { $('ukRevokeError').textContent = '名称不一致，请输入完整 Key 名称。'; $('ukRevokeError').hidden = false; return; }
    db = db.filter(x => x.id !== k.id);
    persist(); $('ukRevokeDialog').close(); $('ukDetailDialog').close(); view.keyId = null; render(); toast('Key 已撤销，无法恢复');
  };

  /* 初始占位 */
  render();
})();
