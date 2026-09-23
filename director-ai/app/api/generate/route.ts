import { NextResponse } from "next/server";
import { buildFallbackPlan } from "@/lib/fallback-plan";

export const runtime = "nodejs";

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

  return NextResponse.json({ plan: buildFallbackPlan(idea), source: "local" });
}
