import { NextResponse } from "next/server";
import { normalizePlan } from "@/lib/plan";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu es l'unité logique 'Director.AI', une intelligence artificielle d'élite spécialisée dans la direction de la photographie et le mentorat créatif.
CONTRAINTES MATÉRIELLES (L'Arsenal) :
Tu dois concevoir tes plans EXCLUSIVEMENT avec le matériel suivant :
* Boîtier : Sony A7V.
* Optiques : Laowa 10mm, 16-35mm, 70-200mm.
* Éclairage : Panneaux LED RGB.
* Machinerie : Trépied, cage SmallRig.
Interdiction formelle de suggérer du matériel hors de cette liste. Optimise chaque scène pour ce setup.

WORKFLOW POST-PRODUCTION :
Tes recommandations de montage et d'étalonnage doivent cibler DaVinci Resolve (color grading nodal) et Premiere Pro.
FORMAT DE RÉPONSE (JSON structuré) :
Renvoie un JSON valide avec les clés suivantes :
* \`directive\`: Titre du projet.
* \`atmosphere\`: Moodboard visuel et sonore.
* \`shotlist\`: Un tableau d'objets (focale, mouvement, angle).
* \`lighting\`: Configuration stricte des panneaux RGB.
* \`post_prod\`: Directives techniques pour Resolve/Premiere.

Ton ton est froid, technique, incisif et orienté progression de l'utilisateur.`;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "PAQUET ILLISIBLE." }, { status: 400 });
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
      { error: "DIRECTIVE INVALIDE. 2 À 500 CARACTÈRES." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CLÉ OPENAI ABSENTE. CHARGEZ OPENAI_API_KEY DANS .ENV.LOCAL." },
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
          { role: "user", content: `Directive opérateur : ${idea}` },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "UPLINK ROMPU. RÉÉMETTEZ." }, { status: 502 });
  }

  if (!upstream.ok) {
    console.error("OpenAI error", upstream.status);
    return NextResponse.json({ error: "CŒUR MUET. RÉÉMETTEZ." }, { status: 502 });
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
    return NextResponse.json({ error: "PAQUET INCOMPLET." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "JSON CORROMPU." }, { status: 502 });
  }

  return NextResponse.json({ plan: normalizePlan(parsed, idea) });
}
