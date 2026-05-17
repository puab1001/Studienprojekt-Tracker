-- ─── BECOMING · Komplettes Datenbanksetup ────────────────────────────────────
-- Alle Migrationen (001–004) in einer einzigen idempotenten Transaktion.
-- Kann mehrfach ausgeführt werden – bestehende Daten bleiben erhalten.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ALTE habits-TABELLE BEREINIGEN
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Wenn habits altes Schema hat (kein is_default):
  --   → umbenennen wenn habits_legacy noch nicht existiert
  --   → droppen wenn habits_legacy bereits existiert (Daten schon gesichert)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'habits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'is_default'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'habits_legacy'
    ) THEN
      ALTER TABLE public.habits RENAME TO habits_legacy;
    ELSE
      DROP TABLE public.habits;
    END IF;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TABELLEN ERSTELLEN
-- ═══════════════════════════════════════════════════════════════════════════

-- Habit-Definitionen
CREATE TABLE IF NOT EXISTS public.habits (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id     text        NOT NULL,
  level          int         NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  title          text        NOT NULL,
  description    text,
  difficulty     text,
  category       text,
  is_default     boolean     NOT NULL DEFAULT true,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order     int         NOT NULL DEFAULT 0,
  legacy_id      text        UNIQUE,
  difficulty_level int       CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

-- Habit-Completions
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id     uuid        NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  persona_id   text        NOT NULL,
  day_date     date        NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id, day_date)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. SPALTEN ZU BESTEHENDEN TABELLEN HINZUFÜGEN
-- ═══════════════════════════════════════════════════════════════════════════

-- user_personas: Soft-Delete + Custom-Persona-Metadaten + Erstellungsdatum
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS deleted_at    timestamptz;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_name  text;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_desc  text;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS display_color text;
ALTER TABLE public.user_personas ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();
UPDATE public.user_personas up
SET created_at = COALESCE(
  (SELECT MIN(hc.day_date)::timestamptz FROM public.habit_completions hc
   WHERE hc.user_id = up.user_id AND hc.persona_id = up.persona),
  CASE WHEN up.level_updated_at IS NOT NULL THEN up.level_updated_at::timestamptz ELSE now() END
)
WHERE created_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CHECK CONSTRAINTS (nur wenn Spalten existieren)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'habits' AND constraint_name = 'habits_title_length'
  ) THEN
    ALTER TABLE public.habits ADD CONSTRAINT habits_title_length CHECK (char_length(title) BETWEEN 2 AND 80);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'habits' AND constraint_name = 'habits_description_length'
  ) THEN
    ALTER TABLE public.habits ADD CONSTRAINT habits_description_length CHECK (description IS NULL OR char_length(description) <= 300);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DEFAULT-HABITS EINFÜGEN (75 Habits, 5 pro Level, 15 pro Persona)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.habits (persona_id, level, title, description, difficulty, category, is_default, sort_order, legacy_id) VALUES

-- ── The Disciplined · Level 1 ──────────────────────────────────────────────
('disciplined', 1, '30 Minuten Deep Work',              'Konzentriert arbeiten, ohne auf das Handy zu schauen.',                     'beginner',     'Fokus',           true, 1, 'dh1'),
('disciplined', 1, 'Kein Social Media bis 12 Uhr',      'Trainiere bewussten Verzicht und reduziere Reizüberflutung.',               'beginner',     'Selbstkontrolle', true, 2, 'dh2'),
('disciplined', 1, 'Morgens dieselbe Routine einhalten', 'Stärke Konstanz durch wiederholbare, einfache Abläufe.',                   'beginner',     'Routine',         true, 3, 'dh3'),
('disciplined', 1, '10 Minuten bewusste Planung',        'Lege fest, was heute wichtig ist und was bewusst wegfällt.',               'beginner',     'Klarheit',        true, 4, 'dh4'),
('disciplined', 1, 'Kurze Abendreflexion',               'Was hat heute gut funktioniert und wo warst du konsequent?',               'beginner',     'Reflexion',       true, 5, 'dh5'),

-- ── The Disciplined · Level 2 ──────────────────────────────────────────────
('disciplined', 2, '60 Minuten Deep Work',               'Zwei 30-Minuten-Blöcke ohne jede Unterbrechung durchhalten.',              'intermediate', 'Fokus',           true, 1, 'dh2_1'),
('disciplined', 2, 'Kein Social Media vor 18 Uhr',       'Verschiebe den ersten Social-Media-Konsum auf den Abend.',                 'intermediate', 'Selbstkontrolle', true, 2, 'dh2_2'),
('disciplined', 2, 'Morgen- UND Abendroutine',           'Beide Routinen vollständig und bewusst durchhalten.',                      'intermediate', 'Routine',         true, 3, 'dh2_3'),
('disciplined', 2, '30 Minuten Tagesplanung',            'Detaillierter Tagesplan mit Zeitblöcken und klaren Prioritäten.',          'intermediate', 'Klarheit',        true, 4, 'dh2_4'),
('disciplined', 2, 'Strukturierte Abendreflexion',       'Schreibe mindestens 5 Sätze: Was lief gut? Was war schwierig?',            'intermediate', 'Reflexion',       true, 5, 'dh2_5'),

-- ── The Disciplined · Level 3 ──────────────────────────────────────────────
('disciplined', 3, 'Zwei 90-Minuten Deep-Work-Blöcke',  'Zwei vollständige Fokusblöcke ohne jede Ablenkung.',                       'advanced',     'Fokus',           true, 1, 'dh3_1'),
('disciplined', 3, 'Komplett Social-Media-freier Tag',   'Kein Social Media den ganzen Tag – nicht mal kurz nachschauen.',           'advanced',     'Selbstkontrolle', true, 2, 'dh3_2'),
('disciplined', 3, 'Striktes Morgen- & Abendritual',    'Beide Rituale inklusive Meditation oder Bewegung durchhalten.',             'advanced',     'Routine',         true, 3, 'dh3_3'),
('disciplined', 3, 'Wochenplan + konkrete Tagesziele',  'Wochenüberblick und Tagesziele mit explizitem Zeitplan.',                   'advanced',     'Klarheit',        true, 4, 'dh3_4'),
('disciplined', 3, 'Wochenreview + Vorbereitung',       'Rückblick auf die Woche und strukturierte Planung der nächsten.',           'advanced',     'Reflexion',       true, 5, 'dh3_5'),

-- ── The Curious · Level 1 ─────────────────────────────────────────────────
('curious', 1, '20 Minuten lesen',                      'Lies täglich – Bücher, Artikel oder Essays.',                              'beginner',     'Wissen',          true, 1, 'ch1'),
('curious', 1, 'Eine neue Frage notieren',               'Halte etwas fest, das dich heute interessiert hat.',                       'beginner',     'Neugier',         true, 2, 'ch2'),
('curious', 1, 'Etwas Neues ausprobieren',              'Mach etwas, das du noch nie gemacht hast – klein ist okay.',               'beginner',     'Offenheit',       true, 3, 'ch3'),
('curious', 1, 'Podcast oder Vortrag hören',            'Nutze Wege und Wartezeiten für Lernimpulse.',                              'beginner',     'Lernen',          true, 4, 'ch4'),
('curious', 1, 'Kreatives Notizbuch führen',            'Halte spontane Ideen, Eindrücke und Gedankenblitze des Tages fest.',       'beginner',     'Kreativität',     true, 5, 'ch5'),

-- ── The Curious · Level 2 ─────────────────────────────────────────────────
('curious', 2, '45 Minuten lesen + Notizen',            'Lese aktiv und halte 3 Kerngedanken schriftlich fest.',                    'intermediate', 'Wissen',          true, 1, 'ch2_1'),
('curious', 2, '3 Fragen notieren, eine beantworten',   'Notiere drei neue Fragen und recherchiere eine davon.',                    'intermediate', 'Neugier',         true, 2, 'ch2_2'),
('curious', 2, 'Fremdes Thema 30 Min. erkunden',        'Beschäftige dich mit einem dir unbekannten Fachgebiet.',                   'intermediate', 'Offenheit',       true, 3, 'ch2_3'),
('curious', 2, 'Podcast + schriftliche Zusammenfassung','Höre einen Podcast und schreibe 3 wichtige Punkte auf.',                   'intermediate', 'Lernen',          true, 4, 'ch2_4'),
('curious', 2, 'Gelerntes visualisieren',               'Erstelle eine Mind-Map oder Skizze zu einem Thema, das dich bewegt hat.',  'intermediate', 'Kreativität',     true, 5, 'ch2_5'),

-- ── The Curious · Level 3 ─────────────────────────────────────────────────
('curious', 3, '60 Min. lesen + 5 Erkenntnisse',       'Lies fokussiert und formuliere fünf neue Erkenntnisse.',                   'advanced',     'Wissen',          true, 1, 'ch3_1'),
('curious', 3, 'Gelerntes mit jemanden diskutieren',    'Erkläre heute Gelerntes einer anderen Person.',                            'advanced',     'Neugier',         true, 2, 'ch3_2'),
('curious', 3, 'Cross-Domain-Lernen',                   'Verknüpfe Inhalte aus zwei völlig verschiedenen Bereichen.',               'advanced',     'Offenheit',       true, 3, 'ch3_3'),
('curious', 3, 'Feynman-Methode anwenden',              'Erkläre ein Konzept so, als ob du es einem Kind beibringst.',              'advanced',     'Lernen',          true, 4, 'ch3_4'),
('curious', 3, 'Erkenntnis des Tages teilen',           'Veröffentliche oder teile eine wichtige Erkenntnis – schriftlich oder im Gespräch.', 'advanced', 'Kreativität', true, 5, 'ch3_5'),

-- ── The Resilient · Level 1 ───────────────────────────────────────────────
('resilient', 1, '10 Minuten Meditation',               'Komm zur Ruhe und beobachte deine Gedanken ohne Bewertung.',               'beginner',     'Erholung',        true, 1, 'rh1'),
('resilient', 1, 'Bewegung – 20 Minuten',              'Körperliche Aktivität stärkt mentale Widerstandskraft.',                   'beginner',     'Körper',          true, 2, 'rh2'),
('resilient', 1, 'Stresssituation bewusst durchatmen',  'Erkenne einen Stressmoment und reagiere ruhig darauf.',                    'beginner',     'Anpassung',       true, 3, 'rh3'),
('resilient', 1, 'Ausreichend schlafen (7–8h)',         'Schlaf ist die Basis für Resilienz und Regeneration.',                     'beginner',     'Schlaf',          true, 4, 'rh4'),
('resilient', 1, 'Dankbarkeit aufschreiben',            'Notiere drei Dinge, für die du heute dankbar bist.',                       'beginner',     'Dankbarkeit',     true, 5, 'rh5'),

-- ── The Resilient · Level 2 ───────────────────────────────────────────────
('resilient', 2, '20 Min. Meditation oder Atemübung',  'Vertiefe deine Praxis mit einer gezielten Session.',                       'intermediate', 'Erholung',        true, 1, 'rh2_1'),
('resilient', 2, '45 Minuten intensiver Sport',         'Fordere deinen Körper mit einer anspruchsvollen Einheit.',                 'intermediate', 'Körper',          true, 2, 'rh2_2'),
('resilient', 2, 'Stressor benennen + Strategie',       'Identifiziere eine Belastung und entwickle eine Bewältigungsstrategie.',  'intermediate', 'Anpassung',       true, 3, 'rh2_3'),
('resilient', 2, 'Feste Schlafenszeit + Wind-Down',    'Feste Schlafenszeit und 30 Minuten ohne Bildschirm davor.',                'intermediate', 'Schlaf',          true, 4, 'rh2_4'),
('resilient', 2, 'Grenzen setzen üben',                'Sage einmal bewusst Nein zu etwas, das deine Energie raubt.',              'intermediate', 'Grenzen',         true, 5, 'rh2_5'),

-- ── The Resilient · Level 3 ───────────────────────────────────────────────
('resilient', 3, '30 Min. Mindfulness + Tagebuch',     'Achtsame Praxis und schriftliche Reflexion kombinieren.',                  'advanced',     'Erholung',        true, 1, 'rh3_1'),
('resilient', 3, '60 Minuten Sport oder Yoga',         'Intensive Einheit mit Fokus auf Körper-Geist-Verbindung.',                 'advanced',     'Körper',          true, 2, 'rh3_2'),
('resilient', 3, 'Stressprotokoll führen',              'Dokumentiere Auslöser, Reaktion und alternative Reaktion.',               'advanced',     'Anpassung',       true, 3, 'rh3_3'),
('resilient', 3, 'Schlafqualität optimieren',           'Schlaf tracken und 1h digitale Auszeit vor dem Schlafen.',                'advanced',     'Schlaf',          true, 4, 'rh3_4'),
('resilient', 3, 'Komfortzone aktiv verlassen',         'Stelle dich bewusst einer Situation, die dir unangenehm ist.',            'advanced',     'Wachstum',        true, 5, 'rh3_5'),

-- ── The Intentional · Level 1 ─────────────────────────────────────────────
('intentional', 1, 'Top-3-Aufgaben festlegen',         'Starte den Tag mit klaren Prioritäten.',                                   'beginner',     'Fokus',           true, 1, 'ih1'),
('intentional', 1, 'Handy beim Arbeiten weglegen',      'Schaffe Bedingungen für echten Fokus.',                                    'beginner',     'Klarheit',        true, 2, 'ih2'),
('intentional', 1, 'Bewusste Entscheidung treffen',     'Triff heute eine Entscheidung, die du sonst aufgeschoben hättest.',       'beginner',     'Intention',       true, 3, 'ih3'),
('intentional', 1, 'Tagesende definieren',              'Lege fest, wann der Arbeitstag offiziell endet.',                         'beginner',     'Grenzen',         true, 4, 'ih4'),
('intentional', 1, 'Eine Ablenkung bewusst weglassen',  'Verzichte heute auf eine Aktivität, die du als Ablenkung erkennst.',      'beginner',     'Klarheit',        true, 5, 'ih5'),

-- ── The Intentional · Level 2 ─────────────────────────────────────────────
('intentional', 2, 'Top-3 + Mittagsreview',            'Priorisiere morgens und überprüfe mittags deinen Fortschritt.',            'intermediate', 'Fokus',           true, 1, 'ih2_1'),
('intentional', 2, 'Handyfreie Arbeitsblöcke (2h)',     'Mindestens zwei Stunden echten, ablenkungsfreien Fokus.',                  'intermediate', 'Klarheit',        true, 2, 'ih2_2'),
('intentional', 2, 'Drei aufgeschobene Entscheidungen', 'Geh aktiv auf Dinge zu, die du bisher vermieden hast.',                   'intermediate', 'Intention',       true, 3, 'ih2_3'),
('intentional', 2, 'Tagesende + Vorbereitung für morgen','Klares Ende + 10-Minuten-Planung für den nächsten Tag.',                 'intermediate', 'Grenzen',         true, 4, 'ih2_4'),
('intentional', 2, 'Wochenziele prüfen',               'Prüfe ob deine heutigen Aktivitäten mit deinen Wochenzielen übereinstimmen.','intermediate','Klarheit',        true, 5, 'ih2_5'),

-- ── The Intentional · Level 3 ─────────────────────────────────────────────
('intentional', 3, 'MIT zuerst erledigen',              'Wichtigste Aufgabe erledigen, bevor du Nachrichten checkst.',             'advanced',     'Fokus',           true, 1, 'ih3_1'),
('intentional', 3, 'Tag ohne Push-Benachrichtigungen', 'Alle Benachrichtigungen aus – Nachrichten nur zu festen Zeiten.',          'advanced',     'Klarheit',        true, 2, 'ih3_2'),
('intentional', 3, 'Vollständiger Wochenrückblick',    'Analysiere die vergangene Woche und plane die nächste.',                   'advanced',     'Intention',       true, 3, 'ih3_3'),
('intentional', 3, 'Vollständiges Time-Blocking',      'Alle Hauptaufgaben für den nächsten Tag im Kalender blocken.',             'advanced',     'Grenzen',         true, 4, 'ih3_4'),
('intentional', 3, 'Langzeitziel ausrichten',          'Überprüfe dein Langzeitziel und richte eine heutige Entscheidung bewusst danach aus.', 'advanced', 'Intention', true, 5, 'ih3_5'),

-- ── The Connected · Level 1 ───────────────────────────────────────────────
('connected', 1, 'Aktiv zuhören im Gespräch',          'Sei voll präsent – kein Handy, kein Unterbrechen.',                       'beginner',     'Präsenz',         true, 1, 'coh1'),
('connected', 1, 'Jemandem bewusst danken',            'Drücke echte Wertschätzung aus.',                                          'beginner',     'Dankbarkeit',     true, 2, 'coh2'),
('connected', 1, 'Nachricht an jemanden schicken',     'Melde dich bei jemandem, an den du heute gedacht hast.',                   'beginner',     'Verbindung',      true, 3, 'coh3'),
('connected', 1, 'Ohne Ablenkung Zeit mit Menschen',   'Qualitätszeit – kein Bildschirm, volle Aufmerksamkeit.',                   'beginner',     'Empathie',        true, 4, 'coh4'),
('connected', 1, 'Echte Nachfragen stellen',           'Stelle in einem Gespräch mindestens drei ehrliche, tiefe Nachfragen.',    'beginner',     'Präsenz',         true, 5, 'coh5'),

-- ── The Connected · Level 2 ───────────────────────────────────────────────
('connected', 2, '30 Min. Tiefgespräch führen',        'Führe ein echtes, tiefes Gespräch ohne Ablenkungen.',                     'intermediate', 'Präsenz',         true, 1, 'coh2_1'),
('connected', 2, 'Persönliche Dankesnachricht',        'Schreibe eine ausführliche, persönliche Danksagung.',                     'intermediate', 'Dankbarkeit',     true, 2, 'coh2_2'),
('connected', 2, 'Anrufen statt schreiben',            'Wähle bewusst das Gespräch statt der Textnachricht.',                     'intermediate', 'Verbindung',      true, 3, 'coh2_3'),
('connected', 2, 'Gerätefreier Abend mit anderen',     'Mindestens 2 Stunden mit Menschen ohne Bildschirm.',                      'intermediate', 'Empathie',        true, 4, 'coh2_4'),
('connected', 2, 'Empathie zeigen',                    'Versetze dich bewusst in die Lage einer anderen Person und teile dein Verständnis.', 'intermediate', 'Empathie', true, 5, 'coh2_5'),

-- ── The Connected · Level 3 ───────────────────────────────────────────────
('connected', 3, 'Mentor- oder Mentee-Gespräch',       'Investiere in eine lehrende oder lernende Beziehung.',                    'advanced',     'Präsenz',         true, 1, 'coh3_1'),
('connected', 3, '5 Dankbarkeitsmomente dokumentieren','Halte fünf spezifische Dankbarkeitsmomente schriftlich fest.',            'advanced',     'Dankbarkeit',     true, 2, 'coh3_2'),
('connected', 3, 'Soziales Ereignis planen',           'Organisiere aktiv eine Zusammenkunft mit wichtigen Menschen.',             'advanced',     'Verbindung',      true, 3, 'coh3_3'),
('connected', 3, '2h volle Präsenz ohne Geräte',      'Keine digitalen Geräte – volle Aufmerksamkeit für Menschen.',              'advanced',     'Empathie',        true, 4, 'coh3_4'),
('connected', 3, 'Konflikt proaktiv ansprechen',       'Sprich ein ungelöstes Problem mit jemandem offen und respektvoll an.',    'advanced',     'Verbindung',      true, 5, 'coh3_5')

ON CONFLICT (legacy_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ALTE COMPLETIONS MIGRIEREN (nur wenn habits_legacy existiert)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'habits_legacy'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits_legacy' AND column_name = 'completed_habit_ids'
  ) THEN
    INSERT INTO public.habit_completions (user_id, habit_id, persona_id, day_date)
    SELECT hl.user_id, h.id, hl.persona, hl.date::date
    FROM public.habits_legacy hl, unnest(hl.completed_habit_ids) lid
    JOIN public.habits h ON h.legacy_id = lid
    WHERE hl.completed_habit_ids IS NOT NULL
    ON CONFLICT (user_id, habit_id, day_date) DO NOTHING;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ROW LEVEL SECURITY AKTIVIEREN
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections       ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RLS-POLICIES (idempotent via DROP IF EXISTS + CREATE)
-- ═══════════════════════════════════════════════════════════════════════════

-- habits
DROP POLICY IF EXISTS "habits_select" ON public.habits;
DROP POLICY IF EXISTS "habits_insert" ON public.habits;
DROP POLICY IF EXISTS "habits_update" ON public.habits;
DROP POLICY IF EXISTS "habits_delete" ON public.habits;
CREATE POLICY "habits_select" ON public.habits FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "habits_insert" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);
CREATE POLICY "habits_update" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "habits_delete" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- habit_completions
DROP POLICY IF EXISTS "completions_select" ON public.habit_completions;
DROP POLICY IF EXISTS "completions_insert" ON public.habit_completions;
DROP POLICY IF EXISTS "completions_upsert" ON public.habit_completions;
DROP POLICY IF EXISTS "completions_delete" ON public.habit_completions;
CREATE POLICY "completions_select" ON public.habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "completions_insert" ON public.habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "completions_upsert" ON public.habit_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "completions_delete" ON public.habit_completions FOR DELETE USING (auth.uid() = user_id);

-- user_personas
DROP POLICY IF EXISTS "personas_all" ON public.user_personas;
CREATE POLICY "personas_all" ON public.user_personas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_settings
DROP POLICY IF EXISTS "settings_all" ON public.user_settings;
CREATE POLICY "settings_all" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- reflections
DROP POLICY IF EXISTS "reflections_all" ON public.reflections;
CREATE POLICY "reflections_all" ON public.reflections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMIT;
