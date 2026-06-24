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
**Parti pris : l'édition claire premium, rythmée clair/sombre.** Fond **crème/beige**
chaud (#FAF3DD → sable, léger dégradé), texte **bleu nuit #1A203C**, **terracotta
#B54144** en accent et état « en lecture », **sauge #8E9679** / **olive #4E5340** en
touches. Registre éditorial : filets sur les intitulés, titres Playfair affirmés,
flourish. **Rythme clair/sombre** : blocs bleu nuit pour le hero, *Le tableau
décrypté*, *Abonnement* et le *footer* ; sections, cartes, *Qui vous parle ?* et
*À la une* en clair. Palette relevée sur mes-petites-visites.fr (Elementor
`elementor-kit-7`).

- **Ouverture** : un **loader au logo** (logo + filet d'or + « Le Second Empire »)
  qui se fond/zoome dans la page. Une fois par session, passable au clic, coupé si
  `prefers-reduced-motion`.
- **Pop-up d'épisode** : cliquer sur un épisode ouvre une **pochette animée au rythme
  de la parole** — ondes concentriques + le tableau **découpé en barres verticales**
  qui dansent avec la voix (RingWave), inspiré de Napoleonica. Lecteur réduit (barre)
  quand le pop-up est fermé.
- **Sections bespoke** (anti-IA) : « Le tableau décrypté » avec pastilles cliquables
  sur l'œuvre, « À la une », « Qui vous parle ? » (portrait-cartel de la guide
  Sophie Lefaure van Moorsel), « À propos ».
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

**Édition claire (effective)** — variables CSS :
`--bg #F5ECD3` (page beige) · `--bg-2 #ECE0C0` (sable, sections alternées) ·
`--surface #FFFCF5` (cartes blanches) · `--text #1A203C` (bleu nuit) ·
`--text-2 #595E70` · `--gold #A8403F` (terracotta profond, labels/filets) ·
`--gold-2 #8F3537` (emphase) · `--emerald #8E9679` (sauge) ·
`--emerald-d #4E5340` (olive) · `--cream #FAF3DD` (ivoire — texte sur contextes
sombres : hero, navbar transparente, pastilles sur image).
*Les noms `--gold/--emerald` sont conservés pour compatibilité.*

Contraste : bleu nuit `#1A203C` sur beige `#F5ECD3` ≈ 12:1 ; terracotta `#A8403F`
sur beige ≈ 5:1 (labels) ; ivoire `#FAF3DD` sur terracotta `#B54144` ≈ 4.4:1 (CTA).

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
