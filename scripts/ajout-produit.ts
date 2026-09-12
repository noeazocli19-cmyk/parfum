// Ajout de produits réels + traitement de leurs images (canevas 4:5 1000x1250).
// Usage : bun scripts/ajout-produit.ts
// Réutilisable : ajouter/modifier les entrées du tableau PRODUITS ci-dessous,
// puis relancer. Idempotent sur le slug (mise à jour si déjà présent).

import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import path from 'path'

const prisma = new PrismaClient()

// ── Produits à intégrer ──────────────────────────────────────────────────────
interface Produit {
  fichierSource: string
  nomImage: string
  name: string
  slug: string
  description: string
  notes: string | null
  category: 'HOMME' | 'FEMME' | 'MIXTE'
  price: number | null
  alt: string
}

const PRODUITS: Produit[] = [
  {
    fichierSource: '/home/z/my-project/upload/images (5).jpg',
    nomImage: 'marque-collection-110.jpg',
    name: 'Marque Collection 110',
    slug: 'marque-collection-110',
    description:
      'Eau de Parfum Marque Collection n° 110 (25 ml). Flacon noir au capot argenté, présenté dans son écrin noir.',
    notes: null,
    category: 'HOMME',
    price: null,
    alt: 'Flacon noir du parfum Marque Collection 110 et son écrin',
  },
  {
    fichierSource:
      '/home/z/my-project/upload/marque-collection-132-aromatas-artimas-chanel-bleu-de-1.jpeg',
    nomImage: 'marque-collection-132.jpg',
    name: 'Marque Collection 132',
    slug: 'marque-collection-132',
    description:
      'Eau de Parfum Marque Collection n° 132 (25 ml). Flacon bleu profond au capot noir, présenté dans son écrin.',
    notes: null,
    category: 'HOMME',
    price: null,
    alt: 'Flacon bleu du parfum Marque Collection 132 et son écrin',
  },
  {
    fichierSource: '/home/z/my-project/upload/images (4).jpg',
    nomImage: 'marque-collection-150.jpg',
    name: 'Marque Collection 150',
    slug: 'marque-collection-150',
    description:
      'Parfum Marque Collection n° 150, flacon doré à l\u2019étiquette rouge, présenté avec son écrin.',
    notes: null,
    category: 'FEMME',
    price: null,
    alt: 'Flacon doré du parfum Marque Collection 150 avec son écrin',
  },
  {
    fichierSource: '/home/z/my-project/upload/images (6).jpg',
    nomImage: 'marque-collection-201.jpg',
    name: 'Marque Collection 201',
    slug: 'marque-collection-201',
    description:
      'Eau de Parfum Marque Collection n° 201. Flacon rond à l\u2019eau verte, présenté dans son coffret rose.',
    notes: null,
    category: 'FEMME',
    price: null,
    alt: 'Flacon rond du parfum Marque Collection 201 et son coffret rose',
  },
  {
    fichierSource:
      '/home/z/my-project/upload/1759770418d442c90ad006b94842fdb039e66c69ec_thumbnail_750x999.jpg',
    nomImage: 'marque-collection-rose.jpg',
    name: 'Marque Collection Rose',
    slug: 'marque-collection-rose',
    description:
      'Eau de Parfum Marque Collection au flacon rose or, présenté dans son coffret poudré.',
    notes: null,
    category: 'FEMME',
    price: null,
    alt: 'Flacon rose or du parfum Marque Collection et son coffret',
  },
]

async function traiterImage(p: Produit): Promise<string> {
  // Canevas 4:5 (1000x1250). Deux traitements automatiques :
  //   - packshot sur fond clair → produit agrandi (max ×3) centré sur fond blanc ;
  //   - photo pleine surface → photo centrée sur prolongement flouté d'elle-même.
  const dest = path.join(process.cwd(), 'public', 'uploads', p.nomImage)
  const L = 1000
  const H = 1250

  const brute = sharp(p.fichierSource)
  const meta = await brute.metadata()
  const w = meta.width ?? 800
  const h = meta.height ?? 1000

  // Couleur moyenne des 4 coins (8x8) pour détecter un fond clair.
  const coin = async (left: number, top: number) => {
    const s = await sharp(p.fichierSource)
      .extract({ left, top, width: 8, height: 8 })
      .stats()
    return s.channels.map((c) => c.mean)
  }
  const coins = await Promise.all([
    coin(0, 0),
    coin(Math.max(0, w - 8), 0),
    coin(0, Math.max(0, h - 8)),
    coin(Math.max(0, w - 8), Math.max(0, h - 8)),
  ])
  const fondClair = coins.every((c) => c.every((v) => v > 225))

  let final: sharp.Sharp
  if (fondClair) {
    // Packshot fond blanc : agrandissement modéré (max ×3) + légère netteté.
    const echelle = Math.min(3, Math.max(L / w, H / h))
    const nw = Math.round(w * echelle)
    const nh = Math.round(h * echelle)
    const produit = await sharp(p.fichierSource)
      .flatten({ background: '#ffffff' })
      .resize(nw, nh)
      .sharpen({ sigma: 0.7 })
      .png()
      .toBuffer()
    final = sharp({
      create: {
        width: L,
        height: H,
        channels: 3,
        background: '#ffffff',
      },
    }).composite([
      { input: produit, left: Math.round((L - nw) / 2), top: Math.round((H - nh) / 2) },
    ])
  } else {
    // Photo pleine surface : fond flouté prolongé + photo nette (léger gain de netteté
    // pour les petites sources) centrée.
    const fond = await sharp(p.fichierSource)
      .flatten({ background: '#ffffff' })
      .resize(L, H, { fit: 'cover' })
      .blur(28)
      .modulate({ brightness: 1.04, saturation: 1.02 })
      .jpeg({ quality: 80 })
      .toBuffer()
    const premier = await sharp(p.fichierSource)
      .flatten({ background: '#ffffff' })
      .resize(L, H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .sharpen({ sigma: 0.6 })
      .png()
      .toBuffer()
    final = sharp(fond).composite([{ input: premier }])
  }

  await final.jpeg({ quality: 88 }).toFile(dest)
  console.log(`  Image enregistrée : public/uploads/${p.nomImage}`)
  return `/uploads/${p.nomImage}`
}

async function main() {
  for (const p of PRODUITS) {
    console.log(`→ ${p.name} (${p.category}${p.price ? `, ${p.price} F` : ', prix sur demande'})`)
    const url = await traiterImage(p)

    const existant = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (existant) {
      await prisma.product.update({
        where: { slug: p.slug },
        data: {
          name: p.name,
          description: p.description,
          notes: p.notes,
          category: p.category,
          price: p.price,
          isSample: false,
        },
      })
      console.log(`  Produit mis à jour (${existant.id})`)
    } else {
      const produit = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          notes: p.notes,
          category: p.category,
          price: p.price,
          isSample: false,
          isAvailable: true,
          images: {
            create: { url, alt: p.alt, isPrimary: true, sortOrder: 0 },
          },
        },
      })
      console.log(`  Produit créé (${produit.id})`)
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
