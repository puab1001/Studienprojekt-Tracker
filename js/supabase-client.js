// ─── BECOMING · supabase-client.js ───────────────────────────────────────────
// Supabase-Client initialisieren — muss vor common.js geladen werden

const SUPABASE_URL  = 'https://gjjuipbhgddguqnwqtcq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqanVpcGJoZ2RkZ3VxbndxdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzM2NzQsImV4cCI6MjA5Mzc0OTY3NH0.WhyAkCwcoNeo0bEUMED_EH6BLu3HKG0qEmMxPpZ-LI4';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
