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
**Parti pris : la salle de musée.** Le tableau de Winterhalter est *accroché* dans un
**cadre doré sur un mur de soie émeraude**, accompagné d'un **cartel** (étiquette
de musée). On ne déforme jamais l'œuvre, on l'**encadre** — ce qui flatte aussi une
image en définition modeste. Cohérent avec la marque « mes petites visites » : on
*visite* un tableau.

- **Style** : éditorial luxe, plat + détails fins (dorure, filets, cartel laiton).
  Pas de glassmorphism, pas de néon, pas de dégradés tape-à-l'œil.
- **Effets** : cadre doré biseauté, ombre portée douce, spot muséal, filets d'or 1px.

## 3. Couleurs (échantillonnées sur le tableau + charte du site)
| Token | Hex | Usage |
|---|---|---|
| `--green-900` | `#0F2019` | mur le plus sombre |
| `--green-800` | `#15271F` | fond hero / lecteur |
| `--emerald`   | `#1F5C4D` | robe centrale, accents |
| `--gold`      | `#C9A968` | texte/filets sur fond sombre |
| `--gold-deep` | `#A9803F` | dorure du cadre, labels sur clair |
| `--gold-dark` | `#7E5B27` | petit texte doré sur clair (contraste) |
| `--ivory`     | `#F1E7CF` | texte sur sombre, surfaces |
| `--paper`     | `#F7F2E6` | fond des sections claires |
| `--rose`      | `#D38C8C` | accent (robes roses) |
| `--blue`      | `#5B7FA6` | accent (rubans) |
| `--ink`       | `#23201A` | texte principal sur clair |
| `--navy`      | `#1A203C` | logo, pied de page (charte site) |
| `--terracotta`| `#B54144` | état « en lecture » (charte site) |

Contraste vérifié AA : ivoire/vert ≥ 7:1, ink/paper ≥ 12:1, gold-dark/paper ≥ 4.5:1.

## 4. Typographie
- **Display** : *Playfair Display* (Didone à fort contraste — registre Second Empire,
  gravures et planches de mode). 600/700, italique pour les titres d'épisode.
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
