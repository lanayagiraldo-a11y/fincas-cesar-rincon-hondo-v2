/* Maqueta UX 2026-09-16. Capa adicional sobre app.js: navegación, visor y notas al pie. No altera datos. */
(() => {
  'use strict';
  if (window.lucide) window.lucide.createIcons();

  /* Sin desplegables: todo abierto y sin posibilidad de plegarse (incluida la impresión). */
  document.querySelectorAll('details:not(.src-details)').forEach(details => {
    details.open = true;
    details.addEventListener('toggle', () => { if (!details.open) details.open = true; });
  });

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress span');
  const backTop = document.getElementById('back-top');
  const wide = window.matchMedia('(min-width: 901px)');

  /* Cabecera compacta, barra de avance y volver arriba */
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-compact', wide.matches && y > 120);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    if (backTop) {
      backTop.hidden = false;
      backTop.classList.toggle('is-visible', y > window.innerHeight * 1.2);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Mapas: paginación, nombre actual, aterrizaje y resaltado */
  const maps = JSON.parse(document.getElementById('map-data').textContent);
  const select = document.getElementById('map-select');
  const workspace = document.querySelector('.map-workspace');
  const current = document.getElementById('map-current');
  const pagerCount = document.getElementById('map-pager-count');
  const choices = [...document.querySelectorAll('.map-choice')];

  function syncMapChrome() {
    const index = maps.findIndex(map => map.id === select.value);
    const item = maps[index];
    if (!item) return;
    if (current) current.textContent = `${item.name} · ${item.title}`;
    if (pagerCount) pagerCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(maps.length).padStart(2, '0')}`;
  }
  function stepMap(delta) {
    const index = maps.findIndex(map => map.id === select.value);
    const next = (index + delta + maps.length) % maps.length;
    const button = choices.find(choice => choice.dataset.map === maps[next].id);
    if (button) button.click();
    else { select.value = maps[next].id; select.dispatchEvent(new Event('change')); }
    syncMapChrome();
  }
  document.getElementById('map-prev')?.addEventListener('click', () => stepMap(-1));
  document.getElementById('map-next')?.addEventListener('click', () => stepMap(1));
  select.addEventListener('change', syncMapChrome);
  choices.forEach(choice => choice.addEventListener('click', syncMapChrome));
  workspace.tabIndex = -1;
  workspace.addEventListener('keydown', event => {
    if (event.target.closest('select')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); stepMap(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepMap(-1); }
  });

  function flashWorkspace() {
    workspace.classList.add('is-flash');
    setTimeout(() => workspace.classList.remove('is-flash'), 1400);
  }
  function scrollToWorkspace() {
    const offset = header.offsetHeight + 16;
    const top = workspace.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
  document.querySelectorAll('.map-jump').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const button = choices.find(choice => choice.dataset.map === link.dataset.map);
      if (button) button.click();
      else { select.value = link.dataset.map; select.dispatchEvent(new Event('change')); }
      syncMapChrome();
      history.replaceState(null, '', '#planos');
      scrollToWorkspace();
      setTimeout(() => { flashWorkspace(); workspace.focus({ preventScroll: true }); }, 350);
    });
  });
  syncMapChrome();

  /* Visor ampliado: ajuste al ancho en vertical, pellizco, rueda y doble toque */
  const dialog = document.getElementById('map-dialog');
  const viewport = document.getElementById('dialog-viewport');
  const canvas = document.getElementById('zoom-canvas');
  const image = document.getElementById('dialog-map');
  const zoomIn = document.getElementById('zoom-in');
  const zoomOut = document.getElementById('zoom-out');
  const zoomReset = document.getElementById('zoom-reset');
  const zoomLevel = document.getElementById('zoom-level');
  let zoom = 1;
  let base = 1;

  function portraitFit() {
    return viewport.clientHeight > viewport.clientWidth;
  }
  function layout(keepCenter = true, focal = null) {
    if (!dialog.open || !image.naturalWidth) return;
    const pad = getComputedStyle(viewport);
    const availableWidth = Math.max(1, viewport.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight));
    const availableHeight = Math.max(1, viewport.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom));
    const fitBoth = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
    const fitWidth = availableWidth / image.naturalWidth;
    base = portraitFit() ? fitWidth : fitBoth;
    const fx = focal ? focal.x : (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(canvas.offsetWidth, 1);
    const fy = focal ? focal.y : (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(canvas.offsetHeight, 1);
    const width = Math.round(image.naturalWidth * base * zoom);
    const height = Math.round(image.naturalHeight * base * zoom);
    canvas.style.width = `${Math.max(availableWidth, width)}px`;
    canvas.style.height = `${Math.max(availableHeight, height)}px`;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    image.style.maxWidth = 'none';
    image.style.maxHeight = 'none';
    if (keepCenter) {
      viewport.scrollLeft = fx * canvas.offsetWidth - viewport.clientWidth / 2;
      viewport.scrollTop = fy * canvas.offsetHeight - viewport.clientHeight / 2;
    } else {
      /* En vertical se muestra el tercio izquierdo (el predio) y se deja la leyenda a un desplazamiento. */
      viewport.scrollLeft = portraitFit() ? Math.max(0, canvas.offsetWidth * 0.42 - viewport.clientWidth / 2) : Math.max(0, (canvas.offsetWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (canvas.offsetHeight - viewport.clientHeight) / 2);
    }
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 4;
    viewport.classList.toggle('zoomed', zoom > 1);
  }
  function setZoom(value, focal = null) {
    zoom = Math.min(4, Math.max(1, value));
    layout(true, focal);
  }
  /* Apertura: en vertical el mapa llena la altura disponible (hasta 2,5x) en lugar de quedar en una franja. */
  function openLayout() {
    if (!image.naturalWidth) return;
    const pad = getComputedStyle(viewport);
    const availableWidth = Math.max(1, viewport.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight));
    const availableHeight = Math.max(1, viewport.clientHeight - parseFloat(pad.paddingTop) - parseFloat(pad.paddingBottom));
    const fitWidth = availableWidth / image.naturalWidth;
    zoom = portraitFit() ? Math.min(2.5, Math.max(1, availableHeight / (image.naturalHeight * fitWidth))) : 1;
    layout(false);
  }
  /* Reemplaza los manejadores de app.js clonando los controles. */
  [zoomIn, zoomOut, zoomReset].forEach(button => button.replaceWith(button.cloneNode(true)));
  const zIn = document.getElementById('zoom-in');
  const zOut = document.getElementById('zoom-out');
  const zReset = document.getElementById('zoom-reset');
  zIn.addEventListener('click', () => setZoom(zoom + .5));
  zOut.addEventListener('click', () => setZoom(zoom - .5));
  zReset.addEventListener('click', () => { zoom = 1; layout(false); });
  image.addEventListener('load', () => requestAnimationFrame(openLayout));
  new ResizeObserver(() => layout()).observe(viewport);
  document.getElementById('map-expand').addEventListener('click', () => requestAnimationFrame(openLayout));
  document.getElementById('map-open').addEventListener('click', () => requestAnimationFrame(openLayout));

  function focalFromClient(x, y) {
    const rect = viewport.getBoundingClientRect();
    return {
      x: (viewport.scrollLeft + (x - rect.left)) / Math.max(canvas.offsetWidth, 1),
      y: (viewport.scrollTop + (y - rect.top)) / Math.max(canvas.offsetHeight, 1)
    };
  }
  viewport.addEventListener('wheel', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    setZoom(zoom * (event.deltaY < 0 ? 1.12 : 0.89), focalFromClient(event.clientX, event.clientY));
  }, { passive: false });
  viewport.addEventListener('dblclick', event => {
    const focal = focalFromClient(event.clientX, event.clientY);
    setZoom(zoom > 1 ? 1 : 2, focal);
  });

  const pointers = new Map();
  let pinch = null;
  let pan = null;
  let lastTap = 0;
  viewport.addEventListener('pointerdown', event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom, focal: focalFromClient((a.x + b.x) / 2, (a.y + b.y) / 2) };
      pan = null;
    } else if (pointers.size === 1 && event.pointerType !== 'mouse') {
      pan = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      const now = Date.now();
      if (now - lastTap < 320) { setZoom(zoom > 1 ? 1 : 2, focalFromClient(event.clientX, event.clientY)); pan = null; }
      lastTap = now;
    }
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(pinch.zoom * (distance / pinch.distance), pinch.focal);
    } else if (pan) {
      viewport.scrollLeft = pan.left - (event.clientX - pan.x);
      viewport.scrollTop = pan.top - (event.clientY - pan.y);
    }
  });
  const release = event => { pointers.delete(event.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) pan = null; };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);

  /* Notas al pie: vista previa al pasar el cursor y botón de regreso */
  const pop = document.getElementById('cite-pop');
  const back = document.getElementById('cite-return');
  let returnTo = null;
  function showPop(anchor) {
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target || !pop) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim();
    pop.innerHTML = '';
    const label = document.createElement('b');
    label.textContent = `Fuente ${anchor.textContent.trim()}`;
    pop.append(label, document.createTextNode(text.length > 190 ? `${text.slice(0, 187)}…` : text));
    pop.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 32);
    pop.style.maxWidth = `${width}px`;
    let left = rect.left + window.scrollX - width / 2 + rect.width / 2;
    left = Math.max(16 + window.scrollX, Math.min(left, window.scrollX + window.innerWidth - width - 16));
    pop.style.left = `${left}px`;
    pop.style.top = `${rect.bottom + window.scrollY + 8}px`;
  }
  function hidePop() { if (pop) pop.hidden = true; }
  document.querySelectorAll('a[href^="#src-"]').forEach(anchor => {
    anchor.addEventListener('mouseenter', () => showPop(anchor));
    anchor.addEventListener('focus', () => showPop(anchor));
    anchor.addEventListener('mouseleave', hidePop);
    anchor.addEventListener('blur', hidePop);
    anchor.addEventListener('click', () => {
      hidePop();
      returnTo = window.scrollY;
      document.querySelectorAll('.sources li.is-cited').forEach(li => li.classList.remove('is-cited'));
      document.getElementById(anchor.hash.slice(1))?.classList.add('is-cited');
      if (back) { back.hidden = false; requestAnimationFrame(() => back.classList.add('is-visible')); }
    });
  });
  back?.addEventListener('click', () => {
    back.classList.remove('is-visible');
    setTimeout(() => { back.hidden = true; }, 250);
    if (returnTo !== null) window.scrollTo({ top: returnTo, behavior: 'smooth' });
    returnTo = null;
  });
  window.addEventListener('scroll', () => {
    if (!back || back.hidden || returnTo === null) return;
    const references = document.getElementById('referencias').getBoundingClientRect();
    if (references.top > window.innerHeight || references.bottom < 0) { back.classList.remove('is-visible'); back.hidden = true; returnTo = null; }
  }, { passive: true });
})();
