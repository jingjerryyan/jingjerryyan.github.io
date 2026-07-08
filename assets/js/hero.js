/* Immersive hero v2: particle name-field + restrained melodic audio */
(function () {
  var hero = document.querySelector('.hero--full');
  var canvas = document.querySelector('.hero__canvas');
  if (!hero || !canvas) return;
  var ctx = canvas.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var word = [];
  var dust = [];
  var mouse = { x: -9999, y: -9999, active: false };

  var INK = 'rgba(33,29,26,';
  var ACC = 'rgba(123,34,48,';

  function sizeCanvas() {
    var r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function targets() {
    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var o = off.getContext('2d');
    var fs = Math.min(W * 0.11, H * 0.28, 132);
    o.fillStyle = '#000';
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.font = '600 ' + fs + 'px "Playfair Display", Georgia, serif';
    o.fillText('JING YAN', W / 2, H * 0.44);
    var gap = Math.max(5, Math.round(fs / 20));
    var d;
    try { d = o.getImageData(0, 0, W, H).data; } catch (e) { return []; }
    var pts = [];
    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        if (d[(y * W + x) * 4 + 3] > 128) pts.push({ x: x, y: y });
      }
    }
    return pts;
  }

  function build() {
    var pts = targets();
    word = pts.map(function (p) {
      return {
        hx: p.x, hy: p.y,
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0,
        r: Math.random() * 1.0 + 0.9,
        tw: Math.random() * 6.283
      };
    });
    dust = [];
    var n = Math.max(40, Math.round((W * H) / 24000));
    for (var i = 0; i < n; i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 0.8 + 0.4,
        tw: Math.random() * 6.283
      });
    }
  }

  var MR = 66, MR2 = MR * MR;

  function tick() {
    ctx.clearRect(0, 0, W, H);
    var t = performance.now() * 0.001;
    var i, p, tw, alpha, col, dx, dy, d2;
    for (i = 0; i < word.length; i++) {
      p = word[i];
      p.vx = (p.vx + (p.hx - p.x) * 0.03) * 0.82;
      p.vy = (p.vy + (p.hy - p.y) * 0.03) * 0.82;
      if (mouse.active) {
        dx = p.x - mouse.x; dy = p.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < MR2 && d2 > 0.01) {
          var dd = Math.sqrt(d2), f = (MR - dd) / MR * 2.4;
          p.vx += (dx / dd) * f; p.vy += (dy / dd) * f;
        }
      }
      p.x += p.vx; p.y += p.vy;
      tw = 0.6 + 0.4 * Math.sin(t * 1.5 + p.tw);
      var near = false;
      if (mouse.active) { dx = p.x - mouse.x; dy = p.y - mouse.y; near = (dx * dx + dy * dy) < MR2; }
      col = near ? ACC : INK;
      alpha = 0.9 * tw;
      ctx.beginPath();
      ctx.fillStyle = col + alpha.toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
    for (i = 0; i < dust.length; i++) {
      p = dust[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
      tw = 0.5 + 0.5 * Math.sin(t * 1.3 + p.tw);
      ctx.beginPath();
      ctx.fillStyle = INK + (0.20 * tw).toFixed(3) + ')';
      ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, master = null;
  var MELODY = [440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 293.66, 329.63];
  var step = 0, lastNote = 0;

  function initAudio() {
    if (actx) return;
    try {
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.05;
      var delay = actx.createDelay(); delay.delayTime.value = 0.30;
      var fb = actx.createGain(); fb.gain.value = 0.33;
      var wet = actx.createGain(); wet.gain.value = 0.34;
      master.connect(actx.destination);
      master.connect(delay); delay.connect(fb); fb.connect(delay);
      delay.connect(wet); wet.connect(actx.destination);
    } catch (e) { actx = null; }
  }
  function pluck(freq) {
    if (!actx) return;
    var now = actx.currentTime;
    var o1 = actx.createOscillator(), o2 = actx.createOscillator();
    o1.type = 'sine'; o2.type = 'triangle';
    o1.frequency.value = freq; o2.frequency.value = freq * 2.001;
    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    var g2 = actx.createGain(); g2.gain.value = 0.32;
    o2.connect(g2); g2.connect(g); o1.connect(g); g.connect(master);
    o1.start(now); o2.start(now); o1.stop(now + 1.25); o2.stop(now + 1.25);
  }
  function note() {
    initAudio(); if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    var t = performance.now();
    if (t - lastNote < 95) return;
    lastNote = t;
    pluck(MELODY[step % MELODY.length]); step++;
  }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    note();
  });
  hero.addEventListener('pointerleave', function () { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });
  Array.prototype.forEach.call(document.querySelectorAll('.hero__enter'), function (a) {
    a.addEventListener('pointerenter', note);
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { sizeCanvas(); build(); }, 170);
  });

  function boot() { sizeCanvas(); build(); tick(); }
  boot();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { sizeCanvas(); build(); });
  }
  setTimeout(function () { sizeCanvas(); build(); }, 700);
})();
