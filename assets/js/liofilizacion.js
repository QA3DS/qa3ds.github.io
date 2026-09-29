/* Animación del proceso de liofilización (sección Proyecto).
   Un único reloj `t` (ms) recorre cuatro etapas; cada cuadro se dibuja como
   función de t, así que saltar de etapa o pausar no deja estados a medias.
   Valores de referencia de los ensayos del PID: condensador ~ −40 °C,
   presión 1–2 mmHg, muestra de 50 g que pierde más del 92 % de su peso. */
(() => {
  const root = document.getElementById('lio-anim');
  if (!root) return;

  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const mk = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Recorre una poligonal según la fracción u (0–1) de su longitud.
  const along = (pts, u) => {
    const lens = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lens.push(d);
      total += d;
    }
    let d = clamp(u) * total;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const k = lens[i] ? clamp(d / lens[i]) : 1;
        return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
      }
      d -= lens[i];
    }
  };
  const hex = r =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    }).join(' ');

  /* ---------- Etapas ---------- */
  const STAGES = [
    { dur: 5500, text: 'El ruibarbo fresco es casi un 94 % agua. Primero lo congelamos entre −18 y −25 °C: el agua de sus células se transforma en pequeños cristales de hielo.' },
    { dur: 5000, text: 'En la cámara del liofilizador, una bomba extrae el aire. La presión baja a 1–2 mmHg (unas 500 veces menos que la atmosférica), por debajo del punto triple del agua: en esas condiciones el hielo ya no puede derretirse.' },
    { dur: 9500, text: 'Con un aporte suave de calor, el hielo pasa directamente a vapor sin volverse líquido: eso es la sublimación. El vapor viaja hasta el condensador, a unos −40 °C, donde vuelve a congelarse como escarcha.' },
    { dur: 5000, text: 'Queda un producto seco, liviano y poroso que conserva su forma: una muestra de 50 g termina pesando menos de 4 g. Como el agua nunca pasó a líquido ni se usaron altas temperaturas, se evita buena parte del daño que produce el secado convencional.' },
  ];
  const START = [];
  let acc = 0;
  for (const s of STAGES) { START.push(acc); acc += s.dur; }
  const TOTAL = acc;
  const HOLD = 1800;

  /* ---------- Geometría de la escena ---------- */
  const P = { x: 70, y: 160, w: 180, h: 86 };
  const PIPE = [[300, 100], [362, 100]];
  const coilPts = [];
  for (let i = 0; i < 8; i++) {
    const y = 70 + i * 27;
    coilPts.push(i % 2 ? [485, y] : [385, y], i % 2 ? [385, y] : [485, y]);
  }
  $('lio-coil').setAttribute('d', 'M' + coilPts.map(p => p.join(' ')).join(' L'));

  const layer = $('lio-particles');
  const poreLayer = $('lio-pores');
  const frostLayer = $('lio-frost');

  // Agua dentro del ruibarbo: el frente de sublimación avanza desde la superficie.
  const water = [];
  const COLS = 6, ROWS = 3;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = P.x + 20 + (c * (P.w - 40)) / (COLS - 1) + (rnd() - 0.5) * 8;
      const y = P.y + 18 + (r * (P.h - 36)) / (ROWS - 1) + (rnd() - 0.5) * 8;
      water.push({ x, y, depth: Math.min(x - P.x, P.x + P.w - x, y - P.y) });
    }
  }
  const minDepth = Math.min(...water.map(w => w.depth));
  const maxDepth = Math.max(...water.map(w => w.depth));
  water.forEach((w, i) => {
    w.start = 0.08 + 0.6 * ((w.depth - minDepth) / (maxDepth - minDepth)) + rnd() * 0.04;
    w.phase = rnd() * 6.28;
    const f = along(coilPts, (i + 0.5) / water.length);
    w.frostAt = [f[0] + (rnd() - 0.5) * 6, f[1] + (rnd() - 0.5) * 6];
    w.path = [[w.x, w.y], [w.x, P.y - 22], [292, 100], PIPE[1], [w.frostAt[0], Math.min(w.frostAt[1], 120)], w.frostAt];
    w.pore = mk('ellipse', { cx: w.x, cy: w.y, rx: 4.6, ry: 3.6, class: 'lio-pore', opacity: 0 }, poreLayer);
    w.g = mk('g', {}, layer);
    w.drop = mk('circle', { r: 4.3, class: 'lio-drop' }, w.g);
    w.ice = mk('polygon', { points: hex(5.4), class: 'lio-ice', opacity: 0 }, w.g);
    w.vapor = mk('circle', { r: 3.2, class: 'lio-vapor', opacity: 0 }, layer);
    w.frost = mk('polygon', { points: hex(4.6), class: 'lio-frost', opacity: 0, transform: `translate(${w.frostAt[0]} ${w.frostAt[1]})` }, frostLayer);
  });
  const TRAVEL = 0.2;

  // Moléculas de aire en la cámara.
  const air = [];
  for (let j = 0; j < 12; j++) {
    const x = 40 + rnd() * 240, y = 56 + rnd() * 80;
    air.push({
      x, y,
      start: 0.04 + (0.62 * j) / 12,
      phase: rnd() * 6.28,
      path: [[x, y], [292, 100], PIPE[1], [435, 150], [435, 300], [435, 334]],
      el: mk('circle', { r: 3.4, class: 'lio-air' }, layer),
    });
  }

  /* ---------- Diagrama de fases ---------- */
  // T: −40…40 °C; P en escala log: 0,05…2000 mmHg. Curvas por Clausius-Clapeyron
  // alrededor del punto triple (0,01 °C; 4,58 mmHg).
  const g = $('lio-phase-g');
  const X = T => 44 + ((T + 40) / 80) * 244;
  const LOGMIN = -1.3, LOGMAX = 3.3;
  const Y = p => 214 - ((Math.log10(p) - LOGMIN) / (LOGMAX - LOGMIN)) * 196;
  const psat = (T, k) => 4.58 * Math.exp(-k * (1 / (T + 273.15) - 1 / 273.16));
  const curve = (t0, t1, k) => {
    const pts = [];
    for (let T = t0; T <= t1 + 1e-9; T += 1) pts.push(`${X(T).toFixed(1)},${Y(psat(T, k)).toFixed(1)}`);
    return 'M' + pts.join(' L');
  };
  mk('rect', { x: 44, y: 18, width: 244, height: 196, fill: '#fbfaf7', stroke: '#dcd8cf' }, g);
  mk('path', { d: curve(-40, 0, 6134), class: 'lio-curve' }, g); // sublimación
  mk('path', { d: curve(0, 40, 5412), class: 'lio-curve' }, g); // vaporización
  mk('path', { d: `M${X(0)} ${Y(4.58)} L${X(-0.6)} 18`, class: 'lio-curve' }, g); // fusión
  mk('circle', { cx: X(0), cy: Y(4.58), r: 3, fill: '#15212c' }, g);
  const t = (x, y, s, attrs = {}) => { const e = mk('text', { x, y, class: 'lio-label', ...attrs }, g); e.textContent = s; return e; };
  t(90, 70, 'Sólido', { class: 'lio-region', 'text-anchor': 'middle' });
  t(222, 60, 'Líquido', { class: 'lio-region', 'text-anchor': 'middle' });
  t(232, 190, 'Vapor', { class: 'lio-region', 'text-anchor': 'middle' });
  t(X(0) - 6, Y(4.58) - 8, 'punto triple', { class: 'lio-small', 'text-anchor': 'end' });
  t(166, 242, 'Temperatura', { 'text-anchor': 'middle' });
  t(14, 116, 'Presión', { 'text-anchor': 'middle', transform: 'rotate(-90 14 116)' });
  for (const T of [-40, -20, 0, 20, 40]) t(X(T), 228, `${T}°`, { class: 'lio-small', 'text-anchor': 'middle' });
  for (const [p, s] of [[760, '760'], [1.5, '1,5']]) {
    mk('line', { x1: 40, x2: 44, y1: Y(p), y2: Y(p), stroke: '#8a9aa8' }, g);
    t(38, Y(p) + 4, s, { class: 'lio-small', 'text-anchor': 'end' });
  }
  const ROUTE = [[20, 760], [-20, 760], [-20, 1.5], [-13, 1.5], [15, 1.5]];
  mk('path', { d: 'M' + ROUTE.map(([T, p]) => `${X(T)} ${Y(p)}`).join(' L'), class: 'lio-route' }, g);
  const halo = mk('circle', { r: 9, fill: '#b3304a', opacity: 0.18 }, g);
  const dot = mk('circle', { r: 5, fill: '#b3304a', stroke: '#fff', 'stroke-width': 1.5 }, g);

  /* ---------- Estado en función del tiempo ---------- */
  const stageAt = time => {
    for (let i = STAGES.length - 1; i >= 0; i--) if (time >= START[i]) return [i, clamp((time - START[i]) / STAGES[i].dur)];
    return [0, 0];
  };

  const els = {
    piece: $('lio-piece'), pieceLabel: $('lio-piece-label'), chamberLabel: $('lio-chamber-label'),
    freezer: $('lio-freezer'), heat: $('lio-heat'), coil: $('lio-coil'), fan: $('lio-fan'),
    T: $('lio-t'), P: $('lio-p'), M: $('lio-m'), text: $('lio-text'),
    tabs: [...root.querySelectorAll('.lio-tab')], play: root.querySelector('.lio-play'),
  };
  const fresh = [200, 63, 88], dried = [233, 190, 196];
  const fmt = n => String(n).replace('-', '−').replace('.', ',');

  let fanAngle = 0;
  let lastStage = -1;

  function render(time, wall, dt) {
    const [i, p] = stageAt(Math.min(time, TOTAL - 1));
    const f = i > 0 ? 1 : ease(clamp(p * 1.25));          // congelado
    const v = i < 1 ? 0 : i > 1 ? 1 : ease(clamp(p * 1.2)); // vacío
    const s = i < 2 ? 0 : i > 2 ? 1 : p;                   // sublimación
    const r = i < 3 ? 0 : ease(clamp(p * 1.5));            // resultado
    const jig = reduce ? 0 : 1;

    // Temperatura: se congela, meseta durante la sublimación, se calienta al final.
    let T;
    if (i === 0) T = lerp(20, -20, f);
    else if (i === 1) T = -20;
    else if (i === 2) T = s < 0.1 ? lerp(-20, -13, s / 0.1) : s < 0.8 ? -13 : lerp(-13, 15, (s - 0.8) / 0.2);
    else T = 15;
    const pres = Math.pow(10, lerp(Math.log10(760), Math.log10(1.5), v));

    // Agua / hielo / vapor / escarcha
    let gone = 0;
    for (const w of water) {
      const u = (s - w.start) / TRAVEL;
      if (u < 0) {
        const a = (1 - f) * 1.6 * jig;
        w.g.setAttribute('transform', `translate(${w.x + a * Math.sin(wall * 0.004 + w.phase)} ${w.y + a * Math.cos(wall * 0.005 + w.phase)})`);
        w.g.setAttribute('opacity', 1);
        w.drop.setAttribute('opacity', 1 - f);
        w.ice.setAttribute('opacity', f);
        w.pore.setAttribute('opacity', 0);
        w.vapor.setAttribute('opacity', 0);
        w.frost.setAttribute('opacity', 0);
      } else {
        w.g.setAttribute('opacity', 0);
        w.pore.setAttribute('opacity', 0.55 * clamp(u * 3));
        if (u < 1) {
          const [x, y] = along(w.path, ease(u));
          w.vapor.setAttribute('cx', x);
          w.vapor.setAttribute('cy', y);
          w.vapor.setAttribute('opacity', 0.9);
          w.frost.setAttribute('opacity', 0);
        } else {
          w.vapor.setAttribute('opacity', 0);
          w.frost.setAttribute('opacity', 1);
        }
        gone += clamp(u);
      }
    }
    const mass = 50 - 46.25 * (gone / water.length); // ~92,5 % de pérdida: entre 92 % (Excel) y 93,4 % (fórmula corregida)
    const massTxt = mass < 10 ? `${fmt(mass.toFixed(1))} g` : `${Math.round(mass)} g`;

    // Aire
    for (const a of air) {
      const u = (v - a.start) / 0.3;
      if (u <= 0) {
        a.el.setAttribute('cx', a.x + 4 * jig * Math.sin(wall * 0.0011 + a.phase));
        a.el.setAttribute('cy', a.y + 4 * jig * Math.cos(wall * 0.0013 + a.phase * 2));
        a.el.setAttribute('opacity', 0.85);
      } else {
        const [x, y] = along(a.path, ease(clamp(u)));
        a.el.setAttribute('cx', x);
        a.el.setAttribute('cy', y);
        a.el.setAttribute('opacity', 0.85 * (1 - clamp((u - 0.8) / 0.2)));
      }
    }

    // Escena
    els.freezer.setAttribute('opacity', i === 0 ? 0.9 * Math.min(1, p * 4) : i === 1 ? 0.9 * (1 - clamp(p * 4)) : 0);
    els.chamberLabel.textContent = i === 0 ? 'Congelador (−20 °C)' : 'Cámara del liofilizador';
    els.heat.setAttribute('opacity', i === 2 ? clamp(s * 8) * (1 - clamp((s - 0.85) / 0.15)) : 0);
    els.coil.setAttribute('stroke', i >= 1 ? '#6fb0dc' : '#9aa7b2');
    const k = Math.max(s * 0.85, r);
    els.piece.setAttribute('fill', `rgb(${fresh.map((c, n) => Math.round(lerp(c, dried[n], k))).join(',')})`);
    els.pieceLabel.textContent = i < 3 ? (i === 0 && f < 0.5 ? 'Ruibarbo fresco · 50 g' : `Ruibarbo · ${massTxt}`) : 'Seco, liviano y poroso · < 4 g';

    if (i >= 1 && i <= 2 && !reduce) fanAngle = (fanAngle + dt * 0.5) % 360;
    els.fan.setAttribute('transform', `rotate(${fanAngle} 435 340)`);

    // Diagrama de fases
    const cx = X(T), cy = Y(pres);
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    halo.setAttribute('cx', cx); halo.setAttribute('cy', cy);

    // Lecturas
    els.T.textContent = `${fmt(Math.round(T))} °C`;
    els.P.textContent = pres >= 10 ? `${Math.round(pres)} mmHg` : `${fmt(pres.toFixed(1))} mmHg`;
    els.M.textContent = massTxt;

    // Pestañas y texto
    els.tabs.forEach((b, n) => {
      b.style.setProperty('--p', n < i ? 1 : n === i ? p : 0);
      b.setAttribute('aria-current', n === i ? 'step' : 'false');
    });
    if (i !== lastStage) {
      els.text.textContent = STAGES[i].text;
      lastStage = i;
    }
  }

  /* ---------- Reloj y controles ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let time = 0, playing = !reduce, visible = false, last = null, raf = null;
  let stopAt = null; // en pausa, una etapa pedida se reproduce una vez y se detiene al final

  const setPlaying = on => {
    playing = on;
    els.play.textContent = on ? 'Pausar' : 'Reproducir';
    els.play.setAttribute('aria-pressed', String(on));
    if (on) kick();
  };

  function frame(now) {
    raf = null;
    const dt = last == null ? 16 : Math.min(64, now - last);
    last = now;
    if (playing) {
      time += dt;
      if (stopAt != null && time >= stopAt) { time = stopAt; stopAt = null; setPlaying(false); }
      if (time > TOTAL + HOLD) time = 0;
    }
    render(time, now, dt);
    if ((playing || !reduce) && visible) raf = requestAnimationFrame(frame);
    else last = null;
  }
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

  // Ir a una etapa. Reproduciendo: sigue en continuo desde ahí.
  // En pausa: reproduce solo esa etapa y se detiene (útil para presentar).
  const goStage = n => {
    n = clamp(n, 0, STAGES.length - 1);
    if (reduce) {
      time = START[n] + STAGES[n].dur - 1;
    } else {
      time = START[n];
      if (!playing || stopAt != null) { stopAt = START[n] + STAGES[n].dur - 1; setPlaying(true); }
    }
    render(time, performance.now(), 0);
    kick();
  };

  els.play.addEventListener('click', () => { stopAt = null; setPlaying(!playing); });
  els.tabs.forEach((b, n) => b.addEventListener('click', () => goStage(n)));

  // Modo presentación: flechas para avanzar o retroceder de etapa, espacio para pausar.
  if (root.dataset.keys === 'page') {
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      const cur = stageAt(Math.min(time, TOTAL - 1))[0];
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goStage(cur + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goStage(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goStage(0); }
      else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); stopAt = null; setPlaying(!playing); }
    });
  }

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) kick();
  }, { threshold: 0.15 }).observe(root);

  if (reduce) setPlaying(false);
  render(0, 0, 0);
})();
