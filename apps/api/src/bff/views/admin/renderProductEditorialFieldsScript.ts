export function renderProductEditorialFieldsScript(): string {
  return `window.setProductEditorialFields=(product)=>{
    const tagSelect=document.getElementById('pTags'),tags=new Set(product.tags||[]);
    (product.tags||[]).forEach((name)=>{if(!Array.from(tagSelect.options).some((option)=>option.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name+' (etiqueta existente)';tagSelect.append(option);}});
    Array.from(tagSelect.options).forEach((option)=>{option.selected=tags.has(option.value);});
    document.getElementById('pGuideTitle').value=product.guideTitle||'';
    document.getElementById('pGuideContent').value=product.guideContent||'';
    const select=document.getElementById('pRelatedBlogPosts'),ids=new Set(product.relatedBlogPostIds||[]);
    Array.from(select.options).forEach((option)=>{option.selected=ids.has(option.value);});
    ids.forEach((id)=>{if(!Array.from(select.options).some((option)=>option.value===id)){const option=document.createElement('option');option.value=id;option.textContent='Artículo asociado no disponible · '+id;option.selected=true;select.append(option);}});
  };`;
}
