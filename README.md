# E.T.P.S BELLE ODEUR — Site e-commerce de parfumerie

Site vitrine + boutique en ligne pour la maison **E.T.P.S BELLE ODEUR** (vente de parfums).

- Boutique en ligne : catégories **Homme / Femme / Mixte**, recherche, tri, panier, commande en ligne avec référence.
- Deux thèmes : **clair** et **sombre** (« Nuit Émeraude ») — bascule via l'icône lune/soleil dans la barre de navigation.
- Tableau de bord **administrateur** complet : produits, commandes, messages, clientes, médiathèque, réglages, mot de passe.
- Téléphone de la maison : **01 66 49 12 98** (modifiable dans les réglages).

---

## 1. Démarrage rapide (pnpm)

```bash
pnpm install                 # installe les dépendances

cp .env.example .env         # puis éditez .env (voir section 2)

pnpm setup                   # crée les tables + le compte admin + les produits
pnpm dev                     # démarre le site sur http://localhost:3000
```

Ouvrez **http://localhost:3000** — le tableau de bord est à **http://localhost:3000/#/admin**.

> Sous Windows, si `pnpm dev` affiche une erreur sur `tee`, utilisez : `npx next dev -p 3000`.

## 2. Fichier `.env`

Copiez `.env.example` vers `.env` et renseignez :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion base de données (SQLite local ou Neon) |
| `ADMIN_USERNAME` | Identifiant admin (défaut : `admin`) |
| `ADMIN_PASSWORD` | Mot de passe admin — **8 caractères minimum** (créé par le seed) |
| `SESSION_SECRET` | Secret de signature des sessions — **32+ caractères aléatoires** |
| `ADMIN_SESSION_HOURS` | Durée de session admin en heures (défaut 8) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (SEO/OpenGraph) |

Générez des secrets solides :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Base de données — SQLite local ou Neon (PostgreSQL)

Le projet fonctionne avec **deux moteurs**, au choix :

### a) SQLite (par défaut, idéal pour tester en local)

Rien à faire : `DATABASE_URL=file:./db/custom.db` + `pnpm setup`.

### b) Neon (PostgreSQL hébergé — recommandé pour la mise en ligne)

1. Créez une base sur [neon.tech](https://neon.tech) et copiez la chaîne de connexion
   (elle ressemble à `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require`).
2. Basculez le schéma et créez les tables :

```bash
# dans .env : DATABASE_URL=postgresql://... (votre chaîne Neon)
pnpm db:postgres
```

Cette commande : bascule le schéma Prisma en `postgresql` → crée les tables → crée l'admin,
les réglages et les **9 produits réels** (photos incluses dans `public/uploads/`).

3. Pour revenir à SQLite plus tard : `pnpm db:sqlite`.

> Sur Neon, **les images restent des fichiers** : `public/uploads/` doit être déployé avec le site
> (ou brancher un stockage externe plus tard).

## 4. Scripts disponibles

| Commande | Action |
|---|---|
| `pnpm dev` | Serveur de développement (port 3000) |
| `pnpm build` / `pnpm start` | Build de production / lancement |
| `pnpm lint` | Vérification ESLint |
| `pnpm setup` | Crée les tables + admin + réglages + produits |
| `pnpm db:seed` | Seed seul (idempotent, n'écrase rien) |
| `pnpm db:postgres` | Bascule sur PostgreSQL + tables + seed |
| `pnpm db:sqlite` | Bascule sur SQLite + tables + seed |
| `pnpm db:push` | (Re)crée les tables selon `prisma/schema.prisma` |

## 5. Tableau de bord administrateur

- **Accès** : `http://localhost:3000/#/admin` (ou `votre-domaine/#/admin`)
- **Identifiants** : ceux de `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) — par défaut
  `admin` / `WJl2x12yn6QXkK1Z` sur cette installation.
- **⚠️ Changez le mot de passe** après livraison : onglet **Réglages → Sécurité**.

Fonctionnalités :

- **Tableau de bord** : chiffre d'affaires, commandes par statut, clientes, mini-graphique 14 jours.
- **Produits** : création/modification (nom, catégorie Homme/Femme/Mixte, prix en francs F —
  laisser vide pour « Prix sur demande », description, disponibilité, mise en vedette, photos multiples).
- **Commandes** : suivi par statut (Nouvelle → En préparation → Confirmée → Livrée / Annulée),
  détail client, référence `BO-AAAA-NNNN`.
- **Messages** : messages du formulaire de contact (lu/non lu).
- **Clientes** : annuaire déduit des commandes.
- **Médiathèque** : toutes les images téléversées (JPG/PNG/WebP ≤ 5 Mo).
- **Réglages** : textes du site (héros, à propos…), coordonnées (téléphone, adresse, réseaux),
  changement de mot de passe.

## 6. Ajouter un produit (2 méthodes)

**Depuis le tableau de bord (recommandé)** : Produits → « Nouveau produit » → remplir +
téléverser la photo → Enregistrer. Le produit apparaît immédiatement sur le site.

**Par script (intégration en lot)** : déposez la photo dans `upload/`, ajoutez une entrée au
tableau `PRODUITS` dans `scripts/ajout-produit.ts`, puis :

```bash
DATABASE_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-) bun scripts/ajout-produit.ts
# ou : bunx tsx scripts/ajout-produit.ts
```

Le script recadre automatiquement l'image en 4:5 (1000×1250) et crée/met à jour le produit.

## 7. Structure du projet

```
prisma/                  Schéma SQLite + PostgreSQL, seed (admin, réglages, produits)
db/                      Base SQLite locale
public/uploads/          Photos des produits réels
public/images/           Visuels de marque (héros, catégories, logo…)
scripts/
  ajout-produit.ts       Intégration d'un produit + traitement d'image (sharp)
  use-db.mjs             Bascule SQLite ↔ PostgreSQL
src/app/api/             API REST (produits, commandes, contact, auth, admin)
src/components/site/     Site public (navbar, vues, thème clair/sombre)
src/components/admin/    Tableau de bord
src/components/shared/   Cartes produit, prix, badges, etc.
src/lib/                 Auth (JWT/bcrypt), validations zod, formatage, client API
```

## 8. Sécurité — checklist de mise en ligne

1. **Changez `ADMIN_PASSWORD`** (et le mot de passe dans Réglages → Sécurité).
2. **Régénérez `SESSION_SECRET`** (32+ caractères aléatoires).
3. Définissez `NEXT_PUBLIC_SITE_URL` avec le vrai domaine.
4. Servez le site en **HTTPS** (les sessions utilisent un cookie `httpOnly` `SameSite=strict` ;
   ajoutez `secure` en HTTPS si souhaité).
5. Sauvegardez la base (Neon propose des backups automatiques).

## 9. Notes techniques

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma**.
- Prix en **francs (F)** ; un produit sans prix affiche « Prix sur demande ».
- Routes publiques en **hash** (`#/boutique`, `#/parfum/<slug>`, `#/admin`…) : un seul
  déploiement statique possible, aucune réécriture serveur nécessaire.
- Thème clair/sombre via `next-themes` (préférence mémorisée par navigateur).
- Sessions admin : JWT signé (httpOnly), protection CSRF d'origine, limitation de tentatives
  de connexion (5 / 15 min).
