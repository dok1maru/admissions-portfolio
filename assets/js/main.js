// Лёгкие fade-in анимации на IntersectionObserver — без библиотек.
(function () {
  var els = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  els.forEach(function (el, i) {
    // лёгкий каскад для строк hero-заголовка
    el.style.transitionDelay = (el.closest('.hero-title') ? i * 90 : 0) + 'ms';
    io.observe(el);
  });
})();
