// Bascule le schéma Prisma entre SQLite (local) et PostgreSQL (Neon et autres).
// Usage : node scripts/use-db.mjs sqlite|postgres
// (fonctionne aussi avec bun scripts/use-db.mjs)

import { copyFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const mode = process.argv[2]

if (mode !== 'sqlite' && mode !== 'postgres') {
  console.error('Usage : node scripts/use-db.mjs sqlite|postgres')
  process.exit(1)
}

const root = process.cwd()
const source = path.join(root, 'prisma', mode === 'postgres' ? 'schema.postgres.prisma' : 'schema.sqlite.prisma')
const cible = path.join(root, 'prisma', 'schema.prisma')

try {
  await readFile(source)
} catch {
  console.error(`Schéma source introuvable : ${source}`)
  process.exit(1)
}

await copyFile(source, cible)

console.log(`✓ Schéma Prisma basculé sur « ${mode === 'postgres' ? 'postgresql' : 'sqlite'} ».`)
console.log('Suite :')
console.log('  1. Renseignez DATABASE_URL dans .env')
console.log('     (Neon : postgresql://utilisateur:motdepasse@hôte/base?sslmode=require)')
console.log('  2. pnpm db:push   — crée les tables')
console.log('  3. pnpm db:seed   — admin, réglages et produits')
