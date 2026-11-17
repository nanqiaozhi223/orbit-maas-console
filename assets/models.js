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
  let page=1, descending=true, editing=null, compact=false;
  const expanded=new Set();
  const persist=()=>{try{localStorage.setItem('maas-models-demo',JSON.stringify(models));}catch{}};
  function notice(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);}
  // 演示数据：服务渠道数与已收窄渠道数按模型 ID 推算
  const channelsOf=m=>m.id%7===0?0:(m.id%3===0?2:1);
  const channelPool=[[32,'TokenCheap Claude','Anthropic'],[25,'aliyun-anhui zhuoniu','Alibaba'],[22,'gpt_kiro','OpenAI'],[23,'gpt_codex','OpenAI'],[20,'grok','xAI'],[17,'apipro_chatgpt','OpenAI']];
  const narrowState=new Map(), ratioState=new Map(), limitState=new Map();
  const DEFAULT_LIMITS={rpm:702,tpm:8708.7,fly:234};
  const limitsOf=(m,i)=>limitState.get(chKey(m,i))||DEFAULT_LIMITS;
  const chKey=(m,i)=>m.id+':'+i;
  const isNarrowed=(m,i)=>narrowState.has(chKey(m,i))?narrowState.get(chKey(m,i)):(channelsOf(m)>1&&i===0);
  const narrowedOf=m=>Array.from({length:channelsOf(m)},(_,i)=>i).filter(i=>isNarrowed(m,i)).length;
  const fmt=n=>n.toLocaleString('zh-CN',{maximumFractionDigits:1});
  function channelCards(m){
    const n=channelsOf(m);
    if(!n)return `<div class="model-channels-panel"><p class="model-channels-empty">该模型暂未接入任何渠道</p></div>`;
    return `<div class="model-channels-panel"><div class="model-channel-grid">${Array.from({length:n},(_,i)=>{
      const [cid,cname,prov]=channelPool[(m.id+i)%channelPool.length], seed=m.id*31+i*17;
      const lim=limitsOf(m,i), rpmUsed=Math.min(1+seed%90,lim.rpm), rpmCap=lim.rpm, tpmUsed=Math.min(Math.round((7.7+(seed%50)/10)*10)/10,lim.tpm), tpmCap=lim.tpm, flyUsed=Math.min(2+seed%5,lim.fly), flyCap=lim.fly;
      const ratio=ratioState.has(chKey(m,i))?ratioState.get(chKey(m,i)):1, narrowed=isNarrowed(m,i);
      return `<article class="model-channel-card${narrowed?' is-narrowed':''}">
        <header><div><h4>#${cid} · ${escape(cname)}</h4><p>${escape(prov)}</p></div>${narrowed?'<span class="model-channel-inherit is-narrowed">已收窄</span>':''}</header>
        <div class="model-channel-ctrl"><label>倍率<input type="number" min="0" step="0.1" value="${ratio}" data-ratio="${chKey(m,i)}" aria-label="渠道 #${cid} 倍率"></label><button type="button" class="model-narrow-btn${narrowed?' on':''}" data-narrow="${chKey(m,i)}" aria-haspopup="dialog">${narrowed?'编辑收窄':'收窄'}</button></div>
        <p class="model-channel-pool">跟随容量池 ${escape(prov)} 动态额度 本渠道：RPM 0，在途 0 <button type="button" class="model-channel-link" data-pool>在资源池页管理</button></p>
        <ul class="model-channel-stats"><li>RPM ${rpmUsed} / ${rpmCap} · 剩 ${rpmCap-rpmUsed}</li><li>TPM ${fmt(tpmUsed)}万 / ${fmt(tpmCap)}万 · 剩 ${fmt(Math.round((tpmCap-tpmUsed)*10)/10)}万</li><li>在途 ${flyUsed} / ${flyCap} · 剩 ${flyCap-flyUsed}</li></ul>
      </article>`;}).join('')}</div></div>`;
  }
  const mark = provider => `<span class="model-mark ${provider==='OpenAI'?'openai':provider==='Google'?'google':provider==='Anthropic'?'anthropic':''}" aria-hidden="true">${provider==='阿里巴巴'?'Q':provider==='字节跳动'?'字':Array.from(provider)[0].toUpperCase()}</span>`;
  const filtered=()=>models.filter(m=>m.name.toLowerCase().includes($('modelSearch').value.trim().toLowerCase())&&($('modelStatusFilter').value==='all'||m.enabled===($('modelStatusFilter').value==='enabled'))&&($('modelProviderFilter').value==='all'||m.provider===$('modelProviderFilter').value)&&($('modelSyncFilter').value==='all'||m.official===($('modelSyncFilter').value==='official'))).sort((a,b)=>descending?b.id-a.id:a.id-b.id);
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
    $('modelRows').innerHTML=current().map(m=>`<tr><td><button class="model-expand" data-expand="${m.id}" aria-label="展开 ${escape(m.name)}" aria-expanded="${expanded.has(m.id)}">›</button></td><td><span class="model-name">${mark(m.provider)}${escape(m.name)}</span></td><td class="model-provider">${escape(m.provider)}</td><td><span class="model-status ${m.enabled?'':'off'}">${m.enabled?'已展示':'未展示'}</span></td><td>—</td><td>${m.groups.map(g=>`<span class="model-tag">${escape(g)}</span>`).join('')}</td><td class="model-channels">${channelsOf(m)}</td><td><span class="model-narrow ${narrowedOf(m)?'on':''}">${narrowedOf(m)} / ${channelsOf(m)}</span></td><td>${escape(m.date)}</td><td><div class="model-row-actions"><button data-edit="${m.id}">编辑</button><button data-toggle="${m.id}">${m.enabled?'隐藏':'展示'}</button></div></td></tr>${expanded.has(m.id)?`<tr class="model-detail-row"><td colspan="10">${channelCards(m)}</td></tr>`:''}`).join('');
    $('modelEmpty').hidden=list.length>0;$('modelTotal').textContent=`共 ${list.length} 个模型`;$('modelPageLabel').textContent=`${page} / ${pages}`;$('modelPrev').disabled=page<=1;$('modelNext').disabled=page>=pages;
    root.querySelectorAll('.models-table tr').forEach(row=>[4,8].forEach(index=>{if(row.children.length===10)row.children[index].hidden=compact;}));
    alignDetails();
    renderProviders();
  }
  // 展开行内容与「模型名称」列左对齐
  function alignDetails(){root.querySelectorAll('.model-detail-row').forEach(row=>{const nameCell=row.previousElementSibling?.children[1],td=row.firstElementChild;if(!nameCell||!td)return;const pad=parseFloat(getComputedStyle(nameCell).paddingLeft)||0;td.style.setProperty('padding-left',(nameCell.offsetLeft+pad)+'px','important');});}
  window.addEventListener('resize',alignDetails);
  window.renderModels=()=>{render();alignDetails();};
  for(const id of ['modelSearch','modelStatusFilter','modelProviderFilter','modelSyncFilter','modelPageSize'])$(id).addEventListener(id==='modelSearch'?'input':'change',()=>{page=1;render();});
  $('modelPrev').onclick=()=>{page--;render();};$('modelNext').onclick=()=>{page++;render();};
  $('modelRows').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const id=Number(button.dataset.expand||button.dataset.edit||button.dataset.toggle), model=models.find(m=>m.id===id);if(!model)return;if(button.dataset.expand){expanded.has(id)?expanded.delete(id):expanded.add(id);render();}else if(button.dataset.toggle){model.enabled=!model.enabled;persist();render();}else open(model);});
  function open(model){editing=model?.id??null;$('modelForm').reset();$('modelDialog').querySelector('h2').textContent=model?'编辑模型':'添加模型';$('modelDialog').querySelector('[type=submit]').textContent=model?'保存修改':'添加模型';if(model){$('newModelName').value=model.name;$('newModelProvider').value=model.provider;$('newModelEndpoint').value=model.endpoint;$('newModelGroup').value=model.groups.join(', ');}$('modelDialog').showModal();}
  for(const id of ['modelDialogClose','modelDialogCancel'])$(id).onclick=()=>$('modelDialog').close();
  // 收窄编辑弹窗：设置本渠道的 RPM / TPM / 在途上限，已收窄时可取消收窄
  const narrowDialog=document.createElement('dialog');narrowDialog.className='channel-dialog model-narrow-dialog';
  narrowDialog.innerHTML=`<form method="dialog" id="modelNarrowForm"><div class="modal-head"><div><h2 id="modelNarrowTitle">收窄渠道</h2><p id="modelNarrowSub"></p></div><button type="button" class="close" id="modelNarrowClose" aria-label="关闭">×</button></div><div class="form-grid"><div class="form-field"><label for="narrowRpm">RPM 上限</label><input id="narrowRpm" type="number" min="1" step="1" required /></div><div class="form-field"><label for="narrowTpm">TPM 上限（万）</label><input id="narrowTpm" type="number" min="0.1" step="0.1" required /></div><div class="form-field"><label for="narrowFly">在途上限</label><input id="narrowFly" type="number" min="1" step="1" required /></div></div><p class="model-narrow-hint" id="modelNarrowHint"></p><div class="modal-foot"><button type="button" class="btn-light model-narrow-release" id="modelNarrowRelease">取消收窄</button><button type="button" class="btn-light" id="modelNarrowCancel">关闭</button><button type="submit" class="btn-dark">保存收窄</button></div></form>`;
  document.body.append(narrowDialog);
  let narrowKey=null;
  const nq=sel=>narrowDialog.querySelector(sel);
  function openNarrow(key){
    const [id,i]=key.split(':').map(Number),m=models.find(x=>x.id===id);if(!m)return;
    narrowKey=key;const [cid,cname]=channelPool[(m.id+i)%channelPool.length],lim=limitsOf(m,i),on=isNarrowed(m,i);
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
  $('modelRows').addEventListener('change',e=>{const input=e.target.closest('[data-ratio]');if(!input)return;const v=Number(input.value);if(!Number.isFinite(v)||v<0){input.value=ratioState.get(input.dataset.ratio)??1;return;}ratioState.set(input.dataset.ratio,v);render();});
  $('modelForm').onsubmit=e=>{e.preventDefault();const name=$('newModelName').value.trim(),endpoint=$('newModelEndpoint').value.trim();if(!name||!endpoint)return;if(models.some(m=>m.name===name&&m.id!==editing)){notice('模型名称已存在');return;}const values={name,endpoint,provider:$('newModelProvider').value,groups:$('newModelGroup').value.split(/[,，]/).map(x=>x.trim()).filter(Boolean)};if(!values.groups.length)values.groups=['default'];if(editing!==null)Object.assign(models.find(m=>m.id===editing),values);else models.push({...values,id:Math.max(0,...models.map(m=>m.id))+1,enabled:true,official:false,date:new Date().toLocaleDateString('sv-SE')});persist();$('modelDialog').close();page=1;render();notice(editing!==null?'模型配置已保存':'模型已添加');};
  $('modelColumns').onclick=()=>{compact=!compact;$('modelColumns').querySelector('span').textContent=compact?'全部字段':'字段';$('modelColumns').setAttribute('aria-pressed',String(compact));render();};
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
  vMenu.innerHTML='<button type="button" role="menuitem" data-act="models">查看关联模型</button><button type="button" role="menuitem" data-act="desc">编辑说明信息</button>';
  document.body.append(vMenu);
  let vMenuFor=null,vMenuBtn=null;
  const closeVMenu=()=>{vMenu.hidden=true;vMenuFor=null;if(vMenuBtn){vMenuBtn.setAttribute('aria-expanded','false');vMenuBtn=null;}};
  const descDialog=$('providerDescDialog'),addDialog=$('providerAddDialog');
  vMenu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=vMenuFor;closeVMenu();if(b.dataset.act==='models')showVendorModels(p);else{$('providerDescSub').textContent=p;$('providerDescInput').value=vendorDesc.get(p)||'';descDialog.dataset.vendor=p;descDialog.showModal();$('providerDescInput').focus();}});
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
  function openAddVendor(){$('providerAddForm').reset();$('providerAddError').hidden=true;addDialog.showModal();$('providerAddName').focus();}
  $('providerAddForm').onsubmit=e=>{
    e.preventDefault();const name=$('providerAddName').value.trim(),desc=$('providerAddDesc').value.trim();
    if(!name)return;
    if(vendorList().some(v=>v.toLowerCase()===name.toLowerCase())){$('providerAddError').textContent='该模型厂商已存在。';$('providerAddError').hidden=false;return;}
    customVendors.push(name);if(desc)vendorDesc.set(name,desc);persistVendors();addVendorOption(name);
    addDialog.close();$('providerSearch').value='';renderProviders();notice(`已添加模型厂商 ${name}`);
  };
  const providersActive=()=>!$('modelProvidersPanel').hidden;
  $('modelAdd').onclick=()=>providersActive()?openAddVendor():open();
  const tabs=[['modelTabList','modelListPanel'],['modelTabProviders','modelProvidersPanel']];
  tabs.forEach(([tab])=>{$(tab).onclick=()=>{tabs.forEach(([t,p])=>{$(t).classList.toggle('active',t===tab);$(t).setAttribute('aria-selected',String(t===tab));$(p).hidden=t!==tab;});$('modelAddLabel').textContent=tab==='modelTabProviders'?'添加模型厂商':'添加模型';render();};});
  render();
})();
