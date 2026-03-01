import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client = null

export function supabaseBrowser() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}