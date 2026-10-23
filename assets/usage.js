(function () {
  let scope = document.querySelector('#usagePage');
  const usagePage = scope;
  usagePage.dataset.userScope = 'self';
  usagePage.querySelector('.usage-filter').insertAdjacentHTML('beforeend', '<div class="usage-user-filter" hidden><input type="search" aria-label="筛选用户名" placeholder="筛选用户名" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="usageUserMatches"><div id="usageUserMatches" class="usage-user-matches" role="listbox" hidden></div></div><div class="usage-chart-switch usage-user-scope" role="group" aria-label="用户范围"><button type="button" class="active" data-user-scope="self" aria-pressed="true">仅自己</button><button type="button" data-user-scope="all" aria-pressed="false">全部</button></div>');
  const userFilter = usagePage.querySelector('.usage-user-filter');
  usagePage.querySelector('#usageFilterBtn').before(userFilter);
  const userInput = userFilter.querySelector('input');
  const userMatches = userFilter.querySelector('.usage-user-matches');
  function availableUsers() {
    try {
      const saved = JSON.parse(localStorage.getItem('maas-users-demo'));
      if (Array.isArray(saved)) return saved.map(user => user.username).filter(name => typeof name === 'string');
    } catch {}
    return [...document.querySelectorAll('#userRows .user-name')].map(item => item.textContent.trim());
  }
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
    { name: 'gpt-6-sol', requests: 57, tokens: 5793956, rpm: 0.04, tpm: 4023.5, color: '#84cc16', calls: [0, 0, 0, 0, 0, 29, 28], spend: [0, 0, 0, 0, 0, 8, 13.99] },
    { name: 'gpt-5.6-luna', requests: 35, tokens: 1069000, rpm: 0.02, tpm: 742.4, color: '#4d7c0f', calls: [0, 0, 0, 0, 0, 35, 0], spend: [0, 0, 0, 0, 30, 0, 0] },
    { name: 'gpt-5.6-sol', requests: 5, tokens: 943000, rpm: 0, tpm: 654.9, color: '#a3e635', calls: [0, 0, 0, 0, 2, 3, 0], spend: [0, 0, 0, 0, 0, 20, 0] },
    { name: 'gpt-6-luna', requests: 2, tokens: 37000, rpm: 0, tpm: 25.7, color: '#65a30d', calls: [0, 0, 0, 0, 0, 2, 0], spend: [0, 0, 0, 0, 0, 0, 0] },
    { name: 'gpt-5.6-terra', requests: 6, tokens: 0, rpm: 0, tpm: 0, color: '#94a3b8', calls: [0, 0, 0, 0, 0, 6, 0], spend: [0, 0, 0, 0, 0, 0, 0] },
    { name: 'gpt-6.1-sol', requests: 1, tokens: 0, rpm: 0, tpm: 0, color: '#334155', calls: [0, 0, 0, 0, 0, 1, 0], spend: [0, 0, 0, 0, 0, 0, 0] }
  ];
  const spendTotal = model => model.spend.reduce((total, value) => total + value, 0);
  const hours = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
  let sort = { key: 'requests', descending: true }, spendMode = 'bar', analysisMode = 'trend';
  const money = value => '¥' + value.toFixed(2);
  const tokenLabel = value => value >= 10000 ? (value / 10000).toFixed(1) + '万' : value.toLocaleString('zh-CN');
  const legend = target => { find(target).innerHTML = models.map(model => `<span><i style="background:${model.color}"></i>${model.name}</span>`).join(''); };

  function renderTable() {
    const rows = [...models].sort((a, b) => {
      const result = sort.key === 'model' ? a.name.localeCompare(b.name) : sort.key === 'spend' ? spendTotal(a) - spendTotal(b) : a[sort.key] - b[sort.key];
      return sort.descending ? -result : result;
    });
    find('#usageModelRows').innerHTML = rows.map(model => `<tr><td>${model.name}</td><td>${money(spendTotal(model))}</td><td>${model.requests}</td><td>${tokenLabel(model.tokens)}</td><td>${model.rpm.toFixed(2)}</td><td>${model.tpm.toFixed(1)}</td></tr>`).join('');
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
    const title = { trend: '调用趋势', distribution: '调用次数分布', ranking: '调用次数排行' }[analysisMode];
    find('#usageAnalysisTitle').textContent = title;
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

  window.renderUsage = function (target = scope) { scope = target; renderTable(); renderSpend(); renderAnalysis(); };
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
