(function () {
  let scope = document.querySelector('#usagePage');
  const usagePage = scope;
  usagePage.querySelector('#usageExportBtn')?.addEventListener('click', () => {
    const table = usagePage.querySelector('.usage-table');
    if (!table) return;
    const rows = [...table.rows].map(row => [...row.cells].map(cell => `"${cell.textContent.trim().replaceAll('"', '""')}"`).join(','));
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usage-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  usagePage.dataset.userScope = 'self';
  usagePage.querySelector('.usage-filter').insertAdjacentHTML('beforeend', '<div class="usage-user-filter" hidden><input type="search" aria-label="筛选用户名" placeholder="筛选用户名" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="usageUserMatches"><div id="usageUserMatches" class="usage-user-matches" role="listbox" hidden></div></div><label class="usage-department-filter" hidden><span class="sr-only">事业部</span><select aria-label="事业部"><option value="all">全部事业部</option><option value="engineering">研发事业部</option><option value="product">产品事业部</option><option value="operations">运营事业部</option></select></label><label class="usage-team-filter" hidden><span class="sr-only">部门</span><select aria-label="部门"><option value="all">全部部门</option><option value="platform">平台研发部</option><option value="algorithm">算法部</option><option value="product-design">产品设计部</option><option value="operations">运营部</option></select></label><div class="usage-chart-switch usage-user-scope" role="group" aria-label="用户范围"><button type="button" class="active" data-user-scope="self" aria-pressed="true">仅自己</button><button type="button" data-user-scope="all" aria-pressed="false">全部</button></div>');
  const userScope = usagePage.querySelector('.usage-user-scope');
  usagePage.querySelector('.usage-filter').prepend(userScope);
  userScope.after(usagePage.querySelector('#usageExportBtn'));
  userScope.insertAdjacentHTML('afterend', '<span class="usage-filter-break" aria-hidden="true"></span>');
  usagePage.querySelector('.usage-filter').insertAdjacentHTML('afterbegin', '<div class="usage-chart-switch usage-cost-scope" role="group" aria-label="费用类型"><button type="button" data-cost-scope="estimated" aria-pressed="false">预估费用</button><button type="button" class="active" data-cost-scope="actual" aria-pressed="true">实际费用</button></div>');
  usagePage.querySelectorAll('[data-cost-scope]').forEach(button => button.addEventListener('click', () => {
    usagePage.querySelectorAll('[data-cost-scope]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    usagePage.dataset.costScope = button.dataset.costScope;
    syncDateInputs(button.dataset.costScope);
    syncScopeCards();
    usagePage.dispatchEvent(new CustomEvent('usage-cost-scope-change', { bubbles: true, detail: { costScope: button.dataset.costScope } }));
  }));
  usagePage.dataset.costScope = 'actual';
  const userFilter = usagePage.querySelector('.usage-user-filter');
  const departmentFilter = usagePage.querySelector('.usage-department-filter');
  const teamFilter = usagePage.querySelector('.usage-team-filter');
  usagePage.querySelector('.usage-chart-card').insertAdjacentHTML('beforebegin', '<section class="card usage-department-card" hidden><div class="usage-section-head"><div><h2>事业部消耗金额</h2><p>按事业部汇总当前时间范围内的消耗金额</p></div><span class="usage-analysis-count">按消耗金额降序</span></div><div class="usage-department-chart" id="usageDepartmentChart"></div></section>');
  const departmentCard = usagePage.querySelector('.usage-department-card');
  const selfScopeCards = usagePage.querySelectorAll('.usage-analysis-card');
  const peakCard = usagePage.querySelector('.usage-peak-card');
  const spendCard = usagePage.querySelector('.usage-chart-card');
  const callAnalysisCard = usagePage.querySelector('.usage-call-analysis-card');
  function syncScopeCards() {
    const all = usagePage.dataset.userScope === 'all';
    const actualSelf = !all && usagePage.dataset.costScope === 'actual';
    selfScopeCards.forEach(card => { card.hidden = all || actualSelf; });
    if (peakCard) peakCard.hidden = actualSelf || (all && usagePage.dataset.costScope === 'actual');
    if (spendCard) spendCard.hidden = all;
    if (callAnalysisCard) callAnalysisCard.hidden = all;
  }
  syncScopeCards();
  usagePage.querySelector('#usageFilterBtn').before(departmentFilter, teamFilter, userFilter);
  const userInput = userFilter.querySelector('input');
  const userMatches = userFilter.querySelector('.usage-user-matches');
  departmentFilter.before(usagePage.querySelector('.usage-date-presets'));
  const datePresets = usagePage.querySelector('.usage-date-presets');
  datePresets.hidden = usagePage.dataset.costScope === 'actual';
  const monthControl = document.createElement('label');
  monthControl.className = 'usage-month-control';
  monthControl.innerHTML = '<span class="sr-only">统计月份</span><input type="month" aria-label="统计月份" value="2026-10">';
  departmentFilter.before(monthControl);
  monthControl.hidden = usagePage.dataset.costScope !== 'actual';
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 6);
  usagePage.dataset.startDate = rangeStart.toISOString().slice(0, 10);
  usagePage.dataset.endDate = new Date().toISOString().slice(0, 10);
  function syncDateInputs(costScope) {
    datePresets.hidden = costScope === 'actual';
    monthControl.hidden = costScope !== 'actual';
  }
  datePresets.addEventListener('click', event => {
    const button = event.target.closest('[data-range]');
    if (!button || usagePage.dataset.costScope === 'actual') return;
    datePresets.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
    if (button.dataset.range === 'custom') return;
    const end = new Date();
    const start = new Date(end);
    if (button.dataset.range === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
    else if (button.dataset.range !== 'today') start.setDate(start.getDate() - Number(button.dataset.range) + 1);
    const format = date => date.toISOString().slice(0, 10);
    usagePage.dataset.startDate = format(start);
    usagePage.dataset.endDate = format(end);
  });
  function availableUsers() {
    try {
      const saved = JSON.parse(localStorage.getItem('maas-users-demo'));
      if (Array.isArray(saved)) return saved.map(user => user.username).filter(name => typeof name === 'string');
    } catch {}
    return [...document.querySelectorAll('#userRows .user-name')].map(item => item.textContent.trim());
  }
  const departmentSpend = [['AIM',97560],['DG',39530],['ACG智能创新',14520],['CS',13610],['CS-CC',5700],['SSG',3940],['HR&Admin',1600],['市场',110.43],['财务',20.54]];
  usagePage.querySelector('#usageDepartmentChart').innerHTML = departmentSpend.map(([name,value],index) => `<div class="usage-department-row"><span class="usage-department-name">${name}</span><span class="usage-department-track"><i style="width:${Math.max(value / departmentSpend[0][1] * 100,.4)}%;opacity:${1-index*.045}"></i></span><strong class="usage-department-value">¥${value>=1000?(value/1000).toFixed(2)+'K':value.toFixed(2)}</strong></div>`).join('');
  function renderUserMatches() {
    const query = userInput.value.trim().toLocaleLowerCase();
    const matches = query ? availableUsers().filter(name => name.toLocaleLowerCase().includes(query)) : [];
    userMatches.replaceChildren();
    matches.forEach(name => {
      const option = document.createElement('button');
      option.type = 'button';
      option.role = 'option';
      option.textContent = name;
      option.addEventListener('click', () => {
        userInput.value = name;
        userMatches.hidden = true;
        userInput.setAttribute('aria-expanded', 'false');
        usagePage.dispatchEvent(new CustomEvent('usage-user-filter-change', { bubbles: true, detail: { username: name } }));
      });
      userMatches.append(option);
    });
    userMatches.hidden = !query;
    userInput.setAttribute('aria-expanded', String(Boolean(query)));
    if (query && !matches.length) {
      const empty = document.createElement('span');
      empty.textContent = '无匹配用户';
      userMatches.append(empty);
    }
  }
  userInput.addEventListener('input', () => {
    renderUserMatches();
    usagePage.dispatchEvent(new CustomEvent('usage-user-filter-change', { bubbles: true, detail: { username: userInput.value.trim() } }));
  });
  userInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') { userMatches.hidden = true; userInput.setAttribute('aria-expanded', 'false'); }
    if (event.key === 'Enter' && !userMatches.hidden) { event.preventDefault(); userMatches.querySelector('button')?.click(); }
  });
  document.addEventListener('click', event => {
    if (!userFilter.contains(event.target)) { userMatches.hidden = true; userInput.setAttribute('aria-expanded', 'false'); }
  });
  usagePage.querySelectorAll('[data-user-scope]').forEach(button => button.addEventListener('click', () => {
    usagePage.dataset.userScope = button.dataset.userScope;
    userFilter.hidden = button.dataset.userScope !== 'all';
    departmentFilter.hidden = button.dataset.userScope !== 'all';
    teamFilter.hidden = button.dataset.userScope !== 'all';
    departmentCard.hidden = button.dataset.userScope !== 'all';
    syncScopeCards();
    if (button.dataset.userScope !== 'all') departmentFilter.querySelector('select').value = 'all';
    if (button.dataset.userScope !== 'all') teamFilter.querySelector('select').value = 'all';
    userInput.value = '';
    userMatches.hidden = true;
    userInput.setAttribute('aria-expanded', 'false');
    usagePage.querySelectorAll('.usage-user-scope button').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    usagePage.dispatchEvent(new CustomEvent('usage-scope-change', { bubbles: true, detail: { userScope: button.dataset.userScope } }));
  }));
  const find = selector => scope.querySelector(scope.id === 'dashboardPage' ? selector.replace(/#(usage[\w-]+)/g, '#dashboard-$1') : selector);
  const models = [
    { name: 'gpt-6-sol', requests: 57, success: 57, failure: 0, successRate: 100, share: 53.77, latest: '2026-10-27 10:44:59', estimate: 21.99, original: 36.65, discount: '0.6折', inputTokens: 5200000, outputTokens: 593956, tokens: 5793956, rpm: 0.04, tpm: 4023.5, color: '#84cc16', calls: [0, 0, 0, 0, 0, 29, 28], spend: [0, 0, 0, 0, 0, 8, 13.99] },
    { name: 'gpt-5.6-luna', requests: 35, success: 34, failure: 1, successRate: 97.14, share: 33.02, latest: '2026-10-27 10:44:59', estimate: 30, original: 50, discount: '0.6折', inputTokens: 820000, outputTokens: 249000, tokens: 1069000, rpm: 0.02, tpm: 742.4, color: '#4d7c0f', calls: [0, 0, 0, 0, 0, 35, 0], spend: [0, 0, 0, 0, 30, 0, 0] },
    { name: 'gpt-5.6-sol', requests: 5, success: 5, failure: 0, successRate: 100, share: 4.72, latest: '2026-10-27 10:44:59', estimate: 20, original: 33.33, discount: '0.6折', inputTokens: 710000, outputTokens: 233000, tokens: 943000, rpm: 0, tpm: 654.9, color: '#a3e635', calls: [0, 0, 0, 0, 2, 3, 0], spend: [0, 0, 0, 0, 0, 20, 0] },
    { name: 'gpt-6-luna', requests: 2, success: 2, failure: 0, successRate: 100, share: 1.89, latest: '2026-10-27 10:44:58', estimate: 0, original: 0, discount: '—', inputTokens: 29000, outputTokens: 8000, tokens: 37000, rpm: 0, tpm: 25.7, color: '#65a30d', calls: [0, 0, 0, 0, 0, 2, 0], spend: [0, 0, 0, 0, 0, 0, 0] },
    { name: 'gpt-5.6-terra', requests: 6, success: 5, failure: 1, successRate: 83.33, share: 5.66, latest: '2026-10-27 10:44:58', estimate: 0, original: 0, discount: '—', inputTokens: 0, outputTokens: 0, tokens: 0, rpm: 0, tpm: 0, color: '#94a3b8', calls: [0, 0, 0, 0, 0, 6, 0], spend: [0, 0, 0, 0, 0, 0, 0] },
    { name: 'gpt-6.1-sol', requests: 1, success: 1, failure: 0, successRate: 100, share: 0.94, latest: '2026-10-27 10:44:57', estimate: 0, original: 0, discount: '—', inputTokens: 0, outputTokens: 0, tokens: 0, rpm: 0, tpm: 0, color: '#334155', calls: [0, 0, 0, 0, 0, 1, 0], spend: [0, 0, 0, 0, 0, 0, 0] }
  ];
  const spendTotal = model => model.spend.reduce((total, value) => total + value, 0);
  const hours = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
  let sort = { key: 'requests', descending: true }, spendMode = 'bar', analysisMode = 'trend';
  const money = value => '¥' + value.toFixed(2);
  const tokenLabel = value => value >= 10000 ? (value / 10000).toFixed(1) + '万' : value.toLocaleString('zh-CN');
  const peakTpm = [1280000, 1210000, 420000, 310000, 260000, 380000, 220000, 170000, 640000, 2140000, 4780000, 5360000, 4120000, 2390000, 3720000, 5210000, 4980000, 4760000, 4690000, 4480000, 4370000, 3940000, 1860000, 320000];
  const callAnalysisCells = model => `<td>${model.name}</td><td>${model.requests.toLocaleString('zh-CN')}</td><td><span class="success-count">${model.successRate.toFixed(2)}%</span> / <span class="failure-count">${model.failure}</span> 失败</td><td>¥${model.estimate.toFixed(2)}</td><td>¥${model.original.toFixed(2)}</td><td>${model.discount}</td><td>${model.rpm.toFixed(2)}</td><td>${model.tpm.toFixed(1)}</td><td>${tokenLabel(model.tokens)}</td><td>${tokenLabel(model.inputTokens)}</td><td>${tokenLabel(model.outputTokens)}</td><td>${tokenLabel(model.cacheWrite || 0)}</td><td>${tokenLabel(model.cacheRead || 0)}</td><td>${(model.cacheHitRate || 0).toFixed(1)}%</td><td>${model.latency || '0.00'} s</td><td>${model.latest}</td>`;
  const legend = target => { find(target).innerHTML = models.map(model => `<span><i style="background:${model.color}"></i>${model.name}</span>`).join(''); };

  // 模型调用分析：分页渲染（先整体排序，再按页切片）
  function paintCallRows(tbody, rows) {
    if (rows) tbody._rows = rows;
    const all = tbody._rows || [];
    const pager = tbody.closest('.usage-call-analysis-card')?.querySelector('.usage-call-pager');
    if (!pager) { tbody.innerHTML = all.map(model => `<tr>${callAnalysisCells(model)}</tr>`).join(''); return; }
    const size = Number(pager.querySelector('select').value) || 10;
    const pages = Math.max(1, Math.ceil(all.length / size));
    const current = Math.min(Math.max(1, Number(pager.dataset.page) || 1), pages);
    pager.dataset.page = current;
    tbody.innerHTML = all.slice((current - 1) * size, current * size).map(model => `<tr>${callAnalysisCells(model)}</tr>`).join('');
    pager.querySelector('.usage-details-total').textContent = `共 ${all.length} 条`;
    pager.querySelector('.usage-call-page-label').textContent = `${current} / ${pages}`;
    pager.querySelector('[data-call-page="prev"]').disabled = current <= 1;
    pager.querySelector('[data-call-page="next"]').disabled = current >= pages;
    if (!pager.dataset.bound) {
      pager.dataset.bound = 'true';
      pager.querySelector('select').addEventListener('change', () => { pager.dataset.page = 1; paintCallRows(tbody); });
      pager.addEventListener('click', event => {
        const step = event.target.closest('[data-call-page]')?.dataset.callPage;
        if (!step) return;
        pager.dataset.page = (Number(pager.dataset.page) || 1) + (step === 'next' ? 1 : -1);
        paintCallRows(tbody);
      });
    }
  }

  function renderTable() {
    const rows = [...models].sort((a, b) => {
      const result = sort.key === 'model' ? a.name.localeCompare(b.name) : sort.key === 'spend' ? spendTotal(a) - spendTotal(b) : a[sort.key] - b[sort.key];
      return sort.descending ? -result : result;
    });
    const modelRows = find('#usageModelRows');
    if (modelRows) modelRows.innerHTML = rows.map(model => `<tr><td>${model.name}</td><td><div class="usage-success-rate"><span class="usage-success-track" aria-hidden="true"><i style="width:${model.successRate}%"></i></span><span>${model.successRate.toFixed(2)}%</span></div></td><td>${money(spendTotal(model))}</td><td>${model.requests}</td><td>${tokenLabel(model.tokens)}</td><td>${model.rpm.toFixed(2)}</td><td>${model.tpm.toFixed(1)}</td><td class="usage-outcomes"><span class="success-count">${model.success} 成功</span><span class="divider">/</span><span class="failure-count">${model.failure} 失败</span></td><td class="usage-share">${model.share.toFixed(2)}%</td><td class="usage-latest">${model.latest}</td></tr>`).join('');
    const analysisRows = find('#usageCallAnalysisRows');
    if (analysisRows) paintCallRows(analysisRows, rows);
    const analysisHead = find('.usage-call-analysis-table thead tr');
    if (analysisHead && !analysisHead.dataset.sortable) {
      analysisHead.dataset.sortable = 'true';
      const keys = ['requests', 'successRate', 'estimate', 'original', 'discount', 'rpm', 'tpm', 'tokens', 'inputTokens', 'outputTokens', 'cacheWrite', 'cacheRead', 'cacheHitRate', 'latency', 'latest'];
      [...analysisHead.cells].slice(1).forEach((cell, index) => {
        const key = keys[index];
        cell.innerHTML = `<button type="button" data-call-sort="${key}">${cell.textContent.trim()} <svg class="usage-sort-icon" viewBox="0 0 24 28" aria-hidden="true"><path class="sort-up" d="M12 1 2 12h20L12 1Z"/><path class="sort-down" d="M12 27 22 16H2l10 11Z"/></svg></button>`;
        cell.querySelector('button').addEventListener('click', () => {
          rows.sort((a, b) => (a[key] > b[key] ? -1 : a[key] < b[key] ? 1 : 0));
          analysisRows.closest('.usage-call-analysis-card').querySelector('.usage-call-pager')?.setAttribute('data-page', '1');
          paintCallRows(analysisRows, rows);
        });
      });
    }
    scope.querySelectorAll('.usage-table th button').forEach(button => {
      const selected = button.dataset.sort === sort.key;
      button.querySelector('.usage-sort-icon').setAttribute('data-active', selected ? (sort.descending ? 'down' : 'up') : 'none');
      if (selected) button.setAttribute('aria-sort', sort.descending ? 'descending' : 'ascending');
      else button.removeAttribute('aria-sort');
    });
  }

  function axes(maximum, ticks, labels = hours) {
    let svg = '';
    for (let step = 0; step <= ticks; step++) {
      const y = 220 - step * 44;
      svg += `<line class="gridline" x1="48" y1="${y}" x2="876" y2="${y}"/><text x="39" y="${y + 4}" text-anchor="end">${Math.round(maximum * step / ticks)}</text>`;
    }
    labels.forEach((label, i) => { svg += `<text x="${labels === hours ? 92 + i * 120 : 99 + i * 130}" y="250" text-anchor="middle">${labels === hours ? '10-21 ' : ''}${label}</text>`; });
    return svg;
  }

  function svgFrame(content, maximum, ticks = 5, labels = hours) {
    return `<svg viewBox="0 0 900 270" preserveAspectRatio="none" aria-hidden="true">${axes(maximum, ticks, labels)}${content}</svg>`;
  }

  function renderSpend() {
    const target = find('#usageSpendChart');
    if (!target) return;
    let content = '';
    if (spendMode === 'bar') {
      hours.forEach((_, i) => {
        let top = 220;
        models.forEach(model => {
          const value = model.spend[i];
          if (!value) return;
          const height = value / 32 * 220;
          top -= height;
          content += `<rect class="bar-segment" data-hour-index="${i}" x="${71 + i * 120}" y="${top}" width="42" height="${height}" rx="3" fill="${model.color}"/>`;
        });
      });
    } else {
      models.forEach(model => {
        const points = model.spend.map((value, i) => `${92 + i * 120},${220 - value / 32 * 220}`).join(' ');
        content += `<polygon points="92,220 ${points} 812,220" fill="${model.color}" opacity=".13"/><polyline points="${points}" fill="none" stroke="${model.color}" stroke-width="3" stroke-linejoin="round"/>`;
      });
    }
    target.innerHTML = svgFrame(content, 32, 4);
    target.insertAdjacentHTML('beforeend', '<div class="usage-chart-tooltip" role="status" hidden></div>');
    target.setAttribute('aria-label', spendMode === 'bar' ? '近七小时按模型堆叠的消费柱状图，总计 ¥71.99' : '近七小时按模型分组的消费面积图，总计 ¥71.99');
    legend('#usageSpendLegend');
  }

  function bindSpendChart(spendChart) {
  if (!spendChart) return;
  spendChart.addEventListener('pointerover', event => {
    if (spendMode !== 'bar' || !event.target.closest('.bar-segment')) return;
    find('.usage-chart-tooltip').hidden = false;
  });
  spendChart.addEventListener('pointermove', event => {
    const segment = event.target.closest('.bar-segment');
    if (spendMode !== 'bar' || !segment) return;
    const index = Number(segment.dataset.hourIndex);
    const values = models.map(model => ({ name: model.name, color: model.color, value: model.spend[index] }));
    const total = values.reduce((sum, item) => sum + item.value, 0);
    const tooltip = spendChart.querySelector('.usage-chart-tooltip');
    tooltip.innerHTML = `<strong>10-21 ${hours[index]}</strong><div class="usage-tooltip-total"><span>总计</span><b>${money(total)}</b></div>${values.sort((a, b) => b.value - a.value).map(item => `<div class="usage-tooltip-row"><span><i style="background:${item.color}"></i>${item.name}</span><b>${money(item.value)}</b></div>`).join('')}`;
    const bounds = spendChart.getBoundingClientRect();
    const left = Math.max(8, Math.min(event.clientX - bounds.left + 14, bounds.width - 232));
    const top = Math.max(8, Math.min(event.clientY - bounds.top - 24, bounds.height - 246));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });
  spendChart.addEventListener('pointerout', event => {
    if (event.target.closest('.bar-segment') && !event.relatedTarget?.closest('.bar-segment')) {
      const tooltip = spendChart.querySelector('.usage-chart-tooltip');
      if (tooltip) tooltip.hidden = true;
    }
  });
  }

  function renderAnalysis() {
    const target = find('#usageAnalysisChart');
    const title = { trend: '调用趋势', distribution: '调用占比', ranking: '调用次数排行' }[analysisMode];
    if (analysisMode === 'ranking') {
      target.removeAttribute('role');
      target.classList.add('ranking-view');
      target.innerHTML = `<div class="usage-ranking">${[...models].sort((a, b) => b.requests - a.requests).map(model => `<div class="usage-ranking-row"><span class="usage-ranking-name">${model.name}</span><span class="usage-ranking-track"><i style="width:${model.requests / 57 * 100}%;background:${model.color}"></i></span><strong>${model.requests}</strong></div>`).join('')}</div>`;
      find('#usageAnalysisLegend').innerHTML = '';
      return;
    }
    target.setAttribute('role', 'img');
    target.classList.remove('ranking-view');
    let content = '';
    if (analysisMode === 'distribution') {
      models.forEach((model, i) => {
        const x = 70 + i * 130, height = model.requests / 60 * 200;
        content += `<rect x="${x}" y="${220 - height}" width="58" height="${height}" rx="5" fill="${model.color}"><title>${model.name}：${model.requests} 次</title></rect><text x="${x + 29}" y="${210 - height}" text-anchor="middle">${model.requests}</text>`;
      });
      target.innerHTML = svgFrame(content, 60, 4, models.map(model => model.name));
    } else {
      models.forEach(model => {
        const points = model.calls.map((value, i) => `${92 + i * 120},${220 - value / 40 * 220}`).join(' ');
        content += `<polygon points="92,220 ${points} 812,220" fill="${model.color}" opacity=".07"/><polyline points="${points}" fill="none" stroke="${model.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      });
      target.innerHTML = svgFrame(content, 40, 4);
    }
      target.setAttribute('aria-label', title + '，合计 106 次请求');
    legend('#usageAnalysisLegend');
  }

  function renderPeakTpm() {
    const target = find('#usagePeakChart');
    if (!target) return;
    const width = 900, chartLeft = 58, chartRight = 880, chartTop = 18, chartBottom = 218, maximum = 6000000;
    const x = index => chartLeft + index * (chartRight - chartLeft) / (peakTpm.length - 1);
    const y = value => chartBottom - value / maximum * (chartBottom - chartTop);
    const points = peakTpm.map((value, index) => [x(index), y(value)]);
    let path = `M ${points[0][0]} ${points[0][1]}`;
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1], current = points[index], midpoint = (previous[0] + current[0]) / 2;
      path += ` C ${midpoint} ${previous[1]}, ${midpoint} ${current[1]}, ${current[0]} ${current[1]}`;
    }
    let grid = '';
    [0, 2000000, 4000000, 6000000].forEach(value => {
      const gridY = y(value);
      grid += `<line class="peak-grid" x1="${chartLeft}" y1="${gridY}" x2="${chartRight}" y2="${gridY}"/><text x="46" y="${gridY + 4}" text-anchor="end">${value ? value / 1000000 + 'M' : '0'}</text>`;
    });
    let labels = '';
    for (let hour = 0; hour < 24; hour += 2) labels += `<text x="${x(hour)}" y="248" text-anchor="middle">${String(hour).padStart(2, '0')}:00</text>`;
    const peak = Math.max(...peakTpm), peakHour = peakTpm.indexOf(peak);
    const dots = points.map((point, index) => `<circle class="peak-point" cx="${point[0]}" cy="${point[1]}" r="5" tabindex="0" role="img" aria-label="${String(index).padStart(2, '0')}:00，峰值 ${peakTpm[index].toLocaleString('zh-CN')} TPM"><title>${String(index).padStart(2, '0')}:00 · ${peakTpm[index].toLocaleString('zh-CN')} TPM</title></circle>`).join('');
    target.innerHTML = `<svg viewBox="0 0 ${width} 265" preserveAspectRatio="none" aria-hidden="false">${grid}<line class="peak-axis" x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}"/><path class="peak-area" d="${path} L ${chartRight} ${chartBottom} L ${chartLeft} ${chartBottom} Z"/><path class="peak-line" d="${path}"/>${dots}${labels}</svg>`;
    target.setAttribute('aria-label', `每小时峰值 TPM 折线图，当日峰值 ${peak.toLocaleString('zh-CN')}，出现在 ${String(peakHour).padStart(2, '0')}:00`);
    const value = find('#usagePeakValue');
    if (value) value.textContent = `${(peak / 1000000).toFixed(2)}M · ${String(peakHour).padStart(2, '0')}:00`;
  }

  window.renderUsage = function (target = scope) { scope = target; renderTable(); renderSpend(); renderAnalysis(); renderPeakTpm(); };
  document.querySelectorAll('.usage-page .usage-table th button').forEach(button => button.addEventListener('click', () => {
    scope = button.closest('.usage-page');
    const key = button.dataset.sort;
    sort = sort.key === key ? { key, descending: !sort.descending } : { key, descending: key !== 'model' };
    renderTable();
  }));
  document.querySelectorAll('.usage-page [data-chart]').forEach(button => button.addEventListener('click', () => {
    scope = button.closest('.usage-page');
    spendMode = button.dataset.chart;
    scope.querySelectorAll('[data-chart]').forEach(item => item.classList.toggle('active', item === button));
    renderSpend();
  }));
  document.querySelectorAll('.usage-page [data-analysis]').forEach(button => button.addEventListener('click', () => {
    scope = button.closest('.usage-page');
    analysisMode = button.dataset.analysis;
    scope.querySelectorAll('[data-analysis]').forEach(item => item.classList.toggle('active', item === button));
    renderAnalysis();
  }));
  bindSpendChart(find('#usageSpendChart'));
  scope = document.querySelector('#dashboardPage');
  bindSpendChart(find('#usageSpendChart'));
  scope = document.querySelector('#usagePage');
})();
