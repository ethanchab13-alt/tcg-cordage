/**
 * Crée ou met à jour le profil de l'utilisateur dans Supabase
 * Usage : node scripts/create-profile.mjs
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gfawjztpzflhyuaswows.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmYXdqenRwemZsaHl1YXN3b3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc4MzI1NywiZXhwIjoyMDk0MzU5MjU3fQ.6ga86btUcCu7YzBWXvZElkS3b_Z4rN9T97NxpwY2w9Q',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Lister tous les utilisateurs
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('❌ Erreur listUsers:', error.message)
    process.exit(1)
  }

  console.log('👥 Comptes trouvés :', users.map(u => u.email).join(', '))

  for (const user of users) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .single()

    const profileRole = existing?.role ?? 'client'
    const profileName = existing?.full_name ?? user.email.split('@')[0]

    // Synchroniser les métadonnées Supabase Auth avec le rôle du profil
    const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        role: profileRole,
        full_name: profileName,
        email_verified: true,
      },
    })
    if (metaError) {
      console.error(`❌ Erreur metadata pour ${user.email}:`, metaError.message)
    } else {
      console.log(`🔑 Metadata mis à jour : ${user.email} → role=${profileRole}, name=${profileName}`)
    }

    if (!existing) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, full_name: profileName, role: 'client' })
      if (upsertError) {
        console.error(`❌ Erreur profil pour ${user.email}:`, upsertError.message)
      } else {
        console.log(`🆕 Profil créé pour : ${user.email}`)
      }
    } else {
      console.log(`✅ Profil OK : ${user.email} (role: ${existing.role})`)
    }
  }

  console.log('\n✔ Terminé ! Rechargez la page dans le navigateur.')
}

main().catch((err) => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
