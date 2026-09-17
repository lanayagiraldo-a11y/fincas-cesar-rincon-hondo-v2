(() => {
  'use strict';
  if (window.lucide) window.lucide.createIcons();

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('main-menu');
  const compactNavigation = window.matchMedia('(max-width: 900px)');

  function setMenu(open, restoreFocus = false) {
    header.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuToggle.title = open ? 'Cerrar menú' : 'Abrir menú';
    if (restoreFocus) menuToggle.focus();
  }

  header.classList.add('nav-ready');
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true);
  });
  compactNavigation.addEventListener('change', () => setMenu(false));
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  }).observe(header);

  document.querySelectorAll('.table-wrap').forEach(wrapper => {
    const title = wrapper.closest('details')?.querySelector('summary')?.textContent.trim() || 'Datos de la presentación';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', `Tabla: ${title}`);
  });

  const maps = JSON.parse(document.getElementById('map-data').textContent);
  const select = document.getElementById('map-select');
  const compactMapControls = window.matchMedia('(max-width: 600px)');
  const mapOptions = [...select.options].map(option => ({
    option,
    fullLabel: option.textContent,
    compactLabel: maps.find(map => map.id === option.value).name
  }));

  function updateMapLabels() {
    mapOptions.forEach(({ option, fullLabel, compactLabel }) => {
      option.label = compactMapControls.matches ? compactLabel : fullLabel;
    });
  }

  select.setAttribute('aria-describedby', 'map-subtitle');
  compactMapControls.addEventListener('change', updateMapLabels);
  updateMapLabels();
  const mainImage = document.getElementById('map-image');
  const dialog = document.getElementById('map-dialog');
  const dialogImage = document.getElementById('dialog-map');
  const viewport = document.getElementById('dialog-viewport');
  const canvas = document.getElementById('zoom-canvas');
  let selected = maps[0];
  let zoom = 1;

  function chooseMap(id) {
    const item = maps.find(map => map.id === id);
    if (!item) return;
    selected = item;
    select.value = item.id;
    select.title = `${item.name}: ${item.title}`;
    mainImage.src = item.view || item.src;
    mainImage.alt = `${item.title}: ${item.name}`;
    document.getElementById('map-title').textContent = item.name;
    document.getElementById('map-subtitle').textContent = item.title;
    document.getElementById('map-detail').textContent = item.detail;
    document.getElementById('map-group').textContent = item.group;
    document.getElementById('map-number').textContent = `${String(maps.indexOf(item) + 1).padStart(2, '0')} / ${String(maps.length).padStart(2, '0')}`;
    document.querySelector('.map-sheet').dataset.document = item.id;
    document.getElementById('map-editorial-download').href = item.editorialDownload;
    document.getElementById('map-open').setAttribute('aria-label', `Ampliar ${item.title.toLowerCase()} de ${item.name}`);
    document.querySelectorAll('.map-choice').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.map === id));
    });
  }

  select.addEventListener('change', () => chooseMap(select.value));
  document.querySelectorAll('.map-choice, .map-jump').forEach(control => {
    control.addEventListener('click', () => chooseMap(control.dataset.map));
  });

  function sizeMap(keepCenter = true) {
    if (!dialog.open || !dialogImage.naturalWidth) return;
    const padding = getComputedStyle(viewport);
    const availableWidth = Math.max(1, viewport.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight));
    const availableHeight = Math.max(1, viewport.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom));
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(canvas.offsetWidth, 1);
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(canvas.offsetHeight, 1);
    const fit = Math.min(availableWidth / dialogImage.naturalWidth, availableHeight / dialogImage.naturalHeight);
    const width = Math.round(dialogImage.naturalWidth * fit * zoom);
    const height = Math.round(dialogImage.naturalHeight * fit * zoom);
    canvas.style.width = `${Math.max(availableWidth, width)}px`;
    canvas.style.height = `${Math.max(availableHeight, height)}px`;
    dialogImage.style.width = `${width}px`;
    dialogImage.style.height = `${height}px`;
    dialogImage.style.maxWidth = 'none';
    dialogImage.style.maxHeight = 'none';
    if (keepCenter) {
      viewport.scrollLeft = centerX * canvas.offsetWidth - viewport.clientWidth / 2;
      viewport.scrollTop = centerY * canvas.offsetHeight - viewport.clientHeight / 2;
    } else {
      viewport.scrollLeft = Math.max(0, (canvas.offsetWidth - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (canvas.offsetHeight - viewport.clientHeight) / 2);
    }
    document.getElementById('zoom-level').textContent = `${Math.round(zoom * 100)}%`;
    document.getElementById('zoom-out').disabled = zoom <= 1;
    document.getElementById('zoom-in').disabled = zoom >= 4;
    viewport.classList.toggle('zoomed', zoom > 1);
  }

  function openMap() {
    zoom = 1;
    document.getElementById('dialog-title').textContent = selected.name;
    document.getElementById('dialog-subtitle').textContent = selected.title;
    document.getElementById('dialog-caption').textContent = selected.detail;
    dialogImage.alt = `${selected.title}: ${selected.name}`;
    dialogImage.src = selected.src;
    dialog.dataset.document = selected.id;
    dialog.dataset.view = 'editorial';
    dialog.showModal();
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => sizeMap(false));
  }

  document.getElementById('map-expand').addEventListener('click', openMap);
  document.getElementById('map-open').addEventListener('click', openMap);
  document.getElementById('map-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialogImage.addEventListener('load', () => sizeMap(false));
  document.getElementById('zoom-in').addEventListener('click', () => { zoom = Math.min(4, zoom + .5); sizeMap(); });
  document.getElementById('zoom-out').addEventListener('click', () => { zoom = Math.max(1, zoom - .5); sizeMap(); });
  document.getElementById('zoom-reset').addEventListener('click', () => { zoom = 1; sizeMap(false); });
  new ResizeObserver(() => sizeMap()).observe(viewport);

  let drag = null;
  viewport.addEventListener('pointerdown', event => {
    if (zoom <= 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('dragging');
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - event.clientX + drag.x;
    viewport.scrollTop = drag.top - event.clientY + drag.y;
  });
  const stopDrag = () => { drag = null; viewport.classList.remove('dragging'); };
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);
  viewport.addEventListener('lostpointercapture', stopDrag);

  document.querySelectorAll('.print-button').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await Promise.all([...document.querySelectorAll('.print-atlas img')].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); } catch { /* A failed image must not trap the print control. */ }
      }));
      window.print();
    } finally {
      button.disabled = false;
    }
  }));
  let printOpened = [];
  window.addEventListener('beforeprint', () => {
    printOpened = [...document.querySelectorAll('details:not([open])')];
    printOpened.forEach(details => { details.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printOpened.forEach(details => { details.open = false; });
    printOpened = [];
  });

  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#src-"]');
    if (!anchor) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    let parent = target.parentElement;
    while (parent) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    history.replaceState(null, '', anchor.hash);
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  });

  chooseMap(selected.id);
  const navigation = [...document.querySelectorAll('.main-nav a')];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    navigation.forEach(anchor => {
      if (anchor.hash === `#${visible[0].target.id}`) anchor.setAttribute('aria-current', 'location');
      else anchor.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  navigation.forEach(anchor => {
    const section = document.getElementById(anchor.hash.slice(1));
    if (section) observer.observe(section);
  });
})();
