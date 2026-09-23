import { NextResponse } from "next/server";
import { normalizePlan } from "@/lib/plan";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Tu es Director.AI, directeur de la photographie et assistant réalisateur pour courts-métrages. Tu réponds uniquement avec un objet JSON, en français, sans markdown.

CONTRAINTE MATÉRIELLE STRICTE.
Tu ne dois recommander QUE le matériel suivant, et aucun autre :
- boîtier Sony A7V
- objectif Laowa 10mm
- objectif 16-35mm
- objectif 70-200mm
- Panneau LED RGB
- Trépied
- SmallRig

Interdit, même si l'idée le suggère : autre boîtier, autre objectif, drone, gimbal, steadicam, grue, slider, filtre, micro, enregistreur, projecteur, haze, réflecteur, ou tout accessoire hors liste.
Le Sony A7V est toujours le boîtier. Chaque plan utilise exactement une focale parmi : "Laowa 10mm", "16-35mm", "70-200mm".
Les mouvements sont réalisables au trépied ou à la main avec le SmallRig : plan fixe, pan, tilt, léger déplacement au pas. Pas de vol, pas de grue.

Schéma exact :
{
  "title": "titre du court",
  "pitch": "2 ou 3 phrases, voix de réalisateur",
  "duration": "durée, ex: 4 min",
  "tone": "ton en deux ou trois mots",
  "colorimetry": [{ "name": "nom", "hex": "#RRGGBB", "note": "rôle de la teinte" }],
  "soundDesign": [{ "layer": "couche", "description": "intention sonore" }],
  "gear": [{ "name": "nom exact de la liste", "usage": "pourquoi il est là" }],
  "storyboard": [{ "shot": 1, "focal": "16-35mm", "movement": "plan fixe", "action": "ce que l'on voit" }]
}

4 couleurs, 3 couches sonores, uniquement le matériel vraiment utilisé, 5 à 7 plans. Les valeurs "name" du gear et "focal" doivent reprendre exactement les libellés autorisés.`;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
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
      { error: "Décrivez l'idée en quelques mots, entre 2 et 500 caractères." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Ajoutez OPENAI_API_KEY dans .env.local pour générer un plan." },
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
          { role: "user", content: `Idée de court-métrage : ${idea}` },
        ],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de joindre OpenAI. Vérifiez la connexion, puis réessayez." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    console.error("OpenAI error", upstream.status);
    return NextResponse.json(
      { error: "La génération a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
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
    return NextResponse.json(
      { error: "Réponse incomplète. Relancez la génération." },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Le plan reçu n'était pas un JSON valide." },
      { status: 502 },
    );
  }

  return NextResponse.json({ plan: normalizePlan(parsed, idea) });
}
