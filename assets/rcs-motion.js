/* Start the diagram once it is visible; leave it still if reduced motion is set. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const figure of document.querySelectorAll('.rcs-motion')) {
    const image = figure.querySelector('img[data-gif]');
    const button = figure.querySelector('button');
    if (!image || !button) continue;
    const poster = image.getAttribute('src');
    let playing = false;
    let observer;
    function setPlaying(on) {
      if (playing === on) return;
      playing = on;
      image.src = on ? image.dataset.gif : poster;
      button.textContent = on ? 'עצירת האנימציה' : 'הפעלת האנימציה';
    }
    button.hidden = false;
    button.addEventListener('click', () => {
      observer?.disconnect();
      setPlaying(!playing);
    });
    reduced.addEventListener('change', ({ matches }) => {
      if (matches) { observer?.disconnect(); setPlaying(false); }
    });
    if (!reduced.matches) {
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            observer.disconnect();
            setPlaying(true);
          }
        }, { threshold: .15 });
        observer.observe(figure);
      } else setPlaying(true);
    }
  }
})();
