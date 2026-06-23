# Design System — « Le Second Empire » (podcast, mes petites visites)

> Établi selon la méthode UI/UX Pro Max (analyse produit → système → règles).
> Source de vérité pour toutes les pages. Les pages spécifiques peuvent surcharger
> dans `design-system/pages/`.

## 1. Analyse produit
- **Type** : podcast culturel / patrimoine (éditorial + entertainment).
- **Public** : amateurs d'histoire et d'art, francophone, lecture posée.
- **Ton** : maison de luxe / institution muséale. Raffiné, gilded, chaleureux.
- **Plateforme** : web responsive (mobile-first), intégrable WordPress/Elementor.

## 2. Direction artistique
**Parti pris : la cinémathèque sombre & premium** (façon plateforme d'écoute haut
de gamme). Fond profond, le tableau de Winterhalter en pièce maîtresse (hero plein
cadre, pochettes recadrées). **Palette authentique de la marque** relevée sur
mes-petites-visites.fr : le **bleu nuit #1A203C** sert de fond profond, la **crème
#FAF3DD** porte le texte, la **terracotta #B54144** marque l'état « en lecture »,
**sauge #8E9679** et **olive #4E5340** servent d'accents.

- **Ouverture** : un **loader au logo** (logo + filet d'or + « Le Second Empire »)
  qui se fond/zoome dans la page. Une fois par session, passable au clic, coupé si
  `prefers-reduced-motion`.
- **Pop-up d'épisode** : cliquer sur un épisode ouvre une **pochette animée au rythme
  de la parole** — ondes concentriques + le tableau **découpé en barres verticales**
  qui dansent avec la voix (RingWave), inspiré de Napoleonica. Lecteur réduit (barre)
  quand le pop-up est fermé.
- **Sections bespoke** (anti-IA) : « Le tableau décrypté » avec pastilles cliquables
  sur l'œuvre, « À la une », « À propos ».
- **Style** : premium sombre, plat + détails fins (filets d'or, chips, ombres douces
  cohérentes). Pas de glassmorphism gratuit, pas de néon.

## 3. Couleurs — charte authentique mes-petites-visites.fr
Relevée sur le site live (Elementor `elementor-kit-7`). Source de vérité.

| Rôle (charte) | Hex | Usage dans la plateforme |
|---|---|---|
| Bleu nuit (primaire) | `#1A203C` | fond de marque ; texte foncé sur clair |
| Terracotta (secondaire) | `#B54144` | état « en lecture », accents pleins |
| Olive (accent) | `#4E5340` | accents verts profonds |
| Sauge | `#8E9679` | chips, filets verts |
| Crème | `#FAF3DD` | texte sur sombre, surfaces claires |
| Blanc | `#FFFFFF` | surfaces, contrastes |
| Gris | `#7A7A7A` | texte secondaire (site clair) |

**Déclinaison sombre (cinémathèque)** — variables CSS effectives :
`--bg #11152A` · `--bg-2 #1A203C` · `--surface #222A49` (cartes) ·
`--gold #DB9079` (terracotta éclaircie, labels sur sombre) ·
`--gold-2 #EDC6B4` (clay pâle) · `--emerald #8E9679` (sauge) ·
`--emerald-d #4E5340` (olive) · `--cream #FAF3DD` · `--text #FAF3DD`.
*Les noms `--gold/--emerald` sont conservés pour compatibilité ; leurs valeurs
sont désormais des couleurs de marque.*

Contraste : crème `#FAF3DD` sur bleu nuit `#1A203C` ≈ 13:1 ; clay `#DB9079`
sur bleu nuit ≈ 4.7:1 (labels) ; cream sur terracotta `#B54144` ≈ 4.6:1.

## 4. Typographie
- **Display / art** : *Playfair Display* (titres, pochettes — touche éditoriale).
- **UI / texte** : *Inter* (navigation, contrôles, descriptions — lisibilité).
- **Citation** : *Cormorant Garamond* italique (manifeste).
- **Texte / labels** : *Jost* (géométrique fin, proche de Champagne Limousines).
- **Échelle** : 12 · 14 · 16 · 20 · 28 · 40 · 64 (clamp pour le fluide).
- Corps ≥ 16px, interligne 1.6–1.75, mesure 60–75 caractères.
- En production : remplacer par les polices auto-hébergées du site (Quiche Display +
  Champagne Limousines).

## 5. Espacement & layout
- Rythme **8px** (4/8/16/24/32/48/64/96).
- Conteneur max `1240px`. Gouttières adaptatives `clamp(20px,5vw,84px)`.
- Breakpoints : 375 / 768 / 1024 / 1440. Mobile-first, pas de scroll horizontal.
- `min-height: 100dvh` (pas 100vh) sur le hero.

## 6. Mouvement (150–300ms)
- Micro-interactions 180–240ms, `ease-out` à l'entrée.
- Révélations au défilement discrètes, **interrompables**, **opacity/transform only**.
- Médaillon audio-réactif : ondes nées sur les pics de voix + égaliseur en couronne.
- `prefers-reduced-motion` : animations coupées, contenu immédiatement lisible.

## 7. Composants
- **Cadre doré** : double moulure (or clair → or sombre) + biseau + ombre.
- **Cartel** : étiquette ivoire, filet or, titre sérif + artiste/date en sans.
- **Index d'épisodes** : sommaire de revue (numéros dorés, filets), pas de grille de cartes.
- **Lecteur** : barre fixe émeraude, forme d'onde dorée, médaillon, états clairs.

## 8. Accessibilité (CRITIQUE)
- Contraste 4.5:1 (texte), 3:1 (gros éléments). Pas d'info par la couleur seule.
- `:focus-visible` visible (anneau or 2px). Boutons icône avec `aria-label`.
- Cibles tactiles ≥ 44px. Hiérarchie de titres h1→h3 sans saut.
- Image décrite (alt/aria), `prefers-reduced-motion` respecté.

## 9. Anti-patterns à éviter
- Étirer l'œuvre en plein cadre (flou). → l'encadrer.
- Émojis en guise d'icônes. → SVG.
- Mentions « démo/maquette », formulaires d'admin sur la page publique.
- Taches floutées décoratives, grain aléatoire, ombres incohérentes.
- Polices génériques sans intention.
