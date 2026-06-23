/* =========================================================
   render.js — بناء الكروت والعناصر في الصفحات
   ========================================================= */

/* كارت منتج/باكدج واحد */
function createProductCard(product) {
  const href = 'product.html?id=' + encodeURIComponent(product.id);

  const card = document.createElement('article');
  card.className = 'product-card reveal';
  card.tabIndex = 0;
  card.setAttribute('role', 'link');
  card.setAttribute('aria-label', product.name);

  // الضغط على أي مكان في الكارت (أو الصورة) يفتح صفحة التفاصيل
  const goDetails = () => { window.location.href = href; };
  card.addEventListener('click', goDetails);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goDetails(); }
  });

  const media = document.createElement('div');
  media.className = 'product-media';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = product.name;
  img.src = (product.images && product.images[0]) || '';
  attachImgFallback(img, product.name);
  media.appendChild(img);

  const badge = document.createElement('span');
  badge.className = 'type-badge type-' + product.type;
  badge.textContent = getTypeLabel(product.type);
  media.appendChild(badge);

  const body = document.createElement('div');
  body.className = 'product-body';

  const title = document.createElement('h3');
  title.textContent = product.name;

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = product.short_description || '';

  const actions = document.createElement('div');
  actions.className = 'product-actions';

  const detailsBtn = document.createElement('a');
  detailsBtn.className = 'btn btn-outline';
  detailsBtn.href = href;
  detailsBtn.textContent = 'التفاصيل';
  detailsBtn.addEventListener('click', (e) => e.stopPropagation());

  const cartBtn = document.createElement('button');
  cartBtn.className = 'btn btn-cart';
  cartBtn.innerHTML = cartIcon(16) + '<span>أضف للسلة</span>';
  cartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const size = (product.sizes && product.sizes[0]) || null;
    const color = (product.colors && product.colors[0]) || null;
    cart.add(product, 1, size, color);
    showToast('تمت إضافة "' + product.name + '" إلى السلة');
  });

  actions.append(detailsBtn, cartBtn);
  body.append(title, desc, actions);
  card.append(media, body);

  // لمسة Tilt 3D خفيفة تتبع الماوس (تُتجاهل على الموبايل)
  if (typeof attachTilt === 'function') attachTilt(card);

  return card;
}

/* عرض شبكة منتجات داخل حاوية */
function renderProducts(container, products) {
  container.innerHTML = '';
  if (!products.length) {
    container.innerHTML = '<div class="empty-state">لا توجد منتجات مطابقة حاليًا. جرّب تغيير الفلاتر أو تواصل معنا عبر واتساب.</div>';
    return;
  }
  const frag = document.createDocumentFragment();
  products.forEach(p => frag.appendChild(createProductCard(p)));
  container.appendChild(frag);
  observeReveals(container);
}

/* كارت غرفة (تسوق حسب الغرفة) */
function createRoomCard(cat) {
  const a = document.createElement('a');
  a.className = 'room-card reveal';
  a.href = 'products.html?category=' + encodeURIComponent(cat.id);

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = cat.name;
  img.src = cat.image || '';
  attachImgFallback(img, cat.name);

  const label = document.createElement('span');
  label.className = 'room-label';
  label.textContent = cat.name;

  a.append(img, label);
  return a;
}

function renderRooms(container, categories) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  categories.forEach(c => frag.appendChild(createRoomCard(c)));
  container.appendChild(frag);
  observeReveals(container);
}

/* هياكل تحميل وهمية (Skeleton) */
function renderSkeletons(container, count = 4) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.insertAdjacentHTML('beforeend', `
      <div class="skeleton-card">
        <div class="skeleton-media shimmer"></div>
        <div class="skeleton-line shimmer"></div>
        <div class="skeleton-line short shimmer"></div>
      </div>`);
  }
}

/* أيقونة السلة SVG */
function cartIcon(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`;
}

/* أيقونة واتساب SVG */
function waIcon(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>`;
}
