/* =========================================================
   checkout.js — إتمام الطلب (بدون أسعار) + تسجيل في Supabase + واتساب
   ========================================================= */

const GOVERNORATES = [
  'القاهرة','الجيزة','الإسكندرية','القليوبية','الدقهلية','الشرقية','الغربية','المنوفية',
  'كفر الشيخ','البحيرة','دمياط','بورسعيد','الإسماعيلية','السويس','شمال سيناء','جنوب سيناء',
  'الفيوم','بني سويف','المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','مطروح','الوادي الجديد'
];

function initCheckoutPage() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  // لو السلة فارغة → رجوع للسلة
  const items = cart.get();
  if (!items.length) { location.replace('cart.html'); return; }

  // ملء المحافظات
  const citySel = document.getElementById('city');
  GOVERNORATES.forEach(g => {
    const o = document.createElement('option');
    o.value = g; o.textContent = g;
    citySel.appendChild(o);
  });

  // ملخص العناصر
  renderCheckoutSummary(items);

  const errEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-order');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.style.display = 'none';

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const city = form.city.value;
    const address = form.address.value.trim();
    const notes = form.notes.value.trim();

    // تحقق
    if (!name || !phone || !city || !address) {
      return showError(errEl, 'من فضلك املأ كل الحقول المطلوبة (*).');
    }
    if (!/^01[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      return showError(errEl, 'رقم الهاتف غير صحيح — لازم يكون 11 رقم ويبدأ بـ 01.');
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'جارٍ إرسال الطلب...';

    const orderItems = items.map(i => ({
      id: i.id, name_ar: i.name, qty: i.qty, size: i.size, color: i.color, image: i.image
    }));

    const payload = {
      customer_name: name,
      customer_phone: phone,
      customer_city: city,
      customer_address: address,
      notes: notes || null,
      items: orderItems,
      total_price: null,
      status: 'pending'
    };

    let orderNumber;
    try {
      orderNumber = await saveOrder(payload);
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'تأكيد الطلب عبر واتساب';
      return showError(errEl, 'حصل خطأ أثناء حفظ الطلب. حاول تاني أو تواصل معنا على واتساب.');
    }

    // رسالة واتساب
    const waMessage = buildOrderMessage(orderNumber, payload, items);
    sessionStorage.setItem('ws_last_order', orderNumber);
    cart.clear();
    openWhatsapp(waMessage);
    location.href = 'order-success.html';
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* توليد رقم طلب: WS-YEAR-#### */
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `WS-${year}-${rand}`;
}

/* حفظ الطلب في Supabase مع إعادة المحاولة عند تكرار رقم الطلب */
async function saveOrder(payload) {
  const sb = (typeof getSupabase === 'function') ? getSupabase() : null;
  let orderNumber = generateOrderNumber();

  if (!sb) {
    // وضع تجريبي بدون باك إند — نكمّل بدون حفظ
    console.warn('Supabase غير مُعدّ — لم يتم حفظ الطلب في قاعدة البيانات (وضع تجريبي).');
    return orderNumber;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await sb.from('orders').insert({ ...payload, order_number: orderNumber });
    if (!error) return orderNumber;
    if (error.code === '23505') { orderNumber = generateOrderNumber(); continue; } // رقم مكرر
    throw error;
  }
  throw new Error('تعذّر توليد رقم طلب فريد');
}

/* بناء رسالة واتساب (بدون أسعار) */
function buildOrderMessage(orderNumber, payload, items) {
  const lines = items.map(i => {
    let line = `• ${i.name} × ${i.qty}`;
    const extra = [];
    if (i.size) extra.push('مقاس: ' + i.size);
    if (i.color) extra.push('لون: ' + i.color);
    if (extra.length) line += ` (${extra.join('، ')})`;
    return line;
  }).join('\n');

  return `🛋️ طلب جديد من موقع وائل شداد

رقم الطلب: ${orderNumber}
الاسم: ${payload.customer_name}
التليفون: ${payload.customer_phone}
العنوان: ${payload.customer_city} — ${payload.customer_address}
${payload.notes ? 'ملاحظات: ' + payload.notes + '\n' : ''}
المنتجات:
${lines}

طلب عرض سعر — الدفع كاش عند الاستلام`;
}

/* ملخص العناصر في صفحة الـ checkout */
function renderCheckoutSummary(items) {
  const wrap = document.getElementById('checkout-items');
  const esc = (typeof escapeHtml === 'function') ? escapeHtml : (s => s);
  if (wrap) {
    wrap.innerHTML = items.map(i => {
      const extra = [i.size, i.color].filter(Boolean).join(' / ');
      return `<div class="summary-line"><span>${esc(i.name)}${extra ? ' — ' + esc(extra) : ''}</span><strong>× ${i.qty}</strong></div>`;
    }).join('');
  }
  const c = document.getElementById('co-count');
  if (c) c.textContent = cart.count();
}
