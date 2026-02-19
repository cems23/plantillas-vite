-- ================================================================
-- PLANTILLAS CS - ESQUEMA COMPLETO DE BASE DE DATOS
-- Ejecuta este archivo completo en: Supabase → SQL Editor → Run
-- ================================================================

-- ── EXTENSIONES ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── TABLA: profiles ─────────────────────────────────────────────
-- Extiende auth.users con datos extra del usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ── TABLA: categories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#6366f1',
  icon        TEXT DEFAULT 'folder',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categorías iniciales
INSERT INTO public.categories (name, description, color, icon) VALUES
  ('Devoluciones', 'Gestión de devoluciones y reembolsos', '#ef4444', 'package-x'),
  ('Envíos', 'Seguimiento y problemas de envío', '#3b82f6', 'truck'),
  ('Facturación', 'Facturas, pagos y cobros', '#10b981', 'receipt'),
  ('Soporte técnico', 'Problemas técnicos del producto', '#f59e0b', 'wrench'),
  ('Bienvenida', 'Onboarding y presentación', '#8b5cf6', 'hand'),
  ('General', 'Respuestas de uso general', '#6b7280', 'message-circle')
ON CONFLICT (name) DO NOTHING;

-- ── TABLA: templates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.templates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  language     TEXT NOT NULL DEFAULT 'ES' CHECK (language IN ('ES', 'EN')),
  tags         TEXT[] DEFAULT '{}',
  shortcut     TEXT UNIQUE,
  variables    TEXT[] DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  use_count    INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_language   ON public.templates(language);
CREATE INDEX IF NOT EXISTS idx_templates_category   ON public.templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_active     ON public.templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_shortcut   ON public.templates(shortcut);
CREATE INDEX IF NOT EXISTS idx_templates_tags       ON public.templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_search     ON public.templates
  USING GIN(to_tsvector('spanish', title || ' ' || content));

-- ── TABLA: template_translations ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.template_translations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id  UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  language     TEXT NOT NULL CHECK (language IN ('FR', 'DE', 'PT', 'IT')),
  content      TEXT NOT NULL,
  is_auto      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(template_id, language)
);

-- ── TABLA: audit_log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email   TEXT,
  action       TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','COPY','IMPORT','TRANSLATE')),
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('template','category','profile')),
  entity_id    UUID NOT NULL,
  entity_title TEXT,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user    ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);

-- ── FUNCIONES Y TRIGGERS ────────────────────────────────────────

-- Actualiza updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_templates_updated_at ON public.templates;
CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Extrae variables {nombre} del contenido
CREATE OR REPLACE FUNCTION extract_variables(content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  matches TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT match[1]
    FROM regexp_matches(content, '\{([^}]+)\}', 'g') AS match
  ) INTO matches;
  RETURN COALESCE(matches, '{}');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Sincroniza variables automáticamente al guardar una plantilla
CREATE OR REPLACE FUNCTION sync_template_variables()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variables = extract_variables(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_variables ON public.templates;
CREATE TRIGGER trigger_sync_variables
  BEFORE INSERT OR UPDATE OF content ON public.templates
  FOR EACH ROW EXECUTE FUNCTION sync_template_variables();

-- Crea perfil automáticamente cuando se registra un usuario con Google
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Incrementa el contador de uso de forma atómica (sin race conditions)
CREATE OR REPLACE FUNCTION increment_use_count(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.templates
  SET use_count = use_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log           ENABLE ROW LEVEL SECURITY;

-- Helper: devuelve el rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── POLÍTICAS: profiles ──
DROP POLICY IF EXISTS "Usuario ve su perfil" ON public.profiles;
CREATE POLICY "Usuario ve su perfil"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin actualiza perfiles" ON public.profiles;
CREATE POLICY "Admin actualiza perfiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Usuario actualiza su perfil" ON public.profiles;
CREATE POLICY "Usuario actualiza su perfil"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── POLÍTICAS: categories ──
DROP POLICY IF EXISTS "Todos ven categorias" ON public.categories;
CREATE POLICY "Todos ven categorias"
  ON public.categories FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admin gestiona categorias" ON public.categories;
CREATE POLICY "Admin gestiona categorias"
  ON public.categories FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ── POLÍTICAS: templates ──
DROP POLICY IF EXISTS "Todos ven plantillas activas" ON public.templates;
CREATE POLICY "Todos ven plantillas activas"
  ON public.templates FOR SELECT TO authenticated
  USING (is_active = TRUE OR get_user_role() = 'admin');

DROP POLICY IF EXISTS "Editor y admin crean plantillas" ON public.templates;
CREATE POLICY "Editor y admin crean plantillas"
  ON public.templates FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "Editor edita sus plantillas" ON public.templates;
CREATE POLICY "Editor edita sus plantillas"
  ON public.templates FOR UPDATE TO authenticated
  USING (
    get_user_role() = 'admin' OR
    (get_user_role() = 'editor' AND created_by = auth.uid())
  )
  WITH CHECK (
    get_user_role() = 'admin' OR
    (get_user_role() = 'editor' AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Admin borra plantillas" ON public.templates;
CREATE POLICY "Admin borra plantillas"
  ON public.templates FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- ── POLÍTICAS: template_translations ──
DROP POLICY IF EXISTS "Todos ven traducciones" ON public.template_translations;
CREATE POLICY "Todos ven traducciones"
  ON public.template_translations FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Editor y admin gestionan traducciones" ON public.template_translations;
CREATE POLICY "Editor y admin gestionan traducciones"
  ON public.template_translations FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'editor'))
  WITH CHECK (get_user_role() IN ('admin', 'editor'));

-- ── POLÍTICAS: audit_log ──
DROP POLICY IF EXISTS "Admin ve audit log" ON public.audit_log;
CREATE POLICY "Admin ve audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Sistema inserta audit log" ON public.audit_log;
CREATE POLICY "Sistema inserta audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- ── PLANTILLAS DE EJEMPLO ────────────────────────────────────────
-- Descomenta esto para tener datos de prueba al iniciar
/*
INSERT INTO public.templates (title, content, language, tags, shortcut) VALUES
(
  'Bienvenida al cliente',
  'Hola {nombre},

Gracias por contactarnos. Mi nombre es {agente} y estaré encantado/a de ayudarte hoy.

¿En qué puedo ayudarte?

Un saludo,
El equipo de atención al cliente',
  'ES',
  ARRAY['bienvenida', 'saludo'],
  '/hola'
),
(
  'Confirmación de devolución',
  'Hola {nombre},

Hemos procesado correctamente tu solicitud de devolución para el pedido #{orden}.

El reembolso de {importe}€ se realizará en un plazo de 5-7 días hábiles a tu método de pago original.

¿Hay algo más en lo que pueda ayudarte?

Un saludo,
{agente}',
  'ES',
  ARRAY['devolucion', 'reembolso'],
  '/refund'
),
(
  'Order shipping update',
  'Hi {name},

Your order #{order} has been shipped and is on its way to you!

You can track your package using this link: {tracking_link}

Estimated delivery: {delivery_date}

Please don''t hesitate to contact us if you have any questions.

Best regards,
{agent}',
  'EN',
  ARRAY['shipping', 'tracking'],
  '/shipped'
);
*/
