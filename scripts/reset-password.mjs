import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gfawjztpzflhyuaswows.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYXdqenRwemZsaHl1YXN3b3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MzI1NywiZXhwIjoyMDk0MzU5MjU3fQ.6ga86btUcCu7YzBWXvZElkS3b_Z4rN9T97NxpwY2w9Q',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const NEW_PASSWORD = 'TCGcordage2026!'

async function main() {
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === 'ethanchab13@gmail.com')

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD
  })

  if (error) {
    console.error('❌ Erreur:', error.message)
  } else {
    console.log('✅ Mot de passe mis à jour !')
    console.log('📧 Email    :', 'ethanchab13@gmail.com')
    console.log('🔑 Mot de passe :', NEW_PASSWORD)
  }
}

main().catch(console.error)
