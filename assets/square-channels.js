// 模型详情 · 服务渠道：渠道价格概览 + 可展开的价格明细 / 参数差异（演示数据）
(() => {
  const list = document.querySelector('#modelSquarePage .square-channel-list');
  if (!list) return;

  const yuan = value => `¥${value.toFixed(2)}`;
  const range = values => {
    const min = Math.min(...values), max = Math.max(...values);
    return min === max ? yuan(min) : `${yuan(min)}–${max.toFixed(2)}`;
  };
  // 每个渠道：价格规则（periods → tiers）+ 参数差异
  const channels = [
    { id: 6, rule: '固定价', periods: [{ label: '全天', tiers: [['全部长度', 2, 8]] }],
      diffs: [['推理深度', 'high / low / max', 'high / low'], ['最大输入', '128K', '64K'], ['图片输入', '支持', '不支持']] },
    { id: 7, rule: '2 个档位', periods: [{ label: '全天', tiers: [['≤32K', 1.5, 6], ['>32K', 3, 12]] }],
      diffs: [['推理深度', 'high / low / max', 'high / low']] },
    { id: 18, rule: '分时 · 分档', zone: '北京时间', periods: [
      { label: '日间价', time: '09:00–18:00', current: true, tiers: [['≤32K', 2, 8], ['>32K', 3, 12]] },
      { label: '夜间价', time: '18:00–次日 09:00', tiers: [['≤32K', 1.2, 4.8], ['>32K', 1.8, 7.2]] }
    ], diffs: [] },
    { id: 21, rule: '固定价', periods: [{ label: '全天', tiers: [['全部长度', 2.4, 9.6]] }], diffs: [] }
  ];
  const open = new Map(); // channel id → 'price' | 'params'

  const chevron = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const toggle = (ch, kind, label) => {
    const expanded = open.get(ch.id) === kind;
    return `<button type="button" class="sq-ch-toggle" data-ch="${ch.id}" data-kind="${kind}" aria-expanded="${expanded}" aria-controls="sq-ch-${ch.id}-detail">${label}${chevron}</button>`;
  };
  const tierCount = ch => ch.periods.reduce((n, p) => n + p.tiers.length, 0);

  function pricePanel(ch) {
    const rows = ch.periods.map((period, pi) => period.tiers.map((tier, i) => `<tr>${i === 0 ? `<th scope="row" rowspan="${period.tiers.length}"${pi === ch.periods.length - 1 ? ' class="is-last"' : ''}><b>${period.label}</b>${period.time ? `<small>${period.time}</small>` : ''}${period.current ? '<span class="sq-ch-badge is-current">当前</span>' : ''}</th>` : ''}<td>${tier[0]}</td><td class="sq-ch-num">${yuan(tier[1])}</td><td class="sq-ch-num">${yuan(tier[2])}</td></tr>`).join('')).join('');
    return `<div class="sq-ch-panel-head"><strong>价格明细</strong>${ch.zone ? `<span>${ch.zone}</span>` : '<span>每 1M Tokens</span>'}</div>
      <table class="sq-ch-sub"><thead><tr><th scope="col">计费时段</th><th scope="col">输入长度</th><th scope="col">输入价</th><th scope="col">输出价</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function paramsPanel(ch) {
    return `<div class="sq-ch-panel-head"><strong>参数差异</strong><span>未列出的参数与模型级声明一致</span></div>
      <table class="sq-ch-sub"><thead><tr><th scope="col">参数</th><th scope="col">模型级声明</th><th scope="col">渠道实际支持</th></tr></thead><tbody>${ch.diffs.map(d => `<tr><th scope="row"><b>${d[0]}</b></th><td>${d[1]}</td><td><span class="sq-ch-badge is-warn">${d[2]}</span></td></tr>`).join('')}</tbody></table>`;
  }

  function render() {
    list.innerHTML = `<table class="sq-ch-table"><thead><tr><th scope="col">渠道</th><th scope="col">输入价<small class="sq-ch-th-unit">（/ 1M Tokens）</small></th><th scope="col">输出价<small class="sq-ch-th-unit">（/ 1M Tokens）</small></th><th scope="col">计费规则</th><th scope="col">参数差异</th></tr></thead><tbody>${channels.map(ch => {
      const tiers = ch.periods.flatMap(p => p.tiers);
      const kind = open.get(ch.id);
      const rule = tierCount(ch) > 1 ? toggle(ch, 'price', ch.rule) : `<span class="sq-ch-plain">${ch.rule}</span>`;
      const diff = ch.diffs.length ? toggle(ch, 'params', `<span class="sq-ch-badge is-warn">${ch.diffs.length} 项差异</span>`) : '<span class="sq-ch-same">与声明一致</span>';
      return `<tr class="sq-ch-row${kind ? ' is-open' : ''}"><th scope="row">渠道 #${ch.id}</th><td class="sq-ch-num">${range(tiers.map(t => t[1]))}</td><td class="sq-ch-num">${range(tiers.map(t => t[2]))}</td><td>${rule}</td><td>${diff}</td></tr>${kind ? `<tr class="sq-ch-detail" id="sq-ch-${ch.id}-detail"><td colspan="5"><div class="sq-ch-panel">${kind === 'price' ? pricePanel(ch) : paramsPanel(ch)}</div></td></tr>` : ''}`;
    }).join('')}</tbody></table>`;
  }

  list.addEventListener('click', event => {
    const button = event.target.closest('.sq-ch-toggle');
    if (!button) return;
    const id = Number(button.dataset.ch), kind = button.dataset.kind;
    open.get(id) === kind ? open.delete(id) : open.set(id, kind);
    render();
    list.querySelector(`.sq-ch-toggle[data-ch="${id}"][data-kind="${kind}"]`)?.focus();
  });
  render();
})();
