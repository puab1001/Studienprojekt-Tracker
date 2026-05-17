-- ─── BECOMING · Migration 005 ─────────────────────────────────────────────────
-- Erstellungsdatum für jede Persona (user_personas.created_at).
-- Backfill: früheste Habit-Completion als Proxy; falls keine existiert,
-- wird level_updated_at verwendet (= Datum der letzten Level-Änderung).

-- 1. Spalte hinzufügen (nullable, neuer Standard: now())
ALTER TABLE public.user_personas
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Bestehende Zeilen befüllen:
--    Priorität: MIN(habit_completions.day_date) → level_updated_at → now()
UPDATE public.user_personas up
SET created_at = COALESCE(
  (
    SELECT MIN(hc.day_date)::timestamptz
    FROM public.habit_completions hc
    WHERE hc.user_id   = up.user_id
      AND hc.persona_id = up.persona
  ),
  CASE
    WHEN up.level_updated_at IS NOT NULL
    THEN up.level_updated_at::timestamptz
    ELSE now()
  END
)
WHERE created_at IS NULL;
