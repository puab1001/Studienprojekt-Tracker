-- ─── BECOMING · Migration 003 ────────────────────────────────────────────────
-- Idempotente Absicherung. Kann in beliebiger Reihenfolge ausgeführt werden.
-- Alle Tabellen-Referenzen sind in IF-EXISTS-Blöcken gekapselt.

BEGIN;

-- habits-Policies: nur wenn Tabelle UND is_default-Spalte existieren
-- (is_default existiert erst nach Migration 001 – alte habits-Tabelle überspringen)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='habits'
               AND column_name='is_default') THEN
    ALTER TABLE public.habits
      ADD COLUMN IF NOT EXISTS difficulty_level int CHECK (difficulty_level BETWEEN 1 AND 5);
    ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "habits_select" ON public.habits;
    CREATE POLICY "habits_select" ON public.habits
      FOR SELECT USING (is_default = true OR auth.uid() = user_id);
    DROP POLICY IF EXISTS "habits_insert" ON public.habits;
    CREATE POLICY "habits_insert" ON public.habits
      FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);
    DROP POLICY IF EXISTS "habits_update" ON public.habits;
    CREATE POLICY "habits_update" ON public.habits
      FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "habits_delete" ON public.habits;
    CREATE POLICY "habits_delete" ON public.habits
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- deleted_at auf user_personas sicherstellen
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='user_personas') THEN
    ALTER TABLE public.user_personas
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "personas_all" ON public.user_personas;
    CREATE POLICY "personas_all" ON public.user_personas
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- habit_completions-Policies (nur wenn Tabelle existiert)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='habit_completions') THEN
    ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "completions_select" ON public.habit_completions;
    CREATE POLICY "completions_select" ON public.habit_completions
      FOR SELECT USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "completions_insert" ON public.habit_completions;
    CREATE POLICY "completions_insert" ON public.habit_completions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    DROP POLICY IF EXISTS "completions_upsert" ON public.habit_completions;
    CREATE POLICY "completions_upsert" ON public.habit_completions
      FOR UPDATE USING (auth.uid() = user_id);
    DROP POLICY IF EXISTS "completions_delete" ON public.habit_completions;
    CREATE POLICY "completions_delete" ON public.habit_completions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- user_settings-Policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='user_settings') THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "settings_all" ON public.user_settings;
    CREATE POLICY "settings_all" ON public.user_settings
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- reflections-Policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='reflections') THEN
    ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "reflections_all" ON public.reflections;
    CREATE POLICY "reflections_all" ON public.reflections
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMIT;
