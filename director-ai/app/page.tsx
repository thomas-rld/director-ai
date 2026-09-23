"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Aperture, ArrowUpRight, RotateCcw } from "lucide-react";
import { ResultDashboard } from "@/components/result-dashboard";
import type { DirectorPlan } from "@/lib/plan";

const SUGGESTIONS = ["Pluie nocturne", "Dernier métro", "Chambre 409", "Marée basse"];

const LOADING_LINES = [
  "Lecture de la lumière disponible",
  "Choix des focales sur le Sony A7V",
  "Construction de la colorimétrie",
  "Écriture du sound design",
  "Découpage du storyboard",
  "Vérification du matériel autorisé",
];

const KIT = ["Sony A7V", "Laowa 10mm", "16-35mm", "70-200mm", "LED RGB", "Trépied", "SmallRig"];

type Phase = "idle" | "loading" | "result" | "error";

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [lineIndex, setLineIndex] = useState(0);
  const [plan, setPlan] = useState<DirectorPlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setInterval(() => {
      setLineIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdea = idea.trim();
    if (nextIdea.length < 2 || phase === "loading") return;

    setPhase("loading");
    setLineIndex(0);
    setError("");
    setPlan(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: nextIdea }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "La génération a échoué.";
        setError(message);
        setPhase("error");
        return;
      }
      if (!data || typeof data !== "object" || !("plan" in data)) {
        setError("Réponse inattendue du studio.");
        setPhase("error");
        return;
      }
      setPlan(data.plan as DirectorPlan);
      setPhase("result");
    } catch {
      setError("Le studio ne répond pas. Réessayez.");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle");
    setPlan(null);
    setError("");
    setIdea("");
  }

  const settled = phase === "result";

  return (
    <div className="relative min-h-svh overflow-x-hidden">
      <Atmosphere />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-cyan-100 shadow-[0_0_24px_rgba(142,246,255,0.12)]">
            <Aperture className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="text-xs font-medium tracking-[0.22em] text-white/80">DIRECTOR.AI</span>
        </div>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          <span className="rec-dot h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          Rec · 16:9
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 md:px-8">
        <section
          className={
            settled
              ? "pb-8 pt-2"
              : "flex min-h-[calc(100svh-5.5rem)] flex-col justify-center pb-16"
          }
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-cyan-100/60">
            Assistant de réalisation
          </p>
          <h1
            className={`mt-4 max-w-4xl font-medium tracking-[-0.045em] text-white transition-all duration-700 ${
              settled
                ? "text-4xl leading-none"
                : "text-[clamp(3.1rem,8vw,6.6rem)] leading-[0.9]"
            }`}
          >
            De l&apos;idée
            <span className="block bg-gradient-to-r from-white via-cyan-100 to-amber-200 bg-clip-text text-transparent">
              au premier plan.
            </span>
          </h1>
          <p
            className={`mt-6 max-w-xl text-base leading-7 text-white/55 transition-opacity duration-500 ${
              settled ? "hidden" : "block"
            }`}
          >
            Pitch, lumière, son, matériel et découpage — tenus dans le kit que vous avez vraiment
            sur le plateau.
          </p>

          <form
            onSubmit={onSubmit}
            className={`prompt-shell w-full min-w-0 ${settled ? "mt-8 max-w-3xl" : "mt-10"}`}
          >
            <div className="flex min-w-0 items-center gap-2 rounded-[1.4rem] bg-[#070707]/90 px-3 py-2 backdrop-blur-2xl sm:px-4">
              <label htmlFor="idea" className="sr-only">
                Idée du film
              </label>
              <input
                id="idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Pluie nocturne"
                maxLength={500}
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent px-2 text-lg text-white outline-none placeholder:text-white/25 md:h-16 md:text-xl"
              />
              <button
                type="submit"
                disabled={phase === "loading"}
                aria-label="Générer le plan"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40 sm:px-4"
              >
                <span className="hidden sm:inline">
                  {phase === "loading" ? "Génération" : "Générer"}
                </span>
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </form>

          {phase === "idle" ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setIdea(suggestion)}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          {phase === "idle" ? (
            <p className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
              <span>Kit verrouillé</span>
              {KIT.map((item) => (
                <span key={item} className="whitespace-nowrap">
                  · {item}
                </span>
              ))}
            </p>
          ) : null}

          <div aria-live="polite" className="mt-8">
            {phase === "loading" ? (
              <div className="max-w-xl">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-100/70">
                  En cours
                </p>
                <div className="mt-3 h-8 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={LOADING_LINES[lineIndex]}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.35 }}
                      className="text-lg text-white/80"
                    >
                      {LOADING_LINES[lineIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="mt-4 h-px overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-200 to-amber-300"
                    animate={{ x: ["-120%", "320%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </div>
              </div>
            ) : null}

            {phase === "error" ? (
              <p role="alert" className="max-w-xl text-sm text-amber-100/90">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        {phase === "result" && plan ? (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                Nouvelle idée
              </button>
            </div>
            <ResultDashboard plan={plan} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div className="absolute -left-24 -top-32 h-[460px] w-[460px] rounded-full bg-cyan-300/10 blur-[120px]" />
      <div className="absolute -bottom-40 -right-16 h-[520px] w-[520px] rounded-full bg-orange-400/10 blur-[140px]" />
      <div className="grain absolute inset-0 opacity-[0.16]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}
