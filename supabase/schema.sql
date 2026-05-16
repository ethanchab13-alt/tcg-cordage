-- ============================================================
-- TCG STRINGING — Schéma Supabase complet
-- ============================================================
-- Exécuter dans l'ordre dans le SQL Editor de Supabase

-- ─────────────────────────────────────────────
-- 1. EXTENSION
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 2. TABLE PROFILES (extend auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id               UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email            TEXT        NOT NULL,
  full_name        TEXT,
  role             TEXT        NOT NULL DEFAULT 'client'
                               CHECK (role IN ('client', 'cordeur')),
  push_subscription JSONB,     -- Web Push subscription object
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les lookups par rôle
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ─────────────────────────────────────────────
-- 3. TABLE STRINGING ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE public.stringing_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  racket_brand    TEXT,
  string_type     TEXT        NOT NULL,
  tension_mains   NUMERIC(4,1) NOT NULL,  -- tension en kg (ex: 24.5)
  tension_cross   NUMERIC(4,1),           -- tension croisée optionnelle
  notes           TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered')),
  price           NUMERIC(8,2),           -- rempli par le cordeur
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at        TIMESTAMPTZ,            -- horodatage quand marqué "ready"
  delivered_at    TIMESTAMPTZ             -- horodatage quand marqué "delivered"
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_orders_client_id  ON public.stringing_orders(client_id);
CREATE INDEX idx_orders_status     ON public.stringing_orders(status);
CREATE INDEX idx_orders_created_at ON public.stringing_orders(created_at DESC);

-- ─────────────────────────────────────────────
-- 4. TABLE NOTIFICATION LOG
-- ─────────────────────────────────────────────
CREATE TABLE public.notification_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        REFERENCES public.stringing_orders(id) ON DELETE SET NULL,
  recipient_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('push', 'email')),
  event        TEXT        NOT NULL CHECK (event IN ('order_created', 'order_ready', 'order_delivered')),
  status       TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
  error_msg    TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_recipient_id ON public.notification_log(recipient_id);
CREATE INDEX idx_notif_order_id     ON public.notification_log(order_id);

-- ─────────────────────────────────────────────
-- 5. TRIGGER updated_at automatique
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.stringing_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────
-- 6. TRIGGER : créer un profil à chaque inscription
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY — PROFILES
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur peut lire/modifier son propre profil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Le cordeur peut voir tous les profils (pour les dashboards)
CREATE POLICY "profiles_cordeur_select_all" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cordeur'
    )
  );

-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY — STRINGING ORDERS
-- ─────────────────────────────────────────────
ALTER TABLE public.stringing_orders ENABLE ROW LEVEL SECURITY;

-- Un client peut voir uniquement ses propres commandes
CREATE POLICY "orders_client_select_own" ON public.stringing_orders
  FOR SELECT USING (client_id = auth.uid());

-- Un client peut créer une commande (client_id doit être son propre id)
CREATE POLICY "orders_client_insert" ON public.stringing_orders
  FOR INSERT WITH CHECK (client_id = auth.uid());

-- Le cordeur peut tout voir
CREATE POLICY "orders_cordeur_select_all" ON public.stringing_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cordeur'
    )
  );

-- Le cordeur peut mettre à jour n'importe quelle commande (changer status, price, etc.)
CREATE POLICY "orders_cordeur_update" ON public.stringing_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cordeur'
    )
  );

-- ─────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY — NOTIFICATION LOG
-- ─────────────────────────────────────────────
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur voit ses propres notifications
CREATE POLICY "notif_select_own" ON public.notification_log
  FOR SELECT USING (recipient_id = auth.uid());

-- Le cordeur voit tout le log
CREATE POLICY "notif_cordeur_select_all" ON public.notification_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'cordeur'
    )
  );

-- Seule la service_role key peut insérer dans le log (via API routes)
CREATE POLICY "notif_service_insert" ON public.notification_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────
-- 10. REALTIME : activer pour les commandes
-- ─────────────────────────────────────────────
-- À activer dans le Dashboard Supabase :
-- Database > Replication > Tables > stringing_orders (enable)
-- Ou via SQL :
ALTER PUBLICATION supabase_realtime ADD TABLE public.stringing_orders;
