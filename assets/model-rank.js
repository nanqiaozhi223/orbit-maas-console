(() => {
  const root = document.querySelector('#modelSquarePage');
  const title = root?.querySelector(':scope > .title-row');
  const layout = root?.querySelector(':scope > .square-layout');
  if (!root || !title || !layout) return;

  // 演示数据：最近 10 分钟模型可用性汇总
  const summary = { top: 'gemini-3.8-flash', topRate: '100%', total: '5.57K', ok: '4.31K', fail: '1.26K', active: 34 };

  title.insertAdjacentHTML('afterend', `<section class="card square-rank" aria-labelledby="squareRankTitle">
    <div class="square-rank-head">
      <div><h2 id="squareRankTitle">模型可用性</h2><p>最近 10 分钟 · 综合考虑成功率与调用量</p></div>
      <button type="button" class="square-rank-link">查看完整排名<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
    </div>
    <div class="square-rank-strip">
      <div class="square-rank-stat is-featured">
        <div class="square-rank-stat-head"><span class="square-rank-crown" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m4 8.5 4.2 3.3L12 6l3.8 5.8L20 8.5 18.4 17H5.6z"/><path d="M6 20h12"/></svg></span><span>综合推荐</span></div>
        <strong>${summary.top}</strong>
        <span class="square-rank-pill"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.8 12.3 2.8 2.8 5.6-5.8"/></svg>${summary.topRate} 成功率</span>
      </div>
      <div class="square-rank-stat">
        <div class="square-rank-stat-head"><span>总调用次数</span></div>
        <strong>${summary.total}</strong>
        <span class="square-rank-stat-meta">成功 ${summary.ok}<i aria-hidden="true">/</i>失败 ${summary.fail}</span>
      </div>
      <div class="square-rank-stat">
        <div class="square-rank-stat-head"><span>活跃模型</span></div>
        <strong>${summary.active}</strong>
        <span class="square-rank-stat-meta">最近 10 分钟有调用记录</span>
      </div>
    </div>
    <img class="square-rank-illustration" src="assets/square-rank-art.png" alt="" aria-hidden="true" />
  </section>`);

  const rank = root.querySelector('.square-rank');
  const notice = root.querySelector('.square-notice');
  let timer;
  const rows = [
    ['gemini-3.8-flash','100.00%','217','2.1M','21.7','0.21M','217 成功 / 0 失败','3.89%','2026-10-29 17:55:00'],
    ['gemini-4-argon','99.63%','271','8.87M','27.1','0.89M','270 成功 / 1 失败','4.86%','2026-10-29 17:55:00'],
    ['gpt-5.6-luna','100.00%','172','3.76M','17.2','0.38M','172 成功 / 0 失败','3.09%','2026-10-29 17:55:00'],
    ['gpt-6-luna','100.00%','141','0.84M','14.1','—','141 成功 / 0 失败','2.53%','2026-10-29 17:54:57'],
    ['deepseek-v4.1-flash-1...','100.00%','136','22.52M','13.6','2.25M','136 成功 / 0 失败','2.44%','2026-10-29 17:55:00'],
    ['qwen3.8-27b-office','100.00%','121','17.02M','12.1','1.7M','121 成功 / 0 失败','2.17%','2026-10-29 17:55:00'],
    ['gpt-6-astra','96.31%','298','53.41M','29.8','5.34M','287 成功 / 11 失败','5.35%','2026-10-29 17:55:30'],
    ['gpt-6.1-terra','100.00%','39','11.78M','3.9','1.18M','39 成功 / 0 失败','0.70%','2026-10-29 17:54:52'],
    ['gpt-6.1-sol','94.12%','187','33.57M','18.7','3.36M','176 成功 / 11 失败','3.36%','2026-10-29 17:55:31']
  ];
  const fullPage = document.createElement('section');
  fullPage.className = 'square-full-rank is-hidden';
  fullPage.innerHTML = `<button class="square-detail-back square-full-back" type="button">← 返回模型广场</button>
    <div class="title-row square-full-head"><div><h1>模型可用性</h1><p>默认最近 10 分钟 · 综合排名时考虑成功率与调用量</p></div></div>
    <div class="square-rank-cards square-full-summary">
      <article class="square-rank-card is-featured">
        <div class="square-rank-card-head"><span class="square-rank-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3.5 8 4.6 3.6L12 5l3.9 6.6L20.5 8l-1.8 10H5.3z"/><path d="M6 21h12"/></svg></span><span class="square-rank-label">当前综合排名最高</span></div>
        <div class="square-rank-model">gemini-3.8-flash</div>
        <div class="square-rank-meta"><span class="square-rank-ok"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/></svg>100.00% 成功率</span><span>217 次调用</span></div>
      </article>
      <article class="square-rank-card">
        <div class="square-rank-card-head"><span class="square-rank-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6"/></svg></span><span class="square-rank-label">总调用次数</span></div>
        <div class="square-rank-value">5.57K</div>
        <div class="square-rank-meta"><span class="is-ok">成功 4.31K</span><i aria-hidden="true">/</i><span class="is-fail">失败 1.26K</span></div>
      </article>
      <article class="square-rank-card">
        <div class="square-rank-card-head"><span class="square-rank-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg></span><span class="square-rank-label">活跃模型</span></div>
        <div class="square-rank-value">34</div>
        <div class="square-rank-meta">最近调用 2026-10-29 17:55:31</div>
      </article>
    </div>
    <section class="card square-full-card" aria-labelledby="squareFullTableTitle">
      <div class="square-full-card-head"><h2 id="squareFullTableTitle">综合排名</h2><p>已排除 2 个非对话模型（text-embedding-3-large、text-embedding-3-small），其调用模式与对话模型不可比。</p></div>
      <div class="square-full-table-wrap"><table class="square-full-table"><thead><tr><th>排名</th><th>模型</th><th>成功率</th><th class="is-num">总调用次数</th><th class="is-num">Token 总量</th><th class="is-num">平均 RPM</th><th class="is-num">平均 TPM</th><th class="is-num">成功 / 失败</th><th class="is-num">调用占比</th><th>最新调用</th></tr></thead><tbody></tbody></table></div>
    </section>`;
  root.append(fullPage);
  const tbody = fullPage.querySelector('tbody');
  const okFail = text => { const [, ok, fail] = text.match(/(\d+)\D+(\d+)/) || []; return `${ok} / <span class="${+fail ? 'is-fail' : ''}">${fail}</span>`; };
  tbody.innerHTML = rows.map((r, i) => { const warn = parseFloat(r[1]) < 95; return `<tr><td><span class="rank-number ${i < 3 ? 'is-top' : ''}">${i + 1}</span></td><td><span class="rank-model">${r[0]}</span><span class="rank-badge ${warn ? 'is-warn' : ''}">${warn ? '波动' : '稳定'}</span></td><td><span class="rank-rate ${warn ? 'is-warn' : ''}"><i style="width:${parseFloat(r[1])}%"></i></span><b class="rank-rate-value">${r[1]}</b></td><td class="is-num">${r[2]}</td><td class="is-num">${r[3]}</td><td class="is-num">${r[4]}</td><td class="is-num">${r[5]}</td><td class="is-num">${okFail(r[6])}</td><td class="is-num">${r[7]}</td><td class="rank-time">${r[8]}</td></tr>`; }).join('');
  const showFullRank = () => { rank.classList.add('is-detail-hidden'); layout.classList.add('is-detail-hidden'); title.classList.add('is-detail-hidden'); fullPage.classList.remove('is-hidden'); root.scrollIntoView({behavior:'smooth',block:'start'}); };
  const hideFullRank = () => { fullPage.classList.add('is-hidden'); rank.classList.remove('is-detail-hidden'); layout.classList.remove('is-detail-hidden'); title.classList.remove('is-detail-hidden'); };
  rank.querySelectorAll('.square-rank-link,.square-rank-more').forEach(btn => btn.addEventListener('click', showFullRank));
  fullPage.querySelector('.square-full-back').addEventListener('click', hideFullRank);

  // 进入模型详情时与标题、列表一起隐藏
  const sync = () => rank.classList.toggle('is-detail-hidden', title.classList.contains('is-detail-hidden'));
  new MutationObserver(sync).observe(title, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
