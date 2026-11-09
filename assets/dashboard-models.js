// 数据看板 · 模型用量：独立于"我的用量"的模型汇总视图（KPI + 可展开的模型汇总表）
(() => {
  const page = document.querySelector('#dashboardPage');
  if (!page) return;

  // ---------- 演示数据 ----------
  // 前 10 行取自设计稿；其余 66 行按剩余总量确定性生成，保证汇总卡与表格合计一致
  const TOTAL = { requests: 4280000, cost: 173231.26, original: 3123684.38, users: 491, cacheHit: 69.0 };
  const head = [
    ['claude-opus-5-5', 224, 879970, 59461.97, 1187820.14, 168.25e9, 6.64e9],
    ['claude-opus-5', 122, 1000000, 31714.37, 602942.82, 39.87e9, 4.53e9],
    ['claude-opus-4-8', 130, 187340, 20406.35, 408005.85, 33.78e9, 1.05e9],
    ['gpt-6-astra', 96, 149270, 18693.92, 319836.16, 32.52e9, 17.12e9],
    ['claude-sonnet-5', 158, 174870, 6630.08, 132309.97, 20.89e9, 1.14e9],
    ['claude-opus-4-6', 24, 48500, 4613.64, 92272.81, 5.33e9, 1.32e9],
    ['claude-sonnet-5-5', 69, 195150, 3786.03, 75720.57, 17.93e9, 1.25e9],
    ['glm-5.3', 21, 17830, 3702.26, 4284.59, 3.14e9, 1.61e9],
    ['gpt-5.6-sol', 113, 43720, 3659.46, 63059.87, 14.11e9, 7.47e9],
    ['gpt-6.1-sol', 119, 223510, 2799.98, 47926.74, 16.18e9, 9.00e9]
  ];
  const tailNames = ['gpt-6-sol','gpt-5.6-luna','gpt-5.6-terra','gpt-6-luna','claude-haiku-5-5','claude-haiku-4-5','claude-sonnet-4-6','claude-opus-4-5','gemini-3.8-pro','gemini-3.8-flash','gemini-3.5-pro','gemini-3.5-flash','gemini-3-flash-lite','deepseek-v4','deepseek-v4-reasoner','deepseek-v3.5','qwen-4-max','qwen-4-plus','qwen-4-turbo','qwen-3.5-coder','qwen-3.5-vl','kimi-k3','kimi-k3-thinking','moonshot-v2-128k','glm-5.3-air','glm-5-flash','glm-5v','doubao-2.5-pro','doubao-2.5-lite','doubao-seed-2','minimax-m3','minimax-text-02','ernie-5.5','ernie-5-turbo','hunyuan-t2','hunyuan-turbos','step-3','step-3-mini','yi-lightning-2','baichuan-5','spark-x2','mistral-large-3','mistral-medium-3','codestral-3','llama-5-405b','llama-5-70b','grok-5','grok-5-mini','command-r3','jamba-2','gpt-6-mini','gpt-6-nano','gpt-5.6-mini','o5-mini','o5','claude-haiku-5','text-embedding-4-large','text-embedding-4-small','bge-m4','jina-embeddings-v4','qwen-rerank-3','bge-reranker-v3','whisper-4','tts-2-hd','gpt-image-2','seedream-5'];
  let seed = 20261104;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const sum = (list, key) => list.reduce((total, row) => total + row[key], 0);
  const models = head.map(([name, users, requests, cost, original, tokens, input]) => ({ name, users, requests, cost, original, tokens, input }));
  const weights = tailNames.map((_, i) => Math.pow(0.93, i) * (0.75 + rand() * 0.5));
  const reqWeights = tailNames.map(() => 0.2 + rand() * 1.6);
  const discounts = tailNames.map(() => [0.5, 0.58, 0.6, 0.8, 1, 3.2, 5][Math.floor(rand() * 7)]);
  const costLeft = TOTAL.cost - sum(models, 'cost');
  const reqLeft = TOTAL.requests - sum(models, 'requests');
  const wSum = weights.reduce((a, b) => a + b, 0);
  const rSum = reqWeights.reduce((a, b) => a + b, 0);
  const tail = tailNames.map((name, i) => {
    const cost = Math.round(costLeft * weights[i] / wSum * 100) / 100;
    const requests = Math.max(40, Math.round(reqLeft * reqWeights[i] / rSum));
    const tokens = Math.round(requests * (8000 + rand() * 60000));
    return { name, users: 4 + Math.floor(rand() * 90), requests, cost, original: cost * 10 / discounts[i], tokens, input: Math.round(tokens * (0.04 + rand() * 0.5)) };
  });
  // 消除四舍五入误差，并把原价按比例缩放到剩余原价总额
  tail[tail.length - 1].cost = Math.round((tail[tail.length - 1].cost + costLeft - sum(tail, 'cost')) * 100) / 100;
  const originalScale = (TOTAL.original - sum(models, 'original')) / sum(tail, 'original');
  tail.forEach(row => { row.original = Math.round(row.original * originalScale * 100) / 100; });
  tail[tail.length - 1].original = Math.round((tail[tail.length - 1].original + TOTAL.original - sum(models, 'original') - sum(tail, 'original')) * 100) / 100;
  tail[tail.length - 1].requests += reqLeft - sum(tail, 'requests');
  models.push(...tail);

  const people = [['阳蕾','lei_yang'],['韩一畅','yichang_han'],['李攀登','pandeng_li'],['黎彤','tong_li2'],['王茜云','xiyun_wang'],['张伟','wei_zhang'],['李娜','na_li'],['陈浩','hao_chen'],['刘洋','yang_liu'],['赵敏','min_zhao'],['孙磊','lei_sun'],['周婷','ting_zhou'],['吴迪','di_wu'],['郑凯','kai_zheng'],['冯雪','xue_feng'],['何静','jing_he']];
  // 每个模型的用户拆分：确定性生成，合计不超过模型自身数值
  function usersOf(model, index) {
    let s = (index + 1) * 7919;
    const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const count = Math.min(6, model.users);
    const start = index % people.length;
    const shares = Array.from({ length: count }, (_, i) => Math.pow(0.62, i) * (0.8 + r() * 0.4));
    const cover = 0.55 + r() * 0.25; // 前几位用户覆盖的占比
    const total = shares.reduce((a, b) => a + b, 0);
    return shares.map((share, i) => {
      const ratio = share / total * cover;
      const [name, account] = people[(start + i * 3) % people.length];
      return { name, account, requests: Math.round(model.requests * ratio), cost: model.cost * ratio, tokens: Math.round(model.tokens * ratio), ratio };
    });
  }

  // 渠道拆分：claude-opus-5-5 取自设计稿，其余按模型厂商确定性生成
  const referenceChannels = {
    'claude-opus-5-5': [
      ['anthropic', 'claude', 792640, 6.39e9, 17.18e9, 123.05e9, 52069.40],
      ['anthropic', 'anthropic01022', 4860, 13.23e6, 175.29e6, 1.09e9, 428.82],
      ['anthropic', 'anthropic01009', 4810, 10.25e6, 139.93e6, 1.54e9, 399.40],
      ['anthropic', 'anthropic01001', 3900, 10.84e6, 95.10e6, 1.01e9, 279.86],
      ['anthropic', 'anthropic01007', 3600, 8.18e6, 116.36e6, 899.00e6, 299.44],
      ['anthropic', 'anthropic02111', 3400, 9.29e6, 56.98e6, 907.13e6, 194.82],
      ['anthropic', 'anthropic01006', 2680, 5.89e6, 172.02e6, 771.53e6, 383.08],
      ['anthropic', 'anthropic02017', 2310, 7.32e6, 30.95e6, 261.02e6, 91.85],
      ['anthropic', 'anthropic01097', 2250, 3.00e6, 55.75e6, 458.78e6, 145.30]
    ]
  };
  const vendorOf = name => /^claude/.test(name) ? 'anthropic'
    : /^(gpt|o5|text-embedding|whisper|tts)/.test(name) ? 'openai'
    : /^gemini/.test(name) ? 'google'
    : /^deepseek/.test(name) ? 'deepseek'
    : /^qwen/.test(name) ? 'aliyun'
    : /^(kimi|moonshot)/.test(name) ? 'moonshot'
    : /^glm/.test(name) ? 'zhipu'
    : /^(doubao|seedream)/.test(name) ? 'volcengine'
    : 'thirdparty';
  const mainChannel = { anthropic: 'claude', openai: 'openai', google: 'gemini', deepseek: 'deepseek', aliyun: 'dashscope', moonshot: 'kimi', zhipu: 'bigmodel', volcengine: 'ark', thirdparty: 'openrouter' };
  function channelsOf(model, index) {
    const fixed = referenceChannels[model.name];
    if (fixed) return fixed.map(([group, name, requests, input, write, read, cost]) => ({ group, name, requests, input, write, read, cost }));
    let s = (index + 11) * 104729;
    const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const group = vendorOf(model.name);
    const shares = Array.from({ length: 3 + Math.floor(r() * 6) }, (_, i) => i === 0 ? 6 + r() * 6 : Math.pow(0.8, i) * (0.6 + r() * 0.8));
    const total = shares.reduce((a, b) => a + b, 0);
    const used = new Set();
    return shares.map((share, i) => {
      let name = mainChannel[group];
      while (i > 0 && (name === mainChannel[group] || used.has(name))) name = group + String(1001 + Math.floor(r() * 1200)).padStart(5, '0');
      used.add(name);
      const ratio = share / total;
      const input = model.input * ratio;
      const write = input * (0.5 + r() * 2.5);
      const hit = 0.78 + r() * 0.16; // 读缓存 ÷（输入 + 写缓存 + 读缓存）
      const read = (input + write) * hit / (1 - hit);
      return { group, name, requests: Math.round(model.requests * ratio), input, write, read, cost: model.cost * ratio };
    });
  }

  // ---------- 格式化 ----------
  const compact = value => {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return String(Math.round(value));
  };
  const money = value => '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const discount = row => row.original > 0 ? `${parseFloat((row.cost / row.original * 10).toFixed(2))} 折` : '—';
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

  // ---------- 结构 ----------
  const sortIcon = '<svg class="usage-sort-icon" viewBox="0 0 24 28" aria-hidden="true"><path class="sort-up" d="M12 1 2 12h20L12 1Z"/><path class="sort-down" d="M12 27 22 16H2l10 11Z"/></svg>';
  const view = document.createElement('div');
  view.className = 'dashboard-model-view';
  view.innerHTML = `
    <section class="usage-summary dm-summary" aria-label="模型用量汇总">
      <article class="usage-metric"><div class="usage-metric-label"><span>模型数</span></div><strong data-dm="models"></strong><small>当前筛选范围内有调用的模型</small></article>
      <article class="usage-metric"><div class="usage-metric-label"><span>使用人数</span></div><strong data-dm="users"></strong><small>当前筛选范围内的去重用户数</small></article>
      <article class="usage-metric"><div class="usage-metric-label"><span>调用次数</span></div><strong data-dm="requests"></strong><small>当前筛选范围内的请求数</small></article>
      <article class="usage-metric dm-metric-cost"><div class="usage-metric-label"><span>消耗金额</span></div><strong data-dm="cost"></strong><small data-dm="original"></small><small>实时预估费用</small></article>
      <article class="usage-metric"><div class="usage-metric-label"><span>缓存命中率</span><button type="button" class="dm-info" aria-label="缓存命中率说明" aria-describedby="dmCacheTip">i</button><span class="dm-tip" id="dmCacheTip" role="tooltip">读缓存 Tokens ÷ 输入 Tokens，按各模型 Token 量加权汇总</span></div><strong data-dm="cache"></strong><small>当前筛选范围内按 Token 加权汇总</small></article>
    </section>`;
  const cardHtml = `
    <section class="card dm-card">
      <div class="usage-section-head"><div><h2>模型汇总</h2><p>展开模型后查看具体使用用户，跨渠道和来源直接汇总</p></div><span class="usage-analysis-count" data-dm="count"></span></div>
      <div class="dm-table-wrap">
        <table class="dm-table">
          <thead><tr>
            <th scope="col">模型</th>
            <th scope="col">使用人数</th>
            <th scope="col"><button type="button" data-dm-sort="requests">请求数 ${sortIcon}</button></th>
            <th scope="col"><button type="button" data-dm-sort="cost" aria-sort="descending">费用（¥） ${sortIcon}</button></th>
            <th scope="col">原价（¥）</th>
            <th scope="col">折扣</th>
            <th scope="col">Token 总数</th>
            <th scope="col">输入 Tokens</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="usage-details-pagination dm-pager">
        <span data-dm="total"></span>
        <label>每页行数 <select aria-label="模型汇总每页行数"><option>10</option><option>20</option><option>50</option></select></label>
        <button type="button" data-dm-page="-1" aria-label="上一页">‹</button>
        <span data-dm="page"></span>
        <button type="button" data-dm-page="1" aria-label="下一页">›</button>
      </div>
    </section>`;
  view.insertAdjacentHTML('beforeend', cardHtml);
  const filter = page.querySelector('.usage-filter');
  filter.after(view);
  // 筛选栏：第一行 统计类型标签；第二行 时间筛选 + 确认（左对齐），导出在该行最右侧
  const exportButton = filter.querySelector('.usage-export-btn');
  const statTabs = filter.querySelector('.dashboard-tabs');
  if (exportButton && statTabs) {
    statTabs.insertAdjacentHTML('afterend', '<span class="usage-filter-break" aria-hidden="true"></span>');
    filter.append(exportButton);
  }
  // 平台筛选：放在时间筛选之后、确认之前（两个统计标签下都显示）
  if (!filter.querySelector('.usage-platform-filter')) {
    filter.querySelector('#dashboard-usageFilterBtn')?.insertAdjacentHTML('beforebegin', '<label class="usage-platform-filter"><span class="sr-only">平台</span><select aria-label="平台"><option value="all">全部平台</option><option value="default">AIToken(默认)</option><option value="jp">AIToken(JP)</option><option value="us">AIToken(US)</option></select></label>');
    filter.querySelector('.usage-platform-filter select')?.addEventListener('change', event => {
      page.dataset.platform = event.target.value;
      page.dispatchEvent(new CustomEvent('usage-platform-change', { bubbles: true, detail: { platform: event.target.value } }));
    });
  }

  const $ = key => view.querySelector(`[data-dm="${key}"]`);
  $('models').textContent = models.length;
  $('users').textContent = TOTAL.users;
  $('requests').textContent = compact(TOTAL.requests);
  $('cost').textContent = money(TOTAL.cost);
  $('original').textContent = '原价 ' + money(TOTAL.original);
  $('cache').textContent = TOTAL.cacheHit.toFixed(1) + '%';

  // ---------- 表格：排序 / 分页 / 展开（数据看板与我的用量各挂一份，状态独立）----------
  function mountCard(card, scope) {
  const $c = key => card.querySelector(`[data-dm="${key}"]`);
  $c('count').textContent = `共 ${models.length} 个模型`;
  $c('total').textContent = `共 ${models.length} 条`;
  const tbody = card.querySelector('tbody');
  const select = card.querySelector('.dm-pager select');
  const state = { key: 'cost', desc: true, page: 1, open: new Set(), tab: new Map(), channelSort: new Map() };

  function usersPanel(model, index) {
    const list = usersOf(model, index);
    const more = model.users - list.length;
    return `<table class="dm-sub-table dm-users-table"><thead><tr><th scope="col">用户</th><th scope="col">请求数</th><th scope="col">费用（¥）</th><th scope="col">Token 总数</th><th scope="col">费用占比</th></tr></thead><tbody>
      ${list.map(user => `<tr><td><div class="dm-cell"><span class="dm-avatar" aria-hidden="true">${escapeHtml(user.name.slice(-1))}</span><b>${escapeHtml(user.name)}</b><small>${escapeHtml(user.account)}</small></div></td><td>${compact(user.requests)}</td><td class="dm-cost">${money(user.cost)}</td><td>${compact(user.tokens)}</td><td><span class="dm-share"><i style="width:${(user.ratio * 100).toFixed(1)}%"></i></span>${(user.ratio * 100).toFixed(1)}%</td></tr>`).join('')}
      </tbody></table>
      ${more > 0 ? `<p class="dm-users-more">已显示费用最高的 ${list.length} 位，共 ${model.users} 位用户使用该模型</p>` : ''}`;
  }

  function channelsPanel(model, index) {
    const order = state.channelSort.get(index);
    const list = channelsOf(model, index).map(channel => ({ ...channel, hit: channel.read / (channel.input + channel.write + channel.read) }));
    list.sort(order ? (a, b) => (order === 'desc' ? -1 : 1) * (a.hit - b.hit) : (a, b) => b.requests - a.requests);
    const tip = '缓存命中率 = 读缓存 Tokens ÷（输入 + 写缓存 + 读缓存 Tokens）';
    return `<table class="dm-sub-table dm-channel-table"><thead><tr>
      <th scope="col">渠道组</th><th scope="col">渠道</th><th scope="col">请求数</th><th scope="col">输入 Tokens</th><th scope="col">写缓存 Tokens</th><th scope="col">读缓存 Tokens</th>
      <th scope="col"><span class="dm-th-help"><button type="button" data-dm-channel-sort="${index}"${order ? ` aria-sort="${order === 'desc' ? 'descending' : 'ascending'}"` : ''}>缓存命中率 ${sortIcon}</button><span class="dm-help" tabindex="0" role="img" aria-label="${tip}" title="${tip}">?</span></span></th>
      <th scope="col">费用（¥）</th>
    </tr></thead><tbody>
      ${list.map(channel => `<tr><td>${escapeHtml(channel.group)}</td><td>${escapeHtml(channel.name)}</td><td class="dm-num">${compact(channel.requests)}</td><td class="dm-num">${compact(channel.input)}</td><td class="dm-num">${compact(channel.write)}</td><td class="dm-num">${compact(channel.read)}</td><td class="dm-rate">${(channel.hit * 100).toFixed(1)}%</td><td class="dm-cost">${money(channel.cost)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  function detailRow(model, index) {
    const tab = state.tab.get(index) || 'users';
    const id = `${scope}-detail-${index}`;
    const tabButton = (key, label) => `<button type="button" role="tab" id="${id}-${key}" data-dm-tab="${key}" data-dm-index="${index}" aria-selected="${tab === key}" aria-controls="${id}-panel" tabindex="${tab === key ? 0 : -1}">${label}</button>`;
    return `<tr class="dm-detail-row" id="${id}"><td colspan="8"><div class="dm-detail">
      <div class="dm-detail-tabs" role="tablist" aria-label="${escapeHtml(model.name)} 明细">${tabButton('users', '使用用户')}${tabButton('channels', '渠道分析')}</div>
      <div class="dm-detail-panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-${tab}">${tab === 'users' ? usersPanel(model, index) : channelsPanel(model, index)}</div>
    </div></td></tr>`;
  }

  function render() {
    const size = Number(select.value);
    const pages = Math.max(1, Math.ceil(models.length / size));
    state.page = Math.min(Math.max(1, state.page), pages);
    const sorted = models.map((model, index) => ({ model, index })).sort((a, b) => (state.desc ? -1 : 1) * (a.model[state.key] - b.model[state.key]));
    tbody.innerHTML = sorted.slice((state.page - 1) * size, state.page * size).map(({ model, index }) => {
      const open = state.open.has(index);
      return `<tr class="dm-row${open ? ' is-open' : ''}">
        <td><div class="dm-cell"><button type="button" class="dm-toggle" data-dm-toggle="${index}" aria-expanded="${open}" aria-controls="${scope}-detail-${index}" aria-label="${open ? '收起' : '展开'} ${escapeHtml(model.name)} 的明细"><span aria-hidden="true">${open ? '−' : '+'}</span></button><b>${escapeHtml(model.name)}</b></div></td>
        <td>${model.users}</td>
        <td>${compact(model.requests)}</td>
        <td class="dm-cost">${money(model.cost)}</td>
        <td>${money(model.original)}</td>
        <td class="dm-discount">${discount(model)}</td>
        <td>${compact(model.tokens)}</td>
        <td>${compact(model.input)}</td>
      </tr>${open ? detailRow(model, index) : ''}`;
    }).join('');
    $c('page').textContent = `${state.page} / ${pages}`;
    card.querySelector('[data-dm-page="-1"]').disabled = state.page <= 1;
    card.querySelector('[data-dm-page="1"]').disabled = state.page >= pages;
    card.querySelectorAll('[data-dm-sort]').forEach(button => {
      if (button.dataset.dmSort === state.key) button.setAttribute('aria-sort', state.desc ? 'descending' : 'ascending');
      else button.removeAttribute('aria-sort');
    });
  }

  tbody.addEventListener('click', event => {
    const toggle = event.target.closest('[data-dm-toggle]');
    const tab = event.target.closest('[data-dm-tab]');
    const sort = event.target.closest('[data-dm-channel-sort]');
    let focus;
    if (toggle) {
      const index = Number(toggle.dataset.dmToggle);
      state.open.has(index) ? state.open.delete(index) : state.open.add(index);
      focus = `[data-dm-toggle="${index}"]`;
    } else if (tab) {
      state.tab.set(Number(tab.dataset.dmIndex), tab.dataset.dmTab);
      focus = `#${tab.id}`;
    } else if (sort) {
      const index = Number(sort.dataset.dmChannelSort);
      state.channelSort.set(index, state.channelSort.get(index) === 'desc' ? 'asc' : 'desc');
      focus = `[data-dm-channel-sort="${index}"]`;
    } else return;
    render();
    tbody.querySelector(focus)?.focus();
  });
  // 明细标签：左右方向键切换
  tbody.addEventListener('keydown', event => {
    const tab = event.target.closest('[data-dm-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'users' : event.key === 'End' ? 'channels' : tab.dataset.dmTab === 'users' ? 'channels' : 'users';
    state.tab.set(Number(tab.dataset.dmIndex), next);
    render();
    tbody.querySelector(`#${scope}-detail-${tab.dataset.dmIndex}-${next}`)?.focus();
  });
  card.querySelectorAll('[data-dm-sort]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.dmSort;
    state.desc = state.key === key ? !state.desc : true;
    state.key = key;
    state.page = 1;
    render();
  }));
  card.querySelectorAll('[data-dm-page]').forEach(button => button.addEventListener('click', () => {
    state.page += Number(button.dataset.dmPage);
    render();
  }));
  select.addEventListener('change', () => { state.page = 1; render(); });
  render();
  }
  mountCard(view.querySelector('.dm-card'), 'dm');

  // 我的用量：选择"全部"+"预估费用"时，在页面底部显示同一份模型汇总
  const usagePage = document.querySelector('#usagePage');
  if (usagePage) {
    // 放在"每小时峰值 TPM"卡片上方；找不到时退回页面底部
    const anchor = usagePage.querySelector(':scope > .usage-peak-card');
    const holder = document.createElement('div');
    holder.innerHTML = cardHtml;
    const usageCard = holder.firstElementChild;
    anchor ? anchor.before(usageCard) : usagePage.append(usageCard);
    usageCard.classList.add('usage-model-summary');
    mountCard(usageCard, 'usage-dm');
    // 全部 + 预估费用：放在"每小时峰值 TPM"上方；全部 + 实际费用：放在页面最下方；仅自己时隐藏
    const sync = () => {
      const all = usagePage.dataset.userScope === 'all';
      usageCard.hidden = !all;
      if (!all) return;
      if (usagePage.dataset.costScope === 'estimated' && anchor) anchor.before(usageCard);
      else if (usagePage.lastElementChild !== usageCard) usagePage.append(usageCard);
    };
    usagePage.addEventListener('usage-scope-change', sync);
    usagePage.addEventListener('usage-cost-scope-change', sync);
    sync();
  }
})();
