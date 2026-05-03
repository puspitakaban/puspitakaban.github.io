// assets/map.js — v6
(function () {

  // ── MAP ───────────────────────────────────────────────────────────────────
  const HORIZ_BOUNDS = L.latLngBounds(L.latLng(-89, -180), L.latLng(89, 180));

  const map = L.map('map', {
    zoomControl:        false,
    attributionControl: true,
    center:             [20, 0],
    zoom:               2,
    minZoom:            2,
    maxZoom:            6,
    maxBounds:          HORIZ_BOUNDS,
    maxBoundsViscosity: 0.6,
    worldCopyJump:      false
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    minZoom:     0,
    maxZoom:     16,
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // ── PIN LAYER ─────────────────────────────────────────────────────────────
  const pinLayer = L.layerGroup().addTo(map);

  // ── DOM ───────────────────────────────────────────────────────────────────
  const cardsEl = document.getElementById('cards-overlay');
  const svgEl   = document.getElementById('connector-svg');
  const mapArea = document.querySelector('.map-area');

  const tooltip = document.createElement('div');
  tooltip.className   = 'card-tooltip';
  tooltip.textContent = 'Click to see project';
  document.body.appendChild(tooltip);

  // ── CONSTANTS ─────────────────────────────────────────────────────────────
  const CARD_W   = 185;
  const PIN_DIST = 55;
  const MARGIN   = 8;

  // ── STATE ─────────────────────────────────────────────────────────────────
  let floatRAF    = null;
  let cardMeta    = [];
  let renderTimer = null;   // debounce handle

  // ── DEBOUNCED RENDER ──────────────────────────────────────────────────────
  // Any number of rapid events (moveend, zoomend, setView, resize) collapse
  // into a single render call 120ms after the last one fires.
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 120);
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function groupByPin(projects) {
    const groups = [];
    const index  = {};
    projects.forEach(p => {
      const loc = LOCATIONS[p.location];
      if (!loc) { console.warn('Unknown location key:', p.location); return; }
      if (!index[p.location]) {
        index[p.location] = { lat: loc.lat, lng: loc.lng, label: loc.label, projects: [] };
        groups.push(index[p.location]);
      }
      index[p.location].projects.push(p);
    });
    return groups;
  }

  function placeCards(pinX, pinY, cardHeights) {
    const n          = cardHeights.length;
    const startAngle = n === 1 ? 315 : 300;
    const spread     = n === 1 ? 0   : (n === 2 ? 90 : 300);
    const step       = n <= 1  ? 0   : spread / (n - 1);
    const mw         = mapArea.offsetWidth;
    const mh         = mapArea.offsetHeight;

    return cardHeights.map((cardH, i) => {
      const rad  = ((startAngle + i * step) * Math.PI) / 180;
      const dist = PIN_DIST + Math.max(CARD_W, cardH) * 0.55;
      const cx   = Math.max(MARGIN, Math.min(pinX + Math.cos(rad) * dist - CARD_W / 2, mw - CARD_W - MARGIN));
      const cy   = Math.max(MARGIN, Math.min(pinY + Math.sin(rad) * dist - cardH  / 2, mh - cardH  - MARGIN));
      return { cx, cy };
    });
  }

  function sideMidpoint(cx, cy, cardH, pinX, pinY) {
    const midY  = cy + cardH / 2;
    const left  = { x: cx,          y: midY, rx: 0,      ry: cardH / 2 };
    const right = { x: cx + CARD_W, y: midY, rx: CARD_W, ry: cardH / 2 };
    return Math.hypot(left.x - pinX, left.y - pinY) <
           Math.hypot(right.x - pinX, right.y - pinY) ? left : right;
  }

  function makeLine(x1, y1, x2, y2) {
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', x1); l.setAttribute('y1', y1);
    l.setAttribute('x2', x2); l.setAttribute('y2', y2);
    l.setAttribute('stroke', '#ffffff');
    l.setAttribute('stroke-width', '0.85');
    l.setAttribute('opacity', '0.85');
    return l;
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  function render() {
    // Stop float loop and wipe all previous output
    if (floatRAF) { cancelAnimationFrame(floatRAF); floatRAF = null; }
    cardsEl.innerHTML = '';
    svgEl.innerHTML   = '';
    cardMeta          = [];
    pinLayer.clearLayers();

    const groups     = groupByPin(PROJECTS);
    let   doneGroups = 0;

    groups.forEach(group => {
      const pin = map.latLngToContainerPoint([group.lat, group.lng]);

      L.marker([group.lat, group.lng], {
        icon: L.divIcon({ className: '', html: '<div class="pin-dot"></div>', iconSize: [10,10], iconAnchor: [5,5] }),
        interactive: false
      }).addTo(pinLayer);

      const cardEls = group.projects.map((proj) => {
        const card     = document.createElement('div');
        card.className = 'card';
        card.style.cssText = `width:${CARD_W}px; left:-9999px; top:0px;`;

        const hasLink = proj.link || proj.page;
        if (hasLink) card.classList.add('card--clickable');

        card.innerHTML = `
          <div class="card-loc">${group.label} · ${proj.year}</div>
          <div class="card-title">${proj.title}</div>
          <div class="card-body">${proj.body}</div>
          <div class="card-chips">${proj.chips.map(ch => `<span class="chip">${ch}</span>`).join('')}</div>`;

        if (proj.link)      card.addEventListener('click', () => window.open(proj.link, '_blank'));
        else if (proj.page) card.addEventListener('click', () => window.open('projects/' + proj.page, '_blank'));

        const tipText = hasLink ? 'Click to see project' : 'No link yet';
        card.addEventListener('mouseenter', ()  => { tooltip.textContent = tipText; tooltip.style.display = 'block'; });
        card.addEventListener('mousemove',  e   => { tooltip.style.left = (e.clientX + 14) + 'px'; tooltip.style.top = (e.clientY - 32) + 'px'; });
        card.addEventListener('mouseleave', ()  => { tooltip.style.display = 'none'; });

        cardsEl.appendChild(card);
        return card;
      });

      requestAnimationFrame(() => {
        const heights   = cardEls.map(el => el.offsetHeight);
        const positions = placeCards(pin.x, pin.y, heights);

        cardEls.forEach((card, i) => {
          const { cx, cy } = positions[i];
          const cardH      = heights[i];

          card.style.left = cx + 'px';
          card.style.top  = cy + 'px';

          const side = sideMidpoint(cx, cy, cardH, pin.x, pin.y);
          const line = makeLine(side.x, side.y, pin.x, pin.y);
          svgEl.appendChild(line);

          cardMeta.push({
            el:         card,
            baseCx:     cx,
            baseCy:     cy,
            cardH,
            pinX:       pin.x,
            pinY:       pin.y,
            lineEl:     line,
            sideOffset: { rx: side.rx, ry: side.ry },
            float: {
              phaseX: Math.random() * Math.PI * 2,
              phaseY: Math.random() * Math.PI * 2,
              speedX: 0.00045 + Math.random() * 0.00025,
              speedY: 0.00035 + Math.random() * 0.00020,
              ampX:   5 + Math.random() * 4,
              ampY:   6 + Math.random() * 5
            }
          });
        });

        doneGroups++;
        if (doneGroups === groups.length) startFloat();
      });
    });
  }

  // ── FLOAT ─────────────────────────────────────────────────────────────────
  function startFloat() {
    let prev = performance.now();
    const mw = mapArea.offsetWidth;
    const mh = mapArea.offsetHeight;

    function tick(now) {
      const dt = Math.min(now - prev, 50);
      prev = now;

      cardMeta.forEach(m => {
        const f = m.float;
        f.phaseX += f.speedX * dt;
        f.phaseY += f.speedY * dt;

        const cx = Math.max(MARGIN, Math.min(m.baseCx + Math.sin(f.phaseX) * f.ampX, mw - CARD_W - MARGIN));
        const cy = Math.max(MARGIN, Math.min(m.baseCy + Math.sin(f.phaseY) * f.ampY, mh - m.cardH - MARGIN));

        m.el.style.left = cx + 'px';
        m.el.style.top  = cy + 'px';

        if (m.lineEl) {
          m.lineEl.setAttribute('x1', cx + m.sideOffset.rx);
          m.lineEl.setAttribute('y1', cy + m.sideOffset.ry);
        }
      });

      floatRAF = requestAnimationFrame(tick);
    }

    floatRAF = requestAnimationFrame(tick);
  }

  // ── EVENTS ────────────────────────────────────────────────────────────────
  // All events go through scheduleRender — rapid-fire events debounce into one
  map.on('moveend zoomend', scheduleRender);

  map.whenReady(() => {
    const fitZoom = Math.log2(map.getSize().x / 256);
    map.setView([20, 0], fitZoom, { animate: false });
    // setView fires moveend which scheduleRender handles — no extra call needed
  });

  window.addEventListener('resize', () => {
    map.invalidateSize();
    const fitZoom = Math.log2(map.getSize().x / 256);
    if (map.getZoom() < fitZoom) map.setZoom(fitZoom, { animate: false });
    scheduleRender();
  });

})();