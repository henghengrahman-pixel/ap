(function(){
  const grid = document.querySelector('[data-sortable-menu]');
  if(!grid) return;
  let dragged = null;
  grid.querySelectorAll('.menu-admin-card').forEach(card=>{
    card.addEventListener('dragstart',()=>{ dragged=card; card.classList.add('dragging'); });
    card.addEventListener('dragend',()=>{ dragged=null; card.classList.remove('dragging'); });
    card.addEventListener('dragover',(e)=>{ e.preventDefault(); const after=[...grid.querySelectorAll('.menu-admin-card:not(.dragging)')].find(el=>e.clientY <= el.getBoundingClientRect().top + el.offsetHeight/2); if(after) grid.insertBefore(dragged, after); else grid.appendChild(dragged); });
  });
})();
