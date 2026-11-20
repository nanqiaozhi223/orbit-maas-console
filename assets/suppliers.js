(() => {
  const root = document.querySelector('#supplierPage');
  if (!root) return;

  /* ================= 工具 ================= */
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (v, cur = '¥') => cur + Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = v => '¥' + Number(v || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  const pct = v => (v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + v.toFixed(1) + '%');
  const diffCls = v => (v > 0.005 ? 'sp-diff-up' : v < -0.005 ? 'sp-diff-down' : '');
  const diffTxt = v => (v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '-' : '') + money(Math.abs(v)));
  const now = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  const prevMonth = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const monthText = m => `${m.slice(0, 4)}年${Number(m.slice(5, 7))}月`;

  /* ================= 数据 ================= */
  const TYPE = { oem: '模型原厂', third: '第三方服务商', internal: '内部自部署' };
  const CURRENCY = { CNY: { sym: '¥', name: '人民币' }, USD: { sym: '$', name: '美元' } };
  const SERVICE = {
    ok: ['正常', 'ok'], partial: ['部分异常', 'warn'], down: ['不可用', 'bad'],
    offhours: ['非服务时段', 'neutral'], nodata: ['无数据', 'off']
  };
  const BILL_STATUS = { pending: ['待录入', 'neutral'], draft: ['分摊中', 'warn'], settled: ['已结算', 'ok'] };

  const seed = () => {
    const ch = (id, supplierId, name, models, requests, tokens, estCost, success, latency, status) =>
      ({ id, supplierId, name, models, requests, tokens, estCost, success, latency, status });
    const m = (name, type, inP, outP) => ({ name, type, inP, outP });

    const channels = [
      ch('ch-zp-1', 'sup-zhipu', '智谱-主力通道', [m('GLM-5.3', '文本', 4, 16), m('GLM-5-Air', '文本', 1, 4)], 1260000, 5200000, 10000, 99.4, '1.2s', 'ok'),
      ch('ch-zp-2', 'sup-zhipu', '智谱-高并发通道', [m('GLM-5.3', '文本', 4.2, 16.8)], 760000, 3100000, 6000, 98.8, '1.5s', 'ok'),
      ch('ch-zp-3', 'sup-zhipu', '智谱-灰度通道', [m('GLM-5-Air', '文本', 1.1, 4.4)], 420000, 1800000, 4000, 97.2, '1.9s', 'partial'),

      ch('ch-an-1', 'sup-anthropic', 'Anthropic-官方', [m('claude-sonnet-5', '文本', 3, 15), m('claude-haiku-4-5', '文本', 0.8, 4)], 980000, 4200000, 15800, 99.6, '2.1s', 'ok'),
      ch('ch-an-2', 'sup-anthropic', 'Anthropic-备用', [m('claude-sonnet-5', '文本', 3.1, 15.5)], 310000, 1250000, 5500, 98.1, '2.6s', 'ok'),

      ch('ch-oa-1', 'sup-openai', 'OpenAI-主账号', [m('gpt-5.4', '文本', 2.5, 10), m('gpt-5.4-mini', '文本', 0.5, 2)], 1450000, 6300000, 32000, 99.2, '1.8s', 'ok'),
      ch('ch-oa-2', 'sup-openai', 'OpenAI-批次通道', [m('gpt-5.4-mini', '文本', 0.55, 2.2)], 620000, 2600000, 13000, 97.8, '2.4s', 'ok'),

      ch('ch-al-1', 'sup-aliyun', '百炼-通义主通道', [m('qwen3-max', '文本', 2, 8), m('qwen3-plus', '文本', 0.8, 3.2)], 2100000, 8800000, 24000, 99.5, '0.9s', 'ok'),
      ch('ch-al-2', 'sup-aliyun', '百炼-嵌入通道', [m('text-embedding-v4', '嵌入', 0.5, 0)], 860000, 3400000, 8000, 99.7, '0.4s', 'ok'),

      ch('ch-ds-1', 'sup-deepseek', 'DeepSeek-主通道', [m('deepseek-v4', '文本', 1, 4)], 1680000, 7100000, 18000, 99.3, '1.1s', 'ok'),

      ch('ch-mo-1', 'sup-moonshot', 'Moonshot-主通道', [m('kimi-k2.5', '文本', 2, 8)], 980000, 3900000, 12000, 98.9, '1.6s', 'ok'),

      ch('ch-vo-1', 'sup-volc', '火山-豆包主力', [m('doubao-pro', '文本', 1.2, 4.8), m('doubao-lite', '文本', 0.3, 1.2)], 1320000, 5600000, 9800, 99.1, '0.8s', 'ok'),
      ch('ch-vo-2', 'sup-volc', '火山-备用', [m('doubao-pro', '文本', 1.25, 5)], 260000, 1100000, 0, 96.4, '1.7s', 'partial'),

      ch('ch-sf-1', 'sup-silicon', '硅基-聚合通道', [m('qwen3-max', '文本', 2.2, 8.4), m('deepseek-v4', '文本', 1.1, 4.2)], 540000, 2200000, 7600, 95.2, '1.9s', 'partial'),

      ch('ch-tc-1', 'sup-tencent', '腾讯-混元通道', [m('hunyuan-pro', '文本', 1.5, 6)], 320000, 1300000, 5400, 91.8, '2.8s', 'down'),

      ch('ch-in-1', 'sup-self', '智算集群-A100', [m('llama-4-70b', '自建', 0, 0)], 640000, 2800000, 0, 99.8, '0.6s', 'ok'),
      ch('ch-in-2', 'sup-self-edge', '边缘推理-推理卡', [m('qwen3-14b', '自建', 0, 0)], 210000, 900000, 0, 98.6, '0.9s', 'offhours'),

      ch('ch-az-1', 'sup-azure', 'Azure-东亚', [m('gpt-5.4', '文本', 3.2, 12.8)], 460000, 1900000, 15000, 99.0, '1.7s', 'ok'),

      // 未关联渠道
      ch('ch-free-1', null, '待分配-通义备用', [m('qwen3-plus', '文本', 0.85, 3.4)], 120000, 480000, 2600, 98.4, '1.2s', 'ok'),
      ch('ch-free-2', null, '待分配-第三方聚合', [m('gpt-5.4-mini', '文本', 0.6, 2.4), m('claude-haiku-4-5', '文本', 0.9, 4.4)], 88000, 350000, 3300, 97.6, '1.6s', 'ok')
    ];

    const sup = (id, name, type, color, site, owner, contact, desc, settle, currency, rate, method, enabled, service, success, createdAt) =>
      ({ id, name, type, color, site, owner, contact, desc, settle, currency, rate, method, enabled, service, success, createdAt, updatedAt: createdAt, logs: [] });

    const suppliers = [
      sup('sup-zhipu', '智谱 AI', 'oem', '', 'https://www.zhipuai.cn', '黎彤', 'sales@zhipu.example', 'GLM 系列模型原厂直连，主力办公与业务通道。', true, 'CNY', 1, '按量计费', true, 'ok', 99.1, '2026-03-12 10:20'),
      sup('sup-anthropic', 'Anthropic', 'oem', 'orange', 'https://www.anthropic.com', '王茜云', 'ap@anthropic.example', 'Claude 系列原厂，美元账单按月结算。', true, 'USD', 7.1, '按量计费', true, 'ok', 99.4, '2026-02-08 09:40'),
      sup('sup-openai', 'OpenAI', 'oem', 'blue', 'https://openai.com', '阳蕾', 'billing@openai.example', 'GPT 系列官方账号，主力业务模型。', true, 'USD', 7.05, '按量计费', true, 'ok', 99.0, '2026-01-22 14:10'),
      sup('sup-aliyun', '阿里云百炼', 'oem', 'orange', 'https://bailian.aliyun.com', '李攀登', 'bailian@aliyun.example', '通义千问与向量模型，支持国内直连。', true, 'CNY', 1, '按量计费', true, 'ok', 99.5, '2026-03-01 11:05'),
      sup('sup-deepseek', 'DeepSeek', 'oem', 'blue', 'https://www.deepseek.com', '韩一畅', 'api@deepseek.example', '代码与推理场景主力供应商。', true, 'CNY', 1, '按量计费', true, 'ok', 99.3, '2026-04-18 16:30'),
      sup('sup-moonshot', '月之暗面', 'oem', 'purple', 'https://www.moonshot.cn', '吉睿翔', 'bd@moonshot.example', 'Kimi 系列长上下文模型。', true, 'CNY', 1, '按量计费', true, 'ok', 98.9, '2026-05-09 10:00'),
      sup('sup-volc', '火山引擎', 'third', 'pink', 'https://www.volcengine.com', '黄少政', 'doubao@volc.example', '豆包系列模型聚合服务，多档计费。', true, 'CNY', 1, '按量计费', true, 'partial', 98.2, '2026-06-14 09:12'),
      sup('sup-silicon', '硅基流动', 'third', 'purple', 'https://siliconflow.cn', '马宇佳', 'support@silicon.example', '多模型聚合，价格低但稳定性一般。', true, 'CNY', 1, '预充值', true, 'partial', 95.2, '2026-07-02 15:45'),
      sup('sup-tencent', '腾讯云 TI', 'third', 'blue', 'https://cloud.tencent.com', '黄志锋', 'ti@tencent.example', '混元模型托管服务，当前上游不可用。', true, 'CNY', 1, '包月', true, 'down', 91.8, '2026-07-28 13:20'),
      sup('sup-azure', 'Azure OpenAI', 'third', 'blue', 'https://azure.microsoft.com', '张一鸣', 'azure@microsoft.example', '海外合规区域部署，美元结算。', true, 'USD', 7.12, '按量计费', false, 'ok', 99.0, '2026-08-11 17:08'),
      sup('sup-self', '内部自部署-智算集群', 'internal', '', '—', '运维团队', 'ops@intsig.example', 'A100 集群自建推理服务，仅参与资源监控。', false, 'CNY', 1, '内部结算', true, 'ok', 99.8, '2026-01-05 08:00'),
      sup('sup-self-edge', '内部自部署-边缘推理', 'internal', 'purple', '—', '运维团队', 'ops@intsig.example', '边缘机房推理节点，夜间非服务时段。', false, 'CNY', 1, '内部结算', true, 'offhours', 98.6, '2026-02-20 08:00')
    ];

    suppliers.forEach(s => {
      if (s.type === 'internal') s.settle = false;
      s.logs = [
        { at: s.createdAt, who: '平台管理员', act: '创建供应商', detail: `类型：${TYPE[s.type]}`, result: '成功' },
        { at: s.createdAt, who: '平台管理员', act: '配置结算', detail: s.settle ? `默认币种 ${s.currency} · 汇率 ${s.rate}` : '未参与月度结算', result: '成功' }
      ];
    });

    const bills = [
      {
        id: 'bill-202610-zhipu', supplierId: 'sup-zhipu', month: '2026-10', status: 'settled',
        currency: 'CNY', rate: 1, amount: 21000, cny: 21000, est: 20000,
        adjust: [{ month: '2026-09', type: 'pay', currency: 'CNY', rate: 1, amount: 700, cny: 700, reason: '9 月账单尾差补缴', att: '' }],
        settle: 21700, settledAt: '2026-11-06 15:22', operator: '黎彤', version: 1, allocations: null,
        records: [{ at: '2026-11-05 10:12', who: '黎彤', act: '录入账单', detail: '原币金额 ¥21,000.00', result: '成功' }, { at: '2026-11-06 15:22', who: '黎彤', act: '确认结算', detail: '实际结算 ¥21,700.00', result: '成功' }]
      },
      {
        id: 'bill-202610-anthropic', supplierId: 'sup-anthropic', month: '2026-10', status: 'settled',
        currency: 'USD', rate: 7.1, amount: 3000, cny: 21300, est: 21300,
        adjust: [], settle: 21300, settledAt: '2026-11-07 09:40', operator: '王茜云', version: 1, allocations: null,
        records: [{ at: '2026-11-06 18:02', who: '王茜云', act: '录入账单', detail: 'USD 3,000.00 @ 7.1', result: '成功' }, { at: '2026-11-07 09:40', who: '王茜云', act: '确认结算', detail: '实际结算 ¥21,300.00', result: '成功' }]
      },
      {
        id: 'bill-202610-moonshot', supplierId: 'sup-moonshot', month: '2026-10', status: 'settled',
        currency: 'CNY', rate: 1, amount: 12800, cny: 12800, est: 12000,
        adjust: [], settle: 12800, settledAt: '2026-11-08 11:05', operator: '黎彤', version: 1, allocations: null,
        records: [{ at: '2026-11-08 10:20', who: '黎彤', act: '录入账单', detail: '原币金额 ¥12,800.00', result: '成功' }, { at: '2026-11-08 11:05', who: '黎彤', act: '确认结算', detail: '实际结算 ¥12,800.00', result: '成功' }]
      },
      {
        id: 'bill-202610-openai', supplierId: 'sup-openai', month: '2026-10', status: 'draft',
        currency: 'USD', rate: 7.05, amount: 6200, cny: 43710, est: 45000,
        adjust: [], settle: 43710, settledAt: '', operator: '', version: 1, allocations: null,
        records: [{ at: '2026-11-15 16:30', who: '阳蕾', act: '保存草稿', detail: 'USD 6,200.00 @ 7.05', result: '成功' }]
      },
      {
        id: 'bill-202610-aliyun', supplierId: 'sup-aliyun', month: '2026-10', status: 'pending',
        currency: 'CNY', rate: 1, amount: null, cny: null, est: 32000, adjust: [], settle: null, settledAt: '', operator: '', version: 1, allocations: null, records: []
      },
      {
        id: 'bill-202610-deepseek', supplierId: 'sup-deepseek', month: '2026-10', status: 'pending',
        currency: 'CNY', rate: 1, amount: null, cny: null, est: 18000, adjust: [], settle: null, settledAt: '', operator: '', version: 1, allocations: null, records: []
      }
    ];

    return { suppliers, channels, bills };
  };

  const STORE = 'maas-supplier-v2';
  let db;
  try { db = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch { db = null; }
  if (!db || !Array.isArray(db.suppliers)) db = seed();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch {} };

  /* ================= 派生 ================= */
  const supOf = id => db.suppliers.find(s => s.id === id);
  const chOf = id => db.channels.find(c => c.id === id);
  const billOf = id => db.bills.find(b => b.id === id);
  const channelsOf = s => db.channels.filter(c => c.supplierId === s.id);
  const estOf = s => channelsOf(s).reduce((sum, c) => sum + Number(c.estCost || 0), 0);
  const modelsOf = s => {
    const map = new Map();
    channelsOf(s).forEach(c => (c.models || []).forEach(m => {
      const cur = map.get(m.name) || { name: m.name, type: m.type, inMin: m.inP, inMax: m.inP, outMin: m.outP, outMax: m.outP, chs: 0, calls: 0, est: 0 };
      cur.inMin = Math.min(cur.inMin, m.inP); cur.inMax = Math.max(cur.inMax, m.inP);
      cur.outMin = Math.min(cur.outMin, m.outP); cur.outMax = Math.max(cur.outMax, m.outP);
      cur.chs += 1; cur.calls += Math.round((c.requests || 0) / Math.max(1, (c.models || []).length));
      cur.est += (c.estCost || 0) / Math.max(1, (c.models || []).length);
      map.set(m.name, cur);
    }));
    return [...map.values()];
  };
  const billOfSupplierMonth = (sid, month) => db.bills.find(b => b.supplierId === sid && b.month === month);
  const ensureBill = (sid, month) => {
    let b = billOfSupplierMonth(sid, month);
    if (!b) {
      const s = supOf(sid);
      b = { id: 'bill-' + month.replace('-', '') + '-' + sid.replace('sup-', ''), supplierId: sid, month, status: 'pending', currency: s.currency, rate: s.rate, amount: null, cny: null, est: estOf(s), adjust: [], settle: null, settledAt: '', operator: '', version: 1, allocations: null, records: [] };
      db.bills.push(b); save();
    }
    return b;
  };

  /* ================= 状态 ================= */
  const st = {
    view: 'list', supplierId: null, tab: 'basic',
    q: '', type: 'all', enabled: 'all', service: 'all', page: 1, size: 10,
    month: prevMonth(), bq: '', btype: 'all', bcurrency: 'all', bstatus: 'all',
    billId: null, step: 1, method: 'usage', draft: null, drawerCh: null,
    monitorRange: '24h', expandedCh: new Set()
  };
  let toastTimer = null;
  const toast = (msg, isErr) => {
    const el = root.querySelector('#spToast'); if (!el) return;
    const loading = msg === '正在计算成本分摊，请稍候';
    el.innerHTML = loading ? `<span class="sp-toast-spinner" aria-hidden="true"></span><span>${esc(msg)}</span>` : esc(msg);
    el.classList.toggle('loading', loading); el.classList.toggle('err', !!isErr); el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), loading ? 5000 : 2400);
  };

  /* ================= 样式片段 ================= */
  const badge = (text, kind) => `<span class="sp-badge ${kind}"><em class="sp-dot"></em><span>${esc(text)}</span></span>`;
  const serviceBadge = s => badge(SERVICE[s][0], SERVICE[s][1]);
  const statusBadge = b => badge(BILL_STATUS[b.status][0], BILL_STATUS[b.status][1]);
  const typeBadge = t => badge(TYPE[t], t === 'internal' ? 'neutral' : t === 'third' ? 'info' : 'ok');
  const logo = (s, cls = '') => `<span class="sp-logo ${s.color || ''} ${cls}">${esc(s.name.replace(/[^\u4e00-\u9fa5A-Za-z]/g, '').slice(0, 1) || 'S')}</span>`;
  const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  /* ================= 列表 ================= */
  function filteredSuppliers() {
    const q = st.q.trim().toLowerCase();
    return db.suppliers.filter(s => {
      if (q && !(s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))) return false;
      if (st.type !== 'all' && s.type !== st.type) return false;
      if (st.enabled !== 'all' && String(s.enabled) !== st.enabled) return false;
      if (st.service !== 'all' && s.service !== st.service) return false;
      return true;
    });
  }

  function listView() {
    const all = db.suppliers;
    const enabled = all.filter(s => s.enabled).length;
    const abnormal = all.filter(s => s.service === 'partial' || s.service === 'down').length;
    const channelTotal = db.channels.filter(c => c.supplierId).length;
    const modelTotal = new Set(db.channels.filter(c => c.supplierId).flatMap(c => (c.models || []).map(m => m.name))).size;
    const list = filteredSuppliers();
    const pages = Math.max(1, Math.ceil(list.length / st.size));
    st.page = Math.min(st.page, pages);
    const rows = list.slice((st.page - 1) * st.size, st.page * st.size);

    return `<div class="sp-head">
      <div><h1>供应商列表</h1><p>统一管理模型服务供应商、关联渠道与服务状态。</p></div>
    </div>
    <div class="sp-stats">
      <div class="sp-stat"><span>供应商总数</span><strong>${all.length}</strong><small>平台已接入</small></div>
      <div class="sp-stat"><span>已启用供应商</span><strong>${enabled}</strong><small>可参与服务路由</small></div>
      <div class="sp-stat"><span>异常供应商</span><strong class="${abnormal ? 'sp-negative' : ''}">${abnormal}</strong><small>部分异常或不可用</small></div>
      <div class="sp-stat"><span>关联渠道</span><strong>${channelTotal}</strong><small>覆盖 ${modelTotal} 个模型服务</small></div>
    </div>
    <div class="sp-toolbar">
      <label class="sp-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input data-field="q" placeholder="搜索供应商名称或 ID" value="${esc(st.q)}" /></label>
      <button class="sp-primary" data-act="refresh">确认</button>
      <span class="sp-spacer"></span>
      <button class="sp-primary" data-act="add">+ 新增供应商</button>
    </div>
    <section class="sp-card">
      <div class="sp-table-wrap">
        <table class="sp-table">
          <thead><tr>
            <th class="sp-sticky-l">供应商名称</th>
            <th>供应商类型 <button type="button" class="sp-filter${st.type !== 'all' ? ' on' : ''}" data-spfilter="type" aria-label="筛选供应商类型" aria-haspopup="true"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M975.961 63.04A101.347 101.347 0 0 0 879.865 0.026H141.553a101.872 101.872 0 0 0-71.94 173.813l337.649 323.996v322.42a44.11 44.11 0 0 0 12.602 30.982l106.65 106.65a44.11 44.11 0 0 0 62.36 0l106.65-106.65a44.11 44.11 0 0 0 12.6-30.982V497.835l337.65-323.996a101.35 101.35 0 0 0-59.813-110.8z" fill="currentColor"/></svg></button></th>
            <th class="num">关联渠道</th><th class="num">关联模型</th>
            <th>启用状态 <button type="button" class="sp-filter${st.enabled !== 'all' ? ' on' : ''}" data-spfilter="enabled" aria-label="筛选启用状态" aria-haspopup="true"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M975.961 63.04A101.347 101.347 0 0 0 879.865 0.026H141.553a101.872 101.872 0 0 0-71.94 173.813l337.649 323.996v322.42a44.11 44.11 0 0 0 12.602 30.982l106.65 106.65a44.11 44.11 0 0 0 62.36 0l106.65-106.65a44.11 44.11 0 0 0 12.6-30.982V497.835l337.65-323.996a101.35 101.35 0 0 0-59.813-110.8z" fill="currentColor"/></svg></button></th>
            <th class="sp-sticky-r" style="text-align:left">操作</th>
          </tr></thead>
          <tbody>${rows.map(rowHTML).join('')}</tbody>
        </table>
        ${list.length ? '' : `<div class="sp-empty"><strong>没有匹配的供应商</strong><span>调整搜索或筛选条件后再试。</span></div>`}
      </div>
      <div class="sp-pager">
        <span>共 ${list.length} 家供应商</span>
        <label>每页<select data-field="size">${[10, 20, 50].map(n => `<option value="${n}"${st.size === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="sp-pager-ctl">
          <button data-act="prev"${st.page === 1 ? ' disabled' : ''} aria-label="上一页">‹</button>
          <span>${st.page} / ${pages}</span>
          <button data-act="next"${st.page === pages ? ' disabled' : ''} aria-label="下一页">›</button>
        </div>
      </div>
    </section>`;
  }

  function rowHTML(s) {
    const chs = channelsOf(s);
    const models = modelsOf(s).length;
    const rate = s.currency === 'CNY' ? '1.0000' : Number(s.rate).toFixed(4);
    return `<tr>
      <td class="sp-sticky-l"><div class="sp-name">${logo(s)}<div><button data-act="detail" data-id="${s.id}"><b>${esc(s.name)}</b></button><small>${esc(s.id)}</small></div></div></td>
      <td>${typeBadge(s.type)}</td>
      <td class="num"><button class="sp-link" style="height:26px;padding:0 8px" data-act="tab-channels" data-id="${s.id}">${chs.length}</button></td>
      <td class="num">${models}</td>
      <td>${s.enabled ? badge('已启用', 'ok') : badge('已禁用', 'off')}</td>
      <td class="sp-sticky-r"><div class="sp-actions">
        <button data-act="detail" data-id="${s.id}">详情</button>
        <button class="icon more-dots" data-act="more" data-id="${s.id}" aria-label="${esc(s.name)} 更多操作"><span aria-hidden="true">•••</span></button>
      </div></td>
    </tr>`;
  }

  /* ================= 详情 ================= */
  function detailView() {
    const s = supOf(st.supplierId);
    if (!s) return `<div class="sp-empty"><strong>供应商不存在</strong></div>`;
    const chs = channelsOf(s);
    const models = modelsOf(s);
    const tabs = [['basic', '基础信息'], ['channels', '关联渠道'], ['monitor', '服务监控'], ['logs', '操作记录']];
    return `<nav class="sp-crumb"><button data-act="back-list">供应商管理</button><i>/</i><button data-act="back-list">供应商列表</button><i>/</i><span>供应商详情</span></nav>
    <div class="sp-detail-head">
      <div class="sp-detail-id">${logo(s, 'lg')}
        <div><h1>${esc(s.name)} ${typeBadge(s.type)} ${s.enabled ? badge('已启用', 'ok') : badge('已禁用', 'off')}</h1>
        <p>${esc(s.desc || '—')}</p></div>
      </div>
    </div>
    <div class="sp-metrics">
      <div class="sp-stat"><span>关联渠道</span><strong>${chs.length}</strong><small>参与路由的渠道</small></div>
      <div class="sp-stat"><span>关联模型</span><strong>${models.length}</strong><small>去重后的模型数</small></div>
      <div class="sp-stat"><span>近 24h 调用成功率</span><strong>${s.success ? s.success.toFixed(1) + '%' : '—'}</strong><small>按上游响应统计</small></div>
      <div class="sp-stat"><span>最近更新时间</span><strong style="font-size:15px">${esc((s.updatedAt || s.createdAt || '').slice(0, 10))}</strong><small>供应商信息最后修改</small></div>
    </div>
    <div class="sp-tabs" role="tablist">${tabs.map(([id, label]) => `<button data-act="tab" data-tab="${id}" class="${st.tab === id ? 'active' : ''}" role="tab" aria-selected="${st.tab === id}">${label}</button>`).join('')}</div>
    <section class="sp-panel">${tabHTML(s)}</section>`;
  }

  function tabHTML(s) {
    if (st.tab === 'channels') return channelsTab(s);
    if (st.tab === 'monitor') return monitorTab(s);
    if (st.tab === 'logs') return logsTab(s);
    return basicTab(s);
  }

  function basicTab(s) {
    const rate = s.currency === 'CNY' ? '1.0000（本币固定）' : `${Number(s.rate).toFixed(4)}`;
    return `<div class="sp-panel-head"><h2>基础资料</h2><button class="sp-ghost sp-edit-btn" data-act="edit" data-id="${s.id}">编辑</button></div>
    <dl class="sp-dl">
      <div><dt>供应商名称</dt><dd>${esc(s.name)}</dd></div>
      <div><dt>供应商 ID</dt><dd>${esc(s.id)}</dd></div>
      <div><dt>供应商类型</dt><dd>${TYPE[s.type]}</dd></div>
      <div><dt>官网地址</dt><dd>${s.site && s.site !== '—' ? `<a href="${esc(s.site)}" target="_blank" rel="noopener">${esc(s.site)}</a>` : '—'}</dd></div>
      <div><dt>内部负责人</dt><dd>${esc(s.owner || '—')}</dd></div>
      <div><dt>联系方式</dt><dd>${esc(s.contact || '—')}</dd></div>
      <div><dt>结算方式</dt><dd>${esc(s.method || '—')}</dd></div>
      <div><dt>创建时间</dt><dd>${esc(s.createdAt)}</dd></div>
      <div><dt>更新时间</dt><dd>${esc(s.updatedAt)}</dd></div>
      <div style="grid-column:1/-1"><dt>备注</dt><dd>${esc(s.desc || '—')}</dd></div>
    </dl>
    <h2>服务状态说明</h2>
    <p class="sp-hint">启用状态由管理员控制；服务状态由系统根据关联渠道运行情况自动判断，两者独立展示。</p>`;
  }

  function channelsTab(s) {
    const chs = channelsOf(s);
    return `<div class="sp-toolbar" style="margin-bottom:12px">
      <label class="sp-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input data-field="chq" placeholder="搜索渠道名称" value="${esc(st.chq || '')}" /></label>
      <select class="sp-select" data-field="chstatus"><option value="all">全部状态</option>${Object.entries(SERVICE).map(([k, v]) => `<option value="${k}"${(st.chstatus || 'all') === k ? ' selected' : ''}>${v[0]}</option>`).join('')}</select>
      <span class="sp-spacer"></span>
      <button class="sp-primary" data-act="associate" data-id="${s.id}">关联渠道</button>
    </div>
    <div class="sp-table-wrap" style="max-height:none">
      <table class="sp-table" style="min-width:720px">
        <thead><tr><th style="width:260px">渠道名称</th><th>渠道 ID</th><th class="num">关联模型</th><th>服务状态</th><th style="text-align:right">操作</th></tr></thead>
        <tbody>${chs.filter(c => (!(st.chq || '').trim() || c.name.toLowerCase().includes(st.chq.trim().toLowerCase())) && ((st.chstatus || 'all') === 'all' || c.status === st.chstatus)).map(c => {
          const open = (st.expandedCh || new Set()).has(c.id);
          return `<tr class="sp-ch-row${open ? ' is-open' : ''}">
          <td><div class="sp-ch-name"><button class="sp-expand" data-act="ch-expand" data-ch="${c.id}" aria-expanded="${open}" aria-label="展开 ${esc(c.name)} 关联的模型">›</button><strong>${esc(c.name)}</strong></div></td>
          <td><code style="font-size:11px;color:var(--ui-text-muted)">${esc(c.id)}</code></td>
          <td class="num">${(c.models || []).length}</td>
          <td>${badge(SERVICE[c.status][0], SERVICE[c.status][1])}</td>
          <td><div class="sp-actions"><button data-act="channel-info" data-ch="${c.id}">查看详情</button><button data-act="unlink" data-ch="${c.id}" data-id="${s.id}">解除关联</button></div></td>
        </tr>${open ? channelModelsRow(c) : ''}`;
        }).join('')}</tbody>
      </table>
      ${chs.length ? '' : `<div class="sp-empty"><strong>尚未关联渠道</strong><span>点击右上角「关联渠道」从渠道库中选择。</span></div>`}
    </div>`;
  }

  function channelModelsRow(c) {
    const models = c.models || [];
    if (!models.length) return `<tr class="sp-subrow"><td colspan="5"><div class="sp-sub-empty">该渠道暂未关联模型</div></td></tr>`;
    const total = models.length;
    return `<tr class="sp-subrow"><td colspan="5">
      <div class="sp-sub-wrap">
        <div class="sp-sub-title">${esc(c.name)} · 关联模型 <span>${total} 个</span></div>
        <table class="sp-subtable">
          <thead><tr><th>模型名称</th><th>类型</th><th>服务状态</th></tr></thead>
          <tbody>${models.map(m => `<tr>
            <td><strong>${esc(m.name)}</strong></td>
            <td>${esc(m.type)}</td>
            <td>${badge(SERVICE[c.status][0], SERVICE[c.status][1])}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </td></tr>`;
  }

  function modelsTab(s) {
    const models = modelsOf(s);
    return `<div class="sp-table-wrap" style="max-height:none">
      <table class="sp-table" style="min-width:920px">
        <thead><tr><th>模型名称</th><th>模型类型</th><th class="num">服务渠道数</th><th class="num">输入价格区间</th><th class="num">输出价格区间</th><th class="num">本月调用量</th><th class="num">本月预估成本</th><th style="text-align:right">操作</th></tr></thead>
        <tbody>${models.map(m => `<tr>
          <td><strong>${esc(m.name)}</strong></td>
          <td>${esc(m.type)}</td>
          <td class="num">${m.chs}</td>
          <td class="num">${m.inMin === m.inMax ? money(m.inMin) : `${money(m.inMin)} – ${money(m.inMax)}`}</td>
          <td class="num">${m.outMin === m.outMax ? money(m.outMin) : `${money(m.outMin)} – ${money(m.outMax)}`}</td>
          <td class="num">${m.calls.toLocaleString()}</td>
          <td class="num">${money(m.est)}</td>
          <td><div class="sp-actions"><button data-act="model-info" data-name="${esc(m.name)}">查看模型</button></div></td>
        </tr>`).join('')}</tbody>
      </table>
      ${models.length ? '' : `<div class="sp-empty"><strong>暂无关联模型</strong></div>`}
    </div>
    <p class="sp-hint" style="margin-top:12px">模型数据复用「模型管理」与渠道配置，同一模型多档价格时展示区间。</p>`;
  }

  function monitorTab(s) {
    const ranges = [['1h', '近 1 小时'], ['24h', '近 24 小时'], ['7d', '近 7 天'], ['custom', '自定义']];
    const chs = channelsOf(s);
    const success = 97.2, requests = 128400, ttft = 0.86, rpm = 42.6, tpm = 186000, cache = 23.4;
    const trend = [88, 92, 90, 95, 93, 97, 96, 94, 98, 97, 96, 99];
    const reqTrend = [40, 62, 51, 74, 68, 88, 72, 91, 79, 86, 70, 82];
    return `<div class="sp-section-title"><h2>服务监控</h2>
      <div class="sp-toolbar" style="margin:0">${ranges.map(([k, v]) => `<button class="sp-link" style="${st.monitorRange === k ? 'border-color:var(--ui-brand-strong);color:var(--ui-brand-deep);background:rgba(163,230,53,.12)' : ''}" data-act="range" data-range="${k}">${v}</button>`).join('')}</div>
    </div>
    <div class="sp-stats" style="grid-template-columns:repeat(6,minmax(0,1fr));margin-bottom:16px">
      <div class="sp-stat"><span>调用成功率</span><strong>${success}%</strong></div>
      <div class="sp-stat"><span>请求总量</span><strong>${requests.toLocaleString()}</strong></div>
      <div class="sp-stat"><span>平均首 Token 延迟</span><strong>${ttft}s</strong></div>
      <div class="sp-stat"><span>平均 RPM</span><strong>${rpm}</strong></div>
      <div class="sp-stat"><span>平均 TPM</span><strong>${(tpm / 1000).toFixed(0)}K</strong></div>
      <div class="sp-stat"><span>缓存命中率</span><strong>${cache}%</strong></div>
    </div>
    <div class="sp-split">
      <div><h2>调用成功率趋势</h2><div class="sp-chart">${trend.map((v, i) => `<div><i style="height:${v}%"></i><span>${i + 1}</span></div>`).join('')}</div></div>
      <div><h2>请求量趋势</h2><div class="sp-chart">${reqTrend.map((v, i) => `<div><i style="height:${v}%;background:linear-gradient(180deg,rgba(96,165,250,.9),rgba(37,99,235,.35))"></i><span>${i + 1}</span></div>`).join('')}</div></div>
    </div>
    <h2>渠道异常及错误码分布</h2>
    <div class="sp-table-wrap" style="max-height:none">
      <table class="sp-table" style="min-width:0">
        <thead><tr><th>错误码</th><th>含义</th><th class="num">次数</th><th class="num">占比</th></tr></thead>
        <tbody>
          <tr><td>429</td><td>上游限流</td><td class="num">1,284</td><td class="num">36.2%</td></tr>
          <tr><td>502</td><td>上游网关错误</td><td class="num">968</td><td class="num">27.3%</td></tr>
          <tr><td>timeout</td><td>首 Token 超时</td><td class="num">742</td><td class="num">20.9%</td></tr>
          <tr><td>401</td><td>鉴权失败</td><td class="num">552</td><td class="num">15.6%</td></tr>
        </tbody>
      </table>
    </div>`;
  }

  function billsTab(s) {
    const rows = db.bills.filter(b => b.supplierId === s.id).sort((a, b) => b.month.localeCompare(a.month));
    return `<div class="sp-table-wrap" style="max-height:none">
      <table class="sp-table" style="min-width:1040px">
        <thead><tr><th>账单月份</th><th class="num">预估成本</th><th class="num">实际成本</th><th class="num">历史差额调整</th><th class="num">实际结算金额</th><th class="num">成本差额</th><th class="num">差异率</th><th>结算状态</th><th>结算时间</th><th style="text-align:right">操作</th></tr></thead>
        <tbody>${rows.map(b => {
      const adj = (b.adjust || []).reduce((sum, a) => sum + (a.type === 'pay' ? a.cny : -a.cny), 0);
      const diff = b.cny == null ? null : b.cny - b.est;
      return `<tr>
          <td>${monthText(b.month)}</td>
          <td class="num">${money(b.est)}</td>
          <td class="num">${b.cny == null ? '—' : money(b.cny)}</td>
          <td class="num">${adj ? diffTxt(adj) : '—'}</td>
          <td class="num">${b.settle == null ? '—' : money(b.settle)}</td>
          <td class="num ${diffCls(diff)}">${diff == null ? '—' : diffTxt(diff)}</td>
          <td class="num ${diffCls(diff)}">${b.cny == null ? '—' : pct(diff / b.est * 100)}</td>
          <td>${statusBadge(b)}</td>
          <td>${b.settledAt || '—'}</td>
          <td><div class="sp-actions"><button data-act="bill-detail" data-id="${b.id}">查看账单</button></div></td>
        </tr>`;
    }).join('')}</tbody>
      </table>
      ${rows.length ? '' : `<div class="sp-empty"><strong>暂无历史结算记录</strong></div>`}
    </div>`;
  }

  function logsTab(s) {
    const logs = (s.logs || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return `<ul style="list-style:none;margin:0;padding:0">
      ${logs.map(l => `<li style="display:grid;grid-template-columns:150px 100px minmax(0,1fr);gap:12px;padding:13px 0;border-bottom:1px solid rgba(148,163,184,.16);font-size:13px">
        <time style="font-size:12px;color:var(--ui-text-muted)">${esc(l.at)}</time><span>${esc(l.who)}</span>
        <div><b style="font-weight:600">${esc(l.act)}</b><small style="display:block;margin-top:4px;font-size:11px;color:var(--ui-text-muted)">${esc(l.detail)} · ${esc(l.result)}</small></div>
      </li>`).join('')}
    </ul>`;
  }

  /* ================= 月度结算 ================= */
  function settlementRows() {
    db.suppliers.forEach(s => { if (s.settle) ensureBill(s.id, st.month); });
    const monthBills = db.suppliers.filter(s => s.settle && (s.type !== 'internal')).map(s => billOfSupplierMonth(s.id, st.month)).filter(Boolean);
    return monthBills.sort((a, b) => (supOf(a.supplierId)?.name || '').localeCompare(supOf(b.supplierId)?.name || '', 'zh'));
  }

  function settlementView() {
    const rows = settlementRows();
    const settled = rows.filter(b => b.status === 'settled');
    const estTotal = rows.reduce((sum, b) => sum + b.est, 0);
    const actualTotal = settled.reduce((sum, b) => sum + (b.cny || 0), 0);
    const estSettled = settled.reduce((sum, b) => sum + b.est, 0);
    const diff = actualTotal - estSettled;
    const adj = rows.reduce((sum, b) => sum + (b.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.cny : -a.cny), 0), 0);
    const progress = rows.length ? Math.round(settled.length / rows.length * 100) : 0;
    const list = rows.filter(b => {
      const s = supOf(b.supplierId);
      if (!s) return false;
      if (st.bq.trim() && !s.name.toLowerCase().includes(st.bq.trim().toLowerCase())) return false;
      if (st.bcurrency !== 'all' && b.currency !== st.bcurrency) return false;
      if (st.bstatus !== 'all' && b.status !== st.bstatus) return false;
      return true;
    });

    return `<div class="sp-head">
      <div><h1>月度结算</h1><p>统一管理供应商账单、实际采购成本及渠道成本分摊。</p></div>
    </div>
    <div class="sp-settle-bar">
      <label class="sp-month">账单月份<input type="month" value="${st.month}" data-field="month" /></label>
      <button class="sp-ghost" data-act="export-bills">导出账单</button>
    </div>
    <div class="sp-stats five">
      <div class="sp-stat"><span>月度预估总成本</span><strong>${money(estTotal)}</strong><small>含已结算供应商</small></div>
      <div class="sp-stat"><span>已结算实际成本</span><strong>${money(actualTotal)}</strong><small>${settled.length} 家已确认</small></div>
      <div class="sp-stat"><span>成本差额</span><strong class="${diffCls(diff)}">${estSettled ? diffTxt(diff) : '—'}</strong><small>${estSettled ? '差异率 ' + pct(diff / estSettled * 100) + '（仅已结算）' : '暂无已结算数据'}</small></div>
      <div class="sp-stat"><span>历史差额调整</span><strong>${adj ? diffTxt(adj) : '—'}</strong><small>本期补缴 / 抵扣</small></div>
      <div class="sp-stat"><span>结算进度</span><strong>${settled.length} / ${rows.length}</strong><small>剩余 ${rows.length - settled.length} 家待结算</small><div class="sp-progress"><i style="width:${progress}%"></i></div></div>
    </div>
    <div class="sp-toolbar">
      <label class="sp-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input data-field="bq" placeholder="搜索供应商名称" value="${esc(st.bq)}" /></label>
      <button class="sp-primary" data-act="refresh">确认</button>
    </div>
    <section class="sp-card">
      <div class="sp-table-wrap">
        <table class="sp-table" style="min-width:1320px">
          <thead><tr>
            <th class="sp-sticky-l">供应商名称</th><th>账单月份</th><th class="num">渠道数量</th><th>结算状态 <button type="button" class="sp-filter${st.bstatus !== 'all' ? ' on' : ''}" data-spfilter="status" aria-label="筛选结算状态" aria-haspopup="true"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M975.961 63.04A101.347 101.347 0 0 0 879.865 0.026H141.553a101.872 101.872 0 0 0-71.94 173.813l337.649 323.996v322.42a44.11 44.11 0 0 0 12.602 30.982l106.65 106.65a44.11 44.11 0 0 0 62.36 0l106.65-106.65a44.11 44.11 0 0 0 12.6-30.982V497.835l337.65-323.996a101.35 101.35 0 0 0-59.813-110.8z" fill="currentColor"/></svg></button></th><th class="num">实时预估金额</th>
            <th class="num">原币账单金额 <button type="button" class="sp-filter${st.bcurrency !== 'all' ? ' on' : ''}" data-spfilter="currency" aria-label="筛选币种" aria-haspopup="true"><svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M975.961 63.04A101.347 101.347 0 0 0 879.865 0.026H141.553a101.872 101.872 0 0 0-71.94 173.813l337.649 323.996v322.42a44.11 44.11 0 0 0 12.602 30.982l106.65 106.65a44.11 44.11 0 0 0 62.36 0l106.65-106.65a44.11 44.11 0 0 0 12.6-30.982V497.835l337.65-323.996a101.35 101.35 0 0 0-59.813-110.8z" fill="currentColor"/></svg></button></th><th class="num">结算汇率</th><th class="num">当月实际金额</th><th class="num">历史差额调整</th>
            <th class="num">实际结算金额</th><th class="num">成本差额</th><th class="num">差异率</th><th class="sp-sticky-r" style="text-align:left">操作</th>
          </tr></thead>
          <tbody>${list.map(billRowHTML).join('')}</tbody>
        </table>
        ${list.length ? '' : `<div class="sp-empty"><strong>该月份暂无待结算供应商</strong></div>`}
      </div>
      <div class="sp-pager"><span>共 ${list.length} 家 · 账期 ${monthText(st.month)}</span><span>金额单位：人民币元（原币按账单币种展示）</span></div>
    </section>
    <p class="sp-hint" style="margin-top:12px">当月结算范围按账期内实际发生业务数据确定，不依据供应商当前启用状态筛选。</p>`;
  }

  function billRowHTML(b) {
    const s = supOf(b.supplierId); if (!s) return '';
    const adj = (b.adjust || []).reduce((sum, a) => sum + (a.type === 'pay' ? a.cny : -a.cny), 0);
    const diff = b.cny == null ? null : b.cny - b.est;
    const rate = b.currency === 'CNY' ? '1.0000' : Number(b.rate).toFixed(4);
    const chs = channelsOf(s).length;
    const more = `<button class="sp-more" data-act="bill-more" data-id="${b.id}" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(s.name)} ${monthText(b.month)} 更多操作">•••</button>`;
    const ops = b.status === 'pending' ? `<button data-act="bill-detail" data-id="${b.id}">详情</button><button data-act="bill-create" data-id="${s.id}" data-bill="${b.id}">录入账单</button>${more}`
      : `<button data-act="bill-detail" data-id="${b.id}">详情</button>${more}`;
    return `<tr>
      <td class="sp-sticky-l"><div class="sp-name">${logo(s)}<div><button data-act="detail" data-id="${s.id}"><b>${esc(s.name)}</b></button><small>${esc(s.id)}</small></div></div></td>
      <td>${monthText(b.month)}</td>
      <td class="num">${chs}</td>
      <td>${statusBadge(b)}</td>
      <td class="num">${money(b.est)}</td>
      <td class="num">${b.amount == null ? '—' : (CURRENCY[b.currency]?.sym || '') + Number(b.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
      <td class="num">${rate}</td>
      <td class="num">${b.cny == null ? '—' : money(b.cny)}</td>
      <td class="num">${adj ? diffTxt(adj) : '—'}</td>
      <td class="num">${b.settle == null ? '—' : money(b.settle)}</td>
      <td class="num ${diffCls(diff)}">${diff == null ? '—' : diffTxt(diff)}</td>
      <td class="num ${diffCls(diff)}">${diff == null ? '—' : pct(diff / b.est * 100)}</td>
      <td class="sp-sticky-r"><div class="sp-actions">${ops}</div></td>
    </tr>`;
  }

  /* ================= 账单录入 ================= */
  function draftFromBill(b) {
    return {
      billId: b.id, supplierId: b.supplierId, month: b.month,
      currency: b.currency, rate: b.rate, amount: b.amount,
      remark: b.remark || '', att: b.att || '', version: b.version || 1,
      adjust: JSON.parse(JSON.stringify(b.adjust || [])),
      method: b.method || 'usage'
    };
  }

  function newDraft(sid, month, bill) {
    const s = supOf(sid);
    const base = bill ? draftFromBill(bill) : { billId: 'bill-' + month.replace('-', '') + '-' + sid.replace('sup-', ''), supplierId: sid, month, currency: s.currency, rate: s.rate, amount: null, remark: '', att: '', version: 1, adjust: [], method: 'usage' };
    return base;
  }

  function billView() {
    const d = st.draft;
    if (!d) return `<div class="sp-empty"><strong>账单不存在</strong></div>`;
    const s = supOf(d.supplierId);
    const bill = billOf(d.billId);
    const isFix = !!(bill && bill.status === 'settled');
    const step1 = st.step === 1;
    const est = bill ? bill.est : estOf(s);
    return `<div class="sp-bill-dialog-body">
    <div class="sp-bill-dialog-head">
      <div><h2>${isFix ? '修正账单' : '录入账单'}</h2><p>${esc(s.name)} · ${monthText(d.month)}${isFix ? ` · 修正版本 v${(bill.version || 1) + 1}` : ''}</p></div>
      <button type="button" class="sp-dialog-x" data-act="back-settlement" aria-label="关闭">×</button>
    </div>
    <div class="sp-bill-dialog-scroll">
    ${isFix ? `<div class="sp-warn" style="margin-bottom:14px">修正账单会生成新版本，原已结算数据保留为历史版本，不影响已确认记录。</div>` : ''}
    ${step1 ? billStep1(s, d, est) : billStep2(s, d, est)}`;
  }

  function billStep1(s, d, est) {
    const cny = d.amount != null && d.amount !== '' ? Number(d.amount) * Number(d.rate) : null;
    return `<div class="sp-bill-layout single">
      <div class="sp-bill-main">
        <section class="sp-section">
          <div class="sp-section-title"><h2>当月实际账单</h2><small>不含历史月份补差</small></div>
          <form class="sp-form" id="spBillForm" novalidate>
            <label class="req">账单币种
              <select name="currency" data-field="bill-currency">${Object.entries(CURRENCY).map(([k, v]) => `<option value="${k}"${d.currency === k ? ' selected' : ''}>${k} · ${v.name}</option>`).join('')}</select>
            </label>
            <label class="req">当月实际金额
              <input type="number" name="amount" id="spBillAmount" min="0" step="0.01" value="${d.amount ?? ''}" placeholder="0.00" />
              <span class="sp-field-error">请填写有效的账单金额</span>
            </label>
            <label class="req">结算汇率
              <input type="number" name="rate" id="spBillRate" min="0" step="0.0001" value="${d.rate}" ${d.currency === 'CNY' ? 'disabled' : ''} />
              <div class="sp-hint" id="spRateHint">${d.currency === 'CNY' ? '本币账单汇率固定为 1.0000' : `1 ${d.currency} = ${Number(d.rate).toFixed(4)} CNY`}</div>
              <span class="sp-field-error">汇率需大于 0</span>
            </label>
            <label>折算人民币金额
              <input type="text" id="spBillCny" value="${cny == null ? '—' : money(cny)}" readonly />
            </label>
            <label class="wide">账单备注
              <textarea name="remark" placeholder="记录账单口径、异常说明等">${esc(d.remark || '')}</textarea>
            </label>
          </form>
        </section>
        <section class="sp-section">
          <div class="sp-section-title"><h2>历史差额补录</h2><button type="button" class="sp-adj-toggle" data-act="adj-add">+ 补录上月差额</button></div>
          <div class="sp-adj" id="spAdjList">${adjRows(d)}</div>
          <p class="sp-hint">历史差额单独归属原费用月份，不计入当月渠道成本。</p>
        </section>
      </div>
    </div>
    <div class="sp-footbar">
      <div class="right">
        <button class="sp-ghost" data-act="save-draft">保存草稿</button>
        <button class="sp-primary" data-act="confirm-settle">确认结算</button>
      </div>
    </div>
    </div></div>`;
  }

  function adjRows(d) {
    if (!d.adjust || !d.adjust.length) return `<div class="sp-adj-empty">暂无历史差额记录</div>`;
    return d.adjust.map((a, i) => `<div class="sp-adj-row" data-adj="${i}">
      <label>费用所属月份<input type="month" value="${a.month}" data-adjf="month" /></label>
      <label>调整类型<select data-adjf="type"><option value="pay"${a.type === 'pay' ? ' selected' : ''}>补缴费用</option><option value="refund"${a.type === 'refund' ? ' selected' : ''}>退款抵扣</option></select></label>
      <label>币种<select data-adjf="currency">${Object.keys(CURRENCY).map(k => `<option value="${k}"${a.currency === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
      <label>金额<input type="number" min="0" step="0.01" value="${a.amount}" data-adjf="amount" /></label>
      <label>汇率<input type="number" min="0" step="0.0001" value="${a.rate}" data-adjf="rate" /></label>
      <label>调整原因<input type="text" value="${esc(a.reason || '')}" data-adjf="reason" placeholder="必填" /></label>
      <div><div class="cny">${a.type === 'pay' ? '+' : '-'}${money(a.amount * a.rate)}</div><button type="button" class="sp-adj-del" data-act="adj-del" data-i="${i}" aria-label="删除调整">✕</button></div>
    </div>`).join('');
  }

  function billStep2(s, d, est) {
    const chs = channelsOf(s);
    const cny = Number(d.amount || 0) * Number(d.rate || 1);
    const totalUsage = chs.reduce((x, c) => x + Number(c.tokens || 0), 0);
    const totalEst = chs.reduce((x, c) => x + Number(c.estCost || 0), 0) || 1;
    const alloc = chs.map(c => {
      const usage = Number(c.tokens || 0);
      const share = st.method === 'usage' ? (totalUsage ? usage / totalUsage : 0) : Number(c.estCost || 0) / totalEst;
      const actual = cny * share;
      const diff = actual - Number(c.estCost || 0);
      const factor = Number(c.estCost || 0) ? actual / Number(c.estCost || 0) : null;
      return { ...c, usage, share, actual, diff, factor };
    });
    const adjCny = (d.adjust || []).reduce((sum, a) => sum + (a.type === 'pay' ? Number(a.amount || 0) * Number(a.rate || 1) : -Number(a.amount || 0) * Number(a.rate || 1)), 0);
    return `<section class="sp-section">
      <div class="sp-section-title"><h2>分摊方式</h2><small>切换后自动重新计算</small></div>
      <div class="sp-method">
        <label><input type="radio" name="method" value="usage" ${st.method === 'usage' ? 'checked' : ''} data-act="method" /><span><b>按使用量比例分摊</b><small>按各渠道当月实际使用量占比计算，适用于计费口径一致的供应商。</small></span></label>
        <label><input type="radio" name="method" value="cost" ${st.method === 'cost' ? 'checked' : ''} data-act="method" /><span><b>按预估成本比例分摊</b><small>按各渠道当月预估采购成本占比计算，适用于单价差异较大的供应商。</small></span></label>
      </div>
      ${st.method === 'usage' ? `<div class="sp-warn">不同计费单位的使用量不可直接相加。若渠道计费单位不一致，请改用「按预估成本比例分摊」。</div>` : ''}
    </section>
    <section class="sp-card" style="margin-top:16px">
      <div class="sp-table-wrap" style="max-height:none">
        <table class="sp-table" style="min-width:1180px">
          <thead><tr><th class="sp-sticky-l">渠道</th><th class="num">模型数</th><th class="num">当月请求量</th><th class="num">当月使用量</th><th class="num">用量占比</th><th class="num">实时预估成本</th><th class="num">分摊比例</th><th class="num">实际分摊成本</th><th class="num">成本差额</th><th class="num">差异率</th><th class="num">修正系数</th><th class="sp-sticky-r" style="text-align:right">折算价格</th></tr></thead>
          <tbody>${alloc.map(a => `<tr>
            <td class="sp-sticky-l"><strong>${esc(a.name)}</strong><br><code style="font-size:10.5px;color:var(--ui-text-muted)">${esc(a.id)}</code></td>
            <td class="num">${(a.models || []).length}</td>
            <td class="num">${Number(a.requests).toLocaleString()}</td>
            <td class="num">${a.usage.toLocaleString()}</td>
            <td class="num">${(a.share * 100).toFixed(2)}%</td>
            <td class="num">${money(a.estCost)}</td>
            <td class="num">${(a.share * 100).toFixed(2)}%</td>
            <td class="num">${money(a.actual)}</td>
            <td class="num ${diffCls(a.diff)}">${diffTxt(a.diff)}</td>
            <td class="num ${diffCls(a.diff)}">${a.estCost ? pct(a.diff / a.estCost * 100) : '—'}</td>
            <td class="num">${a.factor == null ? '—' : a.factor.toFixed(4)}</td>
            <td class="sp-sticky-r"><div class="sp-actions"><button data-act="price" data-ch="${a.id}">查看价格</button></div></td>
          </tr>`).join('')}
          <tr class="sp-total-row">
            <td class="sp-sticky-l">合计</td><td class="num">—</td><td class="num">${chs.reduce((x, c) => x + Number(c.requests || 0), 0).toLocaleString()}</td>
            <td class="num">${totalUsage.toLocaleString()}</td><td class="num">100%</td><td class="num">${money(totalEst)}</td><td class="num">100%</td>
            <td class="num">${money(cny)}</td><td class="num ${diffCls(cny - totalEst)}">${diffTxt(cny - totalEst)}</td>
            <td class="num ${diffCls(cny - totalEst)}">${pct((cny - totalEst) / totalEst * 100)}</td><td class="num">—</td><td class="sp-sticky-r num">—</td>
          </tr></tbody>
        </table>
      </div>
    </section>
    ${(d.adjust || []).length ? `<section class="sp-section" style="margin-top:16px">
      <div class="sp-section-title"><h2>历史差额分摊</h2><small>归属原费用月份，不混入本月渠道成本</small></div>
      <table class="sp-table" style="min-width:0"><thead><tr><th>费用所属月份</th><th>调整类型</th><th class="num">原币金额</th><th class="num">汇率</th><th class="num">人民币金额</th><th>原因</th></tr></thead>
      <tbody>${d.adjust.map(a => `<tr><td>${monthText(a.month)}</td><td>${a.type === 'pay' ? '补缴费用' : '退款抵扣'}</td><td class="num">${CURRENCY[a.currency].sym}${Number(a.amount).toLocaleString()}</td><td class="num">${Number(a.rate).toFixed(4)}</td><td class="num">${a.type === 'pay' ? '+' : '-'}${money(a.amount * a.rate)}</td><td>${esc(a.reason || '—')}</td></tr>`).join('')}</tbody></table>
    </section>` : ''}
    <div class="sp-footbar">
      <button class="sp-ghost" data-act="to-step1">返回上一步</button>
      <div class="right">
        <button class="sp-ghost" data-act="save-draft">保存草稿</button>
        <button class="sp-primary" data-act="confirm-settle">确认结算</button>
      </div>
    </div>
    <p class="sp-hint">本期实际成本 ${money(cny)}，历史调整 ${adjCny ? diffTxt(adjCny) : '—'}，实际结算 ${money(cny + adjCny)}。</p>`;
  }

  /* ================= 结算详情 ================= */
  function billDetailView() {
    const b = billOf(st.billId); if (!b) return `<div class="sp-empty"><strong>账单不存在</strong></div>`;
    const s = supOf(b.supplierId);
    const adj = (b.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.cny : -a.cny), 0);
    const diff = b.cny == null ? null : b.cny - b.est;
    const tabs = [['info', '账单信息'], ['alloc', '渠道成本分摊'], ['adj', '历史差额调整'], ['records', '结算记录']];
    return `<nav class="sp-crumb"><button data-act="back-settlement">月度结算</button><i>/</i><span>结算详情</span></nav>
    <div class="sp-head">
      <div><h1>${esc(s.name)} · ${monthText(b.month)}</h1>
        <p>${statusBadge(b)} · 结算时间 ${b.settledAt || '—'} · 操作人 ${esc(b.operator || '—')}</p></div>
      <div class="sp-head-actions"><button class="sp-ghost" data-act="export-one" data-id="${b.id}">导出账单</button>${b.status === 'pending'
        ? `<button class="sp-primary" data-act="bill-create" data-id="${s.id}" data-bill="${b.id}">录入账单</button>`
        : `<button class="sp-primary" data-act="bill-fix" data-id="${b.id}">修正账单</button>`}</div>
    </div>
    <div class="sp-stats" style="grid-template-columns:repeat(6,minmax(0,1fr))">
      <div class="sp-stat"><span>实时预估成本</span><strong>${money(b.est)}</strong></div>
      <div class="sp-stat"><span>月度实际成本</span><strong>${b.cny == null ? '—' : money(b.cny)}</strong></div>
      <div class="sp-stat"><span>成本差额</span><strong class="${diffCls(diff)}">${diff == null ? '—' : diffTxt(diff)}</strong></div>
      <div class="sp-stat"><span>成本差异率</span><strong class="${diffCls(diff)}">${diff == null ? '—' : pct(diff / b.est * 100)}</strong></div>
      <div class="sp-stat"><span>历史差额调整</span><strong>${adj ? diffTxt(adj) : '—'}</strong></div>
      <div class="sp-stat"><span>实际结算金额</span><strong>${b.settle == null ? '—' : money(b.settle)}</strong></div>
    </div>
    <div class="sp-tabs" role="tablist">${tabs.map(([id, label]) => `<button data-act="bd-tab" data-tab="${id}" class="${st.bdTab === id ? 'active' : ''}">${label}</button>`).join('')}</div>
    <section class="sp-panel">${billDetailTab(b, s)}</section>`;
  }

  function allocModelsRow(c, channelActual) {
    const models = c.models || [];
    if (!models.length) return `<tr class="sp-subrow"><td colspan="8"><div class="sp-sub-empty">该渠道暂未关联模型</div></td></tr>`;
    const weights = models.map(m => Number(m.inP || 0) + Number(m.outP || 0) || 1);
    const sumW = weights.reduce((x, w) => x + w, 0) || 1;
    const est = Number(c.estCost || 0);
    const factor = est ? channelActual / est : 1;
    const rows = models.map((m, i) => {
      const ratio = weights[i] / sumW;
      const mEst = est * ratio, mAct = channelActual * ratio, mDiff = mAct - mEst;
      const inNew = Number(m.inP || 0) * factor, outNew = Number(m.outP || 0) * factor;
      return `<tr>
        <td><strong>${esc(m.name)}</strong></td>
        <td>${esc(m.type)}</td>
        <td class="num">${(ratio * 100).toFixed(1)}%</td>
        <td class="num">${money(mEst)}</td>
        <td class="num"><strong>${money(mAct)}</strong></td>
        <td class="num ${diffCls(mDiff)}">${diffTxt(mDiff)}</td>
        <td class="num">${money(m.inP)} / ${money(m.outP)}</td>
        <td class="num"><strong>${money(inNew)} / ${money(outNew)}</strong></td>
      </tr>`;
    }).join('');
    return `<tr class="sp-subrow"><td colspan="8">
      <div class="sp-sub-wrap">
        <div class="sp-sub-title">${esc(c.name)} · 模型价格与成本对比 <span>${models.length} 个模型 · 预估 ${money(est)} · 分摊 ${money(channelActual)} · 修正系数 ${factor.toFixed(4)}</span></div>
        <table class="sp-subtable">
          <thead><tr><th>模型名称</th><th>类型</th><th class="num">渠道内占比</th><th class="num">预估成本</th><th class="num">分摊成本</th><th class="num">成本差额</th><th class="num">原始采购价（入 / 出）</th><th class="num">折算价格（入 / 出）</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </td></tr>`;
  }

  function billDetailTab(b, s) {
    if (st.bdTab === 'alloc') {
      if (b.status === 'draft') return `<div class="sp-allocation-empty"><div class="sp-allocation-spinner" aria-hidden="true"></div><strong>正在计算成本分摊，请稍候</strong><p>分摊完成后，渠道成本明细会自动显示。</p></div>`;
      if (b.status === 'pending') return `<div class="sp-allocation-empty"><strong>账单尚未录入</strong><p>录入供应商对账单金额后，系统按预估成本占比生成渠道分摊结果。</p></div>`;
      const chs = channelsOf(s);
      const cny = b.cny || 0;
      const totalUsage = chs.reduce((x, c) => x + Number(c.tokens || 0), 0) || 1;
      const totalEst = chs.reduce((x, c) => x + Number(c.estCost || 0), 0) || 1;
      const openSet = st.expandedAlloc || (st.expandedAlloc = new Set());
      return `<div class="sp-table-wrap" style="max-height:none"><table class="sp-table" style="min-width:940px">
        <thead><tr><th class="sp-alloc-toggle-head" aria-label="展开模型价格"></th><th>渠道</th><th class="num">模型数</th><th class="num">用量占比</th><th class="num">预估成本</th><th class="num">实际成本</th><th class="num">成本差额</th><th class="num">修正系数</th></tr></thead>
        <tbody>${chs.map(c => { const share = Number(c.estCost || 0) / totalEst, actual = cny * share, diff = actual - c.estCost; const open = openSet.has(c.id); return `<tr class="sp-ch-row${open ? ' is-open' : ''}">
          <td class="sp-alloc-toggle"><button class="sp-expand" data-act="alloc-expand" data-ch="${c.id}" aria-expanded="${open}" aria-label="${open ? '收起' : '展开'} ${esc(c.name)} 的模型价格">›</button></td>
          <td><strong>${esc(c.name)}</strong><br><code style="font-size:10.5px;color:var(--ui-text-muted)">${esc(c.id)}</code></td>
          <td class="num">${(c.models || []).length}</td><td class="num">${(Number(c.tokens) / totalUsage * 100).toFixed(1)}%</td>
          <td class="num">${money(c.estCost)}</td><td class="num">${money(actual)}</td>
          <td class="num ${diffCls(diff)}">${diffTxt(diff)}</td><td class="num">${c.estCost ? (actual / c.estCost).toFixed(4) : '—'}</td>

          </tr>${open ? allocModelsRow(c, actual) : ''}`; }).join('')}</tbody></table></div>`;
    }
    if (st.bdTab === 'adj') {
      const rows = b.adjust || [];
      return rows.length ? `<table class="sp-table" style="min-width:0"><thead><tr><th>费用所属月份</th><th>实际结算月份</th><th>调整类型</th><th class="num">原币金额</th><th class="num">汇率</th><th class="num">人民币金额</th><th>调整原因</th></tr></thead><tbody>
        ${rows.map(a => `<tr><td>${monthText(a.month)}</td><td>${monthText(b.month)}</td><td>${a.type === 'pay' ? '补缴费用' : '退款抵扣'}</td><td class="num">${CURRENCY[a.currency].sym}${Number(a.amount).toLocaleString()}</td><td class="num">${Number(a.rate).toFixed(4)}</td><td class="num">${a.type === 'pay' ? '+' : '-'}${money(a.amount * a.rate)}</td><td>${esc(a.reason || '—')}</td></tr>`).join('')}
      </tbody></table>` : `<div class="sp-empty"><strong>无历史差额调整</strong></div>`;
    }
    if (st.bdTab === 'records') {
      return `<ul style="list-style:none;margin:0;padding:0">${(b.records || []).map(r => `<li style="display:grid;grid-template-columns:150px 100px 1fr;gap:12px;padding:13px 0;border-bottom:1px solid rgba(148,163,184,.16)">
        <time style="font-size:12px;color:var(--ui-text-muted)">${esc(r.at)}</time><span>${esc(r.who)}</span><div><b>${esc(r.act)}</b><small style="display:block;margin-top:4px;font-size:11px;color:var(--ui-text-muted)">${esc(r.detail)} · ${esc(r.result)}</small></div></li>`).join('')}</ul>`;
    }
    const rate = b.currency === 'CNY' ? '1.0000' : Number(b.rate).toFixed(4);
    return `<dl class="sp-dl">
      <div><dt>供应商</dt><dd>${esc(s.name)}</dd></div>
      <div><dt>账单月份</dt><dd>${monthText(b.month)}</dd></div>
      <div><dt>结算状态</dt><dd>${statusBadge(b)}</dd></div>
      <div><dt>账单币种</dt><dd>${esc(b.currency)}</dd></div>
      <div><dt>原币金额</dt><dd>${b.amount == null ? '—' : CURRENCY[b.currency].sym + Number(b.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</dd></div>
      <div><dt>结算汇率</dt><dd>${rate}</dd></div>
      <div><dt>人民币金额</dt><dd>${b.cny == null ? '—' : money(b.cny)}</dd></div>
      <div><dt>账单附件</dt><dd>${b.att ? esc(b.att) : '—'}</dd></div>
      <div><dt>账单备注</dt><dd>${esc(b.remark || '—')}</dd></div>
      <div><dt>结算时间</dt><dd>${b.settledAt || '—'}</dd></div>
      <div><dt>操作人</dt><dd>${esc(b.operator || '—')}</dd></div>
      <div><dt>版本</dt><dd>${b.status === 'pending' ? '—' : 'v' + (b.version || 1)}</dd></div>
    </dl>`;
  }

  /* ================= 渲染入口 ================= */
  function render() {
    let body = '';
    if (st.view === 'detail') body = detailView();
    else if (st.view === 'settlement') body = settlementView();
    else if (st.view === 'bill') body = billView();
    else if (st.view === 'billDetail') body = billDetailView();
    else body = listView();
    root.innerHTML = `<div class="sp-page">${body}</div>
      ${st.billOpen && st.draft ? `<dialog class="sp-bill-dialog" id="spBillDialog">${billView()}</dialog>` : ''}
      <div class="sp-drawer" id="spDrawer"></div>
      <div class="sp-toast" id="spToast"></div>`;
    bind();
    const bd = root.querySelector('#spBillDialog');
    if (bd && !bd.open) {
      bd.showModal();
      bd.addEventListener('close', () => {
        if (!st.billOpen) return;
        st.billOpen = false; st.draft = null; render();
      }, { once: true });
    }
  }

  /* --------- 列头筛选 --------- */
  const FILTER_STATE_KEY = { type: 'type', enabled: 'enabled', status: 'bstatus', currency: 'bcurrency' };

  function filterOptions(key) {
    if (key === 'type') return [['all', '全部'], ...Object.entries(TYPE).map(([k, v]) => [k, v])];
    if (key === 'status') return [['all', '全部'], ...Object.entries(BILL_STATUS).map(([k, v]) => [k, v[0]])];
    if (key === 'currency') return [['all', '全部'], ...Object.keys(CURRENCY).map(k => [k, k])];
    return [['all', '全部'], ['true', '已启用'], ['false', '已禁用']];
  }

  function openBillMenu(btn, id) {
    document.querySelectorAll('.sp-bill-menu').forEach(x => x.remove());
    const b = billOf(id); if (!b) return;
    const items = [['statement', '对账单']];
    if (b.status === 'settled') items.push(['fix', '修正账单']);
    const pop = document.createElement('div');
    pop.className = 'sp-menu sp-bill-menu';
    pop.setAttribute('role', 'menu');
    pop.innerHTML = items.map(([v, l]) => `<button type="button" role="menuitem" data-v="${v}">${l}</button>`).join('');
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.left = `${Math.min(r.left, window.innerWidth - pop.offsetWidth - 12)}px`;
    btn.setAttribute('aria-expanded', 'true');
    const close = () => {
      pop.remove();
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDoc, true);
    };
    const onDoc = e => { if (!pop.contains(e.target) && e.target !== btn) close(); };
    pop.addEventListener('click', e => {
      const t = e.target.closest('[data-v]');
      if (!t) return;
      close();
      if (t.dataset.v === 'statement') openStatement(id);
      else startFix(id);
    });
    setTimeout(() => document.addEventListener('click', onDoc, true), 0);
  }

  let spFilterCloser = null;
  function openColumnFilter(btn) {
    document.querySelectorAll('.sp-filter-pop').forEach(x => x.remove());
    if (spFilterCloser) { document.removeEventListener('click', spFilterCloser, true); spFilterCloser = null; }
    const key = btn.dataset.spfilter;
    const stateKey = FILTER_STATE_KEY[key] || key;
    const current = st[stateKey];
    const pop = document.createElement('div');
    pop.className = 'sp-filter-pop filter-pop';
    pop.innerHTML = filterOptions(key).map(([v, label]) => `<button type="button" class="${current === v ? 'active' : ''}" data-v="${v}">${esc(label)}</button>`).join('');
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.left = `${Math.min(r.left, window.innerWidth - pop.offsetWidth - 12)}px`;
    btn.setAttribute('aria-expanded', 'true');
    pop.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      st[stateKey] = b.dataset.v;
      st.page = 1;
      pop.remove();
      if (spFilterCloser) { document.removeEventListener('click', spFilterCloser, true); spFilterCloser = null; }
      render();
    });
    const close = e => {
      if (pop.contains(e.target)) return;
      pop.remove();
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', close, true);
      if (spFilterCloser === close) spFilterCloser = null;
    };
    spFilterCloser = close;
    setTimeout(() => document.addEventListener('click', close, true), 0);
  }

  /* ================= 事件 ================= */
  function bind() {
    const q = sel => root.querySelector(sel);
    const qa = sel => [...root.querySelectorAll(sel)];

    qa('[data-spfilter]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      openColumnFilter(btn);
    }));

    qa('[data-field]').forEach(el => {
      const evt = el.tagName === 'INPUT' && (el.type === 'search' || el.type === 'text' || el.type === 'month') ? 'input' : 'change';
      el.addEventListener(evt, () => {
        const f = el.dataset.field;
        if (f === 'q' || f === 'bq') { st[f] = el.value; if (f === 'q') st.page = 1; render(); setTimeout(() => { const n = root.querySelector(`[data-field="${f}"]`); n && n.focus(); n && n.setSelectionRange?.(n.value.length, n.value.length); }, 0); return; }
        if (f === 'size') st.size = Number(el.value);
        else if (f === 'month') st.month = el.value || prevMonth();
        else st[f] = el.value;
        render();
      });
    });

    qa('[data-act]').forEach(el => {
      const act = el.dataset.act;
      if (act === 'q' || act === 'tab') {
        el.addEventListener('click', () => { st.tab = el.dataset.tab; render(); });
        return;
      }
      el.addEventListener('click', e => {
        const id = el.dataset.id, chId = el.dataset.ch;
        switch (act) {
          case 'add': openSupplierForm(); return;
          case 'edit': openSupplierForm(supOf(id)); return;
          case 'detail': st.supplierId = id; st.view = 'detail'; st.tab = 'basic'; render(); window.scrollTo({ top: 0 }); return;
          case 'tab-channels': st.supplierId = id; st.view = 'detail'; st.tab = 'channels'; render(); return;
          case 'back-list': st.view = 'list'; render(); return;
          case 'reset-filter': Object.assign(st, { q: '', type: 'all', enabled: 'all', service: 'all', page: 1 }); render(); return;
          case 'refresh': toast('列表已刷新'); return;
          case 'prev': st.page = Math.max(1, st.page - 1); render(); return;
          case 'next': st.page += 1; render(); return;
          case 'more': openMenu(el, id); return;
          case 'toggle': toggleSupplier(supOf(id)); return;
          case 'associate': openAssociate(supOf(id)); return;
          case 'unlink': unlinkChannel(chId, id); return;
          case 'alloc-expand': {
            const set = st.expandedAlloc || (st.expandedAlloc = new Set());
            set.has(chId) ? set.delete(chId) : set.add(chId);
            render();
            return;
          }
          case 'ch-expand': {
            const set = st.expandedCh || (st.expandedCh = new Set());
            set.has(chId) ? set.delete(chId) : set.add(chId);
            render();
            return;
          }
          case 'channel-info': toast('渠道详情已存在于「渠道」模块，可前往查看'); return;
          case 'model-info': toast(`模型 ${el.dataset.name} 的完整配置请前往「模型」模块`); return;
          case 'range': st.monitorRange = el.dataset.range; render(); return;
          case 'reset-bills': Object.assign(st, { bq: '', bcurrency: 'all', bstatus: 'all' }); render(); return;
          case 'export-bills': exportBills(); return;
          case 'export-one': exportBill(id); return;
          case 'bill-create': openBillEntry(id, el.dataset.bill); return;
          case 'bill-detail': st.billId = id; st.view = 'billDetail'; st.bdTab = 'info'; render(); window.scrollTo({ top: 0 }); return;
          case 'bill-statement': openStatement(id); return;
          case 'bill-more': openBillMenu(el, id); return;
          case 'back-settlement':
            if (st.billOpen) { st.billOpen = false; st.draft = null; render(); return; }
            st.view = 'settlement'; render(); return;
          case 'pick-file': q('#spBillFile')?.click(); return;
          case 'adj-add': addAdjust(); return;
          case 'adj-del': delAdjust(Number(el.dataset.i)); return;
          case 'to-step2': toStep2(); return;
          case 'to-step1': st.step = 1; render(); return;
          case 'method': st.method = el.value; render(); return;
          case 'price': openPrice(chId); return;
          case 'save-draft': saveDraft(); return;
          case 'confirm-settle': confirmSettle(); return;
          case 'bill-fix': startFix(id); return;
          case 'bd-tab': st.bdTab = el.dataset.tab; render(); return;
        }
      });
    });

    // 账单表单实时计算
    const amountEl = q('#spBillAmount'), rateEl = q('#spBillRate');
    const recalc = () => {
      const d = st.draft; if (!d) return;
      d.amount = amountEl?.value === '' ? null : Number(amountEl?.value);
      d.rate = Number(rateEl?.value || 1);
      const cny = d.amount == null ? null : d.amount * d.rate;
      const est = (billOf(d.billId)?.est) ?? estOf(supOf(d.supplierId));
      const cnyEl = q('#spBillCny'), sumCny = q('#spSumCny'), sumDiff = q('#spSumDiff'), sumRate = q('#spSumRate'), sumSettle = q('#spSumSettle');
      if (cnyEl) cnyEl.value = cny == null ? '—' : money(cny);
      if (sumCny) sumCny.textContent = cny == null ? '—' : money(cny);
      if (sumDiff) { sumDiff.textContent = cny == null ? '—' : diffTxt(cny - est); sumDiff.className = cny == null ? '' : diffCls(cny - est); }
      if (sumRate) { sumRate.textContent = cny == null ? '—' : pct((cny - est) / est * 100); sumRate.className = cny == null ? '' : diffCls(cny - est); }
      const adj = (d.adjust || []).reduce((s2, a) => s2 + (a.type === 'pay' ? Number(a.amount || 0) * Number(a.rate || 1) : -Number(a.amount || 0) * Number(a.rate || 1)), 0);
      if (sumSettle) sumSettle.textContent = cny == null ? '—' : money(cny + adj);
      const hint = q('#spRateHint');
      if (hint && d.currency !== 'CNY') hint.textContent = `1 ${d.currency} = ${d.rate.toFixed(4)} CNY`;
    };
    amountEl?.addEventListener('input', recalc);
    rateEl?.addEventListener('input', recalc);

    const cur = q('[data-field="bill-currency"]');
    cur?.addEventListener('change', () => {
      st.draft.currency = cur.value;
      st.draft.rate = cur.value === 'CNY' ? 1 : (supOf(st.draft.supplierId).rate || 7);
      render();
    });

    q('#spBillFile')?.addEventListener('change', e => {
      const f = e.target.files?.[0]; if (!f) return;
      st.draft.att = f.name;
      const n = q('#spFileName'); if (n) n.textContent = f.name;
    });

    // 历史差额输入
    qa('[data-adjf]').forEach(inp => inp.addEventListener('input', () => {
      const row = inp.closest('[data-adj]'); const i = Number(row.dataset.adj); const a = st.draft.adjust[i];
      const f = inp.dataset.adjf;
      a[f] = (f === 'amount' || f === 'rate') ? Number(inp.value || 0) : inp.value;
      const cnyEl = row.querySelector('.cny');
      if (cnyEl) cnyEl.textContent = (a.type === 'pay' ? '+' : '-') + money(Number(a.amount || 0) * Number(a.rate || 1));
    }));
  }

  /* ================= 交互实现 ================= */
  function toggleSupplier(s) {
    if (!s) return;
    s.enabled = !s.enabled;
    (s.logs = s.logs || []).push({ at: now(), who: '平台管理员', act: s.enabled ? '启用供应商' : '禁用供应商', detail: s.enabled ? '恢复参与服务路由' : '关联渠道不再参与新路由，历史数据保留', result: '成功' });
    save(); render(); toast(s.enabled ? '供应商已启用' : '供应商已禁用');
  }

  function unlinkChannel(chId, supId) {
    const c = chOf(chId);
    if (!c) return;
    if (!window.confirm(`解除「${c.name}」与当前供应商的关联？历史用量与结算记录不受影响。`)) return;
    c.supplierId = null; save(); render(); toast('已解除关联');
  }

  let menuEl = null;
  function openMenu(btn, id) {
    closeMenu();
    const s = supOf(id);
    menuEl = document.createElement('div');
    menuEl.className = 'sp-menu';
    menuEl.innerHTML = `<button data-menu="toggle">${s.enabled ? '禁用供应商' : '启用供应商'}</button><button data-menu="delete" class="danger">删除供应商</button>`;
    document.body.appendChild(menuEl);
    const r = btn.getBoundingClientRect(), w = menuEl.offsetWidth, h = menuEl.offsetHeight;
    menuEl.style.left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) + 'px';
    menuEl.style.top = (r.bottom + 6 + h > window.innerHeight ? r.top - h - 6 : r.bottom + 6) + 'px';
    menuEl.onclick = e => {
      const b = e.target.closest('[data-menu]'); if (!b) return;
      const act = b.dataset.menu; closeMenu();
      if (act === 'toggle') toggleSupplier(s);
      if (act === 'bills') { st.supplierId = id; st.view = 'detail'; st.tab = 'bills'; render(); }
      if (act === 'delete') deleteSupplier(s);
    };
    setTimeout(() => document.addEventListener('click', outsideMenu, { once: true }), 0);
  }
  function outsideMenu(e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }
  function closeMenu() { menuEl?.remove(); menuEl = null; }

  function deleteSupplier(s) {
    const chs = channelsOf(s);
    if (chs.length) { toast('该供应商存在关联渠道，请先解除关联后再删除', true); return; }
    if (!window.confirm(`删除供应商「${s.name}」？该操作不可恢复。`)) return;
    db.suppliers = db.suppliers.filter(x => x.id !== s.id);
    db.bills = db.bills.filter(b => b.supplierId !== s.id);
    save(); render(); toast('供应商已删除');
  }

  /* --------- 供应商表单 --------- */
  function openSupplierForm(s) {
    const isEdit = !!s;
    const colors = ['', 'blue', 'purple', 'orange', 'pink'];
    const dlg = document.createElement('dialog');
    dlg.className = 'sp-dialog';
    dlg.innerHTML = `<form id="spSupplierForm" novalidate>
      <div class="sp-dialog-head"><div><h2>${isEdit ? '编辑供应商' : '新增供应商'}</h2><p>${isEdit ? `修改基础信息与默认结算配置 · ${esc(s.id)}${s.createdAt ? ' · 创建于 ' + esc(s.createdAt) : ''}` : '先创建供应商档案，创建后可继续关联渠道。'}</p></div><button type="button" class="sp-dialog-close" data-close>×</button></div>
      <div class="sp-dialog-body">
        <div class="sp-form">
          <label class="req">供应商名称<input name="name" value="${esc(s?.name || '')}" maxlength="40" placeholder="例如：智谱 AI" /></label>
          <label>供应商类型<select name="type">${Object.entries(TYPE).map(([k, v]) => `<option value="${k}"${s?.type === k ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <label>官网地址<input name="site" value="${esc(s?.site && s.site !== '—' ? s.site : '')}" placeholder="https://" /></label>
          <label>内部负责人<input name="owner" value="${esc(s?.owner || '')}" placeholder="人员姓名" /></label>
          <label>联系方式<input name="contact" value="${esc(s?.contact || '')}" placeholder="邮箱或电话" /></label>
          <label>结算方式<select name="method">${['按量计费', '预充值', '包月', '内部结算'].map(v => `<option value="${v}"${s?.method === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="wide">供应商描述<textarea name="desc" placeholder="补充服务范围、注意事项">${esc(s?.desc || '')}</textarea></label>
        </div>
      </div>
      <div class="sp-dialog-foot"><button type="button" class="sp-ghost" data-close>取消</button><button type="submit" class="sp-primary">${isEdit ? '保存修改' : '确认创建'}</button></div>
    </form>`;
    document.body.appendChild(dlg);
    const f = dlg.querySelector('#spSupplierForm');
    const rateInp = { value: 1 };
    dlg.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dlg.close());
    dlg.addEventListener('close', () => dlg.remove());
    f.onsubmit = e => {
      e.preventDefault();
      const name = f.querySelector('[name="name"]').value.trim();
      if (!name) { f.name.closest('label').classList.add('invalid'); return; }
      const payload = {
        name, type: f.type.value, color: s?.color || '', site: f.site.value.trim() || '—',
        owner: f.owner.value.trim(), contact: f.contact.value.trim(), desc: f.desc.value.trim(),
        settle: s?.settle ?? true, currency: 'CNY', rate: 1, method: f.querySelector('[name="method"]').value
      };
      if (payload.settle && !(payload.rate > 0)) { rateInp.closest('label').classList.add('invalid'); return; }
      if (payload.currency === 'CNY') payload.rate = 1;
      if (isEdit) {
        Object.assign(s, payload, { updatedAt: now() });
        (s.logs = s.logs || []).push({ at: now(), who: '平台管理员', act: '修改供应商信息', detail: `${payload.name} · ${TYPE[payload.type]}`, result: '成功' });
      } else {
        const id = 'sup-' + Date.now().toString(36);
        db.suppliers.unshift({
          id, ...payload, enabled: true, service: 'nodata', success: null,
          createdAt: now(), updatedAt: now(),
          logs: [{ at: now(), who: '平台管理员', act: '创建供应商', detail: `类型：${TYPE[payload.type]}`, result: '成功' }]
        });
      }
      save(); dlg.close(); render(); toast(isEdit ? '供应商信息已保存' : '供应商创建成功，可继续关联渠道');
    };
    dlg.showModal();
    setTimeout(() => f.name.focus(), 30);
  }

  /* --------- 关联渠道 --------- */
  function openAssociate(s) {
    const free = db.channels.filter(c => !c.supplierId);
    const dlg = document.createElement('dialog');
    dlg.className = 'sp-dialog';
    dlg.innerHTML = `<form method="dialog" id="spAssocForm">
      <div class="sp-dialog-head"><div><h2>关联渠道</h2><p>为 ${esc(s.name)} 选择服务渠道。已归属其他供应商的渠道需先解除关联。</p></div><button type="button" class="sp-dialog-close" data-close>×</button></div>
      <div class="sp-dialog-body">
        ${free.length ? `<div class="sp-table-wrap" style="max-height:380px;border:1px solid var(--ui-border);border-radius:12px">
          <table class="sp-table" style="min-width:0">
            <thead><tr><th style="width:38px"></th><th>渠道名称</th><th class="num">模型数</th><th>服务状态</th></tr></thead>
            <tbody>${free.map(c => `<tr><td><input type="checkbox" value="${c.id}" aria-label="选择 ${esc(c.name)}" /></td><td><strong>${esc(c.name)}</strong><br><code style="font-size:10.5px;color:var(--ui-text-muted)">${esc(c.id)}</code></td><td class="num">${(c.models || []).length}</td><td>${badge(SERVICE[c.status][0], SERVICE[c.status][1])}</td></tr>`).join('')}</tbody>
          </table></div>` : '<div class="sp-empty"><strong>暂无可关联渠道</strong><span>所有渠道均已归属供应商。</span></div>'}
      </div>
      <div class="sp-dialog-foot"><button type="button" class="sp-ghost" data-close>取消</button><button type="submit" class="sp-primary" ${free.length ? '' : 'disabled'}>确认关联</button></div>
    </form>`;
    document.body.appendChild(dlg);
    dlg.querySelectorAll('[data-close]').forEach(b => b.onclick = () => dlg.close());
    dlg.addEventListener('close', () => dlg.remove());
    dlg.querySelector('#spAssocForm').onsubmit = e => {
      e.preventDefault();
      const ids = [...dlg.querySelectorAll('input[type=checkbox]:checked')].map(x => x.value);
      if (!ids.length) { toast('请至少选择一个渠道', true); return; }
      ids.forEach(id => { const c = chOf(id); if (c) c.supplierId = s.id; });
      (s.logs = s.logs || []).push({ at: now(), who: '平台管理员', act: '关联渠道', detail: `新增 ${ids.length} 个渠道`, result: '成功' });
      s.service = channelsOf(s).some(c => c.status === 'down') ? 'down' : channelsOf(s).some(c => c.status === 'partial') ? 'partial' : 'ok';
      save(); dlg.close(); render(); toast(`已关联 ${ids.length} 个渠道`);
    };
    dlg.showModal();
  }

  /* --------- 账单录入 --------- */
  function openBillEntry(sid, billId) {
    const s = supOf(sid); if (!s) return;
    const bill = billId ? billOf(billId) : billOfSupplierMonth(sid, st.month);
    st.draft = newDraft(sid, st.month, bill);
    st.step = 1; st.method = 'usage'; st.billOpen = true; render();
  }

  function readBillForm() {
    const d = st.draft;
    const amountEl = root.querySelector('#spBillAmount');
    if (amountEl) d.amount = amountEl.value === '' ? null : Number(amountEl.value);
    const rateEl = root.querySelector('#spBillRate');
    if (rateEl && !rateEl.disabled) d.rate = Number(rateEl.value || 0);
    const remark = root.querySelector('[name=remark]');
    if (remark) d.remark = remark.value;
    return d;
  }

  function validateBill() {
    const d = readBillForm();
    let ok = true;
    const setErr = (sel, bad) => { const el = root.querySelector(sel); if (!el) return; el.closest('label')?.classList.toggle('invalid', bad); if (bad) ok = false; };
    setErr('#spBillAmount', !(d.amount > 0));
    setErr('#spBillRate', !(d.rate > 0));
    return { ok, d };
  }

  function toStep2() {
    confirmSettle();
  }

  function addAdjust() {
    const d = st.draft;
    d.adjust = d.adjust || [];
    d.adjust.push({ month: prevMonthBelow(d.month), type: 'pay', currency: d.currency, amount: 0, rate: d.rate, reason: '' });
    render();
  }
  const prevMonthBelow = m => { const [y, mo] = m.split('-').map(Number); const d2 = new Date(y, mo - 2, 1); return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`; };
  function delAdjust(i) { st.draft.adjust.splice(i, 1); render(); }

  function saveDraft() {
    const d = readBillForm();
    if (d.amount == null) { toast('请先填写账单金额', true); return; }
    let b = billOf(d.billId);
    const cny = Number(d.amount) * Number(d.rate);
    const adj = (d.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.amount * a.rate : -a.amount * a.rate), 0);
    if (!b) { b = { id: d.billId, supplierId: d.supplierId, month: d.month, est: estOf(supOf(d.supplierId)), records: [] }; db.bills.push(b); }
    Object.assign(b, { status: 'draft', currency: d.currency, rate: d.rate, amount: d.amount, cny, adjust: d.adjust, settle: cny + adj, remark: d.remark, att: d.att, version: d.version });
    b.records = (b.records || []).concat({ at: now(), who: '平台管理员', act: '保存草稿', detail: `${d.currency} ${Number(d.amount).toLocaleString()} @ ${Number(d.rate).toFixed(4)}`, result: '成功' });
    save(); st.view = 'settlement'; render(); toast('草稿已保存');
  }

  function confirmSettle() {
    const { ok, d } = validateBill();
    if (!ok) { toast('请检查金额与汇率', true); return; }
    const b = billOf(d.billId) || { id: d.billId, supplierId: d.supplierId, month: d.month, est: estOf(supOf(d.supplierId)), records: [] };
    if (!billOf(d.billId)) db.bills.push(b);
    const cny = Number(d.amount) * Number(d.rate);
    const adj = (d.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.amount * a.rate : -a.amount * a.rate), 0);
    Object.assign(b, { status: 'draft', currency: d.currency, rate: d.rate, amount: Number(d.amount), cny, adjust: d.adjust, settle: cny + adj, remark: d.remark, att: d.att, method: st.method, operator: '平台管理员' });
    b.records = (b.records || []).concat({ at: now(), who: '平台管理员', act: '提交账单', detail: `实际结算 ${money(cny + adj)} · 成本分摊计算中`, result: '处理中' });
    save();
    st.billOpen = false; st.draft = null; st.view = 'settlement'; render(); toast('正在计算成本分摊，请稍候');
  }

  function confirmSettleDialog() {
    const d = readBillForm();
    const b = billOf(d.billId);
    const s = supOf(d.supplierId);
    const cny = Number(d.amount) * Number(d.rate);
    const adj = (d.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.amount * a.rate : -a.amount * a.rate), 0);
    const dlg = document.createElement('dialog');
    dlg.className = 'sp-dialog sm';
    dlg.innerHTML = `<form method="dialog"><div class="sp-dialog-head"><div><h2>确认结算</h2><p>确认后将保存账单、汇率与分摊结果快照，状态更新为已结算。</p></div></div>
      <div class="sp-dialog-body"><dl class="sp-dl" style="grid-template-columns:1fr 1fr">
        <div><dt>供应商</dt><dd>${esc(s.name)}</dd></div>
        <div><dt>账期</dt><dd>${monthText(d.month)}</dd></div>
        <div><dt>实际结算金额</dt><dd><strong>${money(cny + adj)}</strong></dd></div>
        <div><dt>参与分摊渠道</dt><dd>${channelsOf(s).length} 个</dd></div>
      </dl></div>
      <div class="sp-dialog-foot"><button type="button" class="sp-ghost" data-close>取消</button><button value="ok" class="sp-primary">确认结算</button></div></form>`;
    document.body.appendChild(dlg);
    dlg.querySelector('[data-close]').onclick = () => dlg.close();
    dlg.addEventListener('close', () => dlg.remove());
    dlg.querySelector('form').onsubmit = e => {
      e.preventDefault();
      let bill = b;
      if (!bill) { bill = { id: d.billId, supplierId: d.supplierId, month: d.month, est: estOf(s), records: [] }; db.bills.push(bill); }
      const isFix = bill.status === 'settled';
      Object.assign(bill, {
        status: 'settled', currency: d.currency, rate: d.rate, amount: Number(d.amount), cny,
        adjust: d.adjust, settle: cny + adj, remark: d.remark, att: d.att,
        settledAt: now(), operator: '平台管理员', method: st.method,
        version: isFix ? (bill.version || 1) + 1 : (bill.version || 1)
      });
      bill.records = (bill.records || []).concat({ at: now(), who: '平台管理员', act: isFix ? '修正并结算' : '确认结算', detail: `实际结算 ${money(cny + adj)} · 分摊方式：${st.method === 'usage' ? '按使用量' : '按预估成本'}`, result: '成功' });
      save(); dlg.close();
      st.billOpen = false; st.draft = null;
      st.billId = bill.id; st.view = 'billDetail'; st.bdTab = 'info'; render(); toast('结算完成');
    };
    dlg.showModal();
  }

  function startFix(id) {
    const b = billOf(id); if (!b) return;
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = b.id + '-fix' + Date.now().toString(36);
    copy.status = 'draft'; copy.version = (b.version || 1) + 1; copy.settledAt = ''; copy.operator = '';
    copy.records = [];
    db.bills.push(copy);
    st.draft = { billId: copy.id, supplierId: copy.supplierId, month: copy.month, currency: copy.currency, rate: copy.rate, amount: copy.amount, remark: copy.remark || '', att: copy.att || '', version: copy.version, adjust: copy.adjust, method: 'usage' };
    st.step = 1; st.billOpen = true; render(); toast('已创建修正版本草稿');
  }

  /* --------- 折算价格抽屉 --------- */
  function openPrice(chId) {
    const c = chOf(chId); if (!c) return;
    const b = billOf(st.billId);
    const supplier = supOf(c.supplierId) || supOf(st.draft?.supplierId);
    const actual = b && b.cny ? b.cny * (Number(c.estCost || 0) / (channelsOf(supplier).reduce((x, y) => x + Number(y.estCost || 0), 0) || 1)) : Number(c.estCost || 0);
    const factor = c.estCost ? actual / c.estCost : 1;
    const rows = (c.models || []).map(m => ({ ...m, inNew: m.inP * factor, outNew: m.outP * factor }));
    const drawer = root.querySelector('#spDrawer');
    drawer.innerHTML = `<div class="sp-drawer-mask" data-close></div><aside class="sp-drawer-panel">
      <div class="sp-drawer-head"><div><h2>折算价格</h2><p>${esc(c.name)} · ${esc(supplier.name)}</p></div><button class="sp-dialog-close" data-close>×</button></div>
      <div class="sp-drawer-body">
        <dl class="sp-dl" style="grid-template-columns:1fr 1fr">
          <div><dt>成本修正系数</dt><dd><strong>${factor.toFixed(4)}</strong></dd></div>
          <div><dt>分摊方式</dt><dd>${(st.method || 'usage') === 'usage' ? '按使用量比例' : '按预估成本比例'}</dd></div>
        </dl>
        <table class="sp-table" style="min-width:0;margin-top:14px"><thead><tr><th>模型</th><th>计价类型</th><th class="num">原始采购价</th><th class="num">原始倍率</th><th class="num">月度折算价</th><th>单位</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.type)}</td><td class="num">${money(r.inP)} / ${money(r.outP)}</td><td class="num">1.0000</td><td class="num"><strong>${money(r.inNew)} / ${money(r.outNew)}</strong></td><td>每 1M Tokens</td></tr>`).join('')}</tbody></table>
        <p class="sp-hint" style="margin-top:12px">月度折算价格仅用于实际成本核算，不会修改当前渠道线上计费规则。原始计价结构（含阶梯价、分时价）保持不变，仅在对应成本上乘以修正系数。</p>
      </div>
    </aside>`;
    drawer.classList.add('open');
    drawer.querySelectorAll('[data-close]').forEach(b2 => b2.onclick = () => drawer.classList.remove('open'));
  }

  function openStatement(billId) {
    const b = billOf(billId); if (!b) return;
    const s = supOf(b.supplierId); if (!s) return;
    const adj = (b.adjust || []).reduce((sum, a) => sum + (a.type === 'pay' ? a.cny : -a.cny), 0);
    const diff = b.cny == null ? null : b.cny - b.est;
    const rate = b.currency === 'CNY' ? '1.0000' : Number(b.rate).toFixed(4);
    const sym = CURRENCY[b.currency]?.sym || '';
    const hasBill = b.amount != null;
    const chs = channelsOf(s);
    const totalEst = chs.reduce((x, c) => x + Number(c.estCost || 0), 0) || 1;
    const rows = chs.map(c => {
      const share = Number(c.estCost || 0) / totalEst;
      const actual = (b.cny || 0) * share;
      const d = actual - Number(c.estCost || 0);
      return `<tr><td>${esc(c.name)}</td><td class="num">${money(c.estCost)}</td><td class="num"><strong>${money(actual)}</strong></td><td class="num ${diffCls(d)}">${diffTxt(d)}</td></tr>`;
    }).join('');
    const drawer = root.querySelector('#spDrawer');
    drawer.innerHTML = `<div class="sp-drawer-mask" data-close></div><aside class="sp-drawer-panel">
      <div class="sp-drawer-head"><div><h2>对账单</h2><p>${esc(s.name)} · ${monthText(b.month)} · ${BILL_STATUS[b.status][0]}</p></div><button class="sp-dialog-close" data-close>×</button></div>
      <div class="sp-drawer-body">
        <dl class="sp-dl" style="grid-template-columns:1fr 1fr">
          <div><dt>对账单金额</dt><dd><strong>${hasBill ? sym + Number(b.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '—'}</strong></dd></div>
          <div><dt>账单币种</dt><dd>${esc(b.currency || 'CNY')}</dd></div>
          <div><dt>结算汇率</dt><dd>${rate}</dd></div>
          <div><dt>折合人民币</dt><dd><strong>${hasBill ? money(b.cny) : '—'}</strong></dd></div>
          <div><dt>系统实时预估</dt><dd>${money(b.est)}</dd></div>
          <div><dt>成本差额</dt><dd class="${diff == null ? '' : diffCls(diff)}">${diff == null ? '—' : diffTxt(diff) + (b.est ? '（' + pct(diff / b.est * 100) + '）' : '')}</dd></div>
          <div><dt>历史差额调整</dt><dd>${adj ? diffTxt(adj) : '—'}</dd></div>
          <div><dt>实际结算金额</dt><dd><strong>${hasBill ? money(b.cny + adj) : '—'}</strong></dd></div>
        </dl>
        ${hasBill ? `<div class="sp-sub-title" style="margin-top:18px">渠道对账明细 <span>按预估成本占比拆分，合计 ${money(b.cny)}</span></div>
        <table class="sp-subtable">
          <thead><tr><th>渠道</th><th class="num">系统预估</th><th class="num">对账分摊</th><th class="num">差额</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>` : `<div class="sp-empty" style="margin-top:18px"><strong>账单尚未录入</strong><p>录入供应商对账单金额后，可在此核对逐渠道差异。</p></div>`}
        <p class="sp-hint" style="margin-top:14px">对账单仅用于核对金额与差异，不会改动账单数据。如需调整请使用「修正账单」生成新版本。</p>
      </div>
    </aside>`;
    drawer.classList.add('open');
    drawer.querySelectorAll('[data-close]').forEach(b2 => b2.onclick = () => drawer.classList.remove('open'));
  }

  /* --------- 导出 --------- */
  function download(name, text) {
    const blob = new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportBills() {
    const rows = settlementRows();
    const lines = [['供应商', '账单月份', '渠道数', '预估金额', '原币金额', '币种', '汇率', '实际金额', '历史调整', '实际结算', '状态'].join(',')];
    rows.forEach(b => {
      const s = supOf(b.supplierId);
      const adj = (b.adjust || []).reduce((x, a) => x + (a.type === 'pay' ? a.cny : -a.cny), 0);
      lines.push([s.name, b.month, channelsOf(s).length, b.est, b.amount ?? '', b.currency, b.rate, b.cny ?? '', adj, b.settle ?? '', BILL_STATUS[b.status][0]].join(','));
    });
    download(`供应商月度结算_${st.month}.csv`, lines.join('\n'));
    toast('账单已导出');
  }
  function exportBill(id) {
    const b = billOf(id); const s = supOf(b.supplierId);
    const lines = [['项目', '值'].join(','), ['供应商', s.name].join(','), ['账期', b.month].join(','), ['币种', b.currency].join(','), ['原币金额', b.amount ?? ''].join(','), ['汇率', b.rate].join(','), ['人民币金额', b.cny ?? ''].join(','), ['预估成本', b.est].join(','), ['实际结算', b.settle ?? ''].join(',')];
    download(`结算账单_${s.name}_${b.month}.csv`, lines.join('\n'));
    toast('账单已导出');
  }

  /* ================= 对外 ================= */
  window.SupplierApp = {
    state: st,
    show(view) {
      if (view === 'settlement') { st.view = 'settlement'; render(); }
      else { st.view = 'list'; st.page = 1; render(); }
    },
    render
  };

  render();
})();
