(() => {
  const root = document.querySelector('#userPermissionsPage');
  if (!root) return;
  root.innerHTML = `<div class="title-row users-title"><div><h1>权限设置</h1><p>配置不同角色可使用的功能 <span class="channel-demo-label">演示数据</span></p></div></div>`;
  window.renderUserPermissions = () => {};
})();
