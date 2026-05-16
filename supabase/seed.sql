-- ============================================================
-- TCG STRINGING — Seed : compte cordeur initial
-- ============================================================
-- IMPORTANT : exécuter ce script UNE SEULE FOIS après schema.sql
-- Remplacer les valeurs entre < > avant d'exécuter

-- 1. Créer le compte cordeur dans auth.users via la fonction Admin
--    (À exécuter via l'API Admin Supabase ou le Dashboard Authentication)
--
--    Dans le Dashboard Supabase > Authentication > Users > "Add user"
--    Email    : cordeur@tcgarde.fr   (ou l'email souhaité)
--    Password : <mot_de_passe_fort>
--    Puis exécuter le SQL ci-dessous pour lui assigner le rôle cordeur :

-- 2. Une fois le compte créé, mettre à jour son rôle dans profiles
UPDATE public.profiles
SET role = 'cordeur',
    full_name = 'Cordeur TCG'
WHERE email = 'cordeur@tcgarde.fr';  -- ← remplacer par l'email réel

-- ─────────────────────────────────────────────
-- Données de test (développement uniquement)
-- Décommenter si besoin de tester le flow complet
-- ─────────────────────────────────────────────

/*
-- Commande de test (après avoir créé un compte client)
INSERT INTO public.stringing_orders (
  client_id,
  racket_brand,
  string_type,
  tension_mains,
  tension_cross,
  notes,
  status
) VALUES (
  '<uuid_du_client>',
  'Wilson',
  'Luxilon ALU Power 1.25',
  25.0,
  24.0,
  'Grip 3, raquette habituelle',
  'pending'
);
*/
