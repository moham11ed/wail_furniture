/* =========================================================
   supabase.js — الاتصال بـ Supabase
   يعتمد على مكتبة @supabase/supabase-js المحمّلة عبر CDN (window.supabase)
   ========================================================= */

// ⚠️ استبدل القيم دي بالقيم الحقيقية من Supabase Dashboard > Project Settings > API
//    SUPABASE_URL  = الرابط الكامل (Project URL) ويبدأ بـ https://...supabase.co
//    SUPABASE_ANON = مفتاح "anon public" (نص طويل جدًا يبدأ بـ eyJ...)
const SUPABASE_URL  = 'https://pbemsffoaqbecowdmuhi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZW1zZmZvYXFiZWNvd2RtdWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzA5MjcsImV4cCI6MjA5NzgwNjkyN30.upX7DOVeb_RGVbPWuduMM_rmOO-U1Wfb-ocPpM0-ap8';

let _client = null;

/* يُرجع عميل Supabase، أو null لو الإعداد ناقص (وضع تجريبي بدون باك إند) */
function getSupabase() {
  if (_client) return _client;
  const configured =
    SUPABASE_URL && SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON && !SUPABASE_ANON.startsWith('YOUR_') && SUPABASE_ANON.length > 40;
  if (!configured) return null;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('مكتبة supabase-js غير محمّلة. تأكد من سكربت الـ CDN.');
    return null;
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _client;
}

/* هل Supabase مُعدّ فعليًا؟ */
function isSupabaseReady() {
  return getSupabase() !== null;
}

/* اختبار الاتصال — استدعِه من الـ Console للتأكد */
async function checkConnection() {
  const sb = getSupabase();
  if (!sb) {
    console.warn('⚠️ Supabase غير مُعدّ — ضع المفاتيح في js/supabase.js (وضع تجريبي حاليًا).');
    return false;
  }
  try {
    const { error } = await sb.from('products').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected');
    return true;
  } catch (err) {
    console.error('❌ فشل الاتصال بـ Supabase:', err.message);
    return false;
  }
}

// اختبار تلقائي خفيف عند التحميل
document.addEventListener('DOMContentLoaded', () => { try { checkConnection(); } catch (_) {} });
