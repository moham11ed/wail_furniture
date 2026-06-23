/* =========================================================
   data.js — طبقة البيانات: Supabase أولًا، ووضع تجريبي محلي كاحتياطي
   تُحافظ على نفس أسماء الدوال التي يستخدمها باقي الكود.
   ========================================================= */

/* توحيد شكل صف Supabase ليطابق الشكل الذي تتوقعه واجهة العرض */
function normalizeProduct(row) {
  if (!row) return null;
  // صف محلي (data/products.json) جاهز بالفعل بالشكل المطلوب
  if (row.name && !row.name_ar) return row;
  return {
    id: row.id,
    name: row.name_ar,
    description: row.description_ar || '',
    short_description: row.description_ar || '',
    type: row.product_type,
    category: row.category,
    sizes: row.sizes || [],
    colors: row.colors || [],
    materials: row.materials || [],
    images: row.images || [],
    dimensions: row.dimensions || '',
    includes: row.includes || [],
    tags: row.tags || [],
    stock: row.stock,
    featured: !!row.is_featured
  };
}

const DataStore = {
  _cache: {},

  async _loadLocal(path) {
    if (this._cache[path]) return this._cache[path];
    const res = await fetch(path);
    if (!res.ok) throw new Error('تعذر تحميل البيانات: ' + path);
    const json = await res.json();
    this._cache[path] = json;
    return json;
  },

  async getCategories() { return this._loadLocal('data/categories.json'); },
  async getSettings() { return this._loadLocal('data/settings.json'); },

  /* كل المنتجات النشطة */
  async getProducts() {
    const sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (sb) {
      const { data, error } = await sb.from('products')
        .select('*').eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(normalizeProduct);
    }
    // وضع تجريبي
    const local = await this._loadLocal('data/products.json');
    return local.map(normalizeProduct);
  },

  async getProductById(id) {
    const sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (sb) {
      const { data, error } = await sb.from('products').select('*').eq('id', id).single();
      if (error) return null;
      return normalizeProduct(data);
    }
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  async getByCategory(catId) {
    const sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (sb) {
      const { data, error } = await sb.from('products')
        .select('*').eq('is_active', true).eq('category', catId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(normalizeProduct);
    }
    const products = await this.getProducts();
    return products.filter(p => p.category === catId);
  },

  async getFeatured() {
    const sb = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (sb) {
      const { data, error } = await sb.from('products')
        .select('*').eq('is_active', true).eq('is_featured', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(normalizeProduct);
    }
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
