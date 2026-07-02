// ============ Fade-in на IntersectionObserver ============
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
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  els.forEach(function (el) { io.observe(el); });
})();

// ============ Лайтбокс: клик по фото — на весь экран ============
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;

  document.querySelectorAll('.hero-avatar, .about-photo img').forEach(function (img) {
    img.addEventListener('click', function () {
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

// ============ Карусель: пиксельные квадраты-индикаторы ============
(function () {
  var track = document.querySelector('.results-grid');
  var dotsBox = document.querySelector('.carousel-dots');
  if (!track || !dotsBox) return;

  var cards = track.querySelectorAll('.card');

  cards.forEach(function (card, i) {
    var dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Карточка ' + (i + 1));
    dot.addEventListener('click', function () {
      var left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
      track.scrollTo({ left: left, behavior: 'smooth' });
    });
    dotsBox.appendChild(dot);
  });

  var dots = dotsBox.querySelectorAll('.dot');

  function update() {
    var center = track.scrollLeft + track.clientWidth / 2;
    var best = 0, bestDist = Infinity;
    cards.forEach(function (card, i) {
      var d = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    dots.forEach(function (dot, i) { dot.classList.toggle('active', i === best); });
  }

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ============ Карта мира: страны + легенда (стиль 9labs, монохром) ============
(function () {
  var holder = document.getElementById('worldmap');
  var legend = document.getElementById('maplegend');
  var panel = document.getElementById('mappanel');
  if (!holder || !legend || !panel) return;

  var COUNTRIES = [
    { id: 'kz', name: 'Казахстан', unis: ['Nazarbayev University — я'] },
    { id: 'ae', name: 'ОАЭ', unis: ['NYU Abu Dhabi — Камила', 'MBZUAI — Арсен'] },
    { id: 'cn', name: 'Китай и Гонконг', unis: ['CUHK — Тарлан, я', 'CityUHK — Тарлан, я', 'Lingnan University — Соня', 'CUHK-Shenzhen — Алмаз, я', 'HKUST-Guangzhou — Соня, я'] },
    { id: 'kr', name: 'Южная Корея', unis: ['UNIST — Соня, я', 'DGIST — Соня'] },
    { id: 'ca', name: 'Канада', unis: ['University of Toronto — Камила', 'Huron at Western — Айганым'] },
    { id: 'us', name: 'США', unis: ['RIT — Тарлан', 'Oberlin College — я', 'DePauw — я'] }
  ];

  fetch('assets/img/worldmap.svg')
    .then(function (r) { return r.text(); })
    .then(function (svg) {
      holder.innerHTML = svg;
      var active = -1;

      function setActive(i) {
        active = i;
        holder.querySelectorAll('.country.hi').forEach(function (el) {
          el.classList.remove('active');
        });
        legend.querySelectorAll('.map-chip').forEach(function (ch, k) {
          ch.classList.toggle('active', k === i);
        });
        if (i < 0) { panel.hidden = true; return; }
        var c = COUNTRIES[i];
        holder.querySelectorAll('.g-' + c.id + '.country').forEach(function (el) {
          el.classList.add('active');
        });
        panel.innerHTML = '<div class="tip-city">' + c.name + '</div>' +
          c.unis.map(function (u) { return '<span class="tip-uni">' + u + '</span>'; }).join('');
        panel.hidden = false;
      }

      COUNTRIES.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'map-chip';
        b.innerHTML = '<span class="chip-dot"></span>' + c.name;
        b.addEventListener('click', function () { setActive(active === i ? -1 : i); });
        legend.appendChild(b);
        // клик по самой стране на карте
        holder.querySelectorAll('.g-' + c.id + '.country').forEach(function (el) {
          el.addEventListener('click', function () { setActive(active === i ? -1 : i); });
        });
      });

      // ---- лупа с зумом ----
      var ZOOM = 4;
      var lens = document.createElement('div');
      lens.id = 'maplens';
      lens.hidden = true;
      var inner = document.createElement('div');
      inner.className = 'lens-inner';
      inner.innerHTML = svg;
      lens.appendChild(inner);
      holder.parentNode.appendChild(lens);

      // подписи городов внутри лупы (читаемый размер)
      var lensSvg = inner.querySelector('svg');
      var NS = 'http://www.w3.org/2000/svg';
      lensSvg.querySelectorAll('.city').forEach(function (r) {
        var name = r.querySelector('title') ? r.querySelector('title').textContent : '';
        var x = parseFloat(r.getAttribute('x')) + 4.5;
        var y = parseFloat(r.getAttribute('y')) - 3.5;
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'city-label');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.textContent = name;
        lensSvg.appendChild(t);
      });

      function moveLens(clientX, clientY) {
        var rect = holder.getBoundingClientRect();
        var fx = (clientX - rect.left) / rect.width;
        var fy = (clientY - rect.top) / rect.height;
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { lens.hidden = true; return; }
        var LW = lens.offsetWidth || 210;
        var innerW = rect.width * ZOOM;
        var innerH = rect.height * ZOOM;
        var innerSvg = inner.querySelector('svg');
        innerSvg.style.width = innerW + 'px';
        innerSvg.style.height = innerH + 'px';
        inner.style.left = (LW / 2 - fx * innerW) + 'px';
        inner.style.top = (LW / 2 - fy * innerH) + 'px';
        var cssX = clientX - rect.left, cssY = clientY - rect.top;
        var lx = cssX + 22, ly = cssY - LW - 22;
        if (lx + LW > rect.width) lx = cssX - LW - 22;
        if (ly < 0) ly = cssY + 22;
        lens.style.left = lx + 'px';
        lens.style.top = ly + 'px';
        lens.hidden = false;
      }

      holder.addEventListener('mousemove', function (e) { moveLens(e.clientX, e.clientY); });
      holder.addEventListener('mouseleave', function () { lens.hidden = true; });
      holder.addEventListener('click', function (e) { moveLens(e.clientX, e.clientY); });
    });
})();

// ============ Пиксельные блоки: «Game of Life» в пустых зонах ============
// Процедурная анимация вместо гифки: 0 сетевых запросов, ~1.5 КБ кода.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var CELL = 8;    // размер пикселя на экране
  var TICK = 420;  // мс между поколениями

  document.querySelectorAll('.pxblock').forEach(function (canvas) {
    var ctx = canvas.getContext('2d');
    var cols, rows, grid;

    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cols = Math.max(4, Math.ceil(r.width / CELL));
      rows = Math.max(4, Math.ceil(r.height / CELL));
      canvas.width = cols;
      canvas.height = rows;
      seed();
      draw();
    }

    function seed() {
      grid = new Uint8Array(cols * rows);
      for (var i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.14 ? 1 : 0;
    }

    function step() {
      var next = new Uint8Array(cols * rows);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var n = 0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              n += grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
            }
          }
          var alive = grid[y * cols + x];
          next[y * cols + x] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
        }
      }
      grid = next;
      // подсев глайдера, чтобы поле не вымирало
      if (Math.random() < 0.2) {
        var cx = (Math.random() * cols) | 0, cy = (Math.random() * rows) | 0;
        [[0,0],[1,0],[2,0],[2,1],[1,2]].forEach(function (p) {
          grid[((cy + p[1]) % rows) * cols + ((cx + p[0]) % cols)] = 1;
        });
      }
    }

    function draw() {
      if (!grid) return;
      ctx.clearRect(0, 0, cols, rows);
      ctx.fillStyle = '#1a1a1a';
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          if (grid[y * cols + x]) ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    var t;
    function loop() {
      clearTimeout(t);
      step();
      draw();
      t = setTimeout(function () { requestAnimationFrame(loop); }, TICK);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(t);
      else loop();
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(resize, 200);
    });

    resize();
    loop();
  });
})();
