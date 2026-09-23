import { NextResponse } from "next/server";
import { normalizePlan } from "@/lib/plan";

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Ajoutez OPENAI_API_KEY dans .env.local pour continuer." },
      { status: 500 },
    );
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
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
  } catch {
    return NextResponse.json(
      { error: "La connexion à OpenAI a échoué. Réessayez." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    console.error("OpenAI error", upstream.status);
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }

  const data: unknown = await upstream.json();
  const content =
    data &&
    typeof data === "object" &&
    "choices" in data &&
    Array.isArray(data.choices)
      ? data.choices[0]?.message?.content
      : undefined;

  if (typeof content !== "string") {
    return NextResponse.json({ error: "Réponse incomplète. Relancez." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Le plan reçu n'était pas un JSON valide." }, { status: 502 });
  }

  return NextResponse.json({ plan: normalizePlan(parsed, idea) });
}
