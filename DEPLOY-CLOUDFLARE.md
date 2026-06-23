# نشر متجر وائل شداد على Cloudflare Pages

شبكة Cloudflare بتتفتح ممتاز من مصر (بعكس `netlify.app` اللي بيتحجب أحيانًا).
المشروع كله **static** (HTML/CSS/JS) — **مفيش build step**، فالنشر بسيط جدًا.

---

## الطريقة (أ) — رفع مباشر من الداشبورد (الأسهل، بدون GitHub)

1. ادخل <https://dash.cloudflare.com> واعمل حساب مجاني (أو سجّل دخول).
2. من القائمة الجانبية: **Workers & Pages** → **Create application** → تبويب **Pages** → **Upload assets**.
3. اكتب اسم المشروع، مثلاً `wael-shaddad`.
4. **اسحب مجلد المشروع كله** (محتويات `wail_furniture`) على الصفحة، أو اعمله ZIP وارفعه.
   - ملاحظة: ارفع **محتويات** الفولدر (index.html والمجلدات) — مش الفولدر نفسه جوّه فولدر.
5. اضغط **Deploy**.
6. هيطلعلك رابط فورًا بالشكل: `https://wael-shaddad.pages.dev`

> أي تحديث بعدين: نفس الخطوة (Upload assets) وارفع النسخة الجديدة.

---

## الطريقة (ب) — ربط GitHub (نشر تلقائي مع كل تعديل)

1. ارفع المشروع على GitHub repo (لو مش مرفوع).
2. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. اختر الـ repo.
4. إعدادات البناء:
   - **Framework preset:** `None`
   - **Build command:** *(اتركه فاضي)*
   - **Build output directory:** `/`  (الجذر — لأن index.html في الجذر)
5. **Save and Deploy**.
6. بعد كده أي `git push` بينشر تلقائيًا.

---

## دومين خاص (اختياري — موصى به للإطلاق)

1. في صفحة مشروع الـ Pages → **Custom domains** → **Set up a custom domain**.
2. اكتب دومينك (مثلاً `waelshaddad.com`).
3. لو الدومين على Cloudflare، بيتظبط أوتوماتيك. لو على مكان تاني، Cloudflare هيديك سجلات DNS تحطها عند مزوّد الدومين.

---

## ملاحظات مهمة للمشروع

- **مفاتيح Supabase** موجودة في `js/supabase.js` وهتترفع مع الموقع — وده سليم (الـ anon key مخصص للواجهة ومحمي بـ RLS).
- **CORS / Supabase:** مش محتاج أي إعداد إضافي — Supabase بيقبل الطلبات من أي origin بالـ anon key. (لو حبيت تأمين أكتر لاحقًا، ممكن تحدد Allowed origins من إعدادات Supabase.)
- **الصور المحلية** (`images/about/...`, `images/logo/...`) بتترفع مع المشروع وتشتغل عادي.
- **لوحة التحكم** (`/admin/login.html`) هتشتغل على نفس الدومين الجديد بدون أي تعديل.
- مفيش حاجة محتاجة تتغيّر في الكود — كل الروابط نسبية (relative).

---

## بعد النشر — تأكيد سريع
1. افتح `https://<مشروعك>.pages.dev` → لازم الرئيسية تظهر بالمنتجات.
2. افتح **Console (F12)** → لازم تشوف `✅ Supabase connected`.
3. جرّب: إضافة منتج للسلة → checkout → الطلب يظهر في لوحة التحكم.
