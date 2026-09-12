// Seed E.T.P.S BELLE ODEUR
// - crée le compte administrateur (identifiants depuis .env, mot de passe hashé bcrypt)
// - crée les réglages par défaut (textes provisoires modifiables dans le dashboard)
// - crée des parfums d'exemple clairement identifiés (isSample = true, prix sur demande)
// Idempotent : peut être relancé sans dupliquer les données.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_SETTINGS } from '../src/lib/site-defaults'
import { SETTING_KEYS } from '../src/lib/types'

// Charge .env si présent (tsx/node ne le font pas automatiquement,
// contrairement à bun et à la CLI Prisma).
try {
  const envPath = path.join(process.cwd(), '.env')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim()
  }
} catch {
  // pas de fichier .env : les variables doivent être définies ailleurs
}

const prisma = new PrismaClient()

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.length < 8) {
    throw new Error(
      'ADMIN_PASSWORD manquant ou trop court dans .env (8 caractères minimum).'
    )
  }
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.adminUser.findUnique({ where: { username } })
  if (existing) {
    console.log(`✓ Admin « ${username} » déjà présent (mot de passe inchangé)`)
    return
  }
  await prisma.adminUser.create({ data: { username, passwordHash } })
  console.log(`✓ Admin « ${username} » créé`)
}

async function seedSettings() {
  for (const key of SETTING_KEYS) {
    const value = DEFAULT_SETTINGS[key]
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      await prisma.setting.create({ data: { key, value } })
    }
  }
  console.log('✓ Réglages du site initialisés')
}

interface SampleProduct {
  slug: string
  name: string
  category: 'HOMME' | 'FEMME' | 'MIXTE'
  image: string
  alt: string
  isFeatured: boolean
}

// Vrais produits de la maison (photos dans public/uploads).
// Création seule : jamais de mise à jour écrasante, les modifications
// faites depuis le tableau de bord sont préservées.
interface RealProduct {
  slug: string
  name: string
  category: 'HOMME' | 'FEMME' | 'MIXTE'
  price: number | null
  description: string
  image: string
  alt: string
}

const REAL_PRODUCTS: RealProduct[] = [
  {
    slug: 'marque-collection-157',
    name: 'Marque Collection 157',
    category: 'MIXTE',
    price: 3500,
    description: 'Parfum mixte Marque Collection n° 157 (Eau de Parfum 25 ml).',
    image: '/uploads/marque-collection-157.png',
    alt: 'Flacon du parfum Marque Collection 157 et son écrin',
  },
  {
    slug: 'rexona-advanced-protection-invisible',
    name: 'Rexona Advanced Protection Invisible',
    category: 'MIXTE',
    price: 4000,
    description: 'Anti-transpirant Rexona Advanced Protection Invisible, 72 h de protection.',
    image: '/uploads/rexona-advanced-protection-invisible.jpg',
    alt: 'Anti-transpirant Rexona Advanced Protection Invisible',
  },
  {
    slug: 'marshmallow-blush',
    name: 'Marshmallow Blush',
    category: 'FEMME',
    price: null,
    description: 'Parfum pour femme Marshmallow Blush, signé Paris Corner.',
    image: '/uploads/marshmallow-blush.jpg',
    alt: 'Coffret du parfum Marshmallow Blush avec son flacon rose',
  },
  {
    slug: 'marque-collection-122',
    name: 'Marque Collection 122',
    category: 'MIXTE',
    price: null,
    description: 'Parfum Marque Collection n° 122.',
    image: '/uploads/marque-collection-122.jpg',
    alt: 'Flacon Marque Collection 122',
  },
  {
    slug: 'marque-collection-110',
    name: 'Marque Collection 110',
    category: 'HOMME',
    price: null,
    description:
      'Eau de Parfum Marque Collection n° 110 (25 ml). Flacon noir au capot argenté, présenté dans son écrin noir.',
    image: '/uploads/marque-collection-110.jpg',
    alt: 'Flacon noir du parfum Marque Collection 110 et son écrin',
  },
  {
    slug: 'marque-collection-132',
    name: 'Marque Collection 132',
    category: 'HOMME',
    price: null,
    description:
      'Eau de Parfum Marque Collection n° 132 (25 ml). Flacon bleu profond au capot noir, présenté dans son écrin.',
    image: '/uploads/marque-collection-132.jpg',
    alt: 'Flacon bleu du parfum Marque Collection 132 et son écrin',
  },
  {
    slug: 'marque-collection-150',
    name: 'Marque Collection 150',
    category: 'FEMME',
    price: null,
    description:
      'Parfum Marque Collection n° 150, flacon doré à l\u2019étiquette rouge, présenté avec son écrin.',
    image: '/uploads/marque-collection-150.jpg',
    alt: 'Flacon doré du parfum Marque Collection 150 avec son écrin',
  },
  {
    slug: 'marque-collection-201',
    name: 'Marque Collection 201',
    category: 'FEMME',
    price: null,
    description:
      'Eau de Parfum Marque Collection n° 201. Flacon rond à l\u2019eau verte, présenté dans son coffret rose.',
    image: '/uploads/marque-collection-201.jpg',
    alt: 'Flacon rond du parfum Marque Collection 201 et son coffret rose',
  },
  {
    slug: 'marque-collection-rose',
    name: 'Marque Collection Rose',
    category: 'FEMME',
    price: null,
    description:
      'Eau de Parfum Marque Collection au flacon rose or, présenté dans son coffret poudré.',
    image: '/uploads/marque-collection-rose.jpg',
    alt: 'Flacon rose or du parfum Marque Collection et son coffret',
  },
]

async function seedRealProducts() {
  let created = 0
  for (const product of REAL_PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } })
    if (existing) continue
    await prisma.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price, // null = « Prix sur demande »
        isAvailable: true,
        isSample: false,
        images: {
          create: {
            url: product.image,
            alt: product.alt,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    })
    created += 1
  }
  if (created > 0) {
    console.log(`✓ ${created} vrai(s) produit(s) créé(s)`)
  } else {
    console.log('✓ Vrais produits déjà présents')
  }
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    slug: 'ambre-nocturne',
    name: 'Ambre Nocturne',
    category: 'HOMME',
    image: '/images/produits/homme-01.jpg',
    alt: "Flacon ambre du parfum d'exemple Ambre Nocturne",
    isFeatured: true,
  },
  {
    slug: 'cedre-imperial',
    name: 'Cèdre Impérial',
    category: 'HOMME',
    image: '/images/produits/homme-02.jpg',
    alt: "Flacon noir du parfum d'exemple Cèdre Impérial",
    isFeatured: true,
  },
  {
    slug: 'vetiver-sauvage',
    name: 'Vétiver Sauvage',
    category: 'HOMME',
    image: '/images/produits/homme-03.jpg',
    alt: "Flacon vert du parfum d'exemple Vétiver Sauvage",
    isFeatured: false,
  },
  {
    slug: 'rose-eternelle',
    name: 'Rose Éternelle',
    category: 'FEMME',
    image: '/images/produits/femme-01.jpg',
    alt: "Flacon rosé du parfum d'exemple Rose Éternelle",
    isFeatured: true,
  },
  {
    slug: 'jasmin-dore',
    name: 'Jasmin Doré',
    category: 'FEMME',
    image: '/images/produits/femme-02.jpg',
    alt: "Flacon blanc du parfum d'exemple Jasmin Doré",
    isFeatured: false,
  },
  {
    slug: 'pivoire-velours',
    name: 'Pivoire Velours',
    category: 'FEMME',
    image: '/images/produits/femme-03.jpg',
    alt: "Flacon poudré du parfum d'exemple Pivoire Velours",
    isFeatured: true,
  },
  {
    slug: 'neroli-celeste',
    name: 'Néroli Céleste',
    category: 'MIXTE',
    image: '/images/produits/mixte-01.jpg',
    alt: "Flacon transparent du parfum d'exemple Néroli Céleste",
    isFeatured: false,
  },
]

async function seedSampleProducts() {
  // Les parfums d'exemple ne sont créés que sur une base VIDE : si les vrais
  // produits sont déjà là (ou viennent d'être créés), aucun exemple n'est ajouté.
  const count = await prisma.product.count()
  if (count > 0) {
    console.log(`✓ ${count} produit(s) déjà présent(s) — exemples ignorés`)
    return
  }
  for (const product of SAMPLE_PRODUCTS) {
    await prisma.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        description:
          "Parfum d'exemple présenté pour la démonstration du site. " +
          "Remplacez ce produit, sa description et ses visuels depuis le tableau de bord administrateur.",
        notes: 'Produit d\u2019exemple — caractéristiques à définir par la maison.',
        category: product.category,
        price: null, // « Prix sur demande » — aucun prix inventé
        isAvailable: true,
        isFeatured: product.isFeatured,
        isSample: true,
        images: {
          create: {
            url: product.image,
            alt: product.alt,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    })
  }
  console.log(`✓ ${SAMPLE_PRODUCTS.length} parfums d'exemple créés (prix sur demande)`)
}

async function main() {
  await seedAdmin()
  await seedSettings()
  await seedRealProducts()
  await seedSampleProducts()
  console.log('── Seed terminé ──')
}

main()
  .catch((error) => {
    console.error('Seed échoué :', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
