# Journal de travail — E.T.P.S BELLE ODEUR

---
Task ID: 1 (fondations : 1 → 5)
Agent: Z.ai Code (orchestrateur)
Task: Architecture complète, design system, base de données, backend API, sécurité, visuels temporaires

Work Log:
- Inspecté l'environnement : Next.js 16 + Tailwind 4 + shadcn/ui complet, TanStack Query, zustand, framer-motion, sonner, zod, Prisma/SQLite.
- Ajouté `jose` (JWT) ; `bcryptjs` déjà présent. Secrets générés dans `.env` : `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=WJl2x12yn6QXkK1Z`, `SESSION_SECRET` (64 hex), `ADMIN_SESSION_HOURS=8`.
- Écrit `prisma/schema.prisma` : Product (+ProductImage), Order (+OrderItem), ContactMessage, AdminUser, Setting. `db:push` OK.
- Design system dans `src/app/globals.css` : palette (forest #0B3D2E, pine #123F32, gold #C9A227, cream #F7F5EF, ink #171717), tokens @theme (--color-forest/pine/gold/gold-deep/cream/ink), polices Cormorant Garamond (display) + Jost (body) via next/font, scrollbar custom, selection dorée.
- `src/app/layout.tsx` : lang fr, métadonnées SEO + OpenGraph (FR), favicon `src/app/icon.svg` (flacon doré sur vert).
- Libs partagées : `src/lib/types.ts` (contrat TS complet), `src/lib/auth.ts` (JWT httpOnly SameSite=strict, requireAdmin + CSRF origine, rateLimit mémoire, clientIp), `src/lib/validations.ts` (zod FR), `src/lib/format.ts` (prix EUR fr-FR, dates, slugify, labels statuts), `src/lib/api-utils.ts` (productInclude, ensureUniqueSlug, normalizeImages), `src/lib/site-defaults.ts` (textes provisoires par défaut), `src/lib/api-client.ts` (api + adminApi typés), `src/lib/db.ts` (client prisma global).
- Stores/hooks : `src/store/cart.ts` (zustand persist bo-cart-v1 + cartCount/cartSubtotal/cartHasUndeterminedPrice), `src/hooks/use-hash-route.ts` (routeur hash SSR-safe + buildHash), `src/app/page.tsx` (Providers Query + switch SiteApp/AdminApp + scroll top par changement de segments).
- Composants partagés dans `src/components/shared/` : ProductCard (motion whileInView, badge Exemple, ajout panier), PriceText (« Prix sur demande » si null), SampleBadge, StatusBadge, SectionHeading, EmptyState, QuantityStepper, Spinner.
- API complète et testée par curl :
  - Public : GET /api/products (filtres categorie/recherche/disponible/vedette/tri/excludeId), GET /api/products/[id|slug], POST /api/orders (prix relus en base, stock décrémenté, référence BO-AAAA-NNNN, hasUndeterminedPrice), POST /api/contact, GET /api/settings.
  - Auth : POST /api/auth/login (rate limit 5/15min, bcrypt, cookie bo_session httpOnly SameSite=strict), POST /api/auth/logout, GET /api/auth/me, POST /api/auth/change-password.
  - Admin (requireAdmin) : GET /api/admin/stats, GET /api/admin/orders (+filtres), GET/PATCH/DELETE /api/admin/orders/[id], GET /api/admin/messages, PATCH/DELETE /api/admin/messages/[id], GET/PUT /api/admin/settings, POST /api/upload (JPG/PNG/WebP ≤ 5 Mo → public/uploads), GET/DELETE /api/admin/uploads, GET /api/admin/customers.
- Seed `prisma/seed.ts` exécuté : admin créé, réglages initialisés, 7 parfums d'exemple (isSample=true, price=null → « Prix sur demande »), images placeholder dans /images/produits/.
- Visuels temporaires générés en arrière-plan (scripts/gen-images.sh) : hero, 3 catégories, 7 flacons produits, à-propos, logo emblème (clair + foncé) → public/images/.
- Stubs SiteApp/AdminApp en place ; page compile.

Stage Summary:
- Backend 100 % opérationnel et vérifié par curl (auth 401 sans session, login OK, stats OK).
- Identifiants admin (ne pas exposer publiquement) : utilisateur `admin`, mot de passe `WJl2x12yn6QXkK1Z` (stocké hashé en base, présent dans `.env`).
- Contrat unique : tous les types dans `src/lib/types.ts`, tous les appels via `src/lib/api-client.ts`.
- Le site public doit être écrit UNIQUEMENT dans `src/components/site/**` (Task 6-a), le dashboard UNIQUEMENT dans `src/components/admin/**` (Task 6-b), en conservant les exports `SiteApp({ route, navigate })` et `AdminApp({ route, navigate })`.

---
Task ID: 6-a
Agent: full-stack-developer (site public)
Task: Site public E.T.P.S BELLE ODEUR

Work Log:
- Lu worklog.md + contrats : types.ts, api-client.ts, format.ts, store/cart.ts, use-hash-route.ts, composants shared/, globals.css (tokens forest/pine/gold/cream/ink, font-display/font-sans), ui shadcn disponibles.
- Créé `src/components/site/use-settings.ts` : hook useSettings (useQuery ['settings'] + fallback DEFAULT_SETTINGS pendant le chargement, aucun flash).
- Réécrit `SiteApp.tsx` (export inchangé) : switch sur route.segments (accueil, boutique, parfum/slug, panier, commande, confirmation/ref, a-propos, contact, 404), layout flex min-h-screen (footer collé via main flex-1), AnimatePresence mode="wait" fade 0.25s key={segments.join('/')}, CartDrawer + SearchOverlay montés en tête de composant.
- `Navbar.tsx` : sticky h-16/lg:h-20 bg-white/90 backdrop-blur, ombre au scroll > 8px, logo emblème + E.T.P.S / BELLE ODEUR, 6 liens desktop avec soulignement doré motion layoutId="nav-underline", badge panier spring (rendu après montage, key=lastAddedAt), overlay mobile plein écran serif + bloc téléphone, scroll body verrouillé menu ouvert, fermeture auto au changement de route.
- `Footer.tsx` : bg-forest, logo-embleme-fonce, footerPitch, navigation, contact tél (telHref), barre © année.
- `SearchOverlay.tsx` : plein écran, input serif bordure or autofocus, Esc/X/fond ferment, debounce 250ms, useQuery api.getProducts enabled ≥ 2 caractères, 6 résultats (miniature, nom, catégorie, PriceText), Entrée → boutique?recherche=…
- `CartDrawer.tsx` : Sheet shadcn droite max-w-md, contenu après `mounted`, lignes produits (thumb 64, stepper sm, total ligne, Trash2), vide → EmptyState + CTA, pied : sous-total (ou « À confirmer par téléphone »), note dorée prix-sur-demande, boutons « Passer la commande » / « Continuer mes achats ».
- `views/HomeView.tsx` : héro 2 colonnes avec stagger, cadre doré décalé + parallax (useScroll/useTransform ±16px), bandeau confiance bg-cream (3 items icônes or), catégories Homme/Femme + Mixte seulement si api.getProducts({categorie:'MIXTE',disponible:true}).total>0 (cards image + gradient forest + « Découvrir »), incontournables vedette→fallback récents (4 ProductCard stagger) + squelettes, CTA final bg-forest (tél blanc + outline boutique).
- `views/ShopView.tsx` : en-tête + compte « n parfum(s) », barre filtres sticky top-16/lg:top-20 (chips catégorie, chip « Disponibles uniquement », recherche debouncée 300ms, Select tri), URL synchronisée en replace via buildHash, grille 2/3/4 + squelettes 12 cards, load-more +12, EmptyState SearchX + reset filtres.
- `views/ProductView.tsx` : fil d'Ariane, galerie (aspect 4/5, AnimatePresence fade par URL, miniatures 72px bordure or, aria « Afficher l'image n »), eyebrow catégorie + SampleBadge, ligne dispo (dot), PriceText « Prix sur demande », notes, stepper (max=stock??99), « Ajouter au panier » (toast action « Voir le panier ») / « Commander maintenant », « Épuisé » si indisponible, ligne téléphone, JSON-LD Product (name/description/category/availability, < échappé), suggestions même catégorie excludeId (max 4). NB : CATEGORY_LABELS est dans @/lib/types (pas format).
- `views/CartView.tsx` : après mount, vide → EmptyState, liste (thumb 80, stepper, total, suppression) + récap sticky top-24 (sous-total, note dorée, total ou « Montant à confirmer par téléphone », mention livraison par téléphone, CTA commande).
- `views/CheckoutView.tsx` : panier vide → EmptyState ; formulaire validé FR (nom ≥2, téléphone ≥6, adresse ≥5, erreurs inline text-destructive), useMutation api.createOrder, bouton loader « Envoi en cours… », onSuccess clear() + navigate confirmation/référence, onError toast.error(message API) ; récap items compact + « Modifier le panier » + encart crème « Besoin d'aide ? » tél.
- `views/ConfirmationView.tsx` : cercle or spring + Check, « Merci ! », référence BO-… en encart crème, texte équipe, ligne téléphone or, boutons boutique/accueil.
- `views/AboutView.tsx` : bandeau a-propos.jpg + overlay forest/70, 4 sections (SectionHeading left) textes settings whitespace-pre-line, encart crème téléphone + bouton Appeler.
- `views/ContactView.tsx` : carte coordonnées (tél + Appeler, Mail si contactEmail, MapPin ou « Adresse communiquée prochainement », icônes réseaux seulement si définis), formulaire nom/tél/message validé FR, useMutation api.sendContact, succès → panneau CheckCircle2 inline + « Envoyer un autre message », erreur → toast.
- `views/NotFoundView.tsx` : eyebrow 404, titre serif, retour accueil.
- Vérification : `bunx tsc --noEmit` → ZÉRO erreur dans src/components/site/** ; curl http://localhost:3000 + dev.log relus : plus aucune erreur site dans les compiles récents (les 500 restants proviennent exclusivement de src/components/admin/**, Task 6-b en cours : modules manquants puis imports erronés ORDER_STATUS_LABELS).

Stage Summary:
- Fichiers créés/modifiés (tous dans src/components/site/**) : SiteApp.tsx (modifié), use-settings.ts, Navbar.tsx, Footer.tsx, SearchOverlay.tsx, CartDrawer.tsx, views/{HomeView,ShopView,ProductView,CartView,CheckoutView,ConfirmationView,AboutView,ContactView,NotFoundView}.tsx.
- Aucune modification hors périmètre ; exports partagés intact ; hydratation sûre (panier/badge après montage, aucune lecture window au premier rendu) ; aucun emoji ; textes FR exacts du cahier des charges ; téléphone exclusivement via settings.contactPhone ; rien d'inventé (adresse/réseaux conditionnels).
- Point d'attention 1 : à l'instant T, public/images/ ne contient pas encore hero.png, categorie-*.jpg, a-propos.jpg, logo-embleme*.png ni produits/*.jpg (seul un dossier produits vide existe) alors que le brief les annonce disponibles — les <Image> référencent ces chemins conformément au contrat ; l'orchestrateur devra s'assurer de leur génération (scripts/gen-images.sh Task 1) sinon les visuels seront manquants (la mise en page reste stable grâce aux fill + fonds crème).
- Point d'attention 2 : le 500 global actuel vient de src/components/admin/** (Task 6-b, modules/imports en cours de correction par l'agent parallèle) — le site public compile de son côté sans erreur (tsc + dev.log).

---
Task ID: 6-b
Agent: full-stack-developer (dashboard admin) — finalisé par l'orchestrateur
Task: Dashboard administrateur E.T.P.S BELLE ODEUR

Work Log:
- L'agent a créé tous les fichiers : AdminApp.tsx (guard me + redirections), AdminShell.tsx (sidebar verte + header + Sheet mobile), LoginPage.tsx, DashboardHome.tsx (stats + mini bar-chart 14 jours sans lib), ProductsPage.tsx (table + switch dispo/vedette + suppression), ProductFormPage.tsx (création/édition, upload images, slug auto, validation zod), OrdersPage.tsx, OrderDetailPage.tsx (statut + suppression), MessagesPage.tsx, CustomersPage.tsx, UploadsPage.tsx, SettingsPage.tsx (3 onglets), admin-hooks.ts, admin-ui.tsx.
- Contexte de l'agent épuisé avant finalisation ; l'orchestrateur a corrigé : imports ORDER_STATUS_LABELS (types → format) dans OrdersPage/OrderDetailPage, et suppression de tous les setState-dans-effet au profit du pattern « ajustement pendant le rendu » (ProductFormPage, SettingsPage) conformément à la règle react-hooks (ESLint 12 erreurs → 0).
- Images de marque régénérées en avant-plan (le processus d'arrière-plan était tué par le sandbox) : hero, 3 catégories, 7 produits, à-propos + logos reconverties en vrais PNG via sharp.

Stage Summary:
- Dashboard complet opérationnel : statistiques, CRUD produits avec images, gestion commandes (statuts), messages, clients, médiathèque, réglages (textes + coordonnées + mot de passe).
- bun run lint : 0 erreur. tsc --noEmit (hors dossiers examples/skills du scaffold préexistant) : 0 erreur.

---
Task ID: 7 + 8 (intégration, lint, vérification navigateur)
Agent: Z.ai Code (orchestrateur)
Task: Intégration finale, correctifs React 19, vérification end-to-end

Work Log:
- Corrigé 12 erreurs ESLint (react-hooks/set-state-in-effect) : hook useMounted (useSyncExternalStore), routeur hash réécrit avec useSyncExternalStore, ajustements d'état pendant le rendu (ShopView, ProductFormPage, SettingsPage, SearchOverlay, Navbar).
- Corrigé imports ORDER_STATUS_LABELS (types → format) et casts settings (as unknown as SiteSettings).
- Réparé le cache CSS Turbopack corrompu (mélange ancien scaffold/nouveau tokens) : redémarrage propre du serveur + suppression .next — les classes de marque (bg-forest, eyebrow, scrollbar, --color-*) sont désormais toutes compilées.
- Corrigé le menu mobile : le backdrop-blur du header en faisait le conteneur du position:fixed (menu limité à 64px) → menu sorti du <header> dans un fragment.
- Reconvertis les logos en vrais PNG via sharp (les fichiers générés contenaient des octets JPEG).
- Régénéré les 13 visuels en avant-plan (les processus d'arrière-plan étaient tués par le sandbox).
- Ajouté metadataBase aux métadonnées (warning OG résolu).
- Nettoyé les données de test (produit créé via UI supprimé via UI avec AlertDialog ; commande et message de test purgés) — il reste les 7 parfums d'exemple d'origine.

Vérifications navigateur (agent-browser) :
- Accueil : hero + cadre doré + parallax, bandeau confiance, catégories (Mixte conditionnelle OK), incontournables avec badges « Exemple », CTA, footer — aucun débordement.
- Boutique : filtres chips + disponibilité + recherche + tri, 8→7 parfums, load-more, EmptyState.
- Fiche produit : galerie, badge Exemple, « Prix sur demande », quantité, ajout panier (toast + action), Commander maintenant, JSON-LD, suggestions.
- Panier (page + tiroir) : quantités, suppression, sous-total, note prix-sur-demande.
- Commande : formulaire validé, envoi → confirmation « Merci ! » + référence BO-2026-0001, commande vérifiée en base (prix relus côté serveur).
- Contact : envoi OK, message en base.
- Admin : garde #/admin → connexion (401 sans session OK), mauvais mot de passe rejeté, connexion OK ; dashboard (stats exactes, mini bar-chart 14 j, statuts) ; commande : changement statut EN_PREPARATION vérifié en base ; produits : création « Fleur de Passiflore » (slug auto, catégorie, prix) → apparition immédiate sur le site public (8 parfums, prix affiché) puis suppression via UI ; paramètres : modification du titre hero → visible immédiatement sur l'accueil (puis restauré) ; déconnexion OK.
- Mobile 390px : aucun débordement horizontal, menu hamburger plein écran corrigé, hero empilé.
- Footer collé en bas (min-h-screen flex + main flex-1 + mt-auto).
- Console navigateur : 0 erreur. dev.log : 0 erreur. ESLint : 0 erreur. tsc --noEmit (hors dossiers scaffold préexistants examples/ et skills/) : 0 erreur.

Stage Summary:
- Site e-commerce complet, dynamique et vérifié de bout en bout. Prêt pour la Cliente : il suffit d'ajouter les vrais produits/images/textes depuis le dashboard (http://…/#/admin — identifiants dans .env).
- Recommandations de mise en production : définir NEXT_PUBLIC_SITE_URL, remplacer SESSION_SECRET et ADMIN_PASSWORD, passer le cookie de session en secure (HTTPS), brancher un stockage persistant pour public/uploads.

---
Task ID: 9
Agent: Z.ai Code (orchestrateur)
Task: Enrichissement de la page d'accueil — 3 nouvelles sections

Work Log:
- Ajout de 3 sections à src/components/site/views/HomeView.tsx (entre « Incontournables » et le CTA final) :
  1. « La maison » — image a-propos.jpg avec cadre doré décalé + aboutIntro (texte administrable via dashboard) + CTA vers #/a-propos.
  2. « Comment commander ? » — 3 étapes factuelles (Parcourez / Composez / Nous confirmons) avec cercles ivoire, icônes Lucide (Search, ShoppingBag, PhoneCall), pastilles numérotées dorées et lien téléphone cliquable (fond crème).
  3. « Questions fréquentes » — accordéon shadcn (4 questions factuelles sur le processus de commande, téléphone issu des réglages).
- Nouveaux composants internes OrderStep et FaqItem ; imports Accordion (ui/accordion) + icône Search ; animations whileInView cohérentes avec l'existant.
- BUG corrigé : cache CSS Turbopack n'avait pas généré les utilitaires négatifs -top-1.5/-right-1.5 (badge numéroté superposé à l'icône) → redémarrage propre du serveur + suppression .next.
- Vérifications agent-browser (desktop 1280px + mobile 390px) : toutes les sections rendues, accordéon fonctionnel (ouverture/fermeture), lien 01 66 49 12 98 cliquable, badge corrigé, aucun débordement horizontal, 0 erreur console, 0 erreur dev.log, bun run lint : 0 erreur.

Stage Summary:
- Page d'accueil enrichie : héros → confiance → catégories → incontournables → La maison → Comment commander → FAQ → CTA final → footer.
- Aucune donnée inventée : seuls les textes administrables existants et des descriptions factuelles du processus du site.

---
Task ID: 10
Agent: Z.ai Code (orchestrateur)
Task: Animation du visuel de la section héros (accueil)

Work Log:
- Objectif : animer l'image de parfum du héros de façon discrète et premium, compatible avec le remplacement futur par les vraies photos.
- Tentative framer-motion (keyframes y + repeat Infinity) : les animations sautaient instantanément à leur état final dans l'environnement headless (runtime framer v12), tandis que WAAPI progresse normalement.
- Solution retenue : animations CSS pures (compositor GPU, zéro JS par image, fiable partout) :
  1. .bo-float (globals.css) — flottement doux translateY 0 → -10px, cycle 6 s ease-in-out infini, appliqué à l'ensemble cadre doré + visuel.
  2. .bo-shine (globals.css) — reflet blanc incliné (skew -14°) qui balaie l'image de gauche à droite avec fondu entrée/sortie : balayage ~3,8 s puis pause, cycle total 9 s (keyframes 0→42 %→100 %), délai initial 1,6 s.
  3. @media (prefers-reduced-motion: reduce) → animations désactivées (accessibilité).
- HomeView.tsx : wrappers framer-motion remplacés par des divs avec classes CSS ; le parallaxe au scroll (MotionValue) et l'apparition initiale (opacity/scale) conservés.
- Vérifications agent-browser : transform du flottement échantillonné (matrix -7.4 → -9.9 → -9.1 → -5.2 → -1.1 px : oscillation réelle) ; reflet mesuré (x 129 → 525 → 809 → 832 px avec opacité 0.83 → 0.40 → 0.03 → 0 puis pause) ; desktop + mobile 390 px sans débordement ; 0 erreur console ; lint 0 erreur.

Stage Summary:
- Héros animé : flottement continu discret + reflet lumineux périodique, en CSS pur (performant, robuste, accessible).
- Prêt pour les vraies images : l'animation porte sur les conteneurs — remplacer public/images/hero.png suffira, aucun code à toucher.

---
Task ID: 11
Agent: Z.ai Code (orchestrateur)
Task: Intégration du premier vrai produit — Marque Collection 157

Work Log:
- Image cliente reçue (upload/pasted_image_1789202505354.png, 400x300 PNG) : extension du canevas en 4:5 (400x500) fond blanc via sharp, sans agrandissement ni déformation → public/uploads/marque-collection-157.png.
- Passage de la devise en francs : formatPrice (src/lib/format.ts) affiche désormais « 3 500 F » (suffixe F, séparateurs fr-FR) ; formulaire admin (ProductFormPage) « € » → « F » + aria-label corrigé.
- Produit créé en base via scripts/ajout-produit.ts (réutilisable pour les prochaines images) : nom « Marque Collection 157 », slug marque-collection-157, catégorie MIXTE, prix 3500, description factuelle (Eau de Parfum 25 ml, n° 157), isSample=false (aucun badge Exemple), disponible, image principale /uploads/marque-collection-157.png.
- Vérifications agent-browser : boutique filtre Mixte → 2 parfums dont le vrai produit avec vraie photo et prix « 3 500 F » ; fiche produit complète (titre, MIXTE, Disponible, 3 500 F, packshot 4:5, description) ; badge « Exemple » uniquement sur les produits d'exemple restants ; ajout au panier OK (toast + compteur 1) ; 0 erreur dev.log.

Stage Summary:
- Premier vrai parfum en ligne : Marque Collection 157 (mixte, 25 ml, 3 500 F) visible sur boutique/fiche/panier.
- Scripts/ajout-produit.ts prêt pour les intégrations suivantes (une image = une modification de constantes + une commande).
- Devise « F » appliquée partout (site + dashboard). Les 7 parfums d'exemple restent en place jusqu'à décision de la cliente.

---
Task ID: 12
Agent: Z.ai Code (orchestrateur)
Task: Intégration produit réel n°2 — Rexona Advanced Protection Invisible

Work Log:
- Image cliente (upload/images.jpg, 478x418 JPEG) : canevas étendu en 4:5 (478x598) fond blanc via sharp, export JPEG qualité 88 → public/uploads/rexona-advanced-protection-invisible.jpg.
- scripts/ajout-produit.ts mis à jour (constantes) + sortie .jpeg : produit « Rexona Advanced Protection Invisible » — MIXTE, 4 000 F, description factuelle (anti-transpirant 72 h sans traces), isSample=false, disponible, sans inventer de contenance (non lisible sur la photo).
- Vérifications agent-browser : boutique Mixte → 3 parfums, Rexona visible avec prix « 4 000 F » ; fiche produit complète (titre, Disponible, 4 000 F, description, vraie photo, pas de badge Exemple) ; 0 erreur.

Stage Summary:
- 2 produits réels en ligne : Marque Collection 157 (3 500 F) et Rexona Advanced Protection Invisible (4 000 F), tous deux MIXTE.
- Le flux « image envoyée → modification des constantes du script → bun scripts/ajout-produit.ts → vérification » est rodé pour les prochaines intégrations.

---
Task ID: 13
Agent: Z.ai Code (orchestrateur)
Task: Intégration produit réel n°3 — Marshmallow Blush (sans prix)

Work Log:
- Image cliente (upload/pasted_image_1789203220809.png, 1024x1024 carrée, visuel rose pleine surface) : bandes blanches inadaptées → technique « fond flouté prolongé » (fond = image en cover floutée luminosité +4 %, photo nette centrée en contain) → canevas 4:5 1000x1250 → public/uploads/marshmallow-blush.jpg.
- scripts/ajout-produit.ts : traitement d'image généralisé (fond flouté, s'adapte à tout visuel : packshots fond blanc comme photos pleine surface).
- Produit « Marshmallow Blush » (Paris Corner) — FEMME, price=null → affiche « Prix sur demande » (conforme demande cliente), description factuelle, isSample=false, disponible.
- Vérifications agent-browser : boutique Femme → 4 parfums, Marshmallow Blush en premier avec vraie photo sans badge ; fiche produit (FEMME, Disponible, « Prix sur demande », description, photo sans raccord visible, boutons panier/commande) ; 0 erreur.

Stage Summary:
- 3 produits réels en ligne : Marque Collection 157 (Mixte, 3 500 F), Rexona Advanced Protection Invisible (Mixte, 4 000 F), Marshmallow Blush (Femme, prix sur demande).
- Le traitement d'image du script gère désormais tous les formats de photos (carré, paysage, portrait, fonds colorés).

---
Task ID: 14
Agent: Z.ai Code (orchestrateur)
Task: Intégration produit réel n°4 — Marque Collection 122

Work Log:
- Image cliente TOUT PETITE (upload/images (2).jpg, 225x225) : premier essai avec fond flouté → bouteille minuscule sur flou géant (inacceptable).
- scripts/ajout-produit.ts : détection automatique du type de photo via la couleur moyenne des 4 coins — fond clair (>225) → packshot agrandi ×3 max + netteté, centré sur canevas blanc 1000x1250 ; sinon → technique fond flouté. Marque Collection 122 traitée en packshot blanc → rendu net et bien proportionné.
- Produit « Marque Collection 122 » — MIXTE (par défaut, comme le 157 de la même collection), price=null → « Prix sur demande », description factuelle « Parfum Marque Collection n° 122. », isSample=false.
- Incidents de cache résolus : (1) essai ?v=2 en base → Next.js 16 refuse les query strings d'images locales (images.localPatterns) → URL restaurée proprement ; (2) ancienne image persistante car l'optimiseur d'images Next garde son cache EN MÉMOIRE dans le process dev → redémarrage serveur + rm -rf .next → nouvelle image affichée.
- Vérifications : fiche produit complète (MIXTE, Disponible, Prix sur demande, vraie photo nette), lint 0 erreur, serveur sain.

Stage Summary:
- 4 produits réels en ligne : Marque Collection 122 (Mixte, sur demande), Marshmallow Blush (Femme, sur demande), Marque Collection 157 (Mixte, 3 500 F), Rexona Invisible (Mixte, 4 000 F).
- Le script gère automatiquement les 2 familles de photos (packshot fond blanc / visuel pleine surface). Leçon : après re-traitement d'une image déjà servie, redémarrer le serveur dev (cache image en mémoire).
