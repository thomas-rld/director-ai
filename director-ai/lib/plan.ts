export const KIT = [
  "Sony A7V",
  "Laowa 10mm",
  "16-35mm",
  "70-200mm",
  "Panneaux LED RGB",
  "Trépied",
  "SmallRig",
] as const;

export type GearName = (typeof KIT)[number];
export type Focal = "Laowa 10mm" | "16-35mm" | "70-200mm";

export type GearItem = {
  name: GearName;
  role: string;
};

export type Shot = {
  focal: Focal;
  movement: string;
  angle: string;
  action: string;
};

export type DirectivePlan = {
  directive: string;
  atmosphere: {
    pitch: string;
    ambiance: string;
    sound: string;
  };
  gear_setup: GearItem[];
  shotlist: Shot[];
  post_production: {
    premiere: string;
    resolve: string;
  };
};

const FORBIDDEN =
  /dji|ronin|gimbal|steadicam|steadycam|drone|grue|slider|crane|bmpcc|\barri\b|zeiss|sigma/gi;

function clip(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const trimmed = String(value).replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function scrub(value: string): string {
  return value.replace(FORBIDDEN, "kit autorisé").replace(/\s{2,}/g, " ").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function canonicalGear(name: string): GearName | null {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("laowa") || normalized.includes("10mm") || normalized.includes("10 mm")) {
    return "Laowa 10mm";
  }
  if (normalized.includes("70-200") || normalized.includes("70 200") || normalized.includes("70200")) {
    return "70-200mm";
  }
  if (normalized.includes("16-35") || normalized.includes("16 35") || normalized.includes("1635")) {
    return "16-35mm";
  }
  if (normalized.includes("led") || normalized.includes("rgb") || normalized.includes("panneau")) {
    return "Panneaux LED RGB";
  }
  if (normalized.includes("trepied") || normalized.includes("tripod")) return "Trépied";
  if (normalized.includes("smallrig") || normalized.includes("small rig")) return "SmallRig";
  if (normalized.includes("a7v") || normalized.includes("a7 v") || normalized.includes("sony")) {
    return "Sony A7V";
  }
  return null;
}

function canonicalFocal(name: string): Focal {
  const gear = canonicalGear(name);
  if (gear === "Laowa 10mm" || gear === "16-35mm" || gear === "70-200mm") return gear;
  return "16-35mm";
}

function readAtmosphere(value: unknown, idea: string): DirectivePlan["atmosphere"] {
  if (typeof value === "string") {
    return { pitch: scrub(clip(value, 500, idea)), ambiance: "", sound: "" };
  }
  const record = asRecord(value);
  if (!record) {
    return { pitch: scrub(clip(idea, 240)), ambiance: "", sound: "" };
  }
  return {
    pitch: scrub(clip(record.pitch ?? record.directive ?? record.resume, 500)),
    ambiance: scrub(clip(record.ambiance ?? record.visual ?? record.visuel ?? record.mood, 400)),
    sound: scrub(clip(record.sound ?? record.son ?? record.soundDesign ?? record.sonore, 400)),
  };
}

function readPost(value: unknown): DirectivePlan["post_production"] {
  if (typeof value === "string") {
    const text = scrub(clip(value, 800));
    return { premiere: text, resolve: "" };
  }
  const record = asRecord(value);
  if (!record) return { premiere: "", resolve: "" };
  return {
    premiere: scrub(clip(record.premiere ?? record.montage, 500)),
    resolve: scrub(clip(record.resolve ?? record.davinci ?? record.etalonnage, 500)),
  };
}

export function normalizePlan(raw: unknown, idea: string): DirectivePlan {
  const source = asRecord(raw) ?? {};
  const seen = new Set<GearName>();
  const gear = (Array.isArray(source.gear_setup) ? source.gear_setup : []).flatMap((entry) => {
    if (typeof entry === "string") {
      const name = canonicalGear(entry);
      if (!name || seen.has(name)) return [];
      seen.add(name);
      return [{ name, role: "Retenu pour la scène." }];
    }
    const record = asRecord(entry);
    if (!record) return [];
    const name = canonicalGear(clip(record.name ?? record.item ?? record.gear, 80));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    return [{ name, role: scrub(clip(record.role ?? record.usage ?? record.why, 180, "Retenu pour la scène.")) }];
  });

  if (!seen.has("Sony A7V")) {
    gear.unshift({ name: "Sony A7V", role: "Boîtier unique du tournage." });
  }

  const shotlist = (Array.isArray(source.shotlist) ? source.shotlist : []).flatMap((entry) => {
    const record = asRecord(entry);
    if (!record) return [];
    const action = scrub(clip(record.action ?? record.description ?? record.plan, 280));
    const movement = scrub(clip(record.movement ?? record.mouvement, 80, "Plan fixe"));
    if (!action && !movement) return [];
    return [
      {
        focal: canonicalFocal(clip(record.focal ?? record.focale ?? record.lens, 40)),
        movement,
        angle: scrub(clip(record.angle ?? record.cadrage, 80, "Hauteur d'œil")),
        action: action || "Plan tenu le temps de lire la scène.",
      },
    ];
  });

  const atmosphere = readAtmosphere(source.atmosphere, idea);
  if (!atmosphere.pitch) atmosphere.pitch = scrub(clip(source.directive ?? idea, 240));

  return {
    directive: scrub(clip(source.directive, 90, clip(idea, 90, "Sans titre"))),
    atmosphere,
    gear_setup: gear.slice(0, KIT.length),
    shotlist:
      shotlist.length > 0
        ? shotlist.slice(0, 8)
        : [
            {
              focal: "16-35mm",
              movement: "Plan fixe",
              angle: "Hauteur d'œil",
              action: scrub(clip(idea, 180, "Ouverture sur l'idée.")),
            },
          ],
    post_production: readPost(source.post_production),
  };
}
