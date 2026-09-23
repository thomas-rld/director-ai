export const ALLOWED_GEAR = [
  "Sony A7V",
  "Laowa 10mm",
  "16-35mm",
  "70-200mm",
  "Panneau LED RGB",
  "Trépied",
  "SmallRig",
] as const;

export const ALLOWED_FOCALS = ["Laowa 10mm", "16-35mm", "70-200mm"] as const;

export type GearName = (typeof ALLOWED_GEAR)[number];
export type FocalName = (typeof ALLOWED_FOCALS)[number];

export type ColorSwatch = {
  name: string;
  hex: string;
  note: string;
};

export type SoundLayer = {
  layer: string;
  description: string;
};

export type GearItem = {
  name: GearName;
  usage: string;
};

export type StoryboardShot = {
  shot: number;
  focal: FocalName;
  movement: string;
  action: string;
};

export type DirectorPlan = {
  title: string;
  pitch: string;
  duration: string;
  tone: string;
  colorimetry: ColorSwatch[];
  soundDesign: SoundLayer[];
  gear: GearItem[];
  storyboard: StoryboardShot[];
};

const HEX = /^#[0-9A-Fa-f]{6}$/;
const FORBIDDEN_MOVE =
  /drone|gimbal|steadicam|steadycam|grue|slider|crane|ronin|voiture-travelling/i;

const FALLBACK_COLORS: ColorSwatch[] = [
  { name: "Nuit", hex: "#0B1220", note: "Ombres profondes" },
  { name: "Sodium", hex: "#7EE7FF", note: "Reflets froids" },
  { name: "Ambre", hex: "#FF8A3D", note: "Sources chaudes" },
  { name: "Brume", hex: "#C9D0D6", note: "Hautes lumières" },
];

function clip(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function canonicalGear(name: string): GearName | null {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/objectif|boitier|camera/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.includes("laowa") || normalized.includes("10mm") || normalized.includes("10 mm")) {
    return "Laowa 10mm";
  }
  if (normalized.includes("16-35") || normalized.includes("16 35") || normalized.includes("1635")) {
    return "16-35mm";
  }
  if (normalized.includes("70-200") || normalized.includes("70 200") || normalized.includes("70200")) {
    return "70-200mm";
  }
  if (normalized.includes("led") || normalized.includes("rgb") || normalized.includes("panneau")) {
    return "Panneau LED RGB";
  }
  if (normalized.includes("trepied") || normalized.includes("tripod")) {
    return "Trépied";
  }
  if (normalized.includes("smallrig") || normalized.includes("small rig")) {
    return "SmallRig";
  }
  if (normalized.includes("a7v") || normalized.includes("a7 v") || normalized.includes("sony")) {
    return "Sony A7V";
  }
  return null;
}

function canonicalFocal(name: string): FocalName {
  const gear = canonicalGear(name);
  if (gear === "Laowa 10mm" || gear === "16-35mm" || gear === "70-200mm") return gear;
  return "16-35mm";
}

export function normalizePlan(raw: unknown, idea: string): DirectorPlan {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const colorimetry = asArray(source.colorimetry).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const hex = clip(item.hex, 7).toUpperCase();
    if (!HEX.test(hex)) return [];
    return [
      {
        name: clip(item.name, 32, "Teinte"),
        hex,
        note: clip(item.note, 80, "Accent"),
      },
    ];
  });

  const soundDesign = asArray(source.soundDesign).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const description = clip(item.description, 180);
    if (!description) return [];
    return [{ layer: clip(item.layer, 40, "Couche"), description }];
  });

  const seen = new Set<GearName>();
  const gear = asArray(source.gear).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = canonicalGear(clip(item.name, 80));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    return [{ name, usage: clip(item.usage, 160, "Utilisé sur le tournage.") }];
  });

  if (!seen.has("Sony A7V")) {
    gear.unshift({ name: "Sony A7V", usage: "Boîtier unique du tournage." });
  }

  const storyboard = asArray(source.storyboard).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const action = clip(item.action, 280);
    if (!action) return [];
    const movement = clip(item.movement, 80, "Plan fixe");
    return [
      {
        shot: 0,
        focal: canonicalFocal(clip(item.focal, 40)),
        movement: FORBIDDEN_MOVE.test(movement) ? "Plan fixe" : movement,
        action,
      },
    ];
  });

  const shots = (storyboard.length > 0 ? storyboard : [
    {
      shot: 0,
      focal: "16-35mm" as const,
      movement: "Plan fixe",
      action: clip(idea, 180, "Ouverture sur l'idée, tenue jusqu'au premier mouvement."),
    },
  ])
    .slice(0, 8)
    .map((shot, index) => ({ ...shot, shot: index + 1 }));

  return {
    title: clip(source.title, 80, clip(idea, 80, "Sans titre")),
    pitch: clip(
      source.pitch,
      420,
      "Un court-métrage tenu dans un seul kit, où la lumière et le cadre portent l'idée.",
    ),
    duration: clip(source.duration, 24, "4 min"),
    tone: clip(source.tone, 48, "Nocturne"),
    colorimetry: (colorimetry.length > 0 ? colorimetry : FALLBACK_COLORS).slice(0, 5),
    soundDesign: (soundDesign.length > 0
      ? soundDesign
      : [{ layer: "Ambiance", description: "Nappe sourde, proche du silence, qui laisse respirer l'image." }]
    ).slice(0, 4),
    gear: gear.slice(0, ALLOWED_GEAR.length),
    storyboard: shots,
  };
}
