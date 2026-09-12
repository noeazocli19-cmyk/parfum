// Réglages du site : textes, coordonnées, sécurité (mot de passe, compte).

'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { adminApi, api } from '@/lib/api-client'
import type { AdminInfo, SiteSettings } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/shared/spinner'
import {
  handleMutationError,
  useAdminQuery,
  type NavigateFn,
} from './admin-hooks'
import { AdminCard, AdminPageHeader, SubmitLabel } from './admin-ui'

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Formulaire de changement de mot de passe. */
function PasswordCard({ navigate }: { navigate: NavigateFn }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const changeMutation = useMutation({
    mutationFn: () => api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Mot de passe modifié')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    },
    onError: (err) => handleMutationError(err, navigate),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!currentPassword) {
      setError('Veuillez saisir votre mot de passe actuel.')
      return
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    changeMutation.mutate()
  }

  return (
    <AdminCard className="p-6">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-gold-deep" aria-hidden="true" />
        <h2 className="font-display text-lg font-semibold text-forest">
          Changer le mot de passe
        </h2>
      </div>
      <form onSubmit={onSubmit} className="mt-4 max-w-md space-y-4" noValidate>
        <Field label="Mot de passe actuel" htmlFor="password-current">
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>
        <Field
          label="Nouveau mot de passe"
          htmlFor="password-new"
          hint="8 caractères minimum."
        >
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirmation" htmlFor="password-confirm">
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={changeMutation.isPending}>
          <SubmitLabel
            pending={changeMutation.isPending}
            idle="Modifier le mot de passe"
            pendingLabel="Modification…"
          />
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Le mot de passe est stocké de manière chiffrée (bcrypt).
        </p>
      </form>
    </AdminCard>
  )
}

export function SettingsPage({
  admin,
  navigate,
}: {
  admin: AdminInfo
  navigate: NavigateFn
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SiteSettings | null>(null)

  const settingsQuery = useAdminQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.getSettings(),
    navigate,
  })

  // Hydratation du formulaire à réception des réglages (pendant le rendu).
  if (form === null && settingsQuery.data) setForm({ ...settingsQuery.data })

  function setField(key: keyof SiteSettings, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const saveMutation = useMutation({
    mutationFn: (values: Partial<Record<keyof SiteSettings, string>>) =>
      adminApi.updateSettings(values),
    onSuccess: () => {
      toast.success('Réglages enregistrés')
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: (error) => handleMutationError(error, navigate),
  })

  const textValues = (): Partial<Record<keyof SiteSettings, string>> => ({
    heroTitle: form?.heroTitle ?? '',
    heroSubtitle: form?.heroSubtitle ?? '',
    footerPitch: form?.footerPitch ?? '',
    aboutIntro: form?.aboutIntro ?? '',
    aboutStory: form?.aboutStory ?? '',
    aboutValues: form?.aboutValues ?? '',
    aboutVision: form?.aboutVision ?? '',
  })

  const contactValues = (): Partial<Record<keyof SiteSettings, string>> => ({
    contactPhone: form?.contactPhone ?? '',
    contactEmail: form?.contactEmail ?? '',
    contactAddress: form?.contactAddress ?? '',
    socialInstagram: form?.socialInstagram ?? '',
    socialFacebook: form?.socialFacebook ?? '',
    socialTiktok: form?.socialTiktok ?? '',
  })

  if (settingsQuery.isPending || !form) {
    return <Spinner label="Chargement des réglages…" />
  }
  if (settingsQuery.error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {settingsQuery.error.message}
      </p>
    )
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Textes du site, coordonnées publiques et sécurité du compte."
      />

      <Tabs defaultValue="textes">
        <TabsList className="flex-wrap">
          <TabsTrigger value="textes">Textes du site</TabsTrigger>
          <TabsTrigger value="coordonnees">Coordonnées</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
        </TabsList>

        {/* Textes du site */}
        <TabsContent value="textes" className="mt-4">
          <AdminCard className="p-6">
            <div className="grid gap-4">
              <Field
                label="Titre de la bannière d'accueil"
                htmlFor="settings-hero-title"
              >
                <Input
                  id="settings-hero-title"
                  value={form.heroTitle}
                  onChange={(event) => setField('heroTitle', event.target.value)}
                />
              </Field>
              <Field label="Texte d'accueil" htmlFor="settings-hero-subtitle">
                <Textarea
                  id="settings-hero-subtitle"
                  rows={2}
                  value={form.heroSubtitle}
                  onChange={(event) => setField('heroSubtitle', event.target.value)}
                />
              </Field>
              <Field label="Signature du pied de page" htmlFor="settings-footer-pitch">
                <Textarea
                  id="settings-footer-pitch"
                  rows={2}
                  value={form.footerPitch}
                  onChange={(event) => setField('footerPitch', event.target.value)}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Remplacez le contenu provisoire par les informations officielles.
              </p>
              <Field label="Introduction (À propos)" htmlFor="settings-about-intro">
                <Textarea
                  id="settings-about-intro"
                  rows={4}
                  value={form.aboutIntro}
                  onChange={(event) => setField('aboutIntro', event.target.value)}
                />
              </Field>
              <Field label="Notre histoire" htmlFor="settings-about-story">
                <Textarea
                  id="settings-about-story"
                  rows={4}
                  value={form.aboutStory}
                  onChange={(event) => setField('aboutStory', event.target.value)}
                />
              </Field>
              <Field label="Nos valeurs" htmlFor="settings-about-values">
                <Textarea
                  id="settings-about-values"
                  rows={4}
                  value={form.aboutValues}
                  onChange={(event) => setField('aboutValues', event.target.value)}
                />
              </Field>
              <Field label="Notre vision" htmlFor="settings-about-vision">
                <Textarea
                  id="settings-about-vision"
                  rows={4}
                  value={form.aboutVision}
                  onChange={(event) => setField('aboutVision', event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate(textValues())}
                disabled={saveMutation.isPending}
              >
                <SubmitLabel
                  pending={saveMutation.isPending}
                  idle="Enregistrer les textes"
                />
              </Button>
            </div>
          </AdminCard>
        </TabsContent>

        {/* Coordonnées */}
        <TabsContent value="coordonnees" className="mt-4">
          <AdminCard className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Téléphone de contact"
                htmlFor="settings-contact-phone"
                hint="Numéro affiché sur le site public."
              >
                <Input
                  id="settings-contact-phone"
                  value={form.contactPhone}
                  onChange={(event) => setField('contactPhone', event.target.value)}
                />
              </Field>
              <Field
                label="E-mail de contact"
                htmlFor="settings-contact-email"
                hint="Laisser vide tant qu'aucune adresse officielle n'est fournie."
              >
                <Input
                  id="settings-contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setField('contactEmail', event.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Adresse"
                  htmlFor="settings-contact-address"
                  hint="Laisser vide tant qu'aucune adresse officielle n'est fournie."
                >
                  <Textarea
                    id="settings-contact-address"
                    rows={2}
                    value={form.contactAddress}
                    onChange={(event) => setField('contactAddress', event.target.value)}
                  />
                </Field>
              </div>
              <Field
                label="Instagram"
                htmlFor="settings-social-instagram"
                hint="URL complète ou vide."
              >
                <Input
                  id="settings-social-instagram"
                  value={form.socialInstagram}
                  onChange={(event) => setField('socialInstagram', event.target.value)}
                  placeholder="https://instagram.com/…"
                />
              </Field>
              <Field
                label="Facebook"
                htmlFor="settings-social-facebook"
                hint="URL complète ou vide."
              >
                <Input
                  id="settings-social-facebook"
                  value={form.socialFacebook}
                  onChange={(event) => setField('socialFacebook', event.target.value)}
                  placeholder="https://facebook.com/…"
                />
              </Field>
              <Field
                label="TikTok"
                htmlFor="settings-social-tiktok"
                hint="URL complète ou vide."
              >
                <Input
                  id="settings-social-tiktok"
                  value={form.socialTiktok}
                  onChange={(event) => setField('socialTiktok', event.target.value)}
                  placeholder="https://tiktok.com/@…"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => saveMutation.mutate(contactValues())}
                disabled={saveMutation.isPending}
              >
                <SubmitLabel
                  pending={saveMutation.isPending}
                  idle="Enregistrer les coordonnées"
                />
              </Button>
            </div>
          </AdminCard>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="securite" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <PasswordCard navigate={navigate} />
            <AdminCard className="p-6">
              <h2 className="font-display text-lg font-semibold text-forest">
                Compte
              </h2>
              <div className="mt-4 max-w-md space-y-1.5">
                <Label htmlFor="settings-account-username">
                  Identifiant administrateur
                </Label>
                <Input
                  id="settings-account-username"
                  value={admin.username}
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Compte unique de l&apos;espace d&apos;administration. Le mot de passe
                  peut être modifié dans la section ci-contre.
                </p>
              </div>
            </AdminCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
