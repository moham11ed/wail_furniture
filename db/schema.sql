-- ============================================================
--  متجر وائل شداد للأثاث — مخطط قاعدة البيانات (Supabase / PostgreSQL)
--  شغّل هذا الملف بالكامل مرة واحدة في: Supabase Dashboard > SQL Editor
-- ============================================================

-- ----------------------------------------------------------------
-- 1) جدول المنتجات
--    ملاحظة: price اختياري (nullable) — السعر حقل داخلي للأدمن فقط
--    ولا يُعرض للعميل إطلاقًا (نموذج "طلب عرض سعر").
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar        text NOT NULL,
  description_ar text,
  price          numeric,                 -- اختياري / داخلي فقط
  category       text NOT NULL,           -- 'bedroom'|'kids'|'dining'|'sectional'|'living'|'display'|'wardrobe'|'bed'
  product_type   text NOT NULL,           -- 'full_package'|'room_package'|'single_item'
  sizes          text[],                  -- ['160×200','180×200']
  colors         text[],                  -- ['أبيض','بيج','رمادي']
  images         text[],                  -- روابط صور Supabase Storage أو خارجية
  stock          int DEFAULT 0,
  is_featured    boolean DEFAULT false,
  is_active      boolean DEFAULT true,
  created_at     timestamp DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2) جدول الطلبات
--    ملاحظة: total_price اختياري (nullable) — مفيش إجمالي يُعرض للعميل.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number     text UNIQUE NOT NULL,  -- مثال: WS-2026-0001
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,
  customer_address text NOT NULL,
  customer_city    text NOT NULL,
  items            jsonb NOT NULL,        -- [{id,name_ar,qty,size,color,image}]
  total_price      numeric,               -- اختياري (يفضل فاضي)
  status           text DEFAULT 'pending',-- pending|confirmed|shipped|delivered|cancelled
  notes            text,
  created_at       timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);

-- ----------------------------------------------------------------
-- 3) Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;

-- المنتجات: قراءة عامة للنشِط فقط، وتحكّم كامل للأدمن (مسجّل دخول)
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "products_admin_all" ON products;
CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- الطلبات: إضافة للجميع (anon)، قراءة وتعديل للأدمن فقط
DROP POLICY IF EXISTS "orders_public_insert" ON orders;
CREATE POLICY "orders_public_insert" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_read" ON orders;
CREATE POLICY "orders_admin_read" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 4) Storage: bucket لصور المنتجات + سياساته
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- 5) بيانات تجريبية (بدون أسعار) — صور من Unsplash لحين رفع صور حقيقية
-- ----------------------------------------------------------------
INSERT INTO products (name_ar, description_ar, category, product_type, sizes, colors, images, stock, is_featured) VALUES
('باكدج غرفة نوم مودرن - موديل أثينا',
 'غرفة نوم مودرن كاملة بتشطيب فاخر وخامات أصلية، مع إمكانية اختيار الألوان والمقاسات حسب رغبتك.',
 'bedroom', 'room_package',
 ARRAY['160×200','180×200','200×200'], ARRAY['بني جوز الهند','رمادي مطفي','أبيض لؤلؤي'],
 ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80&auto=format&fit=crop'],
 5, true),

('دولاب 3 أبواب موديل ميلانو',
 'دولاب فاخر بثلاثة أبواب وتصميم عصري بسيط يناسب جميع غرف النوم، بمساحة تخزين كبيرة وأرفف منظّمة.',
 'wardrobe', 'single_item',
 ARRAY['180 سم','220 سم'], ARRAY['أبيض','بني غامق'],
 ARRAY['https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=900&q=80&auto=format&fit=crop'],
 8, false),

('باكدج بيت كامل - موديل النخبة',
 'باكدج شامل لتأثيث منزلك بالكامل: غرفة نوم ماستر + طقم سفرة + طقم انتريه، بأسلوب راقٍ ومتناسق.',
 'bedroom', 'full_package',
 ARRAY['حسب الطلب'], ARRAY['بني خشبي','بيج فاتح'],
 ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=80&auto=format&fit=crop'],
 3, true),

('باكدج سفرة فاخرة - موديل فيرونا',
 'طقم سفرة متكامل يتسع لـ 8 أفراد مع بوفيه وفاترينة عرض، بتصميم كلاسيك مودرن وخامات منتقاة.',
 'dining', 'room_package',
 ARRAY['8 أفراد','6 أفراد'], ARRAY['بني داكن','بيج ذهبي'],
 ARRAY['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900&q=80&auto=format&fit=crop'],
 4, true),

('ركنة مودرن زاوية - موديل كومفورت',
 'ركنة زاوية واسعة ومريحة بإسفنج عالي الكثافة وقماش متين سهل التنظيف، متوفرة باتجاه يمين أو شمال.',
 'sectional', 'single_item',
 ARRAY['280 سم','320 سم'], ARRAY['بيج','رمادي','أخضر زيتي'],
 ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1616627561839-074385245ff6?w=900&q=80&auto=format&fit=crop'],
 6, false),

('باكدج غرفة أطفال - موديل بيبي جوي',
 'غرفة أطفال متكاملة بتصميم مرح وحواف آمنة وخامات صحية، تشمل سرير ودولاب ومكتب ووحدة أدراج.',
 'kids', 'room_package',
 ARRAY['120×200','160×200'], ARRAY['أبيض وسماوي','أبيض ووردي','خشبي فاتح'],
 ARRAY['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80&auto=format&fit=crop'],
 5, true),

('نيش تلفزيون مودرن - موديل سكاي',
 'وحدة نيش وتلفزيون معلّقة بتصميم عصري، أرفف عرض مفتوحة وأدراج مغلقة وإضاءة LED اختيارية.',
 'display', 'single_item',
 ARRAY['180 سم','220 سم'], ARRAY['أبيض لامع','أسود مطفي','خشبي بني'],
 ARRAY['https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=80&auto=format&fit=crop','https://images.unsplash.com/photo-1611967164521-abae8fba4668?w=900&q=80&auto=format&fit=crop'],
 7, false);

-- تم ✅
