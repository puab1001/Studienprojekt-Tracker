-- ─── BECOMING · Migration 004 ────────────────────────────────────────────────
-- Eigene Personas: Anzeigename, Beschreibung und Farbe in user_personas

BEGIN;

ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_name  text;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_desc  text;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_color text;

COMMIT;
