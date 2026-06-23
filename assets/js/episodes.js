/* =================================================================
   episodes.js — la « base de contenu »
   -----------------------------------------------------------------
   En production : type de contenu « Épisode » (WordPress) ou flux
   podcast. Ici, chaque entrée suffit ; le design s'applique seul.

   Champs :
     number, title, category, duration, description
     pos     → cadrage de la pochette dans le tableau (0–100 %)
     audio   → URL .mp3 (optionnel ; sinon animation simulée)
   ================================================================= */

window.PODCAST_EPISODES = [
  {
    number: 1, category: "Cour & étiquette", duration: "14:20", pos: 50,
    title: "Les murmures du salon vert",
    description: "Pénétrez dans les arcanes du protocole. Derrière le placement très précis de chaque dame d'honneur se cache une hiérarchie intime — et quelques rivalités de salon.",
    audio: ""
  },
  {
    number: 2, category: "Mode & société", duration: "11:05", pos: 16,
    title: "L'ingénierie de la crinoline",
    description: "Une révolution textile à l'ossature d'acier. Comment cette mode monumentale a redéfini le pouvoir, l'espace occupé par les femmes et l'économie du luxe.",
    audio: ""
  },
  {
    number: 3, category: "Symbolisme", duration: "09:45", pos: 84,
    title: "La clé secrète des fleurs",
    description: "Chèvrefeuille, lilas sauvage, violettes : décryptage des messages cryptés glissés au premier plan par Winterhalter, et de leur écho politique.",
    audio: ""
  },
  {
    number: 4, category: "Art", duration: "16:13", pos: 34,
    title: "Winterhalter, peintre des cours",
    description: "Le portraitiste le plus convoité d'Europe. Lumière sur sa technique, ses commandes royales et la fabrique d'une image impériale.",
    audio: ""
  },
  {
    number: 5, category: "Histoire", duration: "18:30", pos: 66,
    title: "Eugénie, une impératrice politique",
    description: "Au-delà de l'icône de mode : régences, diplomatie et influence. Le portrait d'une femme de pouvoir dans un monde d'hommes.",
    audio: ""
  },
  {
    number: 6, category: "Vie de cour", duration: "13:50", pos: 26,
    title: "Compiègne, le théâtre de l'automne",
    description: "Les « Séries » de Compiègne : chasses, théâtre et conversations. Quand la cour quittait Paris pour inventer l'art du divertissement officiel.",
    audio: ""
  }
];
