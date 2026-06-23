/* =========================================================
   cart.js — منطق سلة "طلب عرض سعر" (localStorage، بدون أسعار)
   ========================================================= */

const CART_KEY = 'ws_cart_v1';

const cart = {
  /* قراءة السلة */
  get() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  },

  /* حفظ + تحديث الـ badge */
  _save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartBadge();
  },

  /* إضافة منتج (مع مقاس ولون اختياريين). المتغيرات المختلفة تُحفظ كأسطر منفصلة */
  add(product, qty = 1, size = null, color = null) {
    const items = this.get();
    const key = [product.id, size || '', color || ''].join('|');
    const existing = items.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key,
        id: product.id,
        name: product.name,
        image: (product.images && product.images[0]) || '',
        type: product.type || '',
        size: size || null,
        color: color || null,
        qty
      });
    }
    this._save(items);
  },

  remove(key) {
    this._save(this.get().filter(i => i.key !== key));
  },

  updateQty(key, qty) {
    const items = this.get();
    const it = items.find(i => i.key === key);
    if (it) { it.qty = Math.max(1, qty); this._save(items); }
  },

  clear() { this._save([]); },

  count() { return this.get().reduce((s, i) => s + i.qty, 0); }
};

/* تحديث شارة عدد عناصر السلة في كل الهيدرات */
function updateCartBadge() {
  const n = cart.count();
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? 'grid' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);

/* =========================================================
   عرض صفحة السلة (cart.html)
   ========================================================= */
function renderCartPage() {
  const root = document.getElementById('cart-root');
  if (!root) return;

  const items = cart.get();
  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <p style="font-size:1.1rem;margin-bottom:18px">سلتك فارغة حاليًا.</p>
        <a href="products.html" class="btn btn-primary">تصفّح المنتجات</a>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items" id="cart-items"></div>
      <aside class="cart-summary">
        <h3>ملخص الطلب</h3>
        <div class="summary-line"><span>عدد القطع</span><strong id="sum-count">0</strong></div>
        <div class="summary-note">الأسعار تُحدَّد عند التواصل — أكمل بياناتك وهنرسل لك عرض السعر عبر واتساب. الدفع كاش عند الاستلام.</div>
        <a href="checkout.html" class="btn btn-primary">إتمام الطلب</a>
        <a href="products.html" class="btn btn-outline">متابعة التسوق</a>
      </aside>
    </div>`;

  const list = root.querySelector('#cart-items');

  const paint = () => {
    const its = cart.get();
    if (!its.length) { renderCartPage(); return; }
    list.innerHTML = '';
    its.forEach(it => list.appendChild(buildCartRow(it, paint)));
    const c = root.querySelector('#sum-count');
    if (c) c.textContent = cart.count();
  };
  paint();
}

function buildCartRow(item, onChange) {
  const esc = (typeof escapeHtml === 'function') ? escapeHtml : (s => s);
  const row = document.createElement('div');
  row.className = 'cart-row';

  const meta = [];
  if (item.size) meta.push(`<span>المقاس: ${esc(item.size)}</span>`);
  if (item.color) meta.push(`<span>اللون: ${esc(item.color)}</span>`);

  row.innerHTML = `
    <a class="thumb" href="product.html?id=${encodeURIComponent(item.id)}"><img alt="${esc(item.name)}"></a>
    <div class="info">
      <h3><a href="product.html?id=${encodeURIComponent(item.id)}">${esc(item.name)}</a></h3>
      <div class="meta">${meta.join('')}</div>
    </div>
    <div class="controls">
      <div class="qty-stepper">
        <button type="button" data-act="dec" aria-label="تقليل">−</button>
        <span class="qty-val">${item.qty}</span>
        <button type="button" data-act="inc" aria-label="زيادة">+</button>
      </div>
      <button type="button" class="cart-remove" data-act="rm">حذف</button>
    </div>`;

  const img = row.querySelector('img');
  img.src = item.image || '';
  if (typeof attachImgFallback === 'function') attachImgFallback(img, item.name);

  row.querySelector('[data-act=inc]').addEventListener('click', () => { cart.updateQty(item.key, item.qty + 1); onChange(); });
  row.querySelector('[data-act=dec]').addEventListener('click', () => { cart.updateQty(item.key, item.qty - 1); onChange(); });
  row.querySelector('[data-act=rm]').addEventListener('click', () => { cart.remove(item.key); onChange(); });

  return row;
}
