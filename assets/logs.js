(() => {
  const page = document.querySelector('#logsPage');
  if (!page) return;
  page.querySelector('.logs-filter-row select[aria-label="请求类型"]')?.closest('label').remove();
  const title = page.querySelector('.logs-title');
  const usage = document.createElement('div');
  usage.id = 'usageLogPanel';
  usage.setAttribute('role', 'tabpanel');
  usage.setAttribute('aria-labelledby', 'usageLogTab');
  [...page.children].filter(child => child !== title).forEach(child => usage.append(child));
  title.insertAdjacentHTML('afterend', `<div class="logs-tabs" role="tablist" aria-label="日志类型"><button id="usageLogTab" role="tab" aria-controls="usageLogPanel" aria-selected="true" tabindex="0">用量日志</button><button id="auditLogTab" role="tab" aria-controls="auditLogPanel" aria-selected="false" tabindex="-1">审计日志</button></div>`);
  page.append(usage);
  const audit = document.createElement('div');
  audit.id = 'auditLogPanel';
  audit.setAttribute('role', 'tabpanel');
  audit.setAttribute('aria-labelledby', 'auditLogTab');
  audit.hidden = true;
  audit.innerHTML = `<form class="audit-filter" aria-label="审计日志筛选">
      <div class="audit-filter-main"><label class="audit-range"><span class="sr-only">开始日期</span><input type="date" name="start" aria-label="开始日期"><span>至</span><input type="date" name="end" aria-label="结束日期"></label><label><span class="sr-only">分类</span><select name="category" aria-label="分类"><option value="">全部分类</option><option value="login">身份认证</option><option value="config">配置管理</option></select></label><label><span class="sr-only">请求 ID</span><input name="requestId" aria-label="请求 ID" placeholder="请求 ID"></label><div class="audit-actions"><button type="reset" class="btn-light">重置</button><button type="submit" class="btn-dark">搜索</button></div></div>
      <span class="audit-feedback" role="status" aria-live="polite"></span>
    </form>
    <section class="card audit-table-card"><div class="audit-table-wrap"><table class="audit-table"><thead><tr><th>时间</th><th>用户名</th><th>事件</th><th>IP</th><th>客户端</th><th>请求方法</th><th>路由</th><th>HTTP</th><th>结果</th><th>详情</th></tr></thead><tbody></tbody></table></div><div class="logs-pagination"><span class="logs-total" aria-live="polite"></span><label>每页行数 <select aria-label="审计日志每页行数"><option>20</option><option>50</option><option>100</option></select></label><button type="button" disabled aria-label="审计日志上一页">‹</button><span class="logs-page-label">1 / 1</span><button type="button" disabled aria-label="审计日志下一页">›</button></div></section>`;
  page.append(audit);
  const tabs = [...page.querySelectorAll('.logs-tabs [role=tab]')];
  function selectTab(tab) {
    tabs.forEach(item => { const selected = item === tab; item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
    usage.hidden = tab !== tabs[0];
    audit.hidden = tab !== tabs[1];
    title.querySelector('p').textContent = tab === tabs[0] ? '查看模型调用明细、响应状态与 Token 消耗' : '追踪登录与管理操作，查看事件详情与请求来源';
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (['ArrowLeft', 'ArrowRight'].includes(event.key)) next = tabs[1 - index];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[1];
      if (next) { event.preventDefault(); selectTab(next); next.focus(); }
    });
  });
  const records = [
    ['2026-10-23 12:48:10', '192.168.73.87', 'Windows NT 10.0; Win64; x64'],
    ['2026-10-22 18:12:06', '192.168.75.233', 'Macintosh; Intel Mac OS X 10_15_7'],
    ['2026-10-22 16:36:20', '192.168.75.115', 'Macintosh; Intel Mac OS X 10_15_7'],
    ['2026-10-22 15:31:11', '192.168.75.115', 'Macintosh; Intel Mac OS X 10_15_7'],
    ['2026-10-22 09:50:26', '192.168.60.125', 'Windows NT 10.0; Win64; x64'],
    ['2026-10-22 00:26:11', '192.168.32.25', 'Windows NT 10.0; Win64; x64'],
    ['2026-10-22 00:21:57', '192.168.32.25', 'Windows NT 10.0; Win64; x64']
  ].map(([time, ip, client], index) => ({ time, ip, client: `Mozilla/5.0 (${client}) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36`, user: 'admin', event: index === 2 ? '模型定价预览' : '登录成功（通过密码）', category: index === 2 ? 'config' : 'login', result: 'success', http: 200, requestId: `req_202610${index === 0 ? '23' : '22'}_${String(index + 1).padStart(6, '0')}`, method: 'POST', route: index === 2 ? '/api/option/model_pricing/preview' : '/api/user/login' }));
  const form = audit.querySelector('form');
  let applied = new FormData(form);
  function render() {
    const get = key => String(applied.get(key) || '').trim().toLowerCase();
    const filtered = records.filter(row => (!get('start') || row.time.slice(0,10) >= get('start')) && (!get('end') || row.time.slice(0,10) <= get('end')) && (!get('category') || row.category === get('category')) && row.requestId.toLowerCase().includes(get('requestId')));
    const body = audit.querySelector('tbody');
    body.replaceChildren();
    filtered.forEach(row => {
      const tr = document.createElement('tr');
      [row.time, row.user, row.event, row.ip, row.client, row.method, row.route].forEach((value,index) => { const td = document.createElement('td'); td.textContent = value; td.title = value; td.dataset.label = ['时间','用户名','事件','IP','客户端','请求方法','路由'][index]; tr.append(td); });
      const http = tr.insertCell(); http.textContent = row.http; http.dataset.label = 'HTTP';
      const result = tr.insertCell(); result.dataset.label = '结果';
      const status = document.createElement('span'); status.className = 'audit-result'; status.textContent = row.result === 'success' ? '成功' : '失败'; result.append(status);
      const action = tr.insertCell(); action.dataset.label = '详情';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'audit-detail-toggle'; button.textContent = '查看'; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', `查看 ${row.time} 的审计详情`);
      const detail = document.createElement('tr'); detail.hidden = true; detail.className = 'audit-detail-row'; detail.id = `audit-detail-${row.requestId}`; button.setAttribute('aria-controls', detail.id);
      const detailCell = detail.insertCell(); detailCell.colSpan = 10;
      const list = document.createElement('dl'); list.className = 'audit-detail-list';
      [['请求 ID',row.requestId],['HTTP',String(row.http)],['结果',status.textContent],['路由',row.route],['客户端',row.client]].forEach(([label,value]) => { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; list.append(dt,dd); });
      detailCell.append(list);
      button.addEventListener('click', () => { const expanded = button.getAttribute('aria-expanded') !== 'true'; button.setAttribute('aria-expanded', String(expanded)); button.textContent = expanded ? '收起' : '查看'; detail.hidden = !expanded; });
      action.append(button); body.append(tr,detail);
    });
    if (!filtered.length) { const tr = body.insertRow(); const td = tr.insertCell(); td.colSpan = 10; td.className = 'audit-empty'; td.textContent = '暂无匹配的审计日志，请调整筛选条件'; }
    audit.querySelector('.logs-total').textContent = `共 ${filtered.length} 条记录`;
    audit.querySelector('.logs-page-label').textContent = filtered.length ? '1 / 1' : '0 / 0';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    if (data.get('start') && data.get('end') && data.get('start') > data.get('end')) { audit.querySelector('.audit-feedback').textContent = '结束日期不能早于开始日期'; return; }
    applied = data; render(); audit.querySelector('.audit-feedback').textContent = '筛选已应用';
  });
  form.addEventListener('reset', () => { applied = new FormData(); render(); audit.querySelector('.audit-feedback').textContent = ''; });
  render();
})();
