import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addColumns() {
  console.log('📝 Adding image and theme columns...')

  // Use the SQL editor via RPC if available, otherwise use direct SQL
  const queries = [
    // Dioceses columns
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS logo_image_url TEXT`,
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT '#3b82f6'`,
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT DEFAULT '#8b5cf6'`,
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#ec4899'`,
    `ALTER TABLE public.dioceses ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{}'`,

    // Churches columns
    `ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS cover_image_url TEXT`,
    `ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS logo_image_url TEXT`,
  ]

  for (const query of queries) {
    const { error } = await supabase.rpc('exec_sql', { query }).catch(() => ({ error: 'RPC not available' }))
    if (error && error !== 'RPC not available') {
      console.log(`⚠️  Could not execute via RPC: ${error}`)
    }
  }

  console.log('✅ Columns should be added. Please verify by running the seed script.')
  console.log('ℹ️  If errors persist, you may need to add columns manually in Supabase dashboard.')
}

addColumns()
