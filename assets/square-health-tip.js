// 模型广场：成功率条悬浮提示（鼠标悬停 / 键盘左右键查看每个时间段）
(() => {
  const tip = document.createElement('div');
  tip.className = 'square-health-tip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-live', 'polite');
  tip.hidden = true;
  document.body.append(tip);

  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  let active = null;

  function show(segment) {
    if (!segment?.dataset.time) return;
    active?.classList.remove('is-active');
    active = segment;
    segment.classList.add('is-active');
    const ok = Number(segment.dataset.ok) || 0;
    const fail = Number(segment.dataset.fail) || 0;
    const rate = ok + fail ? (ok / (ok + fail) * 100).toFixed(1) : '0.0';
    // 第一行时间段；第二行 成功数（绿）、失败数（红）、成功率
    tip.innerHTML = `<span class="square-health-tip-time">${escapeHtml(segment.dataset.time)}</span><span class="square-health-tip-counts"><span class="is-ok">成功 <b>${ok}</b></span><span class="is-fail">失败 <b>${fail}</b></span><span class="is-rate">(${rate}%)</span></span>`;
    tip.hidden = false;
    // 定位在色块正上方，靠近视口边缘时自动收进来
    const box = segment.getBoundingClientRect();
    const width = tip.offsetWidth;
    const left = Math.min(Math.max(8, box.left + box.width / 2 - width / 2), window.innerWidth - width - 8);
    const top = box.top - tip.offsetHeight - 10;
    tip.style.left = `${left}px`;
    tip.style.top = `${top < 8 ? box.bottom + 10 : top}px`;
    tip.style.setProperty('--arrow-x', `${box.left + box.width / 2 - left}px`);
    tip.classList.toggle('is-below', top < 8);
  }
  function hide() {
    active?.classList.remove('is-active');
    active = null;
    tip.hidden = true;
  }

  document.addEventListener('pointerover', event => {
    const segment = event.target.closest('.square-health i');
    if (segment) show(segment);
  });
  document.addEventListener('pointerout', event => {
    if (event.target.closest('.square-health i') && !event.relatedTarget?.closest?.('.square-health i')) hide();
  });
  document.addEventListener('focusin', event => {
    const bar = event.target.closest?.('.square-health');
    if (bar) show(bar.querySelector('i.is-active') || bar.querySelector('i:last-of-type'));
  });
  document.addEventListener('focusout', event => {
    if (event.target.closest?.('.square-health')) hide();
  });
  document.addEventListener('keydown', event => {
    const bar = event.target.closest?.('.square-health');
    if (!bar) return;
    if (event.key === 'Escape') return hide();
    const segments = [...bar.querySelectorAll('i')];
    const index = segments.indexOf(active && bar.contains(active) ? active : segments[segments.length - 1]);
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: segments.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    show(segments[Math.max(0, Math.min(segments.length - 1, next))]);
  });
  window.addEventListener('scroll', hide, { passive: true, capture: true });
})();
