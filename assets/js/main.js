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

// ============ Интерактивная пиксельная карта мира ============
(function () {
  var canvas = document.getElementById('worldmap');
  var tip = document.getElementById('maptip');
  var legend = document.getElementById('maplegend');
  if (!canvas || !window.MAPDATA) return;

  var D = window.MAPDATA;
  var CELL = 6;                       // внутренний пиксель сетки
  var W = D.W * CELL, H = D.H * CELL;
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');
  var rows = D.grid.split('\n');

  function cityXY(c) {
    var x = (c.lon + 180) / 360 * W;
    var y = (D.latTop - c.lat) / (D.latTop - D.latBot) * H;
    return [x, y];
  }

  var pulse = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var j = 0; j < D.H; j++) {
      var row = rows[j];
      for (var i = 0; i < D.W; i++) {
        var c = row[i];
        if (c === '0') continue;
        ctx.fillStyle = c === '2' ? '#1a1a1a' : '#c9c5bd';
        ctx.fillRect(i * CELL + 1, j * CELL + 1, CELL - 2, CELL - 2);
      }
    }
    // маркеры городов — пульсирующие пиксельные квадраты
    D.cities.forEach(function (c, idx) {
      var p = cityXY(c);
      var s = (pulse % 2 === 0 ? 10 : 12) + (idx === activeCity ? 4 : 0);
      ctx.fillStyle = '#f4f2ee';
      ctx.fillRect(p[0] - s / 2 - 2, p[1] - s / 2 - 2, s + 4, s + 4);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
    });
  }

  var activeCity = -1;
  setInterval(function () { pulse++; draw(); }, 600);

  function showTip(idx) {
    activeCity = idx;
    draw();
    legend.querySelectorAll('.map-chip').forEach(function (ch, i) {
      ch.classList.toggle('active', i === idx);
    });
    if (idx < 0) { tip.hidden = true; return; }
    var c = D.cities[idx];
    var p = cityXY(c);
    var rect = canvas.getBoundingClientRect();
    var scale = rect.width / W;
    tip.innerHTML = '<div class="tip-city">' + c.n + '</div>' +
      c.u.map(function (u) { return '<span class="tip-uni">' + u + '</span>'; }).join('');
    tip.style.left = (p[0] * scale) + 'px';
    tip.style.top = (p[1] * scale - 12) + 'px';
    tip.hidden = false;
  }

  function nearest(evX, evY) {
    var rect = canvas.getBoundingClientRect();
    var scale = W / rect.width;
    var x = (evX - rect.left) * scale, y = (evY - rect.top) * scale;
    var best = -1, bd = 22 * 22;
    D.cities.forEach(function (c, i) {
      var p = cityXY(c);
      var d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  canvas.addEventListener('mousemove', function (e) { showTip(nearest(e.clientX, e.clientY)); });
  canvas.addEventListener('mouseleave', function () { showTip(-1); });
  canvas.addEventListener('click', function (e) { showTip(nearest(e.clientX, e.clientY)); });

  // легенда-чипы
  D.cities.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-chip';
    b.textContent = c.n;
    b.addEventListener('click', function () { showTip(activeCity === i ? -1 : i); });
    legend.appendChild(b);
  });

  draw();
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
