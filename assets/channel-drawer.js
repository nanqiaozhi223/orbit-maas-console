// 渠道 · 创建渠道侧拉栏：按类型/关键词选择提供商或插件，选中后进入渠道配置表单（演示数据）
(() => {
  const trigger = document.querySelector('#channelCreate');
  if (!trigger) return;
  trigger.addEventListener('click', () => window.openChannelDrawer());

  // kind：builtin 内置 / plugin 插件 / gateway 网关 / custom 自定义；plugin 为附带的插件名
  const providers = [
    { name: 'OpenAI', desc: '接入 OpenAI API 或兼容其接口的服务', kind: 'builtin', plugin: 'Sora', id: 1, mark: 'AI', tone: 'dark' },
    { name: 'Anthropic', desc: '接入 Anthropic API 或兼容其接口的服务', kind: 'builtin', id: 14, mark: 'A', tone: 'orange' },
    { name: 'Gemini', desc: '通过 Google Gemini API 接入模型服务', kind: 'builtin', plugin: 'Google Veo (Gemini API)', id: 24, mark: 'G', tone: 'blue' },
    { name: 'AWS', desc: '通过 Amazon Bedrock 接入模型服务', kind: 'builtin', id: 33, mark: 'aws', tone: 'amber' },
    { name: 'DeepSeek', desc: '接入 DeepSeek 模型服务', kind: 'builtin', id: 43, mark: 'D', tone: 'indigo' },
    { name: 'Azure', desc: '接入 Azure 上部署的 OpenAI 模型', kind: 'builtin', id: 3, mark: 'Az', tone: 'sky' },
    { name: 'Vertex AI', desc: '通过 Google Cloud Vertex AI 接入模型服务', kind: 'builtin', plugin: 'Google Veo (Vertex AI)', id: 41, mark: 'V', tone: 'blue' },
    { name: '阿里百炼', desc: '接入阿里云百炼模型服务', kind: 'builtin', plugin: 'Alibaba Bailian', id: 17, mark: '阿', tone: 'violet' },
    { name: '火山方舟', desc: '接入火山方舟模型服务', kind: 'builtin', plugin: 'Doubao', id: 45, mark: '火', tone: 'sky' },
    { name: 'Moonshot', desc: '接入 Moonshot AI 模型服务', kind: 'builtin', id: 25, mark: 'M', tone: 'dark' },
    { name: '智谱GLM', desc: '通过智谱 V4 API 接入模型服务', kind: 'builtin', id: 26, mark: '智', tone: 'indigo' },
    { name: '腾讯', desc: '接入腾讯混元模型服务', kind: 'builtin', id: 23, mark: '腾', tone: 'sky' },
    { name: 'xAI', desc: '接入 xAI Grok 模型服务', kind: 'builtin', id: 48, mark: 'x', tone: 'dark' },
    { name: 'Sora', desc: '视频生成插件，基于 OpenAI 渠道扩展', kind: 'plugin', plugin: 'OpenAI', id: 52, mark: 'S', tone: 'dark' },
    { name: 'Google Veo', desc: '视频生成插件，支持 Gemini API 与 Vertex AI', kind: 'plugin', plugin: 'Gemini / Vertex AI', id: 53, mark: 'Ve', tone: 'blue' },
    { name: 'Midjourney Proxy', desc: '通过代理服务接入 Midjourney 绘图', kind: 'plugin', id: 2, mark: 'Mj', tone: 'violet' },
    { name: 'OpenRouter', desc: '通过 OpenRouter 聚合网关访问多家模型', kind: 'gateway', id: 20, mark: 'OR', tone: 'indigo' },
    { name: 'Cloudflare AI Gateway', desc: '经 Cloudflare AI Gateway 转发请求', kind: 'gateway', id: 39, mark: 'CF', tone: 'orange' },
    { name: 'LiteLLM', desc: '接入自建 LiteLLM 代理网关', kind: 'gateway', id: 55, mark: 'L', tone: 'amber' },
    { name: 'OpenAI 兼容', desc: '填写 Base URL，接入任意兼容 OpenAI 格式的服务', kind: 'custom', id: 8, mark: '{ }', tone: 'brand' },
    { name: 'Anthropic 兼容', desc: '填写 Base URL，接入任意兼容 Anthropic 格式的服务', kind: 'custom', id: 9, mark: '{ }', tone: 'brand' }
  ];
  const tabs = [['all', '全部'], ['builtin', '内置'], ['plugin', '插件'], ['gateway', '网关'], ['custom', '自定义']];
  const kindLabel = { builtin: '内置', plugin: '插件', gateway: '网关', custom: '自定义' };
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const plugIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0V5ZM8 11v3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  const drawer = document.createElement('dialog');
  drawer.className = 'channel-drawer';
  drawer.setAttribute('aria-labelledby', 'channelDrawerTitle');
  drawer.innerHTML = `
    <div class="cd-head">
      <span class="cd-head-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/><path d="M8 7.25h.01M8 16.75h.01"/></svg></span>
      <div><h2 id="channelDrawerTitle">创建渠道</h2><p>选择提供商或插件，开始配置渠道。</p></div>
      <button type="button" class="close cd-close" aria-label="关闭">×</button>
    </div>
    <div class="cd-body">
      <div class="cd-tabs" role="tablist" aria-label="渠道类型">${tabs.map(([key, label], i) => `<button type="button" role="tab" data-kind="${key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`).join('')}</div>
      <label class="cd-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><span class="sr-only">搜索提供商</span><input type="search" placeholder="搜索提供商、插件或类型编号" /></label>
      <div class="cd-grid"></div>
      <p class="cd-empty" hidden>没有匹配的提供商，试试其他关键词</p>
    </div>
    <div class="cd-foot"><span class="cd-count" aria-live="polite"></span><button type="button" class="btn-light cd-cancel">取消</button></div>`;
  document.body.append(drawer);

  const grid = drawer.querySelector('.cd-grid');
  const input = drawer.querySelector('.cd-search input');
  const tabButtons = [...drawer.querySelectorAll('.cd-tabs [role="tab"]')];
  let kind = 'all';

  function render() {
    const query = input.value.trim().toLowerCase().replace(/^#/, '');
    const list = providers.filter(p => (kind === 'all' || p.kind === kind) && (!query || [p.name, p.desc, p.plugin || '', String(p.id)].some(v => v.toLowerCase().includes(query))));
    grid.innerHTML = list.map(p => `<button type="button" class="cd-card" data-provider="${esc(p.name)}">
        <span class="cd-card-top"><span class="cd-mark tone-${p.tone}" aria-hidden="true">${esc(p.mark)}</span><strong>${esc(p.name)}</strong></span>
        <span class="cd-card-desc">${esc(p.desc)}</span>
        <span class="cd-card-foot"><span class="cd-tag">${kindLabel[p.kind]}</span>${p.plugin ? `<span class="cd-plugin" title="${esc(p.plugin)}">${plugIcon}<span>${esc(p.plugin)}</span></span>` : ''}<span class="cd-id">#${p.id}</span></span>
      </button>`).join('');
    drawer.querySelector('.cd-empty').hidden = list.length > 0;
    drawer.querySelector('.cd-count').textContent = `共 ${list.length} 个提供商`;
  }
  function selectTab(button) {
    kind = button.dataset.kind;
    tabButtons.forEach(tab => { const on = tab === button; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; });
    render();
  }

  tabButtons.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabButtons.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      const target = tabButtons[(next + tabButtons.length) % tabButtons.length];
      selectTab(target); target.focus();
    });
  });
  input.addEventListener('input', render);
  grid.addEventListener('click', event => {
    const card = event.target.closest('.cd-card');
    if (!card) return;
    drawer.close();
    window.openChannelForm?.(card.dataset.provider);
  });
  drawer.querySelector('.cd-close').addEventListener('click', () => drawer.close());
  drawer.querySelector('.cd-cancel').addEventListener('click', () => drawer.close());
  // 点击遮罩关闭
  drawer.addEventListener('click', event => { if (event.target === drawer) drawer.close(); });

  window.openChannelDrawer = () => {
    input.value = '';
    selectTab(tabButtons[0]);
    drawer.showModal();
    input.focus();
  };
})();
