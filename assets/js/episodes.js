/* =================================================================
   episodes.js — « base de contenu » de la maquette
   -----------------------------------------------------------------
   C'est ici que vivent les épisodes. En production WordPress, cette
   liste devient un type de contenu « Épisode » (ou un flux podcast) :
   la cliente remplit un formulaire, et chaque épisode arrive ici
   automatiquement. Le design, lui, est TOUJOURS le même — il s'applique
   tout seul à partir de ces quelques champs.

   Champs d'un épisode :
     number      → numéro d'épisode
     title       → titre
     duration    → durée affichée
     date        → date de publication (AAAA-MM-JJ)
     description → résumé court
     audio       → URL du fichier .mp3 (optionnel en démo)
     seed        → graine de couleur/animation (générée si absente)
   ================================================================= */

window.PODCAST_EPISODES = [
  {
    number: 1,
    title: "La cour de l'Impératrice Eugénie",
    duration: "32 min",
    date: "2026-06-15",
    description: "Dans le salon vert des Tuileries, on observe l'étiquette, les dames d'honneur et la grâce d'une souveraine qui inspira Winterhalter.",
    audio: ""
  },
  {
    number: 2,
    title: "Paris transfiguré : Haussmann",
    duration: "29 min",
    date: "2026-06-01",
    description: "Percées, boulevards, parcs et égouts : comment le préfet a redessiné la capitale en moins de vingt ans.",
    audio: ""
  },
  {
    number: 3,
    title: "Les bals des Tuileries",
    duration: "27 min",
    date: "2026-05-15",
    description: "Lustres, crinolines et carnets de bal : une nuit de fête au palais, racontée pas à pas.",
    audio: ""
  },
  {
    number: 4,
    title: "Winterhalter, peintre des élégances",
    duration: "34 min",
    date: "2026-05-01",
    description: "Le portraitiste des cours d'Europe et son tableau le plus célèbre : Eugénie entourée de ses dames d'honneur.",
    audio: ""
  },
  {
    number: 5,
    title: "Compiègne : les Séries de l'automne",
    duration: "31 min",
    date: "2026-04-15",
    description: "Chasses, théâtre et conversations : la vie de château quand la cour quittait Paris pour la forêt.",
    audio: ""
  },
  {
    number: 6,
    title: "Worth et la naissance de la haute couture",
    duration: "26 min",
    date: "2026-04-01",
    description: "Comment un Anglais habilla l'Impératrice et inventa, rue de la Paix, le métier de couturier.",
    audio: ""
  }
];
