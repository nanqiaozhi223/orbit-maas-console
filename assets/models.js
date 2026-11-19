(() => {
  const root = document.querySelector('#modelsPage');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const names = ['qwen3.8-27b-office','gpt-image-2.5-sunburst','gpt-image-2.5-flare','gemini-3.5-flash-lite','gemini-3-pro-preview','claude-haiku-5-5','gemini-4-argon','gpt-6-sol','claude-opus-5','gpt-6-luna','qwen3-coder','gemini-3.8-flash'];
  const providers = ['阿里巴巴','OpenAI','OpenAI','Google','Google','Anthropic','Google','OpenAI','Anthropic','OpenAI','阿里巴巴','Google'];
  const seed = names.map((name,i) => ({id:86-i,name,provider:providers[i],enabled:i!==9,official:i<7,endpoint:providers[i]==='Google'?'gemini, openai':providers[i]==='Anthropic'?'anthropic, openai':'openai',groups:i%3===0?['default']:['default','vip'],date:'2026-10-21'}));
  let models = seed;
  try { const saved = JSON.parse(localStorage.getItem('maas-models-demo')); if(Array.isArray(saved) && saved.every(m=>m && typeof m.id==='number' && typeof m.name==='string' && Array.isArray(m.groups))) models=saved; } catch {}
  let page=1, descending=true, editing=null;
  const expanded=new Set();
  const persist=()=>{try{localStorage.setItem('maas-models-demo',JSON.stringify(models));}catch{}};
  function notice(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);}
  // 演示数据：服务渠道数与已收窄渠道数按模型 ID 推算
  const DEMO_MODEL_ID=86;
  const demoChannels=[
    {cid:32,name:'TokenCheap Claude',prov:'Anthropic',ratio:1,scope:'',upstream:'qwen3-27b-nvfp4',pool:true,
     rpm:[0,684],tpm:[0,8485.4],fly:[2,228],used:[0,0,2],quota:[684,'8,485.4',228]},
    {cid:41,name:'自部署 Qwen3.8 27B',prov:'OpenAI',ratio:0.01,scope:'只对 qwen3.8-27b-office 生效',upstream:'qwen3-27b-nvfp4',share:'与 qwen3.8-27b 共享',pool:false,
     rpm:[0,Infinity],tpm:[0,766575],fly:[0,2],used:[0,0,0],quota:['∞','766575',2]},
    {cid:32,name:'TokenCheap Claude',prov:'Anthropic',ratio:1,scope:'',upstream:'qwen3-27b-nvfp4',pool:true,
     rpm:[0,684],tpm:[0,8485.4],fly:[2,228],used:[0,0,2],quota:[684,'8,485.4',228]},
    {cid:36,name:'Tokencheap-DeepSeek',prov:'DeepSeek',ratio:1,scope:'',upstream:'',pool:false,
     rpm:[0,Infinity],tpm:[0,Infinity],fly:[0,Infinity],used:[0,0,0],quota:['∞','∞','∞']}
  ];
  const channelsOf=m=>m.id===DEMO_MODEL_ID?demoChannels.length:(m.id%7===0?0:(m.id%3===0?2:1));
  const channelPool=[[32,'TokenCheap Claude','Anthropic'],[25,'aliyun-anhui zhuoniu','Alibaba'],[22,'gpt_kiro','OpenAI'],[23,'gpt_codex','OpenAI'],[20,'grok','xAI'],[17,'apipro_chatgpt','OpenAI']];
  const narrowState=new Map(), ratioState=new Map(), limitState=new Map(), pillState=new Map();
  const DEFAULT_LIMITS={rpm:702,tpm:8708.7,fly:234};
  const limitsOf=(m,i)=>limitState.get(chKey(m,i))||DEFAULT_LIMITS;
  const chKey=(m,i)=>m.id+':'+i;
  const isNarrowed=(m,i)=>narrowState.has(chKey(m,i))?narrowState.get(chKey(m,i)):(m.id===DEMO_MODEL_ID?false:(channelsOf(m)>1&&i===0));
  const narrowedOf=m=>Array.from({length:channelsOf(m)},(_,i)=>i).filter(i=>isNarrowed(m,i)).length;
  const fmt=n=>n.toLocaleString('zh-CN',{maximumFractionDigits:1});
  const pricingOf=m=>({input:[13.46,1.0095,10,53.84,13.46,0.28266][m.id%6],output:[40.38,4.038,30,201.9,67.3,0.28266][m.id%6]});
  function capacityBlock(c,title){
    const num=v=>v===Infinity?'∞':(Number.isInteger(v)?v:fmt(v));
    const wide=v=>v===Infinity?'∞':(v===0?'0':fmt(v)+'万');
    const metrics=[
      ['RPM',c.rpm[0],c.rpm[1],v=>num(v),v=>num(v)],
      ['TPM',c.tpm[0],c.tpm[1],v=>wide(v),v=>wide(v)],
      ['在途请求',c.fly[0],c.fly[1],v=>num(v),v=>num(v)]
    ];
    return `<div class="mcc-capacity-head"><h5>${title||'资源池实时容量'}</h5><small>已用 / 上限</small></div>
      <div class="mcc-capacity">${metrics.map(([label,used,cap,fmtUsed,fmtCap])=>{
        const unlimited=cap===Infinity;
        const foot=unlimited?'不限额':`剩余 ${fmtCap(Math.max(0,cap-used))}`;
        return `<div class="mcc-metric"><span class="mcc-label">${label}</span><p><b>${fmtUsed(used)}</b> / ${unlimited?'∞':fmtCap(cap)}</p>${unlimited?'':`<span class="mcc-bar"><i style="width:${Math.min(100,used/cap*100)}%"></i></span>`}<small>${foot}</small></div>`;
      }).join('')}</div>`;
  }

  function sourceBlock(c){
    const rows=c.pool
      ? `<div><span>额度来源</span><b>${escape(c.prov)} 资源池动态额度</b></div>`
      : `<div><span>上游模型</span><b>${escape(c.upstream||'—')}</b></div>
         <div><span>额度来源</span><b>${escape(c.share||'本渠道独立额度')}</b></div>`;
    return `<div class="mcc-source">
      ${rows}
      ${c.pool?'<button type="button" class="model-channel-link" data-pool>前往资源池管理 ↗</button>':''}
    </div>`;
  }

  function demoChannelCards(m){
    return demoChannels.map((c,i)=>{
      const key=chKey(m,i);
      const ratio=ratioState.has(key)?ratioState.get(key):c.ratio;
      return `<article class="model-channel-card">
        <header><div><h4>#${c.cid} · ${escape(c.name)}</h4><p>${escape(c.prov)}</p></div><span class="model-channel-inherit">${c.pool?'继承':'独立'}</span></header>
        <div class="mcc-section-head"><h5>参数配置</h5><button type="button" class="model-narrow-btn" data-narrow="${key}" aria-haspopup="dialog">收窄</button></div>
        <div class="mcc-ratio${c.pool?' single':''}">
          <label class="mcc-field"><span>倍率</span><input type="number" min="0" step="0.01" value="${ratio}" data-ratio="${key}" aria-label="渠道 #${c.cid} 倍率"></label>
          ${c.pool?'':`<label class="mcc-field"><span>RPM</span><input type="text" value="${c.quota[0]}" aria-label="渠道 #${c.cid} RPM 上限"></label>
          <label class="mcc-field"><span>TPM</span><input type="text" value="${c.quota[1]}" aria-label="渠道 #${c.cid} TPM 上限"></label>
          <label class="mcc-field"><span>并发</span><input type="text" value="${c.quota[2]}" aria-label="渠道 #${c.cid} 并发上限"></label>`}
        </div>
        ${c.scope?`<p class="mcc-scope-hint"><i aria-hidden="true">ⓘ</i>倍率仅对 ${escape(c.scope.replace('只对','').replace('生效','').trim())} 生效</p>`:''}
        ${c.upstream?sourceBlock(c):''}
        ${capacityBlock(c,c.pool?'资源池实时容量':'本渠道实时用量')}${c.cid===36?'':`<div class="mcc-usage"><span>本渠道用量</span><div><span>RPM <b>${c.used[0]}</b></span><span>TPM <b>${c.used[1]?fmt(c.used[1])+'万':'0'}</b></span><span>在途 <b>${c.used[2]}</b></span></div></div>`}
      </article>`;
    }).join('');
  }
  function channelCards(m){
    const n=channelsOf(m);
    if(m.id===DEMO_MODEL_ID)return `<div class="model-channels-panel"><div class="model-channel-grid">${demoChannelCards(m)}</div></div>`;
    if(!n)return `<div class="model-channels-panel"><p class="model-channels-empty">该模型暂未接入任何渠道</p></div>`;
    const cases=[
      ['在资源池','有上游','TokenCheap Claude','Anthropic','1','跟随容量池 Claude 动态额度'],
      ['在资源池','无上游','自部署 Qwen3.8 27B','OpenAI','0.01','只对当前模型生效，独立渠道'],
      ['不在资源池','有上游','TokenCheap Claude','Anthropic','1','跟随容量池 Claude 动态额度'],
      ['不在资源池','无上游','Tokencheap-DeepSeek','DeepSeek','1','独立渠道，无容量池上游']
    ];
    const resourceCards=cases.map(([col,row,name,prov,ratio,desc],idx)=>{
      const inherited = row==='有上游';
      const tag = inherited ? '<b class="resource-tag">继承</b>' : '<b class="resource-tag own">独立</b>';
      const limits = idx===1
        ? `<p class="resource-limits"><span>RPM <b>∞</b></span><span>TPM <b>766575</b></span><span>并发 <b>2</b></span></p>`
        : `<ul><li>RPM 0 / 684 · 剩 684</li><li>TPM 0 / 8485.4万 · 剩 8485.4万</li><li>在途 2 / 228 · 剩 226</li></ul>`;
      return `<article class="model-resource-card">
        <header><div><h4>#${col==='在资源池'?'32':'36'} · ${name}</h4><p>${prov} · ${col} · ${row}</p></div>${tag}</header>
        <div class="model-resource-rate"><span>倍率</span><input type="number" min="0" step="0.01" value="${ratio}" data-ratio="resource:${m.id}:${idx}" aria-label="资源模块倍率">${idx===1?'<span class="resource-scope">只对 qwen3.8-27b-office 生效</span>':''}<button type="button">收窄</button></div>
        <p class="resource-desc">${desc}</p>
        ${limits}
      </article>`;
    });

    return `<div class="model-channels-panel">
      <div class="model-channel-grid">${Array.from({length:n},(_,i)=>{
      const [cid,cname,prov]=channelPool[(m.id+i)%channelPool.length], seed=m.id*31+i*17;
      const lim=limitsOf(m,i), rpmUsed=Math.min(1+seed%90,lim.rpm), rpmCap=lim.rpm, tpmUsed=Math.min(Math.round((7.7+(seed%50)/10)*10)/10,lim.tpm), tpmCap=lim.tpm, flyUsed=Math.min(2+seed%5,lim.fly), flyCap=lim.fly;
      const ratio=ratioState.has(chKey(m,i))?ratioState.get(chKey(m,i)):1, narrowed=isNarrowed(m,i);
      return `<article class="model-channel-card${narrowed?' is-narrowed':''}">
        <header><div><h4>#${cid} · ${escape(cname)}</h4><p>${escape(prov)}</p></div>${narrowed?'<span class="model-channel-inherit is-narrowed">已收窄</span>':'<span class="model-channel-inherit">继承</span>'}</header>
        <div class="mcc-section-head"><h5>参数配置</h5><button type="button" class="model-narrow-btn${narrowed?' on':''}" data-narrow="${chKey(m,i)}" aria-haspopup="dialog">${narrowed?'编辑收窄':'收窄'}</button></div>
        <div class="mcc-ratio">
          <label class="mcc-field"><span>倍率</span><input type="number" min="0" step="0.1" value="${ratio}" data-ratio="${chKey(m,i)}" aria-label="渠道 #${cid} 倍率"></label>
          <label class="mcc-field"><span>RPM</span><input type="text" value="${rpmCap===Infinity?'∞':rpmCap}" aria-label="渠道 #${cid} RPM 上限"></label>
          <label class="mcc-field"><span>TPM</span><input type="text" value="${tpmCap===Infinity?'∞':fmt(tpmCap)}" aria-label="渠道 #${cid} TPM 上限"></label>
          <label class="mcc-field"><span>并发</span><input type="text" value="${flyCap===Infinity?'∞':flyCap}" aria-label="渠道 #${cid} 并发上限"></label>
        </div>
        <div class="mcc-source">
          <div><span>上游模型</span><b>qwen3-27b-nvfp4</b></div>
          <div><span>额度来源</span><b>${escape(prov)} 资源池动态额度</b></div>
            </div>
        ${capacityBlock({rpm:[rpmUsed,rpmCap],tpm:[tpmUsed,tpmCap],fly:[flyUsed,flyCap]})}
        <div class="mcc-usage"><span>本渠道用量</span><div><span>RPM <b>${rpmUsed}</b></span><span>TPM <b>${tpmUsed?fmt(tpmUsed)+'万':'0'}</b></span><span>在途 <b>${flyUsed}</b></span></div></div>
      </article>`;}).join('')}</div></div>`;
  }
  const mark = provider => `<span class="model-mark ${provider==='OpenAI'?'openai':provider==='Google'?'google':provider==='Anthropic'?'anthropic':''}" aria-hidden="true">${provider==='阿里巴巴'?'Q':provider==='字节跳动'?'字':Array.from(provider)[0].toUpperCase()}</span>`;
  const mFilters={status:'all',provider:'all',sync:'all'};
  const filtered=()=>models.filter(m=>m.name.toLowerCase().includes($('modelSearch').value.trim().toLowerCase())&&(mFilters.status==='all'||m.enabled===(mFilters.status==='enabled'))&&(mFilters.provider==='all'||m.provider===mFilters.provider)&&(mFilters.sync==='all'||m.official===(mFilters.sync==='official'))).sort((a,b)=>descending?b.id-a.id:a.id-b.id);
  const current=()=>filtered().slice((page-1)*Number($('modelPageSize').value),page*Number($('modelPageSize').value));
  // ===== 模型厂商页 =====
  const VENDORS=["阿里巴巴", "MiniMax", "Moonshot", "Google", "字节跳动", "DeepSeek", "Anthropic", "OpenAI"];
  const vendorDesc=new Map(), customVendors=[];
  try{const saved=JSON.parse(localStorage.getItem('maas-vendors-demo'));if(saved&&Array.isArray(saved.custom)&&saved.custom.every(x=>typeof x==='string'))customVendors.push(...saved.custom);if(saved&&saved.desc&&typeof saved.desc==='object')Object.entries(saved.desc).forEach(([k,v])=>{if(typeof v==='string')vendorDesc.set(k,v);});}catch{}
  const persistVendors=()=>{try{localStorage.setItem('maas-vendors-demo',JSON.stringify({custom:customVendors,desc:Object.fromEntries(vendorDesc)}));}catch{}};
  const vendorList=()=>[...new Set([...VENDORS,...customVendors,...models.map(m=>m.provider)])];
  // 把厂商加入「模型列表」筛选下拉与「添加模型」下拉
  function addVendorOption(name){
    for(const id of ['modelProviderFilter','newModelProvider']){const sel=$(id);if(!sel||[...sel.options].some(o=>o.value===name||o.textContent===name))continue;const o=document.createElement('option');o.textContent=name;sel.append(o);
      const menu=id==='modelProviderFilter'?sel.previousElementSibling?.querySelector?.('.filter-select-menu'):null;
      if(menu&&![...menu.children].some(c=>c.dataset.value===name)){const b=document.createElement('button');b.type='button';b.className='filter-select-option';b.setAttribute('role','option');b.dataset.value=name;b.textContent=name;b.setAttribute('aria-selected','false');menu.append(b);}}
  }
  customVendors.forEach(addVendorOption);
  function renderProviders(){
    const q=$('providerSearch').value.trim().toLowerCase();
    const list=vendorList().filter(p=>!q||p.toLowerCase().includes(q)||(vendorDesc.get(p)||'').toLowerCase().includes(q));
    $('modelProviderRows').innerHTML=list.map(p=>{const n=models.filter(m=>m.provider===p).length,desc=vendorDesc.get(p);
      return `<tr><td><span class="model-name">${mark(p)}${escape(p)}</span></td><td class="provider-desc">${desc?escape(desc):'—'}</td><td>${n?`<button type="button" class="provider-count" data-vendor-models="${escape(p)}" title="查看 ${escape(p)} 的模型">${n}</button>`:'<span class="provider-zero">0</span>'}</td><td><button type="button" class="provider-more" data-vendor-menu="${escape(p)}" aria-haspopup="menu" aria-label="${escape(p)} 的更多操作"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button></td></tr>`;}).join('');
    $('providerEmpty').hidden=list.length>0;
  }
  function render(){
    const list=filtered(), size=Number($('modelPageSize').value), pages=Math.max(1,Math.ceil(list.length/size));page=Math.min(page,pages);
    $('modelRows').innerHTML=current().map(m=>{const price=pricingOf(m);return `<tr><td><button class="model-expand" data-expand="${m.id}" aria-label="展开 ${escape(m.name)}" aria-expanded="${expanded.has(m.id)}">›</button></td><td><span class="model-name">${mark(m.provider)}${escape(m.name)}</span></td><td class="model-provider">${escape(m.provider)}</td><td><span class="model-pricing"><b>输入 ${price.input}</b><b>输出 ${price.output}</b><small>CNY / 1M Token</small></span></td><td><span class="model-status ${m.enabled?'':'off'}">${m.enabled?'已展示':'未展示'}</span></td><td>—</td><td>${m.groups.map(g=>`<span class="model-tag">${escape(g)}</span>`).join('')}</td><td class="model-channels">${channelsOf(m)}</td><td><span class="model-narrow ${narrowedOf(m)?'on':''}">${narrowedOf(m)} / ${channelsOf(m)}</span></td><td>${escape(m.date)}</td><td><div class="model-row-actions"><button data-edit="${m.id}">编辑</button><button data-price="${m.id}">定价</button><button class="model-row-more" data-menu="${m.id}" aria-haspopup="menu" aria-label="${escape(m.name)} 更多操作">•••</button></div></td></tr>${expanded.has(m.id)?`<tr class="model-detail-row"><td colspan="11">${channelCards(m)}</td></tr>`:''}`;}).join('');
    $('modelEmpty').hidden=list.length>0;$('modelTotal').textContent=`共 ${list.length} 个模型`;$('modelPageLabel').textContent=`${page} / ${pages}`;$('modelPrev').disabled=page<=1;$('modelNext').disabled=page>=pages;
    alignDetails();
    renderProviders();
  }
  // 展开行内容与「模型名称」列左对齐
  function alignDetails(){const wrap=root.querySelector('.models-table-wrap');root.querySelectorAll('.model-detail-row').forEach(row=>{const nameCell=row.previousElementSibling?.children[1],td=row.firstElementChild;if(!nameCell||!td)return;const pad=parseFloat(getComputedStyle(nameCell).paddingLeft)||0;const left=nameCell.offsetLeft+pad;td.style.setProperty('padding-left',left+'px','important');if(wrap){const avail=Math.max(420,wrap.clientWidth-left-24);td.style.setProperty('--detail-avail',avail+'px');}});}
  window.addEventListener('resize',alignDetails);
  window.renderModels=()=>{render();alignDetails();};
  for(const id of ['modelSearch','modelPageSize'])$(id).addEventListener(id==='modelSearch'?'input':'change',()=>{page=1;render();});
  const MODEL_FILTERS={
    status:[['all','全部'],['enabled','已展示'],['disabled','未展示']],
    provider:[['all','全部厂商'],...['阿里巴巴','MiniMax','Moonshot','Google','字节跳动','DeepSeek','Anthropic','OpenAI'].map(x=>[x,x])],
    sync:[['all','全部'],['official','官方同步'],['custom','自定义']]
  };
  let mfCloser=null;
  document.querySelectorAll('[data-mfilter]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    document.querySelectorAll('.filter-pop').forEach(x=>x.remove());
    if(mfCloser){document.removeEventListener('click',mfCloser,true);mfCloser=null;}
    const key=btn.dataset.mfilter;
    const pop=document.createElement('div');
    pop.className='filter-pop models-filter-pop';
    pop.innerHTML=MODEL_FILTERS[key].map(([v,label])=>`<button type="button" class="${mFilters[key]===v?'active':''}" data-v="${v}">${label}</button>`).join('');
    document.body.appendChild(pop);
    const r=btn.getBoundingClientRect();
    pop.style.top=`${r.bottom+6}px`;
    pop.style.left=`${Math.min(r.left,window.innerWidth-pop.offsetWidth-12)}px`;
    btn.setAttribute('aria-expanded','true');
    pop.addEventListener('click',ev=>{const b=ev.target.closest('[data-v]');if(!b)return;mFilters[key]=b.dataset.v;page=1;pop.remove();if(mfCloser){document.removeEventListener('click',mfCloser,true);mfCloser=null;}render();});
    const close=ev=>{if(pop.contains(ev.target))return;pop.remove();btn.setAttribute('aria-expanded','false');document.removeEventListener('click',close,true);if(mfCloser===close)mfCloser=null;};
    mfCloser=close;
    setTimeout(()=>document.addEventListener('click',close,true),0);
  }));
  $('modelPrev').onclick=()=>{page--;render();};$('modelNext').onclick=()=>{page++;render();};
  const modelMenu=document.createElement('div');modelMenu.className='provider-menu model-actions-menu';modelMenu.hidden=true;modelMenu.setAttribute('role','menu');document.body.append(modelMenu);
  let modelMenuId=null,modelMenuButton=null;
  const closeModelMenu=()=>{modelMenu.hidden=true;modelMenuId=null;modelMenuButton?.setAttribute('aria-expanded','false');modelMenuButton=null;};
  $('modelRows').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const id=Number(button.dataset.expand||button.dataset.edit||button.dataset.price||button.dataset.menu), model=models.find(m=>m.id===id);if(!model)return;if(button.dataset.expand){expanded.has(id)?expanded.delete(id):expanded.add(id);render();}else if(button.dataset.price){modelTab='pricing';openModelDialog(model);modelTab='pricing';renderModelDialog();}else if(button.dataset.menu){if(modelMenuId===id){closeModelMenu();return;}closeModelMenu();modelMenuId=id;modelMenuButton=button;button.setAttribute('aria-expanded','true');modelMenu.innerHTML=`<button type="button" role="menuitem" data-menu-action="toggle">${model.enabled?'从模型广场隐藏':'从模型广场展示'}</button><button type="button" role="menuitem" data-menu-action="delete">删除</button>`;const r=button.getBoundingClientRect();modelMenu.hidden=false;modelMenu.style.top=(r.bottom+6)+'px';modelMenu.style.left=Math.max(8,r.right-modelMenu.offsetWidth)+'px';}else openModelDialog(model);});
  modelMenu.addEventListener('click',e=>{const action=e.target.closest('[data-menu-action]')?.dataset.menuAction;if(!action)return;const model=models.find(m=>m.id===modelMenuId);closeModelMenu();if(!model)return;if(action==='toggle'){model.enabled=!model.enabled;persist();render();notice(model.enabled?'已从模型广场展示':'已从模型广场隐藏');}else{models=models.filter(m=>m.id!==model.id);expanded.delete(model.id);persist();page=1;render();notice(`已删除模型 ${model.name}`);}});
  document.addEventListener('click',e=>{if(!modelMenu.hidden&&!e.target.closest('.model-actions-menu,[data-menu]'))closeModelMenu();});
  /* ===== 创建模型弹窗：模型资料 / 能力 / 定价 / 渠道与分组 ===== */
  const MODEL_TABS=[['profile','模型资料'],['capability','能力'],['pricing','定价'],['channels','渠道与分组']];
  const MODEL_PROVIDERS=['阿里巴巴','MiniMax','Moonshot','Google','字节跳动','DeepSeek','Anthropic','OpenAI'];
  const CAP_KEYS=['context','modalities','tools','structured_output','reasoning','params','messages','streaming'];
  let modelDraft=null, modelEditingId=null, modelTab='profile', modelIconMode='inherit';

  const profileHTML=()=>{
    const d=modelDraft;
    return `<section class="mcd-section">
      <h3>基本信息</h3>
      <div class="mcd-field"><label class="req" for="mcName">模型名称</label><input id="mcName" value="${escape(d.name||'')}" placeholder="gpt-4, claude-3-opus, 等" maxlength="64" /><span class="mcd-hint">此模型的唯一标识符</span><span class="mcd-error" id="mcNameError" hidden>请填写模型名称</span></div>
      <div class="mcd-profile-meta">
        <div class="mcd-field"><label for="mcContext">上下文</label><input id="mcContext" type="number" min="0" step="1" value="${escape(d.context??'')}" placeholder="128000" /></div>
        <div class="mcd-field"><label for="mcParams">参数</label><input id="mcParams" value="${escape(d.params||'')}" placeholder="70B" /></div>
        <div class="mcd-field"><label for="mcRelease">发布日期</label><input id="mcRelease" type="date" value="${escape(d.releaseDate||'')}" /></div>
      </div>
      <div class="mcd-field"><label for="mcDesc">说明信息</label><textarea id="mcDesc" rows="3" placeholder="描述此模型...">${escape(d.desc||'')}</textarea></div>
      <h3>图标</h3>
      <div class="mcd-icon-modes">
        <button type="button" class="mcd-chip${modelIconMode==='inherit'?' on':''}" data-icon-mode="inherit">继承模型厂商图标</button>
        <button type="button" class="mcd-chip${modelIconMode==='custom'?' on':''}" data-icon-mode="custom">自定义模型图标</button>
      </div>
      <div class="mcd-icon-preview"><span class="mcd-icon-box">?</span><div><b>生效图标</b><small>${modelIconMode==='inherit'?'默认占位图标':'自定义上传图标'}</small><small>${modelIconMode==='inherit'?`继承自 ${escape(d.provider||'未指定模型厂商')}`:'当前使用自定义图标'}</small></div></div>
      ${modelIconMode==='custom'?`<button type="button" class="mcd-upload" data-icon-upload>选择本地图片</button><span class="mcd-hint" id="mcIconName">${escape(d.iconName||'未选择文件')}</span>`:''}
      <h3>模型厂商</h3>
      <div class="mcd-field"><select id="mcProvider"><option value="">选择模型厂商</option>${MODEL_PROVIDERS.map(x=>`<option value="${x}"${d.provider===x?' selected':''}>${x}</option>`).join('')}</select></div>
      <h3>标签</h3>
      <div class="mcd-tags" id="mcTags">${(d.tags||[]).map(t=>`<span class="mcd-tag">${escape(t)}<button type="button" data-tag-del="${escape(t)}" aria-label="移除标签">×</button></span>`).join('')}<input id="mcTagInput" placeholder="添加标签..." /></div>
      <span class="mcd-hint">按 Enter 或逗号添加标签</span>
      <div class="mcd-endpoint-head"><h3>端点</h3><select aria-label="加载模板"><option>加载模板...</option><option>OpenAI 兼容</option><option>Anthropic 兼容</option></select></div>
      <h3>端点配置</h3>
      <button type="button" class="mcd-json-mode">〈〉　JSON 模式</button>
      <div class="mcd-endpoint-empty">未配置端点。切换到 JSON 模式或添加行来定义端点。</div>
      <button type="button" class="mcd-endpoint-add">＋　添加行</button>
      <p class="mcd-endpoint-note">为此模型定义 API 端点（JSON 格式）</p>
    </section>`;
  };

  const capabilityHTML=()=>{
    const d=modelDraft;
    const val=d.capability||'{\n  "context": 128000,\n  "modalities": ["text"],\n  "tools": true,\n  "streaming": true\n}';
    return `<section class="mcd-section">
      <h3>硬能力声明</h3>
      <p class="mcd-desc">声明该模型能接受什么。渠道只能在此基础上收窄；可用模型名规则共享家族级基线。</p>
      <div class="mcd-json-head"><h4>能力 JSON</h4><button type="button" class="mcd-chip" id="mcCapView">${'⊞'} 可视模式</button></div>
      <div class="mcd-json">
        <div class="mcd-json-bar"><span>{ } JSON <i>1:1</i></span><div><span class="mcd-json-ok">✓ JSON</span><button type="button" data-cap="copy">复制</button><button type="button" data-cap="format">&lt;/&gt; 格式化 JSON</button></div></div>
        <textarea id="mcCapability" spellcheck="false" aria-label="能力 JSON">${escape(val)}</textarea>
      </div>
      <p class="mcd-hint">支持的维度：context、modalities、tools、structured_output、reasoning、params、messages、streaming。保存时会拒绝未知字段。</p>
    </section>`;
  };

  const PRICE_TEMPLATES={
    '固定价格':[['Flat',{in:0.3,out:0.3}],['Claude Opus 4.6',{in:0.3,out:2.5,cr:0.03}],['GPT-5.4',{in:1.25,out:10}]],
    '阶梯':[['Claude Sonnet 4.5',{in:3,out:15}],['Qwen3 Max',{in:2.4,out:9.6}],['GLM-4.5 Air',{in:0.2,out:0.8}],['Doubao Seed 1.8',{in:0.15,out:0.6}]],
    '多模态':[['GPT Image 1 Mini',{in:0.5,out:2,imgIn:0.02}],['Gemini 2.5 Flash',{in:0.3,out:2.5,imgIn:0.01}],['Gemini 3 Pro Image',{in:1.25,out:10,imgOut:0.04}],['Qwen3 Omni Flash',{in:0.1,out:0.4,audIn:0.5}]],
    'Request rule':[['Claude Opus 4.6 Fast',{in:0.6,out:5}],['GPT-5.4 Priority/Flex',{in:2.5,out:20}]],
    '含时间条件':[['Night discount (50%)',{in:0.15,out:1.25}],['Weekend discount (80%)',{in:0.24,out:2}]]
  };

  const tierCard=(idx,name='base')=>`<article class="mcd-tier" data-tier="${idx}">
    <header class="mcd-tier-head"><span class="mcd-tier-no">${idx+1}</span><div><strong>${escape(name)}</strong><p>${idx===0?'始终匹配（默认档位）。':'满足条件时匹配。'}</p><small class="mcd-tier-sum" data-tier-sum></small></div><button type="button" class="mcd-tier-toggle" data-tier-toggle aria-expanded="true">⌃</button></header>
    <div class="mcd-tier-body" data-tier-body>
      <div class="mcd-tier-row"><label class="mcd-inline-field">档位<input data-tier-name type="text" value="${escape(name)}" /></label><button type="button" class="mcd-ghost" data-tier-add>添加计费分支</button></div>
      <div class="mcd-tier-row"><label class="mcd-inline-field">计费方式<select data-tier-mode><option>按 token</option><option>按次</option><option>按图片</option></select></label><span class="mcd-unit">$ / 1M token</span></div>
      <h4 class="mcd-price-title">Token 价格</h4>
      <div class="mcd-price-grid">
        <label class="mcd-price on"><span><input type="checkbox" data-price-on="in" checked /> 输入价格</span><input type="number" min="0" step="0.01" data-price="in" value="0.3" /></label>
        <label class="mcd-price on"><span><input type="checkbox" data-price-on="out" checked /> 输出价格</span><input type="number" min="0" step="0.01" data-price="out" value="2.5" /></label>
      </div>
      <div class="mcd-price-grid four">
        <label class="mcd-price on"><span><input type="checkbox" data-price-on="cr" checked /> 缓存读取价格</span><input type="number" min="0" step="0.001" data-price="cr" value="0.03" /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="cw" /> 缓存写入价格</span><input type="number" min="0" step="0.001" data-price="cw" value="0" disabled /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="cw1h" /> 1 小时缓存写入价格</span><input type="number" min="0" step="0.001" data-price="cw1h" value="0" disabled /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="cw12h" /> 12 小时缓存写入价格</span><input type="number" min="0" step="0.001" data-price="cw12h" value="0" disabled /></label>
      </div>
      <button type="button" class="mcd-media-toggle" data-media-toggle aria-expanded="true">⌃ 媒体定价</button>
      <div class="mcd-price-grid four" data-media-body>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="imgIn" /> 图像输入价格</span><input type="number" min="0" step="0.001" data-price="imgIn" value="0" disabled /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="imgCache" /> 图片缓存输入价格</span><input type="number" min="0" step="0.001" data-price="imgCache" value="0" disabled /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="imgOut" /> 图像输出价格</span><input type="number" min="0" step="0.001" data-price="imgOut" value="0" disabled /></label>
        <label class="mcd-price on"><span><input type="checkbox" data-price-on="audIn" checked /> 音频输入价格</span><input type="number" min="0" step="0.001" data-price="audIn" value="1" /></label>
        <label class="mcd-price"><span><input type="checkbox" data-price-on="audOut" /> 音频输出价格</span><input type="number" min="0" step="0.001" data-price="audOut" value="0" disabled /></label>
      </div>
    </div>
  </article>`;

  const estimatorHTML=()=>{
    const f=(key,label)=>`<label class="mcd-est-field">${label}<input type="number" min="0" step="1" data-est="${key}" value="0" /></label>`;
    return `<section class="mcd-estimator">
      <div class="mcd-est-head"><h3>Token 估算器</h3><p>输入 token 数量以预览预估费用（不含用户组倍率）。</p></div>
      <div class="mcd-est-grid">
        ${f('in','输入 token')}${f('out','输出 token')}
        <label class="mcd-est-field wide">指定输入上下文总长度<input type="text" value="使用现有 token 总长度" /></label>
        ${f('cr','缓存读取')}${f('cw','缓存写入')}
        ${f('imgCache','图片缓存')}${f('cw1h','缓存写入（1h）')}
        ${f('cw12h','缓存写入（12h）')}${f('imgIn','图像输入')}
        ${f('imgOut','图像输出')}${f('audIn','音频输入')}
        ${f('audOut','音频输出')}
      </div>
      <div class="mcd-est-result"><span>预计成本：<strong data-est-cost>$0.00</strong></span><span class="mcd-est-badge">命中档位：base</span></div>
      <button type="button" class="mcd-ghost" data-est-sim>请求模拟</button>
    </section>`;
  };

  const pricingHTML=()=>{
    return `<section class="mcd-section">
      <div class="mcd-pricing-currency"><h3>定价货币 <span class="mcd-help">?</span></h3><select id="mcCurrency"><option>美元（USD）</option><option>人民币（CNY）</option></select></div>
      <div class="mcd-pricing-editor-head"><h3>编辑器模式</h3><small>计费表达式</small></div><div class="mcd-field mcd-editor-select"><select id="mcEditorMode"><option>可视化编辑器</option><option>原始表达式</option></select></div>
      <p class="mcd-hint">原始表达式和预设使用美元。货币选择仅换算可视化价格输入和金额预览。</p>

      <div class="mcd-tpl-head"><h3>预设模板</h3><button type="button" class="mcd-link" data-tpl-collapse>收起</button></div>
      <div class="mcd-tpl" data-tpl-body>
        ${Object.entries(PRICE_TEMPLATES).map(([group,list])=>`<div class="mcd-tpl-row"><span class="mcd-tpl-group">${group}</span>${list.map(([name,p])=>`<button type="button" class="mcd-tpl-chip" data-tpl="${escape(name)}" data-tpl-price="${escape(JSON.stringify(p))}">${escape(name)}</button>`).join('')}</div>`).join('')}
      </div>

      <div class="mcd-tiers" data-tiers>${tierCard(0,'base')}</div>

      <div class="mcd-rules">
        <h3>请求规则计费</h3>
        <p class="mcd-desc">条件满足时，最终价格乘以 X；多条命中的倍率会相乘；小于 1 的值为折扣。</p>
        <div data-rules></div>
        <button type="button" class="mcd-ghost" data-rule-add>＋ 新增规则组</button>
      </div>
    </section>${estimatorHTML()}`;
  };

  const channelsHTML=()=>{
    const d=modelDraft;
    const chosen=new Set(d.channels||[22]);
    return `<section class="mcd-section">
      <h3>关联渠道</h3>
      <p class="mcd-desc">选择可用于该模型的渠道，可多选。</p>
      <div class="mcd-pick">${channelPool.map(([cid,name,prov])=>`<label class="mcd-pick-item${chosen.has(cid)?' on':''}"><input type="checkbox" value="${cid}" data-ch-pick ${chosen.has(cid)?'checked':''} /><span><b>#${cid} · ${escape(name)}</b><small>${escape(prov)}</small></span></label>`).join('')}</div>
      <h3>启用分组</h3>
      <div class="mcd-pick inline">${['default','vip','test','maas-test'].map(g=>`<label class="mcd-pick-item${(d.groups||[]).includes(g)?' on':''}"><input type="checkbox" value="${g}" data-group-pick ${(d.groups||[]).includes(g)?'checked':''} /><span><b>${g}</b></span></label>`).join('')}</div>
      <h3>渠道倍率</h3>
      <div class="mcd-field half"><input id="mcRatio" type="number" min="0" step="0.01" value="${d.ratio??1}" /><span class="mcd-hint">默认 1.00，收窄以渠道级配置为准</span></div>
    </section>`;
  };

  function renderModelDialog(){
    const dlg=$('modelDialog');
    const body=modelTab==='capability'?capabilityHTML():modelTab==='pricing'?pricingHTML():modelTab==='channels'?channelsHTML():profileHTML();
    const saveLabel={profile:'保存资料',capability:'保存能力',pricing:'保存定价',channels:'保存渠道'}[modelTab];
    dlg.innerHTML=`<form id="modelCreateForm" novalidate>
      <header class="mcd-head"><div><h2 id="modelDialogTitle">创建模型</h2><p>管理资料、定价及渠道关联，各分区分别保存。</p></div><button type="button" class="mcd-close" data-mcd-close aria-label="关闭">×</button></header>
      <nav class="mcd-tabs" role="tablist">${MODEL_TABS.map(([id,label])=>`<button type="button" role="tab" data-mcd-tab="${id}" class="${modelTab===id?'active':''}" aria-selected="${modelTab===id}">${label}</button>`).join('')}</nav>
      <div class="mcd-body">${body}</div>
      <footer class="mcd-foot"><button type="button" class="mcd-btn ghost" data-mcd-close>关闭</button><button type="submit" class="mcd-btn primary" data-mcd-save>${saveLabel}</button></footer>
    </form>`;
    bindModelDialog();
  }

  function mcdSyncFromForm(){
    const q=id=>$('modelDialog').querySelector('#'+id);
    if(modelTab==='profile'){
      const name=q('mcName').value.trim();
      Object.assign(modelDraft,{
        name, context:q('mcContext').value?Number(q('mcContext').value):null,
        params:q('mcParams').value.trim(), releaseDate:q('mcRelease').value,
        desc:q('mcDesc').value.trim(), provider:q('mcProvider').value,
        iconMode:modelIconMode, tags:modelDraft.tags||[]
      });
      return !!name;
    }
    if(modelTab==='capability'){ modelDraft.capability=q('mcCapability').value; return true; }
    if(modelTab==='pricing'){
      const tierInputs=[...document.querySelectorAll('#modelDialog [data-tier]')].map(card=>{
      const price=k=>{const el=card.querySelector(`[data-price="${k}"]`);return el&&!el.disabled?Number(el.value||0):null;};
      return {
        name:card.querySelector('[data-tier-name]')?.value||'base',
        mode:card.querySelector('[data-tier-mode]')?.value||'按 token',
        in:price('in'),out:price('out'),cacheRead:price('cr'),cacheWrite:price('cw'),
        cacheWrite1h:price('cw1h'),cacheWrite12h:price('cw12h'),
        imageIn:price('imgIn'),imageCache:price('imgCache'),imageOut:price('imgOut'),
        audioIn:price('audIn'),audioOut:price('audOut')
      };
    });
    modelDraft.pricing={...modelDraft.pricing,currency:q('mcCurrency')?.value||'美元（USD）',editorMode:q('mcEditorMode')?.value||'可视化编辑器',tiers:tierInputs};
      return true;
    }
    const dlg=$('modelDialog');
    modelDraft.channels=[...dlg.querySelectorAll('[data-ch-pick]:checked')].map(x=>Number(x.value));
    modelDraft.groups=[...dlg.querySelectorAll('[data-group-pick]:checked')].map(x=>x.value);
    modelDraft.ratio=Number(q('mcRatio').value||1);
    return true;
  }

  function commitModel(){
    const dlg=$('modelDialog');
    if(!mcdSyncFromForm()){
      dlg.querySelector('#mcName').closest('.mcd-field').classList.add('invalid');
      dlg.querySelector('#mcNameError').hidden=false;
      dlg.querySelector('#mcName').focus();
      return false;
    }
    const dlgName=modelDraft.name;
    if(models.some(m=>m.name===dlgName&&m.id!==modelEditingId)){notice('模型名称已存在');return false;}
    if(modelEditingId===null){
      const created={...modelDraft,id:Math.max(0,...models.map(m=>m.id))+1,enabled:true,official:false,date:new Date().toLocaleDateString('sv-SE')};
      models.unshift(created);modelEditingId=created.id;modelDraft={...created};
    }else{
      const target=models.find(m=>m.id===modelEditingId);Object.assign(target,modelDraft);
    }
    persist();page=1;render();
    $('modelDialog').querySelector('h2').textContent='编辑模型';
    return true;
  }

  function bindModelDialog(){
    const dlg=$('modelDialog');
    dlg.querySelectorAll('[data-mcd-close]').forEach(b=>b.onclick=()=>dlg.close());
    dlg.querySelectorAll('[data-mcd-tab]').forEach(b=>b.onclick=()=>{modelTab=b.dataset.mcdTab;renderModelDialog();});
    dlg.querySelectorAll('[data-icon-mode]').forEach(b=>b.onclick=()=>{modelIconMode=b.dataset.iconMode;renderModelDialog();});
    const upload=dlg.querySelector('[data-icon-upload]');
    if(upload)upload.onclick=()=>{modelDraft.iconName='model-icon.png';dlg.querySelector('#mcIconName').textContent='model-icon.png';};
    dlg.querySelectorAll('[data-tag-del]').forEach(b=>b.onclick=()=>{modelDraft.tags=(modelDraft.tags||[]).filter(t=>t!==b.dataset.tagDel);renderModelDialog();});
    const tagInput=dlg.querySelector('#mcTagInput');
    if(tagInput)tagInput.onkeydown=e=>{
      if(e.key!=='Enter'&&e.key!==',')return;
      e.preventDefault();const v=tagInput.value.trim();if(!v)return;
      modelDraft.tags=[...new Set([...(modelDraft.tags||[]),v])];renderModelDialog();
      const again=$('modelDialog').querySelector('#mcTagInput');again&&again.focus();
    };
    const capBtn=dlg.querySelector('#mcCapView');
    if(capBtn)capBtn.onclick=()=>{
      const ta=dlg.querySelector('#mcCapability');
      try{const parsed=JSON.parse(ta.value);ta.value=JSON.stringify(parsed,null,2);notice('已切换为格式化视图');}
      catch{notice('JSON 格式有误，无法格式化');}
    };
    dlg.querySelectorAll('[data-cap]').forEach(b=>b.onclick=()=>{
      const ta=dlg.querySelector('#mcCapability');
      if(b.dataset.cap==='copy'){navigator.clipboard?.writeText(ta.value).then(()=>notice('能力 JSON 已复制')).catch(()=>notice('复制失败'));}
      else{try{ta.value=JSON.stringify(JSON.parse(ta.value),null,2);}catch{notice('JSON 格式有误');}}
    });
    dlg.querySelectorAll('[data-ch-pick],[data-group-pick]').forEach(cb=>cb.onchange=()=>cb.closest('.mcd-pick-item').classList.toggle('on',cb.checked));

    // 定价：档位折叠 / 价格开关 / 媒体定价 / 模板 / 规则 / 估算器
    const priceOf=(card,key)=>{const el=card.querySelector(`[data-price="${key}"]`);return el&&!el.disabled?Number(el.value||0):0;};
    const updateTierSummary=card=>{
      const p=key=>{const v=priceOf(card,key);return v==null?'':v;};
      const parts=[['输入',p('in')],['输出',p('out')],['缓存读取',p('cr')],['音频输入',p('audIn')]].filter(([,v])=>v!==''&&v!==0);
      const sum=card.querySelector('[data-tier-sum]');
      if(sum)sum.textContent=parts.map(([k,v])=>`${k}: $${v}`).join('  ')||'尚未设置价格';
    };
    const recalcEstimate=()=>{
      const tier=dlg.querySelector('[data-tier]');if(!tier)return;
      const val=k=>Number(dlg.querySelector(`[data-est="${k}"]`)?.value||0);
      const per=k=>priceOf(tier,k)/1e6;
      const cost=val('in')*per('in')+val('out')*per('out')+val('cr')*per('cr')+val('cw')*per('cw')
        +val('cw1h')*per('cw1h')+val('cw12h')*per('cw12h')
        +val('imgIn')*priceOf(tier,'imgIn')+val('imgCache')*priceOf(tier,'imgCache')+val('imgOut')*priceOf(tier,'imgOut')
        +val('audIn')*priceOf(tier,'audIn')+val('audOut')*priceOf(tier,'audOut');
      const out=dlg.querySelector('[data-est-cost]');
      const symbol=(dlg.querySelector('#mcCurrency')?.value||'').includes('CNY')?'¥':'$';
      if(out)out.textContent=symbol+cost.toFixed(2);
    };
    dlg.querySelectorAll('[data-tier]').forEach(card=>updateTierSummary(card));
    recalcEstimate();

    const mcdForm=dlg.querySelector('#modelCreateForm');
    mcdForm?.addEventListener('click',e=>{
      const t=e.target;
      if(t.closest('[data-tier-toggle]')){
        const card=t.closest('[data-tier]'),body=card.querySelector('[data-tier-body]');
        const open=body.hidden;body.hidden=!open;t.closest('[data-tier-toggle]').textContent=open?'⌃':'⌄';
        t.closest('[data-tier-toggle]').setAttribute('aria-expanded',String(open));return;
      }
      if(t.closest('[data-media-toggle]')){
        const body=t.closest('[data-tier]').querySelector('[data-media-body]'),open=body.hidden;
        body.hidden=!open;t.closest('[data-media-toggle]').textContent=(open?'⌃':'⌄')+' 媒体定价';
        t.closest('[data-media-toggle]').setAttribute('aria-expanded',String(open));return;
      }
      if(t.closest('[data-tpl-collapse]')){
        const body=dlg.querySelector('[data-tpl-body]'),open=body.hidden;
        body.hidden=!open;t.closest('[data-tpl-collapse]').textContent=open?'收起':'展开';return;
      }
      if(t.closest('[data-tpl]')){
        const btn=t.closest('[data-tpl]');
        let price={};try{price=JSON.parse(btn.dataset.tplPrice);}catch{}
        const card=dlg.querySelector('[data-tier]');
        Object.entries(price).forEach(([k,v])=>{
          const on=card.querySelector(`[data-price-on="${k}"]`),input=card.querySelector(`[data-price="${k}"]`);
          if(!input)return;
          input.disabled=false;if(on)on.checked=true;
          input.value=v;input.closest('.mcd-price')?.classList.add('on');
        });
        updateTierSummary(card);recalcEstimate();notice(`已载入预设模板 ${btn.dataset.tpl}`);return;
      }
      if(t.closest('[data-tier-add]')){
        const list=dlg.querySelector('[data-tiers]');
        const idx=list.querySelectorAll('[data-tier]').length;
        if(idx>=4){notice('最多支持 4 个计费档位');return;}
        list.insertAdjacentHTML('beforeend',tierCard(idx,'tier-'+(idx+1)));
        const card=list.lastElementChild;updateTierSummary(card);return;
      }
      if(t.closest('[data-rule-add]')){
        const wrap=dlg.querySelector('[data-rules]');
        const n=wrap.querySelectorAll('.mcd-rule').length+1;
        wrap.insertAdjacentHTML('beforeend',`<div class="mcd-rule"><span class="mcd-rule-no">${n}</span><input type="text" placeholder="例如 request.metadata.priority == 'high'" /><label>倍率<input type="number" min="0" step="0.05" value="1" /></label><button type="button" class="mcd-link" data-rule-del>删除</button></div>`);
        return;
      }
      if(t.closest('[data-rule-del]')){t.closest('.mcd-rule').remove();return;}
      if(t.closest('[data-est-sim]')){recalcEstimate();notice('已按当前价格模拟请求费用');return;}
    });
    mcdForm?.addEventListener('change',e=>{
      const on=e.target.closest('[data-price-on]');
      if(on){
        const card=on.closest('[data-tier]'),key=on.dataset.priceOn;
        const input=card.querySelector(`[data-price="${key}"]`);
        input.disabled=!on.checked;on.closest('.mcd-price').classList.toggle('on',on.checked);
        updateTierSummary(card);recalcEstimate();return;
      }
      if(e.target.matches('[data-price]')){updateTierSummary(e.target.closest('[data-tier]'));recalcEstimate();return;}
      if(e.target.matches('[data-est]')){recalcEstimate();return;}
      if(e.target.id==='mcCurrency'){recalcEstimate();return;}
    });
    mcdForm?.addEventListener('input',e=>{
      if(e.target.matches('[data-est]')){recalcEstimate();return;}
      if(e.target.matches('[data-price]')){updateTierSummary(e.target.closest('[data-tier]'));recalcEstimate();}
    });
    dlg.querySelector('#modelCreateForm').onsubmit=e=>{
      e.preventDefault();
      if(commitModel())notice({profile:'模型资料已保存',capability:'能力声明已保存',pricing:'定价已保存',channels:'渠道与分组已保存'}[modelTab]);
    };
  }

  function openModelDialog(model){
    modelEditingId=model?model.id:null;
    modelTab='profile';
    modelIconMode=model?.iconMode||'inherit';
    modelDraft=model?{...model,groups:[...model.groups],tags:[...(model.tags||[]) ]}:{name:'',groups:['default'],tags:[],channels:[22],pricing:{bill:'按量计费'},capability:''};
    renderModelDialog();
    const dlg=$('modelDialog');
    dlg.querySelector('h2').textContent=model?'编辑模型':'创建模型';
    if(!dlg.open)dlg.showModal();
  }

  // 收窄编辑弹窗：设置本渠道的 RPM / TPM / 在途上限，已收窄时可取消收窄
  const narrowDialog=document.createElement('dialog');narrowDialog.className='channel-dialog model-narrow-dialog';
  narrowDialog.innerHTML=`<form method="dialog" id="modelNarrowForm"><div class="modal-head"><div><h2 id="modelNarrowTitle">收窄渠道</h2><p id="modelNarrowSub"></p></div><button type="button" class="close" id="modelNarrowClose" aria-label="关闭">×</button></div><div class="form-grid"><div class="form-field"><label for="narrowRpm">RPM 上限</label><input id="narrowRpm" type="number" min="1" step="1" required /></div><div class="form-field"><label for="narrowTpm">TPM 上限（万）</label><input id="narrowTpm" type="number" min="0.1" step="0.1" required /></div><div class="form-field"><label for="narrowFly">在途上限</label><input id="narrowFly" type="number" min="1" step="1" required /></div></div><p class="model-narrow-hint" id="modelNarrowHint"></p><div class="modal-foot"><button type="button" class="btn-light model-narrow-release" id="modelNarrowRelease">取消收窄</button><button type="button" class="btn-light" id="modelNarrowCancel">关闭</button><button type="submit" class="btn-dark">保存收窄</button></div></form>`;
  document.body.append(narrowDialog);
  let narrowKey=null;
  const nq=sel=>narrowDialog.querySelector(sel);
  function openNarrow(key){
    const [id,i]=key.split(':').map(Number),m=models.find(x=>x.id===id);if(!m)return;
    narrowKey=key;const demo=demoChannels[i];const [cid,cname]=demo?[demo.cid,demo.name]:channelPool[(m.id+i)%channelPool.length],lim=limitsOf(m,i),on=isNarrowed(m,i);
    nq('#modelNarrowTitle').textContent=on?'编辑收窄':'收窄渠道';nq('#modelNarrowSub').textContent=`#${cid} · ${cname}`;
    nq('#narrowRpm').value=lim.rpm;nq('#narrowTpm').value=lim.tpm;nq('#narrowFly').value=lim.fly;
    nq('#modelNarrowHint').textContent=`默认上限：RPM ${DEFAULT_LIMITS.rpm} · TPM ${fmt(DEFAULT_LIMITS.tpm)}万 · 在途 ${DEFAULT_LIMITS.fly}。上限不能高于默认值。`;
    nq('#modelNarrowRelease').hidden=!on;nq('.btn-dark').textContent=on?'保存修改':'确认收窄';
    narrowDialog.showModal();
  }
  function closeNarrow(){narrowDialog.close();const key=narrowKey;narrowKey=null;render();if(key)$('modelRows').querySelector(`[data-narrow="${key}"]`)?.focus();}
  nq('#modelNarrowClose').onclick=nq('#modelNarrowCancel').onclick=closeNarrow;
  nq('#modelNarrowRelease').onclick=()=>{limitState.delete(narrowKey);narrowState.set(narrowKey,false);notice('已取消收窄');closeNarrow();};
  nq('#modelNarrowForm').onsubmit=e=>{
    e.preventDefault();const rpm=Number(nq('#narrowRpm').value),tpm=Number(nq('#narrowTpm').value),fly=Number(nq('#narrowFly').value);
    if(![rpm,tpm,fly].every(v=>Number.isFinite(v)&&v>0)||rpm>DEFAULT_LIMITS.rpm||tpm>DEFAULT_LIMITS.tpm||fly>DEFAULT_LIMITS.fly){nq('#modelNarrowHint').textContent='请输入大于 0 且不超过默认上限的数值。';return;}
    limitState.set(narrowKey,{rpm,tpm,fly});narrowState.set(narrowKey,true);notice('收窄已保存');closeNarrow();
  };
  $('modelRows').addEventListener('click',e=>{
    const narrow=e.target.closest('[data-narrow]');
    if(narrow){openNarrow(narrow.dataset.narrow);return;}
    if(e.target.closest('[data-pool]'))notice('演示数据：资源池页暂未接入');
  });
  $('modelRows').addEventListener('change',e=>{
    const ratio=e.target.closest('[data-ratio]');
    if(ratio){const v=Number(ratio.value);if(!Number.isFinite(v)||v<0){ratio.value=ratioState.get(ratio.dataset.ratio)??1;return;}ratioState.set(ratio.dataset.ratio,v);render();return;}
    const pill=e.target.closest('[data-pill]');
    if(pill){pillState.set(pill.dataset.pill,pill.value.trim()||'∞');}
  });
  $('modelConfirm').onclick=()=>{page=1;render();notice('筛选已应用');};
  $('providerSearch').addEventListener('input',renderProviders);
  // 跳转到模型列表并按厂商筛选
  function showVendorModels(p){
    $('modelTabList').click();
    const sel=$('modelProviderFilter');sel.value=p;
    const wrap=sel.previousElementSibling;
    const opt=wrap&&wrap.querySelector?.(`.filter-select-option[data-value="${CSS.escape(p)}"]`);
    if(opt)opt.click();else{sel.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  // 行操作菜单
  const vMenu=document.createElement('div');vMenu.className='provider-menu';vMenu.hidden=true;vMenu.setAttribute('role','menu');
  vMenu.innerHTML='<button type="button" role="menuitem" data-act="edit">编辑</button><button type="button" role="menuitem" data-act="delete">删除</button>';
  document.body.append(vMenu);
  let vMenuFor=null,vMenuBtn=null;
  const closeVMenu=()=>{vMenu.hidden=true;vMenuFor=null;if(vMenuBtn){vMenuBtn.setAttribute('aria-expanded','false');vMenuBtn=null;}};
  const descDialog=$('providerDescDialog'),addDialog=$('providerAddDialog');
  function deleteVendor(p){
    const customIndex=customVendors.indexOf(p);
    if(customIndex<0){notice('系统模型厂商不可删除');return;}
    if(models.some(m=>m.provider===p)){notice('该厂商仍有关联模型，无法删除');return;}
    customVendors.splice(customIndex,1);vendorDesc.delete(p);persistVendors();
    for(const id of ['modelProviderFilter','newModelProvider']){
      const sel=$(id);sel?.querySelector(`option[value="${CSS.escape(p)}"]`)?.remove();
      sel?.previousElementSibling?.querySelector?.(`.filter-select-option[data-value="${CSS.escape(p)}"]`)?.remove();
    }
    renderProviders();notice(`已删除模型厂商 ${p}`);
  }
  vMenu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=vMenuFor;closeVMenu();if(b.dataset.act==='delete'){deleteVendor(p);return;}$('providerDescSub').textContent=p;$('providerDescInput').value=vendorDesc.get(p)||'';descDialog.dataset.vendor=p;descDialog.showModal();$('providerDescInput').focus();});
  document.addEventListener('click',e=>{if(!vMenu.hidden&&!e.target.closest('.provider-menu,[data-vendor-menu]'))closeVMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!vMenu.hidden){const b=vMenuBtn;closeVMenu();b?.focus();}});
  window.addEventListener('resize',closeVMenu);window.addEventListener('scroll',closeVMenu,true);
  $('modelProviderRows').addEventListener('click',e=>{
    const count=e.target.closest('[data-vendor-models]');if(count){showVendorModels(count.dataset.vendorModels);return;}
    const more=e.target.closest('[data-vendor-menu]');if(!more)return;
    if(vMenuBtn===more){closeVMenu();return;}
    closeVMenu();vMenuFor=more.dataset.vendorMenu;vMenuBtn=more;more.setAttribute('aria-expanded','true');
    const r=more.getBoundingClientRect();vMenu.hidden=false;vMenu.style.top=(r.bottom+6)+'px';vMenu.style.left=Math.max(8,r.right-vMenu.offsetWidth)+'px';
  });
  $('providerDescClose').onclick=$('providerDescCancel').onclick=()=>descDialog.close();
  $('providerDescForm').onsubmit=e=>{e.preventDefault();const p=descDialog.dataset.vendor,v=$('providerDescInput').value.trim();v?vendorDesc.set(p,v):vendorDesc.delete(p);persistVendors();descDialog.close();renderProviders();notice('说明信息已保存');};
  // 添加模型厂商
  $('providerAddClose').onclick=$('providerAddCancel').onclick=()=>addDialog.close();
  function openAddVendor(){$('providerAddForm').reset();$('providerAddError').hidden=true;$('providerAddNameError').hidden=true;$('providerAddIconPreview').textContent='?';addDialog.showModal();$('providerAddName').focus();}
  $('providerAddIcon').addEventListener('input',e=>{$('providerAddIconPreview').textContent=(e.target.value.trim()||'?').slice(0,2);});
  $('providerAddForm').onsubmit=e=>{
    e.preventDefault();const name=$('providerAddName').value.trim(),desc=$('providerAddDesc').value.trim();
    if(!name){$('providerAddNameError').hidden=false;$('providerAddName').focus();return;}
    if(vendorList().some(v=>v.toLowerCase()===name.toLowerCase())){$('providerAddError').textContent='该模型厂商已存在。';$('providerAddError').hidden=false;return;}
    customVendors.push(name);if(desc)vendorDesc.set(name,desc);persistVendors();addVendorOption(name);
    addDialog.close();$('providerSearch').value='';renderProviders();notice(`已添加模型厂商 ${name}`);
  };
  const providersActive=()=>!$('modelProvidersPanel').hidden;
  $('modelAdd').onclick=()=>providersActive()?openAddVendor():openModelDialog(null);
  const tabs=[['modelTabList','modelListPanel'],['modelTabProviders','modelProvidersPanel']];
  const modelAddWrap=$('modelAdd').parentElement,modelAddHome=modelAddWrap.parentElement,providerToolbar=document.querySelector('#modelProvidersPanel .provider-toolbar');
  tabs.forEach(([tab])=>{$(tab).onclick=()=>{tabs.forEach(([t,p])=>{$(t).classList.toggle('active',t===tab);$(t).setAttribute('aria-selected',String(t===tab));$(p).hidden=t!==tab;});const providersActive=tab==='modelTabProviders';$('modelAddLabel').textContent=providersActive?'添加模型厂商':'添加模型';if(providersActive)providerToolbar?.append(modelAddWrap);else modelAddHome.append(modelAddWrap);render();};});
  render();
})();
