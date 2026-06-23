/* =========================================================
   admin.js — لوحة تحكم الأدمن (دخول + إدارة منتجات وطلبات)
   ========================================================= */

const CAT_LABELS = {
  bedroom: 'غرف نوم', kids: 'غرف أطفال', dining: 'سفرة', sectional: 'ركنة',
  living: 'انتريه', display: 'نيش', wardrobe: 'دولاب', bed: 'سرير'
};
const TYPE_LABELS = {
  full_package: 'باكدج بيت كامل', room_package: 'باكدج غرفة', single_item: 'قطعة مفردة'
};
const STATUS_LABELS = {
  pending: 'قيد الانتظار', confirmed: 'مؤكّد', shipped: 'تم الشحن',
  delivered: 'تم التسليم', cancelled: 'ملغي'
};
const STORAGE_BUCKET = 'product-images';

function aesc(s) {
  return String(s ?? '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
}
function splitList(v) {
  return (v || '').split(/[،,]/).map(s => s.trim()).filter(Boolean);
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.adminPage;
  if (page === 'login') initAdminLogin();
  else if (page === 'dashboard') initAdminDashboard();
});

/* =========================================================
   تسجيل الدخول
   ========================================================= */
async function initAdminLogin() {
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  const sb = getSupabase();

  if (!sb) {
    showEl(errEl, 'Supabase غير مُعدّ. ضع المفاتيح في js/supabase.js أولًا.');
  } else {
    const { data } = await sb.auth.getSession();
    if (data.session) { location.replace('dashboard.html'); return; }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';
    if (!sb) return showEl(errEl, 'Supabase غير مُعدّ.');

    const email = form.email.value.trim();
    const password = form.password.value;
    btn.disabled = true; btn.textContent = 'جارٍ الدخول...';

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      btn.disabled = false; btn.textContent = 'دخول';
      return showEl(errEl, 'بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.');
    }
    location.href = 'dashboard.html';
  });
}

function showEl(el, msg) { if (el) { el.textContent = msg; el.style.display = 'block'; } }

/* =========================================================
   لوحة التحكم
   ========================================================= */
let _sb = null;

async function initAdminDashboard() {
  _sb = getSupabase();
  if (!_sb) {
    document.body.innerHTML = '<div style="font-family:Tajawal,sans-serif;text-align:center;padding:60px 20px"><h2>Supabase غير مُعدّ</h2><p>افتح <code>js/supabase.js</code> وضع الـ URL والمفتاح، ثم أعد التحميل.</p><a href="../index.html">العودة للموقع</a></div>';
    return;
  }

  const { data } = await _sb.auth.getSession();
  if (!data.session) { location.replace('login.html'); return; }

  initAdminNav();
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await _sb.auth.signOut();
    location.replace('login.html');
  });

  initProductModal();
  initOrderModal();
  loadProducts();
  loadOrders();

  document.getElementById('orders-status-filter')
    .addEventListener('change', (e) => loadOrders(e.target.value));
}

/* ---------- التنقل بين الأقسام + القائمة الجانبية ---------- */
function initAdminNav() {
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuBtn = document.getElementById('admin-menu');
  const toggle = (open) => {
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
  };
  menuBtn.addEventListener('click', () => toggle(!sidebar.classList.contains('open')));
  overlay.addEventListener('click', () => toggle(false));

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.dataset.nav;
      // مزامنة الحالة النشطة بين السايدبار وتبويبات الموبايل
      document.querySelectorAll('[data-nav]').forEach(l => l.classList.toggle('active', l.dataset.nav === target));
      document.querySelectorAll('.admin-section').forEach(s =>
        s.classList.toggle('active', s.dataset.section === target));
      toggle(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* =========================================================
   المنتجات
   ========================================================= */
async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-row">جارٍ التحميل...</td></tr>';
  const { data, error } = await _sb.from('products').select('*').order('created_at', { ascending: false });
  if (error) { tbody.innerHTML = `<tr><td colspan="7" class="empty-row">خطأ: ${aesc(error.message)}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">لا توجد منتجات بعد.</td></tr>'; return; }

  tbody.innerHTML = '';
  data.forEach(p => {
    const tr = document.createElement('tr');
    const img = (p.images && p.images[0]) || '';
    tr.innerHTML = `
      <td data-label="الصورة"><img class="row-img" src="${aesc(img)}" alt="" onerror="this.style.visibility='hidden'"></td>
      <td data-label="الاسم">${aesc(p.name_ar)}${p.is_active === false ? ' <span class="badge st-cancelled">محذوف</span>' : ''}</td>
      <td data-label="الفئة">${CAT_LABELS[p.category] || p.category}</td>
      <td data-label="النوع">${TYPE_LABELS[p.product_type] || p.product_type}</td>
      <td data-label="المخزون">${p.stock ?? 0}</td>
      <td data-label="مميز">${p.is_featured ? '⭐' : '—'}</td>
      <td data-label="إجراءات"><div class="table-actions">
        <button class="icon-btn" data-edit aria-label="تعديل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg></button>
        <button class="icon-btn danger" data-del aria-label="حذف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
      </div></td>`;
    tr.querySelector('[data-edit]').addEventListener('click', () => openProductModal(p));
    tr.querySelector('[data-del]').addEventListener('click', () => deleteProduct(p));
    tbody.appendChild(tr);
  });
}

/* ---------- Modal المنتج ---------- */
let _modalImages = [];   // الصور الحالية المحتفظ بها (روابط)

function initProductModal() {
  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const fileInput = document.getElementById('p-images');

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal(null));
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(modal)));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

  fileInput.addEventListener('change', renderImagePreview);
  form.addEventListener('submit', saveProduct);
}

function openProductModal(product) {
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-title').textContent = product ? 'تعديل منتج' : 'إضافة منتج';
  document.getElementById('modal-error').style.display = 'none';
  document.getElementById('p-id').value = product ? product.id : '';
  document.getElementById('p-name').value = product ? (product.name_ar || '') : '';
  document.getElementById('p-desc').value = product ? (product.description_ar || '') : '';
  document.getElementById('p-category').value = product ? product.category : 'bedroom';
  document.getElementById('p-type').value = product ? product.product_type : 'single_item';
  document.getElementById('p-price').value = product && product.price != null ? product.price : '';
  document.getElementById('p-stock').value = product ? (product.stock ?? 0) : 0;
  document.getElementById('p-sizes').value = product && product.sizes ? product.sizes.join('، ') : '';
  document.getElementById('p-colors').value = product && product.colors ? product.colors.join('، ') : '';
  document.getElementById('p-featured').checked = product ? !!product.is_featured : false;
  document.getElementById('p-images').value = '';
  _modalImages = product && product.images ? [...product.images] : [];
  renderImagePreview();
  modal.classList.add('open');
}

function renderImagePreview() {
  const wrap = document.getElementById('img-preview');
  const fileInput = document.getElementById('p-images');
  wrap.innerHTML = '';
  _modalImages.forEach((url, idx) => {
    const pv = document.createElement('div');
    pv.className = 'pv';
    pv.innerHTML = `<img src="${aesc(url)}" alt=""><button type="button" aria-label="حذف">×</button>`;
    pv.querySelector('button').addEventListener('click', () => { _modalImages.splice(idx, 1); renderImagePreview(); });
    wrap.appendChild(pv);
  });
  const n = fileInput.files ? fileInput.files.length : 0;
  if (n) {
    const note = document.createElement('div');
    note.className = 'field-hint';
    note.style.width = '100%';
    note.textContent = `سيتم رفع ${n} صورة جديدة عند الحفظ.`;
    wrap.appendChild(note);
  }
}

async function uploadImages(files) {
  const urls = [];
  for (const file of files) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await _sb.storage.from(STORAGE_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = _sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function saveProduct(e) {
  e.preventDefault();
  const modal = document.getElementById('product-modal');
  const errEl = document.getElementById('modal-error');
  const btn = document.getElementById('save-product');
  errEl.style.display = 'none';

  const id = document.getElementById('p-id').value;
  const name = document.getElementById('p-name').value.trim();
  if (!name) { return showEl(errEl, 'اسم المنتج مطلوب.'); }

  const priceRaw = document.getElementById('p-price').value;
  const record = {
    name_ar: name,
    description_ar: document.getElementById('p-desc').value.trim() || null,
    category: document.getElementById('p-category').value,
    product_type: document.getElementById('p-type').value,
    price: priceRaw === '' ? null : Number(priceRaw),
    stock: Number(document.getElementById('p-stock').value) || 0,
    sizes: splitList(document.getElementById('p-sizes').value),
    colors: splitList(document.getElementById('p-colors').value),
    is_featured: document.getElementById('p-featured').checked
  };

  btn.disabled = true; btn.textContent = 'جارٍ الحفظ...';
  try {
    const files = document.getElementById('p-images').files;
    const uploaded = files && files.length ? await uploadImages(files) : [];
    record.images = [..._modalImages, ...uploaded];

    let error;
    if (id) ({ error } = await _sb.from('products').update(record).eq('id', id));
    else    ({ error } = await _sb.from('products').insert(record));
    if (error) throw error;

    closeModal(modal);
    loadProducts();
  } catch (err) {
    console.error(err);
    showEl(errEl, 'خطأ أثناء الحفظ: ' + err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'حفظ';
  }
}

async function deleteProduct(product) {
  if (!confirm(`حذف "${product.name_ar}"؟ (سيُخفى من الموقع)`)) return;
  const { error } = await _sb.from('products').update({ is_active: false }).eq('id', product.id);
  if (error) { alert('خطأ: ' + error.message); return; }
  loadProducts();
}

/* =========================================================
   الطلبات
   ========================================================= */
let _currentFilter = '';

async function loadOrders(statusFilter = '') {
  _currentFilter = statusFilter;
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = '<tr><td colspan="2" class="empty-row">جارٍ التحميل...</td></tr>';
  let q = _sb.from('orders').select('*').order('created_at', { ascending: false });
  if (statusFilter) q = q.eq('status', statusFilter);
  const { data, error } = await q;
  if (error) { tbody.innerHTML = `<tr><td colspan="2" class="empty-row">خطأ: ${aesc(error.message)}</td></tr>`; return; }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="2" class="empty-row">لا توجد طلبات.</td></tr>'; return; }

  tbody.innerHTML = '';
  data.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="العميل">${aesc(o.customer_name)}</td>
      <td data-label="تفاصيل"><button class="icon-btn" data-view aria-label="تفاصيل"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>`;
    tr.querySelector('[data-view]').addEventListener('click', () => viewOrder(o));
    tbody.appendChild(tr);
  });
}

async function updateOrderStatus(id, status, sel) {
  sel.disabled = true;
  const { error } = await _sb.from('orders').update({ status }).eq('id', id);
  sel.disabled = false;
  if (error) { alert('خطأ في تحديث الحالة: ' + error.message); return; }
}

function initOrderModal() {
  const modal = document.getElementById('order-modal');
  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(modal)));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
}

function viewOrder(o) {
  const modal = document.getElementById('order-modal');
  const body = document.getElementById('order-details');
  const date = new Date(o.created_at).toLocaleString('ar-EG');
  const count = (o.items || []).reduce((s, i) => s + (i.qty || 1), 0);
  const items = (o.items || []).map(i => {
    const extra = [i.size, i.color].filter(Boolean).join(' / ');
    return `<div class="order-item-line"><span>${aesc(i.name_ar)}${extra ? ' — ' + aesc(extra) : ''}</span><strong>× ${i.qty}</strong></div>`;
  }).join('');
  const statusOptions = Object.keys(STATUS_LABELS)
    .map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('');

  body.innerHTML = `
    <div class="summary-line"><span>رقم الطلب</span><strong>${aesc(o.order_number)}</strong></div>
    <div class="form-row" style="margin:14px 0">
      <label>حالة الطلب</label>
      <select class="admin-input" id="order-status-select" style="width:100%">${statusOptions}</select>
    </div>
    <div class="summary-line"><span>الاسم</span><strong>${aesc(o.customer_name)}</strong></div>
    <div class="summary-line"><span>الهاتف</span><strong><a href="tel:${aesc(o.customer_phone)}">${aesc(o.customer_phone)}</a></strong></div>
    <div class="summary-line"><span>المحافظة</span><strong>${aesc(o.customer_city)}</strong></div>
    <div class="summary-line"><span>العنوان</span><strong style="max-width:60%;text-align:start">${aesc(o.customer_address)}</strong></div>
    ${o.notes ? `<div class="summary-line"><span>ملاحظات</span><strong style="max-width:60%;text-align:start">${aesc(o.notes)}</strong></div>` : ''}
    <div class="summary-line"><span>عدد القطع</span><strong>${count}</strong></div>
    <div class="summary-line"><span>التاريخ</span><strong>${aesc(date)}</strong></div>
    <h4 style="margin:16px 0 8px">المنتجات</h4>
    ${items}`;

  // تغيير الحالة من داخل البوب أب
  const sel = body.querySelector('#order-status-select');
  sel.addEventListener('change', async () => {
    await updateOrderStatus(o.id, sel.value, sel);
    o.status = sel.value;
    loadOrders(_currentFilter);
  });

  modal.classList.add('open');
}

/* ---------- أدوات ---------- */
function closeModal(modal) { modal.classList.remove('open'); }
