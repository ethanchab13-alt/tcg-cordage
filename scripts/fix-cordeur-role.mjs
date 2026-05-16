import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gfawjztpzflhyuaswows.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYXdqenRwemZsaHl1YXN3b3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MzI1NywiZXhwIjoyMDk0MzU5MjU3fQ.6ga86btUcCu7YzBWXvZElkS3b_Z4rN9T97NxpwY2w9Q',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CORDEUR_EMAIL = 'ethanchab13@gmail.com'

async function main() {
  // 1. Trouver l'utilisateur
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === CORDEUR_EMAIL)

  if (!user) {
    console.error('❌ Utilisateur non trouvé:', CORDEUR_EMAIL)
    return
  }

  console.log('✅ Utilisateur trouvé:', user.id)

  // 2. Mettre à jour user_metadata avec role=cordeur
  const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      role: 'cordeur',
      full_name: 'Ethan Chabalier'
    }
  })

  if (metaError) {
    console.error('❌ Erreur user_metadata:', metaError.message)
  } else {
    console.log('✅ user_metadata mis à jour avec role=cordeur')
  }

  // 3. Upsert le profil en base
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      role: 'cordeur',
      full_name: 'Ethan Chabalier',
      email: CORDEUR_EMAIL,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('❌ Erreur profil:', profileError.message)
  } else {
    console.log('✅ Profil mis à jour avec role=cordeur')
  }

  // 4. Vérification
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  console.log('\n📋 Profil final:', profile)
}

main().catch(console.error)
