/**
 * TCG Stringing — Générateur d'icônes PWA
 *
 * Génère les 5 tailles d'icônes requises par le manifest.json
 * à partir du logo TCG (PNG ou SVG).
 *
 * Usage :
 *   node scripts/generate-icons.mjs [chemin/vers/logo.png]
 *
 * Prérequis :
 *   npm install sharp --save-dev
 */

import { createRequire } from 'module'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require   = createRequire(import.meta.url)

// Tailles requises par manifest.json
const SIZES = [72, 96, 128, 192, 512]

const sourceArg = process.argv[2]
const SOURCE    = sourceArg
  ? resolve(process.cwd(), sourceArg)
  : resolve(__dirname, '../public/icons/tcg-logo-source.png')

const OUT_DIR = resolve(__dirname, '../public/icons')

async function main() {
  // Vérifier que sharp est installé
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('❌  sharp n\'est pas installé. Lancez : npm install sharp --save-dev')
    process.exit(1)
  }

  if (!existsSync(SOURCE)) {
    console.error(`❌  Fichier source introuvable : ${SOURCE}`)
    console.log('   Placez votre logo en PNG dans public/icons/tcg-logo-source.png')
    console.log('   ou passez le chemin en argument : node scripts/generate-icons.mjs mon-logo.png')
    process.exit(1)
  }

  // Créer le dossier de sortie
  mkdirSync(OUT_DIR, { recursive: true })

  console.log(`🎾  Génération des icônes PWA depuis : ${SOURCE}`)

  for (const size of SIZES) {
    const outPath = resolve(OUT_DIR, `icon-${size}.png`)
    await sharp(SOURCE)
      .resize(size, size, {
        fit:        'contain',
        background: { r: 0, g: 99, b: 65, alpha: 1 },   // fond vert TCG #006341
      })
      .png()
      .toFile(outPath)

    console.log(`  ✅  icon-${size}.png`)
  }

  console.log('\n✔  Toutes les icônes ont été générées dans public/icons/')
}

main().catch((err) => {
  console.error('Erreur :', err)
  process.exit(1)
})
