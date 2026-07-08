/* Immersive hero: particle name-field + restrained melodic audio (rewrite) */
(function () {
  var hero = document.querySelector('.hero--full');
  var canvas = document.querySelector('.hero__canvas');
  if (!hero || !canvas) return;
  var ctx = canvas.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };

  // ---- palette (academic light theme) ----
  var INK = [33, 29, 26];        // charcoal particle
  var ACCENT = [123, 34, 48];    // burgundy highlight

  function sizeCanvas() {
    var r = hero.getBoundingClientRect();
    W = Math.max(1, Math.floor(r.width));
    H = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // ---- build target points by rasterizing "JING YAN" ----
  function buildTargets() {
    var off = document.createElement('canvas');
    var octx = off.getContext('2d');
    off.width = W; off.height = H;
    // smaller title: scale font to a fraction of width
    var fs = Math.min(W * 0.12, H * 0.30, 150);
    octx.fillStyle = '#000';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.font = '600 ' + fs + 'px "Playfair Display", Georgia, serif';
    octx.fillText('JING YAN', W / 2, H * 0.42);

    var gap = Math.max(4, Math.round(fs / 22)); // density -> smaller particles
    var data;
    try { data = octx.getImageData(0, 0, W, H).data; } catch (e) { return []; }
    var pts = [];
    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        var a = data[(y * W + x) * 4 + 3];
        if (a > 128) pts.push({ x: x, y: y });
      }
    }
    return pts;
  }

  function initParticles() {
    var pts = buildTargets();
    particles = pts.map(function (p) {
      return {
        hx: p.x, hy: p.y,                 // home (target)
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0,
        r: Math.random() * 1.1 + 0.7,     // smaller dots
        tw: Math.random() * Math.PI * 2   // twinkle phase
      };
    });
    // ambient dust that never joins the word
    var dustN = Math.round((W * H) / 26000);
    for (var i = 0; i < dustN; i++) {
      particles.push({
        hx: null, hy: null,
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 0.9 + 0.4,
        tw: Math.random() * Math.PI * 2,
        dust: true
      });
    }
  }

  var MOUSE_R = 70;   // smaller interaction radius (was larger)
  var MOUSE_R2 = MOUSE_R * MOUSE_R;

  function frame() {
    ctx.clearRect(0, 0, W, H);
    var t = performance.now() * 0.001;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (p.dust) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      } else {
        // spring home
        var ax = (p.hx - p.x) * 0.02;
        var ay = (p.hy - p.y) * 0.02;
        p.vx = (p.vx + ax) * 0.86;
        p.vy = (p.vy + ay) * 0.86;
        // gentle mouse repulsion (small radius)
        if (mouse.active) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_R2 && d2 > 0.01) {
            var d = Math.sqrt(d2);
            var f = (MOUSE_R - d) / MOUSE_R * 2.2;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.x += p.vx; p.y += p.vy;
      }
      var tw = 0.55 + 0.45 * Math.sin(t * 1.6 + p.tw);
      var near = false;
      if (mouse.active && !p.dust) {
        var ddx = p.x - mouse.x, ddy = p.y - mouse.y;
        near = (ddx * ddx + ddy * ddy) < MOUSE_R2;
      }
      var col = near ? ACCENT : INK;
      var alpha = (p.dust ? 0.22 : 0.85) * tw;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  // ================= AUDIO: "Long Time" style melody =================
  // Restrained, note-by-note but legato-connected. Pentatonic/minor loop.
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var actx = null, master = null;
  // A minor pentatonic-ish descending motif reminiscent of a dreamy loop
  var MELODY = [ 440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 293.66, 329.63 ];
  var step = 0, lastNote = 0;

  function ensureAudio() {
    if (actx) return;
    try {
      actx = new AudioCtx();
      master = actx.createGain();
      master.gain.value = 0.05;      // very restrained
      // soft airy reverb-ish via feedback delay
      var delay = actx.createDelay();
      delay.delayTime.value = 0.28;
      var fb = actx.createGain();
      fb.gain.value = 0.32;
      var wet = actx.createGain();
      wet.gain.value = 0.35;
      master.connect(actx.destination);
      master.connect(delay);
      delay.connect(fb); fb.connect(delay);
      delay.connect(wet); wet.connect(actx.destination);
      window.__heroMasterDelay = delay;
    } catch (e) { actx = null; }
  }

  function pluck(freq) {
    if (!actx) return;
    var now = actx.currentTime;
    // legato-connected: overlap envelopes so notes bleed into one another
    var o1 = actx.createOscillator();
    var o2 = actx.createOscillator();
    o1.type = 'sine';
    o2.type = 'triangle';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.001; // shimmer octave
    var g = actx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.04);   // soft attack
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1); // long tail -> connected
    var g2 = actx.createGain();
    g2.gain.value = 0.35;
    o2.connect(g2); g2.connect(g);
    o1.connect(g);
    g.connect(master);
    o1.start(now); o2.start(now);
    o1.stop(now + 1.2); o2.stop(now + 1.2);
  }

  function playNext() {
    ensureAudio();
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    var t = performance.now();
    if (t - lastNote < 90) return; // avoid machine-gun; still note-by-note
    lastNote = t;
    pluck(MELODY[step % MELODY.length]);
    step++;
  }

  // ---- events ----
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
    // trigger the next melody note as the cursor connects across the field
    playNext();
  });
  hero.addEventListener('pointerleave', function () { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });
  // entries also chime
  Array.prototype.forEach.call(document.querySelectorAll('.hero__enter'), function (a) {
    a.addEventListener('pointerenter', playNext);
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { sizeCanvas(); initParticles(); }, 160);
  });

  function boot() { sizeCanvas(); initParticles(); frame(); }
  if (document.fonts && document.fonts.ready) {
    boot();
    document.fonts.ready.then(function () { initParticles(); });
  } else {
    boot();
  }
})();
