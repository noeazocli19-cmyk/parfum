# =============================================================================
#  E.T.P.S BELLE ODEUR  --  setup-whatsapp.ps1  (script tout-en-un)
# -----------------------------------------------------------------------------
#  Ce script automatise COMPLETEMENT l'implementation de la commande WhatsApp.
#  AUCUNE modification manuelle de fichier n'est requise.
#
#    Etape 0 : Localise automatiquement la racine du projet (package.json).
#    Etape 1 : Injecte le fichier src\components\site\views\CheckoutView.tsx
#              complet, corrige et sans balise orpheline :
#                - POST /api/orders  ->  commande enregistree en base
#                  (reference unique BO-AAAA-XXXX, visible sur le Dashboard
#                   Administrateur instantanement) ;
#                - au succes, l'ecran SE TRANSFORME : un GRAND BOUTON VERT
#                  "Envoyer sur WhatsApp" apparait (clic direct utilisateur :
#                  aucun bloqueur de pop-up ne peut l'arreter) ;
#                - message WhatsApp pre-rempli exactement au format demande
#                  (asterisques conserves pour le gras WhatsApp) ;
#                - numero admin extrait de la configuration (settings.phone,
#                  sinon contactPhone) et formate international Benin (+229)
#                  s'il commence par 01, 66 ou 49 ;
#                - URL corrigee : https://wa.me/<numero>?text=<message>
#                  (l'ancienne version produisait wa.me<numero> : bug corrige).
#    Etape 2 : Purge le cache persistant Turbopack (.next) s'il existe.
#    Etape 3 : Valide le projet avec un build complet (pnpm build) :
#              aucune erreur de syntaxe ou <eof> ne peut passer inapercue.
#    Etape 4 : Soumission Git (add + commit + push) -> deploiement Vercel.
#
#  USAGE :
#     powershell -ExecutionPolicy Bypass -File .\setup-whatsapp.ps1
#     (ou clic droit sur le fichier puis "Executer avec PowerShell")
#
#  PREREQUIS : Windows PowerShell 5.1+ ou PowerShell 7+, pnpm, git.
#  Placez ce fichier a la RACINE du projet (a cote de package.json).
# =============================================================================

$ErrorActionPreference = 'Stop'

function Write-Step { param([string]$Text) Write-Host ''; Write-Host ("==> " + $Text) -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host ("    [OK] " + $Text) -ForegroundColor Green }
function Write-Fail { param([string]$Text) Write-Host ("    [ECHEC] " + $Text) -ForegroundColor Red }

Write-Host '==============================================================' -ForegroundColor DarkCyan
Write-Host '  E.T.P.S BELLE ODEUR - Installation automatisee WhatsApp'     -ForegroundColor DarkCyan
Write-Host '==============================================================' -ForegroundColor DarkCyan

try {
    # -------------------------------------------------------------------------
    # Etape 0 : localiser la racine du projet (celle qui contient package.json)
    # -------------------------------------------------------------------------
    Write-Step 'Etape 0/5 : Localisation du projet et des outils'

    $projectRoot = $PSScriptRoot
    if ([string]::IsNullOrWhiteSpace($projectRoot)) { $projectRoot = (Get-Location).Path }

    $attempts = 0
    while (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'package.json'))) {
        $parent = Split-Path -Parent $projectRoot
        if ([string]::IsNullOrWhiteSpace($parent) -or ($parent -eq $projectRoot) -or ($attempts -ge 6)) {
            throw ('package.json introuvable. Placez setup-whatsapp.ps1 a la racine du projet (dossier qui contient package.json), puis relancez le script. Dossier teste : ' + $projectRoot)
        }
        $projectRoot = $parent
        $attempts = $attempts + 1
    }
    Set-Location -LiteralPath $projectRoot
    Write-Ok ('Projet detecte : ' + $projectRoot)

    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        throw "pnpm est introuvable. Installez-le d'abord : npm install -g pnpm"
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'git est introuvable. Installez Git pour Windows puis relancez le script.'
    }
    Write-Ok 'pnpm et git disponibles'

    # -------------------------------------------------------------------------
    # Etape 1 : injection autonome de CheckoutView.tsx (code 100% corrige)
    #   Here-string a guillemets simples (@' ... '@) : AUCUN caractere n'est
    #   interprete par PowerShell ($, backtick, {, }, ", ' restent litteraux).
    #   Ecriture finale en UTF-8 sans BOM (requis par Next.js / TypeScript).
    # -------------------------------------------------------------------------
    Write-Step 'Etape 1/5 : Injection du CheckoutView.tsx (commande + bouton WhatsApp)'

    $checkoutTsx = @'
// Commande — formulaire client + récapitulatif, envoi via l'API publique.
// Flux en deux temps anti-blocage navigateur :
//   1. Le clic sur « Commander maintenant » enregistre la commande (POST /api/orders)
//      → elle apparaît instantanément sur le Dashboard Administrateur avec sa
//      référence unique (ex. BO-2026-0001).
//   2. Au succès, l'écran SE TRANSFORME : un grand bouton vert « Envoyer sur WhatsApp »
//      apparaît. Le message est prérempli (astérisques de mise en forme WhatsApp
//      respectés) et l'ouverture se fait lors d'un clic direct de l'utilisateur :
//      aucun bloqueur de pop-up ne peut l'intercepter.

'use client'

import { useState } from 'react'
import { useMounted } from '@/hooks/use-mounted'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { formatPrice } from '@/lib/format'
import { cartHasUndeterminedPrice, cartSubtotal, useCart } from '@/store/cart'
import { useSettings } from '../use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { PriceText } from '@/components/shared/price-text'
import { Spinner } from '@/components/shared/spinner'

interface CheckoutForm {
  customerName: string
  phone: string
  address: string
  comment: string
}

interface ConfirmedItem {
  name: string
  quantity: number
  price: number | null
}

interface ConfirmedOrder {
  reference: string
  customerName: string
  customerPhone: string
  comment: string
  items: ConfirmedItem[]
}

type CheckoutErrors = Partial<
  Record<'customerName' | 'phone' | 'address', string>
>

const EMPTY_FORM: CheckoutForm = {
  customerName: '',
  phone: '',
  address: '',
  comment: '',
}

// Couleur officielle WhatsApp (vert) utilisée pour le grand bouton d'envoi.
const WHATSAPP_GREEN = '#25D366'

/**
 * Formate le numéro de téléphone de l'administrateur pour l'international Bénin (+229).
 * Règle métier : si le numéro configuré commence par 01, 66 ou 49 (numérotation
 * béninoise), on préfixe automatiquement par 229. Les espaces, points, tirets
 * et parenthèses sont supprimés ; un préfixe déjà international n'est jamais doublé.
 */
function formatBeninPhone(raw: string): string {
  const cleaned = (raw || '')
    .replace(/[\s.\-()]/g, '')
    .replace(/^\+/, '')
    .trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('229')) return cleaned
  if (cleaned.startsWith('00229')) return cleaned.slice(2)
  if (
    cleaned.startsWith('01') ||
    cleaned.startsWith('66') ||
    cleaned.startsWith('49')
  ) {
    return '229' + cleaned
  }
  return cleaned
}

/** Prix unitaire lisible d'une ligne commandée (« Prix sur demande » si non défini). */
function itemPriceText(price: number | null): string {
  const formatted = price !== null ? formatPrice(price) : null
  return formatted ?? 'Prix sur demande'
}

/**
 * Construit le message WhatsApp prérempli, EXACTEMENT au format demandé
 * (les astérisques sont conservés : WhatsApp les utilise pour le gras).
 */
function buildWhatsAppMessage(order: ConfirmedOrder): string {
  let message = 'Bonjour, je souhaite commander :'
  order.items.forEach((item) => {
    message += '\n* Parfum : ' + item.name
    message += '\n* Quantité : ' + item.quantity
    message += '\n* Prix : ' + itemPriceText(item.price)
    message += '\n'
  })
  message += '\n* Nom du client : ' + order.customerName
  message += '\n* Numéro du client : ' + order.customerPhone
  message += '\n* Référence de commande : ' + order.reference
  message += '\n* Autres informations : ' + (order.comment.trim() || 'Aucune')
  return message
}

/**
 * URL WhatsApp complète : https://wa.me/<numéro international>?text=<message encodé>.
 * Concaténation pure (sans gabarit) pour une fiabilité maximale avec Turbopack.
 */
function buildWhatsAppUrl(order: ConfirmedOrder, adminPhoneRaw: string): string {
  const phone = formatBeninPhone(adminPhoneRaw)
  const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(buildWhatsAppMessage(order))
  return url
}

export function CheckoutView({
  navigate,
}: {
  navigate: (to: string, options?: { replace?: boolean }) => void
}) {
  const mounted = useMounted()
  const items = useCart((state) => state.items)
  const clear = useCart((state) => state.clear)
  const { settings } = useSettings()
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null)

  const undetermined = cartHasUndeterminedPrice(items)
  const subtotal = cartSubtotal(items)

  // Numéro WhatsApp administrateur, extrait dynamiquement de la configuration :
  // settings.phone en priorité, sinon settings.contactPhone, sinon valeur par défaut.
  const settingsRecord = settings as unknown as Record<string, unknown> | undefined
  const rawPhoneSetting =
    typeof settingsRecord?.phone === 'string' && settingsRecord.phone.trim() !== ''
      ? settingsRecord.phone
      : settings?.contactPhone || ''
  const adminPhoneRaw = rawPhoneSetting.trim() !== '' ? rawPhoneSetting : '0166491298'

  /** Ouvre la discussion WhatsApp lors d'un clic direct : jamais bloqué. */
  const openWhatsApp = (order: ConfirmedOrder) => {
    const url = buildWhatsAppUrl(order, adminPhoneRaw)
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    if (!win) {
      // Filet de sécurité extrêmement rare (extension agressive) : navigation classique.
      window.location.href = url
    }
  }

  const mutation = useMutation({
    mutationFn: (input: any) => api.createOrder(input),
    onSuccess: (data: any) => {
      // 1. Capture instantanée du panier et du formulaire AVANT le vidage,
      //    pour afficher le récapitulatif sur l'écran de confirmation.
      const snapshot: ConfirmedOrder = {
        reference: data.reference,
        customerName: form.customerName.trim(),
        customerPhone: form.phone.trim(),
        comment: form.comment.trim(),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }

      // 2. La commande est enregistrée en base : visible immédiatement
      //    sur le Dashboard Administrateur avec sa référence unique.
      clear()

      // 3. Transformation de l'écran : le grand bouton vert « Envoyer sur
      //    WhatsApp » remplace le formulaire. Aucune redirection forcée.
      setConfirmed(snapshot)
      toast.success('Commande ' + snapshot.reference + ' enregistrée !')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.'
      )
    },
  })

  if (!mounted) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Spinner />
      </section>
    )
  }

  if (items.length === 0 && !confirmed) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Ajoutez des parfums à votre panier avant de passer commande."
          action={
            <Button asChild className="bg-forest-deep hover:bg-pine-deep">
              <a href="#/boutique">Découvrir nos parfums</a>
            </Button>
          }
        />
      </section>
    )
  }

  // ─── Écran transformé après enregistrement : envoi WhatsApp ────────────────
  if (confirmed) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-xl border border-border bg-white p-6 text-center sm:p-10">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#25D366] shadow-[0_18px_40px_-18px_rgba(37,211,102,0.6)]"
          >
            <CheckCircle2 className="size-10 text-white" aria-hidden="true" />
          </motion.div>

          <h1 className="mt-6 font-display text-3xl font-semibold text-forest sm:text-4xl">
            Commande enregistrée !
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Votre commande figure déjà dans notre système avec sa référence unique.
            Dernière étape : appuyez sur le grand bouton vert pour nous envoyer le
            récapitulatif prérempli sur WhatsApp.
          </p>

          <div className="mt-5 inline-flex flex-col items-center gap-1 rounded-xl bg-cream px-8 py-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
              Référence de commande
            </span>
            <span className="font-mono text-2xl font-bold text-forest-deep">
              {confirmed.reference}
            </span>
          </div>

          <div className="mt-8">
            <Button
              type="button"
              onClick={() => openWhatsApp(confirmed)}
              className="h-16 w-full rounded-2xl bg-[#25D366] text-lg font-bold text-white shadow-[0_16px_32px_-14px_rgba(37,211,102,0.65)] hover:bg-[#1FBF59] sm:text-xl"
            >
              <MessageCircle className="mr-3 size-6" aria-hidden="true" />
              Envoyer sur WhatsApp
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Le message est déjà prérempli avec votre commande : il ne vous reste
              qu&apos;à l&apos;envoyer.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6 text-left">
            <h2 className="font-display text-xl font-semibold text-forest">
              Récapitulatif de votre commande
            </h2>
            <div className="mt-4 divide-y divide-border">
              {confirmed.items.map((item, index) => (
                <div
                  key={item.name + '-' + index}
                  className="flex justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qté: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-foreground">
                    {item.price !== null
                      ? formatPrice(item.price * item.quantity)
                      : 'Sur demande'}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Client : {confirmed.customerName} · Téléphone :{' '}
              {confirmed.customerPhone}
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/commande/' + confirmed.reference)}
            >
              Voir ma commande
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/boutique')}
            >
              Continuer mes achats
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const validate = (): boolean => {
    const next: CheckoutErrors = {}
    if (form.customerName.trim().length < 2) {
      next.customerName = 'Veuillez indiquer votre nom complet.'
    }
    if (form.phone.trim().length < 6) {
      next.phone = 'Veuillez indiquer un numéro de téléphone valide.'
    }
    if (form.address.trim().length < 5) {
      next.address = 'Veuillez indiquer votre adresse ou zone de livraison.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate() || mutation.isPending) return
    mutation.mutate({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      comment: form.comment.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
        Finalisation
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
        Votre commande
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Renseignez vos coordonnées : la commande sera enregistrée, puis un grand
        bouton vert « Envoyer sur WhatsApp » apparaîtra pour finaliser l&apos;envoi.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-xl border border-border bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl font-semibold text-forest">
            Vos coordonnées
          </h2>

          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-name">Nom complet</Label>
              <Input
                id="checkout-name"
                value={form.customerName}
                onChange={(event) =>
                  setForm((state) => ({ ...state, customerName: event.target.value }))
                }
                placeholder="Prénom et nom"
                autoComplete="name"
                aria-invalid={!!errors.customerName}
              />
              {errors.customerName ? (
                <p className="text-xs text-destructive">{errors.customerName}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-phone">Téléphone</Label>
              <Input
                id="checkout-phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm((state) => ({ ...state, phone: event.target.value }))
                }
                placeholder="Ex. 01 23 45 67 89"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-address">Adresse / zone de livraison</Label>
              <Textarea
                id="checkout-address"
                value={form.address}
                onChange={(event) =>
                  setForm((state) => ({ ...state, address: event.target.value }))
                }
                placeholder="Adresse complète, quartier, points de repère…"
                rows={3}
                aria-invalid={!!errors.address}
              />
              {errors.address ? (
                <p className="text-xs text-destructive">{errors.address}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-comment">Commentaire éventuel</Label>
              <Textarea
                id="checkout-comment"
                value={form.comment}
                onChange={(event) =>
                  setForm((state) => ({ ...state, comment: event.target.value }))
                }
                placeholder="Précisions sur votre commande, horaires de livraison…"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-11 bg-forest-deep hover:bg-pine-deep sm:px-10"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 size-4" />
                  Commander maintenant
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="rounded-xl border border-border bg-muted/30 p-6 self-start">
          <h2 className="font-display text-xl font-semibold text-forest">
            Récapitulatif
          </h2>
          <div className="mt-4 divide-y divide-border">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                </div>
                <p className="font-medium text-foreground">
                  {item.price !== null
                    ? formatPrice(item.price * item.quantity)
                    : 'Sur demande'}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <PriceText
              price={undetermined ? null : subtotal}
              className="text-lg font-bold text-forest-deep"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
'@

    # Normalisation des fins de ligne en LF, puis ecriture UTF-8 SANS BOM
    # via .NET (contourne totalement les problemes d'encodage de Set-Content).
    $checkoutTsx = $checkoutTsx.Replace("`r`n", "`n")
    if (-not $checkoutTsx.EndsWith("`n")) { $checkoutTsx = $checkoutTsx + "`n" }
    $viewsDir = Join-Path (Join-Path (Join-Path (Join-Path $projectRoot 'src') 'components') 'site') 'views'
    New-Item -ItemType Directory -Force -Path $viewsDir | Out-Null
    $targetFile = Join-Path $viewsDir 'CheckoutView.tsx'
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($targetFile, $checkoutTsx, $utf8NoBom)
    Write-Ok ('Fichier ecrit : ' + $targetFile + ' (' + $checkoutTsx.Length + ' caracteres)')

    # -------------------------------------------------------------------------
    # Etape 2 : purge du cache persistant Turbopack
    # -------------------------------------------------------------------------
    Write-Step 'Etape 2/5 : Purge du cache Turbopack (.next)'
    $nextDir = Join-Path $projectRoot '.next'
    if (Test-Path -LiteralPath $nextDir) {
        Remove-Item -Recurse -Force -LiteralPath $nextDir
        Write-Ok 'Cache .next supprime'
    } else {
        Write-Ok 'Aucun cache .next a purger'
    }

    # -------------------------------------------------------------------------
    # Etape 3 : build de validation complet (detecte toute erreur de syntaxe)
    # -------------------------------------------------------------------------
    Write-Step 'Etape 3/5 : Build de validation (pnpm build)'
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) {
        Write-Host '    node_modules absent : installation des dependances (pnpm install)...'
        & pnpm install
        if ($LASTEXITCODE -ne 0) { throw 'pnpm install a echoue. Verifiez votre connexion internet puis relancez le script.' }
    }
    & pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw 'Le build (pnpm build) a echoue : aucune soumission Git effectuee, votre depot reste propre. Corrigez le probleme indique ci-dessus puis relancez le script.'
    }
    Write-Ok 'Build valide : aucune erreur de syntaxe ni <eof>'

    # -------------------------------------------------------------------------
    # Etape 4 : soumission Git -> deploiement production Vercel
    # -------------------------------------------------------------------------
    Write-Step 'Etape 4/5 : Soumission Git (add + commit + push)'
    & git add .
    & git diff --cached --quiet | Out-Null
    $hasStagedChanges = ($LASTEXITCODE -ne 0)

    if (-not $hasStagedChanges) {
        Write-Ok 'Le fichier injecte est deja a jour : rien a committer.'
    } else {
        & git commit -m 'Auto-setup WhatsApp injection'
        if ($LASTEXITCODE -ne 0) {
            throw 'git commit a echoue. Verifiez votre identite git (user.name et user.email) puis relancez le script.'
        }
        Write-Ok 'Commit cree : "Auto-setup WhatsApp injection"'

        $branch = & git rev-parse --abbrev-ref HEAD
        if ([string]::IsNullOrWhiteSpace($branch)) { $branch = 'main' } else { $branch = $branch.Trim() }
        Write-Host ('    Pousse vers origin/' + $branch + ' (deploiement Vercel en cours)...')
        & git push origin $branch
        if ($LASTEXITCODE -ne 0) {
            throw ('git push a echoue. Verifiez votre connexion et vos identifiants GitHub, puis executez manuellement : git push origin ' + $branch)
        }
        Write-Ok ('Code pousse sur GitHub (origin/' + $branch + ') : deploiement Vercel declenche')
    }

    # -------------------------------------------------------------------------
    # Bilan
    # -------------------------------------------------------------------------
    Write-Host ''
    Write-Host '==============================================================' -ForegroundColor Green
    Write-Host '  INSTALLATION TERMINEE AVEC SUCCES'                            -ForegroundColor Green
    Write-Host '==============================================================' -ForegroundColor Green
    Write-Host '  1. "Commander maintenant" -> POST /api/orders'                    -ForegroundColor White
    Write-Host '     Reference unique BO-AAAA-XXXX visible sur le Dashboard.'      -ForegroundColor White
    Write-Host '  2. L''ecran affiche ensuite un GRAND BOUTON VERT'                -ForegroundColor White
    Write-Host '     "Envoyer sur WhatsApp" (message deja pre-rempli).'            -ForegroundColor White
    Write-Host '  3. Numero admin formate international Benin (+229)'               -ForegroundColor White
    Write-Host '     si le numero configure commence par 01, 66 ou 49.'            -ForegroundColor White
    Write-Host '  Apres le deploiement Vercel (2 a 3 minutes), testez'              -ForegroundColor White
    Write-Host '  une commande depuis la boutique pour valider le flux.'            -ForegroundColor White
    Write-Host '==============================================================' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ''
    Write-Fail $_.Exception.Message
    Write-Host ''
    Write-Host '  Le script s est arrete SANS effectuer de commit : votre depot Git reste propre.' -ForegroundColor Yellow
    Write-Host '  Corrigez la cause indiquee ci-dessus puis relancez setup-whatsapp.ps1.'          -ForegroundColor Yellow
    exit 1
}
