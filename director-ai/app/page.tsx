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
type OculusMode = "idle" | "focus" | "processing";

const ease = [0.22, 1, 0.36, 1] as const;

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("home");
  const [plan, setPlan] = useState<DirectivePlan | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [focused, setFocused] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdea = idea.trim();
    if (nextIdea.length < 2 || phase === "loading") return;

    setPhase("loading");
    setError("");
    setPlan(null);
    setFocused(false);

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
    setFocused(false);
  }

  const mode: OculusMode = phase === "loading" ? "processing" : focused ? "focus" : "idle";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-slate-50 text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(248,250,252,0)_62%)]"
        aria-hidden
      />

      {phase === "result" && plan ? (
        <Sequencer
          plan={plan}
          step={step}
          onStep={setStep}
          onReset={reset}
          core={<OpticalOculus mode="idle" compact />}
        />
      ) : (
        <main className="relative z-10 mx-auto flex min-h-svh w-full min-w-0 max-w-3xl flex-col items-center px-6 pb-8 pt-10 sm:pb-10">
          <p className="text-[11px] tracking-[0.42em] text-slate-400">DIRECTOR.AI</p>
          <div className="flex min-h-0 w-full flex-1 items-center justify-center py-8">
            <motion.div
              layoutId="optical-oculus"
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className="h-[min(62vw,280px)] w-[min(62vw,280px)]"
            >
              <OpticalOculus mode={mode} />
            </motion.div>
          </div>
          <div className="w-full min-w-0 max-w-xl">
            <AnimatePresence mode="wait">
              {phase === "home" ? (
                <GlassField
                  key="field"
                  idea={idea}
                  error={error}
                  onIdea={setIdea}
                  onSubmit={onSubmit}
                  onFocusChange={setFocused}
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
                  Compilation du découpage technique...
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </main>
      )}
    </div>
  );
}

function OpticalOculus({ mode, compact = false }: { mode: OculusMode; compact?: boolean }) {
  const reduce = useReducedMotion();
  const processing = mode === "processing" && !compact;
  const focus = mode === "focus" && !compact;

  const spin = (reverse: boolean) => (reduce ? { rotate: 0 } : { rotate: reverse ? -360 : 360 });
  const linear = (seconds: number) => ({
    duration: processing ? Math.max(4, seconds * 0.22) : seconds,
    repeat: reduce ? 0 : Infinity,
    ease: "linear" as const,
  });

  return (
    <motion.div
      className="relative h-full w-full"
      animate={{ scale: focus ? 0.92 : 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      aria-hidden
    >
      <motion.div
        className={`pointer-events-none absolute inset-[30%] rounded-full ${compact ? "blur-sm" : "blur-xl"}`}
        style={{
          background:
            "radial-gradient(circle at 36% 38%, rgba(165,243,252,0.85), transparent 58%), radial-gradient(circle at 68% 64%, rgba(251,207,232,0.7), transparent 54%)",
        }}
        animate={{
          opacity: processing ? 1 : focus ? 0.62 : 0.34,
          scale: reduce ? 1 : processing ? [1, 1.28, 1] : [0.94, 1.06, 0.94],
        }}
        transition={{
          duration: processing ? 1.5 : 4.8,
          repeat: reduce ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      <GlassRing inset="2%" duration={56} reverse={false} mark="cyan" reduce={reduce} linear={linear} spin={spin} />

      <motion.div
        className="absolute inset-0"
        animate={{ scale: processing ? 0.68 : focus ? 0.9 : 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
      >
        <GlassRing inset="14%" duration={42} reverse mark="magenta" reduce={reduce} linear={linear} spin={spin} />
        {!compact ? (
          <GlassRing inset="28%" duration={30} reverse={false} mark="slate" reduce={reduce} linear={linear} spin={spin} />
        ) : null}
        <BladeField
          duration={processing ? 8 : 48}
          reverse
          reduce={reduce}
          compact={compact}
          radius={compact ? 74 : 78}
          count={6}
          sweep={34}
          stroke={compact ? 3.2 : 1.15}
        />
        {!compact ? (
          <BladeField
            duration={processing ? 6 : 36}
            reverse={false}
            reduce={reduce}
            compact={false}
            radius={58}
            count={3}
            sweep={78}
            stroke={0.9}
          />
        ) : null}
      </motion.div>

      <motion.div
        className="absolute inset-[38%]"
        animate={{ scale: processing ? 0.58 : focus ? 0.84 : 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}
      >
        <motion.div
          className="h-full w-full rounded-full border border-slate-200 bg-white/40 backdrop-blur-md"
          style={{
            boxShadow: processing
              ? "inset 0 0 22px rgba(103,232,249,0.85), inset 0 0 36px rgba(244,114,182,0.55)"
              : "inset 0 0 16px rgba(165,243,252,0.7), inset 0 0 28px rgba(251,207,232,0.45)",
          }}
          animate={{ scale: reduce ? 1 : processing ? [0.92, 1.12, 0.92] : [0.97, 1.06, 0.97] }}
          transition={{
            duration: processing ? 1.25 : 4.4,
            repeat: reduce ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {!compact ? (
        <div className="pointer-events-none absolute left-[20%] top-[14%] h-[24%] w-[16%] rounded-full bg-white/80 blur-md" />
      ) : null}
    </motion.div>
  );
}

function GlassRing({
  inset,
  duration,
  reverse,
  mark,
  reduce,
  linear,
  spin,
}: {
  inset: string;
  duration: number;
  reverse: boolean;
  mark: "cyan" | "magenta" | "slate";
  reduce: boolean | null;
  linear: (seconds: number) => { duration: number; repeat: number; ease: "linear" };
  spin: (reverse: boolean) => { rotate: number };
}) {
  const markClass =
    mark === "cyan"
      ? "from-cyan-300/80"
      : mark === "magenta"
        ? "from-fuchsia-300/70"
        : "from-slate-300/80";

  return (
    <motion.div
      className="absolute"
      style={{ inset }}
      animate={spin(reverse)}
      transition={linear(reduce ? 0 : duration)}
    >
      <div className="absolute inset-0 rounded-full border border-slate-300/80" />
      <div
        className="absolute inset-[3%] rounded-full bg-white/40 backdrop-blur-md"
        style={{
          WebkitMaskImage: "radial-gradient(circle, transparent 84%, #000 94%)",
          maskImage: "radial-gradient(circle, transparent 84%, #000 94%)",
        }}
      />
      <span
        className={`absolute left-1/2 top-0 h-[14%] w-px -translate-x-1/2 bg-gradient-to-b ${markClass} to-transparent`}
      />
    </motion.div>
  );
}

function BladeField({
  duration,
  reverse,
  reduce,
  compact,
  radius,
  count,
  sweep,
  stroke,
}: {
  duration: number;
  reverse: boolean;
  reduce: boolean | null;
  compact: boolean;
  radius: number;
  count: number;
  sweep: number;
  stroke: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={`absolute overflow-visible ${compact ? "inset-[6%]" : "inset-[4%]"}`}
      animate={reduce ? { rotate: 0 } : { rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: reduce ? 0 : Infinity, ease: "linear" }}
    >
      {Array.from({ length: count }, (_, index) => (
        <path
          key={index}
          d={arc(100, 100, radius, (360 / count) * index - sweep / 2, sweep)}
          fill="none"
          stroke={index % 2 === 0 ? "#94a3b8" : "#cbd5e1"}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))}
    </motion.svg>
  );
}

function arc(cx: number, cy: number, radius: number, startDeg: number, sweep: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + Math.cos(rad(startDeg)) * radius;
  const y1 = cy + Math.sin(rad(startDeg)) * radius;
  const x2 = cx + Math.cos(rad(startDeg + sweep)) * radius;
  const y2 = cy + Math.sin(rad(startDeg + sweep)) * radius;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function GlassField({
  idea,
  error,
  onIdea,
  onSubmit,
  onFocusChange,
}: {
  idea: string;
  error: string;
  onIdea: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFocusChange: (focused: boolean) => void;
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
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
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
            layoutId="optical-oculus"
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            className="h-11 w-11"
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
