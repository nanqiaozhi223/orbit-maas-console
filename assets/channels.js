(() => {
  const storageKey = 'maas-channels-demo';
  const seed = [
    { id: 25, provider: 'Alibaba', name: 'aliyun-anhui zhuoniu', model: 'claude', used: '5,127.07', remaining: '0', priority: 20, weight: 10, response: '5.10 秒', latency: 5100, lastTest: '1 个月前', load: 100, enabled: true, tags: ['default'] },
    { id: 1, provider: 'Anthropic', name: 'claude', model: 'claude', used: '1061.1 万', remaining: '0', priority: 20, weight: 10, response: '1.68 秒', latency: 1680, lastTest: '17 小时前', load: 99.9, enabled: true, tags: ['default', 'vip'] },
    { id: 22, provider: 'OpenAI', name: 'gpt_kiro', model: 'gpt', used: '29.4 万', remaining: '0', priority: 20, weight: 10, response: '880 毫秒', latency: 880, lastTest: '19 天前', load: 0, enabled: false, tags: ['default', 'vip'] },
    { id: 23, provider: 'OpenAI', name: 'gpt_codex', model: 'gpt', used: '115.6 万', remaining: '0', priority: 12, weight: 10, response: '174.28 秒', latency: 174280, lastTest: '10 天前', load: 91.4, enabled: true, tags: ['default', 'vip'] },
    { id: 20, provider: 'xAI', name: 'grok', model: 'grok', used: '3.8 万', remaining: '0', priority: 10, weight: 10, response: '9.25 秒', latency: 9250, lastTest: '27 天前', load: 100, enabled: true, tags: ['default'] },
    { id: 17, provider: 'OpenAI', name: 'apipro_chatgpt', model: 'gpt', used: '113.3 万', remaining: '0', priority: 10, weight: 10, response: '2.48 秒', latency: 2480, lastTest: '8 天前', load: 92.3, enabled: true, tags: ['default'] }
  ];
  let channels;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    channels = Array.isArray(stored) ? stored : seed;
  } catch { channels = seed; }
  channels = channels.map(channel => ({ ...channel, selected: false }));

  const page = document.querySelector('#channelsPage');
  const grid = document.querySelector('#channelGrid');
  const empty = document.querySelector('#channelEmpty');
  const bulkBar = document.querySelector('#channelBulkBar');
  const dialog = document.querySelector('#channelDialog');
  const form = document.querySelector('#channelForm');
  const toast = document.querySelector('.toast');
  let toastTimer;
  let viewMode = localStorage.getItem('maas-channel-view') === 'list' ? 'list' : 'grid';
  let editingId = null;

  const persist = () => localStorage.setItem(storageKey, JSON.stringify(channels.map(({ selected, ...channel }) => channel)));
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const showToast = message => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  const providerLabel = provider => provider === 'Alibaba' ? 'Alibaba Cloud' : provider;
  const providerClass = provider => ({ Anthropic: 'provider-anthropic', 'xAI': 'provider-xai', Alibaba: 'provider-alibaba' })[provider] || '';
  const providerMark = provider => ({ OpenAI: 'AI', Anthropic: 'A', 'xAI': 'x', Alibaba: '阿' })[provider] || provider.slice(0, 1).toUpperCase();

  function visibleChannels() {
    const query = document.querySelector('#channelSearch').value.trim().toLowerCase();
    const model = document.querySelector('#channelModelFilter').value;
    const status = document.querySelector('#channelStatusFilter').value;
    const type = document.querySelector('#channelTypeFilter').value;
    let result = channels.filter(channel => {
      const matchesQuery = !query || [channel.id, channel.name, channel.model, channel.provider].some(value => String(value).toLowerCase().includes(query));
      return matchesQuery && (model === 'all' || channel.model === model) && (status === 'all' || (status === 'enabled' ? channel.enabled : !channel.enabled)) && (type === 'all' || channel.provider === type);
    });
    return result;
  }

  function cardTemplate(channel) {
    const filled = Math.round(channel.load * 22 / 100);
    const bars = Array.from({ length: 22 }, (_, index) => `<i class="${channel.enabled && index < filled ? (channel.load > 95 ? 'is-warn' : 'is-filled') : ''}"></i>`).join('');
    const latencyClass = channel.latency < 2000 ? 'good' : channel.latency < 10000 ? 'warn' : 'slow';
    return `<article class="channel-card ${channel.enabled ? '' : 'is-disabled'}" data-channel-id="${channel.id}">
      <input class="channel-select" type="checkbox" aria-label="选择 ${escapeHtml(channel.name)}" ${channel.selected ? 'checked' : ''} />
      <div class="channel-card-head"><span class="channel-provider-mark ${providerClass(channel.provider)}" aria-hidden="true">${providerMark(channel.provider)}</span><span class="channel-provider-name">${escapeHtml(providerLabel(channel.provider))}</span><div class="channel-card-actions">
        <button class="channel-icon-button" data-action="test" title="测试响应" aria-label="测试 ${escapeHtml(channel.name)} 的响应"><svg viewBox="0 0 24 24"><path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><circle cx="12" cy="18" r="1"/></svg></button>
        <button class="channel-icon-button" data-action="edit" title="编辑渠道" aria-label="编辑 ${escapeHtml(channel.name)}"><svg viewBox="0 0 24 24"><path d="m4 16-.8 4.8L8 20l10.8-10.8a2.1 2.1 0 0 0-3-3L5 17"/><path d="m14.5 6.5 3 3"/></svg></button>
        <button class="channel-icon-button" data-action="toggle" title="${channel.enabled ? '停用渠道' : '启用渠道'}" aria-label="${channel.enabled ? '停用' : '启用'} ${escapeHtml(channel.name)}"><svg viewBox="0 0 24 24">${channel.enabled ? '<path d="M12 3v9"/><path d="M7.1 5.7a8 8 0 1 0 9.8 0"/>' : '<path d="M12 3v9"/><path d="M5.6 7.2a8 8 0 1 0 12.8 0"/>'}</svg></button>
        <button class="channel-icon-button" data-action="more" title="更多操作" aria-label="更多 ${escapeHtml(channel.name)} 操作"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button>
      </div></div>
      <div class="channel-menu" hidden><button type="button" data-menu-action="edit">编辑参数</button><button type="button" data-menu-action="test">测试渠道</button><button type="button" class="danger" data-menu-action="delete">删除演示渠道</button></div>
      <div class="channel-health"><div class="channel-health-bars" role="img" aria-label="负载 ${channel.enabled ? `${channel.load}%` : '已停用'}">${bars}</div><span class="channel-health-value">${channel.enabled ? `${channel.load.toFixed(1)}%` : '--'}</span></div>
      <div class="channel-meta-grid"><div><span class="channel-id">#${channel.id}</span><strong class="channel-name" title="${escapeHtml(channel.name)}">${escapeHtml(channel.name)}</strong></div><label class="channel-number-field">优先级<input type="number" min="0" max="999" value="${channel.priority}" data-field="priority" aria-label="${escapeHtml(channel.name)}优先级" /></label><label class="channel-number-field">权重<input type="number" min="0" max="999" value="${channel.weight}" data-field="weight" aria-label="${escapeHtml(channel.name)}权重" /></label></div>
      <div class="channel-usage"><div class="channel-consumption"><span class="channel-data-label">已使用/剩余</span><strong class="channel-data-value">${escapeHtml(String(channel.used).replace(/,/g, ''))} / ${escapeHtml(channel.remaining)}</strong></div><div class="channel-response-block"><span class="channel-data-label">响应</span><strong class="channel-data-value channel-response ${latencyClass}">${escapeHtml(channel.response)}</strong></div><div class="channel-last-test"><span class="channel-data-label">上次测试</span><strong class="channel-data-value">${escapeHtml(channel.lastTest)}</strong></div></div>
      <div class="channel-tags">${channel.tags.map((tag, index) => `<span class="channel-tag ${index ? 'vip' : ''}">${escapeHtml(tag)}</span>`).join('')}</div>
    </article>`;
  }

  function render() {
    const visible = visibleChannels();
    grid.innerHTML = visible.map(cardTemplate).join('');
    grid.classList.toggle('is-list', viewMode === 'list');
    document.querySelectorAll('[data-channel-view]').forEach(button => {
      const active = button.dataset.channelView === viewMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    empty.hidden = visible.length > 0;
    grid.hidden = visible.length === 0;
    bulkBar.hidden = document.querySelector('#channelBulkMode').getAttribute('aria-checked') !== 'true';
    page.classList.toggle('is-bulk-mode', !bulkBar.hidden);
    page.classList.toggle('is-tag-mode', document.querySelector('#channelTagMode').getAttribute('aria-checked') === 'true');
    const selected = channels.filter(channel => channel.selected).length;
    document.querySelector('#channelSelectedCount').textContent = `已选择 ${selected} 个`;
    document.querySelector('#channelSelectAll').checked = visible.length > 0 && visible.every(channel => channel.selected);
    persist();
  }

  function editChannel(channel) {
    editingId = channel.id;
    document.querySelector('#newChannelProvider').value = channel.provider;
    document.querySelector('#newChannelName').value = channel.name;
    document.querySelector('#newChannelModel').value = channel.model;
    document.querySelector('#newChannelPriority').value = channel.priority;
    document.querySelector('#newChannelWeight').value = channel.weight;
    dialog.querySelector('h2').textContent = '编辑渠道';
    dialog.querySelector('[type="submit"]').textContent = '保存修改';
    dialog.showModal();
  }

  function resetForm() {
    editingId = null;
    form.reset();
    dialog.querySelector('h2').textContent = '创建渠道';
    dialog.querySelector('[type="submit"]').textContent = '添加渠道';
  }

  document.querySelector('#channelSearch').addEventListener('input', render);
  ['#channelModelFilter', '#channelStatusFilter', '#channelTypeFilter'].forEach(selector => document.querySelector(selector).addEventListener('change', render));
  document.querySelectorAll('[data-channel-view]').forEach(button => button.addEventListener('click', () => {
    viewMode = button.dataset.channelView;
    localStorage.setItem('maas-channel-view', viewMode);
    document.querySelectorAll('[data-channel-view]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  }));
  document.querySelector('#channelBulkMode').addEventListener('click', event => {
    const enabled = event.currentTarget.getAttribute('aria-checked') !== 'true';
    event.currentTarget.setAttribute('aria-checked', String(enabled));
    if (!enabled) channels.forEach(channel => { channel.selected = false; });
    render();
  });
  document.querySelector('#channelTagMode').addEventListener('click', event => {
    const enabled = event.currentTarget.getAttribute('aria-checked') !== 'true';
    event.currentTarget.setAttribute('aria-checked', String(enabled));
    render();
  });
  document.querySelector('#channelSelectAll').addEventListener('change', event => {
    const visibleIds = new Set(visibleChannels().map(channel => channel.id));
    channels.forEach(channel => { if (visibleIds.has(channel.id)) channel.selected = event.target.checked; });
    render();
  });
  document.querySelector('#channelBulkEnable').addEventListener('click', () => {
    if (!channels.some(channel => channel.selected)) return showToast('请先选择渠道');
    channels.forEach(channel => { if (channel.selected) channel.enabled = true; });
    showToast('已启用所选渠道');
    render();
  });
  document.querySelector('#channelBulkDisable').addEventListener('click', () => {
    if (!channels.some(channel => channel.selected)) return showToast('请先选择渠道');
    channels.forEach(channel => { if (channel.selected) channel.enabled = false; });
    showToast('已停用所选渠道');
    render();
  });
  document.querySelector('#channelCreate').addEventListener('click', () => { resetForm(); dialog.showModal(); });
  document.querySelector('#channelDialogClose').addEventListener('click', () => dialog.close());
  document.querySelector('#channelDialogCancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', resetForm);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = {
      provider: document.querySelector('#newChannelProvider').value,
      name: document.querySelector('#newChannelName').value.trim(),
      model: document.querySelector('#newChannelModel').value.trim(),
      priority: Number(document.querySelector('#newChannelPriority').value),
      weight: Number(document.querySelector('#newChannelWeight').value)
    };
    if (editingId !== null) {
      const channel = channels.find(item => item.id === editingId);
      Object.assign(channel, values);
      showToast('渠道信息已更新');
    } else {
      const id = Math.max(0, ...channels.map(channel => channel.id)) + 1;
      channels.unshift({ id, ...values, used: '0', remaining: '0', response: '--', latency: 0, lastTest: '未测试', load: 0, enabled: true, tags: ['default'], selected: false });
      showToast('已创建演示渠道');
    }
    dialog.close();
    render();
  });

  grid.addEventListener('change', event => {
    const card = event.target.closest('.channel-card');
    if (!card) return;
    const channel = channels.find(item => item.id === Number(card.dataset.channelId));
    if (event.target.matches('.channel-select')) channel.selected = event.target.checked;
    if (event.target.matches('[data-field]')) channel[event.target.dataset.field] = Math.max(0, Math.min(999, Number(event.target.value) || 0));
    render();
  });
  grid.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    const menuButton = event.target.closest('[data-menu-action]');
    const card = event.target.closest('.channel-card');
    if (!card) return;
    const channel = channels.find(item => item.id === Number(card.dataset.channelId));
    if (actionButton?.dataset.action === 'more') {
      const menu = card.querySelector('.channel-menu');
      grid.querySelectorAll('.channel-menu').forEach(item => { if (item !== menu) item.hidden = true; });
      menu.hidden = !menu.hidden;
      return;
    }
    const action = menuButton?.dataset.menuAction || actionButton?.dataset.action;
    if (!action) return;
    card.querySelector('.channel-menu').hidden = true;
    if (action === 'toggle') {
      channel.enabled = !channel.enabled;
      showToast(channel.enabled ? '渠道已启用' : '渠道已停用');
    } else if (action === 'test') {
      channel.lastTest = '刚刚';
      showToast(`已完成 ${channel.name} 的演示测试`);
    } else if (action === 'edit') {
      editChannel(channel);
      return;
    } else if (action === 'delete') {
      if (!window.confirm(`删除演示渠道“${channel.name}”？`)) return;
      channels = channels.filter(item => item.id !== channel.id);
      showToast('演示渠道已删除');
    }
    render();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.channel-card-actions,.channel-menu')) grid.querySelectorAll('.channel-menu').forEach(menu => { menu.hidden = true; });
  });

  window.renderChannels = render;
  render();
})();
