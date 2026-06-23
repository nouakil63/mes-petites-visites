# Podcast « Le Second Empire » — maquette fonctionnelle

Maquette interactive d'une page **Podcast** pour *mes petites visites*, dans l'univers du
tableau de Winterhalter (*L'Impératrice Eugénie entourée de ses dames d'honneur*) tout en
restant fidèle à la charte du site.

> **Pour la voir :** ouvrir `index.html` dans un navigateur. Aucun serveur, aucune installation.

---

## Ce que la maquette démontre

1. **L'univers du tableau, réellement repris.**
   Palette directement tirée de la peinture : vert émeraude/sapin de la robe centrale, roses
   poudrés, ivoire, ruban bleu, ors. Le hero est une « toile » composée de dégradés et de taches
   de couleur floutées qui évoquent les robes et le feuillage du jardin.

2. **La charte du site, conservée.**
   Bleu marine `#1A203C`, crème `#FAF3DD`, terracotta `#B54144`, olive `#4E5340`, sauge `#8E9679`,
   logo recréé en SVG, et des polices proches de **Quiche Display** (titres) + **Champagne
   Limousines** (texte).

3. **L'animation au rythme de la parole** (comme l'exemple Napoleonica).
   Chaque pochette est animée : **ondes concentriques** qui naissent sur les pics de voix +
   **égaliseur en couronne** + médaillon qui pulse. Une **forme d'onde linéaire** accompagne le
   lecteur en bas de page.
   - Avec un vrai fichier audio → analyse réelle via la **Web Audio API** (`AnalyserNode`).
   - Sans fichier → une **cadence de parole de synthèse** anime quand même la maquette.

4. **Publier = design appliqué automatiquement.**
   La section **« Publier »** est une démo vivante : on remplit 3 champs, on (dé)pose un audio, on
   clique — un nouvel épisode **entièrement stylé et animé** apparaît en tête de liste, sans le
   moindre réglage.

---

## Structure

```
index.html              La page
assets/css/styles.css   Le design (deux univers fusionnés en variables CSS)
assets/js/episodes.js   La « base de contenu » (les épisodes)
assets/js/visualizer.js L'animation audio-réactive (Canvas + Web Audio API)
assets/js/app.js        Rendu des cartes, lecteur, démo de publication
assets/img/             (optionnel) déposer ici le tableau : eugenie.jpg
```

### Utiliser la vraie peinture en fond du hero
Déposer l'image dans `assets/img/eugenie.jpg`, puis ajouter la classe `hero--photo` à la balise
`<section class="hero" …>` dans `index.html`. Un dégradé sombre assure la lisibilité du texte.
Par défaut la maquette utilise un fond « peint » en CSS, donc elle est complète sans image.

---

## Comment la cliente publierait (le workflow)

Aujourd'hui, dans la maquette, un épisode = un objet dans `episodes.js` :

```js
{ number: 7, title: "…", duration: "28 min", date: "2026-07-01",
  description: "…", audio: "https://…/episode-07.mp3" }
```

Elle n'a **jamais** à toucher au design : il est généré à partir de ces quelques champs.

### En production (WordPress / Elementor — pistes d'intégration)
La page actuelle fonctionne en HTML/CSS/JS pur ; elle s'intègre au site existant de l'une de ces
façons (de la plus simple à la plus structurée) :

- **Plugin podcast dédié** (ex. *Seriously Simple Podcasting* / *PodLove*) : la cliente téléverse
  l'audio + le titre, le plugin gère le flux RSS (Apple/Spotify), et notre **template** habille
  automatiquement chaque épisode avec la pochette animée.
- **Custom Post Type « Épisode »** + champs (titre, n°, durée, fichier audio) : la liste
  `episodes.js` est alors alimentée par l'API REST de WordPress ; le rendu reste identique.
- **Widget HTML Elementor** : la pochette animée (`visualizer.js`) se branche sur le lecteur audio
  d'Elementor — l'animation lit le `<audio>` de la page.

Dans tous les cas : **publier un épisode = remplir un formulaire**, le design suit tout seul.

---

## Détails techniques

- **Sans dépendance, sans build.** JavaScript natif, rendu `<canvas>` pour rester fluide.
- **Performance :** seules les pochettes visibles à l'écran sont animées (`IntersectionObserver`).
- **Accessibilité :** `prefers-reduced-motion` coupe les animations non essentielles ; navigation
  au clavier et libellés ARIA sur les contrôles.
- **Responsive** : mobile → bureau.

> Maquette destinée à valider la direction artistique et l'expérience. L'intégration WordPress
> définitive se fera une fois la maquette validée.
