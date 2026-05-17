-- migrations/002_custom_habits_constraints.sql
-- Adds difficulty_level column and server-side CHECK constraints for custom habits.
-- Idempotent: safe to run multiple times.

-- Nur ausführen wenn habits bereits das neue Schema hat (persona_id + title existieren)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'persona_id'
  ) THEN
    RAISE NOTICE 'Migration 002 übersprungen: habits hat noch altes Schema. Zuerst Migration 001 ausführen.';
    RETURN;
  END IF;

  -- difficulty_level: 1–5 slider for custom habits (NULL for default habits)
  ALTER TABLE public.habits
    ADD COLUMN IF NOT EXISTS difficulty_level int CHECK (difficulty_level BETWEEN 1 AND 5);

  -- title: between 2 and 80 characters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'habits'
      AND constraint_name = 'habits_title_length'
  ) THEN
    ALTER TABLE public.habits
      ADD CONSTRAINT habits_title_length
      CHECK (char_length(title) BETWEEN 2 AND 80);
  END IF;

  -- description: max 300 characters (NULL allowed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name   = 'habits'
      AND constraint_name = 'habits_description_length'
  ) THEN
    ALTER TABLE public.habits
      ADD CONSTRAINT habits_description_length
      CHECK (description IS NULL OR char_length(description) <= 300);
  END IF;
END $$;
