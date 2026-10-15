export function renderMenuAdminScript(): string {
  return `
    let adminMenus = {};
    let activeAdminMenu = 'header';
    const menuLabels = {header:'Menú principal',footer:'Pie de página'};
    const menuDescriptions = {header:'Enlaces y grupos del encabezado de la tienda.',footer:'Enlaces y páginas agrupados en el pie de página.'};
    async function loadAdminMenus() {
      const root = document.getElementById('menu-items');
      if (!root) return;
      root.innerHTML = '<p class="menu-loading">Cargando menús…</p>';
      try {
        const response = await fetch('/api/v1/admin/cms/menus');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los menús');
        adminMenus = Object.fromEntries(result.data.map(menu => [menu.code, menu]));
        showAdminMenu(activeAdminMenu);
      } catch (error) {
        root.innerHTML = '<p class="menu-empty">' + escapeHtml(error.message || 'No se pudieron cargar los menús') + '</p>';
      }
    }
    function selectAdminMenu(code, button) {
      activeAdminMenu = code;
      document.querySelectorAll('.menu-tabs button').forEach(tab => tab.classList.toggle('active', tab === button));
      showAdminMenu(code);
    }
    function showAdminMenu(code) {
      const menu = adminMenus[code];
      if (!menu) return;
      document.getElementById('menu-heading').textContent = menuLabels[code];
      document.getElementById('menu-description').textContent = menuDescriptions[code];
      document.getElementById('menu-title').value = menu.title || menuLabels[code];
      renderAdminMenuItems();
      setMenuMessage('');
    }
    function renderAdminMenuItems() {
      const root = document.getElementById('menu-items');
      const items = adminMenus[activeAdminMenu]?.items || [];
      root.innerHTML = items.length ? items.map((item,index) => renderAdminMenuItem(item,0,index,items.length)).join('') : '<p class="menu-empty">Este menú aún no tiene enlaces. Añade un enlace o un grupo.</p>';
    }
    function renderAdminMenuItem(item, depth, index, total) {
      const isGroup = item.type === 'group';
      const id = escapeHtml(item.id);
      const title = escapeHtml(item.title || '');
      const url = escapeHtml(item.url || '');
      const target = item.target === '_blank' ? '_blank' : '_self';
      const children = item.children || [];
      const actions = '<div class="menu-row-actions">' +
        (index ? '<button type="button" aria-label="Subir" onclick="moveAdminMenuItem(\\''+id+'\\',-1)">↑</button>' : '') +
        (index < total-1 ? '<button type="button" aria-label="Bajar" onclick="moveAdminMenuItem(\\''+id+'\\',1)">↓</button>' : '') +
        (isGroup && depth < 2 ? '<button type="button" onclick="addAdminMenuChild(\\''+id+'\\',\\'link\\')">+ Enlace</button><button type="button" onclick="addAdminMenuChild(\\''+id+'\\',\\'group\\')">+ Grupo</button>' : '') +
        '<button type="button" class="menu-remove" onclick="removeAdminMenuItem(\\''+id+'\\')">Eliminar</button></div>';
      const row = '<article class="menu-item-row" data-depth="'+depth+'" data-menu-id="'+id+'">' +
        '<label>Nombre<input data-menu-field="title" maxlength="80" value="'+title+'" required></label>' +
        '<label>Tipo<select data-menu-field="type"><option value="link" '+(!isGroup?'selected':'')+'>Enlace</option><option value="group" '+(isGroup?'selected':'')+'>Grupo</option></select></label>' +
        '<label '+(isGroup?'hidden':'')+'>URL<input data-menu-field="url" maxlength="500" value="'+url+'" placeholder="/productos o https://…" '+(isGroup?'disabled':'')+'></label>' +
        '<label '+(isGroup?'hidden':'')+'>Abrir en<select data-menu-field="target" '+(isGroup?'disabled':'')+'><option value="_self" '+(target==='_self'?'selected':'')+'>Misma pestaña</option><option value="_blank" '+(target==='_blank'?'selected':'')+'>Nueva pestaña</option></select></label>' + actions + '</article>';
      return row + children.map((child,childIndex) => renderAdminMenuItem(child,depth+1,childIndex,children.length)).join('');
    }
    document.getElementById('menu-items')?.addEventListener('input', event => updateAdminMenuField(event));
    document.getElementById('menu-items')?.addEventListener('change', event => {
      if (event.target.dataset.menuField === 'type') {
        const item = findAdminMenuItem(activeAdminMenu, event.target.closest('[data-menu-id]').dataset.menuId);
        item.type = event.target.value;
        if (item.type === 'group') { item.url = ''; item.target = '_self'; item.children ||= []; }
        else item.children = [];
        renderAdminMenuItems();
      } else updateAdminMenuField(event);
    });
    function updateAdminMenuField(event) {
      const field = event.target.dataset.menuField;
      if (!field || field === 'type') return;
      const row = event.target.closest('[data-menu-id]');
      const item = row && findAdminMenuItem(activeAdminMenu,row.dataset.menuId);
      if (item) item[field] = event.target.value;
    }
    function addAdminMenuItem(type) { adminMenus[activeAdminMenu].items.push(newMenuItem(type)); renderAdminMenuItems(); }
    function addAdminMenuChild(id,type) { const item=findAdminMenuItem(activeAdminMenu,id); if(item?.type==='group'){item.children ||= [];item.children.push(newMenuItem(type));renderAdminMenuItems();} }
    function newMenuItem(type) { return {id:'local-'+crypto.randomUUID(),title:'',type,url:'',target:'_self',children:[]}; }
    function removeAdminMenuItem(id) { if(confirm('¿Eliminar este elemento y sus elementos anidados?')){removeMenuItem(adminMenus[activeAdminMenu].items,id);renderAdminMenuItems();} }
    function moveAdminMenuItem(id,step) { moveMenuItem(adminMenus[activeAdminMenu].items,id,step);renderAdminMenuItems(); }
    function findAdminMenuItem(code,id,items=adminMenus[code]?.items||[]) { for(const item of items){if(item.id===id)return item;const found=findAdminMenuItem(code,id,item.children||[]);if(found)return found;} return null; }
    function removeMenuItem(items,id) { const index=items.findIndex(item=>item.id===id);if(index>=0){items.splice(index,1);return true;}return items.some(item=>removeMenuItem(item.children||[],id)); }
    function moveMenuItem(items,id,step) { const index=items.findIndex(item=>item.id===id);if(index>=0){const next=index+step;if(next>=0&&next<items.length)[items[index],items[next]]=[items[next],items[index]];return true;}return items.some(item=>moveMenuItem(item.children||[],id,step)); }
    async function saveAdminMenu() {
      const menu=adminMenus[activeAdminMenu];
      const button=document.getElementById('menu-save');button.disabled=true;setMenuMessage('Guardando menú…');
      try {
        const response=await fetch('/api/v1/admin/cms/menus/'+activeAdminMenu,{method:'PUT',headers:adminHeaders(true),body:JSON.stringify({title:document.getElementById('menu-title').value.trim(),items:menu.items})});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo guardar el menú');
        adminMenus[activeAdminMenu]=result.data;showAdminMenu(activeAdminMenu);setMenuMessage('Menú guardado. La navegación de la tienda ya usa estos enlaces.',true);
      } catch(error) { setMenuMessage(error.message||'No se pudo guardar el menú'); }
      finally { button.disabled=false; }
    }
    function setMenuMessage(text,success=false) { const node=document.getElementById('menu-message');if(node){node.textContent=text;node.className='menu-message'+(success?' success':'');} }
    window.loadAdminMenus=loadAdminMenus;window.selectAdminMenu=selectAdminMenu;window.addAdminMenuItem=addAdminMenuItem;window.addAdminMenuChild=addAdminMenuChild;window.moveAdminMenuItem=moveAdminMenuItem;window.removeAdminMenuItem=removeAdminMenuItem;window.saveAdminMenu=saveAdminMenu;
  `;
}
