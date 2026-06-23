/* =========================================================
   products.js — صفحة كل المنتجات (فلتر فئة + نوع + بحث)
   ========================================================= */

const TYPE_OPTIONS = [
  { v: 'full_package', l: 'باكدج بيت كامل' },
  { v: 'room_package', l: 'باكدج غرفة' },
  { v: 'single_item',  l: 'قطعة مفردة' }
];

const PFilter = { categories: new Set(), types: new Set(), q: '' };

async function initProductsPage() {
  const params = new URLSearchParams(location.search);
  if (params.get('category')) PFilter.categories.add(params.get('category'));
  if (params.get('type')) PFilter.types.add(params.get('type'));

  const grid = document.getElementById('grid');
  const countEl = document.getElementById('result-count');
  const titleEl = document.getElementById('page-title');
  const crumbEl = document.getElementById('page-crumb');
  const searchInput = document.getElementById('search-input');

  renderSkeletons(grid, 6);

  let all = [];
  let categories = [];
  try {
    [all, categories] = await Promise.all([DataStore.getProducts(), DataStore.getCategories()]);
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="empty-state">حدث خطأ أثناء تحميل المنتجات. تأكد من إعداد Supabase.</div>';
    return;
  }

  // عنوان الصفحة حسب الفلتر القادم من الرابط
  const cat = categories.find(c => PFilter.categories.has(c.id));
  const typ = TYPE_OPTIONS.find(t => PFilter.types.has(t.v));
  const title = cat ? cat.name : (typ ? typ.l : 'كل المنتجات');
  if (titleEl) titleEl.textContent = title;
  if (crumbEl) crumbEl.textContent = title;
  document.title = title + ' | متجر وائل شداد للأثاث';

  const apply = () => {
    const q = PFilter.q.trim();
    const filtered = all.filter(p => {
      if (PFilter.categories.size && !PFilter.categories.has(p.category)) return false;
      if (PFilter.types.size && !PFilter.types.has(p.type)) return false;
      if (q && !((p.name || '').includes(q) || (p.tags || []).some(t => t.includes(q)))) return false;
      return true;
    });
    renderProducts(grid, filtered);
    if (countEl) countEl.textContent = `${filtered.length} منتج`;
  };

  const buildUI = () => {
    const dt = document.getElementById('filters-desktop');
    const mb = document.getElementById('filters-mobile');
    [dt, mb].forEach(c => { if (c) buildFilterPanel(c, categories, () => { buildUI(); apply(); }); });
  };

  buildUI();
  apply();

  if (searchInput) {
    searchInput.value = PFilter.q;
    searchInput.addEventListener('input', () => { PFilter.q = searchInput.value; apply(); });
  }

  if (typeof initFiltersSheet === 'function') initFiltersSheet();
}

/* بناء لوحة الفلاتر داخل حاوية */
function buildFilterPanel(container, categories, onChange) {
  container.innerHTML = '';

  container.appendChild(makeGroup('الفئة', categories.map(c => ({ v: c.id, l: c.name })), PFilter.categories, onChange));
  container.appendChild(makeGroup('نوع المنتج', TYPE_OPTIONS, PFilter.types, onChange));

  const clear = document.createElement('button');
  clear.className = 'btn btn-outline btn-block';
  clear.style.marginTop = '8px';
  clear.textContent = 'مسح الفلاتر';
  clear.addEventListener('click', () => {
    PFilter.categories.clear();
    PFilter.types.clear();
    onChange();
  });
  container.appendChild(clear);
}

function makeGroup(title, options, stateSet, onChange) {
  const group = document.createElement('div');
  group.className = 'filter-group';
  const h = document.createElement('h4');
  h.textContent = title;
  group.appendChild(h);

  options.forEach(opt => {
    const label = document.createElement('label');
    label.className = 'filter-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = opt.v;
    input.checked = stateSet.has(opt.v);
    input.addEventListener('change', () => {
      if (input.checked) stateSet.add(opt.v); else stateSet.delete(opt.v);
      onChange();
    });
    const span = document.createElement('span');
    span.textContent = opt.l;
    label.append(input, span);
    group.appendChild(label);
  });
  return group;
}
