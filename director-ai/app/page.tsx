"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DirectivePlan } from "@/lib/plan";

const STEPS = [
  { id: "vision", label: "Vision" },
  { id: "arsenal", label: "Arsenal" },
  { id: "plateau", label: "Plateau" },
  { id: "post", label: "Post-Prod" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type Phase = "home" | "loading" | "result";

const ease = [0.22, 1, 0.36, 1] as const;

type Neuron = { x: number; y: number; dx: number; dy: number };

const NEURONS: Neuron[] = [
  { x: 34, y: 30, dx: 0.9, dy: 0.5 },
  { x: 24, y: 46, dx: -0.7, dy: 0.6 },
  { x: 23, y: 62, dx: 0.6, dy: -0.5 },
  { x: 32, y: 76, dx: 0.5, dy: 0.7 },
  { x: 44, y: 22, dx: -0.4, dy: 0.6 },
  { x: 42, y: 40, dx: 0.7, dy: -0.4 },
  { x: 40, y: 56, dx: -0.5, dy: 0.6 },
  { x: 46, y: 72, dx: 0.4, dy: 0.5 },
  { x: 50, y: 32, dx: 0.2, dy: 0.7 },
  { x: 50, y: 50, dx: -0.3, dy: -0.5 },
  { x: 50, y: 68, dx: 0.3, dy: 0.4 },
  { x: 56, y: 22, dx: 0.4, dy: -0.5 },
  { x: 58, y: 40, dx: -0.6, dy: 0.5 },
  { x: 60, y: 56, dx: 0.5, dy: -0.6 },
  { x: 54, y: 72, dx: -0.4, dy: 0.5 },
  { x: 66, y: 30, dx: -0.8, dy: 0.4 },
  { x: 76, y: 46, dx: 0.7, dy: -0.5 },
  { x: 77, y: 62, dx: -0.6, dy: 0.6 },
  { x: 68, y: 76, dx: 0.5, dy: -0.4 },
  { x: 44, y: 86, dx: 0.3, dy: 0.4 },
  { x: 56, y: 86, dx: -0.3, dy: 0.5 },
  { x: 50, y: 94, dx: 0.2, dy: -0.3 },
];

const SYNAPSES: [number, number][] = [
  [0, 4], [4, 5], [0, 1], [1, 2], [2, 3], [3, 7], [7, 19],
  [0, 5], [1, 6], [2, 6], [5, 6], [6, 7], [5, 8], [6, 9], [7, 10],
  [8, 9], [9, 10], [8, 12], [9, 13], [10, 14], [10, 19], [10, 20],
  [15, 11], [11, 12], [15, 16], [16, 17], [17, 18], [18, 14], [14, 20],
  [12, 13], [13, 14], [16, 12], [17, 13], [18, 13],
  [19, 21], [20, 21], [19, 20], [4, 11], [3, 19], [18, 20],
];

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("home");
  const [plan, setPlan] = useState<DirectivePlan | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

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

  const active = phase === "loading";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-white text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(224,231,255,0.85),rgba(255,255,255,0)_58%)]"
        aria-hidden
      />

      {phase === "result" && plan ? (
        <Sequencer
          plan={plan}
          step={step}
          onStep={setStep}
          onReset={reset}
          core={<NeuralBrain active={false} compact />}
        />
      ) : (
        <main className="relative z-10 mx-auto flex min-h-svh w-full min-w-0 max-w-3xl flex-col items-center justify-center px-6">
          <p className="mb-8 text-[11px] tracking-[0.42em] text-slate-400">DIRECTOR.AI</p>
          <motion.div
            layoutId="neural-brain"
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="h-[min(72vw,320px)] w-[min(78vw,380px)]"
          >
            <NeuralBrain active={active} />
          </motion.div>
          <div className="mt-12 w-full min-w-0 max-w-xl">
            <AnimatePresence mode="wait">
              {phase === "home" ? (
                <GlassField
                  key="field"
                  idea={idea}
                  error={error}
                  onIdea={setIdea}
                  onSubmit={onSubmit}
                />
              ) : (
                <motion.p
                  key="scan"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease }}
                  className="text-center text-sm text-slate-500"
                >
                  Analyse des paramètres de réalisation...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}

function NeuralBrain({ active, compact = false }: { active: boolean; compact?: boolean }) {
  const reduce = useReducedMotion();
  const duration = active ? 1.2 : 5.6;

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {SYNAPSES.map(([fromIndex, toIndex]) => {
          const from = NEURONS[fromIndex];
          const to = NEURONS[toIndex];
          if (!from || !to) return null;
          return (
            <motion.line
              key={`${fromIndex}-${toIndex}`}
              stroke={active ? "#6366f1" : "#c5d0de"}
              strokeWidth={compact ? 1.15 : 0.38}
              strokeLinecap="round"
              animate={
                reduce
                  ? { x1: from.x, y1: from.y, x2: to.x, y2: to.y, opacity: 0.55 }
                  : {
                      x1: [from.x, from.x + from.dx, from.x - from.dx * 0.45, from.x],
                      y1: [from.y, from.y + from.dy, from.y - from.dy * 0.4, from.y],
                      x2: [to.x, to.x + to.dx, to.x - to.dx * 0.45, to.x],
                      y2: [to.y, to.y + to.dy, to.y - to.dy * 0.4, to.y],
                      opacity: active ? [0.45, 1, 0.45] : [0.28, 0.62, 0.28],
                    }
              }
              transition={{ duration, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </svg>
      {NEURONS.map((node) => (
        <motion.span
          key={`${node.x}-${node.y}`}
          className={`absolute rounded-full ${compact ? "h-1 w-1" : "h-1.5 w-1.5"} ${
            active ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.65)]" : "bg-slate-400"
          }`}
          style={{ x: "-50%", y: "-50%" }}
          animate={
            reduce
              ? { left: `${node.x}%`, top: `${node.y}%`, scale: 1 }
              : {
                  left: [`${node.x}%`, `${node.x + node.dx}%`, `${node.x - node.dx * 0.45}%`, `${node.x}%`],
                  top: [`${node.y}%`, `${node.y + node.dy}%`, `${node.y - node.dy * 0.4}%`, `${node.y}%`],
                  scale: active ? [1, 1.45, 1] : [1, 1.12, 1],
                }
          }
          transition={{
            duration,
            repeat: reduce ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function GlassField({
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
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease }}
      className="w-full min-w-0"
    >
      <label htmlFor="vision" className="sr-only">
        Vision de la scène
      </label>
      <div className="flex w-full min-w-0 flex-col gap-2 rounded-[28px] border border-slate-200/50 bg-white/40 p-2 shadow-xl shadow-slate-200/50 backdrop-blur-2xl sm:flex-row sm:items-center sm:rounded-full">
        <input
          id="vision"
          value={idea}
          onChange={(event) => onIdea(event.target.value)}
          placeholder="Décrivez la vision de votre scène..."
          maxLength={500}
          autoComplete="off"
          className="h-12 w-full min-w-0 flex-1 bg-transparent px-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={idea.trim().length < 2}
          className="h-11 w-full shrink-0 rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
        >
          Entrer
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-slate-500">
          {error}
        </p>
      ) : null}
    </motion.form>
  );
}

function Sequencer({
  plan,
  step,
  onStep,
  onReset,
  core,
}: {
  plan: DirectivePlan;
  step: number;
  onStep: (index: number) => void;
  onReset: () => void;
  core: ReactNode;
}) {
  const current = STEPS[step] ?? STEPS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease }}
      className="relative z-10 mx-auto flex min-h-svh w-full max-w-5xl flex-col px-5 py-6 sm:px-8"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            layoutId="neural-brain"
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="h-12 w-14"
          >
            {core}
          </motion.div>
          <span className="text-sm tracking-[0.28em] text-slate-400">DIRECTOR.AI</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-slate-500 transition hover:text-slate-900"
        >
          Nouvelle vision
        </button>
      </header>

      <div className="mt-10 grid flex-1 gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
        <nav aria-label="Séquencier" className="flex gap-2 overflow-x-auto md:flex-col">
          {STEPS.map((item, index) => {
            const selected = index === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStep(index)}
                aria-current={selected ? "step" : undefined}
                className={`min-w-[9.5rem] rounded-3xl border px-4 py-3 text-left backdrop-blur-2xl transition md:min-w-0 ${
                  selected
                    ? "border-slate-200/50 bg-white/70 text-slate-900 shadow-xl shadow-slate-200/50"
                    : "border-transparent text-slate-400 hover:bg-white/50 hover:text-slate-700"
                }`}
              >
                <span className="text-[11px] tracking-[0.18em] text-slate-400">0{index + 1}</span>
                <span className="mt-1 block text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="flex min-w-0 flex-col">
          <p className="text-sm text-slate-500">{plan.directive}</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
            {current.label}
          </h1>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease }}
              className="mt-8"
            >
              <StepBody id={current.id} plan={plan} />
            </motion.div>
          </AnimatePresence>
          <div className="mt-auto flex items-center justify-between pt-8">
            <button
              type="button"
              onClick={() => onStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-full border border-slate-200/50 bg-white/40 px-4 py-2 text-sm text-slate-500 backdrop-blur-2xl transition hover:text-slate-900 disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => onStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              Suivant
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function StepBody({ id, plan }: { id: StepId; plan: DirectivePlan }) {
  if (id === "vision") {
    return (
      <div className="space-y-3">
        <GlassCard title="Pitch" text={plan.atmosphere.pitch} />
        <div className="grid gap-3 sm:grid-cols-2">
          <GlassCard title="Ambiance" text={plan.atmosphere.ambiance || "À préciser sur le plateau."} />
          <GlassCard title="Sound design" text={plan.atmosphere.sound || "À préciser au montage."} />
        </div>
      </div>
    );
  }

  if (id === "arsenal") {
    return (
      <ul className="space-y-3">
        {plan.gear_setup.map((item) => (
          <li key={item.name} className={glass}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-base text-slate-900">{item.name}</p>
              <p className="text-[11px] tracking-[0.16em] text-indigo-600">Validé</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.role}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (id === "plateau") {
    return (
      <ol className="space-y-3">
        {plan.shotlist.map((shot, index) => (
          <li key={`${shot.focal}-${index}`} className={glass}>
            <p className="text-[11px] tracking-[0.18em] text-slate-400">
              Plan {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-base leading-7 text-slate-900">{shot.action}</p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
              <div>
                <dt className="text-[11px] text-slate-400">Focale</dt>
                <dd>{shot.focal}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">Mouvement</dt>
                <dd>{shot.movement}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">Angle</dt>
                <dd>{shot.angle}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <GlassCard title="Premiere Pro" text={plan.post_production.premiere || "Montage à préciser."} />
      <GlassCard title="DaVinci Resolve" text={plan.post_production.resolve || "Étalonnage nodal à préciser."} />
    </div>
  );
}

const glass =
  "rounded-3xl border border-slate-200/50 bg-white/40 px-5 py-5 shadow-xl shadow-slate-200/50 backdrop-blur-2xl";

function GlassCard({ title, text }: { title: string; text: string }) {
  return (
    <article className={glass}>
      <h2 className="text-[11px] tracking-[0.18em] text-slate-400">{title}</h2>
      <p className="mt-2 text-base leading-7 text-slate-900">{text}</p>
    </article>
  );
}
