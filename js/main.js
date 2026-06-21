/* =========================================================
   main.js — التهيئة العامة وتوجيه الصفحات
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initDrawer();
  initRevealObserver();
  initFloatingWa();
  initFooterYear();
  initReadingProgress();
  initScrollTop();
  initFabLabel();
  initCounters();

  const page = document.body.dataset.page;
  if (page === 'home') initHome();
  else if (page === 'room') initRoomPage();
  else if (page === 'product') initProductPage();
  else if (page === 'contact') initContactPage();
});

/* ---------- مؤشّر تقدّم القراءة ---------- */
function initReadingProgress() {
  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  const fill = document.createElement('span');
  bar.appendChild(fill);
  document.body.appendChild(bar);

  const update = () => {
    const h = document.documentElement;
    const scrollable = h.scrollHeight - h.clientHeight;
    const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
    fill.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ---------- زر العودة للأعلى ---------- */
function initScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.setAttribute('aria-label', 'العودة للأعلى');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const toggle = () => btn.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

/* ---------- توسيع زر واتساب العائم بنص "كلمنا" ---------- */
function initFabLabel() {
  const fab = document.querySelector('.fab-wa');
  if (!fab) return;
  const label = document.createElement('span');
  label.className = 'fab-label';
  label.textContent = 'كلّمنا';
  fab.appendChild(label);

  // يظهر النص بعد 3 ثوانٍ ثم يختفي بعد 4 ثوانٍ من الظهور (لمسة جذب لطيفة)
  setTimeout(() => {
    fab.classList.add('show-label');
    setTimeout(() => fab.classList.remove('show-label'), 4000);
  }, 3000);
}

/* ---------- عدّاد الأرقام التصاعدي ---------- */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
}

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1700;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const val = Math.floor(eased * target);
    el.textContent = prefix + val.toLocaleString('en-US') + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target.toLocaleString('en-US') + suffix;
  }
  requestAnimationFrame(tick);
}

/* ---------- Tilt 3D خفيف يتبع حركة الماوس ---------- */
function attachTilt(card) {
  // تجاهل أجهزة اللمس وتفضيل تقليل الحركة
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX = 6; // أقصى درجة ميل
  card.addEventListener('mouseenter', () => { card.style.transition = 'transform 0.1s ease-out'; });
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rotX = (py - 0.5) * -2 * MAX;
    const rotY = (px - 0.5) * 2 * MAX;
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.4s ease';
    card.style.transform = '';
  });
}

/* ---------- درج التنقل للموبايل ---------- */
function initDrawer() {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.querySelector('.drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');
  if (!hamburger || !drawer) return;

  const open = () => { drawer.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; };

  hamburger.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  overlay && overlay.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

/* ---------- ظهور تدريجي عند التمرير ---------- */
let _revealObserver;
function initRevealObserver() {
  _revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        _revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  observeReveals(document);
}
function observeReveals(root) {
  if (!_revealObserver) return;
  root.querySelectorAll('.reveal:not(.in-view)').forEach(el => _revealObserver.observe(el));
}

/* ---------- زر واتساب العائم وأزرار الهيدر ---------- */
function initFloatingWa() {
  document.querySelectorAll('[data-wa-general]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'A') e.preventDefault();
      sendGeneralWhatsapp();
    });
  });
}

function initFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* =========================================================
   الصفحة الرئيسية
   ========================================================= */
async function initHome() {
  const roomsGrid = document.getElementById('rooms-grid');
  const featuredGrid = document.getElementById('featured-grid');

  if (featuredGrid) renderSkeletons(featuredGrid, 4);

  try {
    const [categories, featured] = await Promise.all([
      DataStore.getCategories(),
      DataStore.getFeatured()
    ]);
    if (roomsGrid) renderRooms(roomsGrid, categories);
    if (featuredGrid) renderProducts(featuredGrid, featured);
  } catch (err) {
    console.error(err);
    if (featuredGrid) featuredGrid.innerHTML = '<div class="empty-state">حدث خطأ أثناء تحميل البيانات.</div>';
  }
}

/* =========================================================
   صفحة التصنيف (room.html)
   ========================================================= */
async function initRoomPage() {
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const grid = document.getElementById('room-grid');
  const titleEl = document.getElementById('room-title');
  const crumbEl = document.getElementById('room-crumb');
  const countEl = document.getElementById('result-count');

  renderSkeletons(grid, 6);

  try {
    const [categories, products] = await Promise.all([
      DataStore.getCategories(),
      type ? DataStore.getByCategory(type) : DataStore.getProducts()
    ]);

    const cat = categories.find(c => c.id === type);
    const title = cat ? cat.name : 'كل المنتجات';
    if (titleEl) titleEl.textContent = title;
    if (crumbEl) crumbEl.textContent = title;
    document.title = title + ' | معرض وائل شداد للأثاث';

    const options = collectFilterOptions(products);

    const update = () => {
      const filtered = applyFilters(products);
      renderProducts(grid, filtered);
      if (countEl) countEl.textContent = `${filtered.length} منتج`;
    };

    // بناء الفلاتر في النسختين (موبايل + ديسكتوب)
    const desktopFilters = document.getElementById('filters-desktop');
    const mobileFilters = document.getElementById('filters-mobile');
    if (desktopFilters) buildFilterUI(desktopFilters, options, () => { rebuildMobile(); update(); });
    if (mobileFilters) buildFilterUI(mobileFilters, options, () => { rebuildDesktop(); update(); });

    function rebuildMobile() { if (mobileFilters) buildFilterUI(mobileFilters, options, () => { rebuildDesktop(); update(); }); }
    function rebuildDesktop() { if (desktopFilters) buildFilterUI(desktopFilters, options, () => { rebuildMobile(); update(); }); }

    update();
    initFiltersSheet();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="empty-state">حدث خطأ أثناء تحميل المنتجات.</div>';
  }
}

function initFiltersSheet() {
  const wrap = document.querySelector('.filters-mobile-wrap');
  const toggle = document.querySelector('.filter-toggle');
  const overlay = document.querySelector('.filters-mobile-wrap .sheet-overlay');
  const closeBtn = document.querySelector('.sheet-close');
  if (!wrap || !toggle) return;
  const open = () => { wrap.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { wrap.classList.remove('open'); document.body.style.overflow = ''; };
  toggle.addEventListener('click', open);
  overlay && overlay.addEventListener('click', close);
  closeBtn && closeBtn.addEventListener('click', close);
}

/* =========================================================
   صفحة تفاصيل المنتج (product.html)
   ========================================================= */
async function initProductPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const root = document.getElementById('product-root');

  if (!id) { root.innerHTML = '<div class="empty-state">لم يتم تحديد المنتج.</div>'; return; }

  root.innerHTML = '<div class="spinner"></div>';

  try {
    const product = await DataStore.getProductById(id);
    if (!product) { root.innerHTML = '<div class="empty-state">المنتج غير موجود.</div>'; return; }

    document.title = product.name + ' | معرض وائل شداد للأثاث';
    renderProductDetail(root, product);

    // منتجات مشابهة
    const all = await DataStore.getByCategory(product.category);
    const similar = all.filter(p => p.id !== product.id).slice(0, 4);
    const simGrid = document.getElementById('similar-grid');
    const simSection = document.getElementById('similar-section');
    if (similar.length && simGrid) {
      renderProducts(simGrid, similar);
    } else if (simSection) {
      simSection.style.display = 'none';
    }
  } catch (err) {
    console.error(err);
    root.innerHTML = '<div class="empty-state">حدث خطأ أثناء تحميل المنتج.</div>';
  }
}

function renderProductDetail(root, product) {
  const images = (product.images && product.images.length) ? product.images : [''];
  let current = 0;

  root.innerHTML = `
    <div class="product-detail">
      <div class="gallery">
        <div class="gallery-main" id="gallery-main">
          <img id="main-img" alt="${escapeHtml(product.name)}">
          ${images.length > 1 ? `
            <button class="gallery-nav prev" id="g-prev" aria-label="السابق">‹</button>
            <button class="gallery-nav next" id="g-next" aria-label="التالي">›</button>` : ''}
        </div>
        ${images.length > 1 ? `<div class="gallery-thumbs" id="thumbs"></div>` : ''}
      </div>
      <div class="detail-info">
        <span class="type-badge type-${product.type}">${getTypeLabel(product.type)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="detail-desc">${escapeHtml(product.description || product.short_description || '')}</p>
        ${blockList('مكونات الباكدج', product.includes)}
        ${blockList('الخامات', product.materials)}
        ${blockChips('الألوان المتاحة', product.colors)}
        ${product.dimensions ? `<div class="detail-block"><h4>الأبعاد</h4><p>${escapeHtml(product.dimensions)}</p></div>` : ''}
        <div class="detail-cta">
          <p>السعر يُحدَّد حسب المواصفات والخامات المختارة. تواصل معنا للحصول على عرض سعر سريع.</p>
          <button class="btn btn-wa" id="detail-wa">${waIcon(20)} اطلب عرض سعر عبر واتساب</button>
        </div>
      </div>
    </div>
    <!-- Lightbox -->
    <div class="lightbox" id="lightbox">
      <button class="lightbox-close" id="lb-close" aria-label="إغلاق">×</button>
      ${images.length > 1 ? `<button class="lightbox-nav prev" id="lb-prev">‹</button><button class="lightbox-nav next" id="lb-next">›</button>` : ''}
      <img id="lb-img" alt="${escapeHtml(product.name)}">
    </div>
  `;

  const mainImg = root.querySelector('#main-img');
  const thumbsWrap = root.querySelector('#thumbs');
  const lb = root.querySelector('#lightbox');
  const lbImg = root.querySelector('#lb-img');

  function setImage(i) {
    current = (i + images.length) % images.length;
    mainImg.src = images[current];
    attachImgFallback(mainImg, product.name);
    if (lbImg) { lbImg.src = images[current]; attachImgFallback(lbImg, product.name); }
    if (thumbsWrap) {
      thumbsWrap.querySelectorAll('img').forEach((t, idx) => t.classList.toggle('active', idx === current));
    }
  }

  // الصور المصغرة
  if (thumbsWrap) {
    images.forEach((src, idx) => {
      const t = document.createElement('img');
      t.loading = 'lazy';
      t.src = src;
      t.alt = product.name + ' ' + (idx + 1);
      attachImgFallback(t, product.name);
      t.addEventListener('click', () => setImage(idx));
      thumbsWrap.appendChild(t);
    });
  }

  setImage(0);

  // أزرار التنقل
  root.querySelector('#g-prev')?.addEventListener('click', (e) => { e.stopPropagation(); setImage(current - 1); });
  root.querySelector('#g-next')?.addEventListener('click', (e) => { e.stopPropagation(); setImage(current + 1); });

  // Lightbox
  root.querySelector('#gallery-main')?.addEventListener('click', () => lb.classList.add('open'));
  root.querySelector('#lb-close')?.addEventListener('click', () => lb.classList.remove('open'));
  root.querySelector('#lb-prev')?.addEventListener('click', () => setImage(current - 1));
  root.querySelector('#lb-next')?.addEventListener('click', () => setImage(current + 1));
  lb?.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowRight') setImage(current - 1);
    if (e.key === 'ArrowLeft') setImage(current + 1);
  });

  // زر واتساب
  root.querySelector('#detail-wa').addEventListener('click', () => sendToWhatsapp(product));
}

function blockList(title, items) {
  if (!items || !items.length) return '';
  const lis = items.map(i => `<li>${escapeHtml(i)}</li>`).join('');
  return `<div class="detail-block"><h4>${title}</h4><ul class="detail-list">${lis}</ul></div>`;
}
function blockChips(title, items) {
  if (!items || !items.length) return '';
  const chips = items.map(i => `<span class="chip">${escapeHtml(i)}</span>`).join('');
  return `<div class="detail-block"><h4>${title}</h4><div class="chips">${chips}</div></div>`;
}

/* =========================================================
   صفحة التواصل (contact.html)
   ========================================================= */
function initContactPage() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name=name]').value.trim();
    const phone = form.querySelector('[name=phone]').value.trim();
    const msg = form.querySelector('[name=message]').value.trim();
    const text = `مرحبًا، أنا ${name || 'عميل'}
رقم التواصل: ${phone || 'غير محدد'}
الرسالة: ${msg || 'أرغب في الاستفسار عن منتجاتكم'}`;
    sendGeneralWhatsapp(text);
  });
}

/* ---------- أدوات ---------- */
function escapeHtml(s) {
  return String(s ?? '').replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
