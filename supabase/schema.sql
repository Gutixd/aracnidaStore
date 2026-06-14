-- ============================================================
-- ARACNIDA STORE - Esquema de base de datos
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CATEGORÍAS
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price NUMERIC(10,0) NOT NULL CHECK (price >= 0),
  cost_price NUMERIC(10,0) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  size TEXT NOT NULL DEFAULT 'Única',
  color TEXT NOT NULL DEFAULT 'Rojo/Azul',
  image_url TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IMÁGENES DE PRODUCTO
-- ============================================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO
-- ============================================================
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('increase','decrease','adjust','sale','return')),
  quantity INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PEDIDOS
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  subtotal NUMERIC(10,0) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10,0) NOT NULL DEFAULT 0,
  discount NUMERIC(10,0) NOT NULL DEFAULT 0,
  total NUMERIC(10,0) NOT NULL DEFAULT 0,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery','retiro')) DEFAULT 'retiro',
  delivery_address TEXT DEFAULT '',
  delivery_commune TEXT DEFAULT '',
  delivery_reference TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pendiente','confirmado','en_preparacion','en_reparto','entregado','cancelado')) DEFAULT 'pendiente',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pendiente','pagado')) DEFAULT 'pendiente',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITEMS DE PEDIDO
-- ============================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,0) NOT NULL,
  total_price NUMERIC(10,0) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GASTOS
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  amount NUMERIC(10,0) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('inventario','envio','operacion','marketing','otro')) DEFAULT 'otro',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONFIGURACIÓN DE TIENDA
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'AracnidaStore',
  shipping_cost NUMERIC(10,0) NOT NULL DEFAULT 3000,
  free_shipping_threshold NUMERIC(10,0) NOT NULL DEFAULT 50000,
  contact_email TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  address TEXT DEFAULT '',
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOG DE NOTIFICACIONES
-- ============================================================
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT DEFAULT ''
);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorías
INSERT INTO categories (name, slug, description) VALUES
  ('Trajes', 'trajes', 'Trajes completos inspirados en Spider-Man'),
  ('Máscaras', 'mascaras', 'Máscaras y capuchas de alta calidad'),
  ('Accesorios', 'accesorios', 'Guantes, lanzatelarañas y más');

-- Configuración inicial
INSERT INTO settings (store_name, shipping_cost, free_shipping_threshold, low_stock_threshold)
VALUES ('AracnidaStore', 3000, 50000, 3);

-- Productos de ejemplo
INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Traje Clásico Spider-Man Rojo/Azul',
  'traje-clasico-spiderman-rojo-azul-m',
  'Traje premium de alta fidelidad con tejido elástico de 4 vías, costuras reforzadas y diseño musculado. Talla M. Material: Lycra/Spandex 95% + 5% Elastano.',
  49900,
  18000,
  10,
  'TRJ-M-ROJ-001',
  c.id,
  'M',
  'Rojo/Azul',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800',
  TRUE,
  TRUE
FROM categories c WHERE c.slug = 'trajes';

INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Traje Clásico Spider-Man Rojo/Azul',
  'traje-clasico-spiderman-rojo-azul-l',
  'Traje premium de alta fidelidad con tejido elástico de 4 vías, costuras reforzadas y diseño musculado. Talla L. Material: Lycra/Spandex 95% + 5% Elastano.',
  49900,
  18000,
  8,
  'TRJ-L-ROJ-002',
  c.id,
  'L',
  'Rojo/Azul',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800',
  TRUE,
  FALSE
FROM categories c WHERE c.slug = 'trajes';

INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Traje Negro Spider-Man Simbionte',
  'traje-negro-spiderman-simbionte-m',
  'Traje edición oscura inspirado en el simbionte. Negro intenso con detalles plateados. Talla M. Material premium de alta durabilidad.',
  59900,
  22000,
  5,
  'TRJ-M-NEG-003',
  c.id,
  'M',
  'Negro/Plateado',
  'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=800',
  TRUE,
  TRUE
FROM categories c WHERE c.slug = 'trajes';

INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Máscara Spider-Man Clásica',
  'mascara-spiderman-clasica',
  'Máscara de tela elástica con lentes integrados de espuma EVA. Alta fidelidad a la versión clásica. Talla única ajustable.',
  15900,
  5000,
  20,
  'MSK-UN-ROJ-004',
  c.id,
  'Única',
  'Rojo/Azul',
  'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
  TRUE,
  TRUE
FROM categories c WHERE c.slug = 'mascaras';

INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Máscara Spider-Man Negro',
  'mascara-spiderman-negro',
  'Máscara edición oscura, negro total con tela premium. Lentes integrados con visión panorámica. Talla única.',
  17900,
  6000,
  15,
  'MSK-UN-NEG-005',
  c.id,
  'Única',
  'Negro',
  'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800',
  TRUE,
  FALSE
FROM categories c WHERE c.slug = 'mascaras';

INSERT INTO products (name, slug, description, price, cost_price, stock, sku, category_id, size, color, image_url, active, featured)
SELECT
  'Traje Spider-Man XL Premium',
  'traje-spiderman-xl-premium',
  'Versión XL del traje clásico con material mejorado y mayor resistencia. Ideal para uso intensivo. Rojo/Azul.',
  54900,
  20000,
  3,
  'TRJ-XL-ROJ-006',
  c.id,
  'XL',
  'Rojo/Azul',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800',
  TRUE,
  FALSE
FROM categories c WHERE c.slug = 'trajes';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Políticas: productos públicos visibles por todos
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (active = TRUE);

-- Políticas: categorías públicas
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (TRUE);

-- Políticas: imágenes públicas
CREATE POLICY "product_images_public_read"
  ON product_images FOR SELECT
  USING (TRUE);

-- Políticas: configuración pública (solo lectura)
CREATE POLICY "settings_public_read"
  ON settings FOR SELECT
  USING (TRUE);

-- Para el service role (admin): acceso total a todo
-- Esto se maneja automáticamente ya que service_role bypasea RLS.

-- Políticas: pedidos solo para service_role (admin)
-- Los clientes crean pedidos mediante server action con service_role
CREATE POLICY "orders_service_only"
  ON orders FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "order_items_service_only"
  ON order_items FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "expenses_service_only"
  ON expenses FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "inventory_service_only"
  ON inventory_movements FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "notifications_service_only"
  ON notifications_log FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

-- Admin puede editar productos y configuración
CREATE POLICY "products_admin_all"
  ON products FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "settings_admin_all"
  ON settings FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);
