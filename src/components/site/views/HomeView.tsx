// Page d'accueil — héros, bandeau de confiance, catégories, sélection, maison,
// comment commander, questions fréquentes, appel à l'action.

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, PhoneCall, Search, ShoppingBag, Sparkles } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { api } from '@/lib/api-client'
import { telHref } from '@/lib/format'
import { useSettings } from '../use-settings'
import { SectionHeading } from '@/components/shared/section-heading'
import { ProductCard } from '@/components/shared/product-card'
import { Button } from '@/components/ui/button'

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export function HomeView() {
  const { settings } = useSettings()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 800], [0, 16])

  // L'univers « Mixte » n'est affiché que s'il contient des parfums disponibles.
  const mixte = useQuery({
    queryKey: ['products', 'accueil-mixte'],
    queryFn: () => api.getProducts({ categorie: 'MIXTE', disponible: true }),
  })
  const showMixte = (mixte.data?.total ?? 0) > 0

  // Incontournables : produits en vedette, sinon derniers arrivés.
  const featured = useQuery({
    queryKey: ['products', 'accueil-vedette'],
    queryFn: () => api.getProducts({ vedette: true, disponible: true }),
  })
  const featuredEmpty = !featured.isLoading && (featured.data?.products.length ?? 0) === 0
  const recent = useQuery({
    queryKey: ['products', 'accueil-recents'],
    queryFn: () => api.getProducts({ tri: 'recent' }),
    enabled: featuredEmpty,
  })
  const products = (featuredEmpty ? recent.data?.products : featured.data?.products)?.slice(0, 4) ?? []
  const productsLoading = featured.isLoading || (featuredEmpty && recent.isLoading)

  // Nouveautés : les derniers vrais parfums arrivés à la maison (hors exemples).
  const nouveautes = useQuery({
    queryKey: ['products', 'accueil-nouveautes'],
    queryFn: () => api.getProducts({ tri: 'recent' }),
  })
  const nouveauxProduits =
    nouveautes.data?.products.filter((p) => !p.isSample).slice(0, 4) ?? []

  return (
    <>
      {/* Héro */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start gap-6"
          >
            <motion.span variants={heroItem} className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
              <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
              Maison de parfumerie
            </motion.span>
            <motion.h1
              variants={heroItem}
              className="font-display text-4xl font-semibold leading-[1.05] text-forest sm:text-5xl lg:text-6xl"
            >
              {settings.heroTitle}
            </motion.h1>
            <motion.p
              variants={heroItem}
              className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {settings.heroSubtitle}
            </motion.p>
            <motion.div variants={heroItem} className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 bg-forest-deep px-8 hover:bg-pine-deep">
                <a href="#/boutique">Découvrir nos parfums</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 border-forest/30 bg-transparent px-8 text-forest hover:border-forest hover:bg-cream"
              >
                <a href="#/commande">Commander</a>
              </Button>
            </motion.div>
            <motion.p
              variants={heroItem}
              className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            >
              <PhoneCall className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
              <span>Commandes également par téléphone au</span>
              <a
                href={telHref(settings.contactPhone)}
                className="font-medium text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
              >
                {settings.contactPhone}
              </a>
            </motion.p>
          </motion.div>

          <motion.div
            ref={heroRef}
            style={{ y: parallaxY }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            {/* Flottement doux et continu de l'ensemble cadre + visuel (CSS pur) */}
            <div className="bo-float relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-gold/50 sm:translate-x-4 sm:translate-y-4"
              />
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cream">
                <Image
                  src="/images/hero.png"
                  alt="Flacon de parfum raffiné de la maison E.T.P.S Belle Odeur"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                {/* Reflet lumineux balaie périodiquement le visuel (CSS pur) */}
                <div
                  aria-hidden="true"
                  className="bo-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bandeau de confiance */}
      <section aria-label="Nos garanties" className="border-y border-border/70 bg-cream">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem icon={<Sparkles className="size-5" aria-hidden="true" />}>
            Une sélection de parfums homme &amp; femme
          </TrustItem>
          <TrustItem icon={<PhoneCall className="size-5" aria-hidden="true" />}>
            <a
              href={telHref(settings.contactPhone)}
              className="transition-colors hover:text-forest"
            >
              Conseils et commandes au {settings.contactPhone}
            </a>
          </TrustItem>
          <TrustItem icon={<ShoppingBag className="size-5" aria-hidden="true" />}>
            Commande simple, directement depuis le site
          </TrustItem>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading eyebrow="Nos univers" title="Parfums Homme & Femme" />
        <div className={`grid gap-5 sm:grid-cols-2 ${showMixte ? 'lg:grid-cols-3' : ''}`}>
          <CategoryCard
            label="Parfums Homme"
            href="#/boutique?categorie=HOMME"
            image="/images/categorie-homme.jpg"
            alt="Univers des parfums pour homme"
            index={0}
          />
          <CategoryCard
            label="Parfums Femme"
            href="#/boutique?categorie=FEMME"
            image="/images/categorie-femme.jpg"
            alt="Univers des parfums pour femme"
            index={1}
          />
          {showMixte ? (
            <CategoryCard
              label="Parfums Mixtes"
              href="#/boutique?categorie=MIXTE"
              image="/images/categorie-mixte.jpg"
              alt="Univers des parfums mixtes"
              index={2}
            />
          ) : null}
        </div>
      </section>

      {/* Incontournables */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <SectionHeading eyebrow="Sélection" title="Nos incontournables" />
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border border-border/70">
                <div className="aspect-[4/5] animate-pulse bg-cream" />
                <div className="space-y-2.5 p-4 sm:p-5">
                  <div className="h-3 w-16 animate-pulse rounded bg-cream" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button
                asChild
                variant="outline"
                className="border-forest/30 bg-transparent px-6 text-forest hover:border-forest hover:bg-cream"
              >
                <a href="#/boutique">
                  Voir toute la boutique
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </>
        ) : null}
      </section>

      {/* Nouveautés — derniers vrais parfums arrivés */}
      {nouveauxProduits.length > 0 ? (
        <section aria-label="Nouveautés" className="border-t border-border/60 bg-cream/50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Arrivages"
              title="Nouveautés"
              description="Les derniers parfums arrivés à la maison."
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {nouveauxProduits.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button
                asChild
                variant="outline"
                className="border-forest/30 bg-transparent px-6 text-forest hover:border-forest hover:bg-cream"
              >
                <a href="#/boutique?tri=recent">
                  Voir tous les parfums
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* La maison */}
      <section className="border-t border-border/60">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[480px] lg:order-1"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 -translate-x-3 translate-y-3 rounded-2xl border border-gold/50 sm:-translate-x-4 sm:translate-y-4"
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cream">
              <Image
                src="/images/a-propos.jpg"
                alt="L'univers de la maison E.T.P.S Belle Odeur"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col items-start gap-6 lg:order-2"
          >
            <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold-deep">
              <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
              La maison
            </span>
            <h2 className="font-display text-3xl font-semibold leading-tight text-forest sm:text-4xl">
              Une maison dédiée au parfum
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-ink/80">
              {settings.aboutIntro}
            </p>
            <Button
              asChild
              variant="outline"
              className="border-forest/30 bg-transparent px-6 text-forest hover:border-forest hover:bg-cream"
            >
              <a href="#/a-propos">
                Découvrir la maison
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Comment commander */}
      <section aria-label="Comment commander" className="border-y border-border/70 bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <SectionHeading
            eyebrow="Commande"
            title="Comment commander ?"
            description="Trois étapes simples, en ligne ou par téléphone."
          />
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            <OrderStep
              index={1}
              icon={<Search className="size-6" aria-hidden="true" />}
              title="Parcourez la boutique"
            >
              Découvrez nos parfums homme, femme et mixte, et consultez leur disponibilité.
            </OrderStep>
            <OrderStep
              index={2}
              icon={<ShoppingBag className="size-6" aria-hidden="true" />}
              title="Composez votre commande"
            >
              Ajoutez vos parfums au panier, renseignez vos coordonnées dans le formulaire, puis
              validez.
            </OrderStep>
            <OrderStep
              index={3}
              icon={<PhoneCall className="size-6" aria-hidden="true" />}
              title="Nous confirmons ensemble"
            >
              <>
                Votre commande est enregistrée avec sa référence. Contactez-nous au{' '}
                <a
                  href={telHref(settings.contactPhone)}
                  className="font-medium text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {settings.contactPhone}
                </a>{' '}
                pour la confirmer.
              </>
            </OrderStep>
          </ol>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section aria-label="Questions fréquentes" className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading eyebrow="Aide" title="Questions fréquentes" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <Accordion type="single" collapsible>
            <FaqItem value="faq-commande" question="Comment passer commande ?">
              Parcourez la boutique, ajoutez les parfums souhaités à votre panier, puis remplissez
              le formulaire de commande. Une référence vous est communiquée dès la validation.
            </FaqItem>
            <FaqItem value="faq-telephone" question="Puis-je commander par téléphone ?">
              <>
                Oui. Vous pouvez passer commande directement par téléphone au{' '}
                <a
                  href={telHref(settings.contactPhone)}
                  className="font-medium text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {settings.contactPhone}
                </a>
                .
              </>
            </FaqItem>
            <FaqItem value="faq-disponibilite" question="Comment savoir si un parfum est disponible ?">
              La disponibilité de chaque parfum est indiquée dans la boutique et sur sa fiche
              produit. Seuls les parfums disponibles peuvent être ajoutés au panier.
            </FaqItem>
            <FaqItem value="faq-apres" question="Que se passe-t-il après ma commande ?">
              <>
                Votre commande est enregistrée avec sa référence. Notre équipe reste joignable au{' '}
                <a
                  href={telHref(settings.contactPhone)}
                  className="font-medium text-forest underline decoration-gold/50 underline-offset-4 transition-colors hover:decoration-gold"
                >
                  {settings.contactPhone}
                </a>{' '}
                pour toute confirmation ou question.
              </>
            </FaqItem>
          </Accordion>
        </motion.div>
      </section>

      {/* Appel à l'action final */}
      <section className="bg-forest-deep py-16 text-center text-white lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Un parfum en tête ?</h2>
          <p className="max-w-md text-sm text-white/75 sm:text-base">
            Contactez-nous ou commandez directement en ligne.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-11 bg-[#ffffff] px-8 text-[#0B3D2E] hover:bg-[#F7F5EF]"
            >
              <a href={telHref(settings.contactPhone)}>
                <PhoneCall className="size-4" aria-hidden="true" />
                {settings.contactPhone}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-white/40 bg-transparent px-8 text-white hover:border-white hover:bg-white/10 hover:text-white"
            >
              <a href="#/boutique">Voir la boutique</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

function OrderStep({
  index,
  icon,
  title,
  children,
}: {
  index: number
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index - 1) * 0.12, ease: 'easeOut' }}
      className="flex flex-col items-center gap-4 text-center"
    >
      <span className="relative flex size-16 items-center justify-center rounded-full border border-gold/40 bg-white text-forest">
        {icon}
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-gold font-display text-sm font-semibold text-[#0B3D2E]"
        >
          {index}
        </span>
      </span>
      <h3 className="font-display text-xl font-semibold text-forest">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-ink/75">{children}</p>
    </motion.li>
  )
}

function FaqItem({
  value,
  question,
  children,
}: {
  value: string
  question: string
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="border-border/70">
      <AccordionTrigger className="py-5 text-base font-medium text-forest no-underline hover:no-underline hover:text-gold-deep">
        {question}
      </AccordionTrigger>
      <AccordionContent className="pb-5 text-sm leading-relaxed text-ink/75">
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}

function TrustItem({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-white text-gold-deep">
        {icon}
      </span>
      <p className="text-sm leading-snug text-ink/80">{children}</p>
    </div>
  )
}

function CategoryCard({
  label,
  href,
  image,
  alt,
  index,
}: {
  label: string
  href: string
  image: string
  alt: string
  index: number
}) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: 'easeOut' }}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-cream lg:aspect-[3/4]"
      aria-label={`Découvrir les ${label.toLowerCase()}`}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/30 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5 sm:p-6">
        <h3 className="font-display text-2xl font-semibold text-white">{label}</h3>
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-gold">
          Découvrir
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </motion.a>
  )
}
