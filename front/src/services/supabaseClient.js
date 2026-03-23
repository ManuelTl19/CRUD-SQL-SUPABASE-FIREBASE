import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bsxaorwolwgmbbheuffr.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzeGFvcndvbHdnbWJiaGV1ZmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjg0ODYsImV4cCI6MjA4ODMwNDQ4Nn0.GRRihDSABnkWVyDHvbr7ootsXwRV2kgYM2Z5H9h43w4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
