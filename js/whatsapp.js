/* =========================================================
   whatsapp.js — منطق إرسال الطلب عبر واتساب
   ========================================================= */

const WHATSAPP_NUMBER = "201272073305";

/* ترجمة نوع المنتج لنص عربي واضح */
function getTypeLabel(type) {
  switch (type) {
    case 'full_package': return 'باكدج بيت كامل';
    case 'room_package': return 'باكدج غرفة واحدة';
    case 'single_item': return 'قطعة مفردة';
    default: return 'منتج';
  }
}

/* يبني لينك صفحة المنتج بشكل صحيح */
function productUrl(id) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return base + 'product.html?id=' + encodeURIComponent(id);
}

/* يفتح محادثة واتساب جاهزة لمنتج محدد */
function sendToWhatsapp(product) {
  const message = `مرحبًا، أنا مهتم بمعرفة السعر والتفاصيل الخاصة بـ:
المنتج: ${product.name}
النوع: ${getTypeLabel(product.type)}
الكود: ${product.id}
رابط المنتج: ${productUrl(product.id)}`;
  openWhatsapp(message);
}

/* رسالة عامة (للزر العائم / الهيدر) */
function sendGeneralWhatsapp(customMessage) {
  const message = customMessage || "السلام عليكم، حابب أستفسر عن منتجات معرض وائل شداد للأثاث";
  openWhatsapp(message);
}

function openWhatsapp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
