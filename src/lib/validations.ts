// Validation serveur + client (zod) — messages en français.

import { z } from 'zod'

const phoneRegex = /^[+0-9][0-9().\s-]{7,19}$/

export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères.'),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Le lien doit être en minuscules, sans espaces (ex. mon-parfum).'
    )
    .min(2)
    .max(90),
  description: z.string().trim().max(3000, 'Description trop longue.').default(''),
  notes: z.string().trim().max(1000, 'Informations trop longues.').nullish(),
  category: z.enum(['HOMME', 'FEMME', 'MIXTE'], {
    message: 'Catégorie invalide.',
  }),
  price: z
    .number()
    .nonnegative('Le prix ne peut pas être négatif.')
    .max(100000, 'Prix irréaliste.')
    .nullable(),
  stock: z
    .number()
    .int('Le stock doit être un nombre entier.')
    .nonnegative('Le stock ne peut pas être négatif.')
    .max(100000)
    .nullable(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1, 'URL de mannequin invalide.').max(500),
        alt: z.string().trim().max(200).default(''),
        isPrimary: z.boolean().default(false),
      })
    )
    .max(8, 'Maximum 8 images par parfum.')
    .default([]),
})

export type ProductInput = z.infer<typeof productInputSchema>

export const orderInputSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Veuillez indiquer votre nom complet.')
    .max(80, 'Nom trop long.'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Veuillez indiquer un numéro de téléphone valide.'),
  address: z
    .string()
    .trim()
    .min(5, 'Veuillez indiquer votre adresse ou zone de livraison.')
    .max(300, 'Adresse trop longue.'),
  comment: z.string().trim().max(1000, 'Commentaire trop long.').nullish(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z
          .number()
          .int()
          .min(1, 'Quantité invalide.')
          .max(99, 'Quantité maximale : 99.'),
      })
    )
    .min(1, 'Votre panier est vide.')
    .max(50),
})

export type OrderInput = z.infer<typeof orderInputSchema>

export const contactInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Veuillez indiquer votre nom.')
    .max(80, 'Nom trop long.'),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Veuillez indiquer un numéro de téléphone valide.'),
  message: z
    .string()
    .trim()
    .min(5, 'Veuillez écrire votre message.')
    .max(2000, 'Message trop long.'),
})

export type ContactInput = z.infer<typeof contactInputSchema>

export const loginInputSchema = z.object({
  username: z.string().trim().min(1, 'Identifiant requis.').max(60),
  password: z.string().min(1, 'Mot de passe requis.').max(200),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.')
    .max(200),
})

export const orderStatusSchema = z.object({
  status: z.enum(['NOUVELLE', 'EN_PREPARATION', 'CONFIRMEE', 'LIVREE', 'ANNULEE'], {
    message: 'Statut invalide.',
  }),
})

export const settingsInputSchema = z.record(z.string(), z.string().max(5000))

/** Formatage lisible des erreurs zod pour l'affichage. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => issue.message)
    .filter(Boolean)
    .join(' ')
}
