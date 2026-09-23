import { NextResponse } from "next/server";
import { buildFallbackPlan } from "@/lib/fallback-plan";
import { normalizePlan, type DirectivePlan } from "@/lib/plan";

const OPENAI_TIMEOUT_MS = 8000;

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu es Director.AI, un mentor d'élite en réalisation vidéo.
CONTRAINTE MATÉRIELLE ABSOLUE : Tu dois concevoir tes plans EXCLUSIVEMENT avec : Sony A7V, Laowa 10mm / 16-35mm / 70-200mm, Panneaux LED RGB, Trépied, SmallRig. AUCUN autre matériel.
LOGICIELS : Premiere Pro, DaVinci Resolve.
Renvoie un JSON valide, sans markdown, avec exactement ces clés :
{
  "directive": "titre court du projet",
  "atmosphere": { "pitch": "intention en deux phrases", "ambiance": "lumière et couleur", "sound": "sound design" },
  "gear_setup": [{ "name": "nom exact du kit", "role": "pourquoi il est là" }],
  "shotlist": [{ "focal": "16-35mm", "movement": "plan fixe", "angle": "hauteur d'œil", "action": "ce que l'on voit" }],
  "post_production": { "premiere": "montage", "resolve": "étalonnage nodal" }
}
Cinq à sept plans. Focales limitées à Laowa 10mm, 16-35mm ou 70-200mm. Ton clair, précis, pédagogique.`;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "La requête est illisible." }, { status: 400 });
  }

  const idea =
    payload &&
    typeof payload === "object" &&
    "idea" in payload &&
    typeof payload.idea === "string"
      ? payload.idea.trim()
      : "";

  if (idea.length < 2 || idea.length > 500) {
    return NextResponse.json(
      { error: "Décrivez la scène en quelques mots, entre 2 et 500 caractères." },
      { status: 400 },
    );
  }

  try {
    const plan = await generateWithOpenAI(idea);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("OpenAI indisponible, secours local", error instanceof Error ? error.message : error);
    return NextResponse.json({ plan: buildFallbackPlan(idea), source: "local" });
  }
}

async function generateWithOpenAI(idea: string): Promise<DirectivePlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY absente");

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Idée de scène : ${idea}` },
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await readOpenAIError(upstream);
      throw new Error(detail);
    }

    const data: unknown = await upstream.json();
    const content =
      data &&
      typeof data === "object" &&
      "choices" in data &&
      Array.isArray(data.choices)
        ? data.choices[0]?.message?.content
        : undefined;

    if (typeof content !== "string") throw new Error("Réponse OpenAI incomplète");
    return normalizePlan(JSON.parse(content) as unknown, idea);
  } finally {
    clearTimeout(timer);
  }
}

async function readOpenAIError(upstream: Response): Promise<string> {
  try {
    const body: unknown = await upstream.json();
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      body.error &&
      typeof body.error === "object" &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : "";
    const safe = message.replace(/sk-[A-Za-z0-9_-]+/g, "sk-…").trim();
    return safe || `OpenAI ${upstream.status}`;
  } catch {
    return `OpenAI ${upstream.status}`;
  }
}
