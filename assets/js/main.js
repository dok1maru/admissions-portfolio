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

  var lbImg = lb.querySelector('img');
  document.querySelectorAll('.coin-face, .about-photo img').forEach(function (img) {
    img.addEventListener('click', function () {
      if (lbImg) lbImg.src = img.src; // открываем именно ту фотку, по которой кликнули
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

// ============ Бесконечная карусель с пиксельными индикаторами ============
(function () {
  var track = document.querySelector('.results-grid');
  var dotsBox = document.querySelector('.carousel-dots');
  if (!track || !dotsBox) return;

  var real = Array.prototype.slice.call(track.querySelectorAll('.card'));
  var n = real.length;
  if (n < 2) return;
  real.forEach(function (c, i) { c.dataset.idx = i; });

  // клоны по краям: слева от первого — последние, справа от последнего — первые
  var CLONES = Math.min(2, n);
  for (var k = 0; k < CLONES; k++) {
    var pre = real[n - 1 - k].cloneNode(true);
    pre.setAttribute('aria-hidden', 'true');
    track.insertBefore(pre, track.firstChild);
    var post = real[k].cloneNode(true);
    post.setAttribute('aria-hidden', 'true');
    track.appendChild(post);
  }

  var all = Array.prototype.slice.call(track.querySelectorAll('.card'));

  function loopW() {
    var gap = 20;
    return real[n - 1].offsetLeft + real[n - 1].offsetWidth + gap - real[0].offsetLeft;
  }

  function centerOn(card, smooth) {
    var left = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    track.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
  }

  real.forEach(function (card, i) {
    var dot = document.createElement('button');
    dot.className = 'dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Карточка ' + (i + 1));
    dot.addEventListener('click', function () { centerOn(real[i], true); });
    dotsBox.appendChild(dot);
  });
  var dots = dotsBox.querySelectorAll('.dot');

  function onScroll() {
    // активная точка — по ближайшей к центру карточке (клоны мапятся на оригинал)
    var center = track.scrollLeft + track.clientWidth / 2;
    var bestEl = all[0], bd = Infinity;
    all.forEach(function (card) {
      var d = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
      if (d < bd) { bd = d; bestEl = card; }
    });
    var idx = +(bestEl.dataset.idx || 0);
    dots.forEach(function (dot, i) { dot.classList.toggle('active', i === idx); });

    // бесшовный перескок из зоны клонов
    var L = track.scrollLeft, lw = loopW();
    var lead = real[0].offsetLeft, cw = real[0].clientWidth;
    if (L < lead - cw) track.scrollLeft = L + lw;
    else if (L > lead + lw - cw) track.scrollLeft = L - lw;
  }

  track.addEventListener('scroll', function () { requestAnimationFrame(onScroll); }, { passive: true });
  window.addEventListener('resize', function () { centerOn(real[0], false); });

  // старт — на первой реальной карточке
  requestAnimationFrame(function () { centerOn(real[0], false); onScroll(); });
})();

// ============ Карта мира: страны + легенда (стиль 9labs, монохром) ============
(function () {
  var holder = document.getElementById('worldmap');
  var legend = document.getElementById('maplegend');
  var panel = document.getElementById('mappanel');
  if (!holder || !legend || !panel) return;

  var COUNTRIES = [
    { id: 'kz', name: 'Kazakhstan', unis: ['Nazarbayev University — я'] },
    { id: 'ae', name: 'UAE', unis: ['NYU Abu Dhabi — Камила', 'MBZUAI — Арсен'] },
    { id: 'cn', name: 'China & Hong Kong', unis: ['CUHK — Тарлан, я', 'CityUHK — Тарлан, я', 'Lingnan University — Соня', 'HKBU — Соня, я', 'CUHK-Shenzhen — Алмаз, я', 'HKUST-Guangzhou — Соня, я', 'NYU Shanghai — Алишер'] },
    { id: 'kr', name: 'South Korea', unis: ['UNIST — Соня, я', 'DGIST — Соня'] },
    { id: 'ca', name: 'Canada', unis: ['University of Toronto — Камила', 'Huron University — Айганым', 'Western University — Айганым'] },
    { id: 'us', name: 'USA', unis: ['RIT — Тарлан', 'UNC — Айганым', 'Oberlin College — я', 'DePauw — я', 'Case Western — я'] }
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

      // в лупе: маркеры меньше (не раздуваются от зума) + разнесённые подписи
      var lensSvg = inner.querySelector('svg');
      var NS = 'http://www.w3.org/2000/svg';
      lensSvg.querySelectorAll('.city').forEach(function (r) {
        var cx = parseFloat(r.getAttribute('x')) + 4.5;
        var cy = parseFloat(r.getAttribute('y')) + 4.5;
        // уменьшаем квадрат: 4 юнита вместо 9
        r.setAttribute('x', cx - 2);
        r.setAttribute('y', cy - 2);
        r.setAttribute('width', 4);
        r.setAttribute('height', 4);
        r.setAttribute('stroke-width', 0.8);
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('class', 'city-label');
        var lx = cx + parseFloat(r.dataset.dx || 0);
        t.setAttribute('x', lx);
        t.setAttribute('y', cy + parseFloat(r.dataset.dy || -4));
        t.setAttribute('text-anchor', r.dataset.anchor || 'middle');
        (r.dataset.unis || r.dataset.name || '').split('|').forEach(function (line, li) {
          var ts = document.createElementNS(NS, 'tspan');
          ts.setAttribute('x', lx);
          ts.setAttribute('dy', li === 0 ? 0 : 5);
          ts.textContent = line;
          t.appendChild(ts);
        });
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

// ============ Acceptance rate: единая пиксельная система ============
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var PIXEL = 7;    // единый размер пикселя (для мозаики и шага джиттера)
  var TICK  = 200;  // единый такт всей микро-анимации

  // --- мозаики по бокам (Game of Life) ---
  var blocks = [];
  document.querySelectorAll('.pxblock').forEach(function (canvas) {
    var ctx = canvas.getContext('2d');
    var cols, rows, grid;
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cols = Math.max(4, Math.ceil(r.width / PIXEL));
      rows = Math.max(4, Math.ceil(r.height / PIXEL));
      canvas.width = cols; canvas.height = rows;
      grid = new Uint8Array(cols * rows);
      for (var i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.16 ? 1 : 0;
    }
    function step() {
      if (!grid) return;
      var next = new Uint8Array(cols * rows);
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var n = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          n += grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
        }
        var a = grid[y * cols + x];
        next[y * cols + x] = (a && (n === 2 || n === 3)) || (!a && n === 3) ? 1 : 0;
      }
      grid = next;
      if (Math.random() < 0.25) {
        var cx = (Math.random() * cols) | 0, cy = (Math.random() * rows) | 0;
        [[0,0],[1,0],[2,0],[2,1],[1,2]].forEach(function (p) {
          grid[((cy + p[1]) % rows) * cols + ((cx + p[0]) % cols)] = 1;
        });
      }
    }
    function draw() {
      if (!grid) return;
      ctx.clearRect(0, 0, cols, rows);
      ctx.fillStyle = '#1a1a1a';           // единый цвет
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++)
        if (grid[y * cols + x]) ctx.fillRect(x, y, 1, 1);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function(){ resize(); draw(); }, 200); });
    resize(); draw();
    blocks.push({ step: step, draw: draw });
  });

  // --- число по центру: <1%..<5%, джиттер шагами по PIXEL ---
  var numEl = document.getElementById('arNum');
  var STEPS = ['<1%', '<2%', '<3%', '<4%', '<5%'];
  var idx = 0, dir = 1, ticks = 0;
  function render(txt) {
    numEl.innerHTML = '';
    txt.split('').forEach(function (ch) {
      var s = document.createElement('span');
      s.className = 'ar-ch';
      s.textContent = ch;
      numEl.appendChild(s);
    });
  }
  if (numEl) render(STEPS[idx]);

  // единый цикл: двигает мозаику и джиттерит число в один такт
  function frame() {
    blocks.forEach(function (b) { b.step(); b.draw(); });

    if (numEl) {
      // каждые 3 такта меняем процент
      if (ticks % 3 === 0) {
        idx += dir;
        if (idx >= STEPS.length - 1) { idx = STEPS.length - 1; dir = -1; }
        else if (idx <= 0) { idx = 0; dir = 1; }
        render(STEPS[idx]);
      }
      // джиттер: смещение кратно PIXEL, тот же цвет (без прозрачности)
      numEl.querySelectorAll('.ar-ch').forEach(function (s) {
        var r = Math.random();
        var dx = (r < 0.5 ? 0 : (r < 0.75 ? PIXEL : -PIXEL));
        var dy = (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? PIXEL : -PIXEL));
        s.style.transform = (dx || dy) ? 'translate(' + dx + 'px,' + dy + 'px)' : 'none';
      });
    }
    ticks++;
  }

  var t = setInterval(frame, TICK);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearInterval(t);
    else t = setInterval(frame, TICK);
  });
})();
