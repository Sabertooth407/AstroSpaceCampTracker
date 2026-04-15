import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://oclwbllfeslheerxhzbv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbHdibGxmZXNsaGVlcnhoemJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTgzMjQsImV4cCI6MjA5MTYzNDMyNH0.yBIvMxyj7nAwjDgqZqMdDE8Fbw_V1d11b61Xzj-7oOs'
)