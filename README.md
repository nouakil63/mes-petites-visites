# Le Second Empire — page Podcast (maquette)

Maquette d'une page **Podcast** pour *mes petites visites*, conçue comme une **revue d'art**
autour du tableau de Franz Xaver Winterhalter, *L'Impératrice Eugénie entourée de ses dames
d'honneur* (1855). Palette échantillonnée sur la toile, filets d'or, grands blancs, sérif à fort
contraste — et un médaillon **animé au rythme de la parole**.

> **Aperçu :** ouvrir `index.html` dans un navigateur. Aucun serveur, aucune installation.

---

## ⚠️ Une seule chose à fournir : la toile

La maquette est bâtie **autour** du tableau. Déposez l'image ici :

```
assets/img/eugenie.jpg
```

C'est une œuvre du **domaine public** (Winterhalter, 1855) — version haute définition sur
Wikimedia Commons. Je n'ai pas pu la télécharger automatiquement : l'environnement d'exécution
bloque l'accès réseau à Wikimedia (liste d'autorisation d'egress). Deux options :

1. **Vous déposez le fichier** `eugenie.jpg` dans `assets/img/` (puis commit) — le plus simple.
2. **Vous autorisez `upload.wikimedia.org`** dans les réglages réseau de l'environnement et je le
   récupère moi-même.

Sans l'image, la page reste cohérente (le hero retombe sur le vert sombre du tableau), mais c'est
évidemment avec la toile qu'elle prend tout son sens.

---

## Ce que la maquette montre

- **Le tableau comme pièce maîtresse** : pleine page dans le hero, et **serti dans un médaillon
  d'or** au centre des animations.
- **La palette du tableau** : émeraude de la robe centrale, ivoire des robes claires, roses,
  rubans bleus, ors — appliquée avec retenue.
- **La charte du site conservée** : logo, bleu marine `#1A203C`, touches terracotta `#B54144`,
  polices proches de Quiche Display (titres) + Champagne Limousines (texte).
- **L'animation au rythme de la parole** (comme l'exemple Napoleonica) : ondes concentriques qui
  naissent sur les pics de voix + égaliseur en couronne + cadre qui pulse. Analyse réelle via la
  **Web Audio API** quand un fichier joue ; sinon une cadence de parole simulée prend le relais.
- **Publier = design appliqué automatiquement** : voir ci-dessous.

---

## Publier un épisode (workflow)

La page publique (`index.html`) ne contient **aucun élément de back-office** — c'est une page
finie. La publication se fait depuis une page séparée :

```
admin.html  →  « Espace de publication »
```

On y remplit titre / numéro / durée / description (+ lien audio optionnel) et on clique sur
**Publier**. L'épisode est enregistré et apparaît sur `index.html`, **déjà mis en page et animé**,
sans le moindre réglage. *(Dans la maquette, le stockage se fait dans le navigateur via
`localStorage` pour démontrer le principe.)*

### En production (WordPress / Elementor)
La page est en HTML/CSS/JS natif ; elle s'intègre au site existant :
- **plugin podcast** (Seriously Simple Podcasting, PodLove) : la cliente téléverse l'audio + le
  titre, le plugin gère le flux RSS (Apple/Spotify), notre **template** habille chaque épisode ;
- ou **type de contenu « Épisode »** alimentant l'index via l'API REST ;
- ou **widget HTML Elementor** branché sur le lecteur audio de la page.

Dans tous les cas : **publier = remplir un formulaire**, le design suit tout seul.

---

## Structure

```
index.html               Page publique (la revue)
admin.html               Espace de publication (back-office)
assets/css/styles.css    Design — palette du tableau en variables CSS
assets/js/episodes.js    Épisodes par défaut
assets/js/visualizer.js  Médaillon animé + forme d'onde (Canvas + Web Audio API)
assets/js/app.js         Index, lecteur, épisode « à l'écoute », publication
assets/img/eugenie.jpg   ← la toile à déposer
```

Détails : sans dépendance ni build, responsive, `prefers-reduced-motion` respecté, pochettes
animées seulement quand utile (performance).

> Maquette destinée à valider la direction artistique avant l'intégration WordPress définitive.
