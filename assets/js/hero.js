/* ============================================================
   hero.js — star-dust particle title for the homepage hero.
   • Renders the name as soft particles that settle into letters.
   • Particles gently scatter away from the cursor, then drift back.
   • Ambient floating specks add depth.
   • A restrained, Debussy-ish music-box motif plays softly while
     the cursor moves over the title (Web Audio, no audio assets).
   Robust init: waits for real layout + web font, then rebuilds.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("hero-canvas");
  var hero = document.getElementById("hero");
  if (!canvas || !hero) return;

  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var ctx = canvas.getContext("2d");
  var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  var W = 0, H = 0;
  var particles = [];
  var ambient = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var built = false;

  var TITLE = "JING  YAN";
  var STAR = [215, 199, 168];
  var STAR2 = [155, 51, 65];

  function size() {
    var r = hero.getBoundingClientRect();
    W = Math.floor(r.width);
    H = Math.floor(r.height);
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildParticles() {
    if (W < 40 || H < 40) return false;
    var off = document.createElement("canvas");
    off.width = W; off.height = H;
    var octx = off.getContext("2d");
    var fontSize = Math.min(Math.max(W * 0.13, 46), 150);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = "600 " + fontSize + "px 'Playfair Display', Georgia, serif";
    octx.fillText(TITLE, W / 2, H / 2);

    var data = octx.getImageData(0, 0, W, H).data;
    var gap = W < 520 ? 4 : 5;
    var next = [];
    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        if (data[(y * W + x) * 4 + 3] > 128) {
          next.push({
            hx: x, hy: y,
            x: (Math.random() * W),
            y: (Math.random() * H),
            vx: 0, vy: 0,
            size: Math.random() * 1.2 + 0.7,
            tw: Math.random() * Math.PI * 2,
            burg: Math.random() < 0.06
          });
        }
      }
    }
    if (next.length < 30) return false;   // font/layout not ready yet
    particles = next;
    return true;
  }

  function buildAmbient() {
    ambient = [];
    var n = Math.max(20, Math.round((W * H) / 14000));
    for (var i = 0; i < n; i++) {
      ambient.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.1 + 0.3,
        sp: Math.random() * 0.12 + 0.02,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  var t = 0;
  function frame() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < ambient.length; i++) {
      var p = ambient[i];
      p.y -= p.sp;
      if (p.y < -2) { p.y = H + 2; p.x = Math.random() * W; }
      var fl = 0.25 + 0.25 * Math.sin(t * 0.6 + p.ph);
      ctx.beginPath();
      ctx.fillStyle = "rgba(215,199,168," + fl.toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var j = 0; j < particles.length; j++) {
      var q = particles[j];
      var ax = (q.hx - q.x) * 0.02;
      var ay = (q.hy - q.y) * 0.02;

      if (mouse.active) {
        var dx = q.x - mouse.x, dy = q.y - mouse.y;
        var d2 = dx * dx + dy * dy, R = 90;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 0.001;
          var force = (R - d) / R;
          ax += (dx / d) * force * 1.8;
          ay += (dy / d) * force * 1.8;
        }
      }
      q.vx = (q.vx + ax) * 0.86;
      q.vy = (q.vy + ay) * 0.86;
      q.x += q.vx; q.y += q.vy;

      q.tw += 0.03;
      var tw = 0.62 + 0.38 * Math.sin(q.tw);
      var col = q.burg ? STAR2 : STAR;
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + tw.toFixed(3) + ")";
      ctx.arc(q.x, q.y, q.size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- restrained music-box audio ---------- */
  var audioCtx = null, master = null, lastNote = 0;
  var SCALE = [523.25, 587.33, 659.25, 739.99, 830.61, 987.77, 1046.50];

  function ensureAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      master = audioCtx.createGain();
      master.gain.value = 0.06;
      master.connect(audioCtx.destination);
    } catch (e) { audioCtx = null; }
  }

  function chime() {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    if (now - lastNote < 0.22) return;
    lastNote = now;
    var f = SCALE[Math.floor(Math.random() * SCALE.length)];
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = "sine"; osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    var osc2 = audioCtx.createOscillator();
    var g2 = audioCtx.createGain();
    osc2.type = "sine"; osc2.frequency.value = f * 2.01;
    g2.gain.setValueAtTime(0.0001, now);
    g2.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(g).connect(master);
    osc2.connect(g2).connect(master);
    osc.start(now); osc2.start(now);
    osc.stop(now + 1.7); osc2.stop(now + 1.2);
  }

  function onMove(e) {
    var r = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    var cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    mouse.x = cx; mouse.y = cy; mouse.active = true;
    if (!reduce) {
      ensureAudio();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
      if (audioCtx && Math.random() < 0.5) chime();
    }
  }
  function onLeave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; }

  var tries = 0;
  function tryBuild() {
    size();
    var ok = buildParticles();
    buildAmbient();
    if (!ok && tries < 40) { tries++; requestAnimationFrame(tryBuild); return; }
    if (!built) { built = true; requestAnimationFrame(frame); }
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { size(); buildParticles(); buildAmbient(); }, 200);
  });
  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("touchmove", onMove, { passive: true });
  hero.addEventListener("mouseleave", onLeave);
  hero.addEventListener("touchend", onLeave);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { size(); buildParticles(); });
  }
  window.addEventListener("load", function () { size(); buildParticles(); });

  // kick off
  requestAnimationFrame(tryBuild);
})();
