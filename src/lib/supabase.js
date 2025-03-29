import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://thqxkrikofzvyoxiwcdk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocXhrcmlrb2Z6dnlveGl3Y2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxOTMzODIsImV4cCI6MjA1ODc2OTM4Mn0.lB7aaq637X36sxGHl4XEpLut4r5cHmOhjun65r2D9zo'

export const supabase = createClient(supabaseUrl, supabaseKey)
