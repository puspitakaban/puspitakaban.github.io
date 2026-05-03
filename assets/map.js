// assets/map.js
// Map init · pin placement · card rendering · SVG connectors · float animation

(function () {

  // ── MAP ────────────────────────────────────────────────────────────────
  const WORLD_BOUNDS = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));

  const map = L.map('map', {
    zoomControl:        false,
    attributionControl: true,
    center:             [18, 10],
    zoom:               3,
    minZoom:            2,
    maxZoom:            6,
    maxBounds:          WORLD_BOUNDS,
    maxBoundsViscosity: 1.0,
    worldCopyJump:      false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains:  'abcd',
    maxZoom:     19
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── PIN ICON ───────────────────────────────────────────────────────────
  function makePin() {
    return L.divIcon({
      className:  '',
      html:       '<div class="pin-dot"></div>',
      iconSize:   [10, 10],
      iconAnchor: [5, 5]
    });
  }

  const pins = {};
  Object.entries(LOCATIONS).forEach(([key, ll]) => {
    pins[key] = L.marker([ll.lat, ll.lng], { icon: makePin(), interactive: false }).addTo(map);
  });

  // ── ELEMENTS ───────────────────────────────────────────────────────────
  const cardsEl = document.getElementById('cards-overlay');
  const svgEl   = document.getElementById('connector-svg');

  // ── STATE ──────────────────────────────────────────────────────────────
  const floatState = []; // per-card float params
  let   floatRAF   = null;
  const cardMeta   = []; // { el, baseCx, baseCy, pinX, pinY, lines[] }

  // ── RENDER ────────────────────────────────────────────────────────────
  function render() {
    if (floatRAF) { cancelAnimationFrame(floatRAF); floatRAF = null; }
    cardsEl.innerHTML = '';
    svgEl.innerHTML   = '';
    cardMeta.length   = 0;

    const byLoc = {};
    PROJECTS.forEach(p => {
      if (!byLoc[p.location]) byLoc[p.location] = [];
      byLoc[p.location].push(p);
    });

    let cardIdx = 0;

    Object.entries(byLoc).forEach(([locKey, projects]) => {
      const ll      = LOCATIONS[locKey];
      const pin     = map.latLngToContainerPoint([ll.lat, ll.lng]);
      const offsets = CARD_OFFSETS[locKey] || [];
      const multi   = projects.length > 1;
      const groupMetas = [];

      projects.forEach((proj, i) => {
        const off = offsets[i] || { dx: 0, dy: -220 };
        const cx  = pin.x + off.dx;
        const cy  = pin.y + off.dy;

        const card = document.createElement('div');
        card.className  = 'card';
        card.style.left = cx + 'px';
        card.style.top  = cy + 'px';
        card.innerHTML  = `
          <div class="card-loc">${ll.label}</div>
          <div class="card-eyebrow ${proj.eyebrowClass || ''}">${proj.eyebrow}</div>
          <div class="card-title">${proj.title}</div>
          <div class="card-body">${proj.body}</div>
          <div class="card-chips">
            ${proj.chips.map(ch => `<span class="chip ${proj.chipClass || ''}">${ch}</span>`).join('')}
          </div>`;
        cardsEl.appendChild(card);

        // Seed float params once per card slot
        if (!floatState[cardIdx]) {
          floatState[cardIdx] = {
            phase: Math.random() * Math.PI * 2,
            speed: 0.00035 + Math.random() * 0.00025,
            ampX:  2.5 + Math.random() * 2.5,
            ampY:  3.5 + Math.random() * 3.5
          };
        }

        const meta = { el: card, baseCx: cx, baseCy: cy, pinX: pin.x, pinY: pin.y, lines: [] };
        cardMeta.push(meta);
        groupMetas.push(meta);
        cardIdx++;
      });

      // Draw lines after DOM paints (need offsetHeight)
      requestAnimationFrame(() => {
        if (multi) {
          // Each card has a vertical drop to a shared horizontal bar,
          // then one stem from bar midpoint down to the pin.
          const bottoms = groupMetas.map(m => ({
            x: m.baseCx + 114,
            y: m.baseCy + m.el.offsetHeight
          }));
          const barY  = Math.max(...bottoms.map(b => b.y)) + 12;
          const barX1 = Math.min(...bottoms.map(b => b.x));
          const barX2 = Math.max(...bottoms.map(b => b.x));
          const midX  = (barX1 + barX2) / 2;

          // Drop lines (card → bar), one per card
          groupMetas.forEach((m, j) => {
            const drop = makeLine(bottoms[j].x, bottoms[j].y, bottoms[j].x, barY);
            svgEl.appendChild(drop);
            m.lines.push({ el: drop, type: 'drop', baseX: bottoms[j].x, baseBotY: bottoms[j].y, barY });
          });

          // Horizontal bar
          const bar = makeLine(barX1, barY, barX2, barY);
          svgEl.appendChild(bar);
          groupMetas[0].lines.push({ el: bar, type: 'bar', barX1, barX2, barY });

          // Stem: bar midpoint → pin
          const stem = makeLine(midX, barY, pin.x, pin.y);
          svgEl.appendChild(stem);
          groupMetas[0].lines.push({ el: stem, type: 'stem', midX, barY, pinX: pin.x, pinY: pin.y });

        } else {
          const m  = groupMetas[0];
          const h  = m.el.offsetHeight;
          const cx2 = m.baseCx + 114;
          const by  = m.baseCy + h;
          const ln  = makeLine(cx2, by, m.pinX, m.pinY);
          svgEl.appendChild(ln);
          m.lines.push({ el: ln, type: 'single' });
        }

        startFloat();
      });
    });
  }

  // ── LINE FACTORY ───────────────────────────────────────────────────────
  function makeLine(x1, y1, x2, y2) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', '#1a5c44');
    l.setAttribute('stroke-width', '1');
    l.setAttribute('opacity', '0.55');
    return l;
  }

  // ── FLOAT ANIMATION ───────────────────────────────────────────────────
  function startFloat() {
    let prev = performance.now();

    function tick(now) {
      const dt = now - prev;
      prev = now;

      cardMeta.forEach((m, i) => {
        const fs = floatState[i];
        if (!fs) return;
        fs.phase += fs.speed * dt;

        const ox = Math.sin(fs.phase)               * fs.ampX;
        const oy = Math.sin(fs.phase * 0.65 + 1.3)  * fs.ampY;

        const cx = m.baseCx + ox;
        const cy = m.baseCy + oy;

        m.el.style.left = cx + 'px';
        m.el.style.top  = cy + 'px';

        // Recompute line endpoints that move with this card
        const h      = m.el.offsetHeight;
        const cardCX = cx + 114;
        const cardBY = cy + h;

        m.lines.forEach(ld => {
          if (ld.type === 'single') {
            ld.el.setAttribute('x1', cardCX);
            ld.el.setAttribute('y1', cardBY);
            // x2/y2 (pin) are static
          }
          if (ld.type === 'drop') {
            // x stays at card centre; top follows card, bottom is fixed barY
            ld.el.setAttribute('x1', cardCX);
            ld.el.setAttribute('y1', cardBY);
            ld.el.setAttribute('x2', cardCX);
            ld.el.setAttribute('y2', ld.barY);
          }
          // 'bar' and 'stem' are static reference lines — left at base coords
        });
      });

      floatRAF = requestAnimationFrame(tick);
    }

    floatRAF = requestAnimationFrame(tick);
  }

  // ── EVENTS ────────────────────────────────────────────────────────────
  map.on('moveend zoomend', render);
  map.whenReady(() => setTimeout(render, 80));
  window.addEventListener('resize', () => { map.invalidateSize(); render(); });

})();
