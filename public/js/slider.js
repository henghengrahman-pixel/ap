(function(){
  const root = document.querySelector('[data-slider]');
  if(!root) return;
  const slides = Array.from(root.querySelectorAll('.slide'));
  const dots = Array.from(root.querySelectorAll('[data-dot]'));
  if(slides.length <= 1) return;
  let index = 0;
  function show(next){
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }
  dots.forEach(dot => dot.addEventListener('click', () => show(Number(dot.dataset.dot || 0))));
  setInterval(() => show(index + 1), 4200);
})();
