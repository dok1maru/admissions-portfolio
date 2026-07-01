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

// ============ Пиксельный фон: «Game of Life», очень медленно ============
// Процедурная анимация вместо гифки: 0 запросов, ~1 КБ кода.
(function () {
  var canvas = document.getElementById('px');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var CELL = 14;          // размер пикселя на экране
  var TICK = 450;         // мс между поколениями — медленно и спокойно
  var cols, rows, grid;

  function resize() {
    cols = Math.ceil(window.innerWidth / CELL);
    rows = Math.ceil(window.innerHeight / CELL);
    canvas.width = cols;
    canvas.height = rows;
    seed();
  }

  function seed() {
    grid = new Uint8Array(cols * rows);
    for (var i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.12 ? 1 : 0;
  }

  function step() {
    var next = new Uint8Array(cols * rows);
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var n = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            var nx = (x + dx + cols) % cols;
            var ny = (y + dy + rows) % rows;
            n += grid[ny * cols + nx];
          }
        }
        var alive = grid[y * cols + x];
        next[y * cols + x] = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
      }
    }
    grid = next;
    // подсев, чтобы поле не вымирало
    if (Math.random() < 0.15) {
      var cx = (Math.random() * cols) | 0, cy = (Math.random() * rows) | 0;
      [[0,0],[1,0],[2,0],[2,1],[1,2]].forEach(function (p) { // глайдер
        grid[((cy + p[1]) % rows) * cols + ((cx + p[0]) % cols)] = 1;
      });
    }
  }

  function draw() {
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
    step();
    draw();
    t = setTimeout(function () { requestAnimationFrame(loop); }, TICK);
  }

  // пауза, когда вкладка не видна
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
  draw();
  loop();
})();
