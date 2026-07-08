/* ============================================================
   Hero particle landing — "JING YAN" star-dust title
   Full-screen canvas, mouse-scatter, gentle ambient tones.
   ============================================================ */
(function () {
  "use strict";
  var TITLE = "JING YAN";
  var canvas = document.querySelector(".hero__canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var hero = canvas.closest(".hero") || canvas.parentElement;

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var STAR = [231, 211, 176];   // warm gold
  var ACCENT = [155, 51, 65];   // burgundy

  function sizeCanvas() {
    var r = hero.getBoundingClientRect();
    W = Math.max(320, Math.floor(r.width));
    H = Math.max(320, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function buildParticles() {
    // Draw the title into an offscreen buffer, then sample pixels
    var off = document.createElement("canvas");
    off.width = W; off.height = H;
    var octx = off.getContext("2d");
    var fontSize = Math.min(W / (TITLE.length * 0.62), H * 0.34);
    fontSize = Math.max(40, fontSize);
    octx.fillStyle = "#fff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = "700 " + fontSize + 'px "Playfair Display", Georgia, serif';
    octx.fillText(TITLE, W / 2, H / 2);

    var img = octx.getImageData(0, 0, W, H).data;
    var gap = Math.max(3, Math.round(fontSize / 26));
    var targets = [];
    for (var y = 0; y < H; y += gap) {
      for (var x = 0; x < W; x += gap) {
        var a = img[(y * W + x) * 4 + 3];
        if (a > 128) targets.push({ x: x, y: y });
      }
    }
    // Reconcile particle array with targets
    particles = targets.map(function (t) {
      return {
        hx: t.x, hy: t.y,                       // home position
        x: Math.random() * W, y: Math.random() * H,
        vx: 0, vy: 0,
        size: Math.random() * 1.4 + 0.6,
        tw: Math.random() * Math.PI * 2          // twinkle phase
      };
    });
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    var t = performance.now() * 0.001;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // spring back home
      var dx = p.hx - p.x, dy = p.hy - p.y;
      p.vx += dx * 0.012;
      p.vy += dy * 0.012;
      // mouse repulsion (scatter like stardust)
      if (mouse.active) {
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        var d2 = mdx * mdx + mdy * mdy;
        var R = 120;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 1;
          var f = (R - d) / R;
          p.vx += (mdx / d) * f * 5.5;
          p.vy += (mdy / d) * f * 5.5;
        }
      }
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;

      var tw = 0.55 + 0.45 * Math.sin(t * 1.6 + p.tw);
      var col = (Math.abs(p.vx) + Math.abs(p.vy) > 2.5) ? ACCENT : STAR;
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + tw.toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }

  // ---- gentle ambient audio (music-box-ish), very restrained ----
  var actx = null, master = null;
  var SCALE = [523.25, 587.33, 659.25, 783.99, 880.0]; // C D E G A (pentatonic)
  var lastNote = 0;
  function ensureAudio() {
    if (actx) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      master = actx.createGain();
      master.gain.value = 0.06;      // very soft
      master.connect(actx.destination);
    } catch (e) { actx = null; }
  }
  function pluck() {
    if (!actx) return;
    var now = actx.currentTime;
    if (now - lastNote < 0.16) return;
    lastNote = now;
    var f = SCALE[Math.floor(Math.random() * SCALE.length)];
    var o = actx.createOscillator();
    var g = actx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    o.connect(g); g.connect(master);
    o.start(now); o.stop(now + 1.7);
  }

  function toLocal(e) {
    var r = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX);
    var cy = (e.touches ? e.touches[0].clientY : e.clientY);
    mouse.x = cx - r.left;
    mouse.y = cy - r.top;
    mouse.active = true;
  }

  hero.addEventListener("mousemove", function (e) {
    toLocal(e);
    ensureAudio();
    if (actx && actx.state === "suspended") actx.resume();
    if (Math.random() < 0.14) pluck();
  });
  hero.addEventListener("mouseleave", function () { mouse.active = false; mouse.x = mouse.y = -9999; });
  hero.addEventListener("touchmove", function (e) { toLocal(e); ensureAudio(); if (actx && actx.state === "suspended") actx.resume(); }, { passive: true });

  function rebuild() { sizeCanvas(); buildParticles(); }

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(rebuild, 180); });

  function boot() {
    rebuild();
    // rebuild once fonts are ready (Playfair may load late)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { rebuild(); });
    }
    setTimeout(rebuild, 600);
    requestAnimationFrame(step);
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
  // also try immediately
  boot();
})();
