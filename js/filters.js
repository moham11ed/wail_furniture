/* =========================================================
   filters.js — فلترة المنتجات في صفحة التصنيف
   ========================================================= */

const TypeLabels = {
  full_package: 'باكدج بيت كامل',
  room_package: 'باكدج غرفة واحدة',
  single_item: 'قطعة مفردة'
};

/* الحالة الحالية للفلاتر */
const FilterState = {
  types: new Set(),
  colors: new Set(),
  materials: new Set()
};

/* يطبق الفلاتر على قائمة المنتجات ويرجّع المطابق */
function applyFilters(products) {
  return products.filter(p => {
    if (FilterState.types.size && !FilterState.types.has(p.type)) return false;
    if (FilterState.colors.size) {
      const has = (p.colors || []).some(c => FilterState.colors.has(c));
      if (!has) return false;
    }
    if (FilterState.materials.size) {
      const has = (p.materials || []).some(m => FilterState.materials.has(m));
      if (!has) return false;
    }
    return true;
  });
}

/* يستخرج القيم الفريدة لبناء خيارات الفلتر */
function collectFilterOptions(products) {
  const colors = new Set();
  const materials = new Set();
  const types = new Set();
  products.forEach(p => {
    (p.colors || []).forEach(c => colors.add(c));
    (p.materials || []).forEach(m => materials.add(m));
    if (p.type) types.add(p.type);
  });
  return {
    types: [...types],
    colors: [...colors],
    materials: [...materials]
  };
}

/* يبني واجهة الفلاتر داخل حاوية معينة */
function buildFilterUI(container, options, onChange) {
  container.innerHTML = '';

  const groups = [
    { key: 'types', title: 'نوع المنتج', items: options.types, labelFn: t => TypeLabels[t] || t },
    { key: 'colors', title: 'اللون', items: options.colors, labelFn: c => c },
    { key: 'materials', title: 'الخامة', items: options.materials, labelFn: m => m }
  ];

  groups.forEach(g => {
    if (!g.items.length) return;
    const group = document.createElement('div');
    group.className = 'filter-group';
    const h = document.createElement('h4');
    h.textContent = g.title;
    group.appendChild(h);

    g.items.forEach(item => {
      const label = document.createElement('label');
      label.className = 'filter-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = item;
      input.checked = FilterState[g.key].has(item);
      input.addEventListener('change', () => {
        if (input.checked) FilterState[g.key].add(item);
        else FilterState[g.key].delete(item);
        onChange();
      });
      const span = document.createElement('span');
      span.textContent = g.labelFn(item);
      label.append(input, span);
      group.appendChild(label);
    });
    container.appendChild(group);
  });

  // زر مسح الفلاتر
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-outline btn-block';
  clearBtn.style.marginTop = '8px';
  clearBtn.textContent = 'مسح الفلاتر';
  clearBtn.addEventListener('click', () => {
    FilterState.types.clear();
    FilterState.colors.clear();
    FilterState.materials.clear();
    container.querySelectorAll('input[type=checkbox]').forEach(i => i.checked = false);
    onChange();
  });
  container.appendChild(clearBtn);
}

/* يزامن نسختي الفلاتر (موبايل وديسكتوب) */
function syncFilterCheckboxes() {
  document.querySelectorAll('.filters input[type=checkbox]').forEach(input => {
    const group = input.closest('.filter-group');
    // لا حاجة لمزامنة معقدة لأن لكل نسخة بناء مستقل؛ نعيد البناء بدلاً من ذلك
  });
}
