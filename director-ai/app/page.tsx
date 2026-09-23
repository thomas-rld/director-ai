"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Brain } from "lucide-react";
import type { DirectivePlan } from "@/lib/plan";

const STEPS = [
  { id: "vision", label: "Vision", hint: "Pitch, ambiance, son" },
  { id: "arsenal", label: "Arsenal", hint: "Matériel validé" },
  { id: "plateau", label: "Plateau", hint: "Découpage technique" },
  { id: "post", label: "Post-prod", hint: "Montage et étalonnage" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type Phase = "home" | "loading" | "result";

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("home");
  const [plan, setPlan] = useState<DirectivePlan | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdea = idea.trim();
    if (nextIdea.length < 2 || phase === "loading") return;

    setPhase("loading");
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
        setPhase("home");
        return;
      }
      if (!data || typeof data !== "object" || !("plan" in data)) {
        setError("Réponse inattendue.");
        setPhase("home");
        return;
      }
      setPlan(data.plan as DirectivePlan);
      setStep(0);
      setPhase("result");
    } catch {
      setError("Le service ne répond pas. Réessayez.");
      setPhase("home");
    }
  }

  function reset() {
    setPhase("home");
    setPlan(null);
    setError("");
    setIdea("");
    setStep(0);
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-slate-50 text-slate-900">
      <AnimatePresence mode="wait">
        {phase === "result" && plan ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <GuidedPath plan={plan} step={step} onStep={setStep} onReset={reset} />
          </motion.div>
        ) : (
          <motion.main
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
            className="mx-auto flex min-h-svh w-full min-w-0 max-w-3xl flex-col items-center justify-center px-6 py-16"
          >
            <motion.div
              animate={
                phase === "loading" && !reduce
                  ? { scale: [1, 1.06, 1], opacity: [0.55, 1, 0.55] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                phase === "loading"
                  ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              className="grid h-16 w-16 place-items-center text-slate-900"
            >
              <Brain className="h-12 w-12" strokeWidth={1.25} />
            </motion.div>

            {phase === "home" ? (
              <HomePrompt idea={idea} error={error} onIdea={setIdea} onSubmit={onSubmit} />
            ) : (
              <p className="mt-8 text-center text-lg text-slate-500">
                Connexion des synapses créatives...
              </p>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function HomePrompt({
  idea,
  error,
  onIdea,
  onSubmit,
}: {
  idea: string;
  error: string;
  onIdea: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="mt-8 w-full min-w-0 text-center">
      <h1 className="text-balance text-4xl font-medium tracking-tight text-slate-900 sm:text-5xl">
        Votre vision. Notre méthode.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-balance text-base leading-7 text-slate-500">
        Une scène suffit. Le parcours se construit ensuite, étape par étape.
      </p>
      <form onSubmit={onSubmit} className="mx-auto mt-10 w-full min-w-0 max-w-xl text-left">
        <label htmlFor="idea" className="sr-only">
          Idée de scène
        </label>
        <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center">
          <input
            id="idea"
            value={idea}
            onChange={(event) => onIdea(event.target.value)}
            placeholder="Décrivez votre idée de scène (ex: Plan séquence urbain sous la pluie)..."
            maxLength={500}
            autoComplete="off"
            className="h-12 min-w-0 w-full flex-1 bg-transparent px-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={idea.trim().length < 2}
            className="h-11 w-full shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
          >
            Continuer
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-slate-500">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function GuidedPath({
  plan,
  step,
  onStep,
  onReset,
}: {
  plan: DirectivePlan;
  step: number;
  onStep: (index: number) => void;
  onReset: () => void;
}) {
  const current = STEPS[step] ?? STEPS[0];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-slate-900">
          <Brain className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-sm font-medium">Director.AI</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          Nouvelle idée
        </button>
      </header>

      <div className="mt-12 grid flex-1 gap-10 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Parcours" className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
          {STEPS.map((item, index) => {
            const active = index === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStep(index)}
                aria-current={active ? "step" : undefined}
                className={`min-w-[9.5rem] rounded-2xl px-4 py-3 text-left transition md:min-w-0 ${
                  active ? "bg-white shadow-sm ring-1 ring-slate-200/80" : "hover:bg-white/70"
                }`}
              >
                <span className={`block text-sm font-medium ${active ? "text-slate-900" : "text-slate-400"}`}>
                  {index + 1}. {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.hint}</span>
              </button>
            );
          })}
        </nav>

        <section className="flex flex-col">
          <p className="text-sm text-slate-500">{plan.directive}</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight">{current.label}</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease }}
              className="mt-8"
            >
              <StepBody id={current.id} plan={plan} />
            </motion.div>
          </AnimatePresence>

          <div className="mt-auto flex items-center justify-between pt-10">
            <button
              type="button"
              onClick={() => onStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="text-sm text-slate-500 transition hover:text-slate-900 disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => onStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              Suivant
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StepBody({ id, plan }: { id: StepId; plan: DirectivePlan }) {
  if (id === "vision") return <VisionStep plan={plan} />;
  if (id === "arsenal") return <ArsenalStep plan={plan} />;
  if (id === "plateau") return <PlateauStep plan={plan} />;
  return <PostStep plan={plan} />;
}

function VisionStep({ plan }: { plan: DirectivePlan }) {
  return (
    <div className="space-y-4">
      <Card title="Pitch" text={plan.atmosphere.pitch} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Ambiance" text={plan.atmosphere.ambiance || "À préciser au tournage."} />
        <Card title="Sound design" text={plan.atmosphere.sound || "À préciser au montage."} />
      </div>
    </div>
  );
}

function ArsenalStep({ plan }: { plan: DirectivePlan }) {
  return (
    <ul className="space-y-3">
      {plan.gear_setup.map((item) => (
        <li key={item.name} className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/80">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-base font-medium text-slate-900">{item.name}</p>
            <p className="text-xs font-medium tracking-wide text-indigo-600">Validé</p>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{item.role}</p>
        </li>
      ))}
    </ul>
  );
}

function PlateauStep({ plan }: { plan: DirectivePlan }) {
  return (
    <ol className="space-y-4">
      {plan.shotlist.map((shot, index) => (
        <li key={`${shot.focal}-${index}`} className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-xs text-slate-400">Plan {String(index + 1).padStart(2, "0")}</p>
          <p className="mt-2 text-base leading-7 text-slate-900">{shot.action}</p>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <div>
              <dt className="text-xs text-slate-400">Focale</dt>
              <dd>{shot.focal}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Mouvement</dt>
              <dd>{shot.movement}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Angle</dt>
              <dd>{shot.angle}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}

function PostStep({ plan }: { plan: DirectivePlan }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title="Premiere Pro" text={plan.post_production.premiere || "Montage à préciser."} />
      <Card title="DaVinci Resolve" text={plan.post_production.resolve || "Étalonnage nodal à préciser."} />
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-slate-200/80">
      <h3 className="text-xs font-medium tracking-wide text-slate-400">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-900">{text}</p>
    </article>
  );
}
