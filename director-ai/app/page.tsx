"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DirectivePlan } from "@/lib/plan";

const STEPS = [
  { id: "vision", label: "Vision & Mood" },
  { id: "arsenal", label: "Arsenal Matériel" },
  { id: "plateau", label: "Découpage" },
  { id: "post", label: "Post-Prod" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type Phase = "home" | "loading" | "result";

const ease = [0.22, 1, 0.36, 1] as const;

const RINGS = [
  { rx: 68, ry: 12, tilt: 8, duration: 22, tone: "rgba(255,255,255,0.55)" },
  { rx: 18, ry: 74, tilt: 40, duration: 28, tone: "rgba(196,181,253,0.7)" },
  { rx: 78, ry: 48, tilt: -24, duration: 16, tone: "rgba(147,197,253,0.65)" },
];

const ORBITS = [0, 60, 120, 180, 240, 300];

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

  const surge = phase === "loading";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-black text-white">
      <Mesh />
      {phase === "result" ? (
        <div
          className="pointer-events-none fixed top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),transparent_68%)] blur-3xl"
          aria-hidden
        />
      ) : null}

      {phase === "result" && plan ? (
        <Sequencer
          plan={plan}
          step={step}
          onStep={setStep}
          onReset={reset}
          core={<CoreSlot surge={false} compact />}
        />
      ) : (
        <main className="relative z-10 mx-auto flex min-h-svh w-full min-w-0 max-w-3xl flex-col items-center justify-center px-6">
          <p className="mb-8 text-[11px] tracking-[0.42em] text-white/40">DIRECTOR.AI</p>
          <CoreSlot surge={surge} />
          <div className="mt-14 w-full min-w-0 max-w-xl">
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
                  className="text-center text-sm tracking-wide text-white/55"
                >
                  Analyse spatiale en cours...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}

function CoreSlot({ surge, compact = false }: { surge: boolean; compact?: boolean }) {
  return (
    <motion.div
      layoutId="neural-core"
      transition={{ type: "spring", stiffness: 90, damping: 18 }}
      className={compact ? "h-12 w-12" : "h-[min(70vw,300px)] w-[min(70vw,300px)]"}
    >
      <NeuralCore surge={surge} />
    </motion.div>
  );
}

function NeuralCore({ surge }: { surge: boolean }) {
  const reduce = useReducedMotion();
  const pace = surge ? 0.38 : 1;

  return (
    <div className="relative h-full w-full" style={{ perspective: 900 }}>
      <motion.div
        className={`absolute top-1/2 left-1/2 h-[24%] w-[24%] rounded-full ${
          surge
            ? "shadow-[0_0_70px_22px_rgba(196,181,253,0.72)]"
            : "shadow-[0_0_48px_14px_rgba(167,139,250,0.45)]"
        }`}
        style={{
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(196,181,253,0.55) 38%, rgba(99,102,241,0.05) 70%, transparent 76%)",
        }}
        animate={
          reduce
            ? { scale: 1, opacity: 1 }
            : {
                scale: surge ? [1, 1.2, 1] : [1, 1.07, 1],
                opacity: surge ? [0.82, 1, 0.82] : [0.78, 1, 0.78],
              }
        }
        transition={{
          duration: surge ? 1.05 : 3.8,
          repeat: reduce ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      {RINGS.map((ring) => (
        <motion.div
          key={ring.duration}
          className="absolute top-[11%] left-[11%] h-[78%] w-[78%] rounded-full border"
          style={{
            borderColor: ring.tone,
            boxShadow: `0 0 16px ${ring.tone}`,
            rotateZ: ring.tilt,
            transformStyle: "preserve-3d",
          }}
          animate={
            reduce
              ? undefined
              : { rotateX: [ring.rx, ring.rx + 360], rotateY: [ring.ry, ring.ry + 360] }
          }
          transition={{
            duration: ring.duration * pace,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {ORBITS.map((angle, index) => (
        <motion.div
          key={angle}
          className="absolute top-1/2 left-1/2 h-[68%] w-[68%]"
          style={{ x: "-50%", y: "-50%" }}
          animate={reduce ? { rotate: angle } : { rotate: angle + 360 }}
          transition={{
            duration: (14 + index * 1.6) * pace,
            repeat: reduce ? 0 : Infinity,
            ease: "linear",
          }}
        >
          <motion.span
            className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white"
            style={{ boxShadow: "0 0 10px rgba(226,232,255,0.95)" }}
            animate={reduce ? undefined : { opacity: [0.25, 1, 0.25], scale: [0.7, 1.35, 0.7] }}
            transition={{ duration: 2.6 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function Mesh() {
  const reduce = useReducedMotion();
  const drift = (duration: number, x: number, y: number) =>
    reduce
      ? undefined
      : {
          x: [0, x, 0],
          y: [0, y, 0],
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-24 -left-24 h-[460px] w-[460px] rounded-full bg-indigo-500/25 blur-[130px]"
        animate={drift(20, 70, 46)}
      />
      <motion.div
        className="absolute top-[18%] -right-20 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[150px]"
        animate={drift(26, -80, 60)}
      />
      <motion.div
        className="absolute -bottom-28 left-[28%] h-[420px] w-[420px] rounded-full bg-sky-400/10 blur-[130px]"
        animate={drift(24, 36, -40)}
      />
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
      <div className="flex w-full min-w-0 flex-col gap-2 rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition duration-500 hover:border-white/20 hover:shadow-[inset_0_0_42px_rgba(167,139,250,0.16),0_0_36px_rgba(99,102,241,0.12)] focus-within:border-white/25 focus-within:shadow-[inset_0_0_42px_rgba(167,139,250,0.18),0_0_36px_rgba(99,102,241,0.14)] sm:flex-row sm:items-center sm:rounded-full">
        <input
          id="vision"
          value={idea}
          onChange={(event) => onIdea(event.target.value)}
          placeholder="Décrivez la vision de votre scène..."
          maxLength={500}
          autoComplete="off"
          className="h-12 w-full min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={idea.trim().length < 2}
          className="h-11 w-full shrink-0 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/30 sm:w-auto"
        >
          Entrer
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-white/55">
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
          {core}
          <span className="text-sm tracking-[0.28em] text-white/70">DIRECTOR.AI</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-white/45 transition hover:text-white"
        >
          Nouvelle vision
        </button>
      </header>

      <div className="mt-10 grid flex-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
        <nav aria-label="Séquencier" className="flex gap-2 overflow-x-auto md:flex-col">
          {STEPS.map((item, index) => {
            const active = index === step;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onStep(index)}
                aria-current={active ? "step" : undefined}
                className={`min-w-[11rem] rounded-[22px] border px-4 py-3 text-left backdrop-blur-xl transition md:min-w-0 ${
                  active
                    ? "border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <span className="text-[11px] tracking-[0.18em] text-white/35">0{index + 1}</span>
                <span className="mt-1 block text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="flex min-w-0 flex-col">
          <p className="text-sm text-white/45">{plan.directive}</p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-white sm:text-4xl">
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
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:text-white disabled:opacity-30"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => onStep(Math.min(STEPS.length - 1, step + 1))}
              disabled={step === STEPS.length - 1}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90 disabled:bg-white/15 disabled:text-white/30"
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
              <p className="text-base text-white">{item.name}</p>
              <p className="text-[11px] tracking-[0.16em] text-violet-200/80">Validé</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/55">{item.role}</p>
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
            <p className="text-[11px] tracking-[0.18em] text-white/35">
              Plan {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 text-base leading-7 text-white">{shot.action}</p>
            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/55">
              <div>
                <dt className="text-[11px] text-white/35">Focale</dt>
                <dd>{shot.focal}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/35">Mouvement</dt>
                <dd>{shot.movement}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/35">Angle</dt>
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
  "rounded-[28px] border border-white/10 bg-white/5 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl";

function GlassCard({ title, text }: { title: string; text: string }) {
  return (
    <article className={glass}>
      <h2 className="text-[11px] tracking-[0.18em] text-white/35">{title}</h2>
      <p className="mt-2 text-base leading-7 text-white">{text}</p>
    </article>
  );
}
