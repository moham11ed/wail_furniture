/* =========================================================
   data.js — تحميل بيانات JSON والتعامل مع الصور البديلة
   ========================================================= */

const DataStore = {
  _cache: {},

  async _load(path) {
    if (this._cache[path]) return this._cache[path];
    const res = await fetch(path);
    if (!res.ok) throw new Error('تعذر تحميل البيانات: ' + path);
    const json = await res.json();
    this._cache[path] = json;
    return json;
  },

  getProducts() { return this._load('data/products.json'); },
  getCategories() { return this._load('data/categories.json'); },
  getSettings() { return this._load('data/settings.json'); },

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async getByCategory(catId) {
    const products = await this.getProducts();
    return products.filter(p => p.category === catId);
  },

  async getFeatured() {
    const products = await this.getProducts();
    return products.filter(p => p.featured);
  }
};

/* صورة بديلة (Placeholder) تُولّد كـ SVG عند فشل تحميل الصورة الحقيقية */
function placeholderSVG(label) {
  const text = (label || 'وائل شداد').slice(0, 22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3B2B22"/>
        <stop offset="1" stop-color="#2B2118"/>
      </linearGradient>
    </defs>
    <rect width="600" height="450" fill="url(#g)"/>
    <text x="300" y="210" fill="#B8915A" font-size="34" font-family="Tajawal, sans-serif" font-weight="bold" text-anchor="middle">وائل شداد</text>
    <text x="300" y="255" fill="#F4EEE5" font-size="20" font-family="Tajawal, sans-serif" text-anchor="middle">${escapeXml(text)}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

/* يربط معالج onerror لأي صورة لاستبدالها بالبديل */
function attachImgFallback(img, label) {
  img.addEventListener('error', function handler() {
    img.removeEventListener('error', handler);
    img.src = placeholderSVG(label);
  });
}
