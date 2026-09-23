import { normalizePlan, type DirectivePlan, type Focal } from "@/lib/plan";

type ShotSeed = {
  focal: Focal;
  movement: string;
  angle: string;
  action: (scene: string) => string;
};

type SceneProfile = {
  id: string;
  keywords: string[];
  title: (scene: string) => string;
  pitch: (scene: string) => string;
  ambiance: string;
  sound: string;
  wide: string;
  standard: string;
  tele: string;
  light: string;
  shots: ShotSeed[];
  premiere: string;
  resolve: string;
};

const PROFILES: SceneProfile[] = [
  {
    id: "pluie",
    keywords: ["pluie", "orage", "averse", "flaque", "mouille", "nuit", "nocturne", "neon", "néon"],
    title: (scene) => `Nuit humide — ${short(scene)}`,
    pitch: (scene) =>
      `La scène « ${scene} » se tient au trépied, dans une lumière RGB très délavée. Chaque plan laisse la pluie écrire le rythme.`,
    ambiance: "Cyan froid sur les flaques, magenta très pâle en contre-jour, noirs retenus.",
    sound: "Gouttes proches, souffle lointain, un néon qui grésille.",
    wide: "Ouvre le quai ou la rue et garde le sol mouillé dans le cadre.",
    standard: "Suit un personnage ou un objet sans quitter la distance de récit.",
    tele: "Isole un détail — visage, main, enseigne — et compresse la pluie.",
    light: "Un panneau en cyan rasant, un second en magenta très bas, tous deux hors champ.",
    shots: [
      {
        focal: "Laowa 10mm",
        movement: "Plan fixe",
        angle: "Ras du sol",
        action: (scene) => `Une flaque reflète « ${scene} ». La pluie tombe dans le reflet, le cadre ne bouge pas.`,
      },
      {
        focal: "16-35mm",
        movement: "Panoramique lent",
        angle: "Hauteur d'œil",
        action: (scene) => `Le panorama révèle l'espace de « ${scene} », d'un bord de cadre à l'autre, sur trépied.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Légère plongée",
        action: (scene) => `Un détail de « ${scene} » est isolé. L'arrière-plan se tasse, la pluie devient texture.`,
      },
      {
        focal: "16-35mm",
        movement: "Approche au trépied",
        angle: "Hauteur de poitrine",
        action: (scene) => `Le trépied avance de quelques centimètres vers le sujet de « ${scene} », assez pour changer la proximité.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Contre-plongée légère",
        action: (scene) => `Le sujet de « ${scene} » se découpe sur la lumière RGB. On tient le plan le temps d'une respiration.`,
      },
    ],
    premiere: "Montage en plans longs. Couper sur les gouttes, pas sur l'action.",
    resolve: "Nœud froid, cyan dans les basses lumières, magenta seulement sur les hautes lumières mouillées.",
  },
  {
    id: "interieur",
    keywords: ["interieur", "intérieur", "cuisine", "chambre", "salon", "appartement", "fenetre", "fenêtre", "table"],
    title: (scene) => `Intérieur tenu — ${short(scene)}`,
    pitch: (scene) =>
      `« ${scene} » se tourne dans une pièce réelle. Le Sony A7V reste sur trépied, la lumière RGB remplace les plafonniers.`,
    ambiance: "Lumière de fenêtre en clé, remplissage RGB très bas, murs neutres.",
    sound: "Pièce presque vide, tissu, une tasse, un bruit de ville filtré.",
    wide: "Pose la géométrie de la pièce sans déformer les visages.",
    standard: "Cadre les gestes à hauteur de table.",
    tele: "Cherche les regards et les mains, fond de pièce compressé.",
    light: "RGB en rebond sur un mur, une teinte chaude très faible et une pointe froide dans l'ombre.",
    shots: [
      {
        focal: "Laowa 10mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `La pièce entière contient « ${scene} ». On lit les volumes avant d'entrer dans le geste.`,
      },
      {
        focal: "16-35mm",
        movement: "Plan fixe",
        angle: "Hauteur de table",
        action: (scene) => `Le geste principal de « ${scene} » occupe le tiers du cadre. Le fond reste lisible.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `Un regard ou une main précise « ${scene} ». La focale longue retire la pièce.`,
      },
      {
        focal: "16-35mm",
        movement: "Panoramique lent",
        angle: "Légère plongée",
        action: (scene) => `Le panorama relie deux objets de « ${scene} » sans couper.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Profil",
        action: (scene) => `Le profil ferme « ${scene} ». On sort sur un plan assez long pour entendre la pièce.`,
      },
    ],
    premiere: "Alterner large et détail. Laisser les gestes finir avant la coupe.",
    resolve: "Peau naturelle, fenêtre légèrement froide, ombres propres. Un nœud par axe de lumière.",
  },
  {
    id: "portrait",
    keywords: ["portrait", "visage", "regard", "personne", "homme", "femme", "acteur", "actrice"],
    title: (scene) => `Portrait — ${short(scene)}`,
    pitch: (scene) =>
      `« ${scene} » est un portrait tourné au Sony A7V. Deux focales seulement portent le visage, le grand-angle ne sert qu'à situer.`,
    ambiance: "Visage en lumière douce, fond plus sombre, une touche RGB hors axe.",
    sound: "Souffle, pièce ou rue très en retrait, pas de musique imposée au tournage.",
    wide: "Un seul plan d'ouverture pour situer le corps dans le lieu.",
    standard: "Plan poitrine, assez large pour le geste.",
    tele: "Plan serré du regard, compression du fond.",
    light: "Clé douce, RGB en contour très faible pour séparer le sujet du mur.",
    shots: [
      {
        focal: "16-35mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `Le corps entier situe « ${scene} ». Le visage n'est pas encore le sujet.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `Le regard de « ${scene} » est net. Le fond se comprime derrière l'épaule.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Léger contre-plongé",
        action: (scene) => `Trois-quarts visage pour « ${scene} ». On attend un clignement avant de couper.`,
      },
      {
        focal: "16-35mm",
        movement: "Approche au trépied",
        angle: "Hauteur de poitrine",
        action: (scene) => `Le trépied se rapproche juste assez pour passer du buste au visage dans « ${scene} ».`,
      },
      {
        focal: "Laowa 10mm",
        movement: "Plan fixe",
        angle: "Ras du sol",
        action: (scene) => `Un plan au sol replace « ${scene} » dans le lieu, après les gros plans.`,
      },
    ],
    premiere: "Rester sur le regard. Couper tard, après la micro-expression.",
    resolve: "Peau fidèle, contour RGB à peine visible, fond descendu d'un demi-diaph au nœud.",
  },
  {
    id: "urbain",
    keywords: ["ville", "urbain", "rue", "quai", "metro", "métro", "immeuble", "trafic", "nuit urbaine"],
    title: (scene) => `Rue — ${short(scene)}`,
    pitch: (scene) =>
      `« ${scene} » se découpe en cinq plans d'architecture et de passage. Tout est fixé au trépied, rien ne suit en marchant.`,
    ambiance: "Béton neutre, accents RGB sur une seule façade, ciel ou nuit en fond.",
    sound: "Ville en nappe, pas isolés, un véhicule loin.",
    wide: "Donne l'échelle de la rue ou du quai.",
    standard: "Cadre un passage à hauteur d'homme.",
    tele: "Empile les plans de la rue et isole un passant.",
    light: "RGB en lèche sur un mur, le reste vient de la ville.",
    shots: [
      {
        focal: "Laowa 10mm",
        movement: "Plan fixe",
        angle: "Légère contre-plongée",
        action: (scene) => `La rue de « ${scene} » monte dans le cadre. Les verticales restent lisibles.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `Les plans de « ${scene} » se superposent. Un passant traverse sans que la caméra le suive.`,
      },
      {
        focal: "16-35mm",
        movement: "Panoramique lent",
        angle: "Hauteur d'œil",
        action: (scene) => `Le panorama balaie le lieu de « ${scene} » d'un seuil à l'autre.`,
      },
      {
        focal: "16-35mm",
        movement: "Plan fixe",
        angle: "Hauteur de genou",
        action: (scene) => `Le sol et les pas racontent « ${scene} » autant que les façades.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Plongée légère",
        action: (scene) => `Un dernier détail — enseigne, main, reflet — ferme « ${scene} ».`,
      },
    ],
    premiere: "Rythme posé. Une coupe par changement de focale, pas par figure.",
    resolve: "Contraste urbain modéré, une seule couleur RGB conservée, le reste neutre.",
  },
  {
    id: "nature",
    keywords: ["nature", "foret", "forêt", "mer", "plage", "montagne", "champ", "arbre", "lac", "paysage"],
    title: (scene) => `Paysage — ${short(scene)}`,
    pitch: (scene) =>
      `« ${scene} » est traité comme un paysage précis, pas comme une carte postale. Le trépied tient des plans assez longs pour voir le vent.`,
    ambiance: "Lumière du jour en clé, RGB seulement si l'heure tombe, sinon panneaux en appoint très faible.",
    sound: "Vent, feuilles ou eau, selon le lieu cité dans le prompt.",
    wide: "Pose l'horizon et le premier plan dans le même cadre.",
    standard: "Relie un sujet proche au paysage.",
    tele: "Extrait une texture : écorce, vague, herbe.",
    light: "Appoint très bas pour déboucher une ombre, teinte proche de la lumière du jour.",
    shots: [
      {
        focal: "Laowa 10mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `L'espace de « ${scene} » s'ouvre du sol à l'horizon.`,
      },
      {
        focal: "16-35mm",
        movement: "Plan fixe",
        angle: "Hauteur de genou",
        action: (scene) => `Un premier plan net mène vers le sujet de « ${scene} ».`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Hauteur d'œil",
        action: (scene) => `Une texture de « ${scene} » remplit le cadre. On tient jusqu'au mouvement naturel.`,
      },
      {
        focal: "16-35mm",
        movement: "Panoramique lent",
        angle: "Légère plongée",
        action: (scene) => `Le panorama traverse « ${scene} » sans accélérer.`,
      },
      {
        focal: "70-200mm",
        movement: "Plan fixe",
        angle: "Contre-plongée légère",
        action: (scene) => `Le ciel ou la canopée referme « ${scene} ».`,
      },
    ],
    premiere: "Plans longs, coupes sur le vent ou l'eau, pas sur un beat musical.",
    resolve: "Couleurs justes, ciel protégé, verts ou bleus sans saturation de carte postale.",
  },
];

const DEFAULT_PROFILE: SceneProfile = {
  id: "libre",
  keywords: [],
  title: (scene) => short(scene),
  pitch: (scene) =>
    `« ${scene} » est découpé en cinq plans, uniquement avec le kit embarqué. Le trépied porte tous les cadres.`,
  ambiance: "Lumière simple, une intention RGB très légère, contraste lisible.",
  sound: "Ambiance du lieu, quelques sons proches, rien d'illustratif.",
  wide: "Situe le lieu en un cadre.",
  standard: "Porte l'action principale.",
  tele: "Isole le détail qui fait comprendre la scène.",
  light: "Un panneau en clé douce, une seconde source RGB très basse en contour.",
  shots: [
    {
      focal: "Laowa 10mm",
      movement: "Plan fixe",
      angle: "Hauteur d'œil",
      action: (scene) => `Le lieu de « ${scene} » est posé en entier.`,
    },
    {
      focal: "16-35mm",
      movement: "Plan fixe",
      angle: "Hauteur d'œil",
      action: (scene) => `L'action de « ${scene} » entre dans un cadre stable.`,
    },
    {
      focal: "70-200mm",
      movement: "Plan fixe",
      angle: "Légère plongée",
      action: (scene) => `Un détail de « ${scene} » devient lisible grâce à la compression.`,
    },
    {
      focal: "16-35mm",
      movement: "Panoramique lent",
      angle: "Hauteur de poitrine",
      action: (scene) => `Le panorama relie deux éléments de « ${scene} ».`,
    },
    {
      focal: "70-200mm",
      movement: "Plan fixe",
      angle: "Hauteur d'œil",
      action: (scene) => `Le dernier cadre de « ${scene} » reste assez longtemps pour conclure.`,
    },
  ],
  premiere: "Cinq plans, ordre du plus large au plus précis, puis un retour.",
  resolve: "Étalonnage nodal discret : contraste, teinte, un accent RGB à peine visible.",
};

export function buildFallbackPlan(idea: string): DirectivePlan {
  const scene = idea.replace(/\s+/g, " ").trim().slice(0, 180);
  const profile = matchProfile(scene);
  return normalizePlan(
    {
      directive: profile.title(scene),
      atmosphere: {
        pitch: profile.pitch(scene),
        ambiance: profile.ambiance,
        sound: profile.sound,
      },
      gear_setup: [
        { name: "Sony A7V", role: "Boîtier unique. Profil log, obturation adaptée au mouvement du plan." },
        { name: "Laowa 10mm", role: profile.wide },
        { name: "16-35mm", role: profile.standard },
        { name: "70-200mm", role: profile.tele },
        { name: "Panneaux LED RGB", role: profile.light },
        { name: "Trépied", role: "Tous les cadres sont posés. Pas de suivi à l'épaule." },
        { name: "SmallRig", role: "Cage et poignée pour régler l'axe du trépied sans déplacer le corps." },
      ],
      shotlist: profile.shots.map((shot) => ({
        focal: shot.focal,
        movement: shot.movement,
        angle: shot.angle,
        action: shot.action(scene),
      })),
      post_production: {
        premiere: profile.premiere,
        resolve: profile.resolve,
      },
    },
    scene,
  );
}

function matchProfile(idea: string): SceneProfile {
  const folded = fold(idea);
  let best = DEFAULT_PROFILE;
  let bestScore = 0;
  for (const profile of PROFILES) {
    const score = profile.keywords.reduce((total, keyword) => total + (folded.includes(fold(keyword)) ? 1 : 0), 0);
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }
  return best;
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function short(scene: string): string {
  const clean = scene.replace(/\s+/g, " ").trim();
  if (clean.length <= 48) return clean;
  return `${clean.slice(0, 45).trimEnd()}…`;
}
