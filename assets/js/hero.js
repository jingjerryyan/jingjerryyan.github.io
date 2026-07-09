/* ============================================================
   Hero particle landing — "JING YAN" star-dust title
   Full-screen canvas, mouse-scatter, and an interactive
   music-box melody (original, Debussy-flavoured, restrained).
   Vanilla Web Audio — no external dependencies.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.querySelector(".site-bg__canvas") || document.querySelector(".hero__canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var host = canvas.closest(".hero") || canvas.parentElement;
  var siteWide = canvas.classList.contains("site-bg__canvas");
  var isHome = !!document.querySelector(".hero--full");
  var hero = host;

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var particles = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var STAR = [92, 74, 60];     // charcoal ink (reads on ivory)
  var ACCENT = [123, 34, 48];   // burgundy (scatter glow)

  function sizeCanvas() {
    var r = hero.getBoundingClientRect();
    W = Math.max(320, Math.floor(siteWide ? window.innerWidth : r.width));
    H = Math.max(320, Math.floor(siteWide ? window.innerHeight : r.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function buildParticles() {
    // Ambient star-dust field (no text) — density scales with area.
    var count = Math.round((W * H) / 5200);
    count = Math.max(90, Math.min(300, count));
    particles = [];
    for (var i = 0; i < count; i++) {
      var x = Math.random() * W, y = Math.random() * H;
      particles.push({
        hx: x, hy: y,                              // anchor position
        x: x, y: y,
        vx: 0, vy: 0,
        drift: Math.random() * Math.PI * 2,        // slow orbit phase
        driftR: 6 + Math.random() * 16,            // orbit radius
        size: Math.random() * 1.3 + 0.4,
        tw: Math.random() * Math.PI * 2            // twinkle phase
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    var t = performance.now() * 0.001;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // gentle spring toward a slowly orbiting anchor
      var tx = p.hx + Math.cos(t * 0.15 + p.drift) * p.driftR;
      var ty = p.hy + Math.sin(t * 0.15 + p.drift) * p.driftR;
      var dx = tx - p.x, dy = ty - p.y;
      p.vx += dx * 0.008;
      p.vy += dy * 0.008;
      // mouse repulsion — scatter like star-dust
      if (mouse.active) {
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        var d2 = mdx * mdx + mdy * mdy;
        var R = 85;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) || 1;
          var f = (R - d) / R;
          p.vx += (mdx / d) * f * 4.6;
          p.vy += (mdy / d) * f * 4.6;
        }
      }
      p.vx *= 0.88; p.vy *= 0.88;   // heavier damping = slower, softer
      p.x += p.vx; p.y += p.vy;

      var tw = 0.32 + 0.30 * Math.sin(t * 1.4 + p.tw);
      var col = (Math.abs(p.vx) + Math.abs(p.vy) > 2.2) ? ACCENT : STAR;
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + tw.toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }

  /* ============================================================
     Music-box melody engine (original, restrained, ethereal)
     ------------------------------------------------------------
     An original phrase built from whole-tone + pentatonic cells,
     so it drifts without a strong tonal pull — a Debussy-ish haze.
     Each mouse move across the title plays the *next* note, so a
     visitor is gently "winding" the music box by hand.
     ============================================================ */

  // Original melodic line (note names). Cool / floating palette.
  var MELODY = [
    "Db5","Eb5","Gb5","Ab5","Bb5","Ab5","Gb5","Eb5",
    "Db5","F5","Ab5","Db6","Bb5","Ab5","F5","Eb5",
    "Gb5","Ab5","Bb5","Db6","Eb6","Db6","Bb5","Ab5",
    "F5","Eb5","Db5","Bb4","Ab4","Bb4","Db5","Eb5",
    // whole-tone drift — dreamy, no home key
    "C5","D5","E5","Gb5","Ab5","Bb5","Ab5","Gb5",
    "E5","D5","C5","Bb4","Ab4","Gb4","Ab4","Bb4",
    "Db5","Eb5","F5","Ab5","Bb5","Db6","Bb5","Ab5",
    "F5","Eb5","Db5","Ab4","F4","Ab4","Db5","F5"
  ];

  function noteToFreq(name) {
    var m = /^([A-G])([b#]?)(\d)$/.exec(name);
    if (!m) return 440;
    var base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    if (m[2] === "#") base += 1;
    else if (m[2] === "b") base -= 1;
    var midi = base + (parseInt(m[3], 10) + 1) * 12; // MIDI number
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  var FREQS = MELODY.map(noteToFreq);

  var actx = null, master = null, lowpass = null, verbWet = null, delayWet = null;
  var unlocked = false;

  function makeImpulse(seconds, decay) {
    var rate = actx.sampleRate;
    var len = Math.floor(rate * seconds);
    var buf = actx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var data = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function ensureAudio() {
    if (actx) return;
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();

      master = actx.createGain();
      master.gain.value = 0.085;            // very soft overall

      // shared warm low-pass to shave any harshness
      lowpass = actx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 3600;
      lowpass.Q.value = 0.4;

      // long, deep reverb for space
      var reverb = actx.createConvolver();
      reverb.buffer = makeImpulse(6.0, 3.2);
      verbWet = actx.createGain();
      verbWet.gain.value = 0.6;

      // faint echo tail
      var delay = actx.createDelay(1.0);
      delay.delayTime.value = 0.34;
      var fb = actx.createGain();
      fb.gain.value = 0.28;
      delayWet = actx.createGain();
      delayWet.gain.value = 0.16;

      // routing: notes -> lowpass -> (dry + reverb + delay) -> master -> out
      lowpass.connect(master);
      lowpass.connect(verbWet); verbWet.connect(reverb); reverb.connect(master);
      lowpass.connect(delayWet); delayWet.connect(delay);
      delay.connect(fb); fb.connect(delay); delay.connect(master);

      master.connect(actx.destination);
    } catch (e) { actx = null; }
  }

  // one music-box "ding": sine fundamental + quiet octave shimmer
  function voice(freq, when, vel) {
    var g = actx.createGain();
    g.connect(lowpass);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vel, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.9);

    var o1 = actx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = freq;

    var sg = actx.createGain();
    sg.gain.value = 0.28;                  // shimmer layer is dim
    sg.connect(g);
    var o2 = actx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq * 2;         // one octave up = metallic sheen

    o1.connect(g);
    o2.connect(sg);
    o1.start(when); o2.start(when);
    o1.stop(when + 2.0); o2.stop(when + 1.2);
  }

  var idx = 0;
  function trigger() {
    if (!actx) return;
    var now = actx.currentTime;
    var f = FREQS[idx % FREQS.length];
    idx++;
    var vel = 0.5 + Math.random() * 0.22;  // slight human-ish dynamics
    voice(f, now, vel);
  }

  var lastTime = 0, lastX = 0, lastY = 0;
  var MIN_INTERVAL = 260;   // ms between notes — restrained
  var MIN_DISTANCE = 26;    // px of travel before the next note

  function toLocal(e) {
    var r = canvas.getBoundingClientRect();
    var cx = (e.touches ? e.touches[0].clientX : e.clientX);
    var cy = (e.touches ? e.touches[0].clientY : e.clientY);
    mouse.x = cx - r.left;
    mouse.y = cy - r.top;
    mouse.active = true;
    return { cx: cx, cy: cy };
  }

  function onMove(e) {
    var pt = toLocal(e);
    if (!isHome) return;            // scatter everywhere, music only on Home
    ensureAudio();
    if (actx && actx.state === "suspended") actx.resume();
    if (!unlocked) return;
    var now = performance.now();
    var dist = Math.hypot(pt.cx - lastX, pt.cy - lastY);
    if (now - lastTime < MIN_INTERVAL || dist < MIN_DISTANCE) return;
    lastTime = now; lastX = pt.cx; lastY = pt.cy;
    trigger();
  }

  // Browsers require a user gesture before audio; unlock on first tap/key.
  function unlock() {
    if (!isHome) return;
    ensureAudio();
    if (actx && actx.state === "suspended") actx.resume();
    unlocked = true;
    var s = document.querySelector(".hero__status");
    if (s) s.classList.add("is-armed");
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("mousemove", unlock);
    window.removeEventListener("pointermove", unlock);
    window.removeEventListener("touchstart", unlock);
  }
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  window.addEventListener("mousemove", unlock);
  window.addEventListener("pointermove", unlock);
  window.addEventListener("touchstart", unlock, { passive: true });

  var evtTarget = siteWide ? window : hero;
  evtTarget.addEventListener("mousemove", onMove);
  evtTarget.addEventListener("mouseleave", function () {
    mouse.active = false; mouse.x = mouse.y = -9999;
  });
  evtTarget.addEventListener("touchmove", function (e) { onMove(e); }, { passive: true });

  function rebuild() { sizeCanvas(); buildParticles(); }

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(rebuild, 180); });

  function boot() {
    rebuild();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { rebuild(); });
    }
    setTimeout(rebuild, 600);
    requestAnimationFrame(step);
  }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
  boot();
})();
