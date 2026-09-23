export const FOCALS = ["Laowa 10mm", "16-35mm", "70-200mm"] as const;

export type Focal = (typeof FOCALS)[number];

export type Shot = {
  focal: Focal;
  movement: string;
  angle: string;
};

export type DirectivePlan = {
  directive: string;
  atmosphere: string;
  shotlist: Shot[];
  lighting: string;
  post_prod: string;
};

const FORBIDDEN =
  /dji|ronin|gimbal|steadicam|steadycam|drone|grue|slider|crane|bmpcc|red\s|arri|zeiss|sigma/gi;

function clip(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const trimmed = String(value).replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function scrub(value: string): string {
  return value.replace(FORBIDDEN, "KIT AUTORISÉ").replace(/\s{2,}/g, " ").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function flatten(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return clip(value, 700);
  if (Array.isArray(value)) {
    return value.map((item) => flatten(item)).filter(Boolean).join("  /  ");
  }
  const record = asRecord(value);
  if (!record) return "";
  return Object.entries(record)
    .map(([key, entry]) => {
      const text = flatten(entry);
      return text ? `${key}: ${text}` : "";
    })
    .filter(Boolean)
    .join("  /  ");
}

export function canonicalFocal(name: string): Focal {
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
  return "16-35mm";
}

function readShot(entry: unknown): Shot | null {
  const record = asRecord(entry);
  if (!record) return null;
  const action = clip(record.action ?? record.description, 40);
  const movement = scrub(
    clip(record.movement ?? record.mouvement ?? record.move, 72, action || "PLAN FIXE"),
  );
  const angle = scrub(clip(record.angle ?? record.cadrage ?? record.hauteur, 72, "HAUTEUR D'OEIL"));
  const focalRaw = clip(record.focal ?? record.focale ?? record.lens ?? record.optique, 80);
  if (!movement && !focalRaw) return null;
  return {
    focal: canonicalFocal(focalRaw),
    movement: movement || "PLAN FIXE",
    angle,
  };
}

export function normalizePlan(raw: unknown, idea: string): DirectivePlan {
  const source = asRecord(raw) ?? {};
  const shotlist = (Array.isArray(source.shotlist) ? source.shotlist : [])
    .map(readShot)
    .filter((shot): shot is Shot => shot !== null)
    .slice(0, 8);

  const shots =
    shotlist.length > 0
      ? shotlist
      : [{ focal: "16-35mm" as const, movement: "PLAN FIXE", angle: "HAUTEUR D'OEIL" }];

  const atmosphere = scrub(
    flatten(source.atmosphere) || "VISUEL: NON CALÉ  /  SONORE: NON CALÉ",
  );
  const lighting = scrub(
    flatten(source.lighting) || "PANNEAU LED RGB — CYAN 20% / AMBRE 10% — FACE ET CONTOUR",
  );
  const post = asRecord(source.post_prod);
  const postProd = scrub(
    post
      ? [
          flatten(post.resolve ?? post.davinci) &&
            `RESOLVE // ${flatten(post.resolve ?? post.davinci)}`,
          flatten(post.premiere ?? post.montage) &&
            `PREMIERE // ${flatten(post.premiere ?? post.montage)}`,
        ]
          .filter(Boolean)
          .join("  /  ") || flatten(post)
      : flatten(source.post_prod),
  );

  return {
    directive: scrub(clip(source.directive, 90, clip(idea, 90, "SANS TITRE"))),
    atmosphere,
    shotlist: shots,
    lighting,
    post_prod: postProd || "RESOLVE // GRADING NODAL  /  PREMIERE // MONTAGE",
  };
}

export function formatStream(plan: DirectivePlan): string {
  const shots = plan.shotlist
    .map(
      (shot, index) =>
        `  ${String(index + 1).padStart(2, "0")}   FOC ${shot.focal}   /   MOV ${shot.movement}   /   ANG ${shot.angle}`,
    )
    .join("\n");

  return [
    "PACKET // CLEAR",
    "DIRECTIVE",
    `  ${plan.directive}`,
    "",
    "ATMOSPHERE",
    `  ${plan.atmosphere}`,
    "",
    "SHOTLIST",
    shots,
    "",
    "LIGHTING",
    `  ${plan.lighting}`,
    "",
    "POST_PROD",
    `  ${plan.post_prod}`,
  ].join("\n");
}

export function usedOptics(plan: DirectivePlan): Set<Focal> {
  return new Set(plan.shotlist.map((shot) => shot.focal));
}
