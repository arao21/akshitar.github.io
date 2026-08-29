/* Thesis explorer -------------------------------------------------------
   Three canvas panels, one per dissertation aim. Everything drawn here is a
   live simulation of the underlying model, never recorded data; the markup
   labels each panel accordingly.

   No dependencies. Colours come from the site's CSS custom properties so the
   light/dark toggle just works.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';

  var root = document.querySelector('[data-explorer]');
  if (!root) return;

  // If anything below is unsupported, reveal the static figure instead of
  // leaving an empty box on the page.
  function bail(why) {
    var fb = root.querySelector('[data-explorer-fallback]');
    if (fb) fb.hidden = false;
    root.querySelectorAll('.explorer__tabs, .explorer__panel').forEach(function (el) {
      el.hidden = true;
    });
    if (window.console && console.warn) console.warn('thesis-explorer disabled: ' + why);
  }

  try {
    var probe = document.createElement('canvas');
    if (!probe.getContext || !probe.getContext('2d') || !window.requestAnimationFrame) {
      bail('no canvas 2d / rAF');
      return;
    }
  } catch (e) {
    bail('canvas probe threw: ' + e.message);
    return;
  }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared helpers ------------------------------------------ */

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function palette() {
    return {
      ink: css('--ink', '#17181b'),
      body: css('--ink-body', '#3c4149'),
      muted: css('--muted', '#6b7078'),
      rule: css('--rule', '#e5e1d8'),
      accent: css('--accent', '#1d5c63'),
      surface: css('--surface', '#ffffff'),
      sunk: css('--surface-sunk', '#f4f2ec')
    };
  }

  // Deterministic value noise, so the figure looks identical on every load.
  function noise(seed) {
    var s = seed * 12.9898;
    var x = Math.sin(s) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }

  function smoothNoise(t, scale, seed) {
    var i = Math.floor(t * scale);
    var f = t * scale - i;
    var a = noise(i + seed * 1000);
    var b = noise(i + 1 + seed * 1000);
    var u = f * f * (3 - 2 * f);
    return a * (1 - u) + b * u;
  }

  // Cache the logical (CSS) height per canvas on first use. It must NOT be
  // re-read from the height attribute: assigning canvas.height rewrites that
  // attribute, so reading it back would multiply by devicePixelRatio on every
  // frame (330 -> 660 -> 1320 ...) until the canvas exceeds the browser's max
  // size and the renderer drops it. Invisible at dpr 1, fatal on Retina.
  var LOGICAL_H = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var logicalHeights = [];

  function logicalHeight(canvas) {
    if (LOGICAL_H) {
      if (!LOGICAL_H.has(canvas)) {
        LOGICAL_H.set(canvas, parseInt(canvas.getAttribute('height'), 10) || 320);
      }
      return LOGICAL_H.get(canvas);
    }
    for (var i = 0; i < logicalHeights.length; i++) {
      if (logicalHeights[i][0] === canvas) return logicalHeights[i][1];
    }
    var h = parseInt(canvas.getAttribute('height'), 10) || 320;
    logicalHeights.push([canvas, h]);
    return h;
  }

  function fitCanvas(canvas) {
    // Cap the backing scale: a 3x buffer buys nothing here and costs memory.
    var dpr = Math.min(2, window.devicePixelRatio || 1);

    // Measure the canvas itself (CSS width:100%), not the padded parent.
    canvas.style.width = '100%';
    var w = Math.max(200, Math.round(canvas.getBoundingClientRect().width));
    var h = logicalHeight(canvas);
    canvas.style.height = h + 'px';

    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    // Only touch the backing store when it actually changes -- assigning
    // width/height clears the canvas and reallocates the buffer.
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }

    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function label(ctx, text, x, y, colour, size, weight) {
    ctx.fillStyle = colour;
    ctx.font = (weight || 500) + ' ' + (size || 11) + 'px ' +
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(29,92,99,' + alpha + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  /* ---------- panel 01: coordination ---------------------------------- */

  var STAGES = {
    N2:  { depth: 0.55, align: 0.62, lag: 0.9,  jitter: 0.30, gastricGain: 0.85,
           amp: 'moderate', alignTxt: 'moderate', lock: 'strongest' },
    N3:  { depth: 0.85, align: 0.90, lag: 0.35, jitter: 0.16, gastricGain: 1.0,
           amp: 'highest', alignTxt: 'strong', lock: 'present' },
    REM: { depth: 0.30, align: 0.20, lag: 2.4,  jitter: 0.55, gastricGain: 0.5,
           amp: 'lowest', alignTxt: 'weak', lock: 'absent' }
  };

  var coordStage = 'N2';

  function drawCoordination(canvas, t) {
    var f = fitCanvas(canvas), ctx = f.ctx, W = f.w, H = f.h;
    var p = palette();
    var s = STAGES[coordStage];

    ctx.clearRect(0, 0, W, H);

    var padL = 12, padR = 12, padT = 4;
    var plotW = W - padL - padR;
    var laneH = (H - padT - 16) / 3;
    var WINDOW = 360;            // seconds visible
    var F_GASTRIC = 0.05;        // Hz  (~3 cycles per minute)
    var F_INFRA = 0.0075;        // Hz  (~2.2 min)

    // shared signal model ------------------------------------------------
    function infraPhase(time) { return 2 * Math.PI * F_INFRA * time; }

    function gastricEnvelope(time) {
      return 1 + s.depth * 0.55 * Math.sin(infraPhase(time));
    }

    function sigmaEnvelope(time) {
      var coupled = Math.sin(infraPhase(time) - s.lag);
      var indep = smoothNoise(time, 0.02, 7);
      return s.align * coupled + (1 - s.align) * indep;
    }

    function lane(i) { return { top: padT + i * laneH, mid: padT + i * laneH + laneH / 2 }; }

    // lane backgrounds + baselines
    for (var i = 0; i < 3; i++) {
      var L = lane(i);
      ctx.strokeStyle = p.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, Math.round(L.top + laneH - 8) + 0.5);
      ctx.lineTo(W - padR, Math.round(L.top + laneH - 8) + 0.5);
      ctx.stroke();
    }

    var N = Math.max(120, Math.round(plotW));
    var x, time, k;

    // lane 0 — cortical sigma power (filled area) -------------------------
    var L0 = lane(0);
    var base0 = L0.top + laneH - 12;
    var amp0 = laneH * 0.30;
    ctx.beginPath();
    ctx.moveTo(padL, base0);
    for (k = 0; k <= N; k++) {
      x = padL + (k / N) * plotW;
      time = t + (k / N) * WINDOW;
      var sig = sigmaEnvelope(time);
      var burst = Math.max(0, Math.sin(2 * Math.PI * 0.09 * time)) * 0.35 * (0.5 + 0.5 * sig);
      var v = 0.5 + 0.5 * sig;
      var y = base0 - (v * amp0 + burst * amp0 * 0.9 + s.jitter * amp0 * 0.25 * smoothNoise(time, 1.6, 3));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W - padR, base0);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(p.accent, 0.14);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(p.accent, 0.55);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    label(ctx, 'EEG sigma power  (11-16 Hz)', padL + 2, L0.top + 2, p.muted, 11, 600);

    // lane 1 — gastric slow wave + envelope -------------------------------
    var L1 = lane(1);
    var mid1 = L1.top + laneH / 2 - 2;
    var amp1 = laneH * 0.30;

    ctx.beginPath();
    for (k = 0; k <= N; k++) {
      x = padL + (k / N) * plotW;
      time = t + (k / N) * WINDOW;
      var env = gastricEnvelope(time) * s.gastricGain;
      var g = env * Math.sin(2 * Math.PI * F_GASTRIC * time) +
              0.06 * s.jitter * smoothNoise(time, 3.0, 11);
      ctx.lineTo(x, mid1 - g * amp1 * 0.75);
    }
    ctx.strokeStyle = p.body;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    [1, -1].forEach(function (sign) {
      ctx.beginPath();
      for (k = 0; k <= N; k++) {
        x = padL + (k / N) * plotW;
        time = t + (k / N) * WINDOW;
        var env = gastricEnvelope(time) * s.gastricGain;
        ctx.lineTo(x, mid1 - sign * env * amp1 * 0.75);
      }
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });
    label(ctx, 'Gastric slow wave  (EGG, ~0.05 Hz)', padL + 2, L1.top + 2, p.muted, 11, 600);

    // lane 2 — the two infraslow envelopes, overlaid ----------------------
    var L2 = lane(2);
    var mid2 = L2.top + laneH / 2 + 2;
    var amp2 = laneH * 0.26;

    ctx.beginPath();
    for (k = 0; k <= N; k++) {
      x = padL + (k / N) * plotW;
      time = t + (k / N) * WINDOW;
      ctx.lineTo(x, mid2 - Math.sin(infraPhase(time)) * amp2);
    }
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    for (k = 0; k <= N; k++) {
      x = padL + (k / N) * plotW;
      time = t + (k / N) * WINDOW;
      ctx.lineTo(x, mid2 - sigmaEnvelope(time) * amp2);
    }
    ctx.strokeStyle = p.muted;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);

    label(ctx, 'Infraslow envelopes  (~0.0075 Hz)', padL + 2, L2.top + 2, p.muted, 11, 600);

    // legend + time scale
    var legY = H - 13;
    ctx.beginPath(); ctx.moveTo(padL + 2, legY + 4); ctx.lineTo(padL + 20, legY + 4);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.stroke();
    label(ctx, 'gastric', padL + 25, legY - 1, p.muted, 10, 500);

    ctx.beginPath(); ctx.setLineDash([4, 4]);
    ctx.moveTo(padL + 72, legY + 4); ctx.lineTo(padL + 90, legY + 4);
    ctx.strokeStyle = p.muted; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
    label(ctx, 'cortical sigma', padL + 95, legY - 1, p.muted, 10, 500);

    ctx.textAlign = 'right';
    label(ctx, '6 min', W - padR, legY - 1, p.muted, 10, 500);
    ctx.textAlign = 'left';
  }

  function updateCoordReadout() {
    var s = STAGES[coordStage];
    var panel = root.querySelector('[data-panel="coordination"]');
    panel.querySelector('[data-out="amp"]').textContent = s.amp;
    panel.querySelector('[data-out="align"]').textContent = s.alignTxt;
    panel.querySelector('[data-out="lock"]').textContent = s.lock;
  }

  /* ---------- panel 02: intrinsic dynamics ---------------------------- */

  var beta = -0.45;
  var slBuf = [];
  var slState = { r: 1, th: 0, t: 0 };
  var SL_N = 900, SL_DT = 0.08, MU = 1, F0 = 0.05;

  function stepStuartLandau(steps) {
    for (var i = 0; i < steps; i++) {
      var r = slState.r;
      // Amplitude relaxes toward the limit cycle under smooth (correlated)
      // forcing, so the envelope wanders slowly instead of looking like hash.
      var drift = 2.0 * r * (MU - r * r);
      var force = 1.75 * smoothNoise(slState.t, 0.11, 5) + 0.55 * smoothNoise(slState.t, 0.33, 9);
      r = Math.min(1.7, Math.max(0.4, r + SL_DT * (drift + force)));

      // Phase-shear: instantaneous frequency depends on amplitude.
      var fTrue = F0 * (1 + beta * (r * r - MU));
      slState.th += 2 * Math.PI * fTrue * SL_DT;
      slState.t += SL_DT;
      slState.r = r;

      // What an estimator actually recovers is noisy, so the amplitude-vs-
      // frequency cloud has spread around the model line rather than sitting
      // exactly on it.
      var fMeas = fTrue + 0.0035 * noise(Math.round(slState.t * 53));

      slBuf.push({ x: r * Math.cos(slState.th), r: r, f: fTrue, fm: fMeas });
      if (slBuf.length > SL_N) slBuf.shift();
    }
  }

  // Recompute the frequency mapping over the buffered amplitudes. Keeping the
  // amplitude trace and re-deriving frequency is exactly the comparison the
  // panel is making, and it avoids the waveform jumping while dragging beta.
  function remapFrequencies() {
    for (var i = 0; i < slBuf.length; i++) {
      var r = slBuf[i].r;
      slBuf[i].f = F0 * (1 + beta * (r * r - MU));
      slBuf[i].fm = slBuf[i].f + 0.0035 * noise(i * 7 + 3);
    }
  }

  function drawDynamics(canvas) {
    var f = fitCanvas(canvas), ctx = f.ctx, W = f.w, H = f.h;
    var p = palette();
    ctx.clearRect(0, 0, W, H);

    if (slBuf.length < 40) return;

    var gap = 18;
    var rightW = Math.min(190, Math.max(140, W * 0.34));
    var leftW = W - rightW - gap;
    var padT = 22, padB = 26;
    var plotH = H - padT - padB;

    // ---- left: waveform ------------------------------------------------
    label(ctx, 'Simulated gastric-band signal', 2, 2, p.muted, 11, 600);

    var mid = padT + plotH / 2;
    var ampPx = plotH * 0.34;

    ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, Math.round(mid) + 0.5); ctx.lineTo(leftW, Math.round(mid) + 0.5); ctx.stroke();

    // amplitude envelope
    [1, -1].forEach(function (sign) {
      ctx.beginPath();
      for (var i = 0; i < slBuf.length; i++) {
        ctx.lineTo((i / (slBuf.length - 1)) * leftW, mid - sign * slBuf[i].r * ampPx * 0.8);
      }
      ctx.strokeStyle = hexToRgba(p.accent, 0.35);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });

    // the oscillation itself, coloured by instantaneous frequency
    ctx.beginPath();
    for (var i = 0; i < slBuf.length; i++) {
      ctx.lineTo((i / (slBuf.length - 1)) * leftW, mid - slBuf[i].x * ampPx * 0.8);
    }
    ctx.strokeStyle = p.body;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    label(ctx, 'high amplitude', 2, H - 16, p.muted, 10, 500);
    ctx.textAlign = 'right';
    label(ctx, beta < -0.02 ? '→ slower cycles'
              : beta > 0.02 ? '→ faster cycles'
              : '→ no frequency change',
          leftW, H - 16, p.accent, 10, 600);
    ctx.textAlign = 'left';

    // ---- right: amplitude vs instantaneous frequency -------------------
    var rx = leftW + gap;
    label(ctx, 'Amplitude vs frequency', rx, 2, p.muted, 11, 600);

    var bx = rx + 26, by = padT + 6, bw = rightW - 34, bh = plotH - 12;

    ctx.strokeStyle = p.rule; ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 6); ctx.stroke();

    // Fixed axes on purpose: auto-scaling would renormalise away the slope,
    // which is exactly the quantity beta controls.
    var rMin = 0.38, rMax = 1.72;
    var lo = 0.0, hi = 0.10;

    function px(r) { return bx + ((r - rMin) / (rMax - rMin)) * bw; }
    function py(fv) { return by + bh - ((fv - lo) / (hi - lo)) * bh; }

    // nominal frequency reference
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(bx, py(F0));
    ctx.lineTo(bx + bw, py(F0));
    ctx.strokeStyle = p.rule;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'right';
    label(ctx, '0.05 Hz', bx + bw - 4, py(F0) - 12, p.muted, 9, 500);
    ctx.textAlign = 'left';

    for (var j = 0; j < slBuf.length; j += 3) {
      var d = slBuf[j];
      if (d.r < rMin || d.r > rMax) continue;
      ctx.beginPath();
      ctx.arc(px(d.r), Math.max(by + 1, Math.min(by + bh - 1, py(d.fm))), 1.7, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.accent, 0.32);
      ctx.fill();
    }

    // the model line: f = F0 (1 + beta (r^2 - mu))
    ctx.beginPath();
    for (var q = 0; q <= 40; q++) {
      var rr = rMin + (q / 40) * (rMax - rMin);
      ctx.lineTo(px(rr), py(F0 * (1 + beta * (rr * rr - MU))));
    }
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(rx + 8, by + bh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    label(ctx, 'frequency', 0, -6, p.muted, 10, 500);
    ctx.restore();
    ctx.textAlign = 'center';
    label(ctx, 'amplitude', bx + bw / 2, by + bh + 6, p.muted, 10, 500);
    ctx.textAlign = 'left';
  }

  function updateDynamicsReadout() {
    var panel = root.querySelector('[data-panel="dynamics"]');
    panel.querySelector('[data-out="beta"]').textContent = beta.toFixed(2);
    panel.querySelector('[data-out="sense"]').textContent =
      beta < -0.02 ? 'stronger → slower' :
      beta > 0.02 ? 'stronger → faster' : 'uncoupled';
  }

  /* ---------- panel 03: ambulatory ------------------------------------ */

  var setting = 'lab';
  var SETTINGS = {
    lab:  { channels: '64 EEG + EGG', nights: '1-2', burden: 'high (overnight in lab)', cells: 2, dots: 64 },
    home: { channels: '2 abdominal',  nights: '6 over a month', burden: 'low (self-applied at home)', cells: 6, dots: 2 }
  };

  function drawAmbulatory(canvas, t) {
    var f = fitCanvas(canvas), ctx = f.ctx, W = f.w, H = f.h;
    var p = palette();
    var cfg = SETTINGS[setting];
    ctx.clearRect(0, 0, W, H);

    label(ctx, setting === 'lab' ? 'One night, dense instrumentation'
                                 : 'Repeated nights, minimal instrumentation',
          2, 2, p.muted, 11, 600);

    // calendar strip: 4 weeks x 7 nights
    var cols = 7, rows = 4;
    var gridTop = 30;
    var gridH = H - gridTop - 74;
    var cw = (W - (cols - 1) * 6) / cols;
    var ch = Math.min(40, (gridH - (rows - 1) * 6) / rows);

    var recorded = setting === 'lab' ? [3] : [2, 6, 11, 16, 21, 25];
    var pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6);

    for (var d = 0; d < cols * rows; d++) {
      var cx = (d % cols) * (cw + 6);
      var cy = gridTop + Math.floor(d / cols) * (ch + 6);
      var on = recorded.indexOf(d) !== -1;
      roundRect(ctx, cx, cy, cw, ch, 5);
      if (on) {
        ctx.fillStyle = hexToRgba(p.accent, 0.22 + 0.3 * pulse);
        ctx.fill();
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else {
        ctx.fillStyle = p.sunk;
        ctx.fill();
        ctx.strokeStyle = p.rule;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    label(ctx, recorded.length + (recorded.length === 1 ? ' recording night' : ' recording nights') + ' in a month',
          2, gridTop + rows * (ch + 6) + 2, p.muted, 10, 500);

    // sensor schematic
    var sy = H - 46;
    label(ctx, 'Sensors on the participant', 2, sy - 16, p.muted, 11, 600);

    var n = cfg.dots;
    var perRow = Math.min(n, 32);
    var dotR = n > 8 ? 2.6 : 5;
    var spacing = n > 8 ? 9 : 20;
    for (var i2 = 0; i2 < n; i2++) {
      var col = i2 % perRow, row2 = Math.floor(i2 / perRow);
      ctx.beginPath();
      ctx.arc(4 + dotR + col * spacing, sy + 8 + row2 * 12, dotR, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(p.accent, n > 8 ? 0.45 : 0.8);
      ctx.fill();
    }
    ctx.textAlign = 'right';
    label(ctx, cfg.channels, W - 2, sy + 2, p.accent, 11, 600);
    ctx.textAlign = 'left';
  }

  function updateAmbulatoryReadout() {
    var cfg = SETTINGS[setting];
    var panel = root.querySelector('[data-panel="ambulatory"]');
    panel.querySelector('[data-out="channels"]').textContent = cfg.channels;
    panel.querySelector('[data-out="nights"]').textContent = cfg.nights;
    panel.querySelector('[data-out="burden"]').textContent = cfg.burden;
  }

  /* ---------- tab plumbing + animation loop --------------------------- */

  var active = 'coordination';
  var visible = true;
  var t0 = null;
  var lastElapsed = 0;

  var canvases = {
    coordination: root.querySelector('[data-canvas="coordination"]'),
    dynamics: root.querySelector('[data-canvas="dynamics"]'),
    ambulatory: root.querySelector('[data-canvas="ambulatory"]')
  };

  var renderFailed = false;
  function render(elapsed) {
    if (renderFailed) return;
    try {
      if (active === 'coordination') drawCoordination(canvases.coordination, elapsed * 12);
      else if (active === 'dynamics') drawDynamics(canvases.dynamics);
      else drawAmbulatory(canvases.ambulatory, elapsed);
    } catch (e) {
      renderFailed = true;
      bail('draw error: ' + e.message);
    }
  }

  function frame(ts) {
    if (t0 === null) t0 = ts;
    var elapsed = (ts - t0) / 1000;
    lastElapsed = elapsed;
    if (visible) {
      if (active === 'dynamics') stepStuartLandau(3);
      render(elapsed);
    }
    requestAnimationFrame(frame);
  }

  function setTab(name) {
    active = name;
    root.querySelectorAll('.explorer__tab').forEach(function (b) {
      var on = b.getAttribute('data-tab') === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.classList.toggle('is-active', on);
    });
    root.querySelectorAll('.explorer__panel').forEach(function (pn) {
      pn.hidden = pn.getAttribute('data-panel') !== name;
    });
    render(0.001);
  }

  root.querySelectorAll('.explorer__tab').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
  });

  root.querySelectorAll('[data-stage]').forEach(function (b) {
    b.addEventListener('click', function () {
      coordStage = b.getAttribute('data-stage');
      root.querySelectorAll('[data-stage]').forEach(function (o) { o.classList.remove('is-active'); });
      b.classList.add('is-active');
      updateCoordReadout();
      render(lastElapsed);
    });
  });

  var slider = root.querySelector('[data-beta]');
  if (slider) {
    slider.addEventListener('input', function () {
      beta = parseFloat(slider.value);
      root.querySelectorAll('[data-preset]').forEach(function (o) {
        o.classList.toggle('is-active', Math.abs(parseFloat(o.getAttribute('data-preset')) - beta) < 0.005);
      });
      updateDynamicsReadout();
      remapFrequencies();
      render(lastElapsed);
    });
  }

  root.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      beta = parseFloat(b.getAttribute('data-preset'));
      if (slider) slider.value = beta;
      root.querySelectorAll('[data-preset]').forEach(function (o) { o.classList.remove('is-active'); });
      b.classList.add('is-active');
      updateDynamicsReadout();
      remapFrequencies();
      render(lastElapsed);
    });
  });

  root.querySelectorAll('[data-setting]').forEach(function (b) {
    b.addEventListener('click', function () {
      setting = b.getAttribute('data-setting');
      root.querySelectorAll('[data-setting]').forEach(function (o) { o.classList.remove('is-active'); });
      b.classList.add('is-active');
      updateAmbulatoryReadout();
      render(lastElapsed);
    });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(root);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { render(lastElapsed); }, 120);
  });

  // A first render can land before layout or webfonts settle, which would
  // leave a mis-sized or blank canvas that never corrects itself when the
  // animation loop is paused. Redraw on both signals.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { render(lastElapsed); });
    root.querySelectorAll('.explorer__viz').forEach(function (el) { ro.observe(el); });
  }

  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { render(lastElapsed); });
  }

  window.addEventListener('load', function () { render(lastElapsed); });

  new MutationObserver(function () { render(0.001); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  updateCoordReadout();
  updateDynamicsReadout();
  updateAmbulatoryReadout();
  stepStuartLandau(SL_N);

  if (reduceMotion) {
    setTab('coordination');
    render(3);
  } else {
    setTab('coordination');
    requestAnimationFrame(frame);
  }
})();
