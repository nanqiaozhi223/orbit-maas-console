(() => {
  const page = document.querySelector('#usagePage');
  const spendCard = page.querySelector('.usage-chart-card');
  const card = document.createElement('section');
  spendCard.after(card);
  card.className = 'card usage-user-details';
  const headings = ['用户','请求数','额度','Token','平均 RPM','平均 TPM','成功率 / 失败数','最近调用'];
  const sortIcon = '<svg class="usage-sort-icon" viewBox="0 0 24 28" aria-hidden="true"><path class="sort-up" d="M12 1 2 12h20L12 1Z"/><path class="sort-down" d="M12 27 22 16H2l10 11Z"/></svg>';
  card.innerHTML = `<div class="usage-section-head"><div><h2>用户用量明细</h2><p>演示数据 · 按用户查看请求、费用与调用情况</p></div><button type="button" class="btn-light usage-details-view">查看</button></div><div class="usage-table-wrap"><table class="usage-table usage-user-table"><thead><tr>${headings.map((title,index)=>`<th><button type="button" data-user-sort="${index}">${title} ${sortIcon}</button></th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="usage-details-pagination"><span class="usage-details-total"></span><label>每页行数 <select aria-label="用户明细每页行数"><option>20</option><option>50</option><option>100</option></select></label><button type="button" disabled aria-label="上一页">‹</button><span>1</span><button type="button" disabled aria-label="下一页">›</button></div>`;
  const tbody = card.querySelector('tbody');
  const users = [
    ['admin','Root User',106,71.99,7842956,0.07,5446.5,98.1,2,'2026-10-21 14:43:31'],
    ['lei_yang','阳蕾',84,53.28,5218400,0.06,3623.9,100,0,'2026-10-21 14:38:12'],
    ['yichang_han','韩一畅',62,38.76,3891200,0.04,2702.2,98.4,1,'2026-10-21 14:25:47'],
    ['pandeng_li','李攀登',48,29.64,2468800,0.03,1714.4,95.8,2,'2026-10-21 13:56:08'],
    ['tong_li2','黎彤',37,24.15,1986400,0.03,1379.4,100,0,'2026-10-21 13:42:19'],
    ['xiyun_wang','王茜云',23,12.58,1072400,0.02,744.7,95.7,1,'2026-10-21 12:18:36']
  ];
  let sortColumn = 3, descending = true;
  const money = value => '¥' + value.toFixed(2);
  function render() {
    const all = page.dataset.userScope === 'all';
    card.hidden = !all;
    spendCard.hidden = all;
    const query = all ? (page.querySelector('.usage-user-filter input')?.value || '').trim().toLowerCase() : '';
    const columns = [0,2,3,4,5,6,7,9];
    const matches = users.filter(user => user[0].toLowerCase().includes(query)).sort((a,b)=>{
      const column = columns[sortColumn];
      const result = typeof a[column] === 'number' ? a[column]-b[column] : a[column].localeCompare(b[column]);
      return descending ? -result : result;
    });
    card.querySelector('.usage-details-total').textContent = `总计：${matches.length}`;
    tbody.innerHTML = matches.length ? matches.map(user => {
      const [username,name,requests,cost,tokens,rpm,tpm,success,failures,last] = user;
      return `<tr><td><span><strong>${username}</strong><small>${name}</small></span></td><td>${requests}</td><td>${money(cost)}</td><td>${tokens.toLocaleString('zh-CN')}</td><td>${rpm.toFixed(2)}</td><td>${tpm.toLocaleString('zh-CN')}</td><td>${success}% / <span class="usage-failure-count">${failures}</span></td><td>${last}</td></tr>`;
    }).join('') : '<tr><td colspan="8" class="usage-user-empty">暂无匹配用户的用量记录</td></tr>';

  }
  card.querySelectorAll('[data-user-sort]').forEach(button=>button.addEventListener('click',()=>{
    const column=Number(button.dataset.userSort);
    descending=column===sortColumn?!descending:true;
    sortColumn=column;
    card.querySelectorAll('[data-user-sort]').forEach(item=>{item.removeAttribute('aria-sort');item.querySelector('svg').dataset.active='none'});
    button.setAttribute('aria-sort',descending?'descending':'ascending');
    button.querySelector('svg').dataset.active=descending?'down':'up';
    render();
  }));
  card.querySelector('.usage-details-view').addEventListener('click',()=>{
    const nav=[...document.querySelectorAll('.nav-item')].find(item=>item.textContent.trim()==='使用记录');
    nav?.click();
  });
  page.addEventListener('usage-scope-change',render);
  page.addEventListener('usage-user-filter-change',render);
  render();
})();
