// Contact — coordonnées de la maison + formulaire de message.

'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Facebook,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  Music2,
  PhoneCall,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { telHref } from '@/lib/format'
import { useSettings } from '../use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface ContactForm {
  name: string
  phone: string
  message: string
}

type ContactErrors = Partial<Record<'name' | 'phone' | 'message', string>>

const EMPTY_FORM: ContactForm = { name: '', phone: '', message: '' }

export function ContactView() {
  const { settings } = useSettings()
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: (input: { name: string; phone: string; message: string }) =>
      api.sendContact(input),
    onSuccess: () => setSent(true),
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.'
      )
    },
  })

  const socials = [
    { label: 'Instagram', href: settings.socialInstagram, Icon: Instagram },
    { label: 'Facebook', href: settings.socialFacebook, Icon: Facebook },
    { label: 'TikTok', href: settings.socialTiktok, Icon: Music2 },
  ].filter((social) => social.href !== '')

  const validate = (): boolean => {
    const next: ContactErrors = {}
    if (form.name.trim().length < 2) next.name = 'Veuillez indiquer votre nom.'
    if (form.phone.trim().length < 6) {
      next.phone = 'Veuillez indiquer votre numéro de téléphone.'
    }
    if (form.message.trim().length === 0) next.message = 'Veuillez écrire votre message.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate() || mutation.isPending) return
    mutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
              Nous joindre
            </span>
            <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl lg:text-5xl">
              Contactez-nous
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Une question sur nos parfums ou votre commande ?
            </p>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                <PhoneCall className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  Téléphone
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-forest">
                  {settings.contactPhone}
                </p>
                <Button asChild size="sm" className="mt-3 bg-forest-deep hover:bg-pine-deep">
                  <a href={telHref(settings.contactPhone)}>Appeler</a>
                </Button>
              </div>
            </div>

            {settings.contactEmail ? (
              <>
                <Separator className="my-6" />
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                    <Mail className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                      E-mail
                    </p>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="mt-1 block break-words text-sm font-medium text-forest underline decoration-gold/50 underline-offset-4"
                    >
                      {settings.contactEmail}
                    </a>
                  </div>
                </div>
              </>
            ) : null}

            <Separator className="my-6" />
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                  Adresse
                </p>
                {settings.contactAddress ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/80">
                    {settings.contactAddress}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    Adresse communiquée prochainement
                  </p>
                )}
              </div>
            </div>

            {socials.length > 0 ? (
              <>
                <Separator className="my-6" />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                    Réseaux sociaux
                  </p>
                  <div className="mt-3 flex gap-2.5">
                    {socials.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${label} — nouvelle fenêtre`}
                        className="flex size-11 items-center justify-center rounded-full border border-forest/25 text-forest transition-colors hover:bg-forest-deep hover:text-white"
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {sent ? (
          <div className="flex h-fit flex-col items-center justify-center gap-4 rounded-xl border border-border bg-white p-8 text-center sm:p-10">
            <CheckCircle2 className="size-12 text-forest" aria-hidden="true" />
            <h2 className="font-display text-2xl font-semibold text-forest">
              Message envoyé
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Votre message a bien été envoyé. Notre équipe vous répondra dès que possible.
            </p>
            <Button
              variant="outline"
              className="mt-2 border-forest/30 bg-transparent text-forest hover:border-forest hover:bg-cream"
              onClick={() => {
                setForm(EMPTY_FORM)
                setErrors({})
                setSent(false)
              }}
            >
              Envoyer un autre message
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="h-fit rounded-xl border border-border bg-white p-6 sm:p-8"
          >
            <h2 className="font-display text-2xl font-semibold text-forest">
              Envoyer un message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nous vous répondrons dès que possible.
            </p>

            <div className="mt-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Nom</Label>
                <Input
                  id="contact-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, name: event.target.value }))
                  }
                  placeholder="Votre nom"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                />
                {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, phone: event.target.value }))
                  }
                  placeholder="Ex. 06 12 34 56 78"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone ? (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, message: event.target.value }))
                  }
                  placeholder="Votre question, votre demande…"
                  rows={5}
                  aria-invalid={!!errors.message}
                />
                {errors.message ? (
                  <p className="text-xs text-destructive">{errors.message}</p>
                ) : null}
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="mt-7 h-11 w-full bg-forest-deep hover:bg-pine-deep"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Envoi en cours…
                </>
              ) : (
                'Envoyer le message'
              )}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
